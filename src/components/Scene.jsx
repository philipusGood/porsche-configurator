import React, { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import Car911 from './Car911'

export default function Scene() {
  return (
    <div className="scene-container">
      <Canvas
        shadows
        camera={{
          position: [6, 2.5, 9],
          fov: 42,
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[8, 12, 6]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={30}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        <directionalLight position={[-6, 4, -4]} intensity={0.5} color="#aaccff" />
        <pointLight position={[0, 0.5, 0]} intensity={0.3} color="#664422" />

        {/* Controls */}
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={12}
          maxPolarAngle={Math.PI * 0.48}
          target={[0, 0.6, 0]}
        />

        {/* Car */}
        <Car911 />

        {/* Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial
            color="#1a1a1a"
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>

        {/* Environment */}
        <Environment preset="city" />

        {/* Fog */}
        <fog attach="fog" args={['#111111', 18, 45]} />
      </Canvas>
    </div>
  )
}
