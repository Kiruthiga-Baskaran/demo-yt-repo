import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import mongoose from 'mongoose';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5001;

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).href;

const skillLibrary = [
  { label: 'JavaScript', keywords: ['javascript', 'js'] },
  { label: 'TypeScript', keywords: ['typescript', 'ts'] },
  { label: 'React', keywords: ['react', 'react.js'] },
  { label: 'Node.js', keywords: ['node.js', 'nodejs', 'node js'] },
  { label: 'Express', keywords: ['express'] },
  { label: 'MongoDB', keywords: ['mongodb', 'mongo db'] },
  { label: 'Python', keywords: ['python'] },
  { label: 'Django', keywords: ['django'] },
  { label: 'SQL', keywords: ['sql', 'postgres', 'mysql'] },
  { label: 'Git', keywords: ['git', 'github'] },
  { label: 'Docker', keywords: ['docker', 'containers'] },
  { label: 'AWS', keywords: ['aws', 'amazon web services'] },
  { label: 'REST APIs', keywords: ['rest api', 'restful api', 'api design'] },
  { label: 'HTML', keywords: ['html'] },
  { label: 'CSS', keywords: ['css', 'sass', 'tailwind'] },
  { label: 'Jest', keywords: ['jest', 'testing'] },
  { label: 'CI/CD', keywords: ['ci/cd', 'continuous integration', 'deployment pipelines'] },
  { label: 'GraphQL', keywords: ['graphql'] },
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return cb(new Error('Only PDF resumes are supported.'));
    }
    cb(null, true);
  },
});

const comparisonSchema = new mongoose.Schema(
  {
    fileName: String,
    score: Number,
    summary: String,
    presentSkills: [String],
    missingSkills: [String],
    jdSkills: [String],
    resumeSkills: [String],
    jobDescription: String,
  },
  { timestamps: true }
);

const Comparison = mongoose.models.Comparison || mongoose.model('Comparison', comparisonSchema);

function normalizeText(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9+/\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchSkills(text) {
  const normalizedText = normalizeText(text);
  return skillLibrary
    .filter((skill) => skill.keywords.some((keyword) => normalizedText.includes(keyword)))
    .map((skill) => skill.label);
}

async function extractPdfText(buffer) {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const pageText = await page.getTextContent();
    pageTexts.push(pageText.items.map((item) => item.str).join(' '));
  }

  return pageTexts.join(' ');
}

async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.log('MongoDB URI not set; app will run in mock mode without a database connection.');
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.warn('MongoDB connection failed:', error.message);
  }
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Resume parser backend is running.' });
});

app.post('/api/compare', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a resume PDF.' });
    }

    const jobDescription = (req.body.jobDescription || '').trim();
    if (!jobDescription) {
      return res.status(400).json({ message: 'Please provide a job description for comparison.' });
    }

    const resumeText = await extractPdfText(req.file.buffer);
    const jdSkills = matchSkills(jobDescription);
    const resumeSkills = matchSkills(resumeText);
    const presentSkills = [...new Set(jdSkills.filter((skill) => resumeSkills.includes(skill)))];
    const missingSkills = jdSkills.filter((skill) => !resumeSkills.includes(skill));

    const score = jdSkills.length ? Math.round((presentSkills.length / jdSkills.length) * 100) : 0;
    const summary =
      jdSkills.length === 0
        ? 'No skill keywords were detected in the job description.'
        : `${presentSkills.length} of ${jdSkills.length} required skills are covered by the resume.`;

    const responsePayload = {
      score,
      summary,
      fileName: req.file.originalname,
      presentSkills,
      missingSkills,
      jdSkills,
      resumeSkills,
    };

    if (mongoose.connection.readyState === 1) {
      await Comparison.create({
        ...responsePayload,
        jobDescription,
      });
    }

    res.json(responsePayload);
  } catch (error) {
    console.error('Resume comparison error:', error);
    const message = error.message || 'Unable to process the resume.';
    res.status(400).json({ message });
  }
});

connectToDatabase();

app.listen(PORT, () => {
  console.log(`Resume parser backend listening on port ${PORT}`);
});
