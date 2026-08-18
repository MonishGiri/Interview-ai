const pdfParse = require("pdf-parse")
const mammoth = require("mammoth")
const { generateInterviewReport, generateResumePdf, evaluateUserAnswer } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")
const asyncHandler = require("../middlewares/asyncHandler")

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
const generateInterViewReportController = asyncHandler(async (req, res) => {
    const { selfDescription, jobDescription } = req.body
    let resumeText = ""

    if (req.file) {
        const mimeType = req.file.mimetype || ""
        const originalName = req.file.originalname || ""

        if (mimeType.includes("pdf") || originalName.endsWith(".pdf")) {
            const parsedData = await new pdfParse.PDFParse(Uint8Array.from(req.file.buffer)).getText()
            resumeText = parsedData.text || ""
        } else if (
            mimeType.includes("wordprocessingml") ||
            mimeType.includes("msword") ||
            originalName.endsWith(".docx") ||
            originalName.endsWith(".doc")
        ) {
            const extracted = await mammoth.extractRawText({ buffer: req.file.buffer })
            resumeText = extracted.value || ""
        }
    }

    const interViewReportByAi = await generateInterviewReport({
        resume: resumeText,
        selfDescription,
        jobDescription
    })

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeText,
        selfDescription,
        jobDescription,
        ...interViewReportByAi
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })
})

/**
 * @description Controller to get interview report by interviewId.
 */
const getInterviewReportByIdController = asyncHandler(async (req, res) => {
    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
})

/** 
 * @description Controller to get all interview reports of logged in user.
 */
const getAllInterviewReportsController = asyncHandler(async (req, res) => {
    const interviewReports = await interviewReportModel.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
})

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
const generateResumePdfController = asyncHandler(async (req, res) => {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription, user: userId } = interviewReport

    // Retrieve user details to ensure the resume is generated with correct candidate name and email
    const userModel = require("../models/user.model")
    const user = await userModel.findById(userId)
    const candidateName = user ? user.username : "Candidate"
    const candidateEmail = user ? user.email : "candidate@interview.ai"

    const pdfBuffer = await generateResumePdf({ 
        resume, 
        jobDescription, 
        selfDescription,
        candidateName,
        candidateEmail
    })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
})

/**
 * @description Controller to toggle completion status of a roadmap task.
 */
const toggleTaskCompletionController = asyncHandler(async (req, res) => {
    const { interviewId } = req.params
    const { day, taskIndex } = req.body

    const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!report) {
        return res.status(404).json({ message: "Interview report not found." })
    }

    if (!report.completedTasks) {
        report.completedTasks = []
    }

    const existingIndex = report.completedTasks.findIndex(
        t => t.day === Number(day) && t.taskIndex === Number(taskIndex)
    )

    if (existingIndex > -1) {
        report.completedTasks.splice(existingIndex, 1)
    } else {
        report.completedTasks.push({ day: Number(day), taskIndex: Number(taskIndex) })
    }

    await report.save()

    res.status(200).json({
        message: "Task status updated successfully.",
        completedTasks: report.completedTasks
    })
})

/**
 * @description Controller to evaluate a user's answer to an interview question.
 */
const evaluateAnswerController = asyncHandler(async (req, res) => {
    const { question, intention, modelAnswer, userAnswer, questionType } = req.body

    if (!userAnswer || !userAnswer.trim()) {
        return res.status(400).json({ message: "User answer is required for evaluation." })
    }

    const evaluation = await evaluateUserAnswer({
        question,
        intention,
        modelAnswer,
        userAnswer,
        questionType
    })

    res.status(200).json({
        message: "Answer evaluated successfully.",
        evaluation
    })
})

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
    toggleTaskCompletionController,
    evaluateAnswerController
}