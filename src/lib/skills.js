// The full pool of skills the mock parser "checks" against.
export const ALL_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Express", "MongoDB",
  "Python", "Django", "SQL", "Git", "Docker", "AWS",
  "REST APIs", "HTML", "CSS", "Jest", "CI/CD", "GraphQL",
];

// Skill keywords we look for inside the PDF text (same order as ALL_SKILLS).
const SKILL_KEYWORDS = [
  "javascript", "typescript", "react", "node.js", "express", "mongodb",
  "python", "django", "sql", "git", "docker", "aws",
  "rest api", "html", "css", "jest", "ci/cd", "graphql",
];

// Score a resume's text: which tracked skills are present, which are missing,
// and an overall percentage.
export function analyzeResume(text, fileName) {
  const lower = text.toLowerCase();
  const found = [];
  SKILL_KEYWORDS.forEach((kw, idx) => {
    if (lower.includes(kw)) found.push(ALL_SKILLS[idx]);
  });

  const missing = ALL_SKILLS.filter((s) => !found.includes(s));
  // Cap missing list so the panel stays readable.
  const missingShown = missing.slice(0, 8);

  const score = Math.round((found.length / ALL_SKILLS.length) * 100);
  const summary =
    found.length === 0
      ? "No known skills detected — the parser may not have been able to read this PDF's text."
      : `${found.length} of ${ALL_SKILLS.length} tracked skills detected.`;

  return { fileName, score, summary, found, missingShown, missingCount: missing.length };
}
