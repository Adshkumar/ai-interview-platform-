import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useParams } from 'react-router-dom'

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Strategy Roadmap', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
    { id: 'gaps', label: 'Strategic Gaps', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>) },
    { id: 'tips', label: 'Expert Playbook', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>) },
    { id: 'cheatsheet', label: 'Technical Mastery', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>) },
    { id: 'dsa', label: 'Data Structures', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
];

const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false)
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day.tasks.map((task, i) => (
                <li key={i}>
                    <span className='roadmap-day__bullet' />
                    {task}
                </li>
            ))}
        </ul>
    </div>
)

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const { interviewId } = useParams()
    const navigate = useNavigate()
    const { report, getReportById, loading, getResumePdf } = useInterview()
    const [activeNav, setActiveNav] = useState('technical')
    const [navHistory, setNavHistory] = useState([])
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

    const goToSection = (sectionId) => {
        if (sectionId === activeNav) return
        setNavHistory(prev => [...prev, activeNav])
        setActiveNav(sectionId)
        setIsMobileMenuOpen(false)
    }

    const handleBack = () => {
        if (navHistory.length > 0) {
            const prev = navHistory[navHistory.length - 1]
            setNavHistory(h => h.slice(0, -1))
            setActiveNav(prev)
        } else {
            navigate(-1)
        }
    }

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isMobileMenuOpen])

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            navigate('/')
        }

    }, [interviewId])

    const handleDownloadResume = async () => {
        if (interviewId) {
            await getResumePdf(interviewId)
        }
    }

    if (loading || !report) {
        return (
            <main className='loading-screen'>
                <div className="loader"></div>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    const scoreColor = report.matchScore >= 80 ? 'score--high' : report.matchScore >= 65 ? 'score--mid' : 'score--low'

    return (
        <div className='interview-page'>
            {/* Mobile Top Bar */}
            <header className="interview-mobile-header">
                <button className="back-btn" onClick={handleBack} aria-label="Go Back">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                </button>

                <div
                    className="mobile-logo"
                    onClick={() => navigate('/')}
                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                >
                    Interview<span className="accent">AI</span>
                </div>

                <button className="hamburger-btn" onClick={toggleMenu} aria-label="Toggle Menu">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                </button>
            </header>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="interview-nav-overlay" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            <div className='interview-layout'>
                {/* ── Left Sidebar (Navigation) ── */}
                <nav className={`interview-nav ${isMobileMenuOpen ? 'interview-nav--open' : ''}`}>
                    {/* Back Button - Top of Nav */}
                    <button
                        className="interview-nav__back"
                        onClick={handleBack}
                        aria-label="Go Back"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                        Back
                    </button>

                    <div className='interview-nav__list'>
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => goToSection(item.id)}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}>
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="interview-nav__footer">
                        <button
                            onClick={handleDownloadResume}
                            className='download-btn'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Download Resume
                        </button>
                    </div>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>

                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestions?.length || 0} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions?.length > 0 ? (
                                    report.technicalQuestions.map((q, i) => (
                                        <QuestionCard key={i} item={q} index={i} />
                                    ))
                                ) : (
                                    <div className='empty-state'>
                                        <p>No technical questions generated for this profile yet.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestions?.length || 0} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions?.length > 0 ? (
                                    report.behavioralQuestions.map((q, i) => (
                                        <QuestionCard key={i} item={q} index={i} />
                                    ))
                                ) : (
                                    <div className='empty-state'>
                                        <p>No behavioral questions generated for this profile yet.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Strategy <span className='highlight'>Roadmap</span></h2>
                                <span className='content-header__count'>{report.preparationPlan?.length || 0}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {report.preparationPlan?.length > 0 ? (
                                    report.preparationPlan.map((day) => (
                                        <RoadMapDay key={day.day} day={day} />
                                    ))
                                ) : (
                                    <div className='empty-state'>
                                        <p>No preparation plan available for this report.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {activeNav === 'gaps' && (
                        <section>
                            <div className='content-header'>
                                <h2>Critical <span className='highlight'>Gap Analysis</span></h2>
                                <span className='content-header__count'>{report.weaknessAnalysis?.length || 0} Vulnerabilities</span>
                            </div>
                            <div className='gaps-list'>
                                {report.weaknessAnalysis?.length > 0 ? (
                                    report.weaknessAnalysis.map((item, i) => (
                                        <div key={i} className={`gap-card gap-card--${item.priority}`}>
                                            <div className="gap-card__header">
                                                <span className="priority-badge">{item.priority} priority</span>
                                                <h3>Vulnerability: {item.weakness}</h3>
                                            </div>
                                            <div className="gap-card__body">
                                                <div className="improvement-section">
                                                    <h4>Strategic Pivot & Improvement</h4>
                                                    <p>{item.improvement}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className='empty-state'>
                                        <p>Congratulations! No significant strategic gaps were identified for this profile.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {activeNav === 'tips' && (
                        <section>
                            <div className='content-header'>
                                <h2>Expert <span className='highlight'>Playbook</span></h2>
                                <span className='content-header__count'>{report.interviewTips?.length || 0} Expert Tips</span>
                            </div>
                            <div className='tips-list'>
                                {report.interviewTips?.length > 0 ? (
                                    report.interviewTips.map((tip, i) => (
                                        <div key={i} className='tip-card'>
                                            <span className='tip-card__icon'>💡</span>
                                            <p>{tip}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className='empty-state'>
                                        <p>No expert playbook strategies generated for this profile yet.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {activeNav === 'cheatsheet' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical <span className='highlight'>Mastery</span></h2>
                                <span className='content-header__count'>{report.cheatSheet?.length || 0} Core Topics</span>
                            </div>
                            <div className='cheatsheet-list'>
                                {report.cheatSheet?.length > 0 ? (
                                    report.cheatSheet.map((item, i) => (
                                        <div key={i} className='cheatsheet-card'>
                                            <h3>{item.topic}</h3>
                                            <p>{item.content}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className='empty-state'>
                                        <p>No technical mastery topics identified for this specific role yet.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                    {activeNav === 'dsa' && (
                        <section>
                            <div className='content-header'>
                                <h2>DSA <span className='highlight'>Pattern Roadmap</span></h2>
                                <span className='content-header__count'>{report.dsaAnalysis?.length || 0} Mastering Patterns</span>
                            </div>
                            <div className='dsa-roadmap'>
                                {report.dsaAnalysis?.length > 0 ? (
                                    report.dsaAnalysis.map((pattern, i) => (
                                        <div key={i} className='dsa-pattern-card'>
                                            <div className="dsa-pattern-header">
                                                <div className="pattern-badge">Pattern {i + 1}</div>
                                                <h3>{pattern.pattern}</h3>
                                            </div>
                                            <p className="pattern-description">{pattern.description}</p>

                                            <div className="pattern-questions">
                                                {pattern.questions?.map((q, j) => (
                                                    <div key={j} className="dsa-question-item">
                                                        <div className="q-info">
                                                            <span className={`difficulty difficulty--${q.difficulty?.toLowerCase()}`}>
                                                                {q.difficulty}
                                                            </span>
                                                            <span className="q-title">{q.title}</span>
                                                        </div>
                                                        <div className="q-strategy">
                                                            <strong>Key Strategy:</strong> {q.keyConcept}
                                                        </div>
                                                        <a href={`https://${q.link || 'leetcode.com'}`} target="_blank" rel="noopener noreferrer" className="q-link">
                                                            Solve Challenge <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className='empty-state'>
                                        <p>No algorithmic mastery patterns identified for this role yet.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>
                            {report.matchScore >= 85 ? "Excellent candidate for this role" :
                                report.matchScore >= 70 ? "Strong match with minor gaps" :
                                    "Strategic alignment required"}
                        </p>
                    </div>

                    <div className='sidebar-divider' />

                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {report.skillGaps?.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    )
}

export default Interview;