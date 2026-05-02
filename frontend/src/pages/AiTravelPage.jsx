import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

export default function AiTravelPage() {
  const navigate = useNavigate()

  return (
    <div className="ai-page">
      <div className="ai-coming-soon">
        <div className="ai-coming-icon">✨</div>
        <h2 className="ai-coming-title">AI 여행 짜기</h2>
        <p className="ai-coming-desc">
          목적지, 인원, 여행 스타일을 입력하면<br />
          AI가 최적의 일정을 자동으로 만들어줘요.
        </p>
        <span className="ai-coming-badge">현재 준비 중입니다</span>
        <button className="ai-coming-back" onClick={() => navigate('/')}>
          홈으로 돌아가기
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
