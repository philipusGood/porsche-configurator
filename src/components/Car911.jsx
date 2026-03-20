import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCarStore } from '../store'

function getSectionPoints(hw, bot, shY, shW, topY, topW) {
  const pts = []
  const N = 28

  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2  // 0..2π, CCW, 0=right, π/2=top, π=left, 3π/2=bottom

    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)

    let x, y

    if (sinA >= 0) {
      // Upper half (angle 0..π): body shoulder up to roof
      // Width blends from hw (at angle=0,π) toward topW (at angle=π/2)
      const blend = Math.pow(sinA, 0.6)  // 0 at sides, 1 at top
      const w = hw * (1 - blend) + topW * blend
      x = w * cosA
      // Height from shoulder up to top
      y = shY + (topY - shY) * sinA
    } else {
      // Lower half (angle π..2π): body at fender width, curving down to bottom
      const blend = Math.pow(-sinA, 0.6)  // 0 at shoulder, 1 at very bottom
      // Width stays at hw in lower half (fenders are the widest)
      x = hw * cosA
      // Height from shoulder down to bottom
      y = shY + (bot - shY) * blend
    }

    pts.push([x, y])
  }

  return pts
}

function createLoftedBodyGeo() {
  const SECTIONS = [
    //  z      hw     bot   shY   shW   topY  topW
    [ 2.20,  0.56,  0.10, 0.36, 0.52, 0.36, 0.52],  // front tip (no cabin)
    [ 2.00,  0.64,  0.09, 0.42, 0.60, 0.42, 0.60],  // front bumper
    [ 1.80,  0.74,  0.08, 0.47, 0.70, 0.47, 0.70],  // headlight area
    [ 1.55,  0.84,  0.08, 0.52, 0.80, 0.52, 0.80],  // front fender peak
    [ 1.35,  0.87,  0.08, 0.56, 0.83, 0.56, 0.83],  // front axle
    [ 1.10,  0.87,  0.08, 0.58, 0.83, 0.58, 0.83],  // A-pillar base
    [ 0.85,  0.87,  0.08, 0.58, 0.83, 1.05, 0.78],  // A-pillar (cabin starts)
    [ 0.50,  0.87,  0.08, 0.56, 0.83, 1.22, 0.76],  // front cabin
    [ 0.10,  0.87,  0.08, 0.56, 0.83, 1.23, 0.76],  // mid cabin
    [-0.30,  0.87,  0.08, 0.56, 0.83, 1.22, 0.76],  // rear cabin
    [-0.75,  0.88,  0.08, 0.57, 0.84, 1.12, 0.78],  // C-pillar
    [-1.10,  0.90,  0.08, 0.58, 0.85, 0.90, 0.82],  // rear window
    [-1.35,  0.91,  0.08, 0.72, 0.87, 0.72, 0.87],  // engine lid start (no cabin)
    [-1.60,  0.91,  0.08, 0.68, 0.87, 0.68, 0.87],  // engine lid
    [-1.85,  0.84,  0.09, 0.58, 0.80, 0.58, 0.80],  // rear upper
    [-2.05,  0.72,  0.09, 0.48, 0.68, 0.48, 0.68],  // rear bumper
    [-2.20,  0.58,  0.10, 0.40, 0.54, 0.40, 0.54],  // rear tip
  ]
  const N_PTS = 28

  // 1. Generate all cross-section points
  const sectionPoints = SECTIONS.map(([z, hw, bot, shY, shW, topY, topW]) =>
    getSectionPoints(hw, bot, shY, shW, topY, topW)
  )

  const M = SECTIONS.length
  const positions = []
  const indices = []

  // 2. Flatten into position array
  for (let i = 0; i < M; i++) {
    const z = SECTIONS[i][0]
    for (let j = 0; j < N_PTS; j++) {
      const [x, y] = sectionPoints[i][j]
      positions.push(x, y, z)
    }
  }

  // 3. Generate quad faces between adjacent sections
  for (let i = 0; i < M - 1; i++) {
    for (let j = 0; j < N_PTS; j++) {
      const jNext = (j + 1) % N_PTS
      const a = i * N_PTS + j
      const b = i * N_PTS + jNext
      const c = (i + 1) * N_PTS + j
      const d = (i + 1) * N_PTS + jNext

      // Two triangles per quad (ensure consistent winding for outward normals)
      indices.push(a, c, b)
      indices.push(b, c, d)
    }
  }

  // 4. Front cap (fan from center to front section)
  const frontCenterIdx = positions.length / 3
  const frontZ = SECTIONS[0][0]
  const frontCY = (SECTIONS[0][2] + SECTIONS[0][5]) / 2  // mid-height at front
  positions.push(0, frontCY, frontZ)
  for (let j = 0; j < N_PTS; j++) {
    const jNext = (j + 1) % N_PTS
    indices.push(frontCenterIdx, j, jNext)  // wind correctly for front-facing normal
  }

  // 5. Rear cap
  const rearCenterIdx = positions.length / 3
  const rearZ = SECTIONS[M - 1][0]
  const rearOffset = (M - 1) * N_PTS
  const rearCY = (SECTIONS[M-1][2] + SECTIONS[M-1][5]) / 2
  positions.push(0, rearCY, rearZ)
  for (let j = 0; j < N_PTS; j++) {
    const jNext = (j + 1) % N_PTS
    indices.push(rearCenterIdx, rearOffset + jNext, rearOffset + j)
  }

  // 6. Build BufferGeometry
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}


export default function Car911() {
  const bodyGroupRef = useRef()
  const {
    bodyColor,
    wheelColor,
    wheelType,
    wheelSize,
    liftHeight,
    spoiler,
    hasStripe,
    stripeColor,
    hasRoofRack,
    hasSafariLights,
    hasSkidPlate,
  } = useCarStore()

  const bodyGeo = useMemo(() => createLoftedBodyGeo(), [])
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: bodyColor,
        metalness: 0.7,
        roughness: 0.25,
        envMapIntensity: 1.0,
      }),
    [bodyColor]
  )

  const glassMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1a2a3a',
        transparent: true,
        opacity: 0.65,
        metalness: 0.1,
        roughness: 0.05,
      }),
    []
  )

  const wheelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: wheelColor,
        metalness: 0.9,
        roughness: 0.3,
      }),
    [wheelColor]
  )

  const tireMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0a0a0a',
        metalness: 0.1,
        roughness: 0.8,
      }),
    []
  )

  const headlightMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e0e8ff',
        emissive: '#d0d8ff',
        emissiveIntensity: 0.3,
        roughness: 0.1,
      }),
    []
  )

  const taillightMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#cc0000',
        emissive: '#ff0000',
        emissiveIntensity: 0.5,
      }),
    []
  )

  const stripeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: stripeColor,
        roughness: 0.4,
      }),
    [stripeColor]
  )

  const roofRackMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#333333',
        metalness: 0.9,
        roughness: 0.3,
      }),
    []
  )

  const safariLightMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffcc00',
        emissive: '#ffaa00',
        emissiveIntensity: 0.8,
      }),
    []
  )

  const skidPlateMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#333333',
        metalness: 0.8,
        roughness: 0.4,
      }),
    []
  )

  const beadlockMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#4a4a4a',
        metalness: 0.7,
        roughness: 0.4,
      }),
    []
  )

  // Calculate lift
  const targetLift =
    liftHeight === 0 ? 0 : liftHeight === 1 ? 0.05 : 0.13

  useFrame(() => {
    if (bodyGroupRef.current) {
      bodyGroupRef.current.position.y +=
        (targetLift - bodyGroupRef.current.position.y) * 0.08
    }
  })

  // Wheel dimensions based on size
  const getWheelDims = () => {
    let outerR, sideWall
    switch (wheelSize) {
      case 17:
        outerR = 0.325
        sideWall = 0.105
        break
      case 18:
        outerR = 0.345
        sideWall = 0.095
        break
      case 19:
        outerR = 0.360
        sideWall = 0.085
        break
      default:
        outerR = 0.325
        sideWall = 0.105
    }

    // Safari tires are larger
    if (liftHeight === 2) {
      outerR *= 1.25
      sideWall *= 1.45
    }

    const torusR = outerR - sideWall
    const tubeR = sideWall

    return { outerR, sideWall, torusR, tubeR }
  }

  const wheelDims = useMemo(() => getWheelDims(), [wheelSize, liftHeight])

  // Render a single wheel
  const renderWheel = (position) => {
    const { torusR, tubeR, outerR } = wheelDims
    const rimR = outerR - tubeR - 0.01
    const rimWidth = 0.22

    return (
      <group position={position} key={`wheel-${position.join('-')}`}>
        {/* Tire — torus hole faces along X (axle direction) */}
        <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[torusR, tubeR, 20, 40]} />
          <primitive object={tireMaterial} attach="material" />
        </mesh>

        {/* Rim base disc — cylinder axis along X */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[rimR * 0.92, rimR * 0.92, rimWidth * 0.6, 32]} />
          <primitive object={wheelMaterial} attach="material" />
        </mesh>

        {/* OEM: 5 thin curved spokes */}
        {wheelType === 'oem' && (
          <group>
            {[0, 1, 2, 3, 4].map((i) => {
              const angle = (i / 5) * Math.PI * 2
              return (
                <mesh
                  key={i}
                  position={[0, Math.cos(angle) * rimR * 0.45, Math.sin(angle) * rimR * 0.45]}
                  rotation={[angle, 0, 0]}
                  castShadow
                >
                  <boxGeometry args={[rimWidth * 0.55, rimR * 0.85, rimR * 0.14]} />
                  <primitive object={wheelMaterial} attach="material" />
                </mesh>
              )
            })}
            {/* Outer rim lip */}
            <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
              <torusGeometry args={[rimR, 0.018, 8, 32]} />
              <primitive object={wheelMaterial} attach="material" />
            </mesh>
          </group>
        )}

        {/* FUCHS: classic wide fan spokes — the iconic Porsche 5-spoke */}
        {wheelType === 'fuchs' && (
          <group>
            {[0, 1, 2, 3, 4].map((i) => {
              const angle = (i / 5) * Math.PI * 2
              return (
                <group key={i} rotation={[angle, 0, 0]}>
                  {/* Wide outer blade */}
                  <mesh position={[0, rimR * 0.55, 0]} castShadow>
                    <boxGeometry args={[rimWidth * 0.5, rimR * 0.55, rimR * 0.38]} />
                    <primitive object={wheelMaterial} attach="material" />
                  </mesh>
                  {/* Narrow inner stem */}
                  <mesh position={[0, rimR * 0.18, 0]} castShadow>
                    <boxGeometry args={[rimWidth * 0.45, rimR * 0.32, rimR * 0.14]} />
                    <primitive object={wheelMaterial} attach="material" />
                  </mesh>
                </group>
              )
            })}
            {/* Dark center cap */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[rimR * 0.18, rimR * 0.18, rimWidth * 0.65, 16]} />
              <meshStandardMaterial color="#111111" metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Outer lip */}
            <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
              <torusGeometry args={[rimR, 0.022, 8, 32]} />
              <primitive object={wheelMaterial} attach="material" />
            </mesh>
          </group>
        )}

        {/* BEADLOCK: off-road chunky spokes + outer locking ring */}
        {wheelType === 'beadlock' && (
          <group>
            {/* 6 chunky spokes */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i / 6) * Math.PI * 2
              return (
                <mesh
                  key={i}
                  position={[0, Math.cos(angle) * rimR * 0.48, Math.sin(angle) * rimR * 0.48]}
                  rotation={[angle, 0, 0]}
                  castShadow
                >
                  <boxGeometry args={[rimWidth * 0.5, rimR * 0.88, rimR * 0.22]} />
                  <primitive object={wheelMaterial} attach="material" />
                </mesh>
              )
            })}
            {/* Beadlock outer ring */}
            <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
              <torusGeometry args={[rimR * 0.97, 0.032, 8, 32]} />
              <primitive object={beadlockMaterial} attach="material" />
            </mesh>
            {/* Bolt ring (16 small cylinders around edge) */}
            {[...Array(16)].map((_, i) => {
              const angle = (i / 16) * Math.PI * 2
              return (
                <mesh
                  key={i}
                  position={[rimWidth * 0.3, Math.cos(angle) * rimR * 0.97, Math.sin(angle) * rimR * 0.97]}
                  rotation={[0, 0, Math.PI / 2]}
                  castShadow
                >
                  <cylinderGeometry args={[0.012, 0.012, 0.04, 6]} />
                  <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
                </mesh>
              )
            })}
            {/* Dark center hub */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[rimR * 0.22, rimR * 0.22, rimWidth * 0.7, 8]} />
              <meshStandardMaterial color="#222222" metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        )}
      </group>
    )
  }

  // Wheel dimensions
  const { outerR } = wheelDims
  const wheelOffset = wheelSize > 17 ? 0.02 : 0

  return (
    <group ref={bodyGroupRef} scale={[1, 1.0, 1.0]}>
      {/* Main Body */}
      <mesh geometry={bodyGeo} material={bodyMaterial} castShadow receiveShadow />

      {/* Windshield */}
      <mesh
        position={[0, 0.58, 0.75]}
        rotation={[Math.PI * 0.27, 0, 0]}
        castShadow
      >
        <boxGeometry args={[0.05, 0.58, 1.30]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/* Rear Window */}
      <mesh
        position={[0, 0.48, -0.70]}
        rotation={[Math.PI * 0.55, 0, 0]}
        castShadow
      >
        <boxGeometry args={[0.05, 0.45, 1.25]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/* Side Windows (Left) */}
      <mesh
        position={[-0.90, 0.52, 0.0]}
        rotation={[0, Math.PI * 0.15, 0]}
        castShadow
      >
        <boxGeometry args={[0.04, 0.40, 1.05]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/* Side Windows (Right) */}
      <mesh
        position={[0.90, 0.52, 0.0]}
        rotation={[0, -Math.PI * 0.15, 0]}
        castShadow
      >
        <boxGeometry args={[0.04, 0.40, 1.05]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/* Headlights (Left) */}
      <mesh position={[-0.50, 0.48, 2.17]} scale={[1, 0.65, 1]} castShadow>
        <sphereGeometry args={[0.18, 16, 12]} />
        <primitive object={headlightMaterial} attach="material" />
      </mesh>

      {/* Headlights (Right) */}
      <mesh position={[0.50, 0.48, 2.17]} scale={[1, 0.65, 1]} castShadow>
        <sphereGeometry args={[0.18, 16, 12]} />
        <primitive object={headlightMaterial} attach="material" />
      </mesh>

      {/* Taillights (Left) */}
      <mesh position={[-0.65, 0.50, -2.15]} castShadow>
        <boxGeometry args={[0.04, 0.18, 0.50]} />
        <primitive object={taillightMaterial} attach="material" />
      </mesh>

      {/* Taillights (Right) */}
      <mesh position={[0.65, 0.50, -2.15]} castShadow>
        <boxGeometry args={[0.04, 0.18, 0.50]} />
        <primitive object={taillightMaterial} attach="material" />
      </mesh>

      {/* Wheels */}
      {renderWheel([-0.885 - wheelOffset, outerR, 1.355])}
      {renderWheel([0.885 + wheelOffset, outerR, 1.355])}
      {renderWheel([-0.885 - wheelOffset, outerR, -0.995])}
      {renderWheel([0.885 + wheelOffset, outerR, -0.995])}

      {/* Spoiler */}
      {spoiler !== 'none' && (
        <group position={[0, 0.68, -1.9]}>
          {spoiler === 'stock' && (
            <mesh castShadow>
              <boxGeometry args={[0.06, 0.05, 1.50]} />
              <primitive object={bodyMaterial} attach="material" />
            </mesh>
          )}

          {spoiler === 'ducktail' && (
            <>
              <mesh rotation={[Math.PI * -0.11, 0, 0]} castShadow>
                <boxGeometry args={[0.28, 0.06, 1.52]} />
                <primitive object={bodyMaterial} attach="material" />
              </mesh>
              {/* Left fin */}
              <mesh position={[-0.68, 0.04, 0]} castShadow>
                <boxGeometry args={[0.04, 0.14, 0.22]} />
                <primitive object={bodyMaterial} attach="material" />
              </mesh>
              {/* Right fin */}
              <mesh position={[0.68, 0.04, 0]} castShadow>
                <boxGeometry args={[0.04, 0.14, 0.22]} />
                <primitive object={bodyMaterial} attach="material" />
              </mesh>
            </>
          )}

          {spoiler === 'whaletail' && (
            <>
              <mesh rotation={[Math.PI * -0.14, 0, 0]} castShadow>
                <boxGeometry args={[0.60, 0.06, 1.55]} />
                <primitive object={bodyMaterial} attach="material" />
              </mesh>
              {/* Left fin */}
              <mesh position={[-1.05, 0.08, 0]} castShadow>
                <boxGeometry args={[0.04, 0.20, 0.24]} />
                <primitive object={bodyMaterial} attach="material" />
              </mesh>
              {/* Right fin */}
              <mesh position={[1.05, 0.08, 0]} castShadow>
                <boxGeometry args={[0.04, 0.20, 0.24]} />
                <primitive object={bodyMaterial} attach="material" />
              </mesh>
            </>
          )}
        </group>
      )}

      {/* Racing Stripe */}
      {hasStripe && (
        <>
          <mesh position={[0.09, 1.28, 0]} castShadow>
            <boxGeometry args={[4.0, 0.001, 0.14]} />
            <primitive object={stripeMaterial} attach="material" />
          </mesh>
          <mesh position={[-0.09, 1.28, 0]} castShadow>
            <boxGeometry args={[4.0, 0.001, 0.14]} />
            <primitive object={stripeMaterial} attach="material" />
          </mesh>
        </>
      )}

      {/* Roof Rack */}
      {hasRoofRack && (
        <group position={[0, 1.30, -0.15]}>
          {/* Side rails (running front-back) */}
          <mesh position={[0.58, 0, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 1.55, 8]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          <mesh position={[-0.58, 0, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 1.55, 8]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          {/* Cross bars */}
          {[-0.55, -0.18, 0.18, 0.55].map((z, i) => (
            <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI/2]} castShadow>
              <cylinderGeometry args={[0.015, 0.015, 1.18, 8]} />
              <primitive object={roofRackMaterial} attach="material" />
            </mesh>
          ))}
          {/* Corner mounts (4 legs) */}
          {[[-0.58, 0.55], [-0.58, -0.55], [0.58, 0.55], [0.58, -0.55]].map(([x, z], i) => (
            <mesh key={i} position={[x, -0.06, z]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.12, 6]} />
              <primitive object={roofRackMaterial} attach="material" />
            </mesh>
          ))}
        </group>
      )}

      {/* Safari Lights */}
      {hasSafariLights && (
        <group position={[0, 1.30, 0.85]}>
          {/* Mounting brackets */}
          <mesh position={[-0.50, -0.06, 0]} castShadow>
            <boxGeometry args={[0.04, 0.12, 0.06]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          <mesh position={[0.50, -0.06, 0]} castShadow>
            <boxGeometry args={[0.04, 0.12, 0.06]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          {/* Light bar tube */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 1.10, 8]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          {/* 4 round lights with housing */}
          {[-0.38, -0.13, 0.13, 0.38].map((x, i) => (
            <group key={i} position={[x, 0, 0.04]}>
              {/* Housing */}
              <mesh castShadow>
                <cylinderGeometry args={[0.075, 0.075, 0.05, 12]} />
                <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.3} />
              </mesh>
              {/* Lens */}
              <mesh position={[0, 0, 0.035]} castShadow>
                <cylinderGeometry args={[0.062, 0.062, 0.02, 12]} />
                <primitive object={safariLightMaterial} attach="material" />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Skid Plate */}
      {hasSkidPlate && (
        <mesh position={[0, 0.06, 0.60]} castShadow>
          <boxGeometry args={[2.50, 0.04, 1.55]} />
          <primitive object={skidPlateMaterial} attach="material" />
        </mesh>
      )}
    </group>
  )
}
