// 骨骼 3D 位置配置 - 按解剖学大致比例
// 从 SkeletonModel 抽取为独立模块，供相机动画和 3D 模型共用

export function getBonePositions() {
  const pos = {}

  // 头部 - 颅骨 (y: 6.0 - 7.5)
  pos.frontal = { p: [0, 7.2, 0.15], s: [0.65, 0.45, 0.5] }
  pos.parietal_l = { p: [-0.25, 7.4, -0.05], s: [0.35, 0.35, 0.5] }
  pos.parietal_r = { p: [0.25, 7.4, -0.05], s: [0.35, 0.35, 0.5] }
  pos.temporal_l = { p: [-0.45, 7.0, -0.1], s: [0.2, 0.35, 0.35] }
  pos.temporal_r = { p: [0.45, 7.0, -0.1], s: [0.2, 0.35, 0.35] }
  pos.occipital = { p: [0, 7.1, -0.35], s: [0.55, 0.4, 0.25] }
  pos.sphenoid = { p: [0, 6.7, 0], s: [0.5, 0.15, 0.3] }
  pos.ethmoid = { p: [0, 6.85, 0.2], s: [0.2, 0.15, 0.15] }
  pos.nasal_l = { p: [-0.08, 6.85, 0.4], s: [0.06, 0.12, 0.04] }
  pos.nasal_r = { p: [0.08, 6.85, 0.4], s: [0.06, 0.12, 0.04] }
  pos.lacrimal_l = { p: [-0.2, 6.85, 0.3], s: [0.04, 0.1, 0.06] }
  pos.lacrimal_r = { p: [0.2, 6.85, 0.3], s: [0.04, 0.1, 0.06] }
  pos.zygomatic_l = { p: [-0.35, 6.8, 0.2], s: [0.15, 0.18, 0.12] }
  pos.zygomatic_r = { p: [0.35, 6.8, 0.2], s: [0.15, 0.18, 0.12] }
  pos.maxilla_l = { p: [-0.12, 6.6, 0.25], s: [0.18, 0.15, 0.15] }
  pos.maxilla_r = { p: [0.12, 6.6, 0.25], s: [0.18, 0.15, 0.15] }
  pos.mandible = { p: [0, 6.2, 0.15], s: [0.5, 0.2, 0.3] }
  pos.palatine_l = { p: [-0.1, 6.5, 0.1], s: [0.1, 0.06, 0.1] }
  pos.palatine_r = { p: [0.1, 6.5, 0.1], s: [0.1, 0.06, 0.1] }
  pos.vomer = { p: [0, 6.7, 0.15], s: [0.04, 0.2, 0.1] }
  pos.hyoid = { p: [0, 5.7, 0.1], s: [0.15, 0.08, 0.05] }
  pos.inferior_nasal_concha_l = { p: [-0.12, 6.6, 0.28], s: [0.08, 0.04, 0.12] }
  pos.inferior_nasal_concha_r = { p: [0.12, 6.6, 0.28], s: [0.08, 0.04, 0.12] }

  // 听小骨
  pos.malleus_l = { p: [-0.45, 7.0, -0.1], s: 0.02 }
  pos.malleus_r = { p: [0.45, 7.0, -0.1], s: 0.02 }
  pos.incus_l = { p: [-0.44, 7.01, -0.11], s: 0.018 }
  pos.incus_r = { p: [0.44, 7.01, -0.11], s: 0.018 }
  pos.stapes_l = { p: [-0.43, 7.0, -0.12], s: 0.015 }
  pos.stapes_r = { p: [0.43, 7.0, -0.12], s: 0.015 }

  // 颈椎
  for (let i = 0; i < 7; i++) {
    const names = ['c1_atlas', 'c2_axis', 'c3', 'c4', 'c5', 'c6', 'c7']
    pos[names[i]] = { p: [0, 5.9 - i * 0.1, -0.15], s: [0.25, 0.08, 0.2] }
  }

  // 胸椎
  for (let i = 0; i < 12; i++) {
    pos[`t${i + 1}`] = { p: [0, 5.1 - i * 0.12, -0.15], s: [0.28, 0.1, 0.22] }
  }

  // 腰椎
  for (let i = 0; i < 5; i++) {
    pos[`l${i + 1}`] = { p: [0, 3.6 - i * 0.15, -0.12], s: [0.32, 0.12, 0.25] }
  }

  pos.sacrum = { p: [0, 2.4, -0.1], s: [0.35, 0.45, 0.2] }
  pos.coccyx = { p: [0, 1.95, -0.05], s: [0.12, 0.12, 0.08] }

  // 胸骨和肋骨
  pos.sternum = { p: [0, 4.8, 0.25], s: [0.15, 0.7, 0.06] }

  for (let i = 0; i < 12; i++) {
    const y = 5.35 - i * 0.13
    const z = 0.2 - Math.abs(i - 5) * 0.02
    const curveLen = 0.3 + i * 0.02
    pos[`rib_l${i + 1}`] = { p: [-0.35 - curveLen * 0.3, y, z], s: [curveLen, 0.04, 0.08] }
    pos[`rib_r${i + 1}`] = { p: [0.35 + curveLen * 0.3, y, z], s: [curveLen, 0.04, 0.08] }
  }

  // 锁骨 & 肩胛骨
  pos.clavicle_l = { p: [-0.5, 5.6, 0.2], s: [0.5, 0.05, 0.05] }
  pos.clavicle_r = { p: [0.5, 5.6, 0.2], s: [0.5, 0.05, 0.05] }
  pos.scapula_l = { p: [-0.55, 5.1, -0.2], s: [0.3, 0.4, 0.04] }
  pos.scapula_r = { p: [0.55, 5.1, -0.2], s: [0.3, 0.4, 0.04] }

  // 上臂
  pos.humerus_l = { p: [-0.8, 4.3, 0], s: [0.08, 0.9, 0.08] }
  pos.humerus_r = { p: [0.8, 4.3, 0], s: [0.08, 0.9, 0.08] }

  // 前臂
  pos.radius_l = { p: [-0.7, 3.25, 0.05], s: [0.05, 0.75, 0.05] }
  pos.radius_r = { p: [0.7, 3.25, 0.05], s: [0.05, 0.75, 0.05] }
  pos.ulna_l = { p: [-0.85, 3.25, -0.02], s: [0.05, 0.8, 0.05] }
  pos.ulna_r = { p: [0.85, 3.25, -0.02], s: [0.05, 0.8, 0.05] }

  // 手骨 - 左手
  const handBones_l = ['scaphoid_l', 'lunate_l', 'triquetrum_l', 'pisiform_l', 'trapezium_l', 'trapezoid_l', 'capitate_l', 'hamate_l']
  handBones_l.forEach((name, i) => {
    pos[name] = { p: [-0.78 + (i % 4) * 0.06, 2.4 + Math.floor(i / 4) * 0.06, 0.05], s: 0.04 }
  })
  for (let i = 0; i < 5; i++) {
    pos[`mc${i + 1}_l`] = { p: [-0.82 + i * 0.05, 2.25, 0.06], s: [0.02, 0.12, 0.02] }
  }
  const fingerNames_l = ['thumb', 'index', 'middle', 'ring', 'pinky']
  fingerNames_l.forEach((f, fi) => {
    const x = -0.82 + fi * 0.05
    const segments = f === 'thumb' ? ['pp', 'dp'] : ['pp', 'mp', 'dp']
    segments.forEach((seg, si) => {
      pos[`${seg}_${f}_l`] = { p: [x, 2.05 - si * 0.08, 0.06], s: [0.015, 0.06, 0.015] }
    })
  })

  // 手骨 - 右手
  const handBones_r = ['scaphoid_r', 'lunate_r', 'triquetrum_r', 'pisiform_r', 'trapezium_r', 'trapezoid_r', 'capitate_r', 'hamate_r']
  handBones_r.forEach((name, i) => {
    pos[name] = { p: [0.78 - (i % 4) * 0.06, 2.4 + Math.floor(i / 4) * 0.06, 0.05], s: 0.04 }
  })
  for (let i = 0; i < 5; i++) {
    pos[`mc${i + 1}_r`] = { p: [0.82 - i * 0.05, 2.25, 0.06], s: [0.02, 0.12, 0.02] }
  }
  fingerNames_l.forEach((f, fi) => {
    const x = 0.82 - fi * 0.05
    const segments = f === 'thumb' ? ['pp', 'dp'] : ['pp', 'mp', 'dp']
    segments.forEach((seg, si) => {
      pos[`${seg}_${f}_r`] = { p: [x, 2.05 - si * 0.08, 0.06], s: [0.015, 0.06, 0.015] }
    })
  })

  // 髋骨
  pos.hip_l = { p: [-0.4, 2.1, 0], s: [0.35, 0.35, 0.12] }
  pos.hip_r = { p: [0.4, 2.1, 0], s: [0.35, 0.35, 0.12] }

  // 股骨
  pos.femur_l = { p: [-0.25, 1.15, 0], s: [0.1, 1.0, 0.1] }
  pos.femur_r = { p: [0.25, 1.15, 0], s: [0.1, 1.0, 0.1] }

  // 髌骨
  pos.patella_l = { p: [-0.25, 0.62, 0.12], s: [0.08, 0.1, 0.04] }
  pos.patella_r = { p: [0.25, 0.62, 0.12], s: [0.08, 0.1, 0.04] }

  // 胫骨和腓骨
  pos.tibia_l = { p: [-0.22, -0.15, 0.02], s: [0.07, 0.85, 0.07] }
  pos.tibia_r = { p: [0.22, -0.15, 0.02], s: [0.07, 0.85, 0.07] }
  pos.fibula_l = { p: [-0.32, -0.15, 0], s: [0.035, 0.82, 0.035] }
  pos.fibula_r = { p: [0.32, -0.15, 0], s: [0.035, 0.82, 0.035] }

  // 足骨 - 左足
  pos.talus_l = { p: [-0.22, -0.62, 0.05], s: [0.1, 0.08, 0.12] }
  pos.calcaneus_l = { p: [-0.22, -0.72, -0.06], s: [0.12, 0.08, 0.15] }
  pos.navicular_l = { p: [-0.2, -0.62, 0.15], s: 0.06 }
  pos.cuboid_l = { p: [-0.3, -0.62, 0.12], s: 0.06 }
  pos.cuneiform_med_l = { p: [-0.18, -0.62, 0.2], s: 0.05 }
  pos.cuneiform_mid_l = { p: [-0.22, -0.62, 0.2], s: 0.05 }
  pos.cuneiform_lat_l = { p: [-0.26, -0.62, 0.2], s: 0.05 }
  for (let i = 0; i < 5; i++) {
    pos[`mt${i + 1}_l`] = { p: [-0.28 + i * 0.03, -0.7, 0.28], s: [0.025, 0.03, 0.12] }
  }
  const toeNames = ['bigtoe', 'toe2', 'toe3', 'toe4', 'toe5']
  toeNames.forEach((t, ti) => {
    const x = -0.28 + ti * 0.03
    const segments = t === 'bigtoe' ? ['pp', 'dp'] : ['pp', 'mp', 'dp']
    segments.forEach((seg, si) => {
      pos[`${seg}_${t}_l`] = { p: [x, -0.76, 0.38 + si * 0.04], s: [0.018, 0.018, 0.035] }
    })
  })

  // 足骨 - 右足
  pos.talus_r = { p: [0.22, -0.62, 0.05], s: [0.1, 0.08, 0.12] }
  pos.calcaneus_r = { p: [0.22, -0.72, -0.06], s: [0.12, 0.08, 0.15] }
  pos.navicular_r = { p: [0.2, -0.62, 0.15], s: 0.06 }
  pos.cuboid_r = { p: [0.3, -0.62, 0.12], s: 0.06 }
  pos.cuneiform_med_r = { p: [0.18, -0.62, 0.2], s: 0.05 }
  pos.cuneiform_mid_r = { p: [0.22, -0.62, 0.2], s: 0.05 }
  pos.cuneiform_lat_r = { p: [0.26, -0.62, 0.2], s: 0.05 }
  for (let i = 0; i < 5; i++) {
    pos[`mt${i + 1}_r`] = { p: [0.28 - i * 0.03, -0.7, 0.28], s: [0.025, 0.03, 0.12] }
  }
  toeNames.forEach((t, ti) => {
    const x = 0.28 - ti * 0.03
    const segments = t === 'bigtoe' ? ['pp', 'dp'] : ['pp', 'mp', 'dp']
    segments.forEach((seg, si) => {
      pos[`${seg}_${t}_r`] = { p: [x, -0.76, 0.38 + si * 0.04], s: [0.018, 0.018, 0.035] }
    })
  })

  return pos
}
