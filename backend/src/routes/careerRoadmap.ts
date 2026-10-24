import express from 'express';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getDB } from '../db/database.js';
import { generateRoadmap } from '../services/careerRoadmap.js';
import { generateRoadmapWithGemini, roadmapSchema } from '../services/careerRoadmapGemini.js';

const router = express.Router();

// Rate limit AI roadmap generation
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { error: 'Too many roadmap requests. Please try again later.' },
});

const roadmapInputSchema = z.object({
  targetCareer: z.string().min(1, 'Target career is required').max(100),
  educationLevel: z.string().min(1).max(100),
  currentSkills: z.string().max(2000).optional().default(''),
  experienceLevel: z.string().min(1).max(100),
  studyHoursPerWeek: z.coerce.number().int().min(1).max(80),
  targetPreparationPeriod: z.string().min(1).max(100),
});

router.post('/', aiLimiter, async (req, res) => {
  const parseResult = roadmapInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid input',
      details: parseResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  const input = parseResult.data;

  let roadmap: any;
  let roadmapType: string;
  let geminiError: string | null = null;

  try {
    const geminiResult = await generateRoadmapWithGemini(input);
    if (geminiResult) {
      roadmap = geminiResult;
      roadmapType = 'Gemini AI Roadmap';
    } else {
      roadmap = generateRoadmap(input);
      roadmapType = 'Demo Roadmap (Rule-Based)';
    }
  } catch (err: any) {
    geminiError = err?.message || 'Gemini service error';
    roadmap = generateRoadmap(input);
    roadmapType = 'Demo Roadmap (Rule-Based)';
  }

  const id = uuidv4();
  const disclaimer =
    'This roadmap is guidance only, not a guarantee of employment or job placement.' +
    (geminiError ? ` (AI fallback used: ${geminiError})` : '');

  const fullRoadmap = {
    ...roadmap,
    targetCareer: input.targetCareer,
    input,
    roadmapType,
    disclaimer,
  };

  getDB().run(
    'INSERT INTO roadmaps (id, target_career, data, progress) VALUES (?, ?, ?, ?)',
    [id, input.targetCareer, JSON.stringify(fullRoadmap), JSON.stringify({})],
    (err: any) => {
      if (err) console.error('Failed to persist roadmap', err);
    }
  );

  res.status(201).json({ id, ...fullRoadmap, progress: {} });
});

// List saved roadmaps
router.get('/', (req, res) => {
  getDB().all(
    'SELECT id, target_career, created_at, updated_at, progress FROM roadmaps ORDER BY updated_at DESC',
    [],
    (err: any, rows: any[]) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch roadmaps' });
      const list = (rows || []).map((row) => {
        let progress: Record<string, boolean> = {};
        try {
          progress = JSON.parse(row.progress || '{}');
        } catch {
          progress = {};
        }
        const totalMilestones = Object.keys(progress).length;
        const completed = Object.values(progress).filter(Boolean).length;
        return {
          id: row.id,
          targetCareer: row.target_career,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          completedMilestones: completed,
          trackedMilestones: totalMilestones,
        };
      });
      res.json(list);
    }
  );
});

router.get('/:id', (req, res) => {
  getDB().get(
    'SELECT * FROM roadmaps WHERE id = ?',
    [req.params.id],
    (err: any, row: any) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch roadmap' });
      if (!row) return res.status(404).json({ error: 'Roadmap not found' });
      let data: any = {};
      let progress: any = {};
      try {
        data = JSON.parse(row.data);
      } catch {
        data = {};
      }
      try {
        progress = JSON.parse(row.progress || '{}');
      } catch {
        progress = {};
      }
      res.json({
        id: row.id,
        targetCareer: row.target_career,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ...data,
        progress,
      });
    }
  );
});

router.patch('/:id', (req, res) => {
  const progressSchema = z.object({
    progress: z.record(z.string(), z.boolean()),
  });
  const parseResult = progressSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid progress payload' });
  }

  getDB().get(
    'SELECT progress FROM roadmaps WHERE id = ?',
    [req.params.id],
    (err: any, row: any) => {
      if (err) return res.status(500).json({ error: 'Failed to update roadmap' });
      if (!row) return res.status(404).json({ error: 'Roadmap not found' });

      let existing: Record<string, boolean> = {};
      try {
        existing = JSON.parse(row.progress || '{}');
      } catch {
        existing = {};
      }
      const merged = { ...existing, ...parseResult.data.progress };

      getDB().run(
        'UPDATE roadmaps SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(merged), req.params.id],
        (err2: any) => {
          if (err2) return res.status(500).json({ error: 'Failed to update roadmap' });
          res.json({ success: true, progress: merged });
        }
      );
    }
  );
});

// Reset roadmap progress
router.delete('/:id/progress', (req, res) => {
  getDB().run(
    'UPDATE roadmaps SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [JSON.stringify({}), req.params.id],
    function (this: any, err: any) {
      if (err) return res.status(500).json({ error: 'Failed to reset progress' });
      if (this.changes === 0) return res.status(404).json({ error: 'Roadmap not found' });
      res.json({ success: true });
    }
  );
});

export default router;
