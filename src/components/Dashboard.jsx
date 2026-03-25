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
  AdminPanelSettings,
  MenuBook
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
    knowledge_base_access: true,
    sales_report_card_access: false
  });
  const [loading, setLoading] = useState(true);
  const [activeDashboard, setActiveDashboard] = useState('');
  const [activeTab, setActiveTab] = useState('poc');
  const [error, setError] = useState(null);

  const logoutInProgress = useRef(false);
  const lastActivity = useRef(Date.now());
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  // Token expiry check
  const isTokenExpired = useCallback((token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }, []);

  // Auto logout handler
  const handleAutoLogout = useCallback(() => {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;

    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    onLogout();
  }, [onLogout]);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  // Safe navigation with token check
  const safeNavigate = useCallback((route) => {
    const token = localStorage.getItem('authToken');
    if (!token || isTokenExpired(token)) {
      handleAutoLogout();
      return;
    }
    onNavigate(route);
  }, [handleAutoLogout, isTokenExpired, onNavigate]);

  // Safe tab setter with token check
  const safeSetActiveTab = useCallback((tab) => {
    const token = localStorage.getItem('authToken');
    if (!token || isTokenExpired(token)) {
      handleAutoLogout();
      return;
    }
    setActiveTab(tab);
  }, [handleAutoLogout, isTokenExpired]);

  // Fetch user permissions
  const fetchUserPermissions = useCallback(async () => {
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

      if (response.status === 401) {
        handleAutoLogout();
        return;
      }

      if (response.status === 403) {
        console.error('Access forbidden');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userPermissions = await response.json();
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setError('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, [user, handleAutoLogout, isTokenExpired]);

  // Set initial dashboard based on user role
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const departmentName = storedUser?.department_name;
    const role = storedUser?.role;

    if (role === 'Department Admin') {
      setActiveDashboard('Admin Dashboard');
      setActiveTab('poc');
    } else if (departmentName === 'PCS ROW') {
      setActiveDashboard('POC Dashboard');
      setActiveTab('poc');
    } else if (departmentName === 'SC(Solution Consultant)') {
      setActiveDashboard('sales');
      setActiveTab('sales');
    }
    else if (departmentName === 'KB') {  // Add this condition
      setActiveDashboard('Knowledge Base');
      setActiveTab('knowledge');  // You might want to add a knowledge tab
    } else {
      setActiveDashboard('General Dashboard');
    }
  }, []);

  // Initial token check and permissions fetch
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token || isTokenExpired(token)) {
      handleAutoLogout();
      return;
    }
    fetchUserPermissions();
  }, [fetchUserPermissions, handleAutoLogout, isTokenExpired]);

  // Periodic token expiry check
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('authToken');
      if (token && isTokenExpired(token)) {
        handleAutoLogout();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [handleAutoLogout, isTokenExpired]);

  // Inactivity tracking
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'mousemove'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    const interval = setInterval(() => {
      if (Date.now() - lastActivity.current > INACTIVITY_TIMEOUT) {
        handleAutoLogout();
      }
    }, 60000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [handleAutoLogout, updateActivity]);

  // Session expiry warning
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const timeUntilExpiry = payload.exp * 1000 - Date.now();

      if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
        // Show warning 5 minutes before expiry
        console.log('Session expiring soon');
      }

      const logoutTimer = setTimeout(() => {
        handleAutoLogout();
      }, timeUntilExpiry);

      return () => clearTimeout(logoutTimer);
    } catch {
      // Handle error silently
    }
  }, [handleAutoLogout]);

  // Block UI rendering when logout is in progress
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
  const isSalesDept = departmentName === 'SC(Solution Consultant)';
  const isPOCTeam = departmentName === 'PCS ROW';
  const isKBDept = departmentName === 'KB';
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

      {/* Knowledge Base */}
      {permissions.knowledge_base_access && (
        <div className="card knowledge-card" onClick={() => safeNavigate('knowledge-base')}>
          <div className="card-icon">
            <MenuBook className="icon-knowledge" />
          </div>
          <div className="card-content">
            <h3>Knowledge Base</h3>
            <p>Access documentation and guides</p>
            <div className="card-footer">
              <span className="card-tag">Resources</span>
              <span className="card-arrow">→</span>
            </div>
          </div>
        </div>
      )}


      {/* Sales Report Card - Add this new card */}
      {permissions.sales_report_card_access && (
        <div className="card sales-report-card" onClick={() => safeNavigate('sales-report')}>
          <div className="card-icon">
            <Assessment className="icon-sales-report" />
          </div>
          <div className="card-content">
            <h3>Sales Report</h3>
            <p>View sales reports and analytics</p>
            <div className="card-footer">
              <span className="card-tag">Sales Analytics</span>
              <span className="card-arrow">→</span>
            </div>
          </div>
        </div>
      )}

      {!permissions.dashboard_access &&
        !permissions.usecase_creation_access &&
        !permissions.report_access &&
        !permissions.sales_access &&
        !permissions.status_access &&
        !permissions.admin_access &&
        !permissions.knowledge_base_access && 
        !permissions.sales_report_card_access && (
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
            <p>Update or view SC daily status</p>
            <div className="card-footer">
              <span className="card-tag">SC Tracking</span>
              <span className="card-arrow">→</span>
            </div>
          </div>
        </div>
      )}



      {!permissions.sales_dashboard_access && !permissions.status_status_access && (
        <div className="no-access-card">
          <div className="no-access-content">
            <div className="no-access-icon">🔒</div>
            <h3>Limited Access</h3>
            <p>You don't have access to SC Dashboard features.</p>
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
          <span>SC Dashboard</span>
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
              <h2>SC Management</h2>
              <p>Tools and features for SC department</p>
            </div>
            {renderSalesFeatures()}
          </>
        )}
      </div>
    </div>
  );

  // Render Regular User Dashboard
  const renderUserDashboard = () => {
    if (isPOCTeam || isKBDept || departmentName === 'sales') {
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
            <h2>SC Dashboard</h2>
            <p>Tools and features for SC department</p>
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
          <p>You are not part of the POC Team or SC Department.</p>
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
              ? 'You have full access to both POC and SC dashboards'
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