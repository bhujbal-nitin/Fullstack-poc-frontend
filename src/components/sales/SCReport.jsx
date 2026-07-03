import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SCUsecaseListDialog from "./SCUsecaseListDialog";
import { Bar, Pie } from "react-chartjs-2";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from "chart.js";
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Card,
    CardContent,
    Grid,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    useTheme,
    useMediaQuery,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Tab,
    FormControlLabel,
    Checkbox,
    TextField,
    MenuItem,
    Divider,
} from "@mui/material";
import {
    Dashboard as DashboardIcon,
    ExitToApp as LogoutIcon,
    TableChart as TableChartIcon,
    BarChart as BarChartIcon,
    Business as BusinessIcon,
    Category as CategoryIcon,
    Assessment as AssessmentIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    PlayArrow as PlayArrowIcon,
    HourglassEmpty as HourglassEmptyIcon,
    Pause as PauseIcon,
    Clear as ClearIcon,
    Download as DownloadIcon,
} from "@mui/icons-material";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    ChartDataLabels
);

// ─── Tab Panel ───────────────────────────────────────────────────────────────
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
        </div>
    );
}

// ─── StatCard – matches ReportSales StatCard exactly ─────────────────────────
const StatCard = ({ title, value, icon, color, subtitle, onClick }) => (
    <Card
        onClick={onClick}
        sx={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            height: '100%',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
                transform: onClick ? 'translateY(-4px)' : 'none',
                boxShadow: onClick ? '0 8px 30px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.1)',
            }
        }}>
        <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {value}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 'medium' }}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                <Box sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {icon}
                </Box>
            </Box>
        </CardContent>
    </Card>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const SCReport = ({ onNavigate, onLogout, user }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [activeTab, setActiveTab] = useState(0);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Matrix / chart data – Industry
    const [industries, setIndustries] = useState([]);
    const [pocTypes, setPocTypes] = useState([]);
    const [matrixData, setMatrixData] = useState({});
    const [industryChartData, setIndustryChartData] = useState(null);

    // Matrix / chart data – SME (assigned_to)
    const [smeList, setSmeList] = useState([]);
    const [smeMatrixData, setSmeMatrixData] = useState({});
    const [smeChartData, setSmeChartData] = useState(null);

    // Matrix / chart data – Sales Person
    const [salesPersonList, setSalesPersonList] = useState([]);
    const [salesPersonStatusList, setSalesPersonStatusList] = useState([]);
    const [salesPersonMatrixData, setSalesPersonMatrixData] = useState({});
    const [salesPersonChartData, setSalesPersonChartData] = useState({ labels: [], datasets: [] });

    const [clientTypePieChartData, setClientTypePieChartData] = useState(null);

    // Filter states
    const [pocTypeFilter, setPocTypeFilter] = useState("");
    const [clientTypeFilter, setClientTypeFilter] = useState({
        Client: true,
        Partner: true,
        Internal: true,
        Prospect: true
    });

    // Date Range States
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [dateRange, setDateRange] = useState("all");

    // Drill-down dialog states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogTitle, setDialogTitle] = useState("");
    const [dialogData, setDialogData] = useState([]);

    const logoutInProgress = useRef(false);
    const lastActivity = useRef(Date.now());
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

    // ── Auth helpers ──────────────────────────────────────────────────────────
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
        if (onLogout) onLogout();
    }, [onLogout]);

    const updateActivity = useCallback(() => {
        lastActivity.current = Date.now();
    }, []);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchInitialData = useCallback(async () => {
        const token = localStorage.getItem("authToken");
        if (!token || isTokenExpired(token)) {
            handleAutoLogout();
            return;
        }

        setLoading(true);
        setError("");

        try {
            const reportsResponse = await axios.get(
                `${import.meta.env.VITE_API}/poc/sc/getSCReports`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const reportsData = Array.isArray(reportsResponse.data) ? reportsResponse.data : [];
            setReports(reportsData);

            // Extract unique pocTypes and entityTypes from ALL data
            const uniquePocTypes = new Set();
            const uniqueEntityTypes = new Set(['Client', 'Partner', 'Internal', 'Prospect']);

            reportsData.forEach(r => {
                const pocType = r.pocType || r.poc_type || r.taskType || 'Unknown';
                uniquePocTypes.add(pocType);

                const entityType = r.partner_client_own;
                if (entityType) uniqueEntityTypes.add(entityType);
            });

            setPocTypes(Array.from(uniquePocTypes).sort());

            // Update clientTypeFilter to include any NEW types found in data
            setClientTypeFilter(prev => {
                const newFilter = { ...prev };
                let changed = false;
                uniqueEntityTypes.forEach(type => {
                    if (newFilter[type] === undefined) {
                        newFilter[type] = true;
                        changed = true;
                    }
                });
                return changed ? newFilter : prev;
            });

        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load report data. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    }, [handleAutoLogout, isTokenExpired]);

    // ── Filtering and Processing ───────────────────────────────────────────
    const filteredReports = useMemo(() => reports.filter(r => {
        // Filter by Client Type (Client, Partner, Internal, Prospect)
        const type = r.partner_client_own || 'Prospect';
        if (!clientTypeFilter[type]) return false;

        // Filter by Specific Usecase Type
        const pocType = r.pocType || r.poc_type || r.taskType || 'Unknown';
        if (pocTypeFilter && pocType !== pocTypeFilter) return false;

        // Filter by Date Range
        const reportDate = r.start_date;
        if (reportDate) {
            const date = new Date(reportDate);
            if (startDate && date < new Date(startDate)) return false;
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (date > end) return false;
            }
        }

        return true;
    }), [reports, clientTypeFilter, pocTypeFilter, startDate, endDate]);

    const completedIncludingConverted = filteredReports.filter(r => {
        const status = r.status?.toLowerCase() || '';
        return status.includes('completed') || status.includes('done') || status.includes('success') || status.includes('converted');
    }).length;

    const convertedCount = filteredReports.filter(r => {
        const status = r.status?.toLowerCase() || '';
        return status.includes('converted');
    }).length;

    const inProgressPocs = filteredReports.filter(r => {
        const status = r.status?.toLowerCase() || '';
        return status.includes('progress') || status.includes('ongoing');
    }).length;

    const awaitingPocs = filteredReports.filter(r => {
        const status = r.status?.toLowerCase() || '';
        return status.includes('awaiting') || status.includes('pending') || status.includes('waiting') || status.includes('planned');
    }).length;

    const holdPocs = filteredReports.filter(r => {
        const status = r.status?.toLowerCase() || '';
        return status.includes('hold');
    }).length;

    const conversionRate = completedIncludingConverted > 0
        ? Math.round((convertedCount / completedIncludingConverted) * 100)
        : 0;

    useEffect(() => {
        if (reports.length === 0) return;

        // ── Build matrix from FILTERED data ──────────────────────────────
        const predefinedIndustries = [
            'BFSI', 'IT', 'Logistics', 'Manufacturing',
            'Real Estate', 'Retail and E-commerce',
            'Shipping', 'Telecommunications', 'Healthcare',
            'Education',
            'Media & Entertainment', 'Govt Authorities',
            'Airline', 'Other'
        ];
        const uniqueIndustries = new Set(predefinedIndustries);

        filteredReports.forEach(r => {
            let industry = r.industryType || r.industry_type || r.industry;
            if (industry === 'Professional Training &Coaching') {
                industry = 'Professional Training & Coaching';
            }
            if (industry) uniqueIndustries.add(industry);
        });

        const industriesList = Array.from(uniqueIndustries).sort();
        setIndustries(industriesList);

        // counts[industry][pocType]
        const counts = {};
        industriesList.forEach(ind => {
            counts[ind] = {};
            pocTypes.forEach(pt => { counts[ind][pt] = 0; });
            counts[ind]['Total'] = 0;
        });
        counts['Grand Total'] = {};
        pocTypes.forEach(pt => { counts['Grand Total'][pt] = 0; });
        counts['Grand Total']['Total'] = 0;

        filteredReports.forEach(r => {
            let industry = r.industryType || r.industry_type || r.industry;
            if (industry === 'Professional Training &Coaching') {
                industry = 'Professional Training & Coaching';
            }
            if (!industry) industry = 'Unknown';
            const pocType = r.pocType || r.poc_type || r.taskType || 'Unknown';

            if (counts[industry] && counts[industry][pocType] !== undefined) {
                counts[industry][pocType]++;
                counts[industry]['Total']++;
                counts['Grand Total'][pocType]++;
                counts['Grand Total']['Total']++;
            }
        });

        setMatrixData(counts);

        // ── Build industry bar chart data ───────────────────────────────
        const chartLabels = industriesList;
        const chartValues = industriesList.map(ind => counts[ind]?.['Total'] || 0);
        const barColors = [
            'rgba(0, 97, 255, 0.85)', 'rgba(50, 168, 82, 0.85)', 'rgba(156, 39, 176, 0.85)',
            'rgba(255, 152, 0, 0.85)', 'rgba(244, 67, 54, 0.85)', 'rgba(0, 188, 212, 0.85)',
            'rgba(63, 81, 181, 0.85)', 'rgba(255, 87, 34, 0.85)', 'rgba(76, 175, 80, 0.85)',
            'rgba(103, 126, 234, 0.85)',
        ];

        setIndustryChartData({
            labels: chartLabels,
            datasets: [{
                label: 'Grand Total',
                data: chartValues,
                backgroundColor: chartLabels.map((_, i) => barColors[i % barColors.length]),
                borderColor: chartLabels.map((_, i) => barColors[i % barColors.length].replace('0.85', '1')),
                borderWidth: 2,
                borderRadius: 6,
                barPercentage: 0.65,
                categoryPercentage: 0.8,
            }]
        });

        // ── Build SME matrix ──────────────────────────────
        const uniqueSmes = new Set();
        filteredReports.forEach(r => {
            const raw = r.assignedTo || r.assigned_to || '';
            if (raw) {
                raw.split(',').forEach(name => {
                    const n = name.trim();
                    if (n) uniqueSmes.add(n);
                });
            }
        });

        const smesList = Array.from(uniqueSmes).sort();
        setSmeList(smesList);

        const smeCounts = {};
        smesList.forEach(sme => {
            smeCounts[sme] = {};
            pocTypes.forEach(pt => { smeCounts[sme][pt] = 0; });
            smeCounts[sme]['Total'] = 0;
        });
        smeCounts['Grand Total'] = {};
        pocTypes.forEach(pt => { smeCounts['Grand Total'][pt] = 0; });
        smeCounts['Grand Total']['Total'] = 0;

        filteredReports.forEach(r => {
            const pocType = r.pocType || r.poc_type || r.taskType || 'Unknown';
            const raw = r.assignedTo || r.assigned_to || '';
            if (!raw) return;
            raw.split(',').forEach(name => {
                const sme = name.trim();
                if (!sme || !smeCounts[sme]) return;
                if (smeCounts[sme][pocType] !== undefined) {
                    smeCounts[sme][pocType]++;
                    smeCounts[sme]['Total']++;
                    smeCounts['Grand Total'][pocType]++;
                    smeCounts['Grand Total']['Total']++;
                }
            });
        });

        setSmeMatrixData(smeCounts);

        // ── Build SME bar chart data ────────────────────────────────────
        const smeChartValues = smesList.map(sme => smeCounts[sme]?.['Total'] || 0);
        const smeBarColors = [
            'rgba(156, 39, 176, 0.85)', 'rgba(0, 188, 212, 0.85)', 'rgba(255, 87, 34, 0.85)',
            'rgba(0, 97, 255, 0.85)', 'rgba(50, 168, 82, 0.85)', 'rgba(255, 152, 0, 0.85)',
            'rgba(244, 67, 54, 0.85)', 'rgba(63, 81, 181, 0.85)', 'rgba(76, 175, 80, 0.85)',
            'rgba(103, 126, 234, 0.85)',
        ];
        setSmeChartData({
            labels: smesList,
            datasets: [{
                label: 'Grand Total',
                data: smeChartValues,
                backgroundColor: smesList.map((_, i) => smeBarColors[i % smeBarColors.length]),
                borderColor: smesList.map((_, i) => smeBarColors[i % smeBarColors.length].replace('0.85', '1')),
                borderWidth: 2,
                borderRadius: 6,
                barPercentage: 0.65,
                categoryPercentage: 0.8,
            }]
        });

        // ── Build Client Type Pie chart data ────────────────────────────
        const clientTypes = Object.keys(clientTypeFilter).sort();
        const clientTypeCounts = clientTypes.map(type => {
            return filteredReports.filter(r => {
                const rType = r.partner_client_own || 'Prospect';
                return rType === type;
            }).length;
        });

        const pieColors = [
            'rgba(102, 126, 234, 0.9)', // Royal Blue
            'rgba(76, 175, 80, 0.9)',   // Green
            'rgba(255, 152, 0, 0.9)',   // Orange
            'rgba(156, 39, 176, 0.9)',  // Purple
            'rgba(33, 150, 243, 0.9)',  // Blue
            'rgba(244, 67, 54, 0.9)',   // Red
        ];

        setClientTypePieChartData({
            labels: clientTypes,
            datasets: [{
                data: clientTypeCounts,
                backgroundColor: pieColors.slice(0, clientTypes.length),
                borderColor: 'white',
                borderWidth: 2,
            }]
        });

        // ── Build Sales Person matrix ──────────────────────────────
        const uniqueSalesPersons = new Set();
        const uniqueStatusesSet = new Set();
        filteredReports.forEach(r => {
            const sp = r.sales_person || r.salesPerson || 'Unknown';
            uniqueSalesPersons.add(sp);
            if (r.status) uniqueStatusesSet.add(r.status);
            else uniqueStatusesSet.add('Unknown');
        });

        const spList = Array.from(uniqueSalesPersons).sort();
        const stList = Array.from(uniqueStatusesSet).sort();
        setSalesPersonList(spList);
        setSalesPersonStatusList(stList);

        const spCounts = {};
        spList.forEach(sp => {
            spCounts[sp] = {};
            stList.forEach(s => { spCounts[sp][s] = 0; });
            spCounts[sp]['Total'] = 0;
        });
        spCounts['Grand Total'] = {};
        stList.forEach(s => { spCounts['Grand Total'][s] = 0; });
        spCounts['Grand Total']['Total'] = 0;

        filteredReports.forEach(r => {
            const sp = r.sales_person || r.salesPerson || 'Unknown';
            const status = r.status || 'Unknown';

            if (spCounts[sp] && spCounts[sp][status] !== undefined) {
                spCounts[sp][status]++;
                spCounts[sp]['Total']++;
                spCounts['Grand Total'][status]++;
                spCounts['Grand Total']['Total']++;
            }
        });

        setSalesPersonMatrixData(spCounts);

        // ── Build Sales Person bar chart data (Stacked) ────────────────────────────────────
        const standardColors = {
            'awaiting': '#5BC0DE',
            'cancelled': '#D9534F',
            'closed': '#6C757D',
            'completed': '#28A745',
            'dropped': '#A0522D',
            'hold': '#FFC107',
            'in progress': '#007BFF',
            'pending': '#FD7E14'
        };

        const extraColors = [
            '#9C27B0', // Purple
            '#00BCD4', // Cyan
            '#E91E63', // Pink
            '#795548', // Brown
            '#607D8B', // Blue Grey
            '#3F51B5', // Indigo
            '#8BC34A', // Light Green
        ];

        const nonStandardList = stList.filter(s => !standardColors[String(s || '').trim().toLowerCase()]);

        const getStatusColor = (statusName) => {
            const normalized = String(statusName || '').trim().toLowerCase();
            if (standardColors[normalized]) {
                return standardColors[normalized];
            }
            const extraIdx = nonStandardList.indexOf(statusName);
            if (extraIdx !== -1) {
                return extraColors[extraIdx % extraColors.length];
            }
            return '#607D8B';
        };

        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        setSalesPersonChartData({
            labels: spList,
            datasets: stList.map(status => {
                const color = getStatusColor(status);
                return {
                    label: status,
                    data: spList.map(sp => spCounts[sp][status]),
                    backgroundColor: hexToRgba(color, 0.85),
                    borderColor: color,
                    borderWidth: 1,
                    stack: 'Stack 0',
                };
            })
        });

    }, [filteredReports, pocTypes, clientTypeFilter]);

    // ── Effects ───────────────────────────────────────────────────────────────
    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'mousemove'];
        events.forEach(e => window.addEventListener(e, updateActivity));
        const interval = setInterval(() => {
            if (Date.now() - lastActivity.current > INACTIVITY_TIMEOUT) handleAutoLogout();
        }, 60000);
        return () => {
            events.forEach(e => window.removeEventListener(e, updateActivity));
            clearInterval(interval);
        };
    }, [handleAutoLogout, updateActivity]);

    // ── Token expiry ──────────────────────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            const token = localStorage.getItem('authToken');
            if (token && isTokenExpired(token)) handleAutoLogout();
        }, 60000);
        return () => clearInterval(interval);
    }, [handleAutoLogout, isTokenExpired]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const ms = payload.exp * 1000 - Date.now();
            const t = setTimeout(() => handleAutoLogout(), ms);
            return () => clearTimeout(t);
        } catch { /* silent */ }
    }, [handleAutoLogout]);

    const handleDateRangeChange = (range) => {
        setDateRange(range);
        const today = new Date();
        const start = new Date(today);

        switch (range) {
            case 'last30':
                start.setDate(today.getDate() - 30);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'last90':
                start.setDate(today.getDate() - 90);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'last180':
                start.setDate(today.getDate() - 180);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'last365':
                start.setDate(today.getDate() - 365);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'all':
                setStartDate("");
                setEndDate("");
                break;
            case 'custom':
                // keep current dates or set to today
                break;
            default:
                break;
        }
    };

    const clearFilters = () => {
        setPocTypeFilter("");
        setClientTypeFilter({
            Client: true,
            Partner: true,
            Internal: true,
            Prospect: true
        });
        setDateRange("all");
        setStartDate("");
        setEndDate("");
    };

    const refreshData = () => {
        fetchInitialData();
    };

    const handleCardClick = (type, customTitle = null, customData = null) => {
        let title = "";
        let data = [];

        if (customTitle && customData) {
            title = customTitle;
            data = customData;
        } else {
            switch (type) {
                case 'total':
                    title = "Total Records";
                    data = filteredReports;
                    break;
                case 'completed':
                    title = "Completed Usecases";
                    data = filteredReports.filter(r => {
                        const status = r.status?.toLowerCase() || '';
                        return status.includes('completed') || status.includes('done') || status.includes('success') || status.includes('converted');
                    });
                    break;
                case 'inProgress':
                    title = "In Progress Usecases";
                    data = filteredReports.filter(r => {
                        const status = r.status?.toLowerCase() || '';
                        return status.includes('progress') || status.includes('ongoing');
                    });
                    break;
                case 'awaiting':
                    title = "Awaiting Usecases";
                    data = filteredReports.filter(r => {
                        const status = r.status?.toLowerCase() || '';
                        return status.includes('awaiting') || status.includes('pending') || status.includes('waiting') || status.includes('planned');
                    });
                    break;
                case 'hold':
                    title = "Hold Usecases";
                    data = filteredReports.filter(r => {
                        const status = r.status?.toLowerCase() || '';
                        return status.includes('hold');
                    });
                    break;
                default:
                    title = "Usecase List";
                    data = filteredReports;
            }
        }

        setDialogTitle(title);
        setDialogData(data);
        setDialogOpen(true);
    };

    if (logoutInProgress.current) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography variant="h5">Session expired. Redirecting to login...</Typography>
            </Box>
        );
    }

    // ── Derived stats ─────────────────────────────────────────────────────────
    const totalRecords = filteredReports.length;
    const totalIndustries = industries.length;
    const totalPocTypes = pocTypes.length;
    const grandTotal = matrixData['Grand Total']?.['Total'] || 0;

    const clientTypePieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 10,
                cornerRadius: 8,
                titleFont: { size: 13 },
                bodyFont: { size: 12 }
            },
            datalabels: {
                display: true,
                color: '#fff',
                font: { weight: 'bold', size: 11 },
                formatter: (value, ctx) => {
                    const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
                    if (sum === 0) return '';
                    const percentage = (value * 100 / sum).toFixed(0) + "%";
                    return value > 0 ? percentage : '';
                }
            }
        }
    };

    // ── Chart options ─────────────────────────────────────────────────────────
    const industryChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: '🏭 Work Requests by Industry',
                font: { size: 18, weight: 'bold' },
                padding: { top: 10, bottom: 20 },
                color: '#333',
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.85)',
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (ctx) => ` Total: ${ctx.parsed.y}`,
                }
            },
            datalabels: {
                display: true,
                color: '#333333',
                font: { size: 13, weight: 'bold' },
                anchor: 'end',
                align: 'top',
                offset: 6,
                formatter: (value) => value > 0 ? value : '',
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    font: { size: 11, weight: 'bold' },
                    color: '#555',
                    maxRotation: 35,
                    minRotation: 20,
                },
                title: {
                    display: true,
                    text: 'Industries',
                    font: { size: 13, weight: 'bold' },
                    color: '#444',
                    padding: { top: 10 },
                }
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false },
                ticks: {
                    font: { size: 12 },
                    color: '#666',
                    precision: 0,
                    stepSize: 1,
                },
                title: {
                    display: true,
                    text: 'Grand Total',
                    font: { size: 13, weight: 'bold' },
                    color: '#444',
                    padding: { bottom: 10 },
                }
            }
        },
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const label = industryChartData.labels[index];
                const industryData = filteredReports.filter(r => {
                    const industry = r.industryType || r.industry_type || r.industry;
                    return industry === label;
                });
                handleCardClick('industry', `Industry: ${label}`, industryData);
            }
        },
        onHover: (event, elements) => {
            const target = event.native ? event.native.target : event.target;
            if (target) target.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
        },
        animation: { duration: 900, easing: 'easeOutQuart' },
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getCellColor = (value) => {
        if (!value || value === 0) return 'transparent';
        if (value >= 10) return 'rgba(0, 97, 255, 0.15)';
        if (value >= 5) return 'rgba(50, 168, 82, 0.15)';
        if (value >= 2) return 'rgba(255, 152, 0, 0.10)';
        return 'transparent';
    };

    const grandSmeTotal = smeMatrixData['Grand Total']?.['Total'] || 0;

    // ── SME chart options (mirrors industryChartOptions) ─────────────────────
    const smeChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: '👤 Work Requests Processed by Consultant',
                font: { size: 18, weight: 'bold' },
                padding: { top: 10, bottom: 20 },
                color: '#333',
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.85)',
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                callbacks: { label: (ctx) => ` Total: ${ctx.parsed.y}` }
            },
            datalabels: {
                display: true,
                color: '#333333',
                font: { size: 13, weight: 'bold' },
                anchor: 'end',
                align: 'top',
                offset: 6,
                formatter: (value) => value > 0 ? value : '',
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11, weight: 'bold' }, color: '#555', maxRotation: 35, minRotation: 20 },
                title: { display: true, text: 'SME', font: { size: 13, weight: 'bold' }, color: '#444', padding: { top: 10 } }
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false },
                ticks: { font: { size: 12 }, color: '#666', precision: 0, stepSize: 1 },
                title: { display: true, text: 'Grand Total', font: { size: 13, weight: 'bold' }, color: '#444', padding: { bottom: 10 } }
            }
        },
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const label = smeChartData.labels[index];
                const smeData = filteredReports.filter(r => {
                    const raw = r.assigned_to || r.assignedTo || '';
                    return raw.split(',').some(name => name.trim() === label);
                });
                handleCardClick('sme', `SME: ${label}`, smeData);
            }
        },
        onHover: (event, elements) => {
            const target = event.native ? event.native.target : event.target;
            if (target) target.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
        },
        animation: { duration: 900, easing: 'easeOutQuart' },
    };

    const salesPersonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { font: { weight: 'bold' } }
            },
            title: {
                display: true,
                text: '👤 Work Requests by Sales Person (STATUS-WISE)',
                font: { size: 18, weight: 'bold' },
                padding: { top: 10, bottom: 20 },
                color: '#333',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0,0,0,0.85)',
                padding: 12,
                cornerRadius: 8,
            },
            datalabels: {
                labels: {
                    value: {
                        color: '#fff',
                        font: { weight: 'bold', size: 11 },
                        formatter: (value) => value > 0 ? value : '',
                    },
                    total: {
                        align: 'top',
                        anchor: 'end',
                        color: '#333333',
                        font: { size: 13, weight: 'bold' },
                        offset: 6,
                        display: (context) => {
                            const datasetIndex = context.datasetIndex;
                            const dataIndex = context.dataIndex;
                            const datasets = context.chart.data.datasets;

                            // Only display on the topmost dataset segment that has a non-zero value.
                            let topNonZeroIndex = -1;
                            for (let i = datasets.length - 1; i >= 0; i--) {
                                if (datasets[i].data[dataIndex] > 0) {
                                    topNonZeroIndex = i;
                                    break;
                                }
                            }

                            if (topNonZeroIndex === -1) {
                                return datasetIndex === datasets.length - 1;
                            }
                            return datasetIndex === topNonZeroIndex;
                        },
                        formatter: (value, context) => {
                            const dataIndex = context.dataIndex;
                            const datasets = context.chart.data.datasets;
                            let sum = 0;
                            for (let i = 0; i < datasets.length; i++) {
                                sum += (datasets[i].data[dataIndex] || 0);
                            }
                            return sum > 0 ? sum : '';
                        }
                    }
                }
            }
        },
        scales: {
            x: {
                stacked: true,
                grid: { display: false },
                ticks: { font: { weight: 'bold' }, maxRotation: 35, minRotation: 20 },
                title: { display: true, text: 'Sales Persons', font: { weight: 'bold' } }
            },
            y: {
                stacked: true,
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.06)' },
                title: { display: true, text: 'No. of Usecases', font: { weight: 'bold' } }
            }
        },
        animation: { duration: 1000, easing: 'easeOutQuart' }
    };

    const exportWhiteBackgroundPlugin = {
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart, args, options) => {
            const { ctx, width, height } = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = options.color || '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // Draw a border
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#cccccc';
            ctx.strokeRect(1, 1, width - 2, height - 2);

            ctx.restore();
        }
    };

    const industryChartRef = useRef(null);
    const smeChartRef = useRef(null);
    const salesPersonChartRef = useRef(null);

    const handleExportChart = (chartRef, fileName) => {
        if (chartRef && chartRef.current) {
            const base64Image = chartRef.current.toBase64Image();
            const link = document.createElement('a');
            link.href = base64Image;
            link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.png`;
            link.click();
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f8fafc' }}>
            {/* ── AppBar – identical gradient to ReportSales ── */}
            <AppBar position="static" elevation={2} sx={{
                bgcolor: 'primary.main',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
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
                        variant="h5"
                        component="h1"
                        color="inherit"
                        sx={{ flexGrow: 1, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}
                    >
                        🚀 SC Report
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                            label={`👋 Welcome, ${user?.emp_name || user?.email_id || 'User'} (${user?.emp_id || ''})`}
                            variant="outlined"
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', display: { xs: 'none', md: 'flex' } }}
                        />
                        <Button
                            color="inherit"
                            onClick={onLogout}
                            startIcon={<LogoutIcon />}
                            variant="outlined"
                            sx={{ borderColor: 'rgba(255,255,255,0.3)' }}
                        >
                            Logout
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box sx={{ p: isMobile ? 1 : 2 }}>
                {/* ── Summary Stat Cards ── */}
                <Grid container spacing={3} sx={{ mb: 4, mt: 0.5 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Total Records"
                            value={totalRecords}
                            icon={<AssessmentIcon sx={{ fontSize: 30 }} />}
                            color="#0061ff"
                            subtitle="All SC entries"
                            onClick={() => handleCardClick('total')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Completed"
                            value={completedIncludingConverted}
                            icon={<CheckCircleIcon sx={{ fontSize: 30 }} />}
                            color="#32a852"
                            subtitle={`${conversionRate}% conversion rate`}
                            onClick={() => handleCardClick('completed')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="In Progress"
                            value={inProgressPocs}
                            icon={<PlayArrowIcon sx={{ fontSize: 30 }} />}
                            color="#ff9f1c"
                            subtitle="Active development"
                            onClick={() => handleCardClick('inProgress')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Awaiting"
                            value={awaitingPocs}
                            icon={<HourglassEmptyIcon sx={{ fontSize: 30 }} />}
                            color="#2196f3"
                            subtitle="Pending/Awaiting"
                            onClick={() => handleCardClick('awaiting')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Hold"
                            value={holdPocs}
                            icon={<PauseIcon sx={{ fontSize: 30 }} />}
                            color="#ff5722"
                            subtitle="On Hold"
                            onClick={() => handleCardClick('hold')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper elevation={3} sx={{
                            p: 2,
                            borderRadius: 3,
                            height: '100%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: '140px',
                            color: 'white'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                        {totalRecords}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 'medium' }}>
                                        CLIENT TYPE
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                        Distribution
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    borderRadius: '50%',
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <BusinessIcon sx={{ fontSize: 24 }} />
                                </Box>
                            </Box>
                            <Box sx={{
                                height: '120px',
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                {clientTypePieChartData ? (
                                    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                                        <Pie
                                            data={clientTypePieChartData}
                                            options={{
                                                ...clientTypePieChartOptions,
                                                onHover: (event, elements) => {
                                                    const target = event.native ? event.native.target : event.target;
                                                    if (target) target.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
                                                },
                                                onClick: (event, elements) => {
                                                    if (elements.length > 0) {
                                                        const index = elements[0].index;
                                                        const label = clientTypePieChartData.labels[index];
                                                        const typeData = filteredReports.filter(r => {
                                                            const rType = r.partner_client_own || 'Prospect';
                                                            return rType === label;
                                                        });
                                                        handleCardClick('clientType', `Client Type: ${label}`, typeData);
                                                    }
                                                }
                                            }}
                                        />
                                    </Box>
                                ) : (
                                    <CircularProgress size={20} sx={{ color: 'white' }} />
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                {/* ── Filter Data Section ── */}
                <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', border: '1px solid #ffd180' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#e65100' }}>
                        🎯 Additional Usecase Type Filter
                    </Typography>

                    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Filter by Type
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                {Object.keys(clientTypeFilter).sort().map((type) => (
                                    <FormControlLabel
                                        key={type}
                                        control={
                                            <Checkbox
                                                checked={clientTypeFilter[type]}
                                                onChange={(e) => setClientTypeFilter({
                                                    ...clientTypeFilter,
                                                    [type]: e.target.checked
                                                })}
                                                sx={{
                                                    color: '#e65100',
                                                    '&.Mui-checked': { color: '#e65100' }
                                                }}
                                            />
                                        }
                                        label={type}
                                    />
                                ))}
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Main filters row */}
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                select
                                label="🔍 Filter by Specific Usecase Type"
                                value={pocTypeFilter}
                                onChange={(e) => setPocTypeFilter(e.target.value)}
                                sx={{
                                    minWidth: 220,
                                    bgcolor: 'white',
                                    borderRadius: 1,
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: '#ffe0b2' },
                                        '&:hover fieldset': { borderColor: '#ffb74d' },
                                        '&.Mui-focused fieldset': { borderColor: '#e65100' },
                                    }
                                }}
                            >
                                <MenuItem value="">All Usecase Types</MenuItem>
                                {pocTypes.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                                <Chip
                                    label={`📊 Total Filtered: ${filteredReports.length}`}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontWeight: 'bold', bgcolor: 'white' }}
                                />
                                <Chip
                                    label={`✅ Completed: ${completedIncludingConverted}`}
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontWeight: 'bold', bgcolor: 'white' }}
                                />
                                <Chip
                                    label={`🔄 In Progress: ${inProgressPocs}`}
                                    color="warning"
                                    variant="outlined"
                                    sx={{ fontWeight: 'bold', bgcolor: 'white' }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
                <br />

                {/* Enhanced Filters Section */}
                <Paper elevation={4} sx={{ p: 3, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            🎛️ Filter Analytics
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<RefreshIcon />}
                                onClick={refreshData}
                                size="medium"
                                sx={{ fontWeight: 'bold', minWidth: 120 }}
                            >
                                Refresh
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<ClearIcon />}
                                onClick={clearFilters}
                                size="medium"
                                sx={{ fontWeight: 'bold', minWidth: 120 }}
                            >
                                Clear All
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
                            📅 Date Range:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {['all', 'last30', 'last90', 'last180', 'last365', 'custom'].map((range) => (
                                <Chip
                                    key={range}
                                    label={
                                        range === 'all' ? 'All Time' :
                                            range === 'last30' ? 'Last 30 Days' :
                                                range === 'last90' ? 'Last 90 Days' :
                                                    range === 'last180' ? 'Last 6 Months' :
                                                        range === 'last365' ? 'Last 1 Year' : 'Custom Date'
                                    }
                                    onClick={() => handleDateRangeChange(range)}
                                    color={dateRange === range ? 'primary' : 'default'}
                                    variant={dateRange === range ? 'filled' : 'outlined'}
                                    sx={{ fontWeight: 'bold' }}
                                />
                            ))}
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Start Date"
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setDateRange("custom");
                                }}
                                InputLabelProps={{ shrink: true }}
                                disabled={dateRange !== "custom"}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="End Date"
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setDateRange("custom");
                                }}
                                InputLabelProps={{ shrink: true }}
                                disabled={dateRange !== "custom"}
                                size="small"
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* ── Tabs ── */}
                <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white', px: 2 }}>
                        <Tabs
                            value={activeTab}
                            onChange={(_, v) => setActiveTab(v)}
                            centered
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                '& .MuiTabs-flexContainer': {
                                    justifyContent: 'center', // extra safety for centering
                                },
                                '& .MuiTab-root': {
                                    minHeight: 56,
                                    fontSize: '0.95rem',
                                    fontWeight: 'medium',
                                    textTransform: 'none',
                                    px: 3,
                                },
                                '& .Mui-selected': {
                                    fontWeight: 'bold',
                                    color: theme.palette.primary.main,
                                }
                            }}
                        >
                            <Tab icon={<TableChartIcon />} iconPosition="start" label="Table View" />
                            <Tab icon={<BarChartIcon />} iconPosition="start" label="Chart View" />
                        </Tabs>
                    </Box>

                    {/* ── Table View ── */}
                    <TabPanel value={activeTab} index={0}>
                        <>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                                    <CircularProgress size={60} sx={{ color: 'primary.main' }} />
                                </Box>
                            ) : error ? (
                                <Box sx={{ p: 3 }}>
                                    <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                                </Box>
                            ) : (
                                <Box sx={{ p: 3 }}>
                                    {/* Table header bar */}
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 2,
                                        flexWrap: 'wrap',
                                        gap: 1,
                                    }}>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                📊 Count by Industry &amp; Task / Usecase Type
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Showing {industries.length} industries × {pocTypes.length} types
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            startIcon={<RefreshIcon />}
                                            onClick={fetchInitialData}
                                            size="small"
                                            sx={{ fontWeight: 'bold', borderRadius: 2 }}
                                        >
                                            Refresh
                                        </Button>
                                    </Box>

                                    {/* Summary chips */}
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                                        <Chip
                                            label={`📋 Industries: ${industries.length}`}
                                            color="primary"
                                            variant="outlined"
                                            size="small"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                        <Chip
                                            label={`🗂️ Types: ${pocTypes.length}`}
                                            color="secondary"
                                            variant="outlined"
                                            size="small"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                        <Chip
                                            label={`🔢 Grand Total: ${grandTotal}`}
                                            color="success"
                                            variant="outlined"
                                            size="small"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </Box>

                                    {/* Matrix Table */}
                                    <TableContainer
                                        component={Paper}
                                        elevation={3}
                                        sx={{
                                            borderRadius: 2,
                                            border: '1px solid #e0e0e0',
                                            maxHeight: 580,
                                            overflow: 'auto',
                                        }}
                                    >
                                        <Table
                                            stickyHeader
                                            size="small"
                                            sx={{ minWidth: 650 }}
                                            aria-label="SC industry matrix table"
                                        >
                                            <TableHead>
                                                <TableRow>
                                                    {/* Industry column header */}
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            fontSize: '0.85rem',
                                                            bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                            color: 'white',
                                                            borderRight: '2px solid rgba(255,255,255,0.3)',
                                                            minWidth: 180,
                                                            position: 'sticky',
                                                            left: 0,
                                                            zIndex: 3,
                                                            letterSpacing: 0.5,
                                                        }}
                                                    >
                                                        🏭 Industry
                                                    </TableCell>

                                                    {pocTypes.map(type => (
                                                        <TableCell
                                                            key={type}
                                                            align="center"
                                                            sx={{
                                                                fontWeight: 'bold',
                                                                fontSize: '0.8rem',
                                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                color: 'white',
                                                                borderRight: '1px solid rgba(255,255,255,0.2)',
                                                                whiteSpace: 'nowrap',
                                                                minWidth: 110,
                                                            }}
                                                        >
                                                            {type}
                                                        </TableCell>
                                                    ))}

                                                    {/* Grand Total column header */}
                                                    <TableCell
                                                        align="center"
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            fontSize: '0.85rem',
                                                            background: 'linear-gradient(135deg, #0061ff 0%, #32a852 100%)',
                                                            color: 'white',
                                                            minWidth: 110,
                                                            letterSpacing: 0.5,
                                                        }}
                                                    >
                                                        🔢 Grand Total
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {industries.map((industry, rowIdx) => {
                                                    const rowTotal = matrixData[industry]?.['Total'] || 0;
                                                    return (
                                                        <TableRow
                                                            key={industry}
                                                            hover
                                                            sx={{
                                                                bgcolor: rowIdx % 2 === 0 ? 'white' : '#fafbfc',
                                                                '&:hover': { bgcolor: '#f0f4ff' },
                                                                transition: 'background-color 0.15s',
                                                            }}
                                                        >
                                                            {/* Industry name cell */}
                                                            <TableCell
                                                                component="th"
                                                                scope="row"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.82rem',
                                                                    color: '#333',
                                                                    borderRight: '2px solid #e8eaf6',
                                                                    position: 'sticky',
                                                                    left: 0,
                                                                    bgcolor: rowIdx % 2 === 0 ? 'white' : '#fafbfc',
                                                                    zIndex: 1,
                                                                    '&:hover': { bgcolor: '#f0f4ff' },
                                                                }}
                                                            >
                                                                {industry}
                                                            </TableCell>

                                                            {pocTypes.map(type => {
                                                                const val = matrixData[industry]?.[type] || 0;
                                                                return (
                                                                    <TableCell
                                                                        key={type}
                                                                        align="center"
                                                                        sx={{
                                                                            fontSize: '0.82rem',
                                                                            borderRight: '1px solid #eeeeee',
                                                                            bgcolor: getCellColor(val),
                                                                            fontWeight: val > 0 ? 'bold' : 'normal',
                                                                            color: val > 0 ? '#333' : '#bbb',
                                                                            transition: 'background-color 0.15s',
                                                                        }}
                                                                    >
                                                                        {val > 0 ? (
                                                                            <Chip
                                                                                label={val}
                                                                                size="small"
                                                                                onClick={() => {
                                                                                    const data = filteredReports.filter(r => {
                                                                                        let rInd = r.industryType || r.industry_type || r.industry;
                                                                                        if (rInd === 'Professional Training &Coaching') rInd = 'Professional Training & Coaching';
                                                                                        const rType = r.pocType || r.poc_type || r.taskType || 'Unknown';
                                                                                        return rInd === industry && rType === type;
                                                                                    });
                                                                                    handleCardClick('custom', `${industry} - ${type} Usecases`, data);
                                                                                }}
                                                                                sx={{
                                                                                    height: 22,
                                                                                    fontSize: '0.75rem',
                                                                                    fontWeight: 'bold',
                                                                                    bgcolor: val >= 10 ? 'rgba(0,97,255,0.12)' : val >= 5 ? 'rgba(50,168,82,0.12)' : 'rgba(255,152,0,0.1)',
                                                                                    color: val >= 10 ? '#0061ff' : val >= 5 ? '#2e7d32' : '#e65100',
                                                                                    border: 'none',
                                                                                    cursor: 'pointer',
                                                                                    '&:hover': { opacity: 0.8 }
                                                                                }}
                                                                            />
                                                                        ) : '—'}
                                                                    </TableCell>
                                                                );
                                                            })}

                                                            {/* Row Grand Total */}
                                                            <TableCell
                                                                align="center"
                                                                onClick={() => {
                                                                    if (rowTotal > 0) {
                                                                        const data = filteredReports.filter(r => {
                                                                            let rInd = r.industryType || r.industry_type || r.industry;
                                                                            if (rInd === 'Professional Training &Coaching') rInd = 'Professional Training & Coaching';
                                                                            return rInd === industry;
                                                                        });
                                                                        handleCardClick('custom', `${industry} - All Usecases`, data);
                                                                    }
                                                                }}
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.85rem',
                                                                    bgcolor: rowTotal > 0 ? 'rgba(0,97,255,0.08)' : '#f9f9f9',
                                                                    color: rowTotal > 0 ? '#0061ff' : '#aaa',
                                                                    borderLeft: '2px solid #e8eaf6',
                                                                    cursor: rowTotal > 0 ? 'pointer' : 'default',
                                                                    '&:hover': { bgcolor: rowTotal > 0 ? 'rgba(0,97,255,0.15)' : 'transparent' }
                                                                }}
                                                            >
                                                                {rowTotal > 0 ? (
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{ fontWeight: 'bold', color: '#0061ff' }}
                                                                    >
                                                                        {rowTotal}
                                                                    </Typography>
                                                                ) : '—'}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}

                                                {/* Grand Total row */}
                                                <TableRow>
                                                    <TableCell
                                                        component="th"
                                                        scope="row"
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            fontSize: '0.88rem',
                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                            color: 'white',
                                                            borderRight: '2px solid rgba(255,255,255,0.3)',
                                                            position: 'sticky',
                                                            left: 0,
                                                            zIndex: 1,
                                                        }}
                                                    >
                                                        🔢 Grand Total
                                                    </TableCell>

                                                    {pocTypes.map(type => {
                                                        const val = matrixData['Grand Total']?.[type] || 0;
                                                        return (
                                                            <TableCell
                                                                key={type}
                                                                align="center"
                                                                onClick={() => {
                                                                    if (val > 0) {
                                                                        const data = filteredReports.filter(r => {
                                                                            const rType = r.pocType || r.poc_type || r.taskType || 'Unknown';
                                                                            return rType === type;
                                                                        });
                                                                        handleCardClick('custom', `Total - ${type} Usecases`, data);
                                                                    }
                                                                }}
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.85rem',
                                                                    background: 'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)',
                                                                    borderRight: '1px solid rgba(102,126,234,0.2)',
                                                                    color: val > 0 ? '#4a3f8a' : '#aaa',
                                                                    cursor: val > 0 ? 'pointer' : 'default',
                                                                    '&:hover': { bgcolor: val > 0 ? 'rgba(102,126,234,0.3)' : 'transparent' }
                                                                }}
                                                            >
                                                                {val > 0 ? val : '—'}
                                                            </TableCell>
                                                        );
                                                    })}

                                                    <TableCell
                                                        align="center"
                                                        onClick={() => handleCardClick('custom', 'Grand Total - All Usecases', filteredReports)}
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            fontSize: '1rem',
                                                            background: 'linear-gradient(135deg, #0061ff 0%, #32a852 100%)',
                                                            color: 'white',
                                                            borderLeft: '2px solid rgba(255,255,255,0.3)',
                                                            cursor: 'pointer',
                                                            '&:hover': { opacity: 0.9 }
                                                        }}
                                                    >
                                                        {grandTotal}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {/* Legend */}
                                    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                            Color legend:
                                        </Typography>
                                        {[
                                            { label: '≥10', color: 'rgba(0,97,255,0.15)', text: '#0061ff' },
                                            { label: '5–9', color: 'rgba(50,168,82,0.15)', text: '#2e7d32' },
                                            { label: '1–4', color: 'rgba(255,152,0,0.10)', text: '#e65100' },
                                        ].map(({ label, color, text }) => (
                                            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box sx={{ width: 14, height: 14, bgcolor: color, border: `1px solid ${text}`, borderRadius: 0.5 }} />
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* ─────────────── SME MATRIX TABLE ─────────────── */}
                            {!loading && !error && (
                                <Box sx={{ p: 3, pt: 0 }}>
                                    {/* SME table header bar */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 3, flexWrap: 'wrap', gap: 1 }}>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                                                👤 Count by SME &amp; Task / Usecase Type
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Showing {smeList.length} SMEs × {pocTypes.length} types
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* SME summary chips */}
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                        <Chip label={`👥 SMEs: ${smeList.length}`} color="secondary" variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />
                                        <Chip label={`🔢 Grand Total: ${grandSmeTotal}`} color="success" variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />
                                    </Box>

                                    <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', maxHeight: 580, overflow: 'auto' }}>
                                        <Table stickyHeader size="small" sx={{ minWidth: 650 }} aria-label="SME matrix table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{
                                                        fontWeight: 'bold', fontSize: '0.85rem',
                                                        background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
                                                        color: 'white', borderRight: '2px solid rgba(255,255,255,0.3)',
                                                        minWidth: 180, position: 'sticky', left: 0, zIndex: 3, letterSpacing: 0.5,
                                                    }}>
                                                        👤 SME
                                                    </TableCell>
                                                    {pocTypes.map(type => (
                                                        <TableCell key={type} align="center" sx={{
                                                            fontWeight: 'bold', fontSize: '0.8rem',
                                                            background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
                                                            color: 'white', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap', minWidth: 110,
                                                        }}>
                                                            {type}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell align="center" sx={{
                                                        fontWeight: 'bold', fontSize: '0.85rem',
                                                        background: 'linear-gradient(135deg, #9c27b0 0%, #0061ff 100%)',
                                                        color: 'white', minWidth: 110, letterSpacing: 0.5,
                                                    }}>
                                                        🔢 Grand Total
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {smeList.map((sme, rowIdx) => {
                                                    const rowTotal = smeMatrixData[sme]?.['Total'] || 0;
                                                    return (
                                                        <TableRow key={sme} hover sx={{ bgcolor: rowIdx % 2 === 0 ? 'white' : '#fafbfc', '&:hover': { bgcolor: '#f9f0ff' }, transition: 'background-color 0.15s' }}>
                                                            <TableCell component="th" scope="row" sx={{
                                                                fontWeight: 'bold', fontSize: '0.82rem', color: '#333',
                                                                borderRight: '2px solid #ede7f6', position: 'sticky', left: 0,
                                                                bgcolor: rowIdx % 2 === 0 ? 'white' : '#fafbfc', zIndex: 1,
                                                                '&:hover': { bgcolor: '#f9f0ff' },
                                                            }}>
                                                                {sme}
                                                            </TableCell>
                                                            {pocTypes.map(type => {
                                                                const val = smeMatrixData[sme]?.[type] || 0;
                                                                return (
                                                                    <TableCell key={type} align="center" sx={{
                                                                        fontSize: '0.82rem', borderRight: '1px solid #eeeeee',
                                                                        bgcolor: getCellColor(val),
                                                                        fontWeight: val > 0 ? 'bold' : 'normal',
                                                                        color: val > 0 ? '#333' : '#bbb',
                                                                    }}>
                                                                        {val > 0 ? (
                                                                            <Chip
                                                                                label={val}
                                                                                size="small"
                                                                                onClick={() => {
                                                                                    const data = filteredReports.filter(r => {
                                                                                        const raw = r.assignedTo || r.assigned_to || '';
                                                                                        const rType = r.pocType || r.poc_type || r.taskType || 'Unknown';
                                                                                        return raw.split(',').some(name => name.trim() === sme) && rType === type;
                                                                                    });
                                                                                    handleCardClick('custom', `${sme} - ${type} Usecases`, data);
                                                                                }}
                                                                                sx={{
                                                                                    height: 22, fontSize: '0.75rem', fontWeight: 'bold', border: 'none',
                                                                                    bgcolor: val >= 10 ? 'rgba(156,39,176,0.12)' : val >= 5 ? 'rgba(50,168,82,0.12)' : 'rgba(255,152,0,0.1)',
                                                                                    color: val >= 10 ? '#9c27b0' : val >= 5 ? '#2e7d32' : '#e65100',
                                                                                    cursor: 'pointer',
                                                                                    '&:hover': { opacity: 0.8 }
                                                                                }}
                                                                            />
                                                                        ) : '—'}
                                                                    </TableCell>
                                                                );
                                                            })}
                                                            <TableCell
                                                                align="center"
                                                                onClick={() => {
                                                                    if (rowTotal > 0) {
                                                                        const data = filteredReports.filter(r => {
                                                                            const raw = r.assignedTo || r.assigned_to || '';
                                                                            return raw.split(',').some(name => name.trim() === sme);
                                                                        });
                                                                        handleCardClick('custom', `${sme} - All Usecases`, data);
                                                                    }
                                                                }}
                                                                sx={{
                                                                    fontWeight: 'bold', fontSize: '0.85rem',
                                                                    bgcolor: rowTotal > 0 ? 'rgba(156,39,176,0.08)' : '#f9f9f9',
                                                                    color: rowTotal > 0 ? '#9c27b0' : '#aaa',
                                                                    borderLeft: '2px solid #ede7f6',
                                                                    cursor: rowTotal > 0 ? 'pointer' : 'default',
                                                                    '&:hover': { bgcolor: rowTotal > 0 ? 'rgba(156,39,176,0.15)' : 'transparent' }
                                                                }}>
                                                                {rowTotal > 0 ? <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>{rowTotal}</Typography> : '—'}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                                {/* Grand Total row */}
                                                <TableRow>
                                                    <TableCell component="th" scope="row" sx={{
                                                        fontWeight: 'bold', fontSize: '0.88rem',
                                                        background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
                                                        color: 'white', borderRight: '2px solid rgba(255,255,255,0.3)',
                                                        position: 'sticky', left: 0, zIndex: 1,
                                                    }}>
                                                        🔢 Grand Total
                                                    </TableCell>
                                                    {pocTypes.map(type => {
                                                        const val = smeMatrixData['Grand Total']?.[type] || 0;
                                                        return (
                                                            <TableCell
                                                                key={type}
                                                                align="center"
                                                                onClick={() => {
                                                                    if (val > 0) {
                                                                        const data = filteredReports.filter(r => {
                                                                            const rType = r.pocType || r.poc_type || r.taskType || 'Unknown';
                                                                            return rType === type;
                                                                        });
                                                                        handleCardClick('custom', `Total - ${type} Usecases`, data);
                                                                    }
                                                                }}
                                                                sx={{
                                                                    fontWeight: 'bold', fontSize: '0.85rem',
                                                                    background: 'linear-gradient(135deg, #9c27b022 0%, #673ab722 100%)',
                                                                    borderRight: '1px solid rgba(156,39,176,0.2)',
                                                                    color: val > 0 ? '#6a1b9a' : '#aaa',
                                                                    cursor: val > 0 ? 'pointer' : 'default',
                                                                    '&:hover': { bgcolor: val > 0 ? 'rgba(156,39,176,0.3)' : 'transparent' }
                                                                }}>
                                                                {val > 0 ? val : '—'}
                                                            </TableCell>
                                                        );
                                                    })}
                                                    <TableCell
                                                        align="center"
                                                        onClick={() => handleCardClick('custom', 'Grand Total - All Usecases', filteredReports)}
                                                        sx={{
                                                            fontWeight: 'bold', fontSize: '1rem',
                                                            background: 'linear-gradient(135deg, #9c27b0 0%, #0061ff 100%)',
                                                            color: 'white', borderLeft: '2px solid rgba(255,255,255,0.3)',
                                                            cursor: 'pointer',
                                                            '&:hover': { opacity: 0.9 }
                                                        }}>
                                                        {grandSmeTotal}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                </Box>
                            )}

                            {/* ─────────────── SALES PERSON MATRIX TABLE ─────────────── */}
                            {!loading && !error && (
                                <Box sx={{ p: 3, pt: 0 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 3, flexWrap: 'wrap', gap: 1 }}>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                👤 Work Requests by Sales Person (Status-wise)
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Showing {salesPersonList.length} Sales Persons × 4 Statuses
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                        <Chip label={`👥 Sales Persons: ${salesPersonList.length}`} color="primary" variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />
                                        <Chip label={`🔢 Grand Total: ${salesPersonMatrixData['Grand Total']?.['Total'] || 0}`} color="success" variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />
                                    </Box>

                                    <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', maxHeight: 580, overflow: 'auto' }}>
                                        <Table stickyHeader size="small" sx={{ minWidth: 650 }} aria-label="Sales Person matrix table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{
                                                        fontWeight: 'bold', fontSize: '0.85rem',
                                                        background: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)',
                                                        color: 'white', borderRight: '2px solid rgba(255,255,255,0.3)',
                                                        minWidth: 180, position: 'sticky', left: 0, zIndex: 3, letterSpacing: 0.5,
                                                    }}>
                                                        👤 Sales Person
                                                    </TableCell>
                                                    {salesPersonStatusList.map(status => (
                                                        <TableCell key={status} align="center" sx={{
                                                            fontWeight: 'bold', fontSize: '0.8rem',
                                                            background: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)',
                                                            color: 'white', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap', minWidth: 110,
                                                        }}>
                                                            {status}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell align="center" sx={{
                                                        fontWeight: 'bold', fontSize: '0.85rem',
                                                        background: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)',
                                                        color: 'white', letterSpacing: 0.5,
                                                    }}>
                                                        🔢 Total
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {salesPersonList.map((sp, spIdx) => {
                                                    const rowData = salesPersonMatrixData[sp] || {};
                                                    const rowTotal = rowData.Total || 0;
                                                    return (
                                                        <TableRow
                                                            key={sp}
                                                            hover
                                                            sx={{
                                                                bgcolor: spIdx % 2 === 0 ? 'white' : '#f0f7ff',
                                                                '&:hover': { bgcolor: '#e3f2fd' },
                                                            }}
                                                        >
                                                            <TableCell
                                                                component="th"
                                                                scope="row"
                                                                sx={{
                                                                    fontWeight: 'bold', fontSize: '0.82rem',
                                                                    color: '#333', borderRight: '2px solid #e3f2fd',
                                                                    position: 'sticky', left: 0,
                                                                    bgcolor: spIdx % 2 === 0 ? 'white' : '#f0f7ff',
                                                                    zIndex: 1,
                                                                }}
                                                            >
                                                                {sp}
                                                            </TableCell>
                                                            {salesPersonStatusList.map(status => {
                                                                const val = rowData[status] || 0;
                                                                return (
                                                                    <TableCell
                                                                        key={status}
                                                                        align="center"
                                                                        sx={{
                                                                            fontSize: '0.82rem',
                                                                            borderRight: '1px solid #eeeeee',
                                                                            fontWeight: val > 0 ? 'bold' : 'normal',
                                                                            color: val > 0 ? '#333' : '#bbb',
                                                                        }}
                                                                    >
                                                                        {val > 0 ? (
                                                                            <Chip
                                                                                label={val}
                                                                                size="small"
                                                                                onClick={() => {
                                                                                    const data = filteredReports.filter(r => {
                                                                                        const rSp = r.sales_person || r.salesPerson || 'Unknown';
                                                                                        const rStatus = r.status || 'Unknown';
                                                                                        return rSp === sp && rStatus === status;
                                                                                    });
                                                                                    handleCardClick('custom', `${sp} - ${status} Usecases`, data);
                                                                                }}
                                                                                sx={{
                                                                                    height: 22,
                                                                                    cursor: 'pointer',
                                                                                    '&:hover': { opacity: 0.8 }
                                                                                }}
                                                                            />
                                                                        ) : '—'}
                                                                    </TableCell>
                                                                );
                                                            })}
                                                            <TableCell
                                                                align="center"
                                                                onClick={() => {
                                                                    if (rowTotal > 0) {
                                                                        const data = filteredReports.filter(r => (r.sales_person || r.salesPerson || 'Unknown') === sp);
                                                                        handleCardClick('custom', `${sp} - All Usecases`, data);
                                                                    }
                                                                }}
                                                                sx={{
                                                                    fontWeight: 'bold', fontSize: '0.85rem',
                                                                    cursor: rowTotal > 0 ? 'pointer' : 'default',
                                                                    '&:hover': { bgcolor: rowTotal > 0 ? '#e3f2fd' : 'transparent' }
                                                                }}
                                                            >
                                                                {rowTotal > 0 ? rowTotal : '—'}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                                <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                                                    <TableCell sx={{ fontWeight: 'bold', background: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)', color: 'white', position: 'sticky', left: 0 }}>
                                                        🔢 Grand Total
                                                    </TableCell>
                                                    {salesPersonStatusList.map(status => (
                                                        <TableCell
                                                            key={status}
                                                            align="center"
                                                            onClick={() => {
                                                                const val = salesPersonMatrixData['Grand Total']?.[status] || 0;
                                                                if (val > 0) {
                                                                    const data = filteredReports.filter(r => (r.status || 'Unknown') === status);
                                                                    handleCardClick('custom', `Total - ${status} Usecases`, data);
                                                                }
                                                            }}
                                                            sx={{
                                                                fontWeight: 'bold',
                                                                cursor: (salesPersonMatrixData['Grand Total']?.[status] || 0) > 0 ? 'pointer' : 'default',
                                                                '&:hover': { bgcolor: (salesPersonMatrixData['Grand Total']?.[status] || 0) > 0 ? 'rgba(33, 150, 243, 0.1)' : 'transparent' }
                                                            }}
                                                        >
                                                            {salesPersonMatrixData['Grand Total']?.[status] || 0}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell
                                                        align="center"
                                                        onClick={() => handleCardClick('custom', 'Grand Total - All Usecases', filteredReports)}
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            background: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            '&:hover': { opacity: 0.9 }
                                                        }}
                                                    >
                                                        {salesPersonMatrixData['Grand Total']?.Total || 0}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}
                        </>
                    </TabPanel>

                    {/* ── Chart View ── */}
                    <TabPanel value={activeTab} index={1}>
                        <>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                                    <CircularProgress size={60} sx={{ color: 'primary.main' }} />
                                </Box>
                            ) : error ? (
                                <Box sx={{ p: 3 }}>
                                    <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                                </Box>
                            ) : (
                                <Box sx={{ p: 3 }}>
                                    <Paper
                                        elevation={4}
                                        sx={{
                                            p: 3,
                                            borderRadius: 3,
                                            height: '550px',
                                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                            border: '2px solid',
                                            borderColor: 'primary.light',
                                            width: '100%',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                🏭 Work Requests by Industry
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                startIcon={<DownloadIcon />}
                                                size="small"
                                                onClick={() => handleExportChart(industryChartRef, 'industry_requests')}
                                            >
                                                Export
                                            </Button>
                                        </Box>

                                        {/* Summary chips */}
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                            <Chip
                                                label={`📊 Total Filtered: ${grandTotal}`}
                                                color="primary"
                                                variant="outlined"
                                                size="small"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                            <Chip
                                                label={`🏭 Industries: ${industries.length}`}
                                                color="secondary"
                                                variant="outlined"
                                                size="small"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        </Box>

                                        <Box sx={{ height: 'calc(100% - 90px)', position: 'relative' }}>
                                            {industryChartData && industryChartData.labels?.length > 0 ? (
                                                <Bar
                                                    ref={industryChartRef}
                                                    data={industryChartData}
                                                    options={industryChartOptions}
                                                    plugins={[exportWhiteBackgroundPlugin]}
                                                />
                                            ) : (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                    <Typography variant="h5" color="text.secondary">
                                                        📊 No industry data available
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Paper>

                                    {/* ─── SME Chart ─── */}
                                    <Paper elevation={4} sx={{
                                        p: 3, borderRadius: 3, height: '550px', mt: 4,
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                        border: '2px solid', borderColor: 'secondary.light', width: '100%',
                                    }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                                                👤 Work Requests Processed by Consultant
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                color="secondary"
                                                startIcon={<DownloadIcon />}
                                                size="small"
                                                onClick={() => handleExportChart(smeChartRef, 'sme_requests')}
                                            >
                                                Export
                                            </Button>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                            <Chip label={`👥 SMEs: ${smeList.length}`} color="secondary" variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />
                                            <Chip label={`🔢 Grand Total: ${grandSmeTotal}`} color="success" variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />
                                        </Box>
                                        <Box sx={{ height: 'calc(100% - 90px)', position: 'relative' }}>
                                            {smeChartData && smeChartData.labels?.length > 0 ? (
                                                <Bar ref={smeChartRef} data={smeChartData} options={smeChartOptions} plugins={[exportWhiteBackgroundPlugin]} />
                                            ) : (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                    <Typography variant="h5" color="text.secondary">👤 No SME data available</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Paper>

                                    {/* ─── Sales Person Chart ─── */}
                                    <Paper elevation={4} sx={{
                                        p: 3, borderRadius: 3, height: '600px', mt: 4,
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)',
                                        border: '2px solid', borderColor: 'primary.light', width: '100%',
                                    }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                👤 Work Requests by Sales Person (Status-wise)
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                startIcon={<DownloadIcon />}
                                                size="small"
                                                onClick={() => handleExportChart(salesPersonChartRef, 'sales_person_requests')}
                                            >
                                                Export
                                            </Button>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                            <Chip label={`👥 Sales Persons: ${salesPersonList.length}`} color="primary" variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />
                                            <Chip label={`🔢 Grand Total: ${salesPersonMatrixData['Grand Total']?.Total || 0}`} color="success" variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />
                                        </Box>
                                        <Box sx={{ height: 'calc(100% - 90px)', position: 'relative' }}>
                                            {salesPersonChartData && salesPersonChartData.labels?.length > 0 ? (
                                                <Bar
                                                    ref={salesPersonChartRef}
                                                    data={salesPersonChartData}
                                                    plugins={[exportWhiteBackgroundPlugin]}
                                                    options={{
                                                        ...salesPersonChartOptions,
                                                        onHover: (event, elements) => {
                                                            const target = event.native ? event.native.target : event.target;
                                                            if (target) target.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
                                                        },
                                                        onClick: (event, elements) => {
                                                            if (elements.length > 0) {
                                                                const element = elements[0];
                                                                const datasetIndex = element.datasetIndex;
                                                                const index = element.index;
                                                                const sp = salesPersonChartData.labels[index];
                                                                const status = salesPersonChartData.datasets[datasetIndex].label;

                                                                const data = filteredReports.filter(r => {
                                                                    const rSp = r.sales_person || r.salesPerson || 'Unknown';
                                                                    const rStatus = r.status || 'Unknown';
                                                                    return rSp === sp && rStatus === status;
                                                                });
                                                                handleCardClick('custom', `${sp} - ${status} Usecases`, data);
                                                            }
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                    <Typography variant="h5" color="text.secondary">👤 No sales person data available</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Paper>
                                </Box>
                            )}
                        </>
                    </TabPanel>
                </Paper>
            </Box>

            <SCUsecaseListDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={dialogTitle}
                data={dialogData}
            />
        </Box>
    );
};

export default SCReport;
