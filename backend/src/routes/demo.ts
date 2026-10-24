import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/database.js';

const router = express.Router();

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Sample/seed data for demo mode
const SAMPLE_APPLICATIONS = [
  {
    job_title: 'Frontend Developer',
    company: 'Acme Corp',
    job_url: 'https://example.com/careers/frontend-dev',
    application_date: daysFromNow(-9),
    status: 'Applied',
    notes: 'Applied via careers page. Recruiters seem responsive.',
    follow_up_date: daysFromNow(2),
    interview_date: null,
  },
  {
    job_title: 'Junior Backend Engineer',
    company: 'Bluewave Systems',
    job_url: 'https://example.com/jobs/junior-backend',
    application_date: daysFromNow(-5),
    status: 'Assessment',
    notes: 'Received take-home assessment — due next week.',
    follow_up_date: daysFromNow(1),
    interview_date: null,
  },
  {
    job_title: 'Data Analyst',
    company: 'DataWise Ltd',
    job_url: 'https://example.com/careers/data-analyst',
    application_date: daysFromNow(-12),
    status: 'Interview',
    notes: 'Technical interview scheduled. Review SQL and dashboards.',
    follow_up_date: null,
    interview_date: daysFromNow(4),
  },
  {
    job_title: 'Full-Stack Developer',
    company: 'NorthPeak Tech',
    job_url: null,
    application_date: daysFromNow(-20),
    status: 'Offer',
    notes: 'Offer received! Review the package and respond.',
    follow_up_date: daysFromNow(1),
    interview_date: null,
  },
  {
    job_title: 'QA Engineer',
    company: 'SoftCheck Inc',
    job_url: null,
    application_date: daysFromNow(-15),
    status: 'Rejected',
    notes: 'Rejected after first round. Ask for feedback.',
    follow_up_date: null,
    interview_date: null,
  },
  {
    job_title: 'Cloud Support Engineer',
    company: 'SkyStack',
    job_url: null,
    application_date: daysFromNow(-2),
    status: 'Interested',
    notes: 'Saved for later — looks promising.',
    follow_up_date: daysFromNow(3),
    interview_date: null,
  },
  {
    job_title: 'Marketing Data Intern',
    company: 'OldReach',
    job_url: null,
    application_date: daysFromNow(-7),
    status: 'Withdrawn',
    notes: 'Withdrew — role did not match career goals.',
    follow_up_date: null,
    interview_date: null,
  },
];

router.post('/seed', (req, res) => {
  const db = getDB();
  db.serialize(() => {
    db.run('DELETE FROM applications');
    const stmt = db.prepare(
      `INSERT INTO applications (id, job_title, company, job_url, application_date, status, notes, follow_up_date, interview_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const app of SAMPLE_APPLICATIONS) {
      stmt.run(
        uuidv4(),
        app.job_title,
        app.company,
        app.job_url,
        app.application_date,
        app.status,
        app.notes,
        app.follow_up_date,
        app.interview_date
      );
    }
    stmt.finalize((err: any) => {
      if (err) {
        console.error('Failed to seed sample applications', err);
        return res.status(500).json({ error: 'Failed to seed sample data' });
      }
      res.status(201).json({
        success: true,
        message: 'Sample applications created. These are demo records, not real applications to employers.',
        count: SAMPLE_APPLICATIONS.length,
      });
    });
  });
});

router.delete('/', (req, res) => {
  const db = getDB();
  db.serialize(() => {
    db.run('DELETE FROM applications');
    db.run('DELETE FROM roadmaps');
    db.run('DELETE FROM job_analyses');
    db.run('DELETE FROM skill_matches');
    res.json({ success: true, message: 'All demo data cleared' });
  });
});

router.get('/health', (req, res) => {
  const db = getDB();
  db.get(
    `SELECT
      (SELECT COUNT(*) FROM applications) as applications,
      (SELECT COUNT(*) FROM roadmaps) as roadmaps,
      (SELECT COUNT(*) FROM job_analyses) as analyses,
      (SELECT COUNT(*) FROM skill_matches) as matches`,
    [],
    (err: any, row: any) => {
      if (err) return res.status(500).json({ error: 'Failed to query demo data status' });
      res.json({
        sampleDataPresent: row && row.applications > 0,
        counts: row,
      });
    }
  );
});

export default router;
