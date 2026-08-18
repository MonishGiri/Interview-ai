import axios from "axios"

const baseURL = import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === 'production'
        ? 'https://interview-ai-xqd6.onrender.com'
        : 'http://localhost:3000')

const api = axios.create({
    baseURL,
    withCredentials: true
})

export default api
