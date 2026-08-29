const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc."),
        difficulty: z.enum(["easy", "medium", "hard"]).describe("The difficulty level of this question: easy for basic/foundational, medium for intermediate, hard for advanced/senior-level")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc."),
        difficulty: z.enum(["easy", "medium", "hard"]).describe("The difficulty level of this question: easy for common/standard, medium for situational, hard for leadership/complex scenarios")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    const response = await ai.models.generateContent({
        model: process.env.GEMINI_AI_MODEL || "gemini-3.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)


}



// async function generatePdfFromHtml(htmlContent) {
//     const browser = await puppeteer.launch({
//         args: ["--no-sandbox", "--disable-setuid-sandbox"]
//     })
//     const page = await browser.newPage();
//     page.setDefaultNavigationTimeout(10000)
//     await page.setContent(htmlContent, { waitUntil: "domcontentloaded" })

//     const pdfBuffer = await page.pdf({
//         format: "A4", margin: {
//             top: "20mm",
//             bottom: "20mm",
//             left: "15mm",
//             right: "15mm"
//         }
//     })

//     await browser.close()

//     return pdfBuffer
// }

// async function generateResumePdf({ resume, selfDescription, jobDescription, candidateName, candidateEmail }) {

//     const resumePdfSchema = z.object({
//         html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
//     })

//     const prompt = `Generate a professional resume for the candidate based on their details:
//                         Default Candidate Name Fallback: ${candidateName}
//                         Default Candidate Email Fallback: ${candidateEmail}

//                         Input Details:
//                         Uploaded Resume Text: ${resume}
//                         Self Description / Experience Summary: ${selfDescription}
//                         Target Job Description: ${jobDescription}

//                         the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
//                         The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.

//                         CRITICAL NAME & DETAILS REQUIREMENT:
//                         1. You MUST check the 'Uploaded Resume Text' and 'Self Description' first for the candidate's real name. If a name is found, you MUST use that name at the top of the resume. Only if no name is mentioned in those inputs, you should fall back to using "${candidateName}".
//                         2. You MUST check the 'Uploaded Resume Text' and 'Self Description' for contact links (such as LinkedIn, GitHub, portfolio website, personal email, etc.). You MUST preserve and include these exact links in the generated resume.
//                         3. If no email is mentioned in the inputs, use "${candidateEmail}" as the email.

//                         The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
//                         you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
//                         The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
//                         The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.

//                         CRITICAL HYPERLINK REQUIREMENT:
//                         All social profiles, LinkedIn, GitHub, portfolio, and email links MUST be wrapped in explicit HTML anchor tags: <a href="https://..." target="_blank">...</a>.
//                         Every href attribute MUST start with an explicit http:// or https:// scheme (e.g. href="https://linkedin.com/in/..." and href="https://github.com/..."). Do NOT output protocol-less URLs.
//                     `

//     const response = await ai.models.generateContent({
//         model: process.env.GEMINI_AI_MODEL,
//         contents: prompt,
//         config: {
//             responseMimeType: "application/json",
//             responseSchema: zodToJsonSchema(resumePdfSchema),
//         }
//     })


//     const jsonContent = JSON.parse(response.text)

//     let htmlContent = jsonContent.html || ""
//     // Ensure all href links have valid https:// protocol so PDF readers make them clickable
//     htmlContent = htmlContent.replace(/href=["'](?!https?:\/\/|mailto:|tel:)([^"']+)["']/gi, (match, url) => {
//         const cleanUrl = url.trim().replace(/^\/+/, '')
//         return `href="https://${cleanUrl}"`
//     })

//     const pdfBuffer = await generatePdfFromHtml(htmlContent)

//     return pdfBuffer

// }

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu"
        ]
    })
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: process.env.GEMINI_AI_MODEL || "gemini-3.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

const answerEvaluationSchema = z.object({
    score: z.number().min(1).max(10).describe("Score out of 10 for the user's answer"),
    feedback: z.string().describe("Constructive summary feedback on the answer quality"),
    strengths: z.array(z.string()).describe("List of strengths identified in the user's response"),
    improvements: z.array(z.string()).describe("List of missing concepts, key terms, or areas to improve"),
    starAnalysis: z.object({
        situationAndTask: z.string().describe("Feedback on how well the candidate established situation or context"),
        action: z.string().describe("Feedback on how well the candidate described specific actions taken"),
        result: z.string().describe("Feedback on whether measurable outcomes/results were communicated")
    }).describe("Evaluation following the STAR technique"),
    modelAnswerTip: z.string().describe("One killer tip to elevate this answer to an elite interview level")
})

async function evaluateUserAnswer({ question, intention, modelAnswer, userAnswer, questionType }) {
    const prompt = `Evaluate the candidate's answer for the following interview question:
Question (${questionType || 'General'}): ${question}
Interviewer Intention: ${intention}
Ideal Model Answer Reference: ${modelAnswer}

Candidate's Answer: ${userAnswer}

Provide a fair, detailed, constructive evaluation including score (1-10), strengths, areas for improvement, STAR method analysis, and a top tip for improvement.`

    const response = await ai.models.generateContent({
        model: process.env.GEMINI_AI_MODEL || "gemini-3.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(answerEvaluationSchema),
        }
    })

    return JSON.parse(response.text)
}

const sectionSchemas = {
    technicalQuestions: z.object({
        technicalQuestions: z.array(z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string(),
            difficulty: z.enum(["easy", "medium", "hard"])
        }))
    }),
    behavioralQuestions: z.object({
        behavioralQuestions: z.array(z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string(),
            difficulty: z.enum(["easy", "medium", "hard"])
        }))
    }),
    preparationPlan: z.object({
        preparationPlan: z.array(z.object({
            day: z.number(),
            focus: z.string(),
            tasks: z.array(z.string())
        }))
    })
}

const sectionPrompts = {
    technicalQuestions: ({ resume, selfDescription, jobDescription }) =>
        `Generate a fresh set of technical interview questions for the following candidate and job. Make them different from previous questions, cover a variety of topics and difficulty levels.\n\nJob Description: ${jobDescription}\nResume: ${resume}\nSelf Description: ${selfDescription}`,
    behavioralQuestions: ({ resume, selfDescription, jobDescription }) =>
        `Generate a fresh set of behavioral interview questions for the following candidate and job. Make them different from previous questions, focus on STAR-method scenarios.\n\nJob Description: ${jobDescription}\nResume: ${resume}\nSelf Description: ${selfDescription}`,
    preparationPlan: ({ resume, selfDescription, jobDescription }) =>
        `Generate a fresh day-by-day preparation plan for the following candidate targeting this job. Create a realistic, actionable plan different from the previous one.\n\nJob Description: ${jobDescription}\nResume: ${resume}\nSelf Description: ${selfDescription}`
}

async function regenerateSection({ section, resume, selfDescription, jobDescription }) {
    const schema = sectionSchemas[section]
    const promptFn = sectionPrompts[section]

    if (!schema || !promptFn) {
        throw new Error(`Unknown section: ${section}`)
    }

    const response = await ai.models.generateContent({
        model: process.env.GEMINI_AI_MODEL || "gemini-3.5-flash",
        contents: promptFn({ resume, selfDescription, jobDescription }),
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(schema),
        }
    })

    return JSON.parse(response.text)
}

async function generateReportPdf(report) {
    const escapeHtml = (str) => {
        if (!str) return ''
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
    }

    const techQs = report.technicalQuestions || []
    const behQs = report.behavioralQuestions || []
    const roadMap = report.preparationPlan || []
    const skillGaps = report.skillGaps || []

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #0f172a; line-height: 1.5; padding: 0; }
            .pdf-container { padding: 10px; max-width: 800px; margin: 0 auto; }
            
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
            .header-title { font-size: 24px; font-weight: 700; color: #1e293b; text-transform: capitalize; margin-bottom: 4px; }
            .header-subtitle { font-size: 13px; color: #64748b; }
            .score-badge { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; padding: 8px 16px; border-radius: 12px; text-align: center; }
            .score-val { font-size: 22px; font-weight: 800; display: block; line-height: 1; }
            .score-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; }

            .section { margin-bottom: 28px; }
            .section-title { font-size: 18px; font-weight: 700; color: #0f172a; border-left: 4px solid #6366f1; padding-left: 10px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
            .count-badge { font-size: 12px; font-weight: 500; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 999px; }

            .skill-gaps-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
            .skill-tag { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
            .skill-tag.high { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
            .skill-tag.medium { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
            .skill-tag.low { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }

            .q-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid; }
            .q-card-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
            .q-num { background: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; white-space: nowrap; }
            .q-diff { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; white-space: nowrap; }
            .q-diff.easy { background: #dcfce7; color: #15803d; }
            .q-diff.medium { background: #fef9c3; color: #a16207; }
            .q-diff.hard { background: #fee2e2; color: #b91c1c; }
            .q-text { font-size: 14px; font-weight: 600; color: #1e293b; flex: 1; }

            .box { border-radius: 8px; padding: 10px 12px; margin-top: 8px; font-size: 13px; }
            .box-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
            .box-intention { background: #f1f5f9; border-left: 3px solid #64748b; color: #334155; }
            .box-intention .box-tag { color: #475569; }
            .box-answer { background: #eff6ff; border-left: 3px solid #3b82f6; color: #1e3a8a; }
            .box-answer .box-tag { color: #2563eb; }
            .box-text { line-height: 1.5; white-space: pre-line; }

            .roadmap-day { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid; }
            .roadmap-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
            .day-badge { background: #4f46e5; color: #ffffff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
            .day-focus { font-size: 14px; font-weight: 700; color: #0f172a; }
            .task-list { list-style: none; padding-left: 0; }
            .task-item { font-size: 13px; color: #334155; padding: 4px 0 4px 18px; position: relative; }
            .task-item::before { content: "•"; color: #6366f1; font-weight: bold; font-size: 16px; position: absolute; left: 4px; top: 0px; }
        </style>
    </head>
    <body>
        <div class="pdf-container">
            <div class="header">
                <div>
                    <h1 class="header-title">${escapeHtml(report.title || 'Interview Strategy Report')}</h1>
                    <p class="header-subtitle">Generated by InterviewAI • Comprehensive Preparation Strategy</p>
                </div>
                <div class="score-badge">
                    <span class="score-val">${report.matchScore}%</span>
                    <span class="score-lbl">Match Score</span>
                </div>
            </div>

            ${skillGaps.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">Identified Skill Gaps</h2>
                    <div class="skill-gaps-grid">
                        ${skillGaps.map(g => `
                            <span class="skill-tag ${g.severity || 'medium'}">${escapeHtml(g.skill)} (${g.severity || 'medium'} priority)</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${techQs.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">
                        Technical Questions
                        <span class="count-badge">${techQs.length} Questions</span>
                    </h2>
                    ${techQs.map((q, i) => `
                        <div class="q-card">
                            <div class="q-card-header">
                                <span class="q-num">Q${i + 1}</span>
                                ${q.difficulty ? `<span class="q-diff ${q.difficulty}">${q.difficulty}</span>` : ''}
                                <p class="q-text">${escapeHtml(q.question)}</p>
                            </div>
                            ${q.intention ? `
                                <div class="box box-intention">
                                    <span class="box-tag">Intention</span>
                                    <p class="box-text">${escapeHtml(q.intention)}</p>
                                </div>
                            ` : ''}
                            ${q.answer ? `
                                <div class="box box-answer">
                                    <span class="box-tag">Model Answer</span>
                                    <p class="box-text">${escapeHtml(q.answer)}</p>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${behQs.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">
                        Behavioral Questions
                        <span class="count-badge">${behQs.length} Questions</span>
                    </h2>
                    ${behQs.map((q, i) => `
                        <div class="q-card">
                            <div class="q-card-header">
                                <span class="q-num">Q${i + 1}</span>
                                ${q.difficulty ? `<span class="q-diff ${q.difficulty}">${q.difficulty}</span>` : ''}
                                <p class="q-text">${escapeHtml(q.question)}</p>
                            </div>
                            ${q.intention ? `
                                <div class="box box-intention">
                                    <span class="box-tag">Intention</span>
                                    <p class="box-text">${escapeHtml(q.intention)}</p>
                                </div>
                            ` : ''}
                            ${q.answer ? `
                                <div class="box box-answer">
                                    <span class="box-tag">Model Answer</span>
                                    <p class="box-text">${escapeHtml(q.answer)}</p>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${roadMap.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">
                        Preparation Road Map
                        <span class="count-badge">${roadMap.length}-Day Plan</span>
                    </h2>
                    ${roadMap.map((day) => `
                        <div class="roadmap-day">
                            <div class="roadmap-header">
                                <span class="day-badge">Day ${day.day}</span>
                                <h3 class="day-focus">${escapeHtml(day.focus)}</h3>
                            </div>
                            <ul class="task-list">
                                ${day.tasks?.map((task) => `<li class="task-item">${escapeHtml(task)}</li>`).join('') || ''}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    </body>
    </html>
    `

    const pdfBuffer = await generatePdfFromHtml(htmlContent)
    return pdfBuffer
}

module.exports = { generateInterviewReport, generateResumePdf, evaluateUserAnswer, regenerateSection, generateReportPdf }