import React, { useState, useEffect, useRef } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useParams } from 'react-router'
import Navbar from '../../../components/Navbar'
import LoadingScreen from '../../../components/LoadingScreen'

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
]

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index, questionType, submitAnswerForEvaluation }) => {
    const [ open, setOpen ] = useState(false)
    const [ practiceMode, setPracticeMode ] = useState(false)
    const [ userAnswer, setUserAnswer ] = useState('')
    const [ isListening, setIsListening ] = useState(false)
    const [ evaluating, setEvaluating ] = useState(false)
    const [ evaluation, setEvaluation ] = useState(null)
    const [ evalError, setEvalError ] = useState(null)

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
                    currentTranscript += event.results[ i ][ 0 ].transcript
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

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>

                    {/* ── Mock Interview Practice Section ── */}
                    <div className='q-card__practice-toggle'>
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
                        <div className='practice-drawer'>
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
                                    {isListening && <span className='recording-pulse'>&bull; Recording active</span>}
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
                                        {evaluating ? 'AI Evaluating...' : 'Evaluate My Answer'}
                                    </button>
                                </div>
                            </div>

                            {evalError && <p className='eval-error'>{evalError}</p>}

                            {evaluation && (
                                <div className='eval-result'>
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

const RoadMapDay = ({ day, completedTasks, onToggleTask }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day.tasks.map((task, i) => {
                const isCompleted = completedTasks?.some(t => t.day === day.day && t.taskIndex === i)
                return (
                    <li key={i} className={`task-item ${isCompleted ? 'task-item--completed' : ''}`} onClick={() => onToggleTask(day.day, i)}>
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
    const [ activeNav, setActiveNav ] = useState('technical')
    const { report, getReportById, loading, getResumePdf, toggleTask, submitAnswerForEvaluation } = useInterview()
    const { interviewId } = useParams()

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [ interviewId ])

    if (loading || !report) {
        return (
            <>
                <Navbar />
                <LoadingScreen useCase="interview_load" />
            </>
        )
    }

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low'

    // Compute roadmap progress statistics
    const totalTasks = report.preparationPlan?.reduce((sum, d) => sum + (d.tasks?.length || 0), 0) || 0
    const completedCount = report.completedTasks?.length || 0
    const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

    return (
        <div className='page-wrapper'>
            <Navbar />
            <div className='interview-page'>
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => { getResumePdf(interviewId) }}
                        className='button primary-button' >
                        <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                        Download Resume
                    </button>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions.map((q, i) => (
                                    <QuestionCard
                                        key={i}
                                        item={q}
                                        index={i}
                                        questionType="Technical"
                                        submitAnswerForEvaluation={submitAnswerForEvaluation}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions.map((q, i) => (
                                    <QuestionCard
                                        key={i}
                                        item={q}
                                        index={i}
                                        questionType="Behavioral"
                                        submitAnswerForEvaluation={submitAnswerForEvaluation}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                            </div>

                            {/* Dynamic Roadmap Progress Bar */}
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
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>Strong match for this role</p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
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
            </div>
        </div>
        </div>
    )
}

export default Interview