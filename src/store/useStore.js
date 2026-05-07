import { create } from 'zustand'

const useStore = create((set) => ({
  // 骨骼选择
  selectedBone: null,
  hoveredBone: null,
  searchQuery: '',
  activeCategory: 'all',

  // 相机飞行动画
  flyToTarget: null,

  // 测验模式
  quizMode: false,
  quizBone: null,
  quizAnswer: '',
  quizResult: null, // 'correct' | 'wrong' | null

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
}))

export default useStore
