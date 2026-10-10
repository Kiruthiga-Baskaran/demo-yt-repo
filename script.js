// 0 → Shipped Resume Parser — mock logic, everything runs in the browser.

const uploadState = document.getElementById("uploadState");
const loadingState = document.getElementById("loadingState");
const resultsState = document.getElementById("resultsState");

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const fileError = document.getElementById("fileError");
const loadingText = document.getElementById("loadingText");
const resetBtn = document.getElementById("resetBtn");

const scoreNumber = document.getElementById("scoreNumber");
const scoreRing = document.getElementById("scoreRing");
const resultSummary = document.getElementById("resultSummary");
const fileName = document.getElementById("fileName");
const presentSkills = document.getElementById("presentSkills");
const missingSkills = document.getElementById("missingSkills");

// The full pool of skills the mock parser "checks" against.
const ALL_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Express", "MongoDB",
  "Python", "Django", "SQL", "Git", "Docker", "AWS",
  "REST APIs", "HTML", "CSS", "Jest", "CI/CD", "GraphQL",
];

// Skill keywords we look for inside the PDF text.
const SKILL_KEYWORDS = [
  "javascript", "typescript", "react", "node.js", "express", "mongodb",
  "python", "django", "sql", "git", "docker", "aws",
  "rest api", "html", "css", "jest", "ci/cd", "graphql",
];

const RING_LENGTH = 326.7; // 2πr for r=52

// ---------- State switching ----------
function show(state) {
  uploadState.hidden = state === "loading" || state === "results";
  loadingState.hidden = state !== "loading";
  resultsState.hidden = state !== "results";
}

// ---------- Upload handling ----------
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") fileInput.click();
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  handleFile(file);
});

fileInput.addEventListener("change", () => handleFile(fileInput.files[0]));

function handleFile(file) {
  fileError.hidden = true;
  if (!file) return;

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    fileError.hidden = false;
    return;
  }

  startAnalysis(file);
}

// ---------- Mock analysis ----------
function startAnalysis(file) {
  show("loading");
  scrollIntoViewOfCard();

  // Cycle a few fake status lines so it feels like real work.
  const steps = [
    "Extracting text from PDF…",
    "Flattening PDF layout…",
    "Scanning for skills…",
    "Comparing against job market data…",
    "Calculating score…",
  ];
  let i = 0;
  const interval = setInterval(() => {
    loadingText.textContent = steps[i];
    i = (i + 1) % steps.length;
  }, 700);

  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = async () => {
    try {
      const pdf = await pdfjsLib.getDocument({ data: reader.result }).promise;
      const chunks = [];
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        chunks.push(content.items.map((item) => item.str).join(" "));
      }
      const text = chunks.join(" ").toLowerCase();
      clearInterval(interval);
      setTimeout(() => renderResults(file.name, text), 800);
    } catch (err) {
      clearInterval(interval);
      show("upload");
      fileError.textContent = "Couldn't read that PDF — it may be image-based or corrupted.";
      fileError.hidden = false;
    }
  };
  reader.onerror = () => {
    clearInterval(interval);
    show("upload");
    fileError.textContent = "Couldn't read that file — try another PDF.";
    fileError.hidden = false;
  };
}

function scrollIntoViewOfCard() {
  document.getElementById("parser").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Results ----------
function renderResults(name, text) {
  const found = [];
  SKILL_KEYWORDS.forEach((kw, idx) => {
    if (text.includes(kw)) found.push(ALL_SKILLS[idx]);
  });

  const missing = ALL_SKILLS.filter((s) => !found.includes(s));
  // Cap missing list so the panel stays readable.
  const missingShown = missing.slice(0, 8);

  const score = Math.round((found.length / ALL_SKILLS.length) * 100);
  renderScore(score);

  resultSummary.textContent =
    found.length === 0
      ? "No known skills detected — the parser may not have been able to read this PDF's text."
      : `${found.length} of ${ALL_SKILLS.length} tracked skills detected.`;

  fileName.textContent = `Parsed: ${name}`;

  presentSkills.innerHTML = "";
  if (found.length === 0) {
    presentSkills.innerHTML = '<span class="chip-empty">None detected</span>';
  } else {
    found.forEach((s) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = s;
      presentSkills.appendChild(chip);
    });
  }

  missingSkills.innerHTML = "";
  if (missing.length === 0) {
    missingSkills.innerHTML = '<span class="chip-empty">Nothing missing — full stack coverage! 🎉</span>';
  } else {
    missingShown.forEach((s) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = s;
      missingSkills.appendChild(chip);
    });
  }

  show("results");
}

function renderScore(score) {
  scoreNumber.textContent = score;
  scoreRing.style.strokeDashoffset = RING_LENGTH * (1 - score / 100);
  scoreRing.style.stroke =
    score >= 70 ? "var(--good)" : score >= 40 ? "var(--accent)" : "var(--warn)";
}

// ---------- Reset ----------
resetBtn.addEventListener("click", () => {
  fileInput.value = "";
  show("upload");
});
