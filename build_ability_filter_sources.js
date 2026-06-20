const fs = require("fs");
const path = require("path");

const OUTPUT_PATH = path.join(__dirname, "ability_filter_sources.json");
const CATEGORY_INDEX_URL = "https://bulbapedia.bulbagarden.net/wiki/Category:Abilities_by_effect";
const BULBAPEDIA_BASE_URL = "https://bulbapedia.bulbagarden.net";

const CATEGORY_CONFIG = {
  active_end_turn: "Category:Abilities_that_activate_at_the_end_of_the_turn",
  active_contact: "Category:Abilities_that_activate_on_contact",
  active_entering: "Category:Abilities_that_activate_upon_entering_battle",
  active_exiting: "Category:Abilities_that_activate_upon_exiting_battle",
  active_damage: "Category:Abilities_that_activate_upon_taking_damage",
  team_allies: "Category:Abilities_that_affect_allies",
  team_ally_only: "Category:Abilities_which_only_have_an_effect_with_an_ally",
  hp_restore: "Category:Abilities_which_restore_HP",
  priority: "Category:Abilities_that_affect_move_priority",
  weather_affected: "Category:Abilities_affected_by_weather_conditions",
  weather_effects: "Category:Abilities_with_effects_on_weather_conditions",
  terrain_affected: "Category:Abilities_affected_by_terrain",
  terrain_effects: "Category:Abilities_with_effects_on_terrain",
  move_type_change: "Category:Abilities_that_can_modify_move_types",
  move_type_effects: "Category:Effects_that_can_modify_move_types",
  pokemon_type_change: "Category:Abilities_that_change_a_Pok%C3%A9mon%27s_type",
  move_power: "Category:Abilities_that_increase_move_power",
  type_enhancing: "Category:Type-enhancing_Abilities",
  stat_increasing: "Category:Stat_increasing_Abilities",
  stat_raising: "Category:Stat_raising_Abilities",
  stat_lowering: "Category:Stat_lowering_Abilities",
  stat_decreasing: "Category:Stat-decreasing_Abilities",
  prevent_stat_reductions: "Category:Abilities_that_prevent_stat_reductions",
  damage_inflicting: "Category:Damage-inflicting_Abilities",
  status_nonvolatile: "Category:Abilities_that_inflict_non-volatile_status_conditions",
  status_volatile: "Category:Abilities_that_inflict_volatile_status_conditions",
  damage_taken: "Category:Abilities_that_alter_damage_taken"
};

const FILTER_GROUPS = {
  active: ["active_end_turn", "active_contact", "active_entering", "active_exiting", "active_damage"],
  team: ["team_allies", "team_ally_only"],
  hp: ["hp_restore"],
  priority: ["priority"],
  weatherTerrain: ["weather_affected", "weather_effects", "terrain_affected", "terrain_effects"],
  typeEffect: ["move_type_change", "move_type_effects", "pokemon_type_change", "type_enhancing"],
  statCandidates: ["stat_increasing", "stat_raising", "stat_lowering", "stat_decreasing", "prevent_stat_reductions"],
  targetCandidates: ["stat_lowering", "stat_decreasing", "damage_inflicting", "status_nonvolatile", "status_volatile", "damage_taken"],
  opponentCandidates: ["stat_lowering", "stat_decreasing", "damage_inflicting", "status_nonvolatile", "status_volatile", "damage_taken"]
};

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&eacute;/gi, "é")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function parseAbilityNames(html) {
  const names = [];
  const seen = new Set();
  for (const match of html.matchAll(/<a href="\/wiki\/([^"]+_\(Ability\))" title="([^"]+ \(Ability\))">/g)) {
    const title = decodeHtml(match[2]).replace(/\s*\(Ability\)\s*$/, "");
    if (!title || seen.has(title)) {
      continue;
    }
    seen.add(title);
    names.push(title);
  }
  return names.sort((left, right) => left.localeCompare(right));
}

async function fetchCategory(title) {
  const url = `${BULBAPEDIA_BASE_URL}/wiki/${title}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "champions-data-search/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const html = await response.text();
  const pageTitleMatch = html.match(/<h1[^>]*class="firstHeading[^"]*"[^>]*>[\s\S]*?<span class="mw-page-title-main">([^<]+)<\/span>/i);

  return {
    title: decodeHtml(pageTitleMatch?.[1] || title.replace(/^Category:/, "").replace(/_/g, " ")),
    url,
    abilities: parseAbilityNames(html)
  };
}

function collectGroupAbilities(categories, categoryKeys) {
  const seen = new Set();
  const abilities = [];

  for (const categoryKey of categoryKeys) {
    for (const ability of categories[categoryKey]?.abilities || []) {
      if (seen.has(ability)) {
        continue;
      }
      seen.add(ability);
      abilities.push(ability);
    }
  }

  return abilities.sort((left, right) => left.localeCompare(right));
}

async function main() {
  const categoryEntries = await Promise.all(
    Object.entries(CATEGORY_CONFIG).map(async ([key, title]) => [key, await fetchCategory(title)])
  );

  const categories = Object.fromEntries(categoryEntries);
  const filters = Object.fromEntries(
    Object.entries(FILTER_GROUPS).map(([key, categoryKeys]) => [key, {
      categoryKeys,
      abilities: collectGroupAbilities(categories, categoryKeys)
    }])
  );

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceIndex: CATEGORY_INDEX_URL,
    categories,
    filters
  }, null, 2));

  console.log(`Wrote ${OUTPUT_PATH}`);
  for (const [key, filter] of Object.entries(filters)) {
    console.log(`${key}: ${filter.abilities.length}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
