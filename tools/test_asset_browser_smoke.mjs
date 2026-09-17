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

async function runScenario({ name, appUrl, expectedMode, failAnimatedTitle, browserPath, seedBox, regionalSpriteExpectations }) {
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
    await waitFor(page, `/^289 species \\| 509 moves \\| 216 abilities$/u.test(document.getElementById("status")?.textContent || "")`, `${name} application data did not load`);
    await waitFor(page, `(() => {
      const images = [...document.querySelectorAll("#results .pokemon-sprite, #speed-table-rows .speed-sprite, #title-pokemon-sprite")];
      return images.length > 500 && images.every(image => image.complete);
    })()`, `${name} Pokemon images did not finish loading`);

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
        resultSprites: resultSprites.length,
        resultSpritesLoaded: resultSprites.filter(image => image.naturalWidth > 0).length,
        regionalSprites: resultSprites
          .filter(image => ["Alolan ", "Galarian ", "Hisuian ", "Paldean "].some(prefix => image.alt.startsWith(prefix)))
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
    assert.equal(desktop.cards, 289);
    assert.equal(desktop.resultSprites, 289);
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
    assert.ok(desktop.speedSprites > 289);
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
      assert.ok(gatewayRequests.length >= 289);
      for (const requestUrl of gatewayRequests) {
        const url = new URL(requestUrl);
        assert.equal(url.pathname, "/v1/releases/0.7.0-dev.2/asset");
        assert.equal(url.searchParams.get("kind"), "pokemon-sprite");
        assert.equal(url.searchParams.has("fallbackSpriteTypes"), false);
        assert.equal(url.searchParams.has("path"), false);
        assert.equal(url.searchParams.has("key"), false);
        assert.equal(url.searchParams.has("url"), false);
        assert.equal(url.searchParams.has("prefix"), false);
        assert.equal(url.searchParams.has("filename"), false);
        assert.equal(url.searchParams.has("v"), false);
      }
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
  });
  const published = await runScenario({
    name: "published",
    appUrl: `http://champions.test:${serverPort}/`,
    expectedMode: "published-gateway",
    failAnimatedTitle: true,
    browserPath,
    seedBox,
    regionalSpriteExpectations,
  });
  console.log(JSON.stringify({ status: "champions-asset-browser-smoke-valid", local, published }, null, 2));
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
}
