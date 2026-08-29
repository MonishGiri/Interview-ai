import React, { useState, useEffect, useRef } from 'react'
import '../style/interview.scss'
import '../style/interview.print.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useBookmarks } from '../hooks/useBookmarks.js'
import { generateShareLink, revokeShareLink, regenerateReportSection } from '../services/interview.api'
import { useNavigate, useParams } from 'react-router'
import Navbar from '../../../components/Navbar'
import LoadingScreen from '../../../components/LoadingScreen'

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
    { id: 'bookmarks', label: 'Bookmarks', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>) },
]

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index, questionType, submitAnswerForEvaluation, isBookmarked, onToggleBookmark, forceOpen = false }) => {
    const [open, setOpen] = useState(false)
    const [practiceMode, setPracticeMode] = useState(false)
    const [userAnswer, setUserAnswer] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [evaluating, setEvaluating] = useState(false)
    const [evaluation, setEvaluation] = useState(null)
    const [evalError, setEvalError] = useState(null)

    const recognitionRef = useRef(null)

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'en-US'

            recognition.onresult = (event) => {
                let currentTranscript = ''
                for (let i = 0; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript
                }
                setUserAnswer(currentTranscript)
            }

            recognition.onerror = (e) => {
                console.error("Speech recognition error:", e)
                setIsListening(false)
            }

            recognition.onend = () => {
                setIsListening(false)
            }

            recognitionRef.current = recognition
        }
    }, [])

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Voice recognition is not supported in your browser. Please type your answer.")
            return
        }

        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        } else {
            recognitionRef.current.start()
            setIsListening(true)
        }
    }

    const handleEvaluate = async () => {
        if (!userAnswer.trim()) return
        setEvaluating(true)
        setEvalError(null)
        try {
            const result = await submitAnswerForEvaluation({
                question: item.question,
                intention: item.intention,
                modelAnswer: item.answer,
                userAnswer,
                questionType
            })
            setEvaluation(result)
        } catch (err) {
            console.error("Evaluation error:", err)
            setEvalError("Failed to evaluate answer. Please try again.")
        } finally {
            setEvaluating(false)
        }
    }

    const isOpen = open || forceOpen

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                {item.difficulty && (
                    <span className={`q-card__difficulty diff--${item.difficulty}`}>{item.difficulty}</span>
                )}
                <p className='q-card__question'>{item.question}</p>
                <button
                    type="button"
                    className={`bookmark-btn ${isBookmarked ? 'bookmark-btn--active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onToggleBookmark?.() }}
                    title={isBookmarked ? 'Remove bookmark' : 'Bookmark this question'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                </button>
                <span className={`q-card__chevron ${isOpen ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {isOpen && (
                <div className='q-card__body animate-fade-down' style={{ animationDuration: '0.3s' }}>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>

                    {/* ── Mock Interview Practice Section ── */}
                    <div className='q-card__practice-toggle print-exclude'>
                        <button
                            type="button"
                            className={`practice-btn ${practiceMode ? 'practice-btn--active' : ''}`}
                            onClick={() => setPracticeMode(p => !p)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
                            {practiceMode ? 'Close Practice Mode' : 'Practice & AI Evaluation'}
                        </button>
                    </div>

                    {practiceMode && (
                        <div className='practice-drawer print-exclude animate-fade-down' style={{ animationDuration: '0.35s' }}>
                            <div className='practice-drawer__header'>
                                <h4>Practice Your Answer</h4>
                                <p>Record your voice or type your response to receive instant AI scoring and STAR breakdown.</p>
                            </div>

                            <div className='practice-drawer__input-group'>
                                <div className='voice-controls'>
                                    <button
                                        type="button"
                                        className={`mic-btn ${isListening ? 'mic-btn--recording' : ''}`}
                                        onClick={toggleListening}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
                                        {isListening ? 'Stop Recording...' : 'Record Voice Answer'}
                                    </button>
                                    {isListening && (
                                        <div className='recording-pulse-wrapper'>
                                            <span className='wave-dot'></span>
                                            <span className='wave-dot'></span>
                                            <span className='wave-dot'></span>
                                            <span className='recording-pulse-text'>Recording active</span>
                                        </div>
                                    )}
                                </div>

                                <textarea
                                    className='practice-textarea'
                                    placeholder='Your response will appear here as you speak, or you can type directly...'
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    rows={4}
                                />

                                <div className='practice-actions'>
                                    <button
                                        type="button"
                                        className='submit-eval-btn'
                                        disabled={evaluating || !userAnswer.trim()}
                                        onClick={handleEvaluate}
                                    >
                                        {evaluating ? (
                                            <>
                                                <span className="eval-spinner"></span>
                                                AI Evaluating...
                                            </>
                                        ) : 'Evaluate My Answer'}
                                    </button>
                                </div>
                            </div>

                            {evalError && <p className='eval-error'>{evalError}</p>}

                            {evaluation && (
                                <div className='eval-result animate-scale-in'>
                                    <div className='eval-result__header'>
                                        <div className={`eval-score-ring ${evaluation.score >= 8 ? 'score--high' : evaluation.score >= 6 ? 'score--mid' : 'score--low'}`}>
                                            <span className='eval-score-ring__val'>{evaluation.score}</span>
                                            <span className='eval-score-ring__max'>/10</span>
                                        </div>
                                        <div className='eval-result__meta'>
                                            <h5>AI Answer Score</h5>
                                            <p>{evaluation.feedback}</p>
                                        </div>
                                    </div>

                                    <div className='eval-result__grid'>
                                        <div className='eval-card eval-card--strengths'>
                                            <h6>Strengths</h6>
                                            <ul>
                                                {evaluation.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>

                                        <div className='eval-card eval-card--improvements'>
                                            <h6>Areas to Improve</h6>
                                            <ul>
                                                {evaluation.improvements?.map((imp, i) => <li key={i}>{imp}</li>)}
                                            </ul>
                                        </div>
                                    </div>

                                    {evaluation.starAnalysis && (
                                        <div className='star-breakdown'>
                                            <h6>STAR Technique Analysis</h6>
                                            <div className='star-grid'>
                                                <div><strong>Situation &amp; Task:</strong> {evaluation.starAnalysis.situationAndTask}</div>
                                                <div><strong>Action:</strong> {evaluation.starAnalysis.action}</div>
                                                <div><strong>Result:</strong> {evaluation.starAnalysis.result}</div>
                                            </div>
                                        </div>
                                    )}

                                    {evaluation.modelAnswerTip && (
                                        <div className='eval-tip'>
                                            <strong>Pro Tip:</strong> {evaluation.modelAnswerTip}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day, completedTasks, onToggleTask, interviewId }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day.tasks.map((task, i) => {
                const isCompleted = completedTasks?.some(t => t.day === day.day && t.taskIndex === i)
                return (
                    <li key={i} className={`task-item ${isCompleted ? 'task-item--completed' : ''}`} onClick={() => onToggleTask(interviewId, day.day, i)}>
                        <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={() => { }} // handled by row click
                            className='task-checkbox'
                        />
                        <span>{task}</span>
                    </li>
                )
            })}
        </ul>
    </div>
)

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [activeNav, setActiveNav] = useState('technical')
    const [difficultyFilter, setDifficultyFilter] = useState('all')
    const [shareState, setShareState] = useState({ loading: false, token: null, isShared: false, showModal: false })
    const [regenState, setRegenState] = useState({ section: null, loading: false })
    const [copiedLink, setCopiedLink] = useState(false)
    const [pdfState, setPdfState] = useState('idle')
    const [isPrinting, setIsPrinting] = useState(false)
    const { report, setReport, getReportById, loading, resumeLoading, getResumePdf, getReportPdf, toggleTask, submitAnswerForEvaluation } = useInterview()
    const { interviewId } = useParams()
    const { bookmarks, toggleBookmark, isBookmarked, totalBookmarks } = useBookmarks(interviewId)

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [interviewId])

    useEffect(() => {
        if (report) {
            setShareState(s => ({
                ...s,
                token: report.shareToken || null,
                isShared: !!report.isShared,
                url: report.shareToken ? `${window.location.origin}/shared/${report.shareToken}` : s.url
            }))
        }
    }, [report])

    useEffect(() => {
        const handleBeforePrint = () => setIsPrinting(true)
        const handleAfterPrint = () => setIsPrinting(false)

        window.addEventListener('beforeprint', handleBeforePrint)
        window.addEventListener('afterprint', handleAfterPrint)

        return () => {
            window.removeEventListener('beforeprint', handleBeforePrint)
            window.removeEventListener('afterprint', handleAfterPrint)
        }
    }, [])

    if (loading && !report) {
        return (
            <>
                <Navbar />
                <LoadingScreen useCase="interview_load" />
            </>
        )
    }

    if (!report) {
        return null
    }

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low'

    // Compute roadmap progress statistics
    const totalTasks = report.preparationPlan?.reduce((sum, d) => sum + (d.tasks?.length || 0), 0) || 0
    const completedCount = report.completedTasks?.length || 0
    const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

    const handleShare = async () => {
        if (shareState.isShared && shareState.token) {
            const url = `${window.location.origin}/shared/${shareState.token}`
            setShareState(s => ({ ...s, showModal: true, url }))
            return
        }
        setShareState(s => ({ ...s, loading: true }))
        const data = await generateShareLink(interviewId)
        if (data?.shareToken) {
            const url = `${window.location.origin}/shared/${data.shareToken}`
            setShareState({ loading: false, token: data.shareToken, isShared: true, showModal: true, url })
            setReport(r => r ? { ...r, shareToken: data.shareToken, isShared: true } : r)
        } else {
            setShareState(s => ({ ...s, loading: false }))
        }
    }

    const handleCopyLink = () => {
        if (shareState.url) {
            navigator.clipboard.writeText(shareState.url).catch(() => { })
            setCopiedLink(true)
            setTimeout(() => setCopiedLink(false), 2000)
        }
    }

    const handleExportPdf = async () => {
        setPdfState('generating')

        try {
            await getReportPdf(interviewId)
            setPdfState('downloaded')
        } catch (err) {
            console.error('PDF export error:', err)
            setPdfState('idle')
        }

        setTimeout(() => {
            setPdfState('idle')
        }, 2500)
    }

    const handleRevoke = async () => {
        await revokeShareLink(interviewId)
        setShareState({ loading: false, token: null, isShared: false, showModal: false, url: null })
        setReport(r => r ? { ...r, shareToken: null, isShared: false } : r)
    }

    const handleRegenerate = async (section) => {
        setRegenState({ section, loading: true })
        try {
            const data = await regenerateReportSection({ interviewId, section })
            if (data?.[section]) {
                setReport(prev => ({ ...prev, [section]: data[section] }))
            }
        } catch (e) {
            console.error(e)
        } finally {
            setRegenState({ section: null, loading: false })
        }
    }

    // ── Filter helpers ────────────────────────────────────────────────────────
    const filterQuestions = (questions) => {
        if (difficultyFilter === 'all') return questions
        return questions.filter(q => q.difficulty === difficultyFilter)
    }

    const visibleTechnical = filterQuestions(report.technicalQuestions || [])
    const visibleBehavioral = filterQuestions(report.behavioralQuestions || [])

    // Bookmarked questions
    const bookmarkedTechnical = (report.technicalQuestions || []).filter((_, i) => isBookmarked('technical', i))
    const bookmarkedBehavioral = (report.behavioralQuestions || []).filter((_, i) => isBookmarked('behavioral', i))

    const DIFFICULTY_FILTERS = ['all', 'easy', 'medium', 'hard']

    return (
        <div className='page-wrapper'>
            <Navbar />

            {/* Resume PDF generation overlay */}
            {resumeLoading && report && (
                <div className='resume-download-overlay animate-fade-in'>
                    <div className='resume-download-overlay__content animate-scale-in'>
                        <div className='spinner-outer'><div className='spinner-inner'></div></div>
                        <h3 className="ai-gradient-text">Generating Resume</h3>
                        <p>Optimizing layout and embedding clickable links...</p>
                    </div>
                </div>
            )}

            {/* Share modal */}
            {shareState.showModal && (
                <div className='share-modal-overlay animate-fade-in' onClick={() => setShareState(s => ({ ...s, showModal: false }))}>
                    <div className='share-modal animate-scale-in' onClick={e => e.stopPropagation()}>
                        <div className='share-modal__header'>
                            <h3>Share This Report</h3>
                            <button type="button" className='share-modal__close' onClick={() => setShareState(s => ({ ...s, showModal: false }))} title="Close">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <p className='share-modal__sub'>Anyone with this link can view a read-only version of your report.</p>
                        <div className='share-modal__url-row'>
                            <input type="text" readOnly value={shareState.url || ''} className='share-modal__url-input' onClick={e => e.target.select()} />
                            <button type="button" className={`share-modal__copy-btn ${copiedLink ? 'share-modal__copy-btn--copied' : ''}`} onClick={handleCopyLink}>
                                {copiedLink ? '✓ Copied' : 'Copy Link'}
                            </button>
                        </div>
                        <button type="button" className='share-modal__revoke-btn' onClick={handleRevoke}>
                            Revoke Link
                        </button>
                    </div>
                </div>
            )}

            <div className='interview-page'>
                <div className='interview-layout animate-fade-up'>

                    {/* ── Match Score & Skill Gaps (Top on Mobile, Right Sidebar on Desktop) ── */}
                    <aside className='interview-sidebar'>
                        <div className='match-score'>
                            <p className='match-score__label'>Match Score</p>
                            <div className={`match-score__ring ${scoreColor}`}>
                                <span className='match-score__value'>{report.matchScore}</span>
                                <span className='match-score__pct'>%</span>
                            </div>
                            <p className='match-score__sub'>Strong match for this role</p>
                        </div>

                        <div className='sidebar-divider' />

                        <div className='skill-gaps'>
                            <p className='skill-gaps__label'>Skill Gaps</p>
                            <div className='skill-gaps__list'>
                                {report.skillGaps.map((gap, i) => (
                                    <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                        {gap.skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* ── Left Nav / Section Tabs (2nd on Mobile, Top Left on Desktop) ── */}
                    <nav className='interview-nav'>
                        <div className="nav-content">
                            <p className='interview-nav__label'>Sections</p>
                            {NAV_ITEMS.map(item => {
                                const showBadge = item.id === 'bookmarks' && totalBookmarks > 0
                                return (
                                    <button
                                        key={item.id}
                                        className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                        onClick={() => setActiveNav(item.id)}
                                    >
                                        <span className='interview-nav__icon'>{item.icon}</span>
                                        {item.label}
                                        {showBadge && <span className='bookmark-badge'>{totalBookmarks}</span>}
                                    </button>
                                )
                            })}
                        </div>
                    </nav>

                    {/* ── Center Content (3rd on Mobile, Center Column on Desktop) ── */}
                    <main className='interview-content'>

                        {/* Document Header for Print Output */}
                        {isPrinting && (
                            <div className="print-document-header">
                                <h1>{report.title || 'Interview Strategy Report'}</h1>
                                <p>Generated by InterviewAI • Match Score: {report.matchScore}%</p>
                            </div>
                        )}

                        {/* In Print Mode, render ALL sections sequentially */}
                        {isPrinting ? (
                            <>
                                {/* 1. Technical Questions */}
                                <section className="print-section">
                                    <div className='content-header'>
                                        <h2>Technical Questions</h2>
                                        <span className='content-header__count'>{report.technicalQuestions?.length || 0} questions</span>
                                    </div>
                                    <div className='q-list'>
                                        {report.technicalQuestions?.map((q, i) => (
                                            <QuestionCard
                                                key={i}
                                                item={q}
                                                index={i}
                                                questionType="Technical"
                                                forceOpen={true}
                                                isBookmarked={isBookmarked('technical', i)}
                                            />
                                        ))}
                                    </div>
                                </section>

                                {/* 2. Behavioral Questions */}
                                <section className="print-section">
                                    <div className='content-header'>
                                        <h2>Behavioral Questions</h2>
                                        <span className='content-header__count'>{report.behavioralQuestions?.length || 0} questions</span>
                                    </div>
                                    <div className='q-list'>
                                        {report.behavioralQuestions?.map((q, i) => (
                                            <QuestionCard
                                                key={i}
                                                item={q}
                                                index={i}
                                                questionType="Behavioral"
                                                forceOpen={true}
                                                isBookmarked={isBookmarked('behavioral', i)}
                                            />
                                        ))}
                                    </div>
                                </section>

                                {/* 3. Preparation Road Map */}
                                <section className="print-section">
                                    <div className='content-header'>
                                        <h2>Preparation Road Map</h2>
                                        <span className='content-header__count'>{report.preparationPlan?.length || 0}-day plan</span>
                                    </div>
                                    <div className='roadmap-progress'>
                                        <div className='roadmap-progress__info'>
                                            <span>Preparation Readiness</span>
                                            <span>{completedCount} / {totalTasks} Tasks Completed ({progressPct}%)</span>
                                        </div>
                                        <div className='roadmap-progress__bar'>
                                            <div className='roadmap-progress__fill' style={{ width: `${progressPct}%` }} />
                                        </div>
                                    </div>
                                    <div className='roadmap-list'>
                                        {report.preparationPlan?.map((day) => (
                                            <RoadMapDay
                                                key={day.day}
                                                day={day}
                                                completedTasks={report.completedTasks}
                                                onToggleTask={() => { }}
                                                interviewId={interviewId}
                                            />
                                        ))}
                                    </div>
                                </section>

                                {/* 4. Bookmarked Questions */}
                                {totalBookmarks > 0 && (
                                    <section className="print-section">
                                        <div className='content-header'>
                                            <h2>Bookmarked Questions</h2>
                                            <span className='content-header__count'>{totalBookmarks} saved</span>
                                        </div>
                                        {bookmarkedTechnical.length > 0 && (
                                            <div className='bookmark-group'>
                                                <p className='bookmark-group__label'>Technical</p>
                                                <div className='q-list'>
                                                    {bookmarkedTechnical.map((q, i) => (
                                                        <QuestionCard key={i} item={q} index={i} questionType="Technical" forceOpen={true} isBookmarked={true} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {bookmarkedBehavioral.length > 0 && (
                                            <div className='bookmark-group'>
                                                <p className='bookmark-group__label'>Behavioral</p>
                                                <div className='q-list'>
                                                    {bookmarkedBehavioral.map((q, i) => (
                                                        <QuestionCard key={i} item={q} index={i} questionType="Behavioral" forceOpen={true} isBookmarked={true} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                )}
                            </>
                        ) : (
                            /* In Interactive Mode, render active tab section */
                            <>
                                {/* Difficulty filter — shown for question sections */}
                                {(activeNav === 'technical' || activeNav === 'behavioral') && (
                                    <div className='difficulty-filter'>
                                        <span className="difficulty-filter__label">Difficulty:</span>
                                        <div className="difficulty-filter__pills">
                                            {DIFFICULTY_FILTERS.map(level => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    className={`diff-filter-btn ${difficultyFilter === level ? 'diff-filter-btn--active' : ''} diff-filter-btn--${level}`}
                                                    onClick={() => setDifficultyFilter(level)}
                                                    aria-pressed={difficultyFilter === level}
                                                >
                                                    <span className={`diff-dot diff-dot--${level}`} />
                                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── Technical Questions ── */}
                                {activeNav === 'technical' && (
                                    <section>
                                        <div className='content-header'>
                                            <h2>Technical Questions</h2>
                                            <div className='content-header__right'>
                                                <span className='content-header__count'>{visibleTechnical.length} / {report.technicalQuestions.length} questions</span>
                                                <button
                                                    type="button"
                                                    className={`regen-btn print-exclude ${regenState.section === 'technicalQuestions' ? 'regen-btn--loading' : ''}`}
                                                    onClick={() => handleRegenerate('technicalQuestions')}
                                                    disabled={regenState.loading}
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                                                    {regenState.section === 'technicalQuestions' ? 'Regenerating...' : 'Regenerate'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className='q-list'>
                                            {visibleTechnical.map((q, i) => (
                                                <QuestionCard
                                                    key={i}
                                                    item={q}
                                                    index={i}
                                                    questionType="Technical"
                                                    submitAnswerForEvaluation={submitAnswerForEvaluation}
                                                    isBookmarked={isBookmarked('technical', i)}
                                                    onToggleBookmark={() => toggleBookmark('technical', i)}
                                                />
                                            ))}
                                            {visibleTechnical.length === 0 && (
                                                <div className='empty-filter-msg'>No {difficultyFilter} questions found for technical section.</div>
                                            )}
                                        </div>
                                    </section>
                                )}

                                {/* ── Behavioral Questions ── */}
                                {activeNav === 'behavioral' && (
                                    <section>
                                        <div className='content-header'>
                                            <h2>Behavioral Questions</h2>
                                            <div className='content-header__right'>
                                                <span className='content-header__count'>{visibleBehavioral.length} / {report.behavioralQuestions.length} questions</span>
                                                <button
                                                    type="button"
                                                    className={`regen-btn print-exclude ${regenState.section === 'behavioralQuestions' ? 'regen-btn--loading' : ''}`}
                                                    onClick={() => handleRegenerate('behavioralQuestions')}
                                                    disabled={regenState.loading}
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                                                    {regenState.section === 'behavioralQuestions' ? 'Regenerating...' : 'Regenerate'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className='q-list'>
                                            {visibleBehavioral.map((q, i) => (
                                                <QuestionCard
                                                    key={i}
                                                    item={q}
                                                    index={i}
                                                    questionType="Behavioral"
                                                    submitAnswerForEvaluation={submitAnswerForEvaluation}
                                                    isBookmarked={isBookmarked('behavioral', i)}
                                                    onToggleBookmark={() => toggleBookmark('behavioral', i)}
                                                />
                                            ))}
                                            {visibleBehavioral.length === 0 && (
                                                <div className='empty-filter-msg'>No {difficultyFilter} questions found for behavioral section.</div>
                                            )}
                                        </div>
                                    </section>
                                )}

                                {/* ── Roadmap ── */}
                                {activeNav === 'roadmap' && (
                                    <section>
                                        <div className='content-header'>
                                            <h2>Preparation Road Map</h2>
                                            <div className='content-header__right'>
                                                <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                                                <button
                                                    type="button"
                                                    className={`regen-btn print-exclude ${regenState.section === 'preparationPlan' ? 'regen-btn--loading' : ''}`}
                                                    onClick={() => handleRegenerate('preparationPlan')}
                                                    disabled={regenState.loading}
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                                                    {regenState.section === 'preparationPlan' ? 'Regenerating...' : 'Regenerate'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className='roadmap-progress'>
                                            <div className='roadmap-progress__info'>
                                                <span>Preparation Readiness</span>
                                                <span>{completedCount} / {totalTasks} Tasks Completed ({progressPct}%)</span>
                                            </div>
                                            <div className='roadmap-progress__bar'>
                                                <div className='roadmap-progress__fill' style={{ width: `${progressPct}%` }} />
                                            </div>
                                        </div>
                                        <div className='roadmap-list'>
                                            {report.preparationPlan.map((day) => (
                                                <RoadMapDay
                                                    key={day.day}
                                                    day={day}
                                                    completedTasks={report.completedTasks}
                                                    onToggleTask={toggleTask}
                                                    interviewId={interviewId}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* ── Bookmarks ── */}
                                {activeNav === 'bookmarks' && (
                                    <section>
                                        <div className='content-header'>
                                            <h2>Bookmarked Questions</h2>
                                            <span className='content-header__count'>{totalBookmarks} saved</span>
                                        </div>
                                        {totalBookmarks === 0 ? (
                                            <div className='empty-filter-msg'>
                                                No bookmarks yet. Click the ★ icon on any question to save it here.
                                            </div>
                                        ) : (
                                            <>
                                                {bookmarkedTechnical.length > 0 && (
                                                    <div className='bookmark-group'>
                                                        <p className='bookmark-group__label'>Technical</p>
                                                        <div className='q-list'>
                                                            {bookmarkedTechnical.map((q, i) => (
                                                                <QuestionCard key={i} item={q} index={i} questionType="Technical" submitAnswerForEvaluation={submitAnswerForEvaluation} isBookmarked={true} onToggleBookmark={() => toggleBookmark('technical', (report.technicalQuestions || []).indexOf(q))} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {bookmarkedBehavioral.length > 0 && (
                                                    <div className='bookmark-group'>
                                                        <p className='bookmark-group__label'>Behavioral</p>
                                                        <div className='q-list'>
                                                            {bookmarkedBehavioral.map((q, i) => (
                                                                <QuestionCard key={i} item={q} index={i} questionType="Behavioral" submitAnswerForEvaluation={submitAnswerForEvaluation} isBookmarked={true} onToggleBookmark={() => toggleBookmark('behavioral', (report.behavioralQuestions || []).indexOf(q))} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </section>
                                )}
                            </>
                        )}
                    </main>

                    {/* ── Action Buttons (Bottom on Mobile, Left Bottom on Desktop) ── */}
                    <div className='interview-nav__actions print-exclude'>
                        <button
                            type="button"
                            className={`nav-action-btn ${shareState.isShared ? 'nav-action-btn--shared' : ''}`}
                            onClick={handleShare}
                            disabled={shareState.loading}
                            title="Share report via public link"
                        >
                            {shareState.loading ? (
                                <>
                                    <span className="btn-spinner" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                                    {shareState.isShared ? 'Share Report ✓' : 'Share Report'}
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className={`nav-action-btn ${pdfState === 'generating' ? 'nav-action-btn--loading' : ''}`}
                            onClick={handleExportPdf}
                            disabled={pdfState === 'generating'}
                            title="Export Strategy Report as PDF"
                        >
                            {pdfState === 'generating' ? (
                                <>
                                    <span className="btn-spinner" />
                                    Generating PDF...
                                </>
                            ) : pdfState === 'downloaded' ? (
                                <>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                    PDF Exported ✓
                                </>
                            ) : (
                                <>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                                    Export PDF
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => { getResumePdf(interviewId) }}
                            className='button primary-button print-exclude'>
                            <svg height={"0.8rem"} style={{ marginRight: "0.5rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                            Download Resume
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Interview