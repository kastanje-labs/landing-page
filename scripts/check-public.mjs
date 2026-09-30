import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { createScanner, LanguageVariant, SyntaxKind } from "typescript/unstable/ast";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const workerRoot = path.join(root, "cloudflare");
const publicRoot = path.join(root, "public");
const distRoot = path.join(root, "dist");
const failures = [];

function fail(message) {
  failures.push(message);
}

function inside(directory, candidate) {
  const relative = path.relative(directory, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function filesBelow(directory) {
  const files = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(fullPath);
      else if (entry.isFile()) files.push(fullPath);
    }
  }
  await visit(directory);
  return files;
}

function collectModuleImports(filePath, contents) {
  const scanner = createScanner(
    true,
    filePath.endsWith(".tsx") || filePath.endsWith(".jsx")
      ? LanguageVariant.JSX
      : LanguageVariant.Standard,
    contents,
  );
  const imports = [];
  let lastTokenEnd = 0;

  function nextToken() {
    let token = scanner.scan();
    if (token === SyntaxKind.EndOfFile) return token;

    let tokenEnd = scanner.getTokenEnd();
    if (tokenEnd <= lastTokenEnd) {
      const resumeAt = Math.min(
        contents.length,
        Math.max(scanner.getTokenStart(), lastTokenEnd) + 1,
      );
      scanner.setText(contents, resumeAt, contents.length - resumeAt);
      token = scanner.scan();
      if (token === SyntaxKind.EndOfFile) return token;
      tokenEnd = scanner.getTokenEnd();
    }

    lastTokenEnd = tokenEnd;
    return token;
  }

  function scanForFrom(token) {
    while (token !== SyntaxKind.EndOfFile && token !== SyntaxKind.SemicolonToken) {
      if (token === SyntaxKind.FromKeyword) {
        token = nextToken();
        if (token === SyntaxKind.StringLiteral) {
          imports.push(scanner.getTokenValue());
          return nextToken();
        }
      } else {
        token = nextToken();
      }
    }
    return token;
  }

  let token = nextToken();
  while (token !== SyntaxKind.EndOfFile) {
    if (token === SyntaxKind.ImportKeyword) {
      const next = nextToken();
      if (next === SyntaxKind.DotToken) {
        token = nextToken();
        continue;
      }
      if (next === SyntaxKind.OpenParenToken) {
        const argument = nextToken();
        if (argument === SyntaxKind.StringLiteral) {
          imports.push(scanner.getTokenValue());
        } else {
          fail(`Non-literal dynamic import in ${path.relative(root, filePath)}`);
        }
        token = nextToken();
        continue;
      }
      if (next === SyntaxKind.StringLiteral) {
        imports.push(scanner.getTokenValue());
        token = nextToken();
        continue;
      }
      token = scanForFrom(next);
      continue;
    }

    if (token === SyntaxKind.ExportKeyword) {
      const next = nextToken();
      if (
        next === SyntaxKind.AsteriskToken ||
        next === SyntaxKind.OpenBraceToken ||
        next === SyntaxKind.TypeKeyword
      ) {
        token = scanForFrom(next);
        continue;
      }
    }

    token = nextToken();
  }
  return imports;
}

function collectCssReferences(contents) {
  const references = [];
  for (const match of contents.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)["']?\s*\)?/gi))
    references.push(match[1]);
  for (const match of contents.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi))
    references.push(match[1].trim());
  return references;
}

function collectCssImports(contents) {
  const references = [];
  for (const match of contents.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)["']?\s*\)?/gi))
    references.push(match[1]);
  return references;
}

const allowedPackages = new Set(["react", "react-dom"]);
const forbiddenModuleSegments = new Set([
  "account",
  "api",
  "auth",
  "billing",
  "credential",
  "history",
  "inference",
  "login",
  "mcp",
  "newsletter",
  "operator",
  "private",
  "research",
]);

function checkModuleBoundary(specifier, fromPath) {
  const segments = specifier.toLowerCase().split(/[\\/]/).filter(Boolean);
  if (segments.some((segment) => forbiddenModuleSegments.has(segment)))
    fail(`Private/platform module boundary in import ${specifier} from ${path.relative(root, fromPath)}`);

  if (!specifier.startsWith(".")) {
    const packageName = specifier.startsWith("@")
      ? specifier.split("/").slice(0, 2).join("/")
      : specifier.split("/")[0];
    if (!allowedPackages.has(packageName))
      fail(`Unapproved runtime package import ${specifier} from ${path.relative(root, fromPath)}`);
    return null;
  }

  const resolved = path.resolve(path.dirname(fromPath), specifier);
  if (!inside(sourceRoot, resolved)) {
    fail(`Import escapes src: ${specifier} from ${path.relative(root, fromPath)}`);
    return null;
  }

  return resolved;
}

async function resolveSourceModule(candidate) {
  const choices = [
    candidate,
    `${candidate}.ts`,
    `${candidate}.tsx`,
    `${candidate}.js`,
    `${candidate}.jsx`,
    `${candidate}.css`,
    path.join(candidate, "index.ts"),
    path.join(candidate, "index.tsx"),
  ];
  for (const choice of choices) if (await exists(choice)) return choice;
  return null;
}

function checkWorkerBoundary(specifier, fromPath) {
  const segments = specifier.toLowerCase().split(/[\\/]/).filter(Boolean);
  if (segments.some((segment) => forbiddenModuleSegments.has(segment)))
    fail(`Private/platform Worker import ${specifier} from ${path.relative(root, fromPath)}`);
  if (!specifier.startsWith(".")) {
    fail(`Non-local Worker import ${specifier} from ${path.relative(root, fromPath)}`);
    return null;
  }

  const resolved = path.resolve(path.dirname(fromPath), specifier);
  if (!inside(root, resolved)) {
    fail(`Worker import escapes repository: ${specifier} from ${path.relative(root, fromPath)}`);
    return null;
  }
  return resolved;
}

async function resolveWorkerModule(candidate) {
  const choices = [
    candidate,
    `${candidate}.mjs`,
    `${candidate}.js`,
    `${candidate}.ts`,
    `${candidate}.tsx`,
    `${candidate}.json`,
    path.join(candidate, "index.mjs"),
    path.join(candidate, "index.js"),
  ];
  for (const choice of choices) if (await exists(choice)) return choice;
  return null;
}

async function inspectSourceGraph() {
  const entry = path.join(sourceRoot, "main.tsx");
  assert.ok(await exists(entry), "src/main.tsx must exist");
  const visited = new Set();
  const pending = [entry];

  while (pending.length) {
    const filePath = pending.pop();
    if (visited.has(filePath)) continue;
    visited.add(filePath);
    const contents = await readFile(filePath, "utf8");
    const isCss = filePath.endsWith(".css");
    const imports = isCss
      ? collectCssImports(contents)
      : collectModuleImports(filePath, contents);

    for (const specifier of imports) {
      const candidate = checkModuleBoundary(specifier, filePath);
      if (!candidate) continue;
      const resolved = await resolveSourceModule(candidate);
      if (!resolved) {
        fail(`Unresolved local import ${specifier} from ${path.relative(root, filePath)}`);
        continue;
      }
      pending.push(resolved);
    }
  }
  return [...visited].sort();
}

async function inspectWorkerGraph() {
  const entry = path.join(workerRoot, "worker.mjs");
  assert.ok(await exists(entry), "cloudflare/worker.mjs must exist");
  const visited = new Set();
  const pending = [entry];

  while (pending.length) {
    const filePath = pending.pop();
    if (visited.has(filePath)) continue;
    visited.add(filePath);
    const imports = collectModuleImports(filePath, await readFile(filePath, "utf8"));
    for (const specifier of imports) {
      const candidate = checkWorkerBoundary(specifier, filePath);
      if (!candidate) continue;
      const resolved = await resolveWorkerModule(candidate);
      if (!resolved) {
        fail(`Unresolved Worker import ${specifier} from ${path.relative(root, filePath)}`);
        continue;
      }
      pending.push(resolved);
    }
  }

  const text = await Promise.all(
    [...visited].map(async (filePath) => [filePath, await readFile(filePath, "utf8")]),
  );
  return { modules: [...visited].sort(), text };
}

function resourcePathsFromHtml(contents) {
  const resources = [];
  for (const tag of contents.matchAll(/<(?:script|link|img|source|video|audio)\b[^>]*>/gi)) {
    const attributes = tag[0];
    for (const name of ["src", "href", "poster"]) {
      const value = attributes.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"))?.[2];
      if (value) resources.push(value);
    }
  }
  return resources;
}

function localResourcePath(reference, fromPath) {
  if (/^(?:data:|#)/i.test(reference)) return null;
  if (/^(?:https?:)?\/\//i.test(reference)) {
    fail(`External resource in built entry graph: ${reference}`);
    return null;
  }
  const withoutSuffix = reference.split(/[?#]/, 1)[0];
  let decoded;
  try {
    decoded = decodeURIComponent(withoutSuffix);
  } catch {
    fail(`Malformed built resource path: ${reference}`);
    return null;
  }
  return path.resolve(distRoot, decoded.startsWith("/") ? `.${decoded}` : path.relative(distRoot, path.join(path.dirname(fromPath), decoded)));
}

async function inspectBuiltGraph() {
  const entry = path.join(distRoot, "index.html");
  assert.ok(await exists(entry), "dist/index.html must exist after build");
  const visited = new Set();
  const pending = [{ filePath: entry, references: resourcePathsFromHtml(await readFile(entry, "utf8")) }];
  const reachableText = [];

  while (pending.length) {
    const { filePath, references } = pending.pop();
    if (visited.has(filePath)) continue;
    if (!inside(distRoot, filePath)) {
      fail(`Built resource escapes dist: ${filePath}`);
      continue;
    }
    if (!(await exists(filePath))) {
      fail(`Missing built resource ${path.relative(distRoot, filePath)}`);
      continue;
    }
    visited.add(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const isText = [".html", ".js", ".css", ".svg", ".json", ".txt", ".xml", ".webmanifest"].includes(extension);
    if (isText) reachableText.push([filePath, await readFile(filePath, "utf8")]);

    let nextReferences = [...references];
    if (extension === ".js") {
      const contents = await readFile(filePath, "utf8");
      nextReferences = nextReferences.concat(collectModuleImports(filePath, contents));
    } else if (extension === ".css") {
      nextReferences = nextReferences.concat(collectCssReferences(await readFile(filePath, "utf8")));
    }

    for (const reference of nextReferences) {
      const resolved = localResourcePath(reference, filePath);
      if (resolved) pending.push({ filePath: resolved, references: [] });
    }
  }
  return { files: [...visited].sort(), reachableText };
}

const secretPatterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/],
  ["Stripe secret key", /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ["named credential assignment", /\b(?:AWS|CLOUDFLARE|OPENAI|STRIPE)_(?:API_KEY|API_TOKEN|SECRET_KEY)\s*[:=]\s*["']?[^\s"']{16,}/i],
];

function inspectTextForSecrets(entries) {
  for (const [filePath, contents] of entries) {
    for (const [label, pattern] of secretPatterns) {
      if (pattern.test(contents)) fail(`Possible ${label} in ${path.relative(root, filePath)}`);
    }
  }
}

async function comparePublicAssets() {
  const publicFiles = (await filesBelow(publicRoot)).sort();
  for (const publicFile of publicFiles) {
    const relative = path.relative(publicRoot, publicFile);
    const builtFile = path.join(distRoot, relative);
    if (!(await exists(builtFile))) {
      fail(`Public asset missing from build: ${relative}`);
      continue;
    }
    const [source, output] = await Promise.all([readFile(publicFile), readFile(builtFile)]);
    if (!source.equals(output)) fail(`Public asset changed during build: ${relative}`);
  }
  return publicFiles;
}

const sourceGraph = await inspectSourceGraph();
const workerGraph = await inspectWorkerGraph();
const builtGraph = await inspectBuiltGraph();
const publicFiles = await comparePublicAssets();
inspectTextForSecrets([...builtGraph.reachableText, ...workerGraph.text]);

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Public boundary check passed: ${sourceGraph.length} site source modules, ${workerGraph.modules.length} Worker modules, ${builtGraph.files.length} entry-reachable build files, ${publicFiles.length} byte-preserved public assets. Scanned built text and Worker source for common credential patterns; this is a scoped boundary check, not an exhaustive security review.`,
  );
}
