import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { useCallback } from 'react';
import { useRef } from 'react';


import {
  Add as AddIcon,
  RocketLaunch,
  Assessment,
  Today,
  EventNote,
  Business,
  Dashboard as DashboardIcon,
  Code,
  Logout,
  Person,
  ViewModule,
  Sell,
  AdminPanelSettings
} from '@mui/icons-material';

const Dashboard = ({ onNavigate, onLogout, user }) => {
  const [permissions, setPermissions] = useState({
    dashboard_access: false,
    report_access: false,
    usecase_creation_access: false,
    status_access: true,
    sales_access: false,
    leave_access: false,
    sales_dashboard_access: false,
    status_status_access: false,
    admin_access: false,
  });
  const [loading, setLoading] = useState(true);
  const [activeDashboard, setActiveDashboard] = useState('');
  const [activeTab, safeSetactivetab] = useState('poc'); // 'poc' or 'sales'

  const logoutInProgress = useRef(false);


  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const departmentName = storedUser?.department_name;
    const role = storedUser?.role;

    if (role === 'Department Admin') {
      setActiveDashboard('Admin Dashboard');
      safeSetactivetab('poc'); // Default to POC tab
    } else if (departmentName === 'PCS ROW') {
      setActiveDashboard('POC Dashboard');
      safeSetactivetab('poc');
    } else if (departmentName === 'sales') {
      setActiveDashboard('Sales Dashboard');
      safeSetactivetab('sales');
    } else {
      setActiveDashboard('General Dashboard');
    }
  }, []);

  const fetchUserPermissions = async () => {
    const token = localStorage.getItem('authToken');

    if (!token || isTokenExpired(token)) {
      handleAutoLogout();
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API}/poc/permissions/${user.emp_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleAutoLogout();
        return;
      }

      if (response.ok) {
        const userPermissions = await response.json();
        setPermissions(userPermissions);
      }
    } catch (error) {
      handleAutoLogout();
    } finally {
      setLoading(false);
    }
  };


  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (e) {
      return true;
    }
  };
  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token || isTokenExpired(token)) {
      handleAutoLogout();
      return;
    }

    fetchUserPermissions();
  }, []);

  const handleAutoLogout = useCallback(() => {
    if (logoutInProgress.current) return; // 🔥 prevent multiple calls

    logoutInProgress.current = true;

    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    onLogout();
  }, [onLogout]);

  const safeNavigate = (route) => {
    const token = localStorage.getItem('authToken');

    if (!token || isTokenExpired(token)) {
      handleAutoLogout();
      return; // ❌ STOP navigation
    }

    onNavigate(route);
  };

  const safeSetActiveTab = (tab) => {
    const token = localStorage.getItem('authToken');

    if (!token || isTokenExpired(token)) {
      handleAutoLogout();
      return;
    }

    safeSetactivetab(tab);
  };



  // 🔒 Block UI rendering when logout is in progress
  if (logoutInProgress.current) {
    return (
      <div className="dashboard-container">
        <p>Session expired. Redirecting to login...</p>
      </div>
    );
  }


  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }


  const storedUser = JSON.parse(localStorage.getItem('user'));
  const departmentName = storedUser?.department_name;
  const userRole = storedUser?.role;
  const isSalesDept = departmentName === 'sales';
  const isPOCTeam = departmentName === 'PCS ROW';
  const isDeptAdmin = userRole === 'Department Admin';

  // Render POC Features Card Grid
  const renderPOCFeatures = () => (
    <div className="dashboard-grid">


      {/* Admin Card (only for users with admin_access */}
      {permissions.admin_access && (
        <div className="card admin-card" onClick={() => safeNavigate('admin')}>
          <div className="card-icon">
            <AdminPanelSettings className="icon-admin" />
          </div>
          <div className="card-content">
            <h3>Admin</h3>
            <p>Access admin settings and configurations</p>
            <div className="card-footer">
              <span className="card-tag">Administration</span>
              <span className="card-arrow">→</span>
            </div>
          </div>
        </div>
      )}


      {/* Initiate Usecases */}
      {permissions.sales_access && (
        <div className="card primary-card" onClick={() => safeNavigate('poc-records')}>
          <div className="card-icon">
            <RocketLaunch className="icon-primary" />
          </div>
          <div className="card-content">
            <h3>Initiate Usecases</h3>
            <p>Start a new proof of concept project</p>
            <div className="card-footer">
              <span className="card-tag">Quick Start</span>
              <span className="card-arrow">→</span>
            </div>
          </div>
        </div>
      )}

      {/* Usecases Code Creation */}
      {permissions.usecase_creation_access && (
        <div className="card secondary-card" onClick={() => safeNavigate('poc-table')}>
          <div className="card-icon">
            <Code className="icon-secondary" />
          </div>
          <div className="card-content">
            <h3>Usecases Code Creation</h3>
            <p>Manage Usecases access codes</p>
            <div className="card-footer">
              <span className="card-tag">Configuration</span>
              <span className="card-arrow">→</span>
            </div>
          </div>
        </div>
      )}

      {/* Report */}
      {permissions.report_access && (
        <div className="card report-card" onClick={() => safeNavigate('report')}>
          <div className="card-icon">
            <Assessment className="icon-report" />
          </div>
          <div className="card-content">
            <h3>Reports</h3>
            <p>View various reports and analytics</p>
            <div className="card-footer">
              <span className="card-tag">Analytics</span>
              <span className="card-arrow">→</span>
            </div>
          </div>
        </div>
      )}

      {/* Daily Status */}
      {permissions.status_access && (
        <div className="card status-card" onClick={() => safeNavigate('status-tracker')}>
          <div className="card-icon">
            <Today className="icon-status" />
          </div>
          <div className="card-content">
            <h3>Daily Status</h3>
            <p>Update or view daily status</p>
            <div className="card-footer">
              <span className="card-tag">Tracking</span>
              <span className="card-arrow">→</span>
            </div>
          </div>
        </div>
      )}


      {/* Dashboard Access */}
      {/* {permissions.dashboard_access && (
        <div className="card dashboard-card" onClick={() => safeNavigate('dashboard')}>
          <div className="card-icon">
            <DashboardIcon className="icon-dashboard" />
          </div>
          <div className="card-content">
            <h3>Main Dashboard</h3>
            <p>Access main dashboard features</p>
            <div className="card-footer">
              <span className="card-tag">Overview</span>
              <span className="card-arrow">→</span>
            </div>
          </div>
        </div>
      )} */}

      {!permissions.dashboard_access &&
        !permissions.usecase_creation_access &&
        !permissions.report_access &&
        !permissions.sales_access &&
        !permissions.status_access && 
        !permissions.admin_access && (
          <div className="no-access-card">
            <div className="no-access-content">
              <div className="no-access-icon">⚠️</div>
              <h3>No Access Granted</h3>
              <p>You don't have access to any POC features.</p>
              <p className="contact-admin">Please contact your administrator.</p>
            </div>
          </div>
        )}
    </div>
  );

  // Render Sales Features Card Grid
  const renderSalesFeatures = () => (
    <div className="dashboard-grid">
      {permissions.sales_dashboard_access && (
        <div className="card sales-card" onClick={() => safeNavigate('sales-Info')}>
          <div className="card-icon">
            <AddIcon className="icon-sales" />
          </div>
          <div className="card-content">
            <h3>Usecases Details</h3>
            <p>Access sales usecases information</p>
            <div className="card-footer">
              <span className="card-tag">Sales</span>
              <span className="card-arrow">→</span>
            </div>
          </div>
        </div>
      )}

      {permissions.status_status_access && (
        <div className="card sales-status-card" onClick={() => safeNavigate('sales-status-tracker')}>
          <div className="card-icon">
            <Today className="icon-sales-status" />
          </div>
          <div className="card-content">
            <h3>Daily Status</h3>
            <p>Update or view sales daily status</p>
            <div className="card-footer">
              <span className="card-tag">Sales Tracking</span>
              <span className="card-arrow">→</span>
            </div>
          </div>
        </div>
      )}

      {/* Add more sales features here as needed */}
      {/* <div className="card sales-card" onClick={() => safeNavigate('sales-analytics')}>
        <div className="card-icon">
          <Assessment className="icon-sales" />
        </div>
        <div className="card-content">
          <h3>Sales Analytics</h3>
          <p>View sales performance metrics</p>
          <div className="card-footer">
            <span className="card-tag">Analytics</span>
            <span className="card-arrow">→</span>
          </div>
        </div>
      </div> */}

      {!permissions.sales_dashboard_access && !permissions.status_status_access && (
        <div className="no-access-card">
          <div className="no-access-content">
            <div className="no-access-icon">🔒</div>
            <h3>Limited Access</h3>
            <p>You don't have access to Sales Dashboard features.</p>
            <p className="contact-admin">Contact administrator for access.</p>
          </div>
        </div>
      )}
    </div>
  );

  // Render Admin Dashboard with Tabs
  const renderAdminDashboard = () => (
    <div className="admin-dashboard">
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'poc' ? 'active' : ''}`}
          onClick={() => safeSetActiveTab('poc')}
        >
          <ViewModule />
          <span>POC Dashboard</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => safeSetActiveTab('sales')}
        >
          <Sell />
          <span>Sales Dashboard</span>
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'poc' && (
          <>
            <div className="section-header">
              <h2>POC Management</h2>
              <p>Manage proof of concept projects and configurations</p>
            </div>
            {renderPOCFeatures()}
          </>
        )}

        {activeTab === 'sales' && (
          <>
            <div className="section-header">
              <h2>Sales Management</h2>
              <p>Tools and features for sales department</p>
            </div>
            {renderSalesFeatures()}
          </>
        )}
      </div>
    </div>
  );

  // Render Regular User Dashboard
  const renderUserDashboard = () => {
    if (isPOCTeam) {
      return (
        <>
          <div className="section-header">
            <h2>POC Management</h2>
            <p>Manage proof of concept projects and configurations</p>
          </div>
          {renderPOCFeatures()}
        </>
      );
    } else if (isSalesDept) {
      return (
        <>
          <div className="section-header">
            <h2>Sales Dashboard</h2>
            <p>Tools and features for sales department</p>
          </div>
          <div className="dashboard-grid">
            {renderSalesFeatures()}
          </div>
        </>
      );
    } else {
      return (
        <div className="no-access-message">
          <div className="no-access-illustration">
            <Business sx={{ fontSize: 80, color: '#e0e0e0' }} />
          </div>
          <h2>Access Restricted</h2>
          <p>You are not part of the POC Team or Sales Department.</p>
          <p className="contact-support">Please contact support if you believe this is an error.</p>
        </div>
      );
    }
  };

  return (
    <div className="dashboard-container">
      {/* Enhanced Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-container">
            <img
              src="https://automationedge.com/wp-content/uploads/2019/09/AE-Logo_c5bfc8be4434602d1da7a18476453594.png"
              alt="AutomationEdge Logo"
              className="company-logo"
            />
          </div>
          <div className="dashboard-title">
            <h1>{activeDashboard}</h1>
            <div className="department-badge">
              <Business fontSize="small" />
              <span>{isDeptAdmin ? 'Department Admin' : departmentName || 'General'}</span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="user-profile">
            <div className="user-avatar">
              <Person />
            </div>
            <div className="user-details">
              <h3 className="user-name">{user?.emp_name}</h3>
              <p className="user-id">{user?.emp_id}</p>
              <p className="user-role">{user?.role || 'User'}</p>
            </div>
          </div>
          <button onClick={onLogout} className="logout-btn">
            <Logout />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Welcome back, {user?.emp_name?.split(' ')[0]}! 👋</h2>
          <p className="subtitle">
            {isDeptAdmin
              ? 'You have full access to both POC and Sales dashboards'
              : 'What would you like to do today?'}
          </p>
        </div>

        {isDeptAdmin ? renderAdminDashboard() : renderUserDashboard()}
      </main>

      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} AutomationEdge POC System. All rights reserved.</p>
        <p className="footer-info">Version 1.0.0 • {activeDashboard}</p>
      </footer>
    </div>
  );
};

export default Dashboard;