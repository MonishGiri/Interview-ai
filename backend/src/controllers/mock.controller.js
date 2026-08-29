const asyncHandler = require('../middlewares/asyncHandler')
const interviewReportModel = require('../models/interviewReport.model')
const mockSessionModel = require('../models/mockSession.model')
const { buildSessionQuestions, evaluateMockSession } = require('../services/mock.service')

/**
 * POST /api/mock/session/:interviewId
 * Create a new mock session from an existing interview report.
 * Randomizes questions and assigns difficulty-based timers.
 */
const createMockSessionController = asyncHandler(async (req, res) => {
    const { interviewId } = req.params

    const report = await interviewReportModel.findOne({
        _id: interviewId,
        user: req.user.id,
    })

    if (!report) {
        return res.status(404).json({ success: false, message: 'Interview report not found.' })
    }

    if (!report.technicalQuestions?.length && !report.behavioralQuestions?.length) {
        return res.status(400).json({ success: false, message: 'No questions found in this report.' })
    }

    const questions = buildSessionQuestions(report)

    const session = await mockSessionModel.create({
        interviewId: report._id,
        userId: req.user.id,
        jobTitle: report.title,
        jobDescription: report.jobDescription,
        questions,
        answers: [],
        status: 'in-progress',
        startTime: new Date(),
    })

    res.status(201).json({
        success: true,
        message: 'Mock session created.',
        session: {
            _id: session._id,
            questions: session.questions,
            jobTitle: session.jobTitle,
            status: session.status,
            startTime: session.startTime,
        },
    })
})

/**
 * GET /api/mock/session/:sessionId
 * Get a mock session by ID (for resuming or viewing summary).
 */
const getMockSessionController = asyncHandler(async (req, res) => {
    const { sessionId } = req.params

    const session = await mockSessionModel.findOne({
        _id: sessionId,
        userId: req.user.id,
    })

    if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found.' })
    }

    res.status(200).json({ success: true, session })
})

/**
 * GET /api/mock/sessions/:interviewId
 * List all mock sessions for a given interview report (history).
 */
const listMockSessionsController = asyncHandler(async (req, res) => {
    const { interviewId } = req.params

    const sessions = await mockSessionModel
        .find({ interviewId, userId: req.user.id })
        .sort({ createdAt: -1 })
        .select('_id status overallScore startTime endTime jobTitle evaluation.overallScore evaluation.performanceLabel')
        .lean()

    res.status(200).json({ success: true, sessions })
})

/**
 * POST /api/mock/session/:sessionId/submit
 * Save final answers and trigger AI evaluation.
 * This is called when the user finishes all questions.
 * Evaluation happens here (synchronous, not via socket).
 */
const submitMockSessionController = asyncHandler(async (req, res) => {
    const { sessionId } = req.params
    const { answers } = req.body // Array of { questionId, userAnswer, timeTaken, autoSubmitted }

    const session = await mockSessionModel.findOne({
        _id: sessionId,
        userId: req.user.id,
    })

    if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found.' })
    }

    if (session.status === 'completed') {
        return res.status(400).json({ success: false, message: 'Session already completed.' })
    }

    // Merge submitted answers with question metadata
    const enrichedAnswers = session.questions.map((q, i) => {
        const submitted = answers.find(a => String(a.questionId) === String(q._id)) || {}
        return {
            questionId: q._id,
            question: q.question,
            questionType: q.questionType,
            difficulty: q.difficulty,
            userAnswer: submitted.userAnswer || '',
            timeTaken: submitted.timeTaken || 0,
            autoSubmitted: submitted.autoSubmitted || false,
        }
    })

    // Update to evaluating state
    session.answers = enrichedAnswers
    session.status = 'evaluating'
    session.endTime = new Date()
    await session.save()

    // Notify frontend that evaluation has started
    const io = req.app.get('io')
    const emitProgress = (step, message) => {
        if (io) {
            io.to(`session:${sessionId}`).emit('mock:progress', {
                step,
                total: enrichedAnswers.length,
                message,
            })
        }
    }

    emitProgress(0, 'Starting AI evaluation...')

    // Run AI evaluation
    let evaluation
    try {
        // Emit a mid-way progress signal — evaluation is a single Gemini call
        // but we simulate staged feedback for UX realism
        setTimeout(() => emitProgress(Math.ceil(enrichedAnswers.length * 0.4), 'Analysing your answers...'), 1200)
        setTimeout(() => emitProgress(Math.ceil(enrichedAnswers.length * 0.7), 'Scoring each question...'), 3000)

        evaluation = await evaluateMockSession({
            answers: enrichedAnswers,
            jobDescription: session.jobDescription,
            jobTitle: session.jobTitle,
        })
    } catch (err) {
        session.status = 'error'
        await session.save()
        if (io) io.to(`session:${sessionId}`).emit('mock:error', { message: 'AI evaluation failed.' })
        return res.status(500).json({ success: false, message: 'AI evaluation failed. Please try again.' })
    }

    // Save evaluation and mark completed
    session.evaluation = evaluation
    session.status = 'completed'
    await session.save()

    // Notify frontend evaluation is done
    if (io) io.to(`session:${sessionId}`).emit('mock:done', { sessionId })

    res.status(200).json({
        success: true,
        message: 'Session evaluated successfully.',
        session,
    })
})

module.exports = {
    createMockSessionController,
    getMockSessionController,
    listMockSessionsController,
    submitMockSessionController,
}
