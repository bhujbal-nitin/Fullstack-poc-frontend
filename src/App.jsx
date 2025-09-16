import React, { useState, useEffect } from "react";
import Pageheading from "./components/Pageheading";
import Dropdown from "./components/DropDown";
import TextInput from "./components/TextInput";
import UsecaseDetails from "./components/UsecaseDetails";
import Button from "./components/Button";
import Dashboard from "./components/Dashboard";
import PocPrjId from "./components/PocPrjId";
import LoginPage from "./components/LoginPage";
import PocTable from "./components/PocTable";
import axios from "axios";
import "./App.css";

function App() {
  // Authentication and navigation state
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // POC Form states
  const [salesPerson, setSalesPerson] = useState("");
  const [salesPersons, setSalesPersons] = useState([]);
  const [loadingSalesPersons, setLoadingSalesPersons] = useState(false);
  const [region, setRegion] = useState("");
  const [regions, setRegions] = useState(['ROW', 'ISSARC', 'America', 'Other']);
  const [endCustomerType, setEndCustomerType] = useState("");
  const [endCustomerTypes, setEndCustomerTypes] = useState(['Client', 'Internal', 'Partner']);
  const [processType, setProcessType] = useState("");
  const [processTypes, setProcessTypes] = useState([
    'POC',
    'POP',
    'Partner Support',
    'Feasibility Check',
    'Operational Support',
    'R&D',
    'Solution Consultation',
    'Efforts Estimation',
    'Task',
    'Demo',
    'Internal',
    'Event',
    'Workshop'
  ]);
  const [partnerCompanyName, setPartnerCompanyName] = useState("");
  const [partnerSpoc, setPartnerSpoc] = useState("");
  const [partnerSpocEmail, setPartnerSpocEmail] = useState("");
  const [partnerDesignation, setPartnerDesignation] = useState("");
  const [partnerMobileNumber, setPartnerMobileNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [spoc, setSpoc] = useState("");
  const [spocEmail, setSpocEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [usecase, setUsecase] = useState("");
  const [brief, setBrief] = useState("");
  const [submittedData, setSubmittedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Function to fetch sales persons from API
  const fetchSalesPersons = (token) => {
    setLoadingSalesPersons(true);
    axios.get('http://localhost:5050/poc/getAllSalesPerson', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.data && Array.isArray(response.data)) {
        setSalesPersons(response.data);
      } else {
        console.error('Invalid response format for sales persons');
        setSalesPersons([]);
      }
    })
    .catch(error => {
      console.error('Error fetching sales persons:', error);
      setSalesPersons([]);
    })
    .finally(() => {
      setLoadingSalesPersons(false);
    });
  };

  // Check if user is already logged in on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      // Validate token with backend
      axios.get('http://localhost:5050/api/auth/validate', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(response => {
        if (response.data.valid) {
          setCurrentUser(JSON.parse(userData));
          setCurrentView('dashboard');
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch sales persons after successful authentication
          fetchSalesPersons(token);
        }
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      })
      .finally(() => {
        setAuthChecked(true);
      });
    } else {
      setAuthChecked(true);
    }
  }, []);

  // Handle login
  const handleLogin = (user) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
    // Set default auth header for all requests
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch sales persons after login
      fetchSalesPersons(token);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5050/api/auth/logout', {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setCurrentUser(null);
      setCurrentView('login');
      // Clear sales persons data on logout
      setSalesPersons([]);
    }
  };

  // Navigation functions
  const navigateTo = (view) => {
    setCurrentView(view);
  };

  // Live update & remove error
  const handleChange = (field, value) => {
    switch (field) {
      case "salesPerson": setSalesPerson(value); break;
      case "region": setRegion(value); break;
      case "endCustomerType": setEndCustomerType(value); break;
      case "processType": setProcessType(value); break;
      case "companyName": setCompanyName(value); break;
      case "spoc": setSpoc(value); break;
      case "spocEmail": setSpocEmail(value); break;
      case "designation": setDesignation(value); break;
      case "mobileNumber": setMobileNumber(value); break;
      case "usecase": setUsecase(value); break;
      case "brief": setBrief(value); break;
      case "partnerCompanyName": setPartnerCompanyName(value); break;
      case "partnerSpoc": setPartnerSpoc(value); break;
      case "partnerSpocEmail": setPartnerSpocEmail(value); break;
      case "partnerDesignation": setPartnerDesignation(value); break;
      case "partnerMobileNumber": setPartnerMobileNumber(value); break;
      default: break;
    }

    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      if (field === "mobileNumber" || field === "partnerMobileNumber") {
        if (/^[0-9]{10}$/.test(value)) delete newErrors[field];
      } else if (value) {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  // Form submit
  const handleSubmit = () => {
    let newErrors = {};

    if (!salesPerson) newErrors.salesPerson = "Required";
    if (!region) newErrors.region = "Required";
    if (!endCustomerType) newErrors.endCustomerType = "Required";
    if (!processType) newErrors.processType = "Required";
    if (!companyName) newErrors.companyName = "Required";
    if (!spoc) newErrors.spoc = "Required";
    if (!spocEmail) newErrors.spocEmail = "Required";
    if (!designation) newErrors.designation = "Required";
    if (mobileNumber && !/^[0-9]{10}$/.test(mobileNumber)) {
      newErrors.mobileNumber = "Must be 10 digits";
    }
    if (!usecase) newErrors.usecase = "Required";
    if (!brief) newErrors.brief = "Required";

    if (endCustomerType === "Partner") {
      if (!partnerCompanyName) newErrors.partnerCompanyName = "Required";
      if (!partnerSpoc) newErrors.partnerSpoc = "Required";
      if (!partnerSpocEmail) newErrors.partnerSpocEmail = "Required";
      if (!partnerDesignation) newErrors.partnerDesignation = "Required";
      if (partnerMobileNumber && !/^[0-9]{10}$/.test(partnerMobileNumber)) {
        newErrors.partnerMobileNumber = "Must be 10 digits";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload = {
      salesPerson,
      region,
      endCustomerType,
      processType,
      companyName,
      spoc,
      spocEmail,
      designation,
      mobileNumber,
      usecase,
      brief,
      partnerCompanyName,
      partnerSpoc,
      partnerSpocEmail,
      partnerDesignation,
      partnerMobileNumber,
    };

    setLoading(true);
    const token = localStorage.getItem('authToken');

    fetch("http://localhost:5050/poc/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (res.status === 401) {
          handleLogout();
          throw new Error("Session expired. Please login again.");
        }
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Unknown error");
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.id) {
          setSubmittedData(data);
          setCurrentView('confirmation');
          
          // Reset form
          setSalesPerson("");
          setRegion("");
          setEndCustomerType("");
          setProcessType("");
          setCompanyName("");
          setSpoc("");
          setSpocEmail("");
          setDesignation("");
          setMobileNumber("");
          setUsecase("");
          setBrief("");
          setPartnerCompanyName("");
          setPartnerSpoc("");
          setPartnerSpocEmail("");
          setPartnerDesignation("");
          setPartnerMobileNumber("");
          setErrors({});
        } else {
          alert("⚠️ POC creation failed (no ID returned).");
        }
      })
      .catch((err) => {
        console.error("Error saving POC:", err);
        alert("❌ POC creation failed: " + err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Show loading while checking authentication
  if (!authChecked) {
    return <div className="loading">Loading...</div>;
  }

  // Render different views based on currentView state
  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      
      case 'dashboard':
        return (
          <Dashboard 
            onNavigate={navigateTo} 
            onLogout={handleLogout} 
            user={currentUser} 
          />
        );
      
      case 'poc-prj-id':
        return <PocPrjId onBack={() => navigateTo('dashboard')} />;
      
      case 'poc-table':
        return (
          <PocTable 
            onNavigate={navigateTo} 
            onLogout={handleLogout} 
            user={currentUser} 
          />
        );
      
      case 'initiate-poc':
        return renderPocForm();
      
      case 'confirmation':
        return renderConfirmation();
      
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  // Render POC Form
  const renderPocForm = () => {
    return (
      <div>
        <div className="header-bar">
          <Pageheading />
          <div className="user-info">
            <span>Welcome, {currentUser?.username}</span>
            <button onClick={() => navigateTo('dashboard')} className="nav-btn">Dashboard</button>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>

        <div className="section-container">
          <h2 className="section-title">Initiate New POC</h2>
        </div>

        {/* AE Sales Info Section */}
        <div className="section-container">
          <h2 className="section-title">AE Sales Info</h2>
          <div className="dropdown-row">
            <Dropdown
              label="Sales Person Name"
              options={salesPersons}
              value={salesPerson}
              onChange={(val) => handleChange("salesPerson", val)}
              error={errors.salesPerson}
              loading={loadingSalesPersons}
              placeholder={loadingSalesPersons ? "Loading sales persons..." : "Select sales person"}
            />
            <Dropdown
              label="Region"
              options={regions}
              value={region}
              onChange={(val) => handleChange("region", val)}
              error={errors.region}
            />
            <Dropdown
              label="End Customer Type"
              options={endCustomerTypes}
              value={endCustomerType}
              onChange={(val) => handleChange("endCustomerType", val)}
              error={errors.endCustomerType}
            />
            <Dropdown
              label="Process Type"
              options={processTypes}
              value={processType}
              onChange={(val) => handleChange("processType", val)}
              error={errors.processType}
            />
          </div>
        </div>

        {/* Partner Info Section */}
        {endCustomerType === "Partner" && (
          <div className="section-container">
            <h2 className="section-title">Partner Info</h2>
            <div className="input-row">
              <TextInput
                label="Partner Company Name"
                value={partnerCompanyName}
                onChange={(val) => handleChange("partnerCompanyName", val)}
                error={errors.partnerCompanyName}
                required={true}
              />
              <TextInput
                label="Partner SPOC"
                value={partnerSpoc}
                onChange={(val) => handleChange("partnerSpoc", val)}
                error={errors.partnerSpoc}
                required={true}
              />
              <TextInput
                label="Partner SPOC Email"
                value={partnerSpocEmail}
                onChange={(val) => handleChange("partnerSpocEmail", val)}
                error={errors.partnerSpocEmail}
                required={true}
              />
              <TextInput
                label="Partner Designation"
                value={partnerDesignation}
                onChange={(val) => handleChange("partnerDesignation", val)}
                error={errors.partnerDesignation}
                required={true}
              />
              <TextInput
                label="Partner Mobile Number"
                value={partnerMobileNumber}
                onChange={(val) => handleChange("partnerMobileNumber", val)}
                error={errors.partnerMobileNumber}
                required={false}
              />
            </div>
          </div>
        )}

        {/* Customer Info Section */}
        <div className="section-container">
          <h2 className="section-title">Customer Info</h2>
          <div className="input-row">
            <TextInput
              label="Company Name"
              value={companyName}
              onChange={(val) => handleChange("companyName", val)}
              error={errors.companyName}
              required={true}
            />
            <TextInput
              label="SPOC"
              value={spoc}
              onChange={(val) => handleChange("spoc", val)}
              error={errors.spoc}
              required={true}
            />
            <TextInput
              label="SPOC Email"
              value={spocEmail}
              onChange={(val) => handleChange("spocEmail", val)}
              error={errors.spocEmail}
              required={true}
            />
            <TextInput
              label="Designation"
              value={designation}
              onChange={(val) => handleChange("designation", val)}
              error={errors.designation}
              required={true}
            />
            <TextInput
              label="Mobile Number"
              value={mobileNumber}
              onChange={(val) => handleChange("mobileNumber", val)}
              error={errors.mobileNumber}
              required={false}
            />
          </div>
        </div>

        {/* Usecase Details Section */}
        <UsecaseDetails
          usecase={usecase}
          setUsecase={(val) => handleChange("usecase", val)}
          brief={brief}
          setBrief={(val) => handleChange("brief", val)}
          errors={errors}
          required={true}
        />

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          label={loading ? "Please wait..." : "Initiate POC"}
          type="submit"
          disabled={loading || loadingSalesPersons}
        />
      </div>
    );
  };

  // Render Confirmation Screen
  const renderConfirmation = () => {
    if (!submittedData) {
      return (
        <div className="confirmation-container">
          <h2>No submission data found</h2>
          <Button onClick={() => navigateTo('initiate-poc')} label="Back to POC Form" />
        </div>
      );
    }

    return (
      <div className="confirmation-container">
        <div className="header-bar">
          <span>Welcome, {currentUser?.username}</span>
          <div>
            <button onClick={() => navigateTo('dashboard')} className="nav-btn">Dashboard</button>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>

        <h2 className="confirmation-title">✅ POC Created Successfully</h2>
        
        <div className="confirmation-table-container">
          <table className="poc-table">
            <tbody>
              <tr><th>ID</th><td>{submittedData.id}</td></tr>
              <tr><th>Sales Person</th><td>{submittedData.salesPerson}</td></tr>
              <tr><th>Region</th><td>{submittedData.region}</td></tr>
              <tr><th>End Customer Type</th><td>{submittedData.endCustomerType}</td></tr>
              <tr><th>Process Type</th><td>{submittedData.processType}</td></tr>
              <tr><th>Customer Company</th><td>{submittedData.companyName}</td></tr>
              <tr><th>Customer SPOC</th><td>{submittedData.spoc}</td></tr>
              <tr><th>Customer SPOC Email</th><td>{submittedData.spocEmail}</td></tr>
              <tr><th>Designation</th><td>{submittedData.designation}</td></tr>
              <tr><th>Mobile</th><td>{submittedData.mobileNumber}</td></tr>
              <tr><th>Use Case</th><td>{submittedData.usecase}</td></tr>
              <tr><th>Brief</th><td>{submittedData.brief}</td></tr>

              {submittedData.endCustomerType === "Partner" && (
                <>
                  <tr><th>Partner Company</th><td>{submittedData.partnerCompanyName}</td></tr>
                  <tr><th>Partner SPOC</th><td>{submittedData.partnerSpoc}</td></tr>
                  <tr><th>Partner SPOC Email</th><td>{submittedData.partnerSpocEmail}</td></tr>
                  <tr><th>Partner Designation</th><td>{submittedData.partnerDesignation}</td></tr>
                  <tr><th>Partner Mobile</th><td>{submittedData.partnerMobileNumber}</td></tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="confirmation-buttons">
          <Button 
            onClick={() => {
              setCurrentView('initiate-poc');
            }} 
            label="New POC" 
          />
          <Button onClick={() => navigateTo('dashboard')} label="Back to Dashboard" />
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {renderCurrentView()}
    </div>
  );
}

export default App;