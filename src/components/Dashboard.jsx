import React from 'react';
import './Dashboard.css';

const Dashboard = ({ onNavigate, onLogout, user }) => {
  return (
    <div className="dashboard-container">
      <div className="header-bar">
        <div className="logo-title-container">
          <div className="dashboard-logo">
            <img
              src="https://automationedge.com/wp-content/uploads/2019/09/AE-Logo_c5bfc8be4434602d1da7a18476453594.png"
              alt="AutomationEdge Logo"
              className="company-logo"
            />
          </div>
          {/* <h1>POC Portal Dashboard</h1> */}
        </div>
        <div className="user-info">
          <span className="welcome-text">Welcome, {user?.emp_name || 'User'}</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <h2>What would you like to do?</h2>

        <div className="dashboard-buttons">
          <button
            className="dashboard-btn primary-btn"
            onClick={() => onNavigate('initiate')}
          >
            <span className="btn-icon">🚀</span>
            Initiate Usecases
            <span className="btn-description">Start a new proof of concept project</span>
          </button>

          <button
            className="dashboard-btn secondary-btn"
            onClick={() => onNavigate('poc-table')}
          >
            <span className="btn-icon">🔑</span>
            Usecases Code Creation
            <span className="btn-description">Manage Usecases access codes</span>
          </button>

          <button
            className="dashboard-btn report-btn"
            onClick={() => onNavigate('report')}
          >
            <span className="btn-icon">📊</span>
            Report
            <span className="btn-description">View various reports</span>
          </button>

          {/* New Button: Daily Status */}
          {/* <button
            className="dashboard-btn daily-status-btn"
            onClick={() => onNavigate('daily-status')}
          >
            <span className="btn-icon">📅</span>
            Daily Status
            <span className="btn-description">Update or view daily status</span>
          </button> */}
        </div>
      </div>
    </div>
  );
};

// Wrap the Dashboard component with the HOC
export default Dashboard;