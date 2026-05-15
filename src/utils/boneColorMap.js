// GPU Bone ID Map — 顶点着色工具
// 为每块骨骼生成唯一 RGB 颜色，将 mesh 顶点按最近骨骼中心着色
// 配合 flat-shaded offscreen render，点击时读像素即可定位骨骼

import { getBonePositions } from './bonePositions'
import { bones } from '../data/boneData'

const bonePositions = getBonePositions()

// 预计算骨骼快速查找数组（世界坐标）
function buildBoneLookup() {
  return bones
    .filter((b) => bonePositions[b.id])
    .map((b, i) => {
      const s = bonePositions[b.id].s
      return {
        id: b.id,
        idx: i, // 0-based index → color encoding
        px: bonePositions[b.id].p[0],
        py: bonePositions[b.id].p[1],
        pz: bonePositions[b.id].p[2],
        size: Array.isArray(s) ? Math.max(...s) : s,
      }
    })
}

export const boneLookup = buildBoneLookup()

// 骨骼 index → 归一化 RGB 颜色
export function boneIndexToColor(idx) {
  return {
    r: ((idx >> 16) & 0xFF) / 255,
    g: ((idx >> 8) & 0xFF) / 255,
    b: (idx & 0xFF) / 255,
  }
}

// 归一化 RGB → 骨骼 ID 反查表
function buildColorToBone() {
  const map = {}
  for (const bone of boneLookup) {
    const color = boneIndexToColor(bone.idx)
    const key = `${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)}`
    map[key] = bone.id
  }
  return map
}

export const colorToBone = buildColorToBone()

// 暴露到 window 用于测试
if (typeof window !== 'undefined') {
  window.__boneLookup = boneLookup
  window.__colorToBone = colorToBone
}

/**
 * 为 geometry 的每个顶点分配最近骨骼的颜色
 * @param {THREE.BufferGeometry} geometry — GLB mesh geometry
 * @param {Array<{idx:number, x:number, y:number, z:number}>} localBones — 本地坐标空间的骨骼位置
 * @returns {{ colors: Float32Array, colorToBone: Record<string, string> }}
 */
export function buildVertexBoneColors(geometry, localBones) {
  const pos = geometry.attributes.position
  const count = pos.count
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const vx = pos.getX(i)
    const vy = pos.getY(i)
    const vz = pos.getZ(i)

    let bestIdx = 0
    let bestDist = Infinity

    for (const b of localBones) {
      const dx = vx - b.x
      const dy = vy - b.y
      const dz = vz - b.z
      const dist = dx * dx + dy * dy + dz * dz
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = b.idx
      }
    }

    const c = boneIndexToColor(bestIdx)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }

  return { colors, colorToBone }
}

/**
 * 从 0-255 整数 RGB 像素值解码骨骼 ID
 */
export function decodeBoneFromPixel(r, g, b) {
  const key = `${r},${g},${b}`
  return colorToBone[key] || null
}
