import { describe, expect, it } from 'vitest';
import { matchSkillsRuleBased } from './services/skillMatch.js';

describe('matchSkillsRuleBased', () => {
  it('computes a sensible percentage', () => {
    const res = matchSkillsRuleBased('I know JavaScript, React and Git well.', 'Requires JavaScript, TypeScript, React, Git');
    // Of 4 JD skills: JavaScript, React, Git matched; TypeScript missing
    expect(res.matchPercentage).toBe(75);
    expect(res.matchedSkills).toContain('JavaScript');
    expect(res.missingOrWeaklyEvidencedSkills).toContain('TypeScript');
  });

  it('explains the score methodology', () => {
    const res = matchSkillsRuleBased('JavaScript', 'JavaScript, Node.js');
    expect(res.explanation).toContain('Rule-based');
    expect(res.explanation).toContain('× 100');
  });
});
