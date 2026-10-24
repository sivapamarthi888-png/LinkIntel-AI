import { z } from 'zod';
import { generateTextWithPrompt, tryParseJsonFromGemini } from './gemini.js';

const skillMatchSchema = z.object({
  matchPercentage: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()),
  missingOrWeaklyEvidencedSkills: z.array(z.string()),
  importantJobRequirements: z.array(z.string()),
  transferableSkills: z.array(
    z.object({ skill: z.string(), reason: z.string() })
  ),
  recommendedSkillsToLearn: z.array(
    z.object({ skill: z.string(), reason: z.string(), category: z.string().optional() })
  ),
  portfolioProjectSuggestions: z.array(z.string()),
  resumeImprovementSuggestions: z.array(z.string()),
  interviewPreparationTopics: z.array(z.string()),
});

export type SkillMatchAI = z.infer<typeof skillMatchSchema>;

const SYSTEM = `You are a career coach analyzing how well a resume matches a job description.
Rules:
- NEVER invent experience, qualifications, or certifications the candidate does not have.
- A missing keyword is NOT proof the candidate lacks the skill — flag it as "missing or weakly evidenced".
- Explain how the score is calculated in the explanation.
- Output ONLY valid JSON matching the schema. No markdown.`;

export async function matchSkillsWithGemini(
  resumeText: string,
  jobDescription: string,
  targetJobTitle?: string
): Promise<SkillMatchAI | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const prompt = `Analyze the match between this resume and job description. Compare skills, identify gaps, and suggest concrete next steps.

Target Job Title (optional): ${targetJobTitle || 'Not specified'}

Job Description:
"""
${jobDescription.slice(0, 6000)}
"""

Resume:
"""
${resumeText.slice(0, 6000)}
"""

Output ONLY JSON with this structure:
{
  "matchPercentage": <integer 0..100>,
  "matchedSkills": ["<skill>"],
  "missingOrWeaklyEvidencedSkills": ["<skill>"],
  "importantJobRequirements": ["<requirement>"],
  "transferableSkills": [{"skill": "<skill>", "reason": "<why it transfers>"}],
  "recommendedSkillsToLearn": [{"skill": "<skill>", "reason": "<why>", "category": "<category>"}],
  "portfolioProjectSuggestions": ["<project idea>"],
  "resumeImprovementSuggestions": ["<suggestion>"],
  "interviewPreparationTopics": ["<topic>"]
}`;

  const response = await generateTextWithPrompt(prompt, 'skill_match', {
    systemInstruction: SYSTEM,
    temperature: 0.2,
    timeoutMs: 45_000,
    maxOutputTokens: 2048,
  });

  const parsed = tryParseJsonFromGemini(response);
  if (!parsed) return null;
  const validated = skillMatchSchema.safeParse(parsed);
  if (!validated.success) return null;
  return validated.data;
}
