import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import SkeletonModel from './SkeletonModel'
import CameraController from './CameraController'
import useStore from '../store/useStore'

// 预加载 GLB 模型
useGLTF.preload('/models/skeletal_system.glb')

const DARK_BG = '#1a1a2e'
const LIGHT_BG = '#e8e0d8'

function Loader() {
  const theme = useStore((s) => s.theme)
  const textColor = theme === 'dark' ? '#e8dcc8' : '#2a2520'
  return (
    <Html center>
      <div style={{ color: textColor, fontSize: 18, textAlign: 'center' }}>
        <div style={{ marginBottom: 8 }}>加载骨骼模型中...</div>
        <div style={{
          width: 200,
          height: 4,
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            width: '60%',
            height: '100%',
            background: '#ff6b35',
            borderRadius: 2,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        </div>
      </div>
    </Html>
  )
}

export default function Canvas3D() {
  const selectBone = useStore((s) => s.selectBone)
  const theme = useStore((s) => s.theme)
  const controlsRef = useRef()

  return (
    <Canvas
      camera={{ position: [0, 2.2, 14], fov: 50 }}
      style={{ background: theme === 'dark' ? DARK_BG : LIGHT_BG }}
      onPointerMissed={() => selectBone(null)}
    >
      {/* 三点光照 */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1} color="#fff5e6" castShadow />
      <directionalLight position={[-5, 3, -5]} intensity={0.3} color="#e6f0ff" />
      <pointLight position={[0, 10, -5]} intensity={0.3} color="#ffeedd" />

      <Suspense fallback={<Loader />}>
        <SkeletonModel />
        <CameraController controlsRef={controlsRef} />
        <ContactShadows
          position={[0, -2.1, 0]}
          opacity={0.4}
          scale={15}
          blur={2}
          far={4}
        />
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1.5}
        maxDistance={25}
        target={[0, 2.2, 0]}
        autoRotate={false}
        rotateSpeed={1.2}
        zoomSpeed={1.2}
        panSpeed={0.8}
        dampingFactor={0.08}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
    </Canvas>
  )
}
