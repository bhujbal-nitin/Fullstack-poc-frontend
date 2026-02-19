import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    Button,
    Typography,
    Chip,
    IconButton,
    Badge,
    Box,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert,
    Tooltip,
    Popover,
    FormControl,
    InputLabel,
    Select,
    OutlinedInput,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    LinearProgress
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    MenuBook as MenuBookIcon,
    Notifications as NotificationsIcon,
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Clear as ClearIcon,
    CloudUpload as UploadIcon,
    CloudDownload as DownloadIcon,
    AttachFile as FileIcon,
    Delete as DeleteIcon,
    Folder as FolderIcon,
    InsertDriveFile as InsertDriveFileIcon,
    Error as ErrorIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const KnowledgeBase = ({ onNavigate, onLogout, user }) => {
    const [usecases, setUsecases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    // Add this near other state declarations
    const [fileFilter, setFileFilter] = useState('all'); // 'all', 'withFiles', 'withoutFiles'

    // Column filters state
    const [columnFilters, setColumnFilters] = useState({
        usecaseId: '',
        clientName: '',
        partnerName: '',
        usecaseName: '',
        description: '',  // ✅ NEW
        tag: '',
        status: ''
    });

    // Filter popover state
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [currentFilterColumn, setCurrentFilterColumn] = useState('');

    // Upload/Download dialog states
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
    const [selectedUsecase, setSelectedUsecase] = useState(null);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
    const [uploadResults, setUploadResults] = useState([]);
    const isFetching = useRef(false);
    const [downloadingFileId, setDownloadingFileId] = useState(null);

    const logoutInProgress = useRef(false);
    const lastActivity = useRef(Date.now());
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes


    useEffect(() => {
        fetchUsecases();
        // Remove setPage(0) from here - it's handled by the new useEffect above
    }, [search, fileFilter,
        columnFilters.usecaseId, columnFilters.clientName,
        columnFilters.partnerName, columnFilters.usecaseName, columnFilters.status]);

    useEffect(() => {
        files.forEach(f => {
            if (!f.id) {
                console.warn('⚠️ File missing id:', f);
            }
        });
    }, [files]);


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

    // Periodic token expiry check
    useEffect(() => {
        const interval = setInterval(() => {
            const token = localStorage.getItem('authToken');
            if (token && isTokenExpired(token)) {
                handleAutoLogout();
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [handleAutoLogout, isTokenExpired]);

    // Inactivity tracking
    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'mousemove'];
        events.forEach(event => {
            window.addEventListener(event, updateActivity);
        });

        const interval = setInterval(() => {
            if (Date.now() - lastActivity.current > INACTIVITY_TIMEOUT) {
                handleAutoLogout();
            }
        }, 60000); // Check every minute

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, updateActivity);
            });
            clearInterval(interval);
        };
    }, [handleAutoLogout, updateActivity]);

    // Session expiry check
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

    const safeNavigate = (route) => {
        const token = localStorage.getItem('authToken');
        if (!token || isTokenExpired(token)) {
            handleAutoLogout();
            return;
        }
        onNavigate(route);
    };

    const fetchUsecases = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            if (!token || isTokenExpired(token)) {
                handleAutoLogout();
                return;
            }

            // Build query params with cache buster
            const params = new URLSearchParams({
                search: search,
                _: Date.now() // Add timestamp to prevent caching
            });

            console.log('Fetching ALL usecases...');

            const response = await fetch(
                `${import.meta.env.VITE_API}/poc/knowledgeBaseUsecases?${params}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                }
            );

            if (response.status === 401 || response.status === 403) {
                handleAutoLogout();
                return;
            }

            const data = await response.json();
            console.log('API Response total records:', data.data?.length);

            if (data.success) {
                setUsecases(data.data || []);
                setTotal(data.data?.length || 0);
            } else {
                setError(data.message || 'Failed to fetch data');
            }
        } catch (error) {
            console.error('Error fetching usecases:', error);
            setError(error.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };



    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setPage(0);
    };

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token || isTokenExpired(token)) {
            handleAutoLogout();
        }
    }, [handleAutoLogout]);

    // Column configuration
    const columnConfig = {
        usecaseId: {
            label: 'Usecase ID',
            truncate: false,
            render: (usecase) => usecase['Usecase Id']
        },
        clientName: {
            label: 'Client Name',
            truncate: 15
        },
        partnerName: {
            label: 'Partner Name',
            truncate: 20
        },
        usecaseName: {
            label: 'Usecase Name',
            truncate: 20
        },
        description: {  // ✅ NEW COLUMN
            label: 'Description',
            truncate: 30  // Truncate after 30 characters
        },
        tag: {  // ✅ NEW COLUMN
            label: 'Tag',
            truncate: false,
            render: (usecase) => {
                const tag = usecase.tag || usecase['Tag'] || 'N/A';
                return (
                    <Chip
                        label={tag}
                    // size="small"

                    />
                );
            }
        },
        status: {
            label: 'Status',
            truncate: false,
            render: (usecase) => {
                const status = usecase.status || 'N/A';
                return (
                    <Chip
                        label={status}
                        size="small"
                        sx={{
                            bgcolor:
                                status === 'Completed' ? '#4caf50' :
                                    status === 'In Progress' ? '#2196f3' :
                                        status === 'Pending' ? '#ff9800' : '#9e9e9e',
                            color: 'white',
                            fontWeight: 'bold'
                        }}
                    />
                );
            }
        },
        knowledgeMaterial: {
            label: 'Knowledge Material',
            truncate: false,
            render: (usecase) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleUploadClick(usecase)}
                        startIcon={<UploadIcon />}
                    >
                        Upload
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleDownloadClick(usecase)}
                        startIcon={<DownloadIcon />}
                        disabled={!hasFiles(usecase)}
                    >
                        Download
                    </Button>
                </Box>
            )
        }
    };

    const token = localStorage.getItem('authToken');
    if (!token || isTokenExpired(token)) {
        handleAutoLogout();
        return;
    }
    // Upload/Download handlers
    const handleUploadClick = (usecase) => {
        setSelectedUsecase(usecase);
        setSelectedFiles([]);
        setUploadResults([]);
        setUploadDialogOpen(true);
    };

    const handleDownloadClick = async (usecase) => {
        setSelectedUsecase(usecase);
        setDownloadDialogOpen(true); // Show dialog immediately
        setFiles([]); // Clear previous files

        try {
            const token = localStorage.getItem('authToken');
            if (!token || isTokenExpired(token)) {
                handleAutoLogout();
                setDownloadDialogOpen(false);
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_API}/poc/knowledgeBaseFiles/${usecase['Usecase Id']}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setFiles(data.files || []);
                }
            }
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    };

    const handleUploadClose = () => {
        setUploadDialogOpen(false);
        setSelectedUsecase(null);
        setSelectedFiles([]);
        setUploadResults([]);
        setUploadProgress({});
    };

    const handleDownloadClose = () => {
        setDownloadDialogOpen(false);
        setSelectedUsecase(null);
        setFiles([]);
    };

    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files);
        setSelectedFiles(prev => [...prev, ...selectedFiles]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // In handleUpload function, replace with:
    const handleUpload = async () => {
        if (!selectedFiles.length || !selectedUsecase) return;

        setUploading(true);
        setUploadResults([]);

        const token = localStorage.getItem('authToken');
        if (!token || isTokenExpired(token)) {
            handleAutoLogout();
            return;
        }

        const formData = new FormData();
        formData.append('usecaseId', selectedUsecase['Usecase Id']);
        formData.append('uploadedBy', user?.emp_name || user?.email_id || 'Unknown');
        formData.append('uploadedById', user?.emp_id || 'Unknown');

        // Append all files
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch(`${import.meta.env.VITE_API}/poc/uploadKnowledgeMaterials`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                // Map results to show each file
                const results = data.results || [];
                setUploadResults(results);

                // Refresh the usecases list
                fetchUsecases();

                // Auto-close dialog after 1 second if all files uploaded successfully
                if (results.every(r => r.success)) {
                    setTimeout(() => {
                        handleUploadClose();
                    }, 1000); // 1 second delay
                }
            } else {
                setUploadResults([{
                    success: false,
                    fileName: 'Multiple files',
                    message: data.message || 'Upload failed'
                }]);
            }
        } catch (error) {
            console.error('Upload error:', error);
            setUploadResults([{
                success: false,
                fileName: 'Multiple files',
                message: 'Network error'
            }]);
        } finally {
            setUploading(false);
        }
    };


    const handleDownloadFile = async (file) => {
        if (!file || !file.id) {
            console.error('❌ Invalid file object (missing id):', file);
            alert('Invalid file selected for download');
            return;
        }

        setDownloadingFileId(file.id); // Start loading for this file

        try {
            const token = localStorage.getItem('authToken');
            if (!token || isTokenExpired(token)) {
                handleAutoLogout();
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_API}/poc/downloadKnowledgeMaterial/${file.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = file.file_name || 'download';
            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('❌ Download failed:', error);
            alert('Failed to download file');
        } finally {
            setDownloadingFileId(null); // Stop loading
        }
    };




    const hasFiles = (usecase) => {
        // Check if usecase has files from the backend data
        const hasFilesFromBackend = usecase.hasFiles === true;

        // Also check if we just uploaded files for this usecase
        const justUploaded = selectedUsecase &&
            selectedUsecase['Usecase Id'] === usecase['Usecase Id'] &&
            uploadResults.length > 0 &&
            uploadResults.every(r => r.success);

        return hasFilesFromBackend || justUploaded;
    };

    // Handle column filter change
    const handleColumnFilterChange = (column, value) => {
        setColumnFilters(prev => ({
            ...prev,
            [column]: value
        }));
        setPage(0);
    };

    // Clear specific column filter
    const handleClearColumnFilter = (column) => {
        handleColumnFilterChange(column, '');
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

    // Filter data based on search, column filters, and file filter
    const filteredData = usecases.filter(usecase => {
        // Global search filter
        const matchesGlobalSearch = !search ||
            usecase['Usecase Id']?.toLowerCase().includes(search.toLowerCase()) ||
            usecase['Client Name']?.toLowerCase().includes(search.toLowerCase()) ||
            usecase['Partner Name']?.toLowerCase().includes(search.toLowerCase()) ||
            usecase['Usecase Name']?.toLowerCase().includes(search.toLowerCase()) ||
            usecase.description?.toLowerCase().includes(search.toLowerCase()) ||  // ✅ NEW
            usecase.tag?.toLowerCase().includes(search.toLowerCase()) ||          // ✅ NEW
            usecase.status?.toLowerCase().includes(search.toLowerCase());

        // Column filters
        const matchesColumnFilters = Object.entries(columnFilters).every(([column, filterValue]) => {
            if (!filterValue) return true;

            let pocValue;
            switch (column) {
                case 'usecaseId': pocValue = usecase['Usecase Id']; break;
                case 'clientName': pocValue = usecase['Client Name']; break;
                case 'partnerName': pocValue = usecase['Partner Name']; break;
                case 'usecaseName': pocValue = usecase['Usecase Name']; break;
                case 'description': pocValue = usecase.description; break;      // ✅ NEW
                case 'tag': pocValue = usecase.tag; break;
                case 'status': pocValue = usecase.status; break;
                default: pocValue = '';
            }

            if (pocValue === null || pocValue === undefined) return false;
            return pocValue.toString().toLowerCase().includes(filterValue.toLowerCase());
        });

        // File filter
        const matchesFileFilter =
            fileFilter === 'all' ||
            (fileFilter === 'withFiles' && hasFiles(usecase)) ||
            (fileFilter === 'withoutFiles' && !hasFiles(usecase));

        return matchesGlobalSearch && matchesColumnFilters && matchesFileFilter;
    });

    // Apply pagination to filtered data
    const paginatedData = filteredData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // Get unique values for filter dropdowns
    const getUniqueValues = (column) => {
        let values = [];
        switch (column) {
            case 'status':
                values = usecases.map(item => item.status).filter((value, index, self) =>
                    value && self.indexOf(value) === index
                );
                break;
            default:
                const columnKey = column === 'usecaseId' ? 'Usecase Id' :
                    column === 'clientName' ? 'Client Name' :
                        column === 'partnerName' ? 'Partner Name' :
                            column === 'usecaseName' ? 'Usecase Name' : ''
                column === 'description' ? 'description' :  // ✅ NEW
                    column === 'tag' ? 'tag' : '';


                values = usecases.map(item => item[columnKey]).filter((value, index, self) =>
                    value && self.indexOf(value) === index
                );
        }
        return values.sort();
    };

    // Check if any filters are active
    const hasActiveFilters = () => {
        return search || fileFilter !== 'all' || Object.values(columnFilters).some(value => value !== '');
    };

    // Clear all filters
    const handleClearAllFilters = () => {
        setColumnFilters({
            usecaseId: '',
            clientName: '',
            partnerName: '',
            usecaseName: '',
            description: '',  // ✅ NEW
            tag: '',
            status: ''
        });
        setSearch('');
        setFileFilter('all'); // Reset file filter
    };

    const truncateText = (text, maxLength = 30) => {
        if (!text) return '-';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    if (logoutInProgress.current) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Typography>Session expired. Redirecting to login...</Typography>
            </Container>
        );
    }

    if (logoutInProgress.current) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Typography>Session expired. Redirecting to login...</Typography>
            </Container>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            {/* Header */}
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
                        onClick={() => safeNavigate('dashboard')}
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

                    <MenuBookIcon sx={{ mr: 2, fontSize: 32 }} />

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
                        📚 Knowledge Base
                        <Chip
                            label="RESOURCES"
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
                            label={`👋 Welcome, ${user?.emp_name || user?.email_id || 'User'} (${user?.emp_id})`}
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

            {/* Main Content */}
            <Container maxWidth={false} disableGutters sx={{ px: 2, py: 2 }}>
                {/* Search Box */}
                <Paper elevation={2} sx={{ p: 1, mb: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search by Usecase ID, Client Name, Partner Name, or Usecase Name..."
                            value={search}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {/* File Filter Dropdown */}
                        <FormControl sx={{ minWidth: 200 }} size="small">
                            <InputLabel>File Status</InputLabel>
                            <Select
                                value={fileFilter}
                                onChange={(e) => setFileFilter(e.target.value)}
                                label="File Status"
                                input={<OutlinedInput label="File Status" />}
                            >
                                <MenuItem value="all">All Usecases</MenuItem>
                                <MenuItem value="withFiles">With Uploaded Files</MenuItem>
                                <MenuItem value="withoutFiles">Without Files</MenuItem>
                            </Select>
                        </FormControl>

                        {hasActiveFilters() && (
                            <Button
                                variant="outlined"
                                startIcon={<ClearIcon />}
                                onClick={handleClearAllFilters}
                                size="small"
                            >
                                Clear Filters
                            </Button>
                        )}
                    </Box>
                </Paper>

                {/* Table Section */}
                <Paper
                    elevation={3}
                    sx={{
                        borderRadius: 2,
                        width: '100%',
                    }}
                >

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Alert severity="error" sx={{ m: 2 }}>
                            {error}
                        </Alert>
                    ) : (
                        <>
                            <TableContainer
                                sx={{
                                    width: '100%',
                                    overflowX: 'auto',
                                }}
                            >

                                <Table
                                    size="small"
                                    sx={{
                                        minWidth: 1200,
                                        '& .MuiTableCell-root': {
                                            padding: '6px 10px'
                                        }
                                    }}
                                >


                                    <TableHead sx={{ bgcolor: '#1976d2' }}>
                                        <TableRow>
                                            {Object.entries(columnConfig).map(([key, config]) => (
                                                <TableCell
                                                    key={key}
                                                    sx={{
                                                        whiteSpace: 'nowrap',
                                                        backgroundColor: '#1976d2',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        padding: '8px 12px', // Reduced padding
                                                        minWidth: key === 'usecaseId' ? '120px' :      // Adjust widths as needed
                                                            key === 'clientName' ? '150px' :
                                                                key === 'partnerName' ? '150px' :
                                                                    key === 'usecaseName' ? '200px' :
                                                                        key === 'description' ? '250px' :
                                                                            key === 'tag' ? '100px' :
                                                                                key === 'status' ? '120px' :
                                                                                    key === 'knowledgeMaterial' ? '200px' : 'auto'
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <span>{config.label}</span>
                                                        {key !== 'knowledgeMaterial' && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => handleOpenFilterPopover(e, key)}
                                                                color={columnFilters[key] ? 'primary' : 'default'}
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

                                                    {/* Show filter chip only when filter is applied */}
                                                    {columnFilters[key] && key !== 'knowledgeMaterial' && (
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
                                                            <Chip
                                                                label={columnFilters[key]}
                                                                size="small"
                                                                onDelete={() => handleClearColumnFilter(key)}
                                                                sx={{
                                                                    backgroundColor: 'white',
                                                                    color: '#1976d2',
                                                                }}
                                                            />
                                                        </Box>
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedData.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={Object.keys(columnConfig).length}
                                                    align="center"
                                                >
                                                    <Typography color="textSecondary">
                                                        No usecases found
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )
                                            : (
                                                paginatedData.map((usecase) => (
                                                    <TableRow key={usecase['Usecase Id']} hover>
                                                        {Object.entries(columnConfig).map(([key, config]) => (
                                                            <TableCell key={key} sx={{ whiteSpace: 'nowrap' }}>
                                                                {config.render ? (
                                                                    config.render(usecase)
                                                                ) : (
                                                                    <Tooltip title={usecase[key === 'usecaseId' ? 'Usecase Id' :
                                                                        key === 'clientName' ? 'Client Name' :
                                                                            key === 'partnerName' ? 'Partner Name' :
                                                                                key === 'usecaseName' ? 'Usecase Name' :
                                                                                    key === 'description' ? 'description' :  // ✅ Make sure this mapping exists
                                                                                        key === 'tag' ? 'tag' :
                                                                                            ''] || '-'}>
                                                                        <span>
                                                                            {config.truncate ?
                                                                                truncateText(usecase[key === 'usecaseId' ? 'Usecase Id' :
                                                                                    key === 'clientName' ? 'Client Name' :
                                                                                        key === 'partnerName' ? 'Partner Name' :
                                                                                            key === 'usecaseName' ? 'Usecase Name' :
                                                                                                key === 'description' ? 'description' :  // ✅ Add this
                                                                                                    key === 'tag' ? 'tag' :
                                                                                                        ''], config.truncate) :
                                                                                (usecase[key === 'usecaseId' ? 'Usecase Id' :
                                                                                    key === 'clientName' ? 'Client Name' :
                                                                                        key === 'partnerName' ? 'Partner Name' :
                                                                                            key === 'usecaseName' ? 'Usecase Name' :
                                                                                                key === 'description' ? 'description' :  // ✅ Add this
                                                                                                    key === 'tag' ? 'tag' :
                                                                                                        ''] || '-')
                                                                            }
                                                                        </span>
                                                                    </Tooltip>
                                                                )}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))
                                            )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <TablePagination
                                component="div"
                                count={filteredData.length} // Use filtered data count for pagination
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                            />
                        </>
                    )}
                </Paper>
            </Container>

            {/* Upload Dialog - Modified */}
            <Dialog open={uploadDialogOpen} onClose={handleUploadClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    Upload Knowledge Material
                    <Typography variant="subtitle2" color="textSecondary">
                        Usecase: {selectedUsecase?.['Usecase Id']} - {selectedUsecase?.['Usecase Name']}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                        {/* File Upload Area */}
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                cursor: 'pointer',
                                borderStyle: 'dashed',
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                }
                            }}
                            onClick={() => document.getElementById('file-input').click()}
                        >
                            <input
                                id="file-input"
                                type="file"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                                multiple
                            />
                            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Drop files here or click to browse
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Select multiple files of any type
                            </Typography>
                        </Paper>

                        {/* Selected Files List */}
                        {selectedFiles.length > 0 && (
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Selected Files ({selectedFiles.length})
                                </Typography>
                                <List dense>
                                    {selectedFiles.map((file, index) => {
                                        // Find upload result for this file
                                        const uploadResult = uploadResults.find(r =>
                                            r.fileName === file.name ||
                                            (r.originalFileName && r.originalFileName === file.name)
                                        );

                                        return (
                                            <ListItem
                                                key={index}
                                                secondaryAction={
                                                    uploadResult ? (
                                                        uploadResult.success ? (
                                                            <CheckCircleIcon color="success" fontSize="small" />
                                                        ) : (
                                                            <ErrorIcon color="error" fontSize="small" />
                                                        )
                                                    ) : (
                                                        <IconButton
                                                            edge="end"
                                                            onClick={() => removeFile(index)}
                                                            size="small"
                                                            disabled={uploading}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    )
                                                }
                                            >
                                                <ListItemIcon>
                                                    <InsertDriveFileIcon />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={file.name}
                                                    secondary={
                                                        uploadResult
                                                            ? uploadResult.message
                                                            : `${(file.size / 1024 / 1024).toFixed(2)} MB`
                                                    }
                                                    primaryTypographyProps={{
                                                        color: uploadResult
                                                            ? (uploadResult.success ? 'success.main' : 'error.main')
                                                            : 'inherit'
                                                    }}
                                                />
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            </Paper>
                        )}


                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleUploadClose} disabled={uploading}>
                        {uploadResults.length > 0 ? 'Close' : 'Cancel'}
                    </Button>
                    <Button
                        onClick={handleUpload}
                        variant="contained"
                        disabled={!selectedFiles.length || uploading || uploadResults.length > 0}
                        startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                    >
                        {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Download Dialog - Modified */}
            <Dialog open={downloadDialogOpen} onClose={handleDownloadClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    Knowledge Materials
                    <Typography variant="subtitle2" color="textSecondary">
                        Usecase: {selectedUsecase?.['Usecase Id']} - {selectedUsecase?.['Usecase Name']}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {files.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="textSecondary">
                                No knowledge materials available for this usecase.
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>File Name</TableCell>
                                        <TableCell>Size</TableCell>
                                        <TableCell>Upload Date</TableCell>
                                        <TableCell>Uploaded By</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {files.map((file) => (
                                        <TableRow key={file.id}>
                                            <TableCell>{file.file_name}</TableCell>
                                            <TableCell>
                                                {file.file_size_mb ? `${file.file_size_mb} MB` :
                                                    file.file_size ? `${(parseInt(file.file_size) / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {file.upload_date ? new Date(file.upload_date).toLocaleDateString() : 'N/A'}
                                            </TableCell>
                                            <TableCell>{file.uploaded_by || 'N/A'}</TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    onClick={() => handleDownloadFile(file)}
                                                    size="small"
                                                    disabled={!file.id || downloadingFileId === file.id}
                                                >
                                                    {downloadingFileId === file.id ? (
                                                        <CircularProgress size={20} />
                                                    ) : (
                                                        <DownloadIcon />
                                                    )}
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}


                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDownloadClose}>Close</Button>
                </DialogActions>
            </Dialog>

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
                                value={columnFilters.status}
                                onChange={(e) => handleColumnFilterChange('status', e.target.value)}
                                input={<OutlinedInput label="Status" />}
                            >
                                <MenuItem value="">
                                    <em>All Statuses</em>
                                </MenuItem>
                                {getUniqueValues('status')
                                    .filter(value => value && value.trim() !== '')
                                    .map(value => (
                                        <MenuItem key={value} value={value}>
                                            {value}
                                        </MenuItem>
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
        </Box>
    );
};

export default KnowledgeBase;