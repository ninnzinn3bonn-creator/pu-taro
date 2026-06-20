import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const pluginRoot = resolve(process.argv[2] || "plugin/ax-factory");
const manifestPath = join(pluginRoot, ".codex-plugin", "plugin.json");
const marketplacePath = resolve(".agents/plugins/marketplace.json");
const errors = [];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function requireString(object, path, label) {
  const value = path.reduce((current, key) => current?.[key], object);
  if (typeof value !== "string" || !value.trim()) errors.push(`Missing ${label}`);
  return value;
}

let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch (error) {
  console.error(`Invalid plugin manifest: ${error.message}`);
  process.exit(1);
}

const name = requireString(manifest, ["name"], "name");
const version = requireString(manifest, ["version"], "version");
requireString(manifest, ["description"], "description");
requireString(manifest, ["author", "name"], "author.name");
requireString(manifest, ["interface", "displayName"], "interface.displayName");
requireString(manifest, ["interface", "shortDescription"], "interface.shortDescription");
requireString(manifest, ["interface", "longDescription"], "interface.longDescription");
requireString(manifest, ["interface", "developerName"], "interface.developerName");
requireString(manifest, ["interface", "category"], "interface.category");

if (name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
  errors.push("Plugin name must be kebab-case");
}
if (version && !/^\d+\.\d+\.\d+$/.test(version)) {
  errors.push("Plugin version must be strict semver");
}
if (manifest.skills && !String(manifest.skills).startsWith("./")) {
  errors.push("skills path must start with ./");
}

for (const field of ["composerIcon", "logo"]) {
  const relative = manifest.interface?.[field];
  if (relative && !(await exists(resolve(pluginRoot, relative)))) {
    errors.push(`${field} does not exist: ${relative}`);
  }
}

const hooksPath = join(pluginRoot, "hooks", "hooks.json");
if (await exists(hooksPath)) {
  try {
    const config = JSON.parse(await readFile(hooksPath, "utf8"));
    if (!config.hooks || typeof config.hooks !== "object") {
      errors.push("hooks/hooks.json must contain a hooks object");
    }
  } catch (error) {
    errors.push(`Invalid hooks JSON: ${error.message}`);
  }
}

const skillsDir = resolve(pluginRoot, manifest.skills || "./skills");
if (!(await exists(skillsDir))) {
  errors.push(`Skills directory does not exist: ${manifest.skills}`);
} else {
  const skillEntries = await readdir(skillsDir, { withFileTypes: true });
  for (const entry of skillEntries.filter((item) => item.isDirectory())) {
    const skillPath = join(skillsDir, entry.name, "SKILL.md");
    if (!(await exists(skillPath))) {
      errors.push(`Missing ${entry.name}/SKILL.md`);
      continue;
    }
    const content = await readFile(skillPath, "utf8");
    if (!content.startsWith("---\n")) errors.push(`${entry.name}: invalid frontmatter`);
    if (!content.includes(`name: ${entry.name}`)) errors.push(`${entry.name}: name mismatch`);
    if (!/^description:\s+\S+/m.test(content)) errors.push(`${entry.name}: missing description`);
    if (content.includes("[TODO")) errors.push(`${entry.name}: unresolved TODO`);
  }
}

if (JSON.stringify(manifest).includes("[TODO")) errors.push("Manifest contains unresolved TODO");

if (await exists(marketplacePath)) {
  try {
    const marketplace = JSON.parse(await readFile(marketplacePath, "utf8"));
    const entry = marketplace.plugins?.find((item) => item.name === name);
    if (!entry) {
      errors.push(`Marketplace does not expose plugin ${name}`);
    } else {
      if (entry.source?.source !== "local") {
        errors.push("Marketplace plugin source must be local");
      }
      if (!String(entry.source?.path || "").startsWith("./")) {
        errors.push("Marketplace source.path must start with ./");
      } else if (!(await exists(resolve(entry.source.path)))) {
        errors.push(`Marketplace source path does not exist: ${entry.source.path}`);
      }
    }
  } catch (error) {
    errors.push(`Invalid marketplace JSON: ${error.message}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Plugin OK: ${name}@${version}, manifest ${manifestPath}, skills ${skillsDir}, hooks ${dirname(hooksPath)}`
);
