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
    Tooltip,
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
    Checkbox,
    FormControlLabel,
    RadioGroup,
    Radio,
    Badge,
    FormLabel
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Today as TodayIcon,
    Visibility as VisibilityIcon,
    Dashboard as DashboardIcon,
    Analytics as AnalyticsIcon,
    Person as PersonIcon,
    WorkHistory as WorkHistoryIcon,
    ArrowBackIos as ArrowBackIosIcon,
    ArrowForwardIos as ArrowForwardIosIcon,
    EventAvailable as EventAvailableIcon,
    Warning as WarningIcon,
    EventBusy as EventBusyIcon,
    Search as SearchIcon,
    Groups as GroupsIcon,
    RocketLaunch as RocketLaunchIcon,
    Description as DescriptionIcon,
    Assignment as AssignmentIcon,
    Menu as MenuIcon,
    Close as CloseIcon,
    CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';

import PhoneIcon from '@mui/icons-material/Phone';



import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker'; // Use this consistently
import dayjs from 'dayjs';



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
    const [statusLoading, setStatusLoading] = useState(false);
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

    const [summaryDate, setSummaryDate] = useState(dayjs().format('YYYY-MM-DD'));

    const [viewStatusDialogOpen, setViewStatusDialogOpen] = useState(false);
    const [lastWorkingDayStatus, setLastWorkingDayStatus] = useState([]);
    const [lastWorkingDayDate, setLastWorkingDayDate] = useState('');
    const [viewStatusLoading, setViewStatusLoading] = useState(false);

    // Add this state variable
    const [viewStatusSelectedDate, setViewStatusSelectedDate] = useState('');
    const [searchEmployee, setSearchEmployee] = useState('');


    const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
    const [summaryData, setSummaryData] = useState([]);
    const [summaryLoading, setSummaryLoading] = useState(false);
    // const [summaryDate, setSummaryDate] = useState(new Date().toISOString().split('T')[0]);
    const [summaryReport, setSummaryReport] = useState('');

    // Add state for View Leave dialog
    const [viewLeaveDialogOpen, setViewLeaveDialogOpen] = useState(false);
    const [leaveData, setLeaveData] = useState([]);
    const [leaveLoading, setLeaveLoading] = useState(false);
    const [calendarDate, setCalendarDate] = useState(dayjs());

    // Add state for calendar navigation and leave details
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [selectedLeaveDate, setSelectedLeaveDate] = useState(null);
    const [leaveDetails, setLeaveDetails] = useState([]);

    const [deleteLeaveDialogOpen, setDeleteLeaveDialogOpen] = useState(false);
    const [leaveToDelete, setLeaveToDelete] = useState(null);
    const [deleteLeaveLoading, setDeleteLeaveLoading] = useState(false);

    // Add these state variables
    const [editLeaveDialogOpen, setEditLeaveDialogOpen] = useState(false);
    const [leaveToEdit, setLeaveToEdit] = useState(null);
    const [editLeaveLoading, setEditLeaveLoading] = useState(false);

    // Add state for revoke message dialog
    const [revokeLeaveDialogOpen, setRevokeLeaveDialogOpen] = useState(false);
    const [leaveToRevoke, setLeaveToRevoke] = useState(null);
    const [revokeMessage, setRevokeMessage] = useState('');
    const [revokeLoading, setRevokeLoading] = useState(false);

    // Update the delete function name and handler
    const handleRevokeLeaveClick = (leave) => {
        setLeaveToRevoke(leave);
        setRevokeMessage(''); // Clear previous message
        setRevokeLeaveDialogOpen(true);
    };

    const handleSubmitRevokeLeave = async () => {
        if (!leaveToRevoke) return;

        try {
            setRevokeLoading(true);
            const token = localStorage.getItem('authToken');

            // Get current user info
            const currentUser = user?.emp_name || user?.email_id || 'Unknown User';

            // Send delete request with additional info
            const response = await axios.delete(`http://localhost:5050/poc/leave/delete/${leaveToRevoke.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    revokeMessage: revokeMessage.trim(),
                    employeeName: leaveToRevoke.emp_name || leaveToRevoke.employee_name || 'Unknown',
                    revokedByName: currentUser
                }
            });

            // Show success message
            setSuccess('Leave revoked successfully!');
            setTimeout(() => setSuccess(''), 3000);

            // Refresh leave data
            fetchLeaveData();

            // Close dialogs
            setRevokeLeaveDialogOpen(false);
            setLeaveToRevoke(null);
            setRevokeMessage('');

        } catch (error) {
            console.error('Error revoking leave:', error);
            setError('Failed to revoke leave. Please try again.');
            setTimeout(() => setError(''), 3000);
        } finally {
            setRevokeLoading(false);
        }
    };

    const handleRevokeLeaveCancel = () => {
        setRevokeLeaveDialogOpen(false);
        setLeaveToRevoke(null);
        setRevokeMessage('');
    };

    // Remove status from initial state
    const [editLeaveForm, setEditLeaveForm] = useState({
        leaveType: '',
        startDate: dayjs(),
        endDate: dayjs(),
        reason: '',
        contactDuringLeave: '',
        halfDay: false,
        halfDayType: 'first'
        // REMOVED: status: 'pending'
    });

    // At the top of your component, add:
    const [hasError, setHasError] = useState(false);

    // Function to navigate to previous month
    const handlePrevMonth = () => {
        const newMonth = currentMonth.subtract(1, 'month');
        setCurrentMonth(newMonth);
    };

    // Function to get leave count for a date
    const getLeaveCountForDate = (date) => {
        return getLeavesForDate(date).length;
    };

    // Function to handle date click in calendar
    const handleDateClick = (date) => {
        setSelectedLeaveDate(date);
        const leavesOnDate = getLeavesForDate(date);
        setLeaveDetails(leavesOnDate);
    };

    // Function to handle View Leave button click - UPDATED
    const handleViewLeaveClick = () => {
        setViewLeaveDialogOpen(true);
        // Set current month and today's date
        setCurrentMonth(dayjs());

        // Set today as selected date by default
        const today = dayjs();
        setSelectedLeaveDate(today);

        // Fetch leave data
        fetchLeaveData();
        // The useEffect above will automatically update leaveDetails when data arrives
    };

    // Add this useEffect hook near your other useEffect hooks
    useEffect(() => {
        if (selectedLeaveDate && leaveData.length > 0) {
            const leavesOnDate = getLeavesForDate(selectedLeaveDate);
            setLeaveDetails(leavesOnDate);
        }
    }, [selectedLeaveDate, leaveData]); // This will update leaveDetails whenever selectedLeaveDate or leaveData changes

    // Then filter the displayed leaves based on search
    const filteredLeaves = searchEmployee
        ? leaveDetails.filter(leave =>
            (leave.emp_name || '').toLowerCase().includes(searchEmployee.toLowerCase()) ||
            (leave.emp_id || '').toLowerCase().includes(searchEmployee.toLowerCase())
        )
        : leaveDetails;

    // Helper function to generate calendar days - FIXED VERSION for Monday-first week
    const getCalendarDays = (month) => {
        const days = [];
        const startOfMonth = month.startOf('month');
        const endOfMonth = month.endOf('month');

        // Get the day of week for the first day of month (0 = Sunday, 1 = Monday, etc.)
        const startDay = startOfMonth.day(); // Returns 0-6

        // For Monday-first calendar: adjust the offset
        // If startDay is 0 (Sunday), we need 6 days from previous month
        // If startDay is 1 (Monday), we need 0 days from previous month
        // If startDay is 2 (Tuesday), we need 1 day from previous month, etc.
        const mondayOffset = startDay === 0 ? 6 : startDay - 1;



        // Add days from previous month
        for (let i = mondayOffset; i > 0; i--) {
            days.push(startOfMonth.subtract(i, 'day'));
        }

        // Add days of current month
        const daysInMonth = month.daysInMonth();
        for (let i = 0; i < daysInMonth; i++) {
            days.push(startOfMonth.add(i, 'day'));
        }

        // Calculate how many days from next month we need
        // Total grid should have 6 weeks * 7 days = 42 cells
        const totalCells = 42;
        const remainingCells = totalCells - days.length;

        // Add days from next month
        for (let i = 1; i <= remainingCells; i++) {
            days.push(endOfMonth.add(i, 'day'));
        }

        return days;
    };

    // Function to navigate to next month
    const handleNextMonth = () => {
        const newMonth = currentMonth.add(1, 'month');
        setCurrentMonth(newMonth);
        // Note: We're fetching all data at once, so no need to fetch again
    };

    // Add this helper function
    const formatLeaveType = (type) => {
        const typeMap = {
            sick: 'Sick Leave',
            privileged: 'Privileged Leave',
            casual: 'Casual Leave',
            comp_off: 'Comp Off',
            leave_without_pay: 'Leave Without Pay',
            maternity: 'Maternity Leave',
            paternity: 'Paternity Leave'
        };
        return typeMap[type] || type;
    };

    // Add this inside your calendar render section to debug:
    useEffect(() => {
        if (currentMonth && currentMonth.format('MMMM YYYY') === 'December 2025') {
            const days = getCalendarDays(currentMonth);
            console.log('Calendar days for December 2025:');
            days.forEach((day, index) => {
                console.log(`Cell ${index}: ${day.format('ddd YYYY-MM-DD')}`);
            });
        }
    }, [currentMonth]);

    const handleEditLeave = (leave) => {
        setLeaveToEdit(leave);
        setEditLeaveForm({
            leaveType: leave.leave_type || '',
            startDate: dayjs(leave.start_date),
            endDate: dayjs(leave.end_date),
            reason: leave.reason || '',
            contactDuringLeave: leave.contact_during_leave || '',
            halfDay: leave.half_day || false,
            halfDayType: leave.half_day_type || 'first',
            status: leave.status || 'pending'
        });
        setEditLeaveDialogOpen(true);
    };

    // Add function to handle edit form changes
    const handleEditLeaveInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditLeaveForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEditLeaveDateChange = (name, date) => {
        setEditLeaveForm(prev => ({
            ...prev,
            [name]: date
        }));
    };

    const handleSubmitEditLeave = async (e) => {
        e.preventDefault();
        setEditLeaveLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('authToken');

            // Simple payload - no status field
            const payload = {
                leaveType: editLeaveForm.leaveType,
                startDate: editLeaveForm.startDate.format('YYYY-MM-DD'),
                endDate: editLeaveForm.endDate.format('YYYY-MM-DD'),
                reason: editLeaveForm.reason,
                contactDuringLeave: editLeaveForm.contactDuringLeave || null,
                halfDay: editLeaveForm.halfDay || false,
                halfDayType: editLeaveForm.halfDayType || 'first'
            };

            const response = await axios.put(
                `http://localhost:5050/poc/leave/edit/${leaveToEdit.id}`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setSuccess('Leave updated successfully!');
            setTimeout(() => setSuccess(''), 3000);

            fetchLeaveData();
            setEditLeaveDialogOpen(false);
            setLeaveToEdit(null);

        } catch (error) {
            console.error('Error updating leave:', error);
            if (error.response?.data?.error) {
                setError(`Error: ${error.response.data.error}`);
            } else {
                setError('Failed to update leave request');
            }
            setTimeout(() => setError(''), 5000);
        } finally {
            setEditLeaveLoading(false);
        }
    };

    const handleDeleteLeaveClick = (leave) => {
        setLeaveToDelete(leave);
        setDeleteLeaveDialogOpen(true);
    };

    const handleDeleteLeaveConfirm = async () => {
        if (!leaveToDelete) return;

        try {
            setDeleteLeaveLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await axios.delete(`http://localhost:5050/poc/leave/delete/${leaveToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Show success message
            setSuccess('Leave request deleted successfully!');
            setTimeout(() => setSuccess(''), 3000);

            // Refresh leave data
            fetchLeaveData();

            // Close dialogs
            setDeleteLeaveDialogOpen(false);
            setLeaveToDelete(null);

        } catch (error) {
            console.error('Error deleting leave:', error);
            setError('Failed to delete leave request. Please try again.');
            setTimeout(() => setError(''), 3000);
        } finally {
            setDeleteLeaveLoading(false);
        }
    };

    const handleDeleteLeaveCancel = () => {
        setDeleteLeaveDialogOpen(false);
        setLeaveToDelete(null);
    };

    // Update the getLeaveColor function:
    const getLeaveColor = (leaveType) => {
        const colors = {
            sick: '#F44336',
            privileged: '#2196F3',
            casual: '#4CAF50',
            comp_off: '#FF9800',
            leave_without_pay: '#607D8B',
            maternity: '#9C27B0',
            paternity: '#00BCD4'
        };
        return colors[leaveType] || '#9E9E9E';
    };

    // Function to fetch leave data for the calendar - COMPLETE FIX
    const fetchLeaveData = async () => {
        try {
            setLeaveLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await axios.get('http://localhost:5050/poc/leave/requests', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Leave data response:', response.data);
            setLeaveData(response.data || []);

            // If we have a selected date (like today), get leaves for that date
            if (selectedLeaveDate) {
                const leavesOnDate = response.data.filter(leave => {
                    const startDate = dayjs(leave.start_date);
                    const endDate = dayjs(leave.end_date);
                    return selectedLeaveDate.isBetween(startDate, endDate, 'day', '[]');
                });
                setLeaveDetails(leavesOnDate);
            }

        } catch (error) {
            console.error('Error fetching leave data:', error);
            setError('Failed to load leave data');
            setTimeout(() => setError(''), 3000);
            setLeaveData([]);
            setLeaveDetails([]);
        } finally {
            setLeaveLoading(false);
        }
    };


    const [leaveForm, setLeaveForm] = useState({
        leaveType: '',
        startDate: dayjs(),
        endDate: dayjs(),
        reason: '',
        contactDuringLeave: '',
        attachments: [],
        halfDay: false,
        halfDayType: 'first'
    });

    // Replace the current leaveTypes array with this:
    const leaveTypes = [
        { value: 'Sick Leave', label: 'Sick Leave' },
        { value: 'Privileged Leave', label: 'Privileged Leave' },
        { value: 'Casual Leave', label: 'Casual Leave' },
        { value: 'Comp Off', label: 'Comp Off' },
        { value: 'Leave Without Pay', label: 'Leave Without Pay' },
        { value: 'Maternity Leave', label: 'Maternity Leave' },
        { value: 'Paternity Leave', label: 'Paternity Leave' }
    ];


    // Function to get leaves for a specific date
    const getLeavesForDate = (date) => {
        const dateStr = date.format('YYYY-MM-DD');
        return leaveData.filter(leave => {
            const startDate = dayjs(leave.start_date);
            const endDate = dayjs(leave.end_date);
            return date.isBetween(startDate, endDate, 'day', '[]');
        });
    };

    // Add this function to calculate last working day
    const getLastWorkingDay = () => {
        const today = new Date();
        let lastWorkingDay = new Date(today);

        // Go back until we find a weekday (Monday=1 to Friday=5)
        do {
            lastWorkingDay.setDate(lastWorkingDay.getDate() - 1);
        } while (lastWorkingDay.getDay() === 0 || lastWorkingDay.getDay() === 6);

        return lastWorkingDay;
    };


    const handleLeaveInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLeaveForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleLeaveDateChange = (name, date) => {
        setLeaveForm(prev => ({
            ...prev,
            [name]: date
        }));
    };

    const calculateLeaveDays = () => {
        if (!leaveForm.startDate || !leaveForm.endDate) return 0;
        const start = dayjs(leaveForm.startDate);
        const end = dayjs(leaveForm.endDate);
        if (leaveForm.halfDay) return 0.5;
        return Math.abs(end.diff(start, 'day')) + 1;
    };

    const handleSubmitLeave = async (e) => {
        e.preventDefault();
        setLeaveLoading(true);
        setError('');
        setSuccess('');

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

            // Debug: Log token and user
            console.log('Token exists:', !!token);
            console.log('User from props:', user);

            // IMPORTANT: Match exactly with backend expectations
            const payload = {
                leaveType: leaveForm.leaveType,
                startDate: leaveForm.startDate.format('YYYY-MM-DD'),
                endDate: leaveForm.endDate.format('YYYY-MM-DD'),
                days: calculateLeaveDays(),
                reason: leaveForm.reason,
                contactDuringLeave: leaveForm.contactDuringLeave || null, // Match backend: null if empty
                halfDay: leaveForm.halfDay || false, // Default to false
                halfDayType: leaveForm.halfDayType || 'first', // Default to 'first'
                status: 'pending' // Optional, backend has default
            };

            console.log('Sending payload to backend:', JSON.stringify(payload, null, 2));

            const response = await axios.post('http://localhost:5050/poc/leave/apply', payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Backend response:', response.data);

            setSuccess('Leave applied successfully!');
            setTimeout(() => setSuccess(''), 3000);
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
        } catch (error) {
            console.error('Full error object:', error);

            if (error.response) {
                // Server responded with error
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);

                // Show detailed error from backend
                if (error.response.data && error.response.data.error) {
                    setError(`Error: ${error.response.data.error}`);
                } else {
                    setError(`Server error (${error.response.status}): ${error.response.statusText}`);
                }
            } else if (error.request) {
                // Request made but no response
                console.error('No response received:', error.request);
                setError('No response from server. Check if backend is running.');
            } else {
                // Something else
                console.error('Error setting up request:', error.message);
                setError(`Error: ${error.message}`);
            }

            setTimeout(() => setError(''), 5000);
        } finally {
            setLeaveLoading(false);
        }
    };


    const fetchSummaryReportAlternative = async (date = null) => {
        try {
            setSummaryLoading(true);
            const token = localStorage.getItem('authToken');

            // If no date provided, use last working day
            let targetDate;
            if (date) {
                targetDate = date;
            } else {
                const lastWorkingDay = getLastWorkingDay();
                targetDate = lastWorkingDay.toISOString().split('T')[0];
            }

            console.log('Fetching summary report for date:', targetDate);

            // Try the getSummaryReport API endpoint (with /poc prefix)
            try {
                const response = await axios.get(`http://localhost:5050/poc/getSummaryReport?date=${targetDate}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log('Summary report response:', response.data);

                if (response.data && Array.isArray(response.data)) {
                    // Sort data: YES first, then NO, then PARTIAL
                    // Replace the current sorting logic (around line 1300)
                    const sortedData = [...response.data].sort((a, b) => {
                        const statusOrder = { 'YES': 1, 'NO': 2, 'ON LEAVE': 3 };
                        return statusOrder[a.status_update] - statusOrder[b.status_update] ||
                            a.emp_id.localeCompare(b.emp_id);
                    });

                    // Format the hours to HH:MM
                    const formattedData = sortedData.map(emp => {
                        let formattedHours = '0:00';

                        if (emp.total_hrs > 0) {
                            const hours = Math.floor(emp.total_hrs);
                            const minutes = Math.round((emp.total_hrs - hours) * 60);
                            formattedHours = `${hours}:${minutes.toString().padStart(2, '0')}`;
                        }

                        return {
                            emp_id: emp.emp_id,
                            emp_name: emp.emp_name,
                            status_update: emp.status_update || 'NO',
                            total_hrs: formattedHours,
                            raw_hours: emp.total_hrs // Keep original for calculations
                        };
                    });

                    // Find and move 'Total' to the end if it exists
                    const totalIndex = formattedData.findIndex(item => item.emp_id === 'Total');
                    if (totalIndex > -1) {
                        const totalItem = formattedData.splice(totalIndex, 1)[0];
                        formattedData.push(totalItem);
                    }

                    setSummaryData(formattedData);
                    const htmlReport = generateHTMLReport(formattedData, targetDate);
                    setSummaryReport(htmlReport);
                    setSummaryDate(targetDate);
                } else {
                    setSummaryData([]);
                    setSummaryReport('');
                    setSummaryDate(targetDate);
                }

            } catch (firstError) {
                console.log('First endpoint failed, trying alternative:', firstError);

                // Try fallback to the getSummaryReport endpoint without /poc prefix
                try {
                    const response = await axios.get(`http://localhost:5050/poc/getSummaryReport?date=${targetDate}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (response.data && Array.isArray(response.data)) {
                        // Sort data: YES first, then NO, then PARTIAL
                        // Replace the current sorting logic (around line 1300)
                        const sortedData = [...response.data].sort((a, b) => {
                            const statusOrder = { 'YES': 1, 'NO': 2, 'ON LEAVE': 3 };
                            return statusOrder[a.status_update] - statusOrder[b.status_update] ||
                                a.emp_id.localeCompare(b.emp_id);
                        });

                        // Format the hours to HH:MM
                        const formattedData = sortedData.map(emp => {
                            let formattedHours = '0:00';

                            if (emp.total_hrs > 0) {
                                const hours = Math.floor(emp.total_hrs);
                                const minutes = Math.round((emp.total_hrs - hours) * 60);
                                formattedHours = `${hours}:${minutes.toString().padStart(2, '0')}`;
                            }

                            return {
                                emp_id: emp.emp_id,
                                emp_name: emp.emp_name,
                                status_update: emp.status_update || 'NO',
                                total_hrs: formattedHours,
                                raw_hours: emp.total_hrs
                            };
                        });

                        // Find and move 'Total' to the end if it exists
                        const totalIndex = formattedData.findIndex(item => item.emp_id === 'Total');
                        if (totalIndex > -1) {
                            const totalItem = formattedData.splice(totalIndex, 1)[0];
                            formattedData.push(totalItem);
                        }

                        setSummaryData(formattedData);
                        const htmlReport = generateHTMLReport(formattedData, targetDate);
                        setSummaryReport(htmlReport);
                        setSummaryDate(targetDate);
                        return;
                    }
                } catch (secondError) {
                    console.error('Both endpoints failed:', secondError);
                }

                setError('Failed to load summary report. Please try another date.');
                setTimeout(() => setError(''), 5000);
                setSummaryData([]);
                setSummaryReport('');
            }

        } catch (error) {
            console.error('Error fetching summary report:', error);
            setError('Failed to load summary report. Please try another date.');
            setTimeout(() => setError(''), 5000);
            setSummaryData([]);
            setSummaryReport('');
        } finally {
            setSummaryLoading(false);
        }
    };

    // Helper function to generate HTML report
    const generateHTMLReport = (data, date) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return '<p style="text-align: center; color: #666; font-style: italic;">No data available for the selected date.</p>';
        }

        let tableHTML = '<table style="border-collapse: collapse; border: 1px solid black; width: 100%; font-family: Calibri, sans-serif; table-layout: fixed;">';
        tableHTML += '<thead><tr>';
        tableHTML += '<th style="border: 1px solid black; padding: 8px; text-align: center; background-color: #71BFF1; font-size: 11pt; width: 25%;">Employee ID</th>';
        tableHTML += '<th style="border: 1px solid black; padding: 8px; text-align: center; background-color: #71BFF1; font-size: 11pt; width: 25%;">Employee Name</th>';
        tableHTML += '<th style="border: 1px solid black; padding: 8px; text-align: center; background-color: #71BFF1; font-size: 11pt; width: 25%;">Status Update</th>';
        tableHTML += '<th style="border: 1px solid black; padding: 8px; text-align: center; background-color: #71BFF1; font-size: 11pt; width: 25%;">Total Hours</th>';
        tableHTML += '</tr></thead><tbody>';

        data.forEach((row, index) => {
            const isTotal = row.emp_id && row.emp_id.toString().indexOf("Total") > -1;
            const isTeamTotal = row.emp_id === 'Total';

            tableHTML += '<tr style="height: 30px;">';

            // Employee ID
            tableHTML += `<td style="border: 1px solid black; padding: 6px; text-align: left; font-size: ${isTeamTotal ? '11pt' : '10pt'}; ${isTeamTotal ? 'font-weight: bold;' : ''}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${row.emp_id || ''}
        </td>`;

            // Employee Name
            tableHTML += `<td style="border: 1px solid black; padding: 6px; text-align: left; font-size: ${isTeamTotal ? '11pt' : '10pt'}; ${isTeamTotal ? 'font-weight: bold;' : ''}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${row.emp_name || ''}
        </td>`;


            // Update the statusColor mapping (around line 1450)
            const statusColor = row.status_update === 'YES' ? '#70DF08' :
                row.status_update === 'NO' ? '#FF0000' : // Red for NO
                    row.status_update === 'ON LEAVE' ? '#FFA500' : // Orange for leave
                        '#9E9E9E'; // Default gray for other statuses

            // And in the table cell:
            tableHTML += `<td style="border: 1px solid black; padding: 6px; text-align: center; font-size: ${isTeamTotal ? '11pt' : '10pt'}; ${isTeamTotal ? 'font-weight: bold;' : ''}">
            <font color="${statusColor}">${row.status_update || ''}</font>
            </td>`;

            // Total Hours - already in HH:MM format
            tableHTML += `<td style="border: 1px solid black; padding: 6px; text-align: center; font-size: ${isTeamTotal ? '11pt' : '10pt'}; ${isTeamTotal ? 'font-weight: bold;' : ''}">
            ${row.total_hrs || '0:00'}
        </td>`;

            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';

        return tableHTML;
    };

    // Function to handle summary button click
    const handleSummaryClick = () => {
        // Get last working day
        const lastWorkingDay = getLastWorkingDay();
        const lastWorkingDayDate = lastWorkingDay.toISOString().split('T')[0];

        // Set the date and fetch report
        setSummaryDate(lastWorkingDayDate);
        fetchSummaryReportAlternative(lastWorkingDayDate);
        setSummaryDialogOpen(true);
    };






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

    const handleViewStatusClick = async (date = null) => {
        setViewStatusLoading(true);
        try {
            // Use provided date or calculate last working day
            let targetDate;
            if (date) {
                targetDate = date;
            } else {
                const lastWorkingDay = getLastWorkingDay();
                targetDate = lastWorkingDay.toISOString().split('T')[0];
            }


            const token = localStorage.getItem('authToken');

            // API endpoint to get status by date
            const response = await axios.get(`http://localhost:5050/poc/getStatusByDate?date=${targetDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // In the handleViewStatusClick function, update the filtering logic:
            let filteredData = response.data;
            if (!userPermissions.all_status_access && !userPermissions.status_access) {
                // Only show current user's status if they have neither all_status_access nor status_access
                filteredData = filteredData.filter(status =>
                    status.employeeId === user?.emp_id
                );
            }
            // Users with status_access OR all_status_access will see all statuses

            // Transform the data
            const transformedData = filteredData.map(status => ({
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

            setLastWorkingDayStatus(transformedData);
            setLastWorkingDayDate(targetDate);
            setViewStatusDialogOpen(true);

        } catch (error) {
            console.error('Error fetching status:', error);
            setError('Failed to load status');
            setTimeout(() => setError(''), 3000);
            setLastWorkingDayStatus([]);
        } finally {
            setViewStatusLoading(false);
        }
    };

    const handleEditFromDialog = (status) => {
        // Close the dialog first
        setViewStatusDialogOpen(false);

        // Then populate the form for editing
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

        // Scroll to form if on mobile
        if (isMobile) {
            const el = document.getElementById('status-form-section');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }

    };

    const handleDeleteFromDialog = (status) => {
        // Set the status to delete and open delete confirmation dialog
        setStatusToDelete(status);
        setDeleteDialogOpen(true);
        // Close the view status dialog
        setViewStatusDialogOpen(false);
    };

    const handleViewStatusDateChange = (date) => {
        if (date) {
            const formattedDate = date.toISOString().split('T')[0];
            // Call the same function but with the selected date
            handleViewStatusClick(formattedDate);
        }
    };


    useEffect(() => {
        fetchUserPermissions();
        fetchUsecases();
        fetchLeads();
        fetchTodayStatus();
    }, []);

    const fetchUserPermissions = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`http://localhost:5050/poc/permissions/${user?.emp_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserPermissions(response.data || { all_status_access: false });

            // After fetching permissions, fetch leave data
            fetchLeaveData();
        } catch (error) {
            console.error('Error fetching user permissions:', error);
            setUserPermissions({ all_status_access: false });
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
            // No dummy data
            setUsecases([]);
            setError('Failed to load usecases');
            setTimeout(() => setError(''), 3000);
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
            // No dummy data
            setLeads([]);
            setError('Failed to load leads');
            setTimeout(() => setError(''), 3000);
        }
    };

    const fetchTodayStatus = async (date = null) => {
        try {
            const token = localStorage.getItem('authToken');
            const targetDate = date || new Date().toISOString().split('T')[0];

            console.log('Fetching status for date:', targetDate);

            const response = await axios.get(`http://localhost:5050/poc/getStatusByDate?date=${targetDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Status API Response:', response.data);

            if (response.data && Array.isArray(response.data)) {
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
            } else {
                setTodayStatus([]);
            }
        } catch (error) {
            console.error('Error fetching status:', error);
            // Check if it's a 404 error
            if (error.response?.status === 404) {
                console.log('No status data found for this date');
                setTodayStatus([]);
            } else {
                setError('Failed to load status data');
                setTimeout(() => setError(''), 3000);
                setTodayStatus([]);
            }
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
        setStatusLoading(true);
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
            setStatusLoading(false);
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
            const el = document.getElementById('status-form-section');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
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

                // Refresh both tables
                fetchTodayStatus();

                // If view status dialog was open, refresh that data too
                if (viewStatusDialogOpen) {
                    handleViewStatusClick(lastWorkingDayDate);
                }

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



    try {
        return (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                                flex: isMobile ? '0 0 auto' : '1',
                                minHeight: isMobile ? 'auto' : '600px',
                                display: 'flex',
                                flexDirection: 'column' // Add this
                            }}>
                                <Zoom in={true} timeout={800}>
                                    <Paper elevation={isMobile ? 2 : 8} sx={{
                                        p: isMobile ? 2 : 3,
                                        borderRadius: isMobile ? 2 : 3,
                                        height: '100%',
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
                                                    flex: 1 // Takes remaining space
                                                }}>
                                                    {editMode ? '✏️ Update Status' : '🚀 Add Status'}
                                                </Typography>


                                                {/* Add Summary Report button at right corner - FOR USERS WITH ALL_STATUS_ACCESS OR STATUS_ACCESS */}
                                                {(userPermissions.all_status_access || userPermissions.status_access) && (
                                                    <Button
                                                        onClick={handleSummaryClick}
                                                        variant="contained"
                                                        startIcon={<AssignmentIcon />}
                                                        sx={{
                                                            background: 'linear-gradient(135deg, #7083e9ff 0%, #3352dbff 100%)',
                                                            fontWeight: 'bold',
                                                            py: 0.8,
                                                            px: 2,
                                                            borderRadius: 2,
                                                            ml: 1,
                                                            '&:hover': {
                                                                background: 'linear-gradient(135deg, #e57c00 0%, #c2255f 100%)',
                                                            },
                                                            fontSize: isMobile ? '0.8rem' : '0.9rem'
                                                        }}
                                                    >
                                                        {isMobile ? 'Summary' : 'Summary Report'}
                                                    </Button>
                                                )}

                                                {/* Add space only if summary button is shown */}
                                                {userPermissions.all_status_access && ' '} &nbsp;&nbsp;

                                                {/* Add View Status button at right corner */}
                                                <Button
                                                    onClick={() => handleViewStatusClick()}
                                                    variant="contained"
                                                    startIcon={<DescriptionIcon />}
                                                    sx={{
                                                        background: 'linear-gradient(135deg, #7083e9ff 0%, #3352dbff 100%)',
                                                        fontWeight: 'bold',
                                                        py: 0.8,
                                                        px: 2,
                                                        borderRadius: 2,
                                                        ml: 'auto', // This pushes it to the right
                                                        '&:hover': {
                                                            background: 'linear-gradient(135deg, #38d76b 0%, #2ee9c7 100%)',
                                                        },
                                                        fontSize: isMobile ? '0.8rem' : '0.9rem'
                                                    }}
                                                >
                                                    {isMobile ? 'View Status' : 'View Status'}
                                                </Button>
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
                                                        disabled={statusLoading}
                                                        startIcon={statusLoading ? <CircularProgress size={20} /> : (editMode ? <EditIcon /> : <AddIcon />)}
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            fontSize: isMobile ? '0.9rem' : '1rem',
                                                            py: isMobile ? 1 : 1.2,
                                                            borderRadius: 2,
                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                            flex: 1,
                                                            minWidth: 120
                                                        }}
                                                    >
                                                        {statusLoading ? 'Saving...' : (editMode ? 'Update Status' : 'Submit Status')}
                                                    </Button>

                                                    {editMode && (
                                                        <Button
                                                            variant="outlined"
                                                            onClick={resetForm}
                                                            disabled={statusLoading}
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

                            {/* Apply Leave Section */}
                            <Box sx={{
                                flex: isMobile ? '0 0 auto' : '1',
                                minHeight: isMobile ? 'auto' : '600px',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <Slide direction="left" in={true} timeout={800}>
                                    <Paper elevation={isMobile ? 2 : 8} sx={{
                                        p: isMobile ? 2 : 3,
                                        borderRadius: isMobile ? 2 : 3,
                                        height: '100%',
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
                                            background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)'
                                        }
                                    }}>
                                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Box sx={{
                                                    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                                                    borderRadius: 2,
                                                    p: 1,
                                                    mr: 2,
                                                    boxShadow: '0 2px 8px rgba(79,172,254,0.3)'
                                                }}>
                                                    <CalendarMonthIcon sx={{ fontSize: isMobile ? 20 : 24, color: 'white' }} />
                                                </Box>
                                                <Typography variant={isMobile ? "h6" : "h5"} sx={{
                                                    fontWeight: 'bold',
                                                    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                    flex: 1
                                                }}>
                                                    🚀 Apply for Leave
                                                </Typography>

                                                {/* Add View Leave button at right corner */}
                                                <Button
                                                    onClick={handleViewLeaveClick}
                                                    variant="contained"
                                                    startIcon={<VisibilityIcon />}
                                                    sx={{
                                                        background: 'linear-gradient(135deg, #7083e9ff 0%, #3352dbff 100%)',
                                                        fontWeight: 'bold',
                                                        py: 0.8,
                                                        px: 2,
                                                        borderRadius: 2,
                                                        ml: 'auto', // This pushes it to the right
                                                        '&:hover': {
                                                            background: 'linear-gradient(135deg, #38d76b 0%, #2ee9c7 100%)',
                                                        },
                                                        fontSize: isMobile ? '0.8rem' : '0.9rem'
                                                    }}
                                                >
                                                    View Leave
                                                </Button>



                                            </Box>

                                            &nbsp;

                                            <Divider sx={{ mb: 3 }} />

                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <Box
                                                    component="form"
                                                    onSubmit={handleSubmitLeave}
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 2
                                                    }}
                                                >
                                                    {/* Leave Type */}
                                                    <FormControl fullWidth required size="small">
                                                        <InputLabel>Leave Type</InputLabel>
                                                        <Select
                                                            name="leaveType"
                                                            value={leaveForm.leaveType}
                                                            onChange={handleLeaveInputChange}
                                                            label="Leave Type"
                                                        >
                                                            {leaveTypes.map((type) => (
                                                                <MenuItem key={type.value} value={type.value}>
                                                                    {type.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>

                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12} sm={6}>
                                                            <DatePicker
                                                                label="Start Date"
                                                                value={leaveForm.startDate}
                                                                onChange={(date) => handleLeaveDateChange('startDate', date)}
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
                                                                onChange={(date) => handleLeaveDateChange('endDate', date)}
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
                                                            Total Days: {calculateLeaveDays()} {calculateLeaveDays() === 1 ? 'day' : 'days'}
                                                        </Typography>
                                                    </Box>

                                                    {/* Half Day Options */}
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                name="halfDay"
                                                                checked={leaveForm.halfDay}
                                                                onChange={handleLeaveInputChange}
                                                                size="small"
                                                            />
                                                        }
                                                        label="Half Day Leave"
                                                    />

                                                    {leaveForm.halfDay && (
                                                        <FormControl component="fieldset" size="small">
                                                            <FormLabel component="legend">Half Day Type</FormLabel>
                                                            <RadioGroup
                                                                row
                                                                name="halfDayType"
                                                                value={leaveForm.halfDayType}
                                                                onChange={handleLeaveInputChange}
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
                                                        onChange={handleLeaveInputChange}
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
                                                        onChange={handleLeaveInputChange}
                                                        placeholder="Phone number or email"
                                                        size="small"
                                                        variant="outlined"
                                                    />

                                                    <Button
                                                        type="submit"
                                                        variant="contained"
                                                        disabled={leaveLoading} // Change here
                                                        startIcon={leaveLoading ? <CircularProgress size={20} /> : <AddIcon />} // Change here
                                                        sx={{
                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                            fontWeight: 'bold',
                                                            py: 1.2,
                                                            borderRadius: 2,
                                                            height: 50,
                                                            mt: 2,
                                                        }}
                                                    >
                                                        {leaveLoading ? 'Submitting...' : 'Submit Leave Request'}
                                                    </Button>
                                                </Box>
                                            </LocalizationProvider>
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

                    {/* View Status Dialog */}
                    <Dialog
                        open={viewStatusDialogOpen}
                        onClose={() => setViewStatusDialogOpen(false)}
                        maxWidth="lg" // Changed from "md" to "lg" for larger size
                        fullWidth
                        PaperProps={{
                            sx: {
                                borderRadius: 3,
                                maxHeight: '90vh',
                                width: '70%', // Increased from 50% to 70%
                                maxWidth: '70%', // Increased from 50% to 70%
                                minWidth: isMobile ? '95%' : '70%' // Increased minimum width
                            }
                        }}
                    >
                        <DialogTitle sx={{
                            bgcolor: 'info.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 2,
                            pr: 6
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <DescriptionIcon sx={{ mr: 1 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    {userPermissions.all_status_access
                                        ? `Status for ${lastWorkingDayDate}`
                                        : userPermissions.status_access
                                            ? `All Status for ${lastWorkingDayDate}`
                                            : `Your Status for ${lastWorkingDayDate}`
                                    }
                                </Typography>

                                <DatePicker
                                    label="Select Date"
                                    value={lastWorkingDayDate ? dayjs(lastWorkingDayDate) : null}
                                    onChange={(newDate) => {
                                        if (newDate) {
                                            const formattedDate = newDate.format('YYYY-MM-DD');
                                            // Call the view status function with the selected date
                                            handleViewStatusClick(formattedDate);
                                        }
                                    }}
                                    maxDate={dayjs()}
                                    shouldDisableDate={(date) => {
                                        const day = date.day();
                                        return day === 0 || day === 6; // Disable weekends
                                    }}
                                    slotProps={{
                                        textField: {
                                            size: "small",
                                            variant: "outlined",
                                            sx: {
                                                ml: 2,
                                                color: 'white',
                                                borderColor: 'rgba(255,255,255,0.3)',
                                                minWidth: 'auto',
                                                width: '140px',
                                                '& .MuiOutlinedInput-root': {
                                                    borderColor: 'rgba(255,255,255,0.5)',
                                                    '&:hover fieldset': {
                                                        borderColor: 'white',
                                                    },
                                                },
                                                '& .MuiInputBase-input': {
                                                    color: 'white',
                                                    textAlign: 'center'
                                                },
                                                '& .MuiInputLabel-root': {
                                                    color: 'rgba(255,255,255,0.7)',
                                                }
                                            }
                                        }
                                    }}
                                />

                                {/* Today button - ONLY FOR USERS WITH ALL_STATUS_ACCESS */}
                                <Button
                                    size="small"
                                    onClick={() => {
                                        const today = new Date().toISOString().split('T')[0];
                                        handleViewStatusClick(today);
                                    }}
                                    sx={{ ml: 1, color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                                    variant="outlined"
                                >
                                    Today
                                </Button>

                                {/* Last Working Day button - ALWAYS VISIBLE */}
                                <Button
                                    size="small"
                                    onClick={() => {
                                        const lastWorkingDay = getLastWorkingDay();
                                        const formattedDate = lastWorkingDay.toISOString().split('T')[0];
                                        handleViewStatusClick(formattedDate);
                                    }}
                                    sx={{
                                        ml: 1,
                                        color: 'white',
                                        borderColor: 'rgba(255,255,255,0.3)'
                                    }}
                                    variant="outlined"
                                >
                                    Last WD
                                </Button>

                                <IconButton
                                    aria-label="close"
                                    onClick={() => setViewStatusDialogOpen(false)}
                                    sx={{
                                        position: 'absolute',
                                        right: 8,
                                        top: 8,
                                        color: 'white',
                                        zIndex: 1
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>

                            </Box>
                            <Chip
                                label={
                                    userPermissions.all_status_access ? "All Employees (Full Access)" :
                                        userPermissions.status_access ? "All Employees (View Only)" :
                                            "Your Status Only"
                                }
                                color={
                                    userPermissions.all_status_access ? "success" :
                                        userPermissions.status_access ? "warning" :
                                            "primary"
                                }
                                variant="outlined"
                                size="small"
                                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                            />
                        </DialogTitle>

                        <DialogContent dividers sx={{ pt: 3, pb: 2 }}>
                            {viewStatusLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : lastWorkingDayStatus.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        No status entries found
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        No status was recorded for {lastWorkingDayDate}
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer sx={{
                                    borderRadius: 2,
                                    maxHeight: '60vh', // Increased height
                                    overflow: 'auto'
                                }}>
                                    <Table size="small" stickyHeader>
                                        <colgroup>
                                            {(userPermissions.all_status_access || userPermissions.status_access) && (
                                                <col style={{ width: '15%' }} />
                                            )}
                                            <col style={{ width: '20%' }} /> {/* Usecase column */}
                                            <col style={{ width: '10%' }} /> {/* Time column */}
                                            <col style={{
                                                width: (userPermissions.all_status_access || userPermissions.status_access)
                                                    ? '40%'
                                                    : '55%'
                                            }} /> {/* Description column - dynamic width */}
                                            <col style={{ width: '10%' }} /> {/* Actions column */}
                                        </colgroup>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'info.light' }}>
                                                {/* Show Employee column for users with status_access OR all_status_access */}
                                                {(userPermissions.all_status_access || userPermissions.status_access) && (
                                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', py: 1 }}>
                                                        Employee
                                                    </TableCell>
                                                )}
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', py: 1 }}>
                                                    Usecase
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', py: 1 }}>
                                                    Time
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', py: 1 }}>
                                                    Description
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', py: 1 }}>
                                                    Actions
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {lastWorkingDayStatus.map((status) => (
                                                <TableRow key={status.id} hover>
                                                    {/* Show employee info for users with status_access OR all_status_access */}
                                                    {(userPermissions.all_status_access || userPermissions.status_access) && (
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="bold" noWrap>
                                                                {status.employeeName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                                {status.employeeId}
                                                            </Typography>
                                                        </TableCell>
                                                    )}
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="bold" noWrap>
                                                            {status.usecaseName}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="primary" fontWeight="bold">
                                                            {status.workingHours || 0}h {(status.workingMinutes || 0)}m
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title={status.description} arrow placement="top">
                                                            <Typography variant="body2" sx={{
                                                                maxWidth: '100%',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 3,
                                                                WebkitBoxOrient: 'vertical',
                                                                lineHeight: '1.4'
                                                            }}>
                                                                {status.description}
                                                            </Typography>
                                                        </Tooltip>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                            {/* Only show edit/delete for own records OR if user has all access */}
                                                            {(userPermissions.all_status_access || status.employeeId === user?.emp_id) && (
                                                                <>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleEditFromDialog(status)}
                                                                        sx={{
                                                                            bgcolor: 'primary.light',
                                                                            '&:hover': { bgcolor: 'primary.main' },
                                                                        }}
                                                                    >
                                                                        <EditIcon sx={{ color: 'white', fontSize: 14 }} />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleDeleteFromDialog(status)}
                                                                        sx={{
                                                                            bgcolor: 'error.light',
                                                                            '&:hover': { bgcolor: 'error.main' },
                                                                        }}
                                                                    >
                                                                        <DeleteIcon sx={{ color: 'white', fontSize: 14 }} />
                                                                    </IconButton>
                                                                </>
                                                            )}
                                                            {/* Show read-only message only for users with no access at all */}
                                                            {!userPermissions.all_status_access &&
                                                                !userPermissions.status_access &&
                                                                status.employeeId !== user?.emp_id && (
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
                        </DialogContent>

                        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>

                            {/* View Today's Status button - AVAILABLE FOR ALL USERS */}
                            <Button
                                onClick={() => {
                                    // Fetch and show today's status in the same dialog
                                    const today = new Date().toISOString().split('T')[0];
                                    handleViewStatusClick(today);
                                }}
                                variant="contained"
                                color="primary"
                            >
                                View Today's Status
                            </Button>

                            {/* Last Working Day button - AVAILABLE FOR ALL USERS */}
                            <Button
                                onClick={() => {
                                    const lastWorkingDay = getLastWorkingDay();
                                    const formattedDate = lastWorkingDay.toISOString().split('T')[0];
                                    handleViewStatusClick(formattedDate);
                                }}
                                variant="outlined"
                                color="secondary"
                            >
                                Last Working Day
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Summary Report Dialog */}
                    <Dialog
                        open={summaryDialogOpen}
                        onClose={() => setSummaryDialogOpen(false)}
                        maxWidth="md" // Changed from "lg" to "md"
                        fullWidth
                        PaperProps={{
                            sx: {
                                borderRadius: 3,
                                maxHeight: '90vh',
                                width: '65%', // Reduced from 80% to 65% (35% reduction)
                                maxWidth: '65%', // Reduced from 80% to 65%
                                minWidth: isMobile ? '95%' : '65%', // Reduced from 80% to 65%
                                position: 'relative'
                            }
                        }}
                    >
                        {/* Close Icon at top right */}
                        <IconButton
                            aria-label="close"
                            onClick={() => setSummaryDialogOpen(false)}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                color: 'white',
                                zIndex: 1
                            }}
                        >
                            <CloseIcon /> {/* You need to import CloseIcon */}
                        </IconButton>

                        <DialogTitle sx={{
                            bgcolor: '#1565C0',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 2,
                            pr: 6 // Add right padding for close icon
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                <AssignmentIcon sx={{ mr: 1 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Daily Status Summary Report
                                </Typography>

                                <DatePicker
                                    value={summaryDate ? dayjs(summaryDate) : null} // Convert string to dayjs
                                    onChange={(date) => {
                                        if (date) {
                                            const formattedDate = date.format('YYYY-MM-DD');
                                            setSummaryDate(formattedDate);
                                            fetchSummaryReportAlternative(formattedDate);
                                        }
                                    }}
                                    maxDate={dayjs()}
                                    shouldDisableDate={(date) => {
                                        const day = date.day();
                                        return day === 0 || day === 6; // Disable weekends
                                    }} Props={{
                                        textField: {
                                            size: "small",
                                            variant: "outlined",
                                            sx: {
                                                ml: 2,
                                                color: 'white',
                                                borderColor: 'rgba(255,255,255,0.3)',
                                                minWidth: 'auto'
                                            }
                                        }
                                    }}
                                />

                                {/* Quick navigation buttons */}
                                <Button
                                    size="small"
                                    onClick={() => {
                                        const lastWorkingDay = getLastWorkingDay();
                                        const formattedDate = lastWorkingDay.toISOString().split('T')[0];
                                        setSummaryDate(formattedDate);
                                        fetchSummaryReportAlternative(formattedDate);
                                    }}
                                    sx={{ ml: 1, color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                                    variant="outlined"
                                >
                                    Last WD
                                </Button>
                            </Box>
                            {summaryData.length > 0 && (
                                <Chip
                                    label={`${summaryData.filter(item => item.emp_id !== 'Total').length} Employees`}
                                    color="warning"
                                    variant="outlined"
                                    size="small"
                                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                                />
                            )}
                        </DialogTitle>

                        <DialogContent dividers sx={{ pt: 3, pb: 2 }}>
                            {summaryLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : summaryData.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        No data found for {summaryDate}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Either no employees are registered or no one submitted status for this date.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            const lastWorkingDay = getLastWorkingDay();
                                            const formattedDate = lastWorkingDay.toISOString().split('T')[0];
                                            setSummaryDate(formattedDate);
                                            fetchSummaryReportAlternative(formattedDate);
                                        }}
                                    >
                                        Load Last Working Day
                                    </Button>
                                </Box>
                            ) : (
                                <Box sx={{ width: '100%' }}>
                                    {/* Summary Stats */}
                                    {summaryData.find(item => item.emp_id === 'Total') && (
                                        <Box sx={{
                                            mb: 2,
                                            p: 2,
                                            bgcolor: 'info.light',
                                            borderRadius: 2,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: 1
                                        }}>
                                            <Typography variant="subtitle2" fontWeight="bold" color="white">
                                                Report for: {summaryDate}
                                            </Typography>

                                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                <Typography variant="subtitle2" fontWeight="bold" color="white">
                                                    Employees: {summaryData.filter(item => item.emp_id !== 'Total').length}
                                                </Typography>
                                                <Typography variant="subtitle2" fontWeight="bold" color="white">
                                                    Submitted: {summaryData.filter(item => item.status_update === 'YES' && item.emp_id !== 'Total').length}
                                                </Typography>
                                                <Typography variant="subtitle2" fontWeight="bold" color="white">
                                                    Not Submitted: {summaryData.filter(item => item.status_update === 'NO' && item.emp_id !== 'Total').length}
                                                </Typography>
                                                <Typography variant="subtitle2" fontWeight="bold" color="white">
                                                    On Leave: {summaryData.filter(item => item.status_update === 'ON LEAVE' && item.emp_id !== 'Total').length}
                                                </Typography>
                                                <Typography variant="subtitle2" fontWeight="bold" color="white">
                                                    Total Hours: {summaryData.find(item => item.emp_id === 'Total')?.total_hrs || '0:00'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}

                                    {/* HTML Table Preview - ONLY TABLE */}
                                    <Box sx={{
                                        overflow: 'auto',
                                        maxHeight: '60vh',
                                        border: '1px solid #ddd',
                                        borderRadius: 1,
                                        '& table': {
                                            width: '100% !important',
                                            minWidth: '100% !important',
                                            tableLayout: 'fixed' // Fixed layout for better control
                                        },
                                        '& th': {
                                            width: '25% !important', // Equal width for 4 columns
                                            minWidth: '25% !important',
                                            maxWidth: '25% !important'
                                        },
                                        '& td': {
                                            width: '25% !important', // Equal width for 4 columns
                                            minWidth: '25% !important',
                                            maxWidth: '25% !important',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }
                                    }}>
                                        <div dangerouslySetInnerHTML={{ __html: summaryReport }} />
                                    </Box>
                                </Box>
                            )}
                        </DialogContent>

                        {/* REMOVE ENTIRE DialogActions section */}
                    </Dialog>

                    {/* View Leave Dialog */}
                    <Dialog
                        open={viewLeaveDialogOpen}
                        onClose={() => setViewLeaveDialogOpen(false)}
                        maxWidth="lg"
                        fullWidth
                        PaperProps={{
                            sx: {
                                borderRadius: 3,
                                maxHeight: '90vh',
                                width: '90%',
                                maxWidth: '90%',
                                minWidth: isMobile ? '95%' : '90%'
                            }
                        }}
                    >
                        <DialogTitle sx={{
                            bgcolor: '#0737d4c0',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 2
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <CalendarMonthIcon sx={{ mr: 1 }} />
                                <Typography variant="h5" fontWeight="bold">
                                    Leave Calendar
                                </Typography>
                                <Chip
                                    label={
                                        userPermissions.all_status_access ? "All Employees (Full Access)" :
                                            userPermissions.status_access ? "All Employees (View Only)" :
                                                "Your Leaves Only"
                                    }
                                    color={
                                        userPermissions.all_status_access ? "warning" :
                                            userPermissions.status_access ? "info" :
                                                "primary"
                                    }
                                    variant="outlined"
                                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                                />
                            </Box>
                            <IconButton
                                aria-label="close"
                                onClick={() => setViewLeaveDialogOpen(false)}
                                sx={{ color: 'white' }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>

                        <DialogContent dividers sx={{ pt: 3, pb: 2 }}>
                            {leaveLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' }, // Column on mobile, row on desktop
                                    gap: 3,
                                    height: '100%',
                                    minHeight: '400px'
                                }}>
                                    {/* Calendar Section - Left Side */}
                                    <Box sx={{
                                        flex: { xs: '0 0 auto', md: '0 0 35%' }, // Fixed width on desktop, auto on mobile
                                        maxWidth: { xs: '100%', md: '35%' }
                                    }}>
                                        <Paper elevation={3} sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            height: '400px',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                mb: 2,
                                                flexShrink: 0
                                            }}>
                                                <Button
                                                    onClick={handlePrevMonth}
                                                    startIcon={<ArrowBackIosIcon />}
                                                    size="small"
                                                >
                                                    Prev
                                                </Button>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="h6" fontWeight="bold">
                                                        {currentMonth.format('MMMM YYYY')}
                                                    </Typography>
                                                </Box>

                                                <Button
                                                    onClick={handleNextMonth}
                                                    endIcon={<ArrowForwardIosIcon />}
                                                    size="small"
                                                >
                                                    Next
                                                </Button>
                                            </Box>

                                            <Box sx={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(7, 1fr)',
                                                gap: 1,
                                                mb: 1,
                                                flexShrink: 0
                                            }}>
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                                    <Box
                                                        key={day}
                                                        sx={{
                                                            textAlign: 'center',
                                                            py: 0.5
                                                        }}
                                                    >
                                                        <Typography variant="body2" fontWeight="bold" color="primary">
                                                            {day}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>

                                            {/* Calendar Grid */}
                                            <Box sx={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(7, 1fr)',
                                                gap: 1.5,
                                                mb: 3, // Changed from 1 to 3 for more vertical space
                                                flexShrink: 0
                                            }}>
                                                {getCalendarDays(currentMonth).map((date, index) => {
                                                    const isCurrentMonth = date.month() === currentMonth.month();
                                                    const isToday = date.isSame(dayjs(), 'day');
                                                    const leaveCount = getLeaveCountForDate(date);

                                                    return (
                                                        <Box
                                                            key={index}
                                                            sx={{
                                                                textAlign: 'center',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <Badge
                                                                badgeContent={leaveCount}
                                                                color="error"
                                                                invisible={leaveCount === 0}
                                                                sx={{
                                                                    '& .MuiBadge-badge': {
                                                                        fontSize: '0.6rem',
                                                                        height: '16px',
                                                                        minWidth: '16px'
                                                                    }
                                                                }}
                                                            >
                                                                <Button
                                                                    variant={date.isSame(selectedLeaveDate, 'day') ? "contained" : "outlined"}
                                                                    size="small"
                                                                    onClick={() => handleDateClick(date)}
                                                                    sx={{
                                                                        width: '36px',
                                                                        height: '36px',
                                                                        minWidth: '36px',
                                                                        minHeight: '36px',
                                                                        padding: 0,
                                                                        borderRadius: '50%',
                                                                        bgcolor: isToday ? 'rgb(71, 236, 134)' :
                                                                            (leaveCount > 0 ? '#ffebee' : 'transparent'), 
                                                                        color: isCurrentMonth ? 'text.primary' : 'text.disabled',
                                                                        borderColor: isToday ? 'primary.main' : 'grey.300',
                                                                        borderWidth: isToday ? 2 : 1,
                                                                        '&:hover': {
                                                                            bgcolor: leaveCount > 0 ? '#ffcdd2' : '#f5f5f5'
                                                                        }
                                                                    }}
                                                                >
                                                                    <Typography variant="body2" fontWeight={isToday ? 'bold' : 'normal'}>
                                                                        {date.date()}
                                                                    </Typography>
                                                                </Button>
                                                            </Badge>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </Paper>
                                    </Box>

                                    {/* Leave Details Section - Right Side */}
                                    <Box sx={{
                                        flex: { xs: '0 0 auto', md: '0 0 65%' }, // Fixed width on desktop
                                        maxWidth: { xs: '100%', md: '65%' }
                                    }}>
                                        <Paper elevation={3} sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            height: '400px',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                mb: 2,
                                                flexShrink: 0
                                            }}>
                                                <Typography variant="h6" fontWeight="bold" color="primary">
                                                    {selectedLeaveDate ? `Leaves on ${selectedLeaveDate.format('MMMM D, YYYY')}` : 'Select a date'}
                                                </Typography>
                                                {userPermissions.all_status_access && (
                                                    <Chip
                                                        label={`${leaveDetails.length} leaves`}
                                                        color="info"
                                                        size="small"
                                                    />
                                                )}
                                            </Box>

                                            {/* Scrollable leave cards container */}
                                            <Box sx={{
                                                flex: 1,
                                                overflowY: 'auto',
                                                overflowX: 'hidden',
                                                pr: 1
                                            }}>
                                                {selectedLeaveDate ? (
                                                    leaveDetails.length > 0 ? (
                                                        <Box sx={{
                                                            display: 'grid',
                                                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                                                            gap: 2,
                                                            width: '100%'
                                                        }}>
                                                            {leaveDetails.map((leave, index) => (
                                                                <Card
                                                                    key={index}
                                                                    sx={{
                                                                        borderLeft: 4,
                                                                        borderColor: getLeaveColor(leave.leave_type),
                                                                        height: 'fit-content',
                                                                        display: 'flex',
                                                                        flexDirection: 'column'
                                                                    }}
                                                                >
                                                                    <CardContent sx={{ p: 2, flex: 1 }}>
                                                                        {/* In the leave cards, show employee name for both all_status_access AND status_access users: */}
                                                                        {(userPermissions.all_status_access || userPermissions.status_access) && (
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                                                <PersonIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                                                <Typography variant="subtitle2" fontWeight="bold" noWrap>
                                                                                    {leave.emp_name || leave.employee_name || 'Unknown'}
                                                                                </Typography>
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    sx={{
                                                                                        ml: 1,
                                                                                        bgcolor: 'grey.100',
                                                                                        px: 1,
                                                                                        borderRadius: 1,
                                                                                        whiteSpace: 'nowrap'
                                                                                    }}
                                                                                >
                                                                                    {leave.emp_id || leave.employee_id}
                                                                                </Typography>
                                                                            </Box>
                                                                        )}

                                                                        <Typography variant="body1" fontWeight="bold" color="primary" noWrap>
                                                                            {leave.leave_type?.charAt(0).toUpperCase() + leave.leave_type?.slice(1).replace(/_/g, ' ') || 'Unknown'} Leave
                                                                        </Typography>

                                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap>
                                                                            {dayjs(leave.start_date).format('MMM D')} - {dayjs(leave.end_date).format('MMM D, YYYY')}
                                                                            {leave.half_day && ` (Half Day: ${leave.half_day_type === 'first' ? 'First Half' : 'Second Half'})`}
                                                                        </Typography>

                                                                        {/* Reason with fixed height and scroll */}
                                                                        <Box sx={{
                                                                            mt: 1,
                                                                            maxHeight: '60px',
                                                                            overflowY: 'auto',
                                                                            border: '1px solid #eee',
                                                                            borderRadius: 1,
                                                                            p: 1,
                                                                            bgcolor: '#fafafa'
                                                                        }}>
                                                                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                                                "{leave.reason}"
                                                                            </Typography>
                                                                        </Box>

                                                                        {leave.contact_during_leave && (
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                                                <PhoneIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                                                    Contact: {leave.contact_during_leave}
                                                                                </Typography>
                                                                            </Box>
                                                                        )}


                                                                        <Box sx={{
                                                                            display: 'flex',
                                                                            justifyContent: 'flex-end',
                                                                            gap: 1,
                                                                            mt: 2,
                                                                            pt: 1,
                                                                            borderTop: '1px solid #f0f0f0'
                                                                        }}>
                                                                            {/* Show edit/revoke for:
                                                                                1. Own leaves (leave.emp_id === user?.emp_id)
                                                                                2. Users with all_status_access
                                                                                3. NOT for status_access users viewing others' leaves
                                                                            */}
                                                                            {(userPermissions.all_status_access || leave.emp_id === user?.emp_id) && (
                                                                                <>
                                                                                    <Button
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                        color="primary"
                                                                                        startIcon={<EditIcon fontSize="small" />}
                                                                                        onClick={() => handleEditLeave(leave)}
                                                                                        sx={{ fontSize: '0.75rem', py: 0.5 }}
                                                                                    >
                                                                                        Edit
                                                                                    </Button>

                                                                                    <Button
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                        color="error"
                                                                                        startIcon={<DeleteIcon fontSize="small" />}
                                                                                        onClick={() => handleRevokeLeaveClick(leave)}
                                                                                        sx={{ fontSize: '0.75rem', py: 0.5 }}
                                                                                    >
                                                                                        Revoke Leave
                                                                                    </Button>
                                                                                </>
                                                                            )}

                                                                            {/* Show view-only message for status_access users viewing others' leaves */}
                                                                            {userPermissions.status_access &&
                                                                                !userPermissions.all_status_access &&
                                                                                leave.emp_id !== user?.emp_id && (
                                                                                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                                                                        View Only
                                                                                    </Typography>
                                                                                )}
                                                                        </Box>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </Box>
                                                    ) : (
                                                        <Box sx={{
                                                            textAlign: 'center',
                                                            py: 4,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            height: '100%'
                                                        }}>
                                                            {selectedLeaveDate.isSame(dayjs(), 'day') ? (
                                                                <TodayIcon sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
                                                            ) : (
                                                                <EventAvailableIcon sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
                                                            )}
                                                            <Typography variant="body1" color="text.secondary">
                                                                {(userPermissions.all_status_access || userPermissions.status_access)
                                                                    ? `No leaves scheduled for ${selectedLeaveDate.format('MMMM D, YYYY')}`
                                                                    : `You have no leaves scheduled for ${selectedLeaveDate.format('MMMM D, YYYY')}`
                                                                }
                                                            </Typography>
                                                            {selectedLeaveDate.isSame(dayjs(), 'day') && (
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                                                    {userPermissions.all_status_access
                                                                        ? 'No employees are on leave today'
                                                                        : 'You are not on leave today'
                                                                    }
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    )
                                                ) : (
                                                    <Box sx={{
                                                        textAlign: 'center',
                                                        py: 4,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        height: '100%'
                                                    }}>
                                                        <EventBusyIcon sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
                                                        <Typography variant="body1" color="text.secondary">
                                                            Select a date to view leave details
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Paper>
                                    </Box>
                                </Box>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Revoke Leave Confirmation Dialog with Message */}
                    <Dialog
                        open={revokeLeaveDialogOpen}
                        onClose={handleRevokeLeaveCancel}
                        maxWidth="sm"
                        fullWidth
                    >
                        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <WarningIcon sx={{ mr: 1 }} />
                                Revoke Leave Request
                            </Box>
                        </DialogTitle>

                        <DialogContent sx={{ pt: 2 }}>
                            <Typography variant="body1" gutterBottom>
                                Are you sure you want to revoke this leave request?
                            </Typography>

                            {leaveToRevoke && (
                                <Box sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: 'grey.50',
                                    borderRadius: 1,
                                    borderLeft: 4,
                                    borderColor: getLeaveColor(leaveToRevoke.leave_type)
                                }}>
                                    <Typography variant="body2" fontWeight="bold">
                                        {leaveToRevoke.leave_type?.charAt(0).toUpperCase() + leaveToRevoke.leave_type?.slice(1).replace(/_/g, ' ')} Leave
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {dayjs(leaveToRevoke.start_date).format('MMM D')} - {dayjs(leaveToRevoke.end_date).format('MMM D, YYYY')}
                                        {leaveToRevoke.half_day && ` (Half Day: ${leaveToRevoke.half_day_type === 'first' ? 'First Half' : 'Second Half'})`}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                        Reason: {leaveToRevoke.reason?.substring(0, 100)}...
                                    </Typography>
                                </Box>
                            )}

                            {/* Message Box (Optional) */}
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Add a message (optional):
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Enter reason for revoking this leave..."
                                    value={revokeMessage}
                                    onChange={(e) => setRevokeMessage(e.target.value)}
                                    size="small"
                                    variant="outlined"
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    This message will be sent to the backend for logging purposes.
                                </Typography>
                            </Box>
                        </DialogContent>

                        <DialogActions sx={{ p: 2, pt: 0 }}>
                            <Button
                                onClick={handleRevokeLeaveCancel}
                                disabled={revokeLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmitRevokeLeave}
                                color="error"
                                variant="contained"
                                disabled={revokeLoading}
                                startIcon={revokeLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
                            >
                                {revokeLoading ? 'Revoking...' : 'Revoke Leave'}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Edit Leave Dialog - REMOVE status field entirely */}
                    <Dialog
                        open={editLeaveDialogOpen}
                        onClose={() => setEditLeaveDialogOpen(false)}
                        maxWidth="sm"
                        fullWidth
                    >
                        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
                            Edit Leave Request
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ pt: 2 }}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <Box component="form" onSubmit={handleSubmitEditLeave}>
                                        {/* Leave Type */}
                                        <FormControl fullWidth required size="small" sx={{ mb: 2 }}>
                                            <InputLabel>Leave Type</InputLabel>
                                            <Select
                                                name="leaveType"
                                                value={editLeaveForm.leaveType}
                                                onChange={handleEditLeaveInputChange}
                                                label="Leave Type"
                                            >
                                                {leaveTypes.map((type) => (
                                                    <MenuItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {/* Dates */}
                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            <Grid item xs={12} sm={6}>
                                                <DatePicker
                                                    label="Start Date"
                                                    value={editLeaveForm.startDate}
                                                    onChange={(date) => handleEditLeaveDateChange('startDate', date)}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            size: 'small',
                                                            required: true,
                                                            variant: 'outlined'
                                                        }
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <DatePicker
                                                    label="End Date"
                                                    value={editLeaveForm.endDate}
                                                    onChange={(date) => handleEditLeaveDateChange('endDate', date)}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            size: 'small',
                                                            required: true,
                                                            variant: 'outlined'
                                                        }
                                                    }}
                                                    minDate={editLeaveForm.startDate}
                                                />
                                            </Grid>
                                        </Grid>

                                        {/* Half Day Options */}
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    name="halfDay"
                                                    checked={editLeaveForm.halfDay}
                                                    onChange={handleEditLeaveInputChange}
                                                    size="small"
                                                />
                                            }
                                            label="Half Day Leave"
                                            sx={{ mb: 1 }}
                                        />

                                        {editLeaveForm.halfDay && (
                                            <FormControl component="fieldset" size="small" sx={{ mb: 2 }}>
                                                <FormLabel component="legend">Half Day Type</FormLabel>
                                                <RadioGroup
                                                    row
                                                    name="halfDayType"
                                                    value={editLeaveForm.halfDayType}
                                                    onChange={handleEditLeaveInputChange}
                                                    sx={{ justifyContent: 'center' }}
                                                >
                                                    <FormControlLabel
                                                        value="first"
                                                        control={<Radio size="small" />}
                                                        label="First Half"
                                                    />
                                                    <FormControlLabel
                                                        value="second"
                                                        control={<Radio size="small" />}
                                                        label="Second Half"
                                                    />
                                                </RadioGroup>
                                            </FormControl>
                                        )}

                                        {/* REMOVED STATUS FIELD - No approve/reject option */}

                                        {/* Reason */}
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="Reason for Leave *"
                                            name="reason"
                                            value={editLeaveForm.reason}
                                            onChange={handleEditLeaveInputChange}
                                            required
                                            size="small"
                                            variant="outlined"
                                            sx={{ mb: 2 }}
                                        />

                                        {/* Contact Information */}
                                        <TextField
                                            fullWidth
                                            label="Contact During Leave"
                                            name="contactDuringLeave"
                                            value={editLeaveForm.contactDuringLeave}
                                            onChange={handleEditLeaveInputChange}
                                            placeholder="Phone number or email"
                                            size="small"
                                            variant="outlined"
                                            sx={{ mb: 3 }}
                                        />
                                    </Box>
                                </LocalizationProvider>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={() => setEditLeaveDialogOpen(false)}
                                disabled={editLeaveLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmitEditLeave}
                                variant="contained"
                                disabled={editLeaveLoading}
                                startIcon={editLeaveLoading ? <CircularProgress size={20} /> : null}
                            >
                                {editLeaveLoading ? 'Updating...' : 'Update Leave'}
                            </Button>
                        </DialogActions>
                    </Dialog>



                </Box >
            </LocalizationProvider>
        );
    } catch (error) {
        console.error('Component rendering error:', error);
        // Set error state and return error UI
        useEffect(() => {
            setHasError(true);
        }, []);
        return null;
    }
};


export default StatusComponent;