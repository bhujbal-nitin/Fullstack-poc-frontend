import React, { useState, useEffect } from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Button,
    Divider,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Badge,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Select,
    FormControl,
    Checkbox,
    FormControlLabel,
    InputLabel,
    CircularProgress,
    Grid,
    TablePagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    InputAdornment,

} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Analytics as AnalyticsIcon,
    AdminPanelSettings as AdminIcon,
    Notifications as NotificationsIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Search as SearchIcon,
    ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material';

const Admin = ({ onNavigate, onLogout, user }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('PCS ROW'); // 'PCS ROW', 'sales', 'all
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [statusFilter, setStatusFilter] = useState('Active'); // 'Active', 'Inactive', 'all'

    const [searchQuery, setSearchQuery] = useState('');

    // Add to your existing state declarations
    const [openPermissionDialog, setOpenPermissionDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [permissionData, setPermissionData] = useState({
        // POC Module Permissions
        status_access: false,            // View and update POC status
        report_access: false,       // Access POC reports
        usecase_creation_access: false,      // Create new use cases
        all_status_access: false,    // View all POC members statuses
        sales_access: false,       // Initiate usecase
        sales_admin: false,         // View all sales usecases of members

        // Sales Module Permissions
        status_status_access: false,
        sales_dashboard_access: false,
        all_sales_access: false,

    });

    // Add these to your existing state declarations
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        emp_id: '',
        emp_name: '',
        email_id: '',
        status: 'Active',
        department_name: '',
        role: 'Employee',
        password: ''
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleSettingsClick = () => {
        onNavigate('admin-settings');
        handleMenuClose();
    };

    const handleProfileClick = () => {
        onNavigate('admin-profile');
        handleMenuClose();
    };

    // Fetch users from API
    // Update your fetchUsers function
    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API}/poc/admin/getAllUsers`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                handleAutoLogout();
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();

            // Ensure data is an array and has proper structure
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format received from server');
            }

            // Clean up data - ensure all users have required properties
            const cleanedData = data.map(user => ({
                emp_id: user.emp_id || '',
                emp_name: user.emp_name || '',
                email_id: user.email_id || '',
                status: user.status || 'Active',
                department_name: user.department_name || '',
                role: user.role || 'Employee'
            }));

            setUsers(cleanedData);
            setFilteredUsers(cleanedData);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users. Please try again.');
            setUsers([]);
            setFilteredUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        onLogout();
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        let filtered = users;

        // Apply search filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(user => {
                // Check if user object exists
                if (!user) return false;

                // Check each property safely
                return (
                    (user.emp_id && user.emp_id.toLowerCase().includes(query)) ||
                    (user.emp_name && user.emp_name.toLowerCase().includes(query)) ||
                    (user.email_id && user.email_id.toLowerCase().includes(query)) ||
                    (user.department_name && user.department_name.toLowerCase().includes(query)) ||
                    (user.role && user.role.toLowerCase().includes(query))
                );
            });
        }

        // Apply department filter
        if (departmentFilter !== 'all') {
            filtered = filtered.filter(user =>
                user && user.department_name === departmentFilter
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(user =>
                user && user.status === statusFilter
            );
        }

        setFilteredUsers(filtered);
        setPage(0);
    }, [searchQuery, departmentFilter, statusFilter, users]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Function to handle user status change
    const handleStatusChange = async (empId, newStatus) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API}/poc/admin/updateUserStatus`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    emp_id: empId,
                    status: newStatus
                })
            });

            if (response.ok) {
                // Update local state immediately for better UX
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user.emp_id === empId ? { ...user, status: newStatus } : user
                    )
                );

                setSnackbar({
                    open: true,
                    message: `User status updated to ${newStatus}`,
                    severity: 'success'
                });

                // Refresh data to ensure sync with server
                fetchUsers();
            } else {
                throw new Error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating user status:', error);
            setSnackbar({
                open: true,
                message: 'Failed to update user status. Please try again.',
                severity: 'error'
            });

            // Revert the change in UI
            fetchUsers();
        }
    };

    // Dialog Functions
    const handleOpenAddDialog = () => {
        setEditingUser(null);
        setFormData({
            emp_id: '',
            emp_name: '',
            email_id: '',
            status: 'Active',
            department_name: '',
            role: 'Employee',
            password: ''
        });
        setOpenDialog(true);
    };

    const handleOpenEditDialog = (user) => {
        setEditingUser(user);
        setFormData({
            emp_id: user.emp_id,
            emp_name: user.emp_name,
            email_id: user.email_id,
            status: user.status || 'Active',
            department_name: user.department_name || '',
            role: user.role || 'Employee',
            password: '' // Don't show password in edit
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingUser(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitUser = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const endpoint = editingUser
                ? `${import.meta.env.VITE_API}/poc/admin/updateUser`
                : `${import.meta.env.VITE_API}/poc/admin/createUser`;

            const method = editingUser ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to save user');
            }

            const result = await response.json();

            setSnackbar({
                open: true,
                message: editingUser ? 'User updated successfully!' : 'User created successfully!',
                severity: 'success'
            });

            handleCloseDialog();
            fetchUsers(); // Refresh the user list
        } catch (error) {
            console.error('Error saving user:', error);
            setSnackbar({
                open: true,
                message: 'Failed to save user. Please try again.',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };


    // Add these functions after your existing functions
    const handleOpenPermissionDialog = async (user) => {
        setSelectedUser(user);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API}/poc/admin/getUserPermissions/${user.emp_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPermissionData({
                    // POC Module Permissions
                    status_access: data.status_access || false,
                    report_access: data.report_access || false,
                    usecase_creation_access: data.usecase_creation_access || false,
                    all_status_access: data.all_status_access || false,
                    sales_access: data.sales_access || false,
                    sales_admin: data.sales_admin || false,

                    // Sales Module Permissions
                    status_status_access: data.status_status_access || false,
                    sales_dashboard_access: data.sales_dashboard_access || false,
                    all_sales_access: data.all_sales_access || false,
                });
            } else {
                // Initialize with defaults if no permissions found
                setPermissionData({
                    status_access: false,
                    report_access: false,
                    usecase_creation_access: false,
                    all_status_access: false,
                    sales_access: false,
                    sales_admin: false,
                    status_status_access: false,
                    sales_dashboard_access: false,
                    all_sales_access: false,
                });
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
            // Initialize with defaults
            setPermissionData({
                status_access: false,
                report_access: false,
                usecase_creation_access: false,
                all_status_access: false,
                sales_access: false,
                sales_admin: false,
                status_status_access: false,
                sales_dashboard_access: false,
                all_sales_access: false,
            });
        }
        setOpenPermissionDialog(true);
    };

    const handleClosePermissionDialog = () => {
        setOpenPermissionDialog(false);
        setSelectedUser(null);
    };

    const handlePermissionChange = (field) => (e) => {
        setPermissionData(prev => ({
            ...prev,
            [field]: e.target.checked
        }));
    };

    const handleSavePermissions = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API}/poc/admin/updateUserPermissions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    emp_id: selectedUser.emp_id,
                    // POC Module Permissions
                    status_access: permissionData.status_access,
                    report_access: permissionData.report_access,
                    usecase_creation_access: permissionData.usecase_creation_access,
                    all_status_access: permissionData.all_status_access,
                    sales_access: permissionData.sales_access,
                    sales_admin: permissionData.sales_admin,

                    // Sales Module Permissions
                    status_status_access: permissionData.status_status_access,
                    sales_dashboard_access: permissionData.sales_dashboard_access,
                    all_sales_access: permissionData.all_sales_access,
                })
            });

            if (response.ok) {
                setSnackbar({
                    open: true,
                    message: 'Permissions updated successfully!',
                    severity: 'success'
                });
                handleClosePermissionDialog();
            } else {
                throw new Error('Failed to update permissions');
            }
        } catch (error) {
            console.error('Error updating permissions:', error);
            setSnackbar({
                open: true,
                message: 'Failed to update permissions. Please try again.',
                severity: 'error'
            });
        }
    };

    return (
        <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f8fafc' }}>
            <AppBar
                position="static"
                elevation={2}
                sx={{
                    bgcolor: 'primary.main',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
            >
                <Toolbar>
                    <Button
                        color="inherit"
                        onClick={() => onNavigate('dashboard')}
                        startIcon={<DashboardIcon />}
                        sx={{
                            mr: 2,
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.15)'
                            }
                        }}
                    >
                        Dashboard
                    </Button>

                    <AdminIcon sx={{ mr: 2, fontSize: 32 }} />

                    <Typography
                        variant="h5"
                        component="h1"
                        color="inherit"
                        sx={{
                            flexGrow: 1,
                            fontWeight: 'bold',
                            fontFamily: 'Arial, sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        🛡️ Admin Access Control Panel
                        <Chip
                            label="ADMIN"
                            size="small"
                            sx={{
                                bgcolor: '#6a90e0ff',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.7rem'
                            }}
                        />
                    </Typography>

                    <IconButton
                        color="inherit"
                        sx={{ mr: 2 }}
                    >
                        <Badge badgeContent={0} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                            label={`👋 Welcome, ${user?.emp_name || user?.email_id || 'User'} (${user.emp_id})`}
                            variant="outlined"
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                        />

                        <Button
                            color="inherit"
                            onClick={onLogout}
                            startIcon={<DashboardIcon />}
                            variant="outlined"
                            sx={{ borderColor: 'rgba(255,255,255,0.3)' }}
                        >
                            Logout
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* User Management Content */}
            <Box sx={{ p: 3 }}>
                <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            👥 User Management
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>

                            {/* Search Field - ADD THIS */}
                            <TextField
                                size="small"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{ width: 250 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {/* Department Filter */}
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Department</InputLabel>
                                <Select
                                    value={departmentFilter}
                                    label="Department"
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                >
                                    <MenuItem value="PCS ROW">POC Team</MenuItem>
                                    <MenuItem value="sales">Sales Department</MenuItem>
                                    <MenuItem value="all">All Departments</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Status Filter - ADD THIS */}
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Inactive">Inactive</MenuItem>
                                    <MenuItem value="all">All Status</MenuItem>
                                </Select>
                            </FormControl>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={fetchUsers}
                                disabled={loading}
                            >
                                Refresh
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleOpenAddDialog}
                            >
                                Add User
                            </Button>
                        </Box>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'primary.light' }}>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Emp ID</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Email</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Department</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Role</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredUsers
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((user) => (
                                                <TableRow key={user.emp_id} hover>
                                                    <TableCell>{user.emp_id}</TableCell>
                                                    <TableCell>{user.emp_name}</TableCell>
                                                    <TableCell>{user.email_id}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={user.department_name || 'N/A'}
                                                            size="small"
                                                            color={user.department_name === 'PCS ROW' ? 'primary' :
                                                                user.department_name === 'sales' ? 'secondary' : 'default'}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={user.role || 'User'}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                                            <Select
                                                                value={user.status || 'Active'}
                                                                onChange={(e) => handleStatusChange(user.emp_id, e.target.value)}
                                                                sx={{
                                                                    height: 32,
                                                                    fontSize: '0.875rem',
                                                                    '& .MuiSelect-select': {
                                                                        padding: '6px 32px 6px 12px'
                                                                    }
                                                                }}
                                                            >
                                                                <MenuItem value="Active" sx={{ fontSize: '0.875rem' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <CheckCircleIcon fontSize="small" color="success" />
                                                                        Active
                                                                    </Box>
                                                                </MenuItem>
                                                                <MenuItem value="Inactive" sx={{ fontSize: '0.875rem' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <WarningIcon fontSize="small" color="error" />
                                                                        Inactive
                                                                    </Box>
                                                                </MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <Button
                                                                size="small"
                                                                startIcon={<EditIcon />}
                                                                onClick={() => handleOpenEditDialog(user)}
                                                                variant="outlined"
                                                                color="primary"
                                                                disabled={user.status === 'Inactive'}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                startIcon={<ManageAccountsIcon />}
                                                                onClick={() => handleOpenPermissionDialog(user)}
                                                                variant="outlined"
                                                                color="secondary"
                                                                disabled={user.status === 'Inactive'}  // Add this line
                                                            >
                                                                Access
                                                            </Button>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        {filteredUsers.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                                    No users found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <TablePagination
                                component="div"
                                count={filteredUsers.length}
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                            />
                        </>
                    )}
                </Paper>

                {/* Stats Summary */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6" color="primary">
                                Total Users
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {users.length}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6" color="primary">
                                POC Team
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {users.filter(u => u.department_name === 'PCS ROW').length}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6" color="primary">
                                Sales Department
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {users.filter(u => u.department_name === 'sales').length}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6" color="primary">
                                Active Users
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {users.filter(u => u.status === 'Active').length}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* Add User/Edit User Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            name="emp_id"
                            label="Employee ID"
                            value={formData.emp_id}
                            onChange={handleFormChange}
                            fullWidth
                            required
                            disabled={editingUser} // Can't edit ID
                        />
                        <TextField
                            name="emp_name"
                            label="Employee Name"
                            value={formData.emp_name}
                            onChange={handleFormChange}
                            fullWidth
                            required
                        />
                        <TextField
                            name="email_id"
                            label="Email ID"
                            type="email"
                            value={formData.email_id}
                            onChange={handleFormChange}
                            fullWidth
                            required
                        />
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                name="status"
                                value={formData.status}
                                label="Status"
                                onChange={handleFormChange}
                            >
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Department</InputLabel>
                            <Select
                                name="department_name"
                                value={formData.department_name}
                                label="Department"
                                onChange={handleFormChange}
                                required
                            >
                                <MenuItem value="PCS ROW">POC Team (PCS ROW)</MenuItem>
                                <MenuItem value="sales">Sales Department</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                name="role"
                                value={formData.role}
                                label="Role"
                                onChange={handleFormChange}
                                required
                            >
                                <MenuItem value="Employee">Employee</MenuItem>
                                <MenuItem value="Department Admin">Department Admin</MenuItem>
                                <MenuItem value="Engineer">Engineer</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            name="password"
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={handleFormChange}
                            fullWidth
                            required={!editingUser} // Only required for new users
                            helperText={editingUser ? "Leave blank to keep current password" : ""}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmitUser} variant="contained" color="primary">
                        {editingUser ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Permission Management Dialog */}
            <Dialog open={openPermissionDialog} onClose={handleClosePermissionDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ManageAccountsIcon />
                        Manage Access - {selectedUser?.emp_name} ({selectedUser?.emp_id})
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                        Department: {selectedUser?.department_name}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {selectedUser && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 2, maxHeight: '60vh', overflow: 'auto' }}>
                            {/* Department-specific permissions */}
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {selectedUser.department_name === 'PCS ROW' ? 'POC Team Permissions' :
                                    selectedUser.department_name === 'sales' ? 'Sales Department Access Management' :
                                        'Department Permissions'}
                            </Typography>

                            {selectedUser.department_name === 'PCS ROW' && (
                                <>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                                        POC Team Access Levels
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                        <Button
                                            variant={permissionData.status_access === true &&
                                                permissionData.all_status_access === false &&
                                                permissionData.usecase_creation_access === false &&
                                                permissionData.report_access === false &&
                                                permissionData.sales_access === false &&
                                                permissionData.sales_admin === false ? "contained" : "outlined"}
                                            color="primary"
                                            onClick={() => {
                                                setPermissionData({
                                                    ...permissionData,
                                                    status_access: true,
                                                    all_status_access: false,
                                                    usecase_creation_access: false,
                                                    report_access: false,
                                                    sales_access: false,
                                                    sales_admin: false
                                                });
                                            }}
                                            sx={{ flex: 1 }}
                                        >
                                            Developer Access
                                        </Button>

                                        <Button
                                            variant={permissionData.status_access === true &&
                                                permissionData.usecase_creation_access === true &&
                                                permissionData.all_status_access === false &&
                                                permissionData.report_access === false &&
                                                permissionData.sales_access === false &&
                                                permissionData.sales_admin === false ? "contained" : "outlined"}
                                            color="primary"
                                            onClick={() => {
                                                setPermissionData({
                                                    ...permissionData,
                                                    status_access: true,
                                                    usecase_creation_access: true,
                                                    all_status_access: false,
                                                    report_access: false,
                                                    sales_access: false,
                                                    sales_admin: false
                                                });
                                            }}
                                            sx={{ flex: 1 }}
                                        >
                                            Manager Access
                                        </Button>

                                        <Button
                                            variant={permissionData.status_access === true &&
                                                permissionData.all_status_access === true &&
                                                permissionData.usecase_creation_access === true &&
                                                permissionData.report_access === true &&
                                                permissionData.sales_access === true &&
                                                permissionData.sales_admin === true ? "contained" : "outlined"}
                                            color="primary"
                                            onClick={() => {
                                                setPermissionData({
                                                    ...permissionData,
                                                    status_access: true,
                                                    all_status_access: true,
                                                    usecase_creation_access: true,
                                                    report_access: true,
                                                    sales_access: true,
                                                    sales_admin: true
                                                });
                                            }}
                                            sx={{ flex: 1 }}
                                        >
                                            Admin Access
                                        </Button>
                                    </Box>

                                    <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                                        Selected: {
                                            permissionData.status_access === true &&
                                                permissionData.all_status_access === false &&
                                                permissionData.usecase_creation_access === false &&
                                                permissionData.report_access === false &&
                                                permissionData.sales_access === false &&
                                                permissionData.sales_admin === false
                                                ? " Developer Access"
                                                : permissionData.status_access === true &&
                                                    permissionData.usecase_creation_access === true &&
                                                    permissionData.all_status_access === false &&
                                                    permissionData.report_access === false &&
                                                    permissionData.sales_access === false &&
                                                    permissionData.sales_admin === false
                                                    ? " Manager Access"
                                                    : permissionData.status_access === true &&
                                                        permissionData.all_status_access === true &&
                                                        permissionData.usecase_creation_access === true &&
                                                        permissionData.report_access === true &&
                                                        permissionData.sales_access === true &&
                                                        permissionData.sales_admin === true
                                                        ? " Admin Access"
                                                        : " Custom Access"
                                        }
                                    </Typography>

                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        Permission Details:
                                    </Typography>

                                    <Box sx={{ pl: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            • Status Fill Access: {permissionData.status_access ? "✅ Yes" : "❌ No"}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            • All Team Status Access: {permissionData.all_status_access ? "✅ Yes" : "❌ No"}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            • Code Creation Access: {permissionData.usecase_creation_access ? "✅ Yes" : "❌ No"}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            • Report Tab Access: {permissionData.report_access ? "✅ Yes" : "❌ No"}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            • Usecase Initiation Access: {permissionData.sales_access ? "✅ Yes" : "❌ No"}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            • View All Initiated Usecases: {permissionData.sales_admin ? "✅ Yes" : "❌ No"}
                                        </Typography>
                                    </Box>
                                </>
                            )}

                            {selectedUser.department_name === 'sales' && (
                                <>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                                        Sales Access Levels
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                        <Button
                                            variant={permissionData.sales_dashboard_access === false &&
                                                permissionData.all_sales_access === false ? "contained" : "outlined"}
                                            color="primary"
                                            onClick={() => {
                                                setPermissionData({
                                                    ...permissionData,
                                                    status_status_access: true,
                                                    sales_dashboard_access: false,
                                                    all_sales_access: false
                                                });
                                            }}
                                            sx={{ flex: 1 }}
                                        >
                                            Developer Access
                                        </Button>

                                        <Button
                                            variant={permissionData.sales_dashboard_access === true &&
                                                permissionData.all_sales_access === false ? "contained" : "outlined"}
                                            color="primary"
                                            onClick={() => {
                                                setPermissionData({
                                                    ...permissionData,
                                                    status_status_access: true,
                                                    sales_dashboard_access: true,
                                                    all_sales_access: false
                                                });
                                            }}
                                            sx={{ flex: 1 }}
                                        >
                                            Manager Access
                                        </Button>

                                        <Button
                                            variant={permissionData.all_sales_access === true ? "contained" : "outlined"}
                                            color="primary"
                                            onClick={() => {
                                                setPermissionData({
                                                    ...permissionData,
                                                    status_status_access: true,
                                                    sales_dashboard_access: true,
                                                    all_sales_access: true
                                                });
                                            }}
                                            sx={{ flex: 1 }}
                                        >
                                            Admin Access
                                        </Button>
                                    </Box>

                                    <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                                        Selected:
                                        {permissionData.sales_dashboard_access === false && permissionData.all_sales_access === false
                                            ? " Developer Access"
                                            : permissionData.sales_dashboard_access === true && permissionData.all_sales_access === false
                                                ? " Manager Access"
                                                : " Admin Access"}
                                    </Typography>

                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        Permission Details:
                                    </Typography>

                                    <Box sx={{ pl: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            • Status Fill Access: {permissionData.status_status_access ? "✅ Yes" : "❌ No"}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            • Usecase Creation: {permissionData.sales_dashboard_access ? "✅ Yes" : "❌ No"}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            • All Usecase Access: {permissionData.all_sales_access ? "✅ Yes" : "❌ No"}
                                        </Typography>
                                    </Box>
                                </>
                            )}

                            {selectedUser.department_name !== 'PCS ROW' && selectedUser.department_name !== 'sales' && (
                                <Typography variant="body2" color="textSecondary">
                                    No department-specific permissions defined for this department.
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePermissionDialog}>Cancel</Button>
                    <Button onClick={handleSavePermissions} variant="contained" color="primary">
                        Save Permissions
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default Admin;