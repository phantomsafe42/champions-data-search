import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await import(pathToFileURL(path.join(projectRoot, "form_card_projection.js")));

const { battleSignature, projectCastformTypeSegments, projectChampionFormCards, projectConsumerDisplayRecords, projectDefaultBattleCards, projectGourgeistSizeCard, projectGenderBattleForms, projectMimikyuDefaultCard, projectSquawkabillyColorCards } = globalThis.ChampionsFormCardProjection;
assert.equal(typeof battleSignature, "function");
assert.equal(typeof projectCastformTypeSegments, "function");
assert.equal(typeof projectChampionFormCards, "function");
assert.equal(typeof projectConsumerDisplayRecords, "function");
assert.equal(typeof projectDefaultBattleCards, "function");
assert.equal(typeof projectGourgeistSizeCard, "function");
assert.equal(typeof projectGenderBattleForms, "function");
assert.equal(typeof projectMimikyuDefaultCard, "function");
assert.equal(typeof projectSquawkabillyColorCards, "function");

const dataset = JSON.parse(await fs.readFile(path.join(projectRoot, "dataset", "champions_dataset.json"), "utf8"));
const visibleRecords = projectConsumerDisplayRecords(dataset.species);
const projection = projectChampionFormCards(dataset.species);

const expectedAliases = {
  "alcremie-caramel-swirl": "alcremie",
  "alcremie-lemon-cream": "alcremie",
  "alcremie-matcha-cream": "alcremie",
  "alcremie-mint-cream": "alcremie",
  "alcremie-rainbow-swirl": "alcremie",
  "alcremie-ruby-cream": "alcremie",
  "alcremie-ruby-swirl": "alcremie",
  "maushold-four": "maushold",
  "polteageist-antique": "polteageist",
  "sinistcha-masterpiece": "sinistcha",
  "squawkabilly-blue": "squawkabilly",
  "squawkabilly-white": "squawkabilly-yellow",
  "vivillon-archipelago": "vivillon",
  "vivillon-continental": "vivillon",
  "vivillon-elegant": "vivillon",
  "vivillon-fancy": "vivillon",
  "vivillon-garden": "vivillon",
  "vivillon-high-plains": "vivillon",
  "vivillon-icy-snow": "vivillon",
  "vivillon-jungle": "vivillon",
  "vivillon-marine": "vivillon",
  "vivillon-modern": "vivillon",
  "vivillon-monsoon": "vivillon",
  "vivillon-ocean": "vivillon",
  "vivillon-pokeball": "vivillon",
  "vivillon-polar": "vivillon",
  "vivillon-river": "vivillon",
  "vivillon-sandstorm": "vivillon",
  "vivillon-savanna": "vivillon",
  "vivillon-sun": "vivillon",
  "vivillon-tundra": "vivillon"
};

assert.equal(visibleRecords.length, 290);
assert.equal(projection.species.length, 259);
assert.deepEqual(projection.aliases, expectedAliases);

const projectedBySlug = new Map(projection.species.map(species => [species.slug, species]));
for (const hiddenSlug of Object.keys(expectedAliases)) {
  assert.equal(projectedBySlug.has(hiddenSlug), false, `${hiddenSlug} still has a separate card`);
}

for (const retainedSlug of [
  "alcremie",
  "maushold",
  "polteageist",
  "sinistcha",
  "squawkabilly",
  "squawkabilly-yellow",
  "vivillon",
  "raichu-alolan",
  "raichu",
  "rotom-heat",
  "rotom-wash",
  "basculegion-f"
]) {
  assert.equal(projectedBySlug.has(retainedSlug), true, `${retainedSlug} should remain independently selectable`);
}

assert.ok(projectedBySlug.get("sinistcha").availableNames.includes("Sinistcha Masterpiece"));
assert.ok(projectedBySlug.get("alcremie").availableNames.includes("Alcremie Rainbow Swirl"));
assert.ok(projectedBySlug.get("vivillon").availableNames.includes("Vivillon Pokeball"));

const squawkabillyCards = projection.species.filter(species => species.dexNo === 931);
assert.deepEqual(squawkabillyCards.map(species => species.primaryName), ["Squawkabilly Green", "Squawkabilly Yellow"]);
const squawkabillyGreen = projectedBySlug.get("squawkabilly");
const squawkabillyYellow = projectedBySlug.get("squawkabilly-yellow");
assert.equal(squawkabillyGreen.baseFormSegmentLabel, "G");
assert.equal(squawkabillyGreen.spriteQuery.form, "green");
assert.equal(squawkabillyGreen.embeddedSelectableForms[0].label, "Squawkabilly Blue");
assert.equal(squawkabillyGreen.embeddedSelectableForms[0].segmentLabel, "B");
assert.equal(squawkabillyGreen.embeddedSelectableForms[0].spriteQuery.form, "blue");
assert.equal(squawkabillyYellow.baseFormSegmentLabel, "Y");
assert.equal(squawkabillyYellow.spriteQuery.form, "yellow");
assert.equal(squawkabillyYellow.embeddedSelectableForms[0].label, "Squawkabilly White");
assert.equal(squawkabillyYellow.embeddedSelectableForms[0].segmentLabel, "W");
assert.equal(squawkabillyYellow.embeddedSelectableForms[0].spriteQuery.form, "white");
assert.equal(squawkabillyCards.flatMap(species => [species.primaryName, ...(species.availableNames || []), ...(species.embeddedSelectableForms || []).flatMap(form => [form.label, form.shortLabel])]).some(name => /Plumage/iu.test(name)), false);
assert.equal(visibleRecords.find(species => species.slug === "squawkabilly").primaryName, "Squawkabilly Green Plumage", "Squawkabilly projection mutated its input");
const divergentSquawkabilly = visibleRecords
  .filter(species => species.dexNo === 931)
  .map(species => species.slug === "squawkabilly-blue" ? { ...species, abilities: [...species.abilities, "Sheer Force"] } : species);
assert.equal(projectSquawkabillyColorCards(divergentSquawkabilly).species.length, 3, "battle-distinct Squawkabilly colors must not be grouped together");

const gourgeist = projectedBySlug.get("gourgeist");
assert.equal(gourgeist.primaryName, "Gourgeist Medium");
assert.equal(gourgeist.baseFormLabel, "Medium");
assert.equal(gourgeist.baseFormSegmentLabel, "M");
assert.equal(gourgeist.spriteQuery.form, "average");
assert.ok(gourgeist.availableNames.includes("Gourgeist"));
assert.ok(gourgeist.availableNames.includes("Gourgeist Medium"));
assert.deepEqual(gourgeist.embeddedSelectableForms.map(form => form.segmentLabel).sort(), ["J", "L", "S"]);
assert.equal(visibleRecords.find(species => species.slug === "gourgeist").primaryName, "Gourgeist", "Gourgeist projection mutated its input");

const castform = projectedBySlug.get("castform");
assert.equal(castform.baseFormSegmentLabel, "Normal");
assert.equal(castform.baseFormSegmentType, "Normal");
assert.equal(castform.baseFormSegmentOrder, 0);
assert.deepEqual(castform.battleForms.map(form => ({ id: form.id, label: form.segmentLabel, order: form.segmentOrder, type: form.segmentType })), [
  { id: "rainy", label: "Water", order: 2, type: "Water" },
  { id: "snowy", label: "Ice", order: 3, type: "Ice" },
  { id: "sunny", label: "Fire", order: 1, type: "Fire" }
]);
assert.equal(visibleRecords.find(species => species.slug === "castform").baseFormSegmentLabel, undefined, "Castform projection mutated its input");

const mimikyu = projectedBySlug.get("mimikyu");
assert.deepEqual(mimikyu.battleForms, []);
assert.equal(dataset.species.find(species => species.slug === "mimikyu").battleForms.length, 1, "Mimikyu projection mutated its input");

const genderProjection = projectGenderBattleForms(projection.species);
const genderProjectedBySlug = new Map(genderProjection.map(species => [species.slug, species]));
for (const [slug, expectedName, expectedForm] of [
  ["meowstic-m", "Meowstic M", "male"],
  ["meowstic-f", "Meowstic F", "female"],
  ["indeedee", "Indeedee M", "male"],
  ["indeedee-f", "Indeedee F", "female"],
  ["basculegion", "Basculegion M", "male"],
  ["basculegion-f", "Basculegion F", "female"]
]) {
  const species = genderProjectedBySlug.get(slug);
  assert.ok(species, `${slug} should remain visible`);
  assert.equal(species.primaryName, expectedName);
  assert.equal(species.baseFormLabel, expectedForm === "female" ? "F" : "M");
  assert.equal(species.spriteQuery.form, expectedForm);
  assert.equal(species.spriteQuery.gender, expectedForm);
}

assert.deepEqual(genderProjectedBySlug.get("basculegion").embeddedSelectableForms, []);
assert.deepEqual(genderProjectedBySlug.get("basculegion-f").embeddedSelectableForms, []);
assert.equal(genderProjectedBySlug.get("basculegion").availableNames.includes("Basculegion Female"), false);
assert.ok(genderProjectedBySlug.get("basculegion-f").availableNames.includes("Basculegion Female"));
assert.ok(genderProjectedBySlug.get("meowstic-f").availableNames.includes("Meowstic Female"));
assert.ok(genderProjectedBySlug.get("indeedee").availableNames.includes("Indeedee Male"));
assert.equal(genderProjectedBySlug.get("kangaskhan").primaryName, "Kangaskhan", "single-sex species must not be relabeled");
assert.equal(projectedBySlug.get("indeedee").primaryName, "Indeedee Male", "gender projection mutated its input");

const base = {
  sourceId: "example",
  slug: "example",
  dexNo: 9999,
  primaryName: "Example",
  availableNames: ["Example"],
  form: "Default",
  baseFormLabel: "Default Form",
  spriteQuery: { form: "default" },
  types: ["Normal"],
  abilities: ["Run Away"],
  moves: ["Tackle"],
  baseStats: { hp: 50, attack: 50 },
  gender: null
};
const cosmetic = {
  ...base,
  sourceId: "examplecosmetic",
  slug: "example-cosmetic",
  primaryName: "Example Cosmetic",
  availableNames: ["Example Cosmetic"],
  form: "Cosmetic",
  baseFormLabel: "Base form",
  spriteQuery: { form: "cosmetic" }
};
const abilityForm = {
  ...cosmetic,
  sourceId: "exampleability",
  slug: "example-ability",
  primaryName: "Example Ability",
  abilities: ["Intimidate"]
};
const futureMechanicForm = {
  ...cosmetic,
  sourceId: "examplefuture",
  slug: "example-future",
  primaryName: "Example Future",
  battleRule: { damageMultiplier: 2 }
};
const synthetic = projectDefaultBattleCards([base, cosmetic, abilityForm, futureMechanicForm]);
assert.deepEqual(synthetic.species.map(species => species.slug), ["example", "example-ability", "example-future"]);
assert.equal(synthetic.aliases["example-cosmetic"], "example");
assert.equal(base.availableNames.includes("Example Cosmetic"), false, "projection mutated the source record");
assert.notEqual(battleSignature(base), battleSignature(abilityForm));
assert.notEqual(battleSignature(base), battleSignature(futureMechanicForm));

console.log(JSON.stringify({
  status: "form-card-projection-valid",
  sourceCards: visibleRecords.length,
  projectedCards: projection.species.length,
  collapsedCards: Object.keys(projection.aliases).length,
  collapsedGroups: projection.collapsedGroups
}, null, 2));
