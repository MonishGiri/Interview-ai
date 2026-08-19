import {
    getAllInterviewReports,
    generateInterviewReport,
    getInterviewReportById,
    generateResumePdf,
    toggleTaskCompletion,
    evaluateAnswer
} from "../services/interview.api"
import { useContext } from "react"
import { InterviewContext } from "../interview.context"
import { useAuth } from "../../auth/hooks/useAuth"

export const useInterview = () => {
    const context = useContext(InterviewContext)
    const { user } = useAuth()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            if (response?.interviewReport) {
                setReport(response.interviewReport)
            }
            return response?.interviewReport || null
        } catch (error) {
            console.log(error)
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        try {
            const response = await getInterviewReportById(interviewId)
            if (response?.interviewReport) {
                setReport(response.interviewReport)
            }
            return response?.interviewReport || null
        } catch (error) {
            console.log(error)
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        if (!user) return []
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            if (response?.interviewReports) {
                setReports(response.interviewReports)
            }
            return response?.interviewReports || []
        } catch (error) {
            console.log(error)
            return []
        } finally {
            setLoading(false)
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            const response = await generateResumePdf({ interviewReportId })
            if (response) {
                const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
                const link = document.createElement("a")
                link.href = url
                link.setAttribute("download", `resume_${interviewReportId}.pdf`)
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            }
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    const toggleTask = async (interviewId, day, taskIndex) => {
        if (!interviewId) return
        try {
            const response = await toggleTaskCompletion({ interviewId, day, taskIndex })
            if (response?.completedTasks) {
                setReport(prev => prev ? { ...prev, completedTasks: response.completedTasks } : prev)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const submitAnswerForEvaluation = async ({ question, intention, modelAnswer, userAnswer, questionType }) => {
        try {
            const response = await evaluateAnswer({ question, intention, modelAnswer, userAnswer, questionType })
            return response?.evaluation || null
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    return {
        loading,
        report,
        setReport,
        reports,
        generateReport,
        getReportById,
        getReports,
        getResumePdf,
        toggleTask,
        submitAnswerForEvaluation
    }
}