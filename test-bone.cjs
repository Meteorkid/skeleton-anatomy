const { chromium } = require('playwright')

const BONES = [
  // 颅骨
  'frontal','parietal_l','parietal_r','temporal_l','temporal_r','occipital','sphenoid','ethmoid',
  'nasal_l','nasal_r','lacrimal_l','lacrimal_r','zygomatic_l','zygomatic_r','maxilla_l','maxilla_r',
  'mandible','palatine_l','palatine_r','vomer','hyoid','inferior_nasal_concha_l','inferior_nasal_concha_r',
  // 听小骨
  'malleus_l','malleus_r','incus_l','incus_r','stapes_l','stapes_r',
  // 颈椎
  'c1_atlas','c2_axis','c3','c4','c5','c6','c7',
  // 胸椎
  't1','t2','t3','t4','t5','t6','t7','t8','t9','t10','t11','t12',
  // 腰椎
  'l1','l2','l3','l4','l5',
  // 骶尾骨
  'sacrum','coccyx',
  // 胸骨与肋骨
  'sternum','rib_l1','rib_r1',
  // 肩部
  'clavicle_l','clavicle_r','scapula_l','scapula_r',
  // 上臂
  'humerus_l','humerus_r',
  // 前臂
  'radius_l','radius_r','ulna_l','ulna_r',
  // 手腕骨（右侧）
  'scaphoid_r','lunate_r','triquetrum_r','pisiform_r','trapezium_r','trapezoid_r','capitate_r','hamate_r',
  // 掌骨（右侧）
  'mc1_r','mc2_r','mc3_r','mc4_r','mc5_r',
  // 手指（右侧）
  'pp_thumb_r','dp_thumb_r','pp_index_r','mp_index_r','dp_index_r',
  'pp_middle_r','mp_middle_r','dp_middle_r','pp_ring_r','mp_ring_r','dp_ring_r',
  'pp_pinky_r','mp_pinky_r','dp_pinky_r',
  // 手指（左侧）
  'pp_thumb_l','dp_thumb_l','pp_index_l','mp_index_l','dp_index_l',
  'pp_middle_l','mp_middle_l','dp_middle_l','pp_ring_l','mp_ring_l','dp_ring_l',
  'pp_pinky_l','mp_pinky_l','dp_pinky_l',
  // 髋部
  'hip_l','hip_r',
  // 股骨
  'femur_l','femur_r',
  // 髌骨
  'patella_l','patella_r',
  // 小腿
  'tibia_l','tibia_r','fibula_l','fibula_r',
  // 足部（右侧）
  'talus_r','calcaneus_r','navicular_r','cuboid_r','cuneiform_med_r','cuneiform_mid_r','cuneiform_lat_r',
  'mt1_r','mt2_r','mt3_r','mt4_r','mt5_r',
  'pp_bigtoe_r','dp_bigtoe_r','pp_toe2_r','mp_toe2_r','dp_toe2_r',
  'pp_toe3_r','mp_toe3_r','dp_toe3_r','pp_toe4_r','mp_toe4_r','dp_toe4_r',
  'pp_toe5_r','mp_toe5_r','dp_toe5_r',
  // 足部（左侧）
  'talus_l','calcaneus_l','navicular_l','cuboid_l','cuneiform_med_l','cuneiform_mid_l','cuneiform_lat_l',
  'mt1_l','mt2_l','mt3_l','mt4_l','mt5_l',
  'pp_bigtoe_l','dp_bigtoe_l','pp_toe2_l','mp_toe2_l','dp_toe2_l',
  'pp_toe3_l','mp_toe3_l','dp_toe3_l','pp_toe4_l','mp_toe4_l','dp_toe4_l',
  'pp_toe5_l','mp_toe5_l','dp_toe5_l',
]

async function main() {
  const browser = await chromium.launch({
    executablePath: '/Users/meteor/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    headless: true, args: ['--no-sandbox']
  })
  const page = await browser.newPage()
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__debugBonePositions && window.__findFootBone && window.__findTorsoBone, { timeout: 15000 })
  await page.waitForTimeout(1000)

  // 测试 1: v4 算法正确性（骨骼中心位置作为输入）
  const v4Results = await page.evaluate((boneIds) => {
    const THREE = window.__debugTHREE
    const bonePositions = window.__debugBonePositions
    const results = []
    for (const id of boneIds) {
      const bp = bonePositions[id]
      if (!bp) { results.push({ id, detected: 'NO_POS', pass: false }); continue }
      const point = new THREE.Vector3(bp.p[0], bp.p[1], bp.p[2])
      const fingerBone = window.__findFingerBone(point, null)
      let detected = fingerBone
      if (!detected) {
        const footBone = window.__findFootBone(point)
        if (footBone) detected = footBone
      }
      if (!detected) {
        const torsoBone = window.__findTorsoBone(point)
        if (torsoBone) detected = torsoBone
      }
      if (!detected) {
        const bones = Object.entries(bonePositions).map(([id2, b]) => ({
          id: id2, px: b.p[0], py: b.p[1], pz: b.p[2],
          size: Array.isArray(b.s) ? Math.max(...b.s) : b.s,
        }))
        let best = null, bestDist = Infinity
        let second = null, secondDist = Infinity, secondSize = 0
        for (const b of bones) {
          const dx = point.x - b.px, dy = point.y - b.py, dz = point.z - b.pz
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
          const threshold = Math.max(b.size * 2.5, 0.15)
          if (dist < threshold) {
            if (dist < bestDist) {
              secondDist = bestDist; second = best; secondSize = best ? best.size : 0
              bestDist = dist; best = b
            } else if (dist < secondDist) {
              secondDist = dist; second = b; secondSize = b.size
            }
          }
        }
        if (best && second && secondDist - bestDist < 0.04 && secondSize < best.size * 0.5) best = second
        detected = best ? best.id : 'NONE'
      }
      results.push({ id, detected, pass: detected === id })
    }
    return results
  }, BONES)

  // 测试 2: v2 mesh 顶点法（best-of-K + knownFinger）
  const K = 10
  const v2Results = await page.evaluate(({ boneIds, K }) => {
    const THREE = window.__debugTHREE
    const group = window.__debugGLBGroup
    const meshes = []
    group.traverse(c => { if (c.isMesh) meshes.push(c) })
    const mesh = meshes[0]
    const pos = mesh.geometry.attributes.position
    const wm = mesh.matrixWorld
    const v = new THREE.Vector3()
    const worldVerts = []
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(wm)
      worldVerts.push({ x: v.x, y: v.y, z: v.z })
    }
    const bonePositions = window.__debugBonePositions

    const boneLookup = Object.entries(bonePositions).map(([id2, b]) => ({
      id: id2, px: b.p[0], py: b.p[1], pz: b.p[2],
      size: Array.isArray(b.s) ? Math.max(...b.s) : b.s,
    }))

    // 从骨骼 ID 提取手指名（如 pp_thumb_r → thumb）
    const FINGER_NAMES = ['thumb', 'index', 'middle', 'ring', 'pinky']
    function getFingerName(boneId) {
      for (const f of FINGER_NAMES) {
        if (boneId.includes('_' + f + '_')) return f
      }
      return null
    }

    const results = []
    for (const id of boneIds) {
      const bp = bonePositions[id]
      if (!bp) { results.push({ id, detected: 'NO_POS', pass: false }); continue }

      // 找 K 个最近顶点
      const nearest = []
      for (const vt of worldVerts) {
        const dx = vt.x - bp.p[0], dy = vt.y - bp.p[1], dz = vt.z - bp.p[2]
        const d = Math.sqrt(dx*dx + dy*dy + dz*dz)
        if (nearest.length < K || d < nearest[nearest.length - 1].dist) {
          nearest.push({ x: vt.x, y: vt.y, z: vt.z, dist: d })
          nearest.sort((a, b) => a.dist - b.dist)
          if (nearest.length > K) nearest.length = K
        }
      }

      if (nearest.length === 0 || nearest[0].dist > 0.5) {
        results.push({ id, detected: 'NO_VERTEX', pass: false, vDist: '0.000', bestK: 0 })
        continue
      }

      // 预判已知手指（模拟 face-to-finger map）
      const knownFinger = getFingerName(id)

      let bestResult = null
      for (const vt of nearest) {
        const clickPoint = new THREE.Vector3(vt.x, vt.y, vt.z)
        const fingerBone = window.__findFingerBone(clickPoint, knownFinger)
        let detected = fingerBone
        if (!detected) {
          const footBone = window.__findFootBone(clickPoint)
          if (footBone) detected = footBone
        }
        if (!detected) {
          const torsoBone = window.__findTorsoBone(clickPoint)
          if (torsoBone) detected = torsoBone
        }
        if (!detected) {
          let best = null, bestDist = Infinity
          let second = null, secondDist = Infinity, secondSize = 0
          for (const b of boneLookup) {
            const dx = clickPoint.x - b.px, dy = clickPoint.y - b.py, dz = clickPoint.z - b.pz
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
            const threshold = Math.max(b.size * 2.5, 0.15)
            if (dist < threshold) {
              if (dist < bestDist) {
                secondDist = bestDist; second = best; secondSize = best ? best.size : 0
                bestDist = dist; best = b
              } else if (dist < secondDist) {
                secondDist = dist; second = b; secondSize = b.size
              }
            }
          }
          if (best && second && secondDist - bestDist < 0.04 && secondSize < best.size * 0.5) best = second
          detected = best ? best.id : 'NONE'
        }
        const pass = detected === id
        if (!bestResult || (pass && !bestResult.pass)) {
          bestResult = { id, detected, pass, vDist: vt.dist.toFixed(3), bestK: nearest.indexOf(vt) + 1 }
        }
        if (pass) break
      }

      results.push(bestResult)
    }
    return results
  }, { boneIds: BONES, K })

  // 增强诊断：对 v2 失败的骨骼，分析最近顶点为何误检
  const v2fDiag = v2Results.filter(r => !r.pass).map(r => r.id)
  if (v2fDiag.length > 0) {
    const diagResults = await page.evaluate(({ boneIds }) => {
      const THREE = window.__debugTHREE
      const group = window.__debugGLBGroup
      const meshes = []
      group.traverse(c => { if (c.isMesh) meshes.push(c) })
      const mesh = meshes[0]
      const pos = mesh.geometry.attributes.position
      const wm = mesh.matrixWorld
      const v = new THREE.Vector3()
      const worldVerts = []
      for (let i = 0; i < pos.count; i++) {
        v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(wm)
        worldVerts.push({ x: v.x, y: v.y, z: v.z })
      }
      const bonePositions = window.__debugBonePositions
      const boneLookup = Object.entries(bonePositions).map(([id2, b]) => ({
        id: id2, px: b.p[0], py: b.p[1], pz: b.p[2],
        size: Array.isArray(b.s) ? Math.max(...b.s) : b.s,
      }))

      const FINGER_NAMES = ['thumb', 'index', 'middle', 'ring', 'pinky']
      function getFingerName(boneId) {
        for (const f of FINGER_NAMES) {
          if (boneId.includes('_' + f + '_')) return f
        }
        return null
      }

      // 检测一条路径
      function detectOne(clickPoint, knownFinger) {
        const fingerBone = window.__findFingerBone(clickPoint, knownFinger)
        if (fingerBone) return { detected: fingerBone, path: 'finger' }
        const footBone = window.__findFootBone(clickPoint)
        if (footBone) return { detected: footBone, path: 'foot' }
        const torsoBone = window.__findTorsoBone(clickPoint)
        if (torsoBone) return { detected: torsoBone, path: 'torso' }
        let best = null, bestDist = Infinity
        let second = null, secondDist = Infinity, secondSize = 0
        for (const b of boneLookup) {
          const dx2 = clickPoint.x - b.px, dy2 = clickPoint.y - b.py, dz2 = clickPoint.z - b.pz
          const dist2 = Math.sqrt(dx2*dx2 + dy2*dy2 + dz2*dz2)
          const threshold = Math.max(b.size * 2.5, 0.15)
          if (dist2 < threshold) {
            if (dist2 < bestDist) {
              secondDist = bestDist; second = best; secondSize = best ? best.size : 0
              bestDist = dist2; best = b
            } else if (dist2 < secondDist) {
              secondDist = dist2; second = b; secondSize = b.size
            }
          }
        }
        if (best && second && secondDist - bestDist < 0.04 && secondSize < best.size * 0.5) best = second
        return { detected: best ? best.id : 'NONE', path: 'global' }
      }

      const results = []
      for (const id of boneIds) {
        const bp = bonePositions[id]
        if (!bp) { results.push({ id, status: 'NO_POS' }); continue }

        const searchRadius = 0.6
        const correctVerts = []
        const nearVerts = [] // 5 个最近顶点及检测结果
        let closestVDist = Infinity

        for (const vt of worldVerts) {
          const dx = vt.x - bp.p[0], dy = vt.y - bp.p[1], dz = vt.z - bp.p[2]
          const d = Math.sqrt(dx*dx + dy*dy + dz*dz)
          if (d > searchRadius) continue
          if (d < closestVDist) closestVDist = d

          const knownFinger = getFingerName(id)
          const result = detectOne(new THREE.Vector3(vt.x, vt.y, vt.z), knownFinger)

          // 记录 5 个最近顶点
          if (nearVerts.length < 5 || d < nearVerts[nearVerts.length - 1].d) {
            nearVerts.push({ x: vt.x, y: vt.y, z: vt.z, d, detected: result.detected, path: result.path })
            nearVerts.sort((a, b) => a.d - b.d)
            if (nearVerts.length > 5) nearVerts.length = 5
          }

          if (result.detected === id) {
            correctVerts.push({ x: vt.x, y: vt.y, z: vt.z, d })
          }
        }

        if (correctVerts.length > 0) {
          const best = correctVerts.sort((a, b) => a.d - b.d).slice(0, 10)
          const cx = best.reduce((s, v) => s + v.x, 0) / best.length
          const cy = best.reduce((s, v) => s + v.y, 0) / best.length
          const cz = best.reduce((s, v) => s + v.z, 0) / best.length
          const vx = best.reduce((s, v) => s + (v.x - cx)**2, 0) / best.length
          const vy = best.reduce((s, v) => s + (v.y - cy)**2, 0) / best.length
          const vz = best.reduce((s, v) => s + (v.z - cz)**2, 0) / best.length
          results.push({
            id, status: 'FOUND', count: correctVerts.length,
            oldPos: [bp.p[0].toFixed(4), bp.p[1].toFixed(4), bp.p[2].toFixed(4)],
            newPos: [cx.toFixed(4), cy.toFixed(4), cz.toFixed(4)],
            spread: [Math.sqrt(vx).toFixed(4), Math.sqrt(vy).toFixed(4), Math.sqrt(vz).toFixed(4)],
            bestVDist: closestVDist.toFixed(3),
            nearVerts: nearVerts.map(nv => ({
              x: nv.x.toFixed(3), y: nv.y.toFixed(3), z: nv.z.toFixed(3),
              d: nv.d.toFixed(3), detected: nv.detected, path: nv.path
            })),
            suggestedLine: `pos.${id} = { p: [${cx.toFixed(4)}, ${cy.toFixed(4)}, ${cz.toFixed(4)}], s: ${JSON.stringify(bp.s)} }`,
          })
        } else {
          results.push({
            id, status: 'NO_CORRECT_VERT', bestVDist: closestVDist.toFixed(3), searchRadius,
            nearVerts: nearVerts.map(nv => ({
              x: nv.x.toFixed(3), y: nv.y.toFixed(3), z: nv.z.toFixed(3),
              d: nv.d.toFixed(3), detected: nv.detected, path: nv.path
            })),
          })
        }
      }
      return results
    }, { boneIds: v2fDiag })

    console.log('\n===== 增强诊断：v2 失败骨骼 =====')
    for (const r of diagResults) {
      console.log(`\n--- ${r.id} (${r.status}, bestVDist=${r.bestVDist}) ---`)
      console.log(`  骨骼中心: [${r.oldPos ? r.oldPos.join(', ') : 'N/A'}]`)
      console.log('  最近5个顶点 → 检测结果:')
      for (const nv of r.nearVerts) {
        console.log(`    d=${nv.d} [${nv.x}, ${nv.y}, ${nv.z}] → ${nv.detected} (${nv.path})`)
      }
      if (r.status === 'FOUND') {
        console.log(`  正确顶点数: ${r.count}, 建议位置: [${r.newPos.join(', ')}]`)
        console.log(`  ${r.suggestedLine}`)
      }
    }
  }

  await browser.close()

  // 输出 v4 结果
  const v4p = v4Results.filter(r => r.pass).length
  const v4f = v4Results.filter(r => !r.pass)
  console.log(`\n===== v4 算法正确性 =====`)
  console.log(`总计: ${v4Results.length} | 通过: ${v4p} | 失败: ${v4f.length} | 通过率: ${(v4p/v4Results.length*100).toFixed(1)}%`)
  if (v4f.length > 0) {
    console.log('失败:')
    for (const f of v4f) console.log(`  ${f.id} → ${f.detected}`)
  }

  // 输出 v2 结果
  const v2p = v2Results.filter(r => r.pass).length
  const v2f = v2Results.filter(r => !r.pass)
  console.log(`\n===== v2 mesh顶点法（best-of-${K}）=====`)
  console.log(`总计: ${v2Results.length} | 通过: ${v2p} | 失败: ${v2f.length} | 通过率: ${(v2p/v2Results.length*100).toFixed(1)}%`)
  // 统计各 bestK 层级的贡献
  for (let k = 1; k <= K; k++) {
    const passedAtK = v2Results.filter(r => r.pass && r.bestK === k).length
    const totalAtK = v2Results.filter(r => r.pass && r.bestK <= k).length
    if (passedAtK > 0) console.log(`  第${k}近顶点首次命中: ${passedAtK} 块 (累计 ${totalAtK})`)
  }
  if (v2f.length > 0) {
    // 按区域分类
    const foot = v2f.filter(f => f.id.match(/(toe|mt|cuneiform|talus|calcaneus|navicular|cuboid)/))
    const finger = v2f.filter(f => f.id.match(/(thumb|index|middle|ring|pinky)/))
    const other = v2f.filter(f => !foot.includes(f) && !finger.includes(f))
    console.log(`\n失败分类: 足部=${foot.length} 手指=${finger.length} 其他=${other.length}`)
    console.log('失败详情:')
    for (const f of v2f) console.log(`  ${f.id} → ${f.detected}  (vDist: ${f.vDist})`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
