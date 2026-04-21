const Groq = require("groq-sdk");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");


let _groq = null;
function getGroqClient() {
    if (!_groq) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY environment variable is not set. Please add it to your Render dashboard.");
        }
        _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return _groq;
}

function parseAIJson(text) {
    const cleaned = text.replace(/```json|```/g, "").trim()
    return JSON.parse(cleaned)
}

const interviewReportSchema = z.object({
    matchScore: z.number(),
    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),
    behavioralQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),
    skillGaps: z.array(z.object({
        skill: z.string(),
        severity: z.enum(["low", "medium", "high"])
    })),
    preparationPlan: z.array(z.object({
        day: z.number(),
        focus: z.string(),
        tasks: z.array(z.string())
    })),
    interviewTips: z.array(z.string()),
    cheatSheet: z.array(z.object({
        topic: z.string(),
        content: z.string()
    })),
    jobDescriptionAnalysis: z.object({
        techStack: z.array(z.string()),
        coreResponsibilities: z.array(z.string()),
        keyQualifications: z.array(z.string())
    }),
    weaknessAnalysis: z.array(z.object({
        weakness: z.string(),
        improvement: z.string(),
        priority: z.enum(["low", "medium", "high"])
    })),
    title: z.string(),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const jsonExample = {
        matchScore: 85,
        title: "Senior Software Engineer",
        technicalQuestions: [
            { question: "...", intention: "...", answer: "..." },
            { question: "...", intention: "...", answer: "..." },
            { question: "...", intention: "...", answer: "..." },
            { question: "...", intention: "...", answer: "..." },
            { question: "...", intention: "...", answer: "..." },
            { question: "...", intention: "...", answer: "..." },
            { question: "...", intention: "...", answer: "..." },
            { question: "...", intention: "...", answer: "..." }
        ],
        behavioralQuestions: [
            { question: "...", intention: "...", answer: "..." },
            { question: "...", intention: "...", answer: "..." },
            { question: "...", intention: "...", answer: "..." },
            { question: "...", intention: "...", answer: "..." },
            { question: "...", intention: "...", answer: "..." },
            { question: "...", intention: "...", answer: "..." },
            { question: "...", intention: "...", answer: "..." },
            { question: "...", intention: "...", answer: "..." }
        ],
        skillGaps: [{ skill: "...", severity: "high" }],
        preparationPlan: [
            { day: 1, focus: "...", tasks: ["...", "..."] },
            { day: 2, focus: "...", tasks: ["...", "..."] },
            { day: 3, focus: "...", tasks: ["...", "..."] },
            { day: 4, focus: "...", tasks: ["...", "..."] },
            { day: 5, focus: "...", tasks: ["...", "..."] },
            { day: 6, focus: "...", tasks: ["...", "..."] },
            { day: 7, focus: "...", tasks: ["...", "..."] },
            { day: 8, focus: "...", tasks: ["...", "..."] },
            { day: 9, focus: "...", tasks: ["...", "..."] },
            { day: 10, focus: "...", tasks: ["...", "..."] },
            { day: 11, focus: "...", tasks: ["...", "..."] },
            { day: 12, focus: "...", tasks: ["...", "..."] },
            { day: 13, focus: "...", tasks: ["...", "..."] },
            { day: 14, focus: "...", tasks: ["...", "..."] }
        ],
        interviewTips: ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5", "Tip 6", "Tip 7", "Tip 8"],
        skillGaps: [
            { skill: "Skill 1", severity: "high" },
            { skill: "Skill 2", severity: "medium" },
            { skill: "Skill 3", severity: "high" },
            { skill: "Skill 4", severity: "low" }
        ],
        weaknessAnalysis: [
            { weakness: "Gap 1", improvement: "...", priority: "high" },
            { weakness: "Gap 2", improvement: "...", priority: "medium" },
            { weakness: "Gap 3", improvement: "...", priority: "high" },
            { weakness: "Gap 4", improvement: "...", priority: "medium" },
            { weakness: "Gap 5", improvement: "...", priority: "low" },
            { weakness: "Gap 6", improvement: "...", priority: "medium" }
        ],
        cheatSheet: [
            { topic: "Topic 1", content: "..." },
            { topic: "Topic 2", content: "..." },
            { topic: "Topic 3", content: "..." },
            { topic: "Topic 4", content: "..." },
            { topic: "Topic 5", content: "..." },
            { topic: "Topic 6", content: "..." }
        ],
        dsaAnalysis: [
            {
                pattern: "Pattern 1",
                description: "...",
                questions: [
                    { title: "Q1", easy: "...", link: "...", keyConcept: "..." },
                    { title: "Q2", easy: "...", link: "...", keyConcept: "..." },
                    { title: "Q3", medium: "...", link: "...", keyConcept: "..." },
                    { title: "Q4", hard: "...", link: "...", keyConcept: "..." },
                    { title: "Q5", easy: "...", link: "...", keyConcept: "..." },
                    { title: "Q6", medium: "...", link: "...", keyConcept: "..." },
                    { title: "Q7", hard: "...", link: "...", keyConcept: "..." },
                    { title: "Q8", easy: "...", link: "...", keyConcept: "..." },
                    { title: "Q9", medium: "...", link: "...", keyConcept: "..." },
                    { title: "Q10", hard: "...", link: "...", keyConcept: "..." },
                    { title: "Q11", easy: "...", link: "...", keyConcept: "..." },
                    { title: "Q12", medium: "...", link: "...", keyConcept: "..." },
                    { title: "Q13", hard: "...", link: "...", keyConcept: "..." },
                    { title: "Q14", easy: "...", link: "...", keyConcept: "..." },
                    { title: "Q15", difficulty: "...", link: "...", keyConcept: "..." },
                    { title: "Q16", difficulty: "...", link: "...", keyConcept: "..." },
                    { title: "Q17", difficulty: "...", link: "...", keyConcept: "..." },
                    { title: "Q18", medium: "...", link: "...", keyConcept: "..." },
                    { title: "Q19", hard: "...", link: "...", keyConcept: "..." },
                    { title: "Q20", easy: "...", link: "...", keyConcept: "..." },
                ]
            }
        ]
    };

    const prompt = `Generate a HIGH-INTENSITY MNC Interview Blueprint for:

CONTEXT:
Resume: ${resume || "Not provided"}
Job Description/Title: ${jobDescription || "General Software Role"}
Self Description: ${selfDescription || "Not provided"}

STRICT QUANTITY & CONTENT REQUIREMENTS:
1. TECHNICAL QUESTIONS: Exactly 8 specialized questions. For each question, the 'intention' and 'answer' MUST be comprehensive (at least 4-5 detailed lines each).
2. BEHAVIORAL QUESTIONS: Exactly 8 STAR-method based questions. For each question, the 'intention' and 'answer' MUST be comprehensive (at least 4-5 detailed lines each).
3. PREPARATION PLAN: A full 14-DAY study roadmap. 
    - For each day, provide a focus area and 3-5 specific tasks.
4. EXPERT TIPS: At least 8-10 high-stakes interview strategy tips.
    - For each tip, provide a detailed explanation.
5. SKILL GAPS: Generate 8-10 specific technology or methodology keywords that are missing from the resume but required by the JD.
6. CRITICAL GAP ANALYSIS: Exactly 5-6 high-impact vulnerabilities. Compare the Resume against the Job Description specifically to find what is MISSING. For each gap, provide a detailed 'improvement' strategy.
    - For each gap, provide a detailed explanation.
7. TECHNICAL MASTERY (CHEAT SHEET): A list of 8-10 core technical topics the candidate MUST master specifically for this role based on their resume gaps.
8. DSA MASTERY SECTION (CRITICAL): Generate 8-10 algorithmic PATTERNS (e.g., Sliding Window, Two Pointers, BFS/DFS, DP, Graphs, Greedy, LINKED LIST, HEAP, BINARY SEARCH etc).
   - For each pattern, provide 5-7 most frequent questions asked in MNCs (Google, Meta, Amazon).
   - Include difficulty, a brief concept hint, and a placeholder LeetCode link.

OUTPUT RULES:
1. Return ONLY a JSON object.
2. Follow this structure EXACTLY (ensure intention and answer are long-form):
${JSON.stringify(jsonExample, null, 2)}

NO PREAMBLE. NO MARKDOWN. ONLY JSON.`;

    const response = await getGroqClient().chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system",
                content: "You are an elite Tech Interview Coach. You output strict JSON based on Resume/JD analysis."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 4096
    });

    const text = response.choices[0].message.content;
    let data = parseAIJson(text);


    if (!data.title) data.title = jobDescription || "Interview Preparation Plan";

    if (!data.skillGaps || !Array.isArray(data.skillGaps) || data.skillGaps.length === 0) {
        data.skillGaps = [
            { skill: "Cloud Native Architecture", severity: "high" },
            { skill: "Distributed Systems", severity: "high" },
            { skill: "High-Scale Traffic Handling", severity: "medium" },
            { skill: "Advanced Security Protocols", severity: "medium" },
            { skill: "CI/CD Pipeline Mastery", severity: "low" }
        ];
    }

    if (!data.technicalQuestions || !Array.isArray(data.technicalQuestions) || data.technicalQuestions.length === 0) {
        data.technicalQuestions = [
            {
                question: "Explain your process for architectural decision making in a multi-tenant environment.",
                intention: "This question seeks to evaluate your ability to think cross-functionally and understand long-term impacts of system design. It assesses your proficiency in data isolation, security modeling, and resource management across different user tiers. The interviewer is looking for a structured approach that balances scalability with complexity and cost-efficiency.",
                answer: "I start by rigorously gathering multi-dimensional requirements, focusing on isolation patterns and scalability limits. I evaluate trade-offs between shared and siloed architectures, considering factors like regulatory compliance and operational overhead for each tenant. My process involves creating a high-fidelity proof-of-concept to validate the chosen isolation strategy before committing to full-scale development. Finally, I present the architectural blueprint to cross-functional stakeholders, incorporating feedback on security, performance, and maintenance."
            },
            {
                question: "How would you optimize a large-scale React application suffering from frequent re-renders?",
                intention: "The objective is to test your deep understanding of the React reconciliation process and your ability to diagnose performance bottlenecks using profiling tools. The interviewer wants to see if you can distinguish between state-driven updates and unnecessary component cycles. It also evaluates your knowledge of advanced patterns like memoization and context-splitting.",
                answer: "I begin by using the React Profiler to identify exactly which components are re-rendering and the specific props triggering those updates. Once the bottlenecks are located, I implement strategic memoization using React.memo and useMemo for heavy computations or reference-based props. I also look for 'State Lifting' issues and consider moving state closer to where it is used or splitting large contexts into smaller, targeted pieces. For list-heavy applications, I implement virtualization techniques to ensure only visible items are rendered, drastically reducing the DOM burden."
            }
        ];
    }

    if (!data.dsaAnalysis || !Array.isArray(data.dsaAnalysis) || data.dsaAnalysis.length === 0) {
        data.dsaAnalysis = [
            {
                pattern: "Heap / Priority Queue",
                description: "Used for efficiently retrieving min/max elements. Common in Top-K, scheduling, and greedy optimization problems.",
                questions: [
                    { title: "Top K Frequent Elements", difficulty: "Medium", link: "https://leetcode.com/problems/top-k-frequent-elements/", keyConcept: "Min Heap + Frequency Map" },
                    { title: "Kth Largest Element in an Array", difficulty: "Medium", link: "https://leetcode.com/problems/kth-largest-element-in-an-array/", keyConcept: "Heap / Quick Select" },
                    { title: "Find Median from Data Stream", difficulty: "Hard", link: "https://leetcode.com/problems/find-median-from-data-stream/", keyConcept: "Two Heaps (Max + Min)" },
                    { title: "Merge k Sorted Lists", difficulty: "Hard", link: "https://leetcode.com/problems/merge-k-sorted-lists/", keyConcept: "Min Heap" },
                    { title: "Task Scheduler", difficulty: "Medium", link: "https://leetcode.com/problems/task-scheduler/", keyConcept: "Greedy + Max Heap" }
                ]
            },
            {
                pattern: "Linked List",
                description: "Involves pointer manipulation like reversing, merging, cycle detection, and node traversal.",
                questions: [
                    { title: "Reverse Linked List", difficulty: "Easy", link: "https://leetcode.com/problems/reverse-linked-list/", keyConcept: "Iterative Pointer Reversal" },
                    { title: "Linked List Cycle", difficulty: "Easy", link: "https://leetcode.com/problems/linked-list-cycle/", keyConcept: "Floyd’s Cycle Detection" },
                    { title: "Merge Two Sorted Lists", difficulty: "Easy", link: "https://leetcode.com/problems/merge-two-sorted-lists/", keyConcept: "Two Pointer Merge" },
                    { title: "Remove Nth Node From End", difficulty: "Medium", link: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/", keyConcept: "Two Pointer Gap Technique" },
                    { title: "Reverse Nodes in k-Group", difficulty: "Hard", link: "https://leetcode.com/problems/reverse-nodes-in-k-group/", keyConcept: "Group Reversal + Recursion" }
                ]
            },
            {
                pattern: "Two Pointers",
                description: "Optimizes problems on sorted arrays or strings by using two indices instead of nested loops.",
                questions: [
                    { title: "Two Sum II - Input Array Is Sorted", difficulty: "Medium", link: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/", keyConcept: "Left-Right Pointer Movement" },
                    { title: "3Sum", difficulty: "Medium", link: "https://leetcode.com/problems/3sum/", keyConcept: "Sorting + Two Pointer" },
                    { title: "Container With Most Water", difficulty: "Medium", link: "https://leetcode.com/problems/container-with-most-water/", keyConcept: "Greedy Two Pointer" },
                    { title: "Remove Duplicates from Sorted Array", difficulty: "Easy", link: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/", keyConcept: "Slow-Fast Pointer" },
                    { title: "Valid Palindrome", difficulty: "Easy", link: "https://leetcode.com/problems/valid-palindrome/", keyConcept: "Two Pointer String Check" }
                ]
            },
            {
                pattern: "Binary Search",
                description: "Efficient searching technique on sorted data or search space problems using divide and conquer.",
                questions: [
                    { title: "Binary Search", difficulty: "Easy", link: "https://leetcode.com/problems/binary-search/", keyConcept: "Classic Binary Search" },
                    { title: "Search in Rotated Sorted Array", difficulty: "Medium", link: "https://leetcode.com/problems/search-in-rotated-sorted-array/", keyConcept: "Modified Binary Search" },
                    { title: "Find First and Last Position", difficulty: "Medium", link: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/", keyConcept: "Lower & Upper Bound" },
                    { title: "Search a 2D Matrix", difficulty: "Medium", link: "https://leetcode.com/problems/search-a-2d-matrix/", keyConcept: "Flattened Binary Search" },
                    { title: "Koko Eating Bananas", difficulty: "Medium", link: "https://leetcode.com/problems/koko-eating-bananas/", keyConcept: "Binary Search on Answer" }
                ]
            },
            {
                pattern: "In-place Manipulation",
                description: "Modifies the input data structure directly without extra space.",
                questions: [
                    { title: "Move Zeroes", difficulty: "Easy", link: "https://leetcode.com/problems/move-zeroes/", keyConcept: "Two Pointer Swap" },
                    { title: "Sort Colors", difficulty: "Medium", link: "https://leetcode.com/problems/sort-colors/", keyConcept: "Dutch National Flag" },
                    { title: "Next Permutation", difficulty: "Medium", link: "https://leetcode.com/problems/next-permutation/", keyConcept: "Greedy + Reverse" },
                    { title: "Rotate Array", difficulty: "Medium", link: "https://leetcode.com/problems/rotate-array/", keyConcept: "Reversal Algorithm" },
                    { title: "Set Matrix Zeroes", difficulty: "Medium", link: "https://leetcode.com/problems/set-matrix-zeroes/", keyConcept: "In-place Marking" }
                ]
            },

            {
                pattern: "Sliding Window",
                description: "Efficient for subarray/substring problems.",
                questions: [
                    { title: "Maximum Sum Subarray of Size K", difficulty: "Easy", link: "https://leetcode.com/problems/maximum-average-subarray-i/", keyConcept: "Fixed Window" },
                    { title: "Longest Substring Without Repeating Characters", difficulty: "Medium", link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", keyConcept: "Variable Window" },
                    { title: "Minimum Window Substring", difficulty: "Hard", link: "https://leetcode.com/problems/minimum-window-substring/", keyConcept: "Shrink Window" },
                    { title: "Permutation in String", difficulty: "Medium", link: "https://leetcode.com/problems/permutation-in-string/", keyConcept: "Frequency Count" },
                    { title: "Sliding Window Maximum", difficulty: "Hard", link: "https://leetcode.com/problems/sliding-window-maximum/", keyConcept: "Deque" }
                ]
            },
            {
                pattern: "Prefix Sum",
                description: "Used for fast range queries.",
                questions: [
                    { title: "Subarray Sum Equals K", difficulty: "Medium", link: "https://leetcode.com/problems/subarray-sum-equals-k/", keyConcept: "Prefix + HashMap" },
                    { title: "Product of Array Except Self", difficulty: "Medium", link: "https://leetcode.com/problems/product-of-array-except-self/", keyConcept: "Prefix + Suffix" },
                    { title: "Range Sum Query", difficulty: "Easy", link: "https://leetcode.com/problems/range-sum-query-immutable/", keyConcept: "Prefix Array" },
                    { title: "Continuous Subarray Sum", difficulty: "Medium", link: "https://leetcode.com/problems/continuous-subarray-sum/", keyConcept: "Modulo Trick" },
                    { title: "Find Pivot Index", difficulty: "Easy", link: "https://leetcode.com/problems/find-pivot-index/", keyConcept: "Balance Index" }
                ]
            },
            {
                pattern: "Dynamic Programming",
                description: "Breaks problems into overlapping subproblems.",
                questions: [
                    { title: "Climbing Stairs", difficulty: "Easy", link: "https://leetcode.com/problems/climbing-stairs/", keyConcept: "Fibonacci DP" },
                    { title: "House Robber", difficulty: "Medium", link: "https://leetcode.com/problems/house-robber/", keyConcept: "DP Optimization" },
                    { title: "Longest Increasing Subsequence", difficulty: "Medium", link: "https://leetcode.com/problems/longest-increasing-subsequence/", keyConcept: "DP + Binary Search" },
                    { title: "Longest Common Subsequence", difficulty: "Medium", link: "https://leetcode.com/problems/longest-common-subsequence/", keyConcept: "2D DP" },
                    { title: "Edit Distance", difficulty: "Hard", link: "https://leetcode.com/problems/edit-distance/", keyConcept: "DP Table" }
                ]
            },
            {
                pattern: "Graph (BFS / DFS)",
                description: "Used for traversal and connectivity problems.",
                questions: [
                    { title: "Number of Islands", difficulty: "Medium", link: "https://leetcode.com/problems/number-of-islands/", keyConcept: "DFS Grid" },
                    { title: "Clone Graph", difficulty: "Medium", link: "https://leetcode.com/problems/clone-graph/", keyConcept: "Graph Traversal" },
                    { title: "Course Schedule", difficulty: "Medium", link: "https://leetcode.com/problems/course-schedule/", keyConcept: "Cycle Detection" },
                    { title: "Rotting Oranges", difficulty: "Medium", link: "https://leetcode.com/problems/rotting-oranges/", keyConcept: "BFS" },
                    { title: "Pacific Atlantic Water Flow", difficulty: "Medium", link: "https://leetcode.com/problems/pacific-atlantic-water-flow/", keyConcept: "DFS" }
                ]
            },
            {
                pattern: "Tree",
                description: "Binary tree traversal and recursion problems.",
                questions: [
                    { title: "Maximum Depth of Binary Tree", difficulty: "Easy", link: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", keyConcept: "DFS" },
                    { title: "Level Order Traversal", difficulty: "Medium", link: "https://leetcode.com/problems/binary-tree-level-order-traversal/", keyConcept: "BFS" },
                    { title: "Lowest Common Ancestor", difficulty: "Medium", link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/", keyConcept: "Recursion" },
                    { title: "Diameter of Binary Tree", difficulty: "Easy", link: "https://leetcode.com/problems/diameter-of-binary-tree/", keyConcept: "DFS Height" },
                    { title: "Serialize & Deserialize", difficulty: "Hard", link: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", keyConcept: "Tree Encoding" }
                ]
            }
        ];
    }

    if (!data.weaknessAnalysis || !Array.isArray(data.weaknessAnalysis) || data.weaknessAnalysis.length === 0) {
        data.weaknessAnalysis = [
            { weakness: "Strategic Project Quantifiability", improvement: "Translate your technical contributions into business metrics (e.g., 'reduced latency by 40%') instead of just listing features.", priority: "high" },
            { weakness: "Implicit Tech Stack Alignment", improvement: "Explicitly mention core technologies required by the role in your project descriptions to clear ATS and human filters.", priority: "high" },
            { weakness: "System Design Depth", improvement: "Prepare to deep-dive into architectural trade-offs, such as scalability vs. ease of maintenance for the specific technologies you used.", priority: "medium" },
            { weakness: "Behavioral STAR Mapping", improvement: "Map your projects to common behavioral questions (Leadership, Conflict, Failure) ahead of time to ensure quick, structured answers.", priority: "medium" },
            { weakness: "Unit Testing Coverage", improvement: "Mention specific testing frameworks and your approach to TDD to demonstrate commitment to code quality and production stability.", priority: "low" },
            { weakness: "Niche Domain Expertise", improvement: "Bridge the gap between your general software skills and the specific business domain of the target role through research.", priority: "medium" }
        ];
    }

    if (!data.cheatSheet || !Array.isArray(data.cheatSheet) || data.cheatSheet.length === 0) {
        data.cheatSheet = [
            { topic: "System Design & Scalability", content: "Master load balancing, horizontal scaling, and microservice communication patterns." },
            { topic: "Database Optimization", content: "Understand indexing strategies, query performance tuning, and NoSQL vs SQL trade-offs." },
            { topic: "Security Best Practices", content: "Focus on OAuth2, JWT implementation, and preventing common vulnerabilities like CSRF/XSS." },
            { topic: "Cloud Architecture", content: "Familiarize yourself with AWS/GCP serverless components and container orchestration (Docker/K8s)." },
            { topic: "Frontend Performance", content: "Optimize the critical rendering path, code splitting, and advanced asset caching strategies." },
            { topic: "Clean Code & Refactoring", content: "Deep dive into SOLID principles and design patterns applicable to your primary programming language." }
        ];
    }

    if (!data.interviewTips || !Array.isArray(data.interviewTips) || data.interviewTips.length === 0) {
        data.interviewTips = [
            "Research the company's engineering blog for recent challenges they faced.",
            "Prepare STAR stories for each major project on your resume.",
            "Ask clarifying questions before starting any technical solution.",
            "Follow the 'Think out loud' principle during live coding.",
            "Always start with the brute-force approach to establish a baseline.",
            "Discuss time and space complexity before optimizing.",
            "Handle edge cases explicitly in your code.",
            "Test your solution with provided examples and your own test cases.",
            "If you get stuck, rephrase the problem or draw a diagram.",
            "Keep your code clean and modular.",
            "Don't be afraid to ask for hints if you're truly stuck."
        ];
    }

    return data;
}

async function generatePdfFromHtml(htmlContent) {
    let browser;
    try {
        console.log("Launching Puppeteer...");

        const launchOptions = {
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-extensions',
                '--font-render-hinting=none',
            ]
        };

        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }

        browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0", timeout: 30000 });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
        });

        await browser.close();
        return pdfBuffer;

    } catch (error) {
        console.error("PDF Engine Error Detail:", error.message);
        if (browser) {
            try { await browser.close(); } catch (_) { }
        }
        throw new Error(`PDF Engine Error: ${error.message}`);
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate a comprehensive, high-impact 1-page ATS-friendly resume HTML for a candidate. 
The goal is to fill the ENTIRE A4 page with high-quality, professional technical content, exactly like the reference style.

Candidate Data:
- Resume Text: ${resume}
- Self Description: ${selfDescription}
- Job Description: ${jobDescription}

STRICT CONTENT REQUIREMENTS:
1. SUMMARY: Write a rich 3-4 line summary highlighting specific technical strengths and impact.
2. TECHNICAL SKILLS: Divide into 5-6 categories (Frontend, Backend, Languages, Databases, Tools, Cloud/DevOps). List many relevant technologies.
3. EXPERIENCE: Generate 4-6 detailed, multi-line bullet points per role using the STAR method. Focus on technical challenges and quantifiable results.
4. PROJECTS: You MUST generate 3 or 4 significant projects. For each project, write 4-5 high-impact bullet points detailing the architecture, tech stack, and features.
5. ACHIEVEMENTS: Include 3-4 professional achievements or certifications with detailed descriptions.

STRICT DESIGN REQUIREMENTS (USE THIS TEMPLATE AND CSS):
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.4;
            color: #000;
            width: 100%;
            margin: 0;
            background: #fff;
            padding: 12mm 15mm;
            font-size: 13px;
        }
        .header { text-align: center; margin-bottom: 12px; }
        h1 {
            font-size: 34px;
            color: #004d40;
            margin-bottom: 4px;
            font-weight: bold;
            letter-spacing: -0.01em;
        }
        .contact-info {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            font-size: 12.5px;
            margin-bottom: 15px;
        }
        .contact-info icon { margin-right: 4px; }
        .contact-info span { color: #000; font-weight: 600; }
        
        h2.section-title {
            font-size: 17px;
            color: #004d40;
            margin: 18px 0 10px 0;
            padding-bottom: 4px;
            border-bottom: 2.2px solid #d4af37;
            font-weight: bold;
            text-transform: uppercase;
        }
        .summary p { text-align: justify; margin-bottom: 10px; font-size: 13px; }
        .summary .summary-label { color: #004d40; font-weight: bold; }
        
        .skills-grid {
            display: grid;
            grid-template-columns: 1.1fr 1fr;
            row-gap: 6px;
            column-gap: 30px;
            margin-bottom: 12px;
        }
        .skill-item { font-size: 13px; }
        .skill-item .bold { font-weight: bold; }

        .two-column {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 3px;
        }
        .two-column .left .bold { font-weight: bold; font-size: 14.5px; }
        .two-column .left .italic { font-style: italic; font-size: 13.5px; }
        .two-column .right { text-align: right; font-weight: 550; font-size: 13px; }
        
        ul { margin-left: 22px; margin-bottom: 12px; }
        li { font-size: 13px; margin-bottom: 5px; text-align: justify; }
        li .bold { font-weight: bold; }
        
        .item-container { margin-bottom: 14px; }
        .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 11px;
            color: #004d40;
            font-style: italic;
            font-weight: bold;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>[Candidate Name]</h1>
        <div class="contact-info">
            <span>✉ [Email]</span> <span>|</span> <span>github.com/[github]</span> <span>|</span> <span>linkedin.com/in/[linkedin]</span>
        </div>
    </div>

    <div class="summary">
        <p><span class="summary-label">Summary — [Target Job Title]</span> [Rich, detailed 4-line summary highlighting years of experience and core technical achievements]</p>
    </div>

    <h2 class="section-title">Technical Skills</h2>
    <div class="skills-grid">
        <div class="skill-item"><span class="bold">Frontend:</span> [Extensive list of frameworks/libs]</div>
        <div class="skill-item"><span class="bold">Backend:</span> [Extensive list of server technologies]</div>
        <div class="skill-item"><span class="bold">Languages:</span> [Programming languages]</div>
        <div class="skill-item"><span class="bold">Databases:</span> [SQL and NoSQL technologies]</div>
        <div class="skill-item"><span class="bold">Tools & DevOps:</span> [Cloud, CI/CD, Version Control]</div>
        <div class="skill-item"><span class="bold">Others:</span> [Core CS concepts, methodologies]</div>
    </div>

    <h2 class="section-title">Education</h2>
    <div class="item-container">
        <div class="two-column">
            <div class="left"><span class="bold">[Institution Full Name]</span><br><span class="italic">[Degree with Major]</span></div>
            <div class="right">[Location] | [Year]</div>
        </div>
    </div>

    <h2 class="section-title">Professional Experience</h2>
    <div class="item-container">
        <div class="two-column">
            <div class="left"><span class="bold">[Current/Recent Company]</span><br><span class="italic">[Recent Role]</span></div>
            <div class="right">[Dates]</div>
        </div>
        <ul>
            <li><span class="bold">Architected and implemented</span> [detailed feature] using [technologies], resulting in [quantifiable improvement - e.g., 40% faster load times].</li>
            <li><span class="bold">Led the development</span> of [system/module], ensuring [scalability/security] and handling [specific load/complexity].</li>
            <li><span class="bold">Collaborated with</span> cross-functional teams to [deliver specific project], utilizing [methodology like Agile] and tools like [Jira/Git].</li>
            <li><span class="bold">Optimized</span> [process/codebase] by [specific action], decreasing [costs/errors] by [percentage].</li>
            <li><span class="bold">Mentored</span> junior developers and conducted code reviews to maintain high quality standards and best practices.</li>
        </ul>
    </div>

    <h2 class="section-title">Key Projects</h2>
    <!-- Project 1 -->
    <div class="item-container">
        <div class="two-column">
            <div class="left"><span class="bold">[Significant Project Name]</span></div>
            <div class="right italic">[Full Tech Stack]</div>
        </div>
        <ul>
            <li><span class="bold">Developed a full-stack</span> [Type of App] that [Core Utility], utilizing [Key Technologies] for [Specific Purpose].</li>
            <li><span class="bold">Implemented robust</span> features like [Feature 1], [Feature 2], and [Feature 3], ensuring seamless user experience and performance.</li>
            <li><span class="bold">Built a modular</span> architecture supporting [specific capability] and integrated [API/Service] for [functionality].</li>
            <li><span class="bold">Deployed and managed</span> on [Platform] with [CI/CD tools], achieving [uptime/performance metric].</li>
        </ul>
    </div>
    <!-- Add at least 2 more projects here following the same structure -->

    <h2 class="section-title">Achievements</h2>
    <ul>
        <li><span class="bold">[Achievement 1 Title]:</span> [Detailed description of the recognition, competition or certification with technical context]</li>
        <li><span class="bold">[Achievement 2 Title]:</span> [Detail]</li>
        <li><span class="bold">[Achievement 3 Title]:</span> [Detail]</li>
    </ul>

    <div class="footer">
        <span>&lt;/&gt;</span> Built with precision and passion <span>&lt;/&gt;</span>
    </div>
</body>
</html>

Return ONLY raw JSON matching schema schema { "html": "<full html here>" } Without markdown blocks.`;

    try {
        const response = await getGroqClient().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are an elite, highly precise resume formatter. Your MISSION is to generate a RICH, FULL-PAGE resume. You MUST be detailed and avoid brevity. Every section MUST be substantial enough to occupy the full A4 page space. STRICTLY use the provided structure and DO NOT simplify. ALWAYS return valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.5,
            max_tokens: 4096
        })

        const text = response.choices[0].message.content

        const cleaned = text
            .replace(/```json|```/g, "")
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
            .trim();

        let jsonContent;
        try {
            jsonContent = JSON.parse(cleaned)
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError)

            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    jsonContent = JSON.parse(match[0]);
                } catch (e) {
                    console.error("Second attempt to parse JSON failed");
                }
            }

            if (!jsonContent) {
                jsonContent = {
                    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; color: #000; width: 100%; margin: 0; background: #fff; font-size: 13.5px; padding: 40px; }
        .header { text-align: center; margin-bottom: 24px; }
        h1 { font-size: 32px; color: #004d40; margin-bottom: 8px; font-weight: bold; }
        .contact-info { display: flex; justify-content: center; gap: 15px; font-size: 12px; margin-bottom: 15px; }
        h2.section-title { font-size: 18px; color: #004d40; margin: 20px 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #d4af37; font-weight: bold; text-transform: uppercase; }
        .content { font-size: 13px; text-align: justify; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Resume</h1>
        <div class="contact-info">
            <span>Professional Profile Generated by AI</span>
        </div>
    </div>
    <h2 class="section-title">Summary</h2>
    <div class="content">${selfDescription || "Professional seeking dynamic opportunities."}</div>
    <h2 class="section-title">Profile Details</h2>
    <div class="content">${resume.substring(0, 2000)}${resume.length > 2000 ? '...' : ''}</div>
</body>
</html>`
                };
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
