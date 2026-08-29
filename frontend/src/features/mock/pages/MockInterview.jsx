import React, { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { useMockSession } from '../hooks/useMockSession'
import { useSocket } from '../hooks/useSocket'
import MockSessionSummary from './MockSessionSummary'
import '../style/mock-interview.scss'

// ── Helpers ──────────────────────────────────────────────────────────────────
const DIFFICULTY_COLOR = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }
const TIMER_WARN_PCT = 0.30 // yellow below 30%
const TIMER_DANGER_PCT = 0.15 // red below 15%

function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

function CircularTimer({ timeLeft, total }) {
    const radius = 36
    const circumference = 2 * Math.PI * radius
    const pct = total > 0 ? timeLeft / total : 1
    const offset = circumference * (1 - pct)
    const color = pct <= TIMER_DANGER_PCT ? '#ef4444' : pct <= TIMER_WARN_PCT ? '#f59e0b' : '#10b981'

    return (
        <div className="mock-timer-ring">
            <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="6" />
                <circle
                    cx="45" cy="45" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 45 45)"
                    style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
                />
            </svg>
            <span className="mock-timer-ring__text" style={{ color }}>
                {formatTime(timeLeft)}
            </span>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MockInterview() {
    const { interviewId } = useParams()
    const navigate = useNavigate()

    const [userAnswer, setUserAnswer] = useState('')
    const baseTextRef = useRef('')
    const textareaRef = useRef(null)

    const {
        phase, session, currentQuestion, currentIndex, totalQuestions, isLastQuestion,
        timeLeft, evalProgress, finalSession, error, startSession, handleSubmitAnswer,
        handleSocketProgress, handleSocketDone,
    } = useMockSession(interviewId)

    // Speech recognition
    const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition()

    useEffect(() => {
        if (listening) {
            const combined = (baseTextRef.current + transcript).replace(/\s+/g, ' ').trim()
            setUserAnswer(combined)
        }
    }, [transcript, listening])

    // Reset answer when question changes
    useEffect(() => {
        setUserAnswer('')
        baseTextRef.current = ''
        resetTranscript()
        if (listening) SpeechRecognition.stopListening()
        textareaRef.current?.focus()
    }, [currentIndex])

    // Socket.IO — watch evaluation progress
    useSocket({
        sessionId: session?._id,
        onProgress: handleSocketProgress,
        onDone: handleSocketDone,
        onError: () => {},
    })

    const toggleListening = () => {
        if (!browserSupportsSpeechRecognition) {
            alert('Voice recognition is not supported in your browser.')
            return
        }
        if (listening) {
            SpeechRecognition.stopListening()
        } else {
            baseTextRef.current = userAnswer ? (userAnswer.trim() + ' ') : ''
            resetTranscript()
            SpeechRecognition.startListening({ continuous: true, language: 'en-US' })
        }
    }

    const onSubmit = () => {
        if (listening) SpeechRecognition.stopListening()
        handleSubmitAnswer(userAnswer, false)
        setUserAnswer('')
    }

    // ── Render: Idle / Start Screen ────────────────────────────────────────
    if (phase === 'idle') {
        return (
            <div className="mock-page mock-page--start">
                <div className="mock-start-card">
                    <div className="mock-start-card__icon">🎯</div>
                    <h1 className="mock-start-card__title">Live Mock Interview</h1>
                    <p className="mock-start-card__desc">
                        You'll be presented with randomized questions from your interview report.
                        Answer each one within the time limit. Your responses will be scored by AI
                        and a full performance report will be generated at the end.
                    </p>
                    <ul className="mock-start-card__rules">
                        <li><span>⏱</span> Timer varies by difficulty — Easy 1:30 · Medium 2:30 · Hard 3:30</li>
                        <li><span>🎙</span> You can type or use voice to answer</li>
                        <li><span>📊</span> AI scores your answers on Relevance, Depth & Clarity</li>
                        <li><span>💾</span> Results are saved to your account</li>
                    </ul>
                    <div className="mock-start-card__actions">
                        <button className="mock-btn mock-btn--primary" onClick={startSession}>
                            Start Interview
                        </button>
                        <button className="mock-btn mock-btn--ghost" onClick={() => navigate(-1)}>
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ── Render: Loading ────────────────────────────────────────────────────
    if (phase === 'loading') {
        return (
            <div className="mock-page mock-page--loading">
                <div className="mock-loader">
                    <div className="mock-loader__spinner" />
                    <p>Preparing your interview session...</p>
                </div>
            </div>
        )
    }

    // ── Render: Error ──────────────────────────────────────────────────────
    if (phase === 'error') {
        return (
            <div className="mock-page mock-page--error">
                <div className="mock-error-card">
                    <div className="mock-error-card__icon">⚠️</div>
                    <h2>Something went wrong</h2>
                    <p>{error}</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button className="mock-btn mock-btn--primary" onClick={startSession}>Retry</button>
                        <button className="mock-btn mock-btn--ghost" onClick={() => navigate(-1)}>Back to Report</button>
                    </div>
                </div>
            </div>
        )
    }

    // ── Render: Submitting / Evaluating ────────────────────────────────────
    if (phase === 'submitting' || phase === 'evaluating') {
        const progressPct = evalProgress.total > 0
            ? Math.round((evalProgress.step / evalProgress.total) * 100)
            : 0

        return (
            <div className="mock-page mock-page--evaluating">
                <div className="mock-eval-overlay">
                    <div className="mock-eval-overlay__brain">🧠</div>
                    <h2 className="mock-eval-overlay__title">Evaluating Your Performance</h2>
                    <p className="mock-eval-overlay__message">
                        {evalProgress.message || 'Sending your answers to AI...'}
                    </p>
                    <div className="mock-eval-progress">
                        <div className="mock-eval-progress__bar">
                            <div
                                className="mock-eval-progress__fill"
                                style={{ width: `${Math.max(10, progressPct)}%` }}
                            />
                        </div>
                        {evalProgress.total > 0 && (
                            <span className="mock-eval-progress__label">
                                {evalProgress.step} / {evalProgress.total} questions scored
                            </span>
                        )}
                    </div>
                    <p className="mock-eval-overlay__sub">This usually takes 10–20 seconds</p>
                </div>
            </div>
        )
    }

    // ── Render: Complete → Show Summary ────────────────────────────────────
    if (phase === 'complete') {
        if (finalSession) {
            return <MockSessionSummary session={finalSession} onBack={() => navigate(`/interview/${interviewId}`)} />
        }
        return (
            <div className="mock-page mock-page--loading">
                <div className="mock-loader">
                    <div className="mock-loader__spinner" />
                    <p>Loading summary report...</p>
                </div>
            </div>
        )
    }

    // ── Render: Answering ─────────────────────────────────────────────────
    if (!currentQuestion) {
        return (
            <div className="mock-page mock-page--loading">
                <div className="mock-loader">
                    <div className="mock-loader__spinner" />
                    <p>Preparing question...</p>
                </div>
            </div>
        )
    }

    const diffColor = DIFFICULTY_COLOR[currentQuestion.difficulty] || '#64748b'
    const timerWarning = currentQuestion.timeLimit > 0 && timeLeft / currentQuestion.timeLimit <= TIMER_WARN_PCT
    const timerDanger = currentQuestion.timeLimit > 0 && timeLeft / currentQuestion.timeLimit <= TIMER_DANGER_PCT

    return (
        <div className="mock-page mock-page--interview">
            {/* Header bar */}
            <header className="mock-header">
                <div className="mock-header__brand">
                    <span className="mock-header__logo">🎯</span>
                    <span className="mock-header__label">Mock Interview</span>
                </div>
                <div className="mock-header__progress">
                    <div className="mock-progress-dots">
                        {session.questions.map((_, i) => (
                            <div
                                key={i}
                                className={`mock-progress-dot ${i < currentIndex ? 'answered' : i === currentIndex ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                    <span className="mock-header__count">
                        Q{currentIndex + 1} <span className="mock-header__count-total">/ {totalQuestions}</span>
                    </span>
                </div>
                <button className="mock-btn mock-btn--ghost mock-btn--sm" onClick={() => navigate(-1)}>
                    Exit
                </button>
            </header>

            {/* Main interview area */}
            <main className="mock-main">
                {/* Question card */}
                <div className="mock-question-card">
                    <div className="mock-question-card__meta">
                        <span
                            className="mock-question-card__type"
                            style={{ color: currentQuestion.questionType === 'technical' ? '#818cf8' : '#34d399' }}
                        >
                            {currentQuestion.questionType === 'technical' ? '⚙️ Technical' : '🤝 Behavioral'}
                        </span>
                        <span className="mock-question-card__difficulty" style={{ color: diffColor, borderColor: diffColor }}>
                            {currentQuestion.difficulty}
                        </span>
                    </div>

                    <p className="mock-question-card__question">{currentQuestion.question}</p>

                    <div className="mock-question-card__timer-row">
                        <CircularTimer timeLeft={timeLeft} total={currentQuestion.timeLimit} />
                        {timerDanger && (
                            <div className="mock-timer-warning mock-timer-warning--danger">⚠️ Time almost up!</div>
                        )}
                        {timerWarning && !timerDanger && (
                            <div className="mock-timer-warning">🕐 Running low on time</div>
                        )}
                    </div>
                </div>

                {/* Answer area */}
                <div className="mock-answer-area">
                    <div className="mock-answer-area__header">
                        <label className="mock-answer-area__label">Your Answer</label>
                        <button
                            type="button"
                            className={`mock-mic-btn ${listening ? 'mock-mic-btn--recording' : ''}`}
                            onClick={toggleListening}
                            title={listening ? 'Stop recording' : 'Record voice answer'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            </svg>
                            {listening ? 'Stop' : 'Voice'}
                        </button>
                    </div>

                    {listening && (
                        <div className="mock-recording-indicator">
                            <span className="mock-wave-dot" />
                            <span className="mock-wave-dot" />
                            <span className="mock-wave-dot" />
                            <span className="mock-recording-label">Recording...</span>
                        </div>
                    )}

                    <textarea
                        ref={textareaRef}
                        className="mock-textarea"
                        value={userAnswer}
                        onChange={e => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here, or click 'Voice' to speak..."
                        rows={6}
                    />

                    <div className="mock-answer-actions">
                        <div className="mock-answer-char-count">
                            {userAnswer.length > 0 && `${userAnswer.length} characters`}
                        </div>
                        <button
                            className="mock-btn mock-btn--primary mock-btn--lg"
                            onClick={onSubmit}
                        >
                            {isLastQuestion ? 'Submit & Get Report' : 'Next Question →'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}
