import { CONTINENTS, INTENSITY_LABELS, STEP_DONE_GUIDES, STEP_GUIDES, STYLE_SUGGESTIONS } from '../data/AiGenerationInputForm'

export function initAiGenerationInputForm() {
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
        budgetText: "",
        intensity: 0,
        intensityTouched: false,
        travelPreference: "",
        places: [],
        styles: []
      };
  
      const STEPS = [
        { icon: "🌍", title: "여행지", sub: "어디로", required: true, done: () => state.destinations.length > 0 },
        { icon: "📅", title: "일정", sub: "언제 누구와", required: true, done: () => Boolean(state.startDate && state.endDate && getNights() > 0) },
        { icon: "💰", title: "예산", sub: "여행 예산", required: false, done: () => state.budgetText.trim().length > 0 },
        { icon: "⚡", title: "속도", sub: "여행 강도", required: false, done: () => false },
        { icon: "✨", title: "스타일", sub: "선택하면 정교해져요", required: false, done: () => state.styles.length > 0 }
      ];
  
      let currentStep = 0;
  
      const $ = id => document.getElementById(id);
      let warningTimer;
      let collabHelpTimer;
      let collabButtonWasVisible = false;
      let collabRoomUrl = "";
  
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
  
        if (next > 0 && state.destinations.length === 0) {
          currentStep = 0;
          document.querySelectorAll("[data-step-panel]").forEach(panel => {
            panel.classList.toggle("active", Number(panel.dataset.stepPanel) === currentStep);
          });
          validate();
          showStepWarning(0, "여행지를 먼저 선택해주세요.");
          return false;
        }

        if (next > 1 && state.travelMode === "group" && adultTeenTotal() < 2) {
          currentStep = 1;
          document.querySelectorAll("[data-step-panel]").forEach(panel => {
            panel.classList.toggle("active", Number(panel.dataset.stepPanel) === currentStep);
          });
          validate();
          showStepWarning(1, "단체는 2인 이상이어야 합니다.");
          return false;
        }

        if (next > 1 && !(state.startDate && state.endDate && getNights() > 0)) {
          currentStep = 1;
          document.querySelectorAll("[data-step-panel]").forEach(panel => {
            panel.classList.toggle("active", Number(panel.dataset.stepPanel) === currentStep);
          });
          validate();
          showStepWarning(1, "일정을 먼저 입력해주세요.");
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
      }
  
  
      function destinationLabel() {
        if (!state.destinations.length) return "";
        if (state.destinations.length <= 2) return state.destinations.join(", ");
        return `${state.destinations.slice(0, 2).join(", ")} 외 ${state.destinations.length - 2}곳`;
      }
  
      function summaryChips() {
        const nights = getNights();
        const chips = [];
        const showDefaults = currentStep > 0;

        if (state.destinations.length) chips.push(destinationLabel());
        if (state.places.length) chips.push(`고정 장소 ${state.places.length}곳`);
        if (nights > 0) chips.push(`${nights}박 ${nights + 1}일`);
        if (showDefaults) chips.push(`${state.adults + state.teens + state.children + state.infants}명`);
        if (state.budgetText.trim()) {
          const label = state.budgetText.trim();
          chips.push(label.length > 14 ? label.slice(0, 14) + '…' : label);
        }
        if (state.intensityTouched) chips.push(`강도 ${state.intensity}/100`);
        state.styles.forEach(style => chips.push(`#${style}`));

        return chips;
      }
  
      function renderSummaryLines({ hasDestination, hasDates, hasStyle }) {
        const done = [
          hasDates,
          hasDestination,
          state.budgetText.trim().length > 0,
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
        const rows = [
          ["여행지", destinationLabel()],
          ["여행 기간", `${formatDate(state.startDate)} ~ ${formatDate(state.endDate)} (${nights}박 ${nights + 1}일)`],
          ["인원", travelerText()],
          ["꼭 갈 장소", state.places.length ? state.places.join(", ") : "선택 안 함"],
          ["예산", state.budgetText.trim() || "선택 안 함"],
          ["여행 강도", state.intensityTouched ? `${state.intensity}/100 · ${$("intDesc").textContent}` : "선택 안 함"],
          ["여행 스타일", state.styles.length ? state.styles.map(style => `#${style}`).join(" ") : "선택 안 함"],
          ["여행 선호 방식", state.travelPreference.trim() || "선택 안 함"]
        ];
        return rows;
      }
  
      function tripDraft() {
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
          budgetText: state.budgetText.trim(),
          intensity: state.intensityTouched ? `${state.intensity}/100 · ${$("intDesc").textContent}` : "",
          travelPreference: state.travelPreference.trim(),
          places: [...state.places],
          styles: [...state.styles]
        };
      }

      function createRoomId() {
        return `trip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      }

      function travelerCount() {
        return state.adults + state.teens + state.children + state.infants;
      }

      function collabMemberCount() {
        const input = $("collabMemberCount");
        const value = parseInt(input.value, 10);
        return Math.min(20, Math.max(2, Number.isNaN(value) ? 2 : value));
      }

      function setCollabMemberCount(value) {
        $("collabMemberCount").value = Math.min(20, Math.max(2, value));
      }
  
      function openCollabConfirmModal() {
        addPendingStyle();
        if (state.destinations.length === 0) {
          showStepWarning(0, "함께 작업하기 전에 여행지를 선택해주세요.");
          return;
        }
        if (!(state.startDate && state.endDate && getNights() > 0)) {
          showStepWarning(1, "함께 작업하기 전에 출발일과 귀국일을 입력해주세요.");
          return;
        }
        setCollabMemberCount(Math.min(20, Math.max(2, adultTeenTotal())));
        $("collabMemberGuide").textContent = `총 여행 인원은 ${travelerCount()}명입니다. 실제로 같이 입력할 사람 수만 정해주세요.`;
        $("collabConfirmModal").classList.add("show");
        $("collabTogetherBtn").focus();
      }

      function closeCollabConfirmModal() {
        $("collabConfirmModal").classList.remove("show");
        $("collabPlanBtn").focus();
      }

      function openCollabShareModal() {
        const roomId = createRoomId();
        const members = collabMemberCount();
        const draft = tripDraft();
        const params = new URLSearchParams({ members: String(members) });
        ["destination", "startDate", "endDate", "adults", "teens", "children", "infants"].forEach(key => {
          const value = draft[key];
          if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
        });
        if (Array.isArray(draft.places) && draft.places.length) {
          params.set("places", draft.places.join(","));
        }
        collabRoomUrl = `${location.origin}/ai-collaboration-planning/${roomId}?${params.toString()}`;
        sessionStorage.setItem("aiTripDraft", JSON.stringify(draft));
        sessionStorage.setItem("aiCollabMemberCount", String(members));
        $("collabRoomUrl").value = collabRoomUrl;
        $("collabCopyState").textContent = "";
        $("collabConfirmModal").classList.remove("show");
        $("collabShareModal").classList.add("show");
        $("collabCopyBtn").focus();
      }

      function closeCollabShareModal() {
        $("collabShareModal").classList.remove("show");
        $("collabTogetherBtn").focus();
      }

      function copyCollabUrl() {
        $("collabRoomUrl").select();
        navigator.clipboard?.writeText(collabRoomUrl);
        $("collabCopyState").textContent = "공유 URL이 복사되었습니다.";
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
        const fill = $("progressFill");
        fill.style.width = `${(requiredDone / 2) * 100}%`;
        fill.style.backgroundSize = '420px 100%';
        $("stepMini").innerHTML = [hasDestination, hasDates].map(ok => `<span class="dot ${ok ? "done" : ""}"></span>`).join("");
  
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
          if (state.budgetText.trim()) detailParts.push("예산 반영");
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
  
      $("budgetInput")?.addEventListener("input", event => {
        state.budgetText = event.target.value;
        validate();
      });

      $("preferenceInput")?.addEventListener("input", event => {
        state.travelPreference = event.target.value;
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
        openCollabConfirmModal();
      });

      $("collabSoloBtn").addEventListener("click", closeCollabConfirmModal);
      $("collabMemberMinusBtn").addEventListener("click", () => {
        setCollabMemberCount(collabMemberCount() - 1);
      });
      $("collabMemberPlusBtn").addEventListener("click", () => {
        setCollabMemberCount(collabMemberCount() + 1);
      });
      $("collabMemberCount").addEventListener("change", () => {
        setCollabMemberCount(collabMemberCount());
      });
      $("collabTogetherBtn").addEventListener("click", openCollabShareModal);
      $("collabBackBtn").addEventListener("click", () => {
        $("collabShareModal").classList.remove("show");
        $("collabConfirmModal").classList.add("show");
        $("collabTogetherBtn").focus();
      });
      $("collabCopyBtn").addEventListener("click", copyCollabUrl);
      $("collabOpenRoomBtn").addEventListener("click", () => {
        location.href = collabRoomUrl;
      });
  
      $("confirmCloseBtn").addEventListener("click", closeConfirmModal);
  
      $("confirmModal").addEventListener("click", event => {
        if (event.target.id === "confirmModal") closeConfirmModal();
      });

      $("collabConfirmModal").addEventListener("click", event => {
        if (event.target.id === "collabConfirmModal") closeCollabConfirmModal();
      });

      $("collabShareModal").addEventListener("click", event => {
        if (event.target.id === "collabShareModal") closeCollabShareModal();
      });
  
      document.addEventListener("keydown", event => {
        if (event.key === "Escape" && $("confirmModal").classList.contains("show")) {
          closeConfirmModal();
        }
        if (event.key === "Escape" && $("collabConfirmModal").classList.contains("show")) {
          closeCollabConfirmModal();
        }
        if (event.key === "Escape" && $("collabShareModal").classList.contains("show")) {
          closeCollabShareModal();
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
      renderStyleSuggestions();
      renderCounters();
      renderPlaces();
      renderStyles();
      setIntensity(0);
      validate();
}
