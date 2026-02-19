import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Button as MuiButton,  // Rename Material-UI Button
    Box,
} from '@mui/material';
import {
    Dashboard as DashboardIcon
} from "@mui/icons-material";
import MenuIcon from '@mui/icons-material/Menu';

import Pageheading from "./Pageheading";
import Dropdown from "./DropDown";
import TextInput from "./TextInput";
import UsecaseDetails from "./UsecaseDetails";
import Button from "./Button";  // Your custom Button (keep original name)
import axios from "axios";

const PocFormComponent = React.memo(({
    currentUser,
    salesPersons,
    loadingSalesPersons,
    regions,
    endCustomerTypes,
    processTypes,
    salesPerson,
    region,
    endCustomerType,
    processType,
    partnerCompanyName,
    partnerSpoc,
    partnerSpocEmail,
    partnerDesignation,
    partnerMobileNumber,
    companyName,
    spoc,
    spocEmail,
    designation,
    mobileNumber,
    usecase,
    brief,
    remark,
    errors,
    handleChange,
    handleSubmit,
    loading,
    navigate,
    handleLogout
}) => {
    const logoutInProgress = useRef(false);
    const lastActivity = useRef(Date.now());
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const isTokenExpired = useCallback((token) => {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    }, []);

    const handleAutoLogout = useCallback(() => {
        if (logoutInProgress.current) return;
        logoutInProgress.current = true;

        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');

        if (handleLogout) {
            handleLogout();
        }
    }, [handleLogout]);

    const updateActivity = useCallback(() => {
        lastActivity.current = Date.now();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const token = localStorage.getItem('authToken');
            if (token && isTokenExpired(token)) {
                handleAutoLogout();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [handleAutoLogout, isTokenExpired]);

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

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const timeUntilExpiry = payload.exp * 1000 - Date.now();

            const logoutTimer = setTimeout(() => {
                handleAutoLogout();
            }, timeUntilExpiry);

            return () => clearTimeout(logoutTimer);
        } catch {
            // Handle error silently
        }
    }, [handleAutoLogout]);

    if (logoutInProgress.current) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography variant="h5">Session expired. Redirecting to login...</Typography>
            </Box>
        );
    }

    const handleLocalChange = useCallback((field, value) => {
        handleChange(field, value);
    }, [handleChange]);

    return (
        <div>
            <AppBar position="sticky" elevation={1}>
                <Toolbar>
                    <MuiButton
                        color="inherit"
                        onClick={() => navigate('/dashboard')}
                        startIcon={<DashboardIcon />}
                        sx={{ mr: 2 }}
                    >
                        Dashboard
                    </MuiButton>
                    <Typography
                        component="h1"
                        variant="h6"
                        color="inherit"
                        noWrap
                        sx={{ flexGrow: 1 }}
                    >
                        POC Portal
                    </Typography>
                    <Typography variant="body2" color="inherit" sx={{ mr: 2 }}>
                        Welcome, {currentUser?.emp_name}
                        {currentUser?.emp_id && ` (${currentUser.emp_id})`}
                    </Typography>
                    <MuiButton
                        color="inherit"
                        onClick={() => navigate('/poc-records')}
                        sx={{ mr: 2, color: 'white' }}
                    >
                        POC Records
                    </MuiButton>

                    <MuiButton
                        color="inherit"
                        onClick={handleLogout}
                        sx={{ color: 'white' }}
                    >
                        Logout
                    </MuiButton>

                </Toolbar>
            </AppBar>

            <div className="form-container">
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
                            onChange={(val) => handleLocalChange("salesPerson", val)}
                            error={errors.salesPerson}
                            loading={loadingSalesPersons}
                            placeholder={loadingSalesPersons ? "Loading sales persons..." : "Select sales person"}
                        />
                        <Dropdown
                            label="Region"
                            options={regions}
                            value={region}
                            onChange={(val) => handleLocalChange("region", val)}
                            error={errors.region}
                        />
                        <Dropdown
                            label="End Customer Type"
                            options={endCustomerTypes}
                            value={endCustomerType}
                            onChange={(val) => handleLocalChange("endCustomerType", val)}
                            error={errors.endCustomerType}
                        />
                        <Dropdown
                            label="Process Type"
                            options={processTypes}
                            value={processType}
                            onChange={(val) => handleLocalChange("processType", val)}
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
                                onChange={(val) => handleLocalChange("partnerCompanyName", val)}
                                error={errors.partnerCompanyName}
                                required={true}
                            />
                            <TextInput
                                label="Partner SPOC"
                                value={partnerSpoc}
                                onChange={(val) => handleLocalChange("partnerSpoc", val)}
                                error={errors.partnerSpoc}
                                required={true}
                            />
                            <TextInput
                                label="Partner SPOC Email"
                                value={partnerSpocEmail}
                                onChange={(val) => handleLocalChange("partnerSpocEmail", val)}
                                error={errors.partnerSpocEmail}
                                required={true}
                            />
                            <TextInput
                                label="Partner Designation"
                                value={partnerDesignation}
                                onChange={(val) => handleLocalChange("partnerDesignation", val)}
                                error={errors.partnerDesignation}
                                required={false} // Changed to not mandatory
                            />
                            <TextInput
                                label="Partner Mobile Number"
                                value={partnerMobileNumber}
                                onChange={(val) => handleLocalChange("partnerMobileNumber", val)}
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
                            onChange={(val) => handleLocalChange("companyName", val)}
                            error={errors.companyName}
                            required={true}
                        />
                        <TextInput
                            label="SPOC"
                            value={spoc}
                            onChange={(val) => handleLocalChange("spoc", val)}
                            error={errors.spoc}
                            required={true}
                        />
                        <TextInput
                            label="SPOC Email"
                            value={spocEmail}
                            onChange={(val) => handleLocalChange("spocEmail", val)}
                            error={errors.spocEmail}
                            required={true}
                        />
                        <TextInput
                            label="Designation"
                            value={designation}
                            onChange={(val) => handleLocalChange("designation", val)}
                            error={errors.designation}
                            required={false} // Changed to not mandatory
                        />
                        <TextInput
                            label="Mobile Number"
                            value={mobileNumber}
                            onChange={(val) => handleLocalChange("mobileNumber", val)}
                            error={errors.mobileNumber}
                            required={false}
                        />
                    </div>
                </div>

                {/* Usecase Details Section */}
                <UsecaseDetails
                    usecase={usecase}
                    setUsecase={(val) => handleLocalChange("usecase", val)}
                    brief={brief}
                    setBrief={(val) => handleLocalChange("brief", val)}
                    errors={errors}
                    required={true}
                />

                {/* Other Section */}
                <div className="section-container">
                    <h2 className="section-title">Other</h2>
                    <div className="input-row">
                        <TextInput
                            label="Remark"
                            value={remark}
                            onChange={(val) => handleLocalChange("remark", val)}
                            error={errors.remark}
                            required={false}
                            multiline={true}
                            rows={3}
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <Button
                    onClick={handleSubmit}
                    label={loading ? "Please wait..." : "Initiate POC"}
                    type="submit"
                    disabled={loading || loadingSalesPersons}
                />
            </div>
        </div>
    );
});

const InitiateUsecase = ({ currentUser, onLogout, navigate, fetchSalesPersons, processApiData, onSubmissionSuccess }) => {
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
        'PRJ Usecase',
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
        'Workshop',
        'Support',
        'Vco Create'
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
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [remark, setRemark] = useState("");

    const hasResetForm = useRef(false);

    // Auto-logout state variables
    const logoutInProgress = useRef(false);
    const lastActivity = useRef(Date.now());
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const isTokenExpired = useCallback((token) => {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    }, []);

    const handleAutoLogout = useCallback(() => {
        if (logoutInProgress.current) return;
        logoutInProgress.current = true;

        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');

        if (onLogout) {
            onLogout();
        }
    }, [onLogout]);

    const updateActivity = useCallback(() => {
        lastActivity.current = Date.now();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const token = localStorage.getItem('authToken');
            if (token && isTokenExpired(token)) {
                handleAutoLogout();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [handleAutoLogout, isTokenExpired]);

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

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const timeUntilExpiry = payload.exp * 1000 - Date.now();

            const logoutTimer = setTimeout(() => {
                handleAutoLogout();
            }, timeUntilExpiry);

            return () => clearTimeout(logoutTimer);
        } catch {
            // Handle error silently
        }
    }, [handleAutoLogout]);

    if (logoutInProgress.current) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography variant="h5">Session expired. Redirecting to login...</Typography>
            </Box>
        );
    }

    useEffect(() => {
        // Only reset once when entering the page
        if (!hasResetForm.current) {
            setSalesPerson("");
            setRegion("");
            setEndCustomerType("");
            setProcessType("");
            setPartnerCompanyName("");
            setPartnerSpoc("");
            setPartnerSpocEmail("");
            setPartnerDesignation("");
            setPartnerMobileNumber("");
            setCompanyName("");
            setSpoc("");
            setSpocEmail("");
            setDesignation("");
            setMobileNumber("");
            setUsecase("");
            setBrief("");
            setErrors({});
            hasResetForm.current = true;
        }

        // Fetch sales persons when component mounts
        const token = localStorage.getItem('authToken');
        
        if (!token || isTokenExpired(token)) {
            handleAutoLogout();
            return;
        }
        
        if (token) {
            setLoadingSalesPersons(true);
            fetchSalesPersons(token)
                .then(salesData => {
                    setSalesPersons(salesData);
                })
                .catch(error => {
                    console.error('Error fetching sales persons:', error);
                    if (error.response?.status === 401) {
                        handleAutoLogout();
                    }
                    setSalesPersons([]);
                })
                .finally(() => {
                    setLoadingSalesPersons(false);
                });
        }

        return () => {
            // Reset the flag when leaving the page
            hasResetForm.current = false;
        };
    }, [fetchSalesPersons, handleAutoLogout, isTokenExpired]);

    // Stable handlers
    const handleChange = useCallback((field, value) => {
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
            case "remark": setRemark(value); break;
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
    }, []);

    // Form submit
    const handleSubmit = useCallback(() => {
        let newErrors = {};

        if (!salesPerson) newErrors.salesPerson = "Required";
        if (!region) newErrors.region = "Required";
        if (!endCustomerType) newErrors.endCustomerType = "Required";
        if (!processType) newErrors.processType = "Required";
        if (!companyName) newErrors.companyName = "Required";
        if (!spoc) newErrors.spoc = "Required";
        if (!spocEmail) newErrors.spocEmail = "Required";
        // Removed designation validation - now not mandatory
        if (mobileNumber && !/^[0-9]{10}$/.test(mobileNumber)) {
            newErrors.mobileNumber = "Must be 10 digits";
        }
        if (!usecase) newErrors.usecase = "Required";
        if (!brief) newErrors.brief = "Required";

        if (endCustomerType === "Partner") {
            if (!partnerCompanyName) newErrors.partnerCompanyName = "Required";
            if (!partnerSpoc) newErrors.partnerSpoc = "Required";
            if (!partnerSpocEmail) newErrors.partnerSpocEmail = "Required";
            // Removed partnerDesignation validation - now not mandatory
            if (partnerMobileNumber && !/^[0-9]{10}$/.test(partnerMobileNumber)) {
                newErrors.partnerMobileNumber = "Must be 10 digits";
            }
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        // Check token before submitting
        const token = localStorage.getItem('authToken');
        if (!token || isTokenExpired(token)) {
            handleAutoLogout();
            return;
        }

        // Create payload with the exact field names that the confirmation screen expects
        const payload = {
            salesPerson: salesPerson,
            region: region,
            endCustomerType: endCustomerType,
            processType: processType,
            companyName: companyName,
            spoc: spoc,
            spocEmail: spocEmail,
            designation: designation,
            mobileNumber: mobileNumber,
            usecase: usecase,
            brief: brief,
            partnerCompanyName: partnerCompanyName,
            partnerSpoc: partnerSpoc,
            partnerSpocEmail: partnerSpocEmail,
            partnerDesignation: partnerDesignation,
            partnerMobileNumber: partnerMobileNumber,
            remark: remark,
        };

        setLoading(true);

        fetch(`${import.meta.env.VITE_API}/poc/save`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        })
            .then(async (res) => {
                if (res.status === 401) {
                    handleAutoLogout();
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
                    // Combine the response data with our form data for the confirmation screen
                    const confirmationData = {
                        id: data.id,
                        salesPerson: salesPerson,
                        region: region,
                        endCustomerType: endCustomerType,
                        processType: processType,
                        companyName: companyName,
                        spoc: spoc,
                        spocEmail: spocEmail,
                        designation: designation,
                        mobileNumber: mobileNumber,
                        usecase: usecase,
                        brief: brief,
                        partnerCompanyName: partnerCompanyName,
                        partnerSpoc: partnerSpoc,
                        partnerSpocEmail: partnerSpocEmail,
                        partnerDesignation: partnerDesignation,
                        partnerMobileNumber: partnerMobileNumber,
                        remark: remark, 
                    };
                    onSubmissionSuccess(confirmationData);
                } else {
                    alert("⚠️ POC creation failed (no ID returned).");
                }
            })
            .catch((err) => {
                console.error("Error saving POC:", err);
                
                if (err.message.includes("401") || err.message.includes("Session expired")) {
                    handleAutoLogout();
                    return;
                }
                
                alert("❌ POC creation failed: " + err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [
        salesPerson, region, endCustomerType, processType, companyName, spoc, spocEmail, 
        designation, mobileNumber, usecase, brief, partnerCompanyName, partnerSpoc, 
        partnerSpocEmail, partnerDesignation, partnerMobileNumber, remark, 
        handleAutoLogout, isTokenExpired, onSubmissionSuccess
    ]);

    return (
        <PocFormComponent
            currentUser={currentUser}
            salesPersons={salesPersons}
            loadingSalesPersons={loadingSalesPersons}
            regions={regions}
            endCustomerTypes={endCustomerTypes}
            processTypes={processTypes}
            salesPerson={salesPerson}
            region={region}
            endCustomerType={endCustomerType}
            processType={processType}
            partnerCompanyName={partnerCompanyName}
            partnerSpoc={partnerSpoc}
            partnerSpocEmail={partnerSpocEmail}
            partnerDesignation={partnerDesignation}
            partnerMobileNumber={partnerMobileNumber}
            companyName={companyName}
            spoc={spoc}
            spocEmail={spocEmail}
            designation={designation}
            mobileNumber={mobileNumber}
            usecase={usecase}
            brief={brief}
            remark={remark}
            errors={errors}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            loading={loading}
            navigate={navigate}
            handleLogout={handleAutoLogout}
        />
    );
};

export default InitiateUsecase;

