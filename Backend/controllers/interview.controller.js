const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {

        if (!req.file) {
            return res.status(400).json({
                message: "No resume file uploaded",
                error: "Please upload a PDF file"
            });
        }

        console.log("File received:", {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        // Parse PDF
        let resumeText;

        try {
            const pdfData = await pdfParse(req.file.buffer);
            resumeText = pdfData.text;
            console.log("PDF parsed successfully, text length:", resumeText.length);
        } catch (pdfError) {
            console.error("PDF parsing error:", pdfError);
            return res.status(400).json({
                message: "Invalid PDF file",
                error: "Could not parse the uploaded PDF"
            });
        }

        let { selfDescription, jobDescription } = req.body;

        if (!jobDescription) {
            return res.status(400).json({
                message: "Job description is required"
            });
        }

        if (typeof jobDescription !== "string") {
            jobDescription = JSON.stringify(jobDescription);
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription
        });

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription,
            ...interViewReportByAi
        });

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        });

    } catch (error) {
        console.error("Error in generateInterViewReportController:", error);

        res.status(500).json({
            message: "Failed to generate interview report",
            error: error.message
        });
    }
}


/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {

        const { interviewId } = req.params

        const interviewReport = await interviewReportModel.findOne({
            _id: interviewId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })

    } catch (error) {

        console.error("Error in getInterviewReportByIdController:", error);

        res.status(500).json({
            message: "Failed to fetch interview report",
            error: error.message
        })
    }
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {

        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })

    } catch (error) {

        console.error("Error in getAllInterviewReportsController:", error);

        res.status(500).json({
            message: "Failed to fetch interview reports",
            error: error.message
        })
    }
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params;

        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        });

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." });
        }

        const { resume, jobDescription, selfDescription } = interviewReport;

        console.log("Generating Resume PDF for:", interviewReportId);

        const pdfBuffer = await generateResumePdf({
            resume,
            jobDescription,
            selfDescription
        });

        if (!pdfBuffer || pdfBuffer.length === 0) {
            console.error("PDF generation returned empty buffer");
            return res.status(500).json({ message: "Failed to generate valid PDF buffer." });
        }

        console.log("PDF generated successfully. Size:", pdfBuffer.length);

        // ONLY set headers if we HAVE the buffer
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="resume_${interviewReportId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        return res.end(pdfBuffer); // Use .end() for binary buffers

    } catch (error) {
        console.error("Resume PDF Controller Error:", error);
        
        // If we already started sending headers, we can't send JSON anymore
        if (res.headersSent) {
            console.error("Headers already sent, cannot send JSON error.");
            return res.end();
        }

        res.status(500).json({
            message: "Failed to generate resume PDF",
            error: error.message
        });
    }
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
}