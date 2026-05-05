import { Smartphone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-10 pb-6 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-lg font-bold">폰가이즈</span>
            </div>
            <p className="text-sm leading-relaxed">AI와 함께하는<br />스마트한 여행의 시작</p>
          </div>

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
  )
}
