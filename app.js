const state = {
  dataset: null,
  metadata: null,
  expandedKey: null,
  promptPlan: null,
  abilityDescriptions: {},
  abilityFilterSources: null,
  items: [],
  formOverrides: {},
  speedDrawerOpen: false,
  activeTab: "help",
  setlist: [],
  box: {
    configs: [],
    teams: []
  },
  editingBoxConfigId: null,
  pendingBoxConfig: null,
  pendingImportConfig: null,
  pendingMoveSlotSelection: null
};

const elements = {
  status: document.getElementById("status"),
  helpTab: document.getElementById("help-tab"),
  setTab: document.getElementById("set-tab"),
  moveTab: document.getElementById("move-tab"),
  abilityTab: document.getElementById("ability-tab"),
  boxTab: document.getElementById("box-tab"),
  helpPanel: document.getElementById("help-panel"),
  setPanel: document.getElementById("set-panel"),
  movePanel: document.getElementById("move-panel"),
  abilityPanel: document.getElementById("ability-panel"),
  boxPanel: document.getElementById("box-panel"),
  speciesInput: document.getElementById("species-input"),
  speciesOptions: document.getElementById("species-options"),
  clearSpeciesButton: document.getElementById("clear-species-button"),
  moveInputs: [
    document.getElementById("move-input-1"),
    document.getElementById("move-input-2"),
    document.getElementById("move-input-3"),
    document.getElementById("move-input-4")
  ],
  moveOptions: document.getElementById("move-options"),
  typeInputs: [
    document.getElementById("type-input-1"),
    document.getElementById("type-input-2")
  ],
  typeOptions: document.getElementById("type-options"),
  abilitySelect: document.getElementById("ability-select"),
  sortSelect: document.getElementById("sort-select"),
  sortDirectionSelect: document.getElementById("sort-direction-select"),
  clearButton: document.getElementById("clear-button"),
  promptInput: document.getElementById("prompt-input"),
  applyPromptButton: document.getElementById("apply-prompt-button"),
  clearPromptButton: document.getElementById("clear-prompt-button"),
  speedDrawer: document.getElementById("speed-drawer"),
  speedDrawerTab: document.getElementById("speed-drawer-tab"),
  speedDrawerStatus: document.getElementById("speed-drawer-status"),
  speedTableRows: document.getElementById("speed-table-rows"),
  resultCount: document.getElementById("result-count"),
  results: document.getElementById("results"),
  moveNameSearch: document.getElementById("move-name-search"),
  moveTypeSearch: document.getElementById("move-type-search"),
  moveCategorySearch: document.getElementById("move-category-search"),
  movePrioritySearch: document.getElementById("move-priority-search"),
  moveFieldSearch: document.getElementById("move-field-search"),
  moveTargetSearch: document.getElementById("move-target-search"),
  moveClassificationSearch: document.getElementById("move-classification-search"),
  moveResultCount: document.getElementById("move-result-count"),
  moveResults: document.getElementById("move-results"),
  abilityNameSearch: document.getElementById("ability-name-search"),
  abilityToggleGrid: document.getElementById("ability-toggle-grid"),
  abilityResultCount: document.getElementById("ability-result-count"),
  abilityResults: document.getElementById("ability-results"),
  setlistItems: document.getElementById("setlist-items"),
  addSetlistButton: document.getElementById("add-setlist-button"),
  clearSetlistButton: document.getElementById("clear-setlist-button"),
  boxNameSearch: document.getElementById("box-name-search"),
  boxTeamFilter: document.getElementById("box-team-filter"),
  boxSortSelect: document.getElementById("box-sort-select"),
  boxSortDirectionSelect: document.getElementById("box-sort-direction-select"),
  boxResultsTitle: document.getElementById("box-results-title"),
  boxViewExportButton: document.getElementById("box-view-export-button"),
  boxResultCount: document.getElementById("box-result-count"),
  boxResults: document.getElementById("box-results"),
  boxSaveModal: document.getElementById("box-save-modal"),
  boxSaveNicknameInput: document.getElementById("box-save-nickname-input"),
  boxSaveTeamSelect: document.getElementById("box-save-team-select"),
  boxSaveNewTeamRow: document.getElementById("box-save-new-team-row"),
  boxSaveNewTeamInput: document.getElementById("box-save-new-team-input"),
  boxSaveConfirmButton: document.getElementById("box-save-confirm-button"),
  boxSaveCancelButton: document.getElementById("box-save-cancel-button"),
  moveSlotModal: document.getElementById("move-slot-modal"),
  moveSlotModalGrid: document.getElementById("move-slot-modal-grid"),
  moveSlotConfirmButton: document.getElementById("move-slot-confirm-button"),
  moveSlotCancelButton: document.getElementById("move-slot-cancel-button"),
  showdownText: document.getElementById("showdown-text"),
  showdownCopyButton: document.getElementById("showdown-copy-button"),
  showdownImportButton: document.getElementById("showdown-import-button"),
  showdownImportModal: document.getElementById("showdown-import-modal"),
  showdownImportPreview: document.getElementById("showdown-import-preview"),
  showdownImportConfirmButton: document.getElementById("showdown-import-confirm-button"),
  showdownImportCancelButton: document.getElementById("showdown-import-cancel-button")
};

const STAT_ALIASES = new Map([
  ["hp", "hp"],
  ["health", "hp"],
  ["attack", "attack"],
  ["atk", "attack"],
  ["physical attack", "attack"],
  ["defense", "defense"],
  ["def", "defense"],
  ["physical defense", "defense"],
  ["special attack", "specialAttack"],
  ["sp attack", "specialAttack"],
  ["sp. attack", "specialAttack"],
  ["spa", "specialAttack"],
  ["special atk", "specialAttack"],
  ["special defense", "specialDefense"],
  ["sp defense", "specialDefense"],
  ["sp. defense", "specialDefense"],
  ["spd", "specialDefense"],
  ["special def", "specialDefense"],
  ["speed", "speed"],
  ["bst", "total"],
  ["base stat total", "total"],
  ["total stats", "total"],
  ["offense", "offenseTotal"],
  ["offensive total", "offenseTotal"],
  ["defense total", "defenseTotal"],
  ["defensive total", "defenseTotal"]
]);

const SORT_LABELS = {
  alphabetical: "Alphabetical",
  dex: "Pokedex Number",
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  specialAttack: "Special Attack",
  specialDefense: "Special Defense",
  speed: "Speed",
  total: "Base Stat Total",
  offenseTotal: "Offensive Total",
  defenseTotal: "Defensive Total"
};

const SETLIST_STORAGE_KEY = "championsDataSearch.setlist";
const BOX_STORAGE_KEY = "championsDataSearch.box";
const BOX_SEED_STORAGE_KEY = "championsDataSearch.boxSeedIds";
const LEGACY_SETLIST_STORAGE_KEYS = ["championsMoveFinder.setlist"];
const LEGACY_BOX_STORAGE_KEYS = ["championsMoveFinder.box"];
const BOX_DATA_FILE = "box_data.json";

const MOVE_CATEGORY_ICON_PATHS = {
  physical: "sprites/move_category_sprites/move-physical-new.png",
  special: "sprites/move_category_sprites/move-special-new.png",
  status: "sprites/move_category_sprites/move-status-new.png"
};

const CHAMPIONS_LEVEL = 50;
const CHAMPIONS_IV = 31;
const CHAMPIONS_MAX_EVS_PER_STAT = 32;
const CHAMPIONS_MAX_TOTAL_EVS = 66;
const SHOWDOWN_MAX_EVS_PER_STAT = 252;

const STAT_ROWS = [
  ["HP", "hp"],
  ["Attack", "attack"],
  ["Defense", "defense"],
  ["Sp. Atk", "specialAttack"],
  ["Sp. Def", "specialDefense"],
  ["Speed", "speed"]
];

const NATURES = [
  { name: "Hardy", up: null, down: null },
  { name: "Lonely", up: "attack", down: "defense" },
  { name: "Brave", up: "attack", down: "speed" },
  { name: "Adamant", up: "attack", down: "specialAttack" },
  { name: "Naughty", up: "attack", down: "specialDefense" },
  { name: "Bold", up: "defense", down: "attack" },
  { name: "Docile", up: null, down: null },
  { name: "Relaxed", up: "defense", down: "speed" },
  { name: "Impish", up: "defense", down: "specialAttack" },
  { name: "Lax", up: "defense", down: "specialDefense" },
  { name: "Timid", up: "speed", down: "attack" },
  { name: "Hasty", up: "speed", down: "defense" },
  { name: "Serious", up: null, down: null },
  { name: "Jolly", up: "speed", down: "specialAttack" },
  { name: "Naive", up: "speed", down: "specialDefense" },
  { name: "Modest", up: "specialAttack", down: "attack" },
  { name: "Mild", up: "specialAttack", down: "defense" },
  { name: "Quiet", up: "specialAttack", down: "speed" },
  { name: "Bashful", up: null, down: null },
  { name: "Rash", up: "specialAttack", down: "specialDefense" },
  { name: "Calm", up: "specialDefense", down: "attack" },
  { name: "Gentle", up: "specialDefense", down: "defense" },
  { name: "Sassy", up: "specialDefense", down: "speed" },
  { name: "Careful", up: "specialDefense", down: "specialAttack" },
  { name: "Quirky", up: null, down: null }
];

const TRANSFORMING_FORMS = {
  aegislash: [{
    id: "blade",
    label: "Aegislash Blade Forme",
    shortLabel: "Blade Forme",
    baseLabel: "Shield Forme",
    stats: {
      hp: 60,
      attack: 140,
      defense: 50,
      specialAttack: 140,
      specialDefense: 50,
      speed: 60,
      total: 500
    },
    spritePath: "https://play.pokemonshowdown.com/sprites/gen5/aegislash-blade.png"
  }],
  palafin: [{
    id: "hero",
    label: "Palafin Hero Form",
    shortLabel: "Hero Form",
    baseLabel: "Zero Form",
    stats: {
      hp: 100,
      attack: 160,
      defense: 97,
      specialAttack: 106,
      specialDefense: 87,
      speed: 100,
      total: 650
    },
    spritePath: "https://play.pokemonshowdown.com/sprites/gen5/palafin-hero.png"
  }],
  gourgeist: [{
    id: "small",
    label: "Gourgeist Small",
    shortLabel: "Small",
    segmentLabel: "S",
    stats: {
      hp: 55,
      attack: 85,
      defense: 122,
      specialAttack: 58,
      specialDefense: 75,
      speed: 99,
      total: 494
    }
  }, {
    id: "base",
    label: "Gourgeist",
    shortLabel: "Medium",
    segmentLabel: "M"
  }, {
    id: "large",
    label: "Gourgeist Large",
    shortLabel: "Large",
    segmentLabel: "L",
    stats: {
      hp: 75,
      attack: 95,
      defense: 122,
      specialAttack: 58,
      specialDefense: 75,
      speed: 69,
      total: 494
    }
  }, {
    id: "jumbo",
    label: "Gourgeist Jumbo",
    shortLabel: "Jumbo",
    segmentLabel: "J",
    stats: {
      hp: 85,
      attack: 100,
      defense: 122,
      specialAttack: 58,
      specialDefense: 75,
      speed: 54,
      total: 494
    }
  }],
  basculegion: [{
    id: "female",
    label: "Basculegion Female",
    shortLabel: "Female",
    baseLabel: "Male",
    stats: {
      hp: 120,
      attack: 92,
      defense: 65,
      specialAttack: 100,
      specialDefense: 75,
      speed: 78,
      total: 530
    },
    spritePath: "https://play.pokemonshowdown.com/sprites/gen5/basculegion-f.png"
  }]
};

const SEPARATE_FORM_CARDS = {
  rotom: [{
    slugSuffix: "fan",
    name: "Rotom Fan",
    types: ["Electric", "Flying"],
    spritePath: "https://play.pokemonshowdown.com/sprites/gen5/rotom-fan.png",
    moves: ["Air Slash"]
  }, {
    slugSuffix: "frost",
    name: "Rotom Frost",
    types: ["Electric", "Ice"],
    spritePath: "https://play.pokemonshowdown.com/sprites/gen5/rotom-frost.png",
    moves: ["Blizzard"]
  }, {
    slugSuffix: "heat",
    name: "Rotom Heat",
    types: ["Electric", "Fire"],
    spritePath: "https://play.pokemonshowdown.com/sprites/gen5/rotom-heat.png",
    moves: ["Overheat"]
  }, {
    slugSuffix: "mow",
    name: "Rotom Mow",
    types: ["Electric", "Grass"],
    spritePath: "https://play.pokemonshowdown.com/sprites/gen5/rotom-mow.png",
    moves: ["Leaf Storm"]
  }, {
    slugSuffix: "wash",
    name: "Rotom Wash",
    types: ["Electric", "Water"],
    spritePath: "https://play.pokemonshowdown.com/sprites/gen5/rotom-wash.png",
    moves: ["Hydro Pump"]
  }],
  lycanroc: [{
    slugSuffix: "midnight",
    name: "Lycanroc Midnight",
    spritePath: "https://play.pokemonshowdown.com/sprites/gen5/lycanroc-midnight.png",
    stats: {
      hp: 85,
      attack: 115,
      defense: 75,
      specialAttack: 55,
      specialDefense: 75,
      speed: 82,
      total: 487
    }
  }, {
    slugSuffix: "dusk",
    name: "Lycanroc Dusk",
    spritePath: "https://play.pokemonshowdown.com/sprites/gen5/lycanroc-dusk.png",
    stats: {
      hp: 75,
      attack: 117,
      defense: 65,
      specialAttack: 55,
      specialDefense: 65,
      speed: 110,
      total: 487
    }
  }]
};

const ABILITY_TOGGLES = [
  ["passive", "Passive"],
  ["active", "Active"],
  ["user", "User"],
  ["team", "Team"],
  ["target", "Target"],
  ["opponent", "Opponent"],
  ["hp", "HP"],
  ["attack", "Attack"],
  ["defense", "Defense"],
  ["specialAttack", "Sp. Attack"],
  ["specialDefense", "Sp. Defense"],
  ["speed", "Speed"],
  ["accuracy", "Accuracy"],
  ["evasion", "Evasion"],
  ["priority", "Priority"],
  ["typeEffect", "Type Effect"],
  ["weatherTerrain", "Weather / Terrain"]
];

const ABILITY_STAT_OVERRIDES = {
  attack: [
    "Anger Point",
    "Beast Boost",
    "Chilling Neigh",
    "Costar",
    "Download",
    "Eelevate",
    "Defiant",
    "Embody Aspect",
    "Flower Gift",
    "Guts",
    "Huge Power",
    "Hustle",
    "Intimidate",
    "Moxie",
    "Moody",
    "Opportunist",
    "Orichalcum Pulse",
    "Protosynthesis",
    "Pure Power",
    "Quark Drive",
    "Slow Start",
    "Supreme Overlord",
    "Toxic Boost",
    "Wind Rider"
  ],
  defense: [
    "Costar",
    "Dauntless Shield",
    "Eelevate",
    "Embody Aspect",
    "Fur Coat",
    "Grass Pelt",
    "Marvel Scale",
    "Moody",
    "Opportunist",
    "Protosynthesis",
    "Quark Drive",
    "Stamina",
    "Water Compaction",
    "Weak Armor",
    "Well-Baked Body"
  ],
  specialAttack: [
    "Berserk",
    "Competitive",
    "Costar",
    "Download",
    "Eelevate",
    "Electromorphosis",
    "Flare Boost",
    "Grim Neigh",
    "Hadron Engine",
    "Minus",
    "Moody",
    "Opportunist",
    "Plus",
    "Protosynthesis",
    "Quark Drive",
    "Solar Power",
    "Supreme Overlord",
    "Wind Power"
  ],
  specialDefense: [
    "Costar",
    "Eelevate",
    "Embody Aspect",
    "Flower Gift",
    "Ice Scales",
    "Moody",
    "Opportunist",
    "Protosynthesis",
    "Quark Drive"
  ],
  speed: [
    "Chlorophyll",
    "Costar",
    "Eelevate",
    "Embody Aspect",
    "Moody",
    "Opportunist",
    "Protosynthesis",
    "Quick Feet",
    "Quark Drive",
    "Sand Rush",
    "Slush Rush",
    "Slow Start",
    "Speed Boost",
    "Steam Engine",
    "Surge Surfer",
    "Swift Swim",
    "Unburden",
    "Weak Armor"
  ],
  accuracy: [
    "Costar",
    "Compoundeyes",
    "Hustle",
    "Keen Eye",
    "Moody",
    "No Guard",
    "Opportunist",
    "Tangled Feet"
  ],
  evasion: [
    "Costar",
    "Moody",
    "Opportunist",
    "Sand Veil",
    "Snow Cloak",
    "Supersweet Syrup",
    "Tangled Feet"
  ]
};

const LOCAL_ABILITY_FILTER_ADDITIONS = {
  active: ["Eelevate"],
  weatherTerrain: ["Mega Sol"],
  typeEffect: ["Effect Spore"],
  target: ["Illusion"]
};

const LOCAL_ABILITY_FILTER_REMOVALS = {
  opponent: ["Illusion"]
};

const FIELD_RELATION_CATEGORIES = {
  sun: {
    label: "sun",
    aliases: ["sun", "sunny", "sunlight", "solar"],
    abilities: ["Drought", "Chlorophyll", "Solar Power", "Leaf Guard", "Harvest", "Flower Gift", "Forecast", "Mega Sol"],
    moves: ["Sunny Day", "Solar Beam", "Solar Blade", "Weather Ball", "Morning Sun", "Synthesis", "Growth"]
  },
  rain: {
    label: "rain",
    aliases: ["rain", "rainy"],
    abilities: ["Drizzle", "Swift Swim", "Rain Dish", "Hydration", "Dry Skin", "Forecast"],
    moves: ["Rain Dance", "Thunder", "Hurricane", "Weather Ball"]
  },
  sand: {
    label: "sand",
    aliases: ["sand", "sandstorm"],
    abilities: ["Sand Stream", "Sand Spit", "Sand Rush", "Sand Force", "Sand Veil"],
    moves: ["Sandstorm", "Weather Ball"]
  },
  snow: {
    label: "snow",
    aliases: ["snow", "hail", "snowscape"],
    abilities: ["Snow Warning", "Slush Rush", "Snow Cloak", "Ice Body", "Forecast"],
    moves: ["Snowscape", "Aurora Veil", "Blizzard", "Weather Ball"]
  },
  electricTerrain: {
    label: "Electric Terrain",
    aliases: ["electric terrain"],
    abilities: ["Electric Surge", "Surge Surfer", "Mimicry"],
    moves: ["Electric Terrain", "Terrain Pulse", "Rising Voltage"]
  },
  psychicTerrain: {
    label: "Psychic Terrain",
    aliases: ["psychic terrain"],
    abilities: ["Psychic Surge", "Mimicry"],
    moves: ["Psychic Terrain", "Expanding Force", "Terrain Pulse"]
  },
  grassyTerrain: {
    label: "Grassy Terrain",
    aliases: ["grassy terrain", "grass terrain"],
    abilities: ["Grassy Surge", "Mimicry"],
    moves: ["Grassy Terrain", "Grassy Glide", "Terrain Pulse"]
  },
  mistyTerrain: {
    label: "Misty Terrain",
    aliases: ["misty terrain"],
    abilities: ["Misty Surge", "Mimicry"],
    moves: ["Misty Terrain", "Misty Explosion", "Terrain Pulse"]
  },
  weather: {
    label: "weather",
    aliases: ["weather"],
    include: ["sun", "rain", "sand", "snow"],
    abilities: ["Cloud Nine", "Forecast"],
    moves: ["Weather Ball"]
  },
  terrain: {
    label: "terrain",
    aliases: ["terrain"],
    include: ["electricTerrain", "psychicTerrain", "grassyTerrain", "mistyTerrain"],
    abilities: ["Mimicry", "Surge Surfer"],
    moves: ["Terrain Pulse"]
  }
};

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/é/g, "e")
    .replace(/♀/g, "f")
    .replace(/♂/g, "m")
    .replace(/['’.\-]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function matchesAbilityName(left, right) {
  return normalizeName(left) === normalizeName(right);
}

function getAbilitySourceGroup(groupKey) {
  return state.abilityFilterSources?.filters?.[groupKey]?.abilities || [];
}

function hasAbilitySourceMatch(name, groupKey) {
  return getAbilitySourceGroup(groupKey).some(sourceName => matchesAbilityName(sourceName, name));
}

function hasLocalAbilityFilterAddition(name, tag) {
  return (LOCAL_ABILITY_FILTER_ADDITIONS[tag] || []).some(filterName => matchesAbilityName(filterName, name));
}

function hasLocalAbilityFilterRemoval(name, tag) {
  return (LOCAL_ABILITY_FILTER_REMOVALS[tag] || []).some(filterName => matchesAbilityName(filterName, name));
}

function setStatus(text) {
  elements.status.textContent = text;
}

function setSpeedDrawerStatus(text) {
  elements.speedDrawerStatus.textContent = text;
}

function canonicalName(input, options) {
  const normalized = normalizeName(input);
  return options.find(option => normalizeName(option) === normalized) || null;
}

function getAbilityDescription(abilityName) {
  const entry = state.abilityDescriptions[normalizeName(abilityName)];
  return entry?.byGeneration?.["9"] || entry?.latest || "Description unavailable.";
}

function getDetailedAbilityDescription(abilityName) {
  const entry = state.abilityDescriptions[normalizeName(abilityName)];
  if (!entry) {
    if (abilityName === "Dragonize") {
      return "Normal-type moves become Dragon-type and receive a Pixilate-style power boost.";
    }
    if (abilityName === "Eelevate") {
      return "Raises this Pokemon's highest stat by one stage when it faints another Pokemon.";
    }
    if (abilityName === "Mega Sol") {
      return "The user's attacks act as if sun is active regardless of the actual weather.";
    }
    if (abilityName === "Piercing Drill") {
      return "Moves hit through protecting targets for reduced damage.";
    }
    if (abilityName === "Spicy Spray") {
      return "Burns attackers that trigger the ability.";
    }
    return "Description unavailable.";
  }
  const latestGen = entry.byGeneration?.["9"];
  return [latestGen && latestGen !== entry.latest ? latestGen : "", entry.latest]
    .filter(Boolean)
    .join(" ");
}

function canonicalExistingNames(names, options) {
  const seen = new Set();
  const matches = [];
  for (const name of names) {
    const canonical = canonicalName(name, options);
    if (!canonical) {
      continue;
    }
    const key = normalizeName(canonical);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    matches.push(canonical);
  }
  return matches;
}

function expandSeparateFormCards(speciesList) {
  const expanded = [];

  for (const species of speciesList) {
    expanded.push(species);
    for (const form of SEPARATE_FORM_CARDS[species.slug] || []) {
      const stats = form.stats || {
        hp: 50,
        attack: 65,
        defense: 107,
        specialAttack: 105,
        specialDefense: 107,
        speed: 86,
        total: 520
      };
      expanded.push({
        ...species,
        slug: `${species.slug}-${form.slugSuffix}`,
        primaryName: form.name,
        availableNames: [form.name],
        types: form.types || species.types,
        baseStats: stats,
        spritePath: form.spritePath || species.spritePath,
        moves: [...new Set([...(species.moves || []), ...(form.moves || [])])],
        megaEvolution: null,
        megaEvolutions: [],
        sourceSpeciesSlug: species.slug,
        isSeparateFormCard: true
      });
    }
  }

  return expanded;
}

function getAllAbilityNames() {
  const names = [
    ...(state.dataset?.abilityNames || []),
    ...((state.dataset?.species || []).flatMap(species =>
      getAvailableForms(species).flatMap(form => form.abilities || [])
    ))
  ];

  return [...new Set(names)].sort((left, right) => left.localeCompare(right));
}

function populateOptions() {
  elements.moveOptions.innerHTML = "";
  for (const moveName of state.dataset.moveNames) {
    const option = document.createElement("option");
    option.value = moveName;
    elements.moveOptions.appendChild(option);
  }

  elements.typeOptions.innerHTML = "";
  for (const typeName of state.dataset.typeNames) {
    const option = document.createElement("option");
    option.value = typeName;
    elements.typeOptions.appendChild(option);
  }

  elements.speciesOptions.innerHTML = "";
  const speciesNames = [...new Set(state.dataset.species.flatMap(species => species.availableNames || [species.primaryName]))]
    .sort((left, right) => left.localeCompare(right));
  for (const speciesName of speciesNames) {
    const option = document.createElement("option");
    option.value = speciesName;
    elements.speciesOptions.appendChild(option);
  }

  elements.abilitySelect.innerHTML = '<option value="">Any ability</option>';
  for (const abilityName of getAllAbilityNames()) {
    const option = document.createElement("option");
    option.value = abilityName;
    option.textContent = abilityName;
    elements.abilitySelect.appendChild(option);
  }
  syncSelectPlaceholder(elements.abilitySelect);

  populateSelect(elements.moveTypeSearch, state.metadata.moveFilters.types, "Any type");
  populateSelect(elements.moveCategorySearch, state.metadata.moveFilters.categories.filter(name => name !== "Unknown"), "Any category");
  populateSelect(elements.moveFieldSearch, state.metadata.moveFilters.weatherTerrain, "Any field state");
  populateSelect(elements.moveTargetSearch, state.metadata.moveFilters.targets || [], "Any target");
  populateSelect(elements.moveClassificationSearch, state.metadata.moveFilters.classifications, "Any classification");
  renderAbilityToggles();
}

function populateSelect(select, options, defaultText) {
  select.innerHTML = `<option value="">${defaultText}</option>`;
  for (const optionName of options) {
    const option = document.createElement("option");
    option.value = optionName;
    option.textContent = optionName;
    select.appendChild(option);
  }
}

function syncSelectPlaceholder(select) {
  select.classList.toggle("placeholder-selected", !select.value);
}

function renderAbilityToggles() {
  elements.abilityToggleGrid.innerHTML = ABILITY_TOGGLES.map(([key, label]) => `
    <label class="toggle-pill">
      <input type="checkbox" value="${key}">
      <span>${label}</span>
    </label>
  `).join("");
  for (const input of elements.abilityToggleGrid.querySelectorAll("input")) {
    input.addEventListener("change", renderAbilitySearch);
  }
}

function getSelectedMoves() {
  return elements.moveInputs
    .map(input => canonicalName(input.value, state.dataset.moveNames))
    .filter(Boolean);
}

function getSelectedTypes() {
  return elements.typeInputs
    .map(input => canonicalName(input.value, state.dataset.typeNames))
    .filter(Boolean);
}

function getSelectedAbility() {
  return elements.abilitySelect.value || "";
}

function getSpeciesSearchQuery() {
  return elements.speciesInput.value.trim();
}

function getSelectedSort() {
  return elements.sortSelect.value || "alphabetical";
}

function getSelectedSortDirection() {
  return elements.sortDirectionSelect.value || "asc";
}

function getActiveSortPlan() {
  return state.promptPlan?.sorts?.length
    ? state.promptPlan.sorts
    : [{ key: getSelectedSort(), direction: getSelectedSortDirection() }];
}

function statDirectionForKey(sortKey, direction) {
  if (sortKey === "alphabetical" || sortKey === "dex") {
    return direction;
  }
  return direction === "asc" ? "low to high" : "high to low";
}

function getSortValueForStats(stats, sortKey) {
  const safeStats = stats || {};

  switch (sortKey) {
    case "hp":
      return safeStats.hp || 0;
    case "attack":
      return safeStats.attack || 0;
    case "defense":
      return safeStats.defense || 0;
    case "specialAttack":
      return safeStats.specialAttack || 0;
    case "specialDefense":
      return safeStats.specialDefense || 0;
    case "speed":
      return safeStats.speed || 0;
    case "total":
      return safeStats.total || 0;
    case "offenseTotal":
      return (safeStats.attack || 0) + (safeStats.specialAttack || 0);
    case "defenseTotal":
      return (safeStats.defense || 0) + (safeStats.specialDefense || 0);
    default:
      return 0;
  }
}

function getAvailableForms(species) {
  const forms = [{
    id: "base",
    label: species.primaryName,
    shortLabel: TRANSFORMING_FORMS[species.slug]?.[0]?.baseLabel || "Base form",
    stats: species.baseStats,
    abilities: species.abilities,
    spritePath: species.spritePath,
    types: species.types,
    isMega: false
  }];

  const megaForms = Array.isArray(species.megaEvolutions) && species.megaEvolutions.length
    ? species.megaEvolutions
    : (species.megaEvolution ? [species.megaEvolution] : []);

  for (const megaForm of megaForms) {
    forms.push({
      id: megaForm.formId || "mega",
      label: megaForm.name,
      shortLabel: megaForm.name.replace(/^Mega\s+/i, "") || "Mega Form",
      stats: megaForm.baseStats,
      abilities: megaForm.abilities,
      spritePath: megaForm.spritePath,
      types: megaForm.types,
      isMega: true
    });
  }

  for (const form of TRANSFORMING_FORMS[species.slug] || []) {
    if (form.id === "base") {
      Object.assign(forms[0], {
        label: form.label || forms[0].label,
        shortLabel: form.shortLabel || forms[0].shortLabel,
        segmentLabel: form.segmentLabel,
        stats: form.stats || forms[0].stats,
        abilities: form.abilities || forms[0].abilities,
        spritePath: form.spritePath || forms[0].spritePath,
        types: form.types || forms[0].types,
        isAlternate: true
      });
      continue;
    }

    forms.push({
      id: form.id,
      label: form.label,
      shortLabel: form.shortLabel || form.label,
      segmentLabel: form.segmentLabel,
      stats: form.stats,
      abilities: form.abilities || species.abilities,
      spritePath: form.spritePath || species.spritePath,
      types: form.types || species.types,
      isMega: false,
      isAlternate: true
    });
  }

  return forms;
}

function compareFormValues(leftValue, rightValue, sortKey, direction) {
  if (sortKey === "alphabetical" || sortKey === "dex") {
    return 0;
  }
  if (leftValue === rightValue) {
    return 0;
  }
  return direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
}

function chooseAutoForm(species, sortPlan = getActiveSortPlan()) {
  const forms = getAvailableForms(species);
  if (forms.length < 2) {
    return forms[0];
  }

  const comparableSteps = sortPlan.filter(step => !["alphabetical", "dex"].includes(step.key));
  if (!comparableSteps.length) {
    return forms[0];
  }

  return [...forms].sort((left, right) => {
    for (const step of comparableSteps) {
      const leftValue = getSortValueForStats(left.stats, step.key);
      const rightValue = getSortValueForStats(right.stats, step.key);
      const comparison = compareFormValues(leftValue, rightValue, step.key, step.direction);
      if (comparison !== 0) {
        return comparison;
      }
    }
    return forms.findIndex(form => form.id === left.id) - forms.findIndex(form => form.id === right.id);
  })[0];
}

function getFormById(species, formId) {
  return getAvailableForms(species).find(form => form.id === formId) || getAvailableForms(species)[0];
}

function getDisplayForm(species, sortPlan = getActiveSortPlan()) {
  const override = state.formOverrides[species.slug];
  if (override && getAvailableForms(species).some(form => form.id === override)) {
    return getFormById(species, override);
  }
  return chooseAutoForm(species, sortPlan);
}

function getEntryKey(entry) {
  return `${entry.species.slug}:${entry.formMode}`;
}

function getDisplayFormForEntry(entry, sortPlan = getActiveSortPlan()) {
  if (entry.formMode !== "auto") {
    return getFormById(entry.species, entry.formMode);
  }
  return getDisplayForm(entry.species, sortPlan);
}

function compareEntriesBySortPlan(leftEntry, rightEntry, sortPlan = getActiveSortPlan()) {
  const left = leftEntry.species;
  const right = rightEntry.species;
  const leftForm = getDisplayFormForEntry(leftEntry, sortPlan);
  const rightForm = getDisplayFormForEntry(rightEntry, sortPlan);

  for (const sortStep of sortPlan) {
    const { key: sortKey, direction } = sortStep;
    let comparison = 0;

    if (sortKey === "alphabetical") {
      comparison = left.primaryName.localeCompare(right.primaryName) || left.dexNo - right.dexNo;
      if (direction === "desc") {
        comparison *= -1;
      }
    } else if (sortKey === "dex") {
      comparison = left.dexNo - right.dexNo || left.primaryName.localeCompare(right.primaryName);
      if (direction === "desc") {
        comparison *= -1;
      }
    } else {
      const leftValue = getSortValueForStats(leftForm.stats, sortKey);
      const rightValue = getSortValueForStats(rightForm.stats, sortKey);
      comparison = compareFormValues(leftValue, rightValue, sortKey, direction);
      if (comparison === 0) {
        comparison = left.primaryName.localeCompare(right.primaryName) || left.dexNo - right.dexNo;
      }
    }

    if (comparison !== 0) {
      return comparison;
    }
  }

  return left.primaryName.localeCompare(right.primaryName) || left.dexNo - right.dexNo;
}

function sortMatches(speciesList) {
  const sortPlan = getActiveSortPlan();
  return [...speciesList].sort((left, right) => compareEntriesBySortPlan(left, right, sortPlan));
}

function getSpeciesSearchNames(species) {
  return [
    species.primaryName,
    ...(species.availableNames || []),
    ...((species.megaEvolutions || []).map(form => form.name)),
    species.megaEvolution?.name || ""
  ].filter(Boolean);
}

function scoreSpeciesNameMatch(species, query) {
  if (!query) {
    return 0;
  }

  const scores = getSpeciesSearchNames(species).map(name => {
    const normalizedName = normalizeName(name);
    if (normalizedName === query) {
      return 0;
    }
    if (normalizedName.startsWith(query)) {
      return 1;
    }
    const index = normalizedName.indexOf(query);
    return index >= 0 ? 2 + index : Infinity;
  });

  return Math.min(...scores);
}

function getPromptFocusedMatches(speciesList) {
  if (!state.promptPlan?.sorts?.length || state.promptPlan.sorts.length < 2) {
    return sortMatches(speciesList);
  }

  const [primarySort, ...secondarySorts] = state.promptPlan.sorts;
  const primaryOrdered = sortMatchesWithPlan(speciesList, [primarySort]);
  const focusCount = Math.max(12, Math.min(48, Math.round(primaryOrdered.length * 0.3)));
  const focusedPool = primaryOrdered.slice(0, focusCount);

  return sortMatchesWithPlan(focusedPool, [...secondarySorts, primarySort]);
}

function sortMatchesWithPlan(speciesList, sortPlan) {
  const savedPlan = state.promptPlan;
  state.promptPlan = { ...(savedPlan || {}), sorts: sortPlan };
  const sorted = sortMatches(speciesList);
  state.promptPlan = savedPlan;
  return sorted;
}

function getMatches() {
  const speciesQuery = normalizeName(getSpeciesSearchQuery());
  const requiredMoves = getSelectedMoves().map(normalizeName);
  const requiredTypes = getSelectedTypes().map(normalizeName);
  const requiredAbility = normalizeName(getSelectedAbility());
  const relationFilters = state.promptPlan?.relations || [];
  const hasFormAbilityFilter = Boolean(requiredAbility || relationFilters.some(filter => filter.abilities.length));

  const matchedSpecies = state.dataset.species.filter(species => {
    const moveSet = new Set(species.moves.map(normalizeName));
    const typeSet = new Set(species.types.map(normalizeName));

    return requiredMoves.every(moveName => moveSet.has(moveName)) &&
      requiredTypes.every(typeName => typeSet.has(typeName)) &&
      (!speciesQuery || Number.isFinite(scoreSpeciesNameMatch(species, speciesQuery)));
  });

  const candidateEntries = matchedSpecies.flatMap(species => {
    const forms = getAvailableForms(species);
    if (forms.length > 1 && (state.promptPlan?.sorts?.length || hasFormAbilityFilter)) {
      return forms.map(form => ({ species, formMode: form.id }));
    }
    return [{ species, formMode: "auto" }];
  });

  const matches = candidateEntries.filter(entry => {
    const form = getDisplayFormForEntry(entry);
    const moveSet = new Set(entry.species.moves.map(normalizeName));
    const abilitySet = new Set((form.abilities || []).map(normalizeName));
    const matchesRelationFilters = relationFilters.every(filter => {
      const relatedMoves = filter.moves.map(normalizeName);
      const relatedAbilities = filter.abilities.map(normalizeName);
      return relatedMoves.some(moveName => moveSet.has(moveName)) ||
        relatedAbilities.some(abilityName => abilitySet.has(abilityName));
    });

    return (!requiredAbility || abilitySet.has(requiredAbility)) &&
      matchesRelationFilters;
  });

  return state.promptPlan?.sorts?.length > 1
    ? getPromptFocusedMatches(matches)
    : sortMatches(matches);
}

function hasActiveFilters() {
  return Boolean(getSpeciesSearchQuery() ||
    getSelectedMoves().length ||
    getSelectedTypes().length ||
    getSelectedAbility() ||
    state.promptPlan?.relations?.length);
}

function hasActiveSearch() {
  return hasActiveFilters();
}

function getActiveMoveMatchNames() {
  const names = [
    ...getSelectedMoves(),
    ...((state.promptPlan?.relations || []).flatMap(filter => filter.moves || []))
  ];
  const seen = new Set();
  return names.filter(name => {
    const key = normalizeName(name);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getActiveAbilityMatchNames() {
  const names = [
    getSelectedAbility(),
    ...((state.promptPlan?.relations || []).flatMap(filter => filter.abilities || []))
  ].filter(Boolean);
  const seen = new Set();
  return names.filter(name => {
    const key = normalizeName(name);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getHighlightedStatKeys() {
  const sortPlan = getActiveSortPlan();

  const highlighted = new Set();
  for (const sort of sortPlan) {
    switch (sort.key) {
      case "hp":
      case "attack":
      case "defense":
      case "specialAttack":
      case "specialDefense":
      case "speed":
      case "total":
        highlighted.add(sort.key);
        break;
      case "offenseTotal":
        highlighted.add("attack");
        highlighted.add("specialAttack");
        break;
      case "defenseTotal":
        highlighted.add("defense");
        highlighted.add("specialDefense");
        break;
      default:
        break;
    }
  }

  return highlighted;
}

function formatStats(stats) {
  if (!stats) {
    return "";
  }

  const highlighted = getHighlightedStatKeys();
  const rows = [
    ["HP", "hp", stats.hp],
    ["Atk", "attack", stats.attack],
    ["Def", "defense", stats.defense],
    ["SpA", "specialAttack", stats.specialAttack],
    ["SpD", "specialDefense", stats.specialDefense],
    ["Spe", "speed", stats.speed],
    ["BST", "total", stats.total]
  ];

  return rows.map(([label, key, value]) => `
    <div class="stat-cell${highlighted.has(key) ? " highlighted-stat" : ""}">
      <span class="stat-label">${label}</span>
      <span class="stat-value">${value}</span>
    </div>
  `).join("");
}

function formatTypeIcon(typeName) {
  const normalizedType = normalizeName(typeName);
  if (!normalizedType || normalizedType === "unknown") {
    return `<span class="meta">Unknown type</span>`;
  }
  return `<span class="type-icon type-${normalizedType}">${typeName}</span>`;
}

function formatTypeIcons(typeNames) {
  const types = (typeNames || []).filter(Boolean);
  return types.length
    ? types.map(formatTypeIcon).join("")
    : `<span class="meta">Unknown type</span>`;
}

function formatItemOptions(selectedItem = "") {
  const items = [...state.items];
  if (selectedItem && !items.some(item => normalizeName(item.name) === normalizeName(selectedItem))) {
    items.push({ name: selectedItem });
  }
  return items
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(item => `<option value="${item.name}"${normalizeName(item.name) === normalizeName(selectedItem) ? " selected" : ""}>${item.name}</option>`)
    .join("");
}

function formatMoveCategoryIcon(categoryName) {
  const normalizedCategory = normalizeName(categoryName);
  const iconPath = MOVE_CATEGORY_ICON_PATHS[normalizedCategory];
  if (!iconPath) {
    return `<span class="meta">${categoryName || "Unknown category"}</span>`;
  }
  return `<img class="move-category-icon" src="${iconPath}" alt="${categoryName}" title="${categoryName}">`;
}

function formatMovePowerLabel(move) {
  if (normalizeName(move.category) === "status") {
    return "BP: -";
  }
  return `BP: ${move.power || "variable"}`;
}

function formatMoveAccuracyLabel(move) {
  return `Acc: ${Number.isFinite(move.accuracy) && move.accuracy !== 101 ? `${move.accuracy}%` : "-"}`;
}

function formatMovePpLabel(move) {
  return `PP: ${Number.isFinite(move.pp) ? move.pp : "-"}`;
}

function formatMoveTargetLabel(move) {
  return `Target: ${move.target || "-"}`;
}

function formatMovePriorityLabel(priority) {
  const numericPriority = Number(priority) || 0;
  const priorityClass = numericPriority > 0
    ? "positive"
    : numericPriority < 0
      ? "negative"
      : "neutral";
  return `<span class="priority-badge priority-${priorityClass}">${numericPriority >= 0 ? "+" : ""}${numericPriority}</span>`;
}

function getMoveDisplayClassifications(move) {
  return (move.classification || []).filter(classification => classification !== "secondary effect");
}

function getMoveMetadata(moveName) {
  return state.metadata.moves.find(move => normalizeName(move.name) === normalizeName(moveName));
}

function formatMoveDataRow(move, { includeSendButton = true, learnpoolPick = false } = {}) {
  const classifications = getMoveDisplayClassifications(move);
  return `
    <article class="data-row move-row${learnpoolPick ? " learnpool-pick-row" : ""} type-border-${normalizeName(move.type)}"${learnpoolPick ? ` data-move-name="${move.name}" tabindex="0" role="button" aria-label="Add ${move.name} to move slot"` : ""}>
      <div class="move-primary">
        <div class="move-title-meta">
          <div class="row-title">${move.name}</div>
          <div class="row-meta move-metadata">${formatMovePowerLabel(move)} | ${formatMoveAccuracyLabel(move)} | ${formatMovePpLabel(move)} | ${formatMoveTargetLabel(move)}</div>
        </div>
        <div class="move-priority-corner">${formatMovePriorityLabel(move.priority)}</div>
      </div>
      <div class="row-meta move-badge-cell">${formatTypeIcons([move.type])}</div>
      <div class="row-meta move-badge-cell">${formatMoveCategoryIcon(move.category)}</div>
      <div class="move-copy${classifications.length ? " has-classification" : ""}">
        <div class="row-description">${move.description}</div>
        ${classifications.length ? `<div class="move-classifications">${classifications.join(", ")}</div>` : ""}
      </div>
      ${includeSendButton ? `<button type="button" class="secondary send-setlist-button" data-kind="move" data-name="${move.name}">Send to Setlist</button>` : ""}
    </article>
  `;
}

function getNextManualForm(species) {
  const forms = getAvailableForms(species);
  const current = getDisplayForm(species);
  const currentIndex = Math.max(0, forms.findIndex(form => form.id === current.id));
  return forms[(currentIndex + 1) % forms.length];
}

function getFormToggleButtonText(species) {
  const nextForm = getNextManualForm(species);
  return `Show ${nextForm.shortLabel || nextForm.label}`;
}

function getSegmentedFormControls(species, displayForm) {
  const segmentOrder = new Map(["S", "M", "L", "J"].map((label, index) => [label, index]));
  const segmentedForms = getAvailableForms(species)
    .filter(form => form.segmentLabel)
    .sort((left, right) => (segmentOrder.get(left.segmentLabel) ?? 99) - (segmentOrder.get(right.segmentLabel) ?? 99));
  if (!segmentedForms.length) {
    return "";
  }

  return `
    <div class="form-segment-control" role="group" aria-label="${species.primaryName} form">
      ${segmentedForms.map(form => `
        <button type="button" class="secondary form-segment-button${form.id === displayForm.id ? " active" : ""}" data-form-id="${form.id}" title="${form.shortLabel || form.label}">
          ${form.segmentLabel}
        </button>
      `).join("")}
    </div>
  `;
}

function getManualFormControl(species, displayForm) {
  const segmentedControls = getSegmentedFormControls(species, displayForm);
  if (segmentedControls) {
    return segmentedControls;
  }

  return `<button type="button" class="secondary form-toggle-button">${getFormToggleButtonText(species)}</button>`;
}

function formatMoveList(moves) {
  const moveEntries = moves.map(moveName => ({
    name: moveName,
    metadata: getMoveMetadata(moveName)
  }));
  const grouped = new Map();
  for (const entry of moveEntries) {
    const typeName = entry.metadata?.type || "Unknown";
    if (!grouped.has(typeName)) {
      grouped.set(typeName, []);
    }
    grouped.get(typeName).push(entry);
  }

  return [...grouped.entries()]
    .sort(([leftType], [rightType]) => leftType.localeCompare(rightType))
    .map(([typeName, entries]) => `
      <section class="learnpool-type-group">
        <h5>${formatTypeIcons(typeName === "Unknown" ? [] : [typeName])}</h5>
        <div class="learnpool-move-rows">
          ${entries
            .sort((left, right) => left.name.localeCompare(right.name))
            .map(entry => entry.metadata
              ? formatMoveDataRow(entry.metadata, { includeSendButton: false, learnpoolPick: true })
              : `<article class="data-row move-row learnpool-missing-row"><div class="row-title">${entry.name}</div><div class="row-description">Move data unavailable.</div></article>`)
            .join("")}
        </div>
      </section>
    `).join("");
}

function formatExpandedMoveDropdowns(species) {
  return Array.from({ length: 4 }, (_, index) => {
    const options = species.moves
      .map(moveName => `<option value="${moveName}">${moveName}</option>`)
      .join("");
    return `
      <label class="expanded-move-select">
        <span>Move ${index + 1}</span>
        <select class="expanded-move-input">
          <option value="">-</option>
          ${options}
        </select>
      </label>
    `;
  }).join("");
}

function formatExpandedSetDropdowns(species, displayForm) {
  const abilityOptions = (displayForm.abilities || [])
    .map(ability => `<option value="${ability}">${ability}</option>`)
    .join("");

  return `
    <div class="expanded-move-grid">
      ${formatExpandedMoveDropdowns(species)}
    </div>
    <div class="expanded-set-selects">
      <label class="expanded-move-select expanded-ability-select">
        <span>Ability</span>
        <select class="expanded-ability-input">
          <option value="">-</option>
          ${abilityOptions || `<option value="">Unknown</option>`}
        </select>
      </label>
      <label class="expanded-move-select expanded-item-select">
        <span>Item</span>
        <select>
          <option value="">-</option>
          ${formatItemOptions()}
        </select>
      </label>
    </div>
  `;
}

function getNatureModifier(statKey, nature) {
  if (statKey === "hp") {
    return 1;
  }
  if (nature?.up === statKey) {
    return 1.1;
  }
  if (nature?.down === statKey) {
    return 0.9;
  }
  return 1;
}

function calculateChampionsStat(base, statKey, evs, nature) {
  const safeBase = Number(base) || 0;
  const safeEvs = Math.max(0, Math.min(CHAMPIONS_MAX_EVS_PER_STAT, Number(evs) || 0));
  const baseValue = Math.floor(((2 * safeBase + CHAMPIONS_IV + (safeEvs * 2)) * CHAMPIONS_LEVEL) / 100);
  if (statKey === "hp") {
    return baseValue + CHAMPIONS_LEVEL + 10;
  }
  return Math.floor((baseValue + 5) * getNatureModifier(statKey, nature));
}

function formatAdjustableStatTable(stats) {
  const neutralNature = NATURES[0];
  const highlighted = getHighlightedStatKeys();

  return `
    <div class="expanded-stat-table" data-total-evs="0">
      ${STAT_ROWS.map(([label, key]) => {
        const value = stats?.[key];
        const numericValue = Number(value) || 0;
        return `
          <div class="expanded-stat-row${highlighted.has(key) ? " highlighted-stat-row" : ""}">
            <span class="expanded-stat-name">${label}</span>
            <span class="expanded-stat-value">${numericValue}</span>
            <span class="expanded-stat-bar"><span style="width: 0%"></span></span>
            <input class="expanded-stat-ev" type="number" min="0" max="${CHAMPIONS_MAX_EVS_PER_STAT}" step="1" value="0" data-stat="${key}" aria-label="${label} EVs">
            <span class="expanded-stat-final" data-stat="${key}">${calculateChampionsStat(numericValue, key, 0, neutralNature)}</span>
          </div>
        `;
      }).join("")}
      <div class="expanded-stat-alignment">
        <label class="expanded-nature-select">
          <span>Stat Alignment</span>
          <select class="expanded-nature-input">
            ${NATURES.map(nature => `<option value="${nature.name}">${nature.name}</option>`).join("")}
          </select>
        </label>
        <span class="expanded-ev-total">0/${CHAMPIONS_MAX_TOTAL_EVS}</span>
      </div>
    </div>
  `;
}

function formatAbilityDetails(abilities) {
  if (!abilities?.length) {
    return `<div class="meta">No listed abilities.</div>`;
  }

  return abilities.map(ability => `
    <div class="ability-entry">
      <div class="ability-name">${ability}</div>
      <div class="ability-description">${getAbilityDescription(ability)}</div>
    </div>
  `).join("");
}

function getNatureByName(name) {
  return NATURES.find(nature => nature.name === name) || NATURES[0];
}

function getExpandedStatInputs(table) {
  return [...table.querySelectorAll(".expanded-stat-ev")];
}

function clampExpandedEvInput(input, table) {
  const inputs = getExpandedStatInputs(table);
  let value = Math.max(0, Math.min(CHAMPIONS_MAX_EVS_PER_STAT, Math.floor(Number(input.value) || 0)));
  const otherTotal = inputs
    .filter(otherInput => otherInput !== input)
    .reduce((total, otherInput) => total + (Number(otherInput.value) || 0), 0);
  value = Math.min(value, Math.max(0, CHAMPIONS_MAX_TOTAL_EVS - otherTotal));
  input.value = String(value);
}

function syncExpandedStatTable(table) {
  const nature = getNatureByName(table.querySelector(".expanded-nature-input")?.value);
  const inputs = getExpandedStatInputs(table);
  const totalEvs = inputs.reduce((total, input) => total + (Number(input.value) || 0), 0);
  const totalElement = table.querySelector(".expanded-ev-total");
  if (totalElement) {
    totalElement.textContent = `${totalEvs}/${CHAMPIONS_MAX_TOTAL_EVS}`;
  }

  for (const input of inputs) {
    const statKey = input.dataset.stat;
    const row = input.closest(".expanded-stat-row");
    const baseValue = Number(row?.querySelector(".expanded-stat-value")?.textContent) || 0;
    const evs = Number(input.value) || 0;
    const bar = row?.querySelector(".expanded-stat-bar span");
    const finalValue = row?.querySelector(".expanded-stat-final");
    if (bar) {
      bar.style.width = `${Math.min(100, (evs / CHAMPIONS_MAX_EVS_PER_STAT) * 100)}%`;
    }
    if (finalValue) {
      finalValue.textContent = String(calculateChampionsStat(baseValue, statKey, evs, nature));
      finalValue.classList.toggle("nature-positive", nature.up === statKey);
      finalValue.classList.toggle("nature-negative", nature.down === statKey);
    }
  }
}

function bindExpandedSetControls(card) {
  const table = card.querySelector(".expanded-stat-table");
  if (table) {
    for (const input of getExpandedStatInputs(table)) {
      input.addEventListener("input", () => {
        clampExpandedEvInput(input, table);
        syncExpandedStatTable(table);
      });
    }
    table.querySelector(".expanded-nature-input")?.addEventListener("change", () => syncExpandedStatTable(table));
    syncExpandedStatTable(table);
  }
}

function fillExpandedSetFromSearch(card, species, displayForm) {
  const moveInputs = [...card.querySelectorAll(".expanded-move-input")];
  const searchedMoves = getActiveMoveMatchNames().filter(moveName =>
    species.moves.some(speciesMove => normalizeName(speciesMove) === normalizeName(moveName))
  );
  moveInputs.forEach((input, index) => {
    input.value = searchedMoves[index] || "";
  });

  const searchedAbility = getActiveAbilityMatchNames().find(abilityName =>
    displayForm.abilities.some(formAbility => normalizeName(formAbility) === normalizeName(abilityName))
  );
  const abilityInput = card.querySelector(".expanded-ability-input");
  if (abilityInput) {
    abilityInput.value = searchedAbility || "";
  }
}

function addLearnpoolMoveToConfig(card, moveName) {
  const moveInputs = [...card.querySelectorAll(".expanded-move-input, .box-edit-move")];
  state.pendingMoveSlotSelection = {
    moveName,
    moveInputs,
    selectedIndex: null
  };
  elements.moveSlotModalGrid.innerHTML = moveInputs.map((input, index) => `
    <button type="button" class="move-slot-choice" data-index="${index}">
      <span>Move ${index + 1}</span>
      <strong>${input.value || "-"}</strong>
    </button>
  `).join("");
  elements.moveSlotConfirmButton.disabled = true;
  elements.moveSlotModal.hidden = false;

  for (const button of elements.moveSlotModalGrid.querySelectorAll(".move-slot-choice")) {
    button.addEventListener("click", () => {
      state.pendingMoveSlotSelection.selectedIndex = Number(button.dataset.index);
      for (const choice of elements.moveSlotModalGrid.querySelectorAll(".move-slot-choice")) {
        const selected = choice === button;
        choice.classList.toggle("selected", selected);
        choice.querySelector("strong").textContent = selected
          ? state.pendingMoveSlotSelection.moveName
          : moveInputs[Number(choice.dataset.index)]?.value || "-";
      }
      elements.moveSlotConfirmButton.disabled = false;
    });
  }
}

function confirmMoveSlotPrompt() {
  const selection = state.pendingMoveSlotSelection;
  const targetInput = selection?.moveInputs?.[selection.selectedIndex];
  if (targetInput) {
    targetInput.value = selection.moveName;
  }
  closeMoveSlotPrompt();
}

function closeMoveSlotPrompt() {
  state.pendingMoveSlotSelection = null;
  elements.moveSlotConfirmButton.disabled = true;
  elements.moveSlotModal.hidden = true;
  elements.moveSlotModalGrid.innerHTML = "";
}

function getExpandedConfigFromCard(card, species, displayForm) {
  const natureName = card.querySelector(".expanded-nature-input")?.value || NATURES[0].name;
  const nature = getNatureByName(natureName);
  const evs = {};
  const finalStats = {};
  for (const [label, key] of STAT_ROWS) {
    const input = card.querySelector(`.expanded-stat-ev[data-stat="${key}"]`);
    const evValue = Math.max(0, Math.min(CHAMPIONS_MAX_EVS_PER_STAT, Number(input?.value) || 0));
    evs[key] = evValue;
    finalStats[key] = calculateChampionsStat(displayForm.stats?.[key], key, evValue, nature);
  }

  return {
    id: `box-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    species: {
      slug: species.slug,
      name: displayForm.label,
      baseName: species.primaryName,
      dexNo: species.dexNo,
      formId: displayForm.id,
      spritePath: displayForm.spritePath,
      types: displayForm.types || [],
      baseStats: displayForm.stats || {}
    },
    nickname: "",
    moves: [...card.querySelectorAll(".expanded-move-input")].map(input => input.value).filter(Boolean),
    ability: card.querySelector(".expanded-ability-input")?.value || "",
    item: card.querySelector(".expanded-item-select select")?.value || "",
    nature: natureName,
    evs,
    finalStats,
    team: ""
  };
}

function populateBoxTeamOptions() {
  const selectedFilter = elements.boxTeamFilter.value;
  elements.boxTeamFilter.innerHTML = `<option value="">Entire box</option>${state.box.teams.map(team => `<option value="${team}">${team}</option>`).join("")}`;
  elements.boxTeamFilter.value = state.box.teams.includes(selectedFilter) ? selectedFilter : "";

  elements.boxSaveTeamSelect.innerHTML = `
    <option value="">No team</option>
    ${state.box.teams.map(team => `<option value="${team}">${team}</option>`).join("")}
    <option value="__new">Create new team...</option>
  `;
}

function openBoxSavePrompt(config) {
  state.pendingBoxConfig = config;
  populateBoxTeamOptions();
  elements.boxSaveNicknameInput.value = config.nickname || "";
  elements.boxSaveTeamSelect.value = "";
  elements.boxSaveNewTeamInput.value = "";
  elements.boxSaveNewTeamRow.hidden = true;
  elements.boxSaveModal.hidden = false;
  elements.boxSaveTeamSelect.focus();
}

function openTeamAddPrompt(config) {
  state.pendingBoxConfig = { ...config, id: config.id, existingConfigId: config.id };
  populateBoxTeamOptions();
  elements.boxSaveNicknameInput.value = config.nickname || "";
  elements.boxSaveTeamSelect.value = "";
  elements.boxSaveNewTeamInput.value = "";
  elements.boxSaveNewTeamRow.hidden = true;
  elements.boxSaveModal.hidden = false;
  elements.boxSaveTeamSelect.focus();
}

function closeBoxSavePrompt() {
  state.pendingBoxConfig = null;
  elements.boxSaveNicknameInput.value = "";
  elements.boxSaveModal.hidden = true;
}

function confirmBoxSave() {
  if (!state.pendingBoxConfig) {
    closeBoxSavePrompt();
    return;
  }
  let teamName = elements.boxSaveTeamSelect.value;
  const nickname = elements.boxSaveNicknameInput.value.trim();
  if (teamName === "__new") {
    teamName = elements.boxSaveNewTeamInput.value.trim();
    if (!teamName) {
      alert("Enter a team name.");
      return;
    }
  }

  const config = { ...state.pendingBoxConfig, nickname, team: teamName };
  const teamCheck = canAddConfigToTeam(config, teamName);
  if (!teamCheck.ok) {
    alert(teamCheck.message);
    return;
  }

  if (teamName && !state.box.teams.includes(teamName)) {
    state.box.teams.push(teamName);
    state.box.teams.sort((left, right) => left.localeCompare(right));
  }
  if (state.pendingBoxConfig.existingConfigId) {
    const existing = state.box.configs.find(item => item.id === state.pendingBoxConfig.existingConfigId);
    if (existing) {
      existing.nickname = nickname;
      existing.team = teamName;
    }
  } else {
    state.box.configs.push(config);
  }
  saveBoxData();
  populateBoxTeamOptions();
  renderBox();
  closeBoxSavePrompt();
}

function getMoveSearchMatches() {
  const nameQuery = normalizeName(elements.moveNameSearch.value);
  const type = elements.moveTypeSearch.value;
  const category = elements.moveCategorySearch.value;
  const priority = elements.movePrioritySearch.value;
  const field = elements.moveFieldSearch.value;
  const target = elements.moveTargetSearch.value;
  const classification = elements.moveClassificationSearch.value;

  return state.metadata.moves.filter(move => {
    const priorityMatch = !priority ||
      (priority === "positive" && move.priority > 0) ||
      (priority === "zero" && move.priority === 0) ||
      (priority === "negative" && move.priority < 0);

    return (!nameQuery || normalizeName(move.name).includes(nameQuery)) &&
      (!type || move.type === type) &&
      (!category || move.category === category) &&
      priorityMatch &&
      (!field || move.weatherTerrain.includes(field)) &&
      (!target || move.target === target) &&
      (!classification || getMoveDisplayClassifications(move).includes(classification));
  }).sort((left, right) => left.name.localeCompare(right.name));
}

function renderMoveSearch() {
  const matches = getMoveSearchMatches();
  elements.moveResultCount.textContent = `${matches.length} move${matches.length === 1 ? "" : "s"}`;
  elements.moveResults.innerHTML = matches.map(move => formatMoveDataRow(move)).join("") || `<div class="empty-state">No moves match the current search.</div>`;
  syncMoveRowHeights();
  bindSendButtons(elements.moveResults);
}

function syncMoveRowHeights() {
  const rows = [...elements.moveResults.querySelectorAll(".move-row")];
  if (!rows.length) {
    return;
  }

  for (const row of rows) {
    row.style.minHeight = "";
    row.style.height = "";
  }

  if (elements.movePanel.hidden) {
    return;
  }

  requestAnimationFrame(() => {
    const tallestRow = Math.max(...rows.map(row => row.offsetHeight));
    if (!tallestRow) {
      return;
    }
    for (const row of rows) {
      row.style.height = `${tallestRow}px`;
    }
  });
}

function getAllAbilityEntries() {
  return getAllAbilityNames().map(name => ({
    name,
    description: getDetailedAbilityDescription(name),
    tags: classifyAbility(name, getDetailedAbilityDescription(name))
  }));
}

function classifyAbility(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  const physicalAttackText = text.replace(/\bspecial attack\b/g, "spastat");
  const typeInteractionPattern = /\b(?:normal|fire|water|electric|grass|ice|fighting|poison|ground|flying|psychic|bug|rock|ghost|dragon|dark|steel|fairy)-type\b|\b(?:normal|fire|water|electric|grass|ice|fighting|poison|ground|flying|psychic|bug|rock|ghost|dragon|dark|steel|fairy)\s+type\b|\bsame-type attack bonus\b|\bmoves? of the same type\b|\bchanges? the pok[eé]mon'?s type\b|\bchanges? the type\b|\bbecome(?:s)? [a-z-]+-type\b|\bhit by (?:a|an) [a-z-]+-type move\b|\bdraws? in all [a-z-]+-type moves\b|\bimmune to all [a-z-]+-type moves\b/i;
  const tags = new Set();
  const activeByRegex = /\bwhen\b|\bupon\b|\bif\b|\bafter\b|\btrigger|activates?|enters?|hit by|damaged|contact|switch/i.test(text);
  const teamByRegex = /\bally|allies|team|party|user's team\b/.test(text);
  const targetByRegex = /\b(?:the|a|an)\s+target\b/.test(text);
  const opponentByRegex = /\bopposing|opponent|enemy|foe\b/.test(text);
  const hpByRegex = /\bhp\b|heals?|healing|restores?|recoil|max hp/.test(text);
  const priorityByRegex = /\bpriority\b|prankster|triage|quick draw|armor tail|queenly majesty/.test(text);
  const typeEffectByRegex = typeInteractionPattern.test(text);
  const weatherByRegex = /\b(?:sun|sunlight|rain|sandstorm|sand|snow|hail|terrain|weather|drought|drizzle|surge|mega sol|chlorophyll|swift swim|slush rush|sand rush)\b/.test(text);

  if (hasAbilitySourceMatch(name, "active") || hasLocalAbilityFilterAddition(name, "active") || activeByRegex) {
    tags.add("active");
  } else {
    tags.add("passive");
  }
  if (/\buser\b|this pok[eé]mon|holder|itself|its\b|own\b/.test(text)) tags.add("user");
  if ((hasAbilitySourceMatch(name, "team") || teamByRegex || hasLocalAbilityFilterAddition(name, "team")) &&
    !hasLocalAbilityFilterRemoval(name, "team")) tags.add("team");
  if ((targetByRegex || hasLocalAbilityFilterAddition(name, "target")) &&
    !hasLocalAbilityFilterRemoval(name, "target")) tags.add("target");
  if (((hasAbilitySourceMatch(name, "opponentCandidates") && opponentByRegex) || opponentByRegex || hasLocalAbilityFilterAddition(name, "opponent")) &&
    !hasLocalAbilityFilterRemoval(name, "opponent")) tags.add("opponent");
  const statRules = [
    ["hp", /\bhp\b|heals?|healing|restores?|recoil|max hp/],
    ["attack", /\battack (?:stat|one stage|two stages|boost|boosted|lowered|raises|raised|lowers|halved|doubled)|(?:raises|raised|boosts|boosted|lowers|lowered|halves|doubles|increases) (?:its |the |opponents'? |user's )?attack\b|\batk\b/, physicalAttackText],
    ["defense", /\bdefense (?:stat|one stage|two stages|boost|boosted|lowered|raises|raised|lowers|halved|doubled)|(?:raises|raised|boosts|boosted|lowers|lowered|halves|doubles) (?:[^.]* )?defense\b|\bdef\b/],
    ["specialAttack", /\bspecial attack (?:stat|one stage|two stages|boost|boosted|lowered|raises|raised|lowers|halved|doubled|to)|(?:raises|raised|boosts|boosted|lowers|lowered|halves|doubles|increases) (?:its |the |opponents'? |user's )?special attack\b|\bsp\.? atk\b|\bspa\b/],
    ["specialDefense", /\bspecial defense (?:stat|one stage|two stages|boost|boosted|lowered|raises|raised|lowers|halved|doubled)|(?:raises|raised|boosts|boosted|lowers|lowered|halves|doubles) (?:[^.]* )?special defense\b|\bsp\.? def\b|\bspd\b/],
    ["speed", /\bspeed (?:stat|one stage|two stages|boost|boosted|lowered|raises|raised|lowers|halved|doubled)|(?:raises|raised|boosts|boosted|lowers|lowered|halves|doubles) (?:[^.]* )?speed\b/],
    ["accuracy", /\baccuracy\b/],
    ["evasion", /\bevasion\b/]
  ];
  for (const [tag, pattern, sourceText = text] of statRules) {
    const patternMatch = pattern.test(sourceText);
    if (((hasAbilitySourceMatch(name, "statCandidates") && patternMatch) || patternMatch || hasLocalAbilityFilterAddition(name, tag)) &&
      !hasLocalAbilityFilterRemoval(name, tag)) tags.add(tag);
  }
  for (const [tag, abilityNames] of Object.entries(ABILITY_STAT_OVERRIDES)) {
    if (abilityNames.some(abilityName => normalizeName(abilityName) === normalizeName(name))) {
      tags.add(tag);
    }
  }
  if ((hasAbilitySourceMatch(name, "hp") || hpByRegex || hasLocalAbilityFilterAddition(name, "hp")) &&
    !hasLocalAbilityFilterRemoval(name, "hp")) tags.add("hp");
  if ((hasAbilitySourceMatch(name, "priority") || priorityByRegex || hasLocalAbilityFilterAddition(name, "priority")) &&
    !hasLocalAbilityFilterRemoval(name, "priority")) tags.add("priority");
  if ((hasAbilitySourceMatch(name, "typeEffect") || typeEffectByRegex || hasLocalAbilityFilterAddition(name, "typeEffect")) &&
    !hasLocalAbilityFilterRemoval(name, "typeEffect")) tags.add("typeEffect");
  if ((hasAbilitySourceMatch(name, "weatherTerrain") || weatherByRegex || hasLocalAbilityFilterAddition(name, "weatherTerrain")) &&
    !hasLocalAbilityFilterRemoval(name, "weatherTerrain")) tags.add("weatherTerrain");
  tags.add("user");
  return [...tags];
}

function getSelectedAbilityToggles() {
  return [...elements.abilityToggleGrid.querySelectorAll("input:checked")].map(input => input.value);
}

function getAbilitySearchMatches() {
  const nameQuery = normalizeName(elements.abilityNameSearch.value);
  const toggles = getSelectedAbilityToggles();
  return getAllAbilityEntries().filter(ability =>
    (!nameQuery || normalizeName(ability.name).includes(nameQuery)) &&
    toggles.every(toggle => ability.tags.includes(toggle))
  ).sort((left, right) => left.name.localeCompare(right.name));
}

function renderAbilitySearch() {
  const matches = getAbilitySearchMatches();
  elements.abilityResultCount.textContent = `${matches.length} abilit${matches.length === 1 ? "y" : "ies"}`;
  elements.abilityResults.innerHTML = matches.map(ability => `
    <article class="data-row ability-row">
      <div class="row-title">${ability.name}</div>
      <div class="row-meta">${ability.tags.map(tag => ABILITY_TOGGLES.find(([key]) => key === tag)?.[1] || tag).join(", ")}</div>
      <div class="row-description">${ability.description}</div>
      <button type="button" class="secondary send-setlist-button" data-kind="ability" data-name="${ability.name}">Send to Setlist</button>
    </article>
  `).join("") || `<div class="empty-state">No abilities match the current search.</div>`;
  bindSendButtons(elements.abilityResults);
}

function getBoxSortStatValue(config, statKey) {
  if (statKey === "total") {
    return STAT_ROWS.reduce((total, [, key]) => total + getBoxSortStatValue(config, key), 0);
  }
  return calculateChampionsStat(
    config.species?.baseStats?.[statKey],
    statKey,
    config.evs?.[statKey] || 0,
    getNatureByName(config.nature)
  );
}

function getBoxMatches() {
  const nameQuery = normalizeName(elements.boxNameSearch.value);
  const teamFilter = elements.boxTeamFilter.value;
  const sort = elements.boxSortSelect.value;
  const direction = elements.boxSortDirectionSelect.value === "asc" ? 1 : -1;
  const matches = state.box.configs.filter(config => {
    const searchable = [
      config.species?.name,
      config.species?.baseName,
      config.ability,
      config.item,
      ...(config.moves || []),
      config.team
    ].filter(Boolean).join(" ");
    return (!nameQuery || normalizeName(searchable).includes(nameQuery)) &&
      (!teamFilter || config.team === teamFilter);
  });

  return matches.sort((left, right) => {
    let result = 0;
    switch (sort) {
      case "alphabetical":
        result = left.species.name.localeCompare(right.species.name);
        break;
      case "dex":
        result = (left.species.dexNo || 0) - (right.species.dexNo || 0);
        break;
      case "hp":
      case "attack":
      case "defense":
      case "specialAttack":
      case "specialDefense":
      case "speed":
      case "total":
        result = getBoxSortStatValue(left, sort) - getBoxSortStatValue(right, sort);
        break;
      case "offenseTotal":
        result = (getBoxSortStatValue(left, "attack") + getBoxSortStatValue(left, "specialAttack")) -
          (getBoxSortStatValue(right, "attack") + getBoxSortStatValue(right, "specialAttack"));
        break;
      case "defenseTotal":
        result = (getBoxSortStatValue(left, "defense") + getBoxSortStatValue(left, "specialDefense")) -
          (getBoxSortStatValue(right, "defense") + getBoxSortStatValue(right, "specialDefense"));
        break;
      case "recent":
      default:
        result = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        break;
    }
    return (result * direction) || left.species.name.localeCompare(right.species.name);
  });
}

function formatSavedMoveGrid(config) {
  return Array.from({ length: 4 }, (_, index) => `
    <div class="box-saved-field">
      <span>Move ${index + 1}</span>
      <strong>${config.moves?.[index] || "-"}</strong>
    </div>
  `).join("");
}

function getConfigLearnpoolMoves(config) {
  const species = state.dataset.species.find(entry => entry.slug === config.species?.slug);
  return species?.moves || config.moves || [];
}

function getSavedSpeciesMoveOptions(config, selectedMove = "") {
  const moves = getConfigLearnpoolMoves(config);
  return moves.map(moveName => `<option value="${moveName}"${moveName === selectedMove ? " selected" : ""}>${moveName}</option>`).join("");
}

function getSavedAbilityOptions(config) {
  const species = state.dataset.species.find(entry => entry.slug === config.species?.slug);
  const form = species
    ? getAvailableForms(species).find(candidate => candidate.id === config.species?.formId) || getAvailableForms(species)[0]
    : null;
  const abilities = form?.abilities || (config.ability ? [config.ability] : []);
  return abilities.map(ability => `<option value="${ability}"${ability === config.ability ? " selected" : ""}>${ability}</option>`).join("");
}

function getConfigAvailableAbilities(config) {
  const species = state.dataset.species.find(entry => entry.slug === config.species?.slug);
  const form = species
    ? getAvailableForms(species).find(candidate => candidate.id === config.species?.formId) || getAvailableForms(species)[0]
    : null;
  return form?.abilities || (config.ability ? [config.ability] : []);
}

function formatEditableMoveGrid(config) {
  return Array.from({ length: 4 }, (_, index) => `
    <label class="expanded-move-select">
      <span>Move ${index + 1}</span>
      <select class="box-edit-move">
        <option value="">-</option>
        ${getSavedSpeciesMoveOptions(config, config.moves?.[index] || "")}
      </select>
    </label>
  `).join("");
}

function formatSavedStatTable(config) {
  const nature = getNatureByName(config.nature);
  return `
    <div class="expanded-stat-table box-stat-table">
      ${STAT_ROWS.map(([label, key]) => {
        const evs = Number(config.evs?.[key]) || 0;
        const baseValue = Number(config.species?.baseStats?.[key]) || 0;
        const finalValue = calculateChampionsStat(baseValue, key, evs, nature);
        return `
          <div class="expanded-stat-row">
            <span class="expanded-stat-name">${label}</span>
            <span class="expanded-stat-value">${baseValue}</span>
            <span class="expanded-stat-bar"><span style="width: ${Math.min(100, (evs / CHAMPIONS_MAX_EVS_PER_STAT) * 100)}%"></span></span>
            <span class="box-ev-value">${evs}</span>
            <span class="expanded-stat-final${nature.up === key ? " nature-positive" : ""}${nature.down === key ? " nature-negative" : ""}">${finalValue}</span>
          </div>
        `;
      }).join("")}
      <div class="expanded-stat-alignment">
        <span>${config.nature || NATURES[0].name}</span>
        <span class="expanded-ev-total">${Object.values(config.evs || {}).reduce((sum, value) => sum + (Number(value) || 0), 0)}/${CHAMPIONS_MAX_TOTAL_EVS}</span>
      </div>
    </div>
  `;
}

function formatEditableStatTable(config) {
  const nature = getNatureByName(config.nature);
  return `
    <div class="expanded-stat-table box-edit-stat-table">
      ${STAT_ROWS.map(([label, key]) => {
        const evs = Number(config.evs?.[key]) || 0;
        const baseValue = Number(config.species?.baseStats?.[key]) || 0;
        return `
          <div class="expanded-stat-row">
            <span class="expanded-stat-name">${label}</span>
            <span class="expanded-stat-value">${baseValue}</span>
            <span class="expanded-stat-bar"><span style="width: ${Math.min(100, (evs / CHAMPIONS_MAX_EVS_PER_STAT) * 100)}%"></span></span>
            <input class="expanded-stat-ev" type="number" min="0" max="${CHAMPIONS_MAX_EVS_PER_STAT}" step="1" value="${evs}" data-stat="${key}" aria-label="${label} EVs">
            <span class="expanded-stat-final${nature.up === key ? " nature-positive" : ""}${nature.down === key ? " nature-negative" : ""}">${calculateChampionsStat(baseValue, key, evs, nature)}</span>
          </div>
        `;
      }).join("")}
      <div class="expanded-stat-alignment">
        <label class="expanded-nature-select">
          <span>Stat Alignment</span>
          <select class="expanded-nature-input">
            ${NATURES.map(natureOption => `<option value="${natureOption.name}"${natureOption.name === config.nature ? " selected" : ""}>${natureOption.name}</option>`).join("")}
          </select>
        </label>
        <span class="expanded-ev-total">${Object.values(config.evs || {}).reduce((sum, value) => sum + (Number(value) || 0), 0)}/${CHAMPIONS_MAX_TOTAL_EVS}</span>
      </div>
    </div>
  `;
}

function formatConfigTeams(config) {
  return `
    <div class="box-team-block">
      <div class="box-team-header">
        <h4>Team</h4>
        <button type="button" class="icon-button box-add-team-button" data-id="${config.id}" aria-label="Add to team">+</button>
      </div>
      <div class="box-team-list">${config.team ? `<span>${config.team}</span>` : `<span class="muted">None</span>`}</div>
    </div>
  `;
}

function formatBoxConfigName(config, isEditing) {
  if (isEditing) {
    return `
      <label class="box-nickname-edit">
        <span>Nickname</span>
        <input class="box-edit-nickname" type="text" value="${config.nickname || ""}" placeholder="${config.species.name}">
      </label>
    `;
  }
  if (config.nickname) {
    return `
      <div class="box-name-block">
        <h3>${config.nickname}</h3>
        <div class="box-species-subtitle">${config.species.name}</div>
      </div>
    `;
  }
  return `<h3>${config.species.name}</h3>`;
}

function getConfigById(configId) {
  return state.box.configs.find(config => config.id === configId);
}

function updateConfigFromEditCard(card, config) {
  const natureName = card.querySelector(".expanded-nature-input")?.value || NATURES[0].name;
  const nature = getNatureByName(natureName);
  const evs = {};
  const finalStats = {};
  for (const [label, key] of STAT_ROWS) {
    const evValue = Math.max(0, Math.min(CHAMPIONS_MAX_EVS_PER_STAT, Number(card.querySelector(`.expanded-stat-ev[data-stat="${key}"]`)?.value) || 0));
    evs[key] = evValue;
    finalStats[key] = calculateChampionsStat(config.species?.baseStats?.[key], key, evValue, nature);
  }
  config.nickname = card.querySelector(".box-edit-nickname")?.value.trim() || "";
  config.moves = [...card.querySelectorAll(".box-edit-move")].map(input => input.value).filter(Boolean);
  config.ability = card.querySelector(".box-edit-ability")?.value || "";
  config.item = card.querySelector(".box-edit-item")?.value || "";
  config.nature = natureName;
  config.evs = evs;
  config.finalStats = finalStats;
}

function formatEvLine(evs = {}) {
  const parts = [
    ["HP", "hp"],
    ["Atk", "attack"],
    ["Def", "defense"],
    ["SpA", "specialAttack"],
    ["SpD", "specialDefense"],
    ["Spe", "speed"]
  ].map(([label, key]) => [label, championsEvToShowdownEv(Number(evs[key]) || 0)])
    .filter(([, value]) => value > 0)
    .map(([label, value]) => `${value} ${label}`);
  return parts.length ? `EVs: ${parts.join(" / ")}` : "";
}

function championsEvToShowdownEv(value) {
  const championsEv = Math.max(0, Math.min(CHAMPIONS_MAX_EVS_PER_STAT, Math.floor(Number(value) || 0)));
  if (championsEv >= CHAMPIONS_MAX_EVS_PER_STAT) {
    return SHOWDOWN_MAX_EVS_PER_STAT;
  }
  return Math.round((championsEv / CHAMPIONS_MAX_EVS_PER_STAT) * SHOWDOWN_MAX_EVS_PER_STAT);
}

function showdownEvToChampionsEv(value) {
  const showdownEv = Math.max(0, Math.min(SHOWDOWN_MAX_EVS_PER_STAT, Math.floor(Number(value) || 0)));
  if (showdownEv >= SHOWDOWN_MAX_EVS_PER_STAT) {
    return CHAMPIONS_MAX_EVS_PER_STAT;
  }
  return Math.round((showdownEv / SHOWDOWN_MAX_EVS_PER_STAT) * CHAMPIONS_MAX_EVS_PER_STAT);
}

function formatShowdownConfig(config) {
  const nameLine = `${config.nickname ? `${config.nickname} (${config.species.name})` : config.species.name}${config.item ? ` @ ${config.item}` : ""}`;
  return [
    nameLine,
    config.ability ? `Ability: ${config.ability}` : "",
    "Level: 50",
    formatEvLine(config.evs),
    `${config.nature || NATURES[0].name} Nature`,
    ...(config.moves || []).map(move => `- ${move}`)
  ].filter(Boolean).join("\n");
}

function exportShowdownConfigs(configs) {
  elements.showdownText.value = configs.map(formatShowdownConfig).join("\n\n");
}

function findSpeciesFormFromShowdownName(rawName) {
  const normalized = normalizeName(rawName);
  for (const species of state.dataset.species) {
    for (const form of getAvailableForms(species)) {
      if ([form.label, species.primaryName, ...(species.availableNames || [])].some(name => normalizeName(name) === normalized)) {
        return { species, form };
      }
    }
  }
  return null;
}

function parseShowdownSet(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) {
    return null;
  }
  const firstLine = lines[0].replace(/\s*@\s*(.+)$/, "");
  const itemMatch = lines[0].match(/\s@\s*(.+)$/);
  let nickname = "";
  let speciesName = firstLine;
  const nicknameMatch = firstLine.match(/^(.+?)\s+\((.+)\)$/);
  if (nicknameMatch) {
    nickname = nicknameMatch[1].trim();
    speciesName = nicknameMatch[2].trim();
  }
  const found = findSpeciesFormFromShowdownName(speciesName);
  if (!found) {
    return null;
  }

  const ability = lines.find(line => line.toLowerCase().startsWith("ability:"))?.replace(/^Ability:\s*/i, "") || "";
  const nature = lines.find(line => / nature$/i.test(line))?.replace(/\s+Nature$/i, "") || NATURES[0].name;
  const evs = {};
  for (const [, key] of STAT_ROWS) {
    evs[key] = 0;
  }
  const evLine = lines.find(line => line.toLowerCase().startsWith("evs:"));
  const evAliases = { hp: "hp", atk: "attack", def: "defense", spa: "specialAttack", spd: "specialDefense", spe: "speed" };
  if (evLine) {
    let totalEvs = 0;
    for (const part of evLine.replace(/^EVs:\s*/i, "").split("/")) {
      const match = part.trim().match(/^(\d+)\s+([A-Za-z.]+)/);
      if (match) {
        const key = evAliases[normalizeName(match[2]).replace(/\./g, "")];
        if (key) {
          const championsEv = showdownEvToChampionsEv(Number(match[1]) || 0);
          const remainingEvs = Math.max(0, CHAMPIONS_MAX_TOTAL_EVS - totalEvs);
          evs[key] = Math.min(championsEv, remainingEvs);
          totalEvs += evs[key];
        }
      }
    }
  }
  const natureData = getNatureByName(nature);
  const finalStats = {};
  for (const [, key] of STAT_ROWS) {
    finalStats[key] = calculateChampionsStat(found.form.stats?.[key], key, evs[key], natureData);
  }

  return {
    id: `box-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    species: {
      slug: found.species.slug,
      name: found.form.label,
      baseName: found.species.primaryName,
      dexNo: found.species.dexNo,
      formId: found.form.id,
      spritePath: found.form.spritePath,
      types: found.form.types || [],
      baseStats: found.form.stats || {}
    },
    nickname,
    moves: lines.filter(line => line.startsWith("-")).map(line => line.replace(/^-\s*/, "")).slice(0, 4),
    ability,
    item: itemMatch?.[1]?.trim() || "",
    nature: getNatureByName(nature).name,
    evs,
    finalStats,
    team: ""
  };
}

function formatBoxConfigPreview(config) {
  return `
    <article class="box-config-row import-preview-card">
      <section class="box-compact-panel">
        <div class="result-card-top">
          ${config.species.spritePath ? `<img class="pokemon-sprite" src="${config.species.spritePath}" alt="${config.species.name} sprite">` : ""}
          <div class="result-card-heading">${formatBoxConfigName(config, false)}</div>
        </div>
        <div class="meta">#${String(config.species.dexNo).padStart(4, "0")} ${formatTypeIcons(config.species.types || [])}</div>
      </section>
      <section class="expanded-moves-panel">
        <h4>Moves</h4>
        <div class="expanded-move-grid">${formatSavedMoveGrid(config)}</div>
        <div class="expanded-set-selects">
          <div class="box-saved-field"><span>Ability</span><strong>${config.ability || "-"}</strong></div>
          <div class="box-saved-field"><span>Item</span><strong>${config.item || "-"}</strong></div>
        </div>
      </section>
      <section class="expanded-stats-panel">
        <h4>Stats</h4>
        ${formatSavedStatTable(config)}
      </section>
    </article>
  `;
}

function importShowdownSet() {
  const config = parseShowdownSet(elements.showdownText.value);
  if (!config) {
    alert("Could not identify the species in that Showdown set.");
    return;
  }
  state.pendingImportConfig = config;
  elements.showdownImportPreview.innerHTML = formatBoxConfigPreview(config);
  elements.showdownImportModal.hidden = false;
}

function confirmShowdownImport() {
  if (!state.pendingImportConfig) {
    closeShowdownImportPrompt();
    return;
  }
  state.box.configs.push(state.pendingImportConfig);
  state.pendingImportConfig = null;
  saveBoxData();
  renderBox();
  closeShowdownImportPrompt();
  setActiveTab("box");
}

function closeShowdownImportPrompt() {
  state.pendingImportConfig = null;
  elements.showdownImportPreview.innerHTML = "";
  elements.showdownImportModal.hidden = true;
}

function eraseBoxConfig(configId) {
  state.box.configs = state.box.configs.filter(config => config.id !== configId);
  saveBoxData();
  renderBox();
}

function removeConfigFromTeam(configId) {
  const config = getConfigById(configId);
  if (config) {
    config.team = "";
    saveBoxData();
    renderBox();
  }
}

function renderBox() {
  populateBoxTeamOptions();
  const matches = getBoxMatches();
  const inTeamView = Boolean(elements.boxTeamFilter.value);
  elements.boxResultsTitle.textContent = inTeamView ? elements.boxTeamFilter.value : "Box";
  elements.boxViewExportButton.hidden = !inTeamView;
  elements.boxViewExportButton.textContent = "Export Team";
  elements.boxResultCount.textContent = `${matches.length} saved set${matches.length === 1 ? "" : "s"}`;
  elements.boxResults.innerHTML = matches.map(config => {
    const isEditing = state.editingBoxConfigId === config.id;
    return `
    <article class="box-config-row" data-id="${config.id}">
      <section class="box-compact-panel">
        <div class="result-card-top">
          ${config.species.spritePath ? `<img class="pokemon-sprite" src="${config.species.spritePath}" alt="${config.species.name} sprite">` : ""}
          <div class="result-card-heading">
            ${formatBoxConfigName(config, isEditing)}
          </div>
        </div>
        <div class="meta">#${String(config.species.dexNo).padStart(4, "0")} ${formatTypeIcons(config.species.types || [])}</div>
        ${formatConfigTeams(config)}
        <div class="box-card-actions">
          ${isEditing ? `
            <button type="button" class="secondary box-save-edit-button" data-id="${config.id}">Save</button>
            <button type="button" class="secondary box-cancel-edit-button" data-id="${config.id}">Cancel</button>
          ` : `
            <button type="button" class="secondary box-edit-button" data-id="${config.id}">Edit</button>
            <button type="button" class="secondary box-erase-button" data-id="${config.id}">${inTeamView ? "Remove" : "Erase"}</button>
            <button type="button" class="secondary box-export-button" data-id="${config.id}">Export</button>
          `}
        </div>
      </section>
      <section class="expanded-moves-panel">
        <h4>Moves</h4>
        <div class="expanded-move-grid">${isEditing ? formatEditableMoveGrid(config) : formatSavedMoveGrid(config)}</div>
        <div class="expanded-set-selects">
          ${isEditing ? `
            <label class="expanded-move-select">
              <span>Ability</span>
              <select class="box-edit-ability"><option value="">-</option>${getSavedAbilityOptions(config)}</select>
            </label>
            <label class="expanded-move-select">
              <span>Item</span>
              <select class="box-edit-item"><option value="">-</option>${formatItemOptions(config.item)}</select>
            </label>
          ` : `
            <div class="box-saved-field"><span>Ability</span><strong>${config.ability || "-"}</strong></div>
            <div class="box-saved-field"><span>Item</span><strong>${config.item || "-"}</strong></div>
          `}
        </div>
      </section>
      <section class="expanded-stats-panel">
        <h4>Stats</h4>
        ${isEditing ? formatEditableStatTable(config) : formatSavedStatTable(config)}
      </section>
      <div class="details-panel">
        <section class="detail-block">
          <h4>${isEditing ? "Abilities" : "Ability"}</h4>
          <div class="ability-list">${formatAbilityDetails(isEditing ? getConfigAvailableAbilities(config) : (config.ability ? [config.ability] : []))}</div>
        </section>
        ${isEditing ? `
          <section class="detail-block expanded-learnpool-block">
            <h4>Champions Learnpool</h4>
            <div class="learnpool-list">
              ${formatMoveList(getConfigLearnpoolMoves(config))}
            </div>
          </section>
        ` : ""}
      </div>
    </article>
  `;
  }).join("") || `<div class="empty-state">No saved configurations match the current box filters.</div>`;

  for (const card of elements.boxResults.querySelectorAll(".box-config-row")) {
    const configId = card.dataset.id;
    card.querySelector(".box-edit-button")?.addEventListener("click", () => {
      state.editingBoxConfigId = configId;
      renderBox();
    });
    card.querySelector(".box-cancel-edit-button")?.addEventListener("click", () => {
      state.editingBoxConfigId = null;
      renderBox();
    });
    card.querySelector(".box-save-edit-button")?.addEventListener("click", () => {
      const config = getConfigById(configId);
      if (config) {
        updateConfigFromEditCard(card, config);
        state.editingBoxConfigId = null;
        saveBoxData();
        renderBox();
      }
    });
    card.querySelector(".box-erase-button")?.addEventListener("click", () => {
      if (inTeamView) {
        removeConfigFromTeam(configId);
      } else {
        eraseBoxConfig(configId);
      }
    });
    card.querySelector(".box-export-button")?.addEventListener("click", () => {
      const config = getConfigById(configId);
      if (config) {
        exportShowdownConfigs([config]);
      }
    });
    card.querySelector(".box-add-team-button")?.addEventListener("click", () => {
      const config = getConfigById(configId);
      if (config) {
        openTeamAddPrompt(config);
      }
    });
    for (const learnpoolRow of card.querySelectorAll(".learnpool-pick-row")) {
      learnpoolRow.addEventListener("click", () => addLearnpoolMoveToConfig(card, learnpoolRow.dataset.moveName));
      learnpoolRow.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          addLearnpoolMoveToConfig(card, learnpoolRow.dataset.moveName);
        }
      });
    }
    bindExpandedSetControls(card);
  }
}

function getSpeedStat(baseSpeed, evs, nature) {
  return Math.floor((Math.floor(((2 * baseSpeed + CHAMPIONS_IV + (evs * 2)) * CHAMPIONS_LEVEL) / 100) + 5) * nature);
}

function getSpeedTierRows() {
  const entries = state.dataset.species.flatMap(species =>
    getAvailableForms(species).map(form => {
      const baseSpeed = form.stats?.speed || 0;
      const max = getSpeedStat(baseSpeed, CHAMPIONS_MAX_EVS_PER_STAT, 1.1);
      const neutral = getSpeedStat(baseSpeed, CHAMPIONS_MAX_EVS_PER_STAT, 1.0);
      const zeroEv = getSpeedStat(baseSpeed, 0, 1.0);
      const negative = getSpeedStat(baseSpeed, 0, 0.9);
      return {
        key: `${species.slug}:${form.id}`,
        label: form.label,
        spritePath: form.spritePath,
        baseSpeed,
        max,
        neutral,
        zeroEv,
        negative,
        maxScarf: Math.floor(max * 1.5),
        neutralScarf: Math.floor(neutral * 1.5),
        isMega: form.isMega
      };
    })
  );

  const sorted = entries.sort((left, right) =>
    right.baseSpeed - left.baseSpeed ||
    right.max - left.max ||
    left.label.localeCompare(right.label)
  );

  const grouped = [];
  for (const entry of sorted) {
    const last = grouped[grouped.length - 1];
    if (last &&
      last.baseSpeed === entry.baseSpeed &&
      last.max === entry.max &&
      last.neutral === entry.neutral &&
      last.zeroEv === entry.zeroEv &&
      last.negative === entry.negative &&
      last.maxScarf === entry.maxScarf &&
      last.neutralScarf === entry.neutralScarf) {
      last.forms.push({
        label: entry.label,
        spritePath: entry.spritePath,
        isMega: entry.isMega
      });
      continue;
    }

    grouped.push({
      baseSpeed: entry.baseSpeed,
      max: entry.max,
      neutral: entry.neutral,
      zeroEv: entry.zeroEv,
      negative: entry.negative,
      maxScarf: entry.maxScarf,
      neutralScarf: entry.neutralScarf,
      forms: [{
        label: entry.label,
        spritePath: entry.spritePath,
        isMega: entry.isMega
      }]
    });
  }

  return grouped;
}

function loadSetlist() {
  const storageKeys = [SETLIST_STORAGE_KEY, ...LEGACY_SETLIST_STORAGE_KEYS];
  let fallbackSetlist = [];
  try {
    for (const key of storageKeys) {
      const saved = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(saved)) {
        continue;
      }
      const normalized = saved
        .filter(item => item?.kind && item?.name)
        .map(item => ({ kind: item.kind, name: item.name, selected: Boolean(item.selected) }));
      if (normalized.length) {
        state.setlist = normalized;
        saveSetlist();
        return;
      }
      if (!fallbackSetlist.length) {
        fallbackSetlist = normalized;
      }
    }
    state.setlist = fallbackSetlist;
  } catch {
    state.setlist = [];
  }
}

function saveSetlist() {
  localStorage.setItem(SETLIST_STORAGE_KEY, JSON.stringify(state.setlist));
}

async function loadBoxData() {
  const seedBox = await loadSeedBoxData();
  const storageKeys = [BOX_STORAGE_KEY, ...LEGACY_BOX_STORAGE_KEYS];
  let fallbackBox = null;
  try {
    for (const key of storageKeys) {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved && Array.isArray(saved.configs) && Array.isArray(saved.teams)) {
        const normalized = normalizeBoxData(saved);
        if (normalized.configs.length || normalized.teams.length) {
          state.box = normalized;
          mergeSeedBoxData(seedBox);
          saveBoxData();
          return;
        }
        if (!fallbackBox) {
          fallbackBox = normalized;
        }
      }
    }
    if (fallbackBox) {
      state.box = fallbackBox;
      mergeSeedBoxData(seedBox);
      saveBoxData();
      return;
    }
  } catch {
    state.box = { configs: [], teams: [] };
  }

  state.box = seedBox;
  saveBoxData();
}

function normalizeBoxData(data) {
  const configs = Array.isArray(data?.configs) ? data.configs.filter(config => config?.id && config?.species?.name) : [];
  const teamNames = new Set(Array.isArray(data?.teams) ? data.teams.filter(Boolean) : []);
  configs.forEach(config => {
    if (config.team) {
      teamNames.add(config.team);
    }
  });
  return {
    configs,
    teams: [...teamNames].sort((left, right) => left.localeCompare(right))
  };
}

function saveBoxData() {
  localStorage.setItem(BOX_STORAGE_KEY, JSON.stringify(state.box));
}

async function loadSeedBoxData() {
  try {
    const response = await fetch(BOX_DATA_FILE, { cache: "no-store" });
    return response.ok ? normalizeBoxData(await response.json()) : { configs: [], teams: [] };
  } catch {
    return { configs: [], teams: [] };
  }
}

function mergeSeedBoxData(seedBox) {
  if (!seedBox.configs.length && !seedBox.teams.length) {
    return false;
  }

  let importedSeedIds = [];
  try {
    importedSeedIds = JSON.parse(localStorage.getItem(BOX_SEED_STORAGE_KEY) || "[]");
  } catch {
    importedSeedIds = [];
  }
  const importedSeeds = new Set(Array.isArray(importedSeedIds) ? importedSeedIds : []);
  const existingIds = new Set(state.box.configs.map(config => config.id));
  let changed = false;

  for (const config of seedBox.configs) {
    if (!importedSeeds.has(config.id) && !existingIds.has(config.id)) {
      state.box.configs.push(config);
      changed = true;
    }
    importedSeeds.add(config.id);
  }

  for (const team of seedBox.teams) {
    if (!state.box.teams.includes(team)) {
      state.box.teams.push(team);
      changed = true;
    }
  }

  state.box = normalizeBoxData(state.box);
  localStorage.setItem(BOX_SEED_STORAGE_KEY, JSON.stringify([...importedSeeds]));
  return changed;
}

function getTeamMembers(teamName) {
  return state.box.configs.filter(config => config.team === teamName);
}

function canAddConfigToTeam(config, teamName) {
  if (!teamName) {
    return { ok: true };
  }
  const members = getTeamMembers(teamName);
  if (members.length >= 6) {
    return { ok: false, message: `${teamName} already has 6 Pokemon.` };
  }
  if (members.some(member => member.id !== config.id && member.species?.dexNo === config.species.dexNo)) {
    return { ok: false, message: `${teamName} already has ${config.species.name} or another form of the same species.` };
  }
  return { ok: true };
}

function addToSetlist(kind, name) {
  if (state.setlist.some(item => item.kind === kind && normalizeName(item.name) === normalizeName(name))) {
    return;
  }
  state.setlist.push({ kind, name, selected: false });
  saveSetlist();
  renderSetlist();
}

function clearSetlist() {
  state.setlist = [];
  saveSetlist();
  renderSetlist();
}

function bindSendButtons(root) {
  for (const button of root.querySelectorAll(".send-setlist-button")) {
    button.addEventListener("click", event => {
      event.stopPropagation();
      addToSetlist(button.dataset.kind, button.dataset.name);
    });
  }
}

function renderSetlist() {
  const isSetTab = state.activeTab === "set";
  elements.addSetlistButton.hidden = !isSetTab;
  const groups = [
    ["move", "Moves"],
    ["ability", "Abilities"]
  ];
  const sections = groups.map(([kind, title]) => {
    const items = state.setlist
      .map((item, index) => ({ ...item, index }))
      .filter(item => item.kind === kind);
    return `
      <section class="setlist-section">
        <h3>${title}</h3>
        <div class="setlist-section-items">
          ${items.length ? items.map(item => `
            <label class="setlist-item">
              ${isSetTab ? `<input type="checkbox" data-index="${item.index}" ${item.selected ? "checked" : ""}>` : ""}
              <span>${item.name}</span>
            </label>
          `).join("") : `<div class="empty-state">No saved ${title.toLowerCase()}.</div>`}
        </div>
      </section>
    `;
  });
  elements.setlistItems.innerHTML = sections.join("");

  for (const input of elements.setlistItems.querySelectorAll("input")) {
    input.addEventListener("change", () => {
      const item = state.setlist[Number(input.dataset.index)];
      if (item) {
        item.selected = input.checked;
        saveSetlist();
      }
    });
  }
}

function addSetlistToSearch() {
  const selectedMoves = state.setlist.filter(item => item.selected && item.kind === "move").slice(0, elements.moveInputs.length);
  const selectedAbility = state.setlist.find(item => item.selected && item.kind === "ability");

  elements.moveInputs.forEach((input, index) => {
    input.value = selectedMoves[index]?.name || "";
  });
  elements.abilitySelect.value = selectedAbility?.name || "";
  syncSelectPlaceholder(elements.abilitySelect);
  setActiveTab("set");
  render();
}

function setActiveTab(tab) {
  state.activeTab = tab;
  for (const [key, tabButton, panel] of [
    ["help", elements.helpTab, elements.helpPanel],
    ["set", elements.setTab, elements.setPanel],
    ["move", elements.moveTab, elements.movePanel],
    ["ability", elements.abilityTab, elements.abilityPanel],
    ["box", elements.boxTab, elements.boxPanel]
  ]) {
    const active = key === tab;
    tabButton.classList.toggle("active", active);
    tabButton.setAttribute("aria-selected", active ? "true" : "false");
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  }
  renderSetlist();
  if (tab === "box") {
    renderBox();
  }
  if (tab === "move") {
    syncMoveRowHeights();
  }
}

function renderSpeedDrawer() {
  const rows = getSpeedTierRows();
  elements.speedTableRows.innerHTML = rows.map(row => `
    <tr class="speed-row" data-speed-form-keys="${row.forms.map(form => normalizeName(form.label)).join(" ")}">
      <td class="speed-table-number">${row.baseSpeed}</td>
      <td>
        <div class="speed-pokemon-list">
          ${row.forms.map(form => `
            <div class="speed-pokemon-cell">
              ${form.spritePath ? `<img class="speed-sprite" src="${form.spritePath}" alt="${form.label} sprite" title="${form.label}">` : ""}
            </div>
          `).join("")}
        </div>
      </td>
      <td>${row.max}</td>
      <td>${row.neutral}</td>
      <td>${row.zeroEv}</td>
      <td>${row.negative}</td>
      <td>${row.maxScarf}</td>
      <td>${row.neutralScarf}</td>
    </tr>
  `).join("");
  setSpeedDrawerStatus(`${rows.length} forms`);
}

function syncSpeedDrawerState() {
  elements.speedDrawer.dataset.open = state.speedDrawerOpen ? "true" : "false";
  elements.speedDrawerTab.setAttribute("aria-expanded", state.speedDrawerOpen ? "true" : "false");
  elements.speedDrawerTab.textContent = state.speedDrawerOpen ? "Hide Speed Tiers" : "Speed Tiers";
  if (typeof document !== "undefined" && document.body?.classList) {
    document.body.classList.toggle("speed-drawer-open", state.speedDrawerOpen);
  }
}

function toggleSpeedDrawer() {
  state.speedDrawerOpen = !state.speedDrawerOpen;
  syncSpeedDrawerState();
}

function openSpeedDrawer() {
  if (!state.speedDrawerOpen) {
    state.speedDrawerOpen = true;
    syncSpeedDrawerState();
  }
}

function findOnSpeedGraph(formLabel) {
  openSpeedDrawer();
  const normalized = normalizeName(formLabel);
  const rows = [...elements.speedTableRows.querySelectorAll(".speed-row")];
  const target = rows.find(row => {
    const keys = row.dataset.speedFormKeys ? row.dataset.speedFormKeys.split(/\s+/) : [];
    return keys.includes(normalized);
  });

  if (!target) {
    return;
  }

  target.scrollIntoView({ block: "center", behavior: "smooth" });
  target.classList.remove("speed-row-flash");
  void target.offsetWidth;
  target.classList.add("speed-row-flash");
}

function getResultCardByKey(entryKey) {
  return [...elements.results.querySelectorAll(".result-card")]
    .find(card => card.dataset.entryKey === entryKey) || null;
}

function rerenderResultsPreservingCard(entryKey, renderCallback) {
  const previousCard = entryKey ? getResultCardByKey(entryKey) : null;
  const previousTop = previousCard ? previousCard.getBoundingClientRect().top : null;

  renderCallback();

  if (previousTop === null) {
    return;
  }

  const nextCard = getResultCardByKey(entryKey);
  if (!nextCard) {
    return;
  }

  const nextTop = nextCard.getBoundingClientRect().top;
  const delta = nextTop - previousTop;
  if (delta) {
    window.scrollBy(0, delta);
  }
}

function toggleExpanded(key) {
  rerenderResultsPreservingCard(key, () => {
    state.expandedKey = state.expandedKey === key ? null : key;
    renderResults();
  });
}

function toggleForm(slug) {
  const species = state.dataset.species.find(entry => entry.slug === slug);
  const forms = species ? getAvailableForms(species) : [];
  if (forms.length < 2) {
    return;
  }

  const activeEntryKey = state.expandedKey && state.expandedKey.startsWith(`${slug}:`)
    ? state.expandedKey
    : null;
  rerenderResultsPreservingCard(activeEntryKey, () => {
    state.formOverrides[slug] = getNextManualForm(species).id;
    renderResults();
  });
}

function setPromptMatches(plan) {
  const moveNames = plan.moves.slice(0, elements.moveInputs.length);
  const typeNames = plan.types.slice(0, elements.typeInputs.length);

  elements.moveInputs.forEach((input, index) => {
    input.value = moveNames[index] || "";
  });

  elements.typeInputs.forEach((input, index) => {
    input.value = typeNames[index] || "";
  });

  elements.abilitySelect.value = plan.ability || "";

  if (plan.sorts.length) {
    elements.sortSelect.value = plan.sorts[0].key;
    elements.sortDirectionSelect.value = plan.sorts[0].direction;
  }

  state.promptPlan = plan;
}

function getExpandedFieldCategory(categoryKey, seen = new Set()) {
  if (seen.has(categoryKey)) {
    return { abilities: [], moves: [] };
  }
  seen.add(categoryKey);

  const category = FIELD_RELATION_CATEGORIES[categoryKey];
  if (!category) {
    return { abilities: [], moves: [] };
  }

  const expanded = {
    abilities: [...(category.abilities || [])],
    moves: [...(category.moves || [])]
  };

  for (const includedKey of category.include || []) {
    const included = getExpandedFieldCategory(includedKey, seen);
    expanded.abilities.push(...included.abilities);
    expanded.moves.push(...included.moves);
  }

  return expanded;
}

function getFieldCategoryMatches(promptText) {
  const normalized = promptText.toLowerCase();
  const matches = [];

  const categories = Object.entries(FIELD_RELATION_CATEGORIES)
    .sort((left, right) => right[1].label.length - left[1].label.length);

  for (const [key, category] of categories) {
    if (matches.some(match => FIELD_RELATION_CATEGORIES[match]?.include?.includes(key))) {
      continue;
    }

    const hit = category.aliases.some(alias => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
      return new RegExp(`\\b${escaped}\\b`, "i").test(normalized);
    });

    if (hit) {
      matches.push(key);
    }
  }

  return matches.filter((key, index, allKeys) => {
    const isCoveredBySpecificCategory = allKeys.some(otherKey =>
      otherKey !== key && FIELD_RELATION_CATEGORIES[key]?.include?.includes(otherKey)
    );
    return !isCoveredBySpecificCategory;
  });
}

function inferRelationFiltersFromPrompt(promptText) {
  if (!/\b(related|synergy|team|teams|setter|setters|abuser|abusers|terrain|weather|sun|sunny|rain|sand|sandstorm|snow|hail|snowscape|solar)\b/i.test(promptText)) {
    return [];
  }

  const categoryKeys = getFieldCategoryMatches(promptText);
  if (!categoryKeys.length) {
    return [];
  }

  const normalized = promptText.toLowerCase();
  const wantsAbilities = /\babilit(?:y|ies)\b/.test(normalized);
  const wantsMoves = /\b(moves?|learn(?:s|ing|pool)?|attacks?)\b/.test(normalized);
  const includeAbilities = wantsAbilities || !wantsMoves;
  const includeMoves = wantsMoves || !wantsAbilities;

  return categoryKeys.map(key => {
    const category = FIELD_RELATION_CATEGORIES[key];
    const expanded = getExpandedFieldCategory(key);
    const abilities = includeAbilities
      ? canonicalExistingNames(expanded.abilities, getAllAbilityNames())
      : [];
    const moves = includeMoves
      ? canonicalExistingNames(expanded.moves, state.dataset.moveNames)
      : [];

    return {
      label: category.label,
      abilities,
      moves
    };
  }).filter(filter => filter.abilities.length || filter.moves.length);
}

function getExactMatchPromptText(promptText, relationFilters) {
  if (!relationFilters.length) {
    return promptText;
  }

  let exactText = promptText;
  for (const filter of relationFilters) {
    const category = Object.values(FIELD_RELATION_CATEGORIES)
      .find(candidate => candidate.label === filter.label);
    for (const alias of category?.aliases || []) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
      exactText = exactText.replace(new RegExp(`\\b${escaped}\\b`, "gi"), " ");
    }
  }

  return exactText;
}

function extractCanonicalNamesFromText(text, options, maxCount = Infinity) {
  const hits = [];
  const seen = new Set();
  const sortedOptions = [...options].sort((left, right) => right.length - left.length);

  for (const option of sortedOptions) {
    const normalizedOption = normalizeName(option);
    if (seen.has(normalizedOption)) {
      continue;
    }

    const escaped = option.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`\\b${escaped}\\b`, "i"),
      new RegExp(`\\b${escaped.replace(/ /g, "\\s+")}\\b`, "i")
    ];

    if (patterns.some(pattern => pattern.test(text))) {
      hits.push(option);
      seen.add(normalizedOption);
      if (hits.length >= maxCount) {
        break;
      }
    }
  }

  return hits;
}

function inferSortsFromPrompt(promptText) {
  const normalized = promptText.toLowerCase();
  const sorts = [];
  const pushSort = (key, direction) => {
    if (!key || sorts.some(sort => sort.key === key)) {
      return;
    }
    sorts.push({ key, direction });
  };

  const phraseRules = [
    { pattern: /\bslowest\b|\blowest speed\b/, key: "speed", direction: "asc" },
    { pattern: /\bfastest\b|\bhighest speed\b/, key: "speed", direction: "desc" },
    { pattern: /\bbulkiest\b|\bhighest defensive total\b/, key: "defenseTotal", direction: "desc" },
    { pattern: /\bweakest defense\b|\blowest defensive total\b/, key: "defenseTotal", direction: "asc" },
    { pattern: /\bstrongest special attack\b|\bhighest special attack\b/, key: "specialAttack", direction: "desc" },
    { pattern: /\bweakest special attack\b|\blowest special attack\b/, key: "specialAttack", direction: "asc" },
    { pattern: /\bstrongest physical attack\b|\bhighest attack\b/, key: "attack", direction: "desc" },
    { pattern: /\bweakest attack\b|\blowest attack\b/, key: "attack", direction: "asc" },
    { pattern: /\bhighest hp\b|\bmost hp\b/, key: "hp", direction: "desc" },
    { pattern: /\blowest hp\b|\bleast hp\b/, key: "hp", direction: "asc" }
  ];

  for (const rule of phraseRules) {
    if (rule.pattern.test(normalized)) {
      pushSort(rule.key, rule.direction);
    }
  }

  for (const [alias, key] of [...STAT_ALIASES.entries()].sort((a, b) => b[0].length - a[0].length)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
    if (new RegExp(`\\bhighest\\s+${escaped}\\b`, "i").test(normalized) ||
      new RegExp(`\\bmost\\s+${escaped}\\b`, "i").test(normalized) ||
      new RegExp(`\\bbest\\s+${escaped}\\b`, "i").test(normalized)) {
      pushSort(key, "desc");
    }
    if (new RegExp(`\\blowest\\s+${escaped}\\b`, "i").test(normalized) ||
      new RegExp(`\\bleast\\s+${escaped}\\b`, "i").test(normalized) ||
      new RegExp(`\\bworst\\s+${escaped}\\b`, "i").test(normalized)) {
      pushSort(key, "asc");
    }
  }

  if (!sorts.length) {
    pushSort(getSelectedSort(), getSelectedSortDirection());
  }

  return sorts.slice(0, 3);
}

function applyPromptSearch() {
  const promptText = elements.promptInput.value.trim();
  if (!promptText) {
    state.promptPlan = null;
    render();
    return;
  }

  const relations = inferRelationFiltersFromPrompt(promptText);
  const exactMatchText = getExactMatchPromptText(promptText, relations);
  const plan = {
    moves: extractCanonicalNamesFromText(exactMatchText, state.dataset.moveNames, elements.moveInputs.length),
    types: extractCanonicalNamesFromText(exactMatchText, state.dataset.typeNames, elements.typeInputs.length),
    ability: extractCanonicalNamesFromText(exactMatchText, getAllAbilityNames(), 1)[0] || "",
    sorts: inferSortsFromPrompt(promptText),
    relations
  };

  setPromptMatches(plan);
  render();
}

function clearPromptSearch() {
  elements.promptInput.value = "";
  state.promptPlan = null;
  render();
}

function clearSpeciesSearch() {
  elements.speciesInput.value = "";
  state.expandedKey = null;
  renderResults();
}

function renderResults() {
  if (!state.dataset) {
    return;
  }

  const matches = getMatches();
  elements.results.innerHTML = "";
  const activeSpeciesQuery = getSpeciesSearchQuery();

  if (!hasActiveSearch()) {
    elements.resultCount.textContent = `${matches.length} Pokemon`;
  } else {
    elements.resultCount.textContent = `${matches.length} match${matches.length === 1 ? "" : "es"}`;
  }

  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = activeSpeciesQuery
      ? `No Champions Pokemon match "${activeSpeciesQuery}" with the current filters.`
      : "No Champions Pokemon currently match every selected filter.";
    elements.results.appendChild(empty);
    return;
  }

  const selectedMoves = getActiveMoveMatchNames();
  const selectedAbilities = getActiveAbilityMatchNames();
  const activeSortPlan = getActiveSortPlan();
  const expandedIndex = matches.findIndex(entry => getEntryKey(entry) === state.expandedKey);
  const resultGap = 16;
  const compactCardWidth = 320;
  const columnCount = Math.max(1, Math.floor((elements.results.clientWidth + resultGap) / (compactCardWidth + resultGap)));
  const rowStartIndex = expandedIndex >= 0 ? Math.floor(expandedIndex / columnCount) * columnCount : -1;
  const orderedMatches = expandedIndex >= 0
    ? [
      ...matches.slice(0, rowStartIndex),
      matches[expandedIndex],
      ...matches.slice(rowStartIndex, expandedIndex),
      ...matches.slice(expandedIndex + 1)
    ]
    : matches;

  for (const entry of orderedMatches) {
    const { species } = entry;
    const entryKey = getEntryKey(entry);
    const card = document.createElement("article");
    card.className = `result-card${state.expandedKey === entryKey ? " expanded" : ""}`;
    card.dataset.entryKey = entryKey;
    const displayForm = getDisplayFormForEntry(entry, activeSortPlan);

    const matchedMoves = selectedMoves.filter(moveName =>
      species.moves.some(speciesMove => normalizeName(speciesMove) === normalizeName(moveName))
    );
    const matchedAbilities = selectedAbilities.filter(abilityName =>
      displayForm.abilities.some(speciesAbility => normalizeName(speciesAbility) === normalizeName(abilityName))
    );
    const isExpanded = state.expandedKey === entryKey;
    const allowManualToggle = getAvailableForms(species).length > 1 && entry.formMode === "auto";

    card.innerHTML = `
      <div class="compact-card-shell">
        <div class="result-card-button">
          <div class="result-card-top">
            ${displayForm.spritePath ? `<img class="pokemon-sprite" src="${displayForm.spritePath}" alt="${displayForm.label} sprite">` : ""}
            <div class="result-card-heading">
              <h3>${displayForm.label}</h3>
            </div>
          </div>
          <div class="meta">#${String(species.dexNo).padStart(4, "0")} ${formatTypeIcons(displayForm.types)}</div>
          <div class="meta">Abilities: ${displayForm.abilities.join(", ") || "Unknown"}</div>
          ${matchedAbilities.length ? `<div class="moves-list">Matched abilities: ${matchedAbilities.join(", ")}</div>` : ""}
          ${matchedMoves.length ? `<div class="moves-list">Matched moves: ${matchedMoves.join(", ")}</div>` : ""}
        </div>
        <div class="always-visible-stats">
          <div class="detail-block">
            <h4>${displayForm.isMega ? displayForm.label : "Base Stats"}</h4>
            <div class="stat-grid compact-stat-grid">
              ${formatStats(displayForm.stats)}
            </div>
          </div>
        </div>
        <div class="result-card-actions">
          ${allowManualToggle ? getManualFormControl(species, displayForm) : ""}
          <button type="button" class="secondary speed-graph-button">Find on Speed Graph</button>
        </div>
        <button type="button" class="details-toggle-button" aria-expanded="${isExpanded ? "true" : "false"}" aria-label="${isExpanded ? "Collapse details" : "Expand details"}"></button>
      </div>
      ${isExpanded ? `
        <section class="expanded-moves-panel">
          <h4>Moves</h4>
          ${formatExpandedSetDropdowns(species, displayForm)}
        </section>
        <section class="expanded-stats-panel">
          <h4>Stats</h4>
          ${formatAdjustableStatTable(displayForm.stats)}
        </section>
        <section class="expanded-actions-panel" aria-label="Set actions">
          <button type="button" class="secondary expanded-search-button">Fill from Search</button>
          <button type="button" class="secondary expanded-box-button">Add to Box</button>
        </section>
        <div class="details-panel">
          <section class="detail-block expanded-ability-block">
            <h4>${displayForm.isMega ? `${displayForm.label} Abilities` : "Abilities"}</h4>
            <div class="ability-list">
              ${formatAbilityDetails(displayForm.abilities)}
            </div>
          </section>
          <section class="detail-block expanded-learnpool-block">
            <h4>Champions Learnpool</h4>
            <div class="learnpool-list">
              ${formatMoveList(species.moves)}
            </div>
          </section>
        </div>
      ` : ""}
    `;

    card.querySelector(".details-toggle-button").addEventListener("click", () => toggleExpanded(entryKey));
    bindExpandedSetControls(card);
    card.querySelector(".expanded-search-button")?.addEventListener("click", () => fillExpandedSetFromSearch(card, species, displayForm));
    card.querySelector(".expanded-box-button")?.addEventListener("click", () => openBoxSavePrompt(getExpandedConfigFromCard(card, species, displayForm)));
    for (const learnpoolRow of card.querySelectorAll(".learnpool-pick-row")) {
      learnpoolRow.addEventListener("click", () => addLearnpoolMoveToConfig(card, learnpoolRow.dataset.moveName));
      learnpoolRow.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          addLearnpoolMoveToConfig(card, learnpoolRow.dataset.moveName);
        }
      });
    }
    const toggleButton = card.querySelector(".form-toggle-button");
    if (toggleButton) {
      toggleButton.addEventListener("click", () => toggleForm(species.slug));
    }
    for (const segmentButton of card.querySelectorAll(".form-segment-button")) {
      segmentButton.addEventListener("click", () => {
        state.formOverrides[species.slug] = segmentButton.dataset.formId;
        renderResults();
      });
    }
    card.querySelector(".speed-graph-button").addEventListener("click", () => findOnSpeedGraph(displayForm.label));
    elements.results.appendChild(card);
  }
}

function render() {
  const abilityCount = getAllAbilityNames().length;
  setStatus(
    `${state.dataset.species.length} species | ` +
    `${state.metadata.moves.length} moves | ` +
    `${abilityCount} abilities`
  );
  renderSpeedDrawer();
  syncSpeedDrawerState();
  renderResults();
}

function clearFilters() {
  for (const input of [...elements.moveInputs, ...elements.typeInputs]) {
    input.value = "";
  }
  elements.speciesInput.value = "";
  elements.abilitySelect.value = "";
  syncSelectPlaceholder(elements.abilitySelect);
  elements.sortSelect.value = "alphabetical";
  elements.sortDirectionSelect.value = "asc";
  state.promptPlan = null;
  state.formOverrides = {};
  state.expandedKey = null;
  render();
}

async function loadDataset() {
  const [datasetResponse, metadataResponse, abilityResponse, itemResponse, abilityFilterSourceResponse] = await Promise.all([
    fetch("champions_dataset.json", { cache: "no-store" }),
    fetch("champions_search_metadata.json", { cache: "no-store" }),
    fetch("ability_descriptions.json", { cache: "no-store" }),
    fetch("champions_items.json", { cache: "no-store" }),
    fetch("ability_filter_sources.json", { cache: "no-store" })
  ]);
  if (!datasetResponse.ok) {
    throw new Error(`Could not load champions_dataset.json (${datasetResponse.status})`);
  }
  if (!metadataResponse.ok) {
    throw new Error(`Could not load champions_search_metadata.json (${metadataResponse.status})`);
  }
  if (!abilityResponse.ok) {
    throw new Error(`Could not load ability_descriptions.json (${abilityResponse.status})`);
  }
  if (!itemResponse.ok) {
    throw new Error(`Could not load champions_items.json (${itemResponse.status})`);
  }
  if (!abilityFilterSourceResponse.ok) {
    throw new Error(`Could not load ability_filter_sources.json (${abilityFilterSourceResponse.status})`);
  }

  state.dataset = await datasetResponse.json();
  state.dataset.species = expandSeparateFormCards(state.dataset.species);
  state.metadata = await metadataResponse.json();
  state.abilityDescriptions = await abilityResponse.json();
  state.items = (await itemResponse.json()).items || [];
  state.abilityFilterSources = await abilityFilterSourceResponse.json();
  loadSetlist();
  await loadBoxData();
  populateOptions();
  renderMoveSearch();
  renderAbilitySearch();
  renderSetlist();
  renderBox();
  render();
}

for (const input of [...elements.moveInputs, ...elements.typeInputs]) {
  input.addEventListener("input", render);
  input.addEventListener("change", render);
}

elements.abilitySelect.addEventListener("change", () => {
  syncSelectPlaceholder(elements.abilitySelect);
  render();
});
elements.sortSelect.addEventListener("change", render);
elements.sortDirectionSelect.addEventListener("change", render);
elements.clearButton.addEventListener("click", clearFilters);
elements.speciesInput.addEventListener("input", () => {
  state.expandedKey = null;
  render();
});
elements.speciesInput.addEventListener("change", () => {
  state.expandedKey = null;
  render();
});
elements.clearSpeciesButton.addEventListener("click", clearSpeciesSearch);
elements.applyPromptButton.addEventListener("click", applyPromptSearch);
elements.clearPromptButton.addEventListener("click", clearPromptSearch);
elements.speedDrawerTab.addEventListener("click", toggleSpeedDrawer);
elements.helpTab.addEventListener("click", () => setActiveTab("help"));
elements.setTab.addEventListener("click", () => setActiveTab("set"));
elements.moveTab.addEventListener("click", () => setActiveTab("move"));
elements.abilityTab.addEventListener("click", () => setActiveTab("ability"));
elements.boxTab.addEventListener("click", () => setActiveTab("box"));
for (const input of [
  elements.moveNameSearch,
  elements.moveTypeSearch,
  elements.moveCategorySearch,
  elements.movePrioritySearch,
  elements.moveFieldSearch,
  elements.moveTargetSearch,
  elements.moveClassificationSearch
]) {
  input.addEventListener("input", renderMoveSearch);
  input.addEventListener("change", renderMoveSearch);
}

for (const input of [elements.boxNameSearch, elements.boxTeamFilter, elements.boxSortSelect, elements.boxSortDirectionSelect]) {
  input.addEventListener("input", renderBox);
  input.addEventListener("change", renderBox);
}

elements.boxSaveTeamSelect.addEventListener("change", () => {
  elements.boxSaveNewTeamRow.hidden = elements.boxSaveTeamSelect.value !== "__new";
  if (!elements.boxSaveNewTeamRow.hidden) {
    elements.boxSaveNewTeamInput.focus();
  }
});
elements.boxSaveConfirmButton.addEventListener("click", confirmBoxSave);
elements.boxSaveCancelButton.addEventListener("click", closeBoxSavePrompt);
elements.boxSaveModal.addEventListener("click", event => {
  if (event.target === elements.boxSaveModal) {
    closeBoxSavePrompt();
  }
});
elements.boxViewExportButton.addEventListener("click", () => exportShowdownConfigs(getBoxMatches()));
elements.showdownImportButton.addEventListener("click", importShowdownSet);
elements.showdownImportConfirmButton.addEventListener("click", confirmShowdownImport);
elements.showdownImportCancelButton.addEventListener("click", closeShowdownImportPrompt);
elements.showdownImportModal.addEventListener("click", event => {
  if (event.target === elements.showdownImportModal) {
    closeShowdownImportPrompt();
  }
});
elements.showdownCopyButton.addEventListener("click", async () => {
  elements.showdownText.select();
  try {
    await navigator.clipboard.writeText(elements.showdownText.value);
  } catch {
    document.execCommand("copy");
  }
});
elements.moveSlotConfirmButton.addEventListener("click", confirmMoveSlotPrompt);
elements.moveSlotCancelButton.addEventListener("click", closeMoveSlotPrompt);
elements.moveSlotModal.addEventListener("click", event => {
  if (event.target === elements.moveSlotModal) {
    closeMoveSlotPrompt();
  }
});
elements.abilityNameSearch.addEventListener("input", renderAbilitySearch);
elements.abilityNameSearch.addEventListener("change", renderAbilitySearch);
elements.addSetlistButton.addEventListener("click", addSetlistToSearch);
elements.clearSetlistButton.addEventListener("click", clearSetlist);
elements.promptInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    applyPromptSearch();
  }
});
window.addEventListener("resize", syncMoveRowHeights);

loadDataset().catch(error => {
  console.error(error);
  setStatus("Could not load Champions dataset.");
  elements.results.innerHTML = `<div class="empty-state">${error.message}</div>`;
});
