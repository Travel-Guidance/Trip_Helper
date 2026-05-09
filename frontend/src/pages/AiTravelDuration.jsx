/* global google */
import { useEffect } from 'react'

const pageStyle = "\n    :root {\n      --blue:      #29ABE2;\n      --blue-d:    #1A8FC4;\n      --blue-g:    linear-gradient(135deg, #29ABE2, #1A8FC4);\n      --navy:      #0F2744;\n      --text:      #1A2B4B;\n      --muted:     #6B7C99;\n      --dim:       #A0AEBE;\n      --bg:        #F4F8FC;\n      --card:      #FFFFFF;\n      --border:    #E2EAF4;\n      --border2:   #C8D8EC;\n      --green:     #0BB97A;\n      --amber:     #F59E0B;\n      --rose:      #EF4444;\n      --purple:    #8B5CF6;\n      --gold:      #D97706;\n      --r:         14px;\n      --shadow:    0 2px 12px rgba(15,39,68,.08);\n      --shadow-md: 0 4px 24px rgba(15,39,68,.12);\n    }\n    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n    html { scroll-behavior: smooth; }\n    body {\n      background: var(--bg);\n      color: var(--text);\n      font-family: \"Noto Sans KR\", sans-serif;\n      min-height: 100vh;\n      -webkit-font-smoothing: antialiased;\n    }\n    button { font: inherit; border: 0; cursor: pointer; }\n    a { color: inherit; text-decoration: none; }\n    input, textarea, select { font: inherit; }\n\n    /* ─── TOPBAR ─── */\n    .topbar {\n      position: sticky; top: 0; z-index: 90;\n      background: rgba(255,255,255,.95);\n      backdrop-filter: blur(16px);\n      border-bottom: 1px solid var(--border);\n      box-shadow: 0 1px 8px rgba(15,39,68,.06);\n    }\n    .topbar-in {\n      max-width: 1320px; margin: 0 auto;\n      display: flex; align-items: center; gap: 12px;\n      padding: 0 24px; height: 58px;\n    }\n    .brand {\n      display: flex; align-items: center; gap: 8px;\n      font-weight: 900; font-size: 15px; color: var(--navy); white-space: nowrap;\n    }\n    .brand-icon {\n      width: 32px; height: 32px; border-radius: 10px;\n      background: var(--blue-g); display: grid; place-items: center;\n      font-size: 15px; box-shadow: 0 4px 12px rgba(41,171,226,.35);\n    }\n    .topbar-trip {\n      flex: 1; display: flex; align-items: center; gap: 8px;\n      font-size: 12px; color: var(--muted); font-weight: 600;\n    }\n    .topbar-trip strong { color: var(--text); font-weight: 700; }\n    .sep { color: var(--dim); }\n    .live-pill {\n      display: inline-flex; align-items: center; gap: 5px;\n      padding: 3px 10px; border-radius: 999px;\n      background: rgba(41,171,226,.1); border: 1px solid rgba(41,171,226,.2);\n      color: var(--blue); font-size: 11px; font-weight: 700;\n    }\n    .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--blue); animation: blink 1.6s ease infinite; flex-shrink: 0; }\n    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }\n\n    .topbar-actions { display: flex; align-items: center; gap: 6px; }\n    .t-btn {\n      display: flex; align-items: center; gap: 5px;\n      padding: 7px 13px; border-radius: 999px; font-size: 12px; font-weight: 700;\n      transition: opacity .15s, transform .12s;\n    }\n    .t-btn:hover { opacity: .85; transform: translateY(-1px); }\n    .t-btn.translate { background: var(--blue-g); color: #fff; box-shadow: 0 4px 14px rgba(41,171,226,.3); }\n    .t-btn.map-btn { background: rgba(11,185,122,.1); border: 1px solid rgba(11,185,122,.25); color: var(--green); }\n    .t-btn.ghost { background: var(--bg); border: 1px solid var(--border2); color: var(--muted); }\n\n    /* ─── HERO STRIP ─── */\n    .dest-hero {\n      position: relative; overflow: hidden;\n      min-height: 480px;\n      display: flex; align-items: flex-end;\n      background:\n        linear-gradient(to bottom, rgba(15,39,68,.08) 0%, rgba(15,39,68,.5) 60%, rgba(15,39,68,.88) 100%),\n        url(\"https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1800&q=80\") center/cover;\n    }\n    .dest-hero-inner {\n      max-width: 1320px; width: 100%; margin: 0 auto;\n      padding: 0 24px 24px;\n      display: flex; align-items: flex-end; justify-content: space-between; gap: 20px;\n    }\n    .dest-city {\n      font-size: clamp(40px, 6vw, 72px);\n      font-weight: 900; line-height: .95;\n      letter-spacing: -.02em; color: #fff;\n      text-shadow: 0 2px 20px rgba(0,0,0,.3);\n    }\n    .dest-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }\n    .dest-tag {\n      display: inline-flex; align-items: center; gap: 6px;\n      padding: 5px 11px; border-radius: 999px;\n      background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25);\n      backdrop-filter: blur(8px); font-size: 11px; font-weight: 700; color: rgba(255,255,255,.95);\n    }\n    .dest-right { flex-shrink: 0; }\n    .budget-badge {\n      background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25);\n      backdrop-filter: blur(8px); border-radius: 14px; padding: 10px 14px; text-align: right;\n    }\n    .budget-label { font-size: 10px; color: rgba(255,255,255,.6); font-weight: 700; letter-spacing: .07em; text-transform: uppercase; margin-bottom: 4px; }\n    .budget-bar { width: 180px; height: 5px; border-radius: 999px; background: rgba(255,255,255,.2); overflow: hidden; margin-bottom: 5px; }\n    .budget-bar-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #29ABE2, #0BB97A); transition: width .6s ease; }\n    .budget-nums { display: flex; justify-content: flex-end; align-items: baseline; gap: 4px; }\n    .budget-spent { font-family: \"JetBrains Mono\", monospace; font-size: 20px; font-weight: 700; color: #fff; }\n    .budget-total { font-size: 11px; color: rgba(255,255,255,.5); font-weight: 600; }\n\n    /* ─── CITY ACCORDION ─── */\n    .city-list { padding: 8px; display: flex; flex-direction: column; gap: 4px; max-height: 460px; overflow-y: auto; scrollbar-width: none; }\n    .city-list::-webkit-scrollbar { display: none; }\n    .city-summary {\n      margin-bottom: 4px; padding: 10px 10px 9px;\n      border-radius: 11px; background: linear-gradient(135deg,rgba(41,171,226,.1),rgba(41,171,226,.03));\n      border: 1px solid rgba(41,171,226,.18);\n    }\n    .city-summary-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 8px; }\n    .city-summary-day {\n      font-family: \"JetBrains Mono\", monospace; font-size: 14px; font-weight: 700;\n      color: var(--blue-d);\n    }\n    .city-summary-day span { color: var(--dim); font-size: 10px; }\n    .city-summary-copy { font-size: 10px; font-weight: 700; color: var(--muted); white-space: nowrap; }\n    .city-progress { height: 5px; border-radius: 999px; background: rgba(160,174,190,.2); overflow: hidden; }\n    .city-progress-fill { height: 100%; border-radius: inherit; background: var(--blue-g); transition: width .25s ease; }\n    .city-group { position: relative; }\n    .city-row {\n      display: grid; grid-template-columns: 28px minmax(0,1fr) auto; align-items: center; gap: 9px;\n      padding: 8px; border-radius: 10px;\n      color: var(--muted); font-size: 12px; font-weight: 600;\n      cursor: pointer; transition: background .12s, color .12s, border-color .12s, box-shadow .12s; text-align: left; background: transparent; width: 100%; border: 1px solid transparent;\n    }\n    .city-row:hover { background: var(--bg); color: var(--text); }\n    .city-row.active { background: #EAF7FD; color: var(--blue-d); border-color: rgba(41,171,226,.28); box-shadow: inset 3px 0 0 var(--blue); }\n    .city-num {\n      width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center;\n      font-family: \"JetBrains Mono\", monospace; font-size: 10px; font-weight: 700;\n      background: var(--bg); color: var(--muted); flex-shrink: 0;\n    }\n    .city-row.active .city-num { background: var(--blue-g); color: #fff; }\n    .city-info { min-width: 0; }\n    .city-info strong { display: block; font-size: 12px; font-weight: 800; color: inherit; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n    .city-info span { display: block; margin-top: 1px; font-size: 10px; color: var(--dim); font-weight: 700; }\n    .city-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }\n    .city-duration {\n      padding: 2px 6px; border-radius: 999px;\n      background: var(--bg); border: 1px solid var(--border);\n      font-family: \"JetBrains Mono\", monospace; font-size: 9px; font-weight: 700;\n      color: var(--muted); white-space: nowrap;\n    }\n    .city-row.active .city-duration { background: #fff; color: var(--blue-d); border-color: rgba(41,171,226,.28); }\n    .city-wx { font-size: 12px; line-height: 1; opacity: .8; }\n    .city-days {\n      display: none; grid-template-columns: repeat(auto-fit, minmax(36px, 1fr)); gap: 4px;\n      padding: 3px 2px 7px 37px;\n    }\n    .city-days.open { display: grid; }\n    .city-day {\n      min-height: 26px; padding: 3px 5px; border-radius: 8px;\n      font-family: \"JetBrains Mono\", monospace; font-size: 9px; font-weight: 700;\n      background: var(--bg); border: 1px solid var(--border); color: var(--muted);\n      cursor: pointer; transition: background .12s, color .12s, border-color .12s;\n    }\n    .city-day:hover { background: rgba(41,171,226,.08); color: var(--blue-d); border-color: rgba(41,171,226,.2); }\n    .city-day.active { background: var(--blue-g); color: #fff; border-color: transparent; }\n    .city-day.done { opacity: .45; }\n    .city-day.today { border-color: var(--blue); color: var(--blue-d); }\n\n    /* ─── WORKSPACE ─── */\n    .workspace {\n      max-width: 1320px; margin: 0 auto;\n      display: grid; grid-template-columns: 200px minmax(0, 1fr) 320px;\n      gap: 14px; padding: 16px 24px 48px;\n      align-items: start;\n    }\n\n    /* ─── LEFT RAIL ─── */\n    .left-rail { position: sticky; top: 70px; display: flex; flex-direction: column; gap: 10px; }\n    .c-card {\n      background: var(--card); border: 1px solid var(--border);\n      border-radius: var(--r); overflow: hidden; box-shadow: var(--shadow);\n    }\n    .c-card-title {\n      padding: 11px 14px 7px; font-size: 10px; font-weight: 700;\n      color: var(--muted); letter-spacing: .08em; text-transform: uppercase;\n      border-bottom: 1px solid var(--border);\n    }\n    .tool-pad { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding: 8px; }\n    .tool-pad-btn {\n      display: flex; flex-direction: column; align-items: center; gap: 3px;\n      padding: 9px 6px; border-radius: 10px; font-size: 10px; font-weight: 700;\n      background: var(--bg); border: 1px solid var(--border); color: var(--muted);\n      cursor: pointer; transition: background .12s, color .12s, border-color .12s;\n    }\n    .tool-pad-btn:hover { background: rgba(41,171,226,.08); color: var(--blue-d); border-color: rgba(41,171,226,.25); }\n    .tool-pad-btn span { font-size: 16px; }\n\n    /* ─── FEED ─── */\n    .feed { display: flex; flex-direction: column; gap: 12px; }\n\n    .sec {\n      background: var(--card); border: 1px solid var(--border);\n      border-radius: 18px; overflow: hidden; box-shadow: var(--shadow);\n    }\n    .sec-head {\n      padding: 16px 18px 12px;\n      border-bottom: 1px solid var(--border);\n      display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;\n    }\n    .sec-kicker { font-size: 10px; font-weight: 700; color: var(--blue); letter-spacing: .1em; text-transform: uppercase; margin-bottom: 4px; }\n    .sec-head h2 { font-size: 16px; font-weight: 800; color: var(--navy); line-height: 1.3; }\n    .sec-desc { font-size: 11px; color: var(--muted); line-height: 1.6; font-weight: 500; margin-top: 4px; word-break: keep-all; }\n    .sec-body { padding: 14px 18px; }\n    .sec-action-btn {\n      padding: 6px 12px; border-radius: 999px;\n      background: var(--bg); border: 1px solid var(--border2);\n      color: var(--muted); font-size: 11px; font-weight: 700; white-space: nowrap;\n      flex-shrink: 0; transition: background .12s, color .12s;\n    }\n    .sec-action-btn:hover { background: rgba(41,171,226,.08); color: var(--blue-d); border-color: rgba(41,171,226,.25); }\n    .sec-action-btn.primary { background: var(--blue-g); color: #fff; border: none; box-shadow: 0 4px 12px rgba(41,171,226,.25); }\n    .sec-action-btn.primary:hover { opacity: .9; }\n\n    /* Timeline */\n    .tl { display: flex; flex-direction: column; }\n    .tl-node { display: grid; grid-template-columns: 54px 18px 1fr; gap: 10px; padding-bottom: 8px; }\n    .tl-t { padding-top: 10px; font-family: \"JetBrains Mono\", monospace; font-size: 10px; font-weight: 700; color: var(--dim); text-align: right; }\n    .tl-axis { display: flex; flex-direction: column; align-items: center; padding-top: 12px; position: relative; }\n    .tl-axis::after {\n      content: ''; position: absolute; top: 22px; bottom: -8px;\n      width: 1px; background: var(--border2); left: 50%; transform: translateX(-50%);\n    }\n    .tl-node:last-child .tl-axis::after { display: none; }\n    .tl-dot { width: 10px; height: 10px; border-radius: 50%; z-index: 1; border: 2px solid var(--bg); flex-shrink: 0; }\n    .tl-dot.spot  { background: var(--blue); box-shadow: 0 0 6px rgba(41,171,226,.5); }\n    .tl-dot.meal  { background: var(--amber); box-shadow: 0 0 6px rgba(245,158,11,.5); }\n    .tl-dot.rest  { background: var(--green); box-shadow: 0 0 6px rgba(11,185,122,.5); }\n    .tl-dot.risk  { background: var(--rose); box-shadow: 0 0 6px rgba(239,68,68,.5); }\n    .tl-dot.now   { animation: glow 1.6s ease infinite; }\n    @keyframes glow { 0%,100%{box-shadow:0 0 0 0 rgba(41,171,226,.6)} 50%{box-shadow:0 0 0 6px rgba(41,171,226,0)} }\n    .tl-card {\n      background: var(--bg); border: 1px solid var(--border); border-radius: 11px;\n      padding: 10px 12px; cursor: pointer; transition: border-color .15s, box-shadow .15s;\n    }\n    .tl-card:hover { border-color: var(--border2); box-shadow: var(--shadow); }\n    .tl-card.active {\n      background: #F7FCFF;\n      border-color: rgba(41,171,226,.45);\n      box-shadow: 0 0 0 3px rgba(41,171,226,.1), var(--shadow);\n    }\n    .tl-card.active .tl-route-place.dest {\n      background: #EAF7FD;\n      border-color: rgba(41,171,226,.35);\n    }\n    .tl-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; margin-bottom: 4px; }\n    .tl-card h3 { font-size: 13px; font-weight: 700; color: var(--navy); }\n    .tl-badge { padding: 2px 7px; border-radius: 999px; font-size: 10px; font-weight: 700; flex-shrink: 0; }\n    .tl-badge.spot { background: rgba(41,171,226,.1); color: var(--blue-d); }\n    .tl-badge.meal { background: rgba(245,158,11,.1); color: var(--amber); }\n    .tl-badge.rest { background: rgba(11,185,122,.1); color: var(--green); }\n    .tl-badge.risk { background: rgba(239,68,68,.1); color: var(--rose); }\n    .tl-card p { font-size: 11px; color: var(--muted); line-height: 1.55; word-break: keep-all; margin-bottom: 6px; }\n    .tl-tags { display: flex; flex-wrap: wrap; gap: 3px; }\n    .tl-tag { padding: 2px 6px; border-radius: 5px; font-size: 10px; font-weight: 600; background: var(--card); color: var(--muted); border: 1px solid var(--border); }\n    .tl-tag.warn { background: rgba(245,158,11,.08); color: var(--amber); border-color: rgba(245,158,11,.2); }\n    .tl-transport {\n      margin-top: 9px; padding: 8px 10px;\n      border-radius: 9px; background: var(--card); border: 1px solid var(--border);\n    }\n    .tl-route-flow {\n      display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);\n      align-items: center; gap: 10px;\n    }\n    .tl-route-place {\n      min-width: 0; padding: 9px 10px; border-radius: 10px;\n      background: var(--bg); border: 1px solid var(--border);\n    }\n    .tl-route-place.dest { background: #F7FCFF; border-color: rgba(41,171,226,.22); }\n    .tl-route-label {\n      display: block; margin-bottom: 3px;\n      font-size: 10px; font-weight: 800; color: var(--dim);\n      letter-spacing: .06em; text-transform: uppercase;\n    }\n    .tl-route-name {\n      display: block; min-width: 0; font-size: 13px; font-weight: 800; color: var(--navy);\n      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\n    }\n    .tl-route-mid {\n      min-width: 154px; align-self: stretch;\n      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;\n      padding: 6px 0; position: relative;\n    }\n    .tl-route-mid::before,\n    .tl-route-mid::after {\n      content: ''; position: absolute; top: 50%; width: 18px; height: 1px;\n      background: var(--border2);\n    }\n    .tl-route-mid::before { right: 100%; }\n    .tl-route-mid::after { left: 100%; }\n    .tl-route-arrow {\n      width: 26px; height: 26px; border-radius: 999px;\n      display: grid; place-items: center;\n      background: var(--blue-g); color: #fff; font-size: 14px; font-weight: 900;\n      box-shadow: 0 4px 12px rgba(41,171,226,.25);\n    }\n    .tl-transport-main { min-width: 0; }\n    .tl-transport-label { display: none; }\n    .tl-transport-rec { display: flex; align-items: baseline; justify-content: center; gap: 4px; font-size: 12px; font-weight: 800; color: var(--navy); white-space: nowrap; }\n    .tl-transport-rec span { color: var(--blue-d); }\n    .tl-transport-chip {\n      padding: 3px 7px; border-radius: 999px;\n      background: var(--bg); border: 1px solid var(--border);\n      font-size: 10px; font-weight: 700; color: var(--muted); white-space: nowrap;\n    }\n    button.tl-transport-chip:hover {\n      background: rgba(41,171,226,.08); color: var(--blue-d); border-color: rgba(41,171,226,.25);\n    }\n    .tl-transit-toggle {\n      margin-top: 6px; padding: 4px 10px; border-radius: 999px;\n      background: rgba(41,171,226,.1); border: 1px solid rgba(41,171,226,.22);\n      color: var(--blue-d); font-size: 11px; font-weight: 800;\n    }\n    .tl-transit-panel {\n      display: grid; grid-template-rows: 0fr;\n      opacity: 0; margin-top: 0;\n      transition: grid-template-rows .24s ease, opacity .18s ease, margin-top .24s ease;\n    }\n    .tl-card.transit-open .tl-transit-panel { grid-template-rows: 1fr; opacity: 1; margin-top: 9px; }\n    .tl-transit-inner { overflow: hidden; }\n    .tl-transit-list {\n      display: grid; gap: 6px; padding-top: 9px;\n      border-top: 1px dashed var(--border2);\n    }\n    .tl-transit-option {\n      display: grid; grid-template-columns: 42px minmax(0, 1fr) auto;\n      align-items: center; gap: 9px; padding: 9px 10px;\n      border-radius: 10px; background: var(--bg); border: 1px solid var(--border);\n      cursor: pointer; transition: background .12s, border-color .12s, box-shadow .12s;\n    }\n    .tl-transit-option:hover { background: #F7FCFF; border-color: rgba(41,171,226,.25); }\n    .tl-transit-option.active {\n      background: #EAF7FD;\n      border-color: rgba(41,171,226,.42);\n      box-shadow: inset 3px 0 0 var(--blue);\n    }\n    .tl-transit-option.has-detail {\n      display: block; padding: 0; overflow: hidden;\n    }\n    .tl-transit-option-head {\n      display: grid; grid-template-columns: 42px minmax(0, 1fr) auto;\n      align-items: center; gap: 9px; padding: 9px 10px;\n    }\n    .tl-transit-detail {\n      display: grid; grid-template-rows: 0fr;\n      opacity: 0;\n      transition: grid-template-rows .24s ease, opacity .18s ease;\n    }\n    .tl-transit-option.detail-open .tl-transit-detail {\n      grid-template-rows: 1fr; opacity: 1;\n    }\n    .tl-transit-detail-inner {\n      overflow: hidden; display: grid; gap: 6px;\n      padding: 0 10px;\n    }\n    .tl-transit-option.detail-open .tl-transit-detail-inner {\n      padding: 0 10px 10px;\n    }\n    .tl-transit-step {\n      display: grid; grid-template-columns: 34px minmax(0, 1fr) auto;\n      align-items: center; gap: 8px; padding: 8px;\n      border-radius: 9px; background: var(--card); border: 1px solid var(--border);\n      cursor: pointer;\n    }\n    .tl-transit-step.active {\n      border-color: rgba(41,171,226,.42);\n      box-shadow: inset 3px 0 0 var(--blue);\n    }\n    .tl-transit-mode {\n      display: grid; place-items: center; height: 32px; border-radius: 9px;\n      background: var(--card); border: 1px solid var(--border2);\n      font-size: 15px; font-weight: 800;\n    }\n    .tl-transit-main { min-width: 0; }\n    .tl-transit-main strong {\n      display: block; font-size: 12px; font-weight: 800; color: var(--navy);\n      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\n    }\n    .tl-transit-main span {\n      display: block; margin-top: 2px; font-size: 11px; font-weight: 600;\n      color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\n    }\n    .tl-transit-meta {\n      display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;\n    }\n    .tl-transit-meta span {\n      padding: 2px 6px; border-radius: 999px;\n      background: var(--card); border: 1px solid var(--border);\n      color: var(--muted); font-size: 10px; font-weight: 700;\n      white-space: nowrap;\n    }\n    .tl-transit-time {\n      font-family: \"JetBrains Mono\", monospace; font-size: 12px; font-weight: 800;\n      color: var(--blue-d); white-space: nowrap;\n    }\n    .tl-transit-note {\n      padding: 8px 10px; border-radius: 10px;\n      background: rgba(41,171,226,.06); border: 1px solid rgba(41,171,226,.18);\n      color: var(--muted); font-size: 11px; font-weight: 600; line-height: 1.45;\n    }\n    .tl-expense {\n      display: flex; align-items: center; gap: 8px;\n      margin-top: 10px; padding-top: 10px;\n      border-top: 1px dashed var(--border2);\n    }\n    .tl-expense label { font-size: 11px; font-weight: 800; color: var(--muted); white-space: nowrap; }\n    .tl-expense input {\n      width: 120px; height: 34px; padding: 0 12px;\n      border-radius: 9px; border: 1px solid var(--border2);\n      background: var(--card); color: var(--text);\n      font-family: \"JetBrains Mono\", monospace; font-size: 13px; font-weight: 700;\n    }\n    .tl-expense input:focus { border-color: var(--blue); outline: none; box-shadow: 0 0 0 3px rgba(41,171,226,.12); }\n    .tl-expense span { font-size: 11px; font-weight: 800; color: var(--muted); }\n    .reroute-drop {\n      display: none; margin-top: 8px; padding: 10px;\n      border-radius: 10px; border: 1px dashed rgba(41,171,226,.3);\n      background: rgba(41,171,226,.04);\n    }\n    .reroute-drop.open { display: block; }\n    .reroute-drop strong { display: block; font-size: 11px; font-weight: 700; color: var(--navy); margin-bottom: 3px; }\n    .reroute-drop p { font-size: 10px; color: var(--muted); margin-bottom: 7px; line-height: 1.5; }\n    .reroute-acts { display: flex; gap: 5px; }\n    .rd-yes { padding: 5px 10px; border-radius: 999px; background: var(--blue-g); color: #fff; font-size: 11px; font-weight: 700; }\n    .rd-no  { padding: 5px 10px; border-radius: 999px; background: var(--bg); border: 1px solid var(--border2); color: var(--muted); font-size: 11px; font-weight: 700; }\n\n    /* Budget */\n    .budget-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }\n    .b-block { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 12px; }\n    .b-block-title { font-size: 11px; font-weight: 700; color: var(--navy); margin-bottom: 10px; }\n    .b-row { display: flex; align-items: center; gap: 7px; margin-bottom: 8px; }\n    .b-icon {\n      width: 20px; height: 20px; flex-shrink: 0;\n      display: grid; place-items: center;\n      font-size: 15px; line-height: 1;\n    }\n    .b-name { font-size: 10px; color: var(--muted); width: 34px; flex-shrink: 0; }\n    .b-bar { flex: 1; height: 5px; border-radius: 999px; background: var(--border); overflow: hidden; }\n    .b-fill { height: 100%; border-radius: inherit; transition: width .5s ease; }\n    .b-val { font-family: \"JetBrains Mono\", monospace; font-size: 10px; font-weight: 700; color: var(--text); white-space: nowrap; }\n    .exp-form { display: flex; gap: 5px; margin-top: 4px; }\n    .exp-input { flex: 1; min-width: 0; padding: 7px 9px; border-radius: 8px; background: var(--card); border: 1px solid var(--border2); color: var(--text); font-size: 11px; }\n    .exp-input:focus { border-color: var(--blue); outline: none; }\n    .exp-num { width: 84px; padding: 7px 8px; border-radius: 8px; background: var(--card); border: 1px solid var(--border2); color: var(--text); font-size: 11px; }\n    .exp-cat-sel { padding: 7px 8px; border-radius: 8px; background: var(--card); border: 1px solid var(--border2); color: var(--text); font-size: 11px; }\n    .exp-add { padding: 7px 12px; border-radius: 8px; background: var(--blue-g); color: #fff; font-size: 12px; font-weight: 700; box-shadow: 0 3px 10px rgba(41,171,226,.25); }\n    .exp-log { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; max-height: 120px; overflow-y: auto; }\n    .exp-log-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 9px; border-radius: 7px; background: var(--card); border: 1px solid var(--border); font-size: 11px; }\n    .exp-log-left { display: flex; align-items: center; gap: 5px; }\n    .exp-cat-dot { width: 6px; height: 6px; border-radius: 50%; }\n    .exp-log-name { color: var(--text); font-weight: 600; }\n    .exp-log-amt { font-family: \"JetBrains Mono\", monospace; font-weight: 700; color: var(--gold); }\n    .exp-log-amt.over { color: var(--rose); }\n    .meal-reroute-panel {\n      display: none; margin-top: 8px; padding: 10px; border-radius: 9px;\n      border: 1px dashed rgba(245,158,11,.3); background: rgba(245,158,11,.04);\n    }\n    .meal-reroute-panel.open { display: block; }\n    .meal-reroute-panel strong { display: block; font-size: 11px; font-weight: 700; margin-bottom: 3px; color: var(--amber); }\n    .meal-reroute-panel p { font-size: 10px; color: var(--muted); margin-bottom: 7px; line-height: 1.5; }\n\n    /* ─── RIGHT STACK ─── */\n    .right-col { position: sticky; top: 70px; display: flex; flex-direction: column; gap: 10px; }\n    .map-wrap { background: var(--card); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; box-shadow: var(--shadow); }\n    .map-hd { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 14px 0; }\n    .map-hd-title { font-size: 13px; font-weight: 700; color: var(--navy); }\n    .map-hd-actions { display: flex; align-items: center; gap: 6px; }\n    .map-icon-btn {\n      width: 34px; height: 34px; border-radius: 999px;\n      display: grid; place-items: center;\n      background: var(--bg); border: 1px solid var(--border2);\n      color: var(--muted); font-size: 17px; font-weight: 800;\n      box-shadow: 0 3px 10px rgba(15,39,68,.07);\n      transition: background .12s, color .12s, border-color .12s, transform .12s;\n    }\n    .map-icon-btn:hover { background: rgba(41,171,226,.08); color: var(--blue-d); border-color: rgba(41,171,226,.25); transform: translateY(-1px); }\n    .map-hd-btn { padding: 5px 11px; border-radius: 999px; background: var(--blue-g); color: #fff; font-size: 10px; font-weight: 700; box-shadow: 0 3px 10px rgba(41,171,226,.25); }\n    .map-frame { height: 220px; margin: 10px 10px 0; border-radius: 12px; background: linear-gradient(135deg,#dceef8,#e8f4fb,#d4edf6); border: 1px solid var(--border); overflow: hidden; position: relative; }\n    .map-fallback { position: absolute; inset: 0; display: grid; place-items: center; padding: 16px; font-size: 12px; color: var(--muted); text-align: center; line-height: 1.6; }\n    .map-route-card { margin: 8px 10px 8px; padding: 10px 12px; border-radius: 10px; background: var(--bg); border: 1px solid var(--border); }\n    .map-route-card strong { display: block; font-size: 12px; font-weight: 700; color: var(--navy); margin-bottom: 2px; }\n    .map-route-card span { font-size: 11px; color: var(--muted); font-weight: 500; }\n    .map-btns { display: flex; gap: 6px; padding: 0 10px 10px; }\n    .map-btn { flex: 1; padding: 8px; border-radius: 9px; font-size: 11px; font-weight: 700; transition: opacity .15s; }\n    .map-btn:hover { opacity: .85; }\n    .map-btn.primary { background: var(--blue-g); color: #fff; box-shadow: 0 3px 10px rgba(41,171,226,.25); }\n    .map-btn.sec { background: var(--bg); border: 1px solid var(--border2); color: var(--muted); }\n\n    .wx-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: var(--shadow); }\n    .wx-bg { padding: 14px 16px; display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg,rgba(41,171,226,.07),rgba(11,185,122,.04)); }\n    .wx-icon-big { font-size: 36px; }\n    .wx-num { font-size: 30px; font-weight: 900; color: var(--navy); line-height: 1; }\n    .wx-cond { font-size: 11px; color: var(--muted); font-weight: 600; margin-top: 2px; }\n    .wx-outfit { padding: 10px 14px; border-top: 1px solid var(--border); font-size: 11px; color: var(--muted); line-height: 1.55; }\n    .wx-outfit strong { color: var(--navy); display: block; font-size: 11px; font-weight: 700; margin-bottom: 2px; }\n    .wx-btns { display: flex; gap: 6px; padding: 8px 10px 10px; }\n\n    .fatigue-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 14px 16px; box-shadow: var(--shadow); }\n    .fc-title { font-size: 12px; font-weight: 700; color: var(--navy); margin-bottom: 10px; }\n    .fc-body { display: flex; align-items: center; gap: 12px; }\n    .fc-ring-wrap { position: relative; width: 64px; height: 64px; flex-shrink: 0; }\n    .fc-ring-wrap svg { transform: rotate(-90deg); }\n    .fc-ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }\n    .fc-ring-num { font-family: \"JetBrains Mono\", monospace; font-size: 18px; font-weight: 700; line-height: 1; color: var(--navy); }\n    .fc-ring-denom { font-size: 9px; color: var(--muted); font-weight: 600; }\n    .fc-right { flex: 1; }\n    .fc-label { font-size: 12px; font-weight: 700; margin-bottom: 7px; color: var(--text); }\n    .fc-slider { width: 100%; accent-color: var(--blue); margin-bottom: 6px; }\n    .fc-hint { font-size: 10px; color: var(--muted); line-height: 1.5; }\n    .fc-btn { width: 100%; padding: 8px; border-radius: 9px; margin-top: 10px; font-size: 11px; font-weight: 700; background: rgba(11,185,122,.1); border: 1px solid rgba(11,185,122,.2); color: var(--green); transition: background .12s; }\n    .fc-btn:hover { background: rgba(11,185,122,.18); }\n\n    /* ─── TOAST ─── */\n    .toast {\n      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);\n      z-index: 300; min-width: 300px; max-width: 480px; padding: 12px 16px;\n      border-radius: 14px; display: flex; align-items: center; gap: 10px;\n      opacity: 0; transition: opacity .25s, transform .25s; pointer-events: none;\n      box-shadow: var(--shadow-md);\n    }\n    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: all; }\n    .toast.info   { background: var(--card); border: 1px solid var(--border2); }\n    .toast.warn   { background: #FFFBEB; border: 1px solid rgba(245,158,11,.3); }\n    .toast.danger { background: #FEF2F2; border: 1px solid rgba(239,68,68,.25); }\n    .toast.ok     { background: #ECFDF5; border: 1px solid rgba(11,185,122,.3); }\n    .toast-icon { font-size: 18px; flex-shrink: 0; }\n    .toast-body { flex: 1; }\n    .toast-title { font-size: 13px; font-weight: 700; color: var(--navy); }\n    .toast-msg { font-size: 11px; color: var(--muted); margin-top: 1px; line-height: 1.4; }\n    .toast-actions { display: flex; gap: 5px; }\n    .ta-btn { padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: var(--bg); color: var(--text); border: 1px solid var(--border); cursor: pointer; }\n    .ta-btn.primary { background: var(--blue-g); color: #fff; border: none; }\n    .ta-close { padding: 4px 7px; border-radius: 999px; background: transparent; color: var(--dim); font-size: 16px; border: 0; cursor: pointer; }\n\n    /* ─── OVERLAY ─── */\n    .overlay { position: fixed; inset: 0; z-index: 200; display: none; place-items: center; padding: 20px; background: rgba(15,39,68,.45); backdrop-filter: blur(8px); }\n    .overlay.show { display: grid; }\n    .modal-box { width: min(520px,100%); background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 22px; box-shadow: var(--shadow-md); animation: pop-in .2s ease; }\n    @keyframes pop-in { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:none} }\n    .modal-title { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 14px; }\n    #modalContent { margin-bottom: 14px; }\n    .modal-footer { display: flex; justify-content: flex-end; gap: 7px; }\n    .mf { padding: 9px 18px; border-radius: 999px; font-size: 13px; font-weight: 700; }\n    .mf.ghost { background: var(--bg); border: 1px solid var(--border2); color: var(--muted); }\n    .mf.primary { background: var(--blue-g); color: #fff; box-shadow: 0 4px 14px rgba(41,171,226,.3); }\n    .map-modal-box {\n      width: min(920px,100%); height: min(74vh,680px);\n      background: var(--card); border: 1px solid var(--border);\n      border-radius: 20px; padding: 16px; box-shadow: var(--shadow-md);\n      animation: pop-in .2s ease; display: flex; flex-direction: column;\n    }\n    .map-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }\n    .map-modal-title { font-size: 18px; font-weight: 800; color: var(--navy); }\n    .map-modal-close {\n      width: 36px; height: 36px; border-radius: 999px;\n      background: var(--bg); border: 1px solid var(--border2);\n      color: var(--muted); font-size: 20px; font-weight: 700;\n    }\n    .map-modal-frame { flex: 1; min-height: 320px; border-radius: 14px; overflow: hidden; border: 1px solid var(--border); background: var(--bg); }\n    .mi-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border-radius: 10px; background: var(--bg); border: 1px solid var(--border); font-size: 12px; margin-bottom: 5px; }\n    .mi-row strong { font-weight: 700; color: var(--navy); }\n    .mi-row span { color: var(--muted); font-weight: 600; }\n    .mi-emergency { padding: 11px; border-radius: 11px; background: rgba(239,68,68,.06); border: 1px solid rgba(239,68,68,.2); margin-bottom: 7px; }\n    .mi-emergency strong { font-size: 15px; font-weight: 900; color: var(--rose); }\n    .mi-emergency span { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; }\n    .mi-safe { padding: 11px; border-radius: 11px; background: rgba(11,185,122,.06); border: 1px solid rgba(11,185,122,.2); margin-bottom: 7px; }\n    .mi-safe strong { font-size: 13px; font-weight: 700; color: var(--green); }\n    .mi-safe span { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; }\n    .mi-phrase { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }\n    .mi-phrase button { padding: 6px 11px; border-radius: 999px; font-size: 11px; font-weight: 700; background: var(--bg); border: 1px solid var(--border2); color: var(--text); cursor: pointer; }\n    .mi-phrase button:hover { border-color: var(--blue); color: var(--blue-d); }\n    .mi-textarea { width: 100%; min-height: 64px; padding: 10px; border-radius: 10px; background: var(--bg); border: 1px solid var(--border2); color: var(--text); font-size: 13px; resize: none; margin-bottom: 7px; }\n    .mi-textarea:focus { border-color: var(--blue); outline: none; }\n    .mi-result { padding: 11px; border-radius: 10px; background: rgba(41,171,226,.06); border: 1px solid rgba(41,171,226,.2); font-size: 14px; font-weight: 700; color: var(--navy); min-height: 42px; }\n    .mi-album-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 7px; }\n    .mi-album-thumb { aspect-ratio: 1; border-radius: 9px; display: grid; place-items: center; font-size: 26px; background: var(--bg); border: 1px solid var(--border); }\n\n    /* ─── READABILITY BUMP ─── */\n    .brand { font-size: 16px; }\n    .topbar-trip,\n    .t-btn { font-size: 13px; }\n    .live-pill,\n    .dest-tag,\n    .budget-total { font-size: 12px; }\n    .budget-label { font-size: 11px; }\n    .budget-spent { font-size: 22px; }\n\n    .city-summary-day { font-size: 16px; }\n    .city-summary-day span,\n    .city-summary-copy,\n    .city-info span { font-size: 11px; }\n    .city-row,\n    .city-info strong,\n    .city-wx { font-size: 13px; }\n    .city-num,\n    .city-duration,\n    .city-day { font-size: 11px; }\n\n    .c-card-title,\n    .tool-pad-btn,\n    .sec-kicker,\n    .tl-t,\n    .tl-badge,\n    .tl-tag,\n    .tl-route-label,\n    .tl-transit-toggle,\n    .tl-transit-note,\n    .reroute-drop p,\n    .b-name,\n    .b-val,\n    .meal-reroute-panel p,\n    .map-hd-btn,\n    .fc-ring-denom,\n    .fc-hint { font-size: 11px; }\n    .tool-pad-btn span { font-size: 18px; }\n\n    .sec-head h2 { font-size: 18px; }\n    .sec-desc,\n    .sec-action-btn,\n    .tl-card p,\n    .tl-expense label,\n    .tl-expense span,\n    .reroute-drop strong,\n    .rd-yes,\n    .rd-no,\n    .b-block-title,\n    .exp-input,\n    .exp-num,\n    .exp-cat-sel,\n    .exp-log-item,\n    .meal-reroute-panel strong,\n    .map-route-card span,\n    .map-btn,\n    .wx-cond,\n    .wx-outfit,\n    .wx-outfit strong,\n    .tl-transit-main strong,\n    .tl-transit-time,\n    .fc-btn,\n    .toast-msg,\n    .ta-btn,\n    .mi-emergency span,\n    .mi-safe span,\n    .mi-phrase button { font-size: 12px; }\n    .tl-transit-main span { font-size: 12px; }\n    .tl-transit-meta span { font-size: 11px; }\n    .tl-card h3,\n    .tl-expense input,\n    .tl-route-name,\n    .exp-add,\n    .map-hd-title,\n    .map-route-card strong,\n    .fc-title,\n    .fc-label,\n    .toast-title,\n    .mf,\n    .mi-row,\n    .mi-safe strong,\n    .mi-textarea { font-size: 14px; }\n    .tl-transport-label { font-size: 10px; }\n    .tl-transport-rec,\n    .mi-emergency strong { font-size: 15px; }\n    .fc-ring-num,\n    .toast-icon { font-size: 20px; }\n    .mi-result { font-size: 15px; }\n\n    /* ─── RESPONSIVE ─── */\n    @media (max-width: 1100px) { .workspace { grid-template-columns: 180px minmax(0,1fr) 290px; } }\n    @media (max-width: 900px) {\n      .workspace { grid-template-columns: 1fr; }\n      .left-rail, .right-col { position: static; }\n      .budget-cols { grid-template-columns: 1fr; }\n    }\n    @media (max-width: 580px) {\n      .dest-hero-inner { flex-direction: column; align-items: flex-start; }\n      .dest-right { align-items: flex-start; width: 100%; }\n      .budget-bar { width: 100%; }\n      .topbar-trip { display: none; }\n      .workspace { padding: 12px 14px 36px; }\n      .day-strip-wrap { padding: 12px 14px 0; }\n      .tl-route-flow { grid-template-columns: 1fr; }\n      .tl-route-mid { min-width: 0; align-items: flex-start; padding: 6px 10px; }\n      .tl-route-mid::before,\n      .tl-route-mid::after { display: none; }\n      .tl-transport-rec { justify-content: flex-start; }\n    }\n  "
const GOOGLE_MAP_SCRIPT_ID = 'google-maps-travel-duration-script'
const GOOGLE_MAP_SCRIPT_SRC = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDaVmYg-OdmcaT1qDjLA-J-n5-df0XyWSw&callback=initMap&loading=async'

export default function AiTravelDuration() {
  useEffect(() => {
    
    /* ── 도시 그룹 (accordion 단위) ── */
    const cityGroups = [
      { id:'barcelona',    name:'바르셀로나',   wx:'☀',  range:'Day 1–5',   indices:[0,1,2,3,4] },
      { id:'madrid',       name:'마드리드',     wx:'☀',  range:'Day 6–9',   indices:[5,6,7,8] },
      { id:'sevilla',      name:'세비야',       wx:'☀',  range:'Day 10–13', indices:[9,10,11,12] },
      { id:'granada',      name:'그라나다',     wx:'🌤', range:'Day 14–16', indices:[13,14,15] },
      { id:'malaga',       name:'말라가',       wx:'☀',  range:'Day 17–19', indices:[16,17,18] },
      { id:'valencia',     name:'발렌시아',     wx:'☀',  range:'Day 20–22', indices:[19,20,21] },
      { id:'bilbao',       name:'빌바오',       wx:'🌧', range:'Day 23–25', indices:[22,23,24] },
      { id:'sansebastian', name:'산세바스티안', wx:'🌤', range:'Day 26–27', indices:[25,26] },
      { id:'zaragoza',     name:'사라고사',     wx:'☀',  range:'Day 28–29', indices:[27,28] },
      { id:'return',       name:'복귀',         wx:'✈',  range:'Day 30',    indices:[29] },
    ];
    
    /* ── 30일 일정 mock ── */
    const schedule = [
      { day:1,  city:'바르셀로나', wx:'☀',  base:'barcelona',    done:true  },
      { day:2,  city:'바르셀로나', wx:'☀',  base:'barcelona',    done:true  },
      { day:3,  city:'바르셀로나', wx:'🌦', base:'barcelona',    done:true  },
      { day:4,  city:'바르셀로나', wx:'🌦', base:'barcelona',    today:true },
      { day:5,  city:'바르셀로나', wx:'☁',  base:'barcelona'               },
      { day:6,  city:'마드리드',   wx:'☀',  base:'madrid',       cityStart:true },
      { day:7,  city:'마드리드',   wx:'☀',  base:'madrid'                  },
      { day:8,  city:'마드리드',   wx:'☁',  base:'madrid'                  },
      { day:9,  city:'마드리드',   wx:'🌧', base:'madrid'                  },
      { day:10, city:'세비야',     wx:'☀',  base:'sevilla',      cityStart:true },
      { day:11, city:'세비야',     wx:'☀',  base:'sevilla'                 },
      { day:12, city:'세비야',     wx:'🌤', base:'sevilla'                 },
      { day:13, city:'세비야',     wx:'☀',  base:'sevilla'                 },
      { day:14, city:'그라나다',   wx:'🌤', base:'granada',      cityStart:true },
      { day:15, city:'그라나다',   wx:'☀',  base:'granada'                 },
      { day:16, city:'그라나다',   wx:'☁',  base:'granada'                 },
      { day:17, city:'말라가',     wx:'☀',  base:'malaga',       cityStart:true },
      { day:18, city:'말라가',     wx:'☀',  base:'malaga'                  },
      { day:19, city:'말라가',     wx:'🌤', base:'malaga'                  },
      { day:20, city:'발렌시아',   wx:'☀',  base:'valencia',     cityStart:true },
      { day:21, city:'발렌시아',   wx:'☀',  base:'valencia'                },
      { day:22, city:'발렌시아',   wx:'☁',  base:'valencia'                },
      { day:23, city:'빌바오',     wx:'🌧', base:'bilbao',       cityStart:true },
      { day:24, city:'빌바오',     wx:'🌦', base:'bilbao'                  },
      { day:25, city:'빌바오',     wx:'☁',  base:'bilbao'                  },
      { day:26, city:'산세바스티안',wx:'🌤', base:'sansebastian', cityStart:true },
      { day:27, city:'산세바스티안',wx:'☀',  base:'sansebastian'            },
      { day:28, city:'사라고사',   wx:'☀',  base:'zaragoza',     cityStart:true },
      { day:29, city:'사라고사',   wx:'☁',  base:'zaragoza'                },
      { day:30, city:'복귀',       wx:'✈',  base:'return',       cityStart:true },
    ];
    
    /* ── 도시별 타임라인 데이터 ── */
    const cityData = {
      barcelona: {
        title:'바르셀로나 도보 미식 루트',
        desc:'숙소 출발·복귀 기준. 식당·날씨·안전 이슈는 기존 루트 반경 내에서만 대체.',
        stops:[
          { t:'09:00', name:'Praktik Garden', badge:'숙소 출발', kind:'rest', now:true, desc:'오늘 모든 경로의 기준점. 여기서 시작하고 여기로 돌아옵니다.', tags:['짐 없음','도보 시작'], safety:'safe' },
          { t:'09:20', name:'카사 바트요', badge:'예약 입장', kind:'spot', desc:'오전 입장으로 혼잡 줄이기. AI 가이드로 건물 역사 해설을 바로 켤 수 있습니다.', tags:['도보 12분','€35','포토'], safety:'safe' },
          { t:'12:40', name:'El Nacional', badge:'점심', kind:'meal', desc:'예상 €28. 초과 시 480m 이내 대체 식당만 재조회합니다. 관광 순서는 유지됩니다.', tags:['평균 €28','루트 내'], safety:'safe', mealReroute:true },
          { t:'15:20', name:'피카소 미술관', badge:'실내 대체 가능', kind:'spot', desc:'오후 비 예보 시 야외 산책 대신 이 실내 코스를 우선 배치합니다.', tags:['실내','예약 권장','비 대비'], safety:'safe' },
          { t:'18:40', name:'Cervecería Catalana', badge:'저녁', kind:'meal', desc:'카사 밀라 근처 타파스 저녁 후보. 대기 길면 주변 같은 가격대 식당으로 대체합니다.', tags:['평균 €24','타파스','대기 주의'], safety:'safe', mealReroute:true },
          { t:'21:30', name:'Passeig de Gracia 복귀', badge:'야간', kind:'risk', desc:'최단 골목보다 6분 더 걸리지만 최근 3년 내 사고 이력이 없는 대로변 경로입니다.', tags:['대로변 우회','18분'], safety:'warn', safeReroute:true },
        ]
      },
      madrid: {
        title:'마드리드 미술관과 광장 루트',
        desc:'Room Mate Alba 기준 프라도 → 레티로 → 솔 광장 연결.',
        stops:[
          { t:'08:40', name:'Room Mate Alba', badge:'숙소 출발', kind:'rest', desc:'마드리드 베이스. 프라도·솔 이동 피로 최소.', tags:['중심 숙소','지하철'], safety:'safe' },
          { t:'10:00', name:'프라도 미술관', badge:'미술관', kind:'spot', desc:'오전 예약. 비 오면 체류 연장 후보.', tags:['€15','실내'], safety:'safe' },
          { t:'13:10', name:'Mercado de San Miguel', badge:'점심', kind:'meal', desc:'예산 초과 알림 포인트. 평균 금액 자동 비교.', tags:['평균 €22','혼잡'], safety:'safe', mealReroute:true },
          { t:'16:20', name:'레티로 공원', badge:'휴식', kind:'rest', desc:'걷기 부담이 있으면 숙소 카페로 전환.', tags:['휴식','도보'], safety:'safe' },
          { t:'20:50', name:'솔 광장', badge:'야간 이동', kind:'risk', desc:'야간 대로변 경로 기본값. 안전 알림 연결.', tags:['대로변','택시 가능'], safety:'warn', safeReroute:true },
        ]
      },
      sevilla: {
        title:'세비야 구시가지와 플라멩코 루트',
        desc:'알카사르 → 히랄다 탑 → 플라멩코 공연. 폭염 주의 — 오전·저녁 집중.',
        stops:[
          { t:'08:00', name:'Hotel Amadeus', badge:'숙소 출발', kind:'rest', desc:'세비야 베이스. 구시가지 도보권.', tags:['구시가지 중심'], safety:'safe' },
          { t:'09:00', name:'알카사르', badge:'왕궁', kind:'spot', desc:'오전 예약 필수. 오후는 관광객 과밀.', tags:['€14.50','예약 필수'], safety:'safe' },
          { t:'12:30', name:'El Rinconcillo', badge:'점심', kind:'meal', desc:'1670년 창업 타파스 바. 현지 추천 최상위.', tags:['평균 €18','현지 맛집'], safety:'safe', mealReroute:true },
          { t:'19:00', name:'Casa de la Memoria', badge:'플라멩코', kind:'spot', desc:'소규모 공연장. 예약 필수 — 전날 마감 빈번.', tags:['€18','예약 필수','저녁'], safety:'safe' },
          { t:'22:00', name:'숙소 복귀', badge:'야간', kind:'risk', desc:'구시가지 골목 야간 소매치기 주의. 대로변 이용.', tags:['대로변 복귀'], safety:'warn', safeReroute:true },
        ]
      },
      granada: {
        title:'그라나다 알함브라와 알바이신 루트',
        desc:'알함브라 오전 예약 필수. 오후 알바이신 언덕 산책.',
        stops:[
          { t:'08:30', name:'Hotel Casa 1800', badge:'숙소 출발', kind:'rest', desc:'알함브라 도보 20분. 알바이신 뷰.', tags:['알람브라 근접'], safety:'safe' },
          { t:'09:00', name:'알함브라 궁전', badge:'예약 입장', kind:'spot', desc:'오전 슬롯만 입장 가능. 예약 번호 필수 지참.', tags:['€14','예약 필수','포토'], safety:'safe' },
          { t:'13:00', name:'Bodegas Castañeda', badge:'점심', kind:'meal', desc:'전통 타파스. 무료 타파스 제공 시간 확인.', tags:['평균 €16'], safety:'safe', mealReroute:true },
          { t:'16:00', name:'알바이신 전망대', badge:'전망', kind:'spot', desc:'알함브라 맞은편 언덕. 일몰 뷰 최상.', tags:['도보 25분','포토','일몰'], safety:'safe' },
          { t:'21:30', name:'숙소 복귀', badge:'야간', kind:'risk', desc:'알바이신 언덕 야간 단독 비권장. 택시 이용 권고.', tags:['택시 추천'], safety:'warn', safeReroute:true },
        ]
      },
      malaga: {
        title:'말라가 구시가지와 피카소 생가 루트',
        desc:'피카소 박물관 → 히브랄파로 성 → 말라게타 해변.',
        stops:[
          { t:'09:30', name:'Room Mate Valeria', badge:'숙소 출발', kind:'rest', desc:'말라가 구시가지 중심.', tags:['해변 도보권'], safety:'safe' },
          { t:'10:00', name:'피카소 박물관', badge:'미술관', kind:'spot', desc:'피카소 생가 인근. 오전이 한산.', tags:['€12','실내'], safety:'safe' },
          { t:'13:00', name:'El Pimpi', badge:'점심', kind:'meal', desc:'말라가 대표 와인 바. 해산물 추천.', tags:['평균 €22'], safety:'safe', mealReroute:true },
          { t:'16:00', name:'히브랄파로 성', badge:'전망', kind:'spot', desc:'항구와 해변 파노라마 뷰.', tags:['€3.5','도보 30분'], safety:'safe' },
          { t:'20:00', name:'말라게타 해변', badge:'석양', kind:'rest', desc:'해질녘 해변 산책. 저녁 전 여유.', tags:['무료','석양'], safety:'safe' },
        ]
      },
      valencia: {
        title:'발렌시아 예술과 파에야 루트',
        desc:'예술과학도시 → 중앙시장 → 라 말바로사 해변.',
        stops:[
          { t:'09:00', name:'SH Valencia Palace', badge:'숙소 출발', kind:'rest', desc:'발렌시아 구시가지 인근.', tags:['도보권'], safety:'safe' },
          { t:'10:00', name:'예술과학도시', badge:'건축', kind:'spot', desc:'칼라트라바 설계. 반일 코스 권장.', tags:['€38 통합','포토'], safety:'safe' },
          { t:'13:30', name:'La Pepica', badge:'점심', kind:'meal', desc:'헤밍웨이가 즐겨찾던 파에야 원조 레스토랑.', tags:['평균 €28','예약 권장'], safety:'safe', mealReroute:true },
          { t:'16:30', name:'발렌시아 중앙시장', badge:'쇼핑', kind:'spot', desc:'유럽 최대 재래시장. 스낵·과일 구매.', tags:['무료입장','현지 체험'], safety:'safe' },
          { t:'19:00', name:'라 말바로사 해변', badge:'석양', kind:'rest', desc:'발렌시아 메인 해변. 석양 타이밍 맞추기.', tags:['트램 이동','석양'], safety:'safe' },
        ]
      },
      bilbao: {
        title:'빌바오 구겐하임과 핀초스 루트',
        desc:'비스케이만 날씨 변동 큼. 우산 필수. 핀초스 바 탐방 저녁 집중.',
        stops:[
          { t:'10:00', name:'Gran Hotel Domine', badge:'숙소 출발', kind:'rest', desc:'구겐하임 바로 앞 위치.', tags:['구겐하임 도보 1분'], safety:'safe' },
          { t:'10:15', name:'구겐하임 미술관', badge:'미술관', kind:'spot', desc:'티타늄 외관 필수 포토. 내부 현대미술 컬렉션.', tags:['€16','포토'], safety:'safe' },
          { t:'13:30', name:'레스토랑 Etxanobe', badge:'점심', kind:'meal', desc:'빌바오 대표 바스크 요리. 예약 권장.', tags:['평균 €35'], safety:'safe', mealReroute:true },
          { t:'17:00', name:'카스코 비에호', badge:'구시가지', kind:'spot', desc:'빌바오 구시가지. 핀초스 바 밀집 구역.', tags:['도보 탐방'], safety:'safe' },
          { t:'20:00', name:'핀초스 바 투어', badge:'저녁', kind:'meal', desc:'Plaza Nueva 주변 5개 바 순차 방문.', tags:['바당 €8-12'], safety:'safe', mealReroute:true },
        ]
      },
      sansebastian: {
        title:'산세바스티안 미슐랭 핀초스 루트',
        desc:'세계 최고 밀도 미슐랭 레스토랑 도시. 파르테 비에하(구시가지) 집중.',
        stops:[
          { t:'09:30', name:'Hotel de Londres', badge:'숙소 출발', kind:'rest', desc:'콘차 해변 바로 앞. 최고 위치.', tags:['해변 즉시'], safety:'safe' },
          { t:'10:00', name:'콘차 해변', badge:'산책', kind:'rest', desc:'유럽 최고 도심 해변. 오전 산책 코스.', tags:['무료','포토'], safety:'safe' },
          { t:'13:00', name:'Bar Nestor', badge:'점심', kind:'meal', desc:'예약 없이 줄 서서 입장. 토마토 샐러드·스테이크 유명.', tags:['예약 불가','현금만'], safety:'safe', mealReroute:true },
          { t:'16:00', name:'몬테 이겔도', badge:'전망', kind:'spot', desc:'케이블카 탑승. 만 전경 포토 포인트.', tags:['€3.5 케이블카','포토'], safety:'safe' },
          { t:'20:00', name:'파르테 비에하 핀초스', badge:'저녁', kind:'meal', desc:'세계 최고 핀초스 바 투어. 1인 €30-40 예산.', tags:['바당 €6-10','핀초스'], safety:'safe', mealReroute:true },
        ]
      },
      zaragoza: {
        title:'사라고사 필라르 대성당과 무데하르 루트',
        desc:'바르셀로나↔마드리드 중간 거점. 무데하르 건축 세계유산 집중.',
        stops:[
          { t:'10:00', name:'Hotel Palafox', badge:'숙소 출발', kind:'rest', desc:'사라고사 중심가. 대성당 도보권.', tags:['구시가지 중심'], safety:'safe' },
          { t:'10:30', name:'필라르 대성당', badge:'성당', kind:'spot', desc:'에브로 강변 고야 프레스코화. 탑 등반 권장.', tags:['무료(탑 €3)','포토'], safety:'safe' },
          { t:'13:00', name:'La Rinconada de Lorenzo', badge:'점심', kind:'meal', desc:'아라곤 전통 요리. 현지 추천 맛집.', tags:['평균 €20'], safety:'safe', mealReroute:true },
          { t:'15:00', name:'알하페리아 궁전', badge:'왕궁', kind:'spot', desc:'이슬람-기독교 혼합 무데하르 건축 정수.', tags:['€5','세계유산'], safety:'safe' },
          { t:'20:00', name:'숙소 복귀', badge:'야간', kind:'risk', desc:'구시가지 야간 이동. 대로변 기본.', tags:['야간 주의'], safety:'warn', safeReroute:true },
        ]
      },
      return: {
        title:'공항 복귀와 여유 시간',
        desc:'출국일은 교통 안정성 우선. 변수 대응이 핵심.',
        stops:[
          { t:'08:30', name:'체크아웃', badge:'출발', kind:'rest', desc:'짐 보관 또는 바로 공항 이동.', tags:['체크아웃'], safety:'safe' },
          { t:'10:30', name:'기차역 이동', badge:'교통', kind:'spot', desc:'예산·시간 기준 기차/택시 비교.', tags:['교통비'], safety:'safe' },
          { t:'12:20', name:'공항 근처 식사', badge:'점심', kind:'meal', desc:'남은 예산 기준 마지막 식사.', tags:['평균 €18'], safety:'safe', mealReroute:true },
          { t:'14:00', name:'공항 도착', badge:'출국', kind:'spot', desc:'여유 있게 도착 루트 고정.', tags:['출국','완료'], safety:'safe' },
        ]
      }
    };
    
    const EUR_TO_KRW = 1470;
    function eurToKrw(amount) {
      return Math.round(amount * EUR_TO_KRW);
    }
    function formatKrw(amount) {
      return '₩' + Math.round(amount).toLocaleString('ko-KR');
    }
    function formatEurAsKrw(amount) {
      return formatKrw(eurToKrw(amount));
    }
    function localizeMoneyText(text) {
      return String(text).replace(/€\s?([\d,.]+)(?:\s?-\s?([\d,.]+))?/g, (_, from, to) => {
        const start = parseFloat(from.replace(/,/g, ''));
        if (!to) return formatEurAsKrw(start);
        const end = parseFloat(to.replace(/,/g, ''));
        return `${formatEurAsKrw(start)}-${formatEurAsKrw(end)}`;
      });
    }
    
    const modalData = {
      translate: {
        title:"실시간 번역",
        html:`<div class="mi-phrase"><button>이거 얼마예요?</button><button>화장실 어디예요?</button><button>영수증 주세요</button><button>택시 불러주세요</button><button>병원이 어디예요?</button><button>도와주세요!</button></div><textarea class="mi-textarea" placeholder="번역할 내용을 입력하세요..."></textarea><div class="mi-result">번역 결과가 여기에 표시됩니다.</div>`
      },
      emergency: {
        title:"긴급 정보",
        html:`<div class="mi-emergency"><strong>🚑 112</strong><span>스페인 응급·경찰·소방 통합 번호</span></div><div class="mi-row"><strong>🏥 Hospital Clínic</strong><span>도보 18분 · 지도 연결</span></div><div class="mi-row"><strong>🏛 한국 영사관</strong><span>+34 93 265 1500</span></div><div class="mi-row"><strong>🚨 긴급 영사</strong><span>+34 60 312 8534 (24h)</span></div>`
      },
      nearby: {
        title:"주변 편의시설",
        html:`${['💊 약국 — Farmàcia Canaletes — 230m','🏥 병원 — Hospital Clínic — 1.2km','🛒 편의점 — Supercor — 180m','💸 ATM — CaixaBank — 90m','🚻 공공 화장실 — 340m'].map(t=>`<div class="mi-row"><strong>${t.split(' — ')[0]}</strong><span>${t.split(' — ').slice(1).join(' · ')}</span></div>`).join('')}`
      },
      hotel: {
        title:"숙소 전략",
        html:`<p style="font-size:13px;color:var(--muted);margin-bottom:12px;line-height:1.6">투어 밀도·예산·교통 허브 기준으로 이동마다 다음 거점을 재배치합니다.</p><div class="mi-safe"><strong>Praktik Garden, 바르셀로나</strong><span>Day 1-5 · 예약 완료</span></div><div class="mi-safe"><strong>Room Mate Alba, 마드리드</strong><span>Day 6-9 · AI 추천</span></div><div class="mi-row"><strong>Hotel Amadeus, 세비야</strong><span>Day 10-13</span></div><div class="mi-row"><strong>Hotel Casa 1800, 그라나다</strong><span>Day 14-16</span></div><div class="mi-row"><strong>이하 6개 도시 숙소...</strong><span>AI 후보 선정 중</span></div>`
      },
      budget: {
        title:"예산 분석",
        html:`<div class="mi-row"><strong>총 지출</strong><span style="font-family:'JetBrains Mono',monospace;color:var(--gold)">${formatEurAsKrw(578)} / ${formatEurAsKrw(3200)}</span></div><div class="mi-row"><strong>오늘 지출</strong><span>${formatEurAsKrw(94)}</span></div><div class="mi-row"><strong>남은 예산</strong><span style="color:var(--green)">${formatEurAsKrw(2622)}</span></div><div class="mi-row"><strong>일 평균 예산</strong><span>${formatEurAsKrw(107)}</span></div><div class="mi-row"><strong>적용 환율</strong><span>1 EUR = ${formatKrw(EUR_TO_KRW)}</span></div><div class="mi-row"><strong>식사 위험도</strong><span style="color:var(--amber)">82% 소진 — 주의</span></div>`
      },
      fatigue: {
        title:"피로도 상세",
        html:`${[['🦶 오늘 도보','8.4km (목표 10km)'],['🚇 이동 횟수','4회'],['☕ 휴식 후보','카페 40분 추가 가능'],['📊 입력 피로도','6/10 · 카페 휴식 추천']].map(([k,v])=>`<div class="mi-row"><strong>${k}</strong><span>${v}</span></div>`).join('')}`
      },
      album: {
        title:"여행 앨범",
        html:`<p style="font-size:13px;color:var(--muted);margin-bottom:12px;line-height:1.6">여행 중 저장한 사진과 메모. 종료 후 날짜별 타임라인으로 정리됩니다.</p><div class="mi-album-grid">${['🌇','🏛','🍝','🌊','🎭','🌄'].map(e=>`<div class="mi-album-thumb">${e}</div>`).join('')}</div>`
      },
      safety: {
        title:"야간 안전 정보",
        html:`<div class="mi-emergency"><strong>⚠️ Carrer de Sant Pau</strong><span>최근 3년 소매치기 5건 · 야간 단독 비권장</span></div><div class="mi-safe"><strong>✓ Passeig de Gracia</strong><span>+6분 · 조명 충분 · 사고 이력 없음</span></div><div class="mi-row"><strong>권고</strong><span>야간 이동 시 대로변 우선, 스마트폰 노출 최소화</span></div>`
      }
    };
    
    /* ── state ── */
    let activeIdx = 3; // Day 4 (오늘)
    let activeStopIdx = 0;
    let totalSpent = 578;
    const total = 3200;
    let fatigueVal = 6;
    let openTransitKey = '';
    let transitLoadingKey = '';
    let transitResults = {};
    let routeModeResults = {};
    let selectedTravelMode = 'WALKING';
    let activeTransitStepIdx = null;
    let expenses = [
      { name:'아침 카페', cat:'meal', amt:12 },
      { name:'지하철 L5', cat:'transport', amt:2.4 }
    ];
    let stopExpenses = {};
    let mapReady = false;
    let mapModalOpen = false;
    
    function refreshMap() {
      if (!mapReady || !window.google) return;
      renderRouteMap('liveMap');
      if (mapModalOpen) renderRouteMap('modalMap');
    }
    
    function syncDayView() {
      activeStopIdx = 0;
      selectedTravelMode = 'WALKING';
      activeTransitStepIdx = null;
      renderCityAccordion();
      renderTL();
      refreshMap();
      requestSimpleRoute(activeStopIdx, 'walk');
    }
    
    function stopExpenseKey(day, stopIdx) {
      return `${day}-${stopIdx}`;
    }
    
    function transitPanelKey(day, stopIdx) {
      return `${day}-${stopIdx}`;
    }
    
    function modeResultKey(day, stopIdx, mode) {
      return `${day}-${stopIdx}-${mode}`;
    }
    
    function getModeOptions(stop, i) {
      const day = schedule[activeIdx].day;
      const walkLive = routeModeResults[modeResultKey(day, i, 'walk')];
      const taxiLive = routeModeResults[modeResultKey(day, i, 'taxi')];
      const transitLive = routeModeResults[modeResultKey(day, i, 'transit')];
      const fallbackWalk = i === 0
        ? { time:'0분', desc:'숙소 앞에서 바로 일정 시작', minutes:0 }
        : stop.kind === 'risk'
          ? { time:'18분', desc:'대로변 우회 · 골목길 회피', minutes:18 }
          : { time:i % 2 ? '12분' : '15분', desc:'현재 루트 유지 · 골목길 포함', minutes:i % 2 ? 12 : 15 };
      if (i === 0) {
        return [
          { mode:'walk', icon:'🚶', title:'도보 시작', desc:'숙소 앞에서 바로 일정 시작', time:'0분', minutes:0 },
          { mode:'info', icon:'↩', title:'복귀 지점', desc:'일정 종료 후 같은 숙소로 돌아오기', time:'고정', minutes:999 }
        ];
      }
      if (stop.kind === 'risk') {
        return [
          { mode:'taxi', icon:'🚕', title:'택시', desc:taxiLive?.desc || '가까운 대로변 승차 · 야간 이동 우선', time:taxiLive?.time || '조회', minutes:taxiLive?.minutes ?? 999 },
          { mode:'walk', icon:'🚶', title:'도보', desc:walkLive?.desc || fallbackWalk.desc, time:walkLive?.time || fallbackWalk.time, minutes:walkLive?.minutes ?? fallbackWalk.minutes },
          { mode:'transit', icon:'🚇', title:'대중교통', desc:transitLive?.desc || '정류장/역 기반 경로 조회', time:transitLive?.time || '조회', minutes:transitLive?.minutes ?? 999 }
        ];
      }
      return [
        { mode:'walk', icon:'🚶', title:'도보', desc:walkLive?.desc || fallbackWalk.desc, time:walkLive?.time || fallbackWalk.time, minutes:walkLive?.minutes ?? fallbackWalk.minutes },
        { mode:'transit', icon:'🚇', title:'대중교통', desc:transitLive?.desc || '역/정류장 승하차 정보 조회', time:transitLive?.time || '조회', minutes:transitLive?.minutes ?? 999 },
        { mode:'taxi', icon:'🚕', title:'택시', desc:taxiLive?.desc || '가까운 승차 지점 호출 · 교통 상황 반영 예정', time:taxiLive?.time || '조회', minutes:taxiLive?.minutes ?? 999 }
      ];
    }
    
    function getFastestMode(stop, i) {
      return getModeOptions(stop, i).reduce((best, opt) => opt.minutes < best.minutes ? opt : best);
    }
    
    function getStopExpenseTotal() {
      return Object.values(stopExpenses).reduce((sum, e) => sum + e.amt, 0);
    }
    
    function getTotalSpent() {
      return totalSpent + getStopExpenseTotal();
    }
    
    function getTransportPlan(stop, i) {
      const fastest = getFastestMode(stop, i);
      return {
        rec:fastest.title,
        detail:fastest.time,
        options:getModeOptions(stop, i).map(opt => `${opt.title} ${opt.time}`)
      };
    }
    
    function getTransitDemoOptions(stop, i) {
      const key = transitPanelKey(schedule[activeIdx].day, i);
      const live = transitResults[key];
      if (transitLoadingKey === key) {
        return getModeOptions(stop, i).map(opt => opt.mode === 'transit' ? {
          ...opt,
          loading:true,
          detail:[{ icon:'🚇', title:'대중교통 경로 조회 중', desc:'Google Transit 데이터로 승차 위치와 노선을 확인하고 있습니다.', time:'...' }]
        } : opt);
      }
      if (live) {
        return getModeOptions(stop, i).map(opt => opt.mode === 'transit' ? { ...opt, detail:live } : opt);
      }
      return getModeOptions(stop, i);
    }
    
    function getTransitDetailOptions(stop, i) {
      const key = transitPanelKey(schedule[activeIdx].day, i);
      const live = transitResults[key];
      if (transitLoadingKey === key) {
        return [
          { icon:'🚇', title:'대중교통 경로 조회 중', desc:'Google Transit 데이터로 승차 위치와 노선을 확인하고 있습니다.', time:'...' }
        ];
      }
      return live || [];
    }
    
    function getRouteInfo(stops, stop, i) {
      const stopText = `${stop.name || ''} ${stop.badge || ''}`;
      const isReturn = /복귀/i.test(stopText);
      const firstStopName = stops[0]?.name || '숙소';
      const hotelName = isReturn ? (stop.name || firstStopName).replace(/\s*복귀$/, '') : firstStopName;
      const origin = i === 0 ? hotelName : (stops[i - 1]?.name || '이전 장소');
      const destination = i === 0 ? '일정 시작' : isReturn ? (stop.name || '숙소').replace(/\s*복귀$/, '') : stop.name;
      const label = isReturn ? '복귀 이동' : i === 0 ? '첫 이동' : '장소 간 이동';
      return { origin, destination, label };
    }
    
    function getHotelReturnStop(stops) {
      const first = stops[0] || {};
      const hotelName = first.name || '숙소';
      return {
        t:'21:30',
        name:`${hotelName} 복귀`,
        badge:'숙소 복귀',
        kind:'rest',
        desc:'하루 일정을 마치고 숙소로 돌아옵니다. 다음 날 이동을 위해 복귀 시간을 고정합니다.',
        tags:['숙소 도착','일정 종료'],
        safety:'safe'
      };
    }
    
    function getDayStops(stops) {
      const last = stops[stops.length - 1] || {};
      const alreadyReturns = /숙소|hotel|Hotel|복귀/i.test(`${last.name || ''} ${last.badge || ''}`);
      return alreadyReturns ? stops : [...stops, getHotelReturnStop(stops)];
    }
    
    function getMapPoints(base) {
      const pts = {
        barcelona:[{lat:41.3932,lng:2.1699},{lat:41.3917,lng:2.1649},{lat:41.3915,lng:2.1686},{lat:41.3852,lng:2.1809},{lat:41.3927,lng:2.1587},{lat:41.3950,lng:2.1702}],
        madrid:[{lat:40.4128,lng:-3.7002},{lat:40.4138,lng:-3.6921},{lat:40.4154,lng:-3.7089},{lat:40.4153,lng:-3.6844},{lat:40.4169,lng:-3.7035}],
        sevilla:[{lat:37.3861,lng:-5.9928},{lat:37.3826,lng:-5.9910},{lat:37.3891,lng:-5.9945},{lat:37.3761,lng:-5.9866}],
        granada:[{lat:37.1773,lng:-3.5986},{lat:37.1760,lng:-3.5880},{lat:37.1808,lng:-3.6003},{lat:37.1722,lng:-3.5967}],
        malaga:[{lat:36.7213,lng:-4.4217},{lat:36.7196,lng:-4.4189},{lat:36.7253,lng:-4.4176},{lat:36.7115,lng:-4.3923}],
        valencia:[{lat:39.4699,lng:-0.3763},{lat:39.4539,lng:-0.3688},{lat:39.4736,lng:-0.3790},{lat:39.4560,lng:-0.3214}],
        bilbao:[{lat:43.2630,lng:-2.9350},{lat:43.2592,lng:-2.9284},{lat:43.2604,lng:-2.9466},{lat:43.2556,lng:-2.9237}],
        sansebastian:[{lat:43.3183,lng:-1.9812},{lat:43.3226,lng:-1.9753},{lat:43.3212,lng:-1.9880},{lat:43.3099,lng:-2.0016}],
        zaragoza:[{lat:41.6561,lng:-0.8773},{lat:41.6584,lng:-0.8752},{lat:41.6502,lng:-0.8831},{lat:41.6601,lng:-0.8705}],
        return:[{lat:41.6561,lng:-0.8773},{lat:41.2971,lng:-0.9170}]
      };
      return pts[base] || pts.barcelona;
    }
    
    function getRouteSegment(base, stopIdx) {
      const routePoints = [...getMapPoints(base), getMapPoints(base)[0]];
      const selectedIdx = Math.max(0, Math.min(stopIdx, routePoints.length - 1));
      return selectedIdx === 0 ? [routePoints[0]] : [routePoints[selectedIdx - 1], routePoints[selectedIdx]];
    }
    
    function updateActiveRouteSummary(dayStops) {
      const stop = dayStops[activeStopIdx];
      if (!stop) return;
      const transport = getTransportPlan(stop, activeStopIdx);
      const route = getRouteInfo(dayStops, stop, activeStopIdx);
      setRoute(`${route.origin} → ${route.destination}`, `${transport.rec} ${transport.detail}`);
    }
    
    function cleanStepText(html) {
      const div = document.createElement('div');
      div.innerHTML = html || '';
      return div.textContent.replace(/\s+/g, ' ').trim();
    }
    
    function latLngLiteral(latLng) {
      if (!latLng) return null;
      return { lat: latLng.lat(), lng: latLng.lng() };
    }
    
    function formatTransitFare(route) {
      if (route.fare?.text) return route.fare.text;
      return '요금 정보 없음';
    }
    
    function parseDurationMinutes(text) {
      const hours = text?.match(/(\d+)\s*시간/);
      const mins = text?.match(/(\d+)\s*분/);
      return (hours ? parseInt(hours[1], 10) * 60 : 0) + (mins ? parseInt(mins[1], 10) : 0);
    }
    
    function getTransitIcon(vehicleName) {
      if (/버스|bus/i.test(vehicleName)) return '🚌';
      if (/트램|tram|light rail/i.test(vehicleName)) return '🚊';
      if (/기차|train|rail/i.test(vehicleName)) return '🚆';
      if (/지하철|subway|metro/i.test(vehicleName)) return '🚇';
      return '🚇';
    }
    
    function formatTransitResult(result) {
      const route = result.routes?.[0];
      const leg = route?.legs?.[0];
      if (!leg) return null;
      const fareText = formatTransitFare(route);
      const options = leg.steps.map((step, idx) => {
        const stepRoute = {
          stepIdx:idx,
          path:step.path?.map(latLngLiteral).filter(Boolean) || [],
          start:latLngLiteral(step.start_location),
          end:latLngLiteral(step.end_location),
          mode:step.travel_mode
        };
        if (step.travel_mode === 'TRANSIT' && step.transit) {
          const line = step.transit.line;
          const vehicle = line.vehicle?.name || '대중교통';
          const shortName = line.short_name || line.name || vehicle;
          const depart = step.transit.departure_stop?.name || '승차 정류장';
          const arrive = step.transit.arrival_stop?.name || '하차 정류장';
          const headsign = step.transit.headsign || '';
          const stopCount = step.transit.num_stops ? `${step.transit.num_stops}개 정류장` : '';
          const departTime = step.transit.departure_time?.text || '';
          const arriveTime = step.transit.arrival_time?.text || '';
          const meta = [
            headsign ? `${headsign} 방면` : '',
            stopCount,
            departTime && arriveTime ? `${departTime} → ${arriveTime}` : '',
            fareText !== '요금 정보 없음' ? fareText : ''
          ].filter(Boolean);
          return {
            icon:getTransitIcon(vehicle),
            title:`${vehicle} ${shortName}`,
            desc:`${depart}에서 승차 · ${arrive}에서 하차`,
            time:step.duration?.text || '',
            meta,
            route:stepRoute
          };
        }
        const walkTo = cleanStepText(step.instructions);
        return {
          icon:'🚶',
          title:'도보 이동',
          desc:walkTo || '정류장까지 이동',
          time:step.duration?.text || '',
          meta:[step.distance?.text || '', step.duration?.text || ''].filter(Boolean),
          route:stepRoute
        };
      });
      options.unshift({
        icon:'💳',
        title:`총 ${leg.duration?.text || '시간 정보 없음'}`,
        desc:`${leg.distance?.text || '거리 정보 없음'} · ${fareText}`,
        time:leg.departure_time?.text || '출발',
        meta:[
          leg.departure_time?.text && leg.arrival_time?.text ? `${leg.departure_time.text} → ${leg.arrival_time.text}` : '',
          `${options.filter(opt => opt.route?.mode === 'TRANSIT').length}개 대중교통 구간`
        ].filter(Boolean),
        route:{
          stepIdx:null,
          path:leg.steps.flatMap(step => step.path?.map(latLngLiteral).filter(Boolean) || []),
          start:latLngLiteral(leg.start_location),
          end:latLngLiteral(leg.end_location),
          mode:'TRANSIT_SUMMARY'
        }
      });
      return options;
    }
    
    function formatSimpleRouteResult(result, mode) {
      const leg = result.routes?.[0]?.legs?.[0];
      if (!leg) return null;
      const title = mode === 'taxi' ? '택시' : '도보';
      const icon = mode === 'taxi' ? '🚕' : '🚶';
      const distance = leg.distance?.text || '거리 정보 없음';
      const duration = leg.duration?.text || '시간 정보 없음';
      return {
        mode,
        icon,
        title,
        desc:`${duration} · ${distance}`,
        time:duration,
        minutes:parseDurationMinutes(duration) || 999,
        route:{
          stepIdx:null,
          path:leg.steps.flatMap(step => step.path?.map(latLngLiteral).filter(Boolean) || []),
          start:latLngLiteral(leg.start_location),
          end:latLngLiteral(leg.end_location),
          mode:mode === 'taxi' ? 'DRIVING' : 'WALKING'
        }
      };
    }
    
    function requestSimpleRoute(stopIdx, mode) {
      const s = schedule[activeIdx];
      const key = modeResultKey(s.day, stopIdx, mode);
      const p = getRouteSegment(s.base, stopIdx);
      if (!window.google || !google.maps?.DirectionsService || p.length < 2) return;
      const directionsService = new google.maps.DirectionsService();
      directionsService.route({
        origin:p[0],
        destination:p[1],
        travelMode:mode === 'taxi' ? google.maps.TravelMode.DRIVING : google.maps.TravelMode.WALKING
      }, (result, status) => {
        const formatted = status === 'OK' && result ? formatSimpleRouteResult(result, mode) : null;
        if (formatted) routeModeResults[key] = formatted;
        renderTL();
        refreshMap();
      });
    }
    
    function requestTransitRoute(stopIdx) {
      const s = schedule[activeIdx];
      const key = transitPanelKey(s.day, stopIdx);
      const p = getRouteSegment(s.base, stopIdx);
      if (!window.google || !google.maps?.DirectionsService || p.length < 2) {
        transitResults[key] = [
          { icon:'ℹ', title:'대중교통 조회 불가', desc:'출발/도착지가 같은 기준점이거나 Google Maps가 아직 준비되지 않았습니다.', time:'-' }
        ];
        renderTL();
        return;
      }
    
      transitLoadingKey = key;
      renderTL();
      const directionsService = new google.maps.DirectionsService();
      directionsService.route({
        origin:p[0],
        destination:p[1],
        travelMode:google.maps.TravelMode.TRANSIT,
        transitOptions:{ departureTime:new Date() }
      }, (result, status) => {
        transitLoadingKey = '';
        const formatted = status === 'OK' && result ? formatTransitResult(result) : null;
        transitResults[key] = formatted || [
          { icon:'ℹ', title:'대중교통 경로 없음', desc:`이 구간은 Google Transit 응답이 없습니다. 상태: ${status}`, time:'-' }
        ];
        const summary = formatted?.[0];
        if (summary) {
          routeModeResults[modeResultKey(s.day, stopIdx, 'transit')] = {
            mode:'transit',
            icon:'🚇',
            title:'대중교통',
            desc:summary.desc,
            time:summary.title.replace(/^총\s*/, ''),
            minutes:parseDurationMinutes(summary.title) || 999,
            route:summary.route
          };
        }
        openTransitKey = key;
        renderTL();
        refreshMap();
      });
    }
    
    /* ── 도시 accordion 렌더 ── */
    function renderCityAccordion() {
      const activeGroup = cityGroups.find(g => g.indices.includes(activeIdx));
      const totalDays = schedule.length;
      const activeDay = schedule[activeIdx].day;
      const progress = Math.round((activeDay / totalDays) * 100);
    
      const cityHtml = cityGroups.map((g, gi) => {
        const isOpen = g === activeGroup;
        const stayDays = g.indices.length;
        return `
          <div class="city-group">
            <button class="city-row${isOpen ? ' active' : ''}" data-group="${g.id}">
              <div class="city-num">${String(gi + 1).padStart(2,'0')}</div>
              <div class="city-info"><strong>${g.name}</strong><span>${g.range}</span></div>
              <div class="city-meta">
                <span class="city-duration">${stayDays}일</span>
                <span class="city-wx">${g.wx}</span>
              </div>
            </button>
            <div class="city-days${isOpen ? ' open' : ''}">
              ${g.indices.map(idx => {
                const s = schedule[idx];
                const cls = ['city-day',
                  idx === activeIdx ? 'active' : '',
                  s.done  ? 'done'  : '',
                  s.today ? 'today' : '',
                ].filter(Boolean).join(' ');
                return `<button class="${cls}" data-idx="${idx}">D${String(s.day).padStart(2,'0')}</button>`;
              }).join('')}
            </div>
          </div>`;
      }).join('');
    
      document.getElementById('cityAccordion').innerHTML = `
        <div class="city-summary">
          <div class="city-summary-top">
            <div class="city-summary-day">D${String(activeDay).padStart(2,'0')} <span>/ ${totalDays}</span></div>
            <div class="city-summary-copy">${cityGroups.length}개 구간</div>
          </div>
          <div class="city-progress" aria-label="여행 진행률 ${progress}%">
            <div class="city-progress-fill" style="width:${progress}%"></div>
          </div>
        </div>
        ${cityHtml}`;
    
      document.querySelectorAll('[data-group]').forEach(btn => {
        btn.addEventListener('click', () => {
          const g = cityGroups.find(g => g.id === btn.dataset.group);
          if (!g) return;
          const todayIdx = g.indices.find(i => schedule[i].today);
          activeIdx = todayIdx !== undefined ? todayIdx : g.indices[0];
          syncDayView();
        });
      });
    
      document.querySelectorAll('.city-day[data-idx]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          activeIdx = parseInt(btn.dataset.idx);
          syncDayView();
        });
      });
    }
    
    function renderTL() {
      const s = schedule[activeIdx];
      const d = cityData[s.base];
      const statusLabel = s.today ? 'LIVE' : s.done ? 'DONE' : 'UPCOMING';
      document.getElementById('tlKicker').textContent = `DAY ${String(s.day).padStart(2,'0')} · ${statusLabel}`;
      document.getElementById('tlTitle').textContent = d.title;
      document.getElementById('tlDesc').textContent = d.desc;
      const dayStops = getDayStops(d.stops);
      activeStopIdx = Math.max(0, Math.min(activeStopIdx, dayStops.length - 1));
      document.getElementById('tl').innerHTML = dayStops.map((stop, i) => {
        const transport = getTransportPlan(stop, i);
        const route = getRouteInfo(dayStops, stop, i);
        const transitKey = transitPanelKey(s.day, i);
        const transitOpen = openTransitKey === transitKey;
        const transitOptions = getTransitDemoOptions(stop, i);
        const transitDetails = getTransitDetailOptions(stop, i);
        const detailOpen = i === activeStopIdx && selectedTravelMode === 'TRANSIT' && transitDetails.length > 0;
        const activeDetailStep = i === activeStopIdx ? activeTransitStepIdx : null;
        const activeMode = i === activeStopIdx ? selectedTravelMode : '';
        return `
        <div class="tl-node">
          <div class="tl-t">${stop.t}</div>
          <div class="tl-axis"><span class="tl-dot ${stop.kind}${stop.now && s.today ? ' now' : ''}"></span></div>
          <div>
            <div class="tl-card${i === activeStopIdx ? ' active' : ''}${transitOpen ? ' transit-open' : ''}" data-stop-idx="${i}">
              <div class="tl-card-top">
                <h3>${stop.name}</h3>
                <span class="tl-badge ${stop.kind}">${stop.badge}</span>
              </div>
              <p>${localizeMoneyText(stop.desc)}</p>
              <div class="tl-tags">
                ${stop.tags.map(t=>`<span class="tl-tag">${localizeMoneyText(t)}</span>`).join('')}
                ${stop.safety==='warn'?'<span class="tl-tag warn">⚠ 야간 주의</span>':''}
              </div>
              <div class="tl-transport">
                <div class="tl-route-flow">
                  <div class="tl-route-place">
                    <span class="tl-route-label">출발</span>
                    <span class="tl-route-name">${route.origin}</span>
                  </div>
                  <div class="tl-route-mid">
                    <div class="tl-route-arrow">→</div>
                    <div class="tl-transport-main">
                      <span class="tl-transport-label">${route.label}</span>
                      <div class="tl-transport-rec">${transport.rec} <span>${transport.detail}</span></div>
                    </div>
                    <button class="tl-transit-toggle" data-transit-toggle="${transitKey}">${transitOpen ? '이동수단 접기' : '이동수단 보기'}</button>
                  </div>
                  <div class="tl-route-place dest">
                    <span class="tl-route-label">도착</span>
                    <span class="tl-route-name">${route.destination}</span>
                  </div>
                </div>
                <div class="tl-transit-panel">
                  <div class="tl-transit-inner">
                    <div class="tl-transit-list">
                      ${transitOptions.map((opt, oi) => opt.mode === 'transit' ? `
                        <div class="tl-transit-option has-detail${activeMode === 'TRANSIT' ? ' active' : ''}${detailOpen ? ' detail-open' : ''}" data-transit-step="${oi}" data-mode="${opt.mode}">
                          <div class="tl-transit-option-head">
                            <div class="tl-transit-mode">${opt.icon}</div>
                            <div class="tl-transit-main">
                              <strong>${opt.title}</strong>
                              <span>${opt.desc}</span>
                            </div>
                            <div class="tl-transit-time">${opt.time}</div>
                          </div>
                          <div class="tl-transit-detail">
                            <div class="tl-transit-detail-inner">
                              ${transitDetails.map((detail, di) => `
                                <div class="tl-transit-step${activeDetailStep === di ? ' active' : ''}" data-transit-detail-step="${di}">
                                  <div class="tl-transit-mode">${detail.icon}</div>
                                  <div class="tl-transit-main">
                                    <strong>${detail.title}</strong>
                                    <span>${detail.desc}</span>
                                    ${detail.meta?.length ? `<div class="tl-transit-meta">${detail.meta.map(m => `<span>${m}</span>`).join('')}</div>` : ''}
                                  </div>
                                  <div class="tl-transit-time">${detail.time}</div>
                                </div>`).join('')}
                            </div>
                          </div>
                        </div>` : `
                        <div class="tl-transit-option${(activeMode === 'WALKING' && opt.mode === 'walk') || (activeMode === 'TAXI' && opt.mode === 'taxi') ? ' active' : ''}" data-transit-step="${oi}" data-mode="${opt.mode || ''}">
                          <div class="tl-transit-mode">${opt.icon}</div>
                          <div class="tl-transit-main"><strong>${opt.title}</strong><span>${opt.desc}</span></div>
                          <div class="tl-transit-time">${opt.time}</div>
                        </div>`).join('')}
                    </div>
                  </div>
                </div>
              </div>
              <div class="tl-expense">
                <label for="stopExp${s.day}-${i}">지출액</label>
                <input id="stopExp${s.day}-${i}" data-stop-expense="${i}" type="number" inputmode="decimal" min="0" placeholder="0" value="${stopExpenses[stopExpenseKey(s.day, i)] ? stopExpenses[stopExpenseKey(s.day, i)].amt : ''}">
                <span>EUR</span>
              </div>
              ${stop.mealReroute?`<div class="reroute-drop" id="mrDrop${i}"><strong>식당 대체 후보</strong><p>루트 420m 이내, 평균 ${formatEurAsKrw(19)} 타파스 바로 변경.</p><div class="reroute-acts"><button class="rd-yes" data-action="applyMeal">적용</button><button class="rd-no" data-action="restore">기존 유지</button></div></div>`:''}
              ${stop.safeReroute?`<div class="reroute-drop" id="srDrop${i}"><strong>안전 우회 경로</strong><p>6분 추가. 대로변, 사고 이력 없음.</p><div class="reroute-acts"><button class="rd-yes" data-action="safeRoute">우회 적용</button><button class="rd-no" data-action="restore">기존 유지</button></div></div>`:''}
            </div>
          </div>
        </div>`;
      }).join('');
    
      updateActiveRouteSummary(dayStops);
    
      document.querySelectorAll('.tl-card[data-stop-idx]').forEach(card => {
        card.addEventListener('click', e => {
          if (e.target.closest('button, input, select, textarea')) return;
          activeStopIdx = parseInt(card.dataset.stopIdx, 10);
          selectedTravelMode = 'WALKING';
          activeTransitStepIdx = null;
          renderTL();
          refreshMap();
          requestSimpleRoute(activeStopIdx, 'walk');
        });
      });
    
      document.querySelectorAll('[data-transit-toggle]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          openTransitKey = openTransitKey === btn.dataset.transitToggle ? '' : btn.dataset.transitToggle;
          activeStopIdx = parseInt(btn.closest('.tl-card').dataset.stopIdx, 10);
          renderTL();
          refreshMap();
        });
      });
    
      document.querySelectorAll('[data-transit-step]').forEach(option => {
        option.addEventListener('click', e => {
          e.stopPropagation();
          activeStopIdx = parseInt(option.closest('.tl-card').dataset.stopIdx, 10);
          const key = transitPanelKey(s.day, activeStopIdx);
          const mode = option.dataset.mode;
          openTransitKey = key;
          if (mode === 'transit' && !transitResults[key]) {
            activeTransitStepIdx = null;
            selectedTravelMode = 'TRANSIT';
            requestTransitRoute(activeStopIdx);
            return;
          }
          selectedTravelMode = mode === 'transit' ? 'TRANSIT' : mode === 'taxi' ? 'TAXI' : 'WALKING';
          activeTransitStepIdx = null;
          if (mode === 'taxi' && !routeModeResults[modeResultKey(s.day, activeStopIdx, mode)]) {
            requestSimpleRoute(activeStopIdx, mode);
            return;
          }
          renderTL();
          refreshMap();
        });
      });
    
      document.querySelectorAll('[data-transit-detail-step]').forEach(option => {
        option.addEventListener('click', e => {
          e.stopPropagation();
          activeStopIdx = parseInt(option.closest('.tl-card').dataset.stopIdx, 10);
          selectedTravelMode = 'TRANSIT';
          activeTransitStepIdx = parseInt(option.dataset.transitDetailStep, 10);
          renderTL();
          refreshMap();
        });
      });
    }
    
    function renderExp() {
      const colors = { meal:'var(--amber)', transport:'var(--blue)', entry:'var(--green)', shop:'var(--purple)' };
      const stopLogs = Object.values(stopExpenses);
      document.getElementById('expLog').innerHTML = [...stopLogs, ...expenses].map(e =>
        `<div class="exp-log-item"><div class="exp-log-left"><span class="exp-cat-dot" style="background:${colors[e.cat]}"></span><span class="exp-log-name">${e.name}</span></div><span class="exp-log-amt${e.over?' over':''}">${formatEurAsKrw(e.amt)}</span></div>`
      ).join('');
    }
    
    function updateBudget() {
      const spent = getTotalSpent();
      const pct = Math.min(100, (spent / total) * 100);
      document.getElementById('heroGaugeFill').style.width = pct + '%';
      document.getElementById('heroSpent').textContent = formatEurAsKrw(spent);
    }
    
    function updateFatigue(v) {
      fatigueVal = v;
      const r = 24, circ = 2 * Math.PI * r;
      const offset = circ - (v / 10) * circ;
      const ring = document.getElementById('fcRing');
      ring.style.strokeDashoffset = offset;
      ring.style.stroke = v >= 8 ? 'var(--rose)' : v >= 6 ? 'var(--amber)' : 'var(--green)';
      document.getElementById('fcNum').textContent = v;
      const labels = { 1:'최상 컨디션', 2:'컨디션 좋음', 3:'약간 피로', 4:'적당히 피로', 5:'중간 피로', 6:'카페 휴식 추천', 7:'도보 줄이기', 8:'택시 추천', 9:'숙소 복귀 추천', 10:'일정 조정 필요' };
      document.getElementById('fcLabel').textContent = labels[v] || '';
    }
    
    let toastTimer;
    function showToast(icon, title, msg, type, actions) {
      clearTimeout(toastTimer);
      document.getElementById('toastIcon').textContent = icon;
      document.getElementById('toastTitle').textContent = title;
      document.getElementById('toastMsg').textContent = msg;
      const toast = document.getElementById('toast');
      toast.className = `toast show ${type}`;
      document.getElementById('toastActions').innerHTML = (actions||[]).map(a =>
        `<button class="ta-btn${a.primary?' primary':''}" data-action="${a.action}">${a.label}</button>`
      ).join('');
      toastTimer = setTimeout(() => toast.classList.remove('show'), 6000);
    }
    
    document.getElementById('toastClose').addEventListener('click', () => document.getElementById('toast').classList.remove('show'));
    
    function openModal(key) {
      const d = modalData[key];
      if (!d) return;
      document.getElementById('modalTitle').textContent = d.title;
      document.getElementById('modalContent').innerHTML = d.html;
      document.getElementById('overlay').classList.add('show');
    }
    function closeModal() { document.getElementById('overlay').classList.remove('show'); }
    document.getElementById('mClose').addEventListener('click', closeModal);
    document.getElementById('mConfirm').addEventListener('click', closeModal);
    document.getElementById('overlay').addEventListener('click', e => { if(e.target.id==='overlay') closeModal(); });
    
    function openMapModal() {
      document.getElementById('mapOverlay').classList.add('show');
      mapModalOpen = true;
      requestAnimationFrame(() => refreshMap());
    }
    function closeMapModal() {
      document.getElementById('mapOverlay').classList.remove('show');
      mapModalOpen = false;
    }
    document.getElementById('mapModalClose').addEventListener('click', closeMapModal);
    document.getElementById('mapOverlay').addEventListener('click', e => { if(e.target.id==='mapOverlay') closeMapModal(); });
    
    function setRoute(title, desc) {
      document.getElementById('routeTitle').textContent = title;
      document.getElementById('routeDesc').textContent = desc;
    }
    
    function handle(action) {
      switch(action) {
        case 'wxReroute':
          showToast('☔','오후 비 예보 감지','기존 루트에서 멀지 않은 실내 코스로 재경로할까요?','warn',[
            { label:'실내 루트 적용', action:'applyWx', primary:true },{ label:'무시', action:'_dismiss' }]); break;
        case 'applyWx':
          document.getElementById('toast').classList.remove('show');
          setRoute('실내 재경로: 피카소 미술관 우선','야외 산책 → 실내 코스. +9분');
          showToast('✓','실내 루트 적용됨','기존 관광 순서 유지. 야외 구간만 실내로 전환됩니다.','ok'); break;
        case 'safeRoute':
          document.querySelectorAll('[id^="srDrop"]').forEach(el => el.classList.add('open'));
          setRoute('안전 우회: Passeig de Gracia','최단 경로 +6분 · 사고 이력 없음 · 조명 충분');
          showToast('🛡','안전 우회 경로 적용','대로변으로 안내합니다.','ok'); break;
        case 'restore':
          document.querySelectorAll('.reroute-drop').forEach(el => el.classList.remove('open'));
          document.getElementById('mealReroute').classList.remove('open');
          updateActiveRouteSummary(getDayStops(cityData[schedule[activeIdx].base].stops));
          document.getElementById('toast').classList.remove('show'); break;
        case 'applyMeal':
          document.querySelectorAll('[id^="mrDrop"]').forEach(el => el.classList.remove('open'));
          document.getElementById('mealReroute').classList.remove('open');
          setRoute(`식당 변경: 평균 ${formatEurAsKrw(19)} 타파스 바 적용`,'루트 420m 이내 · 관광 순서 유지됨');
          showToast('✓','식당 변경 적용','기존 관광 루트와 크게 벗어나지 않는 대체 식당으로 조정되었습니다.','ok'); break;
        case 'fatigueReroute':
          showToast('◇',`피로도 ${fatigueVal}/10 — 루트 조정`,`도보를 줄이고 카페 휴식과 택시 구간을 늘린 루트로 바꿀까요?`,'warn',[
            { label:'적용', action:'applyFatigue', primary:true },{ label:'유지', action:'_dismiss' }]); break;
        case 'applyFatigue':
          document.getElementById('toast').classList.remove('show');
          setRoute('휴식 루트: 카페 40분 + 택시 구간','도보 -2km · 오후 카페 휴식 후 복귀');
          showToast('✓','휴식 루트 적용됨','관광 포인트 유지. 이동 방식과 중간 휴식만 조정됩니다.','ok'); break;
        case 'focusBudget':
          document.getElementById('budgetSec').scrollIntoView({ behavior:'smooth', block:'center' });
          setTimeout(() => document.getElementById('expAmt').focus(), 400); break;
        case 'openMapModal':
          openMapModal(); break;
        case '_dismiss': document.getElementById('toast').classList.remove('show'); break;
      }
    }
    
    document.getElementById('addExp').addEventListener('click', () => {
      const name = document.getElementById('expName').value.trim();
      const amt = parseFloat(document.getElementById('expAmt').value) || 0;
      const cat = document.getElementById('expCat').value;
      if (!name || !amt) return;
      const over = cat === 'meal' && amt > 45;
      expenses.unshift({ name, cat, amt: +amt.toFixed(1), over });
      totalSpent += amt;
      updateBudget();
      renderExp();
      document.getElementById('expName').value = '';
      document.getElementById('expAmt').value = '';
      if (over) {
        document.getElementById('mealReroute').classList.add('open');
        showToast('⚠️',`${formatEurAsKrw(amt)} 식사 초과`,'예산 범위 내 근처 식당으로 재조회할까요?','warn',[
          { label:'재조회', action:'_dismiss', primary:true },{ label:'무시', action:'_dismiss' }]);
      } else {
        showToast('✓',`${formatEurAsKrw(amt)} 입력됨`,`남은 예산 ${formatEurAsKrw(total - getTotalSpent())}`,'ok');
      }
    });
    
    document.addEventListener('change', e => {
      const input = e.target.closest('[data-stop-expense]');
      if (!input) return;
      const amt = parseFloat(input.value) || 0;
      const s = schedule[activeIdx];
      const stopIdx = parseInt(input.dataset.stopExpense);
      const stop = cityData[s.base].stops[stopIdx];
      const key = stopExpenseKey(s.day, stopIdx);
      if (amt <= 0) {
        delete stopExpenses[key];
      } else {
        const cat = stop.kind === 'meal' ? 'meal' : stop.kind === 'spot' ? 'entry' : 'transport';
        stopExpenses[key] = {
          name: `${stop.name} 지출`,
          cat,
          amt: +amt.toFixed(1),
          over: cat === 'meal' && amt > 45
        };
      }
      updateBudget();
      renderExp();
    });
    
    document.getElementById('fcSlider').addEventListener('input', e => updateFatigue(parseInt(e.target.value)));
    
    document.addEventListener('click', e => {
      const m = e.target.closest('[data-modal]');
      if (m) { openModal(m.dataset.modal); return; }
      const sc = e.target.closest('[data-scroll]');
      if (sc) { document.getElementById(sc.dataset.scroll)?.scrollIntoView({ behavior:'smooth', block:'center' }); return; }
      const ac = e.target.closest('[data-action]');
      if (ac) { handle(ac.dataset.action); return; }
    });
    
    renderCityAccordion();
    renderTL();
    renderExp();
    updateBudget();
    updateFatigue(6);
    
    function initMap() {
      if (!window.google) return;
      mapReady = true;
      requestSimpleRoute(activeStopIdx, 'walk');
      requestSimpleRoute(activeStopIdx, 'taxi');
      renderRouteMap('liveMap');
      if (mapModalOpen) renderRouteMap('modalMap');
    }
    
    function renderRouteMap(targetId) {
      const el = document.getElementById(targetId);
      if (!el || !window.google) return;
      el.innerHTML = '';
      const s = schedule[activeIdx];
      const activeStop = getDayStops(cityData[s.base].stops)[activeStopIdx];
      const selectedModeKey = selectedTravelMode === 'TAXI' ? 'taxi' : selectedTravelMode === 'WALKING' ? 'walk' : '';
      const modeRoute = selectedModeKey ? routeModeResults[modeResultKey(s.day, activeStopIdx, selectedModeKey)]?.route : null;
      const transitStep = activeTransitStepIdx !== null ? getTransitDetailOptions(activeStop, activeStopIdx)?.[activeTransitStepIdx]?.route : null;
      const selectedRoute = transitStep || modeRoute;
      const p = selectedRoute?.start && selectedRoute?.end ? [selectedRoute.start, selectedRoute.end] : getRouteSegment(s.base, activeStopIdx);
      const map = new google.maps.Map(el, {
        center:p[0], zoom:13,
        mapTypeControl:false, streetViewControl:false, fullscreenControl:false
      });
      const bounds = new google.maps.LatLngBounds();
      const labels = p.length === 1 ? ['숙'] : selectedRoute ? ['S', 'E'] : ['출', '도'];
      const colors = p.length === 1 ? ['#0BB97A'] : selectedRoute ? ['#F59E0B','#29ABE2'] : ['#0BB97A','#29ABE2'];
      p.forEach((pt,i) => {
        bounds.extend(pt);
        new google.maps.Marker({ position:pt, map,
          label:{ text:labels[i], color:'#fff', fontWeight:'800', fontSize:'10px' },
          icon:{ path:google.maps.SymbolPath.CIRCLE, scale:13, fillColor:colors[i]||'#29ABE2', fillOpacity:1, strokeColor:'#ffffff', strokeWeight:3 }
        });
      });
      if (p.length === 1) {
        map.setCenter(p[0]);
        map.setZoom(15);
      } else {
        map.fitBounds(bounds, 48);
      }
    
      const routeFallback = () => {
        const path = selectedRoute?.path?.length ? selectedRoute.path : p;
        path.forEach(pt => bounds.extend(pt));
        new google.maps.Polyline({ path, map, strokeColor:selectedRoute ? '#F59E0B' : '#29ABE2', strokeOpacity:.82, strokeWeight:4 });
        if (path.length > 1) map.fitBounds(bounds, 48);
      };
    
      if (selectedRoute) {
        routeFallback();
        return;
      }
    
      if (p.length < 2 || !google.maps.DirectionsService || !google.maps.DirectionsRenderer) {
        if (p.length >= 2) routeFallback();
        return;
      }
    
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers:true,
        preserveViewport:false,
        polylineOptions:{
          strokeColor:'#29ABE2',
          strokeOpacity:.82,
          strokeWeight:5
        }
      });
    
      directionsService.route({
        origin:p[0],
        destination:p[p.length - 1],
        waypoints:[],
        travelMode:selectedTravelMode === 'TAXI' ? google.maps.TravelMode.DRIVING : google.maps.TravelMode[selectedTravelMode] || google.maps.TravelMode.WALKING,
        transitOptions:selectedTravelMode === 'TRANSIT' ? { departureTime:new Date() } : undefined,
        optimizeWaypoints:false
      }, (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
        } else {
          routeFallback();
        }
      });
    }
    window.initMap = initMap;

    if (window.google?.maps) {
      initMap();
    } else if (!document.getElementById(GOOGLE_MAP_SCRIPT_ID)) {
      const scriptEl = document.createElement('script');
      scriptEl.id = GOOGLE_MAP_SCRIPT_ID;
      scriptEl.src = GOOGLE_MAP_SCRIPT_SRC;
      scriptEl.async = true;
      scriptEl.defer = true;
      document.body.appendChild(scriptEl);
    }

    return () => {
      if (window.initMap === initMap) delete window.initMap;
    };
  }, [])

  return (
    <>
      <style>{pageStyle}</style>
      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-in">
          <a className="brand" href="#"><span className="brand-icon">📱</span>폰가이즈</a>
          <div className="topbar-trip">
            <strong>스페인 한달</strong><span className="sep">›</span>
            <span id="topbarRoute">바르셀로나 → 마드리드 → 세비야 외 7개 도시</span><span className="sep">·</span>
            <span className="live-pill"><span className="live-dot"></span>Day 04 라이브</span>
          </div>
          <div className="topbar-actions">
            <button className="t-btn translate" data-modal="translate">↔ 번역</button>
            <button className="t-btn map-btn" data-scroll="mapPanel">⌖ 지도</button>
            <button className="t-btn ghost" data-modal="emergency">🚨</button>
          </div>
        </div>
      </header>
      
      {/* HERO */}
      <section className="dest-hero">
        <div className="dest-hero-inner">
          <div className="dest-left">
            <div className="dest-city" id="heroCity">Barcelona</div>
            <div className="dest-meta">
              <span className="dest-tag" id="heroTag1"><span className="live-dot"></span> Day 04 진행 중 · Praktik Garden 기준</span>
              <span className="dest-tag" id="heroTag2">☀ 오전 맑음 · 🌦 오후 3시 이후 비 예보</span>
            </div>
          </div>
          <div className="dest-right">
            <div className="budget-badge">
              <div className="budget-label">예산 소진율</div>
              <div className="budget-bar"><div className="budget-bar-fill" id="heroGaugeFill" style={{"width": "38%"}}></div></div>
              <div className="budget-nums">
                <span className="budget-spent" id="heroSpent">₩849,660</span>
                <span className="budget-total">/ ₩4,704,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* WORKSPACE */}
      <div className="workspace">
      
        {/* LEFT RAIL: 구간 accordion + 도구 */}
        <aside className="left-rail">
          <div className="c-card">
            <div className="c-card-title">구간</div>
            <div className="city-list" id="cityAccordion"></div>
          </div>
          <div className="c-card">
            <div className="c-card-title">도구</div>
            <div className="tool-pad">
              <button className="tool-pad-btn" data-modal="budget"><span>◫</span>예산</button>
              <button className="tool-pad-btn" data-modal="fatigue"><span>◇</span>피로도</button>
              <button className="tool-pad-btn" data-modal="nearby"><span>＋</span>편의시설</button>
              <button className="tool-pad-btn" data-modal="safety"><span>🛡</span>야간안전</button>
              <button className="tool-pad-btn" data-modal="album"><span>▧</span>앨범</button>
              <button className="tool-pad-btn" data-modal="hotel"><span>🏨</span>숙소</button>
            </div>
          </div>
        </aside>
      
        {/* FEED */}
        <section className="feed">
      
          {/* Timeline */}
          <div className="sec" id="tlSection">
            <div className="sec-head">
              <div>
                <div className="sec-kicker" id="tlKicker">Day 04 · Live Itinerary</div>
                <h2 id="tlTitle">바르셀로나 도보 미식 루트</h2>
                <p className="sec-desc" id="tlDesc">숙소 출발·복귀 기준. 식당·날씨·안전 이슈는 기존 루트 반경 내에서만 대체.</p>
              </div>
              <button className="sec-action-btn" data-action="restore">기존 복귀</button>
            </div>
            <div className="sec-body">
              <div className="tl" id="tl"></div>
            </div>
          </div>
      
          {/* Budget */}
          <div className="sec" id="budgetSec">
            <div className="sec-head">
              <div>
                <div className="sec-kicker">Live Budget</div>
                <h2>지출 초과 → 식당만 재조회</h2>
                <p className="sec-desc">관광 루트 유지. 현 위치 반경 내에서 예산 맞는 식당 후보만 다시 찾습니다.</p>
              </div>
              <button className="sec-action-btn primary" data-action="focusBudget">지출 입력</button>
            </div>
            <div className="sec-body">
              <div className="budget-cols">
                <div className="b-block">
                  <div className="b-block-title">카테고리 예산</div>
                  <div className="b-row"><span className="b-icon">🍽</span><span className="b-name">식사</span><div className="b-bar"><div className="b-fill" style={{"width": "82%", "background": "var(--amber)"}}></div></div><span className="b-val">₩361,620/₩441,000</span></div>
                  <div className="b-row"><span className="b-icon">🚇</span><span className="b-name">교통</span><div className="b-bar"><div className="b-fill" style={{"width": "44%", "background": "var(--blue)"}}></div></div><span className="b-val">₩129,360/₩294,000</span></div>
                  <div className="b-row"><span className="b-icon">🏛</span><span className="b-name">입장비</span><div className="b-bar"><div className="b-fill" style={{"width": "56%", "background": "var(--green)"}}></div></div><span className="b-val">₩246,960/₩441,000</span></div>
                  <div className="b-row"><span className="b-icon">🛍</span><span className="b-name">쇼핑</span><div className="b-bar"><div className="b-fill" style={{"width": "38%", "background": "var(--purple)"}}></div></div><span className="b-val">₩111,720/₩294,000</span></div>
                </div>
                <div className="b-block">
                  <div className="b-block-title">실시간 지출 입력</div>
                  <div className="exp-form">
                    <input className="exp-input" id="expName" placeholder="예: El Nacional 점심" aria-label="지출 내역" />
                    <input className="exp-num" id="expAmt" placeholder="금액(EUR)" aria-label="지출 금액 현지 통화" type="number" inputMode="decimal" />
                    <select className="exp-cat-sel" id="expCat" aria-label="지출 카테고리">
                      <option value="meal">식사</option>
                      <option value="transport">교통</option>
                      <option value="entry">입장비</option>
                      <option value="shop">쇼핑</option>
                    </select>
                    <button className="exp-add" id="addExp">+</button>
                  </div>
                  <div className="exp-log" id="expLog">
                    <div className="exp-log-item"><div className="exp-log-left"><span className="exp-cat-dot" style={{"background": "var(--amber)"}}></span><span className="exp-log-name">아침 카페</span></div><span className="exp-log-amt">₩17,640</span></div>
                    <div className="exp-log-item"><div className="exp-log-left"><span className="exp-cat-dot" style={{"background": "var(--blue)"}}></span><span className="exp-log-name">지하철 L5</span></div><span className="exp-log-amt">₩3,528</span></div>
                  </div>
                  <div className="meal-reroute-panel" id="mealReroute">
                    <strong>예산 초과 — 식당 대체 후보</strong>
                    <p>현재 루트 480m 이내, 평균 ₩26,460-₩32,340 식당으로만 재조회합니다. 관광 순서는 유지됩니다.</p>
                    <div style={{"display": "flex", "gap": "5px"}}>
                      <button className="rd-yes" data-action="applyMeal">대체 적용</button>
                      <button className="rd-no" data-action="restore">기존 유지</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      
        </section>
      
        {/* RIGHT COL */}
        <aside className="right-col">
          <div className="map-wrap" id="mapPanel">
            <div className="map-hd">
              <span className="map-hd-title">라이브 지도</span>
              <div className="map-hd-actions">
                <button className="map-icon-btn" data-action="openMapModal" aria-label="지도 확대">⛶</button>
                <button className="map-hd-btn">경로 안내</button>
              </div>
            </div>
            <div className="map-frame" id="liveMap">
              <div className="map-fallback">Google Maps API 키 연결 시<br />숙소·관광지·식당·야간 안전 경로 표시</div>
            </div>
            <div className="map-route-card" id="routeCard">
              <strong id="routeTitle">선택한 이동 구간</strong>
              <span id="routeDesc">이동수단을 선택하면 실제 시간·거리가 표시됩니다.</span>
            </div>
            <div className="map-btns">
              <button className="map-btn primary" data-action="safeRoute">🛡 안전 우회</button>
              <button className="map-btn sec" data-action="restore">원래 루트</button>
            </div>
          </div>
      
          <div className="wx-card">
            <div className="wx-bg">
              <span className="wx-icon-big" id="wxIcon">🌦</span>
              <div>
                <div className="wx-num" id="wxTemp">24°</div>
                <div className="wx-cond" id="wxCond">오전 맑음 · 오후 3시 비</div>
              </div>
            </div>
            <div className="wx-outfit">
              <strong>오늘 옷차림</strong>
              <span id="wxOutfit">얇은 방수 재킷 + 접이식 우산. 미끄럽지 않은 밑창 신발.</span>
            </div>
            <div className="wx-btns">
              <button className="map-btn primary" style={{"flex": "1"}} data-action="wxReroute">실내 재경로</button>
              <button className="map-btn sec" style={{"flex": "1"}} data-action="restore">원래 루트</button>
            </div>
          </div>
      
          <div className="fatigue-card">
            <div className="fc-title">피로도 관리</div>
            <div className="fc-body">
              <div className="fc-ring-wrap">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="24" fill="none" stroke="var(--border)" strokeWidth="7"/>
                  <circle id="fcRing" cx="32" cy="32" r="24" fill="none" stroke="var(--green)"
                    strokeWidth="7" strokeDasharray="150.8" strokeDashoffset="60" strokeLinecap="round"/>
                </svg>
                <div className="fc-ring-center">
                  <span className="fc-ring-num" id="fcNum">6</span>
                  <span className="fc-ring-denom">/10</span>
                </div>
              </div>
              <div className="fc-right">
                <div className="fc-label" id="fcLabel">카페 휴식 추천</div>
                <input type="range" className="fc-slider" id="fcSlider" min="1" max="10" defaultValue="6" />
                <div className="fc-hint">높을수록 도보를 줄이고 카페·택시 비중을 늘립니다.</div>
              </div>
            </div>
            <button className="fc-btn" data-action="fatigueReroute">휴식 루트 보기</button>
          </div>
        </aside>
      </div>
      
      {/* TOAST */}
      <div className="toast" id="toast">
        <span className="toast-icon" id="toastIcon"></span>
        <div className="toast-body">
          <div className="toast-title" id="toastTitle"></div>
          <div className="toast-msg" id="toastMsg"></div>
        </div>
        <div className="toast-actions" id="toastActions"></div>
        <button className="ta-close" id="toastClose">×</button>
      </div>
      
      {/* OVERLAY MODAL */}
      <div className="overlay" id="overlay">
        <div className="modal-box">
          <div className="modal-title" id="modalTitle"></div>
          <div id="modalContent"></div>
          <div className="modal-footer">
            <button className="mf ghost" id="mClose">닫기</button>
            <button className="mf primary" id="mConfirm">확인</button>
          </div>
        </div>
      </div>
      
      <div className="overlay" id="mapOverlay">
        <div className="map-modal-box">
          <div className="map-modal-head">
            <div className="map-modal-title">라이브 지도</div>
            <button className="map-modal-close" id="mapModalClose" aria-label="지도 닫기">×</button>
          </div>
          <div className="map-modal-frame" id="modalMap"></div>
        </div>
      </div>
    </>
  )
}
