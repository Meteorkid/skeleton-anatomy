import { useState, useEffect, useMemo } from 'react'
import useStore from '../store/useStore'
import { bones, getBoneById, boneCategories } from '../data/boneData'

// 测验模式面板
export default function QuizPanel() {
  const quizMode = useStore((s) => s.quizMode)
  const quizBone = useStore((s) => s.quizBone)
  const quizAnswer = useStore((s) => s.quizAnswer)
  const quizResult = useStore((s) => s.quizResult)
  const setQuizBone = useStore((s) => s.setQuizBone)
  const setQuizAnswer = useStore((s) => s.setQuizAnswer)
  const setQuizResult = useStore((s) => s.setQuizResult)
  const selectBoneAndFly = useStore((s) => s.selectBoneAndFly)
  const stopQuiz = useStore((s) => s.stopQuiz)

  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [showHint, setShowHint] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const bone = quizBone ? getBoneById(quizBone) : null
  const category = bone ? boneCategories.find((c) => c.id === bone.category) : null

  // 随机选一块骨头
  const pickRandomBone = () => {
    const randomBone = bones[Math.floor(Math.random() * bones.length)]
    setQuizBone(randomBone.id)
    setShowHint(false)
    setInputValue('')
  }

  useEffect(() => {
    if (quizMode && !quizBone) {
      pickRandomBone()
    }
  }, [quizMode, quizBone])

  // 提交答案
  const handleSubmit = () => {
    if (!bone || !inputValue.trim()) return
    const ans = inputValue.trim().toLowerCase()
    const isCorrect =
      ans === bone.nameZh ||
      ans === bone.nameEn.toLowerCase() ||
      ans === bone.id.toLowerCase()

    setQuizResult(isCorrect ? 'correct' : 'wrong')
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }))

    // 高亮显示这块骨骼
    selectBoneAndFly(bone.id)
  }

  // 下一题
  const handleNext = () => {
    pickRandomBone()
  }

  // 回车提交
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (quizResult) {
        handleNext()
      } else {
        handleSubmit()
      }
    }
  }

  if (!quizMode) return null

  return (
    <div className="quiz-panel">
      <div className="quiz-header">
        <h3>骨骼测验</h3>
        <div className="quiz-score">
          {score.correct} / {score.total}
        </div>
        <button className="quiz-close" onClick={stopQuiz}>✕</button>
      </div>

      {bone && (
        <>
          <div className="quiz-question">
            <p>请说出这块骨骼的名称：</p>
            {bone && (
              <div className="quiz-hint-area">
                <button
                  className="quiz-hint-btn"
                  onClick={() => setShowHint(!showHint)}
                >
                  {showHint ? '隐藏提示' : '显示提示'}
                </button>
                {showHint && (
                  <div className="quiz-hint">
                    <p>分类：{category?.name}</p>
                    <p>编号：{bone.id}</p>
                    <p>描述：{bone.descriptionZh.slice(0, 30)}...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="quiz-input-area">
            <input
              type="text"
              placeholder="输入骨骼名称（中文或英文）"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!!quizResult}
              autoFocus
            />
            {!quizResult ? (
              <button className="quiz-submit" onClick={handleSubmit}>
                提交
              </button>
            ) : null}
          </div>

          {quizResult && (
            <div className={`quiz-result ${quizResult}`}>
              {quizResult === 'correct' ? (
                <p>正确！</p>
              ) : (
                <p>错误。答案是：<strong>{bone.nameZh}</strong> ({bone.nameEn})</p>
              )}
              <button className="quiz-next" onClick={handleNext}>
                下一题 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
