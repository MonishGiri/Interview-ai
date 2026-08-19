import { useState, useCallback } from 'react'

/**
 * Manages per-report bookmarked question indices in localStorage.
 * Key format: `bookmarks-{reportId}-{questionType}`
 */
export const useBookmarks = (reportId) => {
    const storageKey = `bookmarks-${reportId}`

    const readBookmarks = () => {
        try {
            return JSON.parse(localStorage.getItem(storageKey)) || {}
        } catch {
            return {}
        }
    }

    const [bookmarks, setBookmarks] = useState(readBookmarks)

    const toggleBookmark = useCallback((questionType, index) => {
        setBookmarks(prev => {
            const current = prev[questionType] || []
            const updated = current.includes(index)
                ? current.filter(i => i !== index)
                : [...current, index]

            const next = { ...prev, [questionType]: updated }
            localStorage.setItem(storageKey, JSON.stringify(next))
            return next
        })
    }, [storageKey])

    const isBookmarked = useCallback((questionType, index) => {
        return (bookmarks[questionType] || []).includes(index)
    }, [bookmarks])

    const totalBookmarks = Object.values(bookmarks).reduce((sum, arr) => sum + arr.length, 0)

    return { bookmarks, toggleBookmark, isBookmarked, totalBookmarks }
}
