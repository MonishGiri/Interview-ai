const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()

/**
 * @route POST /api/interview/
 * @description generate new interview report
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterViewReportController)

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)

/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)

/**
 * @route POST /api/interview/resume/pdf/:interviewReportId
 * @description generate resume pdf
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)

/**
 * @route PATCH /api/interview/task-toggle/:interviewId
 * @description toggle completion state of a preparation plan task
 * @access private
 */
interviewRouter.patch("/task-toggle/:interviewId", authMiddleware.authUser, interviewController.toggleTaskCompletionController)

/**
 * @route POST /api/interview/evaluate-answer
 * @description evaluate user answer using Gemini AI
 * @access private
 */
interviewRouter.post("/evaluate-answer", authMiddleware.authUser, interviewController.evaluateAnswerController)

/**
 * @route POST /api/interview/share/:interviewId
 * @description generate a public share link token
 * @access private
 */
interviewRouter.post("/share/:interviewId", authMiddleware.authUser, interviewController.generateShareLinkController)

/**
 * @route DELETE /api/interview/share/:interviewId
 * @description revoke the public share link
 * @access private
 */
interviewRouter.delete("/share/:interviewId", authMiddleware.authUser, interviewController.revokeShareLinkController)

/**
 * @route GET /api/interview/shared/:shareToken
 * @description public endpoint to view a shared report
 * @access public
 */
interviewRouter.get("/shared/:shareToken", interviewController.getSharedReportController)

/**
 * @route PATCH /api/interview/regenerate/:interviewId
 * @description regenerate a specific section using AI
 * @access private
 */
interviewRouter.patch("/regenerate/:interviewId", authMiddleware.authUser, interviewController.regenerateSectionController)

module.exports = interviewRouter