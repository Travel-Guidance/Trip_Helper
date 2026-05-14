import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../../api/chatbotApi'
import oriImg from '../../assets/ori.png'
import '../../styles/chatbot.css'

const WELCOME = '안녕하세요! 저는 오리예요 😊\n항공권, 숙소, AI 일정, eSIM 등 이용 방법을 알려드릴게요. 무엇이 궁금하신가요?'

const QUICK_QUESTIONS = [
  '항공권 검색은 어떻게 해요?',
  'AI 일정이 뭐예요?',
  'eSIM은 어디서 구매해요?',
]

export default function HomeChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: 'model', text: WELCOME }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-chatbot', handler)
    return () => window.removeEventListener('open-chatbot', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    const userMsg = { role: 'user', text: msg }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'model')
        .map((m) => ({ role: m.role, text: m.text }))

      const reply = await sendChatMessage(msg, history)
      setMessages((prev) => [...prev, { role: 'model', text: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: '죄송해요, 잠시 오류가 발생했어요. 다시 시도해 주세요.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* 채팅창 */}
      <div className={`chatbot-window${open ? ' open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar"><img src={oriImg} alt="오리" /></div>
            <div>
              <div className="chatbot-name">오리</div>
              <div className="chatbot-status">
                <span className="chatbot-status-dot" />
                온라인
              </div>
            </div>
          </div>
          <button className="chatbot-close" onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="chatbot-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chatbot-msg-row ${m.role}`}>
              {m.role === 'model' && <div className="chatbot-bot-avatar"><img src={oriImg} alt="오리" /></div>}
              <div className="chatbot-bubble">
                {m.text.split('\n').map((line, li) => (
                  <span key={li}>
                    {line}
                    {li < m.text.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chatbot-msg-row model">
              <div className="chatbot-bot-avatar"><img src={oriImg} alt="오리" /></div>
              <div className="chatbot-bubble chatbot-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* 빠른 질문 버튼 (메시지가 1개일 때만) */}
        {messages.length === 1 && (
          <div className="chatbot-quick">
            {QUICK_QUESTIONS.map((q) => (
              <button key={q} className="chatbot-quick-btn" onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="chatbot-input-row">
          <input
            ref={inputRef}
            className="chatbot-input"
            placeholder="메시지를 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button
            className="chatbot-send"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            ↑
          </button>
        </div>
      </div>

      {/* 플로팅 버튼 */}
      <button
        className={`chatbot-fab${open ? ' active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="도우미 열기"
      >
        {open ? '✕' : '💬'}
      </button>
    </>
  )
}
