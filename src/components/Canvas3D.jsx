import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Html, useGLTF } from '@react-three/drei'
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

  return (
    <Canvas
      camera={{ position: [0, 3, 6], fov: 50 }}
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
        <CameraController />
        <ContactShadows
          position={[0, -1.2, 0]}
          opacity={0.4}
          scale={10}
          blur={2}
          far={4}
        />
      </Suspense>

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={15}
        target={[0, 3, 0]}
        autoRotate={false}
      />
    </Canvas>
  )
}
