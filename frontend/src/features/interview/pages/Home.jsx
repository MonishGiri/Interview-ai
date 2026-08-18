import React from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { useNavigate } from 'react-router'
import Navbar from '../../../components/Navbar'
import LoadingScreen from '../../../components/LoadingScreen'

const Home = () => {
    const { loading, reports } = useInterview()
    const { user } = useAuth()
    const navigate = useNavigate()

    if (loading) {
        return (
            <>
                <Navbar />
                <LoadingScreen useCase="auth" />
            </>
        )
    }

    const handleGetStarted = () => {
        if (user) {
            navigate('/generate')
        } else {
            navigate('/login')
        }
    }

    return (
        <div className='page-wrapper'>
            <Navbar />

            <div className='home-page'>

                {/* Hero Platform Briefing Section */}
                <section id="about-platform" className='hero-section'>
                    <div className='hero-badge'>AI-Powered Career Intelligence Platform</div>
                    <h1 className='hero-title'>
                        Master Every Technical &amp; Behavioral Interview with <span className='highlight'>AI Intelligence</span>
                    </h1>
                    <p className='hero-description'>
                        InterviewAI turns target job descriptions and candidate resumes into tailored preparation roadmaps: technical questions with model answers, interviewer hidden intentions, interactive task tracking, voice mock practice, and ATS resume export.
                    </p>

                    {/* Theme-Matched "Get Started" CTA Button */}
                    <div className='hero-cta-wrapper'>
                        <button
                            type="button"
                            className='get-started-btn'
                            onClick={handleGetStarted}
                        >
                            <span>{user ? "Create Strategy Plan" : "Get Started Free"}</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                        </button>
                        <a href="#how-it-works" className='secondary-hero-btn'>
                            How It Works &darr;
                        </a>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className='workflow-section'>
                    <div className='section-title-wrapper'>
                        <h2>How <span className='highlight'>InterviewAI</span> Works</h2>
                        <p>Three simple steps to transition from candidate to top-tier contender.</p>
                    </div>

                    <div className='steps-grid'>
                        <div className='step-card'>
                            <div className='step-card__number'>01</div>
                            <h3>Upload Role &amp; Resume</h3>
                            <p>Paste your target Job Description and upload your Resume or type a quick self-description.</p>
                        </div>
                        <div className='step-card'>
                            <div className='step-card__number'>02</div>
                            <h3>AI Strategy Engine</h3>
                            <p>Our engine calculates match scores, uncovers skill gaps, and generates targeted Q&amp;A frameworks.</p>
                        </div>
                        <div className='step-card'>
                            <div className='step-card__number'>03</div>
                            <h3>Practice &amp; Export</h3>
                            <p>Practice answers using voice dictation with STAR scoring, track daily tasks, and download tailored ATS PDFs.</p>
                        </div>
                    </div>
                </section>

                {/* Platform Specifications & Features Grid */}
                <section id="features-overview" className='specifications-section'>
                    <div className='section-title-wrapper'>
                        <h2>Platform <span className='highlight'>Specifications &amp; Features</span></h2>
                        <p>Everything you need for comprehensive, end-to-end interview victory.</p>
                    </div>

                    <div className='platform-features-grid'>
                        <div className='feature-card feature-card--large'>
                            <div className='feature-card__icon'>🎯</div>
                            <h3>Skill Gap &amp; Match Score Engine</h3>
                            <p>Receive an objective 0-100% role match score alongside prioritized skill gaps categorized by low, medium, and high severity.</p>
                        </div>
                        <div className='feature-card feature-card--large'>
                            <div className='feature-card__icon'>💡</div>
                            <h3>Technical &amp; Behavioral Q&amp;A Bank</h3>
                            <p>Access high-yield technical and behavioral questions curated specifically for your target role, with hidden interviewer intentions and model answers.</p>
                        </div>
                        <div className='feature-card feature-card--large'>
                            <div className='feature-card__icon'>📅</div>
                            <h3>Day-by-Day Preparation Roadmap</h3>
                            <p>Follow a structured daily study plan with persistent checkbox task tracking and live overall completion percentage bars.</p>
                        </div>
                        <div className='feature-card feature-card--large'>
                            <div className='feature-card__icon'>🎙️</div>
                            <h3>AI Voice Mock Response Evaluator</h3>
                            <p>Dictate your answers in real time using browser voice-to-text. Receive immediate 1-10 scores, strengths, improvements, and STAR analysis.</p>
                        </div>
                        <div className='feature-card feature-card--large'>
                            <div className='feature-card__icon'>📄</div>
                            <h3>ATS-Optimized Resume Tailoring</h3>
                            <p>Export custom PDF resumes tailored to the job description with guaranteed clickable social profile, LinkedIn, and GitHub links.</p>
                        </div>
                        <div className='feature-card feature-card--large'>
                            <div className='feature-card__icon'>🔒</div>
                            <h3>Secure Candidate Workspace</h3>
                            <p>Protected candidate authentication ensures your strategy reports, history, and practice sessions remain strictly private.</p>
                        </div>
                    </div>
                </section>

                {/* Recent Reports List (For Logged-in Users) */}
                {user && reports.length > 0 && (
                    <section id="recent-reports" className='recent-reports'>
                        <div className='recent-reports__header'>
                            <h2>My Strategy Reports</h2>
                            <button
                                className='new-plan-btn'
                                onClick={() => navigate('/generate')}
                            >
                                + Create New Plan
                            </button>
                        </div>
                        <ul className='reports-list'>
                            {reports.map(report => (
                                <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                    <h3>{report.title || 'Untitled Position'}</h3>
                                    <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                    <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>Match Score: {report.matchScore}%</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Bottom CTA Banner */}
                <section className='cta-banner'>
                    <h2>Ready to Ace Your Next Interview?</h2>
                    <p>Join thousands of candidates preparing smarter with AI-driven interview intelligence.</p>
                    <button type="button" className='get-started-btn' onClick={handleGetStarted}>
                        <span>{user ? "Go to Strategy Generator" : "Get Started Free Now"}</span>
                    </button>
                </section>

                {/* Page Footer */}
                <footer className='page-footer'>
                    <a href='#'>Privacy Policy</a>
                    <a href='#'>Terms of Service</a>
                    <a href='#'>Help Center</a>
                    <span>&copy; {new Date().getFullYear()} InterviewAI Platform. All rights reserved.</span>
                </footer>
            </div>
        </div>
    )
}

export default Home