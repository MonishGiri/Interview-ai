const { GoogleGenAI } = require('@google/genai')
const { z } = require('zod')
const { zodToJsonSchema } = require('zod-to-json-schema')

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })

// ── Timer allocation by difficulty ───────────────────────────────────────────
const DIFFICULTY_TIMERS = {
    easy: 90,    // 1.5 minutes
    medium: 150, // 2.5 minutes
    hard: 210,   // 3.5 minutes
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

/**
 * Build the randomized question list for a mock session from an interview report.
 * Interleaves technical and behavioral questions randomly.
 */
function buildSessionQuestions(report) {
    const technical = (report.technicalQuestions || []).map(q => ({
        question: q.question,
        questionType: 'technical',
        difficulty: q.difficulty || 'medium',
        timeLimit: DIFFICULTY_TIMERS[q.difficulty] || DIFFICULTY_TIMERS.medium,
        intention: q.intention,
        suggestedAnswer: q.answer,
    }))

    const behavioral = (report.behavioralQuestions || []).map(q => ({
        question: q.question,
        questionType: 'behavioral',
        difficulty: q.difficulty || 'medium',
        timeLimit: DIFFICULTY_TIMERS[q.difficulty] || DIFFICULTY_TIMERS.medium,
        intention: q.intention,
        suggestedAnswer: q.answer,
    }))

    // Shuffle both pools then interleave for a natural flow
    const shuffledTech = shuffleArray(technical)
    const shuffledBehav = shuffleArray(behavioral)
    const combined = shuffleArray([...shuffledTech, ...shuffledBehav])

    return combined
}

// ── Zod schema for per-question evaluation ───────────────────────────────────
const perQuestionEvalSchema = z.object({
    score: z.number().min(0).max(10).describe('Overall score for this answer from 0 to 10'),
    breakdown: z.object({
        relevance: z.number().min(0).max(10).describe('How directly the answer addresses the question, 0-10'),
        depth: z.number().min(0).max(10).describe('Technical/conceptual depth and detail of the answer, 0-10'),
        clarity: z.number().min(0).max(10).describe('How clearly and coherently the answer is communicated, 0-10'),
    }),
    feedback: z.string().describe('2-3 sentence specific, actionable feedback on the answer'),
    strengths: z.array(z.string()).describe('List of 1-3 specific strengths in the answer'),
    improvements: z.array(z.string()).describe('List of 1-3 specific improvements the candidate should make'),
    suggestedAnswer: z.string().describe('A concise model answer that demonstrates an ideal response'),
})

const sessionEvalSchema = z.object({
    perQuestionScores: z.array(perQuestionEvalSchema).describe('Evaluation for each question in order'),
    overallScore: z.number().min(0).max(100).describe('Overall session score from 0 to 100 based on all answers'),
    performanceLabel: z.enum(['Excellent', 'Good', 'Average', 'Needs Improvement', 'Poor']).describe('Performance classification based on the overall score'),
    overallFeedback: z.string().describe('3-4 sentence overall assessment of the candidate\'s performance in this mock session'),
    strongestArea: z.string().describe('The topic or skill area where the candidate performed best'),
    weakestArea: z.string().describe('The topic or skill area that needs the most improvement'),
    recommendations: z.array(z.string()).describe('3-5 specific, actionable recommendations for the candidate to improve before the real interview'),
})

/**
 * Evaluate all answers from a mock session using Gemini AI.
 * Returns structured evaluation with per-question scores and overall assessment.
 *
 * @param {Object} params
 * @param {Array}  params.answers   - Array of { question, questionType, difficulty, userAnswer }
 * @param {string} params.jobDescription - The target job description
 * @param {string} params.jobTitle   - The job title
 */
async function evaluateMockSession({ answers, jobDescription, jobTitle }) {
    const answeredQuestions = answers.filter(a => a.userAnswer && a.userAnswer.trim().length > 0)

    // Build per-question context for the prompt
    const questionsBlock = answers.map((a, i) => {
        const answered = a.userAnswer && a.userAnswer.trim().length > 0
        return `
Question ${i + 1} [${a.questionType?.toUpperCase() || 'UNKNOWN'} | ${a.difficulty?.toUpperCase() || 'MEDIUM'}]:
Q: ${a.question}
A: ${answered ? a.userAnswer.trim() : '[NO ANSWER PROVIDED - candidate ran out of time or skipped]'}
${answered ? '' : 'Note: Score this 0 across all dimensions as no answer was given.'}
`.trim()
    }).join('\n\n')

    const prompt = `You are an expert technical interviewer evaluating a candidate's mock interview performance for the following role:

Job Title: ${jobTitle || 'Software Engineer'}
Job Description: ${jobDescription || 'Not provided'}

The candidate answered ${answeredQuestions.length} out of ${answers.length} questions.

--- INTERVIEW TRANSCRIPT ---
${questionsBlock}
--- END TRANSCRIPT ---

Evaluate each answer carefully and provide a comprehensive assessment. Be strict but fair. If an answer is blank or unanswered, give 0 scores. Consider the difficulty level when calibrating depth expectations.`

    const response = await ai.models.generateContent({
        model: process.env.GEMINI_AI_MODEL || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: zodToJsonSchema(sessionEvalSchema),
        }
    })

    const raw = JSON.parse(response.text)

    // Merge questionId and question metadata back into each evaluation
    const merged = raw.perQuestionScores.map((evalItem, i) => ({
        questionId: answers[i]?._id || answers[i]?.questionId,
        question: answers[i]?.question,
        questionType: answers[i]?.questionType,
        difficulty: answers[i]?.difficulty,
        userAnswer: answers[i]?.userAnswer || '',
        ...evalItem,
    }))

    return {
        ...raw,
        perQuestionScores: merged,
        totalQuestions: answers.length,
        answeredQuestions: answeredQuestions.length,
    }
}

module.exports = { buildSessionQuestions, evaluateMockSession, DIFFICULTY_TIMERS }
