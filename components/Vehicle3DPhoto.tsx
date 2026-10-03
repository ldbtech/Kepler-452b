"use client";

import { Suspense, useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Vehicle } from "@/lib/vehicles";

const PLANE_WIDTH = 4;
const SEGMENTS = 160;

function DepthPlane({ colorUrl, depthUrl }: { colorUrl: string; depthUrl: string }) {
  const [colorTex, depthTex] = useLoader(THREE.TextureLoader, [colorUrl, depthUrl]);
  const aspect = colorTex.image.width / colorTex.image.height;
  const height = PLANE_WIDTH / aspect;

  return (
    <mesh>
      <planeGeometry
        args={[PLANE_WIDTH, height, SEGMENTS, Math.round(SEGMENTS / aspect)]}
      />
      <meshStandardMaterial
        map={colorTex}
        emissiveMap={colorTex}
        emissive="#ffffff"
        emissiveIntensity={1}
        color="#000000"
        displacementMap={depthTex}
        displacementScale={0.9}
        displacementBias={-0.35}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

// Fills its parent completely (h-full w-full) so it can drop into any
// fixed-aspect container; the angle dots overlay the canvas instead of
// taking their own layout row.
export default function Vehicle3DPhoto({ vehicle }: { vehicle: Vehicle }) {
  const frames = vehicle.rotationOrder
    .map((label) => vehicle.images.find((img) => img.label === label))
    .filter((img): img is NonNullable<typeof img> => Boolean(img && img.depthFile));

  const [frameIndex, setFrameIndex] = useState(0);

  if (frames.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
        No 3D photos available — run{" "}
        <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 text-xs">
          npm run gen:depth
        </code>
      </div>
    );
  }

  const current = frames[frameIndex];

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 0, 5.2], fov: 30 }}>
        <color attach="background" args={["#171717"]} />
        <ambientLight intensity={1} />
        <Suspense fallback={null}>
          <DepthPlane key={current.file} colorUrl={current.file} depthUrl={current.depthFile!} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minAzimuthAngle={-0.45}
          maxAzimuthAngle={0.45}
          minPolarAngle={Math.PI / 2 - 0.35}
          maxPolarAngle={Math.PI / 2 + 0.35}
          rotateSpeed={0.6}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
        Drag to tilt · {frameIndex + 1}/{frames.length}
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-2">
        {frames.map((frame, i) => (
          <button
            key={frame.label}
            onClick={() => setFrameIndex(i)}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i === frameIndex ? "bg-white" : "bg-white/25 hover:bg-white/40"
            }`}
            aria-label={`Go to angle ${frame.label}`}
          />
        ))}
      </div>
    </div>
  );
}
