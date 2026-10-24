import express from 'express';
import { getDB } from '../db/database.js';

const router = express.Router();

const ALL_STATUSES = ['Interested', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

router.get('/', (req, res) => {
  getDB().all('SELECT * FROM applications', [], (err: any, apps: any[]) => {
    if (err) return res.status(500).json({ error: 'Failed to load dashboard' });
    const applications = apps || [];

    const today = new Date().toISOString().split('T')[0];
    const active = applications.filter((a) => a.status !== 'Rejected' && a.status !== 'Withdrawn');

    const upcomingInterviews = active
      .filter((a) => a.interview_date && a.interview_date >= today)
      .sort((a, b) => a.interview_date.localeCompare(b.interview_date))
      .slice(0, 5);

    const upcomingFollowUps = active
      .filter((a) => a.follow_up_date && a.follow_up_date >= today)
      .sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date))
      .slice(0, 5);

    const overdueFollowUps = active.filter(
      (a) => a.follow_up_date && a.follow_up_date < today
    );

    const statusCounts: Record<string, number> = {};
    for (const s of ALL_STATUSES) statusCounts[s] = 0;
    for (const a of applications) {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    }

    // Recent activity merged from different tables
    getDB().all('SELECT id, created_at, data FROM job_analyses ORDER BY created_at DESC LIMIT 5', [], (err2: any, analyses: any[]) => {
      getDB().all('SELECT id, created_at, data FROM skill_matches ORDER BY created_at DESC LIMIT 20', [], (err3: any, matches: any[]) => {
        getDB().all('SELECT id, target_career, progress, updated_at FROM roadmaps', [], (err4: any, roadmaps: any[]) => {
          // Parse job analyses safely
          const recentAnalyses = (analyses || []).map((row) => {
            try {
              const d = JSON.parse(row.data);
              return {
                id: row.id,
                createdAt: row.created_at,
                riskCategory: d.riskCategory,
                riskScore: d.riskScore,
                jobTitle: d.input?.jobTitle || 'Untitled',
                analysisType: d.analysisType,
              };
            } catch {
              return { id: row.id, createdAt: row.created_at };
            }
          });

          // Avg skill match
          const parsedMatches = (matches || []).map((row) => {
            try {
              return { id: row.id, createdAt: row.created_at, ...JSON.parse(row.data) };
            } catch {
              return null;
            }
          }).filter(Boolean) as any[];
          const avgSkillMatch =
            parsedMatches.length > 0
              ? Math.round(
                  parsedMatches.reduce((sum, m) => sum + (m.matchPercentage || 0), 0) /
                    parsedMatches.length
                )
              : null;

          // Roadmap completion
          const roadmapProgress = (roadmaps || []).map((row) => {
            let progress: Record<string, boolean> = {};
            try {
              progress = JSON.parse(row.progress || '{}');
            } catch {
              progress = {};
            }
            const tracked = Object.keys(progress).length;
            const completed = Object.values(progress).filter(Boolean).length;
            return {
              id: row.id,
              targetCareer: row.target_career,
              updatedAt: row.updated_at,
              tracked,
              completed,
              completionPercent: tracked === 0 ? 0 : Math.round((completed / tracked) * 100),
            };
          });

          const recentActivity = [
            ...recentAnalyses.map((a) => ({
              type: 'job_analysis' as const,
              id: a.id,
              timestamp: a.createdAt,
              summary: a.jobTitle ? `Analyzed "${a.jobTitle}" — ${a.riskCategory} risk` : 'Job analysis',
              detail: a,
            })),
            ...parsedMatches.slice(0, 5).map((m) => ({
              type: 'skill_match' as const,
              id: m.id,
              timestamp: m.createdAt,
              summary: `Skill match: ${m.matchPercentage}%`,
              detail: { targetJobTitle: m.targetJobTitle },
            })),
          ]
            .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
            .slice(0, 8);

          res.json({
            totalApplications: applications.length,
            interviewsScheduled: applications.filter((a) => a.interview_date || a.status === 'Interview').length,
            offersReceived: applications.filter((a) => a.status === 'Offer').length,
            activeApplications: active.length,
            upcomingFollowUpCount: upcomingFollowUps.length + overdueFollowUps.length,
            avgSkillMatch,
            statusCounts,
            recentJobAnalyses: recentAnalyses,
            recentSkillMatches: parsedMatches.slice(0, 5).map((m) => ({
              id: m.id,
              createdAt: m.createdAt,
              matchPercentage: m.matchPercentage,
              targetJobTitle: m.targetJobTitle,
            })),
            roadmapProgress,
            upcomingInterviews,
            upcomingFollowUps,
            overdueFollowUps,
            recentActivity,
            applicationsByStatus: statusCounts,
            recentApplications: [...applications]
              .sort((a, b) => (b.application_date || '').localeCompare(a.application_date || ''))
              .slice(0, 5),
            usingDemoData: false,
          });
        });
      });
    });
  });
});

export default router;
