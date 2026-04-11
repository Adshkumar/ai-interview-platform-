import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../auth.form.scss";

const Register = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: username, email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.message || 'Registration failed. Please try again.');
                return;
            }
            navigate("/");
        } catch (err) {
            setError('Unable to connect to server. Please try again in a moment.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="auth-main">
                <div className="loader">
                    <div className="spinner"></div>
                    <h2>Creating Account...</h2>
                </div>
            </main>
        );
    }

    return (
        <main className="auth-main">
            <div className="form-container">
                <div className="header-text">
                    <h1>Create Account</h1>
                    <p>Join us and start your journey today</p>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Enter username"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            name="email"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button className="primary-button" type="submit" disabled={loading}>
                        Create Account
                    </button>
                </form>
                <div className="register-footer">
                    <p>
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </main>
    );
};

export default Register;