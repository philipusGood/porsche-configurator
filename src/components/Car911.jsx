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
    const rimWidth = 0.20

    return (
      <group position={position} key={`wheel-${position.join('-')}`}>
        {/* Tire */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[torusR, tubeR, 18, 36]} />
          <primitive object={tireMaterial} attach="material" />
        </mesh>

        {/* Rim */}
        <mesh castShadow>
          <cylinderGeometry args={[rimR, rimR, rimWidth, 16]} />
          <primitive object={wheelMaterial} attach="material" />
        </mesh>

        {/* Spokes (OEM style) */}
        {wheelType === 'oem' && (
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh
                key={`spoke-${i}`}
                rotation={[(Math.PI * 2 * i) / 5, 0, 0]}
                position={[0, 0, 0]}
                castShadow
              >
                <boxGeometry args={[0.02, 0.02, rimR * 1.8]} />
                <primitive object={wheelMaterial} attach="material" />
              </mesh>
            ))}
          </>
        )}

        {/* Beadlock ring */}
        {wheelType === 'beadlock' && (
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[rimR, 0.025, 8, 16]} />
            <primitive object={beadlockMaterial} attach="material" />
          </mesh>
        )}
      </group>
    )
  }

  // Wheel dimensions
  const { outerR } = wheelDims
  const wheelOffset = wheelSize > 17 ? 0.02 : 0

  return (
    <group ref={bodyGroupRef}>
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
        <group position={[0, 1.26, -0.20]}>
          {/* Main frame - front */}
          <mesh position={[0, 0, 0.80]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 1.60]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          {/* Main frame - rear */}
          <mesh position={[0, 0, -0.80]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 1.60]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          {/* Side rails */}
          <mesh position={[0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 1.30]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          <mesh position={[-0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 1.30]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          {/* Crossbars */}
          {[0, 0.30, 0.60].map((z, i) => (
            <mesh key={`crossbar-${i}`} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.012, 0.012, 1.26]} />
              <primitive object={roofRackMaterial} attach="material" />
            </mesh>
          ))}
        </group>
      )}

      {/* Safari Lights */}
      {hasSafariLights && (
        <group position={[0, 1.28, 0.80]}>
          {/* Light bar */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1.20]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          {/* Light 1 */}
          <mesh position={[-0.36, 0, 0]} castShadow>
            <sphereGeometry args={[0.07, 12, 12]} />
            <primitive object={safariLightMaterial} attach="material" />
          </mesh>
          {/* Light 2 */}
          <mesh position={[-0.12, 0, 0]} castShadow>
            <sphereGeometry args={[0.07, 12, 12]} />
            <primitive object={safariLightMaterial} attach="material" />
          </mesh>
          {/* Light 3 */}
          <mesh position={[0.12, 0, 0]} castShadow>
            <sphereGeometry args={[0.07, 12, 12]} />
            <primitive object={safariLightMaterial} attach="material" />
          </mesh>
          {/* Light 4 */}
          <mesh position={[0.36, 0, 0]} castShadow>
            <sphereGeometry args={[0.07, 12, 12]} />
            <primitive object={safariLightMaterial} attach="material" />
          </mesh>
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
