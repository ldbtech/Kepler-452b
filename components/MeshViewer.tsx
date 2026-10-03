"use client";

import { Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Center } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function Model({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  return (
    <Center>
      <primitive object={gltf.scene} scale={2.2} />
    </Center>
  );
}

// Renders a real GLB mesh (from the diffusion reconstruction) with full free
// orbit — unlike Vehicle3DPhoto's clamped tilt, this is an actual 3D object.
export default function MeshViewer({ url }: { url: string }) {
  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 0.5, 3], fov: 40 }}>
        <color attach="background" args={["#171717"]} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 4, 5]} intensity={0.6} />
        <Suspense fallback={null}>
          <Model url={url} />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={1.2} maxDistance={6} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
        Drag to orbit · scroll to zoom
      </div>
    </div>
  );
}
