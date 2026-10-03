// One-off, small-batch fetch of random Copart lots for the keplerv demo.
// Pulls N vehicles (default 10), downloads their corner-angle photos, and
// writes metadata to data/vehicles.json. Not meant to run continuously —
// invoke manually per demo batch (npm run fetch:copart).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BATCH_SIZE = Number(process.argv[2] ?? 10);
const PAGE_SIZE = 20;
const ROOT = process.cwd();
const IMAGES_ROOT = path.join(ROOT, "public", "vehicles");
const DATA_FILE = path.join(ROOT, "data", "vehicles.json");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// Corner angles form a loop around the vehicle; the rest are detail shots.
const ROTATION_ORDER = ["DSFA", "PSFA", "PSRA", "DSRA"];
const DETAIL_LABELS = ["DIRF", "ENGN", "ODOM", "DENT", "CKPT"];

type RawLot = {
  ln: number;
  lcy: number; // year
  mkn: string; // make
  lm: string; // model
  ltd?: string; // trim
  clr?: string; // color
  lcd?: string; // condition description
  dd?: string; // damage description
  orr?: number; // odometer
  locCity?: string;
  locState?: string;
  tims?: string;
  bstl?: string; // body style, e.g. "4DR SPORT UTILITY"
  memberVehicleType?: string; // e.g. SEDAN, SUV, AUTOMOBILE
};

type LotImage = {
  imageLabelCode: string;
  imageSeqNumber: number;
  fullUrl: string;
  highResUrl: string;
};

type VehicleRecord = {
  lotNumber: number;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  condition: string | null;
  damage: string | null;
  odometer: number | null;
  location: string | null;
  bodyStyle: string | null;
  vehicleCategory: string | null;
  images: { label: string; file: string }[];
  rotationOrder: string[];
  fetchedAt: string;
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchLots(page: number): Promise<RawLot[]> {
  const res = await fetch("https://www.copart.com/public/lots/search-results", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify({ query: ["*"], size: PAGE_SIZE, page }),
  });
  if (!res.ok) throw new Error(`search-results failed: ${res.status}`);
  const json = await res.json();
  return json.data?.results?.content ?? [];
}

async function fetchLotImages(lotNumber: number): Promise<LotImage[]> {
  const res = await fetch(
    "https://www.copart.com/public/data/lotdetails/solr/lot-images/",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": UA },
      body: JSON.stringify({ lotNumber: String(lotNumber) }),
    },
  );
  if (!res.ok) throw new Error(`lot-images failed for ${lotNumber}: ${res.status}`);
  const json = await res.json();
  return json.data?.imagesList?.IMAGE ?? [];
}

async function downloadImage(url: string, destPath: string) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`image download failed: ${url} (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
}

async function main() {
  await mkdir(IMAGES_ROOT, { recursive: true });
  await mkdir(path.dirname(DATA_FILE), { recursive: true });

  // Sample a random page out of the live result set to get a "random 20",
  // then take the first BATCH_SIZE lots from it that actually have images.
  const probe = await fetch("https://www.copart.com/public/lots/search-results", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify({ query: ["*"], size: 1, page: 0 }),
  }).then((r) => r.json());
  const totalElements: number = probe.data?.results?.totalElements ?? 1000;
  const maxPage = Math.max(0, Math.floor(totalElements / PAGE_SIZE) - 1);
  const randomPage = Math.floor(Math.random() * maxPage);

  console.log(`Sampling page=${randomPage} of ~${maxPage} pages (${totalElements} total lots)`);

  const records: VehicleRecord[] = [];
  let candidatePage = randomPage;
  let attempts = 0;

  while (records.length < BATCH_SIZE && attempts < 5) {
    attempts += 1;
    const lots = (await searchLots(candidatePage)).filter((l) => l.tims);

    for (const lot of lots) {
      if (records.length >= BATCH_SIZE) break;
      console.log(`Fetching images for lot ${lot.ln} (${lot.lcy} ${lot.mkn} ${lot.lm})`);
      const images = await fetchLotImages(lot.ln);

      const wanted = [...ROTATION_ORDER, ...DETAIL_LABELS]
        .map((label) => images.find((img) => img.imageLabelCode === label))
        .filter((img): img is LotImage => Boolean(img));

      if (wanted.length === 0) {
        console.log(`  skipping lot ${lot.ln} - no usable images`);
        await sleep(150);
        continue;
      }

      await saveVehicle(lot, wanted, records);
      await sleep(300);
    }

    candidatePage = Math.floor(Math.random() * maxPage);
  }

  await writeFile(DATA_FILE, JSON.stringify(records, null, 2));
  console.log(`Saved ${records.length} vehicles to ${DATA_FILE}`);
}

async function saveVehicle(lot: RawLot, wanted: LotImage[], records: VehicleRecord[]) {
  const lotDir = path.join(IMAGES_ROOT, String(lot.ln));
  await mkdir(lotDir, { recursive: true });

  const savedImages: { label: string; file: string }[] = [];
  for (const img of wanted) {
    const ext = path.extname(new URL(img.highResUrl || img.fullUrl).pathname) || ".jpg";
    const filename = `${img.imageLabelCode}${ext}`;
    const destPath = path.join(lotDir, filename);
    await downloadImage(img.highResUrl || img.fullUrl, destPath);
    savedImages.push({
      label: img.imageLabelCode,
      file: `/vehicles/${lot.ln}/${filename}`,
    });
    await sleep(150);
  }

  records.push({
    lotNumber: lot.ln,
    year: lot.lcy,
    make: lot.mkn,
    model: lot.lm,
    trim: lot.ltd ?? null,
    color: lot.clr ?? null,
    condition: lot.lcd ?? null,
    damage: lot.dd ?? null,
    odometer: lot.orr ?? null,
    location: lot.locCity && lot.locState ? `${lot.locCity}, ${lot.locState}` : null,
    bodyStyle: lot.bstl ?? null,
    vehicleCategory: lot.memberVehicleType ?? null,
    images: savedImages,
    rotationOrder: ROTATION_ORDER.filter((label) =>
      savedImages.some((img) => img.label === label),
    ),
    fetchedAt: new Date().toISOString(),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
