#!/usr/bin/env node
// Generates Rails-side artifacts from contract/openapi.yaml:
//   - config/routes/api.rb      (drawn via `draw(:api)` from config/routes.rb)
//   - app/generated/api_params.rb (strong-params allow-lists + camelCase->snake_case key maps)
// Nothing in either file is hand-edited; re-run ./script/generate after any
// change under contract/. Only the two request shapes actually used by this
// contract are supported — an unsupported shape raises, rather than silently
// generating a wrong route.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const HEADER = `# GENERATED FILE — DO NOT EDIT BY HAND.
# Source: contract/openapi.yaml (compiled from contract/main.tsp).
# Regenerate: ./script/generate
`;

const CRUD_ORDER = ["index", "create", "new", "edit", "show", "update", "destroy"];

function camelToSnake(name) {
  return name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function railsResourceName(urlSegment) {
  return urlSegment.replace(/-/g, "_");
}

function buildRoutes(spec) {
  const resources = new Map(); // resource -> { urlPath, actions: Set, members: [{name, verb}] }

  for (const [path, operations] of Object.entries(spec.paths)) {
    const apiPath = path.replace(/^\/api\/?/, "");
    const segments = apiPath.split("/").filter(Boolean);
    const urlPath = segments[0];
    const resource = railsResourceName(urlPath);

    if (!resources.has(resource)) {
      resources.set(resource, { urlPath, actions: new Set(), members: [] });
    }
    const entry = resources.get(resource);

    for (const verb of Object.keys(operations)) {
      if (segments.length === 1) {
        if (verb === "get") entry.actions.add("index");
        else if (verb === "post") entry.actions.add("create");
        else throw new Error(`Unsupported collection verb "${verb}" for ${path} — update generate-rails.mjs`);
      } else if (segments.length === 3 && segments[1].startsWith("{") && segments[1].endsWith("}")) {
        if (verb !== "get") throw new Error(`Unsupported member verb "${verb}" for ${path} — update generate-rails.mjs`);
        entry.members.push({ name: segments[2], verb });
      } else {
        throw new Error(`Unsupported path shape: ${path} — update generate-rails.mjs`);
      }
    }
  }

  const lines = [];
  for (const resource of [...resources.keys()].sort()) {
    const { urlPath, actions, members } = resources.get(resource);
    const only = CRUD_ORDER.filter((action) => actions.has(action)).join(" ");
    const pathOption = urlPath !== resource ? `, path: "${urlPath}"` : "";

    if (members.length === 0) {
      lines.push(`  resources :${resource}${pathOption}, only: %i[${only}]`);
    } else {
      lines.push(`  resources :${resource}${pathOption}, only: %i[${only}] do`);
      for (const { name } of members) {
        lines.push(`    get :${name}, on: :member`);
      }
      lines.push("  end");
    }
  }

  return `${HEADER}\nnamespace :api do\n${lines.join("\n")}\nend\n`;
}

function buildApiParams(spec) {
  const requestSchemas = new Map(); // schemaName -> properties

  for (const operations of Object.values(spec.paths)) {
    for (const operation of Object.values(operations)) {
      const ref = operation.requestBody?.content?.["application/json"]?.schema?.$ref;
      if (!ref) continue;
      const schemaName = ref.split("/").pop();
      requestSchemas.set(schemaName, spec.components.schemas[schemaName].properties);
    }
  }

  const blocks = [];
  for (const schemaName of [...requestSchemas.keys()].sort()) {
    const keys = Object.keys(requestSchemas.get(schemaName));
    const permitted = keys.join(" ");
    const keyMapEntries = keys
      .map((key) => [key, camelToSnake(key)])
      .filter(([key, snake]) => key !== snake)
      .map(([key, snake]) => `      "${key}" => :${snake}`);
    const keyMap = keyMapEntries.length ? `{\n${keyMapEntries.join(",\n")}\n    }.freeze` : "{}.freeze";

    blocks.push(`  module ${schemaName}\n    PERMITTED = %i[${permitted}].freeze\n    KEY_MAP = ${keyMap}\n  end`);
  }

  return `${HEADER}\nmodule ApiParams\n${blocks.join("\n\n")}\nend\n`;
}

const spec = load(readFileSync(resolve(here, "openapi.yaml"), "utf8"));

mkdirSync(resolve(repoRoot, "config/routes"), { recursive: true });
writeFileSync(resolve(repoRoot, "config/routes/api.rb"), buildRoutes(spec));

mkdirSync(resolve(repoRoot, "app/generated"), { recursive: true });
writeFileSync(resolve(repoRoot, "app/generated/api_params.rb"), buildApiParams(spec));

console.log("Generated config/routes/api.rb and app/generated/api_params.rb");
