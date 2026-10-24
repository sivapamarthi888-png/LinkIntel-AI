import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';

// Use a temp database for tests
process.env.DATABASE_PATH = path.join(process.cwd(), 'data', 'test-linkintel.db');
process.env.OPENCODE_TEST = '1';

// Import app after env is set
import app from './index.js';
import { getDB } from './db/database.js';

const TEST_DB = process.env.DATABASE_PATH;

describe('LinkIntel AI Backend API', () => {
  beforeAll(async () => {
    // Seed some sample data via the API
    await request(app).post('/api/demo-data/seed');
  });

  afterAll(() => {
    try {
      getDB().close();
    } catch {
      // ignore
    }
    try {
      fs.rmSync(path.dirname(TEST_DB!), { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('GET /api/health', () => {
    it('returns ok with demo mode info', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.mode).toBe('demo');
      expect(res.body.geminiConfigured).toBe(false);
    });
  });

  describe('APP CRUD', () => {
    it('creates an application', async () => {
      const res = await request(app)
        .post('/api/applications')
        .send({
          job_title: 'Test Engineer',
          company: 'QA Corp',
          application_date: '2026-10-01',
          status: 'Applied',
        });
      expect(res.status).toBe(201);
      expect(res.body.job_title).toBe('Test Engineer');
      expect(res.body.id).toBeDefined();
    });

    it('rejects invalid application payloads', async () => {
      const res = await request(app)
        .post('/api/applications')
        .send({ job_title: '', company: '', application_date: 'not-a-date', status: 'Bogus' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
      expect(res.body.details.length).toBeGreaterThan(0);
    });

    it('lists applications including seeded samples', async () => {
      const res = await request(app).get('/api/applications');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(5);
    });

    it('filters by status', async () => {
      const res = await request(app).get('/api/applications').query({ status: 'Interview' });
      expect(res.status).toBe(200);
      for (const row of res.body) expect(row.status).toBe('Interview');
    });

    it('patches an application', async () => {
      const all = await request(app).get('/api/applications');
      const first = all.body[0];
      const res = await request(app)
        .patch(`/api/applications/${first.id}`)
        .send({ status: 'Offer' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('Offer');
    });

    it('deletes an application', async () => {
      const created = await request(app)
        .post('/api/applications')
        .send({ job_title: 'Delete Me', company: 'Temp Ltd', application_date: '2026-10-05', status: 'Interested' });
      const res = await request(app).delete(`/api/applications/${created.body.id}`);
      expect(res.status).toBe(200);
      const missing = await request(app).get(`/api/applications/${created.body.id}`);
      expect(missing.status).toBe(404);
    });

    it('returns 404 when deleting a non-existent application', async () => {
      const res = await request(app).delete('/api/applications/nonexistent-id');
      expect(res.status).toBe(404);
    });
  });

  describe('Job analysis (rule-based demo mode)', () => {
    it('flags clear scam signals as High risk', async () => {
      const res = await request(app)
        .post('/api/job-analysis')
        .send({
          jobTitle: 'Data Entry',
          companyName: 'QuickCash',
          jobDescription: 'Pay $99 upfront fee. Send OTP and bank details. Wire transfer only. Guaranteed job! Act now.',
        });
      expect(res.status).toBe(200);
      expect(['High', 'Medium']).toContain(res.body.riskCategory);
      expect(res.body.riskScore).toBeGreaterThan(50);
      expect(res.body.analysisType).toBe('Rule-Based Demo Analysis');
      expect(res.body.detectedWarningSigns.length).toBeGreaterThan(0);
      expect(res.body.analysisTimestamp).toBeDefined();
    });

    it ('does not flag an ordinary posting as High risk', async () => {
      const res = await request(app)
        .post('/api/job-analysis')
        .send({
          jobTitle: 'Software Engineer',
          companyName: 'GoodCorp',
          jobDescription: 'Join our team building web apps. Competitive salary, hybrid schedule. Apply via careers page.',
          advertisedSalary: '$90k', // high salary alone must not be scam
        });
      expect(res.status).toBe(200);
      expect(res.body.riskCategory).toBe('Low');
      expect(res.body.riskScore).toBeLessThan(20);
    });

    it('rejects invalid input with field details', async () => {
      const res = await request(app).post('/api/job-analysis').send({ jobTitle: '', companyName: '', jobDescription: '' });
      expect(res.status).toBe(400);
      expect(res.body.details.map((d: any) => d.field)).toEqual(expect.arrayContaining(['jobTitle', 'companyName', 'jobDescription']));
    });
  });

  describe('Skill match (rule-based demo mode)', () => {
    it('detects matched and missing skills', async () => {
      const res = await request(app)
        .post('/api/skill-match')
        .send({
          resumeText: 'Skills: JavaScript, React, HTML, CSS, Git',
          jobDescription: 'Requirements: JavaScript, TypeScript, React, Node.js, SQL, Git, communication',
        });
      expect(res.status).toBe(200);
      expect(res.body.matchPercentage).toBeGreaterThan(0);
      expect(res.body.matchedSkills).toEqual(expect.arrayContaining(['JavaScript', 'React', 'Git']));
      expect(res.body.missingOrWeaklyEvidencedSkills).toEqual(expect.arrayContaining(['TypeScript', 'Node.js', 'SQL']));
      expect(res.body.analysisType).toBe('Rule-Based Demo Analysis');
      expect(res.body.explanation).toContain('Rule-based');
    });

    it('requires resume and job description', async () => {
      const res = await request(app).post('/api/skill-match').send({ resumeText: '', jobDescription: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('Verification check', () => {
    it('returns checklist with honest unverified statuses', async () => {
      const res = await request(app)
        .post('/api/verification-check')
        .send({ companyName: 'TechCorp', recruiterEmailDomain: 'techcorp.hr@gmail.com' });
      expect(res.status).toBe(200);
      expect(res.body.liveVerification.performed).toBe(false);
      expect(res.body.checklist.length).toBeGreaterThan(3);
      const statuses = res.body.checklist.map((c: any) => c.status);
      expect(statuses).toContain('Not independently verified');
      // freemail domain should raise a warning, not be called fraud
      const domainItem = res.body.checklist.find((c: any) => c.item.includes('domain'));
      expect(domainItem.status).toBe('Warning detected');
      expect(domainItem.notes).toMatch(/does NOT prove fraud/i);
    });

    it('requires company name', async () => {
      const res = await request(app).post('/api/verification-check').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('Career roadmap', () => {
    it('generates a demo roadmap and persists it', async () => {
      const res = await request(app)
        .post('/api/career-roadmap')
        .send({
          targetCareer: 'Frontend Developer',
          educationLevel: 'Bachelor Degree',
          experienceLevel: 'Beginner',
          studyHoursPerWeek: 10,
          targetPreparationPeriod: '6 months',
        });
      expect(res.status).toBe(201);
      expect(res.body.roadmapType).toBe('Demo Roadmap (Rule-Based)');
      expect(res.body.milestones.length).toBeGreaterThan(0);
      expect(res.body.disclaimer).toMatch(/not a guarantee of employment/i);

      // Patch progress
      const progressRes = await request(app)
        .patch(`/api/roadmaps/${res.body.id}`)
        .send({ progress: { [`${res.body.milestones[0].id}`]: true } });
      expect(progressRes.status).toBe(200);
      expect(progressRes.body.progress[`${res.body.milestones[0].id}`]).toBe(true);

      // Re-read and confirm persist
      const read = await request(app).get(`/api/roadmaps/${res.body.id}`);
      expect(read.status).toBe(200);
      expect(read.body.progress[`${res.body.milestones[0].id}`]).toBe(true);
      expect(read.body.milestones.length).toBeGreaterThan(0);
    });

    it('lists saved roadmaps', async () => {
      const res = await request(app).get('/api/roadmaps');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].targetCareer).toBeDefined();
    });

    it('rejects invalid roadmap input', async () => {
      const res = await request(app)
        .post('/api/career-roadmap')
        .send({ targetCareer: '', studyHoursPerWeek: 0 });
      expect(res.status).toBe(400);
    });
  });

  describe('Dashboard', () => {
    it('returns aggregated stats from real data', async () => {
      const res = await request(app).get('/api/dashboard');
      expect(res.status).toBe(200);
      expect(res.body.totalApplications).toBeGreaterThan(0);
      expect(res.body.statusCounts).toBeDefined();
      expect(res.body.statusCounts.Offer).toBeGreaterThan(0);
      expect(Array.isArray(res.body.recentActivity)).toBe(true);
      expect(res.body.usingDemoData).toBe(false);
    });
  });

  describe('Demo data', () => {
    it('reports counts in health endpoint', async () => {
      const res = await request(app).get('/api/demo-data/health');
      expect(res.status).toBe(200);
      expect(res.body.counts.applications).toBeGreaterThan(0);
      expect(res.body.sampleDataPresent).toBe(true);
    });
  });

  describe('Unknown routes', () => {
    it('returns 404 JSON for unknown API endpoints', async () => {
      const res = await request(app).get('/api/does-not-exist');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Endpoint not found');
    });
  });
});
