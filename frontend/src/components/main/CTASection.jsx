import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight, Smartphone, Navigation, X } from 'lucide-react'

function CTAPhoneMockup() {
  const schedules = [
    { emoji: '🏯', time: '09:00', name: '센소지' },
    { emoji: '🗼', time: '13:00', name: '도쿄 스카이트리' },
    { emoji: '🎮', time: '16:00', name: '아키하바라' },
  ]
  return (
    <div className="rounded-[2rem] bg-slate-900/70 p-3 shadow-2xl shadow-slate-900/25 ring-1 ring-white/25 rotate-2 hover:rotate-0 transition-transform duration-500 backdrop-blur-[1px]">
      <div className="rounded-[1.5rem] overflow-hidden bg-white/72 backdrop-blur-md ring-1 ring-white/55">
        <div className="p-5 flex flex-col gap-2.5" style={{ minHeight: 340 }}>
          <div className="text-center pt-4 pb-1">
            <p className="text-sm font-bold text-gray-900">도쿄 여행 2일차</p>
            <p className="text-xs text-gray-500 mt-0.5">AI 실시간 가이드</p>
          </div>
          {schedules.map((s, i) => (
            <div key={i} className="bg-white/82 backdrop-blur-sm rounded-xl p-3 shadow-sm flex items-center gap-2.5 ring-1 ring-white/60">
              <span className="text-xl flex-shrink-0">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400">{s.time}</p>
                <p className="text-xs font-semibold text-gray-800 truncate">{s.name}</p>
              </div>
            </div>
          ))}
          <div className="mt-1 bg-teal-700 rounded-xl py-3 text-white flex items-center justify-center gap-1.5 shadow-md shadow-teal-950/15">
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">실시간 가이드 중...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CTACard() {
  const navigate = useNavigate()

  return (
    <div className="cta-travel-card relative rounded-3xl p-12 md:p-16 overflow-hidden shadow-2xl">
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-7">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full w-fit">
            <Smartphone className="w-4 h-4" />
            <span className="text-sm font-medium">AI 여행 가이드</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
            핸드폰 하나로<br />완벽한 여행
          </h2>
          <p className="text-base text-white/80 leading-relaxed">
            지금 바로 폰가이즈와 함께<br />
            당신만의 특별한 여행을 시작하세요
          </p>
          <button
            onClick={() => navigate('/ai-travel')}
            className="inline-flex items-center gap-2 bg-sky-500 text-white text-sm font-bold px-8 py-4 rounded-full shadow-lg shadow-sky-900/10 hover:bg-sky-400 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-200 w-fit group"
          >
            <Sparkles className="w-4 h-4" />
            여행 준비하기
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
        <div className="hidden lg:flex justify-center">
          <div className="w-full max-w-[260px]">
            <CTAPhoneMockup />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CTASection({ modal = false, onClose }) {
  if (modal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/45 px-5 py-8 backdrop-blur-sm">
        <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="닫기" />
        <div className="relative w-full max-w-[1200px]">
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-4 -right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg transition hover:bg-gray-50"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
          <CTACard />
        </div>
      </div>
    )
  }

  return (
    <section className="py-12 px-6">
      <div className="max-w-[1200px] mx-auto">
        <CTACard />
      </div>
    </section>
  )
}
