import { useEffect, useState } from 'react'
import { ChevronRight, Navigation, MapPin, Smartphone } from 'lucide-react'
import CTASection from './CTASection'
import hero1 from '../../assets/hero1.png'
import hero2 from '../../assets/hero2.png'
import hero3 from '../../assets/hero3.png'

const heroImages = [hero1, hero2, hero3]

const phoneSchedules = [
  { time: '09:00', name: '센소지' },
  { time: '10:00', name: '도쿄 스카이트리' },
  { time: '11:00', name: '아키하바라' },
  { time: '12:30', name: '우에노 공원' },
  { time: '14:00', name: '긴자 카페 거리' },
  { time: '15:30', name: '시부야 스크램블' },
  { time: '17:00', name: '메이지 신궁' },
  { time: '19:00', name: '오모테산도' },
]

function PhoneMockupCard({ schedule }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-800 rounded-xl flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-0.5">{schedule.time}</p>
          <p className="text-sm font-semibold text-gray-800 truncate">{schedule.name}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
      </div>
    </div>
  )
}

function PhoneMockup() {
  const loopSchedules = [...phoneSchedules, ...phoneSchedules]

  return (
    <div className="bg-blue-950 rounded-[2.5rem] p-3.5 shadow-2xl shadow-slate-900/25">
      <div className="bg-[#f3efe4] rounded-[2rem] overflow-hidden">
        <div className="p-6 flex flex-col gap-3" style={{ minHeight: 420 }}>
          <div className="text-center pt-4 pb-2">
            <p className="text-base font-bold text-gray-900">도쿄 여행 2일차</p>
            <p className="text-xs text-gray-500 mt-0.5">AI가 추천하는 오늘의 일정</p>
          </div>
          <div className="relative h-[225px] overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[#f3efe4] to-transparent" />
            <div className="phone-schedule-track flex flex-col gap-2.5">
              {loopSchedules.map((s, i) => (
                <PhoneMockupCard key={`${s.time}-${s.name}-${i}`} schedule={s} />
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-[#f3efe4] to-transparent" />
          </div>
          <div className="mt-2 bg-teal-700 rounded-xl py-3.5 text-white flex items-center justify-center gap-2 shadow-md shadow-teal-950/15">
            <Navigation className="w-4 h-4" />
            <span className="text-sm font-semibold">실시간 가이드 중...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HeroSection() {
  const [currentHero, setCurrentHero] = useState(0)
  const [showPhone, setShowPhone] = useState(true)
  const [showStartCard, setShowStartCard] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentHero(current => (current + 1) % heroImages.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="relative overflow-hidden px-6 pt-40 pb-24">
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === currentHero ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${image})` }}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className="relative max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="flex flex-col gap-7">
            <h1
              className="text-5xl font-bold leading-tight tracking-tight text-slate-950"
              style={{ textShadow: '0 2px 12px rgba(255,255,255,0.9), 0 1px 2px rgba(255,255,255,0.95)' }}
            >
              핸드폰 하나로<br />
              떠나는 여행,<br />
              <span className="text-sky-600">
                폰가이즈
              </span>
            </h1>
            <p
              className="text-base font-bold text-slate-900 leading-relaxed"
              style={{ textShadow: '0 2px 10px rgba(255,255,255,0.88), 0 1px 2px rgba(255,255,255,0.95)' }}
            >
              혼자 여행 가면 막막하셨나요?<br />
              이제 AI가 여행 계획부터 현지 가이드까지<br />
              모든 것을 알아서 해드립니다.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={() => setShowStartCard(true)}
                className="inline-flex items-center gap-2 bg-sky-500 text-white text-sm font-semibold px-7 py-3.5 rounded-full shadow-lg shadow-sky-100 hover:bg-sky-400 hover:shadow-xl hover:shadow-sky-200 hover:scale-[1.02] active:scale-95 transition-all duration-200 group"
              >
                여행 계획 시작하기
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-chatbot'))}
                className="inline-flex items-center gap-2 bg-amber-400 text-amber-900 text-sm font-semibold px-7 py-3.5 rounded-full shadow-lg shadow-amber-200 hover:bg-amber-300 hover:shadow-xl hover:shadow-amber-200 hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                🦆 오리랑 대화하기
              </button>
            </div>
            <div className="flex items-center gap-2 pt-1" aria-label="히어로 이미지 선택">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentHero(index)}
                  className={`h-2.5 rounded-full transition-all duration-200 ${
                    index === currentHero ? 'w-7 bg-sky-500' : 'w-2.5 bg-white/80 hover:bg-white'
                  }`}
                  aria-label={`히어로 이미지 ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="relative flex min-h-[120px] justify-center lg:min-h-[460px] lg:justify-end">
            <div className="relative flex min-h-[120px] w-full max-w-[320px] items-center justify-center lg:min-h-[460px] lg:justify-end">
              <button
                type="button"
                onClick={() => setShowPhone(open => !open)}
                aria-expanded={showPhone}
                aria-label={showPhone ? '핸드폰 미리보기 닫기' : '핸드폰 미리보기 열기'}
                className="absolute right-0 top-0 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-blue-800 text-white shadow-lg shadow-blue-950/25 transition-all duration-300 hover:bg-blue-700 hover:scale-105 active:scale-95"
              >
                <Smartphone className="h-5 w-5" />
              </button>
              <div
                className={`transition-all duration-500 ease-out ${
                  showPhone
                    ? 'max-h-[520px] opacity-100 translate-y-0 scale-100'
                    : 'pointer-events-none max-h-0 overflow-hidden opacity-0 translate-y-6 scale-95'
                }`}
                aria-hidden={!showPhone}
              >
                <PhoneMockup />
              </div>
            </div>
          </div>
        </div>
      </div>
      {showStartCard && (
        <CTASection modal onClose={() => setShowStartCard(false)} />
      )}
    </section>
  )
}
