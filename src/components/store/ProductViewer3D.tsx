"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Html, useProgress } from "@react-three/drei";
import type { Group } from "three";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-white">
        {Math.round(progress)}%
      </div>
    </Html>
  );
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.15;
  });
  return <primitive ref={ref} object={scene} scale={1.4} />;
}

/**
 * Optional 3D product viewer.
 * - Renders only when a GLB/GLTF model_url exists
 * - Drag-to-rotate + limited zoom
 * - Pauses rendering when scrolled out of the viewport
 * - Lower DPR on mobile, static fallback while loading / on WebGL failure
 */
export function ProductViewer3D({
  modelUrl,
  fallbackImage,
  alt,
}: {
  modelUrl: string;
  fallbackImage: string;
  alt: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [failed, setFailed] = useState(false);
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 640;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={fallbackImage} alt={alt} className="h-full w-full object-cover" />;
  }

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <Canvas
        frameloop={inView ? "always" : "never"}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 0.6, 2.6], fov: 40 }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", () =>
            setFailed(true)
          );
        }}
        onError={() => setFailed(true)}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 2]} intensity={1.2} />
        <Suspense fallback={<Loader />}>
          <Model url={modelUrl} />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={1.5}
          maxDistance={4}
          enableDamping
        />
      </Canvas>
      <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/70 px-3 py-1 text-[10px] font-medium text-white">
        Чирж эргүүлнэ · Товшиж томруулна
      </span>
    </div>
  );
}
