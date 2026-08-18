import api from "../../../services/api.client";

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