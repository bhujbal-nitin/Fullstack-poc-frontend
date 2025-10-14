import React, { useState, useEffect, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Typography,
    Box,
    Alert,
    Chip,
    TablePagination,
    TextField,
    InputAdornment,
    IconButton,
    Tooltip,
    AppBar,
    Toolbar,
    Button,
    Menu,
    MenuItem,
    Checkbox,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    FormControl,
    Select,
    InputLabel
} from "@mui/material";
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    ViewColumn as ViewColumnIcon,
    FilterList as FilterListIcon,
    Menu as MenuIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    Dashboard as DashboardIcon
} from "@mui/icons-material";
import axios from "axios";

const InitiateUsecaseTable = ({ currentUser, navigate, handleLogout }) => {
    const [pocData, setPocData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");

    // Column visibility state
    const [visibleColumns, setVisibleColumns] = useState({
        id: true,
        companyName: true,
        partnerCompanyName: true,
        usecase: true,
        brief: true,
        processType: true,
        endCustomerType: true,
        region: true,
        status: true,
        remark: true,
        salesPerson: false,
        spoc: false,
        spocEmail: false,
        designation: false,
        mobileNumber: false,
        partnerSpoc: false,
        partnerSpocEmail: false,
        partnerDesignation: false,
        partnerMobileNumber: false,
        // generateUsecase: true, // New Generate Usecase column
        actions: true // Actions column
    });

    // Column menu state
    const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

    // Dialog and snackbar states
    const [selectedPoc, setSelectedPoc] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [pocToDelete, setPocToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Usecase types for dropdown
    const usecaseTypes = [
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
    ];



    
    // Update fetchPocData to check permissions first
    const fetchPocData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const token = localStorage.getItem('authToken');

            // Get the salesperson name from currentUser
            const salesPersonName = currentUser?.emp_name || currentUser?.salesperson_name;
            const empId = currentUser?.emp_id;

            if (!salesPersonName || !empId) {
                setError("User information not available");
                setLoading(false);
                return;
            }

            // First, check user permissions
            const permissionsResponse = await axios.get(`http://localhost:5050/poc/permissions/${empId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const hasSalesAdminAccess = permissionsResponse.data.sales_admin;

            let response;
            if (hasSalesAdminAccess) {
                // If user has sales_admin permission, fetch all records
                console.log('User has sales_admin access, fetching all records');
                response = await axios.get('http://localhost:5050/poc/getAllPocs', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                    // No salesperson_name parameter for admin
                });
            } else {
                // If user doesn't have sales_admin permission, fetch only their records
                console.log('User does not have sales_admin access, fetching only their records');
                response = await axios.get('http://localhost:5050/poc/getAllPocs', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    params: {
                        salesperson_name: salesPersonName
                    }
                });
            }

            if (response.data && Array.isArray(response.data)) {
                // Use generatedUsecase from DB if available, otherwise use local generateUsecase
                const dataWithUsecase = response.data.map(poc => ({
                    ...poc,
                    generateUsecase: poc.generatedUsecase || poc.generateUsecase || ''
                }));
                setPocData(dataWithUsecase);
            } else {
                setPocData([]);
            }
        } catch (err) {
            console.error('Error fetching POC data:', err);
            if (err.response?.status === 401) {
                handleLogout();
                navigate('/login');
            } else {
                setError(err.response?.data?.message || 'Failed to fetch POC data');
            }
            setPocData([]);
        } finally {
            setLoading(false);
        }
    }, [handleLogout, navigate, currentUser]);


    useEffect(() => {
        fetchPocData();
    }, [fetchPocData]);

    // Column configuration
    const columnConfig = {
        id: {
            label: 'ID',
            truncate: false,
            render: (poc) => (
                <Typography
                    component="span"
                    onClick={() => handleViewDetails(poc)}
                    sx={{
                        fontWeight: 'bold',
                        color: 'primary.main',
                        '&:hover': {
                            textDecoration: 'underline',
                            cursor: 'pointer'
                        }
                    }}
                >
                    {poc.id}
                </Typography>
            )
        },
        companyName: { label: 'Company Name', truncate: 20 },
        partnerCompanyName: { label: 'Partner Company', truncate: 20 },
        usecase: {
            label: 'Use Case',
            truncate: 25,
            render: (poc) => (
                <Tooltip title={poc.usecase || 'N/A'}>
                    <span>
                        {poc.usecase ? (poc.usecase.length > 25 ? poc.usecase.substring(0, 25) + '...' : poc.usecase) : 'N/A'}
                    </span>
                </Tooltip>
            )
        },
        brief: {
            label: 'Brief',
            truncate: 30,
            render: (poc) => (
                <Tooltip title={poc.brief || 'N/A'}>
                    <span>
                        {poc.brief ? (poc.brief.length > 30 ? poc.brief.substring(0, 30) + '...' : poc.brief) : 'N/A'}
                    </span>
                </Tooltip>
            )
        },
        processType: {
            label: 'Process Type',
            truncate: false,
            render: (poc) => (
                <Chip
                    label={poc.processType || 'N/A'}
                    size="small"
                    color="secondary"
                    variant="outlined"
                />
            )
        },
        endCustomerType: { label: 'Customer Type', truncate: false },
        region: {
            label: 'Region',
            truncate: false,
            render: (poc) => (
                <Chip
                    label={poc.region || 'N/A'}
                    size="small"
                    color="primary"
                    variant="outlined"
                />
            )
        },

        salesPerson: { label: 'Sales Person', truncate: false },
        spoc: { label: 'SPOC', truncate: false },
        spocEmail: { label: 'SPOC Email', truncate: 20 },
        designation: { label: 'Designation', truncate: false },
        mobileNumber: { label: 'Mobile Number', truncate: false },
        partnerSpoc: { label: 'Partner SPOC', truncate: false },
        partnerSpocEmail: { label: 'Partner Email', truncate: 20 },
        partnerDesignation: { label: 'Partner Designation', truncate: false },
        partnerMobileNumber: { label: 'Partner Mobile', truncate: false },
        remark: {
            label: 'Remark',
            truncate: 20,
            render: (poc) => (
                <Tooltip title={poc.remark || 'N/A'}>
                    <span>
                        {poc.remark ? (poc.remark.length > 20 ? poc.remark.substring(0, 20) + '...' : poc.remark) : 'N/A'}
                    </span>
                </Tooltip>
            )
        },
        status: {
            label: 'Status',
            truncate: false,
            render: (poc) => (
                <Chip
                    label={poc.status || 'N/A'}
                    size="small"
                    color={
                        poc.status === 'Completed' ? 'success' :
                            poc.status === 'In Progress' ? 'warning' :
                                poc.status === 'Pending' ? 'error' : 'default'
                    }
                    variant="filled"
                />
            )
        },
        // generateUsecase: {
        //     label: 'Generate Usecase',
        //     truncate: false,
        //     render: (poc) => {
        //         // If generated_usecase exists in DB, show it as disabled
        //         if (poc.generatedUsecase) {
        //             return (
        //                 <FormControl size="small" sx={{ minWidth: 150 }}>
        //                     <Select
        //                         value={poc.generatedUsecase}
        //                         displayEmpty
        //                         disabled
        //                         sx={{
        //                             fontSize: '0.875rem',
        //                             '& .MuiSelect-select': {
        //                                 py: 0.5
        //                             },
        //                             backgroundColor: '#f5f5f5'
        //                         }}
        //                     >
        //                         <MenuItem value={poc.generatedUsecase}>
        //                             {poc.generatedUsecase}
        //                         </MenuItem>
        //                     </Select>
        //                 </FormControl>
        //             );
        //         }

        //         // Otherwise show the normal dropdown
        //         return (
        //             <FormControl size="small" sx={{ minWidth: 150 }}>
        //                 <Select
        //                     value={poc.generateUsecase || ''}
        //                     onChange={(e) => handleUsecaseTypeChange(poc.id, e.target.value)}
        //                     displayEmpty
        //                     sx={{
        //                         fontSize: '0.875rem',
        //                         '& .MuiSelect-select': {
        //                             py: 0.5
        //                         }
        //                     }}
        //                 >
        //                     <MenuItem value="">
        //                         <em>Select Type</em>
        //                     </MenuItem>
        //                     {usecaseTypes.map((type) => (
        //                         <MenuItem key={type} value={type}>
        //                             {type}
        //                         </MenuItem>
        //                     ))}
        //                 </Select>
        //             </FormControl>
        //         );
        //     }
        // },

        // In the actions column configuration, update the render function
        actions: {
            label: 'Actions',
            truncate: false,
            render: (poc) => {
                // If status is "Initiated", disable all action buttons
                if (poc.status === 'Initiated') {
                    return (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="View Details">
                                <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleViewDetails(poc)}
                                >
                                    <VisibilityIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Record is locked - Status is Initiated">
                                <span>
                                    <IconButton
                                        size="small"
                                        color="secondary"
                                        disabled
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Record is locked - Status is Initiated">
                                <span>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        disabled
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>
                    );
                }

                // If generated_usecase exists, disable only Edit button, but keep View and Delete active
                if (poc.generatedUsecase) {
                    return (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="View Details">
                                <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleViewDetails(poc)}
                                >
                                    <VisibilityIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Record is locked - Usecase already generated">
                                <span>
                                    <IconButton
                                        size="small"
                                        color="secondary"
                                        disabled
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Delete POC Record">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteClick(poc)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    );
                }

                // Normal actions for records without generated_usecase and status not "Initiated"
                return (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleViewDetails(poc)}
                            >
                                <VisibilityIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handleEditPoc(poc)}
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
                    </Box>
                );
            }
        }
    };

    // Update handleUsecaseTypeChange to also update the DB
    const handleUsecaseTypeChange = async (pocId, selectedType) => {
        try {
            const token = localStorage.getItem('authToken');
            const currentPoc = pocData.find(poc => poc.id === pocId);

            if (!currentPoc) {
                showSnackbar('POC record not found', 'error');
                return;
            }

            // Map the fields according to your naming conventions
            const requestBody = {
                pocId: selectedType,
                pocName: currentPoc.usecase || '',
                entityType: currentPoc.endCustomerType || '',
                entityName: currentPoc.companyName || '',
                partnerName: currentPoc.partnerCompanyName || '',
                pocType: currentPoc.processType || '',
                region: currentPoc.region || '',
                salesPerson: currentPoc.salesPerson || '',
                spocEmail: currentPoc.spocEmail || '',
                spocDesignation: currentPoc.designation || '',
                description: currentPoc.brief || '',
                createdBy: currentUser?.emp_name || ''
            };

            console.log('Saving POC with data:', requestBody);

            // Call your API to save to both tables
            const response = await axios.post('http://localhost:5050/poc/savepocprjid',
                requestBody,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Also update the generated_usecase in poc_details table
            await axios.put(`http://localhost:5050/poc/updateGeneratedUsecase/${pocId}`,
                { generatedUsecase: selectedType },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Update local state
            setPocData(prevData =>
                prevData.map(poc =>
                    poc.id === pocId ? {
                        ...poc,
                        generateUsecase: selectedType,
                        generatedUsecase: selectedType
                    } : poc
                )
            );

            showSnackbar(`Usecase "${selectedType}" generated successfully with ID: ${response.data.details?.poc_prj_id}`, 'success');

        } catch (error) {
            console.error('Error generating usecase:', error);
            if (error.response?.data?.message) {
                showSnackbar(`Failed to generate usecase: ${error.response.data.message}`, 'error');
            } else {
                showSnackbar('Failed to generate usecase', 'error');
            }

            // Reset the dropdown to empty if API fails
            setPocData(prevData =>
                prevData.map(poc =>
                    poc.id === pocId ? { ...poc, generateUsecase: '' } : poc
                )
            );
        }
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
        allFalse.id = true;
        setVisibleColumns(allFalse);
    };

    // Filter data based on search term
    const filteredData = pocData.filter(poc => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        return (
            (poc.salesPerson?.toLowerCase().includes(searchLower)) ||
            (poc.region?.toLowerCase().includes(searchLower)) ||
            (poc.endCustomerType?.toLowerCase().includes(searchLower)) ||
            (poc.processType?.toLowerCase().includes(searchLower)) ||
            (poc.companyName?.toLowerCase().includes(searchLower)) ||
            (poc.spoc?.toLowerCase().includes(searchLower)) ||
            (poc.spocEmail?.toLowerCase().includes(searchLower)) ||
            (poc.usecase?.toLowerCase().includes(searchLower)) ||
            (poc.brief?.toLowerCase().includes(searchLower)) ||
            (poc.partnerCompanyName?.toLowerCase().includes(searchLower)) ||
            (poc.partnerSpoc?.toLowerCase().includes(searchLower)) ||
            (poc.generateUsecase?.toLowerCase().includes(searchLower)) // Include generateUsecase in search
        );
    });

    const paginatedData = filteredData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const truncateText = (text, maxLength = 30) => {
        if (!text) return 'N/A';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    // Action handlers
    const handleViewDetails = (poc) => {
        setSelectedPoc(poc);
        setDetailDialogOpen(true);
    };

    const handleCloseDetails = () => {
        setDetailDialogOpen(false);
        setSelectedPoc(null);
    };

    const handleEditPoc = (poc) => {
        // Prevent editing if status is "Initiated"
        if (poc.status === 'Initiated') {
            showSnackbar('Cannot edit record with "Initiated" status', 'warning');
            return;
        }

        // Show snackbar and navigate to edit page
        showSnackbar(`Editing POC: ${poc.id}`, 'info');

        // Navigate to edit page with the record data
        navigate('/edit-poc', { state: { editRecord: poc } });
    };

    const handleDeleteClick = (poc) => {
        // Prevent deleting if status is "Initiated"
        if (poc.status === 'Initiated') {
            showSnackbar('Cannot delete record with "Initiated" status', 'warning');
            return;
        }

        setPocToDelete(poc);
        setDeleteConfirmOpen(true);
    };



    const handleDeleteConfirm = async () => {
        if (!pocToDelete) return;

        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`http://localhost:5050/poc/deletePoc/${pocToDelete.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Remove the deleted item from local state
            setPocData(prevData => prevData.filter(item => item.id !== pocToDelete.id));
            showSnackbar('POC record deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting POC:', error);
            showSnackbar('Failed to delete POC record', 'error');
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

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            {/* App Bar Header */}
            <AppBar position="static" elevation={1}>
                <Toolbar>
                    <Button
                        color="inherit"
                        onClick={() => navigate('/dashboard')}
                        startIcon={<DashboardIcon />}
                        sx={{ mr: 2 }}
                    >
                        Dashboard
                    </Button>
                    <Typography
                        component="h1"
                        variant="h6"
                        color="inherit"
                        noWrap
                        sx={{ flexGrow: 1 }}
                    >
                        POC Records Management
                    </Typography>
                    <Typography variant="body2" color="inherit" sx={{ mr: 2 }}>
                        Welcome, {currentUser?.emp_name}
                        {currentUser?.emp_id && ` (${currentUser.emp_id})`}
                    </Typography>
                    <Button color="inherit" onClick={handleLogout}>Logout</Button>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Box sx={{
                flexGrow: 1,
                p: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Fixed Header with Search and Controls */}
                <Box sx={{
                    flexShrink: 0,
                    backgroundColor: 'white',
                    pb: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        <Typography variant="h5" component="h2" color="primary" fontWeight="bold">
                            Initiated Records
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                                placeholder="Search POC records..."
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
                                    endAdornment: searchTerm && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={handleClearSearch}
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ width: 300 }}
                            />

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
                                onClick={() => navigate('/initiate')}
                                size="small"
                            >
                                Initiate Usecase
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {/* Content Area */}
                <Box sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    mt: 2
                }}>
                    {loading && (
                        <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
                            <CircularProgress />
                            <Typography variant="body1" sx={{ ml: 2 }}>
                                Loading POC records...
                            </Typography>
                        </Box>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {!loading && !error && pocData.length === 0 && (
                        <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
                            <Alert severity="info">
                                No POC records found.
                            </Alert>
                        </Box>
                    )}

                    {!loading && pocData.length > 0 && (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            flexGrow: 1,
                            overflow: 'hidden'
                        }}>
                            {/* Table Container */}
                            <TableContainer
                                component={Paper}
                                sx={{
                                    flexGrow: 1,
                                    overflow: 'auto',
                                    margin: 0,
                                    width: '100%',
                                }}
                            >
                                <Table
                                    stickyHeader
                                    sx={{
                                        width: '100%',
                                        margin: 0,
                                        '& .MuiTableCell-root': {
                                            padding: '8px 12px',
                                            whiteSpace: 'nowrap'
                                        }
                                    }}
                                    aria-label="poc records table"
                                    size="small"
                                >
                                    <TableHead>
                                        <TableRow>
                                            {Object.entries(columnConfig).map(([key, config]) =>
                                                visibleColumns[key] && (
                                                    <TableCell
                                                        key={key}
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            backgroundColor: '#1976d2',
                                                            color: 'white',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <span>{config.label}</span>
                                                            {key !== 'actions' && key !== 'generateUsecase' && (
                                                                <IconButton
                                                                    size="small"
                                                                    sx={{
                                                                        ml: 0.5,
                                                                        color: 'white',
                                                                        '&:hover': {
                                                                            backgroundColor: 'rgba(255,255,255,0.1)'
                                                                        }
                                                                    }}
                                                                >
                                                                    <FilterListIcon fontSize="small" />
                                                                </IconButton>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                )
                                            )}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedData.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={Object.keys(visibleColumns).filter(k => visibleColumns[k]).length}
                                                    align="center"
                                                    sx={{ py: 3 }}
                                                >
                                                    <Typography variant="body1" color="textSecondary">
                                                        {searchTerm
                                                            ? 'No matching POC records found'
                                                            : 'No POC records available'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedData.map((poc) => (
                                                // In the TableRow for each POC record, update the sx prop to apply low focus for "Initiated" status
                                                <TableRow
                                                    key={poc.id}
                                                    sx={{
                                                        '&:last-child td, &:last-child th': { border: 0 },
                                                        '&:hover': { backgroundColor: '#f5f5f5' },
                                                        // Add low focus style for Initiated status
                                                        ...(poc.status === 'Initiated' && {
                                                            backgroundColor: '#f9f9f9',
                                                            opacity: 0.7,
                                                            '&:hover': {
                                                                backgroundColor: '#f0f0f0'
                                                            }
                                                        })
                                                    }}
                                                >
                                                    {Object.entries(columnConfig).map(([key, config]) =>
                                                        visibleColumns[key] && (
                                                            <TableCell key={key}>
                                                                {config.render ? (
                                                                    config.render(poc)
                                                                ) : (
                                                                    <Tooltip title={poc[key] || 'N/A'}>
                                                                        <span>
                                                                            {config.truncate ?
                                                                                truncateText(poc[key], config.truncate) :
                                                                                (poc[key] || 'N/A')
                                                                            }
                                                                        </span>
                                                                    </Tooltip>
                                                                )}
                                                            </TableCell>
                                                        )
                                                    )}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Pagination - Fixed at bottom */}
                            <Box sx={{
                                flexShrink: 0,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 1,
                                borderTop: 1,
                                borderColor: 'divider',
                                backgroundColor: 'white'
                            }}>
                                <Typography variant="body2" color="textSecondary">
                                    Showing {filteredData.length} of {pocData.length} records
                                </Typography>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                    component="div"
                                    count={filteredData.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </Box>
                        </Box>
                    )}
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
            </Box>

            {/* Detail Dialog */}
            <Dialog open={detailDialogOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    POC Details - {selectedPoc?.id}
                    <IconButton onClick={handleCloseDetails}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedPoc && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <DetailItem label="ID" value={selectedPoc.id} />
                            <DetailItem label="Company Name" value={selectedPoc.companyName} />
                            <DetailItem label="Partner Company" value={selectedPoc.partnerCompanyName} />
                            <DetailItem label="Use Case" value={selectedPoc.usecase} />
                            <DetailItem label="Brief" value={selectedPoc.brief} />
                            <DetailItem label="Process Type" value={selectedPoc.processType} />
                            <DetailItem label="Customer Type" value={selectedPoc.endCustomerType} />
                            <DetailItem label="Region" value={selectedPoc.region} />
                            <DetailItem label="Sales Person" value={selectedPoc.salesPerson} />
                            <DetailItem label="SPOC" value={selectedPoc.spoc} />
                            <DetailItem label="SPOC Email" value={selectedPoc.spocEmail} />
                            <DetailItem label="Designation" value={selectedPoc.designation} />
                            <DetailItem label="Mobile Number" value={selectedPoc.mobileNumber} />
                            <DetailItem label="Partner SPOC" value={selectedPoc.partnerSpoc} />
                            <DetailItem label="Partner Email" value={selectedPoc.partnerSpocEmail} />
                            <DetailItem label="Partner Designation" value={selectedPoc.partnerDesignation} />
                            <DetailItem label="Partner Mobile" value={selectedPoc.partnerMobileNumber} />
                            <DetailItem label="Remark" value={selectedPoc.remark} />
                            <DetailItem label="Status" value={selectedPoc.status} />
                            {/* <DetailItem label="Generate Usecase" value={selectedPoc.generateUsecase || 'Not Selected'} /> */}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete POC record <strong>{pocToDelete?.id}</strong>?
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

// DetailItem component for the detail dialog
const DetailItem = ({ label, value, render }) => (
    <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            {label}:
        </Typography>
        {render ? (
            render(value)
        ) : (
            <Typography variant="body1">
                {value || 'N/A'}
            </Typography>
        )}
    </Box>
);

export default InitiateUsecaseTable;