import { useMemo, useRef, useCallback, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store/useStore'
import { bones } from '../data/boneData'
import { getBonePositions } from '../utils/bonePositions'
import { boneLookup } from '../utils/boneColorMap'

const bonePositions = getBonePositions()

// 手指骨骼段定义 — 每段有独立的 X/Y/Z（与 bonePositions.js 对应）
// findFingerBone 用 3D 距离做综合判断
const fingerSegments = {
  thumb:  { pp: { x: 1.56, y: 1.70, z: 0.26 }, dp: { x: 1.56, y: 1.69, z: 0.36 } },
  index:  { pp: { x: 1.46, y: 1.76, z: 0.26 }, mp: { x: 1.46, y: 1.70, z: 0.29 }, dp: { x: 1.46, y: 1.665, z: 0.30 } },
  middle: { pp: { x: 1.44, y: 1.81, z: 0.22 }, mp: { x: 1.44, y: 1.71, z: 0.29 }, dp: { x: 1.44, y: 1.66, z: 0.31 } },
  ring:   { pp: { x: 1.37, y: 1.79, z: 0.23 }, mp: { x: 1.38, y: 1.70, z: 0.29 }, dp: { x: 1.42, y: 1.675, z: 0.30 } },
  pinky:  { pp: { x: 1.36, y: 1.77, z: 0.25 }, mp: { x: 1.34, y: 1.74, z: 0.27 }, dp: { x: 1.40, y: 1.68, z: 0.29 } },
}

// 根据世界坐标命中点查找手指骨骼（3D 综合距离算法）
// 对每个手指的每个段计算 (dx, dy, dz) 综合距离，取全局最优
// knownFinger: 通过 faceIndex 预判的手指，在距离接近时作为 tiebreaker
function findFingerBone(worldPoint, knownFinger = null) {
  const hand = worldPoint.x > 0 ? 'l' : 'r'
  const sign = hand === 'l' ? 1 : -1
  const absX = Math.abs(worldPoint.x)

  if (absX < 1.28 || absX > 1.65) return null
  if (worldPoint.y < 1.62 || worldPoint.y > 1.85) return null

  // 对每个手指的每个段计算 3D 距离，Z 权重 0.15（XY 主导，Z 仅作微调）
  const Z_WEIGHT = 0.15
  let bestFinger = null
  let bestSeg = null
  let bestDist = Infinity
  let secondFinger = null
  let secondDist = Infinity

  for (const [finger, segments] of Object.entries(fingerSegments)) {
    let fingerBestDist = Infinity
    let fingerBestSeg = null
    for (const [seg, pos] of Object.entries(segments)) {
      const dx = worldPoint.x - pos.x * sign
      const dy = worldPoint.y - pos.y
      const dz = (worldPoint.z - pos.z) * Z_WEIGHT
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < fingerBestDist) { fingerBestDist = dist; fingerBestSeg = seg }
    }
    if (fingerBestDist < bestDist) {
      secondDist = bestDist; secondFinger = bestFinger
      bestDist = fingerBestDist; bestFinger = finger; bestSeg = fingerBestSeg
    } else if (fingerBestDist < secondDist) {
      secondDist = fingerBestDist; secondFinger = finger
    }
  }

  // 同 blob 手指：face map 不可靠，用 X/Y 阈值区分
  const isSameBlob = (bestFinger === 'index' || bestFinger === 'middle') ||
                     (bestFinger === 'ring' || bestFinger === 'pinky') ||
                     (bestFinger === 'middle' || bestFinger === 'ring')
  if (isSameBlob) {
    bestFinger = disambiguateSameBlob(absX, worldPoint.y, worldPoint.z, bestFinger, secondFinger, bestDist, secondDist)
    // 重新计算 bestSeg
    let bestSegDist = Infinity
    for (const [seg, pos] of Object.entries(fingerSegments[bestFinger])) {
      const dx = worldPoint.x - pos.x * sign
      const dy = worldPoint.y - pos.y
      const dz = (worldPoint.z - pos.z) * Z_WEIGHT
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < bestSegDist) { bestSegDist = dist; bestSeg = seg }
    }
  }

  // knownFinger tiebreaker：face map 辅助判断
  if (knownFinger && knownFinger !== bestFinger && fingerSegments[knownFinger]) {
    let knownBestDist = Infinity
    let knownBestSeg = null
    for (const [seg, pos] of Object.entries(fingerSegments[knownFinger])) {
      const dx = worldPoint.x - pos.x * sign
      const dy = worldPoint.y - pos.y
      const dz = (worldPoint.z - pos.z) * Z_WEIGHT
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < knownBestDist) { knownBestDist = dist; knownBestSeg = seg }
    }
    // 同 blob 区域：距离极接近时信任 face map（阈值更宽松）
    const threshold = isSameBlob ? 0.06 : 0.04
    if (knownBestDist - bestDist < threshold) {
      bestFinger = knownFinger
      bestSeg = knownBestSeg
    }
  }

  if (!bestFinger || bestDist > 0.12) return null

  const boneId = `${bestSeg}_${bestFinger}_${hand}`
  if (bonePositions[boneId]) return boneId

  // 兜底：该手指内最近骨位（全 3D 距离）
  const suffix = `_${bestFinger}_${hand}`
  const candidates = Object.keys(bonePositions).filter(k => k.endsWith(suffix))
  let best = null, bestDist2 = Infinity
  for (const id of candidates) {
    const p = bonePositions[id].p
    const dx = worldPoint.x - p[0]
    const dy = worldPoint.y - p[1]
    const dz = (worldPoint.z - p[2]) * Z_WEIGHT
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (dist < bestDist2) { bestDist2 = dist; best = id }
  }
  return best
}

// 暴露到 window 用于测试
if (typeof window !== 'undefined') window.__findFingerBone = findFingerBone

// 同 blob 手指二次判断：index+middle / ring+pinky 共享 mesh blob
// index vs middle: mesh 表面 Z 差异大（MP 级 0.043），用 hitZ 区分
// ring vs pinky: Z 差异小，仅在 PP 级别用 Y 区分
function disambiguateSameBlob(absX, y, hitZ, bestFinger, secondFinger, bestDist, secondDist) {
  if (bestFinger !== 'index' && bestFinger !== 'middle' && bestFinger !== 'ring' && bestFinger !== 'pinky')
    return bestFinger
  if (!secondFinger) return bestFinger
  if (bestDist > 0.10) return bestFinger
  // 最优距离极小时，距离算法已确定，跳过 Z 阈值覆盖
  if (bestDist < 0.005) return bestFinger
  // index vs middle: PP 用 Y，MP/DP 用 X 阈值（index X=1.46, middle X=1.44）
  if ((bestFinger === 'index' || bestFinger === 'middle') && (secondFinger === 'index' || secondFinger === 'middle')) {
    if (absX > 1.38 && absX < 1.50 && secondDist - bestDist < 0.04) {
      if (y > 1.785) return 'middle'  // PP 级别 Y 足够区分
      return absX > 1.45 ? 'index' : 'middle'
    }
  }

  // ring vs pinky: PP 用 Y，MP/DP 用 X 阈值
  if ((bestFinger === 'ring' || bestFinger === 'pinky') && (secondFinger === 'ring' || secondFinger === 'pinky')) {
    if (absX > 1.28 && absX < 1.42 && secondDist - bestDist < 0.04) {
      if (y > 1.78) return 'ring'  // PP 级别 Y 区分
      // MP: ring X=1.38, pinky X=1.34 → 阈值 1.36
      // DP: ring X=1.42, pinky X=1.40 → 阈值 1.41
      const xThreshold = y > 1.70 ? 1.36 : 1.41
      return absX > xThreshold ? 'ring' : 'pinky'
    }
  }

  // middle vs ring: PP 用 Y，MP/DP 用 X 阈值（middle X=1.44, ring X=1.38/1.42）
  if ((bestFinger === 'middle' || bestFinger === 'ring') && (secondFinger === 'middle' || secondFinger === 'ring')) {
    if (absX > 1.36 && absX < 1.48 && secondDist - bestDist < 0.04) {
      if (y > 1.80) return 'middle'  // PP 级别: middle Y=1.81, ring Y=1.79
      // MP: middle X=1.44, ring X=1.38 → 阈值 1.41
      // DP: middle X=1.44, ring X=1.42 → 阈值 1.43
      const xThreshold = y > 1.69 ? 1.41 : 1.43
      return absX > xThreshold ? 'middle' : 'ring'
    }
  }

  return bestFinger
}

// 构建三角面→手指映射表（在 mesh 加载后调用一次）
// Y 自适应：根据三角面质心的 Y 坐标选择对应段的 X 值做手指匹配
function buildFaceToFingerMap(mesh) {
  const geo = mesh.geometry
  const pos = geo.attributes.position
  const idx = geo.index

  const faceCount = idx ? idx.count / 3 : pos.count / 3
  const map = new Array(faceCount)

  mesh.updateWorldMatrix(true, false)
  const wm = mesh.matrixWorld.clone()

  const v0 = new THREE.Vector3()
  const v1 = new THREE.Vector3()
  const v2 = new THREE.Vector3()
  const c = new THREE.Vector3()

  for (let i = 0; i < faceCount; i++) {
    let i0, i1, i2
    if (idx) {
      i0 = idx.getX(i * 3)
      i1 = idx.getX(i * 3 + 1)
      i2 = idx.getX(i * 3 + 2)
    } else {
      i0 = i * 3
      i1 = i * 3 + 1
      i2 = i * 3 + 2
    }

    v0.set(pos.getX(i0), pos.getY(i0), pos.getZ(i0))
    v1.set(pos.getX(i1), pos.getY(i1), pos.getZ(i1))
    v2.set(pos.getX(i2), pos.getY(i2), pos.getZ(i2))

    c.set(
      (v0.x + v1.x + v2.x) / 3,
      (v0.y + v1.y + v2.y) / 3,
      (v0.z + v1.z + v2.z) / 3
    )
    c.applyMatrix4(wm)

    const absX = Math.abs(c.x)
    if (c.y < 1.60 || c.y > 1.85) { map[i] = null; continue }

    // Y 自适应：对每个手指找 Y 最近的段，用该段的 X 做距离比较
    let bestFinger = null
    let bestDist = Infinity
    let secondFinger = null
    let secondDist = Infinity
    for (const [finger, segments] of Object.entries(fingerSegments)) {
      let fingerBestDist = Infinity
      for (const seg of Object.values(segments)) {
        const dx = Math.abs(absX - seg.x)
        const dy = Math.abs(c.y - seg.y)
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < fingerBestDist) fingerBestDist = dist
      }
      if (fingerBestDist < bestDist) {
        secondDist = bestDist; secondFinger = bestFinger
        bestDist = fingerBestDist; bestFinger = finger
      } else if (fingerBestDist < secondDist) {
        secondDist = fingerBestDist; secondFinger = finger
      }
    }
    // 同 blob 手指二次判断：index+middle / ring+pinky 共享 mesh blob，距离不可靠
    if (bestDist < 0.10) bestFinger = disambiguateSameBlob(absX, c.y, c.z, bestFinger, secondFinger, bestDist, secondDist)
    map[i] = bestDist < 0.10 ? bestFinger : null
  }

  return map
}

// 构建三角面→骨骼映射表（所有 206 块骨骼，faceIndex 直接查表）
// 使用启发式检测管线对每个三角面质心做骨骼识别，缓存结果
function buildFaceToBoneMap(mesh) {
  const geo = mesh.geometry
  const pos = geo.attributes.position
  const idx = geo.index

  const faceCount = idx ? idx.count / 3 : pos.count / 3
  const map = new Array(faceCount)

  mesh.updateWorldMatrix(true, false)
  const wm = mesh.matrixWorld

  const v0 = new THREE.Vector3()
  const v1 = new THREE.Vector3()
  const v2 = new THREE.Vector3()
  const c = new THREE.Vector3()

  for (let i = 0; i < faceCount; i++) {
    let i0, i1, i2
    if (idx) {
      i0 = idx.getX(i * 3)
      i1 = idx.getX(i * 3 + 1)
      i2 = idx.getX(i * 3 + 2)
    } else {
      i0 = i * 3
      i1 = i * 3 + 1
      i2 = i * 3 + 2
    }

    v0.set(pos.getX(i0), pos.getY(i0), pos.getZ(i0))
    v1.set(pos.getX(i1), pos.getY(i1), pos.getZ(i1))
    v2.set(pos.getX(i2), pos.getY(i2), pos.getZ(i2))

    c.set(
      (v0.x + v1.x + v2.x) / 3,
      (v0.y + v1.y + v2.y) / 3,
      (v0.z + v1.z + v2.z) / 3
    )
    c.applyMatrix4(wm)

    // 运行完整检测管线
    const fingerBone = findFingerBone(c, null)
    if (fingerBone) { map[i] = fingerBone; continue }
    const footBone = findFootBone(c)
    if (footBone) { map[i] = footBone; continue }
    const torsoBone = findTorsoBone(c)
    if (torsoBone) { map[i] = torsoBone; continue }
    const nearest = findNearestBone(c, 1.2)
    map[i] = nearest ? nearest.id : null
  }

  return map
}

// 足部射线定义（左足镜像，右足 X 为负）
// 每条射线对应一个趾列：bigtoe(拇指侧), toe2, toe3, toe4, toe5(小指侧)
const footRays = [
  { name: 'bigtoe', x: 0.44, mc: 'mt1', toes: ['pp_bigtoe', 'dp_bigtoe'] },
  { name: 'toe2',   x: 0.37, mc: 'mt2', toes: ['pp_toe2', 'mp_toe2', 'dp_toe2'] },
  { name: 'toe3',   x: 0.34, mc: 'mt3', toes: ['pp_toe3', 'mp_toe3', 'dp_toe3'] },
  { name: 'toe4',   x: 0.31, mc: 'mt4', toes: ['pp_toe4', 'mp_toe4', 'dp_toe4'] },
  { name: 'toe5',   x: 0.27, mc: 'mt5', toes: ['pp_toe5', 'mp_toe5', 'dp_toe5'] },
]

// 足部趾骨段定义（Y 值用于 PP/MP/DP 分段）
const footToeSegments = {
  pp: { yMin: -1.72, yMax: -1.65 },
  mp: { yMin: -1.76, yMax: -1.70 },
  dp: { yMin: -1.80, yMax: -1.72 },
}

// 根据世界坐标命中点查找足部骨骼
function findFootBone(worldPoint) {
  const absX = Math.abs(worldPoint.x)
  const y = worldPoint.y
  const hand = worldPoint.x > 0 ? 'l' : 'r'
  const sign = hand === 'l' ? 1 : -1

  // 区域判断：Y < -0.7 且 |X| < 0.5
  if (y > -0.7 || absX > 0.5) return null

  // 按从具体到宽泛的顺序检查，避免区域重叠

  // 趾骨区域（Y < -1.6）— 最具体，优先
  if (y < -1.6) {
    let bestRay = null, bestRayDist = Infinity
    for (const ray of footRays) {
      const d = Math.abs(absX - ray.x)
      if (d < bestRayDist) { bestRayDist = d; bestRay = ray }
    }
    if (!bestRay || bestRayDist > 0.06) return null

    let bestSeg = null, bestSegDist = Infinity
    for (const [seg, range] of Object.entries(footToeSegments)) {
      const midY = (range.yMin + range.yMax) / 2
      const d = Math.abs(y - midY)
      if (d < bestSegDist) { bestSegDist = d; bestSeg = seg }
    }

    const toeId = `${bestSeg}_${bestRay.name}_${hand}`
    if (bonePositions[toeId]) return toeId

    const suffix = `_${bestRay.name}_${hand}`
    const candidates = Object.keys(bonePositions).filter(k => k.endsWith(suffix) && (k.startsWith('pp_') || k.startsWith('mp_') || k.startsWith('dp_')))
    let best = null, bestDist2 = Infinity
    for (const id of candidates) {
      const p = bonePositions[id].p
      const d = Math.abs(worldPoint.y - p[1])
      if (d < bestDist2) { bestDist2 = d; best = id }
    }
    return best
  }

  // 跟骨（Y ≈ -1.02, 排除趾骨区域）
  if (y < -1.0 && y > -1.6 && absX > 0.25 && absX < 0.38) return `calcaneus_${hand}`

  // 跗骨 + 跖骨区域：跗骨（Y≈-0.82）在前，跖骨（Y≈-0.89）在后
  // 避免跖骨宽范围吞噬跗骨命中

  // 距骨：高位顶点 Y > -0.70 用宽 X，低位顶点 Y ≤ -0.70 用窄 X 避免吞跗骨
  if (y > -0.70 && y < -0.64 && absX > 0.30 && absX < 0.42) return `talus_${hand}`
  if (y >= -0.85 && y <= -0.70 && absX > 0.25 && absX < 0.30) return `talus_${hand}`

  // 跗骨区域（X+Z 距离匹配，Z 权重 0.3 辅助区分深层顶点）
  if (y >= -0.85 && y < -0.76 && absX > 0.25 && absX < 0.42) {
    const tarsalBones = [
      { id: `cuneiform_med_${hand}`, x: 0.38 },
      { id: `navicular_${hand}`, x: 0.35 },
      { id: `cuneiform_mid_${hand}`, x: 0.355 },
      { id: `cuboid_${hand}`, x: 0.36 },
      { id: `cuneiform_lat_${hand}`, x: 0.33 },
    ]
    let bestBone = null, bestDist = Infinity
    for (const b of tarsalBones) {
      const bp = bonePositions[b.id]
      const dx = absX - b.x
      const dz = bp ? (worldPoint.z - bp.p[2]) * 0.3 : 0
      const d = Math.sqrt(dx * dx + dz * dz)
      if (d < bestDist) { bestDist = d; bestBone = b.id }
    }
    return bestBone
  }

  // 跖骨区域（上界 ≤ -0.84 含等号，避免边界间隙导致顶点漏到全局匹配）
  if (y > -0.93 && y <= -0.84) {
    let bestRay = null, bestRayDist = Infinity
    for (const ray of footRays) {
      const d = Math.abs(absX - ray.x)
      if (d < bestRayDist) { bestRayDist = d; bestRay = ray }
    }
    if (bestRay && bestRayDist < 0.06) return `${bestRay.mc}_${hand}`
  }

  return null
}

// 暴露到 window 用于测试
if (typeof window !== 'undefined') window.__findFootBone = findFootBone

// 躯干/颅骨区域检测 — 处理 mesh 表面共享导致全局匹配误判的骨骼
function findTorsoBone(worldPoint) {
  const absX = Math.abs(worldPoint.x)
  const y = worldPoint.y
  const z = worldPoint.z

  // 胸骨：前胸壁中线（Y 4.35-5.30 排除 t8 Y≈4.20），Z 显著靠前区别于后方椎骨
  if (absX < 0.12 && y > 4.35 && y < 5.30 && z > 0.20) return 'sternum'

  // 额骨：前颅顶中线，X≈0 区别于颞骨（X≈±0.19, Z≈0.04）
  if (absX < 0.10 && y > 6.0 && y < 6.3 && z > 0.10) return 'frontal'

  // 下颌骨：下颚最低位（Y 5.42-5.50），区别于腭骨（Y 5.52）和舌骨（Y 5.39）
  if (absX < 0.12 && y > 5.42 && y < 5.50 && z > 0.15) return 'mandible'

  return null
}

// 暴露到 window 用于测试
if (typeof window !== 'undefined') window.__findTorsoBone = findTorsoBone

// 查找最近的骨骼（世界坐标命中点）
// 距离接近时（<0.04），偏向更小的骨骼（大骨骼的 mesh 往往包裹小骨骼）
function findNearestBone(worldPoint, maxDist) {
  let best = null, bestDist = Infinity
  let second = null, secondDist = Infinity, secondSize = 0
  for (const b of boneLookup) {
    const dx = worldPoint.x - b.px
    const dy = worldPoint.y - b.py
    const dz = worldPoint.z - b.pz
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const threshold = maxDist != null ? maxDist : Math.max(b.size * 2.5, 0.15)
    if (dist < threshold) {
      if (dist < bestDist) {
        secondDist = bestDist; second = best; secondSize = best ? best.size : 0
        bestDist = dist; best = b
      } else if (dist < secondDist) {
        secondDist = dist; second = b; secondSize = b.size
      }
    }
  }
  // 距离接近时，偏向更小的骨骼（如听小骨 vs 颞骨）
  if (best && second && secondDist - bestDist < 0.04) {
    if (secondSize < best.size * 0.5) return second
  }
  return best
}

// ======== GLB 骨骼模型（视觉 + 交互） ========
function GLBSkeleton() {
  const { scene } = useGLTF('/models/skeletal_system.glb')
  const theme = useStore((s) => s.theme)
  const selectBone = useStore((s) => s.selectBoneAndFly)
  const setHovered = useStore((s) => s.setHovered)
  const ref = useRef()
  const { camera } = useThree()

  const cloned = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        child.material.color = new THREE.Color(
          theme === 'dark' ? '#e8dcc8' : '#d4c8b0'
        )
        child.material.roughness = 0.6
        child.material.metalness = 0.05
        child.material.emissive = new THREE.Color('#000000')
        child.material.emissiveIntensity = 0
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [scene, theme])

  // 暴露场景引用 + 构建三角面手指映射表
  useEffect(() => {
    if (ref.current) {
      window.__debugGLBGroup = ref.current
      window.__debugCamera = camera
      window.__debugBonePositions = bonePositions
      window.__debugTHREE = THREE

      // 构建三角面→手指映射表（高精度手指检测）
      const meshes = []
      ref.current.traverse((c) => { if (c.isMesh) meshes.push(c) })
      if (meshes.length > 0) {
        window.__faceToFingerMap = buildFaceToFingerMap(meshes[0])

        // ---- Face-to-Bone 映射表（所有骨骼的快速三角面查表）----
        window.__faceToBoneMap = buildFaceToBoneMap(meshes[0])
        window.__faceToBoneTotalFaces = window.__faceToBoneMap.length
      }

      // 验证函数：对每个骨骼位置做射线检测，计算到模型表面的最近距离
      window.__verifyBonePositions = () => {
        const group = ref.current
        const meshes = []
        group.traverse((c) => { if (c.isMesh) meshes.push(c) })
        if (meshes.length === 0) return { error: 'no meshes found' }

        const raycaster = new THREE.Raycaster()
        raycaster.far = 5

        // 多方向检测：6 个轴向 + 4 个对角线
        const dirs = [
          [1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1],
          [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
          [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
        ].map(d => new THREE.Vector3(d[0], d[1], d[2]).normalize())

        const results = {}
        const warnings = []
        let totalChecked = 0

        for (const [id, pos] of Object.entries(bonePositions)) {
          const point = new THREE.Vector3(pos.p[0], pos.p[1], pos.p[2])
          // 计算骨骼尺寸作为容差
          const boneSize = Array.isArray(pos.s) ? Math.max(...pos.s) : pos.s
          // 容差 = 骨骼尺寸 * 2（留足够余量）
          const tolerance = Math.max(boneSize * 2.5, 0.15)

          let minDist = Infinity
          let bestDir = null

          for (const dir of dirs) {
            raycaster.set(point, dir)
            const hits = raycaster.intersectObjects(meshes, false)
            if (hits.length > 0 && hits[0].distance < minDist) {
              minDist = hits[0].distance
              bestDir = dir
            }
          }

          // 也从骨骼位置向外发射反向射线（从网格到骨骼）
          raycaster.far = 5
          // 额外检测: 在骨骼附近的球形区域内检测网格
          // 使用更宽泛的射线
          let hasHit = false
          for (let attempt = 0; attempt < 20; attempt++) {
            const randomDir = new THREE.Vector3(
              Math.random() * 2 - 1,
              Math.random() * 2 - 1,
              Math.random() * 2 - 1
            ).normalize()
            raycaster.set(point, randomDir)
            const hits = raycaster.intersectObjects(meshes, false)
            if (hits.length > 0 && hits[0].distance < minDist) {
              minDist = hits[0].distance
            }
            if (hits.length > 0 && hits[0].distance < tolerance) {
              hasHit = true
              break
            }
          }

          const status = minDist < tolerance ? 'ok' : minDist < tolerance * 2 ? 'warn' : 'error'

          results[id] = {
            minDist: Math.round(minDist * 100) / 100,
            tolerance: Math.round(tolerance * 100) / 100,
            status,
            boneSize: Math.round(boneSize * 100) / 100
          }

          if (status === 'warn') warnings.push({ id, minDist: results[id].minDist, tolerance: results[id].tolerance })
          if (status === 'error') warnings.push({ id, minDist: results[id].minDist, tolerance: results[id].tolerance, severity: 'error' })

          totalChecked++
        }

        const okCount = Object.values(results).filter(r => r.status === 'ok').length
        const warnCount = Object.values(results).filter(r => r.status === 'warn').length
        const errorCount = Object.values(results).filter(r => r.status === 'error').length

        return {
          total: totalChecked,
          ok: okCount,
          warn: warnCount,
          error: errorCount,
          warnings: warnings.slice(0, 30),
          details: results
        }
      }
    }
  }, [camera])

  // GLB 点击 → face-to-bone 查表 → 启发式管线兜底
  const handleClick = useCallback(
    (e) => {
      e.stopPropagation()

      // 优先使用 face-to-bone 映射表（O(1) 查表）
      if (e.faceIndex != null && window.__faceToBoneMap) {
        const boneId = window.__faceToBoneMap[e.faceIndex]
        if (boneId) {
          selectBone(boneId)
          return
        }
      }

      // 回退到启发式检测管线
      const knownFinger = e.faceIndex != null && window.__faceToFingerMap
        ? window.__faceToFingerMap[e.faceIndex]
        : null
      const fingerBone = findFingerBone(e.point, knownFinger)
      if (fingerBone) {
        selectBone(fingerBone)
        return
      }
      const footBone = findFootBone(e.point)
      if (footBone) {
        selectBone(footBone)
        return
      }
      const torsoBone = findTorsoBone(e.point)
      if (torsoBone) {
        selectBone(torsoBone)
        return
      }
      const nearest = findNearestBone(e.point, 1.2)
      if (nearest) selectBone(nearest.id)
    },
    [selectBone]
  )

  // 悬停检测
  const handlePointerMove = useCallback(
    (e) => {
      e.stopPropagation()
      const knownFinger = e.faceIndex != null && window.__faceToFingerMap
        ? window.__faceToFingerMap[e.faceIndex]
        : null
      const fingerBone = findFingerBone(e.point, knownFinger)
      if (fingerBone) {
        setHovered(fingerBone)
        document.body.style.cursor = 'pointer'
        return
      }
      const footBone = findFootBone(e.point)
      if (footBone) {
        setHovered(footBone)
        document.body.style.cursor = 'pointer'
        return
      }
      const torsoBone = findTorsoBone(e.point)
      if (torsoBone) {
        setHovered(torsoBone)
        document.body.style.cursor = 'pointer'
        return
      }
      const nearest = findNearestBone(e.point, 0.6)
      if (nearest) {
        setHovered(nearest.id)
        document.body.style.cursor = 'pointer'
      } else {
        setHovered(null)
        document.body.style.cursor = 'default'
      }
    },
    [setHovered]
  )

  const handlePointerOut = useCallback(() => {
    setHovered(null)
    document.body.style.cursor = 'default'
  }, [setHovered])

  return (
    <primitive
      ref={ref}
      object={cloned}
      scale={4.64}
      position={[0, -1.84, 0]}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    />
  )
}

// 精确定位点（深色小核心）
const coreGeo = new THREE.SphereGeometry(1, 8, 6)
function CoreDot({ position, size, color = '#1a1a1a' }) {
  return (
    <mesh position={position} scale={Math.max(0.015, size * 0.25)}>
      <primitive object={coreGeo} />
      <meshBasicMaterial color={color} depthTest={true} depthWrite={true} />
    </mesh>
  )
}

// ======== 选中/悬停发光指示器 ========
function SelectionIndicators() {
  const selectedBone = useStore((s) => s.selectedBone)
  const hoveredBone = useStore((s) => s.hoveredBone)
  const theme = useStore((s) => s.theme)

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 12), [])

  const indicators = []

  // 悬停指示器（轻量发光 + 中心点）
  if (hoveredBone && hoveredBone !== selectedBone) {
    const pos = bonePositions[hoveredBone]
    if (pos) {
      const s = Array.isArray(pos.s) ? Math.max(...pos.s) : pos.s
      const indicatorSize = Math.max(0.025, s * 0.55)
      indicators.push(
        <group key={`hover-${hoveredBone}`}>
          <HoverIndicator
            position={pos.p}
            size={indicatorSize}
            theme={theme}
          />
          <CoreDot position={pos.p} size={indicatorSize} color={theme === 'dark' ? '#331a0a' : '#2a1508'} />
        </group>
      )
    }
  }

  // 选中指示器（强发光 + 脉冲 + 中心点）
  if (selectedBone) {
    const pos = bonePositions[selectedBone]
    if (pos) {
      const s = Array.isArray(pos.s) ? Math.max(...pos.s) : pos.s
      const indicatorSize = Math.max(0.03, s * 0.6)
      indicators.push(
        <group key={`sel-${selectedBone}`}>
          <SelectedIndicator
            position={pos.p}
            size={indicatorSize}
            geometry={sphereGeo}
          />
          <CoreDot position={pos.p} size={indicatorSize} color="#1a0500" />
        </group>
      )
    }
  }

  return <group>{indicators}</group>
}

// 悬停发光球
function HoverIndicator({ position, size, theme }) {
  return (
    <mesh position={position} scale={size}>
      <sphereGeometry args={[1, 12, 8]} />
      <meshBasicMaterial
        color={theme === 'dark' ? '#ffaa66' : '#ff7733'}
        transparent
        opacity={0.35}
        depthWrite={false}
      />
    </mesh>
  )
}

// 选中发光球（脉冲动画）
function SelectedIndicator({ position, size, geometry }) {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.userData.phase = (ref.current.userData.phase || 0) + delta * 2.5
      const pulse = 1 + Math.sin(ref.current.userData.phase) * 0.15
      ref.current.scale.setScalar(size * pulse)
    }
  })

  return (
    <mesh ref={ref} position={position}>
      <primitive object={geometry} />
      <meshStandardMaterial
        color="#ff4d1a"
        emissive="#ff6b35"
        emissiveIntensity={0.8}
        roughness={0.3}
        metalness={0.1}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </mesh>
  )
}

export default function SkeletonModel() {
  return (
    <group>
      <GLBSkeleton />
      <SelectionIndicators />
    </group>
  )
}
