const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())

const allowedOrigins = [
    process.env.CORS_ORIGIN,
    "https://interview-ai-1-ycq8.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174"
].filter(Boolean).map(url => url.replace(/\/$/, ""))

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like Postman or server-to-server)
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, "");
        if (allowedOrigins.includes(cleanOrigin)) {
            return callback(null, true);
        }
        return callback(new Error("CORS Policy Violation: Origin not allowed"));
    },
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

/* Centralized Error Handler */
app.use((err, req, res, next) => {
    console.error("Global Error Handler caught:", err)
    const statusCode = err.statusCode || 500
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error"
    })
})

module.exports = app