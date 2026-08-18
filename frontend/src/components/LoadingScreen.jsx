import React from 'react'
import './LoadingScreen.scss'

const USE_CASE_CONFIGS = {
    auth: {
        title: "Securing Session & Account Profile",
        subtitle: "Verifying credentials and loading your workspace..."
    },
    strategy: {
        title: "Crafting Custom Interview Strategy Plan",
        subtitle: "Analyzing target job requirements against candidate skills..."
    },
    interview_load: {
        title: "Retrieving Interview Plan Workspace",
        subtitle: "Loading technical questions, behavioral insights & roadmap..."
    },
    evaluation: {
        title: "Evaluating Voice Response",
        subtitle: "Analyzing answer structure against STAR framework standards..."
    },
    resume: {
        title: "Generating ATS-Optimized PDF Resume",
        subtitle: "Tailoring resume structure and rendering high-quality document..."
    },
    default: {
        title: "Preparing Your Custom Interview Blueprint",
        subtitle: "Processing requirements and generating strategic insights..."
    }
}

const LoadingScreen = ({ useCase, message, subtitle }) => {
    const preset = USE_CASE_CONFIGS[ useCase ] || USE_CASE_CONFIGS.default
    const displayTitle = message || preset.title
    const displaySubtitle = subtitle || preset.subtitle

    return (
        <div className="loading-container">
            <div className="loading-content">
                {/* Dual Orbital Glowing Spinner */}
                <div className="spinner-wrapper">
                    <div className="orbital-ring ring-outer" />
                    <div className="orbital-ring ring-inner" />
                    <div className="ai-core">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    </div>
                </div>

                <h2 className="loading-title">{displayTitle}</h2>
                <p className="loading-subtitle">{displaySubtitle}</p>

                {/* Animated Shimmer Skeleton Cards */}
                <div className="skeleton-grid">
                    <div className="skeleton-card">
                        <div className="skeleton-line skeleton-title" />
                        <div className="skeleton-line skeleton-text" />
                        <div className="skeleton-line skeleton-text short" />
                    </div>
                    <div className="skeleton-card">
                        <div className="skeleton-line skeleton-title" />
                        <div className="skeleton-line skeleton-text" />
                        <div className="skeleton-line skeleton-text short" />
                    </div>
                    <div className="skeleton-card">
                        <div className="skeleton-line skeleton-title" />
                        <div className="skeleton-line skeleton-text" />
                        <div className="skeleton-line skeleton-text short" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoadingScreen
