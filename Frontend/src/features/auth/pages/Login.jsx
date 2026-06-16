import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {

    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [serverWaking, setServerWaking] = useState(false)

    useEffect(() => {
        const ping = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/health`, {
                    signal: AbortSignal.timeout(3000)
                })
            } catch {
                setServerWaking(true)
                
                setTimeout(() => setServerWaking(false), 15000)
            }
        }
        ping()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        const result = await handleLogin({ email, password })
        if (result?.success) {
            navigate('/')
        } else {
            setError(result?.error || 'Login failed. Please check your credentials.')
        }
    }

    if (loading) {
        return (
            <main className="auth-main">
                <div className="loader">
                    <div className="spinner"></div>
                    <h2>Logging you in...</h2>
                </div>
            </main>
        )
    }

    return (
        <main className="auth-main">
            {serverWaking && (
                <div className="server-banner">
                    <div className="server-banner-dot"></div>
                    <span>Server is waking up — this may take 30 seconds on first visit</span>
                </div>
            )}
            <div className="form-container">
                <div className="header-text">
                    <h1>Welcome Back</h1>
                    <p>Enter your credentials to access your account</p>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='name@example.com' required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='••••••••' required />
                    </div>
                    <button className='primary-button' type="submit" disabled={loading}>
                        Login to Dashboard
                    </button>
                </form>
                <div className="footer-text">
                    <p>Don't have an account? <Link to={"/register"}>Sign up</Link></p>
                </div>
            </div>
        </main>
    )
}

export default Login
