import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import useStore from '../store/useStore'

// 单块骨骼 mesh 组件：支持点击选中、悬停高亮
export default function BoneMesh({ boneId, geometry, position = [0, 0, 0], scale = 1 }) {
  const meshRef = useRef()
  const selectedBone = useStore((s) => s.selectedBone)
  const hoveredBone = useStore((s) => s.hoveredBone)
  const selectBone = useStore((s) => s.selectBone)
  const setHovered = useStore((s) => s.setHovered)

  const isSelected = selectedBone === boneId
  const isHovered = hoveredBone === boneId

  // 颜色：选中=暖橙色，悬停=浅橙色，默认=骨白色
  const color = isSelected ? '#ff6b35' : isHovered ? '#ffb088' : '#e8dcc8'
  const emissive = isSelected ? '#ff6b35' : isHovered ? '#ff8855' : '#000000'
  const emissiveIntensity = isSelected ? 0.4 : isHovered ? 0.15 : 0

  // 选中骨骼的呼吸动画
  useFrame((_, delta) => {
    if (meshRef.current && isSelected) {
      meshRef.current.userData.phase = (meshRef.current.userData.phase || 0) + delta * 2
      const pulse = 1 + Math.sin(meshRef.current.userData.phase) * 0.02
      meshRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <mesh
      ref={meshRef}
      boneId={boneId}
      position={position}
      scale={typeof scale === 'number' ? [scale, scale, scale] : scale}
      geometry={geometry}
      onClick={(e) => {
        e.stopPropagation()
        selectBone(boneId)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(boneId)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(null)
        document.body.style.cursor = 'default'
      }}
    >
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.55}
        metalness={0.05}
        side={2} // DoubleSide
      />
    </mesh>
  )
}
