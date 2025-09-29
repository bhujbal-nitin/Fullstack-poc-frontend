// src/components/PocTable.jsx
import * as React from 'react';
import {
    Box,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TablePagination,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Tooltip,
    Snackbar,
    Alert,
    AppBar,
    Toolbar,
    Button,
    IconButton,
    Card,
    CardContent,
    Menu,
    MenuItem,
    Checkbox,
    ListItemText,
    Link,
    Popover,
    InputLabel,
    Select,
    FormControl,
    OutlinedInput,
    alpha,
    useTheme
} from '@mui/material';
import {
    Search as SearchIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Menu as MenuIcon,
    ViewColumn as ViewColumnIcon,
    FilterList as FilterListIcon,
    Clear as ClearIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';

// Import the form components
import PocPrjId from './PocPrjId';
import PocPrjIdEdit from './PocPrjIdEdit';

const PocTable = ({ onNavigate, onLogout, user }) => {
    console.log('PocTable component mounted');

    const theme = useTheme();
    const [open, setOpen] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);
    const [pocData, setPocData] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedPoc, setSelectedPoc] = React.useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [pocToDelete, setPocToDelete] = React.useState(null);
    const [pocToEdit, setPocToEdit] = React.useState(null);
    const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });

    // Column selection state
    const [columnMenuAnchor, setColumnMenuAnchor] = React.useState(null);
    const [visibleColumns, setVisibleColumns] = React.useState({
        pocId: true,
        pocName: true,
        assignedTo: false,
        startDate: true,
        endDate: true,
        actualStartDate: true,
        actualEndDate: true,
        status: true,
        remark: true,
        entityType: false,
        entityName: true,
        salesPerson: false,
        region: false,
        isBillable: false,
        pocType: false,
        description: false,
        spocEmail: false,
        spocDesignation: false,
        tags: false,
        createdBy: false,
        estimatedEfforts: false,
        approvedBy: false,
        totalEfforts: false,
        varianceDays: false
    });

    // Column filter state
    const [columnFilters, setColumnFilters] = React.useState({
        pocId: '',
        pocName: '',
        entityType: '',
        entityName: '',
        salesPerson: '',
        region: '',
        isBillable: '',
        status: '',
        startDate: '',
        endDate: '',
        pocType: '',
        description: '',
        spocEmail: '',
        spocDesignation: '',
        tags: '',
        assignedTo: '',
        createdBy: '',
        actualStartDate: '',
        actualEndDate: '',
        estimatedEfforts: '',
        approvedBy: '',
        totalEfforts: '',
        varianceDays: '',
        remark: ''
    });

    // Filter popover state
    const [filterAnchorEl, setFilterAnchorEl] = React.useState(null);
    const [currentFilterColumn, setCurrentFilterColumn] = React.useState('');

    const handleOpen = () => setOpen(true);
    // const handleClose = () => setOpen(false);
    const handleClose = () => {
        setOpen(false);
        // Refresh token or validate session when modal closes
        validateToken();
    };
    const handleEditOpen = (poc) => {
        setPocToEdit(poc);
        setEditOpen(true);
    };
    // const handleEditClose = () => {
    //     setEditOpen(false);
    //     setPocToEdit(null);
    // };
    const handleEditClose = () => {
        setEditOpen(false);
        setPocToEdit(null);
        validateToken();
    };
    // Add token validation function
    const validateToken = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            handleLogout();
            return;
        }

        try {
            await axios.get('http://localhost:5050/poc/api/auth/validate', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            if (error.response?.status === 401) {
                handleLogout();
            }
        }
    };

    // // Update the handleLogout function in PocTable
    // const handleLogout = async () => {
    //     try {
    //         await axios.post('http://localhost:5050/poc/api/auth/logout', {}, {
    //             withCredentials: true
    //         });
    //     } catch (error) {
    //         console.error('Logout error:', error);
    //     } finally {
    //         localStorage.removeItem('authToken');
    //         localStorage.removeItem('user');
    //         if (onLogout) {
    //             onLogout(); // Call the parent logout function
    //         }
    //     }
    // };


    // Update the handleLogout function in PocTable
    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:5050/poc/api/auth/logout', {}, {
                withCredentials: true
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            if (onLogout) {
                onLogout(); // Call the parent logout function
            }
        }
    };
    // Fetch POC data
    const fetchPocData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await axios.get('http://localhost:5050/poc/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Improved sorting logic - prioritize by creation date, then by update date
            const sortedData = response.data.sort((a, b) => {
                // Try to get the most recent date for comparison
                const getMostRecentDate = (item) => {
                    // Priority: updatedAt > createdAt > startDate
                    if (item.updatedAt) return new Date(item.updatedAt);
                    if (item.createdAt) return new Date(item.createdAt);
                    if (item.startDate) return new Date(item.startDate);
                    return new Date(0); // Fallback to epoch if no dates available
                };

                const dateA = getMostRecentDate(a);
                const dateB = getMostRecentDate(b);

                // Sort in descending order (newest first)
                return dateB.getTime() - dateA.getTime();
            });

            setPocData(sortedData);
        } catch (error) {
            console.error('Error fetching Usecase data:', error);
            showSnackbar('Failed to fetch Usecase data', 'error');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        localStorage.removeItem('pocTableColumns');
        fetchPocData();

        // Load column preferences from localStorage if available
        const savedColumns = localStorage.getItem('pocTableColumns');
        if (savedColumns) {
            setVisibleColumns(JSON.parse(savedColumns));
        }
    }, []);

    // Save column preferences to localStorage when they change
    // React.useEffect(() => {
    //     console.log('PocTable useEffect running - check what triggers this');
    //     localStorage.setItem('pocTableColumns', JSON.stringify(visibleColumns));
    // }, [visibleColumns]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handle column filter change
    const handleColumnFilterChange = (column, value) => {
        setColumnFilters(prev => ({
            ...prev,
            [column]: value
        }));
        setPage(0); // Reset to first page when filtering
    };

    // Clear specific column filter
    const handleClearColumnFilter = (column) => {
        handleColumnFilterChange(column, '');
    };

    // Clear all filters
    const handleClearAllFilters = () => {
        const clearedFilters = Object.keys(columnFilters).reduce((acc, key) => {
            acc[key] = '';
            return acc;
        }, {});
        setColumnFilters(clearedFilters);
        setSearchTerm('');
    };

    // Open filter popover
    const handleOpenFilterPopover = (event, column) => {
        setFilterAnchorEl(event.currentTarget);
        setCurrentFilterColumn(column);
    };

    // Close filter popover
    const handleCloseFilterPopover = () => {
        setFilterAnchorEl(null);
        setCurrentFilterColumn('');
    };

    // Filter data based on search term and column filters
    const filteredData = pocData.filter(poc => {
        // Global search filter
        const matchesGlobalSearch =
            !searchTerm ||
            poc.pocId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            poc.pocName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            poc.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            poc.salesPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            poc.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            poc.entityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            poc.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            poc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            poc.tags?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            poc.approvedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            poc.status?.toLowerCase().includes(searchTerm.toLowerCase());

        // Column filters
        const matchesColumnFilters = Object.entries(columnFilters).every(([column, filterValue]) => {
            if (!filterValue) return true;

            const pocValue = poc[column];
            if (pocValue === null || pocValue === undefined) return false;

            // Handle boolean values (isBillable)
            if (column === 'isBillable') {
                if (filterValue === 'true') return pocValue === true;
                if (filterValue === 'false') return pocValue === false;
                return true;
            }

            // Handle date fields
            if (column.includes('Date') && pocValue) {
                const date = new Date(pocValue).toLocaleDateString();
                return date.includes(filterValue);
            }

            // Handle status with exact match
            if (column === 'status') {
                return pocValue?.toLowerCase() === filterValue.toLowerCase();
            }

            // Default string contains match
            return pocValue.toString().toLowerCase().includes(filterValue.toLowerCase());
        });

        return matchesGlobalSearch && matchesColumnFilters;
    });

    const paginatedData = filteredData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // Get unique values for filter dropdowns
    const getUniqueValues = (column) => {
        const values = pocData
            .map(item => item[column])
            .filter((value, index, self) =>
                value !== undefined &&
                value !== null &&
                self.indexOf(value) === index
            )
            .sort();

        return values;
    };

    // Check if any filters are active
    const hasActiveFilters = () => {
        return searchTerm || Object.values(columnFilters).some(value => value !== '');
    };

    const handleViewDetails = (poc) => {
        setSelectedPoc(poc);
        setDetailDialogOpen(true);
    };

    const handleCloseDetails = () => {
        setDetailDialogOpen(false);
        setSelectedPoc(null);
    };

    const handleDeleteClick = (poc) => {
        setPocToDelete(poc);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!pocToDelete) return;

        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`http://localhost:5050/poc/delete/${pocToDelete.pocId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Remove the deleted item from local state
            setPocData(prevData => prevData.filter(item => item.pocId !== pocToDelete.pocId));
            showSnackbar('Usecase record deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting Usecase:', error);
            showSnackbar('Failed to delete Usecase record', 'error');
        } finally {
            setDeleteConfirmOpen(false);
            setPocToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setPocToDelete(null);
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'success';
            case 'in progress': return 'warning';
            case 'pending': return 'default';
            case 'cancelled': return 'error';
            case 'draft': return 'secondary';
            case 'awaiting': return 'info';
            case 'hold': return 'secondary';
            case 'closed': return 'error';
            case 'converted': return 'success';
            default: return 'default';
        }
    };

    const getBillableChip = (isBillable) => {
        return (
            <Chip
                label={isBillable ? 'Billable' : 'Non-Billable'}
                color={isBillable ? 'success' : 'default'}
                size="small"
            />
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const truncateText = (text, maxLength = 30) => {
        if (!text) return '-';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const formatNumber = (number) => {
        if (number === null || number === undefined) return '-';
        return number.toString();
    };

    // Column selection handlers
    const handleOpenColumnMenu = (event) => {
        setColumnMenuAnchor(event.currentTarget);
    };

    const handleCloseColumnMenu = () => {
        setColumnMenuAnchor(null);
    };

    const handleToggleColumn = (columnKey) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const handleSelectAllColumns = () => {
        const allTrue = Object.keys(visibleColumns).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {});
        setVisibleColumns(allTrue);
    };

    const handleDeselectAllColumns = () => {
        const allFalse = Object.keys(visibleColumns).reduce((acc, key) => {
            acc[key] = false;
            return acc;
        }, {});
        // Keep at least one column visible
        allFalse.pocId = true;
        setVisibleColumns(allFalse);
    };

    

    // Add this state for editing status
    const [editingStatus, setEditingStatus] = React.useState(null);
    const [statusMenuAnchor, setStatusMenuAnchor] = React.useState(null);

    // Status options
    const statusOptions = ['Pending', 'In Progress', 'Completed', 'Cancelled', 'Awaiting', 'Hold', 'Closed', 'Converted'];


    // Function to handle status change
    const handleStatusChange = async (poc, newStatus) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.put(`http://localhost:5050/poc/updateStatus/${poc.pocId}`,
                { status: newStatus },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Update local state
            setPocData(prevData =>
                prevData.map(item =>
                    item.pocId === poc.pocId ? { ...item, status: newStatus } : item
                )
            );

            showSnackbar(`Status updated to ${newStatus}`, 'success');
        } catch (error) {
            console.error('Error updating status:', error);
            showSnackbar('Failed to update status', 'error');
        } finally {
            setEditingStatus(null);
            setStatusMenuAnchor(null);
        }
    };

    // Open status menu
    const handleOpenStatusMenu = (event, poc) => {
        setEditingStatus(poc);
        setStatusMenuAnchor(event.currentTarget);
    };

    // Close status menu
    const handleCloseStatusMenu = () => {
        setEditingStatus(null);
        setStatusMenuAnchor(null);
    };



    // Update the status column configuration in columnConfig
    const columnConfig = {
        pocId: {
            label: 'Usecase ID',
            truncate: false,
            render: (poc) => (
                <Link
                    component="button"
                    onClick={() => handleViewDetails(poc)}
                    sx={{
                        fontWeight: 'bold',
                        textDecoration: 'none',
                        color: 'primary.main',
                        '&:hover': {
                            textDecoration: 'underline',
                            cursor: 'pointer'
                        }
                    }}
                >
                    {poc.pocId}
                </Link>
            )
        },
        entityName: { label: 'Company Name', truncate: 15 },
        pocName: { label: 'Usecase Name', truncate: 20 },
        assignedTo: { label: 'Assigned To', truncate: false },
        startDate: { label: 'Start Date', truncate: false, render: (poc) => formatDate(poc.startDate) },
        endDate: { label: 'End Date', truncate: false, render: (poc) => formatDate(poc.endDate) },
        actualStartDate: { label: 'Actual Start Date', truncate: false, render: (poc) => formatDate(poc.actualStartDate) },
        actualEndDate: { label: 'Actual End Date', truncate: false, render: (poc) => formatDate(poc.actualEndDate) },
        status: {
            label: 'Status',
            truncate: false,
            render: (poc) => (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip
                        label={poc.status || 'Pending'}
                        color={getStatusColor(poc.status)}
                        size="small"
                        onClick={(e) => handleOpenStatusMenu(e, poc)}
                        sx={{
                            cursor: 'pointer',
                            '&:hover': {
                                opacity: 0.8
                            }
                        }}
                    />
                </Box>
            )
        },
        remark: {
            label: 'Remark',
            truncate: 20,
            render: (poc) => (
                editingRemark?.pocId === poc.pocId ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                            size="small"
                            value={remarkText}
                            onChange={(e) => setRemarkText(e.target.value)}
                            placeholder="Enter remark..."
                            sx={{ width: 150 }}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleRemarkUpdate(poc, remarkText)}
                                disabled={!remarkText.trim()}
                            >
                                ✓
                            </IconButton>
                            <IconButton
                                size="small"
                                color="error"
                                onClick={handleCancelEditRemark}
                            >
                                ✕
                            </IconButton>
                        </Box>
                    </Box>
                ) : (
                    <Tooltip title={poc.remark || 'Click to add remark'}>
                        <Box
                            onClick={() => handleStartEditRemark(poc)}
                            sx={{
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: 1,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                }
                            }}
                        >
                            {poc.remark ? truncateText(poc.remark, 20) : 'Add Remark'}
                        </Box>
                    </Tooltip>
                )
            )
        },
        entityType: { label: 'Client Type', truncate: false },
        
        salesPerson: { label: 'Sales Person', truncate: false },
        region: { label: 'Region', truncate: false },
        isBillable: { label: 'Billable', truncate: false, render: (poc) => getBillableChip(poc.isBillable) },
        pocType: { label: 'Usecase Type', truncate: false },
        description: { label: 'Description', truncate: 25 },
        spocEmail: { label: 'SPOC Email', truncate: 20 },
        spocDesignation: { label: 'SPOC Designation', truncate: false },
        tags: { label: 'Tags', truncate: 15 },
        createdBy: { label: 'Created By', truncate: false },
        estimatedEfforts: { label: 'Estimated Efforts', truncate: false },
        approvedBy: { label: 'Approved By', truncate: false },
        totalEfforts: { label: 'Total Efforts', truncate: false },
        varianceDays: { label: 'Variance Days', truncate: false }
    };




    const [editingRemark, setEditingRemark] = React.useState(null);
    const [remarkText, setRemarkText] = React.useState('');

    // Function to handle remark update
    const handleRemarkUpdate = async (poc, newRemark) => {
        try {
            const token = localStorage.getItem('authToken');
            await axios.put(`http://localhost:5050/poc/updateRemark/${poc.pocId}`,
                { remark: newRemark },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Update local state
            setPocData(prevData =>
                prevData.map(item =>
                    item.pocId === poc.pocId ? { ...item, remark: newRemark } : item
                )
            );

            setEditingRemark(null);
            setRemarkText('');
            showSnackbar('Remark updated successfully', 'success');
        } catch (error) {
            console.error('Error updating remark:', error);
            showSnackbar('Failed to update remark', 'error');
        }
    };

    // Function to start editing remark
    const handleStartEditRemark = (poc) => {
        setEditingRemark(poc);
        setRemarkText(poc.remark || '');
    };

    // Function to cancel editing remark
    const handleCancelEditRemark = () => {
        setEditingRemark(null);
        setRemarkText('');
    };


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            {/* App Bar */}
            <AppBar position="static" elevation={1} sx={{ bgcolor: theme.palette.primary.main }}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="open drawer"
                        onClick={() => onNavigate('dashboard')}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography
                        component="h1"
                        variant="h6"
                        color="inherit"
                        noWrap
                        sx={{ flexGrow: 1 }}
                    >
                        Code/Id Management
                    </Typography>
                    <Typography variant="body2" color="inherit" sx={{ mr: 2 }}>
                        Welcome, {user?.emp_name}
                    </Typography>
                    <Button color="inherit" onClick={onLogout}>Logout</Button>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Box sx={{ flexGrow: 1, p: 2, overflow: 'hidden', bgcolor: '#f5f7f9' }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 3 }}>
                    {/* Header with search and actions */}
                    <Box sx={{
                        p: 2,
                        borderBottom: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                    }}>
                        <Typography variant="h5" component="h2" color="primary" fontWeight="bold">
                            Usecase Management
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                                placeholder="Search Usecase codes..."
                                variant="outlined"
                                size="small"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ width: 250 }}
                            />

                            {hasActiveFilters() && (
                                <Tooltip title="Clear all filters">
                                    <IconButton
                                        size="small"
                                        onClick={handleClearAllFilters}
                                        color="primary"
                                    >
                                        <ClearIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            <Button
                                variant="outlined"
                                startIcon={<ViewColumnIcon />}
                                onClick={handleOpenColumnMenu}
                                size="small"
                            >
                                Columns
                            </Button>

                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleOpen}
                                size="small"
                                sx={{
                                    bgcolor: theme.palette.primary.main,
                                    '&:hover': {
                                        bgcolor: theme.palette.primary.dark
                                    }
                                }}
                            >
                                Create Usecase
                            </Button>
                        </Box>
                    </Box>

                    {/* Table Container */}
                    <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                                <Typography>Loading Usecase data...</Typography>
                            </Box>
                        ) : (
                            <>
                                <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
                                    <Table stickyHeader aria-label="poc table" size="small" sx={{ minWidth: 1000 }}>
                                        <TableHead>
                                            <TableRow>
                                                {Object.entries(columnConfig).map(([key, config]) =>
                                                    visibleColumns[key] && (
                                                        <TableCell key={key} sx={{
                                                            whiteSpace: 'nowrap',
                                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                            fontWeight: 'bold'
                                                        }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <span>{config.label}</span>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => handleOpenFilterPopover(e, key)}
                                                                    color={columnFilters[key] ? 'primary' : 'default'}
                                                                    sx={{ ml: 0.5 }}
                                                                >
                                                                    <FilterListIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                            {columnFilters[key] && (
                                                                <Box sx={{ mt: 0.5 }}>
                                                                    <Chip
                                                                        label={columnFilters[key]}
                                                                        size="small"
                                                                        onDelete={() => handleClearColumnFilter(key)}
                                                                    />
                                                                </Box>
                                                            )}
                                                        </TableCell>
                                                    )
                                                )}
                                                <TableCell sx={{
                                                    whiteSpace: 'nowrap',
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    fontWeight: 'bold'
                                                }}>
                                                    Actions
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedData.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={Object.keys(visibleColumns).filter(k => visibleColumns[k]).length + 1} align="center" sx={{ py: 3 }}>
                                                        <Typography variant="body1" color="textSecondary">
                                                            {searchTerm || Object.values(columnFilters).some(f => f)
                                                                ? 'No matching Usecase codes found'
                                                                : 'No Usecase codes available. Click "Create Usecase" to get started.'}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedData.map((poc) => (
                                                    <TableRow
                                                        key={poc.pocId}
                                                        hover
                                                        sx={{
                                                            '&:nth-of-type(even)': {
                                                                bgcolor: alpha(theme.palette.primary.main, 0.02)
                                                            }
                                                        }}
                                                    >
                                                        {Object.entries(columnConfig).map(([key, config]) =>
                                                            visibleColumns[key] && (
                                                                <TableCell key={key} sx={{ whiteSpace: 'nowrap' }}>
                                                                    {config.render ? (
                                                                        config.render(poc)
                                                                    ) : (
                                                                        <Tooltip title={poc[key] || '-'}>
                                                                            <span>
                                                                                {config.truncate ?
                                                                                    truncateText(poc[key], config.truncate) :
                                                                                    (poc[key] || '-')
                                                                                }
                                                                            </span>
                                                                        </Tooltip>
                                                                    )}
                                                                </TableCell>
                                                            )
                                                        )}
                                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                            <Tooltip title="View Details">
                                                                <IconButton
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={() => handleViewDetails(poc)}
                                                                    sx={{ mr: 0.5 }}
                                                                >
                                                                    <VisibilityIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Edit">
                                                                <IconButton
                                                                    size="small"
                                                                    color="secondary"
                                                                    onClick={() => handleEditOpen(poc)}
                                                                    sx={{ mr: 0.5 }}
                                                                >
                                                                    <EditIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Delete">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleDeleteClick(poc)}
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Pagination */}
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 1,
                                    borderTop: 1,
                                    borderColor: 'divider',
                                    bgcolor: alpha(theme.palette.primary.main, 0.03)
                                }}>
                                    <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
                                        Showing {filteredData.length} of {pocData.length} Usecase codes
                                    </Typography>
                                    <TablePagination
                                        rowsPerPageOptions={[5, 10, 25]}
                                        component="div"
                                        count={filteredData.length}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                    />
                                </Box>
                            </>
                        )}
                    </Box>
                </Card>
            </Box>

            {/* Column Selection Menu */}
            <Menu
                anchorEl={columnMenuAnchor}
                open={Boolean(columnMenuAnchor)}
                onClose={handleCloseColumnMenu}
                PaperProps={{
                    style: {
                        maxHeight: 400,
                        width: 250,
                    },
                }}
            >
                <MenuItem onClick={handleSelectAllColumns}>
                    <ListItemText>Select All</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDeselectAllColumns}>
                    <ListItemText>Deselect All</ListItemText>
                </MenuItem>
                <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 1, pt: 1 }} />
                {Object.entries(columnConfig).map(([key, config]) => (
                    <MenuItem key={key} onClick={() => handleToggleColumn(key)}>
                        <Checkbox checked={visibleColumns[key]} />
                        <ListItemText>{config.label}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>

            {/* Filter Popover */}
            <Popover
                open={Boolean(filterAnchorEl)}
                anchorEl={filterAnchorEl}
                onClose={handleCloseFilterPopover}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <Box sx={{ p: 2, minWidth: 200 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Filter {columnConfig[currentFilterColumn]?.label}
                    </Typography>

                    {currentFilterColumn === 'isBillable' ? (
                        <FormControl fullWidth size="small">
                            <InputLabel>Billable Status</InputLabel>
                            <Select
                                value={columnFilters.isBillable}
                                onChange={(e) => handleColumnFilterChange('isBillable', e.target.value)}
                                input={<OutlinedInput label="Billable Status" />}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="true">Billable</MenuItem>
                                <MenuItem value="false">Non-Billable</MenuItem>
                            </Select>
                        </FormControl>
                    ) : currentFilterColumn === 'status' ? (
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={columnFilters.status}
                                onChange={(e) => handleColumnFilterChange('status', e.target.value)}
                                input={<OutlinedInput label="Status" />}
                            >
                                <MenuItem value="">All</MenuItem>
                                {getUniqueValues('status').map(value => (
                                    <MenuItem key={value} value={value}>{value}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ) : (
                        <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            placeholder={`Filter ${columnConfig[currentFilterColumn]?.label}`}
                            value={columnFilters[currentFilterColumn]}
                            onChange={(e) => handleColumnFilterChange(currentFilterColumn, e.target.value)}
                        />
                    )}

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            size="small"
                            onClick={() => handleClearColumnFilter(currentFilterColumn)}
                            disabled={!columnFilters[currentFilterColumn]}
                        >
                            Clear
                        </Button>
                    </Box>
                </Box>
            </Popover>

            {/* Status Change Menu */}
            <Menu
                anchorEl={statusMenuAnchor}
                open={Boolean(statusMenuAnchor)}
                onClose={handleCloseStatusMenu}
                PaperProps={{
                    style: {
                        width: 200,
                    },
                }}
            >
                {statusOptions.map((status) => (
                    <MenuItem
                        key={status}
                        onClick={() => handleStatusChange(editingStatus, status)}
                        selected={editingStatus?.status === status}
                    >
                        <Chip
                            label={status}
                            color={getStatusColor(status)}
                            size="small"
                            sx={{ width: '100%', justifyContent: 'center' }}
                        />
                    </MenuItem>
                ))}
            </Menu>

            {/* Modal for PocPrjId */}
            {/* Modal for PocPrjId */}
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="lg"
                fullWidth
            >
                <DialogContent dividers>
                    <PocPrjId
                        onClose={handleClose}
                        onSuccess={() => {
                            handleClose();
                            setPage(0); // Reset to first page
                            // Remove the setTimeout and call fetchPocData directly
                            fetchPocData();
                            showSnackbar('Usecase record created successfully', 'success');
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={detailDialogOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Usecase Details - {selectedPoc?.pocId}
                    <IconButton
                        onClick={handleCloseDetails}
                        sx={{ ml: 2 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedPoc && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <DetailItem label="Usecase ID" value={selectedPoc.pocId} />
                            <DetailItem label="Project Name" value={selectedPoc.pocName} />
                            <DetailItem label="Description" value={selectedPoc.description || '-'} />
                            <DetailItem label="Client Type" value={selectedPoc.entityType} />
                            <DetailItem label="Usecase Type" value={selectedPoc.pocType} />
                            <DetailItem label="Company Name" value={selectedPoc.entityName} />
                            <DetailItem label="Sales Person" value={selectedPoc.salesPerson} />
                            <DetailItem label="Region" value={selectedPoc.region} />
                            <DetailItem label="SPOC Email" value={selectedPoc.spocEmail || '-'} />
                            <DetailItem label="SPOC Designation" value={selectedPoc.spocDesignation || '-'} />
                            <DetailItem label="Billable" value={selectedPoc.isBillable ? 'Yes' : 'No'} />
                            <DetailItem label="Tags" value={selectedPoc.tags || '-'} />
                            <DetailItem label="Assigned To" value={selectedPoc.assignedTo} />
                            <DetailItem label="Created By" value={selectedPoc.createdBy} />
                            <DetailItem label="Start Date" value={formatDate(selectedPoc.startDate)} />
                            <DetailItem label="End Date" value={formatDate(selectedPoc.endDate)} />
                            <DetailItem label="Actual Start Date" value={formatDate(selectedPoc.actualStartDate)} />
                            <DetailItem label="Actual End Date" value={formatDate(selectedPoc.actualEndDate)} />
                            <DetailItem label="Estimated Efforts" value={formatNumber(selectedPoc.estimatedEfforts)} />
                            <DetailItem label="Approved By" value={selectedPoc.approvedBy || '-'} />
                            <DetailItem label="Total Efforts" value={formatNumber(selectedPoc.totalEfforts)} />
                            <DetailItem label="Variance Days" value={formatNumber(selectedPoc.varianceDays)} />
                            <DetailItem label="Remark" value={selectedPoc.remark || '-'} />
                            <DetailItem
                                label="Status"
                                value={selectedPoc.status || 'Pending'}
                                render={(value) => (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Chip
                                            label={value}
                                            color={getStatusColor(value)}
                                            size="small"
                                            onClick={(e) => {
                                                setStatusMenuAnchor(e.currentTarget);
                                                setEditingStatus(selectedPoc);
                                            }}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    opacity: 0.8
                                                }
                                            }}
                                        />
                                    </Box>
                                )}
                            />
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal for PocPrjIdEdit */}
            <Dialog
                open={editOpen}
                onClose={handleEditClose}
                maxWidth="lg"
                fullWidth
            >
                <DialogContent dividers>
                    <PocPrjIdEdit
                        poc={pocToEdit}
                        onClose={handleEditClose}
                        onSuccess={() => {
                            handleEditClose();
                            setPage(0); // Reset to first page
                            // Remove the setTimeout and call fetchPocData directly
                            fetchPocData();
                            showSnackbar('Usecase record updated successfully', 'success');
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete Usecase <strong>{pocToDelete?.pocId}</strong> - {pocToDelete?.pocName}?
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

// Helper component for detail view
// Updated DetailItem component
const DetailItem = ({ label, value, render }) => (
    <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            {label}:
        </Typography>
        {render ? (
            render(value)
        ) : (
            <Typography variant="body1">
                {value || '-'}
            </Typography>
        )}
    </Box>
);




export default PocTable;