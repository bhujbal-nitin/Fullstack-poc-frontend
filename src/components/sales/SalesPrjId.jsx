import React, { useState, useEffect } from 'react';
import Dropdown from '../DropDown';
import TextInput from '../TextInput';

import '../PocPrjId.css';
import companyLogo from '../../components/Images/companyLogo.png';
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

const SalesPrjId = ({ onClose, onSuccess, onBack }) => {
  // Form states
  const [idPrefix, setIdPrefix] = useState('');
  const [pocId, setPocId] = useState('');
  const [pocName, setPocName] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityName, setEntityName] = useState('');
  const [partnerName, setPartnerName] = useState(''); // New state for partner name
  const [salesPerson, setSalesPerson] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  const [createdBy, setCreatedBy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remark, setRemark] = useState('');
  const [region, setRegion] = useState('');
  //const [isBillable, setIsBillable] = useState('');
  const [pocType, setPocType] = useState('');
  const [spocEmail, setSpocEmail] = useState('');
  const [spocDesignation, setSpocDesignation] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(true);
  const [idLoading, setIdLoading] = useState(false);

  // Multi-user selection dialog
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Dropdown options
  const [salesPersons, setSalesPersons] = useState([]);
  const [regions, setRegions] = useState([]);
  const [users, setUsers] = useState([]);
  const [createdByOptions, setCreatedByOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);

  // Error states
  const [errors, setErrors] = useState({});

  // Form steps
  const [activeStep, setActiveStep] = useState(0);

  const logoutInProgress = React.useRef(false);


  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  const handleLogout = React.useCallback(async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API}/poc/api/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      // ✅ FIXED redirect
      window.location.href = '/usecase/login';
    }
  }, []);


  const handleAutoLogout = React.useCallback(() => {
    if (logoutInProgress.current) return;

    logoutInProgress.current = true;
    handleLogout();
  }, [handleLogout]);



  React.useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token || isTokenExpired(token)) {
      handleAutoLogout();
    }
  }, [handleAutoLogout]);


  const safeAction = React.useCallback((action) => {
    const token = localStorage.getItem('authToken');

    if (!token || isTokenExpired(token)) {
      handleAutoLogout();
      return;
    }

    action();
  }, [handleAutoLogout]);


  // ID prefix options
  const idPrefixOptions = [
    'Solution-Consultation',
    'Proposal',
    'Pre-sales',
    'Demo',
    'Task',
    'Internal',
    'Event',
    'BRD',
    'Requirement-Gathering',
    'Feasibility-Study',
    'Compliance-Documentation',
    'UseCase-Preparation',
    'Presentation',
    'Workshop',
    'R&D-and-Exploration',
    'Others',
    'POC',
    'Implementation'
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
  const processApiData = (data) => {
    if (!data) return [];

    let processedData = [];

    if (Array.isArray(data)) {
      processedData = data.map(item => extractName(item)).filter(name => name);
    } else if (typeof data === 'object') {
      if (data.data && Array.isArray(data.data)) {
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
      const token = localStorage.getItem('authToken');

      if (!token || isTokenExpired(token)) {
        handleAutoLogout();
        return;
      }

      try {
        setApiLoading(true);
        const token = localStorage.getItem('authToken');
        const emp_name = getemp_name();
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const departmentName = storedUser?.department_name;
        // Fetch sales persons from API
        try {
          const salesResponse = await axios.get(`${import.meta.env.VITE_API}/poc/getAllSalesPerson`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const salesData = processApiData(salesResponse.data);
          console.log(salesData)
          setSalesPersons(salesData.length > 0 ? salesData : []);
        } catch (salesError) {
          console.error('Error fetching sales persons:', salesError);
          setSalesPersons([]);
        }


        // Fetch Assigned To options from API
        try {
          const assignToResponse = await axios.get(`${import.meta.env.VITE_API}/poc/sales/getAllAssignTo`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              department_name: departmentName
            }
          });
          const assignToData = processApiData(assignToResponse.data);
          setUsers(assignToData.length > 0 ? assignToData : ['admin', 'manager', 'developer', 'tester', 'analyst']);
        } catch (assignToError) {
          console.error('Error fetching assigned to options:', assignToError);
          setUsers([]);
        }


        // Fetch Created By options from API with emp_name parameter
        if (emp_name) {
          try {
            const createdByResponse = await axios.get(`${import.meta.env.VITE_API}/poc/getCreatedBy?emp_name=${encodeURIComponent(emp_name)}`, {
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
          setCreatedByOptions([]);
        }

        // Load other dropdown data
        setRegions(['ROW', 'ISSARC', 'America', 'Other']);
        setTagOptions(['GenAI', 'Agentic AI', 'SAP', 'RPA', 'Chatbot', 'DodEdge', 'Mainframe', 'Other']);

      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        // Fallback to dummy data if API fails
        setSalesPersons([]);
        setRegions(['ROW', 'ISSARC', 'America', 'Other']);
        setUsers([]);
        setCreatedByOptions([]);
        setTagOptions(['GenAI', 'Agentic AI', 'SAP', 'RPA', 'Chatbot', 'DodEdge', 'Mainframe', 'Other']);
      } finally {
        setApiLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  // Fetch next ID when prefix changes
  useEffect(() => {
    if (idPrefix) {
      setPocId(`${idPrefix}-XX`);
    } else {
      setPocId('');
    }
  }, [idPrefix]);

  // Show partner name field when entityType is Partner
  useEffect(() => {
    if (entityType !== 'Partner') {
      setPartnerName('');
    }
  }, [entityType]);

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


    if (tags.length === 0) newErrors.tags = 'At least one tag is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);

      try {
        // Prepare form data
        const formData = {
          pocId: idPrefix,
          pocName,
          entityType,
          entityName,
          partnerName: entityType === 'Partner' ? partnerName : '',
          salesPerson,
          description,
          assignedTo: assignedTo.join(','),
          createdBy: createdBy || (createdByOptions.length > 0 ? createdByOptions[0] : ''),
          startDate,
          endDate,
          remark,
          region,
          // isBillable: isBillable === 'Yes',
          pocType,
          spocEmail,
          spocDesignation,
          tags: tags.join(',')
        };
        console.log(formData);

        const token = localStorage.getItem('authToken');

        if (!token || isTokenExpired(token)) {
          handleAutoLogout();
          return;
        }



        const response = await axios.post(`${import.meta.env.VITE_API}/poc/sales/savepocprjid`, formData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        // Fix the response handling - check for success message instead of success property
        // Fix the response handling - check for success message instead of success property
        if (response.data && (response.data.success || response.data.message === 'POC saved successfully' || response.data.message === 'Usecase saved successfully')) {
          alert('Usecase Code created successfully!');
          resetForm();
          if (onSuccess) {
            onSuccess(); // This should refresh the table data
          }
          onClose(); // Close the form dialog
        } else {
          alert('Failed to create Usecase Code: ' + (response.data.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error saving Usecase Code:', error);
        if (error.response?.status === 401) {
          alert('Session expired. Please login again.');
        } else {
          alert('Error saving Usecase Code. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };
  const resetForm = () => {
    setIdPrefix('');
    setPocId('');
    setPocName('');
    setEntityType('');
    setEntityName('');
    setPartnerName('');
    setSalesPerson('');
    setDescription('');
    setAssignedTo([]);
    setCreatedBy('');
    setStartDate('');
    setEndDate('');
    setRemark('');
    setRegion('');
    // setIsBillable('');
    setPocType('');
    setSpocEmail('');
    setSpocDesignation('');
    setTags([]);
    setErrors({});
    setActiveStep(0);
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
      case 0: // Basic Information
        if (!idPrefix) {
          newErrors.idPrefix = 'ID Prefix is required';
          stepValid = false;
        }
        if (!pocName) {
          newErrors.pocName = 'Usecase Name is required';
          stepValid = false;
        }
        if (!description) {
          newErrors.description = 'Description is required';
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
      case 1: // Client & Team Details
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
        if (assignedTo.length === 0) {
          newErrors.assignedTo = 'At least one user must be assigned';
          stepValid = false;
        }
        break;
      case 2: // Additional Information
        if (tags.length === 0) {
          newErrors.tags = 'At least one tag is required';
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
  // Auto-populate createdBy with the first available option
  useEffect(() => {
    if (createdByOptions.length > 0 && !createdBy) {
      setCreatedBy(createdByOptions[0]);
    }
  }, [createdByOptions, createdBy]);

  // 3 Steps instead of 4
  const steps = ['Basic Information', 'Client & Team Details', 'Additional Information'];

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Basic Information
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Row 1: Compact Usecase Type + Usecase Name */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Usecase Type *
                </Typography>
                <Dropdown
                  options={idPrefixOptions}
                  value={idPrefix}
                  onChange={setIdPrefix}
                  error={errors.idPrefix}
                  placeholder="Select"
                  required
                  fullWidth
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Usecase Name *
                </Typography>
                <TextInput
                  value={pocName}
                  onChange={setPocName}
                  error={errors.pocName}
                  placeholder="Enter name"
                  required
                  fullWidth
                  size="small"
                />
              </Box>
            </Box>

            {/* Row 2: Compact Date Fields */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 2fr" },
                gap: 2,
                alignItems: "start"
              }}
            >
              {/* Start Date */}
              <Box>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Start Date *
                </Typography>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (errors.startDate) setErrors(prev => ({ ...prev, startDate: null }));
                  }}
                  className="compact-date-input"
                  style={{
                    borderColor: errors.startDate ? '#d32f2f' : '#ddd'
                  }}
                />
                {errors.startDate && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                    {errors.startDate}
                  </Typography>
                )}
              </Box>

              {/* End Date */}
              <Box>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  End Date *
                </Typography>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (errors.endDate) setErrors(prev => ({ ...prev, endDate: null }));
                  }}
                  className="compact-date-input"
                  style={{
                    borderColor: errors.endDate ? '#d32f2f' : '#ddd'
                  }}
                />
                {errors.endDate && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                    {errors.endDate}
                  </Typography>
                )}
                {startDate && endDate && new Date(endDate) < new Date(startDate) && (
                  <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                    ⚠️ Invalid range
                  </Typography>
                )}
              </Box>

              {/* Description - Compact */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary">
                    Description *
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {description.length}/500
                  </Typography>
                </Box>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                  }}
                  placeholder="Brief description..."
                  className="compact-textarea"
                  style={{
                    borderColor: errors.description ? '#d32f2f' : '#ddd'
                  }}
                />
                {errors.description && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                    {errors.description}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Compact Timeline Indicator - Only show when dates exist */}
            {(startDate || endDate) && (
              <Box sx={{
                backgroundColor: '#f0f7ff',
                p: 1.5,
                borderRadius: 1,
                borderLeft: '3px solid #1976d2',
                fontSize: '12px'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: '16px', color: '#1976d2' }} />
                    <Typography variant="caption" fontWeight="bold" color="#1565c0">
                      Timeline:
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '12px' }}>
                    <Chip
                      label={startDate || "Not set"}
                      size="small"
                      variant="outlined"
                      sx={{ height: '24px', fontSize: '11px' }}
                    />
                    <Typography variant="caption" color="#666">→</Typography>
                    <Chip
                      label={endDate || "Not set"}
                      size="small"
                      variant="outlined"
                      sx={{ height: '24px', fontSize: '11px' }}
                    />
                  </Box>

                  {startDate && endDate && (
                    <Box sx={{ ml: 'auto' }}>
                      <Typography variant="caption" color="#1976d2" fontWeight="medium">
                        {(() => {
                          const start = new Date(startDate);
                          const end = new Date(endDate);
                          const diffTime = Math.abs(end - start);
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return `${diffDays} days`;
                        })()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>

        );

      case 1: // Client & Team Details
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Row 1: Client Type + Company Name + Partner Name - Compact */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                gap: 1.5,
              }}
            >
              <Box>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Client Type *
                </Typography>
                <Dropdown
                  options={["Partner", "Client", "Internal"]}
                  value={entityType}
                  onChange={setEntityType}
                  error={errors.entityType}
                  placeholder="-- Select --"
                  required
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  End Client Name *
                </Typography>
                <TextInput
                  value={entityName}
                  onChange={setEntityName}
                  error={errors.entityName}
                  placeholder="Enter client name"
                  required
                  size="small"
                />
              </Box>

              {entityType === "Partner" && (
                <Box>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    Partner Name *
                  </Typography>
                  <TextInput
                    value={partnerName}
                    onChange={setPartnerName}
                    error={errors.partnerName}
                    placeholder="Enter partner name"
                    required
                    size="small"
                  />
                </Box>
              )}
            </Box>

            {/* Row 2: Sales Person + Region + SPOC Email - Compact */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                gap: 1.5,
              }}
            >
              <Box>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Sales Person *
                </Typography>
                <Dropdown
                  options={salesPersons}
                  value={salesPerson}
                  onChange={setSalesPerson}
                  error={errors.salesPerson}
                  placeholder="-- Select --"
                  required
                  loading={apiLoading}
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Region *
                </Typography>
                <Dropdown
                  options={regions}
                  value={region}
                  onChange={setRegion}
                  error={errors.region}
                  placeholder="-- Select --"
                  required
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  SPOC Email
                </Typography>
                <TextInput
                  value={spocEmail}
                  onChange={setSpocEmail}
                  placeholder="Enter email"
                  type="email"
                  size="small"
                />
              </Box>
            </Box>

            {/* Row 3: SPOC Designation + Created By - Compact */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.5,
              }}
            >
              <Box>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  SPOC Designation
                </Typography>
                <TextInput
                  value={spocDesignation}
                  onChange={setSpocDesignation}
                  placeholder="Enter designation"
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Created By
                </Typography>
                <Box sx={{
                  padding: '6px 10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  backgroundColor: '#fafafa',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: '#666'
                }}>
                  {createdBy || (createdByOptions.length > 0 ? createdByOptions[0] : 'N/A')}
                </Box>
              </Box>
            </Box>

            {/* Assigned To - Compact */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary">
                  Assigned To *
                </Typography>
                {assignedTo.length > 0 && (
                  <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }} onClick={() => safeAction(handleOpenUserDialog)}>
                    {assignedTo.length} selected
                  </Typography>
                )}
              </Box>

              <Button
                variant="outlined"
                onClick={() => safeAction(handleOpenUserDialog)}
                size="small"
                fullWidth
                sx={{
                  justifyContent: 'center',
                  height: '32px',
                  fontSize: '12px',
                  textTransform: 'none',
                  borderColor: '#ccc',
                  color: '#666'
                }}
              >
                Select Team Members
              </Button>

              {errors.assignedTo && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                  {errors.assignedTo}
                </Typography>
              )}

              {assignedTo.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {assignedTo.map(user => (
                      <Chip
                        key={user}
                        label={user}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{
                          height: '22px',
                          fontSize: '10px',
                          '& .MuiChip-label': { px: 0.75 }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        );

      case 2: // Additional Information
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
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

            <TextInput
              label="Remark"
              value={remark}
              onChange={setRemark}
              placeholder="Enter Remarks"
              multiline
              rows={6}
              icon={<DescriptionIcon />}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        pointerEvents: logoutInProgress.current ? 'none' : 'auto',
        opacity: logoutInProgress.current ? 0.6 : 1
      }}
    >
      {/* Header with close button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img
            src={companyLogo}
            alt="Company Logo"
            style={{ height: '40px' }}
          />
        </Box>
        <IconButton onClick={() => safeAction(onClose)} aria-label="close">
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
                  onClick={() => safeAction(handleBackStep)}
                  disabled={activeStep === 0}
                  startIcon={<RemoveIcon />}
                >
                  Back
                </Button>

                {activeStep < steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={() => safeAction(handleNextStep)}
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

      {/* Submit button - Only show on last step */}
      {activeStep === steps.length - 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            loading={loading}
            disabled={apiLoading}
            onClick={() => safeAction(handleSubmit)}
            startIcon={<CheckCircleIcon />}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0'
              },
              minWidth: '200px'
            }}
          >
            {loading ? 'Creating Usecase...' : 'Create Usecase'}
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
            <Button size="small" onClick={() => safeAction(handleSelectAllUsers)}>
              Select All
            </Button>
            <Button size="small" onClick={() => safeAction(handleDeselectAllUsers)}>
              Deselect All
            </Button>
          </Box>


          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {users.map((user, index) => (
              <ListItem key={`${user}-${index}`} disablePadding>
                <ListItemButton onClick={() => safeAction(() => handleToggleUser(user))}>
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
                  // secondary={`${user.toLowerCase()}@company.com`}
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
          <Button onClick={() => safeAction(handleCloseUserDialog)}>Cancel</Button>
          <Button
            onClick={() => safeAction(handleSaveUsers)}
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

export default SalesPrjId;