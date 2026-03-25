import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx-js-style";
import axios from "axios";
import { Bar, Line, Pie } from "react-chartjs-2";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import 'chartjs-plugin-datalabels';
import EmployeeReport from './EmployeeReport'; // Adjust path as needed
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,

} from "chart.js";

// Material-UI components
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
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  useMediaQuery,     // Add this
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText

} from "@mui/material";
import {
  Menu as MenuIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  DateRange as DateRangeIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Warning as WarningIcon,
  MonetizationOn as MonetizationOnIcon,
  Description as DescriptionIcon

} from "@mui/icons-material";




// Register ChartJS components - UPDATED VERSION
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  ChartDataLabels,
  // ChartDataLabels // Remove this line for now
);

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

// StatCard Component for Grafana-style cards
const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{
    background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
    color: 'white',
    borderRadius: 3,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    height: '100%',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
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




const Report = ({ onNavigate, onLogout, user }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pocTypes, setPocTypes] = useState([]);
  const [statusTypes, setStatusTypes] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chartData, setChartData] = useState(null);
  const [statusChartData, setStatusChartData] = useState(null);
  const [clientTypeChartData, setClientTypeChartData] = useState(null);
  const [clientTypePieChartData, setClientTypePieChartData] = useState(null);
  const [regionFilter, setRegionFilter] = useState("");
  const [pocTypeFilter, setPocTypeFilter] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState("last365");
  const [chartType, setChartType] = useState("bar");
  const [overdueUsecases, setOverdueUsecases] = useState([]);
  const [pocConversionChartData, setPocConversionChartData] = useState(null);
  const [salesPersonsConversionRate, setSalesPersonsConversionRate] = useState({});
  // Add this with other useState declarations:
  const [salesReportActive, setSalesReportActive] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [monthlyChartData, setMonthlyChartData] = useState(null);

  const [salesPersonChartData, setSalesPersonChartData] = useState(null);

  // Add these new state variables with other useState declarations
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);


  const [clientTypeFilter, setClientTypeFilter] = useState({
    Client: true,
    Partner: true,
    Internal: false
  });

  // Add this new state for All Usecase Report - all options checked by default
  const [allReportClientTypeFilter, setAllReportClientTypeFilter] = useState({
    Client: true,
    Partner: true,
    Internal: true  // Changed from false to true
  });



  // Add with other useState declarations:
  const [showEmployeeReport, setShowEmployeeReport] = useState(false);

  // Add these state variables at the top with other useState declarations (around line 120-130)
  const logoutInProgress = React.useRef(false);
  const lastActivity = React.useRef(Date.now());
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

  // Token expiry check
  const isTokenExpired = React.useCallback((token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }, []);

  // Auto logout handler
  const handleAutoLogout = React.useCallback(() => {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;

    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');

    if (onLogout) {
      onLogout();
    }
  }, [onLogout]);

  // Update activity timestamp
  const updateActivity = React.useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  // Add these useEffect hooks after your existing useEffect (around line 280-320)

  // Periodic token expiry check
  React.useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('authToken');
      if (token && isTokenExpired(token)) {
        handleAutoLogout();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [handleAutoLogout, isTokenExpired]);

  // Inactivity tracking
  React.useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'mousemove'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    const interval = setInterval(() => {
      if (Date.now() - lastActivity.current > INACTIVITY_TIMEOUT) {
        handleAutoLogout();
      }
    }, 60000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [handleAutoLogout, updateActivity]);

  // Session expiry check
  React.useEffect(() => {
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

  // Add early return for logout in progress (around line 320-330)
  // Block UI rendering when logout is in progress
  if (logoutInProgress.current) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h5">Session expired. Redirecting to login...</Typography>
      </Box>
    );
  }


  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    updateChartData();
    updateStatusChartData();
    updateClientTypeChartData();
    updateClientTypePieChartData();
    updateOverdueUsecases();
    updateMonthlyChartData();
    updateSalesPersonChartData();
    updatePocConversionChartData();
  }, [
    reports,
    startDate,
    endDate,
    pocTypes,
    statusTypes,
    regionFilter,
    pocTypeFilter,
    dateRange,
    clientTypeFilter,
    allReportClientTypeFilter,  // Add this for All Usecase Report
    salesReportActive
  ]);

  const fetchInitialData = async () => {
    const token = localStorage.getItem("authToken");
    if (!token || isTokenExpired(token)) {
      handleAutoLogout();
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Fetch POC types
      const typesResponse = await axios.get(`${import.meta.env.VITE_API}/poc/getPocTypes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const typesData = Array.isArray(typesResponse.data) ? typesResponse.data : [];
      setPocTypes(typesData);

      // Fetch status types
      const statusResponse = await axios.get(`${import.meta.env.VITE_API}/poc/getStatusTypes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statusData = Array.isArray(statusResponse.data) ? statusResponse.data : [];
      setStatusTypes(statusData);

      // Fetch reports
      const reportsResponse = await axios.get(`${import.meta.env.VITE_API}/poc/getReports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const reportsData = Array.isArray(reportsResponse.data) ? reportsResponse.data : [];
      setReports(reportsData);

    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load dashboard data. Please check your connection and try again.");
      // Set all to empty arrays
      setPocTypes([]);
      setStatusTypes([]);
      setReports([]);
    }

    setLoading(false);
  };

  const extractStatusTypesFromReports = (reportsData) => {
    const statuses = new Set();
    reportsData.forEach(report => {
      if (report.status) statuses.add(report.status);
    });
    return Array.from(statuses).filter(status => status).sort();
  };

  const updateSalesPersonChartData = () => {
    const filtered = filterReports();

    if (filtered.length === 0) {
      setSalesPersonChartData({
        labels: ['No Data Available'],
        datasets: [{
          label: 'Number of Usecases',
          data: [0],
          backgroundColor: 'rgba(120, 120, 120, 0.6)',
        }]
      });
      return;
    }




    // Extract sales persons from reports
    const salesPersons = {};
    const allStatuses = new Set();
    const salesPersonTotals = {}; // NEW: Store totals per sales person

    filtered.forEach(report => {
      const salesPerson = report.sales_person || report.salesPerson || 'Unknown';
      const status = report.status || 'Unknown';

      if (salesPerson) {
        if (!salesPersons[salesPerson]) {
          salesPersons[salesPerson] = {};
          salesPersonTotals[salesPerson] = 0; // Initialize total
        }

        // Count by status
        salesPersons[salesPerson][status] = (salesPersons[salesPerson][status] || 0) + 1;
        salesPersonTotals[salesPerson]++; // Increment total count
        allStatuses.add(status);
      }
    });

    const labels = Object.keys(salesPersons).sort();
    const statuses = Array.from(allStatuses).filter(status => status).sort();

    // Define status colors
    const getStatusColor = (status) => {
      const statusLower = status?.toLowerCase();
      if (statusLower.includes('completed') || statusLower.includes('done') || statusLower.includes('success'))
        return 'rgba(76, 175, 80, 0.9)'; // Green
      if (statusLower.includes('converted'))
        return 'rgba(156, 39, 176, 0.9)'; // Purple
      if (statusLower.includes('progress') || statusLower.includes('ongoing'))
        return 'rgba(255, 152, 0, 0.9)'; // Orange
      if (statusLower.includes('pending') || statusLower.includes('waiting') || statusLower.includes('awaiting') || statusLower.includes('planned'))
        return 'rgba(33, 150, 243, 0.9)'; // Blue
      if (statusLower.includes('draft'))
        return 'rgba(255, 193, 7, 0.9)'; // Yellow
      if (statusLower.includes('dropped'))
        return 'rgba(96, 125, 139, 0.9)'; // Blue Grey
      if (statusLower.includes('hold'))
        return 'rgba(255, 87, 34, 0.9)'; // Deep Orange
      if (statusLower.includes('cancel') || statusLower.includes('reject') || statusLower.includes('failed'))
        return 'rgba(244, 67, 54, 0.9)'; // Red
      return 'rgba(158, 158, 158, 0.9)'; // Grey
    };

    // Create datasets for each status
    const datasets = statuses.map(status => ({
      label: status,
      data: labels.map(person => salesPersons[person][status] || 0),
      backgroundColor: getStatusColor(status),
      borderColor: getStatusColor(status).replace('0.9', '1'),
      borderWidth: 1,
      borderRadius: 4,
      barPercentage: 0.8,
      categoryPercentage: 0.8,
    }));

    setSalesPersonChartData({
      labels: labels,
      datasets: datasets,
      // NEW: Store totals for each sales person
      totals: labels.map(person => salesPersonTotals[person] || 0)
    });
  };

  const updatePocConversionChartData = () => {
    // Generate data for ANY selected POC type when in Sales Report mode
    const filtered = filterReports();

    if (filtered.length === 0) {
      setPocConversionChartData({
        labels: ['No Data Available'],
        datasets: [
          {
            label: 'Completed Usecases',
            data: [0],
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
          },
          {
            label: 'Converted Usecases',
            data: [0],
            backgroundColor: 'rgba(156, 39, 176, 0.7)',
          }
        ]
      });
      return;
    }

    // Extract sales persons from reports and count completed/converted
    const salesPersons = {};

    filtered.forEach(report => {
      const salesPerson = report.sales_person || report.salesPerson || 'Unknown';
      if (salesPerson) {
        if (!salesPersons[salesPerson]) {
          salesPersons[salesPerson] = {
            completedOnly: 0,
            converted: 0,
            totalCompleted: 0
          };
        }

        const status = report.status?.toLowerCase() || '';

        // Check if converted
        if (status.includes('converted')) {
          salesPersons[salesPerson].converted++;
          salesPersons[salesPerson].totalCompleted++;
        }
        // Check if completed but NOT converted
        else if (status.includes('completed') || status.includes('done') || status.includes('success')) {
          salesPersons[salesPerson].completedOnly++;
          salesPersons[salesPerson].totalCompleted++;
        }
      }
    });

    // Filter out sales persons with zero totalCompleted
    const filteredSalesPersons = {};
    Object.keys(salesPersons).forEach(person => {
      if (salesPersons[person].totalCompleted > 0) {
        filteredSalesPersons[person] = salesPersons[person];
      }
    });

    const labels = Object.keys(filteredSalesPersons).sort();

    if (labels.length === 0) {
      setPocConversionChartData({
        labels: ['No Data Available'],
        datasets: [
          {
            label: 'Completed Usecases',
            data: [0],
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
          },
          {
            label: 'Converted Usecases',
            data: [0],
            backgroundColor: 'rgba(156, 39, 176, 0.7)',
          }
        ]
      });
      setSalesPersonsConversionRate({});
      return;
    }

    // Calculate conversion rates
    const conversionRates = {};
    labels.forEach(person => {
      const { totalCompleted, converted } = filteredSalesPersons[person];
      conversionRates[person] = totalCompleted > 0
        ? Math.round((converted / totalCompleted) * 100)
        : 0;
    });

    setSalesPersonsConversionRate(conversionRates);

    setPocConversionChartData({
      labels: labels,
      datasets: [
        {
          label: 'Completed Usecases',
          data: labels.map(person => filteredSalesPersons[person].totalCompleted),
          backgroundColor: 'rgba(76, 175, 80, 0.9)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 2,
          borderRadius: 8,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
        },
        {
          label: 'Converted Usecases',
          data: labels.map(person => filteredSalesPersons[person].converted),
          backgroundColor: 'rgba(156, 39, 176, 0.9)',
          borderColor: 'rgba(156, 39, 176, 1)',
          borderWidth: 2,
          borderRadius: 8,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
        }
      ]
    });
  };

  // Enhanced chart options with better styling
  const chartOptions = {

    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: { size: 14, weight: 'bold' },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: ' USECASES BY TYPE',
        font: { size: 20, weight: 'bold' },
        padding: { top: 10, bottom: 20 },
        color: theme.palette.primary.main
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 8,
        usePointStyle: true,
      },
      // Update datalabels configuration for bar charts
      datalabels: {
        display: true,
        color: '#333333',
        font: {
          size: 12,
          weight: 'bold'
        },
        formatter: function (value, context) {
          return value > 0 ? value : '';
        },
        anchor: 'end',
        align: 'top',
        offset: 15, // Increased offset for more gap
        clip: false
      }

    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: { size: 12, weight: 'bold' },
          maxRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        suggestedMax: function (context) {
          const chart = context.chart;
          const datasets = chart.data.datasets;
          let maxValue = 0;

          datasets.forEach(dataset => {
            const datasetMax = Math.max(...dataset.data);
            if (datasetMax > maxValue) maxValue = datasetMax;
          });

          if (maxValue === 0) return 5;
          // Add more space at top for labels (increased from 10% to 25%)
          const extra = Math.max(2, Math.ceil(maxValue * 0.25));
          return maxValue + extra;
        },
        ticks: {
          stepSize: 1,
          font: { size: 12, weight: 'bold' },
          precision: 0
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
          drawBorder: false
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    },
    // Add these at the chart level
    barPercentage: 0.8,
    categoryPercentage: 0.8,
  };


  const salesPersonChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: '👤 USECASES BY SALES PERSON (Status-wise)',
        padding: {
          top: 5,      // Space above title
          bottom: 15   // Space between title and chart (INCREASED)
        },
        font: {
          size: 20,   // Slightly larger title
          weight: 'bold'
        }
      },
      totalLabels: {
        display: true,
        color: '#333333',
        font: {
          size: 14,
          weight: 'bold'
        },
        padding: 15
      },
      datalabels: {
        display: true,
        color: function (context) {
          // Improved color detection logic
          const backgroundColor = context.dataset.backgroundColor;

          // If it's a single color (not an array), use that
          if (typeof backgroundColor === 'string') {
            const color = backgroundColor;
            if (color && color.includes('rgba')) {
              const rgb = color.match(/\d+/g);
              if (rgb && rgb.length >= 3) {
                const r = parseInt(rgb[0]);
                const g = parseInt(rgb[1]);
                const b = parseInt(rgb[2]);
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                return brightness > 180 ? '#000000' : '#ffffff'; // Adjusted threshold
              }
            }
          }
          // If it's an array (different colors for each bar)
          else if (Array.isArray(backgroundColor)) {
            const color = backgroundColor[context.dataIndex];
            if (color && color.includes('rgba')) {
              const rgb = color.match(/\d+/g);
              if (rgb && rgb.length >= 3) {
                const r = parseInt(rgb[0]);
                const g = parseInt(rgb[1]);
                const b = parseInt(rgb[2]);
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                return brightness > 180 ? '#000000' : '#ffffff';
              }
            }
          }

          // Fallback to black for high contrast
          return '#000000';
        },
        font: {
          size: 10,
          weight: 'bold',
          family: 'Arial, sans-serif'
        },
        anchor: 'center',
        align: 'center',
        offset: 0,
        clip: false,
        formatter: function (value) {
          return value > 0 ? value : '';
        }
      },
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          },
          footer: function (tooltipItems) {
            const total = tooltipItems.reduce(
              (sum, item) => sum + item.parsed.y,
              0
            );
            return `Total: ${total}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: isMobile ? 10 : 12,
            weight: 'bold'
          },
          maxRotation: 45,
          minRotation: 45,
          autoSkip: false,
          padding: 20,
          callback: function (value, index, values) {
            const label = this.getLabelForValue(value);
            const isMobile = window.innerWidth < 768;

            if (isMobile) {
              if (label.length > 10) {
                return label.substring(0, 8) + '...';
              }
            } else {
              if (label.length > 20) {
                return label.substring(0, 18) + '...';
              }
            }
            return label;
          }
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        suggestedMax: function (context) {
          const datasets = context.chart.data.datasets;
          let maxTotal = 0;

          // Sum all visible datasets (not transparent ones)
          const visibleDatasets = datasets.filter(ds =>
            ds.backgroundColor !== 'transparent' && ds.borderColor !== 'transparent'
          );
          const points = visibleDatasets[0]?.data?.length || 0;

          for (let i = 0; i < points; i++) {
            let sum = 0;
            visibleDatasets.forEach(ds => sum += ds.data[i] || 0);
            maxTotal = Math.max(maxTotal, sum);
          }

          // Add extra space for total labels and segment labels
          return maxTotal + Math.ceil(maxTotal * 0.3);
        },
        ticks: {
          stepSize: 1,
          precision: 0,
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
          drawBorder: false
        }
      }
    },
    // Adjust layout padding
    layout: {
      padding: {
        top: 50, // Increased for total labels
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    // Ensure all elements are visible
    elements: {
      bar: {
        borderWidth: 1,
        borderRadius: 2,
        borderSkipped: false
      }
    }
  };


  const pocConversionChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: '💰 POC CONVERSION BY SALES PERSON'
      },
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const salesPerson = context.label;
            const datasetIndex = context.datasetIndex;
            const chart = context.chart;

            const completedData = chart.data.datasets[0].data[context.dataIndex];
            const convertedData = chart.data.datasets[1].data[context.dataIndex];

            if (label === 'Completed Usecases') {
              const conversionRate = salesPersonsConversionRate?.[salesPerson] || 0;
              const regularCompleted = completedData - convertedData;

              return [
                `✅ Total Completed: ${completedData}`,
                `   - Regular Completed: ${regularCompleted}`,
                `   - Converted: ${convertedData}`,
                `📈 Conversion Rate: ${conversionRate}%`
              ];
            } else if (label === 'Converted Usecases') {
              const conversionRate = salesPersonsConversionRate?.[salesPerson] || 0;
              const totalCompleted = completedData;

              return [
                `💰 Converted: ${value}`,
                `📊 Part of Total Completed: ${totalCompleted}`,
                `🎯 Conversion Rate: ${conversionRate}%`
              ];
            }
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: isMobile ? 10 : 11,
            weight: 'bold'
          },
          maxRotation: 45,
          minRotation: 45,
          padding: 20,
          autoSkip: false,
          maxTicksLimit: isMobile ? 8 : 15,
          callback: function (value, index, values) {
            // Truncate long names
            const label = this.getLabelForValue(value);
            if (label.length > 25) {
              return label.substring(0, 12) + '...';
            }
            return label;
          }
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Usecases',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        ticks: {
          stepSize: 1,
          precision: 0
        }
      }
    },
    elements: {
      bar: {
        borderWidth: 2,
        borderRadius: 4,
      }
    },
    // Adjust bar grouping
    barPercentage: 0.8,
    categoryPercentage: 0.7,
    // Add layout padding for labels
    layout: {
      padding: {
        top: 20,
        bottom: 60, // Increased bottom padding for rotated labels
        left: 10,
        right: 10
      }
    }
  };

  const extractPocTypesFromReports = (reportsData) => {

    const types = new Set();
    reportsData.forEach(report => {
      if (report.pocType) types.add(report.pocType);
      else if (report.poc_type) types.add(report.poc_type);
    });
    console.log(Array.from(types).filter(type => type));
    return Array.from(types).filter(type => type);
  };

  const extractClientTypesFromReports = (reportsData) => {
    const clientTypes = new Set();
    reportsData.forEach(report => {
      if (report.partner_client_own) clientTypes.add(report.partner_client_own);
    });
    return Array.from(clientTypes).filter(type => type).sort();
  };

  const getRegions = () => {
    const regions = [...new Set(reports.map(r => r.region).filter(Boolean))];
    return regions.sort();
  };

  const updateMonthlyChartData = () => {
    const filtered = filterReports(); // Now uses only main filters

    if (filtered.length === 0) {
      setMonthlyChartData({
        labels: ['No Data Available'],
        datasets: [{
          label: 'Number of Usecases',
          data: [0],
          backgroundColor: 'rgba(120, 120, 120, 0.6)',
          borderColor: 'rgba(120, 120, 120, 1)',
          borderWidth: 2,
        }]
      });
      return;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Determine date range for filtering
    let startDateForChart = new Date();
    let endDateForChart = new Date();

    if (dateRange === 'last30') {
      startDateForChart.setDate(startDateForChart.getDate() - 30);
    } else if (dateRange === 'last90') {
      startDateForChart.setDate(startDateForChart.getDate() - 90);
    } else if (dateRange === 'last180') {
      startDateForChart.setDate(startDateForChart.getDate() - 180);
    } else if (dateRange === 'last365') {
      startDateForChart.setDate(startDateForChart.getDate() - 365);
    } if (dateRange === 'custom' && startDate && endDate) {
      startDateForChart = new Date(startDate);
      endDateForChart = new Date(endDate);
    } else if (dateRange === 'all') {
      // For "all", find earliest and latest dates from filtered data
      const dates = filtered
        .map(r => r.start_date ? new Date(r.start_date) : null)
        .filter(d => d);

      if (dates.length > 0) {
        startDateForChart = new Date(Math.min(...dates));
        endDateForChart = new Date(Math.max(...dates));
      } else {
        // Default to last 12 months if no dates
        startDateForChart.setMonth(startDateForChart.getMonth() - 11);
      }
    }

    // Generate all months between start and end dates
    const months = [];
    let currentDate = new Date(startDateForChart);
    currentDate.setDate(1); // Start from first day of month

    while (currentDate <= endDateForChart) {
      const monthYear = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      months.push(monthYear);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Remove duplicates while preserving order
    const uniqueMonths = [...new Set(months)];

    // Count usecases by month
    const monthlyCounts = {};
    uniqueMonths.forEach(month => {
      monthlyCounts[month] = 0;
    });

    filtered.forEach(report => {
      if (report.start_date) {
        const reportDate = new Date(report.start_date);
        const monthYear = `${monthNames[reportDate.getMonth()]} ${reportDate.getFullYear()}`;

        if (monthlyCounts.hasOwnProperty(monthYear)) {
          monthlyCounts[monthYear]++;
        }
      }
    });

    const backgroundColors = getVibrantColors(uniqueMonths.length);

    setMonthlyChartData({
      labels: uniqueMonths,
      datasets: [
        {
          label: 'Number of Usecases',
          data: uniqueMonths.map(month => monthlyCounts[month]),
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.9', '1')),
          borderWidth: 3,
          borderRadius: 8,
          fill: chartType === 'line',
          tension: 0.4,
        },
      ],
    });
  };


  // Update this useEffect to handle dateRange changes
  useEffect(() => {
    const today = new Date();
    const last365 = new Date(today);

    switch (dateRange) {
      case 'last30':
        last365.setDate(last365.getDate() - 30);
        break;
      case 'last90':
        last365.setDate(last365.getDate() - 90);
        break;
      case 'last180':
        last365.setDate(last365.getDate() - 180);
        break;
      case 'last365':
        last365.setDate(last365.getDate() - 365);
        break;
      case 'all':
        // For "all", don't set specific dates
        setStartDate("");
        setEndDate("");
        return;
      case 'custom':
        // For custom, keep existing dates
        return;
      default:
        last365.setDate(last365.getDate() - 365);
    }

    setStartDate(last365.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, [dateRange]); // Now depends on dateRange


  // Update handleDateRangeChange to only set the dateRange state
  const handleDateRangeChange = (range) => {
    setDateRange(range);
    // Don't set dates here, they'll be set by the useEffect above
  };

  // Enhanced color schemes
  const getVibrantColors = (count) => {
    const vibrantPalette = [
      'rgba(255, 99, 132, 0.9)',    // Vibrant Pink
      'rgba(54, 162, 235, 0.9)',    // Bright Blue
      'rgba(255, 206, 86, 0.9)',    // Sunny Yellow
      'rgba(75, 192, 192, 0.9)',    // Teal
      'rgba(153, 102, 255, 0.9)',   // Purple
      'rgba(255, 159, 64, 0.9)',    // Orange
      'rgba(83, 102, 255, 0.9)',    // Royal Blue
      'rgba(40, 159, 56, 0.9)',     // Emerald Green
      'rgba(255, 105, 180, 0.9)',   // Hot Pink
      'rgba(0, 188, 212, 0.9)',     // Cyan
    ];
    return vibrantPalette.slice(0, count);
  };

  const updateChartData = () => {
    const filtered = filterReports();

    console.log('🔍 DEBUG updateChartData:');
    console.log('Filtered reports count:', filtered.length);
    console.log('POC Types:', pocTypes);
    console.log('Date Range:', dateRange);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    if (filtered.length === 0) {
      console.log('No filtered data for chart');
      setChartData({
        labels: ['No Data Available'],
        datasets: [{
          label: 'Number of Usecases',
          data: [0],
          backgroundColor: 'rgba(120, 120, 120, 0.6)',
          borderColor: 'rgba(120, 120, 120, 1)',
          borderWidth: 2,
        }]
      });
      return;
    }

    // Rest of your updateChartData function remains the same...
    const labels = pocTypes.length > 0 ? pocTypes : ['No Types Available'];
    const typeCounts = {};

    labels.forEach(type => {
      typeCounts[type] = filtered.filter(report => {
        const reportType = report.pocType || report.poc_type || 'Unknown';
        return reportType === type;
      }).length;
    });

    console.log('Type counts after filtering:', typeCounts);

    const backgroundColors = getVibrantColors(labels.length);

    setChartData({
      labels: labels,
      datasets: [{
        label: 'Number of Usecases',
        data: Object.values(typeCounts),
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.9', '1')),
        borderWidth: 3,
        borderRadius: 12,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      }],
    });
  };

  const updateStatusChartData = () => {
    const filtered = filterReports();

    if (filtered.length === 0) {
      console.log('No filtered data for status chart');
      setStatusChartData({
        labels: ["No Data Available"],
        datasets: [{
          label: "Number of Usecases",
          data: [0],
          backgroundColor: "rgba(120, 120, 120, 0.6)",
          borderColor: "rgba(120, 120, 120, 1)",
          borderWidth: 2,
        }],
      });
      return;
    }

    // Get all unique statuses
    const allStatuses = new Set();
    filtered.forEach(r => {
      if (r.status) allStatuses.add(r.status);
    });

    // Create labels - include all statuses
    const labels = Array.from(allStatuses).filter(status => status).sort();

    // Calculate counts for each status
    const statusCounts = {};
    labels.forEach(status => {
      statusCounts[status] = filtered.filter(r => r.status === status).length;
    });

    // Calculate completed count that includes converted
    const completedWithConverted = filtered.filter(r => {
      const status = r.status?.toLowerCase() || '';
      return status.includes('completed') || status.includes('done') || status.includes('success');
    }).length;

    const convertedCount = filtered.filter(r => {
      const status = r.status?.toLowerCase() || '';
      return status.includes('converted');
    }).length;

    // Update the Completed status count to include converted
    const completedStatusLabel = labels.find(label =>
      label.toLowerCase().includes('completed') ||
      label.toLowerCase().includes('done') ||
      label.toLowerCase().includes('success')
    );

    if (completedStatusLabel) {
      // Set completed bar to show completed+converted count
      statusCounts[completedStatusLabel] = completedWithConverted + convertedCount;
    }

    console.log('Status counts (Completed includes Converted):', statusCounts);

    const getStatusColor = (status) => {
      const statusLower = status?.toLowerCase();
      if (statusLower.includes('completed') || statusLower.includes('done') || statusLower.includes('success'))
        return 'rgba(76, 175, 80, 0.9)'; // Green
      if (statusLower.includes('converted'))
        return 'rgba(156, 39, 176, 0.9)'; // Purple
      if (statusLower.includes('progress') || statusLower.includes('ongoing'))
        return 'rgba(255, 152, 0, 0.9)'; // Orange - Make it darker for contrast
      if (statusLower.includes('pending') || statusLower.includes('waiting') || statusLower.includes('awaiting') || statusLower.includes('planned'))
        return 'rgba(33, 150, 243, 0.9)'; // Blue
      if (statusLower.includes('draft'))
        return 'rgba(255, 193, 7, 0.9)'; // Yellow - Make darker
      if (statusLower.includes('dropped'))
        return 'rgba(96, 125, 139, 0.9)'; // Blue Grey
      if (statusLower.includes('hold'))
        return 'rgba(255, 87, 34, 0.9)'; // Deep Orange
      if (statusLower.includes('cancel') || statusLower.includes('reject') || statusLower.includes('failed'))
        return 'rgba(244, 67, 54, 0.9)'; // Red
      return 'rgba(100, 100, 100, 0.9)'; // Darker grey for better contrast
    };

    setStatusChartData({
      labels: labels,
      datasets: [{
        label: "Number of Usecases",
        data: labels.map(status => statusCounts[status]),
        backgroundColor: labels.map(status => getStatusColor(status)),
        borderColor: labels.map(status => getStatusColor(status).replace('0.9', '1')),
        borderWidth: 3,
        borderRadius: 12,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      }],
    });
  };



  const updateClientTypeChartData = () => {
    const filtered = filterReports();

    // 🔍 DEBUG: Check what client type data exists
    console.log('🔍 DEBUG Client Types Analysis:');
    console.log('Total filtered reports:', filtered.length);

    const clientTypesFound = filtered.map(report => ({
      partner_client_own: report.partner_client_own,
      id: report.id
    }));
    console.log('Client type data in reports:', clientTypesFound);

    const clientTypes = extractClientTypesFromReports(filtered);
    console.log('Extracted client types:', clientTypes);

    if (filtered.length === 0) {
      setClientTypeChartData({
        labels: ['No Data Available'],
        datasets: [{
          label: 'Number of Usecases',
          data: [0],
          backgroundColor: 'rgba(120, 120, 120, 0.6)',
          borderColor: 'rgba(120, 120, 120, 1)',
          borderWidth: 2,
        }]
      });
      return;
    }

    const labels = clientTypes.length > 0 ? clientTypes : ['No Client Types Available'];

    const clientTypeCounts = {};
    labels.forEach(clientType => {
      clientTypeCounts[clientType] = filtered.filter(report => {
        const reportClientType = report.partner_client_own || 'Unknown';
        return reportClientType === clientType;
      }).length;
    });

    console.log('Client type counts:', clientTypeCounts);

    const backgroundColors = getVibrantColors(labels.length);

    setClientTypeChartData({
      labels: labels,
      datasets: [
        {
          label: 'Number of Usecases',
          data: Object.values(clientTypeCounts),
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.9', '1')),
          borderWidth: 3,
          borderRadius: 12,
          borderSkipped: false,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
        },
      ],
    });
  };





  const updateClientTypePieChartData = () => {
    const filtered = filterReports();

    const clientTypes = extractClientTypesFromReports(filtered);

    if (filtered.length === 0 || clientTypes.length === 0) {
      setClientTypePieChartData({
        labels: ['No Data Available'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(200, 200, 200, 0.7)'],
          borderColor: ['rgba(200, 200, 200, 1)'],
          borderWidth: 2,
        }]
      });
      return;
    }

    const labels = clientTypes.slice(0, 5); // Show top 5 client types for pie chart
    const clientTypeCounts = {};

    labels.forEach(clientType => {
      clientTypeCounts[clientType] = filtered.filter(report => {
        const reportClientType = report.partner_client_own || 'Unknown';
        return reportClientType === clientType;
      }).length;
    });





    // Calculate "Others" if there are more than 5 client types
    let otherCount = 0;
    if (clientTypes.length > 5) {
      otherCount = filtered.length - Object.values(clientTypeCounts).reduce((a, b) => a + b, 0);
    }

    const pieLabels = otherCount > 0 ? [...labels, 'Others'] : labels;
    const pieData = otherCount > 0 ? [...Object.values(clientTypeCounts), otherCount] : Object.values(clientTypeCounts);

    setClientTypePieChartData({
      labels: pieLabels,
      datasets: [{
        data: pieData,
        backgroundColor: getVibrantColors(pieLabels.length),
        borderColor: getVibrantColors(pieLabels.length).map(color => color.replace('0.9', '1')),
        borderWidth: 3,
        hoverOffset: 15,
      }]
    });
  };

  const updateOverdueUsecases = () => {
    const today = new Date();
    const filtered = filterReports(); // Uses only start_date now

    const overdue = filtered.filter(report => {
      // Changed: Consider overdue if start_date is in past and not completed
      if (!report.start_date || report.status?.toLowerCase().includes('completed')) return false;
      const startDate = new Date(report.start_date);
      return startDate < today;
    });

    setOverdueUsecases(overdue);
  };

  const filterReports = () => {
    const filtered = reports.filter(r => {
      let matchesDate = true;
      let matchesRegion = true;
      let matchesPocType = true;
      let matchesClientType = true;

      // DATE FILTER
      if (dateRange !== "all") {
        const reportStartDate = r.start_date ? new Date(r.start_date) : null;

        if (dateRange === "custom") {
          if (startDate && endDate) {
            const filterStart = new Date(startDate);
            const filterEnd = new Date(endDate);
            filterEnd.setHours(23, 59, 59, 999);

            matchesDate =
              reportStartDate &&
              reportStartDate >= filterStart &&
              reportStartDate <= filterEnd;
          }
        } else {
          const today = new Date();
          let filterStart = new Date();

          switch (dateRange) {
            case "last30":
              filterStart.setDate(today.getDate() - 30);
              break;
            case "last90":
              filterStart.setDate(today.getDate() - 90);
              break;
            case "last180":
              filterStart.setDate(today.getDate() - 180);
              break;
            case "last365":
              filterStart.setDate(today.getDate() - 365);
              break;
            default:
              filterStart = null;
          }

          if (filterStart && reportStartDate) {
            filterStart.setHours(0, 0, 0, 0);
            matchesDate =
              reportStartDate >= filterStart &&
              reportStartDate <= today;
          }
        }
      }

      // REGION FILTER
      if (regionFilter) {
        matchesRegion = r.region === regionFilter;
      }

      // POC TYPE FILTER
      if (pocTypeFilter) {
        const reportType = r.pocType || r.poc_type;
        matchesPocType = reportType === pocTypeFilter;
      }

      // CLIENT TYPE FILTER - Use the appropriate filter based on report mode
      const activeClientFilter = salesReportActive ? clientTypeFilter : allReportClientTypeFilter;

      // Check if ANY client type checkbox is selected
      const hasActiveClientFilter = activeClientFilter.Client || activeClientFilter.Partner || activeClientFilter.Internal;

      // Get the report's client type (handle null/undefined/empty values)
      const reportClientType = r.partner_client_own || '';

      if (hasActiveClientFilter) {
        // If at least one checkbox is selected, filter by the selected types
        matchesClientType = (
          (activeClientFilter.Client && reportClientType === 'Client') ||
          (activeClientFilter.Partner && reportClientType === 'Partner') ||
          (activeClientFilter.Internal && reportClientType === 'Internal')
        );
      } else {
        // If NO checkboxes are selected (all false), show records with values OTHER than the 3 main types
        matchesClientType = !['Client', 'Partner', 'Internal'].includes(reportClientType);
      }

      return (
        matchesDate &&
        matchesRegion &&
        matchesPocType &&
        matchesClientType
      );
    });

    return filtered;
  };

  const statusChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: '🚀 USECASES BY STATUS'
      },
      datalabels: {
        ...chartOptions.plugins.datalabels,
        anchor: chartType === 'bar' ? 'end' : 'center',
        align: chartType === 'bar' ? 'top' : 'center'
      },
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const status = context.label;
            const statusLower = status?.toLowerCase() || '';

            // Get filtered reports for calculations
            const filtered = filterReports();

            // Calculate actual counts for breakdown
            const completedCount = filtered.filter(r => {
              const rStatus = r.status?.toLowerCase() || '';
              return (rStatus.includes('completed') || rStatus.includes('done') || rStatus.includes('success')) && !rStatus.includes('converted');
            }).length;

            const convertedCount = filtered.filter(r => {
              const rStatus = r.status?.toLowerCase() || '';
              return rStatus.includes('converted');
            }).length;

            // For Completed bar (which shows completed+converted)
            if (statusLower.includes('completed') || statusLower.includes('done') || statusLower.includes('success')) {
              return [
                `📊 ${label}: ${value}`,
                `   - Regular Completed: ${completedCount}`,
                `   - Converted: ${convertedCount}`,
                `💰 Total: ${completedCount + convertedCount}`
              ];
            }

            // For Converted bar
            if (statusLower.includes('converted')) {
              const totalCompletedWithConverted = completedCount + convertedCount;
              return [
                `💹 ${label}: ${value}`,
                `📈 Part of Completed Total: ${totalCompletedWithConverted}`
              ];
            }

            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        suggestedMax: function (context) {
          const chart = context.chart;
          const datasets = chart.data.datasets;
          let maxValue = 0;

          datasets.forEach(dataset => {
            const datasetMax = Math.max(...dataset.data);
            if (datasetMax > maxValue) maxValue = datasetMax;
          });

          if (maxValue === 0) return 1;
          const extra = Math.max(1, Math.ceil(maxValue * 0.15));
          return maxValue + extra;
        }
      }
    }
  };

  // Replace the existing getPocFilteredCompletedCount function with this:
  const getPocFilteredCompletedCount = () => {
    if (!pocTypeFilter) {
      // If no POC type filter is selected, return the full completed count
      return completedIncludingConverted;
    }

    // Filter reports by POC type only
    const pocFiltered = filteredReports.filter(report => {
      const reportType = report.pocType || report.poc_type || '';
      return reportType === pocTypeFilter;
    });

    // Calculate completed count for filtered POC type
    const filteredCompleted = pocFiltered.filter(r => {
      const status = r.status?.toLowerCase() || '';
      return status.includes('completed') || status.includes('done') || status.includes('success');
    }).length;

    const filteredConverted = pocFiltered.filter(r => {
      const status = r.status?.toLowerCase() || '';
      return status.includes('converted');
    }).length;

    return filteredCompleted + filteredConverted;
  };

  // Add this new function to get filtered converted count:
  const getPocFilteredConvertedCount = () => {
    if (!pocTypeFilter) {
      // If no POC type filter is selected, return the full converted count
      return convertedPocs;
    }

    // Filter reports by POC type only
    const pocFiltered = filteredReports.filter(report => {
      const reportType = report.pocType || report.poc_type || '';
      return reportType === pocTypeFilter;
    });

    // Calculate converted count for filtered POC type
    return pocFiltered.filter(r => {
      const status = r.status?.toLowerCase() || '';
      return status.includes('converted');
    }).length;
  };

  const clientTypeChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: '🏢 USECASES BY CLIENT TYPE'
      },
      datalabels: {
        ...chartOptions.plugins.datalabels,
        anchor: chartType === 'bar' ? 'end' : 'center',
        align: chartType === 'bar' ? 'top' : 'center'
      }
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        suggestedMax: function (context) {
          const chart = context.chart;
          const datasets = chart.data.datasets;
          let maxValue = 0;

          datasets.forEach(dataset => {
            const datasetMax = Math.max(...dataset.data);
            if (datasetMax > maxValue) maxValue = datasetMax;
          });

          if (maxValue === 0) return 1;
          const extra = Math.max(1, Math.ceil(maxValue * 0.1));
          return maxValue + extra;
        }
      }
    }
  };


  // Update the getPocFilteredConversionRate function to be more efficient:
  const getPocFilteredConversionRate = () => {
    if (!pocTypeFilter) {
      // If no POC type filter, return the overall conversion rate
      return conversionRate;
    }

    const filteredCompletedCount = getPocFilteredCompletedCount();
    const filteredConvertedCount = getPocFilteredConvertedCount();

    return filteredCompletedCount > 0
      ? Math.round((filteredConvertedCount / filteredCompletedCount) * 100)
      : 0;
  };

  const clientTypePieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 6,
        usePointStyle: true,
      },
      datalabels: {
        display: true, // Ensure this is true
        color: '#ffffff',
        font: {
          size: 11,
          weight: 'bold'
        },
        formatter: function (value, context) {
          if (value > 0) {
            // Show both value and percentage
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${value} (${percentage}%)`;
          }
          return '';
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#ffffff',
      }
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  const monthlyChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: dateRange === 'all'
          ? '📅 USECASES BY MONTH (Last 12 Months)'
          : `📅 USECASES BY MONTH (${dateRange === 'last30' ? 'Last 30 Days' :
            dateRange === 'last90' ? 'Last 90 Days' :
              dateRange === 'last180' ? 'Last 6 Months' :
                dateRange === 'last365' ? 'Last 1 Year' :
                  'Custom Date Range'})`
      },
      datalabels: {
        ...chartOptions.plugins.datalabels,
        color: chartType === 'bar' ? '#333333' : '#ffffff',
        font: {
          size: 12,
          weight: 'bold'
        },
        formatter: function (value, context) {
          return value > 0 ? value : '';
        },
        anchor: chartType === 'bar' ? 'end' : 'center',
        align: chartType === 'bar' ? 'top' : 'center'
      }
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        suggestedMax: function (context) {
          const chart = context.chart;
          const datasets = chart.data.datasets;
          let maxValue = 0;

          datasets.forEach(dataset => {
            const datasetMax = Math.max(...dataset.data);
            if (datasetMax > maxValue) maxValue = datasetMax;
          });

          if (maxValue === 0) return 1;
          const extra = Math.max(1, Math.ceil(maxValue * 0.2)); // 20% extra for monthly chart
          return maxValue + extra;
        },
        ticks: {
          stepSize: function (context) {
            const chart = context.chart;
            const max = chart.scales.y.max;
            // Dynamic step size based on max value
            if (max <= 5) return 1;
            if (max <= 10) return 2;
            if (max <= 20) return 5;
            return Math.ceil(max / 10);
          },
          font: { size: 12, weight: 'bold' },
          precision: 0
        }
      }
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setRegionFilter("");
    setPocTypeFilter("");
    setDateRange("all");
  };


  const refreshData = () => {
    fetchInitialData();
  };

  const filteredReports = filterReports();
  const totalPocs = filteredReports.length;

  const completedPocs = filteredReports.filter(r => {
    const status = r.status?.toLowerCase() || '';
    return status.includes('completed') || status.includes('done') || status.includes('success');
  }).length;

  const inProgressPocs = filteredReports.filter(r => {
    const status = r.status?.toLowerCase() || '';
    return status.includes('progress') || status.includes('ongoing');
  }).length;

  const overdueCount = overdueUsecases.length;

  const convertedPocs = filteredReports.filter(r => {
    const status = r.status?.toLowerCase() || '';
    return status.includes('converted');
  }).length;

  // Updated completed count that includes converted
  const completedIncludingConverted = completedPocs + convertedPocs;

  // Calculate conversion rate based on updated completed count
  const conversionRate = completedIncludingConverted > 0
    ? Math.round((convertedPocs / completedIncludingConverted) * 100)
    : 0;

  // Add this function before the return statement
  const getTotalLabelsPlugin = {
    id: 'totalLabels',
    afterDatasetsDraw(chart) {
      const { ctx, data, scales } = chart;

      ctx.save();
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      // Get the y-axis scale
      const yScale = scales.y;

      data.datasets[0].data.forEach((_, index) => {
        // Calculate total for this index (sales person)
        const total = data.datasets.reduce((sum, dataset) => sum + dataset.data[index], 0);

        if (total > 0) {
          const meta = chart.getDatasetMeta(0);
          const point = meta.data[index];

          if (point) {
            // Get the pixel position for the top of the bar
            const barTopPixel = yScale.getPixelForValue(total);

            // Position the total label 25px above the bar top
            const x = point.x;
            const y = barTopPixel - 25; // 25px above the bar top

            // Draw the total text with shadow for visibility
            ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 4;
            ctx.fillText(total.toString(), x, y);
            ctx.shadowBlur = 0;
          }
        }
      });

      ctx.restore();
    }
  };

  // Add this plugin definition BEFORE the Report component
  const TotalLabelsPlugin = {
    id: 'totalLabels',
    afterDatasetsDraw(chart, args, options) {
      const { ctx, data, scales } = chart;

      // Only apply to stacked bar charts
      if (!chart.options.scales?.x?.stacked || !chart.options.plugins?.totalLabels?.display) {
        return;
      }

      ctx.save();

      // Get plugin options
      const pluginOptions = chart.options.plugins.totalLabels || {};
      const color = pluginOptions.color || '#333333';
      const fontSize = pluginOptions.fontSize || 14;
      const fontWeight = pluginOptions.fontWeight || 'bold';
      const padding = pluginOptions.padding || 20;

      ctx.font = `${fontWeight} ${fontSize}px Arial`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      // Get the y-axis scale
      const yScale = scales.y;

      // Calculate totals for each bar (excluding any hidden/total datasets)
      const totals = [];
      const barCount = data.datasets[0]?.data?.length || 0;

      for (let i = 0; i < barCount; i++) {
        let total = 0;
        // Sum only the visible status datasets (exclude the last dataset if it's for totals)
        const visibleDatasets = data.datasets.filter((ds, idx) =>
          ds.backgroundColor !== 'transparent' &&
          ds.borderColor !== 'transparent'
        );

        visibleDatasets.forEach(dataset => {
          total += dataset.data[i] || 0;
        });
        totals.push(total);
      }

      // Draw total labels for each bar
      totals.forEach((total, index) => {
        if (total > 0) {
          const meta = chart.getDatasetMeta(0);
          const bar = meta.data[index];

          if (bar) {
            // Get the pixel position for the top of the stacked bar
            const barTopPixel = yScale.getPixelForValue(total);

            // Position the total label with gap above the bar
            const x = bar.x;
            const y = barTopPixel - padding; // Gap from top of bar

            // Draw the total text with shadow for better visibility
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 3;
            ctx.fillText(total.toString(), x, y);
            ctx.shadowBlur = 0;
          }
        }
      });

      ctx.restore();
    }
  };

  // Register the plugin with ChartJS
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LineElement,
    PointElement,
    ChartDataLabels,
    TotalLabelsPlugin  // Add this line
  );


  // Add this function before the renderChart function
  const createSalesPersonChartWithTotals = () => {
    if (!salesPersonChartData) return null;

    // Clone the original data
    const chartData = { ...salesPersonChartData };

    // Remove any previously added "Total" dataset
    chartData.datasets = chartData.datasets.filter(ds =>
      ds.label !== 'Total' && ds.backgroundColor !== 'transparent'
    );

    return chartData;
  };

  // Update the renderChart function to ensure proper options
  // Update the renderChart function to ensure proper options and handle line charts
  const renderChart = (data, options) => {
    if (!data || !data.labels || data.labels.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography variant="h5" color="text.secondary">
            📊 No data available
          </Typography>
        </Box>
      );
    }

    // Check if this is a stacked bar chart (Sales Person chart)
    const isStackedBar = options.scales?.x?.stacked === true;

    // Clone options and ensure datalabels are enabled
    const finalOptions = {
      ...options,
      plugins: {
        ...options.plugins,
        datalabels: {
          ...(options.plugins?.datalabels || {}),
          display: true,
        }
      }
    };

    // For stacked bar charts (sales person chart), use special configuration
    if (isStackedBar) {
      finalOptions.plugins.datalabels = {
        ...finalOptions.plugins.datalabels,
        display: true,
        color: function (context) {
          // Dynamic color based on background brightness
          const backgroundColor = context.dataset.backgroundColor;
          if (Array.isArray(backgroundColor)) {
            const color = backgroundColor[context.dataIndex];
            if (color && color.includes('rgba')) {
              const rgb = color.match(/\d+/g);
              if (rgb && rgb.length >= 3) {
                const r = parseInt(rgb[0]);
                const g = parseInt(rgb[1]);
                const b = parseInt(rgb[2]);
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                return brightness > 125 ? '#333333' : '#ffffff';
              }
            }
          }
          return '#ffffff';
        },
        font: {
          size: 10,
          weight: 'bold'
        },
        anchor: 'center',
        align: 'center',
        offset: 0,
        clip: false,
        padding: 4,
        formatter: function (value) {
          return value > 0 ? value : '';
        }
      };
    }

    // Handle different chart types
    switch (chartType) {
      case 'line':
        // For line charts, use the Line component
        finalOptions.plugins.datalabels = {
          ...finalOptions.plugins.datalabels,
          anchor: 'end',
          align: 'top',
          offset: 10,
          color: '#333333',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: 4,
          padding: {
            top: 2,
            bottom: 2,
            left: 4,
            right: 4
          },
          font: {
            size: 11,
            weight: 'bold'
          },
          formatter: function (value) {
            return value > 0 ? value : '';
          }
        };
        return <Line data={data} options={finalOptions} />;

      case 'bar':
      default:
        // For regular bar charts
        if (!isStackedBar) {
          finalOptions.plugins.datalabels = {
            ...finalOptions.plugins.datalabels,
            anchor: 'end',
            align: 'top',
            offset: 15,
            clip: false,
            color: '#333333',
            font: {
              size: 12,
              weight: 'bold'
            },
            formatter: function (value) {
              return value > 0 ? value : '';
            }
          };
        }
        return <Bar data={data} options={finalOptions} />;
    }
  };


  // Add this function before the return statement
  const exportFilteredData = (selectedOptions) => {
    setExportLoading(true);

    // Get all filtered reports
    const filtered = filterReports();

    // Filter reports based on selected options
    let reportsToExport = [];

    if (selectedOptions.total) {
      // If Total is selected, include all filtered reports
      reportsToExport = [...filtered];
    } else {
      // Otherwise, include based on individual selections

      // Add regular completed (not converted)
      if (selectedOptions.regularCompleted) {
        const regularCompleted = filtered.filter(r => {
          const status = r.status?.toLowerCase() || '';
          return (status.includes('completed') || status.includes('done') || status.includes('success')) &&
            !status.includes('converted');
        });
        reportsToExport = [...reportsToExport, ...regularCompleted];
      }

      // Add converted
      if (selectedOptions.converted) {
        const converted = filtered.filter(r => {
          const status = r.status?.toLowerCase() || '';
          return status.includes('converted');
        });
        reportsToExport = [...reportsToExport, ...converted];
      }

      // Add in progress
      if (selectedOptions.inProgress) {
        const inProgress = filtered.filter(r => {
          const status = r.status?.toLowerCase() || '';
          return status.includes('progress') || status.includes('ongoing');
        });
        reportsToExport = [...reportsToExport, ...inProgress];
      }

      // Add other (everything else not covered above)
      if (selectedOptions.other) {
        const other = filtered.filter(r => {
          const status = r.status?.toLowerCase() || '';
          const isCompleted = (status.includes('completed') || status.includes('done') || status.includes('success')) &&
            !status.includes('converted');
          const isConverted = status.includes('converted');
          const isInProgress = status.includes('progress') || status.includes('ongoing');

          return !isCompleted && !isConverted && !isInProgress;
        });
        reportsToExport = [...reportsToExport, ...other];
      }

      // Remove duplicates if any (though there shouldn't be any)
      reportsToExport = reportsToExport.filter((report, index, self) =>
        index === self.findIndex(r => r.id === report.id)
      );
    }

    // Prepare the data for export (rest of your existing export code remains the same)
    const exportData = reportsToExport.map(report => ({
      // ... your existing export mapping code ...
      'Usecase ID': report.id || '',
      'Usecase Name': report.pocName || report.poc_prj_name || '',
      'Company Name': report.entityName || report.companyName || '',
      'Partner Name': report.partnerName || '',
      'Description': report.description || report.usecase || '',
      'Tags': report.tags || '',
      'Usecase Type': report.pocType || report.poc_type || '',
      'Customer Type': report.partner_client_own || '',
      'Is Billable': report.isBillable || '',
      'Status': report.status || '',
      'Start Date': report.startDate || report.start_date || '',
      'End Date': report.endDate || report.excepted_end_date || '',
      'Actual Start Date': report.actualStartDate || '',
      'Actual End Date': report.actualEndDate || '',
      'Sales Person': report.salesPerson || report.sales_person || '',
      'Assigned To': report.assignedTo || report.assigned_to || '',
      'Created By': report.createdBy || '',
      'Region': report.region || '',
      'SPOC Email': report.spocEmail || '',
      'SPOC Designation': report.spocDesignation || '',
      'Estimated Efforts (Days)': report.estimatedEfforts || '',
      'Total Worked Hours': report.totalWorkedHours || '',
      'Variance Days': report.varianceDays || '',
      'Approved By': report.approvedBy || '',
      'Remark': report.remark || '',
    }));


    // Create Excel file
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    const colWidths = [];
    for (let i = range.s.c; i <= range.e.c; i++) {
      colWidths.push({ wch: 25 });
    }
    ws['!cols'] = colWidths;

    // Style the headers
    for (let i = range.s.c; i <= range.e.c; i++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        font: {
          bold: true,
          color: { rgb: "FF000000" }
        },
        fill: {
          fgColor: { rgb: "FFFFFF00" }
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true
        },
        border: {
          top: { style: "thin", color: { rgb: "FF000000" } },
          bottom: { style: "thin", color: { rgb: "FF000000" } },
          left: { style: "thin", color: { rgb: "FF000000" } },
          right: { style: "thin", color: { rgb: "FF000000" } }
        }
      };
    }

    // Style data rows
    for (let R = range.s.r + 1; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

        if (!ws[cellAddress]) {
          ws[cellAddress] = { t: 's', v: '' };
        }

        if (!ws[cellAddress].s) {
          ws[cellAddress].s = {};
        }

        ws[cellAddress].s.border = {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        };

        ws[cellAddress].s.alignment = {
          horizontal: "left",
          vertical: "center",
          wrapText: true
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Reports');

    const reportType = salesReportActive ? 'Sales_Report' : 'All_Usecase_Report';
    const date = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `${reportType}_${date}_${timestamp}_${reportsToExport.length}_records.xlsx`;

    XLSX.writeFile(wb, filename);
    setExportLoading(false);
  };

  // Add this new component for the Export Dialog
  const ExportDialog = ({ open, onClose, onExport, counts, loading }) => {
    const [selectedOptions, setSelectedOptions] = useState({
      total: true,
      completed: true,
      regularCompleted: true,
      converted: true,
      inProgress: true,
      other: true
    });

    // Reset state when dialog opens
    useEffect(() => {
      if (open) {
        setSelectedOptions({
          total: true,
          completed: true,
          regularCompleted: true,
          converted: true,
          inProgress: true,
          other: true
        });
      }
    }, [open]);

    const handleSelectAll = () => {
      setSelectedOptions({
        total: true,
        completed: true,
        regularCompleted: true,
        converted: true,
        inProgress: true,
        other: true
      });
    };

    const handleClearAll = () => {
      setSelectedOptions({
        total: false,
        completed: false,
        regularCompleted: false,
        converted: false,
        inProgress: false,
        other: false
      });
    };

    const handleExport = () => {
      // Pass the current selectedOptions to the export function
      onExport(selectedOptions);
      onClose();
    };

    const getSelectedRecordsCount = () => {
      // If Total is selected, return all records
      if (selectedOptions.total) {
        return counts.total;
      }

      // Otherwise, sum up individual selections
      let count = 0;

      // Only count regularCompleted if it's selected AND not superseded by total
      if (selectedOptions.regularCompleted) {
        count += counts.regularCompleted;
      }

      // Only count converted if it's selected
      if (selectedOptions.converted) {
        count += counts.converted;
      }

      // Only count inProgress if it's selected
      if (selectedOptions.inProgress) {
        count += counts.inProgress;
      }

      // Only count other if it's selected
      if (selectedOptions.other) {
        count += counts.other;
      }

      return count;
    };

    // Calculate if any option is selected (for enabling export button)
    const hasSelectedOptions = selectedOptions.total ||
      selectedOptions.regularCompleted ||
      selectedOptions.converted ||
      selectedOptions.inProgress ||
      selectedOptions.other;

    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon />
            Export Usecases
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'text.secondary' }}>
            Select records to export:
          </Typography>

          <List>
            {/* Total Usecases */}
            <ListItem
              secondaryAction={
                <Checkbox
                  edge="end"
                  checked={selectedOptions.total}
                  onChange={(e) => {
                    const newTotal = e.target.checked;
                    setSelectedOptions({
                      total: newTotal,
                      completed: newTotal,
                      regularCompleted: newTotal,
                      converted: newTotal,
                      inProgress: newTotal,
                      other: newTotal
                    });
                  }}
                />
              }
              sx={{ bgcolor: '#f5f5f5', borderRadius: 1, mb: 1 }}
            >
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Total Usecases
                  </Typography>
                }
                secondary={`${counts.total} records (All filtered records)`}
              />
            </ListItem>

            {/* Completed (including converted) */}
            <ListItem
              secondaryAction={
                <Checkbox
                  edge="end"
                  checked={selectedOptions.completed}
                  onChange={(e) => {
                    const newCompleted = e.target.checked;
                    setSelectedOptions(prev => ({
                      ...prev,
                      total: false, // Uncheck total when manually selecting
                      completed: newCompleted,
                      // If unchecking completed, also uncheck its children
                      regularCompleted: newCompleted ? prev.regularCompleted : false,
                      converted: newCompleted ? prev.converted : false
                    }));
                  }}
                />
              }
              sx={{ bgcolor: '#e8f5e8', borderRadius: 1, mb: 1, ml: 2 }}
            >
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    ✅ Completed (including Converted)
                  </Typography>
                }
                secondary={`${counts.completed} records`}
              />
            </ListItem>

            {/* Regular Completed (without converted) */}
            <ListItem
              secondaryAction={
                <Checkbox
                  edge="end"
                  checked={selectedOptions.regularCompleted}
                  onChange={(e) => {
                    setSelectedOptions(prev => ({
                      ...prev,
                      total: false, // Uncheck total when manually selecting
                      regularCompleted: e.target.checked,
                      // If checking regularCompleted, ensure completed is checked
                      completed: e.target.checked ? true : prev.completed
                    }));
                  }}
                  disabled={!selectedOptions.completed && !selectedOptions.regularCompleted}
                />
              }
              sx={{ ml: 4 }}
            >
              <ListItemText
                primary={
                  <Typography variant="body2" color="text.secondary">
                    └─ Regular Completed
                  </Typography>
                }
                secondary={`${counts.regularCompleted} records`}
              />
            </ListItem>

            {/* Converted */}
            <ListItem
              secondaryAction={
                <Checkbox
                  edge="end"
                  checked={selectedOptions.converted}
                  onChange={(e) => {
                    setSelectedOptions(prev => ({
                      ...prev,
                      total: false, // Uncheck total when manually selecting
                      converted: e.target.checked,
                      // If checking converted, ensure completed is checked
                      completed: e.target.checked ? true : prev.completed
                    }));
                  }}
                  disabled={!selectedOptions.completed && !selectedOptions.converted}
                />
              }
              sx={{ ml: 4 }}
            >
              <ListItemText
                primary={
                  <Typography variant="body2" color="text.secondary">
                    └─ Converted
                  </Typography>
                }
                secondary={`${counts.converted} records`}
              />
            </ListItem>

            {/* In Progress */}
            <ListItem
              secondaryAction={
                <Checkbox
                  edge="end"
                  checked={selectedOptions.inProgress}
                  onChange={(e) => {
                    setSelectedOptions(prev => ({
                      ...prev,
                      total: false, // Uncheck total when manually selecting
                      inProgress: e.target.checked
                    }));
                  }}
                />
              }
              sx={{ bgcolor: '#fff3e0', borderRadius: 1, mt: 1, ml: 2 }}
            >
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                    🔄 In Progress
                  </Typography>
                }
                secondary={`${counts.inProgress} records`}
              />
            </ListItem>

            {/* Other */}
            {counts.other > 0 && (
              <ListItem
                secondaryAction={
                  <Checkbox
                    edge="end"
                    checked={selectedOptions.other}
                    onChange={(e) => {
                      setSelectedOptions(prev => ({
                        ...prev,
                        total: false, // Uncheck total when manually selecting
                        other: e.target.checked
                      }));
                    }}
                  />
                }
                sx={{ bgcolor: '#f5f5f5', borderRadius: 1, mt: 1, ml: 2 }}
              >
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#757575' }}>
                      📌 Other
                    </Typography>
                  }
                  secondary={`${counts.other} records (Draft, Dropped, Hold, etc.)`}
                />
              </ListItem>
            )}
          </List>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
            <Button size="small" onClick={handleSelectAll}>Select All</Button>
            <Button size="small" onClick={handleClearAll}>Clear All</Button>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            color="primary"
            disabled={!hasSelectedOptions || loading}
            startIcon={<DescriptionIcon />}
          >
            Export Selected ({getSelectedRecordsCount()} records)
          </Button>
        </DialogActions>
      </Dialog>
    );
  };


  // Add this function to get filtered counts for export dialog
  const getExportCounts = () => {
    const filtered = filterReports();

    const regularCompleted = filtered.filter(r => {
      const status = r.status?.toLowerCase() || '';
      return (status.includes('completed') || status.includes('done') || status.includes('success')) &&
        !status.includes('converted');
    }).length;

    const converted = filtered.filter(r => {
      const status = r.status?.toLowerCase() || '';
      return status.includes('converted');
    }).length;

    const inProgress = filtered.filter(r => {
      const status = r.status?.toLowerCase() || '';
      return status.includes('progress') || status.includes('ongoing');
    }).length;

    const completedIncludingConverted = regularCompleted + converted;

    // Calculate Other count (Total - Completed - In Progress)
    const other = filtered.length - completedIncludingConverted - inProgress;

    return {
      total: filtered.length,
      completed: completedIncludingConverted, // Completed including converted
      regularCompleted: regularCompleted,
      converted: converted,
      inProgress: inProgress,
      other: other > 0 ? other : 0 // Ensure non-negative
    };
  };



  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <AppBar position="static" elevation={2} sx={{
        bgcolor: 'primary.main',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Toolbar>

          <Button
            color="inherit"
            onClick={() => onNavigate('dashboard')}
            startIcon={<DashboardIcon />}
            sx={{ mr: 2 }}
          >
            Dashboard
          </Button>

          <Typography
            variant="h5"
            component="h1"
            color="inherit"
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            🚀 Usecases Dashboard
          </Typography>

          {/* All Usecase Report button */}
          <Button
            color="inherit"
            onClick={() => {
              setShowEmployeeReport(false);
              setSalesReportActive(false);
              setPocTypeFilter("");
              setDateRange("last365");
              setRegionFilter("");
              setStartDate("");
              setEndDate("");
              // Reset All Report filters to default when switching to All Usecase Report
              setAllReportClientTypeFilter({
                Client: true,
                Partner: true,
                Internal: true
              });
            }}
            variant="outlined"
            startIcon={<span>📊</span>}
            sx={{
              mr: 1,
              borderColor: 'rgba(255,255,255,0.3)',
              fontWeight: 'bold',
              backgroundColor: (!showEmployeeReport && !salesReportActive) ? 'rgba(255,255,255,0.2)' : 'transparent'
            }}
          >
            All Usecase Report
          </Button>

          {/* Sales Report button */}
          <Button
            color="inherit"
            onClick={() => {
              setShowEmployeeReport(false);
              setPocTypeFilter(""); // Changed from "POC" to "" (All Usecase Types)
              setSalesReportActive(true);
              // Reset Sales Report filters to default when switching to Sales Report
              setClientTypeFilter({
                Client: true,
                Partner: true,
                Internal: false
              });
              setDateRange("last365");
              setRegionFilter("");
              setStartDate("");
              setEndDate("");
            }}
            variant="outlined"
            startIcon={<span>💰</span>}
            sx={{
              mr: 1,
              borderColor: 'rgba(255,255,255,0.3)',
              fontWeight: 'bold',
              backgroundColor: salesReportActive ? 'rgba(255,255,255,0.2)' : 'transparent'
            }}
          >
            Sales Report
          </Button>

          {/* Employee Report button */}
          <Button
            color="inherit"
            onClick={() => {
              setShowEmployeeReport(true);
              setSalesReportActive(false);
              setPocTypeFilter("");
              setDateRange("all");
            }}
            variant="outlined"
            startIcon={<span>👥</span>}
            sx={{
              mr: 1,
              borderColor: 'rgba(255,255,255,0.3)',
              fontWeight: 'bold',
              backgroundColor: showEmployeeReport ? 'rgba(255,255,255,0.2)' : 'transparent'
            }}
          >
            Employee Report
          </Button>

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

      <Box sx={{ p: isMobile ? 1 : 1 }}>
        {/* Show Employee Report when active, otherwise show the regular report content */}
        {showEmployeeReport ? (
          // Just render the EmployeeReport component directly without any extra styling
          <EmployeeReport
            onNavigate={onNavigate}
            onLogout={onLogout}
            user={user}
            embedded={true}
          />
        ) : (
          // Original report content (All Usecase Report or Sales Report)
          <>
            {/* Summary Cards - Grafana Style with Pie Chart */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* First 3 cards remain exactly as they were */}
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Usecases"
                  value={totalPocs}
                  icon={<DashboardIcon sx={{ fontSize: 30 }} />}
                  color="#0061ff"
                  subtitle="All active projects"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Completed"
                  value={completedIncludingConverted}
                  icon={<CheckCircleIcon sx={{ fontSize: 30 }} />}
                  color="#32a852"
                  subtitle={`${conversionRate}% conversion rate`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="In Progress"
                  value={inProgressPocs}
                  icon={<PlayArrowIcon sx={{ fontSize: 30 }} />}
                  color="#ff9f1c"
                  subtitle="Active development"
                />
              </Grid>

              {pocTypeFilter === "POC" && (
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Converted"
                    value={getPocFilteredConvertedCount()}
                    icon={<MonetizationOnIcon sx={{ fontSize: 30 }} />}
                    color="#9c27b0"
                    subtitle={
                      `Of ${getPocFilteredCompletedCount()} completed\n` +
                      `${getPocFilteredConversionRate()}% conversion rate`
                    }
                  />
                </Grid>
              )}

              {/* 4th card with pie chart - similar style to first 3 cards */}
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
                        {filteredReports.length}
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
                            plugins: {
                              ...clientTypePieChartOptions.plugins,
                              legend: {
                                ...clientTypePieChartOptions.plugins.legend,
                                display: false
                              }
                            }
                          }}
                        />
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ opacity: 0.8, textAlign: 'center' }}>
                        No client type data
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>


            {/* Chart Type Selector */}
            <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    📈 Chart Type:
                  </Typography>
                  {['bar', 'line'].map((type) => (
                    <Chip
                      key={type}
                      icon={type === 'bar' ? <BarChartIcon /> : <TrendingUpIcon />}
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                      onClick={() => setChartType(type)}
                      color={chartType === type ? 'primary' : 'default'}
                      variant={chartType === type ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 'bold' }}
                    />
                  ))}
                </Box>

                {/* Export Button */}
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<span>📊</span>}
                  onClick={() => setExportDialogOpen(true)}
                  sx={{
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #733df0 0%, #1d47ff 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #30396e 0%, #030c94 100%)'
                    }
                  }}
                  disabled={filteredReports.length === 0}
                >
                  Export Excel ({filteredReports.length} records)
                </Button>

              </Box>
            </Paper>

            {/* Additional Usecase Type Filter */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'orange.800' }}>
                🎯 Additional Usecase Type Filter
              </Typography>

              {/* Filter by Type - Show in BOTH Sales Report AND All Usecase Report */}
              <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Filter by Type
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={salesReportActive ? clientTypeFilter.Client : allReportClientTypeFilter.Client}
                          onChange={(e) => {
                            if (salesReportActive) {
                              setClientTypeFilter({
                                ...clientTypeFilter,
                                Client: e.target.checked
                              });
                            } else {
                              setAllReportClientTypeFilter({
                                ...allReportClientTypeFilter,
                                Client: e.target.checked
                              });
                            }
                          }}
                        />
                      }
                      label="Client"
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={salesReportActive ? clientTypeFilter.Partner : allReportClientTypeFilter.Partner}
                          onChange={(e) => {
                            if (salesReportActive) {
                              setClientTypeFilter({
                                ...clientTypeFilter,
                                Partner: e.target.checked
                              });
                            } else {
                              setAllReportClientTypeFilter({
                                ...allReportClientTypeFilter,
                                Partner: e.target.checked
                              });
                            }
                          }}
                        />
                      }
                      label="Partner"
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={salesReportActive ? clientTypeFilter.Internal : allReportClientTypeFilter.Internal}
                          onChange={(e) => {
                            if (salesReportActive) {
                              setClientTypeFilter({
                                ...clientTypeFilter,
                                Internal: e.target.checked
                              });
                            } else {
                              setAllReportClientTypeFilter({
                                ...allReportClientTypeFilter,
                                Internal: e.target.checked
                              });
                            }
                          }}
                        />
                      }
                      label="Internal"
                    />
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
                    sx={{ minWidth: 220 }}
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
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Chip
                      label={`✅ Completed: ${completedIncludingConverted}`}
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Chip
                      label={`🔄 In Progress: ${inProgressPocs}`}
                      color="warning"
                      variant="outlined"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            <br />

            {/* Enhanced Filters Section */}
            <Paper elevation={4} sx={{ p: 3, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
              {/* Title and Action Buttons in One Line */}
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

              {/* Date Range Filter Chips */}
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

              {/* Filter Inputs */}
              <Grid container spacing={2}>
                {/* Date Inputs */}
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

              {error && (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: 2, fontWeight: 'bold' }}>
                  ⚠️ {error}
                </Alert>
              )}
            </Paper>


            <br />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={80} sx={{ color: 'primary.main' }} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Show ALL charts when NOT in Sales Report mode */}
                {!salesReportActive && (
                  <>
                    {/* ALWAYS SHOW: Monthly Trend Chart */}
                    <Paper elevation={4} sx={{
                      p: 3,
                      borderRadius: 3,
                      height: '500px',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      border: '2px solid',
                      borderColor: 'secondary.light'
                    }}>
                      {monthlyChartData ? (
                        renderChart(monthlyChartData, monthlyChartOptions)
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <Typography variant="h5" color="text.secondary">
                            📅 No monthly data available
                          </Typography>
                        </Box>
                      )}
                    </Paper>

                    {/* Main Chart (Usecases by Type) */}
                    <Paper elevation={4} sx={{
                      p: 3,
                      borderRadius: 3,
                      height: '500px',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      border: '2px solid',
                      borderColor: 'primary.light'
                    }}>
                      {chartData ? (
                        renderChart(chartData, chartOptions)
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <Typography variant="h5" color="text.secondary">
                            📊 No chart data available
                          </Typography>
                        </Box>
                      )}
                    </Paper>

                    {/* USECASES BY STATUS */}
                    <Paper elevation={4} sx={{
                      p: 3,
                      borderRadius: 3,
                      height: '500px',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      border: '2px solid',
                      borderColor: 'success.light',
                      width: '100%'
                    }}>
                      {statusChartData ? (
                        renderChart(statusChartData, statusChartOptions)
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <Typography variant="h5" color="text.secondary">
                            🎯 No status data available
                          </Typography>
                        </Box>
                      )}
                    </Paper>

                    {/* USECASES BY CLIENT TYPE */}
                    <Paper elevation={4} sx={{
                      p: 3,
                      borderRadius: 3,
                      height: '500px',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      border: '2px solid',
                      borderColor: 'info.light',
                      width: '100%'
                    }}>
                      {clientTypeChartData ? (
                        renderChart(clientTypeChartData, clientTypeChartOptions)
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <Typography variant="h5" color="text.secondary">
                            🏢 No client type data available
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </>
                )}

                {/* When Sales Report is active, show ONLY these two charts */}
                {salesReportActive && (
                  <>
                    {/* 1. Usecases by Sales Person (Status-wise) in Sales Report */}
                    <Paper elevation={4} sx={{
                      p: 3,
                      borderRadius: 3,
                      height: '600px',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      border: '2px solid',
                      borderColor: 'warning.light',
                      width: '100%'
                    }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: 'orange.800' }}>
                        👤 Usecases by Sales Person (Status-wise)
                      </Typography>
                      {salesPersonChartData ? (
                        <Bar
                          data={createSalesPersonChartWithTotals()}
                          options={salesPersonChartOptions}
                        />
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <Typography variant="h5" color="text.secondary">
                            👤 No sales person data available
                          </Typography>
                        </Box>
                      )}
                    </Paper>

                    {/* 2. POC CONVERSION BY SALES PERSON */}
                    {pocConversionChartData && (
                      <Paper elevation={4} sx={{
                        p: 3,
                        borderRadius: 3,
                        height: '600px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        border: '2px solid',
                        borderColor: 'warning.main',
                        width: '100%'
                      }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: 'orange.800' }}>
                          🎯 {pocTypeFilter || "ALL"} CONVERSION BY SALES PERSON
                        </Typography>
                        {pocConversionChartData && pocConversionChartData.labels && pocConversionChartData.labels.length > 0 ? (
                          renderChart(pocConversionChartData, pocConversionChartOptions)
                        ) : (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography variant="h5" color="text.secondary">
                              📊 No POC conversion data available
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    )}
                  </>
                )}
              </Box>
            )}
          </>
        )}
      </Box>

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={exportFilteredData}
        counts={getExportCounts()}
        loading={exportLoading}
      />

    </Box>
  );
};

export default Report;