const mongoose = require('mongoose')

const sessionQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    questionType: { type: String, enum: ['technical', 'behavioral'], required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    timeLimit: { type: Number, required: true }, // seconds
    intention: { type: String },
    suggestedAnswer: { type: String }, // from original report, shown post-session
}, { _id: true })

const sessionAnswerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    question: { type: String, required: true },
    questionType: { type: String, enum: ['technical', 'behavioral'] },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    userAnswer: { type: String, default: '' },
    timeTaken: { type: Number, default: 0 }, // seconds
    autoSubmitted: { type: Boolean, default: false }, // true if timer ran out
}, { _id: false })

const perQuestionEvalSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId },
    question: { type: String },
    questionType: { type: String },
    difficulty: { type: String },
    userAnswer: { type: String },
    score: { type: Number, min: 0, max: 10 }, // 0-10
    breakdown: {
        relevance: { type: Number, min: 0, max: 10 },
        depth: { type: Number, min: 0, max: 10 },
        clarity: { type: Number, min: 0, max: 10 },
    },
    feedback: { type: String },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    suggestedAnswer: { type: String },
}, { _id: false })

const evaluationSchema = new mongoose.Schema({
    overallScore: { type: Number, min: 0, max: 100 }, // 0-100
    totalQuestions: { type: Number },
    answeredQuestions: { type: Number },
    perQuestionScores: [perQuestionEvalSchema],
    overallFeedback: { type: String },
    strongestArea: { type: String },
    weakestArea: { type: String },
    recommendations: [{ type: String }],
    performanceLabel: {
        type: String,
        enum: ['Excellent', 'Good', 'Average', 'Needs Improvement', 'Poor'],
    },
}, { _id: false })

const mockSessionSchema = new mongoose.Schema({
    interviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewReport',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    jobTitle: { type: String },
    jobDescription: { type: String },
    questions: [sessionQuestionSchema],
    answers: [sessionAnswerSchema],
    evaluation: evaluationSchema,
    status: {
        type: String,
        enum: ['in-progress', 'submitted', 'evaluating', 'completed', 'error'],
        default: 'in-progress',
    },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
}, { timestamps: true })

const mockSessionModel = mongoose.model('MockSession', mockSessionSchema)
module.exports = mockSessionModel
