import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    Divider,
    Chip,
    Alert,
    CircularProgress,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    useTheme,
    useMediaQuery,
    AppBar,
    Toolbar,
    Container,
    Fade,
    Slide,
    Zoom,
    Avatar,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    OutlinedInput,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Popover,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Today as TodayIcon,
    AccessTime as AccessTimeIcon,
    Dashboard as DashboardIcon,
    Analytics as AnalyticsIcon,
    Person as PersonIcon,
    WorkHistory as WorkHistoryIcon,
    Search as SearchIcon,
    Groups as GroupsIcon,
    RocketLaunch as RocketLaunchIcon,
    Description as DescriptionIcon,
    Assignment as AssignmentIcon,
    Menu as MenuIcon,
} from '@mui/icons-material';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";




const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user; // This should include emp_id
        next();
    });
};

const StatusComponent = ({ user, onNavigate, onLogout }) => {

    const [userPermissions, setUserPermissions] = useState({});
    const [statusData, setStatusData] = useState({
        date: new Date().toISOString().split('T')[0],
        usecaseId: '',
        leadIds: [],
        status: '',
        workingHours: '',
        workingMinutes: '',
        description: ''
    });
    const [usecases, setUsecases] = useState([]);
    const [leads, setLeads] = useState([]);
    const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);
    const [todayStatus, setTodayStatus] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [searchUsecase, setSearchUsecase] = useState('');
    const [searchLead, setSearchLead] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [statusToDelete, setStatusToDelete] = useState(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [calendarAnchor, setCalendarAnchor] = useState(null);
    const [isCustomDate, setIsCustomDate] = useState(false);


    // ✅ Replace existing handleCalendarOpen with this:
    const handleCalendarOpen = (event) => {
        // Instead of opening a dialog, directly trigger the calendar popover
        setCalendarAnchor(event.currentTarget);
    };


    const handleCalendarClose = () => {
        setCalendarAnchor(null);
    };

    const handleDateSelect = (date) => {
        // Directly use the date from the input (it's already in YYYY-MM-DD format)
        fetchTodayStatus(date);
        handleCalendarClose();
    };

    const handleTodayClick = () => {
        fetchTodayStatus();
    };



    useEffect(() => {
        fetchUsecases();
        fetchLeads();
        fetchTodayStatus();
    }, []);

    // Add this useEffect to fetch permissions
    useEffect(() => {
        fetchUserPermissions();
    }, []);

    const fetchUserPermissions = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`http://localhost:5050/poc/permissions/${user?.emp_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserPermissions(response.data);
        } catch (error) {
            console.error('Error fetching user permissions:', error);
        }
    };

    const fetchUsecases = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get('http://localhost:5050/poc/getUsecases', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const formattedUsecases = Array.isArray(response.data) ? response.data.map(usecase => ({
                id: usecase.poc_prj_id,
                name: `${usecase.client_name} - ${usecase.poc_prj_name}`,
                client_name: usecase.client_name,
                poc_prj_name: usecase.poc_prj_name,
                poc_prj_id: usecase.poc_prj_id,
                rawData: usecase
            })) : [];

            setUsecases(formattedUsecases);
        } catch (error) {
            console.error('Error fetching usecases:', error);
            setUsecases([
                { id: 1, poc_prj_id: 'UC001', name: 'TechCorp - AI Implementation Project', client_name: 'TechCorp', poc_prj_name: 'AI Implementation Project' },
                { id: 2, poc_prj_id: 'UC002', name: 'Enterprise Inc - Cloud Migration Initiative', client_name: 'Enterprise Inc', poc_prj_name: 'Cloud Migration Initiative' },
                { id: 3, poc_prj_id: 'INTERNAL', name: 'Startup Ltd - Data Analytics Platform', client_name: 'Startup Ltd', poc_prj_name: 'Data Analytics Platform' },
            ]);
        }
    };

    const filteredUsecases = usecases.filter(usecase =>
        usecase.poc_prj_id?.toLowerCase().includes(searchUsecase.toLowerCase()) ||
        usecase.poc_prj_name?.toLowerCase().includes(searchUsecase.toLowerCase()) ||
        usecase.client_name?.toLowerCase().includes(searchUsecase.toLowerCase())
    );

    const fetchLeads = async () => {
        try {
            const token = localStorage.getItem('authToken');
            console.log('Fetching leads with token:', !!token);

            const response = await axios.get('http://localhost:5050/poc/getLeads', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Leads API response:', response);

            const formattedLeads = Array.isArray(response.data) ? response.data.map(lead => ({
                id: lead.lead_name,
                name: lead.employee_name || lead.lead_name,
                email: lead.employee_name || lead.lead_name + '@company.com',
                department: lead.department_name,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.lead_name)}&background=random`
            })) : [];

            setLeads(formattedLeads);
        } catch (error) {
            console.error('Error fetching leads:', error);
            console.error('Error details:', error.response?.data);

        }
    };

    const fetchTodayStatus = async (date = null) => {
        try {
            const token = localStorage.getItem('authToken');
            const targetDate = date || new Date().toISOString().split('T')[0];

            const response = await axios.get(`http://localhost:5050/poc/getStatusByDate?date=${targetDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Status API Response:', response.data);

            // Transform the data to match what your table expects
            const transformedData = response.data.map(status => ({
                id: status.id,
                date: status.date,
                usecaseName: status.usecaseName || `Usecase ${status.usecaseId}`,
                usecaseId: status.usecaseId,
                leadName: status.leadName,
                leadIds: status.leadIds,
                status: status.status,
                workingHours: status.workingHours,
                workingMinutes: status.workingMinutes,
                description: status.description,
                employeeName: status.employeeName,
                employeeId: status.employeeId
            }));

            setTodayStatus(transformedData);
            setSelectedDate(targetDate);
            setIsCustomDate(!!date);
        } catch (error) {
            console.error('Error fetching status:', error);
            // Fallback data that matches the expected structure
            setTodayStatus([
                {
                    id: 1,
                    date: new Date().toISOString().split('T')[0],
                    usecaseName: 'TechCorp - AI Implementation Project',
                    usecaseId: 1,
                    leadName: '',
                    leadIds: [],
                    status: 'In Progress',
                    workingHours: 2,
                    workingMinutes: 30,
                    description: 'Working on machine learning model implementation',
                    employeeName: user?.emp_name,
                    employeeId: user?.emp_id
                }
            ]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'workingHours') {
            const hours = parseInt(value) || 0;
            if (hours >= 0 && hours <= 12) {
                setStatusData(prev => ({ ...prev, [name]: value }));
            } else if (value === '') {
                setStatusData(prev => ({ ...prev, [name]: '' }));
            }
        } else if (name === 'workingMinutes') {
            const minutes = parseInt(value) || 0;
            if (minutes >= 0 && minutes <= 59) {
                setStatusData(prev => ({ ...prev, [name]: value }));
            } else if (value === '') {
                setStatusData(prev => ({ ...prev, [name]: '' }));
            }
        } else {
            setStatusData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleLeadChange = (event) => {
        const { value } = event.target;
        setStatusData(prev => ({
            ...prev,
            leadIds: typeof value === 'string' ? value.split(',') : value,
        }));
    };

    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchLead.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchLead.toLowerCase()) ||
        lead.department.toLowerCase().includes(searchLead.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!statusData.workingHours && !statusData.workingMinutes) {
            setError('Please enter working hours or minutes');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');

            const selectedUsecase = usecases.find(u => u.id == statusData.usecaseId);
            const selectedLeads = leads.filter(l => statusData.leadIds.includes(l.id));

            const payload = {
                ...statusData,
                employeeId: user?.emp_id || user?.id,
                employeeName: user?.emp_name || user?.email_id,
                totalMinutes: (parseInt(statusData.workingHours || 0) * 60) + parseInt(statusData.workingMinutes || 0),
                usecaseName: selectedUsecase?.name || '',
                leadNames: selectedLeads.map(lead => lead.name).join(', '),
                leadIds: statusData.leadIds.join(',')
            };
            console.log("Payload being sent:", JSON.stringify(payload, null, 2));
            const url = editMode
                ? `http://localhost:5050/poc/empupdateStatus/${editId}`
                : 'http://localhost:5050/poc/saveDailyStatus';

            const method = editMode ? 'put' : 'post';

            await axios[method](url, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(editMode ? 'Status updated successfully!' : 'Status added successfully!');
            resetForm();
            fetchTodayStatus();

            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error saving status:', error);
            setError('Failed to save status. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    const formatDateToYYYYMMDD = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const handleEdit = (status) => {
        const localDate = status.date?.split('T')[0];
        setStatusData({
            date: formatDateToYYYYMMDD(status.date),
            usecaseId: status.usecaseId || usecases.find(u => u.name === status.usecaseName)?.id || '',
            leadIds: status.leadIds ? (Array.isArray(status.leadIds) ? status.leadIds : status.leadIds.split(',')) : [],
            status: status.status,
            workingHours: status.workingHours?.toString() || '',
            workingMinutes: status.workingMinutes?.toString() || '',
            description: status.description || ''
        });
        setEditMode(true);
        setEditId(status.id);

        if (isMobile) {
            document.getElementById('status-form-section').scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleDeleteClick = (status) => {
        setStatusToDelete(status);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (statusToDelete) {
            try {
                const token = localStorage.getItem('authToken');
                await axios.delete(`http://localhost:5050/poc/deleteStatus/${statusToDelete.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Status deleted successfully!');
                fetchTodayStatus();
                setTimeout(() => setSuccess(''), 3000);
            } catch (error) {
                console.error('Error deleting status:', error);
                setError('Failed to delete status.');
            }
        }
        setDeleteDialogOpen(false);
        setStatusToDelete(null);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setStatusToDelete(null);
    };

    const resetForm = () => {
        setStatusData({
            date: new Date().toISOString().split('T')[0],
            usecaseId: '',
            leadIds: [],
            status: '',
            workingHours: '',
            workingMinutes: '',
            description: ''
        });
        setEditMode(false);
        setEditId(null);
        setSearchUsecase('');
        setSearchLead('');
    };

    const calculateTotalHours = () => {
        if (userPermissions.all_status_access) {
            // Calculate total for all employees
            return todayStatus.reduce((total, status) => {
                return total + (parseInt(status.workingHours) || 0) + (parseInt(status.workingMinutes) || 0) / 60;
            }, 0).toFixed(2);
        } else {
            // Calculate total only for current user
            return todayStatus
                .filter(status => status.employeeId === user?.emp_id)
                .reduce((total, status) => {
                    return total + (parseInt(status.workingHours) || 0) + (parseInt(status.workingMinutes) || 0) / 60;
                }, 0).toFixed(2);
        }
    };
    return (
        <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f8fafc' }}>
            {/* Header */}
            <AppBar position="static" elevation={4} sx={{
                bgcolor: 'primary.main',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                py: 1
            }}>
                <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, position: 'relative' }}>
                    <Button
                        color="inherit"
                        onClick={onNavigate}
                        startIcon={<DashboardIcon />}
                        variant="outlined"
                        size={isMobile ? "small" : "medium"}
                        sx={{
                            borderColor: 'rgba(255,255,255,0.3)',
                            fontWeight: 'bold',
                            minWidth: 'auto'
                        }}
                    >
                        {isMobile ? 'Dashboard' : 'Dashboard'}
                    </Button>

                    {/* Centered Title Section */}
                    <Box sx={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <WorkHistoryIcon sx={{ mr: 1, fontSize: { xs: 24, md: 32 } }} />
                        <Typography
                            variant={isMobile ? "h6" : "h4"}
                            component="h1"
                            color="inherit"
                            sx={{
                                fontWeight: 'bold',
                                fontFamily: '"Segoe UI", Arial, sans-serif',
                                background: 'linear-gradient(45deg, #fff 30%, #ffeaa7 90%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}
                        >
                            {isMobile ? '🚀 Daily Status Dashboard' : '🚀 Daily Status Dashboard'}
                        </Typography>
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: { xs: 1, md: 2 },
                        flexWrap: 'wrap',
                        ml: 'auto'
                    }}>
                        {!isSmallMobile && (
                            <Chip
                                icon={<PersonIcon />}
                                label={isMobile ? user?.emp_name?.split(' ')[0] || 'User' : `Welcome, ${user?.emp_name || user?.email_id || 'User'}`}
                                variant="outlined"
                                size={isMobile ? "small" : "medium"}
                                sx={{
                                    color: 'white',
                                    borderColor: 'rgba(255,255,255,0.3)',
                                    fontWeight: 'bold'
                                }}
                            />
                        )}

                        <Button
                            color="inherit"
                            onClick={onLogout}
                            startIcon={isMobile ? null : <AnalyticsIcon />}

                            variant="outlined"
                            sx={{ borderColor: 'rgba(255,255,255,0.3)' }}
                        >
                            Logout
                        </Button>
                    </Box>
                </Toolbar>

            </AppBar>

            <Container maxWidth="xl" sx={{ p: isMobile ? 1 : 3 }}>
                {error && (
                    <Fade in={!!error}>
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.9rem' }}>
                            ⚠️ {error}
                        </Alert>
                    </Fade>
                )}

                {success && (
                    <Fade in={!!success}>
                        <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontSize: '0.9rem' }}>
                            ✅ {success}
                        </Alert>
                    </Fade>
                )}




                {/* FLEXBOX LAYOUT INSTEAD OF GRID */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? 2 : 3,
                    alignItems: 'stretch', // Change from 'flex-start' to 'stretch'
                    minHeight: '70vh' // Ensure parent has minimum height
                }}>
                    {/* Status Form Section - Wider */}
                    <Box sx={{
                        flex: isMobile ? '0 0 auto' : '1', // Use flex grow
                        minHeight: isMobile ? 'auto' : '600px'
                    }}>
                        <Zoom in={true} timeout={800}>
                            <Paper elevation={isMobile ? 2 : 8} sx={{
                                p: isMobile ? 2 : 3,
                                borderRadius: isMobile ? 2 : 3,
                                height: 'fit-content',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)',
                                border: '2px solid',
                                borderColor: editMode ? 'warning.main' : 'primary.light',
                                boxShadow: isMobile ? '0 4px 12px rgba(0,0,0,0.1)' : '0 8px 24px rgba(0,0,0,0.15)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '4px',
                                    background: editMode
                                        ? 'linear-gradient(90deg, #ff9800 0%, #ff5722 100%)'
                                        : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                                }
                            }}>
                                <Box sx={{ position: 'relative', zIndex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box sx={{
                                            background: editMode
                                                ? 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)'
                                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            borderRadius: 2,
                                            p: 1,
                                            mr: 2,
                                            boxShadow: '0 2px 8px rgba(102,126,234,0.3)'
                                        }}>
                                            {editMode ? (
                                                <EditIcon sx={{ fontSize: isMobile ? 20 : 24, color: 'white' }} />
                                            ) : (
                                                <RocketLaunchIcon sx={{ fontSize: isMobile ? 20 : 24, color: 'white' }} />
                                            )}
                                        </Box>
                                        <Typography variant={isMobile ? "h6" : "h5"} sx={{
                                            fontWeight: 'bold',
                                            background: editMode
                                                ? 'linear-gradient(45deg, #ff9800 0%, #ff5722 100%)'
                                                : 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}>
                                            {editMode ? '✏️ Update Status' : '🚀 Add Status'}
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ mb: 2 }} />

                                    <form onSubmit={handleSubmit}>
                                        {/* Date Selection */}
                                        <Box sx={{ mb: 2 }}>
                                            <TextField
                                                fullWidth
                                                type="date"
                                                name="date"
                                                value={statusData.date}
                                                onChange={handleInputChange}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{
                                                    max: new Date().toISOString().split('T')[0]
                                                }}
                                                required
                                                size={isMobile ? "small" : "medium"}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        fontSize: isMobile ? '0.9rem' : '1rem',
                                                    }
                                                }}
                                            />
                                        </Box>

                                        {/* Usecase Selection */}
                                        <Box sx={{ mb: 2 }}>
                                            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                                                <InputLabel>Usecase Project *</InputLabel>

                                                <Select
                                                    name="usecaseId"
                                                    value={statusData.usecaseId}
                                                    onChange={handleInputChange}
                                                    input={<OutlinedInput label="Usecase Project *" />}
                                                    required
                                                    MenuProps={{
                                                        PaperProps: {
                                                            sx: {
                                                                maxHeight: 300,
                                                                borderRadius: 2
                                                            }
                                                        }
                                                    }}
                                                    sx={{
                                                        '& .MuiSelect-select': {
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: '100%',
                                                            display: 'block',
                                                            // Add these styles to match other input boxes
                                                            fontSize: isMobile ? '0.9rem' : '1rem',
                                                            fontWeight: 'normal', // Remove bold from selected option
                                                            fontFamily: 'inherit' // Use same font as other inputs
                                                        },
                                                        // Add the same border radius as other inputs
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                            fontSize: isMobile ? '0.9rem' : '1rem',
                                                        }
                                                    }}
                                                >
                                                    <Box sx={{
                                                        px: 2,
                                                        py: 1,
                                                        position: 'sticky',
                                                        top: 0,
                                                        bgcolor: 'background.paper',
                                                        zIndex: 1,
                                                        borderBottom: '1px solid',
                                                        borderColor: 'divider'
                                                    }}>
                                                        <TextField
                                                            fullWidth
                                                            placeholder="Search usecases..."
                                                            value={searchUsecase}
                                                            onChange={(e) => setSearchUsecase(e.target.value)}
                                                            size="small"
                                                            onClick={(e) => e.stopPropagation()}
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <SearchIcon color="primary" fontSize="small" />
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </Box>
                                                    <MenuItem value="">
                                                        <Typography color="text.secondary" fontSize={isMobile ? "0.8rem" : "0.9rem"}>
                                                            Select a usecase project...
                                                        </Typography>
                                                    </MenuItem>
                                                    // In the Usecase Selection section, update the MenuItem to remove bold styling:

                                                    {filteredUsecases.map((usecase) => {
                                                        const isInternal = usecase.poc_prj_id?.toLowerCase().includes('internal');
                                                        return (
                                                            <MenuItem key={usecase.id} value={usecase.id}>
                                                                <Box sx={{
                                                                    width: '100%',
                                                                    overflow: 'hidden'
                                                                }}>
                                                                    <Typography
                                                                        variant={isMobile ? "body2" : "body1"}
                                                                        // REMOVE fontWeight="bold" from here
                                                                        sx={{
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                            display: 'block',
                                                                            // Add normal font weight to match other inputs
                                                                            fontWeight: 'normal',
                                                                            fontSize: isMobile ? '0.9rem' : '1rem'
                                                                        }}
                                                                    >
                                                                        {isInternal
                                                                            ? `${usecase.poc_prj_id} (${usecase.poc_prj_name})`
                                                                            : `${usecase.poc_prj_id} (${usecase.client_name} - ${usecase.poc_prj_name})`
                                                                        }
                                                                    </Typography>
                                                                </Box>
                                                            </MenuItem>
                                                        );
                                                    })}
                                                </Select>
                                            </FormControl>
                                        </Box>

                                        {/* Leads Selection */}
                                        <Box sx={{ mb: 2 }}>
                                            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                                                <InputLabel>Project Leads *</InputLabel>
                                                <Select
                                                    multiple
                                                    name="leadIds"
                                                    value={statusData.leadIds}
                                                    onChange={handleLeadChange}
                                                    onClose={() => setLeadDropdownOpen(false)}
                                                    onOpen={() => setLeadDropdownOpen(true)}
                                                    open={leadDropdownOpen}
                                                    input={<OutlinedInput label="Project Leads *" />}
                                                    renderValue={(selected) => {
                                                        if (selected.length === 0) {
                                                            return 'Select leads';
                                                        }

                                                        // Get the selected lead names
                                                        const selectedLeadNames = selected.map(leadId => {
                                                            const lead = leads.find(l => l.id === leadId);
                                                            return lead ? lead.name : leadId;
                                                        });

                                                        // Show names, truncate if too long
                                                        return selectedLeadNames.join(', ');
                                                    }}
                                                    MenuProps={{
                                                        PaperProps: {
                                                            sx: {
                                                                maxHeight: 300,
                                                                borderRadius: 2
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Box sx={{ px: 2, py: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                        <TextField
                                                            fullWidth
                                                            placeholder="Search leads..."
                                                            value={searchLead}
                                                            onChange={(e) => setSearchLead(e.target.value)}
                                                            size="small"
                                                            onClick={(e) => e.stopPropagation()}
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <SearchIcon color="secondary" fontSize="small" />
                                                                    </InputAdornment>
                                                                ),
                                                            }}
                                                        />
                                                    </Box>
                                                    {filteredLeads.map((lead) => (
                                                        <MenuItem
                                                            key={lead.id}
                                                            value={lead.id}
                                                            onClick={() => setLeadDropdownOpen(false)}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                                <Avatar
                                                                    src={lead.avatar}
                                                                    sx={{ width: 28, height: 28, mr: 1 }}
                                                                />
                                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                    <Typography variant="body2" fontWeight="bold" noWrap>
                                                                        {lead.name}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                                        {lead.department}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>

                                        {/* Description */}
                                        <Box sx={{ mb: 2 }}>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={3}
                                                label="Work Description "
                                                name="description"
                                                value={statusData.description}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Describe what you worked on..."
                                                size={isMobile ? "small" : "medium"}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        fontSize: isMobile ? '0.9rem' : '1rem',
                                                    }
                                                }}
                                            />
                                        </Box>

                                        {/* Working Hours */}
                                        <Grid container spacing={1} sx={{ mb: 2 }}>
                                            <Grid item xs={6}>
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    label="Hours"
                                                    name="workingHours"
                                                    value={statusData.workingHours}
                                                    onChange={handleInputChange}
                                                    inputProps={{ min: 0, max: 12 }}
                                                    size={isMobile ? "small" : "medium"}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                        }
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    label="Minutes"
                                                    name="workingMinutes"
                                                    value={statusData.workingMinutes}
                                                    onChange={handleInputChange}
                                                    inputProps={{ min: 0, max: 59 }}
                                                    size={isMobile ? "small" : "medium"}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                        }
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>

                                        {/* Submit Buttons */}
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                fullWidth={isMobile}
                                                size={isMobile ? "medium" : "large"}
                                                disabled={loading}
                                                startIcon={loading ? <CircularProgress size={20} /> : (editMode ? <EditIcon /> : <AddIcon />)}
                                                sx={{
                                                    fontWeight: 'bold',
                                                    fontSize: isMobile ? '0.9rem' : '1rem',
                                                    py: isMobile ? 1 : 1.2,
                                                    borderRadius: 2,
                                                    background: editMode
                                                        ? 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)'
                                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    flex: 1,
                                                    minWidth: 120
                                                }}
                                            >
                                                {loading ? 'Saving...' : (editMode ? 'Update' : 'Submit')}
                                            </Button>

                                            {editMode && (
                                                <Button
                                                    variant="outlined"
                                                    onClick={resetForm}
                                                    disabled={loading}
                                                    fullWidth={isMobile}
                                                    size={isMobile ? "medium" : "large"}
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        fontSize: isMobile ? '0.9rem' : '1rem',
                                                        py: isMobile ? 1 : 1.2,
                                                        borderRadius: 2,
                                                        flex: 1,
                                                        minWidth: 100
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </Box>
                                    </form>
                                </Box>
                            </Paper>
                        </Zoom>
                    </Box>

                    {/* Today's Status Section */}
                    <Box sx={{
                        flex: isMobile ? '0 0 auto' : '1',
                        minHeight: isMobile ? 'auto' : '600px', // Match the form section height
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Slide direction="left" in={true} timeout={800}>
                            <Paper elevation={isMobile ? 2 : 8} sx={{
                                p: isMobile ? 2 : 3,
                                borderRadius: isMobile ? 2 : 3,
                                height: 'fit-content', // Match the form section
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                                border: '2px solid',
                                borderColor: 'info.light',
                                boxShadow: isMobile ? '0 4px 12px rgba(0,0,0,0.1)' : '0 8px 24px rgba(0,0,0,0.15)',
                                position: 'relative',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '4px',
                                    background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'
                                }
                            }}>
                                <Box sx={{
                                    position: 'relative',
                                    zIndex: 1,
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    {/* Header Section */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 2
                                    }}>
                                        <Box
                                            sx={{
                                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                                borderRadius: 2,
                                                p: 1,
                                                mr: 1,
                                                boxShadow: '0 2px 8px rgba(79,172,254,0.3)',
                                            }}
                                        >
                                            <AccessTimeIcon sx={{ fontSize: isMobile ? 18 : 20, color: 'white' }} />
                                        </Box>
                                        <Typography
                                            variant={isMobile ? 'h6' : 'h5'}
                                            sx={{
                                                fontWeight: 'bold',
                                                background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                            }}
                                        >
                                            {isCustomDate ? `${selectedDate} Entries` : "Today's Entries"}
                                        </Typography>

                                        {userPermissions.all_status_access && (
                                            <>
                                                <Chip
                                                    label="Viewing All Statuses"
                                                    color="success"
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ ml: 1, fontWeight: 'bold' }}
                                                />

                                                {/* Date Picker */}
                                                <DatePicker
                                                    selected={new Date(selectedDate)}
                                                    onChange={(date) => {
                                                        if (date) {
                                                            const formatted = date.toISOString().split('T')[0];
                                                            handleDateSelect(formatted);
                                                        }
                                                    }}
                                                    maxDate={new Date()}
                                                    dateFormat="yyyy-MM-dd"
                                                    customInput={
                                                        <IconButton sx={{ ml: 1 }} size="small">
                                                            <TodayIcon />
                                                        </IconButton>
                                                    }
                                                    popperPlacement="bottom-start"
                                                    popperModifiers={[
                                                        {
                                                            name: 'offset',
                                                            options: { offset: [0, 5] },
                                                        },
                                                        {
                                                            name: 'zIndex',
                                                            enabled: true,
                                                            phase: 'write',
                                                            fn({ state }) {
                                                                state.styles.popper.zIndex = 9999;
                                                            },
                                                        },
                                                        {
                                                            name: 'preventOverflow',
                                                            options: {
                                                                boundary: 'viewport',
                                                            },
                                                        },
                                                    ]}
                                                />

                                                {isCustomDate && (
                                                    <Button onClick={handleTodayClick} size="small" sx={{ ml: 1 }}>
                                                        Today
                                                    </Button>
                                                )}
                                            </>
                                        )}

                                        <Chip
                                            label={`${calculateTotalHours()}h (${userPermissions.all_status_access ? 'All' : 'Mine'})`}
                                            color="info"
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                ml: 1,
                                                fontWeight: 'bold',
                                                bgcolor: 'rgba(79,172,254,0.1)',
                                                borderColor: 'info.light',
                                            }}
                                        />
                                    </Box>

                                    <Divider sx={{ mb: 2 }} />

                                    {/* Content Area - Simplified height management */}
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        minHeight: isMobile ? '400px' : '400px'
                                    }}>
                                        {todayStatus.length === 0 ? (
                                            <Box sx={{
                                                textAlign: 'center',
                                                py: 4,
                                                bgcolor: 'grey.50',
                                                borderRadius: 2,
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                minHeight: isMobile ? '350px' : '450px'
                                            }}>
                                                <Typography variant="body1" color="text.secondary" gutterBottom>
                                                    No entries for today
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Add your first status entry!
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <TableContainer
                                                sx={{
                                                    borderRadius: 2,
                                                    flex: 1,
                                                    overflowY: 'auto',
                                                    overflowX: 'hidden',
                                                    maxHeight: isMobile ? '400px' : '500px',
                                                    minHeight: isMobile ? '400px' : '400px',
                                                    position: 'relative',
                                                    zIndex: 1,
                                                }}
                                            >
                                                <Table size={isMobile ? "small" : "medium"} stickyHeader>
                                                    <TableHead>
                                                        <TableRow sx={{ bgcolor: 'primary.main' }}>
                                                            {/* Add Employee column when user has all_status_access */}
                                                            {userPermissions.all_status_access && (
                                                                <TableCell sx={{ color: 'black', fontWeight: 'bold', fontSize: isMobile ? '0.8rem' : '1.1rem', py: 1 }}>
                                                                    Employee
                                                                </TableCell>
                                                            )}
                                                            <TableCell sx={{ color: 'black', fontWeight: 'bold', fontSize: isMobile ? '0.8rem' : '1.1rem', py: 1 }}>
                                                                Usecase
                                                            </TableCell>
                                                            {!isSmallMobile && (
                                                                <TableCell sx={{ color: 'black', fontWeight: 'bold', fontSize: isMobile ? '0.8rem' : '1.1rem', py: 1 }}>
                                                                    Time
                                                                </TableCell>
                                                            )}
                                                            <TableCell sx={{ color: 'black', fontWeight: 'bold', fontSize: isMobile ? '0.8rem' : '1.1rem', py: 1 }}>
                                                                Actions
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {todayStatus.map((status) => (
                                                            <TableRow key={status.id} hover>
                                                                {/* Show employee info when user has all_status_access */}
                                                                {userPermissions.all_status_access && (
                                                                    <TableCell>
                                                                        <Typography variant={isMobile ? "body2" : "body1"} fontWeight="bold" noWrap>
                                                                            {status.employeeName}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                                            {status.employeeId}
                                                                        </Typography>
                                                                    </TableCell>
                                                                )}
                                                                <TableCell>
                                                                    <Typography variant={isMobile ? "body2" : "body1"} fontWeight="bold" noWrap>
                                                                        {status.usecaseName}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                                        {status.description?.substring(0, isMobile ? 25 : 40)}...
                                                                    </Typography>
                                                                    {isSmallMobile && (
                                                                        <Typography variant="caption" color="primary" display="block">
                                                                            {status.workingHours || 0}h {(status.workingMinutes || 0)}m
                                                                        </Typography>
                                                                    )}
                                                                </TableCell>
                                                                {!isSmallMobile && (
                                                                    <TableCell>
                                                                        <Typography variant={isMobile ? "body2" : "body1"} fontWeight="bold" color="primary">
                                                                            {status.workingHours || 0}h {(status.workingMinutes || 0)}m
                                                                        </Typography>
                                                                    </TableCell>
                                                                )}
                                                                <TableCell>
                                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                        {/* Only show edit/delete for own records OR if user has all access */}
                                                                        {(userPermissions.all_status_access || status.employeeId === user?.emp_id) && (
                                                                            <>
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={() => handleEdit(status)}
                                                                                    sx={{
                                                                                        bgcolor: 'primary.light',
                                                                                        '&:hover': { bgcolor: 'primary.main' },
                                                                                    }}
                                                                                >
                                                                                    <EditIcon sx={{ color: 'white', fontSize: isMobile ? 16 : 18 }} />
                                                                                </IconButton>
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={() => handleDeleteClick(status)}
                                                                                    sx={{
                                                                                        bgcolor: 'error.light',
                                                                                        '&:hover': { bgcolor: 'error.main' },
                                                                                    }}
                                                                                >
                                                                                    <DeleteIcon sx={{ color: 'white', fontSize: isMobile ? 16 : 18 }} />
                                                                                </IconButton>
                                                                            </>
                                                                        )}
                                                                        {!userPermissions.all_status_access && status.employeeId !== user?.emp_id && (
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                Read only
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Box>
                                </Box>
                            </Paper>
                        </Slide>
                    </Box>
                </Box>

            </Container >

            {/* Delete Confirmation Dialog */}
            < Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
                    Confirm Delete
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography>
                        Are you sure you want to delete this status entry?
                    </Typography>
                    {statusToDelete && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                                {statusToDelete.usecaseName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {statusToDelete.description?.substring(0, 50)}...
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog >



        </Box >
    );
};

export default StatusComponent;