// src/components/PocPrjIdEdit.jsx
import React, { useState, useEffect } from 'react';
import Dropdown from './DropDown';
import TextInput from './TextInput';
import './PocPrjId.css';
import companyLogo from '../components/Images/companyLogo.png';
import axios from 'axios';
import Button from '@mui/material/Button';

import {
    IconButton,
    Box,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Checkbox,
    FormControlLabel,
    FormGroup,
    FormControl,
    FormLabel,
    Avatar,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Divider,
    Card,
    CardContent,
    Stepper,
    Step,
    StepLabel,
    InputAdornment,
    Tooltip,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Close as CloseIcon,
    Person as PersonIcon,
    Group as GroupIcon,
    Email as EmailIcon,
    Business as BusinessIcon,
    LocationOn as LocationIcon,
    CalendarToday as CalendarIcon,
    Description as DescriptionIcon,
    Label as LabelIcon,
    AttachMoney as MoneyIcon,
    Work as WorkIcon,
    Assignment as AssignmentIcon,
    CheckCircle as CheckCircleIcon,
    Add as AddIcon,
    Remove as RemoveIcon
} from '@mui/icons-material';

const PocPrjIdEdit = ({ poc, onClose, onSuccess, onBack }) => {
    // Form states - pre-populate with the selected POC's data
    const [idPrefix, setIdPrefix] = useState(poc?.pocId?.split('-')[0] || '');
    const [pocId, setPocId] = useState(poc?.pocId || '');
    const [pocName, setPocName] = useState(poc?.pocName || '');
    const [entityType, setEntityType] = useState(poc?.entityType || '');
    const [entityName, setEntityName] = useState(poc?.entityName || '');
    const [partnerName, setPartnerName] = useState(poc?.partnerName || '');
    const [salesPerson, setSalesPerson] = useState(poc?.salesPerson || '');
    const [description, setDescription] = useState(poc?.description || '');
    const [assignedTo, setAssignedTo] = useState(poc?.assignedTo ? poc.assignedTo.split(',') : []);
    const [createdBy, setCreatedBy] = useState(poc?.createdBy || '');
    const [startDate, setStartDate] = useState(poc?.startDate ? poc.startDate.split('T')[0] : '');
    const [endDate, setEndDate] = useState(poc?.endDate ? poc.endDate.split('T')[0] : '');
    const [actualStartDate, setActualStartDate] = useState(poc?.actualStartDate ? poc.actualStartDate.split('T')[0] : '');
    const [actualEndDate, setActualEndDate] = useState(poc?.actualEndDate ? poc.actualEndDate.split('T')[0] : '');
    const [estimatedEfforts, setEstimatedEfforts] = useState(poc?.estimatedEfforts || '');
    const [totalEfforts, setTotalEfforts] = useState(poc?.totalEfforts || '');
    const [varianceDays, setVarianceDays] = useState(poc?.varianceDays || '');
    const [approvedBy, setApprovedBy] = useState(poc?.approvedBy || '');
    const [remark, setRemark] = useState(poc?.remark || '');
    const [region, setRegion] = useState(poc?.region || '');
    // const [isBillable, setIsBillable] = useState(poc?.isBillable === true ? 'Yes' : 'No');
    const [isBillable, setIsBillable] = useState(poc?.isBillable || "No");

    const [pocType, setPocType] = useState(poc?.pocType || '');
    const [spocEmail, setSpocEmail] = useState(poc?.spocEmail || '');
    const [spocDesignation, setSpocDesignation] = useState(poc?.spocDesignation || '');
    const [tags, setTags] = useState(poc?.tags ? poc.tags.split(',') : []);
    const [status, setStatus] = useState(poc?.status || 'Draft');
    const [loading, setLoading] = useState(false);
    const [apiLoading, setApiLoading] = useState(true);

    // Multi-user selection dialog
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Dropdown options
    const [salesPersons, setSalesPersons] = useState([]);
    const [regions, setRegions] = useState([]);
    const [users, setUsers] = useState([]);
    const [createdByOptions, setCreatedByOptions] = useState([]);
    const [tagOptions, setTagOptions] = useState([]);
    const [approverOptions, setApproverOptions] = useState([]);

    // Error states
    const [errors, setErrors] = useState({});

    // Form steps
    const [activeStep, setActiveStep] = useState(0);

    // ID prefix options
    const idPrefixOptions = [
        'POC',
        'POP',
        'PartnerSupport',
        'FeasibilityCheck',
        'OperationalSupport',
        'R&D',
        'SolutionConsultation',
        'EffortsEstimation',
        'Task',
        'Demo',
        'Internal',
        'Event',
        'Workshop',
        'Support'
    ];

    // Function to get emp_name from localStorage
    const getemp_name = () => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                return user.emp_name || user.email || '';
            } catch (e) {
                console.error('Error parsing user data:', e);
                return '';
            }
        }
        return '';
    };

    // Function to extract name from object with various possible properties
    const extractName = (item) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
            return item.fullName || item.name || item.emp_name || item.email ||
                `${item.firstName || ''} ${item.lastName || ''}`.trim() ||
                Object.values(item).find(val => typeof val === 'string') || '';
        }
        return String(item);
    };

    // Function to process API response data into dropdown options
    const processApiData = (data, dataType = 'default') => {
        if (!data) return [];

        let processedData = [];

        if (Array.isArray(data)) {
            processedData = data.map(item => {
                // Handle approver data structure
                if (dataType === 'approvers' && typeof item === 'object') {
                    return item.name || item.full_name || item.email ||
                        `${item.firstName || ''} ${item.lastName || ''}`.trim() ||
                        Object.values(item).find(val => typeof val === 'string') || '';
                }

                // Handle other data structures
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item !== null) {
                    return item.full_name || item.name || item.fullName || item.emp_name || item.email ||
                        `${item.firstName || ''} ${item.lastName || ''}`.trim() ||
                        Object.values(item).find(val => typeof val === 'string') || '';
                }
                return String(item);
            }).filter(name => name);
        } else if (typeof data === 'object') {
            // Specific handling for approvers
            if (dataType === 'approvers' && Array.isArray(data.approvers)) {
                processedData = data.approvers.map(item => extractName(item)).filter(name => name);
            } else if (dataType === 'approvers') {
                // Extract from object values
                processedData = Object.values(data)
                    .map(item => extractName(item))
                    .filter(name => name);
            } else if (data.data && Array.isArray(data.data)) {
                processedData = data.data.map(item => extractName(item)).filter(name => name);
            } else if (data.users && Array.isArray(data.users)) {
                processedData = data.users.map(item => extractName(item)).filter(name => name);
            } else if (data.assignTo && Array.isArray(data.assignTo)) {
                processedData = data.assignTo.map(item => extractName(item)).filter(name => name);
            } else {
                const values = Object.values(data);
                if (values.length > 0 && Array.isArray(values[0])) {
                    processedData = values[0].map(item => extractName(item)).filter(name => name);
                } else {
                    const stringValues = Object.values(data).filter(
                        value => typeof value === 'string' && value.trim() !== ''
                    );
                    processedData = stringValues;
                }
            }
        } else if (typeof data === 'string') {
            processedData = [data];
        }

        return processedData;
    };
    // Load dropdown data from APIs
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                setApiLoading(true);
                const token = localStorage.getItem('authToken');
                const emp_name = getemp_name();

                // Fetch sales persons from API
                try {
                    const salesResponse = await axios.get('http://localhost:5050/poc/getAllSalesPerson', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const salesData = processApiData(salesResponse.data);
                    setSalesPersons(salesData.length > 0 ? salesData : ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson']);
                } catch (salesError) {
                    console.error('Error fetching sales persons:', salesError);
                    setSalesPersons(['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson']);
                }

                // Fetch Assigned To options from API
                try {
                    const assignToResponse = await axios.get('http://localhost:5050/poc/getAllAssignTo', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const assignToData = processApiData(assignToResponse.data);
                    setUsers(assignToData.length > 0 ? assignToData : ['admin', 'manager', 'developer', 'tester', 'analyst']);
                } catch (assignToError) {
                    console.error('Error fetching assigned to options:', assignToError);
                    setUsers(['admin', 'manager', 'developer', 'tester', 'analyst']);
                }

                // Fetch Created By options from API with emp_name parameter
                if (emp_name) {
                    try {
                        const createdByResponse = await axios.get(`http://localhost:5050/poc/getCreatedBy?emp_name=${encodeURIComponent(emp_name)}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        const createdByData = processApiData(createdByResponse.data);
                        setCreatedByOptions(createdByData.length > 0 ? createdByData : [emp_name]);
                    } catch (createdByError) {
                        console.error('Error fetching created by options:', createdByError);
                        setCreatedByOptions([emp_name]);
                    }
                } else {
                    setCreatedByOptions(['admin', 'manager', 'user']);
                }

                // Fetch approvers from the new API endpoint
                // Fetch approvers from the new API endpoint
                try {
                    const approversResponse = await axios.get('http://localhost:5050/poc/getAllApprovedBy', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    console.log('Raw Approvers API Response:', approversResponse.data);

                    // Direct mapping - simplest approach
                    const approversData = approversResponse.data.map(approver => approver.name);
                    console.log('Mapped Approver Names:', approversData);

                    setApproverOptions(approversData.length > 0 ? approversData : ['admin', 'manager', 'supervisor']);
                } catch (approversError) {
                    console.error('Error fetching approved by options:', approversError);
                    setApproverOptions(['admin', 'manager', 'supervisor']);
                }

                // Load other dropdown data
                setRegions(['ROW', 'ISSARC', 'America', 'Other']);
                setTagOptions(['GenAI', 'Agentic AI', 'SAP', 'RPA', 'Chatbot', 'DodEdge', 'Mainframe', 'Other']);

            } catch (error) {
                console.error('Error fetching dropdown data:', error);
                // Fallback to dummy data if API fails
                setSalesPersons(['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson']);
                setRegions(['ROW', 'ISSARC', 'America', 'Other']);
                setUsers(['admin', 'manager', 'developer', 'tester', 'analyst']);
                setCreatedByOptions(['admin', 'manager', 'user']);
                setApproverOptions(['admin', 'manager', 'supervisor']);
                setTagOptions(['GenAI', 'Agentic AI', 'SAP', 'RPA', 'Chatbot', 'DodEdge', 'Mainframe', 'Other']);
            } finally {
                setApiLoading(false);
            }
        };

        fetchDropdownData();
    }, [poc]);

    // Multi-user selection handlers
    const handleOpenUserDialog = () => {
        setSelectedUsers([...assignedTo]);
        setUserDialogOpen(true);
    };

    const handleCloseUserDialog = () => {
        setUserDialogOpen(false);
    };

    const handleSaveUsers = () => {
        setAssignedTo(selectedUsers);
        if (errors.assignedTo) {
            setErrors({ ...errors, assignedTo: null });
        }
        setUserDialogOpen(false);
    };

    const handleToggleUser = (user) => {
        setSelectedUsers(prev =>
            prev.includes(user)
                ? prev.filter(u => u !== user)
                : [...prev, user]
        );
    };

    const handleSelectAllUsers = () => {
        setSelectedUsers(users);
    };

    const handleDeselectAllUsers = () => {
        setSelectedUsers([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        if (!idPrefix) newErrors.idPrefix = 'ID Prefix is required';
        if (!pocName) newErrors.pocName = 'Usecase Name is required';
        if (!entityType) newErrors.entityType = 'Client Type is required';
        if (!entityName) newErrors.entityName = 'Company Name is required';
        if (entityType === 'Partner' && !partnerName) newErrors.partnerName = 'Partner Name is required';
        if (!salesPerson) newErrors.salesPerson = 'Sales Person is required';
        if (assignedTo.length === 0) newErrors.assignedTo = 'At least one user must be assigned';
        if (!createdBy) newErrors.createdBy = 'Created By is required';
        if (!startDate) newErrors.startDate = 'Start Date is required';
        if (!endDate) newErrors.endDate = 'End Date is required';
        if (!region) newErrors.region = 'Region is required';
        if (!isBillable) newErrors.isBillable = 'Billable status is required';
        if (!pocType) newErrors.pocType = 'Usecase Type is required';
        if (tags.length === 0) newErrors.tags = 'At least one tag is required';
        if (!status) newErrors.status = 'Status is required';

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setLoading(true);

            try {
                // Prepare form data for database
                const normalizeDate = (value) => value && value.trim() !== "" ? value : null;

                // Convert numeric fields properly - handle empty strings
                const normalizeNumber = (value) => {
                    if (value === '' || value === null || value === undefined) return null;
                    const num = parseInt(value);
                    return isNaN(num) ? null : num;
                };

                const formData = {
                    pocName,
                    entityName,
                    entityType,
                    salesPerson,
                    region,
                    isBillable: isBillable === 'Yes',
                    status,
                    startDate: normalizeDate(startDate),
                    endDate: normalizeDate(endDate),
                    pocType,
                    description,
                    spocEmail,
                    spocDesignation,
                    tags: tags?.length ? tags.join(',') : null,
                    assignedTo: assignedTo?.length ? assignedTo.join(',') : null,
                    remark: remark || null,
                    actualStartDate: normalizeDate(actualStartDate),
                    actualEndDate: normalizeDate(actualEndDate),
                    estimatedEfforts: normalizeNumber(estimatedEfforts),
                    approvedBy: approvedBy || null,
                    totalEfforts: normalizeNumber(totalEfforts),
                    varianceDays: normalizeNumber(varianceDays),
                };

                const token = localStorage.getItem('authToken');
                const response = await axios.put(`http://localhost:5050/poc/update/${poc.pocId}`, formData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });


                if (response.data.message && response.data.message.includes("successfully")) {
                    alert('Usecase Code updated successfully!');
                    if (onSuccess) {
                        onSuccess();
                    }
                    onClose();
                } else {
                    alert('Failed to update Usecase Code: ' + (response.data.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error updating Usecase Code:', error);
                if (error.response?.status === 401) {
                    alert('Session expired. Please login again.');
                } else if (error.response?.data?.message) {
                    alert('Error updating Usecase: ' + error.response.data.message);
                } else {
                    alert('Error updating Usecase Code. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        }
    };
    const handleTagSelect = (tag) => {
        if (!tags.includes(tag)) {
            setTags([...tags, tag]);
            if (errors.tags) {
                setErrors({ ...errors, tags: null });
            }
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleNextStep = () => {
        // Validate current step before proceeding
        let stepValid = true;
        const newErrors = {};

        switch (activeStep) {
            case 0:
                if (!idPrefix) {
                    newErrors.idPrefix = 'ID Prefix is required';
                    stepValid = false;
                }
                if (!pocName) {
                    newErrors.pocName = 'Usecase Name is required';
                    stepValid = false;
                }
                break;
            case 1:
                if (!entityType) {
                    newErrors.entityType = 'Client Type is required';
                    stepValid = false;
                }
                if (!entityName) {
                    newErrors.entityName = 'Company Name is required';
                    stepValid = false;
                }
                if (entityType === 'Partner' && !partnerName) {
                    newErrors.partnerName = 'Partner Name is required';
                    stepValid = false;
                }
                if (!salesPerson) {
                    newErrors.salesPerson = 'Sales Person is required';
                    stepValid = false;
                }
                if (!region) {
                    newErrors.region = 'Region is required';
                    stepValid = false;
                }
                break;
            case 2:
                if (assignedTo.length === 0) {
                    newErrors.assignedTo = 'At least one user must be assigned';
                    stepValid = false;
                }
                if (!isBillable) {
                    newErrors.isBillable = 'Billable status is required';
                    stepValid = false;
                }
                if (!startDate) {
                    newErrors.startDate = 'Start Date is required';
                    stepValid = false;
                }
                if (!endDate) {
                    newErrors.endDate = 'End Date is required';
                    stepValid = false;
                }
                break;
            case 3:
                if (!pocType) {
                    newErrors.pocType = 'Usecase Type is required';
                    stepValid = false;
                }
                if (tags.length === 0) {
                    newErrors.tags = 'At least one tag is required';
                    stepValid = false;
                }
                if (!status) {
                    newErrors.status = 'Status is required';
                    stepValid = false;
                }
                break;
            default:
                break;
        }

        if (!stepValid) {
            setErrors({ ...errors, ...newErrors });
            return;
        }

        setActiveStep((prev) => prev + 1);
    };

    const handleBackStep = () => {
        setActiveStep((prev) => prev - 1);
    };

    const steps = ['Basic Information', 'Client Details', 'Team & Timeline', 'Additional Information'];

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                            {/* Usecase ID - Display only */}
                            <Box>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    Usecase ID
                                </Typography>
                                <Box sx={{
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    backgroundColor: '#f5f5f5',
                                    minHeight: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '14px'
                                }}>
                                    {pocId || 'N/A'}
                                </Box>
                            </Box>

                            {/* Usecase Type - Display only */}
                            <Box>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    Usecase Type
                                </Typography>
                                <Box sx={{
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    backgroundColor: '#f5f5f5',
                                    minHeight: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '14px'
                                }}>
                                    {idPrefix || 'N/A'}
                                </Box>
                            </Box>
                        </Box>

                        <TextInput
                            label="Usecase Name"
                            value={pocName}
                            onChange={setPocName}
                            error={errors.pocName}
                            placeholder="Enter Usecase Name"
                            required
                            icon={<WorkIcon />}
                        />

                        <TextInput
                            label="Description"
                            value={description}
                            onChange={setDescription}
                            placeholder="Enter Description"
                            multiline
                            rows={6}
                            fullWidth
                            icon={<DescriptionIcon />}
                            sx={{ minHeight: "150px" }}
                        />
                    </Box>
                );

            case 1:
                return (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                            <Dropdown
                                label="Client Type"
                                options={["Partner", "Client", "Internal"]}
                                value={entityType}
                                onChange={setEntityType}
                                error={errors.entityType}
                                placeholder="Select Client Type"
                                required
                                icon={<BusinessIcon />}
                            />

                            <TextInput
                                label="End Client Name"
                                value={entityName}
                                onChange={setEntityName}
                                error={errors.entityName}
                                placeholder="Enter Company Name"
                                required
                                icon={<BusinessIcon />}
                            />

                            {entityType === "Partner" && (
                                <TextInput
                                    label="Partner Name"
                                    value={partnerName}
                                    onChange={setPartnerName}
                                    error={errors.partnerName}
                                    placeholder="Enter Partner Name"
                                    required
                                    icon={<BusinessIcon />}
                                />
                            )}
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                            <Dropdown
                                label="Sales Person"
                                options={salesPersons}
                                value={salesPerson}
                                onChange={setSalesPerson}
                                error={errors.salesPerson}
                                placeholder="Choose Sales Person"
                                required
                                loading={apiLoading}
                                icon={<PersonIcon />}
                            />

                            <Dropdown
                                label="Region"
                                options={regions}
                                value={region}
                                onChange={setRegion}
                                error={errors.region}
                                placeholder="Select Region"
                                required
                                icon={<LocationIcon />}
                            />

                            <TextInput
                                label="SPOC Email Address"
                                value={spocEmail}
                                onChange={setSpocEmail}
                                placeholder="Enter SPOC Email"
                                type="email"
                                icon={<EmailIcon />}
                            />
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
                            <TextInput
                                label="SPOC Designation"
                                value={spocDesignation}
                                onChange={setSpocDesignation}
                                placeholder="Enter SPOC Designation"
                                icon={<PersonIcon />}
                            />
                        </Box>
                    </Box>
                );

            case 2:
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Assigned To *
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={handleOpenUserDialog}
                                startIcon={<GroupIcon />}
                                fullWidth
                                sx={{ justifyContent: 'flex-start', mb: 1 }}
                            >
                                Select Team Members ({assignedTo.length} selected)
                            </Button>
                            {errors.assignedTo && (
                                <Typography variant="caption" color="error">
                                    {errors.assignedTo}
                                </Typography>
                            )}

                            {assignedTo.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Selected team members:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                        {assignedTo.map(user => (
                                            <Chip
                                                key={user}
                                                label={user}
                                                size="small"
                                                onDelete={() => setAssignedTo(prev => prev.filter(u => u !== user))}
                                                avatar={<Avatar sx={{ width: 24, height: 24 }}>{user.charAt(0)}</Avatar>}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            {/* Created By - Display only */}
                            <Box>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    Created By
                                </Typography>
                                <Box sx={{
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    backgroundColor: '#f5f5f5',
                                    minHeight: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '14px'
                                }}>
                                    {createdBy || 'N/A'}
                                </Box>
                            </Box>

                            <Dropdown
                                label="Is Billable"
                                options={['Yes', 'No']}
                                value={isBillable}
                                onChange={setIsBillable}
                                error={errors.isBillable}
                                placeholder="Select Billable Status"
                                required
                                icon={<MoneyIcon />}
                            />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <Box>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    Start Date *
                                </Typography>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className={errors.startDate ? 'error' : ''}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: errors.startDate ? '2px solid #d32f2f' : '1px solid #ccc',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                />
                                {errors.startDate && (
                                    <Typography variant="caption" color="error">
                                        {errors.startDate}
                                    </Typography>
                                )}
                            </Box>

                            <Box>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    End Date *
                                </Typography>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className={errors.endDate ? 'error' : ''}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: errors.endDate ? '2px solid #d32f2f' : '1px solid #ccc',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                />
                                {errors.endDate && (
                                    <Typography variant="caption" color="error">
                                        {errors.endDate}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <Box>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    Actual Start Date
                                </Typography>
                                <input
                                    type="date"
                                    value={actualStartDate}
                                    onChange={(e) => setActualStartDate(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    Actual End Date
                                </Typography>
                                <input
                                    type="date"
                                    value={actualEndDate}
                                    onChange={(e) => setActualEndDate(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextInput
                                label="Estimated Efforts"
                                value={estimatedEfforts}
                                onChange={setEstimatedEfforts}
                                placeholder="Enter estimated efforts"
                                type="number"
                                icon={<WorkIcon />}
                            />

                            <TextInput
                                label="Total Efforts"
                                value={totalEfforts}
                                onChange={setTotalEfforts}
                                placeholder="Enter total efforts"
                                type="number"
                                icon={<WorkIcon />}
                            />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextInput
                                label="Variance Days"
                                value={varianceDays}
                                onChange={setVarianceDays}
                                placeholder="Enter variance days"
                                type="number"
                                icon={<CalendarIcon />}
                            />

                            <Dropdown
                                label="Approved By"
                                options={approverOptions}
                                value={approvedBy}
                                onChange={setApprovedBy}
                                placeholder="Select Approver"
                                loading={apiLoading}
                                icon={<PersonIcon />}
                            />
                        </Box>
                    </Box>
                );

            case 3:
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <Dropdown
                                label="Usecase Type"
                                options={[
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
                                    'Workshop',
                                    'Support'
                                ]}
                                value={pocType}
                                onChange={setPocType}
                                error={errors.pocType}
                                placeholder="Select Usecase Type"
                                required
                                icon={<AssignmentIcon />}
                            />

                            <Box>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    Tags *
                                </Typography>
                                <Box sx={{
                                    border: errors.tags ? '2px solid #d32f2f' : '1px solid #ccc',
                                    borderRadius: '4px',
                                    p: 1,
                                    minHeight: '56px'
                                }}>
                                    <Dropdown
                                        options={tagOptions}
                                        value=""
                                        onChange={handleTagSelect}
                                        placeholder="Select Tags"
                                        showLabel={false}
                                        icon={<LabelIcon />}
                                    />
                                    {tags.length > 0 && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                            {tags.map(tag => (
                                                <Chip
                                                    key={tag}
                                                    label={tag}
                                                    size="small"
                                                    onDelete={() => removeTag(tag)}
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                                {errors.tags && (
                                    <Typography variant="caption" color="error">
                                        {errors.tags}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextInput
                                label="Remark"
                                value={remark}
                                onChange={setRemark}
                                placeholder="Enter Remarks"
                                multiline
                                rows={3}
                                icon={<DescriptionIcon />}
                            />

                            <Dropdown
                                label="Status"
                                options={['Draft', 'Pending', 'In Progress', 'Completed', 'Cancelled', 'Awaiting', 'Hold', 'Closed', 'Converted']}
                                value={status}
                                onChange={setStatus}
                                error={errors.status}
                                placeholder="Select Status"
                                required
                                icon={<CheckCircleIcon />}
                            />
                        </Box>

                        {/* Submit button on the last page */}
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                loading={loading}
                                disabled={apiLoading}
                                onClick={handleSubmit}
                                startIcon={<CheckCircleIcon />}
                                sx={{
                                    backgroundColor: '#1976d2',
                                    '&:hover': {
                                        backgroundColor: '#1565c0'
                                    },
                                    minWidth: '200px'
                                }}
                            >
                                {loading ? 'Updating Usecase...' : 'Update Usecase'}
                            </Button>
                        </Box>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header with close button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img
                        src={companyLogo}
                        alt="Company Logo"
                        style={{ height: '40px' }}
                    />

                </Box>
                <IconButton onClick={onClose} aria-label="close">
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {/* Form content */}
            <Paper sx={{ p: 3, flex: 1, overflow: 'auto', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                <form onSubmit={handleSubmit}>
                    {apiLoading ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CircularProgress />
                            <Typography variant="body2" sx={{ mt: 2 }}>
                                Loading form data...
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {renderStepContent(activeStep)}

                            {/* Navigation buttons */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleBackStep}
                                    disabled={activeStep === 0}
                                    startIcon={<RemoveIcon />}
                                >
                                    Back
                                </Button>

                                {activeStep < steps.length - 1 ? (
                                    <Button
                                        variant="contained"
                                        onClick={handleNextStep}
                                        endIcon={<AddIcon />}
                                    >
                                        Next
                                    </Button>
                                ) : null}
                            </Box>
                        </Box>
                    )}
                </form>
            </Paper>

            {/* Submit button - Always visible at the bottom */}
            {activeStep !== 3 && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        type="submit"
                        variant="contained"
                        loading={loading}
                        disabled={apiLoading}
                        onClick={handleSubmit}
                        startIcon={<CheckCircleIcon />}
                        sx={{
                            backgroundColor: '#1976d2',
                            '&:hover': {
                                backgroundColor: '#1565c0'
                            },
                            minWidth: '200px'
                        }}
                    >
                        {loading ? 'Updating Usecase...' : 'Update Usecase'}
                    </Button>
                </Box>
            )}

            {/* Multi-User Selection Dialog */}
            <Dialog
                open={userDialogOpen}
                onClose={handleCloseUserDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <GroupIcon />
                    Select Team Members
                </DialogTitle>
                <DialogContent dividers sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Button size="small" onClick={handleSelectAllUsers}>
                            Select All
                        </Button>
                        <Button size="small" onClick={handleDeselectAllUsers}>
                            Deselect All
                        </Button>
                    </Box>

                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {users.map((user, index) => (
                            <ListItem key={`${user}-${index}`} disablePadding>
                                <ListItemButton onClick={() => handleToggleUser(user)}>
                                    <ListItemIcon>
                                        <Checkbox
                                            edge="start"
                                            checked={selectedUsers.includes(user)}
                                            tabIndex={-1}
                                            disableRipple
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={user}
                                        secondary={`${user.toLowerCase()}@company.com`}
                                    />
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                        {user.charAt(0).toUpperCase()}
                                    </Avatar>
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>

                    {selectedUsers.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Selected: {selectedUsers.join(', ')}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseUserDialog}>Cancel</Button>
                    <Button
                        onClick={handleSaveUsers}
                        variant="contained"
                        disabled={selectedUsers.length === 0}
                    >
                        Save ({selectedUsers.length})
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PocPrjIdEdit;