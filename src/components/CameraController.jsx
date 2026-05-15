import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../store/useStore'
import { getBonePositions } from '../utils/bonePositions'

const bonePositions = getBonePositions()

// 相机飞行动画控制器
export default function CameraController({ controlsRef }) {
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

    // 根据骨骼大小动态调整距离，确保小骨骼也能清晰显示
    const boneSize = Array.isArray(posData.s) ? Math.max(...posData.s) : posData.s
    const distance = Math.max(2.0, boneSize * 5)
    // 相机偏移：始终在骨骼前方偏上，偏移量考虑骨骼的 X 位置
    const offsetX = bx * 0.3
    const offset = new THREE.Vector3(offsetX, distance * 0.25, distance)
    const endPos = targetPos.clone().add(offset)

    // 使用当前 OrbitControls target 作为起始看向点
    const currentTarget = controlsRef?.current?.target
      ? controlsRef.current.target.clone()
      : new THREE.Vector3(0, 3, 0)

    animRef.current = {
      active: true,
      startPos: camera.position.clone(),
      endPos,
      startLookAt: currentTarget,
      endLookAt: targetPos,
      progress: 0,
    }

    // 飞行期间禁用 OrbitControls，防止用户操作干扰动画
    if (controlsRef?.current) {
      controlsRef.current.enabled = false
    }

    // 组件卸载时恢复 OrbitControls
    return () => {
      if (controlsRef?.current) {
        controlsRef.current.enabled = true
      }
    }
  }, [flyToTarget, camera, clearFlyTarget, controlsRef])

  useFrame((_, delta) => {
    const anim = animRef.current
    if (!anim.active) return

    // 平滑插值，使用 easeInOutCubic
    anim.progress += delta * 1.5
    if (anim.progress >= 1) {
      anim.progress = 1
      anim.active = false
      clearFlyTarget()
      // 飞行结束，恢复 OrbitControls
      if (controlsRef?.current) {
        controlsRef.current.enabled = true
      }
    }

    const t = easeInOutCubic(Math.min(anim.progress, 1))

    // 插值相机位置
    camera.position.lerpVectors(anim.startPos, anim.endPos, t)

    // 插值看向目标
    const lookAt = new THREE.Vector3().lerpVectors(anim.startLookAt, anim.endLookAt, t)
    camera.lookAt(lookAt)

    // 同步更新 OrbitControls target
    if (controlsRef?.current) {
      controlsRef.current.target.copy(lookAt)
    }
  })

  return null
}

// 缓动函数：先加速后减速
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}
