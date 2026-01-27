import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import './LoginPage.css';

// Move ChangePasswordDialog outside as a separate component
const ChangePasswordDialog = ({
    showChangePassword,
    setShowChangePassword,
    changePasswordData,
    setChangePasswordData,
    changePasswordLoading,
    setChangePasswordLoading,
    changePasswordError,
    setChangePasswordError,
    changePasswordSuccess,
    setChangePasswordSuccess,
    setSuccessMessage, // Add this prop
    setError, // Add this prop
    setCredentials // Add this prop to clear login form
}) => {
    // Add this missing function:
    const handleChangePasswordInput = useCallback((e) => {
        const { name, value } = e.target;
        setChangePasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        setChangePasswordError('');
        setChangePasswordSuccess('');
    }, [setChangePasswordData, setChangePasswordError, setChangePasswordSuccess]);


    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        setChangePasswordLoading(true);
        setChangePasswordError('');
        setChangePasswordSuccess('');

        try {
            const response = await axios.post('http://localhost:5050/poc/api/auth/change-password', changePasswordData, {
                withCredentials: true
            });

            if (response.status === 200) {
                // Show success message on login page
                setSuccessMessage('Password updated successfully! Please login with your new password.');

                // Clear any existing error
                setError('');

                // Clear the login form credentials
                setCredentials({
                    username: '',
                    password: ''
                });

                // Immediately close the dialog
                setShowChangePassword(false);

                // Clear change password form data
                setChangePasswordData({
                    username: '',
                    oldPassword: '',
                    newPassword: ''
                });
            }
        } catch (error) {
            if (error.response) {
                setChangePasswordError(error.response.data.message || 'Failed to change password');
            } else if (error.request) {
                setChangePasswordError('Network error. Please check your connection.');
            } else {
                setChangePasswordError('An unexpected error occurred: ' + error.message);
            }
        } finally {
            setChangePasswordLoading(false);
        }
    };

    if (!showChangePassword) return null;

    return (
        <div className="dialog-overlay">
            <div className="change-password-dialog">
                <div className="dialog-header">
                    <h3>Change Password</h3>
                    <button
                        className="close-btn"
                        onClick={() => {
                            setShowChangePassword(false);
                            setChangePasswordData({
                                username: '',
                                oldPassword: '',
                                newPassword: ''
                            });
                            setChangePasswordError('');
                            setChangePasswordSuccess('');
                            setSuccessMessage(''); // Clear success message when closing dialog
                        }}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleChangePasswordSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            name="username"
                            value={changePasswordData.username}
                            onChange={handleChangePasswordInput}
                            required
                            disabled={changePasswordLoading}
                            placeholder=" "
                        />
                        <label>Username</label>
                        <div className="underline"></div>
                    </div>

                    <div className="input-group">
                        <input
                            type="password"
                            name="oldPassword"
                            value={changePasswordData.oldPassword}
                            onChange={handleChangePasswordInput}
                            required
                            disabled={changePasswordLoading}
                            placeholder=" "
                        />
                        <label>Current Password</label>
                        <div className="underline"></div>
                    </div>

                    <div className="input-group">
                        <input
                            type="password"
                            name="newPassword"
                            value={changePasswordData.newPassword}
                            onChange={handleChangePasswordInput}
                            required
                            disabled={changePasswordLoading}
                            placeholder=" "
                        />
                        <label>New Password</label>
                        <div className="underline"></div>
                    </div>

                    {changePasswordError && <div className="error-message">{changePasswordError}</div>}
                    {changePasswordSuccess && <div className="success-message">{changePasswordSuccess}</div>}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={changePasswordLoading || !changePasswordData.username || !changePasswordData.oldPassword || !changePasswordData.newPassword}
                    >
                        {changePasswordLoading ? (
                            <>
                                <span className="spinner"></span>
                                Updating...
                            </>
                        ) : (
                            'Change Password'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Main LoginPage component
const LoginPage = ({ onLogin }) => {
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Add these states for change password functionality
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [changePasswordData, setChangePasswordData] = useState({
        username: '',
        oldPassword: '',
        newPassword: ''
    });
    const [changePasswordLoading, setChangePasswordLoading] = useState(false);
    const [changePasswordError, setChangePasswordError] = useState('');
    const [changePasswordSuccess, setChangePasswordSuccess] = useState('');


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
        setSuccessMessage(''); // Clear success message when user starts typing
    };

    return (
        <>
            <div className="login-container">
                <div className="background-animation">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                    <div className="shape shape-4"></div>
                </div>

                <div className="login-card">
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

                    <form onSubmit={handleSubmit}>
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
                        {successMessage && <div className="success-message">{successMessage}</div>} {/* Add this line */}

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

                        <button
                            type="button"
                            className="change-password-button"
                            onClick={() => setShowChangePassword(true)}
                        >
                            Change Password
                        </button>
                    </form>
                </div>
            </div>

            <ChangePasswordDialog
                showChangePassword={showChangePassword}
                setShowChangePassword={setShowChangePassword}
                changePasswordData={changePasswordData}
                setChangePasswordData={setChangePasswordData}
                changePasswordLoading={changePasswordLoading}
                setChangePasswordLoading={setChangePasswordLoading}
                changePasswordError={changePasswordError}
                setChangePasswordError={setChangePasswordError}
                changePasswordSuccess={changePasswordSuccess}
                setChangePasswordSuccess={setChangePasswordSuccess}
                setSuccessMessage={setSuccessMessage} // Pass this prop
                setError={setError} // Pass this prop
                setCredentials={setCredentials} // Pass this prop
            />
        </>
    );
};

export default LoginPage;