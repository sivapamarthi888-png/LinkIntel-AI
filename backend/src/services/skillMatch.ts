// Comprehensive skill dictionary by category
const SKILL_LIBRARY: { name: string; aliases: string[]; category: string; related: string[] }[] = [
  // Frontend
  { name: 'JavaScript', aliases: ['javascript', 'js', 'es6', 'ecmascript'], category: 'Frontend', related: ['TypeScript'] },
  { name: 'TypeScript', aliases: ['typescript', 'ts'], category: 'Frontend', related: ['JavaScript'] },
  { name: 'React', aliases: ['react', 'react.js', 'reactjs'], category: 'Frontend', related: ['Next.js', 'Redux'] },
  { name: 'HTML', aliases: ['html', 'html5'], category: 'Frontend', related: ['CSS'] },
  { name: 'CSS', aliases: ['css', 'css3'], category: 'Frontend', related: ['Sass', 'Tailwind'] },
  { name: 'Vue.js', aliases: ['vue', 'vue.js', 'vuejs'], category: 'Frontend', related: ['Nuxt.js'] },
  { name: 'Angular', aliases: ['angular', 'angularjs'], category: 'Frontend', related: ['TypeScript'] },
  { name: 'Tailwind CSS', aliases: ['tailwind', 'tailwindcss'], category: 'Frontend', related: ['CSS'] },
  { name: 'Next.js', aliases: ['next.js', 'nextjs'], category: 'Frontend', related: ['React'] },

  // Backend
  { name: 'Node.js', aliases: ['node', 'node.js', 'nodejs'], category: 'Backend', related: ['Express'] },
  { name: 'Express', aliases: ['express', 'express.js', 'expressjs'], category: 'Backend', related: ['Node.js'] },
  { name: 'Python', aliases: ['python'], category: 'Backend', related: ['Django', 'Flask'] },
  { name: 'Java', aliases: ['java'], category: 'Backend', related: ['Spring'] },
  { name: 'SQL', aliases: ['sql', 'sql queries'], category: 'Data', related: ['PostgreSQL', 'MySQL'] },
  { name: 'MongoDB', aliases: ['mongodb', 'mongo'], category: 'Data', related: ['NoSQL'] },
  { name: 'PostgreSQL', aliases: ['postgresql', 'postgres'], category: 'Data', related: ['SQL'] },
  { name: 'MySQL', aliases: ['mysql'], category: 'Data', related: ['SQL'] },
  { name: 'Redis', aliases: ['redis'], category: 'Data', related: ['Caching'] },
  { name: 'GraphQL', aliases: ['graphql'], category: 'Backend', related: ['REST'] },
  { name: 'REST API', aliases: ['rest', 'rest api', 'restful', 'api development'], category: 'Backend', related: ['GraphQL'] },
  { name: 'Django', aliases: ['django'], category: 'Backend', related: ['Python'] },
  { name: 'Spring', aliases: ['spring', 'spring boot', 'springboot'], category: 'Backend', related: ['Java'] },

  // DevOps / Cloud
  { name: 'Docker', aliases: ['docker', 'containers'], category: 'DevOps', related: ['Kubernetes'] },
  { name: 'Kubernetes', aliases: ['kubernetes', 'k8s'], category: 'DevOps', related: ['Docker'] },
  { name: 'AWS', aliases: ['aws', 'amazon web services'], category: 'Cloud', related: ['Azure', 'GCP'] },
  { name: 'Azure', aliases: ['azure', 'microsoft azure'], category: 'Cloud', related: ['AWS'] },
  { name: 'GCP', aliases: ['gcp', 'google cloud'], category: 'Cloud', related: ['AWS'] },
  { name: 'CI/CD', aliases: ['ci/cd', 'ci cd', 'continuous integration'], category: 'DevOps', related: ['Jenkins', 'GitHub Actions'] },
  { name: 'Linux', aliases: ['linux', 'unix', 'bash'], category: 'DevOps', related: ['Shell Scripting'] },
  { name: 'Git', aliases: ['git', 'github', 'gitlab', 'version control'], category: 'Tooling', related: ['CI/CD'] },

  // Data / ML
  { name: 'Machine Learning', aliases: ['machine learning', 'ml', 'ml algorithms'], category: 'AI/ML', related: ['Python', 'TensorFlow'] },
  { name: 'Deep Learning', aliases: ['deep learning', 'neural networks'], category: 'AI/ML', related: ['Machine Learning'] },
  { name: 'TensorFlow', aliases: ['tensorflow'], category: 'AI/ML', related: ['Machine Learning'] },
  { name: 'PyTorch', aliases: ['pytorch', 'torch'], category: 'AI/ML', related: ['Machine Learning'] },
  { name: 'Pandas', aliases: ['pandas'], category: 'Data', related: ['NumPy'] },
  { name: 'NumPy', aliases: ['numpy'], category: 'Data', related: ['Pandas'] },
  { name: 'Data Visualization', aliases: ['data visualization', 'tableau', 'power bi', 'powerbi', 'looker'], category: 'Data', related: ['SQL'] },
  { name: 'Statistics', aliases: ['statistics', 'statistical analysis', 'stats'], category: 'Data', related: ['Data Analysis'] },
  { name: 'Excel', aliases: ['excel', 'microsoft excel', 'spreadsheets'], category: 'Data', related: ['Data Analysis'] },
  { name: 'Data Analysis', aliases: ['data analysis', 'data analytics'], category: 'Data', related: ['SQL', 'Statistics'] },

  // Security
  { name: 'Network Security', aliases: ['network security', 'networking security'], category: 'Security', related: ['Cybersecurity'] },
  { name: 'Cybersecurity', aliases: ['cybersecurity', 'information security', 'infosec'], category: 'Security', related: ['Network Security'] },
  { name: 'Penetration Testing', aliases: ['penetration testing', 'pentesting', 'ethical hacking'], category: 'Security', related: ['Cybersecurity'] },
  { name: 'OWASP', aliases: ['owasp'], category: 'Security', related: ['Web Security'] },

  // Soft skills / general
  { name: 'Communication', aliases: ['communication', 'communication skills'], category: 'Soft Skills', related: [] },
  { name: 'Agile', aliases: ['agile', 'scrum', 'kanban'], category: 'Process', related: ['Project Management'] },
  { name: 'Testing', aliases: ['testing', 'unit testing', 'jest', 'pytest', 'qa'], category: 'Quality', related: ['CI/CD'] },
  { name: 'Problem Solving', aliases: ['problem solving', 'analytical thinking', 'analytical skills'], category: 'Soft Skills', related: [] },
  { name: 'Teamwork', aliases: ['teamwork', 'collaboration', 'team player'], category: 'Soft Skills', related: [] },
  { name: 'Leadership', aliases: ['leadership', 'leading teams', 'mentoring'], category: 'Soft Skills', related: [] },
  { name: 'Project Management', aliases: ['project management', 'managing projects'], category: 'Process', related: ['Agile'] },
];

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findSkillOccurrences(text: string): Map<string, { count: number; category: string }> {
  const found = new Map<string, { count: number; category: string }>();
  const lower = text.toLowerCase();
  for (const skill of SKILL_LIBRARY) {
    for (const alias of skill.aliases) {
      // Match whole word or acronym
      const pattern = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i');
      const matches = lower.match(new RegExp(pattern.source, 'gi'));
      if (matches) {
        const existing = found.get(skill.name);
        found.set(skill.name, {
          count: (existing?.count || 0) + matches.length,
          category: skill.category,
        });
        break; // stop after first matching alias
      }
    }
  }
  return found;
}

export interface SkillMatchResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingOrWeaklyEvidencedSkills: string[];
  importantJobRequirements: string[];
  transferableSkills: { skill: string; reason: string }[];
  recommendedSkillsToLearn: { skill: string; reason: string; category: string }[];
  portfolioProjectSuggestions: string[];
  resumeImprovementSuggestions: string[];
  interviewPreparationTopics: string[];
  explanation: string;
  analysisType: string;
  extractedResumeSkills: { name: string; category: string; count: number }[];
}

export function matchSkillsRuleBased(
  resumeTextRaw: string,
  jobDescriptionRaw: string,
  targetJobTitle?: string
): SkillMatchResult {
  const resumeSkills = findSkillOccurrences(resumeTextRaw);
  const jobSkills = findSkillOccurrences(jobDescriptionRaw);

  const matched: string[] = [];
  const missing: string[] = [];

  for (const [skillName, info] of jobSkills) {
    if (resumeSkills.has(skillName)) {
      matched.push(skillName);
    } else {
      missing.push(skillName);
    }
  }

  const totalRelevantSkills = matched.length + missing.length;
  const matchPercentage =
    totalRelevantSkills === 0
      ? 0
      : Math.round((matched.length / totalRelevantSkills) * 100);

  const transferableSkills: { skill: string; reason: string }[] = [];
  for (const [resumeSkillName, resumeInfo] of resumeSkills) {
    // If skill in resume isn't in job but related to a missing job skill
    const libEntry = SKILL_LIBRARY.find((s) => s.name === resumeSkillName);
    if (libEntry) {
      for (const related of libEntry.related) {
        const relatedJobReq = jobSkills.has(related);
        if (relatedJobReq && !matched.includes(related) && !missing.includes(related)) {
          // Related skill already matched in resume somehow
          continue;
        }
        if (relatedJobReq && missing.includes(related)) {
          if (!transferableSkills.some((t) => t.skill === related)) {
            transferableSkills.push({
              skill: related,
              reason: `You have experience with ${resumeSkillName}, which is closely related to ${related}.`,
            });
          }
        }
      }
    }
  }

  const recommendedSkillsToLearn = missing.slice(0, 6).map((skill) => {
    const entry = SKILL_LIBRARY.find((s) => s.name === skill);
    return {
      skill,
      reason: 'Required in job description but not clearly found in resume',
      category: entry?.category || 'General',
    };
  });

  const portfolioProjectSuggestions: string[] = [];
  if (missing.length > 0) {
    portfolioProjectSuggestions.push(`Build a small project that uses ${missing[0]} to demonstrate that skill.`);
    if (missing.length > 1) {
      portfolioProjectSuggestions.push(
        `Combine ${missing.slice(0, 2).join(' and ')} in a portfolio project.`
      );
    }
  } else {
    portfolioProjectSuggestions.push('Strengthen existing skills with more polished, deployed projects.');
  }

  const resumeImprovementSuggestions: string[] = [
    'List skills explicitly in a dedicated Skills section — a missing keyword here is not proof you lack the skill, but explicit mention helps.',
    'Quantify achievements (e.g. "improved load time by 40%").',
    'Mirror the exact names of key technologies used in the job description.',
  ];

  const interviewPreparationTopics = matched.slice(0, 5).map(
    (skill) => `Prepare examples of using ${skill} in real projects.`
  );

  // Important requirements: skills with high occurrence in the JD or all missing ones
  const importantJobRequirements = Array.from(jobSkills.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([skill, info]) => `${skill}${info.count > 1 ? ` (mentioned ${info.count}x)` : ''}`);

  const explanation = `Rule-based demo analysis (keyword matching). Score = (matched ÷ relevant) × 100: ${matched.length} matched of ${totalRelevantSkills} skills found in the job description; ${missing.length} missing. A missing keyword is not proof you lack the skill — it may be worded differently in your resume.`;

  return {
    matchPercentage,
    matchedSkills: matched,
    missingOrWeaklyEvidencedSkills: missing,
    importantJobRequirements,
    transferableSkills,
    recommendedSkillsToLearn,
    portfolioProjectSuggestions,
    resumeImprovementSuggestions,
    interviewPreparationTopics,
    explanation,
    analysisType: 'Rule-Based Demo Analysis',
    extractedResumeSkills: Array.from(resumeSkills.entries()).map(([name, info]) => ({
      name,
      category: info.category,
      count: info.count,
    })),
  };
}

export { SKILL_LIBRARY };
