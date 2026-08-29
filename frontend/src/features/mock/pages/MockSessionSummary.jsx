import React, { useState } from 'react'
import { useNavigate } from 'react-router'

const SCORE_COLOR = (score) => {
    if (score >= 8) return '#10b981'
    if (score >= 6) return '#f59e0b'
    if (score >= 4) return '#f97316'
    return '#ef4444'
}

const PERF_BADGES = {
    Excellent: { color: '#10b981', icon: '🏆' },
    Good: { color: '#3b82f6', icon: '👍' },
    Average: { color: '#f59e0b', icon: '📈' },
    'Needs Improvement': { color: '#f97316', icon: '💪' },
    Poor: { color: '#ef4444', icon: '📚' },
}

function ScoreRing({ score, max = 10, size = 80 }) {
    const radius = (size - 12) / 2
    const circumference = 2 * Math.PI * radius
    const pct = Math.min(1, score / max)
    const offset = circumference * (1 - pct)
    const color = SCORE_COLOR(score)

    return (
        <div className="summary-score-ring" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth="6" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={color} strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
                />
            </svg>
            <span className="summary-score-ring__text" style={{ color, fontSize: size > 70 ? '1.3rem' : '0.9rem' }}>
                {score}
            </span>
        </div>
    )
}

function BreakdownBar({ label, value, max = 10 }) {
    const pct = Math.min(100, (value / max) * 100)
    const color = SCORE_COLOR(value)
    return (
        <div className="breakdown-bar">
            <div className="breakdown-bar__header">
                <span className="breakdown-bar__label">{label}</span>
                <span className="breakdown-bar__value" style={{ color }}>{value}/10</span>
            </div>
            <div className="breakdown-bar__track">
                <div className="breakdown-bar__fill" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    )
}

function QuestionResultCard({ result, index }) {
    const [expanded, setExpanded] = useState(false)
    const color = SCORE_COLOR(result.score)
    const diffColor = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }[result.difficulty] || '#64748b'

    return (
        <div className="q-result-card">
            <div className="q-result-card__header" onClick={() => setExpanded(e => !e)}>
                <div className="q-result-card__left">
                    <span className="q-result-card__num">Q{index + 1}</span>
                    <div className="q-result-card__meta">
                        <span className="q-result-card__type"
                            style={{ color: result.questionType === 'technical' ? '#818cf8' : '#34d399' }}>
                            {result.questionType}
                        </span>
                        <span className="q-result-card__diff" style={{ color: diffColor }}>
                            {result.difficulty}
                        </span>
                    </div>
                    <p className="q-result-card__question">{result.question}</p>
                </div>
                <div className="q-result-card__right">
                    <ScoreRing score={result.score} size={56} />
                    <span className="q-result-card__expand">{expanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {expanded && (
                <div className="q-result-card__body">
                    {/* Breakdown bars */}
                    <div className="q-result-card__breakdown">
                        <BreakdownBar label="Relevance" value={result.breakdown?.relevance ?? 0} />
                        <BreakdownBar label="Depth" value={result.breakdown?.depth ?? 0} />
                        <BreakdownBar label="Clarity" value={result.breakdown?.clarity ?? 0} />
                    </div>

                    {/* Your answer */}
                    <div className="q-result-block">
                        <p className="q-result-block__label">📝 Your Answer</p>
                        <p className="q-result-block__text q-result-block__text--muted">
                            {result.userAnswer?.trim() || <em>No answer provided</em>}
                        </p>
                    </div>

                    {/* AI Feedback */}
                    <div className="q-result-block">
                        <p className="q-result-block__label">🤖 AI Feedback</p>
                        <p className="q-result-block__text">{result.feedback}</p>
                    </div>

                    {/* Strengths */}
                    {result.strengths?.length > 0 && (
                        <div className="q-result-block">
                            <p className="q-result-block__label">✅ Strengths</p>
                            <ul className="q-result-list q-result-list--green">
                                {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    )}

                    {/* Improvements */}
                    {result.improvements?.length > 0 && (
                        <div className="q-result-block">
                            <p className="q-result-block__label">🎯 Areas to Improve</p>
                            <ul className="q-result-list q-result-list--orange">
                                {result.improvements.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    )}

                    {/* Model answer */}
                    <div className="q-result-block q-result-block--suggested">
                        <p className="q-result-block__label">💡 Suggested Answer</p>
                        <p className="q-result-block__text">{result.suggestedAnswer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Main Summary Page ─────────────────────────────────────────────────────────
export default function MockSessionSummary({ session, onBack }) {
    const navigate = useNavigate()
    const { evaluation, jobTitle, startTime, endTime, questions, interviewId } = session
    const handleBack = () => {
        if (onBack) {
            onBack()
        } else if (interviewId) {
            navigate(`/interview/${interviewId}`)
        } else {
            navigate(-1)
        }
    }
    const perf = PERF_BADGES[evaluation?.performanceLabel] || PERF_BADGES['Average']
    const durationMin = startTime && endTime
        ? Math.round((new Date(endTime) - new Date(startTime)) / 60000)
        : null

    const overallPct = Math.round((evaluation?.overallScore ?? 0))

    return (
        <div className="summary-page">
            {/* Hero banner */}
            <div className="summary-hero">
                <div className="summary-hero__content">
                    <p className="summary-hero__pre">Mock Interview Complete</p>
                    <h1 className="summary-hero__title">{jobTitle || 'Interview Session'}</h1>

                    <div className="summary-hero__score-row">
                        {/* Overall score ring */}
                        <div className="summary-overall-score">
                            <div className="summary-overall-score__ring">
                                <ScoreRing score={overallPct} max={100} size={120} />
                            </div>
                            <p className="summary-overall-score__label">Overall Score</p>
                        </div>

                        {/* Performance badge */}
                        <div className="summary-perf-badge" style={{ borderColor: perf.color }}>
                            <span className="summary-perf-badge__icon">{perf.icon}</span>
                            <span className="summary-perf-badge__label" style={{ color: perf.color }}>
                                {evaluation?.performanceLabel}
                            </span>
                        </div>

                        {/* Stats */}
                        <div className="summary-stats">
                            <div className="summary-stat">
                                <span className="summary-stat__val">{evaluation?.answeredQuestions}</span>
                                <span className="summary-stat__lbl">of {evaluation?.totalQuestions} answered</span>
                            </div>
                            {durationMin !== null && (
                                <div className="summary-stat">
                                    <span className="summary-stat__val">{durationMin}m</span>
                                    <span className="summary-stat__lbl">total time</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="summary-body">
                {/* Overall AI Feedback */}
                <section className="summary-section">
                    <h2 className="summary-section__title">📋 Overall Assessment</h2>
                    <p className="summary-overall-feedback">{evaluation?.overallFeedback}</p>

                    <div className="summary-areas">
                        <div className="summary-area summary-area--strong">
                            <span className="summary-area__icon">⭐</span>
                            <div>
                                <p className="summary-area__label">Strongest Area</p>
                                <p className="summary-area__value">{evaluation?.strongestArea}</p>
                            </div>
                        </div>
                        <div className="summary-area summary-area--weak">
                            <span className="summary-area__icon">📌</span>
                            <div>
                                <p className="summary-area__label">Needs Work</p>
                                <p className="summary-area__value">{evaluation?.weakestArea}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Recommendations */}
                {evaluation?.recommendations?.length > 0 && (
                    <section className="summary-section">
                        <h2 className="summary-section__title">🚀 Recommendations</h2>
                        <ul className="summary-recommendations">
                            {evaluation.recommendations.map((rec, i) => (
                                <li key={i} className="summary-rec-item">
                                    <span className="summary-rec-item__num">{i + 1}</span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Per-question breakdown */}
                <section className="summary-section">
                    <h2 className="summary-section__title">📊 Question-by-Question Breakdown</h2>
                    <p className="summary-section__sub">Click any question to expand the full AI feedback</p>
                    <div className="summary-q-list">
                        {evaluation?.perQuestionScores?.map((result, i) => (
                            <QuestionResultCard key={i} result={result} index={i} />
                        ))}
                    </div>
                </section>

                {/* Actions */}
                <div className="summary-actions">
                    <button className="mock-btn mock-btn--primary" onClick={handleBack}>
                        Back to Strategy Report
                    </button>
                    <button className="mock-btn mock-btn--ghost" onClick={() => window.location.reload()}>
                        Retake Interview
                    </button>
                </div>
            </div>
        </div>
    )
}
