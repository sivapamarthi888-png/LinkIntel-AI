import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { matchSkillsRuleBased } from '../services/skillMatch.js';
import { matchSkillsWithGemini } from '../services/skillMatchGemini.js';
import { getDB } from '../db/database.js';

const router = express.Router();

// Rate limit AI analysis on skill match too
const skillMatchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many skill match requests. Please try again later.' },
});

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed for resume uploads'));
  },
});

function cleanupFile(filePath: string) {
  fs.promises.unlink(filePath).catch(() => {
    // File already gone or cleanup failed — ignore
  });
}

router.post('/', skillMatchLimiter, upload.single('resume'), async (req, res) => {
  let uploadedFilePath: string | null = null;
  try {
    const body = req.body || {};
    let resumeText: string = body.resumeText || '';
    const jobDescription: string = body.jobDescription || '';
    const targetJobTitle: string = body.targetJobTitle || '';

    if (req.file) {
      uploadedFilePath = req.file.path;
      try {
        const buffer = fs.readFileSync(req.file.path);
        // Validate PDF magic bytes to catch renamed files
        const isPdf = buffer.length > 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF';
        if (!isPdf) {
          cleanupFile(req.file.path);
          return res
            .status(400)
            .json({ error: 'The uploaded file does not appear to be a valid PDF.' });
        }
        const pdfData = await pdfParse(buffer);
        resumeText = pdfData.text;
        if (!resumeText || resumeText.trim().length === 0) {
          cleanupFile(req.file.path);
          return res.status(400).json({
            error:
              'No readable text found in this PDF. It may be a scanned image without a text layer. Try pasting your resume text instead.',
          });
        }
      } catch (parseError) {
        cleanupFile(req.file.path);
        return res.status(400).json({
          error:
            'Could not extract text from this PDF. It may be corrupted, encrypted, or image-only. Try pasting text instead.',
        });
      } finally {
        // Always delete the temporary uploaded file after processing
        if (uploadedFilePath) cleanupFile(uploadedFilePath);
      }
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return res
        .status(400)
        .json({ error: 'Resume text is required. Upload a PDF or paste resume text.' });
    }
    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ error: 'Job description is required.' });
    }
    if (resumeText.length > 30000) resumeText = resumeText.slice(0, 30000);
    if (jobDescription.length > 15000) {
      return res.status(400).json({ error: 'Job description is too long (max ~15000 characters).' });
    }

    let result: any;
    let analysisType: string;
    let geminiError: string | null = null;

    try {
      const geminiResult = await matchSkillsWithGemini(resumeText, jobDescription, targetJobTitle);
      if (geminiResult) {
        result = geminiResult;
        analysisType = 'Gemini AI Skill Match';
      } else {
        result = matchSkillsRuleBased(resumeText, jobDescription, targetJobTitle);
        analysisType = 'Rule-Based Demo Analysis';
      }
    } catch (err: any) {
      geminiError = err?.message || 'Gemini service error';
      result = matchSkillsRuleBased(resumeText, jobDescription, targetJobTitle);
      analysisType = 'Rule-Based Demo Analysis';
    }

    const fullResult = {
      ...result,
      analysisType,
      explanation:
        (result.explanation || '') + (geminiError ? ` (AI fallback used: ${geminiError})` : ''),
      analysisTimestamp: new Date().toISOString(),
      targetJobTitle,
    };

    // Persist summary only — never store full resume text
    const id = uuidv4();
    getDB().run(
      'INSERT INTO skill_matches (id, data) VALUES (?, ?)',
      [
        id,
        JSON.stringify({
          matchPercentage: fullResult.matchPercentage,
          matchCount: fullResult.matchedSkills?.length || 0,
          missingCount: fullResult.missingOrWeaklyEvidencedSkills?.length || 0,
          targetJobTitle,
          analysisType,
        }),
      ],
      (err: any) => {
        if (err) console.error('Failed to persist skill match', err);
      }
    );

    res.json({ id, ...fullResult });
  } catch (error: any) {
    if (uploadedFilePath) cleanupFile(uploadedFilePath);
    console.error('Skill match error');
    res.status(500).json({ error: 'Failed to process skill matching' });
  }
});

export default router;
