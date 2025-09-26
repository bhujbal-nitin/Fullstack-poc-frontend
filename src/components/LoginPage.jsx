import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [animationParent] = useAutoAnimate();
    const formRef = useRef(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // const response = await axios.post('/poc/api/auth/login', credentials, {
            //     withCredentials: true
            // });
            const response = await axios.post('http://localhost:5050/poc/api/auth/login', credentials, {
                withCredentials: true
            });
            if (response.status === 200) {
                const { token, user } = response.data;
                localStorage.setItem('authToken', token);
                localStorage.setItem('user', JSON.stringify(user));
                onLogin(user);
            }
        } catch (error) {
            if (error.response) {
                setError(error.response.data.message || 'Login failed');
            } else if (error.request) {
                setError('Network error. Please check your connection and ensure the backend is running on port 5050.');
            } else {
                setError('An unexpected error occurred: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="background-animation">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
                <div className="shape shape-4"></div>
            </div>

            <div className="login-card" ref={animationParent}>
                <div className="logo-container">
                    <img
                        src="https://automationedge.com/wp-content/uploads/2019/09/AE-Logo_c5bfc8be4434602d1da7a18476453594.png"
                        alt="AutomationEdge Logo"
                        className="company-logo"
                    />
                </div>

                <div className="card-header">
                    <h2>Welcome to AutomationEdge</h2>
                    <p>Please enter your credentials to continue</p>
                </div>

                <form onSubmit={handleSubmit} ref={formRef}>
                    <div className="input-group">
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={credentials.username}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                            placeholder=" "
                        />
                        <label htmlFor="username">Username</label>
                        <div className="underline"></div>
                    </div>

                    <div className="input-group">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                            placeholder=" "
                        />
                        <label htmlFor="password">Password</label>
                        <div className="underline"></div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading || !credentials.username || !credentials.password}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Logging in...
                            </>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>

                {/* <div className="card-footer">
                    <p>Need help? <a href="#">Contact Support</a></p>
                    <a href="#" className="forgot-link">Forgot password?</a>
                </div> */}
            </div>
        </div>
    );
};

export default LoginPage;