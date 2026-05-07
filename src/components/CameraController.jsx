import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../store/useStore'
import { getBonePositions } from '../utils/bonePositions'

const bonePositions = getBonePositions()

// 相机飞行动画控制器
export default function CameraController() {
  const { camera } = useThree()
  const flyToTarget = useStore((s) => s.flyToTarget)
  const clearFlyTarget = useStore((s) => s.clearFlyTarget)

  const animRef = useRef({
    active: false,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startLookAt: new THREE.Vector3(),
    endLookAt: new THREE.Vector3(),
    progress: 0,
  })

  useEffect(() => {
    if (!flyToTarget) return

    const posData = bonePositions[flyToTarget]
    if (!posData) {
      clearFlyTarget()
      return
    }

    const [bx, by, bz] = posData.p
    const targetPos = new THREE.Vector3(bx, by, bz)

    // 计算相机目标位置：在骨骼前方偏上
    const offset = new THREE.Vector3(1.5, 0.5, 2)
    const endPos = targetPos.clone().add(offset)

    animRef.current = {
      active: true,
      startPos: camera.position.clone(),
      endPos,
      startLookAt: new THREE.Vector3(0, 3, 0), // 默认看向中心
      endLookAt: targetPos,
      progress: 0,
    }
  }, [flyToTarget, camera, clearFlyTarget])

  useFrame((_, delta) => {
    const anim = animRef.current
    if (!anim.active) return

    // 平滑插值，使用 easeInOutCubic
    anim.progress += delta * 1.5
    if (anim.progress >= 1) {
      anim.progress = 1
      anim.active = false
      clearFlyTarget()
    }

    const t = easeInOutCubic(Math.min(anim.progress, 1))

    // 插值相机位置
    camera.position.lerpVectors(anim.startPos, anim.endPos, t)

    // 插值看向目标
    const lookAt = new THREE.Vector3().lerpVectors(anim.startLookAt, anim.endLookAt, t)
    camera.lookAt(lookAt)
  })

  return null
}

// 缓动函数：先加速后减速
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}
