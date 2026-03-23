import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import "../../style/button.scss"

const Register = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (userData) => {
        try {
            const response = await fetch('http://localhost:4000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: username, email, password }),
            });
            if (!response.ok) {
                throw new Error('Registration failed');
            }
            const data = await response.json();
            console.log('Success:', data);
            return data;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await handleRegister({ username, email, password });
            navigate("/");
        } catch (error) {
            alert('Registration error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <main><h1>Loading.......</h1></main>;
    }

    return (
        <main>
            <div className="form-container">
                <h1>Register</h1>
                <form onSubmit={handleSubmit}>
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
                        <label htmlFor="email">Email</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter email address"
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
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    <button className="button primary-button" type="submit" disabled={loading}>
                        Register
                    </button>
                </form>
                <p>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </main>
    );
};

export default Register;