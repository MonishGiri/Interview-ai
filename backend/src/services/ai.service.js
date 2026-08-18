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
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
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
        model: process.env.GEMINI_AI_MODEL,
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
    const browser = await puppeteer.launch()
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
        model: process.env.GEMINI_AI_MODEL,
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
        model: process.env.GEMINI_AI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(answerEvaluationSchema),
        }
    })

    return JSON.parse(response.text)
}

module.exports = { generateInterviewReport, generateResumePdf, evaluateUserAnswer }