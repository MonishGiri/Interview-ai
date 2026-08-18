import React, { useEffect } from 'react'
import { useNavigate, Link } from 'react-router'
import { useInterview } from '../hooks/useInterview'
import Navbar from '../../../components/Navbar'
import LoadingScreen from '../../../components/LoadingScreen'
import './Reports.scss'

const Reports = () => {
    const { loading, reports, getReports } = useInterview()
    const navigate = useNavigate()

    useEffect(() => {
        getReports()
    }, [])

    return (
        <div className="reports-page-wrapper">
            <Navbar />
            
            {loading ? (
                <LoadingScreen useCase="interview_load" message="Loading Your Strategy Reports" subtitle="Fetching your generated preparation logs and skill gap analysis..." />
            ) : (
                <main className="reports-main-content">
                    <div className="reports-container">
                        <div className="reports-header-section">
                            <div>
                                <h1 className="page-title">My Preparation <span className="highlight">Reports</span></h1>
                                <p className="page-subtitle">Access your generated strategy blueprints, interview timelines, and practice history.</p>
                            </div>
                            <Link to="/generate" className="create-report-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                Create New Strategy
                            </Link>
                        </div>

                        {reports.length === 0 ? (
                            <div className="empty-reports-card">
                                <div className="empty-icon-wrapper">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                </div>
                                <h2>No Preparation Plans Found</h2>
                                <p>You haven't generated any interview strategy plans yet. Start by defining your target role and self-description to get custom roadmap insights.</p>
                                <Link to="/generate" className="empty-action-btn">
                                    Generate Your First Strategy
                                </Link>
                            </div>
                        ) : (
                            <div className="reports-grid">
                                {reports.map((report) => {
                                    const date = new Date(report.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    });
                                    const score = report.matchScore || 0;

                                    return (
                                        <div 
                                            key={report._id} 
                                            className="report-card"
                                            onClick={() => navigate(`/interview/${report._id}`)}
                                        >
                                            <div className="report-card__header">
                                                <h3 className="job-title">{report.title || 'Untitled Role'}</h3>
                                                <span className={`score-badge ${score >= 80 ? 'score--high' : score >= 60 ? 'score--mid' : 'score--low'}`}>
                                                    {score}% Match
                                                </span>
                                            </div>

                                            <div className="report-card__body">
                                                <div className="meta-info">
                                                    <span className="meta-label">Generated on</span>
                                                    <span className="meta-value">{date}</span>
                                                </div>

                                                {report.skillGaps && report.skillGaps.length > 0 && (
                                                    <div className="skills-preview">
                                                        <span className="meta-label">Skill Gaps Focus:</span>
                                                        <div className="skills-tags">
                                                            {report.skillGaps.slice(0, 3).map((gap, index) => (
                                                                <span key={index} className="skill-tag">{gap}</span>
                                                            ))}
                                                            {report.skillGaps.length > 3 && (
                                                                <span className="skill-tag skill-tag--more">+{report.skillGaps.length - 3} more</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="report-card__footer">
                                                <span className="view-details-link">
                                                    Open Workspace
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </main>
            )}
        </div>
    )
}

export default Reports
