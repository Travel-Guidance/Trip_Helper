import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight, Navigation, MapPin } from 'lucide-react'

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
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
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
    <div className="bg-gray-900 rounded-[2.5rem] p-3.5 shadow-2xl">
      <div className="bg-gradient-to-b from-blue-50 to-purple-50 rounded-[2rem] overflow-hidden">
        <div className="p-6 flex flex-col gap-3" style={{ minHeight: 420 }}>
          <div className="text-center pt-4 pb-2">
            <p className="text-base font-bold text-gray-900">도쿄 여행 2일차</p>
            <p className="text-xs text-gray-500 mt-0.5">AI가 추천하는 오늘의 일정</p>
          </div>
          <div className="relative h-[225px] overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-blue-50 to-transparent" />
            <div className="phone-schedule-track flex flex-col gap-2.5">
              {loopSchedules.map((s, i) => (
                <PhoneMockupCard key={`${s.time}-${s.name}-${i}`} schedule={s} />
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-purple-50 to-transparent" />
          </div>
          <div className="mt-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl py-3.5 text-white flex items-center justify-center gap-2">
            <Navigation className="w-4 h-4" />
            <span className="text-sm font-semibold">실시간 가이드 중...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HeroSection() {
  const navigate = useNavigate()
  return (
    <section className="pt-40 pb-24 px-6 bg-gradient-to-br from-blue-50 via-purple-50/60 to-pink-50">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-7">
            <div className="inline-flex items-center gap-2 bg-white/80 border border-blue-100 text-blue-600 px-4 py-2 rounded-full w-fit shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI 여행 가이드</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-900">
              핸드폰 하나로<br />
              떠나는 여행,<br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                폰가이즈
              </span>
            </h1>
            <p className="text-base text-gray-500 leading-relaxed">
              혼자 여행 가면 막막하셨나요?<br />
              이제 AI가 여행 계획부터 현지 가이드까지<br />
              모든 것을 알아서 해드립니다.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={() => navigate('/ai-travel')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold px-7 py-3.5 rounded-full hover:shadow-xl hover:shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all duration-200 group"
              >
                <Sparkles className="w-4 h-4" />
                무료로 여행 계획 시작하기
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button className="inline-flex items-center bg-white border border-gray-200 text-gray-700 text-sm font-medium px-7 py-3.5 rounded-full hover:border-gray-300 hover:shadow-md transition-all duration-200">
                서비스 둘러보기
              </button>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[320px]">
              <PhoneMockup />
              <div className="absolute -top-8 -left-8 w-24 h-24 bg-blue-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
