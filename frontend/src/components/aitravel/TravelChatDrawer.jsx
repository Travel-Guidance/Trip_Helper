import { useState, useEffect, useRef } from 'react'
import { X, Send } from 'lucide-react'
import { apiPost } from '../../api/apiClient'
import simsim from '../../assets/sim2.png'

const PERSONA_DEFAULTS = {
  '호주':       { name: 'Fancy',    emoji: '🦘', greeting: "G'day! 물어보면 일단은 대답은 해드릴텐데 토큰 제한 있으니 많이는 묻지 마세요" },
  '시드니':     { name: 'Fancy',    emoji: '🦘', greeting: "G'day G'day! 물어보면 일단은 대답은 해드릴텐데 토큰 제한 있으니 많이는 묻지 마세요" },
  '멜버른':     { name: 'Fancy',    emoji: '☕', greeting: "G'day! G'day! 물어보면 일단은 대답은 해드릴텐데 토큰 제한 있으니 많이는 묻지 마세요" },
  '골드코스트': { name: 'Fancy',    emoji: '🏄', greeting: "G'day! 물어보면 일단은 대답은 해드릴텐데 토큰 제한 있으니 많이는 묻지 마세요" },
  '케언즈':     { name: 'Fancy',    emoji: '🤿', greeting: "가고싶은곳도 많은 거 보니 돈 많으시나 보네요 부럽다" },
  '울루루':     { name: 'Fancy',    emoji: '🪨', greeting: "G'day! 귀찮으니까 짧게만 물어보시죠" },
  '브리즈번':   { name: 'Fancy',    emoji: '🐨', greeting: "G'day! 브리즈번 볼 거 없으니 돌아가시죠" },
  '일본':       { name: 'Yuki',     emoji: '⛩️', greeting: '안녕하세요! 일본 가이드 유키입니다. 무엇이든 물어보세요.' },
  '도쿄':       { name: 'Yuki',     emoji: '🗼', greeting: '안녕하세요! 도쿄 로컬 유키입니다. 뭐든 도움드릴게요!' },
  '프랑스':     { name: 'Sophie',   emoji: '🗼', greeting: 'Bonjour! 파리 현지인 Sophie예요. 뭐든 물어보세요~' },
  '이탈리아':   { name: 'Marco',    emoji: '🏛️', greeting: 'Ciao! 이탈리아 가이드 Marco입니다. 뭐든 알려드려요!' },
  '스페인':     { name: 'Isabella', emoji: '💃', greeting: '¡Hola! 스페인 현지인 Isabella야. 뭐든 물어봐!' },
  '태국':       { name: 'Nam',      emoji: '🌴', greeting: 'Sawasdee! 태국 가이드 Nam이에요. 무엇이든 물어보세요!' },
}
const DEFAULT_PERSONA = { name: 'Trip AI', emoji: '✈️', greeting: '안녕하세요! 여행에 대해 무엇이든 물어보세요!' }

export default function TravelChatDrawer({ destination }) {
  const [open, setOpen]             = useState(false)
  const [msgs, setMsgs]             = useState([])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [apiPersona, setApiPersona] = useState(null)
  const bottomRef                   = useRef(null)

  const basePersona = PERSONA_DEFAULTS[destination] || DEFAULT_PERSONA
  const persona     = apiPersona || basePersona

  const handleToggle = () => {
    if (!open && msgs.length === 0) {
      setMsgs([{ role: 'bot', text: basePersona.greeting, isGreeting: true }])
    }
    setOpen(v => !v)
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setInput('')

    const next = [...msgs, { role: 'user', text: userText }]
    setMsgs(next)
    setLoading(true)

    try {
      const history = next
        .slice(0, -1)
        .filter(m => !m.isGreeting)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }))

      const res = await apiPost('/ai-travel/chat', { message: userText, history, destination })
      if (res.persona && !apiPersona) setApiPersona({ ...res.persona, emoji: basePersona.emoji })
      setMsgs(prev => [...prev, { role: 'bot', text: res.reply }])
    } catch {
      setMsgs(prev => [...prev, { role: 'bot', text: '죄송해요, 잠시 후 다시 시도해주세요.' }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  return (
    <>
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-50 overflow-hidden"
        style={{ background: open ? '#18181B' : '#fff' }}
        title={open ? '닫기' : `${persona.name}에게 물어보기`}
      >
        {open
          ? <X className="w-5 h-5 text-white" />
          : <img src={simsim} alt="챗봇" className="w-full h-full object-contain" />
        }
      </button>

      {open && (
        <div
          className="fixed right-6 bottom-20 z-40 flex flex-col bg-white rounded-2xl border border-zinc-200"
          style={{ height: '70vh', width: '380px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 flex-shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
              <img src={simsim} alt={persona.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-zinc-900">{persona.name}</p>
              <p className="text-xs text-zinc-400">{destination} 현지 가이드</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-zinc-400">온라인</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' && (
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                    <img src={simsim} alt={persona.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-zinc-100 text-zinc-800 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                  <img src={simsim} alt={persona.name} className="w-full h-full object-cover" />
                </div>
                <div className="bg-zinc-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map(j => (
                      <div key={j} className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${j * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-zinc-100 flex gap-2 flex-shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={`${persona.name}에게 물어보기...`}
              className="flex-1 h-10 px-4 text-sm bg-zinc-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 active:scale-95 transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
