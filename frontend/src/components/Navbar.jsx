import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import './Navbar.scss'

const Navbar = () => {
    const { user, handleLogout } = useAuth()
    const [ dropdownOpen, setDropdownOpen ] = useState(false)
    const [ menuOpen, setMenuOpen ] = useState(false)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()
    const location = useLocation()

    const isHomePage = location.pathname === '/'

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Close menu when route changes
    useEffect(() => {
        setMenuOpen(false)
    }, [ location.pathname ])

    const onLogout = async () => {
        setMenuOpen(false)
        setDropdownOpen(false)
        await handleLogout()
        navigate('/')
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

                {/* Hamburger Menu Button for Mobile */}
                <button
                    className="mobile-menu-btn"
                    onClick={() => setMenuOpen(prev => !prev)}
                    type="button"
                    aria-label="Toggle navigation menu"
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                    )}
                </button>

                {/* Nav Links Wrapper */}
                <nav className={`navbar-links ${menuOpen ? 'navbar-links--open' : ''}`}>
                    <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
                    
                    {isHomePage ? (
                        <>
                            <a href="#about-platform" className="nav-link" onClick={() => setMenuOpen(false)}>About Platform</a>
                            <a href="#features-overview" className="nav-link" onClick={() => setMenuOpen(false)}>Features</a>
                            <a href="#how-it-works" className="nav-link" onClick={() => setMenuOpen(false)}>How It Works</a>
                            {user && <Link to="/reports" className="nav-link" onClick={() => setMenuOpen(false)}>My Reports</Link>}
                            <Link to={user ? "/generate" : "/login"} className="nav-link nav-link--btn" onClick={() => setMenuOpen(false)}>
                                {user ? "Get Started" : "Start Free"}
                            </Link>
                        </>
                    ) : (
                        <>
                            {user && (location.pathname === '/generate' || location.pathname === '/reports') && (
                                <Link to="/reports" className="nav-link" onClick={() => setMenuOpen(false)}>My Reports</Link>
                            )}
                        </>
                    )}

                    {/* Mobile-only auth and options inside the dropdown menu */}
                    <div className="mobile-only-auth">
                        {user ? (
                            <div className="mobile-profile-options">
                                <div className="mobile-user-info">
                                    <div className="avatar-circle">{initial}</div>
                                    <div className="mobile-user-details">
                                        <p className="mobile-username">{user.username}</p>
                                        <p className="mobile-email">{user.email || 'candidate@interview.ai'}</p>
                                    </div>
                                </div>
                                {(isHomePage || location.pathname === '/generate' || location.pathname === '/reports') && (
                                    <>
                                        <Link to="/generate" className="mobile-dropdown-link" onClick={() => setMenuOpen(false)}>
                                            Create New Strategy
                                        </Link>
                                        <Link to="/reports" className="mobile-dropdown-link" onClick={() => setMenuOpen(false)}>
                                            My Strategy Reports
                                        </Link>
                                    </>
                                )}
                                <button type="button" className="mobile-logout-btn" onClick={onLogout}>
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <div className="mobile-auth-buttons">
                                <Link to="/login" className="mobile-login-link" onClick={() => setMenuOpen(false)}>Log In</Link>
                                <Link to="/register" className="mobile-register-btn" onClick={() => setMenuOpen(false)}>Sign Up Free</Link>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Desktop-only Auth State / Profile Controls */}
                <div className="desktop-only-auth">
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
                                    {(isHomePage || location.pathname === '/generate' || location.pathname === '/reports') && (
                                        <>
                                            <Link to="/generate" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                                Create New Strategy
                                            </Link>
                                            <Link to="/reports" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                My Strategy Reports
                                            </Link>
                                        </>
                                    )}
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
            </div>
        </header>
    )
}

export default Navbar
