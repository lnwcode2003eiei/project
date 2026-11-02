const slugs = new Set(["computer", "computer-ai", "construction", "digital", "electrical", "electrical-engineering", "energy", "industrial", "logistics", "management", "survey"]);

export function courseHeroStyle(slug) {
  if (!slugs.has(slug)) return undefined;
  const imageSlug = slug === "electrical-engineering" ? "electrical" : slug;
  return {
    backgroundImage: `linear-gradient(90deg, rgba(9,51,65,.6), rgba(9,51,65,.12)), url('/image/${imageSlug}-hero-generated-v1.png')`,
  };
}
