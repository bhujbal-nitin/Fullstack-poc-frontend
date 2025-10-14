import React, { useState, useEffect } from 'react';
import './Dashboard.css';

import { Add as AddIcon } from '@mui/icons-material';

const Dashboard = ({ onNavigate, onLogout, user }) => {
 

  console.log(user);

  const [permissions, setPermissions] = useState({
    dashboard_access: false,
    report_access: false,
    usecase_creation_access: false,
    status_access: true,
    sales_access: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5050/poc/permissions/${user.emp_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

 
      if (response.ok) {
        const userPermissions = await response.json();
        setPermissions(userPermissions);
        console.log('Fetched Permissions:', userPermissions);
      } else {
        console.error('Failed to fetch permissions');
        // Default to status access only
        setPermissions({
          dashboard_access: false,
          report_access: false,
          usecase_creation_access: false,
          status_access: false,
          sales_access: true
        });
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // Default to status access only on error
      setPermissions({
        dashboard_access: false,
        report_access: false,
        usecase_creation_access: false,
        status_access: false,
        sales_access: true
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="header1-bar">
        <div className="logo-title-container">
          <div className="dashboard-logo">
            <img
              src="https://automationedge.com/wp-content/uploads/2019/09/AE-Logo_c5bfc8be4434602d1da7a18476453594.png"
              alt="AutomationEdge Logo"
              className="company-logo"
            />
          </div>
        </div>
        <div className="user-info">
          <span className="welcome-text">
            Welcome, {user?.emp_name}
            {user?.emp_id && ` (${user.emp_id})`}
          </span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <h2>What would you like to do?</h2>

        <div className="dashboard-buttons">
          {/* Initiate Usecases - Controlled by dashboard_access */}
          {permissions.sales_access && (
            <button
              className="dashboard-btn primary-btn"
              onClick={() => onNavigate('poc-records')}
            >
              <span className="btn-icon">🚀</span>
              Initiate Usecases
              <span className="btn-description">Start a new proof of concept project</span>
            </button>
          )}

          {/* Usecases Code Creation - Controlled by usecase_creation_access */}
          {permissions.usecase_creation_access && (
            <button
              className="dashboard-btn secondary-btn"
              onClick={() => onNavigate('poc-table')}
            >
              <span className="btn-icon">
                <AddIcon sx={{
                  color: 'green',
                  fontSize: 60,
                  fontWeight: 'bold',
                  transform: 'scale(1.2)',
                  strokeWidth: 2
                }} />
              </span>
              Usecases Code Creation
              <span className="btn-description">Manage Usecases access codes</span>
            </button>
          )}

          {/* Report - Controlled by report_access */}
          {permissions.report_access && (
            <button
              className="dashboard-btn report-btn"
              onClick={() => onNavigate('report')}
            >
              <span className="btn-icon">📊</span>
              Report
              <span className="btn-description">View various reports</span>
            </button>
          )}

          {/* Daily Status - Controlled by status_access (default true) */}
          {permissions.status_access && (
            <button
              className="dashboard-btn daily-status-btn"
              onClick={() => onNavigate('status-tracker')}
            >
              <span className="btn-icon">📅</span>
              Daily Status
              <span className="btn-description">Update or view daily status</span>
            </button>
          )}

          {/* Sales - Controlled by sales_access */}
          {/* {permissions.sales_access && (
            <button 
              className="dashboard-btn sales-btn"
              onClick={() => onNavigate('sales')}
            >
              <span className="btn-icon">💰</span>
              Sales
              <span className="btn-description">Sales related operations</span>
            </button>
          )} */}

          {/* Show message if no permissions */}
          {!permissions.dashboard_access &&
            !permissions.usecase_creation_access &&
            !permissions.report_access &&
            !permissions.sales_access &&
            !permissions.status_access && (
              <div className="no-access-message">
                <p>You don't have access to any dashboard features. Please contact administrator.</p>
              </div>
            )}
        </div>

        {/* Display current permissions for debugging (remove in production) */}
        {/* <div className="permissions-debug" style={{marginTop: '20px', fontSize: '12px', color: '#666'}}>
          <strong>Your Permissions:</strong> 
          Dashboard: {permissions.dashboard_access ? 'Yes' : 'No'} | 
          Reports: {permissions.report_access ? 'Yes' : 'No'} | 
          Usecase Creation: {permissions.usecase_creation_access ? 'Yes' : 'No'} | 
          Status: {permissions.status_access ? 'Yes' : 'No'} | 
          Sales: {permissions.sales_access ? 'Yes' : 'No'}
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;