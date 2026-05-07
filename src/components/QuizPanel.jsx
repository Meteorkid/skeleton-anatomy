import { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import { bones, getBoneById, boneCategories } from '../data/boneData'

export default function QuizPanel() {
  const quizMode = useStore((s) => s.quizMode)
  const quizBone = useStore((s) => s.quizBone)
  const quizResult = useStore((s) => s.quizResult)
  const quizScore = useStore((s) => s.quizScore)
  const setQuizBone = useStore((s) => s.setQuizBone)
  const setQuizResult = useStore((s) => s.setQuizResult)
  const selectBoneAndFly = useStore((s) => s.selectBoneAndFly)
  const stopQuiz = useStore((s) => s.stopQuiz)
  const updateQuizScore = useStore((s) => s.updateQuizScore)
  const resetQuizScore = useStore((s) => s.resetQuizScore)

  const [showHint, setShowHint] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const bone = quizBone ? getBoneById(quizBone) : null
  const category = bone ? boneCategories.find((c) => c.id === bone.category) : null

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

  const handleSubmit = () => {
    if (!bone || !inputValue.trim()) return
    const ans = inputValue.trim().toLowerCase()
    const isCorrect =
      ans === bone.nameZh ||
      ans === bone.nameEn.toLowerCase() ||
      ans === bone.id.toLowerCase()

    setQuizResult(isCorrect ? 'correct' : 'wrong')
    updateQuizScore(isCorrect)
    selectBoneAndFly(bone.id)
  }

  const handleNext = () => {
    pickRandomBone()
  }

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
          {quizScore.correct} / {quizScore.total}
          {quizScore.total > 0 && (
            <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.6 }}>
              ({Math.round(quizScore.correct / quizScore.total * 100)}%)
            </span>
          )}
        </div>
        <button className="quiz-close" onClick={resetQuizScore} title="重置分数">↺</button>
        <button className="quiz-close" onClick={stopQuiz}>✕</button>
      </div>

      {bone && (
        <>
          <div className="quiz-question">
            <p>请说出这块骨骼的名称：</p>
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
            {!quizResult && (
              <button className="quiz-submit" onClick={handleSubmit}>
                提交
              </button>
            )}
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
