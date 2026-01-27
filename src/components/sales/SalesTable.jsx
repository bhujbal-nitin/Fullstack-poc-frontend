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
    Close as CloseIcon,
    Dashboard as DashboardIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { yellow as yellowColor } from '@mui/material/colors';
import axios from 'axios';

// Import the form components
import SalesPrjId from './SalesPrjId';
import SalesPrjIdEdit from './SalesPrjIdEdit';


// const logoutInProgress = React.useRef(false);


// Memoized table row component
const TableRowMemo = React.memo(({
    poc,
    visibleColumns,
    columnConfig,
    rowSelection,
    theme,
    handleRowSelect,
    handleViewDetails,
    handleEditOpen,
    handleDeleteClick,
    editingRemark,
    remarkText,
    handleStartEditRemark,
    handleRemarkUpdate,
    handleCancelEditRemark,
    truncateText,
    formatDate,
    handleOpenStatusMenu,
    getStatusColor
}) => {
    return (
        <TableRow
            hover
            selected={rowSelection[poc.pocId]}
            sx={{
                '&:nth-of-type(even)': {
                    bgcolor: alpha(theme.palette.primary.main, 0.02)
                },
                '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                }
            }}
        >
            {/* Selection checkbox */}
            <TableCell padding="checkbox">
                <Checkbox
                    size="small"
                    checked={!!rowSelection[poc.pocId]}
                    onChange={() => handleRowSelect(poc.pocId)}
                    sx={{ cursor: 'pointer' }}
                />
            </TableCell>

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
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    return (
        prevProps.poc.pocId === nextProps.poc.pocId &&
        prevProps.poc.status === nextProps.poc.status &&   // ✅ ADD THIS
        prevProps.rowSelection[prevProps.poc.pocId] === nextProps.rowSelection[nextProps.poc.pocId] &&
        prevProps.editingRemark?.pocId === nextProps.editingRemark?.pocId &&
        prevProps.remarkText === nextProps.remarkText &&
        JSON.stringify(prevProps.visibleColumns) === JSON.stringify(nextProps.visibleColumns)
    );
});

TableRowMemo.displayName = 'TableRowMemo';

// Detail Item component
const DetailItem = React.memo(({ label, value, render }) => (
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
));

DetailItem.displayName = 'DetailItem';

const SalesTable = ({ onNavigate, onLogout, user }) => {
    console.log('SalesTable component mounted');

    const theme = useTheme();
    const [open, setOpen] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);
    const [pocData, setPocData] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
    const [selectedPoc, setSelectedPoc] = React.useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [pocToDelete, setPocToDelete] = React.useState(null);
    const [pocToEdit, setPocToEdit] = React.useState(null);
    const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });
    const [rowSelection, setRowSelection] = React.useState({});
    const [exportMenuAnchor, setExportMenuAnchor] = React.useState(null);
    const [columnMenuAnchor, setColumnMenuAnchor] = React.useState(null);

    const logoutInProgress = React.useRef(false);

    const handleLogout = React.useCallback(async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API}/poc/api/auth/logout`, {}, {
                withCredentials: true
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            if (onLogout) {
                onLogout();
            }
        }
    }, [onLogout]);

    const handleAutoLogout = React.useCallback(() => {
        if (logoutInProgress.current) return;

        logoutInProgress.current = true;
        handleLogout();
    }, [handleLogout]);


    const isTokenExpired = (token) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    };

    React.useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token || isTokenExpired(token)) {
            handleAutoLogout();
            return;
        }

    }, [handleAutoLogout]);

    const safeNavigate = React.useCallback((route) => {
        const token = localStorage.getItem('authToken');
        if (!token || isTokenExpired(token)) {
            handleAutoLogout();
            return;
        }


        onNavigate(route);
    }, [onNavigate, handleAutoLogout]);



    // Column visibility state
    const [visibleColumns, setVisibleColumns] = React.useState({
        pocId: true,
        pocName: true,
        pocType: true,
        assignedTo: false,
        startDate: true,
        endDate: true,
        actualStartDate: false,
        actualEndDate: false,
        status: true,
        remark: true,
        totalWorkedHours: true,
        entityType: false,
        entityName: true,
        salesPerson: false,
        region: false,

        description: false,
        spocEmail: false,
        spocDesignation: false,
        tags: false,
        createdBy: false,
        estimatedEfforts: false,
        approvedBy: false,
        totalEfforts: false,

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
        status: [],
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

        remark: '',
        totalWorkedHours: ''
    });

    // Filter popover state
    const [filterAnchorEl, setFilterAnchorEl] = React.useState(null);
    const [currentFilterColumn, setCurrentFilterColumn] = React.useState('');

    // Status editing state
    const [editingStatus, setEditingStatus] = React.useState(null);
    const [statusMenuAnchor, setStatusMenuAnchor] = React.useState(null);

    // Remark editing state
    const [editingRemark, setEditingRemark] = React.useState(null);
    const [remarkText, setRemarkText] = React.useState('');

    // Status options
    const statusOptions = ['Draft', 'Pending', 'In Progress', 'Completed', 'Converted', 'Dropped', 'Awaiting', 'Hold', 'Closed', 'Live'];

    // Debounce search term
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Load column preferences
    React.useEffect(() => {
        const savedColumns = localStorage.getItem('pocTableColumns');
        if (savedColumns) {
            try {
                setVisibleColumns(JSON.parse(savedColumns));
            } catch (error) {
                console.error('Error loading column preferences:', error);
            }
        }
    }, []);

    // Save column preferences with debounce
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            try {
                localStorage.setItem('pocTableColumns', JSON.stringify(visibleColumns));
            } catch (error) {
                console.error('Error saving column preferences:', error);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [visibleColumns]);

    // Memoized column configuration
    const columnConfig = React.useMemo(() => ({
        pocId: {
            label: 'ID',
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
        pocType: { label: 'Type', truncate: 15 },
        entityName: { label: 'Company Name', truncate: 15 },
        pocName: { label: 'Usecase Name', truncate: 20 },
        assignedTo: { label: 'Assigned To', truncate: false },
        startDate: { label: 'Start Date', truncate: false, render: (poc) => formatDate(poc.startDate) },
        endDate: { label: 'End Date', truncate: false, render: (poc) => formatDate(poc.endDate) },
        actualStartDate: { label: 'Actual Start Date', truncate: false, render: (poc) => formatDate(poc.actualStartDate) },
        actualEndDate: { label: 'Actual End Date', truncate: false, render: (poc) => formatDate(poc.actualEndDate) },
        totalWorkedHours: {
            label: 'Worked Hours',
            truncate: false,
            render: (poc) => {
                const hours = poc.totalWorkedHours;
                if (hours === null || hours === undefined || hours === '') return '-';

                const totalHours = parseFloat(hours);
                if (isNaN(totalHours)) return '-';

                const wholeHours = Math.floor(totalHours);
                const minutes = Math.round((totalHours - wholeHours) * 60);
                return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
            }
        },
        status: {
            label: 'Status',
            truncate: false,
            render: (poc) => {
                const { muiColor, customColor, textColor } = getStatusColor(poc.status);
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip
                            label={poc.status || 'Draft'}
                            size="small"
                            onClick={(e) => handleOpenStatusMenu(e, poc)}
                            color={muiColor}
                            sx={{
                                ...(customColor && { backgroundColor: customColor, color: textColor || '#fff' }),
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                            }}
                        />
                    </Box>
                );
            }
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


        description: { label: 'Description', truncate: 25 },
        spocEmail: { label: 'SPOC Email', truncate: 20 },
        spocDesignation: { label: 'SPOC Designation', truncate: false },
        tags: { label: 'Tags', truncate: 15 },
        createdBy: { label: 'Created By', truncate: false },
        estimatedEfforts: {
            label: 'Estimated Efforts',
            truncate: false,
            render: (poc) => (
                <Typography variant="body2">
                    {poc.estimatedEfforts !== null && poc.estimatedEfforts !== undefined
                        ? `${Math.round(parseFloat(poc.estimatedEfforts))} days`
                        : '-'
                    }
                </Typography>
            )
        },
        approvedBy: { label: 'Approved By', truncate: false },
        totalEfforts: {
            label: 'Total Efforts',
            truncate: false,
            render: (poc) => (
                <Typography variant="body2">
                    {poc.totalEfforts !== null && poc.totalEfforts !== undefined
                        ? `${Math.round(parseFloat(poc.totalEfforts))} days`
                        : '-'
                    }
                </Typography>
            )
        },

    }), [theme, editingRemark, remarkText]);

    // Optimized event handlers
    const handleOpen = React.useCallback(() => {
        const token = localStorage.getItem('authToken');
        if (!token || isTokenExpired(token)) {
            handleAutoLogout();
            return;
        }

        setOpen(true);
    }, [handleAutoLogout]);

    const handleClose = React.useCallback(() => {
        setOpen(false);
        validateToken();
    }, []);

    const handleEditOpen = React.useCallback((poc) => {
        const token = localStorage.getItem('authToken');
        if (!token || isTokenExpired(token)) {
            handleAutoLogout();
            return;
        }

        setPocToEdit(poc);
        setEditOpen(true);
    }, [handleAutoLogout]);


    const handleEditClose = React.useCallback(() => {
        setEditOpen(false);
        setPocToEdit(null);
        validateToken();
    }, []);
    const filteredData = React.useMemo(() => {
        if (!pocData.length) return [];

        return pocData.filter(poc => {
            // Global search filter with debounced term
            const matchesGlobalSearch =
                !debouncedSearchTerm ||
                Object.keys(poc).some(key => {
                    const value = poc[key];
                    return value &&
                        value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase());
                });

            // Column filters
            const matchesColumnFilters = Object.entries(columnFilters).every(([column, filterValue]) => {
                if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return true;

                const pocValue = poc[column];
                if (pocValue === null || pocValue === undefined) return false;

                if (column === 'status' && Array.isArray(filterValue)) {
                    return filterValue.includes(pocValue);
                }

                if (column === 'isBillable') {
                    if (filterValue === 'true') return pocValue === true;
                    if (filterValue === 'false') return pocValue === false;
                    return true;
                }

                if (column.includes('Date') && pocValue) {
                    const date = new Date(pocValue).toLocaleDateString();
                    return date.includes(filterValue);
                }

                return pocValue.toString().toLowerCase().includes(filterValue.toLowerCase());
            });

            return matchesGlobalSearch && matchesColumnFilters;
        });
    }, [pocData, debouncedSearchTerm, columnFilters]);
    const handleRowSelect = React.useCallback((pocId) => {
        setRowSelection(prev => ({
            ...prev,
            [pocId]: !prev[pocId]
        }));
    }, []);
    const paginatedData = React.useMemo(() => {
        return filteredData.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
        );
    }, [filteredData, page, rowsPerPage]);

    const handleSelectAllOnPage = React.useCallback(() => {
        const allSelectedOnPage = paginatedData.every(poc => rowSelection[poc.pocId]);
        const newSelection = { ...rowSelection };

        if (allSelectedOnPage) {
            paginatedData.forEach(poc => {
                delete newSelection[poc.pocId];
            });
        } else {
            paginatedData.forEach(poc => {
                newSelection[poc.pocId] = true;
            });
        }
        setRowSelection(newSelection);
    }, [paginatedData, rowSelection]);

    const handleDeselectAll = React.useCallback(() => {
        setRowSelection({});
    }, []);

    const getSelectedRows = React.useCallback(() => {
        return pocData.filter(poc => rowSelection[poc.pocId]);
    }, [pocData, rowSelection]);

    const handleChangePage = React.useCallback((event, newPage) => {
        setPage(newPage);
    }, []);

    const handleChangeRowsPerPage = React.useCallback((event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    }, []);

    const handleColumnFilterChange = React.useCallback((column, value) => {
        setColumnFilters(prev => ({
            ...prev,
            [column]: value
        }));
        setPage(0);
    }, []);

    const handleClearColumnFilter = React.useCallback((column) => {
        if (column === 'status') {
            handleColumnFilterChange(column, []);
        } else {
            handleColumnFilterChange(column, '');
        }
    }, [handleColumnFilterChange]);

    const handleClearAllFilters = React.useCallback(() => {
        const clearedFilters = Object.keys(columnFilters).reduce((acc, key) => {
            acc[key] = key === 'status' ? [] : '';
            return acc;
        }, {});
        setColumnFilters(clearedFilters);
        setSearchTerm('');
    }, [columnFilters]);

    const handleOpenFilterPopover = React.useCallback((event, column) => {
        setFilterAnchorEl(event.currentTarget);
        setCurrentFilterColumn(column);
    }, []);

    const handleCloseFilterPopover = React.useCallback(() => {
        setFilterAnchorEl(null);
        setCurrentFilterColumn('');
    }, []);

    const handleOpenExportMenu = React.useCallback((event) => {
        setExportMenuAnchor(event.currentTarget);
    }, []);

    const handleCloseExportMenu = React.useCallback(() => {
        setExportMenuAnchor(null);
    }, []);

    const handleOpenColumnMenu = React.useCallback((event) => {
        setColumnMenuAnchor(event.currentTarget);
    }, []);

    const handleCloseColumnMenu = React.useCallback(() => {
        setColumnMenuAnchor(null);
    }, []);

    const handleToggleColumn = React.useCallback((columnKey) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    }, []);

    const handleSelectAllColumns = React.useCallback(() => {
        const allTrue = Object.keys(visibleColumns).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {});
        setVisibleColumns(allTrue);
    }, [visibleColumns]);

    const handleDeselectAllColumns = React.useCallback(() => {
        const allFalse = Object.keys(visibleColumns).reduce((acc, key) => {
            acc[key] = false;
            return acc;
        }, {});
        allFalse.pocId = true;
        setVisibleColumns(allFalse);
    }, [visibleColumns]);

    const handleOpenStatusMenu = React.useCallback((event, poc) => {
        setEditingStatus(poc);
        setStatusMenuAnchor(event.currentTarget);
    }, []);

    const handleCloseStatusMenu = React.useCallback(() => {
        setEditingStatus(null);
        setStatusMenuAnchor(null);
    }, []);

    const handleStartEditRemark = React.useCallback((poc) => {
        setEditingRemark(poc);
        setRemarkText(poc.remark || '');
    }, []);

    const handleCancelEditRemark = React.useCallback(() => {
        setEditingRemark(null);
        setRemarkText('');
    }, []);

    const handleViewDetails = React.useCallback((poc) => {
        const token = localStorage.getItem('authToken');

        if (!token || isTokenExpired(token)) {
            handleAutoLogout();
            return;
        }

        setSelectedPoc(poc);
        setDetailDialogOpen(true); // ✅ CORRECT
    }, [handleAutoLogout]);




    const handleCloseDetails = React.useCallback(() => {
        setDetailDialogOpen(false);
        setSelectedPoc(null);
    }, []);

    const handleDeleteClick = React.useCallback((poc) => {
        const token = localStorage.getItem('authToken');

        if (!token || isTokenExpired(token)) {
            handleAutoLogout();
            return;
        }

        setPocToDelete(poc);
        setDeleteConfirmOpen(true);
    }, [handleAutoLogout]);


    // Fetch POC data with optimization
    const fetchPocData = React.useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            if (!token || isTokenExpired(token)) {
                handleAutoLogout();
                return;
            }

            const response = await axios.get(`${import.meta.env.VITE_API}/poc/sales/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Optimized sorting
            const sortedData = response.data.sort((a, b) => {
                const getTimestamp = (item) => {
                    return new Date(
                        item.updatedAt ||
                        item.createdAt ||
                        item.startDate ||
                        0
                    ).getTime();
                };
                return getTimestamp(b) - getTimestamp(a);
            });

            setPocData(sortedData);
        } catch (error) {
            console.error('Error fetching Usecase data:', error);
            showSnackbar('Failed to fetch Usecase data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial data fetch
    React.useEffect(() => {
        fetchPocData();
    }, [fetchPocData]);

    // Memoized filtered data calculation


    // Memoized paginated data

    // Helper functions
    const validateToken = React.useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (!token || isTokenExpired(token)) {
            handleAutoLogout();
            return;
        }


        try {
            await axios.get(`${import.meta.env.VITE_API}/poc/api/auth/validate`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            if (error.response?.status === 401) {
                handleLogout();
            }
        }
    }, []);



    const showSnackbar = React.useCallback((message, severity) => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const handleCloseSnackbar = React.useCallback(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    const handleDeleteConfirm = React.useCallback(async () => {
        if (!pocToDelete) return;

        try {
            const token = localStorage.getItem('authToken');
            if (!token || isTokenExpired(token)) {
                handleAutoLogout();
                return;
            }

            await axios.delete(`${import.meta.env.VITE_API}/poc/sales/delete/${pocToDelete.pocId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setPocData(prevData => prevData.filter(item => item.pocId !== pocToDelete.pocId));
            showSnackbar('Usecase record deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting Usecase:', error);
            showSnackbar('Failed to delete Usecase record', 'error');
        } finally {
            setDeleteConfirmOpen(false);
            setPocToDelete(null);
        }
    }, [pocToDelete, showSnackbar]);

    const handleDeleteCancel = React.useCallback(() => {
        setDeleteConfirmOpen(false);
        setPocToDelete(null);
    }, []);

    const handleStatusChange = React.useCallback(async (poc, newStatus) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token || isTokenExpired(token)) {
                handleAutoLogout();
                return;
            }

            await axios.put(`${import.meta.env.VITE_API}/poc/sales/updateStatus/${poc.pocId}`,
                { status: newStatus },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

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
    }, [showSnackbar]);

    const handleRemarkUpdate = React.useCallback(async (poc, newRemark) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token || isTokenExpired(token)) {
                handleAutoLogout();
                return;
            }

            await axios.put(`${import.meta.env.VITE_API}/poc/sales/updateRemark/${poc.pocId}`,
                { remark: newRemark },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

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
    }, [showSnackbar]);

    // Export functions
    const exportToCSV = React.useCallback((data, filename) => {
        if (!data || data.length === 0) return;

        const columnsToExport = Object.entries(columnConfig);
        const headers = columnsToExport.map(([key, config]) => config.label);

        const csvData = data.map(poc => {
            return columnsToExport.map(([key, config]) => {
                let value = poc[key];

                if (config.render) {
                    if (key === 'status') {
                        return poc.status || 'Draft';
                    } else if (key === 'isBillable') {
                        return poc.isBillable === true || poc.isBillable === 'Yes' ? 'Yes' : 'No';
                    } else if (key === 'remark') {
                        return poc.remark || '';
                    } else if (key === 'pocId') {
                        return poc.pocId;
                    } else if (key === 'totalWorkedHours') {
                        const hours = poc.totalWorkedHours;
                        if (hours === null || hours === undefined || hours === '') return '';
                        const totalHours = parseFloat(hours);
                        if (isNaN(totalHours)) return '';
                        const wholeHours = Math.floor(totalHours);
                        const minutes = Math.round((totalHours - wholeHours) * 60);
                        return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
                    }
                }

                if (key.includes('Date') && value) {
                    return formatDate(value);
                }

                if (value === null || value === undefined) return '';
                return value.toString();
            });
        });

        const csvContent = [
            headers,
            ...csvData
        ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [columnConfig]);

    const handleExportSelected = React.useCallback(() => {
        const selectedRows = getSelectedRows();
        if (selectedRows.length === 0) {
            showSnackbar('No rows selected for export', 'warning');
            return;
        }
        exportToCSV(selectedRows, `selected-usecases-${new Date().toISOString().split('T')[0]}.csv`);
        setExportMenuAnchor(null);
        showSnackbar(`Exported ${selectedRows.length} rows to CSV with all columns`, 'success');
    }, [getSelectedRows, exportToCSV, showSnackbar]);

    const handleExportAll = React.useCallback(() => {
        exportToCSV(filteredData, `all-usecases-${new Date().toISOString().split('T')[0]}.csv`);
        setExportMenuAnchor(null);
        showSnackbar(`Exported all ${filteredData.length} rows to CSV with all columns`, 'success');
    }, [filteredData, exportToCSV, showSnackbar]);

    const handleExportPage = React.useCallback(() => {
        exportToCSV(paginatedData, `page-usecases-${new Date().toISOString().split('T')[0]}.csv`);
        setExportMenuAnchor(null);
        showSnackbar(`Exported page ${page + 1} rows to CSV with all columns`, 'success');
    }, [paginatedData, exportToCSV, page, showSnackbar]);

    // Utility functions
    const getStatusColor = React.useCallback((status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return { muiColor: 'success' };
            case 'in progress': return { muiColor: 'warning' };
            case 'pending': return { muiColor: 'secondary' };
            case 'dropped': return { muiColor: 'error' };
            case 'draft': return { muiColor: 'default' };
            case 'awaiting': return { muiColor: 'info' };
            case 'hold': return { customColor: 'yellow', textColor: 'black' };
            case 'closed': return { customColor: 'cyan', textColor: 'black' };
            case 'converted': return { customColor: 'lawngreen', textColor: 'black' };
            case 'live': return { customColor: 'Lime', textColor: 'black' };
            default: return { muiColor: 'default' };
        }
    }, []);

    const getBillableChip = React.useCallback((isBillable) => {
        return (
            <Chip
                label={isBillable ? 'Billable' : 'Non-Billable'}
                color={isBillable ? 'success' : 'default'}
                size="small"
            />
        );
    }, []);

    const formatDate = React.useCallback((dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    }, []);

    const truncateText = React.useCallback((text, maxLength = 30) => {
        if (!text) return '-';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }, []);

    const getUniqueValues = React.useCallback((column) => {
        return [...new Set(pocData
            .map(item => item[column])
            .filter(value => value !== undefined && value !== null && value !== '')
        )].sort();
    }, [pocData]);

    const hasActiveFilters = React.useCallback(() => {
        return searchTerm || Object.values(columnFilters).some(value =>
            (Array.isArray(value) && value.length > 0) ||
            (!Array.isArray(value) && value !== '')
        );
    }, [searchTerm, columnFilters]);

    const hasSelectedRows = Object.keys(rowSelection).some(key => rowSelection[key]);

    const themeNew = React.useMemo(() => createTheme({
        palette: {
            yellow: {
                main: yellowColor[500],
                light: yellowColor[300],
                dark: yellowColor[700],
                contrastText: '#000',
            },
        },
    }), []);

    return (
        <Box
            sx={{
                pointerEvents: logoutInProgress.current ? 'none' : 'auto',
                opacity: logoutInProgress.current ? 0.6 : 1
            }}
        >
            {/* App Bar */}
            <AppBar position="static" elevation={1} sx={{ bgcolor: theme.palette.primary.main }}>
                <Toolbar>
                    <Button
                        color="inherit"
                        onClick={() => safeNavigate('dashboard')}
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
                        Code/Id Management
                    </Typography>
                    <Typography variant="body2" color="inherit" sx={{ mr: 2 }}>
                        Welcome, {user?.emp_name}
                        {user?.emp_id && ` (${user.emp_id})`}
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

                            <Button
                                variant="outlined"
                                startIcon={<ViewColumnIcon />}
                                onClick={handleOpenExportMenu}
                                size="small"
                                disabled={!hasSelectedRows && filteredData.length === 0}
                            >
                                Export Options
                            </Button>

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
                                                <TableCell padding="checkbox" sx={{
                                                    backgroundColor: '#1976d2',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}>
                                                    <Checkbox
                                                        size="small"
                                                        checked={paginatedData.length > 0 && paginatedData.every(poc => rowSelection[poc.pocId])}
                                                        indeterminate={paginatedData.some(poc => rowSelection[poc.pocId]) && !paginatedData.every(poc => rowSelection[poc.pocId])}
                                                        onChange={handleSelectAllOnPage}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            color: 'white',
                                                            '&.Mui-checked': {
                                                                color: 'white',
                                                            }
                                                        }}
                                                    />
                                                </TableCell>

                                                {Object.entries(columnConfig).map(([key, config]) =>
                                                    visibleColumns[key] && (
                                                        <TableCell key={key} sx={{
                                                            whiteSpace: 'nowrap',
                                                            backgroundColor: '#1976d2',
                                                            color: 'white',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <span>{config.label}</span>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => handleOpenFilterPopover(e, key)}
                                                                    color={columnFilters[key] &&
                                                                        (Array.isArray(columnFilters[key]) ?
                                                                            columnFilters[key].length > 0 :
                                                                            columnFilters[key] !== '') ? 'primary' : 'default'}
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
                                                            </Box>

                                                            {columnFilters[key] &&
                                                                (Array.isArray(columnFilters[key]) ?
                                                                    columnFilters[key].length > 0 :
                                                                    columnFilters[key] !== '') && (
                                                                    <Box
                                                                        sx={{
                                                                            mt: 0.5,
                                                                            display: 'flex',
                                                                            flexWrap: 'wrap',
                                                                            gap: 0.5,
                                                                            maxHeight: 48,
                                                                            overflowY: 'auto',
                                                                        }}
                                                                    >
                                                                        {Array.isArray(columnFilters[key]) ? (
                                                                            columnFilters[key].map((statusValue) => (
                                                                                <Chip
                                                                                    key={statusValue}
                                                                                    label={statusValue}
                                                                                    size="small"
                                                                                    onDelete={() => {
                                                                                        const updatedStatus = columnFilters[key].filter(
                                                                                            (s) => s !== statusValue
                                                                                        );
                                                                                        handleColumnFilterChange(key, updatedStatus);
                                                                                    }}
                                                                                    sx={{
                                                                                        backgroundColor: 'white',
                                                                                        color: '#1976d2',
                                                                                    }}
                                                                                />
                                                                            ))
                                                                        ) : (
                                                                            <Chip
                                                                                label={columnFilters[key]}
                                                                                size="small"
                                                                                onDelete={() => handleClearColumnFilter(key)}
                                                                                sx={{
                                                                                    backgroundColor: 'white',
                                                                                    color: '#1976d2',
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </Box>
                                                                )}
                                                        </TableCell>
                                                    )
                                                )}
                                                <TableCell sx={{
                                                    whiteSpace: 'nowrap',
                                                    backgroundColor: '#1976d2',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}>
                                                    Actions
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedData.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={Object.keys(visibleColumns).filter(k => visibleColumns[k]).length + 2} align="center" sx={{ py: 3 }}>
                                                        <Typography variant="body1" color="textSecondary">
                                                            {searchTerm || Object.values(columnFilters).some(f => f)
                                                                ? 'No matching Usecase codes found'
                                                                : 'No Usecase codes available. Click "Create Usecase" to get started.'}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedData.map((poc) => (
                                                    <TableRowMemo
                                                        key={poc.pocId}
                                                        poc={poc}
                                                        visibleColumns={visibleColumns}
                                                        columnConfig={columnConfig}
                                                        rowSelection={rowSelection}
                                                        theme={theme}
                                                        handleRowSelect={handleRowSelect}
                                                        handleViewDetails={handleViewDetails}
                                                        handleEditOpen={handleEditOpen}
                                                        handleDeleteClick={handleDeleteClick}
                                                        editingRemark={editingRemark}
                                                        remarkText={remarkText}
                                                        handleStartEditRemark={handleStartEditRemark}
                                                        handleRemarkUpdate={handleRemarkUpdate}
                                                        handleCancelEditRemark={handleCancelEditRemark}
                                                        truncateText={truncateText}
                                                        formatDate={formatDate}
                                                        handleOpenStatusMenu={handleOpenStatusMenu}
                                                        getStatusColor={getStatusColor}
                                                    />
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

            {/* Export Menu */}
            <Menu
                anchorEl={exportMenuAnchor}
                open={Boolean(exportMenuAnchor)}
                onClose={handleCloseExportMenu}
            >
                <MenuItem
                    onClick={handleExportSelected}
                    disabled={!hasSelectedRows}
                >
                    <ListItemText
                        primary="Export Selected Rows"
                        secondary={hasSelectedRows ? `${getSelectedRows().length} rows selected` : 'No rows selected'}
                    />
                </MenuItem>
                <MenuItem onClick={handleExportPage}>
                    <ListItemText
                        primary="Export Current Page"
                        secondary={`${paginatedData.length} rows`}
                    />
                </MenuItem>
                <MenuItem onClick={handleExportAll}>
                    <ListItemText
                        primary="Export All Data"
                        secondary={`${filteredData.length} rows - ${Object.keys(columnConfig).length} columns`}
                    />
                </MenuItem>
                {hasSelectedRows && (
                    <MenuItem onClick={handleDeselectAll}>
                        <ListItemText primary="Clear Selection" />
                    </MenuItem>
                )}
            </Menu>

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

                    {currentFilterColumn === 'status' ? (
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                multiple
                                value={columnFilters.status}
                                onChange={(e) => handleColumnFilterChange('status', e.target.value)}
                                input={<OutlinedInput label="Status" />}
                                renderValue={(selected) => selected.length === 0 ? 'All Statuses' : selected.join(', ')}
                            >
                                {getUniqueValues('status')
                                    .filter(value => value && value.trim() !== '')
                                    .map(value => (
                                        <MenuItem key={value} value={value}>
                                            <Checkbox checked={columnFilters.status.indexOf(value) > -1} />
                                            <ListItemText primary={value} />
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    ) : currentFilterColumn === 'isBillable' ? (
                        <FormControl fullWidth size="small">
                            <InputLabel>Billable Status</InputLabel>
                            <Select
                                value={columnFilters.isBillable}
                                onChange={(e) => handleColumnFilterChange('isBillable', e.target.value)}
                                input={<OutlinedInput label="Billable Status" />}
                            >
                                <MenuItem value="">
                                    <em>All</em>
                                </MenuItem>
                                <MenuItem value="true">Billable</MenuItem>
                                <MenuItem value="false">Non-Billable</MenuItem>
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
                            disabled={
                                currentFilterColumn === 'status' ?
                                    columnFilters.status.length === 0 :
                                    !columnFilters[currentFilterColumn]
                            }
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
                {statusOptions.map((status) => {
                    const { muiColor, customColor, textColor } = getStatusColor(status);
                    return (
                        <MenuItem
                            key={status}
                            onClick={() => handleStatusChange(editingStatus, status)}
                            selected={editingStatus?.status === status}
                        >
                            <Chip
                                label={status}
                                size="small"
                                color={muiColor}
                                sx={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    ...(customColor && { backgroundColor: customColor, color: textColor || '#fff' })
                                }}
                            />
                        </MenuItem>
                    );
                })}
            </Menu>

            {/* Modals and Dialogs */}
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="lg"
                fullWidth
            >
                <DialogContent dividers>
                    <SalesPrjId
                        onClose={handleClose}
                        onSuccess={() => {
                            handleClose();
                            setPage(0);
                            fetchPocData();
                            showSnackbar('Usecase record created successfully', 'success');
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog
                open={editOpen}
                onClose={handleEditClose}
                maxWidth="lg"
                fullWidth
            >
                <DialogContent dividers>
                    <SalesPrjIdEdit
                        poc={pocToEdit}
                        onClose={handleEditClose}
                        onSuccess={() => {
                            handleEditClose();
                            setPage(0);
                            fetchPocData();
                            showSnackbar('Usecase record updated successfully', 'success');
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog
                open={detailDialogOpen}
                onClose={handleCloseDetails}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { minHeight: '60vh' }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'primary.main',
                    color: 'white'
                }}>
                    <Typography variant="h6">
                        Usecase Details - {selectedPoc?.pocId}
                    </Typography>
                    <IconButton
                        onClick={handleCloseDetails}
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {selectedPoc ? (
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 3
                        }}>
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
                            <DetailItem
                                label="Billable"
                                value={
                                    selectedPoc.isBillable === null ? 'Not Specified' :
                                        (selectedPoc.isBillable === true || selectedPoc.isBillable === 'Yes' ? 'Yes' : 'No')
                                }
                            />
                            <DetailItem label="Tags" value={selectedPoc.tags || '-'} />
                            <DetailItem label="Assigned To" value={selectedPoc.assignedTo} />
                            <DetailItem label="Created By" value={selectedPoc.createdBy} />
                            <DetailItem label="Start Date" value={formatDate(selectedPoc.startDate)} />
                            <DetailItem label="End Date" value={formatDate(selectedPoc.endDate)} />
                            <DetailItem label="Actual Start Date" value={formatDate(selectedPoc.actualStartDate)} />
                            <DetailItem label="Actual End Date" value={formatDate(selectedPoc.actualEndDate)} />
                            <DetailItem
                                label="Estimated Efforts"
                                value={
                                    selectedPoc.estimatedEfforts !== null && selectedPoc.estimatedEfforts !== undefined
                                        ? `${Math.round(parseFloat(selectedPoc.estimatedEfforts))} days`
                                        : '-'
                                }
                            />
                            <DetailItem label="Approved By" value={selectedPoc.approvedBy || '-'} />
                            <DetailItem
                                label="Total Efforts"
                                value={
                                    selectedPoc.totalEfforts
                                        ? `${Math.round(parseFloat(selectedPoc.totalEfforts))} days`
                                        : '-'
                                }
                            />

                            <DetailItem
                                label="Worked Hours"
                                value={selectedPoc.totalWorkedHours ? parseFloat(selectedPoc.totalWorkedHours).toFixed(2) : '-'}
                            />
                            <DetailItem label="Remark" value={selectedPoc.remark || '-'} />
                            <Box sx={{ gridColumn: '1 / -1' }}>
                                <DetailItem
                                    label="Status"
                                    value={selectedPoc.status || 'Draft'}
                                    render={(value) => (
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <ThemeProvider theme={themeNew}>
                                                <Chip
                                                    label={value}
                                                    color={getStatusColor(value).muiColor || 'default'}
                                                    size="medium"
                                                    sx={{
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            opacity: 0.8
                                                        }
                                                    }}
                                                />
                                            </ThemeProvider>
                                        </Box>
                                    )}
                                />
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 200
                        }}>
                            <Typography variant="h6" color="textSecondary">
                                No data available
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={handleCloseDetails}
                        variant="contained"
                        color="primary"
                    >
                        Close
                    </Button>
                </DialogActions>
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

            {/* Snackbar */}
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

export default React.memo(SalesTable);