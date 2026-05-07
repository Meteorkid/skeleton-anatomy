import { useMemo } from 'react'
import useStore from '../store/useStore'
import { bones, boneCategories, getBonesByCategory, searchBones } from '../data/boneData'

export default function Sidebar() {
  const searchQuery = useStore((s) => s.searchQuery)
  const activeCategory = useStore((s) => s.activeCategory)
  const selectedBone = useStore((s) => s.selectedBone)
  const setSearch = useStore((s) => s.setSearch)
  const setCategory = useStore((s) => s.setCategory)
  const selectBone = useStore((s) => s.selectBoneAndFly)

  // 先按分类筛选，再按搜索词筛选
  const filteredBones = useMemo(() => {
    let list = getBonesByCategory(activeCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (b) =>
          b.nameZh.includes(q) ||
          b.nameEn.toLowerCase().includes(q) ||
          b.id.includes(q)
      )
    }
    return list
  }, [activeCategory, searchQuery])

  return (
    <div className="sidebar">
      {/* 搜索框 */}
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="搜索骨骼名称..."
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearch('')}>
            ✕
          </button>
        )}
      </div>

      {/* 分类筛选 */}
      <div className="sidebar-categories">
        <button
          className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setCategory('all')}
        >
          全部 ({bones.length})
        </button>
        {boneCategories.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* 骨骼列表 */}
      <div className="sidebar-bone-list">
        <div className="bone-list-header">
          {filteredBones.length} 块骨骼
        </div>
        {filteredBones.map((bone) => (
          <div
            key={bone.id}
            className={`bone-list-item ${selectedBone === bone.id ? 'selected' : ''}`}
            onClick={() => selectBone(bone.id)}
          >
            <span className="bone-list-name-zh">{bone.nameZh}</span>
            <span className="bone-list-name-en">{bone.nameEn}</span>
          </div>
        ))}
        {filteredBones.length === 0 && (
          <div className="bone-list-empty">未找到匹配的骨骼</div>
        )}
      </div>
    </div>
  )
}
