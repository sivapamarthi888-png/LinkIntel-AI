import express from 'express';

const router = express.Router();

// Static-crypto free health check including DB connectivity
router.get('/', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    const { getDB } = await import('../db/database.js');
    const db = getDB();
    db.get('SELECT 1', [], (err: any) => {
      dbStatus = err ? 'error' : 'ok';
      res.json({
        status: 'ok',
        service: 'LinkIntel AI API',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        geminiModel: process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash',
        mode: process.env.GEMINI_API_KEY ? 'ai' : 'demo',
        database: dbStatus,
      });
    });
  } catch {
    res.json({
      status: 'ok',
      service: 'LinkIntel AI API',
      timestamp: new Date().toISOString(),
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      geminiModel: process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash',
      mode: process.env.GEMINI_API_KEY ? 'ai' : 'demo',
      database: dbStatus,
    });
  }
});

export default router;
