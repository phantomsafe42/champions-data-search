const fs = require("fs");
const path = require("path");
const vm = require("vm");

const POKEBASE_MOVES_URL = "https://pokebase.app/pokemon-champions/moves";
const SEREBII_MOVES_URL = "https://www.serebii.net/pokemonchampions/moves.shtml";
const METADATA_PATH = path.join(__dirname, "champions_search_metadata.json");
const REMOVED_CHAMPIONS_MOVES = new Set(["Pound"].map(normalizeName));
const ADDED_CHAMPIONS_MOVES = [
  ["Milk Drink", { classification: ["healing"] }],
  ["Power Shift", { classification: ["stat change"] }],
  ["Soft-Boiled", { classification: ["healing"] }],
  ["Spore", { classification: [] }],
  ["Struggle", { classification: ["contact", "recoil"] }]
];
const SEREBII_MOVE_BASE_URL = "https://www.serebii.net";

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/é/g, "e")
    .replace(/♀/g, "f")
    .replace(/♂/g, "m")
    .replace(/['’.\-]/g, "")
    .replace(/\s+/g, "");
}

function titleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "champions-data-search/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.text();
}

function extractNextFlightText(html) {
  const pushes = [];
  const scriptPattern = /<script>(self\.__next_f\.push\([\s\S]*?\))<\/script>/g;
  let match;

  while ((match = scriptPattern.exec(html)) !== null) {
    vm.runInNewContext(match[1], {
      self: {
        __next_f: {
          push(value) {
            pushes.push(value);
          }
        }
      }
    });
  }

  if (!pushes.length) {
    throw new Error("Could not find PokéBase Next.js flight payload.");
  }

  return pushes.map(value => value[1] || "").join("");
}

function extractPokebaseMoves(html) {
  const flightText = extractNextFlightText(html);
  const movesLine = flightText.split("\n").find(line => line.startsWith("6:"));

  if (!movesLine) {
    throw new Error("Could not find PokéBase moves payload row.");
  }

  const payload = JSON.parse(movesLine.slice(2));
  const docs = payload?.[3]?.data?.docs;

  if (!Array.isArray(docs)) {
    throw new Error("PokéBase moves payload did not contain a docs array.");
  }

  return docs;
}

function toNullableNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&eacute;/gi, "é")
    .replace(/&mdash;|&ndash;/gi, "--")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTargetText(value) {
  return decodeHtml(value)
    .replace(/Pok[eé]mon/g, "Pokemon")
    .replace(/\s+/g, " ")
    .trim();
}

function categorizeMoveTarget(targetText) {
  const normalized = normalizeTargetText(targetText);
  switch (normalized) {
    case "Selected Target":
    case "Random Target":
    case "Previous opponent":
    case "Self":
    case "Self or Ally":
    case "Adjacent Ally":
    case "Team":
    case "Field":
    case "Special":
      return normalized;
    case "All":
      return "All Pokemon";
    case "Allies":
    case "All allies":
      return "All Allies";
    case "Ally":
      return "Ally Side";
    case "Enemy Side":
    case "Opponent's Side":
      return "Opponent's Side";
    case "All opponents":
    case "All Adjacent Foes":
    case "All Adjacent Opponents":
      return "All Opponents";
    case "All Adjacent Pokemon":
      return "All Adjacent Pokemon";
    default:
      return normalized;
  }
}

function parseSerebiiNumber(value) {
  const text = decodeHtml(value);
  if (!text || text === "--") {
    return null;
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function parseSerebiiType(cellHtml) {
  const match = cellHtml.match(/\/type\/([^/.]+)\.(?:gif|png)/i);
  return match ? titleCase(match[1]) : "";
}

function parseSerebiiCategory(cellHtml) {
  const match = cellHtml.match(/\/type\/([^/.]+)\.png/i);
  if (!match) {
    return "";
  }

  return match[1].toLowerCase() === "other" ? "Status" : titleCase(match[1]);
}

function extractSerebiiMoves(html) {
  const moves = [];
  const rowPattern = /<tr>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    if (!/attackdex-champions/i.test(rowHtml)) {
      continue;
    }

    const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(match => match[1]);
    if (cells.length < 7) {
      continue;
    }

    moves.push({
      name: decodeHtml(cells[0]),
      type: parseSerebiiType(cells[1]),
      category: parseSerebiiCategory(cells[2]),
      pp: parseSerebiiNumber(cells[3]),
      power: parseSerebiiNumber(cells[4]),
      accuracy: parseSerebiiNumber(cells[5]),
      description: decodeHtml(cells.slice(6).join(" "))
    });
  }

  return moves;
}

function extractSerebiiMoveLinks(html) {
  const links = new Map();
  for (const match of html.matchAll(/<a href="(\/attackdex-champions\/([^"]+)\.shtml)">([^<]+)<\/a>/gi)) {
    const name = decodeHtml(match[3]);
    if (!name || links.has(normalizeName(name))) {
      continue;
    }
    links.set(normalizeName(name), {
      name,
      slug: match[2],
      url: `${SEREBII_MOVE_BASE_URL}${match[1]}`
    });
  }
  return links;
}

function extractSerebiiMoveTarget(html) {
  const detailsIndex = html.search(/<b>Pok(?:&eacute;|é)mon Hit in Battle<\/b>/i);
  if (detailsIndex === -1) {
    return "";
  }

  const segment = html.slice(detailsIndex, detailsIndex + 1500);
  const rows = [...segment.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)]
    .map(rowMatch => [...rowMatch[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(cellMatch => normalizeTargetText(cellMatch[1])))
    .filter(row => row.length);

  return rows[0]?.[2] || "";
}

async function buildSerebiiTargetMap(moveLinks, targetsDirPath = "") {
  const targetsByName = new Map();
  const targetsDir = targetsDirPath ? path.resolve(targetsDirPath) : "";

  for (const entry of moveLinks.values()) {
    let pageHtml = "";
    if (targetsDir) {
      const localPath = path.join(targetsDir, `${entry.slug}.html`);
      if (fs.existsSync(localPath)) {
        pageHtml = fs.readFileSync(localPath, "utf8");
      }
    }

    if (!pageHtml) {
      pageHtml = await fetchText(entry.url);
    }

    const target = extractSerebiiMoveTarget(pageHtml);
    if (target) {
      targetsByName.set(normalizeName(entry.name), target);
    }
  }

  return targetsByName;
}

function firstPresent(...values) {
  return values.find(value => value !== undefined && value !== null && value !== "");
}

function sourcedText(serebiiMove, pokebaseMove, existingMove, field, pokebaseValue) {
  if (serebiiMove && serebiiMove[field]) {
    return serebiiMove[field];
  }

  return firstPresent(pokebaseValue, existingMove[field]);
}

function sourcedNumber(serebiiMove, pokebaseMove, existingMove, field, pokebaseValue) {
  if (serebiiMove && Object.prototype.hasOwnProperty.call(serebiiMove, field)) {
    return serebiiMove[field];
  }

  return firstPresent(pokebaseValue, existingMove[field], null);
}

function mergeMove(existingMove, serebiiMove, pokebaseMove) {
  const rawTarget = firstPresent(serebiiMove?.targetDetail, serebiiMove?.target, existingMove.targetDetail, existingMove.target, "");
  return {
    ...existingMove,
    type: sourcedText(serebiiMove, pokebaseMove, existingMove, "type", pokebaseMove?.type?.name),
    category: sourcedText(serebiiMove, pokebaseMove, existingMove, "category", titleCase(pokebaseMove?.damageClass)),
    target: rawTarget ? categorizeMoveTarget(rawTarget) : "",
    targetDetail: rawTarget,
    description: sourcedText(serebiiMove, pokebaseMove, existingMove, "description", pokebaseMove?.description),
    power: sourcedNumber(serebiiMove, pokebaseMove, existingMove, "power", toNullableNumber(pokebaseMove?.power)),
    accuracy: sourcedNumber(serebiiMove, pokebaseMove, existingMove, "accuracy", toNullableNumber(pokebaseMove?.accuracy)),
    pp: sourcedNumber(serebiiMove, pokebaseMove, existingMove, "pp", toNullableNumber(pokebaseMove?.pp))
  };
}

function createMove(serebiiMove, pokebaseMove, overrides = {}) {
  const name = firstPresent(serebiiMove?.name, pokebaseMove?.name);
  return mergeMove({
    name,
    type: "Unknown",
    category: "Unknown",
    priority: overrides.priority || 0,
    classification: overrides.classification || [],
    weatherTerrain: overrides.weatherTerrain || [],
    target: overrides.target || "",
    targetDetail: overrides.targetDetail || "",
    description: "",
    power: null,
    accuracy: null,
    pp: null
  }, serebiiMove, pokebaseMove);
}

async function main() {
  const serebiiHtmlPath = process.argv[2];
  const pokebaseHtmlPath = process.argv[3];
  const serebiiTargetsDirPath = process.argv[4];
  const serebiiHtml = serebiiHtmlPath
    ? fs.readFileSync(path.resolve(serebiiHtmlPath), "utf8")
    : await fetchText(SEREBII_MOVES_URL);
  const pokebaseHtml = pokebaseHtmlPath
    ? fs.readFileSync(path.resolve(pokebaseHtmlPath), "utf8")
    : await fetchText(POKEBASE_MOVES_URL);

  const serebiiMoves = extractSerebiiMoves(serebiiHtml);
  const serebiiMoveLinks = extractSerebiiMoveLinks(serebiiHtml);
  const serebiiTargetsByName = await buildSerebiiTargetMap(serebiiMoveLinks, serebiiTargetsDirPath);
  const serebiiByName = new Map(
    serebiiMoves.map(move => {
      const normalizedName = normalizeName(move.name);
      const rawTarget = serebiiTargetsByName.get(normalizedName) || "";
      return [normalizedName, {
        ...move,
        target: rawTarget ? categorizeMoveTarget(rawTarget) : "",
        targetDetail: rawTarget
      }];
    })
  );
  const pokebaseMoves = extractPokebaseMoves(pokebaseHtml);
  const pokebaseByName = new Map(
    pokebaseMoves.map(move => [normalizeName(move.name), move])
  );

  const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, "utf8"));
  const unmatched = [];
  const startingMoveCount = metadata.moves.length;

  metadata.moves = metadata.moves.filter(move => !REMOVED_CHAMPIONS_MOVES.has(normalizeName(move.name))).map(move => {
    const serebiiMove = serebiiByName.get(normalizeName(move.name));
    const pokebaseMove = pokebaseByName.get(normalizeName(move.name));
    if (!serebiiMove && !pokebaseMove) {
      unmatched.push(move.name);
      return move;
    }
    return mergeMove(move, serebiiMove, pokebaseMove);
  });

  for (const [name, overrides] of ADDED_CHAMPIONS_MOVES) {
    if (metadata.moves.some(move => normalizeName(move.name) === normalizeName(name))) {
      continue;
    }

    const serebiiMove = serebiiByName.get(normalizeName(name));
    const pokebaseMove = pokebaseByName.get(normalizeName(name));
    if (!serebiiMove && !pokebaseMove) {
      unmatched.push(name);
      continue;
    }

    metadata.moves.push(createMove(serebiiMove, pokebaseMove, overrides));
  }

  metadata.moves.sort((left, right) => left.name.localeCompare(right.name));
  metadata.moveFilters.targets = [...new Set(metadata.moves.map(move => move.target).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));

  fs.writeFileSync(METADATA_PATH, `${JSON.stringify(metadata, null, 2)}\n`);

  console.log(`Loaded ${serebiiMoves.length} Serebii moves.`);
  console.log(`Loaded ${pokebaseMoves.length} PokéBase moves.`);
  console.log(`Started with ${startingMoveCount} Champions metadata moves.`);
  console.log(`Finished with ${metadata.moves.length} Champions metadata moves.`);
  if (unmatched.length) {
    console.log(`Unmatched moves: ${unmatched.join(", ")}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
