import axios from 'axios';

// API base URL:
// - Local dev: relative '/api' goes through the Vite dev proxy to localhost:5000.
// - Production: set VITE_API_BASE_URL (e.g. https://linkintel-api.onrender.com/api)
//   at build time on the host (Vercel/Netlify) so the deployed frontend targets
//   the hosted backend.
const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

// All API calls go through this single axios instance.
// No secrets are embedded here — Gemini keys live only on the backend.
const api = axios.create({
  baseURL: apiBase,
  timeout: 90_000,
});

export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    if (data?.details && Array.isArray(data.details) && data.details.length > 0) {
      return data.details.map((d: any) => d.message).join('. ');
    }
    if (data?.error) return data.error;
    if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    if (!error.response) return 'Cannot reach the server. Is the backend running?';
    return `Request failed (${error.response.status})`;
  }
  if (error instanceof Error) return error.message;
  return 'Unexpected error';
}

export interface JobAnalysisResult {
  id: string;
  riskCategory: 'Low' | 'Medium' | 'High';
  riskScore: number;
  shortExplanation: string;
  detectedWarningSigns: { sign: string; excerpt: string; why: string }[];
  supportingExcerpts?: string[];
  positiveIndicators?: string[];
  recommendedNextActions: string[];
  questionsToAskRecruiter: string[];
  analysisType: string;
  analysisTimestamp: string;
  uncertaintyDisclaimer: string;
}

export interface SkillMatchResult {
  id: string;
  matchPercentage: number;
  matchedSkills: string[];
  missingOrWeaklyEvidencedSkills: string[];
  importantJobRequirements: string[];
  transferableSkills: { skill: string; reason: string }[];
  recommendedSkillsToLearn: { skill: string; reason: string; category?: string }[];
  portfolioProjectSuggestions: string[];
  resumeImprovementSuggestions: string[];
  interviewPreparationTopics: string[];
  explanation: string;
  analysisType: string;
  analysisTimestamp: string;
  extractedResumeSkills?: { name: string; category: string; count: number }[];
  targetJobTitle?: string;
}

export interface VerificationResult {
  companyName: string;
  checklist: { item: string; status: string; notes: string; evidence: string }[];
  domainGuidance: {
    suppliedDomain: string | null;
    candidateOfficialDomains: string[];
    note: string;
    rule: string;
  };
  guidance: {
    domainConsistency: string;
    officialCareersPage: string;
    verificationBadges: string;
    warnings: string[];
  };
  liveVerification: { performed: false; note: string };
  disclaimer: string;
}

export interface Roadmap {
  id: string;
  targetCareer: string;
  roadmapType: string;
  skillGapSummary: string;
  milestones: { id: number; title: string; description?: string; duration: string }[];
  weeklySchedule: { week: number; focus: string; hours: number; tasks: string[] }[];
  practicalProjects: string[];
  practiceExercises: string[];
  portfolioRecommendations: string[];
  interviewPreparationTopics: string[];
  estimatedEffort: string;
  assumptions: string;
  disclaimer: string;
  progress: Record<string, boolean>;
  createdAt?: string;
  updatedAt?: string;
  input?: {
    targetCareer: string;
    educationLevel: string;
    currentSkills?: string;
    experienceLevel: string;
    studyHoursPerWeek: number;
    targetPreparationPeriod: string;
  };
}

export interface Application {
  id: string;
  job_title: string;
  company: string;
  job_url: string | null;
  application_date: string;
  status: string;
  notes: string | null;
  follow_up_date: string | null;
  interview_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  totalApplications: number;
  interviewsScheduled: number;
  offersReceived: number;
  activeApplications: number;
  upcomingFollowUpCount: number;
  avgSkillMatch: number | null;
  statusCounts: Record<string, number>;
  recentJobAnalyses: { id: string; createdAt: string; riskCategory: string; riskScore: number; jobTitle: string; analysisType: string }[];
  recentSkillMatches: { id: string; createdAt: string; matchPercentage: number; targetJobTitle: string }[];
  roadmapProgress: { id: string; targetCareer: string; updatedAt: string; tracked: number; completed: number; completionPercent: number }[];
  upcomingInterviews: Application[];
  upcomingFollowUps: Application[];
  overdueFollowUps: Application[];
  recentActivity: { type: string; id: string; timestamp: string; summary: string }[];
  recentApplications: Application[];
}

export interface HealthStatus {
  status: string;
  geminiConfigured: boolean;
  geminiModel: string;
  mode: 'ai' | 'demo';
  database: string;
  timestamp: string;
}

export default api;
