import { useEffect, useState } from "react";
import Dropzone from "./Dropzone.jsx";
import { extractPdfText } from "../lib/parsePdf.js";
import { analyzeResume, ALL_SKILLS } from "../lib/skills.js";

const STEPS = [
  "Extracting text from PDF…",
  "Flattening PDF layout…",
  "Scanning for skills…",
  "Comparing against job market data…",
  "Calculating score…",
];

export default function ParserCard() {
  // phase: "upload" | "loading" | "results"
  const [phase, setPhase] = useState("upload");
  const [statusStep, setStatusStep] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [cardRef, setCardRef] = useState(null);

  // Fake status line cycling while "analyzing".
  useEffect(() => {
    if (phase !== "loading") return;
    const id = setInterval(() => setStatusStep((s) => (s + 1) % STEPS.length), 700);
    return () => clearInterval(id);
  }, [phase]);

  // Scroll the card into view whenever it becomes the focus of the page.
  useEffect(() => {
    if (phase !== "upload") cardRef?.scrollIntoView({ behavior: "smooth", block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function handleFile(file) {
    setError("");
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Please upload a PDF file.");
      return;
    }

    setPhase("loading");
    try {
      const text = await extractPdfText(file);
      // Small pause so the loading state stays readable on fast parses.
      await new Promise((r) => setTimeout(r, 800));
      setResult(analyzeResume(text, file.name));
      setPhase("results");
    } catch (err) {
      setError("Couldn't read that PDF — it may be image-based or corrupted.");
      setPhase("upload");
    }
  }

  function reset() {
    setResult(null);
    setError("");
    setPhase("upload");
  }

  return (
    <section id="parser" className="container card parser-card" ref={setCardRef}>
      {phase === "upload" && (
        <>
          <Dropzone onFile={handleFile} />
          {error && <p className="file-error">{error}</p>}
        </>
      )}

      {phase === "loading" && (
        <div className="loading-state">
          <div className="spinner" />
          <p className="loading-text">{STEPS[statusStep]}</p>
        </div>
      )}

      {phase === "results" && (
        <div className="results-state">
          <div className="results-header">
            <ScoreRing score={result.score} />
            <div className="results-meta">
              <h2>Your resume score</h2>
              <p>{result.summary}</p>
              <p className="file-name">Parsed: {result.fileName}</p>
              <button className="btn btn-small" onClick={reset}>
                Parse another resume
              </button>
            </div>
          </div>

          <div className="skills-grid">
            <div className="skills-col present">
              <h3>✅ Skills present</h3>
              <SkillsChips skills={result.found} emptyText="None detected" />
            </div>
            <div className="skills-col missing">
              <h3>⚠️ Skills missing</h3>
              <SkillsChips skills={result.missingShown} emptyText="Nothing missing — full stack coverage! 🎉" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ScoreRing({ score }) {
  const RING_LENGTH = 326.7; // 2πr for r=52
  const color = score >= 70 ? "var(--good)" : score >= 40 ? "var(--accent)" : "var(--warn)";
  return (
    <div className="score-wrap">
      <svg className="score-ring" viewBox="0 0 120 120">
        <circle className="ring-bg" cx="60" cy="60" r="52" />
        <circle
          className="ring-value"
          cx="60" cy="60" r="52"
          stroke={color}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - score / 100)}
        />
      </svg>
      <div className="score-text">
        <span>{score}</span>
        <small>/ 100</small>
      </div>
    </div>
  );
}

function SkillsChips({ skills, emptyText }) {
  if (skills.length === 0) {
    return <span className="chip-empty">{emptyText}</span>;
  }
  return (
    <div className="chips">
      {skills.map((s) => (
        <span key={s} className="chip">{s}</span>
      ))}
    </div>
  );
}

// Re-exported so other components can reference the skill pool if needed.
export { ALL_SKILLS };
