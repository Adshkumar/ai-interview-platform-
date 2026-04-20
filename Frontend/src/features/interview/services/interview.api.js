import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

export const generateInterviewReport = async ({
    jobDescription,
    selfDescription,
    resumeFile
}) => {

    try {
        const formData = new FormData();
        formData.append("jobDescription", JSON.stringify(jobDescription));

        formData.append("selfDescription", selfDescription);

        if (resumeFile) {
            formData.append("resume", resumeFile);
        }

        const response = await api.post("/api/interview/", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        return response.data;

    } catch (error) {
        console.error("Generate Interview Report Error:", error);
        throw error;
    }
};

export const getInterviewReportById = async (interviewId) => {

    try {
        const response = await api.get(`/api/interview/report/${interviewId}`);

        return {
            interviewReport: response.data?.interviewReport
        };

    } catch (error) {
        console.error("Get Interview Report Error:", error);
        throw error;
    }
};

export const getAllInterviewReports = async () => {

    try {
        const response = await api.get("/api/interview/");

        return {
            interviewReports: response.data?.interviewReports || []
        };

    } catch (error) {
        console.error("Get All Reports Error:", error);
        throw error;
    }
};

export const deleteInterviewReport = async (interviewId) => {
    try {
        const response = await api.post(`/api/interview/delete-report/${interviewId}`);
        return response.data;
    } catch (error) {
        console.error("Delete Report Error:", error);
        throw error;
    }
};


export const generateResumePdf = async ({ interviewReportId }) => {

    try {
        const response = await api.post(
            `/api/interview/resume/pdf/${interviewReportId}`,
            null,
            {
                responseType: "blob",
                headers: {
                    'Accept': 'application/pdf'
                }
            }
        );

        return response.data;

    } catch (error) {
        console.error("Resume PDF Error:", error);
        throw error;
    }
};