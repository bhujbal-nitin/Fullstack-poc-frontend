import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
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
    FormControlLabel,
    Checkbox,
    Tooltip,
    Radio,
    RadioGroup,
    FormLabel,
    Stack
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Person as PersonIcon,
    Analytics as AnalyticsIcon,
    CalendarMonth as CalendarMonthIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Today as TodayIcon,
    DateRange as DateRangeIcon,
    CheckCircle as CheckCircleIcon,
    Pending as PendingIcon,
    Cancel as CancelIcon,
    Notifications as NotificationsIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    Refresh as RefreshIcon,
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    EventAvailable as EventAvailableIcon,
    EventBusy as EventBusyIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const LeaveManagement = ({ user, onNavigate, onLogout }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // States
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [leaveToDelete, setLeaveToDelete] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [viewType, setViewType] = useState('list'); // 'list' or 'calendar'

    // Form state
    const [leaveForm, setLeaveForm] = useState({
        leaveType: '',
        startDate: dayjs(),
        endDate: dayjs(),
        reason: '',
        contactDuringLeave: '',
        attachments: [],
        halfDay: false,
        halfDayType: 'first' // 'first' or 'second'
    });

    // Leave types
    const leaveTypes = [
        { value: 'casual', label: 'Casual Leave', maxDays: 12 },
        { value: 'sick', label: 'Sick Leave', maxDays: 15 },
        { value: 'earned', label: 'Earned Leave', maxDays: 30 },
        { value: 'maternity', label: 'Maternity Leave', maxDays: 180 },
        { value: 'paternity', label: 'Paternity Leave', maxDays: 15 },
        { value: 'bereavement', label: 'Bereavement Leave', maxDays: 7 },
        { value: 'unpaid', label: 'Unpaid Leave', maxDays: 90 }
    ];

    // In fetchLeaveRequests function - UPDATE THIS
    const fetchLeaveRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get('http://localhost:5050/leave/requests', { // REMOVE /api/
                headers: { Authorization: `Bearer ${token}` }
            });

            // The API now returns only the logged-in user's leaves
            setLeaveRequests(response.data);

        } catch (error) {
            console.error('Error fetching leave requests:', error);
            setError('Failed to load leave requests');
            setLeaveRequests([]); // Clear any previous data
        } finally {
            setLoading(false);
        }
    };


    // Initialize
    useEffect(() => {
        fetchLeaveRequests();
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLeaveForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle date changes
    const handleDateChange = (name, date) => {
        setLeaveForm(prev => ({
            ...prev,
            [name]: date
        }));
    };

    // Calculate leave days
    const calculateDays = () => {
        if (!leaveForm.startDate || !leaveForm.endDate) return 0;

        const start = dayjs(leaveForm.startDate);
        const end = dayjs(leaveForm.endDate);

        if (leaveForm.halfDay) return 0.5;

        return Math.abs(end.diff(start, 'day')) + 1;
    };

    // Submit leave request - UPDATE THIS
    const handleSubmitLeave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validation
        if (!leaveForm.leaveType) {
            setError('Please select leave type');
            setLoading(false);
            return;
        }

        if (!leaveForm.reason.trim()) {
            setError('Please provide a reason for leave');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const payload = {
                leaveType: leaveForm.leaveType,
                startDate: leaveForm.startDate.format('YYYY-MM-DD'),
                endDate: leaveForm.endDate.format('YYYY-MM-DD'),
                days: calculateDays(),
                reason: leaveForm.reason,
                contactDuringLeave: leaveForm.contactDuringLeave,
                halfDay: leaveForm.halfDay,
                halfDayType: leaveForm.halfDayType,
                status: 'pending'
                // REMOVE: employeeId and employeeName - backend gets from token
            };

            // Update URLs - REMOVE /api/
            const url = editMode
                ? `http://localhost:5050/leave/update/${editId}`
                : 'http://localhost:5050/leave/apply';

            const method = editMode ? 'put' : 'post';

            await axios[method](url, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(editMode ? 'Leave request updated!' : 'Leave applied successfully!');
            fetchLeaveRequests();
            resetForm();
            setOpenDialog(false);

            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error submitting leave:', error);
            setError('Failed to submit leave request: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Handle edit - UPDATE FOR DATABASE FIELD NAMES
    const handleEdit = (leave) => {
        setLeaveForm({
            leaveType: leave.leave_type.toLowerCase().replace(' ', ''), // leave_type not leaveType
            startDate: dayjs(leave.start_date), // start_date not startDate
            endDate: dayjs(leave.end_date), // end_date not endDate
            reason: leave.reason,
            contactDuringLeave: leave.contact_during_leave || '', // contact_during_leave
            attachments: leave.attachments || [],
            halfDay: leave.days === 0.5,
            halfDayType: leave.half_day_type || 'first' // half_day_type
        });
        setEditMode(true);
        setEditId(leave.id);
        setOpenDialog(true);
    };

    // Handle delete
    const handleDeleteClick = (leave) => {
        setLeaveToDelete(leave);
        setDeleteDialogOpen(true);
    };

    // Update delete function - REMOVE /api/
    const handleDeleteConfirm = async () => {
        if (leaveToDelete) {
            try {
                const token = localStorage.getItem('authToken');
                await axios.delete(`http://localhost:5050/leave/delete/${leaveToDelete.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Leave request deleted successfully!');
                fetchLeaveRequests();
                setTimeout(() => setSuccess(''), 3000);
            } catch (error) {
                console.error('Error deleting leave:', error);
                setError('Failed to delete leave request');
            }
        }
        setDeleteDialogOpen(false);
        setLeaveToDelete(null);
    };

    // Reset form
    const resetForm = () => {
        setLeaveForm({
            leaveType: '',
            startDate: dayjs(),
            endDate: dayjs(),
            reason: '',
            contactDuringLeave: '',
            attachments: [],
            halfDay: false,
            halfDayType: 'first'
        });
        setEditMode(false);
        setEditId(null);
        setOpenDialog(false);
    };

    // Update the filter function (around lines 190-200):
    const filteredLeaves = leaveRequests.filter(leave => {
        // Status filter
        if (filterStatus !== 'all' && leave.status !== filterStatus) return false;

        // Search filter - fix this
        if (searchTerm &&
            !leave.leave_type?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !leave.reason?.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        return true;
    });



    // Get leave type chip color
    const getLeaveTypeColor = (type) => {
        switch (type.toLowerCase()) {
            case 'casual':
                return 'primary';
            case 'sick':
                return 'secondary';
            case 'earned':
                return 'success';
            case 'maternity':
                return 'warning';
            case 'paternity':
                return 'info';
            case 'bereavement':
                return 'error';
            default:
                return 'default';
        }
    };

    const handleDashboardClick = () => {
        navigate('/dashboard'); // React Router handles basename automatically
    };

    const handleLogoutClick = () => {
        console.log('Logout button clicked');
        if (onLogout) {
            console.log('Calling onLogout prop');
            onLogout();
        } else {
            console.error('onLogout prop not provided');
            // Fallback
            localStorage.removeItem('authToken');
            window.location.href = '/usecase/login';
        }
    };



    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f8fafc' }}>

                {/* Header - Same as StatusComponent */}
                <AppBar position="static" elevation={4} sx={{
                    bgcolor: 'primary.main',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    py: 1
                }}>
                    <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, position: 'relative' }}>
                        <Button
                            color="inherit"
                            onClick={handleDashboardClick} // Use the handler
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
                            <CalendarMonthIcon sx={{ mr: 1, fontSize: { xs: 24, md: 32 } }} />
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
                                {isMobile ? '📅 Leave Management' : '📅 Leave Management System'}
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
                                onClick={handleLogoutClick}
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
                    {/* Alerts */}
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

                    {/* Stats Cards */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                borderRadius: 2
                            }}>
                                <CardContent>
                                    <Typography variant="h4" fontWeight="bold">
                                        {leaveRequests.filter(l => l.status === 'approved').length}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Approved Leaves
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                color: 'white',
                                borderRadius: 2
                            }}>
                                <CardContent>
                                    <Typography variant="h4" fontWeight="bold">
                                        {leaveRequests.filter(l => l.status === 'pending').length}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Pending Requests
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                                color: 'white',
                                borderRadius: 2
                            }}>
                                <CardContent>
                                    <Typography variant="h4" fontWeight="bold">
                                        {(() => {
                                            const total = leaveRequests.reduce((acc, leave) => {
                                                return acc + parseFloat(leave.days || 0);
                                            }, 0);

                                            // Remove trailing .0 if whole number
                                            return total % 1 === 0 ? total.toString() : total.toFixed(1);
                                        })()}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Total Leave Days
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                color: 'white',
                                borderRadius: 2
                            }}>
                                <CardContent>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => setOpenDialog(true)}
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.2)',
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Apply Leave
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Filters and Search */}
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    placeholder="Search leaves..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Filter by Status</InputLabel>
                                    <Select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        label="Filter by Status"
                                    >
                                        <MenuItem value="all">All Status</MenuItem>
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="approved">Approved</MenuItem>
                                        <MenuItem value="rejected">Rejected</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<RefreshIcon />}
                                        onClick={fetchLeaveRequests}
                                        fullWidth
                                    >
                                        Refresh
                                    </Button>

                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Leave Requests Table */}
                    <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <TableContainer sx={{ maxHeight: 500 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Leave Type</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Days</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">
                                                <CircularProgress />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredLeaves.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">
                                                <Typography color="text.secondary">
                                                    No leave requests found
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        // In the table rendering part, update this section:
                                        filteredLeaves.map((leave) => {
                                            return (
                                                <TableRow key={leave.id} hover>
                                                    <TableCell>
                                                        <Typography fontWeight="bold">
                                                            {user?.emp_name || 'User'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {leave.emp_id || user?.emp_id}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={leave.leave_type}
                                                            size="small"
                                                            color={getLeaveTypeColor(leave.leave_type)}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {dayjs(leave.start_date).format('DD MMM YYYY')}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {dayjs(leave.end_date).format('DD MMM YYYY')}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography fontWeight="bold" color="primary">
                                                            {(() => {
                                                                const days = leave.days;
                                                                if (!days && days !== 0) return '0 days';
                                                                const numDays = typeof days === 'string' ? parseFloat(days) : days;
                                                                if (isNaN(numDays)) return '0 days';
                                                                const formattedDays = numDays % 1 === 0 ?
                                                                    numDays.toString() :
                                                                    numDays.toFixed(1);
                                                                return `${formattedDays} ${numDays === 1 ? 'day' : 'days'}`;
                                                            })()}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title={leave.reason}>
                                                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                                                {leave.reason}
                                                            </Typography>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleEdit(leave)}
                                                                color="primary"
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteClick(leave)}
                                                                color="error"
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Container>

                {/* Apply/Edit Leave Dialog */}
                <Dialog
                    open={openDialog}
                    onClose={resetForm}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 2,
                            maxHeight: '90vh' // Prevents dialog from being too tall
                        }
                    }}
                >
                    <DialogTitle sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        py: 2
                    }}>
                        <CalendarMonthIcon sx={{ mr: 1 }} />
                        {editMode ? 'Edit Leave Request' : 'Apply for Leave'}
                    </DialogTitle>

                    <DialogContent dividers sx={{
                        pt: 3,
                        pb: 2,
                        overflow: 'visible' // Ensures content is not hidden
                    }}>
                        <Box
                            component="form"
                            onSubmit={handleSubmitLeave}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                width: '100%'
                            }}
                        >
                            {/* Leave Type - Full width */}
                            <FormControl fullWidth required>
                                <InputLabel>Leave Type</InputLabel>
                                <Select
                                    name="leaveType"
                                    value={leaveForm.leaveType}
                                    onChange={handleInputChange}
                                    label="Leave Type"
                                    size="small"
                                >
                                    {leaveTypes.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label} (Max: {type.maxDays} days)
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Date pickers in a row */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <DatePicker
                                        label="Start Date"
                                        value={leaveForm.startDate}
                                        onChange={(date) => handleDateChange('startDate', date)}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                size: 'small',
                                                required: true,
                                                variant: 'outlined'
                                            }
                                        }}
                                        minDate={dayjs()}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <DatePicker
                                        label="End Date"
                                        value={leaveForm.endDate}
                                        onChange={(date) => handleDateChange('endDate', date)}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                size: 'small',
                                                required: true,
                                                variant: 'outlined'
                                            }
                                        }}
                                        minDate={leaveForm.startDate}
                                    />
                                </Grid>
                            </Grid>

                            {/* Total Days Display */}
                            <Box sx={{
                                textAlign: 'center',
                                py: 1,
                                border: '1px dashed',
                                borderColor: 'primary.light',
                                borderRadius: 1,
                                bgcolor: 'primary.50'
                            }}>
                                <Typography variant="body2" color="primary" fontWeight="bold">
                                    Total Days: {calculateDays()} {calculateDays() === 1 ? 'day' : 'days'}
                                </Typography>
                            </Box>

                            {/* Half Day Options */}
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="halfDay"
                                        checked={leaveForm.halfDay}
                                        onChange={handleInputChange}
                                    />
                                }
                                label="Half Day Leave"
                            />

                            {leaveForm.halfDay && (
                                <FormControl component="fieldset">
                                    <FormLabel component="legend">Half Day Type</FormLabel>
                                    <RadioGroup
                                        row
                                        name="halfDayType"
                                        value={leaveForm.halfDayType}
                                        onChange={handleInputChange}
                                        sx={{ justifyContent: 'center' }}
                                    >
                                        <FormControlLabel
                                            value="first"
                                            control={<Radio size="small" />}
                                            label="First Half (9AM - 1PM)"
                                        />
                                        <FormControlLabel
                                            value="second"
                                            control={<Radio size="small" />}
                                            label="Second Half (2PM - 6PM)"
                                        />
                                    </RadioGroup>
                                </FormControl>
                            )}

                            {/* Reason Field */}
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Reason for Leave *"
                                name="reason"
                                value={leaveForm.reason}
                                onChange={handleInputChange}
                                required
                                size="small"
                                variant="outlined"
                            />

                            {/* Contact Information */}
                            <TextField
                                fullWidth
                                label="Contact During Leave"
                                name="contactDuringLeave"
                                value={leaveForm.contactDuringLeave}
                                onChange={handleInputChange}
                                placeholder="Phone number or email"
                                size="small"
                                variant="outlined"
                            />

                            {/* Submit Button - Centered */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                pt: 2,
                                width: '100%'
                            }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                                    sx={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        fontWeight: 'bold',
                                        py: 1.2,
                                        px: 4,
                                        minWidth: 200
                                    }}
                                >
                                    {loading ? 'Submitting...' : (editMode ? 'Update Leave' : 'Submit Leave Request')}
                                </Button> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

                                <Button
                                    onClick={resetForm}
                                    variant="contained"
                                    disabled={loading}

                                    sx={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        fontWeight: 'bold',
                                        py: 1.2,
                                        px: 4,
                                        minWidth: 200
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    </DialogContent>

                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    maxWidth="xs"
                    fullWidth
                >
                    <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
                        Confirm Delete
                    </DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        <Typography>
                            Are you sure you want to delete this leave request?
                        </Typography>
                        {leaveToDelete && (
                            <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                    {leaveToDelete.employeeName} - {leaveToDelete.leaveType}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {dayjs(leaveToDelete.startDate).format('DD MMM YYYY')} to {dayjs(leaveToDelete.endDate).format('DD MMM YYYY')}
                                </Typography>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default LeaveManagement;