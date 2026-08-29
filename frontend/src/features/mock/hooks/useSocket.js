import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = (import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === 'production'
        ? 'https://interview-ai-xqd6.onrender.com'
        : 'http://localhost:3000')).replace(/\/$/, '')

/**
 * useSocket — manages a single Socket.IO connection for a mock session.
 *
 * @param {string|null} sessionId — the mock session ID to watch
 * @param {Object}      handlers  — { onProgress, onDone, onError }
 */
export function useSocket({ sessionId, onProgress, onDone, onError }) {
    const socketRef = useRef(null)

    useEffect(() => {
        if (!sessionId) return

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            auth: {
                token: localStorage.getItem('token'),
            },
        })

        socketRef.current = socket

        socket.on('connect', () => {
            // Join the session room to receive evaluation progress events
            socket.emit('mock:watch-evaluation', { sessionId })
        })

        socket.on('mock:progress', (data) => {
            onProgress?.(data)
        })

        socket.on('mock:done', (data) => {
            onDone?.(data)
        })

        socket.on('mock:error', (data) => {
            onError?.(data)
        })

        socket.on('connect_error', (err) => {
            console.warn('[Socket] Connection error:', err.message)
        })

        return () => {
            socket.disconnect()
            socketRef.current = null
        }
    }, [sessionId])

    const disconnect = useCallback(() => {
        socketRef.current?.disconnect()
    }, [])

    return { disconnect }
}
