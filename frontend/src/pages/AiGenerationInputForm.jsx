import { useEffect, useState } from 'react'
import CalendarPicker from '../components/common/CalendarPicker'

const pageStyle = "\n    :root {\n      --ink: #111827;\n      --muted: #687385;\n      --soft: #f4f7fb;\n      --line: #dde5ef;\n      --paper: #ffffff;\n      --brand: #0f6bff;\n      --brand-2: #00a676;\n      --accent: #ffb020;\n      --danger: #ef4444;\n      --navy: #07111f;\n      --radius: 8px;\n      --shadow: 0 18px 50px rgba(16, 24, 40, 0.12);\n    }\n\n    * {\n      box-sizing: border-box;\n    }\n\n    html {\n      scroll-behavior: smooth;\n    }\n\n    body {\n      margin: 0;\n      min-height: 100vh;\n      color: var(--ink);\n      background: #eef3f8;\n      font-family: \"Inter\", \"Noto Sans KR\", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;\n    }\n\n    button,\n    input {\n      font: inherit;\n    }\n\n    button {\n      border: 0;\n      cursor: pointer;\n    }\n\n    .shell {\n      min-height: 100vh;\n      display: grid;\n      grid-template-columns: minmax(360px, 0.72fr) minmax(560px, 1fr);\n    }\n\n    .cover {\n      position: sticky;\n      top: 0;\n      height: 100vh;\n      display: flex;\n      flex-direction: column;\n      justify-content: space-between;\n      padding: 28px;\n      overflow: hidden;\n      color: #fff;\n      background:\n        linear-gradient(180deg, rgba(7, 17, 31, 0.08), rgba(7, 17, 31, 0.84)),\n        url(\"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85\") center/cover;\n    }\n\n    .cover::after {\n      content: \"\";\n      position: absolute;\n      inset: 0;\n      background: linear-gradient(135deg, rgba(3, 9, 18, 0.62), rgba(7, 17, 31, 0.16) 48%, rgba(3, 9, 18, 0.72));\n      pointer-events: none;\n    }\n\n    .cover > * {\n      position: relative;\n      z-index: 1;\n    }\n\n    .brand {\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      gap: 16px;\n    }\n\n    .brand-mark {\n      display: inline-flex;\n      align-items: center;\n      gap: 10px;\n      color: #fff;\n      text-decoration: none;\n      font-weight: 900;\n      letter-spacing: 0;\n    }\n\n    .logo-box {\n      width: 38px;\n      height: 38px;\n      display: grid;\n      place-items: center;\n      border-radius: var(--radius);\n      background: rgba(255, 255, 255, 0.16);\n      border: 1px solid rgba(255, 255, 255, 0.24);\n      backdrop-filter: blur(12px);\n    }\n\n    .step-mini {\n      display: flex;\n      gap: 6px;\n    }\n\n    .dot {\n      width: 8px;\n      height: 8px;\n      border-radius: 999px;\n      background: rgba(255, 255, 255, 0.34);\n    }\n\n    .dot.done {\n      background: #fff;\n    }\n\n    .cover-copy {\n      max-width: 560px;\n      padding-bottom: 26px;\n    }\n\n    .eyebrow {\n      width: fit-content;\n      margin-bottom: 18px;\n      padding: 8px 11px;\n      border-radius: 999px;\n      color: rgba(255, 255, 255, 0.86);\n      background: rgba(255, 255, 255, 0.14);\n      border: 1px solid rgba(255, 255, 255, 0.2);\n      font-size: 12px;\n      font-weight: 900;\n      letter-spacing: 0;\n      backdrop-filter: blur(10px);\n    }\n\n    .cover h1 {\n      margin: 0;\n      font-size: clamp(48px, 7vw, 86px);\n      line-height: 0.96;\n      letter-spacing: 0;\n      font-weight: 950;\n    }\n\n    .cover p {\n      max-width: 420px;\n      margin: 20px 0 0;\n      color: rgba(255, 255, 255, 0.78);\n      font-size: 15px;\n      line-height: 1.75;\n      font-weight: 500;\n    }\n\n    .summary-card {\n      width: min(100%, 480px);\n      padding: 28px;\n      border-radius: var(--radius);\n      background: rgba(255, 255, 255, 0.14);\n      border: 1px solid rgba(255, 255, 255, 0.2);\n      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.22);\n      backdrop-filter: blur(18px);\n    }\n\n    .summary-list {\n      display: grid;\n      gap: 16px;\n      margin: 0;\n      padding: 0;\n      list-style: none;\n    }\n\n    .summary-line {\n      margin: 0;\n      display: grid;\n      grid-template-columns: 24px 1fr;\n      gap: 10px;\n      align-items: start;\n      color: rgba(255, 255, 255, 0.92);\n      font-size: 19px;\n      line-height: 1.48;\n      font-weight: 900;\n      word-break: keep-all;\n    }\n\n    .summary-line-icon {\n      width: 22px;\n      height: 22px;\n      display: inline-grid;\n      place-items: center;\n      margin-top: 3px;\n      border-radius: 999px;\n      color: rgba(255, 255, 255, 0.88);\n      background: rgba(255, 255, 255, 0.12);\n      border: 1px solid rgba(255, 255, 255, 0.18);\n      font-size: 13px;\n      line-height: 1;\n      font-weight: 950;\n    }\n\n    .summary-line.done {\n      color: #c8f7df;\n    }\n\n    .summary-line.done .summary-line-icon {\n      color: #063f31;\n      background: #a8f0ca;\n      border-color: rgba(168, 240, 202, 0.82);\n    }\n\n    .summary-chips {\n      display: flex;\n      flex-wrap: wrap;\n      gap: 8px;\n      margin-top: 28px;\n    }\n\n    .summary-chip {\n      min-height: 31px;\n      display: inline-flex;\n      align-items: center;\n      padding: 6px 10px;\n      border-radius: 999px;\n      color: #fff;\n      background: rgba(255, 255, 255, 0.13);\n      border: 1px solid rgba(255, 255, 255, 0.18);\n      font-size: 12px;\n      font-weight: 850;\n    }\n\n    .work {\n      min-width: 0;\n      padding: 34px 34px 42px;\n    }\n\n    .work-inner {\n      width: min(100%, 900px);\n      margin: 0 auto;\n    }\n\n    .topbar {\n      position: sticky;\n      top: 0;\n      z-index: 20;\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      gap: 18px;\n      padding: 16px 0 20px;\n      background: linear-gradient(180deg, #eef3f8 72%, rgba(238, 243, 248, 0));\n    }\n\n    .topbar h2 {\n      margin: 0;\n      font-size: 23px;\n      line-height: 1.2;\n      font-weight: 950;\n      letter-spacing: 0;\n    }\n\n    .topbar p {\n      margin: 5px 0 0;\n      color: var(--muted);\n      font-size: 13px;\n      line-height: 1.5;\n      font-weight: 600;\n    }\n\n    .progress {\n      flex: 0 0 210px;\n      height: 8px;\n      border-radius: 999px;\n      background: #dbe3ee;\n      overflow: hidden;\n    }\n\n    .progress span {\n      display: block;\n      height: 100%;\n      width: 0;\n      border-radius: inherit;\n      background: linear-gradient(90deg, var(--brand), var(--brand-2), var(--accent));\n      transition: width 0.2s ease;\n    }\n\n    .form {\n      display: grid;\n      gap: 14px;\n    }\n\n    .journey-nav {\n      position: sticky;\n      top: 77px;\n      z-index: 18;\n      display: grid;\n      grid-template-columns: repeat(5, minmax(0, 1fr));\n      gap: 8px;\n      margin-bottom: 14px;\n      padding: 8px;\n      border-radius: var(--radius);\n      border: 1px solid rgba(214, 224, 237, 0.9);\n      background: rgba(255, 255, 255, 0.8);\n      box-shadow: 0 12px 30px rgba(16, 24, 40, 0.08);\n      backdrop-filter: blur(18px);\n    }\n\n    .journey-tab {\n      min-height: 54px;\n      display: flex;\n      align-items: center;\n      gap: 9px;\n      padding: 8px 10px;\n      border-radius: var(--radius);\n      color: #64748b;\n      background: transparent;\n      text-align: left;\n      transition: background 0.16s ease, color 0.16s ease, transform 0.16s ease;\n    }\n\n    .journey-tab:hover {\n      color: var(--ink);\n      background: #f3f7fc;\n    }\n\n    .journey-tab.active {\n      color: #fff;\n      background: var(--navy);\n      box-shadow: 0 12px 22px rgba(7, 17, 31, 0.18);\n    }\n\n    .journey-tab.done {\n      color: #07543f;\n      background: #e8f8f1;\n    }\n\n    .journey-tab.done.active {\n      color: #fff;\n      background: var(--navy);\n    }\n\n    .journey-tab span:first-child {\n      font-size: 18px;\n      line-height: 1;\n    }\n\n    .journey-tab strong {\n      display: block;\n      font-size: 13px;\n      line-height: 1.1;\n      font-weight: 950;\n    }\n\n    .journey-tab small {\n      display: block;\n      margin-top: 3px;\n      font-size: 10px;\n      line-height: 1.1;\n      font-weight: 800;\n      opacity: 0.76;\n    }\n\n    .stage {\n      position: relative;\n    }\n\n    .step-panel {\n      display: none;\n      animation: stepIn 0.24s ease both;\n    }\n\n    .step-panel.active {\n      display: grid;\n      gap: 14px;\n    }\n\n    @keyframes stepIn {\n      from {\n        opacity: 0;\n        transform: translateY(10px);\n      }\n\n      to {\n        opacity: 1;\n        transform: translateY(0);\n      }\n    }\n\n    .step-hero {\n      min-height: 188px;\n      display: flex;\n      flex-direction: column;\n      justify-content: flex-end;\n      padding: 28px;\n      border-radius: var(--radius);\n      color: #fff;\n      background:\n        linear-gradient(135deg, rgba(7, 17, 31, 0.95), rgba(15, 107, 255, 0.7)),\n        url(\"https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80\") center/cover;\n      box-shadow: 0 18px 50px rgba(7, 17, 31, 0.18);\n    }\n\n    .step-hero p {\n      margin: 0 0 9px;\n      color: rgba(255, 255, 255, 0.72);\n      font-size: 12px;\n      font-weight: 900;\n      text-transform: uppercase;\n    }\n\n    .step-hero h3 {\n      max-width: 560px;\n      margin: 0;\n      font-size: clamp(30px, 3.7vw, 44px);\n      line-height: 1.08;\n      font-weight: 950;\n      letter-spacing: 0;\n      word-break: keep-all;\n    }\n\n    .step-actions {\n      position: relative;\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      gap: 10px;\n      margin-top: 2px;\n    }\n\n    .step-actions.end {\n      justify-content: flex-end;\n    }\n\n    .step-warning {\n      display: none;\n      position: absolute;\n      right: 0;\n      bottom: calc(100% + 10px);\n      max-width: min(320px, 100%);\n      color: #b42318;\n      background: #fff1f0;\n      border: 1px solid #ffd0cc;\n      border-radius: var(--radius);\n      padding: 10px 12px;\n      font-size: 12px;\n      line-height: 1.45;\n      font-weight: 900;\n      box-shadow: 0 12px 26px rgba(180, 35, 24, 0.16);\n      animation: warningFloat 2s ease both;\n      pointer-events: none;\n      z-index: 4;\n    }\n\n    .step-warning.show {\n      display: block;\n    }\n\n    @keyframes warningFloat {\n      0% {\n        opacity: 0;\n        transform: translateY(6px);\n      }\n\n      12%,\n      82% {\n        opacity: 1;\n        transform: translateY(0);\n      }\n\n      100% {\n        opacity: 0;\n        transform: translateY(-4px);\n      }\n    }\n\n    .step-action {\n      min-height: 48px;\n      padding: 0 18px;\n      border-radius: var(--radius);\n      color: #fff;\n      background: var(--navy);\n      font-size: 13px;\n      font-weight: 950;\n      transition: transform 0.15s ease, opacity 0.15s ease;\n    }\n\n    .step-action:hover {\n      transform: translateY(-1px);\n    }\n\n    .step-action.light {\n      color: #475569;\n      background: #fff;\n      border: 1px solid #dbe3ee;\n    }\n\n    .step-action.collab-action {\n      display: inline-flex;\n      align-items: center;\n      gap: 8px;\n      color: #075985;\n      background: #f0f9ff;\n      border: 1px solid #bae6fd;\n      box-shadow: 0 10px 20px rgba(14, 165, 233, 0.12);\n    }\n\n    .step-action.collab-action[hidden] {\n      display: none;\n    }\n\n    .step-action.collab-action::before {\n      content: \"↔\";\n      width: 24px;\n      height: 24px;\n      display: grid;\n      place-items: center;\n      border-radius: 50%;\n      color: #fff;\n      background: linear-gradient(135deg, #0ea5e9, #2563eb);\n      font-size: 13px;\n      line-height: 1;\n    }\n\n    .step-action.collab-action:hover {\n      background: #e0f2fe;\n      border-color: #7dd3fc;\n    }\n\n    .collab-help {\n      position: absolute;\n      right: 118px;\n      bottom: calc(100% + 12px);\n      z-index: 2;\n      width: max-content;\n      max-width: min(280px, calc(100vw - 40px));\n      padding: 12px 14px;\n      border-radius: var(--radius);\n      color: #075985;\n      background: #fff;\n      border: 1px solid #bae6fd;\n      box-shadow: 0 16px 32px rgba(15, 23, 42, 0.14);\n      font-size: 13px;\n      line-height: 1.45;\n      font-weight: 850;\n    }\n\n    .collab-help[hidden] {\n      display: none;\n    }\n\n    .collab-help::after {\n      content: \"\";\n      position: absolute;\n      right: 28px;\n      bottom: -7px;\n      width: 12px;\n      height: 12px;\n      transform: rotate(45deg);\n      background: #fff;\n      border-right: 1px solid #bae6fd;\n      border-bottom: 1px solid #bae6fd;\n    }\n\n    .panel {\n      padding: 22px;\n      border-radius: var(--radius);\n      border: 1px solid var(--line);\n      background: rgba(255, 255, 255, 0.86);\n      box-shadow: 0 8px 28px rgba(16, 24, 40, 0.06);\n    }\n\n    .panel-head {\n      display: flex;\n      align-items: flex-start;\n      justify-content: space-between;\n      gap: 16px;\n      margin-bottom: 18px;\n    }\n\n    .title-wrap {\n      display: grid;\n      grid-template-columns: 38px 1fr;\n      gap: 12px;\n      align-items: start;\n    }\n\n    .icon {\n      width: 38px;\n      height: 38px;\n      display: grid;\n      place-items: center;\n      border-radius: var(--radius);\n      color: var(--brand);\n      background: #e8f1ff;\n      font-size: 19px;\n    }\n\n    .panel h3 {\n      margin: 0;\n      font-size: 17px;\n      line-height: 1.25;\n      font-weight: 950;\n      letter-spacing: 0;\n    }\n\n    .panel-note {\n      margin: 5px 0 0;\n      color: var(--muted);\n      font-size: 12px;\n      line-height: 1.55;\n      font-weight: 600;\n    }\n\n    .badge {\n      flex: 0 0 auto;\n      padding: 6px 9px;\n      border-radius: 999px;\n      color: #64748b;\n      background: #f2f5f9;\n      border: 1px solid #e3e9f2;\n      font-size: 11px;\n      font-weight: 900;\n      white-space: nowrap;\n    }\n\n    .badge.required {\n      color: #9a5b00;\n      background: #fff6df;\n      border-color: #f4d68f;\n    }\n\n    .two-col {\n      display: grid;\n      grid-template-columns: repeat(2, minmax(0, 1fr));\n      gap: 14px;\n    }\n\n    .continent-grid {\n      display: grid;\n      grid-template-columns: repeat(5, minmax(0, 1fr));\n      gap: 8px;\n    }\n\n    .choice {\n      min-height: 90px;\n      padding: 12px 8px;\n      border-radius: var(--radius);\n      border: 1px solid #dbe3ee;\n      color: #445166;\n      background: #fff;\n      transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;\n    }\n\n    .choice:hover {\n      transform: translateY(-2px);\n      border-color: #9cc1ff;\n      box-shadow: 0 10px 22px rgba(15, 107, 255, 0.12);\n    }\n\n    .choice.active {\n      color: #063b90;\n      border-color: var(--brand);\n      background: #eaf3ff;\n      box-shadow: 0 10px 22px rgba(15, 107, 255, 0.14);\n    }\n\n    .choice-icon {\n      display: block;\n      margin-bottom: 7px;\n      font-size: 24px;\n    }\n\n    .choice-label {\n      display: block;\n      font-size: 12px;\n      line-height: 1.25;\n      font-weight: 900;\n      word-break: keep-all;\n    }\n\n    .chips,\n    .tags {\n      display: flex;\n      flex-wrap: wrap;\n      gap: 8px;\n    }\n\n    .chips {\n      margin-top: 12px;\n    }\n\n    .chip {\n      min-height: 36px;\n      padding: 8px 13px;\n      border-radius: 999px;\n      border: 1px solid #dbe3ee;\n      color: #4b5a70;\n      background: #fff;\n      font-size: 13px;\n      font-weight: 800;\n      transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;\n    }\n\n    .chip:hover {\n      border-color: #9cc1ff;\n      color: #063b90;\n    }\n\n    .chip.active {\n      color: #fff;\n      border-color: var(--brand);\n      background: var(--brand);\n    }\n\n    .input-row {\n      display: flex;\n      gap: 8px;\n      margin-top: 12px;\n    }\n\n    .input,\n    .date-input {\n      width: 100%;\n      min-height: 48px;\n      padding: 0 14px;\n      border-radius: var(--radius);\n      border: 1px solid #d4deeb;\n      outline: none;\n      color: var(--ink);\n      background: #fff;\n      font-size: 14px;\n      font-weight: 700;\n      transition: border-color 0.15s ease, box-shadow 0.15s ease;\n    }\n\n    .input:focus,\n    .date-input:focus {\n      border-color: var(--brand);\n      box-shadow: 0 0 0 4px rgba(15, 107, 255, 0.12);\n    }\n\n    .input::placeholder {\n      color: #9aa6b6;\n      font-weight: 600;\n    }\n\n    .date-grid {\n      display: grid;\n      grid-template-columns: repeat(2, minmax(0, 1fr));\n      gap: 10px;\n    }\n\n    .field-label {\n      display: block;\n      margin-bottom: 7px;\n      color: #738095;\n      font-size: 11px;\n      font-weight: 900;\n      text-transform: uppercase;\n    }\n\n    .notice {\n      display: none;\n      align-items: center;\n      justify-content: space-between;\n      gap: 12px;\n      margin-top: 12px;\n      padding: 12px 13px;\n      border-radius: var(--radius);\n      color: #07543f;\n      background: #e8f8f1;\n      border: 1px solid #bfe9d7;\n      font-size: 13px;\n      font-weight: 900;\n    }\n\n    .notice.show {\n      display: flex;\n    }\n\n    .counter-list {\n      display: grid;\n      gap: 9px;\n    }\n\n    .counter-list[hidden] {\n      display: none;\n    }\n\n    .travel-mode {\n      display: grid;\n      grid-template-columns: repeat(2, minmax(0, 1fr));\n      gap: 8px;\n      margin-bottom: 14px;\n    }\n\n    .travel-mode button {\n      min-height: 58px;\n      display: flex;\n      align-items: center;\n      gap: 10px;\n      padding: 12px;\n      border-radius: var(--radius);\n      color: #536174;\n      background: #fff;\n      border: 1px solid #dbe3ee;\n      text-align: left;\n      font-weight: 950;\n      transition: border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;\n    }\n\n    .travel-mode button.active {\n      color: #075985;\n      background: #f0f9ff;\n      border-color: #7dd3fc;\n      box-shadow: 0 10px 20px rgba(14, 165, 233, 0.12);\n    }\n\n    .travel-mode span {\n      font-size: 20px;\n      line-height: 1;\n    }\n\n    .travel-mode small {\n      display: block;\n      margin-top: 2px;\n      color: #8995a8;\n      font-size: 11px;\n      font-weight: 700;\n    }\n\n    .counter-row {\n      min-height: 62px;\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      gap: 14px;\n      padding: 12px;\n      border-radius: var(--radius);\n      background: #f6f9fc;\n      border: 1px solid #e2e8f0;\n    }\n\n    .counter-name {\n      display: flex;\n      align-items: center;\n      gap: 10px;\n      min-width: 0;\n      font-size: 14px;\n      font-weight: 950;\n    }\n\n    .counter-name small {\n      display: block;\n      margin-top: 2px;\n      color: #8995a8;\n      font-size: 11px;\n      font-weight: 700;\n    }\n\n    .counter-control {\n      display: flex;\n      align-items: center;\n      gap: 10px;\n      flex: 0 0 auto;\n    }\n\n    .round {\n      width: 34px;\n      height: 34px;\n      display: grid;\n      place-items: center;\n      border-radius: 999px;\n      color: #344256;\n      background: #fff;\n      border: 1px solid #d4deeb;\n      font-size: 18px;\n      font-weight: 900;\n      transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;\n    }\n\n    .round:hover:not(:disabled) {\n      color: var(--brand);\n      border-color: var(--brand);\n      background: #eaf3ff;\n    }\n\n    .round:disabled {\n      opacity: 0.35;\n      cursor: not-allowed;\n    }\n\n    .count {\n      width: 26px;\n      text-align: center;\n      font-size: 19px;\n      font-weight: 950;\n    }\n\n    .budget-grid {\n      display: grid;\n      grid-template-columns: repeat(4, minmax(0, 1fr));\n      gap: 8px;\n    }\n\n    .budget {\n      min-height: 104px;\n      padding: 13px 10px;\n      border-radius: var(--radius);\n      border: 1px solid #dbe3ee;\n      background: #fff;\n      color: #445166;\n      text-align: left;\n      transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;\n    }\n\n    .budget:hover {\n      transform: translateY(-2px);\n      border-color: #f0c15f;\n      box-shadow: 0 10px 22px rgba(255, 176, 32, 0.14);\n    }\n\n    .budget.active {\n      border-color: var(--accent);\n      background: #fff8e7;\n      box-shadow: 0 10px 22px rgba(255, 176, 32, 0.16);\n    }\n\n    .budget strong {\n      display: block;\n      margin: 7px 0 3px;\n      color: #1f2937;\n      font-size: 14px;\n      font-weight: 950;\n    }\n\n    .budget span {\n      color: #7c8798;\n      font-size: 11px;\n      line-height: 1.35;\n      font-weight: 700;\n    }\n\n    .purpose-grid {\n      display: flex;\n      flex-wrap: wrap;\n      gap: 8px;\n    }\n\n    .suggestion-block {\n      margin-top: 14px;\n      padding-top: 14px;\n      border-top: 1px solid #e2e8f0;\n    }\n\n    .suggestion-title {\n      margin: 0 0 10px;\n      color: #738095;\n      font-size: 12px;\n      font-weight: 900;\n    }\n\n    .intensity-wrap {\n      display: grid;\n      gap: 16px;\n    }\n\n    .intensity-main {\n      display: grid;\n      grid-template-columns: 104px 1fr;\n      gap: 10px;\n      align-items: stretch;\n    }\n\n    .score {\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      gap: 4px;\n      border-radius: var(--radius);\n      border: 1px solid #dbe3ee;\n      background: #fff;\n    }\n\n    .score input {\n      width: 52px;\n      border: 0;\n      outline: 0;\n      color: var(--brand);\n      background: transparent;\n      text-align: center;\n      font-size: 24px;\n      font-weight: 950;\n      -moz-appearance: textfield;\n    }\n\n    .score input::-webkit-inner-spin-button,\n    .score input::-webkit-outer-spin-button {\n      -webkit-appearance: none;\n    }\n\n    .score span {\n      color: #94a0b1;\n      font-size: 12px;\n      font-weight: 900;\n    }\n\n    .intensity-text {\n      display: flex;\n      align-items: center;\n      padding: 12px 14px;\n      border-radius: var(--radius);\n      color: #344256;\n      background: #f6f9fc;\n      border: 1px solid #e2e8f0;\n      font-size: 13px;\n      line-height: 1.5;\n      font-weight: 850;\n      word-break: keep-all;\n    }\n\n    .range {\n      width: 100%;\n      height: 8px;\n      border-radius: 999px;\n      outline: 0;\n      cursor: pointer;\n      appearance: none;\n      background: linear-gradient(to right, var(--brand) 0%, var(--brand) 50%, #dbe3ee 50%, #dbe3ee 100%);\n    }\n\n    .range::-webkit-slider-thumb {\n      width: 24px;\n      height: 24px;\n      border-radius: 999px;\n      border: 4px solid #fff;\n      background: var(--brand);\n      box-shadow: 0 6px 16px rgba(15, 107, 255, 0.34);\n      appearance: none;\n    }\n\n    .range::-moz-range-thumb {\n      width: 18px;\n      height: 18px;\n      border-radius: 999px;\n      border: 4px solid #fff;\n      background: var(--brand);\n      box-shadow: 0 6px 16px rgba(15, 107, 255, 0.34);\n    }\n\n    .range-labels {\n      display: flex;\n      justify-content: space-between;\n      color: #8995a8;\n      font-size: 11px;\n      font-weight: 850;\n    }\n\n    .add-button {\n      flex: 0 0 auto;\n      min-height: 48px;\n      padding: 0 16px;\n      border-radius: var(--radius);\n      color: #fff;\n      background: var(--navy);\n      font-size: 13px;\n      font-weight: 950;\n      transition: transform 0.15s ease, opacity 0.15s ease;\n    }\n\n    .add-button:hover {\n      transform: translateY(-1px);\n    }\n\n    .tag {\n      display: inline-flex;\n      align-items: center;\n      gap: 6px;\n      min-height: 34px;\n      padding: 7px 11px;\n      border-radius: 999px;\n      color: #063b90;\n      background: #eaf3ff;\n      border: 1px solid #c9ddff;\n      font-size: 13px;\n      font-weight: 900;\n    }\n\n    .tag.place {\n      color: #07543f;\n      background: #e8f8f1;\n      border-color: #bfe9d7;\n    }\n\n    .tag button {\n      width: 18px;\n      height: 18px;\n      display: grid;\n      place-items: center;\n      border-radius: 999px;\n      color: currentColor;\n      background: rgba(255, 255, 255, 0.62);\n      font-size: 13px;\n      line-height: 1;\n      font-weight: 950;\n    }\n\n    .hashbox {\n      display: flex;\n      align-items: center;\n      min-height: 50px;\n      border-radius: var(--radius);\n      border: 1px solid #d4deeb;\n      background: #fff;\n      overflow: hidden;\n      transition: border-color 0.15s ease, box-shadow 0.15s ease;\n    }\n\n    .hashbox:focus-within {\n      border-color: var(--brand);\n      box-shadow: 0 0 0 4px rgba(15, 107, 255, 0.12);\n    }\n\n    .hashmark {\n      padding-left: 15px;\n      color: var(--brand);\n      font-size: 19px;\n      font-weight: 950;\n    }\n\n    .hashbox input {\n      flex: 1;\n      min-width: 0;\n      height: 50px;\n      padding: 0 14px 0 6px;\n      border: 0;\n      outline: 0;\n      color: var(--ink);\n      background: transparent;\n      font-size: 14px;\n      font-weight: 750;\n    }\n\n    .hint {\n      margin: 9px 0 0;\n      color: #8793a6;\n      font-size: 12px;\n      line-height: 1.45;\n      font-weight: 650;\n    }\n\n    .action-bar {\n      z-index: 1;\n      width: 100%;\n      margin-top: 18px;\n      display: grid;\n      grid-template-columns: 1fr auto;\n      gap: 12px;\n      align-items: center;\n      padding: 14px;\n      border-radius: var(--radius);\n      background: #f6f9fc;\n      border: 1px solid #e2e8f0;\n    }\n\n    .bar-copy {\n      min-width: 0;\n      padding-left: 8px;\n    }\n\n    .bar-title {\n      margin: 0;\n      overflow: hidden;\n      color: var(--ink);\n      font-size: 14px;\n      line-height: 1.35;\n      font-weight: 950;\n      text-overflow: ellipsis;\n      white-space: nowrap;\n    }\n\n    .bar-sub {\n      margin: 3px 0 0;\n      overflow: hidden;\n      color: var(--muted);\n      font-size: 12px;\n      line-height: 1.35;\n      font-weight: 650;\n      text-overflow: ellipsis;\n      white-space: nowrap;\n    }\n\n    .submit {\n      min-height: 50px;\n      padding: 0 24px;\n      border-radius: var(--radius);\n      color: #fff;\n      background: linear-gradient(135deg, var(--brand), #004ec2);\n      box-shadow: 0 12px 22px rgba(15, 107, 255, 0.26);\n      font-size: 14px;\n      font-weight: 950;\n      transition: transform 0.16s ease, opacity 0.16s ease, background 0.16s ease;\n    }\n\n    .submit:hover:not(:disabled) {\n      transform: translateY(-1px);\n    }\n\n    .submit:disabled {\n      color: #8b96a8;\n      background: #e5ebf3;\n      box-shadow: none;\n      cursor: not-allowed;\n    }\n\n    .confirm-modal {\n      position: fixed;\n      inset: 0;\n      z-index: 100;\n      display: none;\n      align-items: center;\n      justify-content: center;\n      padding: 20px;\n      background: rgba(7, 17, 31, 0.62);\n    }\n\n    .confirm-modal.show {\n      display: flex;\n    }\n\n    .confirm-dialog {\n      width: min(100%, 560px);\n      max-height: min(760px, calc(100vh - 40px));\n      display: grid;\n      grid-template-rows: auto 1fr auto;\n      border-radius: var(--radius);\n      background: #fff;\n      box-shadow: 0 24px 70px rgba(7, 17, 31, 0.28);\n      overflow: hidden;\n    }\n\n    .confirm-head,\n    .confirm-actions {\n      padding: 20px;\n    }\n\n    .confirm-head {\n      border-bottom: 1px solid #e2e8f0;\n    }\n\n    .confirm-head h3 {\n      margin: 0;\n      color: var(--ink);\n      font-size: 20px;\n      line-height: 1.25;\n      font-weight: 950;\n      letter-spacing: 0;\n    }\n\n    .confirm-head p {\n      margin: 6px 0 0;\n      color: var(--muted);\n      font-size: 13px;\n      line-height: 1.55;\n      font-weight: 650;\n    }\n\n    .confirm-body {\n      display: grid;\n      gap: 10px;\n      padding: 18px 20px;\n      overflow: auto;\n    }\n\n    .confirm-row {\n      display: grid;\n      grid-template-columns: 106px 1fr;\n      gap: 12px;\n      padding: 12px;\n      border-radius: var(--radius);\n      background: #f6f9fc;\n      border: 1px solid #e2e8f0;\n    }\n\n    .confirm-row dt {\n      color: #738095;\n      font-size: 12px;\n      line-height: 1.45;\n      font-weight: 900;\n    }\n\n    .confirm-row dd {\n      margin: 0;\n      color: var(--ink);\n      font-size: 13px;\n      line-height: 1.55;\n      font-weight: 800;\n      word-break: keep-all;\n    }\n\n    .confirm-actions {\n      display: flex;\n      justify-content: flex-end;\n      gap: 8px;\n      border-top: 1px solid #e2e8f0;\n      background: #f8fafc;\n    }\n\n    .confirm-button {\n      min-height: 44px;\n      padding: 0 16px;\n      border-radius: var(--radius);\n      font-size: 13px;\n      font-weight: 950;\n    }\n\n    .confirm-button.light {\n      color: #475569;\n      background: #fff;\n      border: 1px solid #dbe3ee;\n    }\n\n    .confirm-button.primary {\n      color: #fff;\n      background: var(--navy);\n    }\n\n    @media (max-width: 1120px) {\n      .shell {\n        grid-template-columns: 1fr;\n      }\n\n      .cover {\n        position: relative;\n        height: auto;\n        min-height: 520px;\n      }\n\n      .work {\n        padding-top: 18px;\n      }\n    }\n\n    @media (max-width: 760px) {\n      .cover,\n      .work {\n        padding-left: 18px;\n        padding-right: 18px;\n      }\n\n      .cover {\n        min-height: 470px;\n      }\n\n      .brand {\n        align-items: flex-start;\n      }\n\n      .cover h1 {\n        font-size: 46px;\n      }\n\n      .topbar {\n        align-items: flex-start;\n        flex-direction: column;\n      }\n\n      .progress {\n        width: 100%;\n        flex-basis: auto;\n      }\n\n      .two-col,\n      .date-grid,\n      .intensity-main {\n        grid-template-columns: 1fr;\n      }\n\n      .journey-nav {\n        top: 112px;\n        display: flex;\n        overflow-x: auto;\n        scrollbar-width: none;\n      }\n\n      .journey-nav::-webkit-scrollbar {\n        display: none;\n      }\n\n      .journey-tab {\n        flex: 0 0 132px;\n      }\n\n      .continent-grid {\n        grid-template-columns: repeat(2, minmax(0, 1fr));\n      }\n\n      .budget-grid {\n        grid-template-columns: repeat(2, minmax(0, 1fr));\n      }\n\n      .panel {\n        padding: 18px;\n      }\n\n      .step-hero {\n        padding: 22px;\n      }\n\n      .panel-head {\n        flex-direction: column;\n        gap: 10px;\n      }\n\n      .badge {\n        align-self: flex-start;\n      }\n\n      .input-row {\n        flex-direction: column;\n      }\n\n      .bar-copy {\n        padding-left: 0;\n      }\n\n      .action-bar {\n        grid-template-columns: 1fr;\n      }\n\n      .submit {\n        width: 100%;\n      }\n\n      .collab-help {\n        right: 0;\n      }\n\n      .confirm-row {\n        grid-template-columns: 1fr;\n        gap: 4px;\n      }\n\n      .confirm-actions {\n        display: grid;\n        grid-template-columns: 1fr;\n      }\n    }\n\n    @media (max-width: 420px) {\n      .cover h1 {\n        font-size: 39px;\n      }\n\n      .continent-grid,\n      .budget-grid {\n        grid-template-columns: 1fr;\n      }\n\n      .choice,\n      .budget {\n        min-height: 74px;\n      }\n    }\n  "

export default function AiGenerationInputForm() {
  const [openCalendar, setOpenCalendar] = useState(null)
  const [dates, setDates] = useState({ startDate: '', endDate: '' })
  const [tomorrow] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10))

  const applyDate = (field, value) => {
    setDates(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'startDate' && next.endDate && next.endDate <= value) {
        next.endDate = ''
      }
      return next
    })

    const input = document.getElementById(field)
    if (input) {
      input.value = value
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }

    if (field === 'startDate') {
      const endInput = document.getElementById('endDate')
      if (endInput && dates.endDate && dates.endDate <= value) {
        endInput.value = ''
        endInput.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }

  useEffect(() => {
    const CONTINENTS = [
          { key: "asia", label: "아시아", icon: "🌏", countries: ["일본", "태국", "베트남", "싱가포르", "인도네시아", "대만", "홍콩", "말레이시아", "필리핀"] },
          { key: "europe", label: "유럽", icon: "🏰", countries: ["프랑스", "이탈리아", "스페인", "영국", "독일", "체코", "포르투갈", "그리스", "스위스"] },
          { key: "americas", label: "아메리카", icon: "🗽", countries: ["미국", "캐나다", "멕시코", "브라질", "페루", "아르헨티나", "쿠바", "칠레"] },
          { key: "oceania", label: "오세아니아", icon: "🦘", countries: ["호주", "뉴질랜드", "피지", "괌", "사이판", "하와이"] },
          { key: "mea", label: "중동·아프리카", icon: "🌴", countries: ["튀르키예", "두바이(UAE)", "모로코", "이집트", "케냐", "남아공", "요르단"] }
        ];
    
        const BUDGETS = [
          { key: "low", label: "알뜰", icon: "💰", sub: "~10만원/일", rate: 100000 },
          { key: "mid", label: "보통", icon: "💳", sub: "~30만원/일", rate: 300000 },
          { key: "high", label: "여유", icon: "🌟", sub: "~50만원/일", rate: 500000 },
          { key: "lux", label: "럭셔리", icon: "💎", sub: "제한 없음", rate: null }
        ];
    
        const STYLE_SUGGESTIONS = [
          "관광",
          "휴양",
          "맛집탐방",
          "카페투어",
          "쇼핑",
          "자연힐링",
          "문화예술",
          "사진스팟",
          "가족여행",
          "허니문",
          "액티비티",
          "야경",
          "로컬마켓",
          "온천스파"
        ];
    
        const INTENSITY_LABELS = [
          { max: 10, text: "완전 휴양 - 느긋하게 쉬는 여행" },
          { max: 25, text: "여유 있는 관광 - 하루 1~2곳" },
          { max: 40, text: "가벼운 여행 - 무리 없는 일정" },
          { max: 55, text: "적당한 관광 - 균형 잡힌 일정" },
          { max: 70, text: "알찬 여행 - 하루 3~5곳 방문" },
          { max: 85, text: "바쁜 여행 - 촘촘한 이동 동선" },
          { max: 100, text: "익스트림 - 쉬는 시간 없는 여행" }
        ];
    
        const state = {
          continent: "",
          destinations: [],
          startDate: "",
          endDate: "",
          travelMode: "personal",
          adults: 1,
          teens: 0,
          children: 0,
          infants: 0,
          budget: "",
          intensity: 0,
          budgetTouched: false,
          intensityTouched: false,
          places: [],
          styles: []
        };
    
        const STEPS = [
          { icon: "📅", title: "일정", sub: "언제 누구와", required: true, done: () => Boolean(state.startDate && state.endDate && getNights() > 0) },
          { icon: "🌍", title: "여행지", sub: "어디로", required: true, done: () => state.destinations.length > 0 },
          { icon: "💰", title: "예산", sub: "여행 밀도", required: false, done: () => false },
          { icon: "⚡", title: "속도", sub: "여행 강도", required: false, done: () => false },
          { icon: "✨", title: "스타일", sub: "선택하면 정교해져요", required: false, done: () => state.styles.length > 0 }
        ];
    
        const STEP_GUIDES = [
          "일정은 필수 입력입니다.",
          "여행지는 필수 입력입니다.",
          "예산을 입력하면 정교한 일정생성이 가능합니다.",
          "속도를 입력하면 정교한 일정생성이 가능합니다.",
          "스타일을 입력하면 정교한 일정생성이 가능합니다."
        ];
    
        const STEP_DONE_GUIDES = [
          "일정이 입력되었습니다.",
          "여행지가 입력되었습니다.",
          "예산이 입력되었습니다.",
          "속도가 입력되었습니다.",
          "스타일이 입력되었습니다."
        ];
    
        let currentStep = 0;
    
        const $ = id => document.getElementById(id);
        let warningTimer;
        let collabHelpTimer;
        let collabButtonWasVisible = false;
    
        function escapeHtml(value) {
          return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        }
    
        function renderStepNav() {
          $("journeyNav").innerHTML = STEPS.map((step, index) => `
            <button class="journey-tab ${index === currentStep ? "active" : ""} ${index < currentStep || (step.required && step.done()) ? "done" : ""}" type="button" data-step="${index}">
              <span>${step.icon}</span>
              <span><strong>${step.title}</strong><small>${step.sub}</small></span>
            </button>
          `).join("");
        }
    
        function goStep(index) {
          currentStep = Math.min(STEPS.length - 1, Math.max(0, Number(index)));
          document.querySelectorAll("[data-step-panel]").forEach(panel => {
            panel.classList.toggle("active", Number(panel.dataset.stepPanel) === currentStep);
          });
          validate();
          document.querySelector(".work").scrollIntoView({ behavior: "smooth", block: "start" });
        }
    
        function showStepWarning(step, message) {
          clearTimeout(warningTimer);
          clearStepWarnings();
          const warning = $(`step${step}Warning`);
          if (!warning) return;
          warning.textContent = message;
          warning.classList.add("show");
          warningTimer = setTimeout(() => {
            warning.textContent = "";
            warning.classList.remove("show");
          }, 2000);
        }
    
        function clearStepWarnings() {
          clearTimeout(warningTimer);
          document.querySelectorAll(".step-warning").forEach(warning => {
            warning.textContent = "";
            warning.classList.remove("show");
          });
        }
    
        function canGoStep(targetStep) {
          const next = Number(targetStep);
          if (next <= currentStep) return true;
    
          if (next > 0 && state.travelMode === "group" && adultTeenTotal() < 2) {
            currentStep = 0;
            document.querySelectorAll("[data-step-panel]").forEach(panel => {
              panel.classList.toggle("active", Number(panel.dataset.stepPanel) === currentStep);
            });
            validate();
            showStepWarning(0, "단체는 2인 이상이어야 합니다.");
            return false;
          }
    
          if (next > 0 && !(state.startDate && state.endDate && getNights() > 0)) {
            currentStep = 0;
            document.querySelectorAll("[data-step-panel]").forEach(panel => {
              panel.classList.toggle("active", Number(panel.dataset.stepPanel) === currentStep);
            });
            validate();
            showStepWarning(0, "일정을 먼저 입력해주세요.");
            return false;
          }
    
          if (next > 1 && state.destinations.length === 0) {
            currentStep = 1;
            document.querySelectorAll("[data-step-panel]").forEach(panel => {
              panel.classList.toggle("active", Number(panel.dataset.stepPanel) === currentStep);
            });
            validate();
            showStepWarning(1, "여행지를 먼저 입력해주세요.");
            return false;
          }
    
          return true;
        }
    
        function renderContinents() {
          $("contGrid").innerHTML = CONTINENTS.map(item => `
            <button class="choice ${state.continent === item.key ? "active" : ""}" type="button" data-continent="${item.key}">
              <span class="choice-icon">${item.icon}</span>
              <span class="choice-label">${item.label}</span>
            </button>
          `).join("");
        }
    
        function renderCountries() {
          const selected = CONTINENTS.find(item => item.key === state.continent);
          $("countryChips").innerHTML = selected ? selected.countries.map(country => `
            <button class="chip ${state.destinations.includes(country) ? "active" : ""}" type="button" data-country="${country}">${country}</button>
          `).join("") : "";
        }
    
        function renderDestinations() {
          $("destinationTags").innerHTML = state.destinations.map((destination, index) => `
            <span class="tag">${destination}<button type="button" data-remove-destination="${index}" aria-label="${destination} 삭제">×</button></span>
          `).join("");
        }
    
        function renderBudgets() {
          $("budgetGrid").innerHTML = BUDGETS.map(item => `
            <button class="budget ${state.budgetTouched && state.budget === item.key ? "active" : ""}" type="button" data-budget="${item.key}">
              <div>${item.icon}</div>
              <strong>${item.label}</strong>
              <span>${item.sub}</span>
            </button>
          `).join("");
          updateBudgetEstimate();
        }
    
        function renderStyleSuggestions() {
          $("styleSuggestChips").innerHTML = STYLE_SUGGESTIONS.map(style => `
            <button class="chip ${state.styles.includes(style) ? "active" : ""}" type="button" data-style-suggest="${style}">${style}</button>
          `).join("");
        }
    
        function renderCounters() {
          $("adultsVal").textContent = state.adults;
          $("teensVal").textContent = state.teens;
          $("childrenVal").textContent = state.children;
          $("infantsVal").textContent = state.infants;
          $("counterList").hidden = state.travelMode !== "group";
          $("travelerModeNote").textContent = state.travelMode === "group"
            ? "단체 여행은 인원을 설정한 뒤 함께 계획할 수 있습니다."
            : "개인 여행은 1명으로 일정이 생성됩니다.";
          document.querySelectorAll("[data-travel-mode]").forEach(button => {
            button.classList.toggle("active", button.dataset.travelMode === state.travelMode);
          });
          document.querySelectorAll("[data-count]").forEach(button => {
            const key = button.dataset.count;
            const min = key === "adults" ? 1 : 0;
            button.disabled = Number(button.dataset.dir) < 0 && state[key] <= min;
          });
          updateCollabButton();
        }
    
        function counterValue(id, fallback) {
          const value = parseInt($(id).textContent, 10);
          return Number.isNaN(value) ? fallback : value;
        }
    
        function adultTeenTotal() {
          if (state.travelMode !== "group") return 1;
          return counterValue("adultsVal", state.adults) + counterValue("teensVal", state.teens);
        }
    
        function updateCollabButton() {
          const shouldShow = state.travelMode === "group" && adultTeenTotal() >= 2;
          $("collabPlanBtn").hidden = !shouldShow;
          if (shouldShow && !collabButtonWasVisible) {
            showCollabHelp();
          }
          if (!shouldShow) {
            hideCollabHelp();
          }
          collabButtonWasVisible = shouldShow;
        }
    
        function showCollabHelp() {
          clearTimeout(collabHelpTimer);
          $("collabHelp").hidden = false;
          collabHelpTimer = setTimeout(hideCollabHelp, 3000);
        }
    
        function hideCollabHelp() {
          clearTimeout(collabHelpTimer);
          $("collabHelp").hidden = true;
        }
    
        function renderPlaces() {
          $("placeTags").innerHTML = state.places.map((place, index) => `
            <span class="tag place">${place}<button type="button" data-remove-place="${index}" aria-label="${place} 삭제">×</button></span>
          `).join("");
        }
    
        function renderStyles() {
          $("styleTags").innerHTML = state.styles.map((style, index) => `
            <span class="tag">#${style}<button type="button" data-remove-style="${index}" aria-label="${style} 삭제">×</button></span>
          `).join("");
          renderStyleSuggestions();
        }
    
        function getNights() {
          if (!state.startDate || !state.endDate) return 0;
          return Math.max(0, Math.round((new Date(state.endDate) - new Date(state.startDate)) / 86400000));
        }
    
        function getTripDays() {
          const nights = getNights();
          return nights > 0 ? nights + 1 : 0;
        }
    
        function formatDate(value) {
          if (!value) return "";
          return new Intl.DateTimeFormat("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "short"
          }).format(new Date(value));
        }
    
        function updateDateSummary() {
          const nights = getNights();
          const summary = $("dateSummary");
          if (nights > 0) {
            summary.innerHTML = `<span>총 여행 기간</span><strong>${nights}박 ${nights + 1}일</strong>`;
            summary.classList.add("show");
          } else {
            summary.classList.remove("show");
            summary.innerHTML = "";
          }
          updateBudgetEstimate();
        }
    
        function updateBudgetEstimate() {
          const days = getTripDays();
          const selected = BUDGETS.find(item => item.key === state.budget);
          const estimate = $("budgetEstimate");
          if (state.budgetTouched && days && selected && selected.rate) {
            const travelers = state.adults + state.teens + state.children;
            const total = selected.rate * days * travelers;
            estimate.innerHTML = `<span>예상 경비 (항공 제외)</span><strong>약 ${total.toLocaleString("ko-KR")}원</strong>`;
            estimate.classList.add("show");
          } else {
            estimate.classList.remove("show");
            estimate.innerHTML = "";
          }
        }
    
        function destinationLabel() {
          if (!state.destinations.length) return "";
          if (state.destinations.length <= 2) return state.destinations.join(", ");
          return `${state.destinations.slice(0, 2).join(", ")} 외 ${state.destinations.length - 2}곳`;
        }
    
        function summaryChips() {
          const nights = getNights();
          const budget = BUDGETS.find(item => item.key === state.budget);
          const chips = [];
          const showDefaults = currentStep > 0;
    
          if (state.destinations.length) chips.push(destinationLabel());
          if (state.places.length) chips.push(`고정 장소 ${state.places.length}곳`);
          if (nights > 0) chips.push(`${nights}박 ${nights + 1}일`);
          if (showDefaults) chips.push(`${state.adults + state.teens + state.children + state.infants}명`);
          if (state.budgetTouched && budget) chips.push(budget.label);
          if (state.intensityTouched) chips.push(`강도 ${state.intensity}/100`);
          state.styles.forEach(style => chips.push(`#${style}`));
    
          return chips;
        }
    
        function renderSummaryLines({ hasDestination, hasDates, hasStyle }) {
          const done = [
            hasDates,
            hasDestination,
            state.budgetTouched,
            state.intensityTouched,
            hasStyle
          ];
    
          $("coverSummary").innerHTML = STEP_GUIDES.map((guide, index) => `
            <p class="summary-line ${done[index] ? "done" : ""}">
              <span class="summary-line-icon">${done[index] ? "✓" : "×"}</span>
              <span>${done[index] ? STEP_DONE_GUIDES[index] : guide}</span>
            </p>
          `).join("");
        }
    
        function setIntensity(value, touched = false) {
          const next = Math.min(100, Math.max(0, parseInt(value, 10) || 0));
          state.intensity = next;
          if (touched) state.intensityTouched = true;
          $("intNum").value = next;
          $("intSlider").value = next;
    
          const pct = next;
          const color = next <= 30 ? "#0f6bff" : next <= 60 ? "#00a676" : next <= 80 ? "#ffb020" : "#ef4444";
          $("intSlider").style.background = `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #dbe3ee ${pct}%, #dbe3ee 100%)`;
          $("intDesc").textContent = state.intensityTouched
            ? (INTENSITY_LABELS.find(item => next <= item.max) || INTENSITY_LABELS[INTENSITY_LABELS.length - 1]).text
            : "강도를 정해주세요";
          validate();
        }
    
        function addDestination(raw) {
          const value = raw.trim();
          if (!value || state.destinations.includes(value)) return;
          state.destinations.push(value);
          renderCountries();
          renderDestinations();
          clearStepWarnings();
          validate();
        }
    
        function addPlace() {
          const value = $("placeInput").value.trim();
          if (value && !state.places.includes(value)) {
            state.places.push(value);
            renderPlaces();
            validate();
          }
          $("placeInput").value = "";
          $("placeInput").focus();
        }
    
        function addStyle(raw) {
          const value = raw.replace(/^#+/, "").trim();
          if (!value || state.styles.includes(value)) return;
          state.styles.push(value);
          renderStyles();
          validate();
        }
    
        function addPendingStyle() {
          const input = $("styleInput");
          const value = input.value;
          if (!value.trim()) return;
          addStyle(value);
          input.value = "";
        }
    
        function travelerText() {
          if (state.travelMode === "personal") return "개인 여행 · 성인 1명";
          const parts = [`성인 ${state.adults}명`];
          if (state.teens) parts.push(`청소년 ${state.teens}명`);
          if (state.children) parts.push(`어린이 ${state.children}명`);
          if (state.infants) parts.push(`유아 ${state.infants}명`);
          return parts.join(" · ");
        }
    
        function confirmRows() {
          const nights = getNights();
          const budget = BUDGETS.find(item => item.key === state.budget);
          const rows = [
            ["여행지", destinationLabel()],
            ["여행 기간", `${formatDate(state.startDate)} ~ ${formatDate(state.endDate)} (${nights}박 ${nights + 1}일)`],
            ["인원", travelerText()],
            ["꼭 갈 장소", state.places.length ? state.places.join(", ") : "선택 안 함"],
            ["예산", state.budgetTouched && budget ? `${budget.label} (${budget.sub})` : "선택 안 함"],
            ["여행 강도", state.intensityTouched ? `${state.intensity}/100 · ${$("intDesc").textContent}` : "선택 안 함"],
            ["여행 스타일", state.styles.length ? state.styles.map(style => `#${style}`).join(" ") : "선택 안 함"]
          ];
          return rows;
        }
    
        function tripDraft() {
          const budget = BUDGETS.find(item => item.key === state.budget);
          return {
            destination: destinationLabel(),
            destinations: [...state.destinations],
            startDate: state.startDate,
            endDate: state.endDate,
            nights: getNights(),
            travelMode: state.travelMode,
            adults: state.adults,
            teens: state.teens,
            children: state.children,
            infants: state.infants,
            budget: state.budgetTouched && budget ? `${budget.label} (${budget.sub})` : "",
            intensity: state.intensityTouched ? `${state.intensity}/100 · ${$("intDesc").textContent}` : "",
            places: [...state.places],
            styles: [...state.styles]
          };
        }
    
        function openConfirmModal() {
          addPendingStyle();
          $("confirmBody").innerHTML = confirmRows().map(([label, value]) => `
            <div class="confirm-row">
              <dt>${escapeHtml(label)}</dt>
              <dd>${escapeHtml(value)}</dd>
            </div>
          `).join("");
          $("confirmModal").classList.add("show");
          $("confirmCreateBtn").focus();
        }
    
        function closeConfirmModal() {
          $("confirmModal").classList.remove("show");
          $("submitBtn").focus();
        }
    
        function validate() {
          const hasDestination = state.destinations.length > 0;
          const hasDates = Boolean(state.startDate && state.endDate && getNights() > 0);
          const hasStyle = state.styles.length > 0;
          const requiredDone = [hasDestination, hasDates].filter(Boolean).length;
          const ready = requiredDone === 2;
    
          $("submitBtn").disabled = !ready;
          $("progressFill").style.width = `${(requiredDone / 2) * 100}%`;
          $("stepMini").innerHTML = [hasDates, hasDestination].map(ok => `<span class="dot ${ok ? "done" : ""}"></span>`).join("");
    
          const nights = getNights();
          const total = state.adults + state.teens + state.children + state.infants;
          const parts = [];
          if (hasDates) parts.push(`${nights}박 ${nights + 1}일`);
          if (hasDestination) parts.push(destinationLabel());
          parts.push(`${total}명`);
    
          const title = hasDestination || hasDates ? parts.join(" · ") : "여행 조건을 입력해주세요";
          renderSummaryLines({ hasDestination, hasDates, hasStyle });
          $("barTitle").textContent = title;
    
          if (ready) {
            const detailParts = [];
            if (state.budgetTouched) detailParts.push("예산 반영");
            if (state.intensityTouched) detailParts.push(`강도 ${state.intensity}/100`);
            if (hasStyle) detailParts.push(`스타일 ${state.styles.length}개 반영`);
            const detail = detailParts.length
              ? detailParts.join(" · ")
              : "예산과 강도를 더하면 추천이 더 정교해집니다";
            $("barSub").textContent = detail;
          } else {
            const missing = [];
            if (!hasDates) missing.push("기간");
            if (!hasDestination) missing.push("여행지");
            const text = `${missing.join(", ")} 입력이 필요합니다.`;
            $("barSub").textContent = text;
          }
    
          const chips = summaryChips();
          $("coverChips").innerHTML = chips.length
            ? chips.map(chip => `<span class="summary-chip">${chip}</span>`).join("")
            : "";
    
          renderStepNav();
        }
    
        document.addEventListener("click", event => {
          const stepButton = event.target.closest("[data-step]");
          if (stepButton) {
            if (!canGoStep(stepButton.dataset.step)) return;
            clearStepWarnings();
            goStep(stepButton.dataset.step);
            return;
          }
    
          const goStepButton = event.target.closest("[data-go-step]");
          if (goStepButton) {
            if (!canGoStep(goStepButton.dataset.goStep)) return;
            clearStepWarnings();
            goStep(goStepButton.dataset.goStep);
            return;
          }
    
          const continentButton = event.target.closest("[data-continent]");
          if (continentButton) {
            state.continent = state.continent === continentButton.dataset.continent ? "" : continentButton.dataset.continent;
            renderContinents();
            renderCountries();
            return;
          }
    
          const countryButton = event.target.closest("[data-country]");
          if (countryButton) {
            const country = countryButton.dataset.country;
            state.destinations = state.destinations.includes(country)
              ? state.destinations.filter(item => item !== country)
              : [...state.destinations, country];
            renderCountries();
            renderDestinations();
            clearStepWarnings();
            validate();
            return;
          }
    
          const budgetButton = event.target.closest("[data-budget]");
          if (budgetButton) {
            state.budget = budgetButton.dataset.budget;
            state.budgetTouched = true;
            renderBudgets();
            validate();
            return;
          }
    
          const styleSuggestion = event.target.closest("[data-style-suggest]");
          if (styleSuggestion) {
            const value = styleSuggestion.dataset.styleSuggest;
            state.styles = state.styles.includes(value)
              ? state.styles.filter(item => item !== value)
              : [...state.styles, value];
            renderStyles();
            validate();
            return;
          }
    
          const travelModeButton = event.target.closest("[data-travel-mode]");
          if (travelModeButton) {
            state.travelMode = travelModeButton.dataset.travelMode;
            if (state.travelMode === "personal") {
              state.adults = 1;
              state.teens = 0;
              state.children = 0;
              state.infants = 0;
            } else if (state.adults + state.teens < 2) {
              state.adults = 2;
            }
            renderCounters();
            updateBudgetEstimate();
            validate();
            return;
          }
    
          const countButton = event.target.closest("[data-count]");
          if (countButton) {
            const key = countButton.dataset.count;
            const min = key === "adults" ? 1 : 0;
            state[key] = Math.min(20, Math.max(min, state[key] + Number(countButton.dataset.dir)));
            renderCounters();
            updateBudgetEstimate();
            validate();
            return;
          }
    
          const placeRemove = event.target.closest("[data-remove-place]");
          if (placeRemove) {
            state.places.splice(Number(placeRemove.dataset.removePlace), 1);
            renderPlaces();
            validate();
            return;
          }
    
          const destinationRemove = event.target.closest("[data-remove-destination]");
          if (destinationRemove) {
            state.destinations.splice(Number(destinationRemove.dataset.removeDestination), 1);
            renderCountries();
            renderDestinations();
            validate();
            return;
          }
    
          const styleRemove = event.target.closest("[data-remove-style]");
          if (styleRemove) {
            state.styles.splice(Number(styleRemove.dataset.removeStyle), 1);
            renderStyles();
            validate();
            return;
          }
    
          if (event.target.id === "placeAddBtn") {
            addPlace();
          }
        });
    
        $("destInput").addEventListener("keydown", event => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          addDestination(event.target.value);
          event.target.value = "";
        });
    
        $("placeInput").addEventListener("keydown", event => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          addPlace();
        });
    
        $("styleInput").addEventListener("keydown", event => {
          if (event.key === "Enter") {
            event.preventDefault();
            addStyle(event.target.value);
            event.target.value = "";
          }
    
          if (event.key === "Backspace" && !event.target.value && state.styles.length) {
            state.styles.pop();
            renderStyles();
            validate();
          }
        });
    
        $("startDate").addEventListener("change", event => {
          state.startDate = event.target.value;
          if (state.endDate && state.endDate <= state.startDate) {
            state.endDate = "";
            $("endDate").value = "";
          }
          $("endDate").min = state.startDate || tomorrow;
          clearStepWarnings();
          updateDateSummary();
          validate();
        });
    
        $("endDate").addEventListener("change", event => {
          state.endDate = event.target.value;
          clearStepWarnings();
          updateDateSummary();
          validate();
        });
    
        $("intSlider").addEventListener("input", event => setIntensity(event.target.value, true));
        $("intNum").addEventListener("input", event => setIntensity(event.target.value, true));
        $("intNum").addEventListener("blur", event => setIntensity(event.target.value, true));
    
        $("submitBtn").addEventListener("click", openConfirmModal);
    
        $("collabPlanBtn").addEventListener("click", () => {
          sessionStorage.setItem("aiTripDraft", JSON.stringify(tripDraft()));
          location.href = "websocket-planning.html";
        });
    
        $("confirmCloseBtn").addEventListener("click", closeConfirmModal);
    
        $("confirmModal").addEventListener("click", event => {
          if (event.target.id === "confirmModal") closeConfirmModal();
        });
    
        document.addEventListener("keydown", event => {
          if (event.key === "Escape" && $("confirmModal").classList.contains("show")) {
            closeConfirmModal();
          }
        });
    
        $("confirmCreateBtn").addEventListener("click", () => {
          sessionStorage.setItem("aiTripDraft", JSON.stringify(tripDraft()));
          $("confirmModal").classList.remove("show");
          location.href = "/ai-generation-loading";
        });
    
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        $("startDate").min = tomorrow;
        $("endDate").min = tomorrow;
    
        renderContinents();
        renderCountries();
        renderDestinations();
        renderBudgets();
        renderStyleSuggestions();
        renderCounters();
        renderPlaces();
        renderStyles();
        setIntensity(0);
        validate();
  }, [])

  return (
    <>
      <style>{pageStyle}</style>
      <main className="shell">
          <aside className="cover">
            <div className="brand">
              <a className="brand-mark" href="#">
                <span className="logo-box">✈</span>
                <span>폰가이즈</span>
              </a>
              <div className="step-mini" id="stepMini" aria-label="필수 입력 진행률"></div>
            </div>
      
            <section className="cover-copy">
              <div className="eyebrow">AI TRAVEL PLANNER</div>
              <h1>취향을 읽는<br />여행 설계</h1>
              <p>
                어디로, 누구와, 어떤 속도로 움직일지만 정하면 <br />
                일정의 뼈대가 자연스럽게 잡힙니다.
              </p>
            </section>
      
            <section className="summary-card" aria-live="polite">
              <div className="summary-list" id="coverSummary"></div>
              <div className="summary-chips" id="coverChips"></div>
            </section>
          </aside>
      
          <section className="work">
            <div className="work-inner">
              <header className="topbar">
                <div>
                  <h2>AI 여행 일정 생성</h2>
                  <p>한 번에 전부 묻지 않고, 여행을 설계하는 순서대로 짧게 이어갑니다.</p>
                </div>
                <div className="progress" aria-hidden="true"><span id="progressFill"></span></div>
              </header>
      
              <nav className="journey-nav" id="journeyNav" aria-label="여행 입력 단계"></nav>
      
              <form className="form stage" id="tripForm">
                <section className="step-panel" data-step-panel="1">
                  <div className="step-hero">
                    <p>Step 02</p>
                    <h3>여행지를 선택해주세요.</h3>
                  </div>
                  <section className="panel">
                    <div className="panel-head">
                      <div className="title-wrap">
                        <span className="icon">🌍</span>
                        <div>
                          <h3>여행지</h3>
                          <p className="panel-note">대륙을 고르면 대표 국가가 열리고, 직접 입력도 함께 저장됩니다.</p>
                        </div>
                      </div>
                      <span className="badge required">필수</span>
                    </div>
                    <div className="continent-grid" id="contGrid"></div>
                    <div className="chips" id="countryChips"></div>
                    <div className="input-row">
                      <input className="input" id="destInput" type="text" placeholder="직접 입력 후 Enter (예: 포르투갈, 하와이)" />
                    </div>
                    <div className="tags chips" id="destinationTags"></div>
                    <div className="suggestion-block">
                      <div className="panel-head">
                        <div className="title-wrap">
                          <span className="icon">📍</span>
                          <div>
                            <h3>꼭 가고 싶은 장소</h3>
                            <p className="panel-note">랜드마크, 동네, 식당 이름까지 자유롭게 추가합니다.</p>
                          </div>
                        </div>
                        <span className="badge">선택</span>
                      </div>
                      <div className="input-row">
                        <input className="input" id="placeInput" type="text" placeholder="장소 입력 (예: 에펠탑, 신주쿠)" />
                        <button className="add-button" id="placeAddBtn" type="button">추가</button>
                      </div>
                      <div className="tags chips" id="placeTags"></div>
                    </div>
                  </section>
                  <div className="step-actions">
                    <p className="step-warning" id="step1Warning"></p>
                    <button className="step-action light" type="button" data-go-step="0">이전</button>
                    <button className="step-action" type="button" data-go-step="2">예산 선택</button>
                  </div>
                </section>
      
                <section className="step-panel active" data-step-panel="0">
                  <div className="step-hero">
                    <p>Step 01</p>
                    <h3>일정과 인원을 입력해주세요.</h3>
                  </div>
                  <div className="two-col">
                    <section className="panel">
                      <div className="panel-head">
                        <div className="title-wrap">
                          <span className="icon">📅</span>
                          <div>
                            <h3>여행 기간</h3>
                            <p className="panel-note">출발일과 귀국일을 선택해주세요.</p>
                          </div>
                        </div>
                        <span className="badge required">필수</span>
                      </div>
                      <div className="date-grid">
                        <div>
                          <span className="field-label">출발일</span>
                          <input
                            className="date-input"
                            id="startDate"
                            type="text"
                            value={dates.startDate}
                            placeholder="날짜 선택"
                            readOnly
                            onClick={() => setOpenCalendar('startDate')}
                          />
                        </div>
                        <div>
                          <span className="field-label">귀국일</span>
                          <input
                            className="date-input"
                            id="endDate"
                            type="text"
                            value={dates.endDate}
                            placeholder="날짜 선택"
                            readOnly
                            onClick={() => setOpenCalendar('endDate')}
                          />
                        </div>
                      </div>
                      <div className="notice" id="dateSummary"></div>
                    </section>
      
                    <section className="panel">
                      <div className="panel-head">
                        <div className="title-wrap">
                          <span className="icon">👥</span>
                          <div>
                            <h3>인원 구성</h3>
                            <p className="panel-note" id="travelerModeNote">개인 여행은 1명으로 일정이 생성됩니다.</p>
                          </div>
                        </div>
                      </div>
                      <div className="travel-mode" aria-label="여행 인원 유형">
                        <button className="active" type="button" data-travel-mode="personal">
                          <span>👤</span>
                          <strong>개인<small>혼자 계획하기</small></strong>
                        </button>
                        <button type="button" data-travel-mode="group">
                          <span>👥</span>
                          <strong>단체<small>함께 계획하기</small></strong>
                        </button>
                      </div>
                      <div className="counter-list" id="counterList" hidden={true}>
                        <div className="counter-row">
                          <div className="counter-name">🧑 <span>성인<small>만 19세 이상</small></span></div>
                          <div className="counter-control">
                            <button className="round" type="button" data-count="adults" data-dir="-1">−</button>
                            <span className="count" id="adultsVal">2</span>
                            <button className="round" type="button" data-count="adults" data-dir="1">+</button>
                          </div>
                        </div>
                        <div className="counter-row">
                          <div className="counter-name">🧒 <span>청소년<small>만 13~18세</small></span></div>
                          <div className="counter-control">
                            <button className="round" type="button" data-count="teens" data-dir="-1">−</button>
                            <span className="count" id="teensVal">0</span>
                            <button className="round" type="button" data-count="teens" data-dir="1">+</button>
                          </div>
                        </div>
                        <div className="counter-row">
                          <div className="counter-name">👧 <span>어린이<small>만 3~12세</small></span></div>
                          <div className="counter-control">
                            <button className="round" type="button" data-count="children" data-dir="-1">−</button>
                            <span className="count" id="childrenVal">0</span>
                            <button className="round" type="button" data-count="children" data-dir="1">+</button>
                          </div>
                        </div>
                        <div className="counter-row">
                          <div className="counter-name">👶 <span>유아<small>만 0~2세</small></span></div>
                          <div className="counter-control">
                            <button className="round" type="button" data-count="infants" data-dir="-1">−</button>
                            <span className="count" id="infantsVal">0</span>
                            <button className="round" type="button" data-count="infants" data-dir="1">+</button>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                  <div className="step-actions end">
                    <p className="step-warning" id="step0Warning"></p>
                    <div className="collab-help" id="collabHelp" hidden={true}>동시에 여행 계획을 세울 수 있어요.</div>
                    <button className="step-action collab-action" id="collabPlanBtn" type="button" hidden={true}>함께 계획하기</button>
                    <button className="step-action" type="button" data-go-step="1">여행지 입력</button>
                  </div>
                </section>
      
                <section className="step-panel" data-step-panel="2">
                  <div className="step-hero">
                    <p>Step 03</p>
                    <h3>예산 범위를 선택해주세요.</h3>
                  </div>
                  <div>
                    <section className="panel">
                      <div className="panel-head">
                        <div className="title-wrap">
                          <span className="icon">💰</span>
                          <div>
                            <h3>예산 범위</h3>
                            <p className="panel-note">1인 기준, 하루 예상 지출입니다.</p>
                          </div>
                        </div>
                      </div>
                      <div className="budget-grid" id="budgetGrid"></div>
                      <div className="notice" id="budgetEstimate"></div>
                    </section>
                  </div>
                  <div className="step-actions">
                    <button className="step-action light" type="button" data-go-step="1">이전</button>
                    <button className="step-action" type="button" data-go-step="3">여행 강도 조정</button>
                  </div>
                </section>
      
                <section className="step-panel" data-step-panel="3">
                  <div className="step-hero">
                    <p>Step 04</p>
                    <h3>하루 이동 강도를 정해주세요.</h3>
                  </div>
                  <section className="panel">
                    <div className="panel-head">
                      <div className="title-wrap">
                        <span className="icon">⚡</span>
                        <div>
                          <h3>여행 강도</h3>
                          <p className="panel-note">휴양 중심부터 촘촘한 일정까지 조절합니다.</p>
                        </div>
                      </div>
                    </div>
                    <div className="intensity-wrap">
                      <div className="intensity-main">
                        <label className="score">
                          <input id="intNum" type="number" min="0" max="100" defaultValue="0" />
                          <span>/100</span>
                        </label>
                        <div className="intensity-text" id="intDesc">강도를 정해주세요</div>
                      </div>
                      <input className="range" id="intSlider" type="range" min="0" max="100" defaultValue="0" />
                      <div className="range-labels">
                        <span>휴양</span><span>여유</span><span>알찬</span><span>최대</span>
                      </div>
                    </div>
                  </section>
                  <div className="step-actions">
                    <button className="step-action light" type="button" data-go-step="2">이전</button>
                    <button className="step-action" type="button" data-go-step="4">스타일 선택</button>
                  </div>
                </section>
      
                <section className="step-panel" data-step-panel="4">
                  <div className="step-hero">
                    <p>Step 05</p>
                    <h3>원하는 여행 스타일을 더해주세요.</h3>
                  </div>
                  <section className="panel">
                    <div className="panel-head">
                      <div className="title-wrap">
                        <span className="icon">✨</span>
                        <div>
                          <h3>여행 스타일</h3>
                          <p className="panel-note">선택하면 더 완벽한 일정을 만들 수 있습니다.</p>
                        </div>
                      </div>
                      <span className="badge">선택 추천</span>
                    </div>
                    <div className="hashbox">
                      <span className="hashmark">#</span>
                      <input id="styleInput" type="text" placeholder="스타일 입력 후 Enter (예: 힐링, 맛집탐방)" />
                    </div>
                    <p className="hint">Enter로 태그가 추가됩니다.</p>
                    <div className="suggestion-block">
                      <p className="suggestion-title">자주 쓰는 스타일</p>
                      <div className="purpose-grid" id="styleSuggestChips"></div>
                    </div>
                    <div className="tags chips" id="styleTags"></div>
                    <div className="action-bar">
                      <div className="bar-copy">
                        <p className="bar-title" id="barTitle">여행 조건을 입력해주세요</p>
                        <p className="bar-sub" id="barSub">여행지와 기간이 필요합니다.</p>
                      </div>
                      <button className="submit" id="submitBtn" type="button" disabled={true}>일정 생성하기</button>
                    </div>
                  </section>
                  <div className="step-actions">
                    <button className="step-action light" type="button" data-go-step="3">이전</button>
                  </div>
                </section>
              </form>
            </div>
          </section>
        </main>
      
        <div className="confirm-modal" id="confirmModal" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
          <section className="confirm-dialog">
            <div className="confirm-head">
              <h3 id="confirmTitle">입력한 조건을 확인해주세요</h3>
              <p>이 내용 그대로 AI 여행 일정을 생성합니다.</p>
            </div>
            <dl className="confirm-body" id="confirmBody"></dl>
            <div className="confirm-actions">
              <button className="confirm-button light" id="confirmCloseBtn" type="button">수정하기</button>
              <button className="confirm-button primary" id="confirmCreateBtn" type="button">이대로 생성하기</button>
            </div>
          </section>
        </div>
        {openCalendar === 'startDate' && (
          <CalendarPicker
            value={dates.startDate}
            minDate={tomorrow}
            onChange={value => applyDate('startDate', value)}
            onClose={() => setOpenCalendar(null)}
          />
        )}
        {openCalendar === 'endDate' && (
          <CalendarPicker
            value={dates.endDate}
            minDate={dates.startDate || tomorrow}
            rangeStart={dates.startDate}
            onChange={value => applyDate('endDate', value)}
            onClose={() => setOpenCalendar(null)}
          />
        )}
    </>
  )
}
