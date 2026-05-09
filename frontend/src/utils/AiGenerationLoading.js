import { DEFAULT_TRIP, LOADING_MESSAGES, LOADING_PHASES, STAGE_LABELS } from '../data/AiGenerationLoading'

export function initAiGenerationLoading({ navigate }) {
  const $ = id => document.getElementById(id);
  
      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }
  
      function readTrip() {
        const params = new URLSearchParams(location.search);
        const fromStorage = sessionStorage.getItem("aiTripDraft");
        let stored = {};
  
        if (fromStorage) {
          try {
            stored = JSON.parse(fromStorage);
          } catch {
            stored = {};
          }
        }
  
        return {
          ...DEFAULT_TRIP,
          ...stored,
          destination: params.get("destination") || stored.destination || DEFAULT_TRIP.destination,
          nights: Number(params.get("nights") || stored.nights || DEFAULT_TRIP.nights)
        };
      }
  
      function dateText(value) {
        if (!value) return "";
        return new Intl.DateTimeFormat("ko-KR", {
          month: "long",
          day: "numeric",
          weekday: "short"
        }).format(new Date(value));
      }
  
      function travelerText(trip) {
        const parts = [`성인 ${trip.adults || 1}명`];
        if (trip.teens) parts.push(`청소년 ${trip.teens}명`);
        if (trip.children) parts.push(`어린이 ${trip.children}명`);
        if (trip.infants) parts.push(`유아 ${trip.infants}명`);
        return parts.join(" · ");
      }
  
      function listText(items) {
        return items && items.length ? items.join(", ") : "선택 안 함";
      }
  
      function renderTrip(trip) {
        const days = Number(trip.nights) + 1;
        $("tripTitle").textContent = `${trip.destination} 여행`;
        $("factList").innerHTML = [
          ["여행 기간", `${dateText(trip.startDate)} ~ ${dateText(trip.endDate)} · ${trip.nights}박 ${days}일`],
          ["인원", travelerText(trip)],
          ["예산", trip.budget || "선택 안 함"],
          ["여행 강도", trip.intensity || "선택 안 함"],
          ["고정 장소", listText(trip.places)],
          ["스타일", listText((trip.styles || []).map(style => `#${style}`))]
        ].map(([label, value]) => `
          <div class="fact">
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(value)}</dd>
          </div>
        `).join("");
  
        const chips = [
          `${trip.destination}`,
          `${trip.nights}박 ${days}일`,
          travelerText(trip),
          ...(trip.places || []),
          ...(trip.styles || []).map(style => `#${style}`)
        ];
        const markup = chips.map(chip => `<span class="mini-chip">${escapeHtml(chip)}</span>`).join("");
        $("tickerA").innerHTML = markup;
        $("tickerB").innerHTML = markup;
      }
  
      function renderStages(activeIndex) {
        $("stageRow").innerHTML = STAGE_LABELS.map((label, index) => `
          <div class="stage-chip ${index <= activeIndex ? "active" : ""}">
            <span class="stage-dot"></span>
            <span>${label}</span>
          </div>
        `).join("");
      }
  
      function updateProgress(value) {
        const bounded = Math.min(98, Math.max(0, value));
        $("trackFill").style.width = `${bounded}%`;
        $("planeIcon").style.left = `${bounded}%`;
        $("progressNumber").textContent = `${Math.round(bounded)}%`;
        $("currentPhase").textContent = LOADING_PHASES[Math.min(LOADING_PHASES.length - 1, Math.floor(bounded / 22))];
        renderStages(Math.min(STAGE_LABELS.length - 1, Math.floor(bounded / 25)));
      }
  
      function startLoading() {
        let progress = 6;
        let messageIndex = 0;
  
        $("loadingMessage").innerHTML = LOADING_MESSAGES[0];
        updateProgress(progress);
  
        const messageTimer = setInterval(() => {
          messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
          const message = $("loadingMessage");
          message.style.animation = "none";
          message.offsetHeight;
          message.innerHTML = LOADING_MESSAGES[messageIndex];
          message.style.animation = "";
        }, 4000);
  
        const progressTimer = setInterval(() => {
          const easing = progress < 72 ? 8 : progress < 90 ? 4 : 1.2;
          progress = progress >= 98 ? 18 : progress + easing + Math.random() * 4;
          updateProgress(progress);
        }, 950);
         return () => {
          clearInterval(messageTimer);
          clearInterval(progressTimer);
        };
      }
  
      const trip = readTrip();
      renderTrip(trip);
      const stopLoading = startLoading();
      const redirectTimer = setTimeout(() => {
        navigate('/ai-generation-schedule');
      }, 2000);
       return () => {
        stopLoading();
        clearTimeout(redirectTimer);
      };
}
