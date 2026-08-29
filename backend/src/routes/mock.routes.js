const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const mockController = require('../controllers/mock.controller')

const mockRouter = express.Router()

/**
 * @route  POST /api/mock/session/:interviewId
 * @desc   Create a new mock session (randomizes questions from the report)
 * @access private
 */
mockRouter.post('/session/:interviewId', authMiddleware.authUser, mockController.createMockSessionController)

/**
 * @route  GET /api/mock/session/:sessionId
 * @desc   Get a specific mock session by ID
 * @access private
 */
mockRouter.get('/session/:sessionId', authMiddleware.authUser, mockController.getMockSessionController)

/**
 * @route  GET /api/mock/sessions/:interviewId
 * @desc   List all mock sessions for a given interview report
 * @access private
 */
mockRouter.get('/sessions/:interviewId', authMiddleware.authUser, mockController.listMockSessionsController)

/**
 * @route  POST /api/mock/session/:sessionId/submit
 * @desc   Submit all answers and trigger AI evaluation
 * @access private
 */
mockRouter.post('/session/:sessionId/submit', authMiddleware.authUser, mockController.submitMockSessionController)

module.exports = mockRouter
