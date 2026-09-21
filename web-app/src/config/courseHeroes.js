const slugs = new Set(["computer", "computer-ai", "construction", "digital", "electrical", "energy", "industrial", "logistics", "management", "survey"]);

export function courseHeroStyle(slug) {
  if (!slugs.has(slug)) return undefined;
  return {
    backgroundImage: `linear-gradient(90deg, rgba(55,0,12,.6), rgba(55,0,12,.12)), url('/image/${slug}-hero-generated-v1.png')`,
  };
}
