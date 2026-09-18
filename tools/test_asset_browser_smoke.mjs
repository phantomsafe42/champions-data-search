import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import { createServer as createNetServer } from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const commonGitDirectory = execFileSync("git", ["-C", projectRoot, "rev-parse", "--path-format=absolute", "--git-common-dir"], {
  encoding: "utf8",
  windowsHide: true,
}).trim();
const primaryProjectRoot = path.dirname(commonGitDirectory);
const workspaceRoot = path.resolve(primaryProjectRoot, "..", "..");
const assetReleaseRoot = path.join(workspaceRoot, "Datasets", "Pokemon Assets", "release");
const temporaryRoot = path.join(projectRoot, ".codex-tmp");
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const regionalFormPattern = /^(Alola|Galar|Hisui|Paldea)(?:-|$)/iu;

function normalizeIdentityToken(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/gu, "");
}

async function loadRegionalSpriteExpectations() {
  const dataset = JSON.parse(await fs.readFile(path.join(projectRoot, "dataset", "champions_dataset.json"), "utf8"));
  const pixelIndex = JSON.parse(await fs.readFile(path.join(assetReleaseRoot, "profiles", "pixel", "index.json"), "utf8"));
  const regionalSpecies = dataset.species.filter(species => regionalFormPattern.test(String(species.form || "")));
  assert.equal(regionalSpecies.length, 16);
  return regionalSpecies.map(species => {
    const requestedForm = normalizeIdentityToken(species.form);
    const matches = Object.entries(pixelIndex.appearances || {})
      .filter(([appearanceId, appearance]) =>
        Number(appearance.nationalDex) === Number(species.dexNo)
        && (normalizeIdentityToken(appearance.formId) === requestedForm
          || normalizeIdentityToken(appearanceId).includes(requestedForm))
      )
      .map(([, appearance]) => appearance);
    assert.equal(matches.length, 1, `${species.primaryName} must have one exact regional appearance`);
    const variants = matches[0].variants || {};
    const asset = variants.default?.normalFront || variants.male?.normalFront || variants.female?.normalFront;
    assert.ok(asset?.path, `${species.primaryName} must have a front sprite`);
    return {
      alt: `${species.primaryName} sprite`,
      form: species.form,
      nationalDex: species.dexNo,
      localPath: `/Datasets/Pokemon Assets/release/${asset.path}`,
    };
  });
}

async function loadGenderSpriteExpectations() {
  const pixelIndex = JSON.parse(await fs.readFile(path.join(assetReleaseRoot, "profiles", "pixel", "index.json"), "utf8"));
  const targets = [
    { label: "Meowstic M", nationalDex: 678, form: "male" },
    { label: "Meowstic F", nationalDex: 678, form: "female" },
    { label: "Indeedee M", nationalDex: 876, form: "male" },
    { label: "Indeedee F", nationalDex: 876, form: "female" },
    { label: "Basculegion M", nationalDex: 902, form: "male" },
    { label: "Basculegion F", nationalDex: 902, form: "female" },
  ];
  return targets.map(target => {
    const matches = Object.values(pixelIndex.appearances || {}).filter(appearance =>
      Number(appearance.nationalDex) === target.nationalDex
      && normalizeIdentityToken(appearance.formId) === target.form
    );
    assert.equal(matches.length, 1, `${target.label} must have one exact gender appearance`);
    const variants = matches[0].variants || {};
    const asset = variants.default?.normalFront || variants[target.form]?.normalFront;
    assert.ok(asset?.path, `${target.label} must have a front sprite`);
    return {
      ...target,
      alt: `${target.label} sprite`,
      localPath: `/Datasets/Pokemon Assets/release/${asset.path}`,
    };
  });
}

async function loadSquawkabillySpriteExpectations() {
  const pixelIndex = JSON.parse(await fs.readFile(path.join(assetReleaseRoot, "profiles", "pixel", "index.json"), "utf8"));
  return ["green", "blue", "yellow", "white"].map(form => {
    const label = `Squawkabilly ${form[0].toUpperCase()}${form.slice(1)}`;
    const matches = Object.values(pixelIndex.appearances || {}).filter(appearance =>
      Number(appearance.nationalDex) === 931
      && normalizeIdentityToken(appearance.formId) === normalizeIdentityToken(`${form}-plumage`)
    );
    assert.equal(matches.length, 1, `${label} must have one exact color appearance`);
    const asset = matches[0].variants?.default?.normalFront;
    assert.ok(asset?.path, `${label} must have a front sprite`);
    return {
      label,
      alt: `${label} sprite`,
      form,
      localPath: `/Datasets/Pokemon Assets/release/${asset.path}`,
    };
  });
}

async function loadGourgeistSpriteExpectations() {
  const pixelIndex = JSON.parse(await fs.readFile(path.join(assetReleaseRoot, "profiles", "pixel", "index.json"), "utf8"));
  const targets = [
    { label: "Gourgeist Small", formId: "small", form: "small" },
    { label: "Gourgeist Medium", formId: "base", form: "average" },
    { label: "Gourgeist Large", formId: "large", form: "large" },
    { label: "Gourgeist Jumbo", formId: "jumbo", form: "super" },
  ];
  return targets.map(target => {
    const matches = Object.values(pixelIndex.appearances || {}).filter(appearance =>
      Number(appearance.nationalDex) === 711
      && normalizeIdentityToken(appearance.formId) === target.form
    );
    assert.equal(matches.length, 1, `${target.label} must have one exact size appearance`);
    const asset = matches[0].variants?.default?.normalFront;
    assert.ok(asset?.path, `${target.label} must have a front sprite`);
    return {
      ...target,
      localPath: `/Datasets/Pokemon Assets/release/${asset.path}`,
    };
  });
}

async function loadCastformSpriteExpectations() {
  const pixelIndex = JSON.parse(await fs.readFile(path.join(assetReleaseRoot, "profiles", "pixel", "index.json"), "utf8"));
  const targets = [
    { label: "Castform", formId: "base", form: "base", gatewayForm: null, type: "Normal" },
    { label: "Castform Sunny", formId: "sunny", form: "sunny", gatewayForm: "sunny", type: "Fire" },
    { label: "Castform Rainy", formId: "rainy", form: "rainy", gatewayForm: "rainy", type: "Water" },
    { label: "Castform Snowy", formId: "snowy", form: "snowy", gatewayForm: "snowy", type: "Ice" },
  ];
  return targets.map(target => {
    const matches = Object.values(pixelIndex.appearances || {}).filter(appearance =>
      Number(appearance.nationalDex) === 351
      && normalizeIdentityToken(appearance.formId) === target.form
    );
    assert.equal(matches.length, 1, `${target.label} must have one exact weather appearance`);
    const asset = matches[0].variants?.default?.normalFront;
    assert.ok(asset?.path, `${target.label} must have a front sprite`);
    return {
      ...target,
      localPath: `/Datasets/Pokemon Assets/release/${asset.path}`,
    };
  });
}

async function loadCastformTypeIconExpectations() {
  const typeIconIndex = JSON.parse(await fs.readFile(path.join(assetReleaseRoot, "assets", "type-icons", "index.json"), "utf8"));
  return ["normal", "fire", "water", "ice"].map(type => {
    const selectorKey = JSON.stringify(["symbol", "sv", "standard", "und", type]);
    const assetId = typeIconIndex.selectorIndex?.[selectorKey];
    const asset = typeIconIndex.assets?.[assetId];
    assert.ok(asset?.path, `${type} must have one Scarlet/Violet symbol icon`);
    return {
      type,
      localPath: `/Datasets/Pokemon Assets/release/${asset.path}`,
    };
  });
}

async function availablePort() {
  return new Promise((resolve, reject) => {
    const probe = createNetServer();
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(error => error ? reject(error) : resolve(port));
    });
    probe.on("error", reject);
  });
}

async function findBrowser() {
  const candidates = [
    process.env.CHAMPIONS_CHROME_PATH,
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "Google", "Chrome", "Application", "chrome.exe"),
    process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "Google", "Chrome", "Application", "chrome.exe"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
    process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "Microsoft", "Edge", "Application", "msedge.exe"),
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try { await fs.access(candidate); return candidate; } catch {}
  }
  throw new Error("No supported headless Chrome or Edge executable was found; set CHAMPIONS_CHROME_PATH");
}

function safePath(root, relativePath) {
  const absolute = path.resolve(root, relativePath);
  const relative = path.relative(root, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return absolute;
}

function startStaticServer(port) {
  const instance = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const decodedPath = decodeURIComponent(url.pathname);
      const assetPrefix = "/Datasets/Pokemon Assets/release/";
      const isAsset = decodedPath.startsWith(assetPrefix);
      const root = isAsset ? assetReleaseRoot : projectRoot;
      let relativePath = isAsset ? decodedPath.slice(assetPrefix.length) : decodedPath.replace(/^\/+/, "");
      if (!relativePath || relativePath.endsWith("/")) relativePath += "index.html";
      const absolute = safePath(root, relativePath);
      if (!absolute) return response.writeHead(403).end("Forbidden");
      const bytes = await fs.readFile(absolute);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": contentTypes.get(path.extname(absolute).toLowerCase()) || "application/octet-stream",
      });
      if (request.method === "HEAD") response.end();
      else response.end(bytes);
    } catch (error) {
      response.writeHead(error?.code === "ENOENT" ? 404 : 500).end("Not found");
    }
  });
  return new Promise((resolve, reject) => {
    instance.once("error", reject);
    instance.listen(port, "127.0.0.1", () => resolve(instance));
  });
}

async function waitForTarget(port, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`);
      if (response.ok) {
        const targets = await response.json();
        const page = targets.find(entry => entry.type === "page");
        if (page) return page;
      }
    } catch (error) { lastError = error; }
    await delay(100);
  }
  throw lastError || new Error("Headless browser target did not become ready");
}

function cdpClient(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let nextId = 0;
  const pending = new Map();
  const events = [];
  const handlers = new Map();
  const handlerErrors = [];
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(entry.timer);
      message.error ? entry.reject(new Error(`${entry.method}: ${message.error.message}`)) : entry.resolve(message.result);
      return;
    }
    events.push(message);
    for (const handler of handlers.get(message.method) || []) {
      Promise.resolve(handler(message.params)).catch(error => handlerErrors.push(error));
    }
  });
  const rejectPending = reason => {
    for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(new Error(reason)); }
    pending.clear();
  };
  socket.addEventListener("close", () => rejectPending("CDP WebSocket closed"));
  socket.addEventListener("error", () => rejectPending("CDP WebSocket failed"));
  return {
    events,
    handlerErrors,
    ready: new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    }),
    on(method, handler) {
      if (!handlers.has(method)) handlers.set(method, []);
      handlers.get(method).push(handler);
    },
    send(method, params = {}) {
      const id = ++nextId;
      const result = new Promise((resolve, reject) => {
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP ${method} timed out`)); }, 60_000);
        pending.set(id, { resolve, reject, timer, method });
      });
      socket.send(JSON.stringify({ id, method, params }));
      return result;
    },
    close() { socket.close(); },
  };
}

async function evaluate(client, expression, awaitPromise = false) {
  const result = await client.send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(client, expression, message, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      if (await evaluate(client, expression)) return;
    } catch (error) {
      if (!/Execution context was destroyed|Cannot find context with specified id/u.test(error.message)) throw error;
      lastError = error;
    }
    await delay(100);
  }
  throw lastError || new Error(message);
}

async function pressTab(client) {
  await client.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
}

async function waitForAnimationFrames(client, count = 2) {
  await evaluate(client, `new Promise(resolve => {
    let remaining = ${count};
    const next = () => {
      remaining -= 1;
      if (remaining <= 0) resolve();
      else requestAnimationFrame(next);
    };
    requestAnimationFrame(next);
  })`, true);
}

async function assertCardExpansionPreservesViewport(client, name, layout, { focusSpeciesInput = false } = {}) {
  const target = await evaluate(client, `(() => {
    const cards = [...document.querySelectorAll("#results .result-card")];
    const card = cards[Math.floor(cards.length / 2)];
    card.scrollIntoView({ block: "center" });
    return {
      entryKey: card.dataset.entryKey,
      name: card.querySelector("h3")?.textContent.trim() || ""
    };
  })()`);
  await waitForAnimationFrames(client);

  const before = await evaluate(client, `({
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    speciesSearch: document.getElementById("species-input").value,
    resultCount: document.querySelectorAll("#results .result-card").length
  })`);

  await evaluate(client, `(() => {
    const shell = document.querySelector(${JSON.stringify(`#results .result-card[data-entry-key="${target.entryKey}"] .compact-card-shell`)});
    if (${focusSpeciesInput}) {
      document.getElementById("species-input").focus({ preventScroll: true });
      shell.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    }
    shell.click();
  })()`);
  await waitFor(client, `document.querySelector(${JSON.stringify(`#results .result-card[data-entry-key="${target.entryKey}"]`)})?.classList.contains("expanded")`, `${name} ${layout} card did not expand`);
  await waitForAnimationFrames(client);
  if (focusSpeciesInput) await delay(200);

  const expanded = await evaluate(client, `({
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    speciesSearch: document.getElementById("species-input").value,
    resultCount: document.querySelectorAll("#results .result-card").length,
    expandedName: document.querySelector("#results .result-card.expanded h3")?.textContent.trim() || ""
  })`);
  assert.ok(Math.abs(expanded.scrollX - before.scrollX) <= 1, `${name} ${layout} expansion changed horizontal scroll position`);
  assert.ok(Math.abs(expanded.scrollY - before.scrollY) <= 1, `${name} ${layout} expansion changed vertical scroll position`);
  assert.equal(expanded.speciesSearch, before.speciesSearch, `${name} ${layout} expansion changed the species search`);
  assert.equal(expanded.resultCount, before.resultCount, `${name} ${layout} expansion removed result cards`);
  assert.equal(expanded.expandedName, target.name, `${name} ${layout} expanded the wrong card`);

  await evaluate(client, `document.querySelector(${JSON.stringify(`#results .result-card[data-entry-key="${target.entryKey}"] .compact-card-shell`)}).click()`);
  await waitFor(client, `!document.querySelector(${JSON.stringify(`#results .result-card[data-entry-key="${target.entryKey}"]`)})?.classList.contains("expanded")`, `${name} ${layout} card did not collapse`);
  await waitForAnimationFrames(client);

  const collapsed = await evaluate(client, `({
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    speciesSearch: document.getElementById("species-input").value,
    resultCount: document.querySelectorAll("#results .result-card").length
  })`);
  assert.ok(Math.abs(collapsed.scrollX - before.scrollX) <= 1, `${name} ${layout} collapse changed horizontal scroll position`);
  assert.ok(Math.abs(collapsed.scrollY - before.scrollY) <= 1, `${name} ${layout} collapse changed vertical scroll position`);
  assert.equal(collapsed.speciesSearch, before.speciesSearch, `${name} ${layout} collapse changed the species search`);
  assert.equal(collapsed.resultCount, before.resultCount, `${name} ${layout} collapse removed result cards`);
}

async function setSpeciesSearch(client, value, expectedCount, message) {
  await evaluate(client, `(() => {
    const input = document.getElementById("species-input");
    input.value = ${JSON.stringify(value)};
    input.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await waitFor(client, `document.querySelectorAll("#results .result-card").length === ${expectedCount}`, message);
}

async function assertFormAndSpeedLabels(client, name) {
  const cycles = [
    {
      species: "Venusaur",
      steps: [
        { button: "Mega Form", heading: "Mega Venusaur" },
        { button: "Base Form", heading: "Venusaur" },
      ],
    },
    {
      species: "Charizard",
      steps: [
        { button: "Mega X", heading: "Mega Charizard X" },
        { button: "Mega Y", heading: "Mega Charizard Y" },
        { button: "Base Form", heading: "Charizard" },
      ],
    },
    {
      species: "Aegislash",
      steps: [
        { button: "Blade Form", heading: "Aegislash Blade" },
        { button: "Shield Form", heading: "Aegislash" },
      ],
    },
    {
      species: "Palafin",
      steps: [
        { button: "Hero Form", heading: "Palafin Hero" },
        { button: "Zero Form", heading: "Palafin" },
      ],
    },
    {
      species: "Morpeko",
      steps: [
        { button: "Hangry Form", heading: "Morpeko Hangry" },
        { button: "Full Belly Form", heading: "Morpeko" },
      ],
    },
  ];

  for (const cycle of cycles) {
    await setSpeciesSearch(client, cycle.species, 1, `${name} ${cycle.species} label test did not settle`);
    for (const step of cycle.steps) {
      const buttonText = await evaluate(client, `document.querySelector("#results .form-toggle-button")?.textContent.trim() || ""`);
      assert.equal(buttonText, step.button, `${name} ${cycle.species} form target label is incorrect`);
      await evaluate(client, `document.querySelector("#results .form-toggle-button").click()`);
      await waitFor(client, `document.querySelector("#results .result-card h3")?.textContent.trim() === ${JSON.stringify(step.heading)}`, `${name} ${cycle.species} did not switch to ${step.heading}`);
    }
  }

  await setSpeciesSearch(client, "", 259, `${name} cards did not restore after form label tests`);
  const speedLabels = await evaluate(client, `(() => {
    const buttons = [...document.querySelectorAll("#results .speed-graph-button")];
    return {
      count: buttons.length,
      labels: [...new Set(buttons.map(button => button.textContent.trim()))],
      oldFormLabels: [...document.querySelectorAll("#results .form-toggle-button")]
        .map(button => button.textContent.trim())
        .filter(label => /^Show\s/u.test(label))
    };
  })()`);
  assert.equal(speedLabels.count, 259, `${name} is missing Speed Tier buttons`);
  assert.deepEqual(speedLabels.labels, ["Speed Tier"], `${name} still renders an old Speed Graph label`);
  assert.deepEqual(speedLabels.oldFormLabels, [], `${name} still renders Show-prefixed form labels`);
}

async function runScenario({ name, appUrl, expectedMode, failAnimatedTitle, browserPath, seedBox, regionalSpriteExpectations, genderSpriteExpectations, squawkabillySpriteExpectations, gourgeistSpriteExpectations, castformSpriteExpectations, castformTypeIconExpectations }) {
  const profile = path.join(temporaryRoot, `asset-browser-${name}-${process.pid}`);
  const screenshot = path.join(temporaryRoot, `champions-assets-${name}.png`);
  const debugPort = await availablePort();
  let browser = null;
  let page = null;
  let interceptedTitleRequests = 0;
  try {
    await fs.mkdir(profile, { recursive: true });
    browser = spawn(browserPath, [
      "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-software-rasterizer", "--no-first-run",
      "--no-default-browser-check", "--disable-extensions", "--no-proxy-server", "--remote-allow-origins=*",
      "--host-resolver-rules=MAP champions.test 127.0.0.1", `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profile}`, "about:blank",
    ], { windowsHide: true, stdio: "ignore" });

    const target = await waitForTarget(debugPort);
    page = cdpClient(target.webSocketDebuggerUrl);
    await page.ready;
    await page.send("Runtime.enable");
    await page.send("Page.enable");
    await page.send("Network.enable");
    await page.send("Log.enable");
    await page.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    const seedScript = `(() => {
      localStorage.setItem("championsDatabase.setlist", ${JSON.stringify(JSON.stringify([{ kind: "move", name: "Aqua Jet", selected: true }]))});
      localStorage.setItem("championsDatabase.box", ${JSON.stringify(JSON.stringify(seedBox))});
      localStorage.setItem("championsDatabase.boxSeedIds", ${JSON.stringify(JSON.stringify(seedBox.configs.map(config => config.id)))});
    })();`;
    await page.send("Page.addScriptToEvaluateOnNewDocument", { source: seedScript });

    if (failAnimatedTitle) {
      page.on("Fetch.requestPaused", async params => {
        const url = new URL(params.request.url);
        if (url.searchParams.get("species") === "Cyndaquil" && url.searchParams.get("spriteType") === "g5-animated") {
          interceptedTitleRequests += 1;
          await page.send("Fetch.failRequest", { requestId: params.requestId, errorReason: "Failed" });
        } else {
          await page.send("Fetch.continueRequest", { requestId: params.requestId });
        }
      });
      await page.send("Fetch.enable", { patterns: [{ urlPattern: "*Cyndaquil*", requestStage: "Request" }] });
    }

    await page.send("Page.navigate", { url: appUrl });
    await waitFor(page, `/^259 species \\| 509 moves \\| 216 abilities$/u.test(document.getElementById("status")?.textContent || "")`, `${name} application data did not load`);
    await waitFor(page, `(() => {
      const images = [...document.querySelectorAll("#results .pokemon-sprite, #speed-table-rows .speed-sprite, #title-pokemon-sprite")];
      return images.length > 500 && images.every(image => image.complete);
    })()`, `${name} Pokemon images did not finish loading`);

    await evaluate(page, `(() => {
      const input = document.getElementById("species-input");
      input.value = "Sinistcha Masterpiece";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
    await waitFor(page, `document.querySelectorAll("#results .result-card").length === 1`, `${name} cosmetic alias search did not settle`);
    assert.equal(await evaluate(page, `document.querySelector("#results .result-card h3")?.textContent.trim()`), "Sinistcha");
    await evaluate(page, `(() => {
      const input = document.getElementById("species-input");
      input.value = "Indeedee Female";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
    await waitFor(page, `document.querySelectorAll("#results .result-card").length === 1`, `${name} legacy gender alias search did not settle`);
    assert.equal(await evaluate(page, `document.querySelector("#results .result-card h3")?.textContent.trim()`), "Indeedee F");
    await evaluate(page, `(() => {
      const input = document.getElementById("species-input");
      input.value = "Basculegion";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
    await waitFor(page, `document.querySelectorAll("#results .result-card").length === 2`, `${name} Basculegion cards did not settle`);
    const basculegionCards = await evaluate(page, `(() => [...document.querySelectorAll("#results .result-card")].map(card => ({
      name: card.querySelector("h3")?.textContent.trim(),
      src: card.querySelector(".pokemon-sprite")?.src,
      hasFormControl: Boolean(card.querySelector(".form-toggle-button, .form-segment-control"))
    })))()`);
    assert.deepEqual(basculegionCards.map(card => card.name), ["Basculegion F", "Basculegion M"]);
    assert.equal(basculegionCards.some(card => card.hasFormControl), false);
    assert.notEqual(basculegionCards[0].src, basculegionCards[1].src, `${name} reused the same sprite for both Basculegion cards`);
    for (const card of basculegionCards) {
      const expected = genderSpriteExpectations.find(item => item.label === card.name);
      assert.ok(expected);
      const spriteUrl = new URL(card.src);
      if (expectedMode === "local-resolver") assert.equal(decodeURIComponent(spriteUrl.pathname), expected.localPath);
      else assert.equal(spriteUrl.searchParams.get("form"), expected.form);
    }
    await evaluate(page, `(() => {
      const input = document.getElementById("species-input");
      input.value = "Mimikyu";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
    await waitFor(page, `document.querySelectorAll("#results .result-card").length === 1`, `${name} Mimikyu search did not settle`);
    assert.equal(await evaluate(page, `document.querySelector("#results .result-card h3")?.textContent.trim()`), "Mimikyu");
    assert.equal(await evaluate(page, `Boolean(document.querySelector("#results .result-card .form-toggle-button, #results .result-card .form-segment-control"))`), false);
    await evaluate(page, `(() => {
      const input = document.getElementById("species-input");
      input.value = "Squawkabilly";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
    await waitFor(page, `document.querySelectorAll("#results .result-card").length === 2`, `${name} Squawkabilly cards did not settle`);
    const squawkabillyDefaults = await evaluate(page, `(() => [...document.querySelectorAll("#results .result-card")].map(card => ({
      name: card.querySelector("h3")?.textContent.trim(),
      src: card.querySelector(".pokemon-sprite")?.src,
      controlWidth: card.querySelector(".form-segment-control")?.getBoundingClientRect().width,
      buttonWidths: [...card.querySelectorAll(".form-segment-button")].map(button => button.getBoundingClientRect().width),
      segments: [...card.querySelectorAll(".form-segment-button")].map(button => ({ label: button.textContent.trim(), active: button.classList.contains("active"), formId: button.dataset.formId, title: button.title }))
    })))()`);
    assert.deepEqual(squawkabillyDefaults.map(card => card.name), ["Squawkabilly Green", "Squawkabilly Yellow"]);
    assert.deepEqual(squawkabillyDefaults[0].segments.map(segment => segment.label), ["G", "B"]);
    assert.deepEqual(squawkabillyDefaults[1].segments.map(segment => segment.label), ["Y", "W"]);
    assert.deepEqual(squawkabillyDefaults.map(card => card.segments.filter(segment => segment.active).map(segment => segment.label)), [["G"], ["Y"]]);
    for (const card of squawkabillyDefaults) {
      assert.ok(card.buttonWidths.every(width => Math.abs(width - (card.controlWidth / 2)) <= 1), `${name} ${card.name} buttons do not fill the segmented control evenly`);
      assert.ok(Math.abs(card.buttonWidths.reduce((sum, width) => sum + width, 0) - card.controlWidth) <= 2, `${name} ${card.name} segmented control leaves unused width`);
    }
    assert.equal(JSON.stringify(squawkabillyDefaults).includes("Plumage"), false);
    await evaluate(page, `(() => {
      const card = [...document.querySelectorAll("#results .result-card")].find(candidate => candidate.querySelector("h3")?.textContent.trim() === "Squawkabilly Green");
      card.querySelector('[data-form-id="blue"]').click();
    })()`);
    await waitFor(page, `[...document.querySelectorAll("#results .result-card h3")].some(heading => heading.textContent.trim() === "Squawkabilly Blue")`, `${name} Squawkabilly Blue did not render`);
    const squawkabillyBlue = await evaluate(page, `(() => {
      const card = [...document.querySelectorAll("#results .result-card")].find(candidate => candidate.querySelector("h3")?.textContent.trim() === "Squawkabilly Blue");
      return card.querySelector(".pokemon-sprite")?.src;
    })()`);
    assert.notEqual(squawkabillyBlue, squawkabillyDefaults[0].src, `${name} Squawkabilly Blue reused the Green sprite`);
    const expectedSquawkabillyBlue = squawkabillySpriteExpectations.find(expected => expected.label === "Squawkabilly Blue");
    assert.ok(expectedSquawkabillyBlue);
    const squawkabillyBlueUrl = new URL(squawkabillyBlue);
    if (expectedMode === "local-resolver") assert.equal(decodeURIComponent(squawkabillyBlueUrl.pathname), expectedSquawkabillyBlue.localPath);
    else assert.equal(squawkabillyBlueUrl.searchParams.get("form"), "blue");
    await evaluate(page, `(() => {
      const card = [...document.querySelectorAll("#results .result-card")].find(candidate => candidate.querySelector("h3")?.textContent.trim() === "Squawkabilly Blue");
      card.querySelector('[data-form-id="base"]').click();
    })()`);
    await waitFor(page, `[...document.querySelectorAll("#results .result-card h3")].some(heading => heading.textContent.trim() === "Squawkabilly Green")`, `${name} Squawkabilly Green did not restore`);
    await evaluate(page, `(() => {
      const card = [...document.querySelectorAll("#results .result-card")].find(candidate => candidate.querySelector("h3")?.textContent.trim() === "Squawkabilly Yellow");
      card.querySelector('[data-form-id="white"]').click();
    })()`);
    await waitFor(page, `[...document.querySelectorAll("#results .result-card h3")].some(heading => heading.textContent.trim() === "Squawkabilly White")`, `${name} Squawkabilly White did not render`);
    const squawkabillyWhite = await evaluate(page, `(() => {
      const card = [...document.querySelectorAll("#results .result-card")].find(candidate => candidate.querySelector("h3")?.textContent.trim() === "Squawkabilly White");
      return card.querySelector(".pokemon-sprite")?.src;
    })()`);
    assert.notEqual(squawkabillyWhite, squawkabillyDefaults[1].src, `${name} Squawkabilly White reused the Yellow sprite`);
    const expectedSquawkabillyWhite = squawkabillySpriteExpectations.find(expected => expected.label === "Squawkabilly White");
    assert.ok(expectedSquawkabillyWhite);
    const squawkabillyWhiteUrl = new URL(squawkabillyWhite);
    if (expectedMode === "local-resolver") assert.equal(decodeURIComponent(squawkabillyWhiteUrl.pathname), expectedSquawkabillyWhite.localPath);
    else assert.equal(squawkabillyWhiteUrl.searchParams.get("form"), "white");
    await evaluate(page, `(() => {
      const card = [...document.querySelectorAll("#results .result-card")].find(candidate => candidate.querySelector("h3")?.textContent.trim() === "Squawkabilly White");
      card.querySelector('[data-form-id="base"]').click();
    })()`);
    await waitFor(page, `[...document.querySelectorAll("#results .result-card h3")].some(heading => heading.textContent.trim() === "Squawkabilly Yellow")`, `${name} Squawkabilly Yellow did not restore`);
    await evaluate(page, `(() => {
      const input = document.getElementById("species-input");
      input.value = "Gourgeist";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
    await waitFor(page, `document.querySelectorAll("#results .result-card").length === 1`, `${name} Gourgeist card did not settle`);
    const gourgeistDefault = await evaluate(page, `(() => {
      const card = document.querySelector("#results .result-card");
      const control = card.querySelector(".form-segment-control");
      return {
        name: card.querySelector("h3")?.textContent.trim(),
        segments: [...control.querySelectorAll(".form-segment-button")].map(button => ({ label: button.textContent.trim(), active: button.classList.contains("active"), formId: button.dataset.formId })),
        controlWidth: control.getBoundingClientRect().width,
        buttonWidths: [...control.querySelectorAll(".form-segment-button")].map(button => button.getBoundingClientRect().width)
      };
    })()`);
    assert.equal(gourgeistDefault.name, "Gourgeist Medium");
    assert.deepEqual(gourgeistDefault.segments.map(segment => segment.label), ["S", "M", "L", "J"]);
    assert.deepEqual(gourgeistDefault.segments.filter(segment => segment.active).map(segment => segment.label), ["M"]);
    assert.ok(gourgeistDefault.buttonWidths.every(width => Math.abs(width - (gourgeistDefault.controlWidth / 4)) <= 1), `${name} Gourgeist buttons do not fill the segmented control evenly`);
    for (const expected of [
      gourgeistSpriteExpectations.find(item => item.formId === "small"),
      gourgeistSpriteExpectations.find(item => item.formId === "large"),
      gourgeistSpriteExpectations.find(item => item.formId === "jumbo"),
      gourgeistSpriteExpectations.find(item => item.formId === "base")
    ]) {
      assert.ok(expected);
      await evaluate(page, `document.querySelector('#results .result-card [data-form-id=${JSON.stringify(expected.formId)}]').click()`);
      await waitFor(page, `document.querySelector("#results .result-card h3")?.textContent.trim() === ${JSON.stringify(expected.label)}`, `${name} ${expected.label} did not render`);
      const spriteSource = await evaluate(page, `document.querySelector("#results .result-card .pokemon-sprite")?.src`);
      const spriteUrl = new URL(spriteSource);
      if (expectedMode === "local-resolver") assert.equal(decodeURIComponent(spriteUrl.pathname), expected.localPath);
      else assert.equal(spriteUrl.searchParams.get("form"), expected.form);
    }
    await evaluate(page, `(() => {
      const input = document.getElementById("species-input");
      input.value = "Castform";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
    await waitFor(page, `document.querySelectorAll("#results .result-card").length === 1`, `${name} Castform card did not settle`);
    await waitFor(page, `[...document.querySelectorAll("#results .form-segment-type-icon")].length === 4 && [...document.querySelectorAll("#results .form-segment-type-icon")].every(image => image.naturalWidth > 0)`, `${name} Castform type icons did not load`);
    const castformDefault = await evaluate(page, `(() => {
      const card = document.querySelector("#results .result-card");
      const control = card.querySelector(".form-segment-control");
      return {
        name: card.querySelector("h3")?.textContent.trim(),
        displayedType: card.querySelector(".compact-dex-line .type-icon")?.textContent.trim(),
        controlWidth: control.getBoundingClientRect().width,
        controlBorderWidth: getComputedStyle(control).borderLeftWidth,
        segments: [...control.querySelectorAll(".form-segment-button")].map(button => {
          const icon = button.querySelector(".form-segment-type-icon");
          const buttonBox = button.getBoundingClientRect();
          const iconBox = icon.getBoundingClientRect();
          return {
            visibleText: button.textContent.trim(),
            formId: button.dataset.formId,
            active: button.classList.contains("active"),
            pressed: button.getAttribute("aria-pressed"),
            ariaLabel: button.getAttribute("aria-label"),
            iconSource: icon.src,
            iconNaturalWidth: icon.naturalWidth,
            iconNaturalHeight: icon.naturalHeight,
            iconObjectFit: getComputedStyle(icon).objectFit,
            buttonBackground: getComputedStyle(button).backgroundColor,
            buttonBorderLeftWidth: getComputedStyle(button).borderLeftWidth,
            activeDecorationContent: getComputedStyle(button, "::after").content,
            buttonWidth: buttonBox.width,
            iconWidth: iconBox.width,
            buttonHeight: buttonBox.height,
            iconHeight: iconBox.height
          };
        })
      };
    })()`);
    assert.equal(castformDefault.name, "Castform");
    assert.equal(castformDefault.displayedType, "Normal");
    assert.deepEqual(castformDefault.segments.map(segment => segment.visibleText), ["", "", "", ""], `${name} Castform controls still expose type text`);
    assert.deepEqual(castformDefault.segments.map(segment => segment.formId), ["base", "sunny", "rainy", "snowy"]);
    assert.deepEqual(castformDefault.segments.filter(segment => segment.active).map(segment => segment.formId), ["base"]);
    assert.deepEqual(castformDefault.segments.filter(segment => segment.pressed === "true").map(segment => segment.formId), ["base"]);
    assert.equal(castformDefault.controlBorderWidth, "0px");
    assert.equal(new Set(castformDefault.segments.map(segment => segment.iconSource)).size, 4, `${name} Castform form segments do not have four distinct icons`);
    const expectedBackgrounds = ["rgb(159, 161, 159)", "rgb(230, 40, 41)", "rgb(41, 128, 239)", "rgb(63, 216, 255)"];
    for (const [index, segment] of castformDefault.segments.entries()) {
      const expectedIcon = castformTypeIconExpectations[index];
      assert.ok(Math.abs(segment.buttonWidth - (castformDefault.controlWidth / 4)) <= 1, `${name} Castform ${expectedIcon.type} segment is not one quarter of the control`);
      assert.equal(segment.iconWidth, 30, `${name} Castform ${expectedIcon.type} icon is not half its 60px source size`);
      assert.equal(segment.iconHeight, 30, `${name} Castform ${expectedIcon.type} icon is not half its 60px source size`);
      assert.equal(segment.buttonBackground, expectedBackgrounds[index]);
      assert.equal(segment.buttonBorderLeftWidth, "0px");
      assert.equal(segment.activeDecorationContent === "none", !segment.active);
      assert.equal(segment.iconNaturalWidth, 60);
      assert.equal(segment.iconNaturalHeight, 60);
      assert.equal(segment.iconObjectFit, "contain");
      assert.match(segment.ariaLabel, new RegExp(`${expectedIcon.type} type$`, "iu"));
      const iconUrl = new URL(segment.iconSource);
      if (expectedMode === "local-resolver") {
        assert.equal(decodeURIComponent(iconUrl.pathname), expectedIcon.localPath);
      } else {
        assert.equal(iconUrl.searchParams.get("kind"), "type-icon");
        assert.equal(iconUrl.searchParams.get("presentation"), "symbol");
        assert.equal(iconUrl.searchParams.get("style"), "sv");
        assert.equal(iconUrl.searchParams.get("state"), "standard");
        assert.equal(iconUrl.searchParams.get("locale"), "und");
        assert.equal(iconUrl.searchParams.get("type")?.toLowerCase(), expectedIcon.type);
      }
    }
    for (const expected of [
      castformSpriteExpectations.find(item => item.formId === "sunny"),
      castformSpriteExpectations.find(item => item.formId === "rainy"),
      castformSpriteExpectations.find(item => item.formId === "snowy"),
      castformSpriteExpectations.find(item => item.formId === "base")
    ]) {
      assert.ok(expected);
      await evaluate(page, `document.querySelector('#results .result-card [data-form-id=${JSON.stringify(expected.formId)}]').click()`);
      await waitFor(page, `document.querySelector("#results .result-card h3")?.textContent.trim() === ${JSON.stringify(expected.label)}`, `${name} ${expected.label} did not render`);
      assert.equal(await evaluate(page, `document.querySelector("#results .result-card .compact-dex-line .type-icon")?.textContent.trim()`), expected.type);
      assert.equal(await evaluate(page, `document.querySelector('#results .result-card [data-form-id=${JSON.stringify(expected.formId)}]')?.getAttribute("aria-pressed")`), "true");
      const spriteSource = await evaluate(page, `document.querySelector("#results .result-card .pokemon-sprite")?.src`);
      const spriteUrl = new URL(spriteSource);
      if (expectedMode === "local-resolver") assert.equal(decodeURIComponent(spriteUrl.pathname), expected.localPath);
      else assert.equal(spriteUrl.searchParams.get("form"), expected.gatewayForm);
    }
    await evaluate(page, `(() => {
      const input = document.getElementById("species-input");
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
    await waitFor(page, `document.querySelectorAll("#results .result-card").length === 259`, `${name} cards did not restore after cosmetic alias search`);
    await waitFor(page, `[...document.querySelectorAll("#results .pokemon-sprite")].every(image => image.naturalWidth > 0)`, `${name} restored Pokemon images did not finish loading`);
    await assertFormAndSpeedLabels(page, name);
    await waitFor(page, `[...document.querySelectorAll("#results .pokemon-sprite")].every(image => image.naturalWidth > 0)`, `${name} Pokemon images did not finish loading after form label tests`);
    await assertCardExpansionPreservesViewport(page, name, "desktop", { focusSpeciesInput: true });

    await evaluate(page, `document.getElementById("box-tab").click()`);
    await waitFor(page, `document.querySelectorAll("#box-results .party-card").length === 1`, `${name} saved team did not render`);
    await evaluate(page, `document.querySelector("#box-results .party-card-toggle").click()`);
    await waitFor(page, `document.querySelectorAll("#box-results .box-config-row .pokemon-sprite").length === 1`, `${name} saved Box sprite did not render`);
    await waitFor(page, `[...document.querySelectorAll("#box-results img")].every(image => image.complete)`, `${name} saved Box images did not finish loading`);

    await evaluate(page, `document.getElementById("set-tab").focus()`);
    const focusBefore = await evaluate(page, `document.activeElement?.id`);
    await pressTab(page);
    const focusAfter = await evaluate(page, `document.activeElement?.id`);
    assert.equal(focusBefore, "set-tab");
    assert.notEqual(focusAfter, focusBefore);
    assert.ok(focusAfter);

    const desktop = await evaluate(page, `(() => {
      const resultSprites = [...document.querySelectorAll("#results .pokemon-sprite")];
      const speedSprites = [...document.querySelectorAll("#speed-table-rows .speed-sprite")];
      const boxSprites = [...document.querySelectorAll("#box-results img")];
      const title = document.getElementById("title-pokemon-sprite");
      const storedSetlist = JSON.parse(localStorage.getItem("championsDatabase.setlist") || "[]");
      const storedBox = JSON.parse(localStorage.getItem("championsDatabase.box") || '{"configs":[],"teams":[]}');
      const storedSeedIds = JSON.parse(localStorage.getItem("championsDatabase.boxSeedIds") || "[]");
      const legacyStorageKeys = [
        "championsDataSearch.setlist", "championsDataSearch.box", "championsMoveFinder.setlist", "championsMoveFinder.box"
      ];
      return {
        mode: document.documentElement.dataset.pokemonAssetMode,
        cards: document.querySelectorAll("#results .result-card").length,
        cardNames: [...document.querySelectorAll("#results .result-card h3")].map(heading => heading.textContent.trim()),
        legacyCosmeticSlugTarget: findSpeciesBySlug("sinistcha-masterpiece")?.slug || "",
        legacySquawkabillyBlueTarget: findSpeciesBySlug("squawkabilly-blue")?.slug || "",
        legacySquawkabillyWhiteTarget: findSpeciesBySlug("squawkabilly-white")?.slug || "",
        resultSprites: resultSprites.length,
        resultSpritesLoaded: resultSprites.filter(image => image.naturalWidth > 0).length,
        regionalSprites: resultSprites
          .filter(image => ["Alolan ", "Galarian ", "Hisuian ", "Paldean "].some(prefix => image.alt.startsWith(prefix)))
          .map(image => ({ alt: image.alt, src: image.src })),
        genderSprites: speedSprites
          .filter(image => ${JSON.stringify(["Meowstic M sprite", "Meowstic F sprite", "Indeedee M sprite", "Indeedee F sprite", "Basculegion M sprite", "Basculegion F sprite"])}.includes(image.alt))
          .map(image => ({ alt: image.alt, src: image.src })),
        squawkabillySprites: speedSprites
          .filter(image => ${JSON.stringify(["Squawkabilly Green sprite", "Squawkabilly Blue sprite", "Squawkabilly Yellow sprite", "Squawkabilly White sprite"])}.includes(image.alt))
          .map(image => ({ alt: image.alt, src: image.src })),
        speedSprites: speedSprites.length,
        speedSpritesLoaded: speedSprites.filter(image => image.naturalWidth > 0).length,
        megaSpriteLoaded: speedSprites.some(image => /^Mega /u.test(image.alt) && image.naturalWidth > 0),
        alternateSpriteLoaded: speedSprites.some(image => /Rotom (?:Heat|Wash|Frost|Fan|Mow)|Basculegion/u.test(image.alt) && image.naturalWidth > 0),
        boxSprites: boxSprites.length,
        boxSpritesLoaded: boxSprites.filter(image => image.naturalWidth > 0).length,
        boxSpriteSources: boxSprites.map(image => ({ alt: image.alt, src: image.src })),
        titleLoaded: title.naturalWidth > 0,
        titleProfile: title.dataset.pokemonAssetProfile,
        titleFallbackOrder: title.dataset.pokemonAssetFallbackOrder,
        titleFallbackIndex: title.dataset.pokemonAssetFallbackIndex,
        titleUrl: title.src,
        storage: {
          setlistFirstName: storedSetlist[0]?.name || "",
          boxFirstTeam: storedBox.configs[0]?.team || "",
          boxFirstSpeciesName: storedBox.configs[0]?.species?.name || "",
          boxFirstSpriteForm: storedBox.configs[0]?.species?.spriteQuery?.form || "",
          boxHasSpritePath: Object.hasOwn(storedBox.configs[0]?.species || {}, "spritePath"),
          seedFirstId: storedSeedIds[0] || "",
          legacyKeysPresent: legacyStorageKeys.filter(key => localStorage.getItem(key) !== null),
        },
        viewport: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      };
    })()`);

    assert.equal(desktop.mode, expectedMode);
    assert.equal(desktop.cards, 259);
    assert.equal(desktop.resultSprites, 259);
    assert.ok(desktop.cardNames.includes("Alcremie"));
    assert.ok(desktop.cardNames.includes("Sinistcha"));
    assert.ok(desktop.cardNames.includes("Vivillon"));
    assert.equal(desktop.cardNames.includes("Alcremie Rainbow Swirl"), false);
    assert.equal(desktop.cardNames.includes("Sinistcha Masterpiece"), false);
    assert.equal(desktop.cardNames.includes("Vivillon Fancy"), false);
    assert.ok(desktop.cardNames.includes("Meowstic M"));
    assert.ok(desktop.cardNames.includes("Meowstic F"));
    assert.ok(desktop.cardNames.includes("Indeedee M"));
    assert.ok(desktop.cardNames.includes("Indeedee F"));
    assert.ok(desktop.cardNames.includes("Basculegion M"));
    assert.ok(desktop.cardNames.includes("Basculegion F"));
    assert.equal(desktop.cardNames.includes("Meowstic Female"), false);
    assert.equal(desktop.cardNames.includes("Indeedee Male"), false);
    assert.equal(desktop.cardNames.includes("Indeedee Female"), false);
    assert.equal(desktop.cardNames.includes("Basculegion"), false);
    assert.ok(desktop.cardNames.includes("Squawkabilly Green"));
    assert.ok(desktop.cardNames.includes("Squawkabilly Yellow"));
    assert.equal(desktop.cardNames.includes("Squawkabilly Blue"), false);
    assert.equal(desktop.cardNames.includes("Squawkabilly White"), false);
    assert.equal(desktop.cardNames.some(cardName => /Plumage/iu.test(cardName)), false);
    assert.equal(desktop.legacyCosmeticSlugTarget, "sinistcha");
    assert.equal(desktop.legacySquawkabillyBlueTarget, "squawkabilly");
    assert.equal(desktop.legacySquawkabillyWhiteTarget, "squawkabilly-yellow");
    assert.equal(desktop.resultSpritesLoaded, desktop.resultSprites);
    assert.equal(desktop.regionalSprites.length, regionalSpriteExpectations.length);
    const regionalSpritesByAlt = new Map(desktop.regionalSprites.map(sprite => [sprite.alt, sprite]));
    for (const expected of regionalSpriteExpectations) {
      const actual = regionalSpritesByAlt.get(expected.alt);
      assert.ok(actual, `${name} did not render ${expected.alt}`);
      const url = new URL(actual.src);
      if (expectedMode === "local-resolver") {
        assert.equal(decodeURIComponent(url.pathname), expected.localPath, `${name} resolved the wrong appearance for ${expected.alt}`);
      } else {
        assert.equal(url.searchParams.get("form"), expected.form, `${name} omitted the regional form for ${expected.alt}`);
        assert.equal(Number(url.searchParams.get("nationalDex")), expected.nationalDex);
      }
    }
    assert.equal(desktop.genderSprites.length, genderSpriteExpectations.length);
    const genderSpritesByAlt = new Map(desktop.genderSprites.map(sprite => [sprite.alt, sprite]));
    for (const expected of genderSpriteExpectations) {
      const actual = genderSpritesByAlt.get(expected.alt);
      assert.ok(actual, `${name} did not render ${expected.alt}`);
      const url = new URL(actual.src);
      if (expectedMode === "local-resolver") {
        assert.equal(decodeURIComponent(url.pathname), expected.localPath, `${name} resolved the wrong appearance for ${expected.alt}`);
      } else {
        assert.equal(url.searchParams.get("form"), expected.form, `${name} omitted the gender form for ${expected.alt}`);
        assert.equal(Number(url.searchParams.get("nationalDex")), expected.nationalDex);
      }
    }
    for (const [male, female] of [["Meowstic M sprite", "Meowstic F sprite"], ["Indeedee M sprite", "Indeedee F sprite"], ["Basculegion M sprite", "Basculegion F sprite"]]) {
      assert.notEqual(genderSpritesByAlt.get(male)?.src, genderSpritesByAlt.get(female)?.src, `${name} reused the same sprite for ${male} and ${female}`);
    }
    assert.equal(desktop.squawkabillySprites.length, squawkabillySpriteExpectations.length);
    const squawkabillySpritesByAlt = new Map(desktop.squawkabillySprites.map(sprite => [sprite.alt, sprite]));
    for (const expected of squawkabillySpriteExpectations) {
      const actual = squawkabillySpritesByAlt.get(expected.alt);
      assert.ok(actual, `${name} did not render ${expected.alt}`);
      const url = new URL(actual.src);
      if (expectedMode === "local-resolver") assert.equal(decodeURIComponent(url.pathname), expected.localPath);
      else assert.equal(url.searchParams.get("form"), expected.form);
    }
    assert.equal(new Set(desktop.squawkabillySprites.map(sprite => sprite.src)).size, 4, `${name} did not render four distinct Squawkabilly sprites`);
    assert.ok(desktop.speedSprites > 259);
    assert.equal(desktop.speedSpritesLoaded, desktop.speedSprites);
    assert.equal(desktop.megaSpriteLoaded, true);
    assert.equal(desktop.alternateSpriteLoaded, true);
    assert.ok(desktop.boxSprites >= 2);
    assert.equal(desktop.boxSpritesLoaded, desktop.boxSprites);
    assert.equal(desktop.boxSpriteSources.every(sprite => sprite.alt === "Alolan Raichu sprite"), true);
    const savedRegionalExpectation = regionalSpriteExpectations.find(expected => expected.alt === "Alolan Raichu sprite");
    assert.ok(savedRegionalExpectation);
    for (const sprite of desktop.boxSpriteSources) {
      const url = new URL(sprite.src);
      if (expectedMode === "local-resolver") {
        assert.equal(decodeURIComponent(url.pathname), savedRegionalExpectation.localPath);
      } else {
        assert.equal(url.searchParams.get("form"), savedRegionalExpectation.form);
      }
    }
    assert.equal(desktop.titleLoaded, true);
    assert.equal(desktop.titleFallbackOrder, "g5-animated,g5-static,pixel");
    assert.equal(desktop.titleProfile, failAnimatedTitle ? "g5-static" : "gen5-animated");
    assert.equal(desktop.titleFallbackIndex, failAnimatedTitle ? "1" : "0");
    assert.equal(desktop.storage.setlistFirstName, "Aqua Jet");
    assert.equal(desktop.storage.boxFirstTeam, "Smoke Team");
    assert.equal(desktop.storage.boxFirstSpeciesName, "Alolan Raichu");
    assert.equal(desktop.storage.boxFirstSpriteForm, "Alola");
    assert.equal(desktop.storage.boxHasSpritePath, false);
    assert.equal(desktop.storage.seedFirstId, "seed-azumarill-bathtub");
    assert.deepEqual(desktop.storage.legacyKeysPresent, []);
    assert.ok(desktop.scrollWidth <= desktop.viewport);

    await page.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await delay(250);
    await evaluate(page, `document.getElementById("set-tab").click()`);
    await waitFor(page, `document.querySelectorAll("#results .result-card").length === 259`, `${name} mobile cards did not restore`);
    await assertCardExpansionPreservesViewport(page, name, "mobile");
    const mobile = await evaluate(page, `({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth })`);
    assert.ok(mobile.viewport >= 390 && mobile.viewport <= 400);
    assert.ok(mobile.scrollWidth <= mobile.viewport);

    await page.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    const image = await page.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await fs.writeFile(screenshot, Buffer.from(image.data, "base64"));
    await delay(250);
    assert.deepEqual(page.handlerErrors, []);

    const browserErrors = page.events
      .filter(event => event.method === "Runtime.exceptionThrown")
      .map(event => event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text);
    const logErrors = page.events
      .filter(event => event.method === "Log.entryAdded" && event.params.entry.level === "error")
      .map(event => event.params.entry.text);
    const failedRequests = page.events.filter(event => event.method === "Network.loadingFailed");
    const badResponses = page.events
      .filter(event => event.method === "Network.responseReceived" && event.params.response.status >= 400)
      .map(event => `${event.params.response.status} ${event.params.response.url}`);
    const requestedUrls = page.events
      .filter(event => event.method === "Network.requestWillBeSent")
      .map(event => event.params.request.url);
    assert.deepEqual(browserErrors, []);
    assert.deepEqual(badResponses, []);
    if (failAnimatedTitle) {
      assert.equal(interceptedTitleRequests, 1);
      assert.equal(failedRequests.length, 1);
      assert.deepEqual(logErrors, ["Failed to load resource: net::ERR_FAILED"]);
    } else {
      assert.deepEqual(failedRequests, []);
      assert.deepEqual(logErrors, []);
    }

    const gatewayRequests = requestedUrls.filter(url => url.startsWith("https://assets.phantomsafe.tv/"));
    const localAssetRequests = requestedUrls.filter(url => /\/Datasets\/Pokemon%20Assets\/release\//u.test(url));
    if (expectedMode === "local-resolver") {
      assert.equal(gatewayRequests.length, 0);
      assert.ok(localAssetRequests.some(url => new URL(url).pathname.endsWith("/release/index.json")));
      assert.ok(localAssetRequests.some(url => /\/profiles\/pixel\/index\.json$/u.test(new URL(url).pathname)));
    } else {
      assert.equal(localAssetRequests.length, 0);
      assert.ok(gatewayRequests.length >= 259);
      for (const requestUrl of gatewayRequests) {
        const url = new URL(requestUrl);
        assert.equal(url.pathname, "/v1/releases/0.7.0-dev.2/asset");
        assert.ok(["pokemon-sprite", "type-icon"].includes(url.searchParams.get("kind")), `unexpected published asset kind in ${requestUrl}`);
        assert.equal(url.searchParams.has("fallbackSpriteTypes"), false);
        assert.equal(url.searchParams.has("path"), false);
        assert.equal(url.searchParams.has("key"), false);
        assert.equal(url.searchParams.has("url"), false);
        assert.equal(url.searchParams.has("prefix"), false);
        assert.equal(url.searchParams.has("filename"), false);
        assert.equal(url.searchParams.has("v"), false);
      }
      const typeIconRequests = gatewayRequests.map(requestUrl => new URL(requestUrl)).filter(url => url.searchParams.get("kind") === "type-icon");
      assert.deepEqual([...new Set(typeIconRequests.map(url => url.searchParams.get("type")?.toLowerCase()))].sort(), ["fire", "ice", "normal", "water"]);
      assert.equal(gatewayRequests.some(url => new URL(url).searchParams.get("gender") === "female"), true);
      assert.equal(gatewayRequests.some(url => /^mega/u.test(new URL(url).searchParams.get("form") || "")), true);
      assert.equal(gatewayRequests.some(url => {
        const form = new URL(url).searchParams.get("form") || "";
        return form && !/^mega/u.test(form);
      }), true);
      assert.equal(requestedUrls.some(url => /(?:raw\.githubusercontent\.com|githubusercontent\.com|r2\.dev|cloudflarestorage\.com)/iu.test(url)), false);
      assert.equal(requestedUrls.some(url => /assets\.phantomsafe\.tv\/(?:releases\/|.*(?:index|manifest|asset-index|release-plan)\.json)/iu.test(url)), false);
    }

    return { name, desktop, mobile, requests: requestedUrls.length, gatewayRequests: gatewayRequests.length, localAssetRequests: localAssetRequests.length, screenshot };
  } finally {
    page?.close();
    if (browser && browser.exitCode === null) browser.kill();
    await fs.rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

let server = null;
try {
  const seedBox = JSON.parse(await fs.readFile(path.join(projectRoot, "box_data.json"), "utf8"));
  const regionalSpriteExpectations = await loadRegionalSpriteExpectations();
  const genderSpriteExpectations = await loadGenderSpriteExpectations();
  const squawkabillySpriteExpectations = await loadSquawkabillySpriteExpectations();
  const gourgeistSpriteExpectations = await loadGourgeistSpriteExpectations();
  const castformSpriteExpectations = await loadCastformSpriteExpectations();
  const castformTypeIconExpectations = await loadCastformTypeIconExpectations();
  const championsDataset = JSON.parse(await fs.readFile(path.join(projectRoot, "dataset", "champions_dataset.json"), "utf8"));
  const savedRegionalSpecies = championsDataset.species.find(species => species.primaryName === "Alolan Raichu");
  assert.ok(savedRegionalSpecies);
  seedBox.configs[0].species = {
    slug: savedRegionalSpecies.slug,
    name: savedRegionalSpecies.primaryName,
    baseName: savedRegionalSpecies.primaryName,
    dexNo: savedRegionalSpecies.dexNo,
    formId: "base",
    spriteQuery: {
      spriteType: "pixel",
      species: savedRegionalSpecies.primaryName,
      nationalDex: savedRegionalSpecies.dexNo,
      gender: "default",
      shiny: false,
      view: "front",
    },
    types: savedRegionalSpecies.types,
    baseStats: savedRegionalSpecies.baseStats,
  };
  seedBox.configs[0].team = "Smoke Team";
  seedBox.teams = ["Smoke Team"];
  await fs.mkdir(temporaryRoot, { recursive: true });
  const serverPort = await availablePort();
  server = await startStaticServer(serverPort);
  const browserPath = await findBrowser();
  const local = await runScenario({
    name: "local",
    appUrl: `http://127.0.0.1:${serverPort}/`,
    expectedMode: "local-resolver",
    failAnimatedTitle: false,
    browserPath,
    seedBox,
    regionalSpriteExpectations,
    genderSpriteExpectations,
    squawkabillySpriteExpectations,
    gourgeistSpriteExpectations,
    castformSpriteExpectations,
    castformTypeIconExpectations,
  });
  const published = await runScenario({
    name: "published",
    appUrl: `http://champions.test:${serverPort}/`,
    expectedMode: "published-gateway",
    failAnimatedTitle: true,
    browserPath,
    seedBox,
    regionalSpriteExpectations,
    genderSpriteExpectations,
    squawkabillySpriteExpectations,
    gourgeistSpriteExpectations,
    castformSpriteExpectations,
    castformTypeIconExpectations,
  });
  console.log(JSON.stringify({ status: "champions-asset-browser-smoke-valid", local, published }, null, 2));
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
}
