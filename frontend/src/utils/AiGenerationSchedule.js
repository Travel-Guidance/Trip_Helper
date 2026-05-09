import { PLAN } from '../data/AiGenerationSchedule'

const GOOGLE_MAP_SCRIPT_ID = 'google-maps-codexview-script'
const GOOGLE_MAP_SCRIPT_SRC = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDaVmYg-OdmcaT1qDjLA-J-n5-df0XyWSw&callback=initCodexMap&loading=async'

export function initAiGenerationSchedule() {
  
      let activeDayId = "day1";
      let codexMap;
      let codexMarkers = [];
      let codexPolyline;
  
      function classFor(kind) {
        if (kind === "meal") return "meal";
        if (kind === "rest") return "rest";
        return "";
      }
  
      function renderFeed() {
        document.getElementById("feed").innerHTML = PLAN.map(day => `
          <article class="day-module" id="${day.id}">
            <header class="module-head">
              <div>
                <p class="module-kicker">${day.day} · ${day.date}</p>
                <h2>${day.title}</h2>
              </div>
              <div class="weather-card"><b>${day.weather[0]}</b><span><strong>${day.weather[1]}</strong><span>${day.weather[2]}</span></span></div>
            </header>
            <div class="time-grid">
              ${day.nodes.map(node => `
                <div class="node">
                  <div class="node-time">${node.time}</div>
                  <div class="node-line"><span class="node-dot ${classFor(node.kind)}"></span></div>
                  <section class="node-card">
                    <div class="node-top">
                      <h3>${node.title}</h3>
                      <span class="tag ${classFor(node.kind)}">${node.tag}</span>
                    </div>
                    <p>${node.body}</p>
                    <div class="metrics">${node.metrics.map(metric => `<span class="metric">${metric}</span>`).join("")}</div>
                  </section>
                </div>
              `).join("")}
            </div>
          </article>
        `).join("");
  
        renderSelectedDayMap();
      }
  
      function activeDay() {
        return PLAN.find(day => day.id === activeDayId) || PLAN[0];
      }
  
      function renderSelectedDayMap() {
        const day = activeDay();
        const dayNumber = PLAN.findIndex(item => item.id === day.id) + 1;
  
        document.getElementById("mapTitle").textContent = `${dayNumber}일차 Google Maps 동선`;
        document.getElementById("mapFocus").innerHTML = day.nodes.map((node, index) => `
          <li><b>${index + 1}</b>${node.title}<span>${node.time}</span></li>
        `).join("");
  
        if (codexMap) drawCodexMap(day);
      }
  
      function drawCodexMap(day) {
        codexMarkers.forEach(marker => marker.setMap(null));
        codexMarkers = [];
        if (codexPolyline) codexPolyline.setMap(null);
  
        const bounds = new window.google.maps.LatLngBounds();
        const path = day.nodes.map(node => ({ lat: node.lat, lng: node.lng }));
  
        day.nodes.forEach((node, index) => {
          const position = { lat: node.lat, lng: node.lng };
          bounds.extend(position);
          codexMarkers.push(new window.google.maps.Marker({
            position,
            map: codexMap,
            label: {
              text: String(index + 1),
              color: "#ffffff",
              fontWeight: "800"
            },
            title: node.title
          }));
        });
  
        codexPolyline = new window.google.maps.Polyline({
          path,
          map: codexMap,
          strokeColor: "#0099ff",
          strokeOpacity: 0.86,
          strokeWeight: 4
        });
  
        codexMap.fitBounds(bounds);
      }
  
      function selectDay(dayId) {
        activeDayId = dayId;
        document.querySelectorAll("[data-day-map]").forEach(button => {
          button.classList.toggle("active", button.dataset.dayMap === dayId);
        });
        renderSelectedDayMap();
      }
  
      function initCodexMap() {
        const mapEl = document.getElementById("codexMap");
        if (!window.google?.maps) return;
  
        codexMap = new window.google.maps.Map(mapEl, {
          center: { lat: 33.5902, lng: 130.4017 },
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ saturation: -20 }] },
            { featureType: "water", stylers: [{ color: "#dbeafe" }] }
          ]
        });
        drawCodexMap(activeDay());
      }
  
      renderFeed();
      document.querySelectorAll("[data-day-map]").forEach(button => {
        button.addEventListener("click", () => {
          selectDay(button.dataset.dayMap);
        });
      });
   window.initCodexMap = initCodexMap;
  if (window.google?.maps) {
    initCodexMap();
  } else if (!document.getElementById(GOOGLE_MAP_SCRIPT_ID)) {
    const scriptEl = document.createElement('script');
    scriptEl.id = GOOGLE_MAP_SCRIPT_ID;
    scriptEl.src = GOOGLE_MAP_SCRIPT_SRC;
    scriptEl.async = true;
    scriptEl.defer = true;
    document.body.appendChild(scriptEl);
  }
   return () => {
    if (window.initCodexMap === initCodexMap) delete window.initCodexMap;
  };
}
