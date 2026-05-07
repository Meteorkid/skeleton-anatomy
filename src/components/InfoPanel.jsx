import useStore from '../store/useStore'
import { getBoneById, boneCategories } from '../data/boneData'

export default function InfoPanel() {
  const selectedBone = useStore((s) => s.selectedBone)
  const infoPanelOpen = useStore((s) => s.infoPanelOpen)
  const bone = selectedBone ? getBoneById(selectedBone) : null
  const category = bone
    ? boneCategories.find((c) => c.id === bone.category)
    : null

  if (!bone) {
    return (
      <div className={`info-panel ${infoPanelOpen ? 'open' : ''}`}>
        <div className="info-placeholder">
          <div className="info-icon">🦴</div>
          <h3>点击任意骨骼查看详情</h3>
          <p>鼠标左键旋转 · 滚轮缩放 · 右键平移</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`info-panel ${infoPanelOpen ? 'open' : ''}`}>
      <div className="info-header">
        <span className="info-category-badge">
          {category?.name || bone.category}
        </span>
      </div>

      <h2 className="info-bone-name-zh">{bone.nameZh}</h2>
      <p className="info-bone-name-en">{bone.nameEn}</p>

      <div className="info-section">
        <h4>位置与功能</h4>
        <p>{bone.descriptionZh}</p>
      </div>

      <div className="info-section">
        <h4>Description</h4>
        <p className="info-desc-en">{bone.descriptionEn}</p>
      </div>

      <div className="info-section">
        <h4>所属分类</h4>
        <p>{category?.name} ({category?.nameEn}) · 共 {category?.count} 块</p>
      </div>

      <div className="info-section">
        <h4>编号</h4>
        <p className="info-id">{bone.id}</p>
      </div>
    </div>
  )
}
