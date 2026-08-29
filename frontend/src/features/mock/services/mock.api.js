import api from '../../../services/api.client'

/**
 * Create a new mock interview session from an existing report.
 * The server randomizes questions and assigns timers.
 */
export const createMockSessionApi = async (interviewId) => {
    const res = await api.post(`/api/mock/session/${interviewId}`)
    return res.data
}

/**
 * Fetch a mock session by its ID.
 */
export const getMockSessionApi = async (sessionId) => {
    const res = await api.get(`/api/mock/session/${sessionId}`)
    return res.data
}

/**
 * List all past mock sessions for a given interview report.
 */
export const listMockSessionsApi = async (interviewId) => {
    const res = await api.get(`/api/mock/sessions/${interviewId}`)
    return res.data
}

/**
 * Submit all answers for AI evaluation.
 * @param {string} sessionId
 * @param {Array}  answers  - [{questionId, userAnswer, timeTaken, autoSubmitted}]
 */
export const submitMockSessionApi = async (sessionId, answers) => {
    const res = await api.post(`/api/mock/session/${sessionId}/submit`, { answers })
    return res.data
}
