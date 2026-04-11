const Groq = require("groq-sdk");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

// console.log("GROQ API KEY:", process.env.GROQ_API_KEY);

function parseAIJson(text) {
    const cleaned = text.replace(/```json|```/g, "").trim()
    return JSON.parse(cleaned)
}

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

    const prompt = `Generate a comprehensive interview report for a candidate with the following details:

Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

IMPORTANT INSTRUCTIONS:
1. You MUST generate 5-7 technical questions with COMPLETE answers
2. You MUST generate 4-6 behavioral questions with COMPLETE answers
3. Every question MUST have ALL three fields: question, intention, and answer
4. The "answer" field must be detailed and helpful (at least 3-4 sentences)
5. Do not leave any field empty or missing

For technicalQuestions:
- Generate questions based on the job requirements and candidate's resume
- Each question should test specific technical skills
- Provide detailed intention and COMPLETE model answer

For behavioralQuestions:
- Generate questions using the STAR method
- Questions should assess soft skills, teamwork, leadership
- Provide detailed intention and COMPLETE model answer

For skillGaps:
- Identify 3-5 skills the candidate is missing or needs to improve
- Rate each gap's severity (low/medium/high)
- Format each skill gap as an object with "skill" and "severity" fields

For preparationPlan:
- Create a 7-14 day preparation plan
- Each day should have a clear focus and 2-4 specific tasks

Return ONLY raw JSON. Do not wrap it in markdown.

Use this schema:
${JSON.stringify(zodToJsonSchema(interviewReportSchema))}
`

    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system",
                content: "You are an expert interview coach. You MUST generate COMPLETE data with ALL fields. Every question MUST have a detailed answer field. Never leave any field empty. For skillGaps, always include both 'skill' and 'severity' fields for each item."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.7,
        max_tokens: 4096
    })

    const text = response.choices[0].message.content
    let data = parseAIJson(text)

    if (!data.title || data.title.trim() === "") {
        data.title = "Generated Interview Report"
    }

    if (typeof data.matchScore !== 'number' || isNaN(data.matchScore)) {
        const hasTechnical = data.technicalQuestions?.length || 0
        const hasBehavioral = data.behavioralQuestions?.length || 0
        const hasSkillGaps = data.skillGaps?.length || 0

        data.matchScore = Math.min(95, Math.max(70, 70 + (hasTechnical * 2) + (hasBehavioral * 2) + (hasSkillGaps * 1)))
    }

    data.matchScore = Math.min(100, Math.max(0, data.matchScore))
    if (data.technicalQuestions && Array.isArray(data.technicalQuestions)) {
        data.technicalQuestions = data.technicalQuestions.map((q, index) => ({
            question: q.question || `Technical Question ${index + 1}`,
            intention: q.intention || "To assess technical knowledge and problem-solving skills",
            answer: q.answer || "This question tests your understanding of core concepts. Make sure to explain your thought process clearly and provide examples from your experience."
        }))
    } else {
        data.technicalQuestions = [
            {
                question: "Explain the difference between REST and GraphQL",
                intention: "To assess understanding of API architectures",
                answer: "REST is an architectural style with multiple endpoints for different resources. GraphQL is a query language with a single endpoint that allows clients to request specific data. REST is simpler and uses HTTP methods, while GraphQL provides more flexibility and reduces over-fetching. Choose REST for simple CRUD operations and GraphQL for complex data requirements."
            },
            {
                question: "How do you handle state management in React?",
                intention: "To evaluate frontend architecture knowledge",
                answer: "For local component state, I use useState. For shared state between components, I use Context API. For complex applications with global state, I use Redux or Zustand. I also use React Query for server state management. The choice depends on the application complexity and requirements."
            }
        ]
    }

    if (data.behavioralQuestions && Array.isArray(data.behavioralQuestions)) {
        data.behavioralQuestions = data.behavioralQuestions.map((q, index) => ({
            question: q.question || `Behavioral Question ${index + 1}`,
            intention: q.intention || "To assess soft skills and past experiences",
            answer: q.answer || "Use the STAR method: Situation, Task, Action, Result. Describe the context, your role, the actions you took, and the positive outcome. Focus on your contributions and what you learned."
        }))
    } else {
        data.behavioralQuestions = [
            {
                question: "Tell me about a time you had to deal with a difficult team member",
                intention: "To assess conflict resolution skills",
                answer: "Use STAR method. Situation: A team member disagreed with my approach. Task: Needed to complete the project on time. Action: I scheduled a one-on-one meeting, listened to their concerns, and found a compromise. Result: We delivered the project successfully and improved our working relationship."
            },
            {
                question: "Describe a project you're most proud of",
                intention: "To understand work quality and passion",
                answer: "Choose a relevant project. Explain the challenges, your role, the technologies used, and the impact. Focus on what you learned and how it demonstrates your skills. Quantify results where possible."
            }
        ]
    }

    if (data.skillGaps && Array.isArray(data.skillGaps)) {
        data.skillGaps = data.skillGaps.map(gap => {
            if (typeof gap === 'string') {
                return {
                    skill: gap,
                    severity: "medium"
                };
            }
            if (!gap.skill) {
                const skillName = gap.name || gap.title || gap.skillName || gap.skill_name;
                if (skillName) {
                    return {
                        skill: skillName,
                        severity: gap.severity || "medium"
                    };
                }
                return {
                    skill: "Unknown Skill",
                    severity: gap.severity || "medium"
                };
            }
            const validSeverity = gap.severity && ["low", "medium", "high"].includes(gap.severity)
                ? gap.severity
                : "medium";

            return {
                skill: gap.skill,
                severity: validSeverity
            };
        }).filter(gap => gap.skill && gap.skill.trim() !== "");
    }

    if (!data.skillGaps || !Array.isArray(data.skillGaps) || data.skillGaps.length === 0) {
        data.skillGaps = [
            { skill: "System Design", severity: "high" },
            { skill: "Database Optimization", severity: "medium" },
            { skill: "Testing Practices", severity: "low" }
        ]
    }

    if (!data.preparationPlan || !Array.isArray(data.preparationPlan) || data.preparationPlan.length === 0) {
        data.preparationPlan = [
            {
                day: 1,
                focus: "Data Structures Review",
                tasks: [
                    "Review arrays, linked lists, and trees",
                    "Solve 5 medium LeetCode problems",
                    "Practice explaining solutions out loud"
                ]
            },
            {
                day: 2,
                focus: "System Design Basics",
                tasks: [
                    "Study scalability concepts",
                    "Design a URL shortener",
                    "Understand load balancing and caching"
                ]
            },
            {
                day: 3,
                focus: "Behavioral Preparation",
                tasks: [
                    "Prepare 5 STAR stories",
                    "Practice common behavioral questions",
                    "Research company values and culture"
                ]
            }
        ]
    }

    return data
}

async function generatePdfFromHtml(htmlContent) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1200,800',
                '--single-process',
                '--no-zygote',
            ]
        });

        const page = await browser.newPage();

        await page.setViewport({
            width: 1200,
            height: 800
        });

        await page.setContent(htmlContent, {
            waitUntil: "networkidle0",
            timeout: 30000
        });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "10mm",
                bottom: "10mm",
                left: "15mm",
                right: "15mm"
            }
        });

        const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);

        console.log("PDF Buffer created:", {
            isBuffer: Buffer.isBuffer(buffer),
            length: buffer.length,
            signature: buffer.slice(0, 4).toString()
        });

        return buffer;

    } catch (error) {
        console.error("PDF Generation Error:", error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate a highly professional, 1-page ATS-friendly resume HTML for a candidate with the following details:

Resume Text: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

The response should be a JSON object with a single field "html" which contains the COMPLETE HTML content of the resume.

IMPORTANT DESIGN REQUIREMENTS:
1. EXTREMELY STRICT LAYOUT. You MUST use exactly this structure and CSS.
2. The entire document MUST fit on ONE single page. Do NOT make it verbose. Compress bullet points to 2-3 precise lines per item.

REQUIRED CSS AND HTML TEMPLATE (USE THIS EXACTLY):
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.25;
            color: #000;
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            font-size: 11px;
        }
        .header { text-align: center; margin-bottom: 6px; }
        h1 {
            font-size: 26px;
            color: #004d40; /* Teal/Blue color */
            margin-bottom: 2px;
            font-weight: bold;
        }
        .contact-info {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 12px;
            font-size: 11px;
            margin-bottom: 6px;
        }
        .contact-info span { color: #000; font-weight: 600; }
        h2.section-title {
            font-size: 13px;
            color: #004d40;
            margin: 8px 0 4px 0;
            padding-bottom: 2px;
            border-bottom: 1.5px solid #d4af37; /* Gold line */
            font-weight: bold;
            text-transform: capitalize;
        }
        .summary p { text-align: justify; margin-bottom: 6px; }
        .summary .summary-label { color: #004d40; font-weight: bold; }
        
        .skills-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            row-gap: 4px;
            column-gap: 20px;
            margin-bottom: 6px;
        }
        .skill-item { font-size: 11px; }
        .skill-item .bold { font-weight: bold; }

        .two-column {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
        }
        .two-column .left .bold { font-weight: bold; font-size: 12px; }
        .two-column .left .italic { font-style: italic; font-size: 11px; }
        .two-column .right { text-align: right; }
        
        ul { margin-left: 18px; margin-bottom: 6px; }
        li { font-size: 11px; margin-bottom: 2px; text-align: justify; }
        li .bold { font-weight: bold; } /* Use class="bold" to highlight important words in li */
        
        .item-container { margin-bottom: 6px; }
        .sub-desc { font-size: 11px; font-style: italic; margin-bottom: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>[Candidate Name]</h1>
        <div class="contact-info">
            <span>✉ [Email]</span> <span>|</span> <span>github.com/[github]</span> <span>|</span> <span>[linkedin/portfolio]</span>
        </div>
    </div>

    <!-- For Summary -->
    <div class="summary">
        <p><span class="summary-label">Summary — [Role Title]</span> [Short 2-3 line summary focusing on robust details]</p>
    </div>

    <h2 class="section-title">Technical Skills</h2>
    <div class="skills-grid">
        <div class="skill-item"><span class="bold">Frontend:</span> [Skills]</div>
        <div class="skill-item"><span class="bold">Backend:</span> [Skills]</div>
        <div class="skill-item"><span class="bold">Languages:</span> [Skills]</div>
        <div class="skill-item"><span class="bold">Database:</span> [Skills]</div>
        <div class="skill-item"><span class="bold">Tools:</span> [Skills]</div>
    </div>

    <h2 class="section-title">Education</h2>
    <div class="item-container">
        <div class="two-column">
            <div class="left"><span class="bold">[Institution]</span><br><span class="italic">[Degree]</span></div>
            <div class="right">[Location]<br>[Year]</div>
        </div>
    </div>

    <h2 class="section-title">Experience</h2>
    <div class="item-container">
        <div class="two-column">
            <div class="left"><span class="bold">[Company]</span><br><span class="italic">[Role]</span></div>
            <div class="right">[Dates]</div>
        </div>
        <ul>
            <li><span class="bold">Action verb</span> descriptive result.</li>
        </ul>
    </div>

    <h2 class="section-title">Projects</h2>
    <div class="item-container">
        <div class="two-column">
            <div class="left"><span class="bold">[Project Name]</span></div>
            <div class="right italic">[Tech Stack]</div>
        </div>
        <ul>
            <li><span class="bold">Action verb</span> descriptive result focusing on impact.</li>
        </ul>
    </div>

    <h2 class="section-title">Achievements</h2>
    <ul>
        <li><span class="bold">[Achievement Title]:</span> [Detail]</li>
    </ul>
</body>
</html>

Return ONLY raw JSON matching schema schema { "html": "<full html here>" } Without markdown blocks.`;

    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are an elite, highly precise resume formatter. You MUST strictly obey the specified CSS layout, do NOT change colors or border styles, use exactly the HTML structures shown. Fit everything into concise, dense text to keep it at 1 page. ALWAYS return valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 4096
        })

        const text = response.choices[0].message.content

        const cleaned = text
            .replace(/```json|```/g, "")
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
            .trim()

        let jsonContent;
        try {
            jsonContent = JSON.parse(cleaned)
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError)
            // Just use the explicit CSS fallback we gave it!
            jsonContent = {
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.25; color: #000; max-width: 800px; margin: 0 auto; background: #fff; font-size: 11px; padding: 10px; }
        .header { text-align: center; margin-bottom: 6px; }
        h1 { font-size: 26px; color: #004d40; margin-bottom: 2px; font-weight: bold; }
        .contact-info { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; font-size: 11px; margin-bottom: 6px; }
        .contact-info span { color: #000; font-weight: 600; }
        h2.section-title { font-size: 13px; color: #004d40; margin: 8px 0 4px 0; padding-bottom: 2px; border-bottom: 1.5px solid #d4af37; font-weight: bold; text-transform: capitalize; }
        .summary p { text-align: justify; margin-bottom: 6px; }
        .summary .summary-label { color: #004d40; font-weight: bold; }
        .skills-grid { display: grid; grid-template-columns: 1fr 1fr; row-gap: 4px; column-gap: 20px; margin-bottom: 6px; }
        .skill-item { font-size: 11px; }
        .skill-item .bold { font-weight: bold; }
        .two-column { display: flex; justify-content: space-between; align-items: baseline; }
        .two-column .left .bold { font-weight: bold; font-size: 12px; }
        .two-column .left .italic { font-style: italic; font-size: 11px; }
        .two-column .right { text-align: right; }
        ul { margin-left: 18px; margin-bottom: 6px; }
        li { font-size: 11px; margin-bottom: 2px; text-align: justify; }
        li .bold { font-weight: bold; }
        .item-container { margin-bottom: 6px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Adarsh Kumar</h1>
        <div class="contact-info">
            <span>✉ adarsh99733207@gmail.com</span> <span>|</span> <span>github.com/Adshkumar</span> <span>|</span> <span>adsingh-portfolio.vercel.app</span>
        </div>
    </div>
    <div class="summary">
        <p><span class="summary-label">Summary — Full-Stack Developer</span> skilled in the MERN stack, building scalable web applications and real-time systems with a focus on clean architecture and performance.</p>
    </div>
    <h2 class="section-title">Technical Skills</h2>
    <div class="skills-grid">
        <div class="skill-item"><span class="bold">Frontend:</span> JavaScript, React, HTML5 & CSS3</div>
        <div class="skill-item"><span class="bold">Database:</span> MongoDB (Mongoose)</div>
        <div class="skill-item"><span class="bold">Backend:</span> Node.js, Express.js, MongoDB</div>
        <div class="skill-item"><span class="bold">Tools:</span> GitHub, VS Code, Postman</div>
        <div class="skill-item"><span class="bold">Languages:</span> C++, JavaScript</div>
        <div class="skill-item"><span class="bold">Others:</span> Data Structures & Algorithms</div>
    </div>
    <h2 class="section-title">Education</h2>
    <div class="item-container">
        <div class="two-column"><div class="left"><span class="bold">Chhotu Ram Rural Institute of Technology</span><br><span class="italic">Diploma in Computer Science</span></div><div class="right">New Delhi, Delhi<br>2024 – Present</div></div>
    </div>
    <div class="item-container">
        <div class="two-column"><div class="left"><span class="bold">Kids Camp International School</span><br><span class="italic">Class X (CBSE) — 78%</span></div><div class="right">Muzaffarpur, Bihar<br>2024</div></div>
    </div>

    <h2 class="section-title">Experience</h2>
    <div class="item-container">
        <div class="two-column"><div class="left"><span class="bold">AKM TECHIE</span><br><span class="italic">Frontend Web Development Intern</span></div><div class="right">June 2025 – July 2025</div></div>
        <ul>
            <li><span class="bold">Developed</span> a multi-page responsive website with modern UI components including admin dashboard, client portal, and service pages</li>
            <li><span class="bold">Created custom CSS styling</span> ensuring visual consistency and responsive design across all devices</li>
            <li><span class="bold">Implemented interactive user interfaces</span> for contact forms, service demonstrations, and business statistics display</li>
        </ul>
    </div>

    <h2 class="section-title">Projects</h2>
    <div class="item-container">
        <div class="two-column"><div class="left"><span class="bold">AI Interview Preparation Platform</span></div><div class="right italic">React.js, Node.js, Express.js, MongoDB, JWT, REST API</div></div>
        <ul>
            <li><span class="bold">Engineered a full-stack AI-powered interview preparation platform</span> enabling resume uploads and automated interview report generation from job descriptions</li>
            <li><span class="bold">Built a modular MVC backend architecture</span> (controllers, routes, models, middleware, services) ensuring scalability and maintainability</li>
            <li><span class="bold">Integrated JWT authentication with protected routes</span> for secure user sessions and API access</li>
            <li><span class="bold">Leveraged AI services</span> for resume analysis and intelligent interview report generation</li>
        </ul>
    </div>
    <div class="item-container">
        <div class="two-column"><div class="left"><span class="bold">Uber-Backend System</span></div><div class="right italic">Node.js, Express.js, MongoDB, Socket.IO, Razorpay</div></div>
        <ul>
            <li><span class="bold">Designed and developed a scalable ride-booking backend system</span> with user authentication, ride lifecycle management, and driver assignment</li>
            <li><span class="bold">Implemented real-time communication using Socket.IO</span> for ride requests, driver notifications, and live status updates</li>
        </ul>
    </div>

    <h2 class="section-title">Achievements</h2>
    <ul>
        <li><span class="bold">LeetCode Badge:</span> Earned problem-solving badge for consistent performance and coding proficiency</li>
        <li><span class="bold">Project Portfolio:</span> Delivered 4+ full-stack projects with real-time features and production-ready code</li>
    </ul>
</body>
</html>`
            }
        }

        const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error("Generated PDF buffer is empty");
        }

        return pdfBuffer;

    } catch (error) {
        console.error("Resume PDF generation error:", error);
        throw error;
    }
}

module.exports = { generateInterviewReport, generateResumePdf }



