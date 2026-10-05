"""Vehicle SfM/MVS service for the Keplerv Colab GPU runtime."""
import io
import hashlib
import json
import os
import subprocess
import tempfile
import threading
import time
import uuid
from pathlib import Path

import numpy as np
import requests
import trimesh
from PIL import Image, ImageOps
from rembg import new_session, remove

COLMAP = '/usr/local/bin/colmap'
SESSION = None
MAX_PHOTOS = 60
MAX_BYTES = 40 * 1024 * 1024

def cutout(data):
    global SESSION
    if SESSION is None:
        SESSION = new_session('u2net', providers=['CPUExecutionProvider'])
    with Image.open(io.BytesIO(data)) as original:
        if original.width * original.height > 40_000_000:
            raise ValueError('Photo is too large. Use images below 40 megapixels.')
        image = ImageOps.exif_transpose(original).convert('RGB')
        image.thumbnail((1600, 1600))
    fg = remove(image, session=SESSION).convert('RGBA')
    if (np.array(fg.getchannel('A')) > 127).mean() < .02:
        raise ValueError('Vehicle could not be isolated. Use full exterior photos.')
    return fg

def reconstruct_photos(photos, progress=lambda stage: None, workspace=None):
    if not 3 <= len(photos) <= MAX_PHOTOS:
        raise ValueError('Use 3–60 exterior photos; 30–60 overlapping views are recommended.')
    if sum(map(len, photos)) > MAX_BYTES:
        raise ValueError('Photo set exceeds 40 MB. Reduce photo sizes.')
    root = Path(workspace or tempfile.mkdtemp(prefix='keplerv-'))
    images, masks, sparse, dense = [root / name for name in ('images', 'masks', 'sparse', 'dense')]
    for folder in (images, masks, sparse, dense):
        folder.mkdir(parents=True, exist_ok=True)
    progress('Checking photo quality')
    seen = set()
    warnings = []
    for index, data in enumerate(photos):
        digest = hashlib.sha256(data).digest()
        if digest in seen:
            raise ValueError(f'Photo {index + 1} is a duplicate. Use different overlapping viewpoints.')
        seen.add(digest)
        with Image.open(io.BytesIO(data)) as original:
            if min(original.size) < 480:
                warnings.append(f'Photo {index + 1} is small; use a higher-resolution image.')
            gray = original.convert('L')
            gray.thumbnail((1000, 1000))
            pixels = np.asarray(gray, dtype=np.float32)
            if min(pixels.shape) > 2:
                laplacian = (pixels[1:-1, :-2] + pixels[1:-1, 2:] + pixels[:-2, 1:-1]
                             + pixels[2:, 1:-1] - 4 * pixels[1:-1, 1:-1])
                if laplacian.var() < 25:
                    warnings.append(f'Photo {index + 1} may be blurry or have little texture.')
    progress('Isolating vehicles')
    for index, data in enumerate(photos):
        fg = cutout(data)
        name = f'{index:03}.jpg'
        # Keep the entire image canvas: cropping would change camera intrinsics.
        canvas = Image.new('RGB', fg.size, 'black')
        canvas.paste(fg, mask=fg.getchannel('A'))
        # Retain camera/focal-length hints when available. Orientation has been applied.
        with Image.open(io.BytesIO(data)) as original:
            exif = original.getexif()
            exif[274] = 1
            exif[40962], exif[40963] = fg.size
        canvas.save(images / name, quality=95, exif=exif)
        fg.getchannel('A').point(lambda x: 255 if x > 127 else 0).save(masks / (name + '.png'))
        fg.save(root / f'cutout-{index:03}.png')
    env = dict(os.environ, QT_QPA_PLATFORM='offscreen')
    def run(stage, command, *args):
        progress(stage)
        with (root / 'colmap.log').open('a') as log:
            log.write('\n' + stage + '\n'); log.flush()
            try:
                subprocess.run([COLMAP, command, *map(str, args)], stdout=log, stderr=log,
                               env=env, check=True, timeout=1200)
            except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
                raise ValueError(f'{stage} failed. Inspect {root}/colmap.log. More overlapping exterior photos may be needed.') from error
    db = root / 'database.db'
    run('Matching image features', 'feature_extractor', '--database_path', db,
        '--image_path', images, '--ImageReader.mask_path', masks,
        '--ImageReader.camera_model', 'SIMPLE_RADIAL', '--SiftExtraction.use_gpu', '0',
        '--SiftExtraction.max_image_size', '1600')
    run('Verifying feature matches', 'exhaustive_matcher', '--database_path', db,
        '--SiftMatching.use_gpu', '0')
    run('Estimating camera positions', 'mapper', '--database_path', db,
        '--image_path', images, '--output_path', sparse)
    candidates = []
    for model in sparse.iterdir():
        if not model.is_dir():
            continue
        run('Checking camera registration', 'model_converter', '--input_path', model,
            '--output_path', model, '--output_type', 'TXT')
        lines = [line for line in (model / 'images.txt').read_text().splitlines() if not line.startswith('#')]
        candidates.append((len(lines) // 2, model))
    if not candidates:
        raise ValueError('No camera reconstruction. Add overlapping photos taken around the same stationary vehicle.')
    registered, model = max(candidates, key=lambda entry: entry[0])
    if registered < max(3, int(len(photos) * .7)):
        raise ValueError(f'Only {registered}/{len(photos)} views aligned. Add intermediate angles and try again.')
    run('Preparing calibrated images', 'image_undistorter', '--image_path', images,
        '--input_path', model, '--output_path', dense, '--output_type', 'COLMAP', '--max_image_size', '1200')
    run('Estimating dense depth', 'patch_match_stereo', '--workspace_path', dense,
        '--workspace_format', 'COLMAP', '--PatchMatchStereo.geom_consistency', 'true',
        '--PatchMatchStereo.max_image_size', '1200')
    run('Fusing depth maps', 'stereo_fusion', '--workspace_path', dense,
        '--workspace_format', 'COLMAP', '--input_type', 'geometric', '--output_path', dense / 'fused.ply')
    run('Building vehicle surface', 'poisson_mesher', '--input_path', dense / 'fused.ply',
        '--output_path', dense / 'mesh.ply', '--PoissonMeshing.depth', '9')
    mesh = trimesh.load(dense / 'mesh.ply', force='mesh')
    if len(mesh.faces) < 100 or not np.isfinite(mesh.vertices).all():
        raise ValueError('Insufficient vehicle geometry. Add clear overlapping photos.')
    # Remove disconnected debris; preserve geometry rather than generating missing panels.
    pieces = mesh.split(only_watertight=False)
    if len(pieces):
        mesh = max(pieces, key=lambda part: part.area)
    mesh.apply_translation(-mesh.bounds.mean(axis=0))
    mesh.apply_scale(2 / max(mesh.extents))
    mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh, vertex_colors=[190, 196, 205, 255])
    output = root / 'vehicle.glb'
    output.write_bytes(mesh.export(file_type='glb'))
    result = {'registered_images': registered, 'input_images': len(photos),
              'vertices': len(mesh.vertices), 'faces': len(mesh.faces), 'warnings': warnings, 'workspace': str(root)}
    (root / 'result.json').write_text(json.dumps(result, indent=2))
    progress('Ready')
    return output, result

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=['https://keplerv.com', 'https://www.keplerv.com', 'http://localhost:3000'],
                   allow_methods=['GET', 'POST'], allow_headers=['Content-Type', 'ngrok-skip-browser-warning'])
jobs = {}
job_lock = threading.Lock()
executor = ThreadPoolExecutor(max_workers=1)

def work(job_id, photos):
    root = tempfile.mkdtemp(prefix='keplerv-')
    jobs[job_id]['workspace'] = root
    try:
        output, info = reconstruct_photos(photos, lambda stage: jobs[job_id].update(stage=stage), workspace=root)
        jobs[job_id].update(status='done', output=str(output), info=info)
    except Exception as error:
        jobs[job_id].update(status='error', error=str(error))
    finally:
        jobs[job_id]['finished'] = time.time()
        job_lock.release()

@app.get('/health')
def health():
    return {'status': 'ok', 'api_version': 3, 'modes': ['photogrammetry'], 'max_images': MAX_PHOTOS}

@app.post('/photogrammetry')
async def start_job(files: list[UploadFile] = File(default=[]), image_urls: str = Form(default='[]')):
    if not job_lock.acquire(blocking=False):
        raise HTTPException(409, 'A vehicle is already processing. Try again after it finishes.')
    try:
        photos = []
        total = 0
        if len(files) > MAX_PHOTOS:
            raise ValueError('Maximum 60 photos.')
        for upload in files:
            data = await upload.read(MAX_BYTES - total + 1)
            total += len(data)
            if total > MAX_BYTES:
                raise ValueError('Photo set exceeds 40 MB.')
            photos.append(data)
        if not photos:
            urls = json.loads(image_urls)
            if not isinstance(urls, list) or not 3 <= len(urls) <= MAX_PHOTOS:
                raise ValueError('Use 3–60 photos.')
            for url in urls:
                parsed = urlparse(url)
                if parsed.scheme != 'https' or parsed.hostname not in {'keplerv.com', 'www.keplerv.com'}:
                    raise ValueError('Only keplerv.com image URLs are allowed.')
                with requests.get(url, timeout=30, allow_redirects=False, stream=True) as response:
                    response.raise_for_status()
                    chunks = []
                    for chunk in response.iter_content(65536):
                        total += len(chunk)
                        if total > MAX_BYTES:
                            raise ValueError('Photo set exceeds 40 MB.')
                        chunks.append(chunk)
                    photos.append(b''.join(chunks))
        if len(photos) < 3:
            raise ValueError('At least three exterior photos are required.')
        # Keep only recent job metadata and files for a bounded runtime footprint.
        for key, old in list(jobs.items()):
            if old.get('finished', time.time()) < time.time() - 3600:
                if old.get('workspace'):
                    import shutil
                    shutil.rmtree(old['workspace'], ignore_errors=True)
                del jobs[key]
        job_id = uuid.uuid4().hex
        jobs[job_id] = {'status': 'running', 'stage': 'Queued'}
        executor.submit(work, job_id, photos)
        return {'job_id': job_id}
    except Exception as error:
        job_lock.release()
        raise HTTPException(400, str(error)) from error
    finally:
        for upload in files:
            await upload.close()

@app.get('/jobs/{job_id}')
def job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, 'Job expired or runtime restarted.')
    return {key: value for key, value in jobs[job_id].items() if key != 'output'}

@app.get('/jobs/{job_id}/model')
def job_model(job_id: str):
    job = jobs.get(job_id)
    if not job or job['status'] != 'done':
        raise HTTPException(404, 'Model is not ready.')
    return FileResponse(job['output'], media_type='model/gltf-binary')
