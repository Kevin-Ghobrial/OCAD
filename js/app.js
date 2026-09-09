let map = L.map('map', { zoomControl: false }).setView([20, 10], 2);

const promptEl = document.getElementById('prompt');
const progressEl = document.getElementById('progress');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');
const nextBtn = document.getElementById('nextBtn');
const retryBtn = document.getElementById('retryBtn');
const revealBtn = document.getElementById('revealBtn');
const showAllBtn = document.getElementById('showAllBtn');
const tutorialBtn = document.getElementById('tutorialBtn');
const tutorialEl = document.getElementById('tutorial');
const closeTutorialBtn = document.getElementById('closeTutorialBtn');
const tutorialTitleEl = document.getElementById('tutorialTitle');
const tutorialBodyEl = document.getElementById('tutorialBody');
const tutorialProgressEl = document.getElementById('tutorialProgress');
const tutorialBackBtn = document.getElementById('tutorialBackBtn');
const tutorialNextBtn = document.getElementById('tutorialNextBtn');
const summaryEl = document.getElementById('summary');
const summaryTextEl = document.getElementById('summaryText');
const summarySourceEl = document.getElementById('summarySource');
const closeSummaryBtn = document.getElementById('closeSummaryBtn');
const continueSummaryBtn = document.getElementById('continueSummaryBtn');
const panelEl = document.getElementById('panel');
const closePanelBtn = document.getElementById('closePanelBtn');
const openPanelBtn = document.getElementById('openPanelBtn');

let places = [];
let index = 0;
let score = 0;
let currentTarget = null;
let submitted = false;
let questionScored = false;
let countryLayer;
let panelOpen = true;
const chartArtLayer = L.layerGroup().addTo(map);
const countryLabels = [];
const countryNames = new Map();
const labelMeasureCanvas = document.createElement('canvas');
const labelMeasureContext = labelMeasureCanvas.getContext('2d');

const tutorialSteps = [
  {
    title: 'Welcome your group',
    body: '<p>Tell everyone: “We are going to trace the journeys of the disciples, Mark, and Paul. Your job is to identify the country where each person served, ministered, or died.”</p><p>Remind the group that the map is a learning tool. Encourage thoughtful guesses and discussion before anyone uses a hint.</p>'
  },
  {
    title: 'Explain a turn',
    body: '<p>Read the question aloud, then give the group time to study the map. A player clicks a country to submit an answer.</p><p>Ask them to explain their reasoning: “What clues from the person’s story helped you choose this place?”</p>'
  },
  {
    title: 'Handle an incorrect answer',
    body: '<p>An incorrect country is marked, but the correct answer stays hidden. This keeps the activity focused on learning rather than guessing once.</p><p>Invite the player to use <strong>Retry</strong>, or let the group use <strong>Hint</strong> when they need help.</p>'
  },
  {
    title: 'Use the explanation',
    body: '<p>After a correct answer, read the journey summary together. Connect the location to the person’s ministry, travel, opposition, and service.</p><p>Use the source link when your group wants to explore the biblical study behind the summary.</p>'
  },
  {
    title: 'Keep the group moving',
    body: '<p>Use <strong>Next</strong> to continue. Keep a running conversation about patterns: how the gospel spread, why people traveled, and how the early witnesses responded to persecution.</p><p>At the end, review the score and invite each person to name one journey or location they remember.</p>'
  }
];
let tutorialStep = 0;

const normalStyle = { color: '#6f5a42', weight: 1, fillColor: '#d8c18e', fillOpacity: 0.88 };
const hoverStyle = { color: '#174e55', weight: 2, fillColor: '#a9c9bd', fillOpacity: 0.9 };
const correctStyle = { color: '#315c43', weight: 2, fillColor: '#91b878', fillOpacity: 0.95 };
const incorrectStyle = { color: '#783b2d', weight: 2, fillColor: '#c57961', fillOpacity: 0.95 };
const hintStyle = { color: '#80602e', weight: 2, fillColor: '#e1bc68', fillOpacity: 0.95 };

Promise.all([
  fetch('data/places.json').then(response => response.json()),
  fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson').then(response => response.json())
])
  .then(([data, geojson])=>{
    places = data.filter(place => place.name && place.countryCode);
    geojson.features.forEach(feature => {
      const code = getCountryCode(feature.properties);
      const name = feature.properties.name || feature.properties.ADMIN;
      if (code && name) countryNames.set(code, name);
    });
    countryLayer = L.geoJSON(geojson, {
      style: normalStyle,
      onEachFeature: (feature, layer) => {
        const countryName = getCountryNameFromFeature(feature.properties);
        if (countryName) {
          layer.bindTooltip(countryName, {
             permanent: false,
            direction: 'center',
            className: 'country-label',
            opacity: 0.9
          });
          const label = layer.getTooltip();
          label.setLatLng(getLabelPoint(feature, layer));
          countryLabels.push({ label, layer, name: countryName, feature });
        }
        layer.on({
          mouseover: () => { if (!submitted) layer.setStyle(hoverStyle); },
          mouseout: () => { if (!submitted) layer.setStyle(normalStyle); },
          click: () => submitAnswer(getCountryCode(feature.properties))
        });
      }
    }).addTo(map);
    addChartArt();
    updateCountryLabels();
    updateScore();
    showQuestion(0);
  })
  .catch(err=>{
    console.error('Failed to load quiz data or country boundaries', err);
    progressEl.textContent = 'Error loading data';
    promptEl.textContent = 'Cannot continue - see console for details.';
  });

function addChartArt() {
  const whaleSvg = `
    <svg viewBox="0 0 118 70" role="img" aria-label="Illustrated whale">
      <path d="M12 41 C23 18 68 15 91 34 C100 41 106 42 114 36 C111 48 101 54 90 51 C70 61 34 59 12 41 Z" fill="#537d79" stroke="#2d4946" stroke-width="2"/>
      <path d="M91 34 L108 20 L106 37 L114 36" fill="#537d79" stroke="#2d4946" stroke-width="2"/>
      <path d="M35 25 C37 14 43 12 48 15" fill="none" stroke="#2d4946" stroke-width="2"/>
      <circle cx="82" cy="34" r="2.5" fill="#2d2d26"/>
      <path d="M26 48 C36 51 44 52 53 51" fill="none" stroke="#d9c792" stroke-width="2"/>
    </svg>`;
  const fishSvg = `
    <svg viewBox="0 0 78 48" role="img" aria-label="Illustrated fish">
      <path d="M10 25 C25 8 53 9 65 24 C53 39 25 40 10 25 Z" fill="#8c6c45" stroke="#40382b" stroke-width="2"/>
      <path d="M10 25 L1 14 L3 25 L1 36 Z" fill="#8c6c45" stroke="#40382b" stroke-width="2"/>
      <circle cx="52" cy="21" r="2" fill="#2d2d26"/>
      <path d="M32 12 L38 23 L29 23 Z" fill="#d9c792" stroke="#40382b" stroke-width="1"/>
    </svg>`;
  const illustrations = [
    { position: [37, -35], html: whaleSvg, className: 'chart-art creature-art', iconSize: [92, 54], iconAnchor: [46, 27] },
    { position: [25, -35], html: fishSvg, className: 'chart-art creature-art small', iconSize: [60, 37], iconAnchor: [30, 18] },
    { position: [8, 55], html: fishSvg, className: 'chart-art creature-art small', iconSize: [60, 37], iconAnchor: [30, 18] },
    { position: [-30, 70], html: fishSvg, className: 'chart-art creature-art small', iconSize: [60, 37], iconAnchor: [30, 18] }
  ];
  illustrations.forEach(({ position, html, className, iconSize, iconAnchor }) => {
    const icon = L.divIcon({ html, className, iconSize, iconAnchor });
    L.marker(position, { icon, interactive: false, keyboard: false }).addTo(chartArtLayer);
  });
}

map.on('zoomend', updateCountryLabels);

function updateCountryLabels() {
  countryLabels.forEach(({ label, name, feature }) => {
    labelMeasureContext.font = '600 11px system-ui, -apple-system, Arial, sans-serif';
    const labelWidth = labelMeasureContext.measureText(name).width;
    const labelPoint = map.latLngToLayerPoint(label.getLatLng());
    const halfWidth = (labelWidth + 8) / 2;
    const halfHeight = 9;
    const corners = [
      { x: labelPoint.x - halfWidth, y: labelPoint.y - halfHeight },
      { x: labelPoint.x + halfWidth, y: labelPoint.y - halfHeight },
      { x: labelPoint.x + halfWidth, y: labelPoint.y + halfHeight },
      { x: labelPoint.x - halfWidth, y: labelPoint.y + halfHeight }
    ];
    const fits = map.getZoom() >= 5 && corners.every(corner => isPointInsideCountry(corner, feature));
    if (fits) label.openTooltip();
    else label.closeTooltip();
  });
}

function isPointInsideCountry(point, feature) {
  const polygons = feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates;
  return polygons.some(polygon => {
    const outerRing = polygon[0].map(coordinate => {
      const projected = map.latLngToLayerPoint([coordinate[1], coordinate[0]]);
      return { x: projected.x, y: projected.y };
    });
    return isPointInProjectedRing(point, outerRing);
  });
}

function isPointInProjectedRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const intersects = ((ring[i].y > point.y) !== (ring[j].y > point.y)) &&
      (point.x < (ring[j].x - ring[i].x) * (point.y - ring[i].y) / (ring[j].y - ring[i].y) + ring[i].x);
    if (intersects) inside = !inside;
  }
  return inside;
}

function getCountryCode(properties) {
  return properties['ISO3166-1-Alpha-3'] || properties.ISO_A3 || properties.iso_a3 || properties.ADM0_A3;
}

function getCountryNameFromFeature(properties) {
  return properties.name || properties.ADMIN || properties.NAME_EN;
}

function getLabelPoint(feature, layer) {
  const geometry = feature.geometry;
  const rings = geometry.type === 'Polygon'
    ? [geometry.coordinates[0]]
    : geometry.coordinates.map(polygon => polygon[0]);
  let largestRing = rings[0];
  rings.forEach(ring => {
    if (ring.length > largestRing.length) largestRing = ring;
  });
  if (!largestRing || !largestRing.length) return layer.getBounds().getCenter();

  const point = largestRing.reduce((total, coordinate) => ({
    lat: total.lat + coordinate[1] / largestRing.length,
    lng: total.lng + coordinate[0] / largestRing.length
  }), { lat: 0, lng: 0 });
  const candidate = L.latLng(point.lat, point.lng);
  if (isPointInRing(candidate, largestRing)) return candidate;

  const bounds = layer.getBounds();
  for (let step = 1; step <= 9; step++) {
    const fraction = step / 10;
    const fallback = L.latLng(
      bounds.getSouth() + (bounds.getNorth() - bounds.getSouth()) * fraction,
      bounds.getWest() + (bounds.getEast() - bounds.getWest()) * fraction
    );
    if (isPointInRing(fallback, largestRing)) return fallback;
  }
  return layer.getBounds().getCenter();
}

function isPointInRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects = ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function showQuestion(i){
  index = i;
  currentTarget = places[index];
  submitted = false;
  questionScored = false;
  nextBtn.disabled = true;
  retryBtn.disabled = true;
  progressEl.textContent = `Question ${index+1} / ${places.length}`;
  promptEl.textContent = currentTarget ? currentTarget.prompt || currentTarget.name : 'Done';
  feedbackEl.textContent = '';
  summaryEl.hidden = true;
  summaryTextEl.textContent = '';
  summarySourceEl.href = 'https://suscopts.org/diocese/bishop/bible-study';
  if (countryLayer) countryLayer.resetStyle();
}

map.on('click', ()=>{
  if (currentTarget && !submitted) feedbackEl.textContent = 'Click a country to submit your answer.';
});

function submitAnswer(countryCode) {
  if (!currentTarget || submitted || !countryCode) return;
  submitted = true;
  const correct = countryCode === currentTarget.countryCode;
  if (correct) {
    if (!questionScored) score += 1;
    questionScored = true;
    feedbackEl.textContent = `Correct! ${currentTarget.name} is associated with ${currentTarget.country}.`;
  } else {
    feedbackEl.textContent = `Not quite. You selected ${getCountryName(countryCode)}.`;
  }
  highlightCountry(countryCode, correct ? correctStyle : incorrectStyle);
  nextBtn.disabled = !correct;
  retryBtn.disabled = false;
  if (correct) {
    openSummary();
  }
  updateScore();
}

function getCountryName(countryCode) {
  return countryNames.get(countryCode) || places.find(item => item.countryCode === countryCode)?.country || countryCode;
}

function highlightCountry(countryCode, style) {
  countryLayer.eachLayer(layer => {
    if (getCountryCode(layer.feature.properties) === countryCode) {
      layer.setStyle(style);
      layer.bringToFront();
    }
  });
}

nextBtn.addEventListener('click', nextQuestion);

retryBtn.addEventListener('click', ()=>{
  submitted = false;
  nextBtn.disabled = true;
  retryBtn.disabled = true;
  feedbackEl.textContent = 'Try again: choose a country on the map.';
  summaryEl.hidden = true;
  if (countryLayer) countryLayer.resetStyle();
});

revealBtn.addEventListener('click', ()=>{
  if(!currentTarget) return;
  submitted = true;
  feedbackEl.textContent = `Answer: ${currentTarget.name} is traditionally associated with ${currentTarget.country}.`;
  highlightCountry(currentTarget.countryCode, correctStyle);
  nextBtn.disabled = false;
  retryBtn.disabled = false;
  summaryTextEl.textContent = currentTarget.summary;
  summarySourceEl.href = currentTarget.source;
  openSummary();
});

function openSummary() {
  summaryTextEl.textContent = currentTarget.summary;
  summarySourceEl.href = currentTarget.source;
  summaryEl.hidden = false;
  closeSummaryBtn.focus();
}

function closeSummary() {
  summaryEl.hidden = true;
  if (currentTarget) continueSummaryBtn.blur();
}

closeSummaryBtn.addEventListener('click', closeSummary);
continueSummaryBtn.addEventListener('click', closeSummary);
summaryEl.addEventListener('click', event=>{
  if (event.target === summaryEl) closeSummary();
});
document.addEventListener('keydown', event=>{
  if (event.key === 'Escape' && !summaryEl.hidden) closeSummary();
});

showAllBtn.addEventListener('click', ()=>{
  if (!currentTarget) return;
  feedbackEl.textContent = questionScored
    ? 'All answer countries are highlighted.'
    : 'Hint: the highlighted countries are possible answers. You can still click one to submit.';
  countryLayer.eachLayer(layer => {
    const code = getCountryCode(layer.feature.properties);
    if (places.some(place => place.countryCode === code)) {
      layer.setStyle(hintStyle);
      layer.bringToFront();
    }
  });
});

function nextQuestion(){
  if(index+1 < places.length){
    showQuestion(index+1);
  } else {
    currentTarget = null;
    nextBtn.disabled = true;
    retryBtn.disabled = true;
    promptEl.textContent = 'Finished';
    feedbackEl.textContent = `Final score: ${score} / ${places.length}`;
  }
}

function updateScore(){
  scoreEl.textContent = `Score: ${score} / ${places.length}`;
}

function setPanelOpen(isOpen) {
  panelOpen = isOpen;
  panelEl.classList.toggle('panel-hidden', !isOpen);
  openPanelBtn.hidden = isOpen;
  if (isOpen) {
    panelEl.scrollTop = 0;
    closePanelBtn.focus();
  } else {
    openPanelBtn.focus();
  }
  setTimeout(() => map.invalidateSize(), 250);
}

closePanelBtn.addEventListener('click', () => setPanelOpen(false));
openPanelBtn.addEventListener('click', () => setPanelOpen(true));
openPanelBtn.hidden = true;

function renderTutorial() {
  const step = tutorialSteps[tutorialStep];
  tutorialTitleEl.textContent = step.title;
  tutorialBodyEl.innerHTML = step.body;
  tutorialProgressEl.textContent = `Step ${tutorialStep + 1} of ${tutorialSteps.length}`;
  tutorialBackBtn.disabled = tutorialStep === 0;
  tutorialNextBtn.textContent = tutorialStep === tutorialSteps.length - 1 ? 'Done' : 'Next';
}

function openTutorial() {
  tutorialStep = 0;
  renderTutorial();
  tutorialEl.hidden = false;
  closeTutorialBtn.focus();
}

function closeTutorial() {
  tutorialEl.hidden = true;
  tutorialBtn.focus();
}

tutorialBtn.addEventListener('click', openTutorial);
closeTutorialBtn.addEventListener('click', closeTutorial);
tutorialNextBtn.addEventListener('click', ()=>{
  if (tutorialStep === tutorialSteps.length - 1) closeTutorial();
  else { tutorialStep += 1; renderTutorial(); }
});
tutorialBackBtn.addEventListener('click', ()=>{
  if (tutorialStep > 0) { tutorialStep -= 1; renderTutorial(); }
});
tutorialEl.addEventListener('click', event=>{
  if (event.target === tutorialEl) closeTutorial();
});
document.addEventListener('keydown', event=>{
  if (event.key === 'Escape' && !tutorialEl.hidden) closeTutorial();
});
