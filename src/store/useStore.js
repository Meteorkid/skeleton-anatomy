import { create } from 'zustand'

// 从 localStorage 恢复主题
const savedTheme = localStorage.getItem('theme') || 'dark'

// 从 localStorage 恢复测验分数
const savedScore = JSON.parse(localStorage.getItem('quizScore') || '{"correct":0,"total":0}')

const useStore = create((set) => ({
  // 骨骼选择
  selectedBone: null,
  hoveredBone: null,
  searchQuery: '',
  activeCategory: 'all',

  // 相机飞行动画
  flyToTarget: null,

  // 主题
  theme: savedTheme,
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
    return { theme: next }
  }),

  // 移动端面板
  sidebarOpen: false,
  infoPanelOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen, infoPanelOpen: false })),
  toggleInfoPanel: () => set((s) => ({ infoPanelOpen: !s.infoPanelOpen, sidebarOpen: false })),
  closePanels: () => set({ sidebarOpen: false, infoPanelOpen: false }),

  // 测验模式
  quizMode: false,
  quizBone: null,
  quizAnswer: '',
  quizResult: null, // 'correct' | 'wrong' | null
  quizScore: savedScore,

  selectBone: (id) => set((state) => ({
    selectedBone: state.selectedBone === id ? null : id,
  })),

  // 从列表选择骨骼，同时触发相机飞行
  selectBoneAndFly: (id) => set({ selectedBone: id, flyToTarget: id }),
  clearFlyTarget: () => set({ flyToTarget: null }),

  setHovered: (id) => set({ hoveredBone: id }),
  setSearch: (q) => set({ searchQuery: q }),
  setCategory: (c) => set({ activeCategory: c }),

  // 测验模式
  startQuiz: () => set({ quizMode: true, quizBone: null, quizAnswer: '', quizResult: null }),
  stopQuiz: () => set({ quizMode: false, quizBone: null, quizAnswer: '', quizResult: null }),
  setQuizBone: (id) => set({ quizBone: id, quizAnswer: '', quizResult: null }),
  setQuizAnswer: (ans) => set({ quizAnswer: ans }),
  setQuizResult: (r) => set({ quizResult: r }),
  updateQuizScore: (correct) => set((state) => {
    const newScore = {
      correct: state.quizScore.correct + (correct ? 1 : 0),
      total: state.quizScore.total + 1,
    }
    localStorage.setItem('quizScore', JSON.stringify(newScore))
    return { quizScore: newScore }
  }),
  resetQuizScore: () => {
    localStorage.setItem('quizScore', JSON.stringify({ correct: 0, total: 0 }))
    set({ quizScore: { correct: 0, total: 0 } })
  },
}))

// 初始化 data-theme 属性
document.documentElement.setAttribute('data-theme', savedTheme)

export default useStore
