require('dotenv').config()
const http = require('http')
const { Server } = require('socket.io')
const app = require('./src/app')
const connectToDB = require('./src/config/database')

connectToDB()

const httpServer = http.createServer(app)

const allowedOrigins = [
    process.env.CORS_ORIGIN,
    'https://interview-ai-1-ycq8.onrender.com',
    'https://interview-ai-frontend.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
].filter(Boolean).flatMap(url => url.split(',')).map(url => url.trim().replace(/\/$/, ''))

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
})

// ── Socket.IO: Mock Interview Real-Time Evaluation ───────────────────────────
io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`)

    /**
     * Event: 'mock:evaluate-progress'
     * Emits real-time progress while the session is being evaluated.
     * The actual evaluation is triggered via REST POST /api/mock/session/:id/submit,
     * but this event lets the frontend show a live "Evaluating Q1/7... Q2/7..." overlay.
     *
     * Payload: { sessionId, totalQuestions }
     * Emits:   'mock:progress' { step, total, message }
     *          'mock:done'     {} — tells frontend to poll REST for final results
     */
    socket.on('mock:watch-evaluation', ({ sessionId, totalQuestions }) => {
        if (!sessionId) return

        socket.join(`session:${sessionId}`)
        console.log(`[Socket.IO] Client watching evaluation for session: ${sessionId}`)
    })

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`)
    })
})

// Export io so controllers can emit progress events
app.set('io', io)

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})