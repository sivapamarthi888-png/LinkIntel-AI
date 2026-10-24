import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getDB } from '../db/database.js';

const router = express.Router();

const STATUSES = ['Interested', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'] as const;

const dateish = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)');

const applicationCreateSchema = z.object({
  job_title: z.string().min(1, 'Job title is required').max(200),
  company: z.string().min(1, 'Company is required').max(200),
  job_url: z.string().max(1000).optional().or(z.literal('')),
  application_date: dateish,
  status: z.enum(STATUSES),
  notes: z.string().max(5000).optional().or(z.literal('')),
  follow_up_date: dateish.optional().or(z.literal('')),
  interview_date: dateish.optional().or(z.literal('')),
});

const applicationUpdateSchema = applicationCreateSchema.partial();

const querySchema = z.object({
  search: z.string().max(200).optional(),
  status: z.enum(STATUSES).optional(),
  sort: z.enum(['date_asc', 'date_desc']).optional().default('date_desc'),
});

router.get('/', (req, res) => {
  const parseResult = querySchema.safeParse(req.query);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }
  const { search, status, sort } = parseResult.data;

  let sql = 'SELECT * FROM applications';
  const conditions: string[] = [];
  const params: string[] = [];

  if (search) {
    conditions.push('(LOWER(job_title) LIKE ? OR LOWER(company) LIKE ?)');
    const like = `%${search.toLowerCase()}%`;
    params.push(like, like);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += sort === 'date_asc' ? ' ORDER BY application_date ASC' : ' ORDER BY application_date DESC';

  getDB().all(sql, params, (err: any, rows: any[]) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch applications' });
    res.json(rows || []);
  });
});

router.post('/', (req, res) => {
  const parseResult = applicationCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid input',
      details: parseResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  const data = parseResult.data;
  const id = uuidv4();

  getDB().run(
    `INSERT INTO applications (id, job_title, company, job_url, application_date, status, notes, follow_up_date, interview_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.job_title,
      data.company,
      data.job_url || null,
      data.application_date,
      data.status,
      data.notes || null,
      data.follow_up_date || null,
      data.interview_date || null,
    ],
    function (this: any, err: any) {
      if (err) return res.status(500).json({ error: 'Failed to create application' });
      getDB().get('SELECT * FROM applications WHERE id = ?', [id], (err2: any, row: any) => {
        if (err2) return res.status(500).json({ error: 'Failed to fetch created application' });
        res.status(201).json(row);
      });
    }
  );
});

router.get('/:id', (req, res) => {
  getDB().get('SELECT * FROM applications WHERE id = ?', [req.params.id], (err: any, row: any) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch application' });
    if (!row) return res.status(404).json({ error: 'Application not found' });
    res.json(row);
  });
});

router.patch('/:id', (req, res) => {
  const parseResult = applicationUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid input',
      details: parseResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  const allowedFields = ['job_title', 'company', 'job_url', 'application_date', 'status', 'notes', 'follow_up_date', 'interview_date'];
  const fields: string[] = [];
  const values: any[] = [];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(req.body[field] === '' ? null : req.body[field]);
    }
  }
  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id);

  getDB().run(
    `UPDATE applications SET ${fields.join(', ')} WHERE id = ?`,
    values,
    function (this: any, err: any) {
      if (err) return res.status(500).json({ error: 'Failed to update application' });
      if (this.changes === 0) return res.status(404).json({ error: 'Application not found' });
      getDB().get('SELECT * FROM applications WHERE id = ?', [req.params.id], (err2: any, row: any) => {
        if (err2) return res.status(500).json({ error: 'Failed to fetch updated application' });
        res.json(row);
      });
    }
  );
});

router.delete('/:id', (req, res) => {
  getDB().run('DELETE FROM applications WHERE id = ?', [req.params.id], function (this: any, err: any) {
    if (err) return res.status(500).json({ error: 'Failed to delete application' });
    if (this.changes === 0) return res.status(404).json({ error: 'Application not found' });
    res.json({ success: true });
  });
});

export default router;
