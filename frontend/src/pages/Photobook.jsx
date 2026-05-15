// 여행 포토북 인터랙티브 앨범 페이지
import { useEffect, useState } from 'react'
import gsap from 'gsap'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Pretendard:wght@400;600;800&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --glass: rgba(255, 255, 255, .13);
  --line: rgba(255, 255, 255, .2);
  --paper: #fff8e8;
  --ink: #2b1d14;
  --turn-duration: 820ms;
}

body {
  min-height: 100vh;
  overflow: hidden;
  font-family: 'Pretendard', sans-serif;
  color: #fff;
  background:
    radial-gradient(circle at 10% 15%, rgba(255, 214, 165, .38), transparent 28%),
    radial-gradient(circle at 85% 20%, rgba(132, 220, 255, .35), transparent 30%),
    radial-gradient(circle at 50% 90%, rgba(255, 154, 162, .25), transparent 36%),
    linear-gradient(135deg, #130f40, #0b1026 45%, #171531);
  user-select: none;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: radial-gradient(circle, black, transparent 75%);
  pointer-events: none;
}

body::after {
  content: "";
  position: fixed;
  inset: -40%;
  background: conic-gradient(from 0deg, transparent, rgba(255,255,255,.08), transparent, rgba(140,200,255,.12), transparent);
  animation: aura 18s linear infinite;
  pointer-events: none;
  opacity: .5;
}

@keyframes aura {
  to { transform: rotate(360deg); }
}

.scene {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1900px;
  z-index: 1;
}

.hero {
  position: absolute;
  top: 34px;
  text-align: center;
  z-index: 10;
  animation: floatTitle 4s ease-in-out infinite;
}

.hero h1 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(34px, 5vw, 72px);
  letter-spacing: -1px;
  text-shadow: 0 12px 38px rgba(0,0,0,.45);
}

.hero p {
  margin-top: 10px;
  opacity: .82;
  font-size: 15px;
}

@keyframes floatTitle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.book-slider {
  position: relative;
  width: min(1100px, 94vw);
  height: 650px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
  touch-action: pan-y;
}

.book {
  position: absolute;
  width: 290px;
  height: 410px;
  transform-style: preserve-3d;
  transition:
    transform 1s cubic-bezier(.2,.8,.2,1),
    filter .8s,
    opacity .8s;
  cursor: grab;
  filter: brightness(.72) blur(.2px);
  opacity: .45;
  will-change: transform;
}

.book.dragging {
  transition: none;
  cursor: grabbing;
}

.book.active {
  filter: brightness(1.06);
  opacity: 1;
  z-index: 5;
}

.book.left,
.book.right {
  z-index: 2;
}

.book.far {
  opacity: 0;
  pointer-events: none;
  z-index: 0;
}

.cover {
  position: absolute;
  inset: 0;
  border-radius: 18px 30px 30px 18px;
  overflow: hidden;
  transform-style: preserve-3d;
  box-shadow:
    0 35px 70px rgba(0,0,0,.45),
    inset -16px 0 30px rgba(0,0,0,.28),
    inset 4px 0 8px rgba(255,255,255,.28);
  background: linear-gradient(140deg, var(--c1), var(--c2));
}

.cover::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(0,0,0,.48), transparent 18%, transparent 78%, rgba(255,255,255,.18)),
    radial-gradient(circle at 25% 15%, rgba(255,255,255,.34), transparent 22%),
    var(--cover-image);
  background-size: cover;
  background-position: center;
  mix-blend-mode: screen;
  opacity: .48;
}

.cover::after {
  content: "";
  position: absolute;
  inset: 14px;
  border: 1px solid rgba(255,255,255,.28);
  border-radius: 14px 24px 24px 14px;
  pointer-events: none;
}

.cover-content {
  position: relative;
  z-index: 2;
  height: 100%;
  padding: 34px 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.badge {
  width: max-content;
  padding: 8px 13px;
  border: 1px solid rgba(255,255,255,.38);
  border-radius: 999px;
  background: rgba(255,255,255,.13);
  backdrop-filter: blur(8px);
  font-size: 12px;
  font-weight: 800;
}

.cover h2 {
  font-family: 'Playfair Display', serif;
  font-size: 48px;
  line-height: .92;
  text-shadow: 0 8px 24px rgba(0,0,0,.45);
}

.cover small {
  display: block;
  margin-top: 14px;
  opacity: .85;
  letter-spacing: 3px;
  line-height: 1.5;
}

.spine {
  position: absolute;
  left: -18px;
  top: 11px;
  width: 36px;
  height: 388px;
  border-radius: 16px 6px 6px 16px;
  background: linear-gradient(90deg, rgba(0,0,0,.4), var(--c1), rgba(255,255,255,.2));
  transform: rotateY(-80deg) translateZ(15px);
  box-shadow: inset 7px 0 12px rgba(0,0,0,.35);
}

.hint {
  position: absolute;
  left: 50%;
  bottom: -60px;
  transform: translateX(-50%);
  padding: 12px 18px;
  border-radius: 999px;
  background: var(--glass);
  border: 1px solid var(--line);
  backdrop-filter: blur(12px);
  font-size: 13px;
  opacity: 0;
  transition: .5s;
  white-space: nowrap;
}

.book.active .hint {
  opacity: 1;
}

.floating-menu,
.modal-controls {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 999px;
  background: var(--glass);
  border: 1px solid var(--line);
  backdrop-filter: blur(14px);
  box-shadow: 0 14px 35px rgba(0,0,0,.25);
}

.floating-menu {
  bottom: 34px;
}

.modal-controls {
  bottom: 32px;
  z-index: 70;
  transition: opacity 0.3s ease;
}

button {
  font-family: inherit;
}

.floating-menu button,
.modal-controls button {
  border: 0;
  padding: 12px 18px;
  border-radius: 999px;
  font-weight: 900;
  color: #1b1434;
  background: linear-gradient(135deg, #fff, #ffd8a8);
  box-shadow: 0 8px 18px rgba(0,0,0,.24);
  cursor: pointer;
  transition: .25s;
}

.floating-menu button:hover,
.modal-controls button:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 24px rgba(0,0,0,.32);
}

.modal-controls button:disabled {
  opacity: .45;
  cursor: not-allowed;
  transform: none;
}

.page-count {
  display: grid;
  place-items: center;
  min-width: 88px;
  padding: 0 12px;
  font-size: 13px;
  opacity: .9;
}

.page-modal {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  background: rgba(5,7,20,.68);
  backdrop-filter: blur(18px);
  opacity: 0;
  pointer-events: none;
  transition: .55s ease;
}

.page-modal.show {
  opacity: 1;
  pointer-events: auto;
}

.page-modal.opening .modal-controls,
.page-modal.opening .album-title,
.page-modal.opening .close {
  opacity: 0;
  pointer-events: none;
}

.close {
  position: fixed;
  top: 28px;
  right: 34px;
  z-index: 80;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: white;
  text-decoration: none;
  background: rgba(255,255,255,.14);
  border: 1px solid rgba(255,255,255,.22);
  backdrop-filter: blur(12px);
  font-size: 26px;
  transition: .3s;
  cursor: pointer;
}

.close:hover {
  transform: rotate(90deg) scale(1.08);
  background: rgba(255,255,255,.25);
}

.album {
  position: relative;
  width: min(1050px, 92vw);
  height: min(650px, 78vh);
  perspective: 2200px;
  transform-style: preserve-3d;
}

.album.opening {
  animation: albumOpenIn 1.0s cubic-bezier(.22,.86,.25,1) 60ms both;
}

@keyframes albumOpenIn {
  0% {
    transform: translateY(18px) rotateX(8deg) scale(.9);
    opacity: 0;
    filter: blur(4px) saturate(.85);
  }
  38% {
    opacity: 1;
    filter: blur(0) saturate(1.06);
  }
  100% {
    transform: translateY(0) rotateX(0deg) scale(1);
    opacity: 1;
    filter: blur(0) saturate(1);
  }
}

.album-title {
  position: absolute;
  top: -62px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  white-space: nowrap;
  transition: opacity .25s ease;
}

.album-title h2 {
  font-family: 'Playfair Display', serif;
  font-size: 34px;
}

.album-title p {
  margin-top: 6px;
  font-size: 13px;
  opacity: .78;
}

.book-open {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  transform-style: preserve-3d;
  filter: drop-shadow(0 40px 70px rgba(0,0,0,.55));
}

.album.opening .book-open {
  animation: openingPagesReveal 1.1s cubic-bezier(.16,.86,.22,1) 60ms both;
}

@keyframes bookAppear {
  from { transform: rotateX(25deg) scale(.74); opacity: 0; }
  to { transform: rotateX(0deg) scale(1); opacity: 1; }
}

@keyframes openingPagesReveal {
  0%, 20% {
    opacity: 0;
    transform: translateZ(-20px) scale(.985);
    filter: blur(2px) brightness(.82);
  }
  100% {
    opacity: 1;
    transform: translateZ(0) scale(1);
    filter: blur(0) brightness(1);
  }
}

.paper,
.flip-face,
.opening-cover-back {
  background:
    linear-gradient(90deg, rgba(0,0,0,.16), transparent 9%, transparent 92%, rgba(0,0,0,.12)),
    repeating-linear-gradient(0deg, rgba(70,43,20,.035) 0 1px, transparent 1px 8px),
    var(--paper);
  color: var(--ink);
}

.paper {
  position: relative;
  padding: 38px;
  overflow: hidden;
}

.paper.left {
  border-radius: 24px 4px 4px 24px;
  transform-origin: right center;
}

.paper.right {
  border-radius: 4px 24px 24px 4px;
  transform-origin: left center;
}

.paper.left::after,
.paper.right::before {
  content: "";
  position: absolute;
  top: 0;
  width: 45px;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.paper.left::after {
  right: 0;
  background: linear-gradient(90deg, transparent, rgba(0,0,0,.2));
}

.paper.right::before {
  left: 0;
  background: linear-gradient(90deg, rgba(0,0,0,.22), transparent);
}

.page-content {
  width: 100%;
  height: 100%;
  transition: opacity .28s ease, transform .28s ease, filter .28s ease;
}

.paper.pending-reveal .page-content {
  opacity: 0;
  transform: translateX(14px);
  filter: blur(1.4px);
}

.paper.settle .page-content {
  animation: pageContentSettle .36s cubic-bezier(.2,.8,.2,1) both;
}

@keyframes pageContentSettle {
  0% {
    opacity: .72;
    transform: translateX(10px);
    filter: blur(1px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
    filter: blur(0);
  }
}

.photo-frame {
  position: relative;
  height: 66%;
  padding: 14px 14px 44px;
  background: #fff;
  border-radius: 8px;
  transform: rotate(-1.5deg);
  box-shadow: 0 18px 35px rgba(62,38,18,.22);
}

.paper.right .photo-frame,
.flip-face.front .photo-frame {
  transform: rotate(1.4deg);
}

.photo-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 4px;
  filter: saturate(1.08) contrast(1.03);
  pointer-events: none;
}

.caption {
  margin-top: 26px;
}

.caption h3 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(28px, 4vw, 50px);
  color: var(--ink);
}

.caption p {
  margin-top: 12px;
  line-height: 1.75;
  color: rgba(43,29,20,.72);
  font-size: 15px;
}

.flip-page {
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  transform-origin: left center;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  cursor: grab;
  will-change: transform, opacity;
  z-index: 50;
  touch-action: none;
}

.album.opening .flip-page {
  opacity: 0 !important;
  pointer-events: none !important;
}

.flip-page.dragging {
  transition: none;
  cursor: grabbing;
}

.flip-page.turning {
  filter: drop-shadow(-18px 18px 28px rgba(48, 27, 10, .28));
}

.flip-page.turning::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 4px 24px 24px 4px;
  background: linear-gradient(90deg, rgba(0,0,0,.22), transparent 22%, rgba(255,255,255,.18) 58%, rgba(0,0,0,.14));
  transform: translateZ(3px);
  pointer-events: none;
  opacity: .65;
}

.flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  overflow: hidden;
  padding: 38px;
}

.flip-face.front {
  border-radius: 4px 24px 24px 4px;
  transform: rotateY(0deg) translateZ(1px);
}

.flip-face.back {
  border-radius: 24px 4px 4px 24px;
  transform: rotateY(180deg) translateZ(1px);
  background:
    linear-gradient(90deg, transparent 85%, rgba(0,0,0,.12)),
    repeating-linear-gradient(0deg, rgba(70,43,20,.035) 0 1px, transparent 1px 8px),
    var(--paper);
}

.flip-face::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(255,255,255,.38), transparent 28%, transparent 72%, rgba(0,0,0,.11));
  pointer-events: none;
  z-index: 1;
}

.flip-face > * {
  position: relative;
  z-index: 2;
}

.opening-cover {
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  transform-origin: left center;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  z-index: 90;
  pointer-events: none;
  opacity: 0;
  will-change: transform, opacity;
}

.opening-cover-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
  padding: 38px;
  box-shadow:
    0 26px 58px rgba(0,0,0,.42),
    inset -20px 0 32px rgba(0,0,0,.28),
    inset 5px 0 10px rgba(255,255,255,.22);
}

.opening-cover-front {
  border-radius: 4px 24px 24px 4px;
  transform: rotateY(0deg) translateZ(2px);
  background: linear-gradient(140deg, var(--open-c1), var(--open-c2));
}

.opening-cover-front::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(0,0,0,.45), transparent 18%, transparent 78%, rgba(255,255,255,.18)),
    radial-gradient(circle at 25% 15%, rgba(255,255,255,.34), transparent 22%),
    var(--open-cover-image);
  background-size: cover;
  background-position: center;
  mix-blend-mode: screen;
  opacity: .48;
}

.opening-cover-front::after {
  content: "";
  position: absolute;
  inset: 14px;
  border: 1px solid rgba(255,255,255,.28);
  border-radius: 4px 18px 18px 4px;
}

.opening-cover-back {
  border-radius: 24px 4px 4px 24px;
  transform: rotateY(180deg) translateZ(2px);
}

.opening-cover-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.opening-cover-content h3 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(36px, 5vw, 62px);
  line-height: .92;
  text-shadow: 0 8px 24px rgba(0,0,0,.45);
}

.opening-cover-content small {
  display: block;
  margin-top: 14px;
  opacity: .86;
  letter-spacing: 3px;
  line-height: 1.5;
}

.opening-cover-back .opening-cover-content {
  opacity: 0;
}

.album.opening .opening-cover {
  opacity: 1;
  animation: firstCoverOpen 1.28s cubic-bezier(.18,.82,.18,1) 60ms both;
}

@keyframes firstCoverOpen {
  0% {
    transform: rotateY(0deg) translateZ(90px);
    filter: brightness(.92);
    opacity: 1;
  }
  38% {
    transform: rotateY(-74deg) translateZ(70px) translateX(-8px);
    filter: brightness(1.05);
    opacity: 1;
  }
  72% {
    transform: rotateY(-158deg) translateZ(34px) translateX(-18px);
    filter: brightness(.98);
    opacity: 1;
  }
  100% {
    transform: rotateY(-180deg) translateZ(0) translateX(-20px);
    filter: brightness(.96);
    opacity: 0;
  }
}

.sparkle {
  position: fixed;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 18px 4px rgba(255,255,255,.7);
  animation: sparkle 7s linear infinite;
  opacity: .75;
  pointer-events: none;
  z-index: 2;
}

.sparkle:nth-child(1) { left: 12%; top: 74%; animation-delay: 0s; }
.sparkle:nth-child(2) { left: 82%; top: 62%; animation-delay: 1.6s; }
.sparkle:nth-child(3) { left: 68%; top: 18%; animation-delay: 3.1s; }
.sparkle:nth-child(4) { left: 21%; top: 23%; animation-delay: 4.6s; }

@keyframes sparkle {
  0% { transform: translateY(0) scale(.7); opacity: 0; }
  20% { opacity: .85; }
  100% { transform: translateY(-120px) scale(1.5); opacity: 0; }
}

@media (max-width: 760px) {
  .hero { top: 24px; }
  .hero p { width: 280px; margin-inline: auto; line-height: 1.5; }
  .book { width: 220px; height: 320px; }
  .cover h2 { font-size: 34px; }
  .spine { height: 300px; }
  .album { height: 70vh; }
  .paper, .flip-face, .opening-cover-face { padding: 22px; }
  .caption p { display: none; }
  .floating-menu { bottom: 22px; }
  .modal-controls { width: calc(100vw - 24px); justify-content: center; }
  .modal-controls button { padding: 11px 14px; }
}
`

const PALETTES = [
  { c1: '#e8622a', c2: '#f5a34f' },
  { c1: '#667eea', c2: '#764ba2' },
  { c1: '#f093fb', c2: '#f5576c' },
  { c1: '#4facfe', c2: '#00f2fe' },
]

const CITY_EN = {
  '시드니': 'SYDNEY', '멜버른': 'MELBOURNE', '브리즈번': 'BRISBANE', '퍼스': 'PERTH', '애들레이드': 'ADELAIDE',
  '서울': 'SEOUL', '부산': 'BUSAN', '제주': 'JEJU', '인천': 'INCHEON',
  '도쿄': 'TOKYO', '오사카': 'OSAKA', '교토': 'KYOTO', '삿포로': 'SAPPORO', '후쿠오카': 'FUKUOKA',
  '방콕': 'BANGKOK', '파타야': 'PATTAYA', '치앙마이': 'CHIANG MAI', '푸켓': 'PHUKET',
  '파리': 'PARIS', '런던': 'LONDON', '로마': 'ROME', '바르셀로나': 'BARCELONA', '마드리드': 'MADRID',
  '뉴욕': 'NEW YORK', '로스앤젤레스': 'LOS ANGELES', '라스베가스': 'LAS VEGAS', '시카고': 'CHICAGO',
  '싱가포르': 'SINGAPORE', '홍콩': 'HONG KONG', '마카오': 'MACAU',
  '발리': 'BALI', '자카르타': 'JAKARTA',
  '두바이': 'DUBAI', '이스탄불': 'ISTANBUL',
  '프라하': 'PRAGUE', '빈': 'VIENNA', '암스테르담': 'AMSTERDAM', '베를린': 'BERLIN',
  '호놀룰루': 'HONOLULU', '뭄바이': 'MUMBAI', '델리': 'DELHI',
  '타이베이': 'TAIPEI', '베이징': 'BEIJING', '상하이': 'SHANGHAI',
}

function extractCityEn(location) {
  const first = location.split(/[\s(]/)[0]
  return CITY_EN[first] || null
}

function resolveUrl(url, apiBase) {
  if (!url) return ''
  return url.startsWith('http') ? url : `${apiBase}${url}`
}

function toSeason(dateStr) {
  const d = new Date(dateStr)
  const m = d.getMonth() + 1
  const y = d.getFullYear()
  const s = m >= 3 && m <= 5 ? 'SPRING' : m >= 6 && m <= 8 ? 'SUMMER' : m >= 9 && m <= 11 ? 'AUTUMN' : 'WINTER'
  return `${s} ${y}`
}

export default function Photobook() {
  const [userAlbums, setUserAlbums] = useState(null)

  useEffect(() => {
    const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
    const token = localStorage.getItem('tripHelperToken')
    if (!token) { setUserAlbums([]); return }
    fetch(`${apiBase}/api/memories/albums`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setUserAlbums(Array.isArray(data) ? data : []))
      .catch(() => setUserAlbums([]))
  }, [])

  useEffect(() => {
    if (userAlbums === null) return

    const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

    const userBooks = userAlbums
      .map((album, i) => {
        const words = (album.destination || album.title || '여행').split(' ')
        const coverTitle = words.length >= 2 ? `${words[0]}<br>${words.slice(1).join(' ')}` : words[0]
        const palette = PALETTES[i % PALETTES.length]
        const pages = album.pages
          .filter(p => p.photo_url)
          .map(p => ({
            title: p.subtitle || p.location || '사진',
            text: p.caption || '',
            img: resolveUrl(p.photo_url, apiBase),
          }))
        if (pages.length === 0) return null
        const dest = album.destination || '내 여행'
        const sub = 'SYDNEY · MELBOURNE'
        return {
          id: `user-${album.id}`,
          title: album.title || dest,
          coverTitle,
          season: toSeason(album.created_at),
          sub,
          c1: palette.c1,
          c2: palette.c2,
          cover: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80)',
          pages,
        }
      })
      .filter(Boolean)

    const travelBooks = [
      ...userBooks,
      {
        id: 'paris',
        title: 'Paris Walk',
        coverTitle: 'Paris<br>Walk',
        season: 'SPRING 2026',
        sub: 'CAFE · MUSEUM · NIGHT',
        c1: '#667eea',
        c2: '#764ba2',
        cover: 'url(https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80)',
        pages: [
          {
            title: 'Cafe Window',
            text: '거리의 작은 카페, 창가 자리, 천천히 흘러가는 오후를 한 페이지로 저장합니다.',
            img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80'
          },
          {
            title: 'Museum Day',
            text: '관광지가 아니라 기억의 순서대로 사진을 배치하면 진짜 여행책 같은 감성이 납니다.',
            img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1000&q=80'
          },
          {
            title: 'Golden Hour',
            text: '사진 위주 서비스라면 캡션은 짧게, 날짜와 장소는 작게 넣는 편이 고급스럽습니다.',
            img: 'https://images.unsplash.com/photo-1471623432079-b009d30b6729?auto=format&fit=crop&w=1000&q=80'
          },
          {
            title: 'Night Walk',
            text: '마지막 페이지에는 여행 요약, 경로, 동행자, 감정 태그 등을 넣어도 좋습니다.',
            img: 'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?auto=format&fit=crop&w=1000&q=80'
          }
        ]
      },
      {
        id: 'kyoto',
        title: 'Kyoto Days',
        coverTitle: 'Kyoto<br>Days',
        season: 'AUTUMN 2026',
        sub: 'TEMPLE · MAPLE · STREET',
        c1: '#11998e',
        c2: '#38ef7d',
        cover: 'url(https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80)',
        pages: [
          {
            title: 'Temple Road',
            text: '교토의 골목과 사찰 사진은 종이 질감과 특히 잘 어울립니다.',
            img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=80'
          },
          {
            title: 'Maple Wind',
            text: '단풍, 간판, 길거리 음식처럼 색이 강한 사진은 책 커버 후보로도 좋습니다.',
            img: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?auto=format&fit=crop&w=1000&q=80'
          },
          {
            title: 'Quiet Alley',
            text: '드래그 인터랙션은 사용자에게 진짜 앨범을 만지는 느낌을 줍니다.',
            img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1000&q=80'
          },
          {
            title: 'Memory Stamp',
            text: '페이지 끝에는 AI가 자동 생성한 여행 에세이 한 줄을 붙이면 서비스성이 좋아집니다.',
            img: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=1000&q=80'
          }
        ]
      }
    ]

    const slider = document.getElementById('bookSlider')
    const prevBookBtn = document.getElementById('prevBookBtn')
    const openBookBtn = document.getElementById('openBookBtn')
    const nextBookBtn = document.getElementById('nextBookBtn')

    const pageModal = document.getElementById('pageModal')
    const album = document.getElementById('album')
    const closeModalBtn = document.getElementById('closeModalBtn')
    const albumTitle = document.getElementById('albumTitle')
    const leftPage = document.getElementById('leftPage')
    const rightPage = document.getElementById('rightPage')
    const flipPage = document.getElementById('flipPage')
    const flipFront = document.getElementById('flipFront')
    const flipBack = document.getElementById('flipBack')
    const prevPageBtn = document.getElementById('prevPageBtn')
    const nextPageBtn = document.getElementById('nextPageBtn')
    const pageCount = document.getElementById('pageCount')
    const openingCover = document.getElementById('openingCover')
    const openingCoverSeason = document.getElementById('openingCoverSeason')
    const openingCoverTitle = document.getElementById('openingCoverTitle')
    const openingCoverSub = document.getElementById('openingCoverSub')

    let currentBookIndex = 0
    let currentPageIndex = 0
    let isBookDragging = false
    let isPageDragging = false
    let isFlipping = false

    const TURN_DURATION = 0.82 // seconds (GSAP)

    const bookDrag = {
      startX: 0,
      currentX: 0,
      targetIndex: 0,
      pointerId: null
    }

    const pageDrag = {
      startX: 0,
      rotate: 0,
      pointerId: null
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value))
    }

    function pageTemplate(page) {
      if (!page) {
        return `
          <div class="page-content">
            <div class="caption">
              <h3>The End</h3>
              <p>이 여행 책의 마지막 페이지입니다. 다른 책을 열어 또 다른 여행을 확인해보세요.</p>
            </div>
          </div>
        `
      }

      return `
        <div class="page-content">
          <div class="photo-frame">
            <img src="${page.img}" alt="${page.title}">
          </div>
          <div class="caption">
            <h3>${page.title}</h3>
            <p>${page.text}</p>
          </div>
        </div>
      `
    }

    function renderBooks() {
      slider.innerHTML = travelBooks.map((book, index) => `
        <article
          class="book"
          data-index="${index}"
          style="--c1:${book.c1}; --c2:${book.c2}; --cover-image:${book.cover};"
        >
          <div class="spine"></div>
          <div class="cover">
            <div class="cover-content">
              <span class="badge">${book.season}</span>
              <div>
                <h2>${book.coverTitle}</h2>
                <small>${book.sub}</small>
              </div>
            </div>
          </div>
          <div class="hint">클릭해서 열기 · 좌우 드래그로 책 넘김</div>
        </article>
      `).join('')

      updateBookPositions(0)
    }

    function getCircularDiff(index, current, total) {
      let diff = index - current
      if (diff > total / 2) diff -= total
      if (diff < -total / 2) diff += total
      return diff
    }

    function updateBookPositions(extraX = 0) {
      const books = document.querySelectorAll('.book')
      const total = travelBooks.length
      const sideX = window.innerWidth < 760 ? 220 : 360
      const activeX = extraX * 0.32
      const dragTilt = clamp(extraX * 0.035, -11, 11)

      books.forEach((book, index) => {
        const diff = getCircularDiff(index, currentBookIndex, total)
        book.className = 'book'

        if (diff === 0) {
          book.classList.add('active')
          book.style.transform = `translateX(${activeX}px) translateZ(190px) rotateY(${dragTilt}deg) scale(1.08)`
        } else if (diff === 1 || diff === -(total - 1)) {
          book.classList.add('right')
          book.style.transform = `translateX(${sideX + extraX * .16}px) translateZ(-80px) rotateY(-28deg) scale(.82)`
        } else if (diff === -1 || diff === total - 1) {
          book.classList.add('left')
          book.style.transform = `translateX(${-sideX + extraX * .16}px) translateZ(-80px) rotateY(28deg) scale(.82)`
        } else {
          book.classList.add('far')
          book.style.transform = `translateX(${diff * sideX}px) translateZ(-260px) scale(.55)`
        }
      })
    }

    function nextBook() {
      currentBookIndex = (currentBookIndex + 1) % travelBooks.length
      updateBookPositions(0)
    }

    function prevBook() {
      currentBookIndex = (currentBookIndex - 1 + travelBooks.length) % travelBooks.length
      updateBookPositions(0)
    }

    function renderOpeningCover() {
      const book = travelBooks[currentBookIndex]
      openingCover.style.setProperty('--open-c1', book.c1)
      openingCover.style.setProperty('--open-c2', book.c2)
      openingCover.style.setProperty('--open-cover-image', book.cover)
      openingCoverSeason.textContent = book.season
      openingCoverTitle.innerHTML = book.coverTitle
      openingCoverSub.textContent = book.sub
    }

    function updateControls(book) {
      const right = Math.min(currentPageIndex + 2, book.pages.length)
      pageCount.textContent = `${currentPageIndex + 1}–${right} / ${book.pages.length}`
      prevPageBtn.disabled = currentPageIndex === 0
      nextPageBtn.disabled = currentPageIndex + 2 >= book.pages.length
    }

    function renderAlbum() {
      const book = travelBooks[currentBookIndex]
      const left = book.pages[currentPageIndex]
      const right = book.pages[currentPageIndex + 1]

      albumTitle.textContent = book.title
      leftPage.classList.remove('pending-reveal', 'settle')
      rightPage.classList.remove('pending-reveal', 'settle')
      leftPage.innerHTML = pageTemplate(left)
      rightPage.innerHTML = pageTemplate(right)
      flipFront.innerHTML = pageTemplate(right)
      flipBack.innerHTML = pageTemplate(right)
      updateControls(book)

      flipPage.style.transition = ''
      flipPage.style.transform = 'rotateY(0deg)'
      flipPage.style.opacity = right ? '1' : '0'
      flipPage.style.pointerEvents = right ? 'auto' : 'none'
      flipPage.classList.remove('dragging', 'turning')
      isFlipping = false
    }

    function openCurrentBook() {
      currentPageIndex = 0
      renderOpeningCover()
      renderAlbum()  // 모달이 열리기 전에 정확한 페이지 콘텐츠를 미리 세팅
      pageModal.classList.add('show', 'opening')
      album.classList.add('opening')
      isFlipping = true

      window.setTimeout(() => {
        const bookOpen = album.querySelector('.book-open')
        if (bookOpen) bookOpen.style.animation = 'none'
        pageModal.classList.remove('opening')
        album.classList.remove('opening')
        isFlipping = false
      }, 1420)
    }

    function closeBook() {
      pageModal.classList.remove('show', 'opening')
      album.classList.remove('opening')
      flipPage.style.transition = ''
      flipPage.style.transform = 'rotateY(0deg)'
      flipPage.classList.remove('dragging', 'turning')
      isFlipping = false
      isPageDragging = false
    }

    function fadeContentsOut(duration = 0.22) {
      const contents = [leftPage, rightPage]
        .map(p => p.querySelector('.page-content'))
        .filter(Boolean)
      return new Promise(resolve => {
        if (!contents.length) { resolve(); return }
        gsap.to(contents, { opacity: 0, y: 8, filter: 'blur(1px)', duration, ease: 'power2.out', onComplete: resolve })
      })
    }

    function fadeContentsIn() {
      const contents = [leftPage, rightPage]
        .map(p => p.querySelector('.page-content'))
        .filter(Boolean)
      gsap.to(contents, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.65, ease: 'power2.out' })
    }

    function doFlip(fromAngle, toAngle) {
      return new Promise(resolve => {
        flipPage.classList.remove('dragging')
        flipPage.classList.add('turning')
        flipPage.style.pointerEvents = 'none'
        flipPage.style.opacity = '1'

        gsap.fromTo(flipPage,
          { rotateY: fromAngle },
          {
            rotateY: toAngle,
            duration: TURN_DURATION,
            ease: 'power3.inOut',
            onComplete: () => {
              gsap.set(flipPage, { clearProps: 'transform' })
              flipPage.style.transition = 'none'
              flipPage.style.opacity = '0'
              flipPage.style.transform = 'rotateY(0deg)'
              flipPage.classList.remove('dragging', 'turning')
              resolve()
            }
          }
        )
      })
    }

    async function nextPage(startRotate = 0) {
      const book = travelBooks[currentBookIndex]
      if (isFlipping || currentPageIndex + 2 >= book.pages.length) return

      isFlipping = true
      const targetIndex = currentPageIndex + 2
      const isDrag = startRotate !== 0

      await fadeContentsOut(isDrag ? 0.15 : 0.22)

      flipFront.innerHTML = isDrag ? pageTemplate(book.pages[targetIndex]) : ''
      flipBack.innerHTML = ''

      await doFlip(clamp(startRotate, -178, 0), -180)

      currentPageIndex = targetIndex
      leftPage.innerHTML = pageTemplate(book.pages[currentPageIndex])
      rightPage.innerHTML = pageTemplate(book.pages[currentPageIndex + 1])
      flipFront.innerHTML = pageTemplate(book.pages[currentPageIndex + 1])
      flipBack.innerHTML = pageTemplate(book.pages[currentPageIndex + 1])
      updateControls(book)

      // innerHTML 삽입 직후 즉시 숨김 — 브라우저 페인트 전에 실행되어 왼쪽 페이지 깜빡임 방지
      const contents = [leftPage, rightPage]
        .map(p => p.querySelector('.page-content'))
        .filter(Boolean)
      gsap.set(contents, { opacity: 0, y: 14, filter: 'blur(1px)' })

      const right = book.pages[currentPageIndex + 1]
      flipPage.style.opacity = right ? '1' : '0'
      flipPage.style.pointerEvents = right ? 'auto' : 'none'

      fadeContentsIn()
      isFlipping = false
    }

    async function prevPage() {
      const book = travelBooks[currentBookIndex]
      if (isFlipping || currentPageIndex <= 0) return

      isFlipping = true
      const targetIndex = currentPageIndex - 2

      await fadeContentsOut(0.22)

      flipFront.innerHTML = ''
      flipBack.innerHTML = ''

      await doFlip(-180, 0)

      currentPageIndex = targetIndex
      leftPage.innerHTML = pageTemplate(book.pages[currentPageIndex])
      rightPage.innerHTML = pageTemplate(book.pages[currentPageIndex + 1])
      flipFront.innerHTML = pageTemplate(book.pages[currentPageIndex + 1])
      flipBack.innerHTML = pageTemplate(book.pages[currentPageIndex + 1])
      updateControls(book)

      const contents = [leftPage, rightPage]
        .map(p => p.querySelector('.page-content'))
        .filter(Boolean)
      gsap.set(contents, { opacity: 0, y: 14, filter: 'blur(1px)' })

      const right = book.pages[currentPageIndex + 1]
      flipPage.style.opacity = right ? '1' : '0'
      flipPage.style.pointerEvents = right ? 'auto' : 'none'

      fadeContentsIn()
      isFlipping = false
    }

    function startBookDrag(e) {
      if (pageModal.classList.contains('show')) return
      const bookEl = e.target.closest('.book')
      if (!bookEl) return

      isBookDragging = true
      bookDrag.startX = e.clientX
      bookDrag.currentX = 0
      bookDrag.targetIndex = Number(bookEl.dataset.index)
      bookDrag.pointerId = e.pointerId
      document.querySelectorAll('.book').forEach(book => book.classList.add('dragging'))
    }

    function moveBookDrag(e) {
      if (!isBookDragging || e.pointerId !== bookDrag.pointerId) return
      bookDrag.currentX = e.clientX - bookDrag.startX
      updateBookPositions(bookDrag.currentX)
    }

    function endBookDrag(e) {
      if (!isBookDragging || e.pointerId !== bookDrag.pointerId) return

      const movedX = bookDrag.currentX
      const absMovedX = Math.abs(movedX)
      isBookDragging = false
      bookDrag.pointerId = null
      document.querySelectorAll('.book').forEach(book => book.classList.remove('dragging'))

      if (movedX < -85) {
        nextBook()
        return
      }

      if (movedX > 85) {
        prevBook()
        return
      }

      if (absMovedX < 8) {
        if (bookDrag.targetIndex === currentBookIndex) {
          openCurrentBook()
        } else {
          currentBookIndex = bookDrag.targetIndex
          updateBookPositions(0)
        }
        return
      }

      updateBookPositions(0)
    }

    function cancelBookDrag() {
      if (!isBookDragging) return
      isBookDragging = false
      bookDrag.pointerId = null
      document.querySelectorAll('.book').forEach(book => book.classList.remove('dragging'))
      updateBookPositions(0)
    }

    function startPageDrag(e) {
      const book = travelBooks[currentBookIndex]
      if (isFlipping || currentPageIndex >= book.pages.length - 1) return

      flipBack.innerHTML = ''
      e.preventDefault()
      isPageDragging = true
      pageDrag.startX = e.clientX
      pageDrag.rotate = 0
      pageDrag.pointerId = e.pointerId
      flipPage.classList.add('dragging')
      flipPage.style.transition = 'none'
    }

    function movePageDrag(e) {
      if (!isPageDragging || e.pointerId !== pageDrag.pointerId) return
      const diff = e.clientX - pageDrag.startX
      pageDrag.rotate = clamp(diff * 0.75, -180, 0)
      flipPage.style.transform = `rotateY(${pageDrag.rotate}deg)`
    }

    function endPageDrag(e) {
      if (!isPageDragging || e.pointerId !== pageDrag.pointerId) return

      isPageDragging = false
      pageDrag.pointerId = null
      flipPage.classList.remove('dragging')

      if (pageDrag.rotate < -70) {
        nextPage(pageDrag.rotate)
      } else {
        gsap.to(flipPage, {
          rotateY: 0, duration: 0.45, ease: 'power2.out',
          onComplete: () => gsap.set(flipPage, { clearProps: 'transform' })
        })
      }
    }

    function cancelPageDrag() {
      if (!isPageDragging) return
      isPageDragging = false
      pageDrag.pointerId = null
      flipPage.classList.remove('dragging')
      gsap.to(flipPage, {
        rotateY: 0, duration: 0.45, ease: 'power2.out',
        onComplete: () => gsap.set(flipPage, { clearProps: 'transform' })
      })
    }

    function bindEvents() {
      slider.addEventListener('pointerdown', startBookDrag)
      flipPage.addEventListener('pointerdown', startPageDrag)

      document.addEventListener('pointermove', (e) => {
        moveBookDrag(e)
        movePageDrag(e)
      })

      document.addEventListener('pointerup', (e) => {
        endBookDrag(e)
        endPageDrag(e)
      })

      document.addEventListener('pointercancel', () => {
        cancelBookDrag()
        cancelPageDrag()
      })

      prevBookBtn.addEventListener('click', prevBook)
      nextBookBtn.addEventListener('click', nextBook)
      openBookBtn.addEventListener('click', openCurrentBook)
      closeModalBtn.addEventListener('click', closeBook)
      nextPageBtn.addEventListener('click', () => nextPage())
      prevPageBtn.addEventListener('click', prevPage)
      window.addEventListener('resize', () => updateBookPositions(0))

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeBook()
          return
        }

        if (!pageModal.classList.contains('show')) {
          if (e.key === 'ArrowLeft') prevBook()
          if (e.key === 'ArrowRight') nextBook()
          if (e.key === 'Enter') openCurrentBook()
          return
        }

        if (e.key === 'ArrowLeft') prevPage()
        if (e.key === 'ArrowRight') nextPage()
      })
    }

    renderBooks()
    bindEvents()
  }, [userAlbums])

  return (
    <>
      <style>{css}</style>
      <span className="sparkle"></span>
      <span className="sparkle"></span>
      <span className="sparkle"></span>
      <span className="sparkle"></span>

      <main className="scene">
        <section className="hero">
          <h1>Travel Memory Books</h1>
          <p>책 한 권을 넘기듯 여행 사진을 다시 펼쳐보는 인터랙티브 앨범</p>
        </section>

        <section className="book-slider" id="bookSlider" aria-label="travel book slider"></section>

        <div className="floating-menu">
          <button id="prevBookBtn">← 이전 책</button>
          <button id="openBookBtn">책 열기</button>
          <button id="nextBookBtn">다음 책 →</button>
        </div>
      </main>

      <section className="page-modal" id="pageModal">
        <button className="close" id="closeModalBtn">×</button>

        <div className="album" id="album">
          <div className="album-title">
            <h2 id="albumTitle">Bali Diary</h2>
            <p>오른쪽 페이지를 직접 잡고 왼쪽으로 드래그해보세요</p>
          </div>

          <div className="book-open">
            <div className="paper left" id="leftPage"></div>
            <div className="paper right" id="rightPage"></div>
          </div>

          <div className="opening-cover" id="openingCover">
            <div className="opening-cover-face opening-cover-front">
              <div className="opening-cover-content">
                <span className="badge" id="openingCoverSeason">SUMMER 2026</span>
                <div>
                  <h3 id="openingCoverTitle">Bali<br />Diary</h3>
                  <small id="openingCoverSub">OCEAN · SUNSET · HEALING</small>
                </div>
              </div>
            </div>
            <div className="opening-cover-face opening-cover-back">
              <div className="opening-cover-content"></div>
            </div>
          </div>

          <div className="flip-page" id="flipPage">
            <div className="flip-face front" id="flipFront"></div>
            <div className="flip-face back" id="flipBack"></div>
          </div>
        </div>

        <div className="modal-controls">
          <button id="prevPageBtn">← 이전 장</button>
          <span className="page-count" id="pageCount">1 / 4</span>
          <button id="nextPageBtn">다음 장 →</button>
        </div>
      </section>
    </>
  )
}
