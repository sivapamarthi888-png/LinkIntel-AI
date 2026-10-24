import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db/database.js';
import healthRoutes from './routes/health.js';
import dashboardRoutes from './routes/dashboard.js';
import jobAnalysisRoutes from './routes/jobAnalysis.js';
import skillMatchRoutes from './routes/skillMatch.js';
import verificationRoutes from './routes/verification.js';
import careerRoadmapRoutes from './routes/careerRoadmap.js';
import applicationsRoutes from './routes/applications.js';
import demoRoutes from './routes/demo.js';

dotenv.config();

const app = express();

// Security and validation middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
// Limit request body size
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Pre-init DB
initDB();

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/job-analysis', jobAnalysisRoutes);
app.use('/api/skill-match', skillMatchRoutes);
app.use('/api/verification-check', verificationRoutes);
app.use('/api/career-roadmap', careerRoadmapRoutes);
app.use('/api/roadmaps', careerRoadmapRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/demo-data', demoRoutes);

// 404 for API
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Centralized error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Multer errors
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max size is 5MB.' });
  }
  if (err?.message?.includes('Only PDF')) {
    return res.status(400).json({ error: err.message });
  }

  console.error(`[Error] ${req.method} ${req.path}`);
  console.error(err && err.stack ? err.stack : err);

  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

// Only start listening when run directly (not under Vitest, which imports the app)
if (!process.env.VITEST) {
  app.listen(PORT, () => {
    console.log('Backend started');
    console.log(`Listening on http://localhost:${PORT}`);
    console.log(`Gemini configured: ${!!process.env.GEMINI_API_KEY}`);
  });
}

export default app;
