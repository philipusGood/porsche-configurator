import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCarStore } from '../store'

// Generate 32 cross-section outline points for a body station
// hw:   half-width at shoulder (widest point, fender flare peak)
// bot:  bottom Y (undercarriage)
// shY:  shoulder Y (where hw applies)
// topY: roof/deck Y (top of cross-section)
// topW: half-width at roof (narrower than shoulder)
function getSectionPoints(hw, bot, shY, topY, topW) {
  const N = 32
  const pts = []
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2
    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)
    let x, y
    if (sinA >= 0) {
      // Upper half — blend from shoulder width (hw) toward roof width (topW)
      const blend = Math.pow(sinA, 0.65)
      x = (hw * (1 - blend) + topW * blend) * cosA
      y = shY + (topY - shY) * blend
    } else {
      // Lower half — body sill curves under toward floor
      const blend = Math.pow(-sinA, 0.55)
      x = hw * cosA * (1 - blend * 0.12)  // slight tuck-under at bottom
      y = shY + (bot - shY) * blend
    }
    pts.push([x, y])
  }
  return pts
}

function createLoftedBodyGeo() {
  // 996.1 cross-sections: [z, hw, bot, shY, topY, topW]
  // z    = station position (front=+2.22, rear=-2.22)
  // hw   = half-width at shoulder / fender arch peak
  // bot  = bottom of body (undercarriage floor)
  // shY  = shoulder height (fender arch peak)
  // topY = roof/deck height  (= shY for hood/engine lid sections, higher for cabin)
  // topW = roof half-width   (= hw for no-cabin sections)
  const SECTIONS = [
    // Front end
    [ 2.22,  0.54, 0.14, 0.50, 0.50, 0.54],  // front tip (rounded nose)
    [ 2.08,  0.68, 0.11, 0.62, 0.62, 0.68],  // front bumper face
    [ 1.90,  0.78, 0.09, 0.71, 0.71, 0.78],  // headlight zone
    [ 1.70,  0.87, 0.08, 0.78, 0.78, 0.87],  // front fender arch
    [ 1.44,  0.91, 0.08, 0.82, 0.82, 0.91],  // front wheel arch peak (widest front)
    [ 1.18,  0.90, 0.08, 0.84, 0.84, 0.90],  // hood mid
    [ 0.96,  0.88, 0.08, 0.84, 0.84, 0.88],  // hood / cowl junction

    // Cabin
    [ 0.78,  0.87, 0.08, 0.83, 1.09, 0.80],  // A-pillar base (roof begins rising)
    [ 0.52,  0.87, 0.08, 0.82, 1.24, 0.76],  // windshield mid
    [ 0.16,  0.88, 0.08, 0.82, 1.29, 0.74],  // cabin peak front
    [-0.18,  0.88, 0.08, 0.82, 1.29, 0.74],  // cabin peak rear
    [-0.50,  0.89, 0.08, 0.83, 1.22, 0.77],  // C-pillar upper
    [-0.80,  0.93, 0.08, 0.85, 1.05, 0.82],  // C-pillar base / rear fender shoulder

    // Rear end
    [-1.12,  0.97, 0.08, 0.87, 0.91, 0.87],  // rear fender arch (widest overall)
    [-1.40,  0.95, 0.08, 0.88, 0.88, 0.95],  // engine lid start
    [-1.63,  0.91, 0.08, 0.87, 0.87, 0.91],  // engine lid
    [-1.86,  0.81, 0.09, 0.84, 0.84, 0.81],  // rear upper (tucking in)
    [-2.05,  0.67, 0.11, 0.72, 0.72, 0.67],  // rear bumper
    [-2.22,  0.52, 0.14, 0.55, 0.55, 0.52],  // rear tip
  ]

  const N_PTS = 32
  const M = SECTIONS.length

  const sectionPoints = SECTIONS.map(([_z, hw, bot, shY, topY, topW]) =>
    getSectionPoints(hw, bot, shY, topY, topW)
  )

  const positions = []
  const indices = []

  // Flatten positions
  for (let i = 0; i < M; i++) {
    const z = SECTIONS[i][0]
    for (let j = 0; j < N_PTS; j++) {
      const [x, y] = sectionPoints[i][j]
      positions.push(x, y, z)
    }
  }

  // Side quads (connect adjacent cross-sections)
  for (let i = 0; i < M - 1; i++) {
    for (let j = 0; j < N_PTS; j++) {
      const jn = (j + 1) % N_PTS
      const a = i * N_PTS + j
      const b = i * N_PTS + jn
      const c = (i + 1) * N_PTS + j
      const d = (i + 1) * N_PTS + jn
      indices.push(a, c, b)
      indices.push(b, c, d)
    }
  }

  // Front cap (fan from center point to front ring)
  const fci = positions.length / 3
  positions.push(0, SECTIONS[0][3], SECTIONS[0][0])
  for (let j = 0; j < N_PTS; j++) {
    indices.push(fci, j, (j + 1) % N_PTS)
  }

  // Rear cap
  const rci = positions.length / 3
  const ro = (M - 1) * N_PTS
  positions.push(0, SECTIONS[M - 1][3], SECTIONS[M - 1][0])
  for (let j = 0; j < N_PTS; j++) {
    indices.push(rci, ro + (j + 1) % N_PTS, ro + j)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export default function Car911() {
  const bodyGroupRef = useRef()
  const {
    bodyColor, wheelColor, wheelType, wheelSize, liftHeight,
    spoiler, hasStripe, stripeColor, hasRoofRack, hasSafariLights, hasSkidPlate,
  } = useCarStore()

  const bodyGeo = useMemo(() => createLoftedBodyGeo(), [])

  // ── Materials ──────────────────────────────────────────────────
  // MeshPhysicalMaterial gives us clearcoat — the single biggest step
  // toward photorealistic car paint (simulates lacquer over basecoat)
  const bodyMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    metalness: 0.15,
    roughness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    reflectivity: 1.0,
    envMapIntensity: 1.8,
  }), [bodyColor])

  // Glass: light tint, quite transparent, visible from both sides
  const glassMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#a8c8dc', transparent: true, opacity: 0.35,
    metalness: 0.05, roughness: 0.06, side: THREE.DoubleSide,
  }), [])

  const wheelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: wheelColor, metalness: 0.9, roughness: 0.28,
  }), [wheelColor])

  const tireMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0a0a0a', metalness: 0.05, roughness: 0.88,
  }), [])

  const headlightMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#dce8ff', emissive: '#9ab0ff', emissiveIntensity: 0.45, roughness: 0.06,
  }), [])

  const taillightMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#cc1111', emissive: '#ff2222', emissiveIntensity: 0.65,
  }), [])

  const stripeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: stripeColor, roughness: 0.38,
  }), [stripeColor])

  const roofRackMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2a2a2a', metalness: 0.9, roughness: 0.3,
  }), [])

  const safariLightMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffcc00', emissive: '#ffaa00', emissiveIntensity: 0.9,
  }), [])

  const skidPlateMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#202020', metalness: 0.8, roughness: 0.42,
  }), [])

  const beadlockMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#444444', metalness: 0.7, roughness: 0.4,
  }), [])

  // ── Lift animation ─────────────────────────────────────────────
  const targetLift = liftHeight === 0 ? 0 : liftHeight === 1 ? 0.05 : 0.13
  useFrame(() => {
    if (bodyGroupRef.current) {
      bodyGroupRef.current.position.y +=
        (targetLift - bodyGroupRef.current.position.y) * 0.08
    }
  })

  // ── Wheel dimensions ───────────────────────────────────────────
  const wheelDims = useMemo(() => {
    let outerR = 0.325, sideWall = 0.105
    if (wheelSize === 18) { outerR = 0.345; sideWall = 0.095 }
    else if (wheelSize === 19) { outerR = 0.360; sideWall = 0.085 }
    if (liftHeight === 2) { outerR *= 1.25; sideWall *= 1.45 }
    return { outerR, torusR: outerR - sideWall, tubeR: sideWall }
  }, [wheelSize, liftHeight])

  const { outerR, torusR, tubeR } = wheelDims
  const rimR = outerR - tubeR - 0.01
  const rimW = 0.22
  const wheelOffset = wheelSize > 17 ? 0.02 : 0

  // ── Wheel renderer ─────────────────────────────────────────────
  const renderWheel = (pos) => (
    <group position={pos} key={pos.join(',')}>
      {/* Tire — torus hole faces along X (axle axis) */}
      <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[torusR, tubeR, 20, 42]} />
        <primitive object={tireMaterial} attach="material" />
      </mesh>

      {/* Rim base disc */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[rimR * 0.92, rimR * 0.92, rimW * 0.6, 32]} />
        <primitive object={wheelMaterial} attach="material" />
      </mesh>

      {/* OEM: 5 thin spokes */}
      {wheelType === 'oem' && (
        <group>
          {[0, 1, 2, 3, 4].map(i => {
            const a = (i / 5) * Math.PI * 2
            return (
              <mesh key={i}
                position={[0, Math.cos(a) * rimR * 0.45, Math.sin(a) * rimR * 0.45]}
                rotation={[a, 0, 0]} castShadow>
                <boxGeometry args={[rimW * 0.55, rimR * 0.85, rimR * 0.14]} />
                <primitive object={wheelMaterial} attach="material" />
              </mesh>
            )
          })}
          <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[rimR, 0.018, 8, 32]} />
            <primitive object={wheelMaterial} attach="material" />
          </mesh>
        </group>
      )}

      {/* FUCHS: classic fan spoke */}
      {wheelType === 'fuchs' && (
        <group>
          {[0, 1, 2, 3, 4].map(i => {
            const a = (i / 5) * Math.PI * 2
            return (
              <group key={i} rotation={[a, 0, 0]}>
                <mesh position={[0, rimR * 0.55, 0]} castShadow>
                  <boxGeometry args={[rimW * 0.5, rimR * 0.55, rimR * 0.38]} />
                  <primitive object={wheelMaterial} attach="material" />
                </mesh>
                <mesh position={[0, rimR * 0.18, 0]} castShadow>
                  <boxGeometry args={[rimW * 0.45, rimR * 0.32, rimR * 0.14]} />
                  <primitive object={wheelMaterial} attach="material" />
                </mesh>
              </group>
            )
          })}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[rimR * 0.18, rimR * 0.18, rimW * 0.65, 16]} />
            <meshStandardMaterial color="#111111" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[rimR, 0.022, 8, 32]} />
            <primitive object={wheelMaterial} attach="material" />
          </mesh>
        </group>
      )}

      {/* BEADLOCK: off-road ring + chunky spokes */}
      {wheelType === 'beadlock' && (
        <group>
          {[0, 1, 2, 3, 4, 5].map(i => {
            const a = (i / 6) * Math.PI * 2
            return (
              <mesh key={i}
                position={[0, Math.cos(a) * rimR * 0.48, Math.sin(a) * rimR * 0.48]}
                rotation={[a, 0, 0]} castShadow>
                <boxGeometry args={[rimW * 0.5, rimR * 0.88, rimR * 0.22]} />
                <primitive object={wheelMaterial} attach="material" />
              </mesh>
            )
          })}
          <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[rimR * 0.97, 0.032, 8, 32]} />
            <primitive object={beadlockMaterial} attach="material" />
          </mesh>
          {[...Array(16)].map((_, i) => {
            const a = (i / 16) * Math.PI * 2
            return (
              <mesh key={i}
                position={[rimW * 0.3, Math.cos(a) * rimR * 0.97, Math.sin(a) * rimR * 0.97]}
                rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.012, 0.012, 0.04, 6]} />
                <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
              </mesh>
            )
          })}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[rimR * 0.22, rimR * 0.22, rimW * 0.7, 8]} />
            <meshStandardMaterial color="#222222" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )}
    </group>
  )

  // ── JSX ────────────────────────────────────────────────────────
  return (
    <group ref={bodyGroupRef}>

      {/* ── BODY ── */}
      <mesh geometry={bodyGeo} material={bodyMaterial} castShadow receiveShadow />

      {/* (undertray removed — lofted body closes at bottom) */}

      {/* ── WINDOWS ── */}
      {/*
        Windshield geometry:
          bottom: z≈0.92, y≈0.83   top: z≈0.52, y≈1.23
          center: z=0.72, y=1.03   rake angle ≈44° from horiz
          rotation.x = -atan2(Δz, Δy) = -atan2(0.40, 0.40) ≈ -0.245π
      */}
      <mesh position={[0, 1.030, 0.70]} rotation={[-Math.PI * 0.244, 0, 0]} castShadow>
        <planeGeometry args={[1.14, 0.58]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/*
        Rear window (shallow rake over engine lid):
          bottom: z≈-1.38, y≈0.88   top: z≈-0.84, y≈1.03
          center: z=-1.11, y=0.955   rake angle ≈ 16° from horizontal
      */}
      <mesh position={[0, 0.955, -1.11]} rotation={[Math.PI * 0.41, 0, 0]} castShadow>
        <planeGeometry args={[0.92, 0.50]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/*
        Side windows — span from A-pillar (z≈0.72) to C-pillar (z≈-0.78)
        Height from door shoulder (y≈0.88) to roof frame (y≈1.22)
        Center: z=-0.03, y=1.05, length=1.50, height=0.34
      */}
      <mesh position={[-0.878, 1.052, -0.03]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <planeGeometry args={[1.50, 0.34]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>
      <mesh position={[0.878, 1.052, -0.03]} rotation={[0, -Math.PI / 2, 0]} castShadow>
        <planeGeometry args={[1.50, 0.34]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/* ── LIGHTS ── */}
      {/* 996 "fried egg" oval headlights — wide oval, slightly recessed */}
      <mesh position={[-0.44, 0.60, 2.08]} scale={[0.20, 0.13, 0.08]} castShadow>
        <sphereGeometry args={[1, 18, 12]} />
        <primitive object={headlightMaterial} attach="material" />
      </mesh>
      <mesh position={[0.44, 0.60, 2.08]} scale={[0.20, 0.13, 0.08]} castShadow>
        <sphereGeometry args={[1, 18, 12]} />
        <primitive object={headlightMaterial} attach="material" />
      </mesh>

      {/* 996-style full-width taillight bar */}
      <mesh position={[0, 0.70, -2.08]} castShadow>
        <boxGeometry args={[1.42, 0.09, 0.04]} />
        <primitive object={taillightMaterial} attach="material" />
      </mesh>

      {/* ── WHEEL ARCH FLARES ── */}
      {/*
        Half-torus (arc=π) per corner.  rotation.y=π/2 puts the ring in
        the YZ plane (axis along X) so the arch runs front→top→rear over
        each tyre.  Radius = outerR+0.04 so it clears the tyre surface.
        The flare shares the body material so it reads as part of the body.
      */}
      {[
        [-0.885 - wheelOffset, outerR,  1.355],
        [ 0.885 + wheelOffset, outerR,  1.355],
        [-0.885 - wheelOffset, outerR, -0.995],
        [ 0.885 + wheelOffset, outerR, -0.995],
      ].map(([ax, ay, az], i) => (
        <mesh key={i} position={[ax, ay, az]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[outerR + 0.04, 0.030, 10, 28, Math.PI]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>
      ))}

      {/* ── WHEELS ── */}
      {renderWheel([-0.885 - wheelOffset, outerR, 1.355])}
      {renderWheel([0.885 + wheelOffset, outerR, 1.355])}
      {renderWheel([-0.885 - wheelOffset, outerR, -0.995])}
      {renderWheel([0.885 + wheelOffset, outerR, -0.995])}

      {/* ── SPOILER ── */}
      {/*
        Group sits on top of the engine lid (topY ≈ 0.87 at z≈-1.63).
        All spoiler geometry: X = width (left-right), Z = depth (front-back).
        Negative rotation.x lifts the trailing edge (-Z side = rearmost).
      */}
      {spoiler !== 'none' && (
        <group position={[0, 0.87, -1.72]}>
          {/* Stock lip — narrow strip across full rear width */}
          {spoiler === 'stock' && (
            <mesh castShadow>
              <boxGeometry args={[1.52, 0.06, 0.06]} />
              <primitive object={bodyMaterial} attach="material" />
            </mesh>
          )}

          {/* Ducktail — wide flat shelf angled upward at trailing edge */}
          {spoiler === 'ducktail' && (
            <>
              {/* Main shelf: 1.50 wide, 0.26 deep, tilts trailing edge up */}
              <mesh rotation={[-Math.PI * 0.10, 0, 0]} castShadow>
                <boxGeometry args={[1.50, 0.07, 0.26]} />
                <primitive object={bodyMaterial} attach="material" />
              </mesh>
              {/* Left end plate */}
              <mesh position={[-0.73, 0.04, -0.04]} castShadow>
                <boxGeometry args={[0.04, 0.14, 0.22]} />
                <primitive object={bodyMaterial} attach="material" />
              </mesh>
              {/* Right end plate */}
              <mesh position={[0.73, 0.04, -0.04]} castShadow>
                <boxGeometry args={[0.04, 0.14, 0.22]} />
                <primitive object={bodyMaterial} attach="material" />
              </mesh>
            </>
          )}

          {/* Whale tail — wider high-mounted wing, more aggressive angle */}
          {spoiler === 'whaletail' && (
            <>
              {/* Main shelf */}
              <mesh rotation={[-Math.PI * 0.13, 0, 0]} castShadow>
                <boxGeometry args={[1.54, 0.07, 0.32]} />
                <primitive object={bodyMaterial} attach="material" />
              </mesh>
              {/* Left end plate */}
              <mesh position={[-0.75, 0.10, -0.06]} castShadow>
                <boxGeometry args={[0.04, 0.22, 0.26]} />
                <primitive object={bodyMaterial} attach="material" />
              </mesh>
              {/* Right end plate */}
              <mesh position={[0.75, 0.10, -0.06]} castShadow>
                <boxGeometry args={[0.04, 0.22, 0.26]} />
                <primitive object={bodyMaterial} attach="material" />
              </mesh>
            </>
          )}
        </group>
      )}

      {/* ── RACING STRIPE ── */}
      {/*
        Three angled segments per stripe so each one lies flush on the
        body surface rather than floating as a single horizontal slab.
          Hood:      z 0.95→2.05  y≈0.72  tilted +6.8° (front is lower)
          Roof:      z 0.65→-0.75 y≈1.292 nearly flat
          Rear deck: z -0.80→-1.62 y≈0.955 tilted -6.3° (rear is lower)
        Two stripes (left x=-0.14, right x=+0.14).
      */}
      {hasStripe && [-0.14, 0.14].map((sx) => (
        <group key={sx} position={[sx, 0, 0]}>
          {/* Hood segment */}
          <mesh position={[0, 0.718, 1.50]} rotation={[Math.PI * 0.068, 0, 0]}>
            <boxGeometry args={[0.11, 0.003, 1.10]} />
            <primitive object={stripeMaterial} attach="material" />
          </mesh>
          {/* Roof segment */}
          <mesh position={[0, 1.292, -0.05]}>
            <boxGeometry args={[0.11, 0.003, 1.40]} />
            <primitive object={stripeMaterial} attach="material" />
          </mesh>
          {/* Rear deck segment */}
          <mesh position={[0, 0.952, -1.21]} rotation={[-Math.PI * 0.063, 0, 0]}>
            <boxGeometry args={[0.11, 0.003, 0.82]} />
            <primitive object={stripeMaterial} attach="material" />
          </mesh>
        </group>
      ))}

      {/* ── ROOF RACK ── */}
      {hasRoofRack && (
        <group position={[0, 1.34, -0.15]}>
          {/* Side rails */}
          <mesh position={[0.58, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 1.62, 8]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          <mesh position={[-0.58, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 1.62, 8]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          {/* Cross bars */}
          {[-0.58, -0.19, 0.20, 0.59].map((z, i) => (
            <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.015, 0.015, 1.18, 8]} />
              <primitive object={roofRackMaterial} attach="material" />
            </mesh>
          ))}
          {/* Corner feet */}
          {[[-0.58, 0.59], [-0.58, -0.58], [0.58, 0.59], [0.58, -0.58]].map(([x, z], i) => (
            <mesh key={i} position={[x, -0.06, z]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.12, 6]} />
              <primitive object={roofRackMaterial} attach="material" />
            </mesh>
          ))}
        </group>
      )}

      {/* ── SAFARI LIGHTS ── */}
      {hasSafariLights && (
        <group position={[0, 1.34, 0.90]}>
          {/* Mounting brackets */}
          <mesh position={[-0.50, -0.06, 0]} castShadow>
            <boxGeometry args={[0.04, 0.12, 0.06]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          <mesh position={[0.50, -0.06, 0]} castShadow>
            <boxGeometry args={[0.04, 0.12, 0.06]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          {/* Light bar */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 1.12, 8]} />
            <primitive object={roofRackMaterial} attach="material" />
          </mesh>
          {/* 4 round lights */}
          {[-0.38, -0.13, 0.13, 0.38].map((x, i) => (
            <group key={i} position={[x, 0, 0.04]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.075, 0.075, 0.05, 12]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0, 0.035]} castShadow>
                <cylinderGeometry args={[0.062, 0.062, 0.02, 12]} />
                <primitive object={safariLightMaterial} attach="material" />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* ── SKID PLATE ── */}
      {hasSkidPlate && (
        <mesh position={[0, 0.09, 0.60]} castShadow>
          <boxGeometry args={[2.56, 0.05, 1.62]} />
          <primitive object={skidPlateMaterial} attach="material" />
        </mesh>
      )}

    </group>
  )
}
