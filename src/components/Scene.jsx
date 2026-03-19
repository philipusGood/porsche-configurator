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
          position: [5, 3, 8],
          fov: 45,
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-5, 8, -5]} intensity={0.6} color="#b3d9ff" />
        <pointLight position={[0, 5, -5]} intensity={0.4} color="#ffaa44" />

        {/* Controls */}
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={15}
          target={[0, 0.5, 0]}
        />

        {/* Car */}
        <Car911 />

        {/* Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial
            color="#222222"
            roughness={1}
            metalness={0}
          />
        </mesh>

        {/* Environment */}
        <Environment preset="city" />

        {/* Fog */}
        <fog attach="fog" args={['#111111', 15, 40]} />
      </Canvas>
    </div>
  )
}
