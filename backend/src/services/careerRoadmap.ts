const careerTemplates: any = {
  'Frontend Developer': {
    skillGapSummary: 'Focus on modern frontend frameworks, responsive design, and testing.',
    milestones: [
      { id: 1, title: 'HTML, CSS, JavaScript Fundamentals', duration: '2-4 weeks', completed: false, description: 'Master core web technologies' },
      { id: 2, title: 'React/Framework Basics', duration: '4-6 weeks', completed: false, description: 'Learn component-based development' },
      { id: 3, title: 'State Management & Routing', duration: '2-3 weeks', completed: false, description: 'Handle complex app state' },
      { id: 4, title: 'Build Portfolio Projects', duration: '4-6 weeks', completed: false, description: 'Create 3-5 solid projects' }
    ],
    weeklySchedule: [
      { week: 1, focus: 'JavaScript ES6+', hours: 10, tasks: ['Practice array methods', 'Learn async/await'] }
    ],
    practicalProjects: ['Portfolio website', 'Todo app with React', 'E-commerce product page'],
    practiceExercises: ['Daily coding challenges', 'Build UI components'],
    portfolioRecommendations: ['GitHub with clean README', 'Live demos on Netlify/Vercel'],
    interviewPreparationTopics: ['JavaScript fundamentals', 'React concepts', 'CSS positioning'],
    estimatedEffort: '6-9 months',
    assumptions: 'Assumes consistent practice. This is a demo template, not a guarantee.'
  },
  'Backend Developer': {
    skillGapSummary: 'Focus on server-side logic, databases, and APIs.',
    milestones: [
      { id: 1, title: 'Programming Fundamentals', duration: '2-4 weeks', completed: false, description: 'Learn core language' },
      { id: 2, title: 'APIs & REST', duration: '3-4 weeks', completed: false, description: 'Build RESTful services' },
      { id: 3, title: 'Databases', duration: '3-4 weeks', completed: false, description: 'SQL and NoSQL basics' },
      { id: 4, title: 'Authentication & Security', duration: '2-3 weeks', completed: false, description: 'Learn secure practices' }
    ],
    weeklySchedule: [{ week: 1, focus: 'Node.js basics', hours: 10, tasks: ['Express setup', 'Routes'] }],
    practicalProjects: ['REST API', 'Blog backend', 'Auth system'],
    practiceExercises: ['API design challenges'],
    portfolioRecommendations: ['API documentation with Postman'],
    interviewPreparationTopics: ['Data structures', 'APIs', 'Database design'],
    estimatedEffort: '6-9 months',
    assumptions: 'Demo template only.'
  },
  'Full-Stack Developer': {
    skillGapSummary: 'Combine frontend and backend skills.',
    milestones: [
      { id: 1, title: 'Frontend Basics', duration: '4-6 weeks', completed: false },
      { id: 2, title: 'Backend Basics', duration: '4-6 weeks', completed: false },
      { id: 3, title: 'Full-Stack Projects', duration: '6-8 weeks', completed: false }
    ],
    weeklySchedule: [{ week: 1, focus: 'Full-stack fundamentals', hours: 12, tasks: ['MERN basics'] }],
    practicalProjects: ['Social media app', 'Task manager', 'E-commerce site'],
    practiceExercises: ['End-to-end projects'],
    portfolioRecommendations: ['Deployed full-stack apps'],
    interviewPreparationTopics: ['Both frontend and backend'],
    estimatedEffort: '9-12 months',
    assumptions: 'Demo template only.'
  },
  'Data Analyst': {
    skillGapSummary: 'Focus on data analysis, SQL, and visualization.',
    milestones: [
      { id: 1, title: 'Excel & SQL', duration: '4-6 weeks', completed: false },
      { id: 2, title: 'Data Analysis with Python/R', duration: '6-8 weeks', completed: false },
      { id: 3, title: 'Visualization Tools', duration: '3-4 weeks', completed: false }
    ],
    weeklySchedule: [{ week: 1, focus: 'SQL basics', hours: 8, tasks: ['SELECT queries'] }],
    practicalProjects: ['Sales dashboard', 'Customer analysis'],
    practiceExercises: ['Real datasets'],
    portfolioRecommendations: ['Kaggle portfolio', 'Power BI/Tableau'],
    interviewPreparationTopics: ['SQL', 'Statistics', 'Case studies'],
    estimatedEffort: '6-9 months',
    assumptions: 'Demo template only.'
  },
  'AI/ML Engineer': {
    skillGapSummary: 'Focus on ML fundamentals and AI frameworks.',
    milestones: [
      { id: 1, title: 'Math & Python', duration: '6-8 weeks', completed: false },
      { id: 2, title: 'ML Algorithms', duration: '8-10 weeks', completed: false },
      { id: 3, title: 'Deep Learning & Projects', duration: '8-12 weeks', completed: false }
    ],
    weeklySchedule: [{ week: 1, focus: 'Python for ML', hours: 12, tasks: ['NumPy, Pandas'] }],
    practicalProjects: ['Prediction model', 'Image classifier'],
    practiceExercises: ['Kaggle competitions'],
    portfolioRecommendations: ['ML projects on GitHub'],
    interviewPreparationTopics: ['Algorithms', 'Neural networks', 'ML theory'],
    estimatedEffort: '12-18 months',
    assumptions: 'Demo template only.'
  },
  'Cybersecurity Analyst': {
    skillGapSummary: 'Focus on security fundamentals and tools.',
    milestones: [
      { id: 1, title: 'Security Fundamentals', duration: '4-6 weeks', completed: false },
      { id: 2, title: 'Network Security', duration: '4-6 weeks', completed: false },
      { id: 3, title: 'Threat Detection', duration: '6-8 weeks', completed: false }
    ],
    weeklySchedule: [{ week: 1, focus: 'Networking basics', hours: 10, tasks: ['TCP/IP'] }],
    practicalProjects: ['Vulnerability scan', 'Security audit'],
    practiceExercises: ['TryHackMe labs'],
    portfolioRecommendations: ['Security writeups'],
    interviewPreparationTopics: ['OWASP Top 10', 'Incident response'],
    estimatedEffort: '6-9 months',
    assumptions: 'Demo template only.'
  },
  'Cloud Engineer': {
    skillGapSummary: 'Focus on cloud platforms and DevOps.',
    milestones: [
      { id: 1, title: 'Cloud Fundamentals', duration: '4-6 weeks', completed: false },
      { id: 2, title: 'AWS/Azure/GCP', duration: '6-8 weeks', completed: false },
      { id: 3, title: 'IaC & DevOps', duration: '4-6 weeks', completed: false }
    ],
    weeklySchedule: [{ week: 1, focus: 'Cloud basics', hours: 10, tasks: ['IAM, S3'] }],
    practicalProjects: ['Deploy app to cloud', 'CI/CD pipeline'],
    practiceExercises: ['Cloud certification labs'],
    portfolioRecommendations: ['Cloud projects'],
    interviewPreparationTopics: ['Cloud architecture', 'Networking', 'Security'],
    estimatedEffort: '6-9 months',
    assumptions: 'Demo template only.'
  }
};

export function generateRoadmap(input: any) {
  const template = careerTemplates[input.targetCareer] || careerTemplates['Frontend Developer'];
  // NOTE: `disclaimer` and `roadmapType` are deliberately NOT set here.
  // The route (routes/careerRoadmap.ts) is the single source of truth for both,
  // so demo/AI paths can never silently override the user-facing disclaimer.
  return {
    ...template,
    targetCareer: input.targetCareer,
    input
  };
}
