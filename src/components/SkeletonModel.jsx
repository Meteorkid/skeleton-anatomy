import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import BoneMesh from './BoneMesh'
import { bones } from '../data/boneData'
import { getBonePositions } from '../utils/bonePositions'
import useStore from '../store/useStore'

const bonePositions = getBonePositions()

// GLB 骨骼模型（视觉展示）
function GLBSkeleton() {
  const { scene } = useGLTF('/models/skeletal_system.glb')
  const theme = useStore((s) => s.theme)
  const ref = useRef()

  const cloned = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        child.material.color = new THREE.Color(theme === 'dark' ? '#e8dcc8' : '#d4c8b0')
        child.material.roughness = 0.6
        child.material.metalness = 0.05
        child.material.emissive = new THREE.Color('#000000')
        child.material.emissiveIntensity = 0
        child.castShadow = true
        child.receiveShadow = true
        // GLB mesh 不响应点击事件，由程序化几何体处理
        child.raycast = () => {}
      }
    })
    return clone
  }, [scene, theme])

  return <primitive ref={ref} object={cloned} scale={1} position={[0, 0, 0]} />
}

// 程序化几何体（透明点击靶区，保留逐骨交互）
function ProceduralBones() {
  const boneGeometries = useMemo(() => {
    const geos = {}
    for (const bone of bones) {
      const config = bonePositions[bone.id]
      if (!config) continue

      const s = config.s
      let geo

      if (typeof s === 'number') {
        geo = new THREE.SphereGeometry(s, 8, 6)
      } else if (bone.id.includes('rib_')) {
        geo = new THREE.CapsuleGeometry(s[1] / 2, s[0], 4, 8)
        geo.rotateZ(Math.PI / 2)
      } else if (bone.category === 'vertebrae' || bone.id === 'sacrum' || bone.id === 'coccyx') {
        geo = new THREE.CylinderGeometry(s[0] / 2, s[0] / 2, s[1], 8)
      } else if (
        bone.id.includes('humerus') || bone.id.includes('femur') ||
        bone.id.includes('radius') || bone.id.includes('ulna') ||
        bone.id.includes('tibia') || bone.id.includes('fibula')
      ) {
        geo = new THREE.CapsuleGeometry(s[0] / 2, s[1] - s[0], 8, 12)
      } else if (
        bone.id.includes('phalanx') || bone.id.startsWith('mc') || bone.id.startsWith('mt')
      ) {
        geo = new THREE.CapsuleGeometry(s[0] / 2, s[1] - s[0], 4, 6)
      } else if (
        bone.id === 'sternum' || bone.id === 'scapula_l' || bone.id === 'scapula_r' ||
        bone.id === 'hip_l' || bone.id === 'hip_r'
      ) {
        geo = new THREE.BoxGeometry(s[0], s[1], s[2])
      } else if (
        bone.id.includes('nasal') || bone.id.includes('lacrimal') ||
        bone.id.includes('palatine') || bone.id === 'vomer'
      ) {
        geo = new THREE.BoxGeometry(s[0], s[1], s[2])
      } else if (
        bone.id.includes('cuneiform') || bone.id.includes('navicular') ||
        bone.id.includes('cuboid') || bone.id.includes('talus') || bone.id.includes('calcaneus')
      ) {
        geo = new THREE.SphereGeometry(typeof s === 'number' ? s : s[0] * 0.7, 8, 6)
      } else {
        const maxS = Math.max(s[0], s[1], s[2])
        geo = new THREE.SphereGeometry(maxS * 0.45, 10, 8)
        geo.scale(s[0] / maxS, s[1] / maxS, s[2] / maxS)
      }

      geos[bone.id] = geo
    }
    return geos
  }, [])

  return (
    <group>
      {bones.map((bone) => {
        const config = bonePositions[bone.id]
        if (!config || !boneGeometries[bone.id]) return null
        return (
          <BoneMesh
            key={bone.id}
            boneId={bone.id}
            geometry={boneGeometries[bone.id]}
            position={config.p}
          />
        )
      })}
    </group>
  )
}

export default function SkeletonModel() {
  return (
    <group>
      <GLBSkeleton />
      <ProceduralBones />
    </group>
  )
}
