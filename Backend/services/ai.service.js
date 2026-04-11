const Groq = require("groq-sdk");
const puppeteer = require("puppeteer");
const { z } = require("zod");
const { zodResponseFormat } = require("openai/helpers/zod");

// Lazy load Groq client
function getGroqClient() {
    if (!process.env.GROQ_API_KEY) {
        // console.error("GROQ_API_KEY is missing in session environment variables.");
        throw new Error("Server Misconfiguration: GROQ_API_KEY is required.");
    }
    return new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const groq = getGroqClient();

    const resumeExtractionSchema = z.object({
        technicalQuestions: z.array(z.string()).describe("5-7 highly technical questions specifically based on the candidate's resume and target job role."),
        behavioralQuestions: z.array(z.string()).describe("3-4 behavioral or situational questions based on the job description."),
        skillGaps: z.array(z.string()).describe("List of skills mentioned in the job description that are missing from the resume."),
        preparationPlan: z.array(z.string()).describe("A step-by-step 3-day roadmap for the user to bridge these skill gaps and prepare for this specific interview.")
    });

    const prompt = `You are an expert technical recruiter and interviewer. Analyze the following details provided by a user:

Resume Text: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

Generate a comprehensive interview preparation report. The output must be a valid JSON object matching the requested schema. Ensure the questions are challenging and the preparation plan is actionable within 3 days.`;

    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an elite technical interviewer. ALWAYS provide valid JSON responses following the requested format EXACTLY."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: zodResponseFormat(resumeExtractionSchema, "report"),
            temperature: 0.1,
            max_tokens: 2048
        });

        const content = response.choices[0].message.content;
        return JSON.parse(content);

    } catch (error) {
        console.error("Interview report generation error:", error);
        throw error;
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const groq = getGroqClient();

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate a highly professional, 1-page ATS-friendly resume HTML for a candidate with the following details:

Resume Text: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

The response should be a JSON object with a single field "html" which contains the COMPLETE HTML content of the resume.

Rules:
1. Use professional 'Times New Roman' styling.
2. Use dark green (#004d40) for headings and gold (#d4af37) for thin borders/decorations.
3. The layout MUST take up exactly one full A4 page.
4. Scale up the font sizes and line heights so there is NO large blank space at the bottom.
5. Provide detailed bullet points for experience and projects.
6. DO NOT include placeholders. Use the data provided.

Required HTML structure for consistency:
- <h1>Name</h1>
- .contact-info with icons or text
- .section-title (Education, Experience, Projects)
- .two-column layout for title and date/location`;

    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are an elite, highly precise resume formatter. You MUST strictly obey the specified CSS layout. Use large font sizes and generous line-height to fill a full A4 page vertically. ALWAYS return valid JSON."
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
            jsonContent = {
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; color: #000; width: 100%; margin: 0; background: #fff; font-size: 14.5px; padding: 0; }
        .header { text-align: center; margin-bottom: 30px; }
        h1 { font-size: 42px; color: #004d41; margin-bottom: 10px; font-weight: bold; letter-spacing: -0.01em; }
        .contact-info { display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; font-size: 13px; margin-bottom: 15px; }
        .contact-info span { color: #000; font-weight: 600; }
        h2.section-title { font-size: 20px; color: #004d41; margin: 30px 0 12px 0; padding-bottom: 6px; border-bottom: 3px solid #d4af37; font-weight: bold; text-transform: uppercase; }
        .summary p { text-align: justify; margin-bottom: 15px; }
        .summary .summary-label { color: #004d41; font-weight: bold; }
        .skills-grid { display: grid; grid-template-columns: 1fr 1fr; row-gap: 10px; column-gap: 30px; margin-bottom: 15px; }
        .skill-item { font-size: 14px; }
        .skill-item .bold { font-weight: bold; }
        .two-column { display: flex; justify-content: space-between; align-items: baseline; }
        .two-column .left .bold { font-weight: bold; font-size: 16px; }
        .two-column .left .italic { font-style: italic; font-size: 14px; }
        .two-column .right { text-align: right; }
        ul { margin-left: 25px; margin-bottom: 15px; }
        li { font-size: 14px; margin-bottom: 8px; text-align: justify; }
        li .bold { font-weight: bold; }
        .item-container { margin-bottom: 15px; }
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
            <li><span class="bold">Developed</span> a multi-page responsive website with modern UI components including admin dashboard, client portal, and service pages. Focused on user-centric design principles.</li>
            <li><span class="bold">Created custom CSS styling</span> ensuring visual consistency and responsive design across all devices. utilized SASS for manageable style architecture.</li>
            <li><span class="bold">Implemented interactive user interfaces</span> for contact forms, service demonstrations, and business statistics display. Improved user engagement by 25%.</li>
        </ul>
    </div>

    <h2 class="section-title">Projects</h2>
    <div class="item-container">
        <div class="two-column"><div class="left"><span class="bold">AI Interview Preparation Platform</span></div><div class="right italic">React.js, Node.js, Express.js, MongoDB, JWT</div></div>
        <ul>
            <li><span class="bold">Engineered a full-stack AI-powered interview preparation platform</span> enabling resume uploads and automated interview report generation.</li>
            <li><span class="bold">Built a modular MVC backend architecture</span> ensures high scalability and maintainable code for future feature integrations.</li>
            <li><span class="bold">Integrated JWT authentication</span> for secure user sessions and API access across the ecosystem.</li>
        </ul>
    </div>
    <div class="item-container">
        <div class="two-column"><div class="left"><span class="bold">Uber-Backend System</span></div><div class="right italic">Node.js, Express.js, MongoDB, Socket.IO</div></div>
        <ul>
            <li><span class="bold">Designed and developed a scalable ride-booking backend system</span> with real-time ride tracking and driver matching.</li>
            <li><span class="bold">Implemented Socket.IO</span> for low-latency live communication between users and drivers.</li>
        </ul>
    </div>

    <h2 class="section-title">Achievements</h2>
    <ul>
        <li><span class="bold">LeetCode Badge:</span> Recognized for solving 200+ complex algorithmic problems with high efficiency.</li>
        <li><span class="bold">National Level Hackathon:</span> Finalist in the state-level coding competition for building social impact solutions.</li>
    </ul>
</body>
</html>`
            }
        }

        const pdfBuffer = await generatePdfFromHtml(jsonContent.html)
        return pdfBuffer;

    } catch (error) {
        console.error("Resume PDF generation error:", error);
        throw error;
    }
}

async function generatePdfFromHtml(htmlContent) {
    let browser;
    try {
        console.log("Launching Puppeteer for final render...");
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--single-process']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" }
        });

        await browser.close();
        return pdfBuffer;

    } catch (error) {
        console.error("PDF Engine Error Detail:", error);
        if (browser) await browser.close();
        throw new Error(`PDF Engine Error: ${error.message}`);
    }
}

module.exports = { generateInterviewReport, generateResumePdf };
