import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone, Plane, MapPin, Sparkles, Calendar,
  Navigation, Wifi, ChevronRight, ChevronLeft, Menu, X, Users,
  Hotel, Shield, Globe, Music, Pause,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const FEATURE_CARDS = [
  {
    gradient: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100',
    iconBg: 'bg-gradient-to-br from-blue-600 to-cyan-500',
    checkBg: 'bg-blue-100',
    icon: Calendar,
    title: '여행 전',
    description: '몇 가지 질문에만 답하면 AI가 당신의 스타일에 맞는 완벽한 여행 일정을 자동으로 생성합니다.',
    items: [
      '인원, 예산, 기간에 맞춘 맞춤형 일정',
      '여행 스타일 해시태그로 취향 반영',
      '최적 동선 자동 계산 및 맛집 추천',
      '항공권, 숙소, eSIM 한번에 준비',
    ],
  },
  {
    gradient: 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100',
    iconBg: 'bg-gradient-to-br from-purple-600 to-pink-500',
    checkBg: 'bg-purple-100',
    icon: Navigation,
    title: '여행 중',
    description: '현지에서 실시간으로 가이드가 필요한 순간, AI가 당신의 완벽한 여행 파트너가 됩니다.',
    items: [
      '실시간 위치 기반 가이드 및 이동 경로',
      '관광지 역사 설명 & 오디오 가이드',
      '예산 실시간 추적 및 일정 자동 재조정',
      '실시간 번역 및 현지 정보 제공',
    ],
  },
];

const STEP_CARDS = [
  {
    number: '1',
    numGradient: 'from-blue-600 to-purple-600',
    iconBg: 'bg-blue-50',
    icon: Users,
    iconColor: 'text-blue-600',
    title: '여행 정보 입력',
    description: '인원, 목적지, 기간, 예산만\n간단하게 입력하세요',
  },
  {
    number: '2',
    numGradient: 'from-purple-600 to-pink-500',
    iconBg: 'bg-purple-50',
    icon: Sparkles,
    iconColor: 'text-purple-600',
    title: 'AI 일정 생성',
    description: 'AI가 최적의 동선과 장소를\n자동으로 계획해드립니다',
  },
  {
    number: '3',
    numGradient: 'from-pink-500 to-red-500',
    iconBg: 'bg-pink-50',
    icon: Plane,
    iconColor: 'text-pink-500',
    title: '여행 출발',
    description: '현지에서 실시간 가이드와\n함께 완벽한 여행을 즐기세요',
  },
];

// to: 경로 지정 / comingSoon: true 이면 준비중 배지 표시
const SERVICE_CARDS = [
  {
    gradient: 'bg-gradient-to-br from-sky-50 to-blue-50',
    border: 'border border-sky-100',
    iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
    icon: Plane,
    title: '항공권 검색',
    subtitle: '최저가 항공권 비교',
    description: '여러 항공사의 가격을 한눈에 비교하고 최저가 항공권을 찾아드립니다.',
    linkText: '항공권 검색하기',
    linkColor: 'text-blue-600',
    to: '/flights',
    comingSoon: false,
  },
  {
    gradient: 'bg-gradient-to-br from-emerald-50 to-green-50',
    border: 'border border-emerald-100',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
    icon: Wifi,
    title: 'eSIM 구매',
    subtitle: '해외 데이터 걱정 끝',
    description: '여행지에 맞는 eSIM을 미리 구매하고 도착하자마자 바로 사용하세요.',
    linkText: 'eSIM 구매하기',
    linkColor: 'text-emerald-600',
    to: '/esim',
    comingSoon: false,
  },
  {
    gradient: 'bg-gradient-to-br from-orange-50 to-amber-50',
    border: 'border border-orange-100',
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-500',
    icon: Hotel,
    title: '숙소 예약',
    subtitle: '최적의 숙소 추천',
    description: '여행 일정에 맞는 최적의 숙소를 AI가 추천하고 간편하게 예약해드립니다.',
    linkText: '숙소 예약하기',
    linkColor: 'text-orange-600',
    to: '/hotels',
    comingSoon: true,
  },
  {
    gradient: 'bg-gradient-to-br from-violet-50 to-purple-50',
    border: 'border border-violet-100',
    iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    icon: Globe,
    title: '투어 & 액티비티',
    subtitle: '현지 체험 예약',
    description: '현지 투어, 액티비티, 입장권을 한 번에 예약하고 특별한 추억을 만드세요.',
    linkText: '투어 및 액티비티 예약하기',
    linkColor: 'text-violet-600',
    to: '/tours',
    comingSoon: true,
  },
  // 새 서비스 추가 예시 — comingSoon: true 로 설정하면 준비중 배지 자동 표시
  // {
  //   gradient: 'bg-gradient-to-br from-rose-50 to-red-50',
  //   border: 'border border-rose-100',
  //   iconBg: 'bg-gradient-to-br from-rose-500 to-red-500',
  //   icon: Shield,
  //   title: '여행자 보험',
  //   subtitle: '안전한 여행 보장',
  //   description: '목적지와 일정에 맞는 여행자 보험을 간편하게 가입하세요.',
  //   linkText: '보험 가입하기',
  //   linkColor: 'text-rose-600',
  //   to: '/insurance',
  //   comingSoon: true,
  // },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavLink({ href, to, children }) {
  const navigate = useNavigate();
  const handleClick = (e) => {
    if (to) {
      e.preventDefault();
      navigate(to);
    }
  };
  return (
    <a
      href={href || to || '#'}
      onClick={handleClick}
      className="relative text-sm font-medium text-gray-600 px-3 py-1.5 rounded-lg transition-all duration-200 hover:text-gray-900 hover:bg-gray-50 group"
    >
      {children}
      <span className="absolute bottom-0.5 left-3 right-3 h-[2px] bg-gradient-to-r from-blue-600 to-purple-600 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
    </a>
  );
}

function Navbar({ mobileMenuOpen, onToggle }) {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">폰가이즈</span>
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/flights">항공권</NavLink>
          <NavLink to="/esim">eSIM</NavLink>
          <NavLink to="/hotels">숙소</NavLink>
          <NavLink to="/tours">투어 및 액티비티</NavLink>
          <button
            onClick={() => navigate('/login')}
            className="relative text-sm font-medium text-gray-600 px-3 py-1.5 rounded-lg transition-all duration-200 hover:text-gray-900 hover:bg-gray-50 group ml-2"
          >
            로그인
          </button>
          <button
            className="ml-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-blue-200 hover:scale-[1.03] active:scale-95 transition-all duration-200"
          >
            시작하기
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={onToggle}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-1">
          <NavLink to="/flights">항공권</NavLink>
          <NavLink to="/esim">eSIM</NavLink>
          <NavLink to="/hotels">숙소</NavLink>
          <NavLink to="/tours">투어 및 액티비티</NavLink>
          <button onClick={() => navigate('/login')} className="text-left text-sm font-medium text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">로그인</button>
          <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold py-3 rounded-full mt-2 hover:shadow-lg transition-all">
            시작하기
          </button>
        </div>
      )}
    </nav>
  );
}

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
  );
}

function PhoneMockup() {
  const schedules = [
    { time: '09:00', name: '센소지' },
    { time: '010:00', name: '도쿄 스카이트리' },
    { time: '011:00', name: '아키하바라' },
  ];
  return (
    <div className="bg-gray-900 rounded-[2.5rem] p-3.5 shadow-2xl">
      <div className="bg-gradient-to-b from-blue-50 to-purple-50 rounded-[2rem] overflow-hidden">
        <div className="p-6 flex flex-col gap-3" style={{ minHeight: 420 }}>
          <div className="text-center pt-4 pb-2">
            <p className="text-base font-bold text-gray-900">도쿄 여행 2일차</p>
            <p className="text-xs text-gray-500 mt-0.5">AI가 추천하는 오늘의 일정</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {schedules.map((s, i) => <PhoneMockupCard key={i} schedule={s} />)}
          </div>
          <div className="mt-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl py-3.5 text-white flex items-center justify-center gap-2">
            <Navigation className="w-4 h-4" />
            <span className="text-sm font-semibold">실시간 가이드 중...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  const navigate = useNavigate();
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
  );
}

function FeatureCard({ card }) {
  const Icon = card.icon;
  return (
    <div className={`rounded-2xl p-10 shadow-md border ${card.gradient} flex flex-col gap-7`}>
      <div className={`w-16 h-16 ${card.iconBg} rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <div className="flex flex-col gap-4">
        <h3 className="text-2xl font-bold text-gray-900">{card.title}</h3>
        <p className="text-base text-gray-600 leading-relaxed">{card.description}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {card.items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 text-gray-700">
            <div className={`w-6 h-6 ${card.checkBg} rounded-full flex items-center justify-center flex-shrink-0`}>
              <span className="text-xs text-gray-500 font-bold">✓</span>
            </div>
            <span className="text-base">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-16">
        <div className="text-center flex flex-col gap-3">
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">폰가이즈가 특별한 이유</h2>
          <p className="text-base text-gray-500">AI와 함께하는 완벽한 여행 경험</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURE_CARDS.map((card, i) => <FeatureCard key={i} card={card} />)}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step }) {
  const Icon = step.icon;
  return (
    <div className="relative group pt-6">
      <div className="bg-white rounded-2xl px-8 pb-10 pt-12 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center gap-6 h-full">
        <div className={`absolute top-0 left-8 w-12 h-12 bg-gradient-to-br ${step.numGradient} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md`}>
          {step.number}
        </div>
        <div className={`w-20 h-20 ${step.iconBg} rounded-2xl flex items-center justify-center`}>
          <Icon className={`w-10 h-10 ${step.iconColor}`} />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
          <p className="text-base text-gray-500 leading-relaxed whitespace-pre-line">{step.description}</p>
        </div>
      </div>
    </div>
  );
}

function StepsSection() {
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-16">
        <div className="text-center flex flex-col gap-3">
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">3단계로 시작하는 완벽한 여행</h2>
          <p className="text-base text-gray-500">복잡한 계획은 이제 그만, AI에게 맡기세요</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {STEP_CARDS.map((step, i) => <StepCard key={i} step={step} />)}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ card }) {
  const Icon = card.icon;
  const navigate = useNavigate();

  const handleClick = () => {
    if (!card.comingSoon && card.to) navigate(card.to);
  };

  return (
    <div
      onClick={handleClick}
      className={`group ${card.gradient} ${card.border} rounded-2xl p-10 transition-all duration-300 flex flex-col gap-7 h-full ${
        card.comingSoon ? 'cursor-default' : 'hover:shadow-xl cursor-pointer'
      }`}
    >
      <div className="flex items-center gap-5">
        <div className={`w-16 h-16 ${card.iconBg} rounded-xl flex items-center justify-center shadow-sm ${!card.comingSoon ? 'group-hover:scale-105' : ''} transition-transform flex-shrink-0`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-gray-900">{card.title}</h3>
            {card.comingSoon && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">준비중</span>
            )}
          </div>
          <p className="text-base text-gray-500 mt-1">{card.subtitle}</p>
        </div>
      </div>
      <p className="text-base text-gray-600 leading-relaxed flex-1">{card.description}</p>
      <div className={`inline-flex items-center gap-2 text-base font-semibold transition-all ${
        card.comingSoon ? 'text-gray-400' : `${card.linkColor} group-hover:gap-3`
      }`}>
        {card.linkText}
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
}

function ServicesCarousel() {
  const [current, setCurrent] = useState(0);
  const [offset, setOffset] = useState(0);
  const [visible, setVisible] = useState(2);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef(null);
  const total = SERVICE_CARDS.length;
  const maxIdx = Math.max(0, total - visible);

  useEffect(() => {
    const update = () => setVisible(window.innerWidth >= 768 ? 2 : 1);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    setCurrent(0);
    setOffset(0);
  }, [visible]);

  const goTo = (index) => {
    // 끝에서 다음 → 처음으로, 처음에서 이전 → 끝으로 (circular)
    const wrapped = ((index % (maxIdx + 1)) + (maxIdx + 1)) % (maxIdx + 1);
    const firstCard = trackRef.current?.children[0];
    if (!firstCard) return;
    const step = firstCard.offsetWidth + 24;
    setCurrent(wrapped);
    setOffset(-(wrapped * step));
  };

  // 자동 재생 — 호버 시 일시정지
  useEffect(() => {
    if (paused || maxIdx === 0) return;
    const id = setInterval(() => goTo(current >= maxIdx ? 0 : current + 1), 3500);
    return () => clearInterval(id);
  }, [current, maxIdx, paused]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex items-stretch gap-6 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(${offset}px)` }}
        >
          {SERVICE_CARDS.map((card, i) => (
            <div key={i} className="min-w-full md:min-w-[calc(50%-12px)] flex-shrink-0 h-full">
              <ServiceCard card={card} />
            </div>
          ))}
        </div>
      </div>

      {maxIdx > 0 && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            className="absolute left-0 top-[45%] -translate-y-1/2 -translate-x-5 md:-translate-x-6 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all z-10"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => goTo(current + 1)}
            className="absolute right-0 top-[45%] -translate-y-1/2 translate-x-5 md:translate-x-6 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all z-10"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </>
      )}

      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: maxIdx + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-6 bg-blue-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ServicesSection() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-16">
        <div className="text-center flex flex-col gap-3">
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">여행 준비도 폰가이즈와 함께</h2>
          <p className="text-base text-gray-500">항공권, eSIM, 숙소, 보험까지 한번에</p>
        </div>
        <ServicesCarousel />
      </div>
    </section>
  );
}

function CTAPhoneMockup() {
  const schedules = [
    { emoji: '🏯', time: '09:00', name: '센소지' },
    { emoji: '🗼', time: '13:00', name: '도쿄 스카이트리' },
    { emoji: '🎮', time: '16:00', name: '아키하바라' },
  ];
  return (
    <div className="bg-gray-900 rounded-[2rem] p-3 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
      <div className="bg-gradient-to-b from-blue-50 to-purple-50 rounded-[1.5rem] overflow-hidden">
        <div className="p-5 flex flex-col gap-2.5" style={{ minHeight: 340 }}>
          <div className="text-center pt-4 pb-1">
            <p className="text-sm font-bold text-gray-900">도쿄 여행 2일차</p>
            <p className="text-xs text-gray-500 mt-0.5">AI 실시간 가이드</p>
          </div>
          {schedules.map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-2.5">
              <span className="text-xl flex-shrink-0">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400">{s.time}</p>
                <p className="text-xs font-semibold text-gray-800 truncate">{s.name}</p>
              </div>
            </div>
          ))}
          <div className="mt-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl py-3 text-white flex items-center justify-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">실시간 가이드 중...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CTASection() {
  const navigate = useNavigate();
  return (
    <section className="py-12 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 md:p-16 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

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
                className="inline-flex items-center gap-2 bg-white text-blue-600 text-sm font-bold px-8 py-4 rounded-full hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-200 w-fit group"
              >
                <Sparkles className="w-4 h-4" />
                무료로 여행 계획 시작하기
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
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-10 pb-6 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-lg font-bold">폰가이즈</span>
            </div>
            <p className="text-sm leading-relaxed">AI와 함께하는<br />스마트한 여행의 시작</p>
          </div>

          {/* Services */}
          <div className="flex flex-col gap-3">
            <h4 className="text-white text-sm font-semibold">서비스</h4>
            <ul className="flex flex-col gap-2">
              {['여행 계획', '항공권', 'eSIM'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-3">
            <h4 className="text-white text-sm font-semibold">고객지원</h4>
            <ul className="flex flex-col gap-2">
              {['FAQ', '문의하기', '이용약관'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-xs text-gray-500">&copy; 2026 폰가이즈. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Music Player ─────────────────────────────────────────────────────────────

function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const iframeRef = useRef(null);

  const sendCommand = (func) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: '' }),
      '*'
    );
  };

  const toggle = () => {
    if (!started) {
      setStarted(true);
      setPlaying(true);
    } else {
      sendCommand(playing ? 'pauseVideo' : 'playVideo');
      setPlaying(p => !p);
    }
  };

  return (
    <>
      {started && (
        <iframe
          ref={iframeRef}
          src="https://www.youtube.com/embed/3ssL8vx7Xhg?autoplay=1&enablejsapi=1&list=PLbO6DZoHB7rQwNeinHBM_2bV2B6hR3Xx4&loop=1&controls=0"
          allow="autoplay"
          style={{ position: 'fixed', top: -9999, left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
          title="bgm"
        />
      )}

      <button
        onClick={toggle}
        title={playing ? '음악 정지' : '음악 재생'}
        className={`fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          playing
            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-blue-200'
            : 'bg-white text-gray-500 hover:text-gray-800'
        }`}
      >
        {playing
          ? <Pause className="w-5 h-5" />
          : <Music className="w-5 h-5" />
        }
      </button>

      {playing && (
        <div className="fixed bottom-6 left-20 z-50 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-full px-4 py-2 shadow-md flex items-center gap-2 text-xs text-gray-600 animate-fade-in">
          <span className="flex gap-0.5 items-end h-3">
            <span className="w-0.5 bg-blue-500 rounded-full animate-[bounce_0.8s_ease-in-out_infinite]" style={{ height: '60%' }} />
            <span className="w-0.5 bg-purple-500 rounded-full animate-[bounce_0.8s_ease-in-out_0.2s_infinite]" style={{ height: '100%' }} />
            <span className="w-0.5 bg-blue-500 rounded-full animate-[bounce_0.8s_ease-in-out_0.4s_infinite]" style={{ height: '40%' }} />
          </span>
          노래 재생 중
        </div>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MainPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navbar mobileMenuOpen={mobileMenuOpen} onToggle={() => setMobileMenuOpen(v => !v)} />
      <HeroSection />
      <FeaturesSection />
      <StepsSection />
      <ServicesSection />
      <CTASection />
      <Footer />
      <MusicPlayer />
    </div>
  );
}
