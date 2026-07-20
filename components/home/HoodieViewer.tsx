"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Center,
  Environment,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";

const MODEL_URL = "/models/hoodie.glb";
const DEFAULT_YAW = Math.PI / 6; // 30°

function HoodieModel() {
  const { scene } = useGLTF(MODEL_URL);

  return (
    <Center>
      <group rotation={[0, DEFAULT_YAW, 0]}>
        <primitive object={scene} scale={1.45} />
      </group>
    </Center>
  );
}

/** Decorative 3D hoodie for use behind dark manifesto copy. */
export function HoodieViewer() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 z-0 opacity-[0.28]"
    >
      <Canvas
        camera={{ position: [0, 0.15, 1.55], fov: 36 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        className="h-full w-full touch-none bg-transparent"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 3]} intensity={1.25} />
        <Suspense fallback={null}>
          <HoodieModel />
          <Environment preset="studio" environmentIntensity={0.7} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.75}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
