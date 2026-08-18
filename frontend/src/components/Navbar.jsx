import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import './Navbar.scss'

const Navbar = () => {
    const { user, handleLogout } = useAuth()
    const [ dropdownOpen, setDropdownOpen ] = useState(false)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const onLogout = async () => {
        await handleLogout()
        navigate('/login')
    }

    const initial = user?.username ? user.username.charAt(0).toUpperCase() : 'U'

    return (
        <header className="main-navbar">
            <div className="navbar-container">
                {/* Brand Logo */}
                <Link to="/" className="navbar-brand">
                    <div className="brand-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    </div>
                    <span className="brand-name">Interview<span className="brand-highlight">AI</span></span>
                </Link>

                {/* Nav Links */}
                <nav className="navbar-links">
                    <Link to="/" className="nav-link">Home</Link>
                    <a href="#about-platform" className="nav-link">About Platform</a>
                    <a href="#features-overview" className="nav-link">Features</a>
                    <a href="#how-it-works" className="nav-link">How It Works</a>
                    {user && <a href="#recent-reports" className="nav-link">My Reports</a>}
                    <Link to={user ? "/generate" : "/login"} className="nav-link nav-link--btn">
                        {user ? "Get Started" : "Start Free"}
                    </Link>
                </nav>

                {/* Auth State / Profile Controls */}
                {user ? (
                    <div className="navbar-user" ref={dropdownRef}>
                        <button
                            className="profile-btn"
                            onClick={() => setDropdownOpen(prev => !prev)}
                            type="button"
                        >
                            <div className="avatar-circle">{initial}</div>
                            <span className="user-name">{user.username}</span>
                            <svg className={`chevron ${dropdownOpen ? 'chevron--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                        </button>

                        {dropdownOpen && (
                            <div className="profile-dropdown">
                                <div className="dropdown-header">
                                    <p className="dropdown-username">{user.username}</p>
                                    <p className="dropdown-email">{user.email || 'candidate@interview.ai'}</p>
                                </div>
                                <div className="dropdown-divider" />
                                <Link to="/" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                    Home Landing Page
                                </Link>
                                <Link to="/generate" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                    Create New Strategy
                                </Link>
                                <a href="#recent-reports" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    My Strategy Reports
                                </a>
                                <div className="dropdown-divider" />
                                <button type="button" className="dropdown-item logout-item" onClick={onLogout}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                    Log Out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="navbar-auth-buttons">
                        <Link to="/login" className="login-link">Log In</Link>
                        <Link to="/register" className="register-btn">Sign Up Free</Link>
                    </div>
                )}
            </div>
        </header>
    )
}

export default Navbar
