// src/slug-resolver.js
export const NAME_TO_SLUG_OVERRIDE = {
  "schneider electric": "schneider",
  "allen-bradley": "allen-bradley",
  "mitsubishi electric": "mitsubishi"
};

function normalizeName(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export async function buildNameToSlugMap() {
  // /api/brands devuelve [{slug,name}, ...]
  const res = await fetch("/api/brands");
  if (!res.ok) return {};

  const arr = await res.json();
  const map = {};
  for (const b of arr) {
    const key = normalizeName(b.name);
    if (key) map[key] = b.slug;
  }
  // overrides manuales
  Object.assign(map, NAME_TO_SLUG_OVERRIDE);
  return map;
}

export function slugifyFallback(label) {
  return normalizeName(label).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
