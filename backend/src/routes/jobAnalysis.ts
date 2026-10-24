import express from 'express';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getDB } from '../db/database.js';
import { analyzeJobRuleBased } from '../services/jobAnalysis.js';
import { analyzeJobWithGemini } from '../services/jobAnalysisGemini.js';

const router = express.Router();

// Rate limit AI endpoint: 10 requests per 15 min window
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many AI analysis requests. Please try again later.' },
});

const jobAnalysisInputSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  companyName: z.string().min(1, 'Company name is required').max(200),
  jobDescription: z.string().min(1, 'Job description is required').max(10000),
  advertisedSalary: z.string().max(100).optional().default(''),
  recruiterEmailOrUrl: z.string().max(500).optional().default(''),
});

router.post('/', aiLimiter, async (req, res) => {
  const parseResult = jobAnalysisInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid input',
      details: parseResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  const jobData = parseResult.data;

  let analysis: any;
  let analysisType: string;
  let geminiError: string | null = null;

  try {
    const geminiResult = await analyzeJobWithGemini(jobData);
    if (geminiResult) {
      analysis = geminiResult;
      analysisType = 'Gemini AI Analysis';
    } else {
      analysis = analyzeJobRuleBased(jobData);
      analysisType = 'Rule-Based Demo Analysis';
    }
  } catch (err: any) {
    // Graceful fallback
    geminiError = err?.message || 'Gemini service error';
    analysis = analyzeJobRuleBased(jobData);
    analysisType = 'Rule-Based Demo Analysis';
  }

  const fullAnalysis = {
    ...analysis,
    analysisType,
    analysisTimestamp: new Date().toISOString(),
    uncertaintyDisclaimer:
      'Risk score is an estimate, not a verified probability of fraud. A low-risk result is not proof of legitimacy. Always verify independently.' +
      (geminiError ? ` (AI fallback used: ${geminiError})` : ''),
  };

  // Persist
  const id = uuidv4();
  getDB().run(
    'INSERT INTO job_analyses (id, data) VALUES (?, ?)',
    [id, JSON.stringify({ ...fullAnalysis, input: jobData })],
    (dbErr) => {
      if (dbErr) console.error('Failed to persist job analysis', dbErr);
    }
  );

  res.json({ id, ...fullAnalysis });
});

export default router;
