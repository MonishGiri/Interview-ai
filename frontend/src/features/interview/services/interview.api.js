import axios from "axios";
import api from "../../../services/api.client";

const PUBLIC_API_BASE = (import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === 'production'
        ? 'https://interview-ai-xqd6.onrender.com'
        : 'http://localhost:3000')).replace(/\/$/, '')

/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    try {
        const formData = new FormData()
        formData.append("jobDescription", jobDescription)
        formData.append("selfDescription", selfDescription)
        formData.append("resume", resumeFile)

        const response = await api.post("/api/interview/", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })

        return response.data
    } catch (error) {
        console.log(error)
        return null
    }
}

/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    try {
        const response = await api.get(`/api/interview/report/${interviewId}`)
        return response.data
    } catch (error) {
        console.log(error)
        return null
    }
}

/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    try {
        const response = await api.get("/api/interview/")
        return response.data
    } catch (error) {
        console.log(error)
        return null
    }
}

/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    try {
        const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
            responseType: "blob"
        })
        return response.data
    } catch (error) {
        console.log(error)
        return null
    }
}

/**
 * @description Service to toggle completion status of a preparation task.
 */
export const toggleTaskCompletion = async ({ interviewId, day, taskIndex }) => {
    try {
        const response = await api.patch(`/api/interview/task-toggle/${interviewId}`, { day, taskIndex })
        return response.data
    } catch (error) {
        console.log(error)
        return null
    }
}

/**
 * @description Service to evaluate candidate answer using Gemini AI.
 */
export const evaluateAnswer = async ({ question, intention, modelAnswer, userAnswer, questionType }) => {
    try {
        const response = await api.post("/api/interview/evaluate-answer", {
            question,
            intention,
            modelAnswer,
            userAnswer,
            questionType
        })
        return response.data
    } catch (error) {
        console.log(error)
        throw error
    }
}

/**
 * @description Generate a public share link token for a report.
 */
export const generateShareLink = async (interviewId) => {
    try {
        const response = await api.post(`/api/interview/share/${interviewId}`)
        return response.data
    } catch (error) {
        console.log(error)
        return null
    }
}

/**
 * @description Revoke the public share link for a report.
 */
export const revokeShareLink = async (interviewId) => {
    try {
        const response = await api.delete(`/api/interview/share/${interviewId}`)
        return response.data
    } catch (error) {
        console.log(error)
        return null
    }
}

/**
 * @description Public endpoint — fetch a shared report by shareToken (no auth required).
 */
export const getSharedReport = async (shareToken) => {
    try {
        const response = await axios.get(`${PUBLIC_API_BASE}/api/interview/shared/${shareToken}`)
        return response.data
    } catch (error) {
        console.log(error)
        return null
    }
}

/**
 * @description Regenerate a specific section of a report using AI.
 */
export const regenerateReportSection = async ({ interviewId, section }) => {
    try {
        const response = await api.patch(`/api/interview/regenerate/${interviewId}`, { section })
        return response.data
    } catch (error) {
        console.log(error)
        throw error
    }
}