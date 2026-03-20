import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import Car911 from './Car911'

export default function Scene() {
  return (
    <div className="scene-container">
      <Canvas
        shadows
        camera={{ position: [5.5, 2.2, 8.5], fov: 38 }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: 4,         // ACESFilmicToneMapping
          toneMappingExposure: 1.1,
        }}
      >
        {/* ── Environment (IBL) ─────────────────────────────────────────
            'warehouse' wraps the car in a high-contrast industrial HDRI
            that creates crisp reflections on the clearcoat — looks great
            for car photography. backgroundBlurriness softens it so the
            floor and car read clearly against the dark bg.              */}
        <Environment
          preset="warehouse"
          background
          backgroundBlurriness={0.65}
          backgroundIntensity={0.25}
        />

        {/* ── Studio lighting ───────────────────────────────────────────
            Three-point setup:
              Key    — strong warm-white from upper-right front
              Fill   — soft cool blue from upper-left rear
              Rim    — narrow orange-tinted from directly behind
            All three together reveal form and mimic a shoot.          */}

        {/* Key light */}
        <directionalLight
          position={[7, 10, 6]}
          intensity={2.4}
          color="#fff8f0"
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-near={1}
          shadow-camera-far={40}
          shadow-camera-left={-7}
          shadow-camera-right={7}
          shadow-camera-top={7}
          shadow-camera-bottom={-7}
          shadow-bias={-0.0004}
        />

        {/* Fill light — cool, opposite side */}
        <directionalLight
          position={[-8, 5, -5]}
          intensity={0.7}
          color="#c8d8ff"
        />

        {/* Rim / back light — separates car from background */}
        <directionalLight
          position={[0, 4, -12]}
          intensity={0.9}
          color="#ffe8c8"
        />

        {/* Subtle under-bounce (simulates light bouncing off the floor) */}
        <pointLight position={[0, 0.2, 0]} intensity={0.35} color="#ffddaa" />

        {/* ── Controls ─────────────────────────────────────────────────*/}
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={12}
          maxPolarAngle={Math.PI * 0.48}
          target={[0, 0.65, 0]}
          enableDamping
          dampingFactor={0.06}
        />

        {/* ── Car ──────────────────────────────────────────────────────*/}
        <Car911 />

        {/* ── Contact shadows ──────────────────────────────────────────
            Soft real-time blob shadow under the car — far more convincing
            than the hard shadow cast by the directional light alone.   */}
        <ContactShadows
          position={[0, 0.005, 0]}
          opacity={0.55}
          scale={16}
          blur={2.8}
          far={4.5}
          color="#000000"
        />

        {/* ── Ground ───────────────────────────────────────────────────
            Slightly reflective dark floor mimics a car-show surface.   */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial
            color="#181818"
            roughness={0.45}
            metalness={0.35}
            envMapIntensity={0.6}
          />
        </mesh>

        {/* Fog — keeps the floor edges from disappearing into void */}
        <fog attach="fog" args={['#0d0d0d', 20, 50]} />
      </Canvas>
    </div>
  )
}
