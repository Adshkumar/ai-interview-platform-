const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware.js")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware.js")

const interviewRouter = express.Router()

/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private
 */
interviewRouter.post("/", authMiddleware, upload.single("resume"), interviewController.generateInterViewReportController)

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware, interviewController.getInterviewReportByIdController)

/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user.
 * @access private
 */
interviewRouter.get("/", authMiddleware, interviewController.getAllInterviewReportsController)

/**
 * @route GET /api/interview/resume/pdf
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware, interviewController.generateResumePdfController)

/**
 * @route POST /api/interview/delete-report/:interviewId
 * @description delete interview report by interviewId.
 * @access private
 */
interviewRouter.post("/delete-report/:interviewId", authMiddleware, interviewController.deleteInterviewReportController)

module.exports = interviewRouter;