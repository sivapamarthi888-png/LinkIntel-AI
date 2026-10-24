import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple synchronous red-flag tests on the rule-based analyzer logic
// (bypassing HTTP for speed and isolation of pure logic)
interface TestCase {
  name: string;
  expectHigh: boolean;
  description: string;
}

const CASES: TestCase[] = [
  { name: 'upfront fee + otp + guaranteed job', expectHigh: true, description: 'Pay $99 upfront. Send OTP and password. Guaranteed job! Act now.' },
  { name: 'wire transfer scam', expectHigh: true, description: 'For processing fees we accept only wire transfer or crypto.' },
  { name: 'ordinary engineer posting', expectHigh: false, description: 'We are hiring engineers. Competitive salary, hybrid. Apply at our careers page techcorp.com.' },
];

// Load the pure rule logic through a dynamic import avoided because of circulars -
// instead re-implement checks by testing via HTTP handlers is covered in index.test.
// Here we assert the service exports behave as documented.
describe('jobAnalysis rule sanity', () => {
  it('has deterministic ordering of warning categories', async () => {
    const mod = await import('./services/jobAnalysis.js');
    const input = {
      jobTitle: 'Data Entry',
      companyName: 'QuickCash',
      jobDescription: 'Pay upfront fee. Send OTP. Wire transfer. Guaranteed job. Act now urgent!',
    };
    const a = mod.analyzeJobRuleBased(input);
    const b = mod.analyzeJobRuleBased(input);
    // Deterministic: identical input must yield identical result
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      throw new Error('Rule-based analysis is not deterministic');
    }
  });

  it('caps the risk score at 100', async () => {
    const mod = await import('./services/jobAnalysis.js');
    const extreme = mod.analyzeJobRuleBased({
      jobTitle: 'x',
      companyName: 'y',
      jobDescription: Array.from({ length: 10 }).map(() => 'pay upfront fee send otp wire transfer guaranteed job act now urgent').join('. '),
    });
    if (extreme.riskScore > 100 || extreme.riskScore < 0) {
      throw new Error('Risk score out of range');
    }
  });

  it('treats high salary alone as low risk', async () => {
    const mod = await import('./services/jobAnalysis.js');
    const res = mod.analyzeJobRuleBased({
      jobTitle: 'AI Researcher',
      companyName: 'DeepTech Labs',
      advertisedSalary: '$250,000/year',
      jobDescription: 'Very competitive research salary. Remote-friendly. Relocation support offered.',
    });
    if (res.riskCategory !== 'Low') {
      throw new Error('High salary alone incorrectly flagged: ' + res.riskCategory);
    }
  });
});

describe('skillMatch rule sanity', () => {
  it('never counts skills absent from the job description', async () => {
    const mod = await import('./services/skillMatch.js');
    const res = mod.matchSkillsRuleBased('Skills: Python, Docker, Kubernetes', 'Must know JavaScript and React');
    if (res.matchedSkills.some((s) => ['Python', 'Docker', 'Kubernetes'].includes(s))) {
      throw new Error('Matched skills must come from the job description only');
    }
  });

  it('is deterministic across repeated calls', async () => {
    const mod = await import('./services/skillMatch.js');
    const r1 = mod.matchSkillsRuleBased('JavaScript, React, Git', 'JavaScript, TypeScript, React, Git');
    const r2 = mod.matchSkillsRuleBased('JavaScript, React, Git', 'JavaScript, TypeScript, React, Git');
    if (JSON.stringify(r1) !== JSON.stringify(r2)) {
      throw new Error('Skill matching is not deterministic');
    }
  });

  it('handles empty inputs without crashing', async () => {
    const mod = await import('./services/skillMatch.js');
    const res = mod.matchSkillsRuleBased('', '');
    if (typeof res.matchPercentage !== 'number' || Number.isNaN(res.matchPercentage)) {
      throw new Error('matchPercentage must be a number');
    }
  });
});

// sanity check test file discoverability
describe('test infra', () => {
  it('can read the test db directory', () => {
    const dataDir = path.join(process.cwd(), 'data');
    expect(fs.existsSync(dataDir) || fs.mkdirSync(dataDir, { recursive: true }) === undefined).toBe(true);
  });
});
