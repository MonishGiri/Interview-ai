import { useState, useEffect, useRef, useCallback } from 'react'
import { createMockSessionApi, submitMockSessionApi } from '../services/mock.api'

/**
 * useMockSession — orchestrates the full mock interview state machine.
 *
 * Session phases:
 *   'idle'        — not started yet
 *   'loading'     — creating session from API
 *   'answering'   — user answering a question (timer running)
 *   'submitting'  — all answers submitted, waiting for AI
 *   'evaluating'  — AI evaluation in progress (socket events)
 *   'complete'    — evaluation done, summary ready
 *   'error'       — something went wrong
 */
export function useMockSession(interviewId) {
    const [phase, setPhase] = useState('idle')
    const [session, setSession] = useState(null)       // { _id, questions, jobTitle }
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState([])          // accumulated answers
    const [timeLeft, setTimeLeft] = useState(0)
    const [evalProgress, setEvalProgress] = useState({ step: 0, total: 0, message: '' })
    const [finalSession, setFinalSession] = useState(null) // completed session from API
    const [error, setError] = useState(null)

    const timerRef = useRef(null)
    const startTimeRef = useRef(null) // when current question started

    // ── Current question ────────────────────────────────────────────────────
    const currentQuestion = session?.questions?.[currentIndex] ?? null
    const totalQuestions = session?.questions?.length ?? 0
    const isLastQuestion = currentIndex >= totalQuestions - 1

    // ── Start session ───────────────────────────────────────────────────────
    const startSession = useCallback(async () => {
        setPhase('loading')
        setError(null)
        try {
            const data = await createMockSessionApi(interviewId)
            setSession(data.session)
            setAnswers([])
            setCurrentIndex(0)
            setPhase('answering')
            startTimeRef.current = Date.now()
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to start session.')
            setPhase('error')
        }
    }, [interviewId])

    // ── Timer ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'answering' || !currentQuestion) return

        setTimeLeft(currentQuestion.timeLimit)
        startTimeRef.current = Date.now()

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current)
                    // Auto-submit current answer when timer runs out
                    handleSubmitAnswer('', true)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timerRef.current)
    }, [currentIndex, phase, currentQuestion?.timeLimit])

    // ── Submit all answers to backend ───────────────────────────────────────
    const triggerFinalSubmit = useCallback(async (allAnswers, sessionId) => {
        setPhase('submitting')
        try {
            const data = await submitMockSessionApi(sessionId, allAnswers)
            setFinalSession(data.session)
            setPhase('complete')
        } catch (err) {
            setError(err?.response?.data?.message || 'Evaluation failed. Please try again.')
            setPhase('error')
        }
    }, [])

    // ── Submit single answer and advance ───────────────────────────────────
    const handleSubmitAnswer = useCallback((userAnswer, autoSubmitted = false) => {
        if (!currentQuestion || !session?._id) return

        clearInterval(timerRef.current)

        const timeTaken = Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000)

        const answer = {
            questionId: currentQuestion._id,
            question: currentQuestion.question,
            questionType: currentQuestion.questionType,
            difficulty: currentQuestion.difficulty,
            userAnswer: (userAnswer || '').trim(),
            timeTaken,
            autoSubmitted,
        }

        const nextIndex = currentIndex + 1
        const updatedAnswers = [...answers, answer]
        setAnswers(updatedAnswers)

        // If last question, trigger final submission
        if (currentIndex >= totalQuestions - 1) {
            triggerFinalSubmit(updatedAnswers, session._id)
        } else {
            setCurrentIndex(nextIndex)
        }
    }, [currentQuestion, currentIndex, totalQuestions, session, answers, triggerFinalSubmit])

    // ── Socket progress handler (called from MockInterview via useSocket) ──
    const handleSocketProgress = useCallback((data) => {
        setPhase('evaluating')
        setEvalProgress(data)
    }, [])

    const handleSocketDone = useCallback(() => {
        // Phase will be set to 'complete' via the REST response
    }, [])

    return {
        phase,
        session,
        currentQuestion,
        currentIndex,
        totalQuestions,
        isLastQuestion,
        timeLeft,
        answers,
        evalProgress,
        finalSession,
        error,
        startSession,
        handleSubmitAnswer,
        handleSocketProgress,
        handleSocketDone,
    }
}
