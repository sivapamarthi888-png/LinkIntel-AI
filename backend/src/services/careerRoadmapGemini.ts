import { z } from 'zod';
import { generateTextWithPrompt, tryParseJsonFromGemini } from './gemini.js';

const milestoneSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional().default(''),
  duration: z.string(),
  order: z.number().optional(),
});

export const roadmapSchema = z.object({
  skillGapSummary: z.string(),
  milestones: z.array(milestoneSchema).min(1),
  weeklySchedule: z.array(
    z.object({
      week: z.number(),
      focus: z.string(),
      hours: z.number(),
      tasks: z.array(z.string()),
    })
  ),
  practicalProjects: z.array(z.string()),
  practiceExercises: z.array(z.string()),
  portfolioRecommendations: z.array(z.string()),
  interviewPreparationTopics: z.array(z.string()),
  estimatedEffort: z.string(),
  assumptions: z.string(),
});

export type RoadmapAI = z.infer<typeof roadmapSchema>;

const SUPPORTED_CAREERS = [
  'Frontend Developer',
  'Backend Developer',
  'Full-Stack Developer',
  'Data Analyst',
  'AI/ML Engineer',
  'Cybersecurity Analyst',
  'Cloud Engineer',
];

const SYSTEM = `You are a career planning assistant. Create realistic, actionable learning roadmaps from current skills to a target career.
Rules:
- Never guarantee employment or job placement outcomes.
- Estimate effort honestly with clear assumptions (study hours/week, prior experience).
- Be concrete: name specific technologies, project ideas, and milestones.
- Output ONLY valid JSON matching the schema. No markdown.`;

export async function generateRoadmapWithGemini(input: {
  targetCareer: string;
  educationLevel: string;
  currentSkills: string;
  experienceLevel: string;
  studyHoursPerWeek: number;
  targetPreparationPeriod: string;
}): Promise<RoadmapAI | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const career = SUPPORTED_CAREERS.includes(input.targetCareer)
    ? input.targetCareer
    : 'Software Developer';

  const prompt = `Create a personalized learning roadmap for the following person:

Target Career: ${career}
Education Level: ${input.educationLevel}
Experience Level: ${input.experienceLevel}
Current Skills: ${input.currentSkills || 'Not specified'}
Study Hours Per Week: ${input.studyHoursPerWeek}
Target Preparation Period: ${input.targetPreparationPeriod}

Provide:
1. A brief skill-gap summary.
2. Ordered learning milestones (each with a title, short description, rough duration, and sequential id starting at 1).
3. A week-by-week schedule for the first 4 weeks with a focus area, planned hours (based on ${input.studyHoursPerWeek}h/week) and 2-3 tasks per week.
4. 3-4 practical projects building towards the target role.
5. Practice exercises.
6. Portfolio recommendations.
7. Interview preparation topics.
8. Estimated total effort with assumptions.

Output ONLY JSON with this structure:
{
  "skillGapSummary": "...",
  "milestones": [{"id": 1, "title": "...", "description": "...", "duration": "..."}],
  "weeklySchedule": [{"week": 1, "focus": "...", "hours": <number>, "tasks": ["..."]}],
  "practicalProjects": ["..."],
  "practiceExercises": ["..."],
  "portfolioRecommendations": ["..."],
  "interviewPreparationTopics": ["..."],
  "estimatedEffort": "...",
  "assumptions": "..."
}`;

  const response = await generateTextWithPrompt(prompt, 'career_roadmap', {
    systemInstruction: SYSTEM,
    temperature: 0.3,
    timeoutMs: 60_000,
    maxOutputTokens: 3000,
  });

  const parsed = tryParseJsonFromGemini(response);
  if (!parsed) return null;
  const validated = roadmapSchema.safeParse(parsed);
  if (!validated.success) return null;
  return validated.data;
}
