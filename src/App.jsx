import Canvas3D from './components/Canvas3D'
import Sidebar from './components/Sidebar'
import InfoPanel from './components/InfoPanel'
import QuizPanel from './components/QuizPanel'
import useStore from './store/useStore'
import './App.css'

export default function App() {
  const quizMode = useStore((s) => s.quizMode)
  const startQuiz = useStore((s) => s.startQuiz)

  return (
    <div className="app">
      <header className="app-header">
        <h1>人体骨骼 3D 图谱</h1>
        <span className="app-subtitle">Human Skeleton 3D Atlas · 206 Bones</span>
        <div className="header-actions">
          <button
            className={`quiz-toggle-btn ${quizMode ? 'active' : ''}`}
            onClick={quizMode ? undefined : startQuiz}
          >
            {quizMode ? '测验中...' : '开始测验'}
          </button>
        </div>
      </header>
      <div className="app-body">
        <Sidebar />
        <div className="canvas-container">
          <Canvas3D />
          {quizMode && <QuizPanel />}
        </div>
        <InfoPanel />
      </div>
    </div>
  )
}
