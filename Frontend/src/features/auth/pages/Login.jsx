import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import "../auth.form.scss"
import "../../style/button.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {

    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleLogin({ email, password })
        navigate('/')
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
            <div className="form-container">
                <div className="header-text">
                    <h1>Welcome Back</h1>
                    <p>Enter your credentials to access your account</p>
                </div>
                <form onSubmit={handleSubmit}>
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
                    <button className='primary-button' type="submit">Login to Dashboard</button>
                </form>
                <div className="footer-text">
                    <p>Don't have an account? <Link to={"/register"} >Sign up</Link></p>
                </div>
            </div>
        </main>
    )
}

export default Login