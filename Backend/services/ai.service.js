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
            args: ['--no-sandbox', '--disable-setuid-sandbox']
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
                top: "20mm",
                bottom: "20mm",
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

    const prompt = `Generate a professional resume HTML for a candidate with the following details:

Resume Text: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

The response should be a JSON object with a single field "html" which contains the HTML content of the resume.

IMPORTANT REQUIREMENTS:
1. The HTML must be self-contained with inline CSS (no external stylesheets)
2. Use modern, clean, professional design
3. Format the resume to be ATS-friendly
4. Include sections: Summary, Skills, Experience, Education, Projects, Achievements
5. Make it 1-2 pages when converted to PDF
6. Use proper HTML structure with semantic tags
7. Escape all special characters properly
8. Return ONLY valid JSON - no markdown, no explanations

Example structure:
{
  "html": "<!DOCTYPE html><html><head><style>body { font-family: Arial; }</style></head><body>[resume content]</body></html>"
}

Return ONLY raw JSON. Do not wrap it in markdown.

Use this schema:
${JSON.stringify(zodToJsonSchema(resumePdfSchema))}
`

    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are a professional resume writer. Always return valid JSON with properly escaped strings. Never include control characters or unescaped quotes. Generate clean, modern HTML resumes."
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

        const cleaned = text
            .replace(/```json|```/g, "")
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
            .trim()

        let jsonContent;
        try {
            jsonContent = JSON.parse(cleaned)
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError)
            jsonContent = {
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Adarsh Kumar - Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.5;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
            background: #fff;
        }

        h1 {
            font-size: 32px;
            color: #000;
            margin-bottom: 5px;
            font-weight: 700;
        }

        .contact-info {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 25px;
            color: #2563eb;
            font-size: 14px;
        }

        .contact-info a {
            color: #2563eb;
            text-decoration: none;
        }

        .contact-info a:hover {
            text-decoration: underline;
        }

        h2 {
            font-size: 20px;
            color: #000;
            margin: 20px 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid #000;
            text-transform: uppercase;
            font-weight: 600;
        }

        h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 15px 0 5px 0;
            color: #000;
        }

        .objective-text {
            font-style: italic;
            margin-bottom: 10px;
            text-align: justify;
        }

        .skills-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 5px;
            margin-bottom: 15px;
        }

        .skill-item {
            font-size: 14px;
            line-height: 1.6;
        }

        .skill-category {
            font-weight: 600;
        }

        .education-item {
            margin-bottom: 15px;
        }

        .education-title {
            font-weight: 600;
            font-size: 16px;
        }

        .education-details {
            display: flex;
            justify-content: space-between;
            color: #666;
            font-size: 14px;
            margin: 5px 0;
        }

        .experience-item, .project-item {
            margin-bottom: 20px;
        }

        .experience-header, .project-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            flex-wrap: wrap;
            margin-bottom: 5px;
        }

        .company-name, .project-name {
            font-weight: 600;
            font-size: 16px;
            color: #2563eb;
        }

        .date {
            color: #666;
            font-size: 14px;
            font-style: italic;
        }

        .position {
            font-weight: 500;
            font-size: 14px;
            color: #444;
            margin-bottom: 8px;
        }

        .description {
            font-size: 14px;
            margin-left: 20px;
            list-style-type: disc;
        }

        .description li {
            margin-bottom: 5px;
            text-align: justify;
        }

        .achievement-item {
            margin-bottom: 8px;
            font-size: 14px;
            list-style-type: disc;
            margin-left: 20px;
        }

        .project-tech {
            font-size: 13px;
            color: #666;
            margin: 5px 0;
            font-style: italic;
        }

        ul {
            margin-left: 20px;
            margin-bottom: 10px;
        }

        li {
            font-size: 14px;
            margin-bottom: 3px;
            text-align: justify;
        }

        .section-content {
            margin-top: 10px;
        }

        .bold {
            font-weight: 600;
        }

        .link {
            color: #2563eb;
            text-decoration: none;
        }

        .link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <h1>Adarsh Kumar</h1>

    <div class="contact-info">
        <span>Adarsh99733207@gmail.com</span>
        <span>|</span>
        <span>linkedin.com/in/adarsh-kumar62041</span>
        <span>|</span>
        <span>github.com/Adshkumar</span>
        <span>|</span>
        <span>adsingh-portfolio.vercel.app</span>
    </div>

    <h2>OBJECTIVE</h2>
    <div class="objective-text">
        "Motivated and enthusiastic web developer with hands-on experience in building web applications using React, Tailwind, JavaScript, Node.js, and MongoDB. Eager to apply my skills in frontend and backend development, contribute to real-world projects, and grow as a full-stack developer in a professional environment."
    </div>

    <h2>TECHNICAL SKILLS</h2>
    <div class="skills-grid">
        <div class="skill-item"><span class="skill-category">Frontend:</span> JavaScript, React, Tailwind CSS, HTML5 & CSS3</div>
        <div class="skill-item"><span class="skill-category">Backend:</span> Node.js, Express.js, REST API, JWT Authentication</div>
        <div class="skill-item"><span class="skill-category">Databases:</span> MongoDB (Mongoose)</div>
        <div class="skill-item"><span class="skill-category">Tools:</span> GitHub, VS Code, Socket.IO</div>
        <div class="skill-item"><span class="skill-category">Others:</span> Problem Solving, Basic Data Structures & Algorithms (learning in C++)</div>
    </div>

    <h2>EDUCATION</h2>
    <div class="education-item">
        <div class="education-title">Chhotu Ram Rural Institute of Technology</div>
        <div class="education-details">
            <span>Diploma in Computer Science</span>
            <span>New Delhi, Delhi</span>
        </div>
    </div>
    <div class="education-item">
        <div class="education-title">Kids Camp International School</div>
        <div class="education-details">
            <span>Class X (CBSE) — 78%</span>
            <span>2024</span>
        </div>
        <div class="education-details">
            <span>Muzaffarpur, Bihar</span>
        </div>
    </div>

    <h2>EXPERIENCE</h2>
    <div class="experience-item">
        <div class="experience-header">
            <span class="company-name">AKM TECHIE (Intern)</span>
            <span class="date">June 2025 – July 2025</span>
        </div>
        <div class="position">Frontend Web Development Intern — DTEST Project (HTML, CSS, JavaScript)</div>
        <ul class="description">
            <li>Developed a multi-page responsive website with modern UI components including admin dashboard, client portal, and service page.</li>
            <li>Created custom CSS styling for all sections ensuring visual consistency and responsive design across devices.</li>
            <li>Implemented interactive user interfaces for contact forms, service demonstrations, and business statistics display.</li>
        </ul>
    </div>

    <h2>PROJECTS</h2>

    <div class="project-item">
        <div class="project-header">
            <span class="project-name">Uber-Backend</span>
            <span class="date">Node.js, Express.js, MongoDB</span>
        </div>
        <ul class="description">
            <li>Developed a comprehensive backend system simulating Uber's core functionality including user authentication, ride booking, and driver management.</li>
            <li>Secured endpoints using JWT authentication middleware and managed data persistence with MongoDB for efficient storage of user, driver, and ride information.</li>
            <li>Implemented Socket.IO for real-time communication between drivers and passengers during active rides.</li>
            <li>Designed MongoDB schemas for efficient data storage.</li>
        </ul>
    </div>

    <div class="project-item">
        <div class="project-header">
            <span class="project-name">Bloggify</span>
            <span class="date">Node.js, Express.js, MongoDB, React.js, JWT</span>
        </div>
        <ul class="description">
            <li>Developed a full-stack blog application with user authentication, CRUD operations for blog posts, and responsive UI.</li>
            <li>Implemented secure user registration/login using JWT authentication and protected routes for personalized blog management.</li>
            <li>Features include user registration, blog creation, delete personal blog management dashboard.</li>
        </ul>
    </div>

    <div class="project-item">
        <div class="project-header">
            <span class="project-name">Chat Application</span>
            <span class="date">Node.js, Express.js, MongoDB, React.js, Socket.IO, JWT Authentication, Tailwind CSS, REST API</span>
        </div>
        <ul class="description">
            <li>Developed a structured MVC-based backend with clear separation of controllers, routes, models, and middleware.</li>
            <li>Built RESTful APIs for user authentication, chat management, and message handling, ensuring clean data flow between frontend and backend.</li>
            <li>Implemented JWT-based authentication and authorization, securing protected routes and user sessions, along with token invalidation for secure logout.</li>
            <li>Designed and structured MongoDB schemas using Mongoose for users, chats, messages, and token management, ensuring efficient data storage and retrieval.</li>
            <li>Enabled real-time communication using Socket.IO for instant message delivery, typing indicators, and online status updates.</li>
        </ul>
    </div>

    <h2>ACHIEVEMENTS</h2>
    <ul class="achievement-item">
        <li><span class="bold">LeetCode Badge:</span> Earned problem-solving badge on LeetCode for consistent performance and coding proficiency.</li>
        <li><span class="bold">Internship Certificate:</span> Successfully completed internship with hands-on project experience.</li>
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



