import { z } from 'zod';
import { generateTextWithPrompt, tryParseJsonFromGemini } from './gemini.js';

// Structured schema for AI job analysis
const warningSignSchema = z.object({
  sign: z.string(),
  excerpt: z.string(),
  why: z.string(),
});

export const jobAnalysisSchema = z.object({
  riskCategory: z.enum(['Low', 'Medium', 'High']),
  riskScore: z.number().min(0).max(100),
  shortExplanation: z.string(),
  detectedWarningSigns: z.array(warningSignSchema),
  supportingExcerpts: z.array(z.string()).optional().default([]),
  positiveIndicators: z.array(z.string()).optional().default([]),
  recommendedNextActions: z.array(z.string()),
  questionsToAskRecruiter: z.array(z.string()),
});

export type JobAnalysisAI = z.infer<typeof jobAnalysisSchema>;

const SYSTEM_INST = `You are a job-scam-detection assistant. Analyze the provided job posting for potential recruitment scam indicators.

Guidelines:
- Consider factors like upfront fee requests, requests for OTPs/bank details, urgency pressure, unrealistic guarantees, vague information, suspicious contact channels.
- Do NOT automatically classify high salary, remote work, or external contact requests as scam.
- Return realistic and balanced analysis.
- Output ONLY valid JSON matching the requested schema. No markdown, no commentary.`;

const PROMPT_TEMPLATE = `Analyze the following job posting for scam red flags. Be factual, cite exact excerpts (verbatim from the input). Evaluate the scam likelihood of the posting and the recruiter (if details available). Pay particular attention to the following common scam patterns:
1. Requests for upfront recruitment fees, training fees, or equipment purchases.
2. Requests for OTPs, passwords, bank details, or copies of ID documents before an offer.
3. Suspicious payment instructions (wire transfer, crypto, gift cards).
4. Urgent pressure to provide personal/financial information immediately.
5. Guarantees of employment without a proper interview process.
6. Recruiter impersonation (e.g. free-email domain impersonating a company).
7. Inconsistencies in the job details (e.g. salary vs. responsibilities mismatch, vague description).

Remember: Do not classify high salary, remote-only roles, or contact-channel requests as scams by themselves.

Job Posting:
Title: {job_title}
Company: {company_name}
Salary: {salary}
Recruiter email/URL: {recruiter}
Description/Message: {description}

Output ONLY JSON with this structure:
{
  "riskCategory": "Low" | "Medium" | "High",
  "riskScore": <integer 0..100>,
  "shortExplanation": "<1-3 sentences>",
  "detectedWarningSigns": [
    { "sign": "<warning sign>", "excerpt": "<verbatim quote>", "why": "<why it matters>" }
  ],
  "supportingExcerpts": ["<verbatim excerpts>"],
  "positiveIndicators": ["<positive signals, if any>"],
  "recommendedNextActions": ["<actionable steps>"],
  "questionsToAskRecruiter": ["<good questions to ask>"]
}`;

export async function analyzeJobWithGemini(jobData: {
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  advertisedSalary?: string;
  recruiterEmailOrUrl?: string;
}): Promise<JobAnalysisAI | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const filled = PROMPT_TEMPLATE.replace('{job_title}', jobData.jobTitle || 'N/A')
    .replace('{company_name}', jobData.companyName || 'N/A')
    .replace('{salary}', jobData.advertisedSalary || 'N/A')
    .replace('{recruiter}', jobData.recruiterEmailOrUrl || 'N/A')
    .replace('{description}', jobData.jobDescription || 'N/A');

  const response = await generateTextWithPrompt(filled, 'job_scam_analysis', {
    systemInstruction: SYSTEM_INST,
    temperature: 0.2,
    timeoutMs: 45_000,
    maxOutputTokens: 2048,
  });

  const parsed = tryParseJsonFromGemini(response);
  if (!parsed) return null;

  const validated = jobAnalysisSchema.safeParse(parsed);
  if (!validated.success) return null;

  return validated.data;
}
