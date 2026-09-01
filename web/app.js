const FRANCE_BOUNDS = [
  [41.3, -5.2],
  [51.2, 9.7],
];
const EUROPE_BOUNDS = [
  [36.0, -9.5],
  [55.2, 18.5],
];
const COUNTRY_LABEL = {
  FR: "France",
  DE: "Allemagne",
  CH: "Suisse",
  ES: "Espagne",
  IT: "Italie",
};
const LOWLAND_MAX = 600;
const VILLE_POLE_MIN = 35000;
const ISOLATED_ALT_M = 1500;
const T2050 = {
  tx30: 22,
  tr: 15,
  txJja: 26,
  felt: 34,
  ifm40: 8,
  swi: 170,
  risk: 3,
};
const T2050_MARGIN = {
  tx30: 14,
  tr: 8,
  txJja: 24,
  felt: 29,
};
const T2050_NEAR = {
  tx30: 26,
  tr: 19,
  txJja: 27,
  felt: 36,
};
const T2050_BLACK = {
  tx30: 40,
  tr: 28,
  txJja: 29,
  felt: 40,
};
const VIEWS_NOW = [
  { value: "all", label: "Toutes les aires" },
  { value: "favorables", label: "Favorables seulement" },
  { value: "shortlist", label: "Faible risque (à creuser)" },
];
const VIEWS_2050 = [
  { value: "all", label: "Toutes les aires" },
  { value: "allpass", label: "Selon les critères cochés" },
  { value: "climate", label: "Climat 2050 seulement" },
  { value: "presque", label: "Presque (2–4 j de trop)" },
  { value: "favorables", label: "Favorables 2026" },
];
const AMENITY_KEYS = ["hospital", "university", "culture", "infra"];
const AMENITY_RADIUS_KM = {
  hospital: 30,
  university: 45,
  culture: 30,
  infra: 30,
};
const AMENITY_LABEL = {
  hospital: "Hôpital",
  university: "Campus (fils)",
  culture: "Culture",
  infra: "Gare",
};
const CRIT_LABEL = {
  heat: "Été encore tenable",
  fire: "Peu de feu",
  dry: "Sols pas trop secs",
  coast: "Hors littoral",
  nuke: "Hors nucléaire",
  local: "Risques locaux faibles",
  air: "Air respirable (PM, ozone)",
  hospital: "Hôpital < 30 km",
  university: "Campus (visite fils) < 45 km",
  culture: "Culture < 30 km",
  infra: "Gare < 30 km",
};
const METRIC_META = {
  combined: {
    title: "Tous indicateurs confondus",
    low: "Tient le coup",
    high: "Plus exposé",
  },
  tx30: {
    title: "Jours ≥ 30 °C / an",
    low: "Peu de jours chauds",
    high: "Beaucoup de jours ≥ 30 °C",
  },
  tr: {
    title: "Nuits tropicales / an",
    low: "Peu de nuits chaudes",
    high: "Beaucoup de nuits tropicales",
  },
  tx_jja: {
    title: "Température max d’été 2050",
    low: "Été plus frais",
    high: "Été plus chaud",
  },
  ifm40: {
    title: "Jours de risque feu (IFM)",
    low: "Peu de jours à risque",
    high: "Souvent à risque feu",
  },
  swi_dry: {
    title: "Jours sols secs",
    low: "Sols plus humides",
    high: "Sols souvent secs",
  },
  felt: {
    title: "Chaleur ressentie",
    low: "Air plus supportable",
    high: "Chaleur plus lourde",
  },
};
const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const map = L.map("map", {
  zoomControl: false,
  minZoom: 5,
  maxZoom: 16,
  wheelPxPerZoomLevel: 45,
  maxBounds: [
    [35.2, -10.5],
    [57.5, 19.5],
  ],
}).fitBounds(FRANCE_BOUNDS, { padding: [40, 40] });
map.getContainer()._ifcMap = map;

map.createPane("basemap");
map.getPane("basemap").style.zIndex = 150;
map.getPane("basemap").style.pointerEvents = "none";
map.createPane("heat");
map.getPane("heat").style.zIndex = 280;
map.getPane("heat").style.pointerEvents = "none";
map.createPane("dots");
map.getPane("dots").style.zIndex = 550;

const basemap = L.layerGroup({ pane: "basemap" }).addTo(map);
const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap · données Météo-France",
  maxZoom: 19,
}).addTo(map);
const layer = L.layerGroup().addTo(map);
const markers = new Map();
const massifMarkers = new Map();
const massifProjCache = new Map();
let homeMarker = null;
const CELL_MAX_DEG2 = (10 / 111.32) ** 2;
const CELL_FILL_DEG2 = (12.5 / 111.32) ** 2;
const NEIGHBOR_GRID_MAX_DEG2 = (16 / 111.32) ** 2;
const NEIGHBOR_FILL_DEG2 = (22 / 111.32) ** 2;
const COMPARE_MAX = 4;
const COMPARE_SEED = ["Belfort", "Nancy", "Clermont-Ferrand"];
const HOME = {
  id: "home-ganges",
  name: "Ganges",
  lat: 43.9344,
  lon: 3.7086,
  alt: 186,
  dep: "34",
  region: "Occitanie",
  cc: "FR",
};
const CUVETTE_POLES = new Set(["Grenoble", "Lyon"]);
const MASSIF_MIN_ZOOM = 9;
const MASSIF_MAP_ALT = 700;
const MASSIF_RING_LABEL = {
  piedmont: "piémont",
  mid: "800–1 200 m",
  high: "≥ 1 200 m",
};
const MASSIF_SECTORS = [
  { id: "massif-claix", n: "Claix", sector: "Vercors", ring: "piedmont", alt: 320, lat: 45.1187, lon: 5.659, pole: "Grenoble", drive: 20, dep: "38" },
  { id: "massif-vif", n: "Vif", sector: "Vercors", ring: "piedmont", alt: 310, lat: 45.043, lon: 5.6712, pole: "Grenoble", drive: 25, dep: "38" },
  { id: "massif-slp", n: "Saint-Laurent-du-Pont", sector: "Chartreuse", ring: "piedmont", alt: 410, lat: 45.3812, lon: 5.7307, pole: "Grenoble", drive: 35, dep: "38" },
  { id: "massif-nizier", n: "Saint-Nizier-du-Moucherotte", sector: "Vercors", ring: "mid", alt: 1160, lat: 45.1638, lon: 5.6306, pole: "Grenoble", drive: 20, dep: "38" },
  { id: "massif-lans", n: "Lans-en-Vercors", sector: "Vercors", ring: "mid", alt: 1020, lat: 45.1254, lon: 5.5858, pole: "Grenoble", drive: 28, dep: "38" },
  { id: "massif-autrans", n: "Autrans-Méaudre", sector: "Vercors", ring: "mid", alt: 1050, lat: 45.1713, lon: 5.5444, pole: "Grenoble", drive: 40, dep: "38" },
  { id: "massif-villard", n: "Villard-de-Lans", sector: "Vercors", ring: "mid", alt: 1050, lat: 45.051, lon: 5.5392, pole: "Grenoble", drive: 40, dep: "38" },
  { id: "massif-correncon", n: "Corrençon-en-Vercors", sector: "Vercors", ring: "mid", alt: 1110, lat: 45.0113, lon: 5.5221, pole: "Grenoble", drive: 50, dep: "38" },
  { id: "massif-gresse", n: "Gresse-en-Vercors", sector: "Vercors", ring: "high", alt: 1208, lat: 44.8783, lon: 5.5284, pole: "Grenoble", drive: 55, dep: "38" },
  { id: "massif-sappey", n: "Le Sappey-en-Chartreuse", sector: "Chartreuse", ring: "mid", alt: 1000, lat: 45.2617, lon: 5.7868, pole: "Grenoble", drive: 25, dep: "38" },
  { id: "massif-spc", n: "Saint-Pierre-de-Chartreuse", sector: "Chartreuse", ring: "mid", alt: 885, lat: 45.3312, lon: 5.7933, pole: "Grenoble", drive: 40, dep: "38" },
  { id: "massif-monestier", n: "Monestier-de-Clermont", sector: "Trièves", ring: "mid", alt: 837, lat: 44.9224, lon: 5.6343, pole: "Grenoble", drive: 35, dep: "38" },
  { id: "massif-mens", n: "Mens", sector: "Trièves", ring: "mid", alt: 820, lat: 44.8116, lon: 5.754, pole: "Grenoble", drive: 55, dep: "38" },
  { id: "massif-oisans", n: "Le Bourg-d'Oisans", sector: "Oisans", ring: "mid", alt: 720, lat: 45.0367, lon: 6.0275, pole: "Grenoble", drive: 50, dep: "38" },
  { id: "massif-smh", n: "Saint-Martin-en-Haut", sector: "Monts du Lyonnais", ring: "mid", alt: 730, lat: 45.6597, lon: 4.5617, pole: "Lyon", drive: 35, dep: "69" },
  { id: "massif-yzeron", n: "Yzeron", sector: "Monts du Lyonnais", ring: "mid", alt: 710, lat: 45.7067, lon: 4.5906, pole: "Lyon", drive: 35, dep: "69" },
  { id: "massif-sgm", n: "Saint-Genest-Malifaux", sector: "Pilat", ring: "mid", alt: 960, lat: 45.3403, lon: 4.4183, pole: "Saint-Étienne", drive: 25, dep: "42" },
  { id: "massif-thones", n: "Thônes", sector: "Aravis", ring: "piedmont", alt: 627, lat: 45.882, lon: 6.325, pole: "Annecy", drive: 25, dep: "74" },
  { id: "massif-sjs", n: "Saint-Jean-de-Sixt", sector: "Aravis", ring: "mid", alt: 957, lat: 45.9236, lon: 6.3897, pole: "Annecy", drive: 35, dep: "74" },
  { id: "massif-bornand", n: "Le Grand-Bornand", sector: "Aravis", ring: "mid", alt: 950, lat: 45.9417, lon: 6.4264, pole: "Annecy", drive: 40, dep: "74" },
  { id: "massif-aillon", n: "Aillon-le-Jeune", sector: "Bauges", ring: "mid", alt: 880, lat: 45.6186, lon: 6.0822, pole: "Chambéry", drive: 35, dep: "73" },
  { id: "massif-noyer", n: "Le Noyer", sector: "Bauges", ring: "mid", alt: 700, lat: 45.6872, lon: 6.0603, pole: "Chambéry", drive: 35, dep: "73" },
  { id: "massif-spe", n: "Saint-Pierre-d'Entremont", sector: "Chartreuse", ring: "mid", alt: 640, lat: 45.4158, lon: 5.8544, pole: "Chambéry", drive: 40, dep: "73" },
  { id: "massif-orcines", n: "Orcines", sector: "Chaîne des Puys", ring: "mid", alt: 836, lat: 45.7828, lon: 3.0122, pole: "Clermont-Ferrand", drive: 15, dep: "63" },
  { id: "massif-ceyssat", n: "Ceyssat", sector: "Chaîne des Puys", ring: "mid", alt: 870, lat: 45.7661, lon: 2.9003, pole: "Clermont-Ferrand", drive: 25, dep: "63" },
  { id: "massif-nectaire", n: "Saint-Nectaire", sector: "Sancy", ring: "mid", alt: 760, lat: 45.5836, lon: 3.0006, pole: "Clermont-Ferrand", drive: 40, dep: "63" },
  { id: "massif-murol", n: "Murol", sector: "Sancy", ring: "mid", alt: 835, lat: 45.575, lon: 2.9428, pole: "Clermont-Ferrand", drive: 45, dep: "63" },
  { id: "massif-besse", n: "Besse-et-Saint-Anastaise", sector: "Sancy", ring: "mid", alt: 1050, lat: 45.5125, lon: 2.9336, pole: "Clermont-Ferrand", drive: 50, dep: "63" },
  { id: "massif-ornans", n: "Ornans", sector: "Loue", ring: "piedmont", alt: 330, lat: 47.1058, lon: 6.1439, pole: "Besançon", drive: 25, dep: "25", reg: "Bourgogne-Franche-Comté" },
  { id: "massif-avoudrey", n: "Avoudrey", sector: "Premier plateau", ring: "mid", alt: 710, lat: 47.1372, lon: 6.4361, pole: "Besançon", drive: 35, dep: "25", reg: "Bourgogne-Franche-Comté" },
  { id: "massif-flange", n: "Flangebouche", sector: "Premier plateau", ring: "mid", alt: 730, lat: 47.1408, lon: 6.4725, pole: "Besançon", drive: 40, dep: "25", reg: "Bourgogne-Franche-Comté" },
  { id: "massif-levier", n: "Levier", sector: "Premier plateau", ring: "mid", alt: 720, lat: 46.9542, lon: 6.1194, pole: "Besançon", drive: 45, dep: "25", reg: "Bourgogne-Franche-Comté" },
  { id: "massif-giromagny", n: "Giromagny", sector: "Vosges du Sud", ring: "piedmont", alt: 473, lat: 47.7425, lon: 6.8264, pole: "Belfort", drive: 15, dep: "90", reg: "Bourgogne-Franche-Comté" },
  { id: "massif-maiche", n: "Maîche", sector: "Plateau de Maîche", ring: "mid", alt: 785, lat: 47.2519, lon: 6.8044, pole: "Montbéliard", drive: 35, dep: "25", reg: "Bourgogne-Franche-Comté", also: ["Belfort"] },
  { id: "massif-charquemont", n: "Charquemont", sector: "Plateau de Maîche", ring: "mid", alt: 865, lat: 47.215, lon: 6.8225, pole: "Montbéliard", drive: 40, dep: "25", reg: "Bourgogne-Franche-Comté", also: ["Belfort"] },
  { id: "massif-damprichard", n: "Damprichard", sector: "Plateau de Maîche", ring: "mid", alt: 800, lat: 47.2453, lon: 6.8822, pole: "Montbéliard", drive: 40, dep: "25", reg: "Bourgogne-Franche-Comté", also: ["Belfort"] },
  { id: "massif-russey", n: "Le Russey", sector: "Plateau de Maîche", ring: "mid", alt: 870, lat: 47.1633, lon: 6.7308, pole: "Montbéliard", drive: 45, dep: "25", reg: "Bourgogne-Franche-Comté", also: ["Belfort"] },
  { id: "massif-lasalle", n: "Lasalle", sector: "Cévennes", ring: "piedmont", alt: 275, lat: 44.0472, lon: 3.8531, pole: "Alès", drive: 50, dep: "30", reg: "Occitanie" },
  { id: "massif-grandcombe", n: "La Grand-Combe", sector: "Cévennes", ring: "piedmont", alt: 180, lat: 44.2104, lon: 4.0297, pole: "Alès", drive: 15, dep: "30", reg: "Occitanie" },
  { id: "massif-portes", n: "Portes", sector: "Cévennes", ring: "piedmont", alt: 500, lat: 44.2714, lon: 4.0208, pole: "Alès", drive: 20, dep: "30", reg: "Occitanie" },
  { id: "massif-genolhac", n: "Génolhac", sector: "Cévennes", ring: "piedmont", alt: 500, lat: 44.3506, lon: 3.95, pole: "Alès", drive: 35, dep: "30", reg: "Occitanie" },
  { id: "massif-concoules", n: "Concoules", sector: "Cévennes", ring: "piedmont", alt: 640, lat: 44.383, lon: 3.937, pole: "Alès", drive: 40, dep: "30", reg: "Occitanie" },
];
const PLACE_ZOOM = 12;

function resetMapView() {
  map.fitBounds(FRANCE_BOUNDS, { padding: [40, 40] });
}

function flyToPlace(lat, lon, zoom = PLACE_ZOOM) {
  map.flyTo([lat, lon], zoom, { duration: 0.55 });
}

function flyToRow(s) {
  if (!s) return;
  const hasCrown =
    s.kind !== "massif" && massifsForPole(s.pole || s.name).length > 0;
  flyToPlace(s.lat, s.lon, hasCrown ? 10 : PLACE_ZOOM);
}

function syncMapNav() {
  const nav = document.querySelector(".map-nav");
  if (!nav) return;
  const z = map.getZoom();
  const level = nav.querySelector(".map-nav-level");
  if (level) level.textContent = String(Math.round(z));
  const inn = nav.querySelector('[data-act="in"]');
  const out = nav.querySelector('[data-act="out"]');
  if (inn) inn.disabled = z >= map.getMaxZoom() - 0.05;
  if (out) out.disabled = z <= map.getMinZoom() + 0.05;
}

const MapNav = L.Control.extend({
  options: { position: "topright" },
  onAdd() {
    const wrap = L.DomUtil.create("div", "map-nav");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Zoom et cadrage");
    const mkBtn = (act, label, text, extra = "") => {
      const b = L.DomUtil.create("button", `map-nav-btn${extra ? ` ${extra}` : ""}`, wrap);
      b.type = "button";
      b.dataset.act = act;
      b.setAttribute("aria-label", label);
      b.title = label;
      b.textContent = text;
      return b;
    };
    mkBtn("in", "Zoomer", "+");
    const level = L.DomUtil.create("span", "map-nav-level", wrap);
    level.setAttribute("aria-live", "polite");
    level.title = "Niveau de zoom";
    mkBtn("out", "Dézoomer", "−");
    mkBtn("reset", "Revenir à la France entière", "France", "map-nav-wide");
    L.DomEvent.disableClickPropagation(wrap);
    L.DomEvent.disableScrollPropagation(wrap);
    L.DomEvent.on(wrap, "click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn || btn.disabled) return;
      const act = btn.dataset.act;
      if (act === "in") map.zoomIn();
      else if (act === "out") map.zoomOut();
      else if (act === "reset") resetMapView();
    });
    return wrap;
  },
});
new MapNav().addTo(map);
map.on("zoom zoomend", syncMapNav);
syncMapNav();

function colorRgb(color) {
  if (color.startsWith("rgb")) {
    const m = color.match(/\d+/g);
    return [Number(m[0]), Number(m[1]), Number(m[2])];
  }
  const n = color.replace("#", "");
  return [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16),
  ];
}

function bucketCells(items, deg = 0.08) {
  const buckets = new Map();
  for (const item of items) {
    const k = `${Math.round(item.cell.lon / deg)}:${Math.round(item.cell.lat / deg)}`;
    const arr = buckets.get(k);
    if (arr) arr.push(item);
    else buckets.set(k, [item]);
  }
  return { buckets, deg };
}

function nearbyCells(index, lat, lon) {
  const kx = Math.round(lon / index.deg);
  const ky = Math.round(lat / index.deg);
  const out = [];
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const arr = index.buckets.get(`${kx + dx}:${ky + dy}`);
      if (arr) out.push(...arr);
    }
  }
  return out;
}

function itemsInBBox(index, minLat, maxLat, minLon, maxLon) {
  if (!index) return [];
  const { buckets, deg } = index;
  const x0 = Math.round(minLon / deg) - 2;
  const x1 = Math.round(maxLon / deg) + 2;
  const y0 = Math.round(minLat / deg) - 2;
  const y1 = Math.round(maxLat / deg) + 2;
  const out = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const arr = buckets.get(`${x}:${y}`);
      if (arr) out.push(...arr);
    }
  }
  return out;
}

function sameRgb(a, b) {
  return Boolean(a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]);
}

function lerpRgb4(a, b, c, d, tx, ty) {
  let r = 0;
  let g = 0;
  let bl = 0;
  let w = 0;
  const acc = (rgb, wt) => {
    if (!rgb || wt <= 0) return;
    r += rgb[0] * wt;
    g += rgb[1] * wt;
    bl += rgb[2] * wt;
    w += wt;
  };
  acc(a, (1 - tx) * (1 - ty));
  acc(b, tx * (1 - ty));
  acc(c, (1 - tx) * ty);
  acc(d, tx * ty);
  if (!w) return null;
  return [Math.round(r / w), Math.round(g / w), Math.round(bl / w)];
}

function pushNear(best, item, d) {
  if (best.length < 4) {
    best.push({ item, d });
    if (best.length === 4) best.sort((a, b) => a.d - b.d);
    return;
  }
  if (d >= best[3].d) return;
  best[3] = { item, d };
  for (let i = 3; i > 0 && best[i].d < best[i - 1].d; i--) {
    const tmp = best[i];
    best[i] = best[i - 1];
    best[i - 1] = tmp;
  }
}

const IDW_KEYS = ["tx30", "tr", "tx_jja", "ifm40", "swi_dry", "tx_jja0", "tx300", "tr0", "cdd"];

function heatRgbAt(lat, lon, candidates, maxDeg2, fillDeg2, metric, rankFn, smooth) {
  if (!candidates.length) return null;
  const cos = Math.cos((lat * Math.PI) / 180);
  const near = [];
  for (const item of candidates) {
    const cap = item.maxDeg2 || fillDeg2;
    const dlat = item.cell.lat - lat;
    const dlon = (item.cell.lon - lon) * cos;
    const d = dlat * dlat + dlon * dlon;
    if (d < cap * 2.8) pushNear(near, item, d);
  }
  if (!near.length || near[0].d > fillDeg2) return null;
  if (!smooth || near.length === 1 || near[0].d > maxDeg2) {
    return near[0].item.rgb;
  }
  const mix = {};
  const mixW = {};
  for (const key of IDW_KEYS) {
    mix[key] = 0;
    mixW[key] = 0;
  }
  let wsum = 0;
  for (const { item, d } of near) {
    const w = 1 / (d + 1e-12);
    wsum += w;
    for (const key of IDW_KEYS) {
      const v = item.cell[key];
      if (!Number.isFinite(v)) continue;
      mix[key] += v * w;
      mixW[key] += w;
    }
  }
  for (const key of IDW_KEYS) {
    mix[key] = mixW[key] ? mix[key] / mixW[key] : NaN;
  }
  mix.cc = near[0].item.cell.cc;
  if (metric === "combined") {
    return colorRgb(sequentialHeat(combinedSmoothT(mix)));
  }
  const style = driasCellStyle(mix, metric, rankFn || (() => 0.5));
  if (style) return colorRgb(style.color);
  return near[0].item.rgb;
}

const HeatGrid = L.GridLayer.extend({
  options: {
    pane: "heat",
    tileSize: 256,
    opacity: 0.72,
    className: "heat-tiles",
    keepBuffer: 2,
    updateWhenZooming: false,
    updateWhenIdle: true,
  },
  initialize(options) {
    L.GridLayer.prototype.initialize.call(this, options);
    this._painted = [];
    this._frIndex = null;
    this._nbIndex = null;
    this._hasNb = false;
    this._paintGen = 0;
  },
  setPainted(painted) {
    this._paintGen += 1;
    this._painted = painted || [];
    const fr = [];
    const nb = [];
    for (const item of this._painted) {
      if (item.maxDeg2) nb.push(item);
      else fr.push(item);
    }
    this._hasNb = nb.length > 0;
    this._frIndex = fr.length ? bucketCells(fr) : null;
    this._nbIndex = nb.length ? bucketCells(nb, 0.18) : null;
  },
  redraw() {
    this._paintGen += 1;
    return L.GridLayer.prototype.redraw.call(this);
  },
  onRemove(mapRef) {
    this._paintGen += 1;
    L.GridLayer.prototype.onRemove.call(this, mapRef);
  },
  createTile(coords) {
    const tile = document.createElement("canvas");
    const size = this.getTileSize();
    tile.width = size.x;
    tile.height = size.y;
    if (this._map) this._fillTile(tile, coords);
    return tile;
  },
  _sample(lat, lon, local, nbLocal, frIdx, nbIdx, metric, rankFn, nbRankFn, smooth) {
    const cand = frIdx ? nearbyCells(frIdx, lat, lon) : local;
    let rgb = heatRgbAt(
      lat,
      lon,
      cand,
      CELL_MAX_DEG2,
      CELL_FILL_DEG2,
      metric,
      rankFn,
      smooth,
    );
    if (!rgb && nbLocal.length) {
      const nbCand = nbIdx ? nearbyCells(nbIdx, lat, lon) : nbLocal;
      rgb = heatRgbAt(
        lat,
        lon,
        nbCand,
        NEIGHBOR_GRID_MAX_DEG2,
        NEIGHBOR_FILL_DEG2,
        metric,
        nbRankFn,
        smooth,
      );
    }
    return rgb;
  },
  _fillTile(tile, coords) {
    if (!this._painted?.length || !this._map) return;
    const size = this.getTileSize();
    const bounds = this._tileCoordsToBounds(coords);
    const pad = this._hasNb ? 0.28 : 0.16;
    const minLat = bounds.getSouth() - pad;
    const maxLat = bounds.getNorth() + pad;
    const minLon = bounds.getWest() - pad;
    const maxLon = bounds.getEast() + pad;
    const local = itemsInBBox(this._frIndex, minLat, maxLat, minLon, maxLon);
    const nbLocal = this._hasNb
      ? itemsInBBox(this._nbIndex, minLat, maxLat, minLon, maxLon)
      : [];
    if (!local.length && !nbLocal.length) return;
    const z = coords.z;
    const step = z <= 6 ? 8 : 4;
    const smooth = z >= 7;
    const originX = coords.x * size.x;
    const originY = coords.y * size.y;
    const mapRef = this._map;
    const ctx = tile.getContext("2d", { alpha: true });
    const frIdx = local.length > 24 ? bucketCells(local) : null;
    const nbIdx = nbLocal.length > 24 ? bucketCells(nbLocal, 0.18) : null;
    const metric = this._metric || "combined";
    const rankFn = this._rankFn || (() => 0.5);
    const nbRankFn = this._nbRankFn || rankFn;
    const sample = (lat, lon) =>
      this._sample(lat, lon, local, nbLocal, frIdx, nbIdx, metric, rankFn, nbRankFn, smooth);
    const atPx = (px, py) => {
      const ll = mapRef.unproject([originX + px, originY + py], z);
      return sample(ll.lat, ll.lng);
    };
    const cNw = atPx(1, 1);
    const cNe = atPx(size.x - 1, 1);
    const cSw = atPx(1, size.y - 1);
    const cSe = atPx(size.x - 1, size.y - 1);
    const cMid = atPx(size.x / 2, size.y / 2);
    const cN = atPx(size.x / 2, 1);
    const cS = atPx(size.x / 2, size.y - 1);
    const cW = atPx(1, size.y / 2);
    const cE = atPx(size.x - 1, size.y / 2);
    const solid =
      z < 11 &&
      cNw &&
      sameRgb(cNw, cNe) &&
      sameRgb(cNw, cSw) &&
      sameRgb(cNw, cSe) &&
      sameRgb(cNw, cMid) &&
      sameRgb(cNw, cN) &&
      sameRgb(cNw, cS) &&
      sameRgb(cNw, cW) &&
      sameRgb(cNw, cE);
    if (solid) {
      ctx.fillStyle = `rgb(${cNw[0]},${cNw[1]},${cNw[2]})`;
      ctx.fillRect(0, 0, size.x, size.y);
      return;
    }
    const gw = Math.floor(size.x / step);
    const gh = Math.floor(size.y / step);
    const nx = gw + 1;
    const ny = gh + 1;
    const grid = new Array(nx * ny);
    for (let gy = 0; gy < ny; gy++) {
      for (let gx = 0; gx < nx; gx++) {
        grid[gy * nx + gx] = atPx(
          Math.min(size.x - 1, gx * step),
          Math.min(size.y - 1, gy * step),
        );
      }
    }
    const img = ctx.createImageData(size.x, size.y);
    const data = img.data;
    for (let py = 0; py < size.y; py++) {
      const fy = py / step;
      const y0 = Math.min(gh - 1, fy | 0);
      const ty = fy - y0;
      const row0 = y0 * nx;
      const row1 = (y0 + 1) * nx;
      for (let px = 0; px < size.x; px++) {
        const fx = px / step;
        const x0 = Math.min(gw - 1, fx | 0);
        const rgb = lerpRgb4(
          grid[row0 + x0],
          grid[row0 + x0 + 1],
          grid[row1 + x0],
          grid[row1 + x0 + 1],
          fx - x0,
          ty,
        );
        if (!rgb) continue;
        const i = (py * size.x + px) * 4;
        data[i] = rgb[0];
        data[i + 1] = rgb[1];
        data[i + 2] = rgb[2];
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  },
});
const heatLayer = new HeatGrid();
let lastStationClick = 0;

const els = {
  start: document.getElementById("range-start"),
  end: document.getElementById("range-end"),
  range: document.getElementById("slider-range"),
  period: document.getElementById("period-label"),
  bestName: document.getElementById("best-name"),
  bestSpot: document.getElementById("best-spot"),
  lowland: document.getElementById("lowland-only"),
  ville: document.getElementById("ville-only"),
  settled: document.getElementById("settled-only"),
  view: document.getElementById("view-mode"),
  ticks: document.getElementById("slider-ticks"),
  detail: document.getElementById("detail"),
  close: document.getElementById("detail-close"),
  dRegion: document.getElementById("detail-region"),
  dName: document.getElementById("detail-name"),
  dMeta: document.getElementById("detail-meta"),
  dTx: document.getElementById("d-tx"),
  dTn: document.getElementById("d-tn"),
  dTxMax: document.getElementById("d-txmax"),
  dHot: document.getElementById("d-hot"),
  dTrop: document.getElementById("d-trop"),
  dAmp: document.getElementById("d-amp"),
  dFlags: document.getElementById("detail-flags"),
  dWater: document.getElementById("detail-water"),
  dFuture: document.getElementById("detail-future"),
  dVs: document.getElementById("detail-vs"),
  kicker: document.getElementById("brand-kicker"),
  brandSub: document.getElementById("brand-sub"),
  horizonNow: document.getElementById("horizon-now"),
  horizon2050: document.getElementById("horizon-2050"),
  driasMetric: document.getElementById("drias-metric"),
  driasMetricField: document.getElementById("drias-metric-field"),
  nowMetric: document.getElementById("now-metric"),
  nowMetricField: document.getElementById("now-metric-field"),
  dockPeriodKicker: document.getElementById("dock-period-kicker"),
  critHeatLabel: document.getElementById("crit-heat-label"),
  critFireLabel: document.getElementById("crit-fire-label"),
  criteriaHelp: document.getElementById("criteria-help"),
  bestLabel: document.getElementById("best-label"),
  legendTitle: document.getElementById("legend-title"),
  legendLow: document.getElementById("legend-low"),
  legendHigh: document.getElementById("legend-high"),
  legendWater: document.getElementById("legend-water"),
  legendMassif: document.getElementById("legend-massif"),
  cityList: document.getElementById("city-list"),
  cityListTitle: document.getElementById("city-list-title"),
  cityListItems: document.getElementById("city-list-items"),
  citySearch: document.getElementById("city-search"),
  cityListHint: document.getElementById("city-list-hint"),
  showStations: document.getElementById("show-stations"),
  exportLlm: document.getElementById("export-llm"),
  compareToggle: document.getElementById("compare-toggle"),
  compareClose: document.getElementById("compare-close"),
  compareHint: document.getElementById("compare-hint"),
  checks: document.getElementById("detail-checks"),
  dtTx: document.getElementById("dt-tx"),
  dtTn: document.getElementById("dt-tn"),
  dtTxMax: document.getElementById("dt-txmax"),
  dtHot: document.getElementById("dt-hot"),
  dtTrop: document.getElementById("dt-trop"),
  dtAmp: document.getElementById("dt-amp"),
  lexicon: document.getElementById("lexicon"),
  lexiconToggle: document.getElementById("lexicon-toggle"),
  criteria: document.getElementById("criteria"),
  legendBandHelp: document.getElementById("legend-band-help"),
  compare: document.getElementById("compare"),
  compareTable: document.getElementById("compare-table"),
  compareAdd: document.getElementById("compare-add"),
  busy: document.getElementById("busy"),
  drawer: document.getElementById("drawer"),
  drawerOpen: document.getElementById("drawer-open"),
  drawerClose: document.getElementById("drawer-close"),
  dockExtra: document.getElementById("dock-extra"),
  dockMore: document.getElementById("dock-more"),
  citySort: document.getElementById("city-sort"),
  resetFilters: document.getElementById("reset-filters"),
  eqTipBtn: document.getElementById("eq-tip-btn"),
  selChip: document.getElementById("sel-chip"),
  selChipName: document.getElementById("sel-chip-name"),
  selChipClear: document.getElementById("sel-chip-clear"),
  countCountries: document.getElementById("count-countries"),
  countClimate: document.getElementById("count-climate"),
  countAmenity: document.getElementById("count-amenity"),
};

let data = null;
let drias = null;
let driasLoad = null;
let byStation = new Map();
let driasById = new Map();
let amenitiesById = new Map();
let airById = new Map();
let airList = [];
let neighbors = [];
let neighborGrid = [];
let aires = [];
let stationById = new Map();
let amenityRadius = 30;
let selectedId = null;
ensureHomeMarker();
let listedRows = [];
let lastPainted = [];
let compareRows = [];
let compareOpen = false;
let compareSeeded = false;
let timer = null;
let horizon = "now";
let renderGen = 0;

const WATER_LABEL = {
  crise: "crise sécheresse",
  alerte_renforcee: "alerte renforcée",
  alerte: "alerte",
  vigilance: "vigilance",
  pas_de_restriction: "pas de restriction",
  inconnu: "non renseigné",
};

function ymd(n) {
  const s = String(n);
  return {
    y: Number(s.slice(0, 4)),
    m: Number(s.slice(4, 6)),
    d: Number(s.slice(6, 8)),
  };
}

function formatDay(n) {
  const { d, m } = ymd(n);
  return `${d} ${MONTHS[m - 1]}`;
}

function mean(xs) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdev(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

function longestStreak(arr, i0, i1, thresh, scale = 10) {
  let best = 0;
  let cur = 0;
  for (let i = i0; i <= i1; i++) {
    const v = arr[i];
    if (v != null && v / scale >= thresh) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}

function longestHotNights(tx, tn, i0, i1, txMin, tnMin) {
  let best = 0;
  let cur = 0;
  for (let i = i0; i <= i1; i++) {
    const x = tx[i];
    const n = tn[i];
    if (x != null && n != null && x / 10 >= txMin && n / 10 >= tnMin) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}

function comfort(s) {
  const sweet = Math.abs(s.txMean - 23);
  const felt = Number.isFinite(s.feltMean) ? Math.max(0, s.feltMean - 24) * 1.4 : 0;
  return (
    s.days30 * 1.2 +
    s.days35 * 2.4 +
    s.nights20 * 1.8 +
    Math.max(0, s.txMax - 32) * 1.4 +
    (s.streak35 || 0) * 6 +
    (s.streak30 || 0) * 1.1 +
    (s.streakNight || 0) * 4 +
    (s.streakHotNight || 0) * 8 +
    s.txStd * 1.6 +
    s.ampli * 0.15 +
    sweet * 0.7 +
    Math.max(0, 12 - s.tnMean) * 0.4 +
    felt +
    (s.daysFelt40 || 0) * 1.6
  );
}

function stationStats(station, i0, i1) {
  const txs = [];
  const tns = [];
  const amps = [];
  const felts = [];
  for (let i = i0; i <= i1; i++) {
    const tx = station.tx[i];
    const tn = station.tn[i];
    if (tx == null || tn == null) continue;
    const x = tx / 10;
    const n = tn / 10;
    txs.push(x);
    tns.push(n);
    amps.push(x - n);
    const h = humidex(x, Math.min(n, x - 1));
    if (h != null) felts.push(h);
  }
  const needed = Math.max(5, Math.ceil((i1 - i0 + 1) * 0.7));
  if (txs.length < needed) return null;
  const stats = {
    id: station.id,
    name: station.n,
    lat: station.lat,
    lon: station.lon,
    alt: station.alt,
    dep: station.dep,
    region: station.reg,
    n: txs.length,
    txMean: mean(txs),
    tnMean: mean(tns),
    txMax: Math.max(...txs),
    tnMin: Math.min(...tns),
    txStd: stdev(txs),
    ampli: mean(amps),
    days30: txs.filter((x) => x >= 30).length,
    days35: txs.filter((x) => x >= 35).length,
    days40: txs.filter((x) => x >= 40).length,
    nights20: tns.filter((x) => x >= 20).length,
    feltMean: felts.length ? mean(felts) : null,
    daysFelt40: felts.filter((h) => h >= 40).length,
    streak30: longestStreak(station.tx, i0, i1, 30),
    streak35: longestStreak(station.tx, i0, i1, 35),
    streak40: longestStreak(station.tx, i0, i1, 40),
    streakNight: longestStreak(station.tn, i0, i1, 20),
    streakHotNight: longestHotNights(station.tx, station.tn, i0, i1, 35, 20),
  };
  stats.score = comfort(stats);
  return stats;
}

const BAND_FILL = {
  green: "#3ecfb2",
  yellow: "#f5c518",
  orange: "#e4c27a",
  red: "#e25b45",
};

const BAND_FILL_2050 = {
  ...BAND_FILL,
  green: "#3ee8c4",
  yellow: "#d4ec78",
  red: "#ff6f55",
  near: "#b57bff",
  black: "#1a1214",
};

function currentFills() {
  return horizon === "2050" ? BAND_FILL_2050 : BAND_FILL;
}

function colorBand(t) {
  if (t < 0.25) return "green";
  if (t < 0.5) return "yellow";
  if (t < 0.75) return "orange";
  return "red";
}

function bandOn(band) {
  const box = document.querySelector(`[data-band="${band}"]`);
  return !box || box.checked;
}

function setBandCaptions() {
  const captions =
    horizon === "2050"
      ? {
          green: "Vert vif · été confortable",
          yellow: "Vert fade · été encore tenable",
          near: "Presque · 2–4 j de trop",
          red: "Rouge · été trop dur",
          black: "Noir · invivable",
        }
      : {
          green: "Vert · 1er quart",
          yellow: "Jaune · 2e quart",
          orange: "Orange · 3e quart",
          red: "Rouge · 4e quart",
        };
  for (const [band, text] of Object.entries(captions)) {
    const el = document.querySelector(`[data-band-label="${band}"]`);
    if (el) el.textContent = text;
  }
  if (els.legendBandHelp) {
    els.legendBandHelp.textContent =
      horizon === "2050"
        ? "Pastilles et aplat : même code. Vert vif = confortable. Vert fade = tenable. Violet = presque. Rouge = trop dur (Grenoble). Noir = invivable (Ganges, Béziers, Nîmes, pourtour méditerranéen)."
        : "Parmi les villes affichées. Quatre quarts du classement, du plus supportable au plus éprouvant.";
  }
}

function lerpColor(t) {
  return BAND_FILL[colorBand(t)];
}

function mixRgb(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function sequentialHeat(t) {
  const stops = [
    [0, [62, 232, 196]],
    [0.36, [212, 236, 120]],
    [0.58, [181, 123, 255]],
    [0.78, [255, 111, 85]],
    [1, [26, 18, 20]],
  ];
  const x = Math.min(1, Math.max(0, t));
  let i = 1;
  while (i < stops.length && x > stops[i][0]) i += 1;
  const [t0, c0] = stops[i - 1];
  const [t1, c1] = stops[i];
  const [r, g, b] = mixRgb(c0, c1, (x - t0) / (t1 - t0 || 1));
  return `rgb(${r},${g},${b})`;
}

function combinedSmoothT(proj) {
  const felt = feltHeat2050(proj);
  const parts = [
    Number.isFinite(proj?.tx30) ? proj.tx30 / T2050.tx30 : null,
    Number.isFinite(proj?.tr) ? proj.tr / T2050.tr : null,
    Number.isFinite(proj?.tx_jja) ? (proj.tx_jja - 20) / (T2050.txJja - 20) : null,
    Number.isFinite(felt) ? felt / T2050.felt : null,
  ].filter((v) => v != null);
  if (!parts.length) return 0.5;
  const u = Math.max(...parts);
  const comfort = T2050_MARGIN.tx30 / T2050.tx30;
  const near = T2050_NEAR.tx30 / T2050.tx30;
  const dead = T2050_BLACK.tx30 / T2050.tx30;
  if (u <= comfort) return 0.1 * (u / (comfort || 1));
  if (u <= 1) return 0.12 + 0.36 * ((u - comfort) / (1 - comfort || 1));
  if (u <= near) return 0.5 + 0.22 * ((u - 1) / (near - 1 || 1));
  if (u <= dead) return 0.74 + 0.12 * ((u - near) / (dead - near || 1));
  return Math.min(1, 0.88 + 0.12 * Math.min(1, (u - dead) / 0.8));
}

function driasCellStyle(cell, metric, rankFn) {
  if (metric === "combined") {
    if (
      !Number.isFinite(cell.tx30) ||
      !Number.isFinite(cell.tr) ||
      !Number.isFinite(cell.tx_jja)
    ) {
      return null;
    }
    if (climateUnlivable(cell)) {
      return { band: "black", color: BAND_FILL_2050.black };
    }
    if (climateAlmost(cell) && !climateSideFails(cell)) {
      return { band: "near", color: BAND_FILL_2050.near };
    }
    if (climateCriterionFails(null, cell)) {
      return { band: "red", color: BAND_FILL_2050.red };
    }
    if (climateHasMargin(cell)) {
      return { band: "green", color: BAND_FILL_2050.green };
    }
    return { band: "yellow", color: BAND_FILL_2050.yellow };
  }
  const v = metric === "felt" ? feltHeat2050(cell) : cell[metric];
  if (!Number.isFinite(v)) return null;
  const t = rankFn(v);
  return { band: colorBand(t), color: sequentialHeat(t) };
}

function nearestDriasCell(latlng) {
  if (!drias?.cells?.length) return null;
  let best = null;
  let bestKm = 6.2;
  const here = { lat: latlng.lat, lon: latlng.lng };
  for (const cell of drias.cells) {
    const d = kmBetween(cell, here);
    if (d < bestKm) {
      bestKm = d;
      best = cell;
    }
  }
  return best;
}

function nearestNeighborCell(latlng) {
  if (!neighborGrid.length) return null;
  let best = null;
  let bestKm = 16;
  const here = { lat: latlng.lat, lon: latlng.lng };
  for (const cell of neighborGrid) {
    if (!countryOn(cell.cc)) continue;
    const d = kmBetween(cell, here);
    if (d < bestKm) {
      bestKm = d;
      best = cell;
    }
  }
  return best;
}

function ranks(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return (v) => {
    if (sorted.length < 2) return 0.5;
    let lo = 0;
    let hi = sorted.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    return lo / (sorted.length - 1);
  };
}

function deg(n) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1).replace(".", ",")} °C`;
}

function kmBetween(a, b) {
  const r = 6371;
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dphi = p2 - p1;
  const dlmb = ((b.lon - a.lon) * Math.PI) / 180;
  const x =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dlmb / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(x));
}

function dedupNearby(rows, km = 14) {
  const kept = [];
  for (const row of rows) {
    const i = kept.findIndex((k) => kmBetween(k, row) < km);
    if (i < 0) {
      kept.push(row);
      continue;
    }
    const better =
      (row.commune && !kept[i].commune) ||
      (horizon === "2050"
        ? row.score2050 < kept[i].score2050
        : row.score < kept[i].score);
    if (better) kept[i] = row;
  }
  return kept;
}

function placeName(s) {
  return s.commune || s.pole || titleCase(s.name);
}

function critOn(id) {
  const box = document.querySelector(`[data-crit="${id}"]`);
  return !box || box.checked;
}

function amenityOf(id) {
  return amenitiesById.get(id) || null;
}

function amenityOk(amen, key) {
  if (!amenitiesById.size) return true;
  if (!amen) return true;
  const km = amen?.[`${key}_km`];
  const max = AMENITY_RADIUS_KM[key] ?? amenityRadius;
  return Number.isFinite(km) && km <= max;
}

function airOf(place) {
  if (!place) return null;
  if (place.air) return place.air;
  if (place.id && airById.has(place.id)) return airById.get(place.id);
  if (!Number.isFinite(place.lat) || !airList.length) return null;
  let best = null;
  let bestD = 28;
  for (const row of airList) {
    const d = kmBetween(place, row);
    if (d < bestD) {
      bestD = d;
      best = row;
    }
  }
  if (
    place.kind === "massif" &&
    (place.alt || 0) >= 800 &&
    best &&
    best.ok === false &&
    (best.basin || (best.tags || []).includes("cuvette"))
  ) {
    return {
      ...best,
      ok: true,
      inherited_basin: true,
      why: "PM de cuvette au pôle, pas à cette altitude",
    };
  }
  return best;
}

function airFails(place) {
  const air = airOf(place);
  return Boolean(air && air.ok === false);
}

function stationLabel(s) {
  return String(s?.name || s?.n || s?.commune || "");
}

function isIsolatedPost(s) {
  const n = stationLabel(s).toUpperCase();
  if (!n) return false;
  if (n.includes("NIVOSE") || n.includes("NIVO") || n.includes("RADOME")) return true;
  if ((s.alt || 0) >= ISOLATED_ALT_M) return true;
  if ((s.alt || 0) >= 800 && (/\bCOL\b/.test(n) || n.includes("RADOME"))) return true;
  return false;
}

function countryOn(cc) {
  const box = document.querySelector(`[data-country="${cc}"]`);
  return !box || box.checked;
}

function humidex(t, td) {
  if (!Number.isFinite(t) || !Number.isFinite(td)) return null;
  const dew = Math.min(td, t);
  const e = 6.11 * Math.exp(5417.753 * (1 / 273.16 - 1 / (dew + 273.16)));
  return t + 0.5555 * (e - 10);
}

function feltHeat2050(proj) {
  if (!proj || !Number.isFinite(proj.tx_jja)) return null;
  const tr = Number.isFinite(proj.tr) ? proj.tr : 0;
  const td = 12 + Math.min(9, (tr / 30) * 9);
  return humidex(proj.tx_jja, td);
}

function climateUnlivable(proj) {
  if (
    !proj ||
    !Number.isFinite(proj.tx30) ||
    !Number.isFinite(proj.tr) ||
    !Number.isFinite(proj.tx_jja)
  ) {
    return false;
  }
  const felt = feltHeat2050(proj);
  return (
    proj.tx30 >= T2050_BLACK.tx30 ||
    proj.tr >= T2050_BLACK.tr ||
    proj.tx_jja >= T2050_BLACK.txJja ||
    (Number.isFinite(felt) && felt >= T2050_BLACK.felt)
  );
}

function climateAlmost(proj) {
  if (!proj || !Number.isFinite(proj.tx30) || !Number.isFinite(proj.tr) || !Number.isFinite(proj.tx_jja)) {
    return false;
  }
  if (climateHeatOk(proj)) return false;
  const felt = feltHeat2050(proj);
  return (
    proj.tx30 <= T2050_NEAR.tx30 &&
    proj.tr <= T2050_NEAR.tr &&
    proj.tx_jja <= T2050_NEAR.txJja &&
    (!Number.isFinite(felt) || felt <= T2050_NEAR.felt)
  );
}

function climateSideFails(proj) {
  if (critOn("fire") && Number.isFinite(proj?.ifm40) && proj.ifm40 > T2050.ifm40) {
    return true;
  }
  if (critOn("dry") && Number.isFinite(proj?.swi_dry) && proj.swi_dry > T2050.swi) {
    return true;
  }
  return false;
}

function climateHeatOk(proj) {
  const felt = feltHeat2050(proj);
  return Boolean(
    proj &&
      proj.tx30 <= T2050.tx30 &&
      proj.tr <= T2050.tr &&
      proj.tx_jja <= T2050.txJja &&
      (!Number.isFinite(felt) || felt <= T2050.felt),
  );
}

function climateCriterionFails(extra, proj) {
  if (critOn("heat") && !climateHeatOk(proj)) return true;
  if (critOn("fire") && Number.isFinite(proj?.ifm40) && proj.ifm40 > T2050.ifm40) {
    return true;
  }
  if (critOn("fire") && extra?.feu) return true;
  if (critOn("dry") && Number.isFinite(proj?.swi_dry) && proj.swi_dry > T2050.swi) {
    return true;
  }
  return false;
}

function localCriterionFails(extra, amen, place) {
  if (critOn("coast") && extra && (extra.submersion || extra.erosion)) return true;
  if (critOn("nuke") && extra?.nucleaire) return true;
  if (critOn("local") && extra && extra.risk > T2050.risk) return true;
  if (critOn("air") && airFails(place)) return true;
  for (const key of AMENITY_KEYS) {
    if (critOn(key) && !amenityOk(amen, key)) return true;
  }
  return false;
}

function climateHasMargin(proj) {
  const felt = feltHeat2050(proj);
  return Boolean(
    proj &&
      proj.tx30 <= T2050_MARGIN.tx30 &&
      proj.tr <= T2050_MARGIN.tr &&
      proj.tx_jja <= T2050_MARGIN.txJja &&
      (!Number.isFinite(felt) || felt <= T2050_MARGIN.felt),
  );
}

function verdictBand(extra, proj, amen, place) {
  if (climateUnlivable(proj)) return "black";
  if (climateAlmost(proj) && !climateSideFails(proj) && !(critOn("fire") && extra?.feu)) {
    return "near";
  }
  if (climateCriterionFails(extra, proj)) return "red";
  if (localCriterionFails(extra, amen, place)) return "yellow";
  if (climateHasMargin(proj)) return "green";
  return "yellow";
}

function climateOk(proj) {
  if (!proj || !Number.isFinite(proj.tx30)) return false;
  return (
    climateHeatOk(proj) &&
    proj.ifm40 <= T2050.ifm40 &&
    proj.swi_dry <= T2050.swi
  );
}

function geoOk(extra) {
  if (!extra) return false;
  return (
    !extra.submersion &&
    !extra.erosion &&
    !extra.feu &&
    !extra.nucleaire &&
    extra.risk <= T2050.risk
  );
}

function allOk(extra, proj, amen) {
  return passesCriteria(extra, proj, amen);
}

function passesCriteria(extra, proj, amen, observedFavorable, place) {
  if (horizon === "2050") {
    if (critOn("heat") && !climateHeatOk(proj)) return false;
    if (critOn("fire") && Number.isFinite(proj?.ifm40) && proj.ifm40 > T2050.ifm40) {
      return false;
    }
    if (critOn("fire") && extra?.feu) return false;
    if (critOn("dry") && Number.isFinite(proj?.swi_dry) && proj.swi_dry > T2050.swi) {
      return false;
    }
  } else if (observedFavorable !== undefined) {
    if (critOn("heat") && extra && !observedFavorable) return false;
    if (critOn("fire") && extra?.feu) return false;
  }
  if (critOn("coast") && extra && (extra.submersion || extra.erosion)) return false;
  if (critOn("nuke") && extra?.nucleaire) return false;
  if (critOn("local") && extra && extra.risk > T2050.risk) return false;
  if (critOn("air") && airFails(place || proj)) return false;
  for (const key of AMENITY_KEYS) {
    if (critOn(key) && !amenityOk(amen, key)) return false;
  }
  return true;
}

function score2050(proj, extra) {
  if (!proj) return 999;
  const ifm = Number.isFinite(proj.ifm40) ? proj.ifm40 : 0;
  const swi = Number.isFinite(proj.swi_dry) ? proj.swi_dry : 80;
  const felt = feltHeat2050(proj);
  return (
    (proj.tx30 || 0) * 1.5 +
    (proj.tr || 0) * 1.8 +
    ifm * 3 +
    Math.max(0, swi - 80) * 0.06 +
    Math.max(0, (proj.tx_jja || 0) - 22) * 1.4 +
    (Number.isFinite(felt) ? Math.max(0, felt - 26) * 1.8 : 0) +
    (extra?.risk || 0) +
    (extra?.air_ok === false ? 8 : 0)
  );
}

function verdict(extra, proj, amen, place) {
  const heat =
    horizon === "2050" ? climateHeatOk(proj) : extra?.lot === "favorable";
  const fire =
    horizon === "2050"
      ? Number.isFinite(proj?.ifm40)
        ? proj.ifm40 <= T2050.ifm40 && !extra?.feu
        : extra ? !extra.feu : null
      : extra ? !extra.feu : null;
  const dry =
    horizon === "2050"
      ? Number.isFinite(proj?.swi_dry)
        ? proj.swi_dry <= T2050.swi
        : null
      : null;
  const coast = extra ? !extra.submersion && !extra.erosion : null;
  const nuke = extra ? !extra.nucleaire : null;
  const local = extra ? extra.risk <= T2050.risk : null;
  const air = airOf(place);
  const items = [
    { ok: heat, label: "Chaleur (dont ressentie)" },
    { ok: fire, label: "Feu" },
    { ok: dry, label: "Sols" },
    { ok: coast, label: extra ? "Hors littoral" : "Littoral (non croisé)" },
    { ok: nuke, label: extra ? "Hors nucléaire" : "Nucléaire (non croisé)" },
    { ok: local, label: extra ? "Risques locaux" : "Géorisques (non croisé)" },
    {
      ok: air ? air.ok : null,
      label: air ? (air.ok ? "Air respirable" : `Air · ${air.why}`) : "Air (non croisé)",
    },
  ];
  for (const key of AMENITY_KEYS) {
    const km = amen?.[`${key}_km`];
    const label = Number.isFinite(km)
      ? `${AMENITY_LABEL[key]} ${String(km).replace(".", ",")} km`
      : AMENITY_LABEL[key];
    items.push({ ok: amenityOk(amen, key), label });
  }
  return items;
}

function syncViewOptions() {
  const views = horizon === "2050" ? VIEWS_2050 : VIEWS_NOW;
  const current = els.view.value;
  els.view.replaceChildren(
    ...views.map((opt) => {
      const el = document.createElement("option");
      el.value = opt.value;
      el.textContent = opt.label;
      return el;
    }),
  );
  els.view.value = views.some((v) => v.value === current) ? current : views[0].value;
}

function setStatLabels(horizon2050) {
  if (horizon2050) {
    els.dtTx.textContent = "Max d’été";
    els.dtTn.textContent = "Max d’été 1976-2005";
    els.dtTxMax.textContent = "Jours risque feu";
    els.dtHot.textContent = "Jours ≥ 30 °C";
    els.dtTrop.textContent = "Nuits tropicales";
    els.dtAmp.textContent = "Jours sols secs";
  } else {
    els.dtTx.textContent = "Max du jour (moy.)";
    els.dtTn.textContent = "Min du jour (moy.)";
    els.dtTxMax.textContent = "Pic de chaleur";
    els.dtHot.textContent = "Jours ≥ 30 °C";
    els.dtTrop.textContent = "Nuits ≥ 20 °C";
    els.dtAmp.textContent = "Plus longue série ≥ 35 °C";
  }
}

function renderChecks(items) {
  if (!items) {
    els.checks.hidden = true;
    els.checks.replaceChildren();
    return;
  }
  els.checks.hidden = false;
  els.checks.replaceChildren(
    ...items.map((item) => {
      const li = document.createElement("li");
      li.className = item.ok === true ? "ok" : item.ok === false ? "ko" : "na";
      li.textContent = `${item.ok === true ? "OK" : item.ok === false ? "Non" : "—"} · ${item.label}`;
      return li;
    }),
  );
}

function currentMetric() {
  return els.driasMetric.value || "combined";
}

function currentNowMetric() {
  return els.nowMetric?.value || "comfort";
}

function observedValue(row, key = currentNowMetric()) {
  if (key === "days30") return Number.isFinite(row.days30) ? row.days30 : null;
  if (key === "nights20") return Number.isFinite(row.nights20) ? row.nights20 : null;
  if (key === "txMean") return Number.isFinite(row.txMean) ? row.txMean : null;
  if (key === "felt") return Number.isFinite(row.feltMean) ? row.feltMean : null;
  if (key === "streak35") return Number.isFinite(row.streak35) ? row.streak35 : null;
  return Number.isFinite(row.score) ? row.score : null;
}

function formatObserved(row, key = currentNowMetric()) {
  const v = observedValue(row, key);
  if (v == null) return "—";
  if (key === "txMean") return deg(v);
  if (key === "felt") return `ressenti ${v.toFixed(1).replace(".", ",")}`;
  if (key === "days30") return `${v} j ≥ 30`;
  if (key === "nights20") return `${v} nuits trop.`;
  if (key === "streak35") return `${v} j d’affilée ≥ 35`;
  return `confort ${v.toFixed(0)}`;
}

const JJA_END_YMD = 20260831;

function ymdToday() {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function nextYmd(n) {
  const { y, m, d } = ymd(n);
  const dt = new Date(y, m - 1, d + 1);
  return dt.getFullYear() * 10000 + (dt.getMonth() + 1) * 100 + dt.getDate();
}

function extendDaysToToday(payload) {
  const cap = Math.min(ymdToday(), JJA_END_YMD);
  const days = payload.days.slice();
  if (!days.length) return payload;
  let last = days[days.length - 1];
  const extra = [];
  while (last < cap) {
    last = nextYmd(last);
    extra.push(last);
  }
  if (!extra.length) return payload;
  payload.days = days.concat(extra);
  payload.end = payload.days[payload.days.length - 1];
  for (const station of payload.stations) {
    for (let i = 0; i < extra.length; i++) {
      station.tx.push(null);
      station.tn.push(null);
    }
  }
  return payload;
}

function lastObservedIndex(days) {
  const today = ymdToday();
  let last = 0;
  for (let i = 0; i < days.length; i++) {
    if (days[i] <= today) last = i;
  }
  return last;
}

function lastMeasuredIndex(payload) {
  const days = payload.days;
  for (let i = days.length - 1; i >= 0; i--) {
    for (const station of payload.stations) {
      if (station.tx[i] != null || station.tn[i] != null) return i;
    }
  }
  return days.length - 1;
}

function metricValue(row, key = currentMetric()) {
  if (key === "combined") {
    return Number.isFinite(row?.score2050) ? row.score2050 : null;
  }
  if (key === "felt") {
    const v = feltHeat2050(row.proj || row);
    return Number.isFinite(v) ? v : null;
  }
  const v = row?.proj?.[key] ?? row?.[key];
  return Number.isFinite(v) ? v : null;
}

function formatMetric(row, key = currentMetric()) {
  const v = metricValue(row, key);
  if (v == null) return "—";
  if (key === "combined") return `indice ${Math.round(v)}`;
  if (key === "tx_jja") {
    return `${v.toFixed(1).replace(".", ",")} °C`;
  }
  if (key === "felt") {
    return `ressenti ${v.toFixed(1).replace(".", ",")}`;
  }
  return `${Math.round(v)} j`;
}

function searchHits(rows, q) {
  const scored = [];
  const pool = horizon === "2050" ? rows.concat(massifRows()) : rows;
  for (const s of pool) {
    const n = placeName(s).toLowerCase();
    const raw = stationLabel(s).toLowerCase();
    const extra = [s.sector, s.kind === "massif" ? "altitude village massif" : ""]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!n.includes(q) && !raw.includes(q) && !extra.includes(q)) continue;
    let score = 12;
    if (n === q) score = 0;
    else if (n.startsWith(`${q} `) || n.startsWith(`${q}-`)) score = 1;
    else if (n.startsWith(q)) score = 2;
    else if (raw.startsWith(q)) score = 3;
    if (/radome|nivose|\bnivo\b/.test(raw)) score += 20;
    score += Math.min(n.length, 40) / 80;
    scored.push({ s, score });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.map((x) => x.s);
}

function findPlaceRow(name) {
  const want = name.toLowerCase();
  const massif = massifRows().find(
    (m) => m.name.toLowerCase() === want || (m.commune || "").toLowerCase() === want,
  );
  if (massif) return massif;
  const aire = aires.find(
    (a) => a.n.toLowerCase() === want || (a.pole || "").toLowerCase() === want,
  );
  if (aire) return aireRow2050(aire);
  const city = neighbors.find((c) => c.n.toLowerCase() === want);
  if (city) return neighborRow(city);
  return null;
}

function nearestProjAt(lat, lon) {
  const cells = drias?.cells;
  if (!cells?.length) return null;
  let best = null;
  let bestD = Infinity;
  const cos = Math.cos((lat * Math.PI) / 180);
  for (const c of cells) {
    const dlat = c.lat - lat;
    const dlon = (c.lon - lon) * cos;
    const d = dlat * dlat + dlon * dlon;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function packCellProj(cell) {
  if (!cell) return null;
  return {
    tx_jja: cell.tx_jja,
    tx30: cell.tx30,
    tr: cell.tr,
    ifm40: cell.ifm40,
    swi_dry: cell.swi_dry,
    tx_jja0: cell.tx_jja0,
    tx300: cell.tx300,
    tr0: cell.tr0,
    tx35: cell.tx35,
  };
}

function massifCell(m) {
  if (!drias?.cells?.length) return null;
  if (massifProjCache.has(m.id)) return massifProjCache.get(m.id);
  const cell = nearestProjAt(m.lat, m.lon);
  massifProjCache.set(m.id, cell);
  return cell;
}

function poleAire(name) {
  return aires.find((a) => a.n === name) || null;
}

function buildMassifRow(m) {
  const cell = massifCell(m);
  const gren = poleAire(m.pole);
  const kmPole = gren ? kmBetween(m, gren) : null;
  const amen = gren?.amen
    ? {
        hospital_km: Number(((kmPole || 0) + (gren.amen.hospital_km || 2)).toFixed(1)),
        university_km: Number(((kmPole || 0) + (gren.amen.university_km || 7)).toFixed(1)),
        culture_km: Number(((kmPole || 0) + (gren.amen.culture_km || 2)).toFixed(1)),
        infra_km: Number(((kmPole || 0) + (gren.amen.infra_km || 3)).toFixed(1)),
        ok: true,
      }
    : null;
  const proj = packCellProj(cell);
  const row = {
    id: m.id,
    kind: "massif",
    name: m.n,
    commune: m.n,
    sector: m.sector,
    ring: m.ring,
    driveMin: m.drive,
    pole: m.pole,
    also: m.also || [],
    lat: m.lat,
    lon: m.lon,
    alt: m.alt,
    dep: m.dep || "38",
    region: m.reg || "Auvergne-Rhône-Alpes",
    extra: null,
    proj,
    amen,
    pop: null,
    cc: "FR",
    n: 0,
    kmPole,
  };
  row.band = verdictBand(null, proj, amen, row);
  row.score2050 = score2050(proj, null);
  return row;
}

function massifRows() {
  if (!drias?.cells?.length) return [];
  return MASSIF_SECTORS.map(buildMassifRow);
}

function massifsForPole(name) {
  if (!name) return [];
  return massifRows().filter(
    (m) => m.pole === name || (m.also || []).includes(name),
  );
}

function isMassifCandidate(m) {
  if (!m || m.ring === "piedmont") return false;
  if ((m.alt || 0) < MASSIF_MAP_ALT) return false;
  if ((m.driveMin || 99) > 55) return false;
  return m.band === "green" || m.band === "yellow" || m.band === "near";
}

function massifsOnMap() {
  if (horizon !== "2050" || !drias?.cells?.length) return [];
  if (map.getZoom() < MASSIF_MIN_ZOOM) return [];
  return massifRows().filter(
    (s) => (s.alt || 0) >= MASSIF_MAP_ALT && bandOn(s.band),
  );
}

function homeRow() {
  const cell = nearestProjAt(HOME.lat, HOME.lon);
  let amen = null;
  let extra = null;
  let alt = HOME.alt;
  let obs = null;
  let stationLabel = null;
  if (stationById.size) {
    let best = null;
    let bestD = Infinity;
    const cos = Math.cos((HOME.lat * Math.PI) / 180);
    for (const st of stationById.values()) {
      const dlat = st.lat - HOME.lat;
      const dlon = (st.lon - HOME.lon) * cos;
      const d = dlat * dlat + dlon * dlon;
      if (d < bestD) {
        bestD = d;
        best = st;
      }
    }
    if (best) {
      amen = amenityOf(best.id);
      extra = byStation.get(best.n) || null;
      stationLabel = titleCase(best.n);
      if (data) {
        const [i0, i1] = currentRange();
        obs = stationStats(best, i0, i1);
      }
    }
  }
  const air = airOf({ id: HOME.id, lat: HOME.lat, lon: HOME.lon });
  if (air) extra = { ...(extra || {}), air_ok: air.ok };
  const proj = cell
    ? {
        tx_jja: cell.tx_jja,
        tx30: cell.tx30,
        tr: cell.tr,
        ifm40: cell.ifm40,
        swi_dry: cell.swi_dry,
        tx_jja0: cell.tx_jja0,
        tx300: cell.tx300,
        tr0: cell.tr0,
        tx35: cell.tx35,
      }
    : null;
  return {
    id: HOME.id,
    kind: "home",
    name: HOME.name,
    lat: HOME.lat,
    lon: HOME.lon,
    alt,
    dep: HOME.dep,
    region: HOME.region,
    extra,
    proj,
    amen,
    air,
    commune: HOME.name,
    pop: 4000,
    popPole: 4000,
    cc: "FR",
    stationLabel,
    n: obs?.n || 0,
    txMean: obs?.txMean,
    tnMean: obs?.tnMean,
    txMax: obs?.txMax,
    ampli: obs?.ampli,
    days30: obs?.days30,
    days35: obs?.days35,
    days40: obs?.days40,
    nights20: obs?.nights20,
    streak30: obs?.streak30,
    streak35: obs?.streak35,
    streak40: obs?.streak40,
    streakNight: obs?.streakNight,
    streakHotNight: obs?.streakHotNight,
    feltMean: obs?.feltMean,
    daysFelt40: obs?.daysFelt40,
    score2050: score2050(proj, extra),
    band: verdictBand(extra, proj, amen, HOME),
  };
}

function heatwavePeak2050(s) {
  const txx = s?.txMax;
  const dMean = (s?.proj?.tx_jja ?? NaN) - (s?.proj?.tx_jja0 ?? NaN);
  if (!Number.isFinite(txx) || !Number.isFinite(dMean) || dMean <= 0) return null;
  return {
    lo: txx + dMean,
    hi: txx + dMean * 1.7,
    dMean,
  };
}

function fmtPeakRange(pk) {
  if (!pk) return "—";
  const lo = Math.round(pk.lo);
  const hi = Math.max(lo + 1, Math.round(pk.hi));
  return `~${lo}–${hi}`;
}

function streak2050(n) {
  if (!Number.isFinite(n) || n <= 0) return "—";
  const hi = Math.max(n + 1, Math.round(n * 1.25));
  return `≥ ${n}–${hi} j`;
}

function fillHomeCompare(s) {
  const box = els.dVs;
  if (!box) return;
  const proj = s?.proj;
  const show =
    s?.kind === "home" &&
    horizon === "2050" &&
    proj &&
    Number.isFinite(s.txMean);
  box.hidden = !show;
  if (!show) {
    box.replaceChildren();
    return;
  }
  const pk = heatwavePeak2050(s);
  const peakLabel = pk ? `${fmtPeakRange(pk)} °C` : "—";
  const lead = document.createElement("p");
  lead.className = "detail-vs-lead";
  lead.textContent = `Le confort, ce n’est pas la moyenne. Deux étés à ${fmtFr(s.txMean)} °C de max moyen peuvent n’avoir rien à voir : 20 jours d’extrêmes jour et nuit d’affilée, ou des journées plus chaudes mais sans bloc. 2026 à ${s.stationLabel || "Moules"} : pic ${fmtFr(s.txMax)} °C, ${s.streak35 ?? "—"} j d’affilée ≥ 35 °C, ${s.streak30 ?? "—"} j d’affilée ≥ 30 °C. Une canicule 2050 serait plus dure (${peakLabel}), pas plus douce.`;
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["", "1976-2005", "Été 2026", "2050"]) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.append(th);
  }
  thead.append(headRow);
  const body = document.createElement("tbody");
  const rows = [
    {
      label: "Pic (jour le plus chaud)",
      a: "—",
      b: deg(s.txMax),
      c: peakLabel,
      peak: true,
    },
    {
      label: "Plus longue série ≥ 35 °C",
      a: "—",
      b: Number.isFinite(s.streak35) ? `${s.streak35} j` : "—",
      c: streak2050(s.streak35),
      peak: true,
    },
    {
      label: "Plus longue série ≥ 30 °C",
      a: "—",
      b: Number.isFinite(s.streak30) ? `${s.streak30} j` : "—",
      c: streak2050(s.streak30),
    },
    {
      label: "Série nuits trop. (≥ 20 °C)",
      a: "—",
      b: Number.isFinite(s.streakNight) ? `${s.streakNight} j` : "—",
      c: streak2050(s.streakNight),
    },
    {
      label: "Jours ≥ 35 °C (cumul)",
      a: "—",
      b: String(s.days35 ?? "—"),
      c: Number.isFinite(proj.tx35) ? String(Math.round(proj.tx35)) : "—",
    },
    {
      label: "Jours ≥ 30 °C (cumul)",
      a: String(Math.round(proj.tx300)),
      b: String(s.days30 ?? "—"),
      c: String(Math.round(proj.tx30)),
    },
    {
      label: "Nuits tropicales (cumul)",
      a: String(Math.round(proj.tr0)),
      b: String(s.nights20 ?? "—"),
      c: String(Math.round(proj.tr)),
    },
    {
      label: "Moyenne des max du jour",
      a: deg(proj.tx_jja0),
      b: deg(s.txMean),
      c: deg(proj.tx_jja),
    },
  ];
  for (const row of rows) {
    const tr = document.createElement("tr");
    if (row.peak) tr.className = "is-peak";
    const th = document.createElement("th");
    th.textContent = row.label;
    const tds = [row.a, row.b, row.c].map((val, i) => {
      const td = document.createElement("td");
      td.textContent = val;
      if (i === 1) td.className = "is-now";
      if (i === 2) td.className = "is-proj";
      return td;
    });
    tr.append(th, ...tds);
    body.append(tr);
  }
  table.append(thead, body);
  const note = document.createElement("p");
  note.className = "detail-vs-note";
  const d40 = Number.isFinite(s.days40) ? `, ${s.days40} j ≥ 40 °C` : "";
  const d35proj = Number.isFinite(proj.tx35) ? Math.round(proj.tx35) : null;
  note.textContent = `2026 : poste ${s.stationLabel || "le plus proche"} — ${s.days35 ?? "—"} j ≥ 35 °C${d40}, dont ${s.streak35 ?? "—"} d’affilée (≥ 35 °C) et ${s.streak30 ?? "—"} d’affilée (≥ 30 °C)${Number.isFinite(s.streakHotNight) ? `, ${s.streakHotNight} j jour ≥ 35 °C et nuit tropicale` : ""}. DRIAS ne calcule ni le pic ni les séries : ${peakLabel} = le 43 °C plus le +${fmtFr(pk?.dMean)} °C local ; les séries 2050 = au moins aussi longues que 2026, plus chaudes.${d35proj != null ? ` Les ${d35proj} j ≥ 35 °C en climat 2050, c’est un cumul moyen sur la maille, pas un bloc caniculaire.` : ""} Les nuits climatiques 2050 (${Math.round(proj.tr)}) dépassent déjà 2026 (${s.nights20}).`;
  box.replaceChildren(lead, table, note);
}

function fillMassifTable(s) {
  const box = els.dVs;
  if (!box) return;
  const poleName = s.kind === "massif" ? s.pole : s.pole || s.name;
  const rows = massifsForPole(poleName);
  const show = horizon === "2050" && rows.length > 0;
  box.hidden = !show;
  if (!show) {
    box.replaceChildren();
    return;
  }
  const pole = poleAire(poleName);
  const poleProj = s.kind === "massif" ? pole?.proj : s.proj || pole?.proj;
  const candidates = rows
    .filter(isMassifCandidate)
    .sort((a, b) => a.driveMin - b.driveMin || b.alt - a.alt);
  const lead = document.createElement("p");
  lead.className = "detail-vs-lead";
  lead.textContent =
    s.kind === "massif"
      ? `${s.name} (${s.alt} m, ${s.sector}) : pôle ${s.pole} à ~${s.driveMin} min. Ce n’est pas ${s.pole}-centre.`
      : poleName === "Alès"
        ? "Alès-centre est invivable, comme Ganges. Autour de Lasalle et au-dessus de La Grand-Combe, il n’y a pas de village habité à 800–1 500 m à 20–40 min : les Cévennes logent dans les vallées."
        : candidates.length
          ? `${poleName}-centre : on n’évalue pas la ville. ${candidates.length} village${candidates.length > 1 ? "s" : ""} à 800–1 500 m, 20–40 min du pôle — clique une ligne.`
          : `${poleName}-centre : on n’évalue pas la ville. Pas de village habité à 800–1 500 m à 20–40 min qui tienne l’été.`;
  const parts = [lead];
  if (s.kind !== "massif" && poleProj) {
    const pLine = document.createElement("p");
    pLine.className = "detail-vs-pole";
    pLine.textContent = `Pôle : ${bandFrShort(verdictBand(null, poleProj, null))} · ${Math.round(poleProj.tx30)} j ≥ 30 °C · max ${fmtFr(poleProj.tx_jja)} °C`;
    parts.push(pLine);
  }
  if (candidates.length) {
    const kicker = document.createElement("p");
    kicker.className = "detail-vs-kicker";
    kicker.textContent = "Villages candidats";
    parts.push(kicker);
    const table = document.createElement("table");
    table.className = "massif-cands";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const label of ["Village", "m", "min", "2050", "j≥30"]) {
      const th = document.createElement("th");
      th.textContent = label;
      headRow.append(th);
    }
    thead.append(headRow);
    const body = document.createElement("tbody");
    for (const m of candidates) {
      const tr = document.createElement("tr");
      tr.className = m.id === s.id ? "is-peak is-pick" : "is-pick";
      const p = m.proj || {};
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "massif-pick";
      btn.textContent = m.name;
      btn.title = `Ouvrir ${m.name}`;
      const th = document.createElement("th");
      th.append(btn);
      tr.append(th);
      const cells = [
        `${m.alt}`,
        `~${m.driveMin}`,
        bandFrShort(m.band),
        Number.isFinite(p.tx30) ? String(Math.round(p.tx30)) : "—",
      ];
      for (const [i, text] of cells.entries()) {
        const td = document.createElement("td");
        td.textContent = text;
        if (i === 2) {
          td.className =
            m.band === "green" || m.band === "yellow" ? "is-proj" : "is-now";
        }
        tr.append(td);
      }
      const open = () => {
        showDetail(m);
        flyToPlace(m.lat, m.lon, PLACE_ZOOM);
      };
      tr.addEventListener("click", open);
      body.append(tr);
    }
    table.append(thead, body);
    parts.push(table);
  }
  const note = document.createElement("p");
  note.className = "detail-vs-note";
  const extra =
    poleName === "Grenoble"
      ? " Autrans / Villard dépassent souvent 20 min. Le Trièves n’est pas un cadeau : Mens et Monestier restent chauds en fond de vallée."
      : poleName === "Besançon"
        ? " Ornans, c’est la Loue (piémont). Le plateau (Avoudrey, Flangebouche, Levier) est à 700–800 m. Levier est aussi dans l’orbite de Pontarlier ; le CHU, c’est Besançon."
        : poleName === "Belfort" || poleName === "Montbéliard"
          ? " Giromagny, c’est le piémont (~470 m). Les villages à 800 m sont le plateau de Maîche, 35–50 min du CH Belfort-Montbéliard — pas le Ballon d’Alsace."
          : poleName === "Alès"
            ? " Concoules (640 m) est le plus haut bourg à 40 min, encore sous 800 m. Pont-de-Montvert / L’Espérou : 800 m+ mais plus d’une heure, isolés l’hiver."
            : "";
  note.textContent = candidates.length
    ? `Clique un village pour le voir sur la carte (losange, zoom ≥ 9). Temps de trajet : ordre de grandeur. Maille DRIAS 8 km.${extra}`
    : `Pas de losange ici : aucun ne coche le cahier des charges. Maille DRIAS 8 km.${extra}`;
  parts.push(note);
  box.replaceChildren(...parts);
}

function fillDetailVs(s) {
  const box = els.dVs;
  if (!box) return;
  if (s?.kind === "home") {
    fillHomeCompare(s);
    return;
  }
  if (horizon === "2050" && (s?.kind === "massif" || massifsForPole(s?.pole || s?.name).length)) {
    fillMassifTable(s);
    return;
  }
  box.hidden = true;
  box.replaceChildren();
}

function refreshOpenDetail() {
  if (els.detail.hidden || !selectedId) return;
  if (selectedId === HOME.id) {
    showDetail(homeRow());
    return;
  }
  const massif = massifRows().find((r) => r.id === selectedId);
  if (massif) {
    showDetail(massif);
    return;
  }
  const row = lastPainted.find((p) => p.s.id === selectedId)?.s;
  if (row) showDetail(row);
}

function inCompare(id) {
  return compareRows.some((r) => r.id === id);
}

function toggleCompare(row, forceAdd = false) {
  if (!row?.id) return;
  const i = compareRows.findIndex((r) => r.id === row.id);
  if (i >= 0) {
    if (forceAdd) return;
    compareRows.splice(i, 1);
  } else {
    if (compareRows.length >= COMPARE_MAX) compareRows.shift();
    compareRows.push(row);
    compareOpen = true;
  }
  renderCompare();
  restyleMarkers();
}

function seedCompareDefaults() {
  if (compareSeeded || compareRows.length) return;
  compareSeeded = true;
  const home = homeRow();
  if (home) compareRows.push(home);
  for (const name of COMPARE_SEED) {
    const row = findPlaceRow(name);
    if (row && !compareRows.some((r) => r.id === row.id)) compareRows.push(row);
  }
}

function setCompareOpen(on) {
  const want = Boolean(on) && horizon === "2050";
  if (want) seedCompareDefaults();
  compareOpen = want;
  renderCompare();
  restyleMarkers();
}

function syncCompareToggle() {
  if (!els.compareToggle) return;
  const on = horizon === "2050";
  els.compareToggle.hidden = !on;
  const n = compareRows.length;
  els.compareToggle.textContent = n ? `Comparer (${n})` : "Comparer";
  els.compareToggle.classList.toggle("is-on", compareOpen && on);
}

function kmLabel(km) {
  return Number.isFinite(km) ? `${String(km).replace(".", ",")} km` : "—";
}

function renderCompare() {
  const box = els.compare;
  const table = els.compareTable;
  if (!box || !table) return;
  syncCompareToggle();
  const show = horizon === "2050" && compareOpen;
  box.hidden = !show;
  if (!show) {
    table.replaceChildren();
    return;
  }
  if (els.compareHint) {
    els.compareHint.textContent = compareRows.length
      ? "Jusqu’à 4 villes. + dans la liste, ou « Ajouter » dans la fiche. Clique un nom pour y aller."
      : "Aucune ville pour l’instant. + dans la liste, ou « Ajouter » dans la fiche.";
  }
  if (!compareRows.length) {
    table.replaceChildren();
    return;
  }
  const rows = [
    ["Ville", (s) => placeName(s)],
    ["Pays", (s) => (s.kind === "home" ? "Chez moi · FR" : COUNTRY_LABEL[s.cc || "FR"] || "FR")],
    ["Altitude", (s) => `${s.alt} m`],
    ["Pôle / hab.", (s) => (s.popPole || s.pop ? formatPop(s.popPole || s.pop) : "—")],
    ["Verdict 2050", (s) => bandFr(verdictBand(s.extra, s.proj, s.amen, s))],
    ["Max d’été", (s) => (Number.isFinite(s.proj?.tx_jja) ? deg(s.proj.tx_jja) : "—")],
    ["Jours ≥ 30 °C", (s) => (Number.isFinite(s.proj?.tx30) ? String(Math.round(s.proj.tx30)) : "—")],
    ["Nuits trop.", (s) => (Number.isFinite(s.proj?.tr) ? String(Math.round(s.proj.tr)) : "—")],
    [
      "Chaleur ressentie",
      (s) => {
        const h = feltHeat2050(s.proj);
        return Number.isFinite(h) ? fmtFr(h, 1) : "—";
      },
    ],
    ["IFM élevé", (s) => (Number.isFinite(s.proj?.ifm40) ? String(Math.round(s.proj.ifm40)) : "—")],
    [
      "Air",
      (s) => {
        const a = airOf(s);
        return a ? (a.ok ? "OK" : a.why) : "—";
      },
    ],
    ["Hôpital", (s) => kmLabel(s.amen?.hospital_km)],
    ["Campus", (s) => kmLabel(s.amen?.university_km)],
    ["Gare", (s) => kmLabel(s.amen?.infra_km)],
    ["Source", (s) => (s.cc && s.cc !== "FR" ? "CMIP6" : s.kind === "home" ? "DRIAS (Ganges)" : "DRIAS")],
  ];
  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  hr.append(document.createElement("th"));
  for (const s of compareRows) {
    const th = document.createElement("th");
    const wrap = document.createElement("div");
    wrap.className = "compare-head";
    const title = document.createElement("button");
    title.type = "button";
    title.className = "compare-name";
    title.textContent = placeName(s);
    title.addEventListener("click", () => {
      showDetail(s);
      flyToRow(s);
    });
    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "compare-remove";
    rm.setAttribute("aria-label", `Retirer ${placeName(s)}`);
    rm.textContent = "×";
    rm.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleCompare(s);
    });
    wrap.append(title, rm);
    th.append(wrap);
    hr.append(th);
  }
  thead.append(hr);
  const tbody = document.createElement("tbody");
  for (const [label, fn] of rows) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = label;
    tr.append(th);
    for (const s of compareRows) {
      const td = document.createElement("td");
      td.textContent = fn(s);
      tr.append(td);
    }
    tbody.append(tr);
  }
  table.replaceChildren(thead, tbody);
  if (els.compareAdd && selectedId) {
    els.compareAdd.textContent = inCompare(selectedId) ? "Retirer du comparateur" : "Ajouter au comparateur";
  }
}

function sortListed(rows) {
  const mode = els.citySort?.value || "score";
  const copy = rows.slice();
  if (mode === "alpha") {
    copy.sort((a, b) => placeName(a).localeCompare(placeName(b), "fr"));
  } else if (mode === "dist") {
    copy.sort((a, b) => kmBetween(a, HOME) - kmBetween(b, HOME));
  }
  return copy;
}

function bandBarPct(band) {
  return { green: 92, yellow: 68, near: 42, orange: 55, red: 18, black: 6 }[band] || 50;
}

function fillCityList(rows) {
  listedRows = rows;
  if (!rows.length) {
    els.cityList.hidden = true;
    els.cityListItems.replaceChildren();
    return;
  }
  els.cityList.hidden = false;
  const q = (els.citySearch?.value || "").trim().toLowerCase();
  const filtered = sortListed(q ? searchHits(rows, q) : rows);
  els.cityListTitle.textContent = q
    ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`
    : `${rows.length} aire${rows.length > 1 ? "s" : ""}`;
  const key = currentMetric();
  const fills = currentFills();
  els.cityListItems.replaceChildren(
    ...filtered.slice(0, q ? 80 : 120).map((s) => {
      const li = document.createElement("li");
      li.dataset.id = s.id;
      if (s.id === selectedId) li.classList.add("is-selected");
      const name = document.createElement("span");
      name.textContent = placeName(s);
      const metric = document.createElement("span");
      metric.className = "city-metric";
      const value =
        horizon === "2050" ? formatMetric(s, key) : formatObserved(s);
      const place =
        s.cc && s.cc !== "FR"
          ? COUNTRY_LABEL[s.cc] || s.cc
          : (s.region || "").split("-")[0];
      metric.textContent = `${place} · ${value}`;
      li.append(name, metric);
      if (horizon === "2050") {
        const add = document.createElement("button");
        add.type = "button";
        add.className = "compare-add";
        add.title = inCompare(s.id)
          ? "Retirer de la comparaison"
          : "Ajouter à la comparaison";
        add.setAttribute("aria-label", add.title);
        add.textContent = inCompare(s.id) ? "✓" : "+";
        add.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleCompare(s);
          add.textContent = inCompare(s.id) ? "✓" : "+";
          add.title = inCompare(s.id)
            ? "Retirer de la comparaison"
            : "Ajouter à la comparaison";
        });
        li.append(add);
      }
      const bar = document.createElement("span");
      bar.className = "city-bar";
      const fill = document.createElement("i");
      fill.style.width = `${bandBarPct(s.band)}%`;
      fill.style.background = fills[s.band] || "var(--muted)";
      bar.append(fill);
      li.append(bar);
      li.addEventListener("click", () => {
        showDetail(s);
        flyToRow(s);
      });
      return li;
    }),
  );
}

function stationsWanted() {
  return Boolean(els.showStations?.checked);
}

function homeStarIcon(selected) {
  return L.divIcon({
    className: "home-star-wrap",
    html: `<span class="home-star${selected ? " is-selected" : ""}">
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path fill="#e8c96a" stroke="#0a0908" stroke-width="1.55" stroke-linejoin="round"
            d="M12 2.3 14.7 9l7.2.6-5.5 4.6 1.7 7L12 17.3 5.9 21.2l1.7-7L2.1 9.6 9.3 9z"/>
        </svg>
      </span><span class="home-star-name">Ganges</span>`,
    iconSize: [92, 32],
    iconAnchor: [13, 16],
  });
}

function ensureHomeMarker() {
  const selected = selectedId === HOME.id;
  const icon = homeStarIcon(selected);
  if (!homeMarker) {
    homeMarker = L.marker([HOME.lat, HOME.lon], {
      icon,
      pane: "dots",
      keyboard: false,
      zIndexOffset: 1400,
      riseOnHover: true,
      title: "Ganges · chez moi",
    }).addTo(map);
    homeMarker.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      lastStationClick = Date.now();
      showDetail(homeRow());
      if (map.getZoom() < PLACE_ZOOM - 1) flyToPlace(HOME.lat, HOME.lon);
    });
  } else {
    homeMarker.setIcon(icon);
  }
}

function pinIcon(s, t) {
  const kept = s.id === selectedId || inCompare(s.id);
  const fill = currentFills()[s.band] || lerpColor(t);
  const ring = kept ? "#e8c96a" : "#0a0908";
  const massif = s.kind === "massif";
  const dead = s.band === "black";
  const size = massif ? (kept ? 12 : 10) : kept ? 16 : 13;
  return L.divIcon({
    className: massif ? "city-pin-wrap massif-pin-wrap" : "city-pin-wrap",
    html: `<span class="city-pin${massif ? " is-massif" : ""}${dead ? " is-dead" : ""}${kept ? " is-kept" : ""}" style="width:${size}px;height:${size}px;background:${fill};border-color:${ring}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function upsertStationMarker(s, t) {
  if (s.id === HOME.id) return;
  const icon = pinIcon(s, t);
  let marker = markers.get(s.id);
  if (marker && typeof marker.setIcon !== "function") {
    if (layer.hasLayer(marker)) layer.removeLayer(marker);
    markers.delete(s.id);
    marker = null;
  }
  if (!marker) {
    marker = L.marker([s.lat, s.lon], {
      icon,
      pane: "dots",
      keyboard: false,
      riseOnHover: true,
    }).addTo(layer);
    markers.set(s.id, marker);
  } else {
    marker.setIcon(icon);
    marker.setLatLng([s.lat, s.lon]);
    if (!layer.hasLayer(marker)) marker.addTo(layer);
  }
  marker._ifcRow = s;
  marker._ifcT = t;
  bindCityTooltip(marker, s, false);
  marker.off("click");
  marker.on("click", () => {
    lastStationClick = Date.now();
    showDetail(s);
  });
}

function syncStationMarkers(painted) {
  const seen = new Set();
  for (const { s, t } of painted) {
    seen.add(s.id);
    upsertStationMarker(s, t);
    if (s.id === selectedId) showDetail(s);
  }
  for (const [id, marker] of markers) {
    if (!seen.has(id) && layer.hasLayer(marker)) layer.removeLayer(marker);
  }
  updateCityLabels();
}

function syncMassifMarkers() {
  const wanted = massifsOnMap();
  const seen = new Set(wanted.map((s) => s.id));
  if (els.legendMassif) {
    els.legendMassif.hidden = wanted.length === 0;
  }
  if (!wanted.length) {
    for (const marker of massifMarkers.values()) {
      if (layer.hasLayer(marker)) layer.removeLayer(marker);
    }
    return;
  }
  for (const s of wanted) {
    const icon = pinIcon(s, 0.35);
    let marker = massifMarkers.get(s.id);
    if (!marker) {
      marker = L.marker([s.lat, s.lon], {
        icon,
        pane: "dots",
        keyboard: false,
        riseOnHover: true,
        zIndexOffset: 200,
      }).addTo(layer);
      massifMarkers.set(s.id, marker);
      marker.on("click", () => {
        lastStationClick = Date.now();
        const id = marker._ifcRow?.id;
        const row = massifRows().find((r) => r.id === id) || marker._ifcRow;
        showDetail(row);
      });
    } else {
      marker.setIcon(icon);
      marker.setLatLng([s.lat, s.lon]);
      if (!layer.hasLayer(marker)) marker.addTo(layer);
    }
    marker._ifcRow = s;
    marker._ifcT = 0.35;
    bindCityTooltip(marker, s, false);
  }
  for (const [id, marker] of massifMarkers) {
    if (!seen.has(id) && layer.hasLayer(marker)) layer.removeLayer(marker);
  }
}

function restyleMarkers() {
  for (const marker of [...markers.values(), ...massifMarkers.values()]) {
    const s = marker._ifcRow;
    if (!s || !layer.hasLayer(marker) || typeof marker.setIcon !== "function") continue;
    marker.setIcon(pinIcon(s, marker._ifcT ?? 0.5));
  }
  ensureHomeMarker();
}

function bindCityTooltip(marker, s, permanent) {
  marker.unbindTooltip();
  marker.bindTooltip(placeName(s), {
    permanent,
    direction: permanent ? "right" : "top",
    offset: permanent ? [10, 0] : [0, -10],
    className: "city-label",
    opacity: 1,
  });
}

function updateCityLabels() {
  const z = map.getZoom();
  const bounds = z >= 8 ? map.getBounds().pad(0.02) : null;
  for (const marker of [...markers.values(), ...massifMarkers.values()]) {
    const s = marker._ifcRow;
    if (!s || !layer.hasLayer(marker)) continue;
    const minZ = s.kind === "aire" ? 8 : s.kind === "massif" ? MASSIF_MIN_ZOOM : 10;
    const showName = Boolean(bounds && z >= minZ && bounds.contains(marker.getLatLng()));
    const tip = marker.getTooltip();
    if (tip && tip.options.permanent === showName) continue;
    bindCityTooltip(marker, s, showName);
  }
}

function formatPop(n) {
  if (!Number.isFinite(n)) return "";
  return `${Math.round(n).toLocaleString("fr-FR")} hab.`;
}

function crownNote(s) {
  if (s.kind !== "aire" || !s.crown) return "";
  const poleBand = verdictBand(null, s.proj, null);
  const coolBand = verdictBand(null, s.crownCool || s.crown, null);
  const crownBand = verdictBand(null, s.crown, null);
  const poleTx = s.proj?.tx_jja;
  const coolTx = (s.crownCool || s.crown)?.tx_jja;
  const contrast =
    poleBand === "red" && (coolBand === "green" || coolBand === "yellow");
  const bits = [
    `Climat du pôle (${s.pole || placeName(s)}) : ${bandFr(poleBand)}`,
    `couronne : ${bandFr(crownBand)}`,
  ];
  if (s.crownCool && Number.isFinite(poleTx) && Number.isFinite(coolTx)) {
    bits.push(
      `relief de la couronne : ${bandFr(coolBand)} (max d’été ${fmtFr(coolTx)} °C vs ${fmtFr(poleTx)} °C au pôle)`,
    );
  }
  if (contrast) {
    bits.push(
      "Le pôle (cuvette) est trop dur ; les massifs restent plus frais. On n’évalue pas la ville : on cherche une maison à 800–1 500 m, à 20–30 min d’un vrai pôle de services — pas un chalet isolé",
    );
  }
  return ` ${bits.join(" · ")}.`;
}

function airNote(s) {
  const air = airOf(s);
  if (!air) return "";
  const bits = [air.why];
  if (Number.isFinite(air.pm25_djf)) {
    bits.push(`PM2,5 hiver ${fmtFr(air.pm25_djf)} µg/m³`);
  }
  if (Number.isFinite(air.no2_djf)) {
    bits.push(`NO2 hiver ${fmtFr(air.no2_djf)}`);
  }
  if (air.o3_days120 != null) {
    bits.push(`${air.o3_days120} j d’ozone ≥ 120 µg/m³ cet été`);
  }
  return `Air (CAMS ~11 km, 2025–2026) : ${bits.join(" · ")}. L’ozone empirera avec les étés 2050.`;
}

function showDetail(s) {
  selectedId = s.id;
  restyleMarkers();
  els.detail.hidden = false;
  fillDetailVs(s);
  syncSelChip(placeName(s));
  syncListSelection();
  if (els.compareAdd) {
    els.compareAdd.hidden = horizon !== "2050";
    els.compareAdd.textContent = inCompare(s.id)
      ? "Retirer du comparateur"
      : "Ajouter au comparateur";
  }
  const extra = s.extra || byStation.get(s.name);
  const proj = s.proj || driasById.get(s.id);
  const isAire = s.kind === "aire";
  const isHome = s.kind === "home";
  const isMassif = s.kind === "massif";
  els.dRegion.textContent = isHome
    ? "Chez moi"
    : isMassif
      ? `Massif · ${s.sector} · pôle ${s.pole}`
      : isAire
        ? `Aire d’attraction · pôle ${s.pole || placeName(s)}`
        : extra?.commune || s.region;
  els.dName.textContent = isHome || isAire || isMassif
    ? placeName(s)
    : extra
      ? extra.commune
      : titleCase(s.name);
  const future = horizon === "2050";
  setStatLabels(future && proj);
  if (future && proj) {
    const source =
      s.cc && s.cc !== "FR"
        ? "CMIP6 Open-Meteo 2046–2050"
        : isHome
          ? "DRIAS +2,7 °C à Ganges"
          : isMassif
          ? `DRIAS +2,7 °C à ${s.alt} m`
          : isAire
          ? "DRIAS +2,7 °C au pôle"
          : "DRIAS +2,7 °C";
    const popBit = isAire && s.pop ? ` · ${formatPop(s.pop)}` : "";
    const comBit = isAire && s.nCom ? ` · ${s.nCom} communes` : "";
    els.dMeta.textContent = isHome
      ? `Ganges · 34190 · ${s.alt} m · pic 2026 ${fmtFr(s.txMax)} °C · canicule 2050 ${fmtPeakRange(heatwavePeak2050(s))} °C`
      : isMassif
      ? `${s.sector} · ${s.alt} m · ~${s.driveMin} min de ${s.pole}${Number.isFinite(s.kmPole) ? ` (${fmtFr(s.kmPole, 0)} km)` : ""} · maille 8 km, pas le pôle`
      : isAire
      ? `${placeName(s)} · pôle ${s.pole || placeName(s)} · ${s.alt} m${popBit}${comBit} · ${source}`
      : extra
        ? `${COUNTRY_LABEL[s.cc || "FR"] || ""} · ${extra.commune} · ${s.alt} m · ${source}`
        : `${s.dep} · ${s.alt} m · ${source}`;
    els.dTx.textContent = deg(proj.tx_jja);
    els.dTn.textContent = Number.isFinite(proj.tx_jja0) ? deg(proj.tx_jja0) : "—";
    if (isHome) {
      els.dtTx.textContent = "Moy. des max";
      els.dtTn.textContent = "Moy. 1976-2005";
      els.dtTxMax.textContent = "Pic canicule";
      els.dTxMax.textContent = `${fmtPeakRange(heatwavePeak2050(s))} °C`;
      els.dtAmp.textContent = "Série ≥ 35 °C";
      els.dAmp.textContent = Number.isFinite(s.streak35)
        ? `${s.streak35} j · ${streak2050(s.streak35)}`
        : "—";
    } else {
      els.dTxMax.textContent = Number.isFinite(proj.ifm40)
        ? String(Math.round(proj.ifm40))
        : "—";
      els.dAmp.textContent = Number.isFinite(proj.swi_dry)
        ? String(Math.round(proj.swi_dry))
        : "—";
    }
    els.dHot.textContent = String(Math.round(proj.tx30));
    els.dTrop.textContent = String(Math.round(proj.tr));
    const amen = s.amen || amenityOf(s.id);
    renderChecks(verdict(extra, proj, amen, s));
    els.dFuture.hidden = false;
    const ok = passesCriteria(extra, proj, amen, extra?.lot === "favorable", s);
    const bandWhy =
      {
        green:
          "Été encore confortable : au plus 14 jours ≥ 30 °C, 8 nuits tropicales, max d’été 24 °C, chaleur ressentie 29. Les autres critères cochés passent aussi.",
        yellow:
          "Été encore tenable, plus tout à fait confortable : jusqu’à 22 jours ≥ 30 °C, 15 nuits tropicales, max d’été 26 °C, chaleur ressentie 34. Même vert fade si un autre critère ville manque (hôpital, littoral…) : l’été tient, pas forcément le reste.",
        near:
          "Presque : l’été dépasse les seuils de peu (jusqu’à 4 jours ≥ 30 °C, 4 nuits ou 1 °C de trop). Ce n’est pas le Midi mort, ce n’est plus « tenable » au sens strict.",
        red: "Été trop dur : plus de 22 jours ≥ 30 °C, ou plus de 15 nuits tropicales, ou max d’été au-dessus de 26 °C — sans atteindre l’invivable. Grenoble-centre est là : trop dur, pas Ganges.",
        black:
          "Invivable : au moins 40 jours ≥ 30 °C, ou 28 nuits tropicales, ou 29 °C de max d’été. C’est Ganges, Béziers, Nîmes, Avignon, tout le pourtour méditerranéen — pas Grenoble.",
      }[s.band] || "";
    const felt = feltHeat2050(proj);
    const feltNote = Number.isFinite(felt)
      ? ` Chaleur ressentie ${felt.toFixed(1).replace(".", ",")} (confortable ≤ 29, tenable ≤ 34).`
      : "";
    const altNote =
      isAire || isMassif
        ? ""
        : (s.alt || 0) >= 700
          ? " Ce poste est en altitude : ce n’est pas le climat de la ville en fond de vallée (cuve plus chaude l’été, plus polluée)."
          : "";
    const basinNote = crownNote(s);
    if (s.cc && s.cc !== "FR") {
      els.dFuture.textContent = ok
        ? `${COUNTRY_LABEL[s.cc]} : ${bandWhy} CMIP6 2046–2050, pas DRIAS.${feltNote}${altNote}`
        : `Au moins un critère coché manque. ${bandWhy}${feltNote}${altNote}`;
    } else if (isHome) {
      const pk = heatwavePeak2050(s);
      els.dFuture.textContent = `Chez moi, ce n’est pas un candidat. Le confort se lit sur les extrêmes et leur continuité, pas sur ${fmtFr(proj.tx_jja)} °C de moyenne. 2026 : ${fmtFr(s.txMax)} °C, ${s.streak35 ?? "—"} j d’affilée ≥ 35 °C, ${s.streak30 ?? "—"} j d’affilée ≥ 30 °C. Une canicule 2050 : pic ${fmtPeakRange(pk)} °C, séries au moins aussi longues, plus chaudes. Nuits climatiques 2050 : ${Math.round(proj.tr)} (2026 : ${s.nights20}).`;
    } else if (isMassif) {
      const winter =
        s.ring === "high" || s.driveMin >= 45
          ? " À cette distance / altitude, le vrai filtre c’est l’hiver, l’eau, la neige et l’accès réel au CHU — plus la chaleur."
          : " Filtre sévère : exposition, eau, accès hivernal, temps réel vers le CHU.";
      els.dFuture.textContent = `Altitude + pôle de services, pas un chalet isolé. ${bandWhy}${feltNote}${winter}`;
    } else if (s.name === "Grenoble") {
      els.dFuture.textContent = `Grenoble-centre est hors shortlist : cuvette ~200 m, 35 j ≥ 30 °C, PM d’hiver. On n’évalue pas la ville. On évalue Vercors / Chartreuse / Trièves / Oisans : maison à 800–1 500 m, 20–30 min d’un pôle équipé. Voiron peut jouer le pôle secondaire.`;
    } else if (s.name === "Alès") {
      els.dFuture.textContent = `Alès-centre est invivable, comme Ganges (62 j ≥ 30 °C, 54 nuits trop.). Lasalle (~275 m) et La Grand-Combe (~180 m) sont des fonds de vallée, pas 800 m. Portes / Génolhac restent trop bas et trop chauds. Concoules (640 m, 40 min) est le plus haut bourg — encore sous 800 m, trop petit. Pont-de-Montvert / L’Espérou sont à 800 m+ mais à plus d’une heure, isolés l’hiver : le trou. Ce n’est pas le schéma Grenoble.`;
    } else {
      els.dFuture.textContent = ok
        ? `Candidat selon les critères cochés. ${bandWhy}${feltNote}${altNote}${basinNote}`
        : `Au moins un critère coché manque. ${bandWhy}${feltNote}${altNote}${basinNote}`;
    }
  } else {
    els.dMeta.textContent = isHome
      ? `Ganges · 34190 · ${s.alt} m · mesures au poste le plus proche${s.stationLabel ? ` (${s.stationLabel})` : ""}`
      : isAire
      ? `${placeName(s)} · pôle ${s.pole || placeName(s)} · ${s.alt} m${s.pop ? ` · ${formatPop(s.pop)}` : ""} · mesures au poste le plus proche`
      : extra
        ? `${extra.commune} · ${s.dep} · ${s.alt} m · ${s.n} jours observés`
        : `${s.dep} · ${s.alt} m · ${s.n} jours observés`;
    els.dTx.textContent = deg(s.txMean);
    els.dTn.textContent = deg(s.tnMean);
    els.dTxMax.textContent = deg(s.txMax);
    els.dHot.textContent = String(s.days30);
    els.dTrop.textContent = String(s.nights20);
    els.dAmp.textContent = Number.isFinite(s.streak35) ? `${s.streak35} j` : "—";
    renderChecks(null);
    els.dFuture.hidden = false;
    const lecture =
      {
        comfort: "le confort observé (extrêmes et séries)",
        days30: "les jours ≥ 30 °C",
        nights20: "les nuits tropicales",
        txMean: "la température max moyenne",
        felt: "la chaleur ressentie",
        streak35: "la plus longue série ≥ 35 °C",
      }[currentNowMetric()] || "l’indicateur choisi";
    const nights =
      `${s.nights20} nuit${s.nights20 > 1 ? "s" : ""} tropicale${s.nights20 > 1 ? "s" : ""}`;
    const tint =
      {
        green: "verte : premier quart, le plus supportable",
        yellow: "jaune : deuxième quart",
        orange: "orange : troisième quart",
        red: "rouge : quart le plus éprouvant",
      }[s.band] || "selon le classement";
    const streakBit = Number.isFinite(s.streak35)
      ? `, plus longue série ≥ 35 °C : ${s.streak35} j`
      : "";
    const heatNote =
      {
        green: `Même en vert, la chaleur peut être réelle : ici ${s.days30} j ≥ 30 °C et ${nights}${streakBit}.`,
        yellow: `Jaune = 2e quart de l’affichage : ici ${s.days30} j ≥ 30 °C et ${nights}${streakBit}.`,
        orange: `Orange n’est pas un jugement absolu : ici ${s.days30} j ≥ 30 °C et ${nights}${streakBit}.`,
        red: `Rouge = le quart le plus éprouvant de l’affichage : ici ${s.days30} j ≥ 30 °C et ${nights}${streakBit}.`,
      }[s.band] || `Ici ${s.days30} j ≥ 30 °C et ${nights}${streakBit}.`;
    const feltObs = Number.isFinite(s.feltMean)
      ? ` Chaleur ressentie moyenne ${s.feltMean.toFixed(1).replace(".", ",")} · ${s.daysFelt40} j ≥ 40.`
      : "";
    els.dFuture.textContent = isHome
      ? `Repère chez moi. Le confort se lit sur les extrêmes et leur continuité, pas la moyenne. ${heatNote}${feltObs}`
      : `Pastille ${tint} pour ${lecture}, parmi les ${isAire ? "aires" : "stations"} affichées. ${heatNote}${feltObs}`;
  }
  if (s.cc && s.cc !== "FR") {
    els.dFlags.textContent =
      "Hors de France : pas de Géorisques. Feu et sols secs 2050 non projetés (DRIAS seulement).";
    els.dWater.textContent = "";
    return;
  }
  if (horizon !== "2050") {
    const nowFlags = extra?.flags
      ? `Risques officiels (indépendants de la pastille) : ${extra.flags}`
      : "";
    els.dFlags.textContent = [nowFlags, airNote(s)].filter(Boolean).join(" ");
    els.dWater.textContent = extra?.vigieau
      ? `VigiEau : ${WATER_LABEL[extra.vigieau] || extra.vigieau}.`
      : "";
    return;
  }
  const geoFlags = extra
    ? extra.flags
      ? `Risques aujourd'hui : ${extra.flags}`
      : "Aucun veto Géorisques majeur sur cette commune."
    : "Risques Géorisques non croisés pour cette commune.";
  els.dFlags.textContent = [geoFlags, airNote(s)].filter(Boolean).join(" ");
  if (extra) {
    const water = WATER_LABEL[extra.vigieau] || extra.vigieau;
    const piezo = extra.piezo
      ? `Nappe suivie à ${extra.piezo}${extra.piezo_km != null ? ` (${extra.piezo_km} km)` : ""}`
      : "Pas de piézomètre ADES proche";
    els.dWater.textContent = `Eau aujourd'hui (pas une projection) : VigiEau ${water}. ${piezo}.`;
  } else {
    els.dWater.textContent = "";
  }
}

let tilesReady = false;
let vectorAsked = false;

function hideVectorBasemap() {
  tilesReady = true;
  document.body.classList.add("has-tiles");
  basemap.clearLayers();
}

function loadBasemap() {
  if (tilesReady || vectorAsked) return;
  vectorAsked = true;
  return fetch("./data/basemap.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((geo) => {
      if (!geo || tilesReady) return;
      L.geoJSON(geo, {
        pane: "basemap",
        style: {
          color: "#8a7f76",
          weight: 1,
          fillColor: "#1c1814",
          fillOpacity: 0.55,
        },
        interactive: false,
      }).addTo(basemap);
    })
    .catch(() => {});
}

tiles.on("tileload", hideVectorBasemap);
tiles.on("load", hideVectorBasemap);
window.addEventListener("offline", () => {
  tilesReady = false;
  vectorAsked = false;
  document.body.classList.remove("has-tiles");
  loadBasemap();
});
window.addEventListener("online", () => {
  hideVectorBasemap();
});

function showDriasCell(cell) {
  selectedId = `drias:${cell.lat},${cell.lon}`;
  restyleMarkers();
  els.detail.hidden = false;
  fillDetailVs(null);
  syncSelChip(`${cell.lat.toFixed(2)}°N ${cell.lon.toFixed(2)}°E`);
  syncListSelection();
  renderChecks(null);
  setStatLabels(true);
  const style = driasCellStyle(cell, currentMetric(), () => 0.5);
  const foreign = cell.cc && cell.cc !== "FR";
  els.dRegion.textContent = foreign
    ? `Territoire · ${COUNTRY_LABEL[cell.cc] || cell.cc} · CMIP6 ~20 km`
    : "Territoire · DRIAS TRACC +2,7 °C · maille 8 km";
  els.dName.textContent = `${cell.lat.toFixed(2)}°N ${cell.lon.toFixed(2)}°E`;
  els.dMeta.textContent = foreign
    ? "Maille Open-Meteo (MRI_AGCM3_2_S), pas DRIAS. Comparable entre pays voisins, pas au degré près avec la France."
    : "Climat de la maille, pas d’un poste. Médiane Explore2 / ADAMONT.";
  els.dTx.textContent = `${cell.tx_jja.toFixed(1).replace(".", ",")} °C`;
  els.dTn.textContent = Number.isFinite(cell.tx_jja0)
    ? `${cell.tx_jja0.toFixed(1).replace(".", ",")} °C`
    : "—";
  els.dTxMax.textContent = Number.isFinite(cell.ifm40)
    ? String(Math.round(cell.ifm40))
    : "—";
  els.dHot.textContent = String(Math.round(cell.tx30));
  els.dTrop.textContent = String(Math.round(cell.tr));
  els.dAmp.textContent = Number.isFinite(cell.swi_dry)
    ? String(Math.round(cell.swi_dry))
    : "—";
  if (foreign) {
    els.dFlags.textContent = "Pas de climat historique DRIAS hors de France.";
    els.dWater.textContent = "Pas d’IFM ni de sols secs DRIAS sur cette maille.";
  } else {
    els.dFlags.textContent = `Référence 1976-2005 : max d’été ${cell.tx_jja0.toFixed(1).replace(".", ",")} °C · ${Math.round(cell.tx300)} j ≥ 30 °C · ${Math.round(cell.tr0)} nuits tropicales.`;
    els.dWater.textContent = `Eau / feu 2050 : ${Math.round(cell.swi_dry)} jours de sols secs · ${Math.round(cell.ifm40)} jours IFM élevé · ${Math.round(cell.cdd)} jours secs consécutifs max.`;
  }
  els.dFuture.hidden = false;
  const bandWhy =
    {
      green:
        "Été encore confortable sur cette maille : au plus 14 jours ≥ 30 °C, 8 nuits tropicales, max d’été 24 °C.",
      yellow:
        "Été encore tenable ici : jusqu’à 22 jours ≥ 30 °C, 15 nuits tropicales, max d’été 26 °C.",
      near: "Presque : 2–4 jours / nuits / ~1 °C au-dessus des seuils tenables.",
      red: "Été trop dur sur cette maille (plus Grenoble que Ganges), ou feu / sols si ces critères sont cochés.",
      black:
        "Invivable sur cette maille : ≥ 40 j ≥ 30 °C, ou 28 nuits tropicales, ou 29 °C de max d’été. Béziers, Nîmes, Avignon, tout le pourtour méditerranéen.",
    }[style?.band] || "Lecture de l’indicateur choisi sur la maille.";
  const felt = feltHeat2050(cell);
  const feltTxt = Number.isFinite(felt)
    ? ` Chaleur ressentie ${felt.toFixed(1).replace(".", ",")} (confortable ≤ 29, tenable ≤ 34).`
    : "";
  els.dFuture.textContent = `${bandWhy}${feltTxt} Les pastilles sont des villes ; l’aplat est le territoire, lissé entre mailles 8 km. Hôpital, littoral… ne se lisent pas sur une maille.`;
}

function titleCase(name) {
  const small = new Set(["de", "du", "des", "la", "le", "les", "en", "sur", "et"]);
  return name
    .replace(/_SAPC$/i, "")
    .replace(/^PTE\b/i, "Pointe")
    .replace(/^ST\b/i, "Saint")
    .replace(/\bST\b/g, "Saint")
    .toLowerCase()
    .split(/(\s+|[-'])/)
    .map((part, i) => {
      if (/^\s+$/.test(part) || part === "-" || part === "'") return part;
      if (i > 0 && small.has(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function updateSliderChrome() {
  const max = Number(els.start.max);
  const a = Number(els.start.value);
  const b = Number(els.end.value);
  const left = (Math.min(a, b) / max) * 100;
  const right = (Math.max(a, b) / max) * 100;
  els.range.style.left = `${left}%`;
  els.range.style.width = `${right - left}%`;
}

function currentRange() {
  const a = Number(els.start.value);
  const b = Number(els.end.value);
  return [Math.min(a, b), Math.max(a, b)];
}

function criteriaCount() {
  return document.querySelectorAll("[data-crit]:checked").length;
}

function stationRow2050(station, extra, proj) {
  const amen = amenityOf(station.id);
  const row = {
    id: station.id,
    name: station.n,
    lat: station.lat,
    lon: station.lon,
    alt: station.alt,
    dep: station.dep,
    region: station.reg,
    extra,
    proj,
    amen,
    commune: extra?.commune,
    cc: "FR",
    n: 0,
    score2050: score2050(proj, extra) + (amen?.university_km || 40) * 0.15,
  };
  return row;
}

function aireRow2050(aire) {
  const amen = aire.amen || amenityOf(aire.id) || amenityOf(aire.station_id);
  const extra = aire.extra;
  const row = {
    id: aire.id,
    kind: "aire",
    name: aire.n,
    pole: aire.pole,
    lat: aire.lat,
    lon: aire.lon,
    alt: aire.alt,
    dep: aire.dep,
    region: aire.reg,
    extra,
    proj: aire.proj,
    crown: aire.crown,
    crownCool: aire.crown_cool,
    amen,
    commune: aire.n,
    pop: aire.pop,
    popPole: aire.pop_pole,
    nCom: aire.n_com,
    taav: aire.taav,
    cc: "FR",
    n: 0,
    score2050: score2050(aire.proj, extra) + (amen?.university_km || 40) * 0.15,
  };
  return row;
}

function aireRowNow(aire, i0, i1) {
  const station = stationById.get(aire.station_id);
  if (!station) return null;
  const stats = stationStats(station, i0, i1);
  if (!stats) return null;
  const extra = aire.extra;
  const amen = aire.amen || amenityOf(aire.id) || amenityOf(aire.station_id);
  stats.id = aire.id;
  stats.kind = "aire";
  stats.name = aire.n;
  stats.pole = aire.pole;
  stats.lat = aire.lat;
  stats.lon = aire.lon;
  stats.alt = aire.alt;
  stats.dep = aire.dep;
  stats.region = aire.reg;
  stats.extra = extra;
  stats.proj = aire.proj;
  stats.crown = aire.crown;
  stats.crownCool = aire.crown_cool;
  stats.amen = amen;
  stats.commune = aire.n;
  stats.pop = aire.pop;
  stats.nCom = aire.n_com;
  stats.cc = "FR";
  stats.score2050 = score2050(aire.proj, extra) + (amen?.university_km || 40) * 0.15;
  return stats;
}

function neighborRow(city) {
  return {
    id: city.id,
    name: city.n,
    lat: city.lat,
    lon: city.lon,
    alt: city.alt,
    dep: city.dep,
    region: city.reg,
    extra: city.extra,
    proj: city,
    amen: city.amen,
    commune: city.n,
    cc: city.cc,
    pop: city.pop,
    popPole: city.pop,
    kind: "neighbor",
    source: city.source,
    n: 0,
    score2050: score2050(city, city.extra) + (city.amen?.university_km || 40) * 0.15,
  };
}

function passesClimateOnly(extra, proj) {
  if (critOn("heat") && !climateHeatOk(proj)) return false;
  if (critOn("fire") && Number.isFinite(proj?.ifm40) && proj.ifm40 > T2050.ifm40) {
    return false;
  }
  if (critOn("fire") && extra?.feu) return false;
  if (critOn("dry") && Number.isFinite(proj?.swi_dry) && proj.swi_dry > T2050.swi) {
    return false;
  }
  return true;
}

function passesView(station, extra, proj) {
  const mode = els.view.value;
  if (mode === "drias") return false;
  const amen = amenityOf(station.id);
  const favorable = extra?.lot === "favorable";
  if (horizon === "2050") {
    if (mode === "all") return true;
    if (mode === "favorables") return favorable;
    if (mode === "climate") return passesClimateOnly(extra, proj);
    if (mode === "presque") {
      if (!climateAlmost(proj)) return false;
      if ((station.pop_pole || 0) > 0 && station.pop_pole < VILLE_POLE_MIN) return false;
      if (localCriterionFails(extra, amen, station)) return false;
      if (climateSideFails(proj)) return false;
      if (critOn("fire") && extra?.feu) return false;
      if (critOn("coast") && extra && (extra.submersion || extra.erosion)) return false;
      if (critOn("nuke") && extra?.nucleaire) return false;
      if (critOn("local") && extra && extra.risk > T2050.risk) return false;
      return true;
    }
    return passesCriteria(extra, proj, amen, favorable, station);
  }
  if (mode === "favorables") return favorable;
  if (mode === "shortlist") return Boolean(extra?.keep);
  return true;
}

function setBusy(on, text) {
  if (!els.busy) return;
  els.busy.hidden = !on;
  if (on && text) els.busy.textContent = text;
}

function refreshMapSize() {
  requestAnimationFrame(() => map.invalidateSize());
}

function setDrawerOpen(open) {
  document.body.classList.toggle("drawer-collapsed", !open);
  if (els.drawerOpen) els.drawerOpen.hidden = open;
  try {
    localStorage.setItem("ifc-drawer", open ? "open" : "closed");
  } catch {
    /* ignore */
  }
  refreshMapSize();
}

function setDockExtra(open) {
  document.body.classList.toggle("dock-expanded", open);
  if (els.dockExtra) els.dockExtra.hidden = !open;
  if (els.dockMore) {
    els.dockMore.setAttribute("aria-expanded", String(open));
    els.dockMore.textContent = open ? "Moins" : "Plus";
  }
  refreshMapSize();
}

function syncSelChip(name) {
  if (!els.selChip) return;
  const label = name || els.dName?.textContent || "";
  const show = Boolean(selectedId && !els.detail.hidden && label);
  els.selChip.hidden = !show;
  if (show && els.selChipName) els.selChipName.textContent = label;
}

function syncListSelection() {
  if (!els.cityListItems) return;
  for (const li of els.cityListItems.children) {
    li.classList.toggle("is-selected", li.dataset.id === selectedId);
  }
}

function visibleBoxes(sel) {
  return [...document.querySelectorAll(sel)].filter((el) => {
    const lab = el.closest("label");
    return !lab || getComputedStyle(lab).display !== "none";
  });
}

function syncFilterCounts() {
  const write = (node, boxes) => {
    if (!node || !boxes.length) return;
    const n = boxes.filter((b) => b.checked).length;
    node.textContent = `(${n}/${boxes.length})`;
  };
  write(els.countCountries, visibleBoxes("[data-country]"));
  write(
    els.countClimate,
    visibleBoxes("[data-crit=heat], [data-crit=fire], [data-crit=dry], [data-crit=coast], [data-crit=nuke], [data-crit=local], [data-crit=air]"),
  );
  write(
    els.countAmenity,
    visibleBoxes("[data-crit=hospital], [data-crit=university], [data-crit=culture], [data-crit=infra]"),
  );
}

function applyHorizonFilters() {
  if (horizon === "2050") {
    for (const box of document.querySelectorAll("[data-country]")) {
      box.checked = box.getAttribute("data-country") === "FR";
    }
    for (const box of document.querySelectorAll("[data-band]")) {
      const band = box.getAttribute("data-band");
      box.checked = band === "green" || band === "yellow" || band === "near" || band === "black";
    }
    return;
  }
  for (const box of document.querySelectorAll("[data-band]")) {
    box.checked = true;
  }
}

function resetFilters() {
  for (const box of document.querySelectorAll("[data-crit]")) {
    box.checked = true;
  }
  applyHorizonFilters();
  if (els.lowland) els.lowland.checked = true;
  if (els.ville) els.ville.checked = true;
  if (els.settled) els.settled.checked = true;
  if (els.view) els.view.value = "all";
  render();
}

function applyHorizonChrome() {
  document.body.classList.toggle("horizon-2050", horizon === "2050");
  els.horizonNow.classList.toggle("is-on", horizon === "now");
  els.horizon2050.classList.toggle("is-on", horizon === "2050");
  els.driasMetricField.hidden = horizon !== "2050";
  if (els.nowMetricField) els.nowMetricField.hidden = horizon === "2050";
  if (horizon === "2050") {
    const meta = METRIC_META[currentMetric()] || METRIC_META.combined;
    els.kicker.textContent = "Projection · horizon 2050";
    els.brandSub.textContent =
      "L’aplat est le climat 2050 (maille). Les pastilles sont le climat du pôle. Les villages d’altitude (losanges) n’apparaissent qu’en zoomant un bassin — ce ne sont pas des villes.";
    els.legendTitle.textContent = meta.title;
    els.legendLow.textContent = meta.low;
    els.legendHigh.textContent = meta.high;
    if (els.dockPeriodKicker) {
      els.dockPeriodKicker.textContent =
        els.view.value === "allpass"
          ? "Candidats"
          : els.view.value === "presque"
            ? "Presque"
            : "Projection";
    }
    if (els.criteria) els.criteria.classList.remove("is-idle");
    if (els.critHeatLabel) els.critHeatLabel.textContent = "Été encore tenable";
    if (els.critFireLabel) els.critFireLabel.textContent = "Peu de feu";
    if (els.criteriaHelp) {
      els.criteriaHelp.textContent =
        "Été tenable (≤ 22 j ≥ 30 °C, 15 nuits, 26 °C) + ville (pôle ≥ 35 000 hab.) + campus à 45 km pour que le fils puisse venir. Air : hors cuvettes PM/NO2 (Lyon, Grenoble-centre — pas un plateau à 1 000 m) et hors ozone d’été (Midi, couloir rhodanien). Confortable = 14 j / 8 nuits / 24 °C.";
    }
    setBandCaptions();
    syncCompareToggle();
  } else {
    const nowKey = currentNowMetric();
    els.kicker.textContent = "Mesures · été en cours";
    els.brandSub.textContent =
      "Aires d’attraction INSEE, mesures de l’été au poste le plus proche du pôle. Ce n’est pas une projection.";
    els.legendTitle.textContent =
      nowKey === "days30"
        ? "Jours ≥ 30 °C observés"
        : nowKey === "nights20"
          ? "Nuits tropicales observées"
          : nowKey === "txMean"
            ? "Température max observée"
            : nowKey === "felt"
              ? "Chaleur ressentie observée"
              : nowKey === "streak35"
                ? "Plus longue série ≥ 35 °C"
                : "Confort observé (extrêmes et séries)";
    els.legendLow.textContent = "Plus supportable";
    els.legendHigh.textContent = "Plus éprouvant";
    if (els.dockPeriodKicker) els.dockPeriodKicker.textContent = "Mesures";
    if (els.critHeatLabel) els.critHeatLabel.textContent = "Été supportable (mesures)";
    if (els.critFireLabel) els.critFireLabel.textContent = "Peu de feu (risques officiels)";
    if (els.criteriaHelp) {
      els.criteriaHelp.textContent =
        "Mesures de l’été en cours. Le confort se lit sur les extrêmes et leur continuité (séries de jours chauds, nuits), pas sur la moyenne.";
    }
    setBandCaptions();
    compareOpen = false;
    if (els.compare) els.compare.hidden = true;
    syncCompareToggle();
  }
  if (els.kicker && els.brandSub) els.kicker.title = els.brandSub.textContent;
}

async function render() {
  if (!data) return;
  const gen = ++renderGen;
  setBusy(true, horizon === "2050" && !drias ? "Chargement DRIAS…" : "Mise à jour…");
  const wantsDrias = els.view.value === "drias" || horizon === "2050";
  if (wantsDrias && !drias) {
    await ensureDrias();
    if (gen !== renderGen) {
      setBusy(false);
      return;
    }
  }
  applyHorizonChrome();
  const [i0, i1] = currentRange();
  updateSliderChrome();
  renderDriasGrid(horizon === "2050");

  const lowland = els.lowland.checked;
  const settled = !els.settled || els.settled.checked;
  const useAires = aires.length > 0 && !stationsWanted();
  const rows = [];
  if (useAires) {
    for (const aire of aires) {
      if (!countryOn("FR")) continue;
      if (lowland && aire.alt >= LOWLAND_MAX) continue;
      if (els.ville?.checked && (aire.pop_pole || 0) < VILLE_POLE_MIN) continue;
      const extra = aire.extra;
      const proj = aire.proj;
      if (!passesView({ id: aire.id, alt: aire.alt, pop_pole: aire.pop_pole }, extra, proj)) continue;
      if (horizon === "2050") {
        if (!proj) continue;
        rows.push(aireRow2050(aire));
        continue;
      }
      const row = aireRowNow(aire, i0, i1);
      if (row) rows.push(row);
    }
  } else {
    for (const station of data.stations) {
      if (horizon === "2050" && !countryOn("FR")) continue;
      if (lowland && station.alt >= LOWLAND_MAX) continue;
      if (settled && isIsolatedPost(station)) continue;
      const extra = byStation.get(station.n);
      const proj = driasById.get(station.id);
      if (!passesView(station, extra, proj)) continue;
      if (horizon === "2050") {
        if (!proj) continue;
        rows.push(stationRow2050(station, extra, proj));
        continue;
      }
      const stats = stationStats(station, i0, i1);
      if (!stats) continue;
      stats.extra = extra;
      stats.proj = proj;
      stats.amen = amenityOf(station.id);
      stats.commune = extra?.commune;
      stats.score2050 = score2050(proj, extra) + (stats.amen?.university_km || 40) * 0.15;
      stats.cc = "FR";
      rows.push(stats);
    }
  }
  if (horizon === "2050") {
    for (const city of neighbors) {
      if (!countryOn(city.cc)) continue;
      if (lowland && city.alt >= LOWLAND_MAX) continue;
      if (settled && isIsolatedPost(city)) continue;
      const mode = els.view.value;
      if (mode === "favorables") continue;
      if (mode === "climate" && !passesClimateOnly(city.extra, city)) continue;
      if (mode === "presque") {
        if (!climateAlmost(city)) continue;
        if (localCriterionFails(city.extra, city.amen, city)) continue;
        if (climateSideFails(city)) continue;
      } else if (mode === "allpass" && !passesCriteria(city.extra, city, city.amen, undefined, city)) continue;
      rows.push(neighborRow(city));
    }
  }
  const metricKey = currentMetric();
  const nowKey = currentNowMetric();
  rows.sort((a, b) => {
    if (horizon === "2050") {
      const av = metricValue(a, metricKey);
      const bv = metricValue(b, metricKey);
      if (av == null) return 1;
      if (bv == null) return -1;
      return av - bv;
    }
    const av = observedValue(a, nowKey);
    const bv = observedValue(b, nowKey);
    if (av == null) return 1;
    if (bv == null) return -1;
    return av - bv;
  });
  if (horizon === "2050" && els.view.value === "allpass") {
    const basins = rows.filter((r) => r.kind === "aire");
    const rest = rows.filter((r) => r.kind !== "aire");
    rows.splice(0, rows.length, ...basins, ...dedupNearby(rest));
  }
  const rank = ranks(
    rows
      .map((r) =>
        horizon === "2050" ? metricValue(r, metricKey) : observedValue(r, nowKey),
      )
      .filter((v) => v != null),
  );
  const painted = [];
  for (const s of rows) {
    const raw = horizon === "2050" ? metricValue(s, metricKey) : observedValue(s, nowKey);
    const t = raw == null ? 0.5 : rank(raw);
    const band =
      horizon === "2050"
        ? verdictBand(s.extra, s.proj, s.amen, s)
        : colorBand(t);
    if (!bandOn(band)) continue;
    s.band = band;
    painted.push({ s, t });
  }
  const visible = painted.map((p) => p.s);

  if (horizon === "2050") {
    const nCrit = criteriaCount();
    const byCc = { FR: 0, DE: 0, CH: 0, ES: 0, IT: 0 };
    for (const row of visible) {
      const cc = row.cc || "FR";
      if (byCc[cc] != null) byCc[cc] += 1;
    }
    const filterNote =
        els.view.value === "allpass" || els.view.value === "climate" || els.view.value === "presque"
        ? ` · ${nCrit} crit.`
        : " · couleur = critères";
    const unit = useAires ? "aires" : "villes";
    const hiddenNote = useAires || stationsWanted() ? "" : " · pastilles masquées";
    els.period.textContent = `${visible.length} ${unit} · FR 8 km lissé · voisins ~20 km lissé · FR ${byCc.FR} · DE ${byCc.DE} · CH ${byCc.CH} · ES ${byCc.ES} · IT ${byCc.IT}${filterNote}${hiddenNote}`;
    els.bestLabel.textContent = useAires ? "Meilleure aire 2050" : "Meilleure ville 2050";
  } else {
    const measured = lastMeasuredIndex(data);
    const span = `${formatDay(data.days[i0])} — ${formatDay(data.days[i1])}`;
    const lag =
      measured < i1 ? ` · dernières mesures le ${formatDay(data.days[measured])}` : "";
    const hiddenNote = useAires || stationsWanted() ? "" : " · pastilles masquées";
    els.period.textContent = `${visible.length} ${useAires ? "aires" : "villes"} · ${span}${lag}${hiddenNote}`;
    els.bestLabel.textContent = "Plus supportable sur la période";
  }

  const best = visible[0];
  els.bestName.textContent = best ? placeName(best) : "Aucun candidat";
  els.bestSpot.onclick = best
    ? () => {
        showDetail(best);
        flyToRow(best);
      }
    : null;
  fillCityList(visible);
  if (els.cityListHint) {
    els.cityListHint.hidden = useAires || stationsWanted();
  }

  lastPainted = painted;
  syncStationMarkers(painted);
  syncMassifMarkers();
  updateCityLabels();
  ensureHomeMarker();
  refreshOpenDetail();
  if (horizon === "2050") renderCompare();
  else if (els.compare) {
    compareOpen = false;
    els.compare.hidden = true;
    syncCompareToggle();
  }
  syncFilterCounts();
  setBusy(false);
}

async function ensureDrias() {
  if (drias) return drias;
  if (driasLoad) return driasLoad;
  els.period.textContent = "Chargement DRIAS…";
  setBusy(true, "Chargement DRIAS…");
  driasLoad = (async () => {
    const r = await fetch("./data/drias.json");
    if (!r.ok) throw new Error("drias.json");
    drias = await r.json();
    driasById = new Map((drias.stations || []).map((s) => [s.id, s]));
    return drias;
  })().catch((err) => {
    driasLoad = null;
    els.period.textContent = "DRIAS indisponible";
    console.error(err);
    return null;
  });
  return driasLoad;
}

function renderDriasGrid(show) {
  if (!show) {
    if (map.hasLayer(heatLayer)) map.removeLayer(heatLayer);
    heatLayer.setPainted([]);
    return;
  }
  const metric = currentMetric();
  const painted = [];
  let rankFn = () => 0.5;
  let nbRankFn = () => 0.5;
  if (drias && countryOn("FR")) {
    if (metric !== "combined") {
      rankFn = ranks(
        drias.cells
          .map((c) => (metric === "felt" ? feltHeat2050(c) : c[metric]))
          .filter((v) => Number.isFinite(v)),
      );
    }
    for (const cell of drias.cells) {
      const style = driasCellStyle(cell, metric, rankFn);
      if (!style) continue;
      if (!bandOn(style.band)) continue;
      painted.push({ cell, color: style.color, rgb: colorRgb(style.color) });
    }
  }
  const foreign = neighborGrid.filter((c) => countryOn(c.cc));
  if (foreign.length) {
    if (metric !== "combined") {
      nbRankFn = ranks(
        foreign
          .map((c) => (metric === "felt" ? feltHeat2050(c) : c[metric]))
          .filter((v) => Number.isFinite(v)),
      );
    }
    for (const cell of foreign) {
      const style = driasCellStyle(cell, metric, nbRankFn);
      if (!style) continue;
      if (!bandOn(style.band)) continue;
      painted.push({
        cell,
        color: style.color,
        rgb: colorRgb(style.color),
        maxDeg2: NEIGHBOR_GRID_MAX_DEG2,
      });
    }
  }
  heatLayer._metric = metric;
  heatLayer._rankFn = rankFn;
  heatLayer._nbRankFn = nbRankFn;
  heatLayer.setPainted(painted);
  if (!painted.length) {
    if (map.hasLayer(heatLayer)) map.removeLayer(heatLayer);
    return;
  }
  if (!map.hasLayer(heatLayer)) heatLayer.addTo(map);
  else heatLayer.redraw();
}

const ZONE_BIN = 0.42;

function fmtFr(n, digits = 1) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits).replace(".", ",");
}

function bandFrShort(band) {
  return (
    {
      green: "vert vif",
      yellow: "vert fade",
      orange: "orange",
      near: "presque",
      red: "trop dur",
      black: "noir",
    }[band] || band || "—"
  );
}

function bandFr(band) {
  return (
    {
      green: "vert vif (été confortable)",
      yellow: "vert fade (été encore tenable)",
      orange: "orange (3e quart)",
      near: "presque (2–4 j de trop)",
      red: "rouge (été trop dur)",
      black: "noir (invivable)",
    }[band] || band || "—"
  );
}

function lonLatLabel(lat, lon) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "O";
  return `${fmtFr(Math.abs(lat), 2)}°${ns}, ${fmtFr(Math.abs(lon), 2)}°${ew}`;
}

function placeCatalog() {
  if (listedRows.length) return listedRows;
  return (data?.stations || []).map((s) => ({
    name: s.n,
    lat: s.lat,
    lon: s.lon,
    commune: byStation.get(s.n)?.commune,
    region: s.reg,
    cc: "FR",
  }));
}

function nearbyPlaceNames(lat, lon, rows, n = 4) {
  const cos = Math.cos((lat * Math.PI) / 180);
  return rows
    .map((s) => ({
      s,
      d: (s.lat - lat) ** 2 + ((s.lon - lon) * cos) ** 2,
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => placeName(x.s));
}

function cellsNearPlaces(cells, places, maxKm = 16) {
  if (!places.length) return cells;
  const maxD = (maxKm / 111.32) ** 2;
  const bin = 0.2;
  const index = new Map();
  for (const p of places) {
    const key = `${Math.round(p.lat / bin)}|${Math.round(p.lon / bin)}`;
    const bucket = index.get(key);
    if (bucket) bucket.push(p);
    else index.set(key, [p]);
  }
  return cells.filter((cell) => {
    const ki = Math.round(cell.lat / bin);
    const kj = Math.round(cell.lon / bin);
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const bucket = index.get(`${ki + di}|${kj + dj}`);
        if (!bucket) continue;
        const cos = Math.cos((cell.lat * Math.PI) / 180);
        for (const p of bucket) {
          const dlat = p.lat - cell.lat;
          const dlon = (p.lon - cell.lon) * cos;
          if (dlat * dlat + dlon * dlon <= maxD) return true;
        }
      }
    }
    return false;
  });
}

function servicePoleCatalog() {
  const seen = new Set();
  const out = [];
  const add = (s) => {
    if (!s || !Number.isFinite(s.lat)) return;
    const key = `${(s.n || s.name || s.commune || "").toLowerCase()}|${s.lat.toFixed(2)}|${s.lon.toFixed(2)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      name: s.n || s.name || s.commune,
      lat: s.lat,
      lon: s.lon,
      commune: s.n || s.commune,
      region: s.reg || s.region,
      cc: s.cc || "FR",
    });
  };
  for (const a of aires) {
    if ((a.pop_pole || 0) >= VILLE_POLE_MIN) add(a);
  }
  for (const s of listedRows) add(s);
  return out;
}

function clusterTenableCells() {
  if (!drias?.cells?.length) return [];
  const places = servicePoleCatalog();
  const nearTowns = cellsNearPlaces(drias.cells, places, 32);
  const buckets = new Map();
  for (const cell of nearTowns) {
    if (
      !Number.isFinite(cell.tx30) ||
      !Number.isFinite(cell.tr) ||
      !Number.isFinite(cell.tx_jja)
    ) {
      continue;
    }
    if (climateCriterionFails(null, cell)) continue;
    const band = climateHasMargin(cell) ? "green" : "yellow";
    const key = `${Math.round(cell.lat / ZONE_BIN)}|${Math.round(cell.lon / ZONE_BIN)}`;
    let b = buckets.get(key);
    if (!b) {
      b = {
        n: 0,
        green: 0,
        yellow: 0,
        latSum: 0,
        lonSum: 0,
        tx30: 0,
        tr: 0,
        tx: 0,
        felt: 0,
        feltN: 0,
        ifm: 0,
        ifmN: 0,
        swi: 0,
        swiN: 0,
        minLat: 90,
        maxLat: -90,
        minLon: 180,
        maxLon: -180,
      };
      buckets.set(key, b);
    }
    b.n += 1;
    if (band === "green") b.green += 1;
    else b.yellow += 1;
    b.latSum += cell.lat;
    b.lonSum += cell.lon;
    b.tx30 += cell.tx30;
    b.tr += cell.tr;
    b.tx += cell.tx_jja;
    const felt = feltHeat2050(cell);
    if (Number.isFinite(felt)) {
      b.felt += felt;
      b.feltN += 1;
    }
    if (Number.isFinite(cell.ifm40)) {
      b.ifm += cell.ifm40;
      b.ifmN += 1;
    }
    if (Number.isFinite(cell.swi_dry)) {
      b.swi += cell.swi_dry;
      b.swiN += 1;
    }
    b.minLat = Math.min(b.minLat, cell.lat);
    b.maxLat = Math.max(b.maxLat, cell.lat);
    b.minLon = Math.min(b.minLon, cell.lon);
    b.maxLon = Math.max(b.maxLon, cell.lon);
  }
  const catalog = placeCatalog();
  return [...buckets.values()]
    .map((b) => {
      const lat = b.latSum / b.n;
      const lon = b.lonSum / b.n;
      return {
        lat,
        lon,
        n: b.n,
        green: b.green,
        yellow: b.yellow,
        band: b.green >= b.yellow ? "green" : "yellow",
        tx30: b.tx30 / b.n,
        tr: b.tr / b.n,
        tx: b.tx / b.n,
        felt: b.feltN ? b.felt / b.feltN : null,
        ifm: b.ifmN ? b.ifm / b.ifmN : null,
        swi: b.swiN ? b.swi / b.swiN : null,
        minLat: b.minLat,
        maxLat: b.maxLat,
        minLon: b.minLon,
        maxLon: b.maxLon,
        nearby: nearbyPlaceNames(lat, lon, catalog, 4),
        km2: Math.round(b.n * 64),
      };
    })
    .sort((a, b) => b.green - a.green || a.tx30 - b.tx30);
}

function cityExportBlock(s, i) {
  const cc = COUNTRY_LABEL[s.cc || "FR"] || "";
  const region = s.region ? String(s.region).split("-")[0] : "";
  const alt = Number.isFinite(s.alt) ? `${Math.round(s.alt)} m` : "";
  const pop = s.pop ? formatPop(s.pop) : "";
  const kind = s.kind === "aire" ? "aire" : "";
  const where = [cc, region, kind, pop, alt].filter(Boolean).join(", ");
  const lines = [`${i + 1}. **${placeName(s)}** (${where}) · ${bandFr(s.band)}`];
  const proj = s.proj;
  if (proj && Number.isFinite(proj.tx_jja)) {
    const felt = feltHeat2050(proj);
    const bits = [
      `Max d’été ${fmtFr(proj.tx_jja)} °C`,
      `${Math.round(proj.tx30)} j ≥ 30 °C`,
      `${Math.round(proj.tr)} nuits trop.`,
    ];
    if (Number.isFinite(felt)) bits.push(`chaleur ressentie ${fmtFr(felt)}`);
    if (Number.isFinite(proj.ifm40)) bits.push(`IFM ${Math.round(proj.ifm40)} j`);
    if (Number.isFinite(proj.swi_dry)) bits.push(`sols secs ${Math.round(proj.swi_dry)} j`);
    lines.push(`   2050 : ${bits.join(" · ")}`);
  }
  if (Number.isFinite(s.txMean)) {
    const bits = [
      `Max du jour ${fmtFr(s.txMean)} °C`,
      `${s.days30} j ≥ 30 °C`,
      `${s.nights20} nuits trop.`,
    ];
    if (Number.isFinite(s.feltMean)) bits.push(`chaleur ressentie ${fmtFr(s.feltMean)}`);
    lines.push(`   Observé 2026 : ${bits.join(" · ")}`);
  }
  const amen = s.amen || amenityOf(s.id);
  if (amen) {
    const bits = AMENITY_KEYS.filter((k) => Number.isFinite(amen[`${k}_km`])).map(
      (k) => `${AMENITY_LABEL[k]} ${String(amen[`${k}_km`]).replace(".", ",")} km`,
    );
    if (bits.length) lines.push(`   Commodités : ${bits.join(" · ")}`);
  }
  return lines.join("\n");
}

function zoneExportBlock(z, i) {
  const near = z.nearby.length ? z.nearby.join(", ") : "mailles sans ville proche dans la liste";
  const felt = Number.isFinite(z.felt) ? ` · chaleur ressentie ${fmtFr(z.felt)}` : "";
  const ifm = Number.isFinite(z.ifm) ? ` · IFM ${fmtFr(z.ifm, 0)} j` : "";
  const swi = Number.isFinite(z.swi) ? ` · sols secs ${fmtFr(z.swi, 0)} j` : "";
  return [
    `### Zone ${i + 1} — autour de ${near}`,
    `- Centroïde ${lonLatLabel(z.lat, z.lon)} · bbox ${fmtFr(z.minLat, 2)}–${fmtFr(z.maxLat, 2)}°N, ${fmtFr(z.minLon, 2)}–${fmtFr(z.maxLon, 2)}°E`,
    `- ${z.n} mailles DRIAS (~${z.km2} km²) · ${z.green} vert vif / ${z.yellow} vert fade`,
    `- Moyennes 2050 : max d’été ${fmtFr(z.tx)} °C · ${fmtFr(z.tx30, 0)} j ≥ 30 °C · ${fmtFr(z.tr, 0)} nuits trop.${felt}${ifm}${swi}`,
  ].join("\n");
}

function checkedIds(sel) {
  return [...document.querySelectorAll(sel)]
    .filter((box) => box.checked)
    .map((box) => box.getAttribute(sel.includes("crit") ? "data-crit" : sel.includes("country") ? "data-country" : "data-band"));
}

function exportStamp(d = new Date()) {
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}h${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function exportCities() {
  return listedRows.filter((s) => {
    const name = placeName(s);
    if (CUVETTE_POLES.has(name) || CUVETTE_POLES.has(s.pole)) return false;
    return s.band === "green" || s.band === "yellow" || s.band === "near";
  });
}

function citiesByBand(cities, band) {
  return cities.filter((s) => s.band === band);
}

function massifExportBlock(m) {
  const p = m.proj || {};
  const hosp = Number.isFinite(m.amen?.hospital_km)
    ? ` · CHU ${String(m.amen.hospital_km).replace(".", ",")} km`
    : "";
  return `- **${m.name}** (${m.sector}, ${m.alt} m, ~${m.driveMin} min ${m.pole}${Number.isFinite(m.kmPole) ? `, ${fmtFr(m.kmPole, 0)} km` : ""}) · ${bandFr(m.band)} · max d’été ${fmtFr(p.tx_jja)} °C · ${Math.round(p.tx30)} j ≥ 30 °C · ${Math.round(p.tr)} nuits trop.${hosp}`;
}

function buildLlmExport(stamp = exportStamp()) {
  const zones = clusterTenableCells();
  const topZones = zones.slice(0, 22);
  const cities = exportCities();
  const greens = citiesByBand(cities, "green");
  const yellows = citiesByBand(cities, "yellow");
  const nears = citiesByBand(cities, "near");
  const nRed = listedRows.filter((s) => s.band === "red").length;
  const nBlack = listedRows.filter((s) => s.band === "black").length;
  const massifs = massifRows();
  const crits = checkedIds("[data-crit]");
  const countries = checkedIds("[data-country]");
  const viewOpt = (horizon === "2050" ? VIEWS_2050 : VIEWS_NOW).find(
    (v) => v.value === els.view.value,
  );
  const date = new Date().toISOString().slice(0, 10);
  const geoName = `il-fait-chaud-zones-${stamp}.geojson`;
  const mdName = `il-fait-chaud-briefing-${stamp}.md`;
  const markdown = [
    `# Briefing — où s’établir dans les 10–20 prochaines années`,
    ``,
    `Export de l’outil personnel **Il fait chaud** (${date}).`,
    ``,
    `## Consigne pour le LLM`,
    ``,
    `Tu aides à choisir un **lieu de vie** en Europe de l’Ouest (France d’abord, puis DE/CH/ES/IT si présents) à horizon **2035–2045**, en prenant **2050 comme proxy conservateur**. Priorité : un été encore vivable, puis commodités et risques. `,
    ``,
    `Contraintes de lecture :`,
    `- **Confort = extrêmes et continuité**, pas la moyenne. Deux étés à même Tx moyenne peuvent n’avoir rien à voir : 20 jours d’extrêmes jour et nuit d’affilée vs des journées plus chaudes mais sans bloc. DRIAS donne des **cumuls** climatiques (j ≥ 30 °C, nuits trop.), pas la longueur d’un épisode. Pour Ganges 2026 : pic 43 °C, 19 j d’affilée ≥ 35 °C ; une canicule 2050 serait plus dure (pic ~46–48 °C, séries au moins aussi longues), pas plus douce.`,
    `- **Lire les couleurs** : vert vif (confortable), vert fade (encore tenable), mauve **Presque** (2–4 j de trop), **rouge** (été trop dur, ex. Grenoble-centre), **noir** (invivable : Ganges, Béziers, Nîmes, Avignon, pourtour méditerranéen). Ne pas mélanger rouge et noir. Ne pas se limiter au vert vif du nord et de l’ouest.`,
    `- En France, l’unité de la liste est l’**aire d’attraction INSEE** : le climat de la pastille est celui du **pôle** (la ville en cuvette, souvent). Ce n’est pas le climat des villages de la couronne.`,
    `- **Pas un trou** : écarter Aurillac, Mende, Millau, Le Puy et les préfectures isolées du Massif central. Il faut une **vraie ville** (pôle ≥ 35 000 hab.) à proximité pendant des décennies — hôpital, labos, imagerie, commerces, gare.`,
    `- **Université / campus** = pour que le **fils** puisse venir sans voyage de plusieurs heures, pas pour le parent. Rayon 45 km.`,
    `- **Grenoble-centre est hors shortlist** (cuvette ~200 m, été trop dur, PM d’hiver). Idem Lyon. Ne pas les recommander comme lieu de vie.`,
    `- **Inverser le raisonnement cuvette** : on n’évalue pas la ville en fond de vallée, on évalue les **secteurs habités à 800–1 500 m** dont cette ville est le pôle de services (20–40 min) — **pas** un chalet isolé à 1 500 m. Grenoble n’est qu’un exemple (Vercors, Chartreuse, Trièves, Oisans) : même lecture pour Lyon (Monts du Lyonnais), Saint-Étienne (Pilat), Annecy (Aravis), Chambéry (Bauges), Clermont-Ferrand (Puys / Sancy), **Besançon** (premier plateau : Avoudrey, Flangebouche, Levier), **Belfort / Montbéliard** (plateau de Maîche, pas le Ballon d’Alsace). **Alès / Lasalle / La Grand-Combe** : pas d’équivalent — les Cévennes gardoises logent dans les vallées (200–500 m) ; à 800 m on est à plus d’une heure, isolé (Pont-de-Montvert, L’Espérou). Ne pas inventer un « Vercors d’Alès ». Filtre sévère : altitude, exposition, eau, accès hivernal, temps réel vers un CHU, isolement.`,
    `- À ≥ 1 200 m, le risque principal n’est plus la chaleur, c’est l’hiver, la neige, l’eau et l’éloignement médical. Le Trièves n’est pas un cadeau : le fond de vallée (Mens, Monestier) reste chaud en DRIAS.`,
    `- Ne recommande **pas** une crête, un col, un radôme, un nivose. Un village habité à l’année, si.`,
    `- La maille DRIAS (France) fait **~8 km**. L’aplat est **lissé** entre mailles à l’affichage. DE/CH/ES/IT : maille **CMIP6 ~20 km**, pas DRIAS. Utile pour comparer, pas au degré près.`,
    `- L’humidité 2050 (chaleur ressentie / humidex) est **estimée** (DRIAS n’a pas l’humidité ; proxy via les nuits tropicales).`,
    `- **Hors champ** : hiver (sauf l’alerte altitude), emploi, logement, écoles, fiscalité, réseaux / famille. Signale-les comme questions ouvertes.`,
    `- Propose 4 à 8 **bassins à creuser**, en mélangeant vert vif, vert fade et Presque, plus au moins un **secteur d’altitude à pôle de services** s’il tient.`,
    ``,
    `## Configuration exportée`,
    ``,
    `- Horizon d’affichage : ${horizon === "2050" ? "2050 (projection)" : "Aujourd’hui (mesures 2026)"}`,
    `- Vue : ${viewOpt?.label || els.view.value}`,
    `- Pays : ${countries.map((c) => COUNTRY_LABEL[c] || c).join(", ") || "—"}`,
    `- Filtres : ${els.lowland.checked ? "pôles sous 600 m (les villages d’altitude restent un calque à part, visibles en zoomant un bassin)" : "toutes altitudes"}${els.ville?.checked ? ` · ville (pôle ≥ ${VILLE_POLE_MIN.toLocaleString("fr-FR")} hab.)` : ""} · France = aires d’attraction INSEE ≥ 50 000 hab. (climat au pôle)`,
    `- Critères cochés : ${crits.map((c) => CRIT_LABEL[c] || c).join(" · ") || "aucun"}`,
    `- Source France 2050 : DRIAS Explore2 ADAMONT, jalon TRACC **+2,7 °C**, médiane ENSq50`,
    `- Seuils **été encore tenable** : ≤ ${T2050.tx30} j ≥ 30 °C, ≤ ${T2050.tr} nuits tropicales, max d’été ≤ ${T2050.txJja} °C, chaleur ressentie ≤ ${T2050.felt}`,
    `- Seuils **été confortable** (vert vif) : ≤ ${T2050_MARGIN.tx30} j, ≤ ${T2050_MARGIN.tr} nuits, max d’été ≤ ${T2050_MARGIN.txJja} °C, chaleur ressentie ≤ ${T2050_MARGIN.felt}`,
    `- Seuils **Presque** (mauve) : ≤ ${T2050_NEAR.tx30} j, ≤ ${T2050_NEAR.tr} nuits, max d’été ≤ ${T2050_NEAR.txJja} °C, chaleur ressentie ≤ ${T2050_NEAR.felt}`,
    `- Seuils **invivable** (noir) : ≥ ${T2050_BLACK.tx30} j ≥ 30 °C, ou ≥ ${T2050_BLACK.tr} nuits trop., ou max d’été ≥ ${T2050_BLACK.txJja} °C, ou chaleur ressentie ≥ ${T2050_BLACK.felt}. Rouge = entre Presque et ce plafond.`,
    `- Feu : ≤ ${T2050.ifm40} j IFM élevé · sols secs : ≤ ${T2050.swi} j · risque local : score ≤ ${T2050.risk}`,
    `- Air (CAMS ~11 km, hiver 2025–26 et été 2026) : PM2,5 hiver ≥ 14,5 µg/m³, NO2 hiver ≥ 25, ou ≥ 20 j d’ozone ≥ 120 µg/m³ → veto. Lyon/Grenoble-centre = cuvettes ; un plateau à 1 000 m n’hérite pas de ce PM. Midi = ozone. L’ozone empirera en 2050.`,
    `- Liste courante : ${listedRows.length} aires/villes · **${greens.length} vert vif** · **${yellows.length} vert fade** · **${nears.length} presque** dans l’extrait (tous, pas un top 20) · ${nRed} rouge · ${nBlack} noir hors extrait · Grenoble et Lyon exclus`,
    ``,
    `## Zones climatiques tenables (mailles DRIAS agrégées ~45 km)`,
    ``,
    zones.length
      ? `Cellules dont l’été 2050 reste tenable selon les critères climat cochés, **à moins de 32 km d’un pôle de services** (≥ 35 000 hab.), même si le pôle lui-même est trop chaud (cas Grenoble). ${zones.length} zones, ${topZones.length} détaillées ci-dessous.`
      : `Pas de mailles DRIAS tenables avec les critères climat actuels (ou DRIAS non chargé).`,
    ``,
    ...topZones.map((z, i) => zoneExportBlock(z, i)),
    ``,
    `## Vert vif — été confortable`,
    ``,
    greens.length ? greens.map((s, i) => cityExportBlock(s, i)).join("\n") : "Aucun dans la liste filtrée.",
    ``,
    `## Vert fade / vert clair — été encore tenable`,
    ``,
    yellows.length ? yellows.map((s, i) => cityExportBlock(s, i)).join("\n") : "Aucun dans la liste filtrée.",
    ``,
    `## Presque — mauve, 2–4 j de trop`,
    ``,
    nears.length ? nears.map((s, i) => cityExportBlock(s, i)).join("\n") : "Aucun dans la liste filtrée.",
    ``,
    `## Cuvettes trop dures, villages d’altitude à étudier`,
    ``,
    `Les pastilles sont les villes. Les villages d’altitude (losanges) ne sont pas au même niveau : ils n’apparaissent qu’en zoomant un bassin. Grenoble est un exemple ; même lecture ailleurs. Chiffres = maille DRIAS au village, pas le pôle.`,
    ``,
    ...(() => {
      if (!massifs.length) {
        return ["DRIAS non chargé : relancer l’export en 2050."];
      }
      const byPole = new Map();
      for (const m of massifs) {
        const k = m.pole || "?";
        if (!byPole.has(k)) byPole.set(k, []);
        byPole.get(k).push(m);
      }
      const lines = [];
      for (const [pole, list] of byPole) {
        lines.push(`### ${pole}`);
        lines.push("");
        lines.push(list.map((m) => massifExportBlock(m)).join("\n"));
        lines.push("");
      }
      return lines;
    })(),
    `Un GeoJSON des zones, des villes (vert / fade / presque) et des villages d’altitude est joint : \`${geoName}\`.`,
  ].join("\n");

  const features = [
    ...topZones.map((z, i) => ({
      type: "Feature",
      properties: {
        kind: "zone",
        rank: i + 1,
        band: z.band,
        nearby: z.nearby.join(", "),
        n_cells: z.n,
        km2: z.km2,
        green_cells: z.green,
        yellow_cells: z.yellow,
        tx_jja: Number(z.tx.toFixed(2)),
        tx30: Number(z.tx30.toFixed(1)),
        tr: Number(z.tr.toFixed(1)),
        felt: z.felt != null ? Number(z.felt.toFixed(1)) : null,
        ifm40: z.ifm != null ? Number(z.ifm.toFixed(1)) : null,
        swi_dry: z.swi != null ? Number(z.swi.toFixed(1)) : null,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [z.minLon, z.minLat],
            [z.maxLon, z.minLat],
            [z.maxLon, z.maxLat],
            [z.minLon, z.maxLat],
            [z.minLon, z.minLat],
          ],
        ],
      },
    })),
    ...cities.map((s, i) => ({
      type: "Feature",
      properties: {
        kind: "city",
        rank: i + 1,
        name: placeName(s),
        band: s.band,
        country: s.cc || "FR",
        alt_m: s.alt,
        tx_jja: s.proj?.tx_jja ?? null,
        tx30: s.proj?.tx30 ?? s.days30 ?? null,
        tr: s.proj?.tr ?? s.nights20 ?? null,
      },
      geometry: {
        type: "Point",
        coordinates: [s.lon, s.lat],
      },
    })),
    ...massifs.map((s) => ({
      type: "Feature",
      properties: {
        kind: "massif",
        name: placeName(s),
        sector: s.sector,
        ring: s.ring,
        pole: s.pole,
        band: s.band,
        alt_m: s.alt,
        drive_min: s.driveMin,
        tx_jja: s.proj?.tx_jja ?? null,
        tx30: s.proj?.tx30 ?? null,
        tr: s.proj?.tr ?? null,
      },
      geometry: {
        type: "Point",
        coordinates: [s.lon, s.lat],
      },
    })),
  ];

  const geojson = {
    type: "FeatureCollection",
    name: geoName.replace(/\.geojson$/, ""),
    date,
    stamp,
    horizon,
    features,
  };
  return { markdown, geojson, mdName, geoName };
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

async function exportLlmBriefing() {
  const btn = els.exportLlm;
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Préparation…";
  }
  try {
    if (!drias) await ensureDrias();
    const stamp = exportStamp();
    const { markdown, geojson, mdName, geoName } = buildLlmExport(stamp);
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      /* fichier quand même */
    }
    downloadText(mdName, markdown, "text/markdown");
    downloadText(
      geoName,
      JSON.stringify(geojson, null, 2),
      "application/geo+json",
    );
    if (btn) {
      btn.textContent = "Copié · fichiers téléchargés";
      btn.classList.add("is-done");
      setTimeout(() => {
        btn.textContent = "Exporter pour un LLM";
        btn.classList.remove("is-done");
        btn.disabled = false;
      }, 2500);
    }
  } catch (err) {
    console.error(err);
    if (btn) {
      btn.textContent = "Échec de l’export";
      btn.disabled = false;
    }
  }
}

function scheduleRender() {
  clearTimeout(timer);
  timer = setTimeout(render, 40);
}

function onRangeInput(which) {
  const a = Number(els.start.value);
  const b = Number(els.end.value);
  if (which === "start" && a > b) els.end.value = String(a);
  if (which === "end" && b < a) els.start.value = String(b);
  updateSliderChrome();
  scheduleRender();
}

function setupTicks(days) {
  const labels = [];
  let lastMonth = 0;
  days.forEach((n, i) => {
    const { m, d } = ymd(n);
    if (m !== lastMonth && (d === 1 || i === 0)) {
      labels.push({ i, text: MONTHS[m - 1] });
      lastMonth = m;
    }
  });
  labels.push({ i: days.length - 1, text: formatDay(days[days.length - 1]) });
  els.ticks.replaceChildren(
    ...labels.map((tick) => {
      const span = document.createElement("span");
      span.textContent = tick.text;
      return span;
    }),
  );
}

els.start.addEventListener("input", () => onRangeInput("start"));
els.end.addEventListener("input", () => onRangeInput("end"));
els.lowland.addEventListener("change", render);
if (els.ville) els.ville.addEventListener("change", render);
if (els.settled) els.settled.addEventListener("change", render);
els.view.addEventListener("change", render);
els.driasMetric.addEventListener("change", render);
els.driasMetric.addEventListener("input", render);
els.nowMetric.addEventListener("change", render);
els.nowMetric.addEventListener("input", render);
document.querySelectorAll("[data-crit], [data-country], [data-band]").forEach((box) => {
  box.addEventListener("input", () => {
    els.period.textContent = "Mise à jour…";
    render();
  });
  box.addEventListener("change", render);
});
if (els.citySearch) {
  els.citySearch.addEventListener("input", () => {
    if (listedRows.length) fillCityList(listedRows);
  });
  els.citySearch.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const q = els.citySearch.value.trim().toLowerCase();
    if (!q) return;
    const hit = searchHits(listedRows, q)[0];
    if (!hit) return;
    showDetail(hit);
    flyToRow(hit);
  });
}
els.lexiconToggle.addEventListener("click", () => {
  els.lexicon.hidden = !els.lexicon.hidden;
});
if (els.eqTipBtn && els.criteriaHelp) {
  els.eqTipBtn.addEventListener("click", () => {
    const open = els.criteriaHelp.hidden;
    els.criteriaHelp.hidden = !open;
    els.eqTipBtn.setAttribute("aria-expanded", String(open));
  });
}
if (els.drawerClose) {
  els.drawerClose.addEventListener("click", () => setDrawerOpen(false));
}
if (els.drawerOpen) {
  els.drawerOpen.addEventListener("click", () => setDrawerOpen(true));
}
if (els.dockMore) {
  els.dockMore.addEventListener("click", () => {
    setDockExtra(els.dockExtra?.hidden !== false);
  });
}
if (els.resetFilters) els.resetFilters.addEventListener("click", resetFilters);
if (els.citySort) {
  els.citySort.addEventListener("change", () => {
    if (listedRows.length) fillCityList(listedRows);
  });
}
if (els.selChipClear) {
  els.selChipClear.addEventListener("click", () => {
    selectedId = null;
    restyleMarkers();
    els.detail.hidden = true;
    syncSelChip();
    syncListSelection();
  });
}
if (els.exportLlm) els.exportLlm.title = "Exporter pour un LLM";
if (els.showStations) els.showStations.addEventListener("change", render);
els.horizonNow.addEventListener("click", () => {
  document.body.classList.add("is-horizon-fade");
  horizon = "now";
  applyHorizonFilters();
  if (els.showStations) els.showStations.checked = false;
  syncViewOptions();
  els.view.value = "all";
  map.fitBounds(FRANCE_BOUNDS, { padding: [24, 24] });
  render().finally(() => {
    document.body.classList.remove("is-horizon-fade");
    refreshMapSize();
  });
});
els.horizon2050.addEventListener("click", () => {
  document.body.classList.add("is-horizon-fade");
  horizon = "2050";
  applyHorizonFilters();
  if (els.showStations) els.showStations.checked = false;
  syncViewOptions();
  els.view.value = "all";
  map.fitBounds(FRANCE_BOUNDS, { padding: [24, 24] });
  render().finally(() => {
    document.body.classList.remove("is-horizon-fade");
    refreshMapSize();
  });
});
if (els.exportLlm) {
  els.exportLlm.addEventListener("click", () => {
    exportLlmBriefing();
  });
}
if (els.compareToggle) {
  els.compareToggle.addEventListener("click", () => {
    if (horizon !== "2050") return;
    setCompareOpen(!compareOpen);
  });
}
if (els.compareClose) {
  els.compareClose.addEventListener("click", () => setCompareOpen(false));
}
els.close.addEventListener("click", () => {
  selectedId = null;
  restyleMarkers();
  els.detail.hidden = true;
  syncSelChip();
  syncListSelection();
});
if (els.compareAdd) {
  els.compareAdd.addEventListener("click", () => {
    const row =
      lastPainted.find((p) => p.s.id === selectedId)?.s ||
      compareRows.find((r) => r.id === selectedId) ||
      (selectedId === HOME.id ? homeRow() : null);
    if (row) toggleCompare(row);
    if (els.compareAdd && selectedId) {
      els.compareAdd.textContent = inCompare(selectedId)
        ? "Retirer du comparateur"
        : "Ajouter au comparateur";
    }
  });
}

map.on("click", (e) => {
  if (horizon !== "2050" || !map.hasLayer(heatLayer)) return;
  if (Date.now() - lastStationClick < 120) return;
  if (countryOn("FR")) {
    const cell = nearestDriasCell(e.latlng);
    if (cell) {
      showDriasCell(cell);
      return;
    }
  }
  const nb = nearestNeighborCell(e.latlng);
  if (nb) showDriasCell(nb);
});
let viewSyncTimer = 0;
map.on("zoomend moveend", () => {
  window.clearTimeout(viewSyncTimer);
  viewSyncTimer = window.setTimeout(() => {
    syncMassifMarkers();
    updateCityLabels();
  }, 80);
});

let payload;
try {
  payload = await fetch("./data/daily.json").then((r) => {
    if (!r.ok) throw new Error("Impossible de charger daily.json");
    return r.json();
  });
} catch (err) {
  els.period.textContent =
    "Impossible de lire les données. Lance l’app avec le serveur local, pas en ouvrant le fichier.";
  console.error(err);
  throw err;
}
const candidates = await fetch("./data/candidates.json").then((r) =>
  r.ok ? r.json() : [],
);
const airesPayload = await fetch("./data/aires.json").then((r) =>
  r.ok ? r.json() : null,
);
if (airesPayload?.aires) aires = airesPayload.aires;

data = extendDaysToToday(payload);
byStation = new Map(candidates.map((c) => [c.station, c]));
stationById = new Map(data.stations.map((s) => [s.id, s]));
const last = lastObservedIndex(data.days);
els.start.max = String(last);
els.end.max = String(last);
els.start.value = "0";
els.end.value = String(last);
setupTicks(data.days.slice(0, last + 1));
setTimeout(loadBasemap, 2000);
if (els.showStations) els.showStations.checked = false;
try {
  const saved = localStorage.getItem("ifc-drawer");
  const narrow = window.matchMedia("(max-width: 900px)").matches;
  setDrawerOpen(saved ? saved === "open" : !narrow);
} catch {
  setDrawerOpen(!window.matchMedia("(max-width: 900px)").matches);
}
setDockExtra(false);
syncViewOptions();
render();

function attachNeighborAmenities() {
  for (const city of neighbors) {
    if (city.amen) amenitiesById.set(city.id, city.amen);
  }
}

function attachAireAmenities() {
  for (const aire of aires) {
    if (aire.amen) amenitiesById.set(aire.id, aire.amen);
  }
}

function attachAir(payload) {
  airList = payload?.places || [];
  airById = new Map(airList.map((p) => [p.id, p]));
  for (const aire of aires) {
    const row = airById.get(aire.id);
    if (!row) continue;
    aire.air = row;
    if (aire.extra) aire.extra.air_ok = row.ok;
    else aire.extra = { air_ok: row.ok };
  }
}

fetch("./data/amenities.json")
  .then((r) => (r.ok ? r.json() : null))
  .then((amen) => {
    if (!amen?.stations) return;
    amenityRadius = amen.radius_km || 30;
    amenitiesById = new Map(Object.entries(amen.stations));
    attachNeighborAmenities();
    attachAireAmenities();
    render();
  })
  .catch(() => {});

fetch("./data/neighbors.json?v=es-it-dense")
  .then((r) => (r.ok ? r.json() : null))
  .then((payload) => {
    if (!payload?.stations) return;
    neighbors = payload.stations;
    attachNeighborAmenities();
    render();
  })
  .catch(() => {});

fetch("./data/air.json?v=cams1")
  .then((r) => (r.ok ? r.json() : null))
  .then((payload) => {
    if (!payload?.places) return;
    attachAir(payload);
    render();
  })
  .catch(() => {});

fetch("./data/neighbors_grid.json?v=grid21")
  .then((r) => (r.ok ? r.json() : null))
  .then((payload) => {
    if (!payload?.cells?.length) return;
    neighborGrid = payload.cells;
    render();
  })
  .catch(() => {});
