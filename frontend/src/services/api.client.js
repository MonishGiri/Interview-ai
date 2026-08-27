import axios from "axios"

const baseURL = (import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === 'production'
        ? 'https://interview-ai-xqd6.onrender.com'
        : 'http://localhost:3000')).replace(/\/$/, '')

const api = axios.create({
    baseURL,
    withCredentials: true
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
}, (error) => Promise.reject(error))

export default api
