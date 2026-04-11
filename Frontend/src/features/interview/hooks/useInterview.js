import {
    getAllInterviewReports,
    generateInterviewReport,
    getInterviewReportById,
    generateResumePdf
} from "../services/interview.api"

import { useContext } from "react"
import { InterviewContext } from "../interview.context"

export const useInterview = () => {

    const context = useContext(InterviewContext)

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    // Generate Interview Report
    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {

        setLoading(true)

        try {

            const response = await generateInterviewReport({
                jobDescription: JSON.stringify(jobDescription),
                selfDescription,
                resumeFile
            })

            if (response?.interviewReport) {
                setReport(response.interviewReport)
                return response.interviewReport
            }

        } catch (error) {
            console.log("Generate report error:", error)
        } finally {
            setLoading(false)
        }
    }


    // Get Report By ID
    const getReportById = async (interviewId) => {

        if (!interviewId) return

        setLoading(true)

        try {
            const response = await getInterviewReportById(interviewId)

            if (response?.interviewReport) {
                setReport(response.interviewReport)
                return response.interviewReport
            }

        } catch (error) {
            console.log("Fetch report error:", error)
        } finally {
            setLoading(false)
        }
    }
    const getReports = async () => {

        setLoading(true)

        try {
            const response = await getAllInterviewReports()
            if (response?.interviewReports) {
                setReports(response.interviewReports)
                return response.interviewReports
            }

        } catch (error) {
            console.log("Fetch reports error:", error)
        } finally {
            setLoading(false)
        }
    }
    // Download Resume PDF
    const getResumePdf = async (interviewReportId) => {
        if (!interviewReportId) return
        setLoading(true)

        try {
            const response = await generateResumePdf({ interviewReportId })

            if (response.type === 'application/json') {
                const text = await response.text();
                const errorData = JSON.parse(text);
                console.error("PDF generation failed:", errorData);
                alert(`Error: ${errorData.message || 'Failed to generate PDF'}`);
                return;
            }

            const blob = new Blob([response], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `resume_${interviewReportId}.pdf`
            document.body.appendChild(link)
            link.click()

            setTimeout(() => {
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            }, 100)

        } catch (error) {
            console.error("PDF download error:", error)
            alert("Unexpected error downloading PDF. Please check server logs.");
        } finally {
            setLoading(false)
        }
    }

    return {
        loading,
        report,
        reports,
        generateReport,
        getReportById,
        getReports,
        getResumePdf
    }

}