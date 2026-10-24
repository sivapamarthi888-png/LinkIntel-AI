import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RiskBadge, AnalysisTypeLabel } from '../components/RiskBadge'
import { ScoreGauge, MatchScoreRing } from '../components/ScoreGauge'
import { EmptyState } from '../components/EmptyState'
import { StatusPill, ALL_STATUSES } from '../components/StatusPill'

describe('RiskBadge', () => {
  it('renders Low / Medium / High labels with icons', () => {
    render(
      <>
        <RiskBadge category="Low" />
        <RiskBadge category="Medium" />
        <RiskBadge category="High" />
      </>
    )
    expect(screen.getByText('Low Risk')).toBeInTheDocument()
    expect(screen.getByText('Medium Risk')).toBeInTheDocument()
    expect(screen.getByText('High Risk')).toBeInTheDocument()
  })
})

describe('AnalysisTypeLabel', () => {
  it('never presents rule-based output as AI analysis', () => {
    render(<AnalysisTypeLabel type="Rule-Based Demo Analysis" />)
    expect(screen.getByText('Rule-Based Demo Analysis')).toBeInTheDocument()
    expect(screen.queryByText('AI Analysis')).not.toBeInTheDocument()
  })
  it('labels AI output as AI Analysis', () => {
    render(<AnalysisTypeLabel type="Gemini AI Analysis" />)
    expect(screen.getByText('AI Analysis')).toBeInTheDocument()
  })
})

describe('ScoreGauge and MatchScoreRing', () => {
  it('clamp values to 0..100 and expose aria labels', () => {
    const { getByRole } = render(
      <>
        <ScoreGauge score={150} />
        <MatchScoreRing percent={-20} />
      </>
    )
    expect(getByRole('img', { name: 'Risk score 100 out of 100' })).toBeInTheDocument()
    expect(getByRole('img', { name: 'Match score 0%' })).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('renders title, description and action', () => {
    render(
      <EmptyState
        title="Nothing here"
        description="Some explanation"
        action={<button>Go</button>}
      />
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.getByText('Some explanation')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })
})

describe('StatusPill + statuses', () => {
  it('covers all 7 lifecycle statuses', () => {
    expect(ALL_STATUSES).toEqual([
      'Interested',
      'Applied',
      'Assessment',
      'Interview',
      'Offer',
      'Rejected',
      'Withdrawn',
    ])
    render(
      <>
        {ALL_STATUSES.map((s) => (
          <StatusPill key={s} status={s} />
        ))}
      </>
    )
    for (const s of ALL_STATUSES) {
      expect(screen.getByText(s)).toBeInTheDocument()
    }
  })
})
