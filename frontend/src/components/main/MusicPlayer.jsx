import { useEffect, useState, useRef } from 'react'
import { Music, Pause } from 'lucide-react'

const YOUTUBE_MUSIC_URL =
  'https://www.youtube.com/embed/j8FoJxLv-JI?enablejsapi=1&autoplay=1&loop=1&playlist=j8FoJxLv-JI&playsinline=1'

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const iframeRef = useRef(null)

  const sendCommand = (func) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: '' }),
      '*'
    )
  }

  useEffect(() => {
    if (!started || !playing) return
    const timer = setTimeout(() => sendCommand('playVideo'), 500)
    return () => clearTimeout(timer)
  }, [started, playing])

  const toggle = () => {
    if (!started) {
      setStarted(true)
      setPlaying(true)
    } else {
      sendCommand(playing ? 'pauseVideo' : 'playVideo')
      setPlaying(p => !p)
    }
  }

  return (
    <>
      {started && (
        <iframe
          ref={iframeRef}
          src={YOUTUBE_MUSIC_URL}
          title="Background music player"
          className="fixed w-px h-px opacity-0 pointer-events-none"
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          onLoad={() => {
            if (playing) sendCommand('playVideo')
          }}
        />
      )}

      <button
        onClick={toggle}
        title={playing ? '음악 정지' : '음악 재생'}
        className={`fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          playing
            ? 'bg-sky-500 text-white shadow-sky-200'
            : 'bg-white text-gray-500 hover:text-gray-800'
        }`}
      >
        {playing ? <Pause className="w-5 h-5" /> : <Music className="w-5 h-5" />}
      </button>

      {playing && (
        <div className="fixed bottom-6 left-20 z-50 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-full px-4 py-2 shadow-md flex items-center gap-2 text-xs text-gray-600 animate-fade-in">
          <span className="flex gap-0.5 items-end h-3">
            <span className="w-0.5 bg-blue-500 rounded-full animate-[bounce_0.8s_ease-in-out_infinite]" style={{ height: '60%' }} />
            <span className="w-0.5 bg-sky-500 rounded-full animate-[bounce_0.8s_ease-in-out_0.2s_infinite]" style={{ height: '100%' }} />
            <span className="w-0.5 bg-blue-500 rounded-full animate-[bounce_0.8s_ease-in-out_0.4s_infinite]" style={{ height: '40%' }} />
          </span>
          노래 재생 중
        </div>
      )}
    </>
  )
}
