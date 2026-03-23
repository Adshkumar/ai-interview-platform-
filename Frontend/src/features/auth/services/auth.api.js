import axios from "axios"

const api = axios.create({
    baseURL: "http://localhost:4000/api",
    withCredentials: true
})

api.interceptors.request.use(request => {
    // console.log('Starting Request:', request.method, request.url);
    return request;
});

api.interceptors.response.use(
    response => {
        // console.log('Response:', response.status);
        return response;
    },
    error => {
        // console.log('Response Error:', error.response?.status, error.config?.url);
        return Promise.reject(error);
    }
);

export async function register({ username, email, password }) {
    try {
        const response = await api.post('/auth/register', {
            name: username, email, password
        })
        return response.data
    } catch (err) {
        // console.log('Register error:', err.response?.data || err.message)
        throw err;
    }
}

export async function login({ email, password }) {
    try {
        const response = await api.post("/auth/login", {
            email, password
        })
        return response.data
    } catch (err) {
        // console.log('Login error:', err.response?.data || err.message)
        throw err;
    }
}

export async function logout() {
    try {
        const response = await api.get("/auth/logout")
        return response.data
    } catch (err) {
        console.log('Logout error:', err.response?.data || err.message)
        throw err;
    }
}

export async function getMe() {
    try {
        const response = await api.get("/auth/get-me")
        return response.data
    } catch (err) {
        console.log('GetMe error:', err.response?.data || err.message)
        throw err;
    }
}