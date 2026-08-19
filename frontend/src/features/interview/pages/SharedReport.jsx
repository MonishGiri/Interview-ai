import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { getSharedReport } from '../services/interview.api'
import LoadingScreen from '../../../components/LoadingScreen'
import '../style/SharedReport.scss'

const SharedReport = () => {
    const { shareToken } = useParams()
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeNav, setActiveNav] = useState('technical')

    useEffect(() => {
        const fetch = async () => {
            const data = await getSharedReport(shareToken)
            if (data?.interviewReport) {
                setReport(data.interviewReport)
            } else {
                setError('This shared link is no longer valid or has been revoked.')
            }
            setLoading(false)
        }
        fetch()
    }, [shareToken])

    if (loading) return <LoadingScreen useCase="interview_load" message="Loading Shared Report" subtitle="Fetching the strategy..." />

    if (error) {
        return (
            <div className="shared-error-page">
                <div className="shared-error-card animate-scale-in">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <h1>Link Unavailable</h1>
                    <p>{error}</p>
                    <Link to="/" className="shared-home-btn">Go to InterviewAI</Link>
                </div>
            </div>
        )
    }

    const scoreColor = report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'

    const NAV_ITEMS = [
        { id: 'technical', label: 'Technical Questions' },
        { id: 'behavioral', label: 'Behavioral Questions' },
        { id: 'roadmap', label: 'Preparation Roadmap' },
    ]

    return (
        <div className="shared-page">
            {/* Header Banner */}
            <div className="shared-header animate-fade-down">
                <div className="shared-header__brand">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                    InterviewAI
                </div>
                <div className="shared-header__info">
                    <span className="shared-badge">Shared Report</span>
                    <h1>{report.title}</h1>
                    <p>This is a read-only view. <Link to="/">Create your own strategy →</Link></p>
                </div>
                <div className={`shared-score ${scoreColor}`}>
                    <span className="shared-score__val">{report.matchScore}</span>
                    <span className="shared-score__label">Match %</span>
                </div>
            </div>

            <div className="shared-layout animate-fade-up">
                {/* Sidebar Nav */}
                <nav className="shared-nav">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            className={`shared-nav__item ${activeNav === item.id ? 'shared-nav__item--active' : ''}`}
                            onClick={() => setActiveNav(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}

                    {/* Skill Gaps */}
                    <div className="shared-skill-gaps">
                        <p className="shared-skill-gaps__label">Skill Gaps</p>
                        <div className="shared-skill-gaps__list">
                            {report.skillGaps?.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>{gap.skill}</span>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* Content */}
                <main className="shared-content">
                    {(activeNav === 'technical' || activeNav === 'behavioral') && (() => {
                        const questions = activeNav === 'technical' ? report.technicalQuestions : report.behavioralQuestions
                        const title = activeNav === 'technical' ? 'Technical Questions' : 'Behavioral Questions'
                        return (
                            <section>
                                <div className="shared-section-header">
                                    <h2>{title}</h2>
                                    <span className="shared-count">{questions?.length} questions</span>
                                </div>
                                <div className="shared-q-list">
                                    {questions?.map((q, i) => (
                                        <SharedQuestionCard key={i} item={q} index={i} />
                                    ))}
                                </div>
                            </section>
                        )
                    })()}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className="shared-section-header">
                                <h2>Preparation Roadmap</h2>
                                <span className="shared-count">{report.preparationPlan?.length}-day plan</span>
                            </div>
                            <div className="shared-roadmap-list">
                                {report.preparationPlan?.map(day => (
                                    <div key={day.day} className="shared-roadmap-day">
                                        <div className="shared-roadmap-day__header">
                                            <span className="shared-roadmap-day__badge">Day {day.day}</span>
                                            <h3>{day.focus}</h3>
                                        </div>
                                        <ul>
                                            {day.tasks?.map((task, i) => (
                                                <li key={i}>{task}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </main>
            </div>

            <footer className="shared-footer">
                <p>Powered by <Link to="/">InterviewAI</Link> — Create your own personalized interview strategy for free.</p>
            </footer>
        </div>
    )
}

const SharedQuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false)

    const difficultyClass = item.difficulty === 'hard' ? 'diff--hard' : item.difficulty === 'easy' ? 'diff--easy' : 'diff--medium'

    return (
        <div className="shared-q-card">
            <div className="shared-q-card__header" onClick={() => setOpen(o => !o)}>
                <span className="shared-q-card__index">Q{index + 1}</span>
                {item.difficulty && <span className={`shared-q-diff ${difficultyClass}`}>{item.difficulty}</span>}
                <p className="shared-q-card__question">{item.question}</p>
                <span className={`shared-q-card__chevron ${open ? 'open' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className="shared-q-card__body animate-fade-down">
                    <div className="shared-q-section">
                        <span className="shared-q-tag shared-q-tag--intention">Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className="shared-q-section">
                        <span className="shared-q-tag shared-q-tag--answer">Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SharedReport
