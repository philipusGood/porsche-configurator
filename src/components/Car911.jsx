import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCarStore } from '../store'

function create911BodyGeo() {
  const shape = new THREE.Shape()

  // 996.1 side profile. X = forward along car (0=rear, 4.43=front), Y = height
  // Going counterclockwise from rear-bottom:
  shape.moveTo(0.10, 0.14)          // rear bumper bottom
  shape.lineTo(0.10, 0.62)          // rear bumper face up
  shape.lineTo(0.22, 0.68)          // engine lid start
  // Engine lid (nearly flat, slight slope forward-up)
  shape.bezierCurveTo(0.60, 0.72, 1.00, 0.78, 1.00, 0.78)
  // C-pillar / rear window (steep climb)
  shape.bezierCurveTo(1.10, 0.85, 1.25, 1.05, 1.45, 1.20)
  // Roof (arched)
  shape.bezierCurveTo(1.75, 1.28, 2.40, 1.30, 2.80, 1.28)
  // Over front passengers
  shape.bezierCurveTo(3.10, 1.26, 3.25, 1.18, 3.40, 1.05)
  // Windshield (steep forward slope down)
  shape.bezierCurveTo(3.55, 0.88, 3.72, 0.68, 3.82, 0.52)
  // Hood (nearly flat, slight forward slope)
  shape.bezierCurveTo(3.90, 0.48, 4.00, 0.45, 4.20, 0.44)
  // Front bumper
  shape.bezierCurveTo(4.28, 0.44, 4.33, 0.42, 4.35, 0.36)
  shape.lineTo(4.35, 0.14)          // front bumper bottom
  shape.lineTo(0.10, 0.14)          // bottom of car

  // Wheel arch holes
  // Rear wheel arch center: X=1.22, Y=0.38
  const rearArch = new THREE.Path()
  rearArch.absarc(1.22, 0.38, 0.38, 0, Math.PI * 2, true)
  shape.holes.push(rearArch)

  // Front wheel arch center: X=3.57, Y=0.38
  const frontArch = new THREE.Path()
  frontArch.absarc(3.57, 0.38, 0.35, 0, Math.PI * 2, true)
  shape.holes.push(frontArch)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.74,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 3,
  })

  // Center the geometry
  geo.translate(-2.215, 0, -0.87)
  // Rotate 90° around Y so length axis becomes Z in world space
  geo.rotateY(Math.PI / 2)

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

  const bodyGeo = useMemo(() => create911BodyGeo(), [])
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
      <group position={position} key={`wheel-${position.join('-')}`} rotation={[0, 0, Math.PI / 2]}>
        {/* Tire — always the same */}
        <mesh castShadow>
          <torusGeometry args={[torusR, tubeR, 20, 40]} />
          <primitive object={tireMaterial} attach="material" />
        </mesh>

        {/* Rim base disc */}
        <mesh castShadow>
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
            <mesh castShadow>
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
            <mesh castShadow>
              <cylinderGeometry args={[rimR * 0.18, rimR * 0.18, rimWidth * 0.65, 16]} />
              <meshStandardMaterial color="#111111" metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Outer lip */}
            <mesh castShadow>
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
            <mesh castShadow>
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
                  rotation={[0, 0, 0]}
                  castShadow
                >
                  <cylinderGeometry args={[0.012, 0.012, 0.04, 6]} />
                  <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
                </mesh>
              )
            })}
            {/* Dark center hub */}
            <mesh castShadow>
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
    <group ref={bodyGroupRef} scale={[1, 1.08, 1.12]}>
      {/* Main Body */}
      <mesh geometry={bodyGeo} material={bodyMaterial} castShadow receiveShadow />

      {/* Front fascia */}
      <mesh position={[0, 0.38, 2.18]} castShadow>
        <cylinderGeometry args={[0.62, 0.72, 0.28, 24, 1, false, -Math.PI * 0.35, Math.PI * 0.7]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.22, 2.12]} castShadow>
        <boxGeometry args={[1.50, 0.18, 0.12]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* Rear fascia */}
      <mesh position={[0, 0.42, -2.14]} castShadow>
        <cylinderGeometry args={[0.68, 0.74, 0.32, 24, 1, false, Math.PI * 0.65, Math.PI * 0.7]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.24, -2.10]} castShadow>
        <boxGeometry args={[1.60, 0.20, 0.12]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* Rear fender flares */}
      <mesh position={[-0.90, 0.36, -0.995]} castShadow>
        <boxGeometry args={[0.06, 0.52, 0.90]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      <mesh position={[0.90, 0.36, -0.995]} castShadow>
        <boxGeometry args={[0.06, 0.52, 0.90]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* Front fender flares */}
      <mesh position={[-0.89, 0.36, 1.355]} castShadow>
        <boxGeometry args={[0.05, 0.48, 0.80]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      <mesh position={[0.89, 0.36, 1.355]} castShadow>
        <boxGeometry args={[0.05, 0.48, 0.80]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

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
