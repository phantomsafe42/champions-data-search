const fs = require("fs");
const path = require("path");

const OUTPUT_PATH = path.join(__dirname, "champions_dataset.json");
const ITEMS_OUTPUT_PATH = path.join(__dirname, "champions_items.json");
const SPRITES_DIR = path.join(__dirname, "sprites");
const AVAILABLE_URL = "https://www.serebii.net/pokemonchampions/pokemon.shtml";
const ITEMS_URL = "https://www.serebii.net/pokemonchampions/items.shtml";
const MOVE_DATA_URL = "https://nerd-of-now.github.io/NCP-VGC-Damage-Calculator/script_res/move_data.js";
const ABILITY_DATA_URL = "https://nerd-of-now.github.io/NCP-VGC-Damage-Calculator/script_res/ability_data.js";
const SEREBII_BASE_URL = "https://www.serebii.net";
const SHOWDOWN_GEN5_BASE_URL = "https://play.pokemonshowdown.com/sprites/gen5/";

function decodeHtml(value) {
    return String(value || "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&#039;/g, "'")
        .replace(/&#x2019;/g, "'")
        .replace(/&#8217;/g, "'")
        .replace(/&eacute;/g, "é")
        .replace(/&nbsp;/g, " ")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeName(value) {
    return decodeHtml(value)
        .toLowerCase()
        .replace(/é/g, "e")
        .replace(/♀/g, "f")
        .replace(/♂/g, "m")
        .replace(/['’.\-]/g, "")
        .replace(/\s+/g, "");
}

async function fetchText(url) {
    const response = await fetch(url, {
        headers: {
            "user-agent": "champions-move-finder/1.0"
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
    }

    return response.text();
}

async function fetchBytes(url) {
    const response = await fetch(url, {
        headers: {
            "user-agent": "champions-move-finder/1.0"
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
    }

    return Buffer.from(await response.arrayBuffer());
}

function parseStringArrayLiteral(block) {
    const items = [];
    const regex = /'((?:\\'|[^'])*)'/g;
    let match;
    while ((match = regex.exec(block)) !== null) {
        items.push(match[1].replace(/\\'/g, "'"));
    }
    return items;
}

function parseNcpMoveList(source) {
    const match = source.match(/var MOVES_CHAMPIONS = \{\};\s*\[(.*?)\]\.forEach/s);
    if (!match) {
        throw new Error("Could not parse MOVES_CHAMPIONS list from move_data.js");
    }
    return parseStringArrayLiteral(match[1]);
}

function parseNcpAbilityList(source) {
    const match = source.match(/var ABILITIES_CHAMPIONS = \[(.*?)\];/s);
    if (!match) {
        throw new Error("Could not parse ABILITIES_CHAMPIONS list from ability_data.js");
    }
    return parseStringArrayLiteral(match[1]);
}

function parseAvailableEntries(html) {
    const rows = [...html.matchAll(/<tr>\s*<td align="center" class="(?:fooinfo|fooben)">\s*#?(\d+)\s*<\/td>[\s\S]*?<a href="\/pokedex-champions\/([^"/]+)\/"><img[^>]*alt="([^"]+) Image"[^>]*class="stdsprite"\/?><\/a>[\s\S]*?<a href="\/pokedex-champions\/\2\/">([^<]+)<br \/><\/a>/gi)];
    const bySlug = new Map();

    for (const row of rows) {
        const dexNo = Number(row[1]);
        const slug = row[2];
        const imageAltName = decodeHtml(row[3]);
        const displayName = decodeHtml(row[4]);
        const current = bySlug.get(slug) || {
            slug,
            dexNo,
            availableNames: []
        };

        current.dexNo = Math.min(current.dexNo, dexNo);
        for (const name of [displayName, imageAltName]) {
            if (name && !current.availableNames.includes(name)) {
                current.availableNames.push(name);
            }
        }

        bySlug.set(slug, current);
    }

    return [...bySlug.values()].sort((a, b) => a.dexNo - b.dexNo || a.slug.localeCompare(b.slug));
}

function parseChampionsItems(html) {
    const sectionRegex = /<div align="center"><font size="4"><b><u>([^<]+)<\/u><\/b><\/font><\/div>[\s\S]*?<table class="dextable" align="center"\s*>[\s\S]*?<tr>\s*<td width="32" class="fooevo">Picture<\/td>\s*<td class="fooevo">Name<\/td>\s*<td class="fooevo">Effect<\/td>\s*<td class="fooevo" width="50%">Location<\/td>\s*<\/tr>([\s\S]*?)<\/table>/gi;
    const rowRegex = /<tr height="32">\s*<td class="cen">[\s\S]*?<\/td>\s*<td class="fooinfo"><a href="[^"]+">([^<]+)<\/a><\/td>\s*<td class="fooinfo">([\s\S]*?)<\/td><td class="fooinfo">([\s\S]*?)<\/td>\s*<\/tr>/gi;
    const items = [];
    let sectionMatch;

    while ((sectionMatch = sectionRegex.exec(html)) !== null) {
        const category = decodeHtml(sectionMatch[1]);
        const tableBody = sectionMatch[2];
        let rowMatch;

        while ((rowMatch = rowRegex.exec(tableBody)) !== null) {
            items.push({
                category,
                name: decodeHtml(rowMatch[1]),
                effect: decodeHtml(rowMatch[2]),
                location: decodeHtml(rowMatch[3]).replace(/\s+/g, " ").trim()
            });
        }
    }

    return items;
}

function parseTypes(pageHtml) {
    const summaryMatch = pageHtml.match(/<td class="fooevo">Gender Ratio<\/td>\s*<td class="fooevo">Type<\/td>[\s\S]*?<td class="(?:cen|fooinfo)">([\s\S]*?)<\/td>\s*<\/tr>\s*<tr>\s*<td class="foo">Classification<\/td>/i);
    if (summaryMatch) {
        return parseTypesFromHtml(summaryMatch[1]);
    }

    const widgetMatch = pageHtml.match(/<table width="140" class="tooltab"><tr><td class="tooltabhead" width="50%">Gender<\/td><td class="tooltabhead">Type<\/td><\/tr><tr>[\s\S]*?<td class="tooltabcon">[\s\S]*?<\/td><td class="tooltabcon">([\s\S]*?)<\/td><\/tr><\/table>/i);
    if (widgetMatch) {
        return parseTypesFromHtml(widgetMatch[1]);
    }

    return [];
}

function parseTypeRows(pageHtml) {
    const summaryMatch = pageHtml.match(/<td class="fooevo">Gender Ratio<\/td>\s*<td class="fooevo">Type<\/td>[\s\S]*?<td class="(?:cen|fooinfo)">([\s\S]*?)<\/td>\s*<\/tr>\s*<tr>\s*<td class="foo">Classification<\/td>/i);
    const widgetMatch = pageHtml.match(/<table width="140" class="tooltab"><tr><td class="tooltabhead" width="50%">Gender<\/td><td class="tooltabhead">Type<\/td><\/tr><tr>[\s\S]*?<td class="tooltabcon">[\s\S]*?<\/td><td class="tooltabcon">([\s\S]*?)<\/td><\/tr><\/table>/i);
    const fragment = summaryMatch?.[1] || widgetMatch?.[1] || "";
    if (!fragment) {
        return [];
    }

    const rows = [];
    const rowRegex = /<tr>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
    let match;
    while ((match = rowRegex.exec(fragment)) !== null) {
        const label = decodeHtml(match[1]);
        const types = parseTypesFromHtml(match[2]);
        if (label && types.length) {
            rows.push({ label, types });
        }
    }

    if (!rows.length) {
        const types = parseTypesFromHtml(fragment);
        if (types.length) {
            rows.push({ label: "Standard", types });
        }
    }

    return rows;
}

function parseTypesFromHtml(fragment) {
    const seen = new Set();
    const types = [];
    const patterns = [
        /alt="([A-Za-z]+)-type"/g,
        /\/type\/([a-z]+)\.(?:gif|png)"/gi,
        /href="\/pokedex-(?:sm|bw|sv)\/([a-z]+)\.shtml"/gi
    ];

    for (const pattern of patterns) {
        for (const match of fragment.matchAll(pattern)) {
            const typeName = decodeHtml(match[1]);
            if (!typeName) {
                continue;
            }

            const normalized = typeName.toLowerCase();
            if (!seen.has(normalized)) {
                seen.add(normalized);
                types.push(typeName[0].toUpperCase() + typeName.slice(1).toLowerCase());
            }
        }
    }

    return types;
}

function parseAbilities(pageHtml) {
    const abilitiesMatch = pageHtml.match(/<b>Abilities<\/b>:\s*([\s\S]*?)<\/td>/i);
    if (!abilitiesMatch) {
        return [];
    }

    const names = [];
    for (const match of abilitiesMatch[1].matchAll(/<b>([^<]+)<\/b>/g)) {
        const name = decodeHtml(match[1]);
        if (name && name !== "Abilities") {
            names.push(name);
        }
    }
    return [...new Set(names)];
}

function parseAbilitySegments(pageHtml) {
    const abilitiesMatch = pageHtml.match(/<b>Abilities<\/b>:\s*([\s\S]*?)<\/td>/i);
    if (!abilitiesMatch) {
        return [];
    }

    const segments = [];
    const segmentRegex = /([\s\S]*?)\(\s*([^)]+?)\s*\)(?:\s*-\s*|$)/g;
    let match;
    while ((match = segmentRegex.exec(abilitiesMatch[1])) !== null) {
        const label = decodeHtml(match[2]);
        const abilities = [];
        for (const abilityMatch of match[1].matchAll(/<b>([^<]+)<\/b>/g)) {
            const name = decodeHtml(abilityMatch[1]);
            if (name && name !== "Abilities") {
                abilities.push(name);
            }
        }

        if (label && abilities.length) {
            segments.push({
                label,
                abilities: [...new Set(abilities)]
            });
        }
    }

    return segments;
}

function parseMoves(pageHtml) {
    const attacksIndex = pageHtml.indexOf('<a name="attacks"></a><table class="dextable">');
    if (attacksIndex === -1) {
        return [];
    }

    const segment = pageHtml.slice(attacksIndex);
    const firstTableEnd = segment.indexOf("</table>");
    const table = firstTableEnd === -1 ? segment : segment.slice(0, firstTableEnd);
    const moves = [...table.matchAll(/<td rowspan="2" class="fooinfo"><a href="\/attackdex-champions\/[^"]+">([^<]+)<\/a><\/td>/g)]
        .map(match => decodeHtml(match[1]));

    return [...new Set(moves)];
}

function parseMoveSections(pageHtml) {
    const sections = [];
    const sectionRegex = /<a name="attacks"><\/a><table class="dextable"><tr[^>]*><td colspan="10" class="fooevo"><h3><a name="([^"]+)"><\/a>([^<]+)<\/h3><\/td><\/tr>([\s\S]*?)<\/table>/gi;
    let match;
    while ((match = sectionRegex.exec(pageHtml)) !== null) {
        const anchor = decodeHtml(match[1]);
        const title = decodeHtml(match[2]);
        const moves = [...match[3].matchAll(/<td rowspan="2" class="fooinfo"><a href="\/attackdex-champions\/[^"]+">([^<]+)<\/a><\/td>/g)]
            .map(row => decodeHtml(row[1]));
        sections.push({
            anchor,
            title,
            moves: [...new Set(moves)]
        });
    }
    return sections;
}

function makeAbsoluteUrl(maybeRelativeUrl) {
    if (!maybeRelativeUrl) {
        return "";
    }
    if (/^https?:\/\//i.test(maybeRelativeUrl)) {
        return maybeRelativeUrl;
    }
    return new URL(maybeRelativeUrl, SEREBII_BASE_URL).toString();
}

function parseFormSelectors(pageHtml) {
    return [...pageHtml.matchAll(/<a class="sprite-select" title="([^"]+)" data-key="([^"]+)" href="#">/g)].map(match => ({
        title: decodeHtml(match[1]),
        dataKey: decodeHtml(match[2])
    }));
}

function parseBaseSpriteUrl(pageHtml) {
    const match = pageHtml.match(/<img src="([^"]+)"[^>]*alt="Normal Sprite"[^>]*style="height:250px"/i);
    return match ? makeAbsoluteUrl(match[1]) : "";
}

function parseMegaSpriteUrl(pageHtml) {
    const megaIndex = pageHtml.indexOf('<a name="mega"></a><table class="dextable">');
    if (megaIndex === -1) {
        return "";
    }

    const section = pageHtml.slice(megaIndex, pageHtml.indexOf('<table class="dextable">', megaIndex + 40) === -1 ? undefined : pageHtml.indexOf('<table class="dextable">', megaIndex + 40));
    const match = section.match(/<img src="([^"]+)" \/><\/td><td class="pkmn"><img src="\/Shiny/i);
    return match ? makeAbsoluteUrl(match[1]) : "";
}

function normalizeFormFamily(value) {
    const normalized = normalizeName(value);
    if (!normalized || /^(normal|regular|standard)$/.test(normalized)) {
        return "base";
    }
    if (normalized.includes("hisu")) {
        return "hisui";
    }
    if (normalized.includes("alola")) {
        return "alola";
    }
    if (normalized.includes("galar")) {
        return "galar";
    }
    if (normalized.includes("paldea")) {
        return "paldea";
    }
    if (normalized.includes("combatbreed")) {
        return "paldea";
    }
    if (normalized.includes("blazebreed")) {
        return "blaze";
    }
    if (normalized.includes("aquabreed")) {
        return "aqua";
    }
    return normalized;
}

function buildRegionalDisplayName(baseName, family) {
    switch (family) {
        case "hisui":
            return `Hisuian ${baseName}`;
        case "alola":
            return `Alolan ${baseName}`;
        case "galar":
            return `Galarian ${baseName}`;
        case "paldea":
            return `Paldean ${baseName}`;
        case "blaze":
            return `Blaze Breed ${baseName}`;
        case "aqua":
            return `Aqua Breed ${baseName}`;
        default:
            return baseName;
    }
}

function buildRegionalSlug(baseSlug, family) {
    switch (family) {
        case "base":
            return baseSlug;
        case "hisui":
            return `${baseSlug}-hisuian`;
        case "alola":
            return `${baseSlug}-alolan`;
        case "galar":
            return `${baseSlug}-galarian`;
        case "paldea":
            return `${baseSlug}-paldean`;
        case "blaze":
            return `${baseSlug}-blaze`;
        case "aqua":
            return `${baseSlug}-aqua`;
        default:
            return `${baseSlug}-${family}`;
    }
}

function buildShowdownId(baseName, family) {
    const normalized = normalizeName(baseName);
    switch (family) {
        case "base":
            return normalized;
        case "mega":
            return `${normalized}mega`;
        case "hisui":
            return `${normalized}hisui`;
        case "alola":
            return `${normalized}alola`;
        case "galar":
            return `${normalized}galar`;
        case "paldea":
            return `${normalized}paldea`;
        case "blaze":
            return `${normalized}paldeablaze`;
        case "aqua":
            return `${normalized}paldeaaqua`;
        default:
            return "";
    }
}

function parseStatBlock(sectionHtml) {
    const labelsMatch = sectionHtml.match(/<td align="center" class="fooevo">HP<\/td>\s*<td align="center" class="fooevo">Attack<\/td>\s*<td align="center" class="fooevo">Defense<\/td>\s*<td align="center" class="fooevo">Sp\. Attack<\/td>\s*<td align="center" class="fooevo">Sp\. Defense<\/td>\s*<td align="center" class="fooevo">Speed<\/td>/i);
    const statsMatch = sectionHtml.match(/Base Stats - Total:\s*(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>/i);
    if (!labelsMatch || !statsMatch) {
        return null;
    }

    return {
        hp: Number(statsMatch[2]),
        attack: Number(statsMatch[3]),
        defense: Number(statsMatch[4]),
        specialAttack: Number(statsMatch[5]),
        specialDefense: Number(statsMatch[6]),
        speed: Number(statsMatch[7]),
        total: Number(statsMatch[1])
    };
}

function parseBaseStats(pageHtml) {
    const statsIndex = pageHtml.indexOf('<a name="stats"></a><table class="dextable">');
    if (statsIndex !== -1) {
        const section = pageHtml.slice(statsIndex, pageHtml.indexOf('<p><hr', statsIndex) === -1 ? undefined : pageHtml.indexOf('<p><hr', statsIndex));
        return parseStatBlock(section);
    }

    const fallbackMatch = pageHtml.match(/<table class="dextable"><tr>\s*<td colspan="8" class="fooevo"><h2>Stats[\s\S]*?<\/table>/i);
    return fallbackMatch ? parseStatBlock(fallbackMatch[0]) : null;
}

function parseAlternateStats(pageHtml) {
    const sections = [];
    const sectionRegex = /<table class="dextable"><tr>\s*<td colspan="8" class="fooevo"><h2>(Stats - [^<]+)<\/h2><\/td><\/tr>[\s\S]*?<\/table>/gi;
    let match;
    while ((match = sectionRegex.exec(pageHtml)) !== null) {
        const heading = decodeHtml(match[1]).replace(/^Stats -\s*/i, "");
        const stats = parseStatBlock(match[0]);
        if (heading && stats) {
            sections.push({ heading, stats });
        }
    }
    return sections;
}

function parseMegaEvolutions(pageHtml) {
    const marker = '<a name="mega"></a><table class="dextable">';
    const sections = [];
    let startIndex = pageHtml.indexOf(marker);

    while (startIndex !== -1) {
        const nextIndex = pageHtml.indexOf(marker, startIndex + marker.length);
        sections.push(pageHtml.slice(startIndex, nextIndex === -1 ? undefined : nextIndex));
        startIndex = nextIndex;
    }

    const megaForms = [];

    for (const section of sections) {
        const nameMatch = section.match(/<h3>(Mega[^<]+)<\/h3>/i);
        if (!nameMatch) {
            continue;
        }

        const typeRowMatch = section.match(/<td class="fooevo">Type<\/td>[\s\S]*?<td class="cen">([\s\S]*?)<\/td>/i);
        const abilityNames = [];
        const abilityMatch = section.match(/<b>Abilities<\/b>:\s*([\s\S]*?)<\/td>/i);
        if (abilityMatch) {
            for (const match of abilityMatch[1].matchAll(/<b>([^<]+)<\/b>/g)) {
                const name = decodeHtml(match[1]);
                if (name && name !== "Abilities") {
                    abilityNames.push(name);
                }
            }
        }

        megaForms.push({
            name: decodeHtml(nameMatch[1]).replace(/\s+/g, " ").trim(),
            types: typeRowMatch ? parseTypesFromHtml(typeRowMatch[1]) : [],
            abilities: [...new Set(abilityNames)],
            baseStats: parseStatBlock(section)
        });
    }

    return megaForms;
}

function getMegaFormId(megaName) {
    const normalized = normalizeName(megaName).replace(/^mega/, "");
    if (normalized.endsWith("x")) {
        return "mega-x";
    }
    if (normalized.endsWith("y")) {
        return "mega-y";
    }
    return "mega";
}

function getMegaFamilyKey(megaName) {
    const formId = getMegaFormId(megaName);
    if (formId === "mega-x") return "megax";
    if (formId === "mega-y") return "megay";
    return "mega";
}

async function cacheSprite(slug, formId, spriteUrls) {
    if (!spriteUrls.length) {
        return "";
    }

    fs.mkdirSync(SPRITES_DIR, { recursive: true });
    const fileName = `${slug}_${formId}_pixel.png`;
    const filePath = path.join(SPRITES_DIR, fileName);
    const relativePath = `sprites/${fileName}`;

    if (!fs.existsSync(filePath)) {
        let cached = false;
        for (const spriteUrl of spriteUrls) {
            if (!spriteUrl) {
                continue;
            }

            try {
                const bytes = await fetchBytes(spriteUrl);
                fs.writeFileSync(filePath, bytes);
                cached = true;
                break;
            } catch (error) {
                // Try the next sprite candidate.
            }
        }

        if (!cached) {
            return "";
        }
    }

    return relativePath;
}

function buildSpriteCandidates(primaryName, formId, fallbackUrl) {
    const showdownId = formId.startsWith("mega")
        ? buildShowdownId(primaryName, formId === "mega-x" ? "megax" : formId === "mega-y" ? "megay" : "mega")
        : buildShowdownId(primaryName, "base");
    return [
        `${SHOWDOWN_GEN5_BASE_URL}${showdownId}.png`,
        fallbackUrl
    ].filter(Boolean);
}

function buildMegaArtFallbackUrl(dexNo, formId) {
    const paddedDexNo = String(dexNo || "").padStart(3, "0");
    if (!paddedDexNo || paddedDexNo === "000") {
        return "";
    }

    if (formId === "mega-x") {
        return makeAbsoluteUrl(`/legendsz-a/pokemon/${paddedDexNo}-mx.png`);
    }
    if (formId === "mega-y") {
        return makeAbsoluteUrl(`/legendsz-a/pokemon/${paddedDexNo}-my.png`);
    }
    if (formId === "mega-z") {
        return makeAbsoluteUrl(`/legendsz-a/pokemon/${paddedDexNo}-mz.png`);
    }
    if (formId === "mega") {
        return makeAbsoluteUrl(`/legendsz-a/pokemon/${paddedDexNo}-m.png`);
    }

    return "";
}

function buildMegaSpriteCandidates(primaryName, formId, fallbackUrl, dexNo) {
    const showdownId = buildShowdownId(primaryName, formId === "mega-x" ? "megax" : formId === "mega-y" ? "megay" : formId === "mega-z" ? "megaz" : "mega");
    return [
        `${SHOWDOWN_GEN5_BASE_URL}${showdownId}.png`,
        buildMegaArtFallbackUrl(dexNo, formId),
        fallbackUrl
    ].filter(Boolean);
}

function buildRegionalSpriteCandidates(baseName, family, dataKey) {
    const showdownId = buildShowdownId(baseName, family);
    const serebiiHomeUrl = dataKey ? makeAbsoluteUrl(`/pokemonhome/pokemon/${dataKey}.png`) : "";
    return [
        showdownId ? `${SHOWDOWN_GEN5_BASE_URL}${showdownId}.png` : "",
        serebiiHomeUrl
    ].filter(Boolean);
}

async function buildSpeciesDataset(entry) {
    const url = `https://www.serebii.net/pokedex-champions/${entry.slug}/`;
    const pageHtml = await fetchText(url);
    const baseSpriteUrl = parseBaseSpriteUrl(pageHtml);
    const megaSpriteUrl = parseMegaSpriteUrl(pageHtml);
    const megaEvolutions = parseMegaEvolutions(pageHtml);
    const baseName = entry.availableNames[0] || entry.slug;
    const typeRows = parseTypeRows(pageHtml);
    const abilitySegments = parseAbilitySegments(pageHtml);
    const moveSections = parseMoveSections(pageHtml);
    const alternateStats = parseAlternateStats(pageHtml);
    const formSelectors = parseFormSelectors(pageHtml);

    const baseTypes = typeRows[0]?.types || parseTypes(pageHtml);
    const baseAbilities = abilitySegments[0]?.abilities || parseAbilities(pageHtml);
    const baseMoves = moveSections.find(section => section.anchor === "standardlevel")?.moves || parseMoves(pageHtml);
    const species = [{
        slug: entry.slug,
        dexNo: entry.dexNo,
        primaryName: baseName,
        availableNames: entry.availableNames,
        url,
        types: baseTypes,
        abilities: baseAbilities,
        moves: baseMoves,
        baseStats: parseBaseStats(pageHtml),
        spritePath: await cacheSprite(entry.slug, "base", buildSpriteCandidates(baseName, "base", baseSpriteUrl)),
        megaEvolution: megaEvolutions[0] ? {
            ...megaEvolutions[0],
            formId: getMegaFormId(megaEvolutions[0].name),
            spritePath: await cacheSprite(entry.slug, getMegaFormId(megaEvolutions[0].name), buildMegaSpriteCandidates(baseName, getMegaFormId(megaEvolutions[0].name), megaSpriteUrl, entry.dexNo))
        } : null,
        megaEvolutions: await Promise.all(megaEvolutions.map(async megaEvolution => ({
            ...megaEvolution,
            formId: getMegaFormId(megaEvolution.name),
            spritePath: await cacheSprite(entry.slug, getMegaFormId(megaEvolution.name), buildMegaSpriteCandidates(baseName, getMegaFormId(megaEvolution.name), megaSpriteUrl, entry.dexNo))
        })))
    }];

    const typeByFamily = new Map(typeRows.slice(1).map(row => [normalizeFormFamily(row.label), row.types]));
    const abilitiesByFamily = new Map(abilitySegments.slice(1).map(segment => [normalizeFormFamily(segment.label), segment.abilities]));
    const statsByFamily = new Map(alternateStats.map(section => [normalizeFormFamily(section.heading), section]));
    const selectorByFamily = new Map(formSelectors.slice(1).map(selector => [normalizeFormFamily(selector.title), selector]));

    for (const section of moveSections) {
        if (section.anchor === "standardlevel") {
            continue;
        }

        const family = normalizeFormFamily(section.title);
        if (family === "base" || !statsByFamily.has(family)) {
            continue;
        }

        const selector = selectorByFamily.get(family);
        const statsSection = statsByFamily.get(family);
        const primaryName = statsSection?.heading || buildRegionalDisplayName(baseName, family);
        species.push({
            slug: buildRegionalSlug(entry.slug, family),
            dexNo: entry.dexNo,
            primaryName,
            availableNames: [primaryName],
            url,
            types: typeByFamily.get(family) || baseTypes,
            abilities: abilitiesByFamily.get(family) || baseAbilities,
            moves: section.moves,
            baseStats: statsSection.stats,
            spritePath: await cacheSprite(buildRegionalSlug(entry.slug, family), "base", buildRegionalSpriteCandidates(baseName, family, selector?.dataKey)),
            megaEvolution: null,
            megaEvolutions: []
        });
    }

    return species;
}

async function main() {
    const [availableHtml, itemsHtml, moveDataSource, abilityDataSource] = await Promise.all([
        fetchText(AVAILABLE_URL),
        fetchText(ITEMS_URL),
        fetchText(MOVE_DATA_URL),
        fetchText(ABILITY_DATA_URL)
    ]);

    const availableEntries = parseAvailableEntries(availableHtml);
    const items = parseChampionsItems(itemsHtml);
    const ncpMoves = parseNcpMoveList(moveDataSource);
    const ncpAbilities = parseNcpAbilityList(abilityDataSource);

    const species = [];
    for (let index = 0; index < availableEntries.length; index += 1) {
        const builtEntries = await buildSpeciesDataset(availableEntries[index]);
        species.push(...builtEntries);
        console.log(`Fetched ${index + 1} / ${availableEntries.length}: ${builtEntries.map(entry => entry.primaryName).join(", ")}`);
    }

    const learnedMoveNames = [...new Set(species.flatMap(entry => entry.moves))].sort();
    const usedAbilityNames = [...new Set(species.flatMap(entry => entry.abilities))].sort();
    const usedTypeNames = [...new Set(species.flatMap(entry => entry.types))].sort();

    const ncpMoveSet = new Set(ncpMoves.map(normalizeName));
    const ncpAbilitySet = new Set(ncpAbilities.map(normalizeName));

    const movesMissingFromNcp = learnedMoveNames.filter(name => !ncpMoveSet.has(normalizeName(name)));
    const abilitiesMissingFromNcp = usedAbilityNames.filter(name => !ncpAbilitySet.has(normalizeName(name)));

    const payload = {
        generatedAt: new Date().toISOString(),
        source: {
            availablePokemon: AVAILABLE_URL,
            items: ITEMS_URL,
            moveData: MOVE_DATA_URL,
            abilityData: ABILITY_DATA_URL
        },
        summary: {
            speciesCount: species.length,
            uniqueMoveCount: learnedMoveNames.length,
            uniqueAbilityCount: usedAbilityNames.length,
            uniqueTypeCount: usedTypeNames.length
        },
        verification: {
            movesMissingFromNcp,
            abilitiesMissingFromNcp
        },
        moveNames: learnedMoveNames,
        abilityNames: usedAbilityNames,
        typeNames: usedTypeNames,
        species
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));
    fs.writeFileSync(ITEMS_OUTPUT_PATH, JSON.stringify({
        source: ITEMS_URL,
        generatedAt: payload.generatedAt,
        count: items.length,
        items
    }, null, 2));

    console.log(`Wrote ${OUTPUT_PATH}`);
    console.log(`Wrote ${ITEMS_OUTPUT_PATH}`);
    console.log(`Species: ${species.length}`);
    console.log(`Items: ${items.length}`);
    console.log(`Unique moves: ${learnedMoveNames.length}`);
    console.log(`Unique abilities: ${usedAbilityNames.length}`);
    console.log(`Moves missing from NCP list: ${movesMissingFromNcp.length}`);
    console.log(`Abilities missing from NCP list: ${abilitiesMissingFromNcp.length}`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
