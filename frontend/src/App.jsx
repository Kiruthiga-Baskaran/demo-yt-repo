import { useMemo, useState } from 'react';

const SAMPLE_JD = `We are hiring a full-stack engineer with strong experience in React, JavaScript, TypeScript, Node.js, Express, MongoDB, REST APIs, Git, and SQL. The ideal candidate will also be comfortable working with HTML, CSS, CI/CD, and Docker in a collaborative team environment.`;

export default function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState(SAMPLE_JD);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileName = useMemo(() => resumeFile?.name ?? 'No file selected', [resumeFile]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!resumeFile) {
      setError('Please upload a resume PDF first.');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Please add a job description for comparison.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to compare resume and job description.');
      }

      setResult(payload);
    } catch (serverError) {
      setError(serverError.message || 'Something went wrong while analyzing the resume.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="container nav-row">
          <div className="brand">
            <span className="brand-mark">0</span>
            <span>to Shipped</span>
          </div>
          <nav className="nav-links" aria-label="Main navigation">
            <a href="#parser">Parser</a>
            <a href="#insights">Insights</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="container hero-copy">
            <p className="eyebrow">Resume parser · mock demo</p>
            <h1>
              Compare your resume with a role and spot the <span>skills gap</span>
            </h1>
            <p className="hero-text">
              Upload a PDF resume and paste a job description. The app scores the match, reveals the skills already present,
              and highlights the ones still missing before the interview stage.
            </p>
          </div>
        </section>

        <section id="parser" className="container">
          <div className="panel parser-panel">
            <form className="parser-form" onSubmit={handleSubmit}>
              <div className="upload-box">
                <label htmlFor="resume-upload" className="upload-label">
                  <span className="upload-icon">📄</span>
                  <span className="upload-primary">Upload resume PDF</span>
                  <span className="upload-secondary">{fileName}</span>
                </label>
                <input
                  id="resume-upload"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
                />
              </div>

              <label className="field-label" htmlFor="job-description">
                Job description
              </label>
              <textarea
                id="job-description"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the job requirements here..."
              />

              <div className="actions">
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Analyzing...' : 'Compare resume'}
                </button>
              </div>

              {error && <div className="error-box">{error}</div>}
            </form>
          </div>
        </section>

        {result && (
          <section id="insights" className="container insights-section">
            <div className="panel results-panel">
              <div className="score-block">
                <div className="score-ring" aria-label={`Resume score ${result.score} out of 100`}>
                  <div className="score-ring-inner">
                    <strong>{result.score}</strong>
                    <span>/100</span>
                  </div>
                </div>
                <div className="score-copy">
                  <p className="label">Resume match score</p>
                  <h2>{result.summary}</h2>
                  <p>{result.fileName}</p>
                </div>
              </div>

              <div className="skill-grid">
                <div className="skill-column present-column">
                  <h3>Skills present</h3>
                  <div className="chips">
                    {result.presentSkills.length ? (
                      result.presentSkills.map((skill) => <span key={skill} className="chip good">{skill}</span>)
                    ) : (
                      <span className="chip empty">No matching skills detected</span>
                    )}
                  </div>
                </div>

                <div className="skill-column missing-column">
                  <h3>Skills missing</h3>
                  <div className="chips">
                    {result.missingSkills.length ? (
                      result.missingSkills.map((skill) => <span key={skill} className="chip warn">{skill}</span>)
                    ) : (
                      <span className="chip empty">No gaps found</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
