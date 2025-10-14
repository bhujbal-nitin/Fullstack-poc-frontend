import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
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
  IconButton,
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
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
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
  Warning as WarningIcon

} from "@mui/icons-material";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
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
  const [doughnutChartData, setDoughnutChartData] = useState(null);
  const [clientTypeChartData, setClientTypeChartData] = useState(null);
  const [clientTypePieChartData, setClientTypePieChartData] = useState(null);
  const [regionFilter, setRegionFilter] = useState("");
  const [pocTypeFilter, setPocTypeFilter] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState("all");
  const [chartType, setChartType] = useState("bar");
  const [overdueUsecases, setOverdueUsecases] = useState([]);


  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    updateChartData();
    updateStatusChartData();
    updateDoughnutChartData();
    updateClientTypeChartData();
    updateClientTypePieChartData();
    updateOverdueUsecases();
  }, [reports, startDate, endDate, pocTypes, statusTypes, regionFilter, pocTypeFilter, dateRange]);

  const fetchInitialData = async () => {
    const token = localStorage.getItem("authToken");
    setLoading(true);
    setError("");

    try {
      const typesResponse = await axios.get("http://localhost:5050/poc/getPocTypes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const typesData = Array.isArray(typesResponse.data) ? typesResponse.data : [];
      setPocTypes(typesData);
    } catch (error) {
      console.error("Error fetching Usecase types:", error);
      const extractedTypes = extractPocTypesFromReports(reports);
      console.log(extractedTypes)
      setPocTypes(extractedTypes);
    }

    try {
      const statusResponse = await axios.get("http://localhost:5050/poc/getStatusTypes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statusData = Array.isArray(statusResponse.data) ? statusResponse.data : [];
      setStatusTypes(statusData);
    } catch (error) {
      console.error("Error fetching status types:", error);
      const extractedStatuses = extractStatusTypesFromReports(reports);
      setStatusTypes(extractedStatuses);
    }

    try {
      const reportsResponse = await axios.get("http://localhost:5050/poc/getReports", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const reportsData = Array.isArray(reportsResponse.data) ? reportsResponse.data : [];
      setReports(reportsData);

    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("Failed to load reports. Showing sample data.");
      const sampleData = generateSampleData();
      setReports(sampleData);
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

  

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    const today = new Date();

    switch (range) {
      case 'last30':
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        setStartDate(last30.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'last90':
        const last90 = new Date(today);
        last90.setDate(last90.getDate() - 90);
        setStartDate(last90.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'last365':  // Add this case for Last 1 Year
        const last365 = new Date(today);
        last365.setDate(last365.getDate() - 365);
        setStartDate(last365.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'custom':
        setStartDate('');
        setEndDate('');
        break;
      case 'all':
      default:
        setStartDate('');
        setEndDate('');
        break;
    }
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

    if (filtered.length === 0) {
      setChartData({
        labels: ['No Data Available'],
        datasets: [{
          label: 'Number of POCs',
          data: [0],
          backgroundColor: 'rgba(120, 120, 120, 0.6)',
          borderColor: 'rgba(120, 120, 120, 1)',
          borderWidth: 2,
        }]
      });
      return;
    }

    const labels = pocTypes.length > 0 ? pocTypes : ['No Types Available'];
    const typeCounts = {};
    labels.forEach(type => {
      typeCounts[type] = filtered.filter(report => {
        const reportType = report.pocType || report.poc_type || 'Unknown';
        return reportType === type;
      }).length;
    });

    const backgroundColors = getVibrantColors(labels.length);

    setChartData({
      labels: labels,
      datasets: [
        {
          label: 'Number of Usecases',
          data: Object.values(typeCounts),
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

    console.log('🔍 DEBUG updateChartData:');
    console.log('Total filtered reports:', filtered.length);
    console.log('Reports counted in chart:', Object.values(typeCounts).reduce((a, b) => a + b, 0));
    console.log('Available pocTypes:', pocTypes);
    console.log('Type counts:', typeCounts);
  };

  const updateStatusChartData = () => {
    const filtered = filterReports();

    if (filtered.length === 0) {
      setStatusChartData({
        labels: ["No Data Available"],
        datasets: [
          {
            label: "Number of Usecases",
            data: [0],
            backgroundColor: "rgba(120, 120, 120, 0.6)",
            borderColor: "rgba(120, 120, 120, 1)",
            borderWidth: 2,
          },
        ],
      });
      return;
    }

    const labels = statusTypes.length > 0 ? statusTypes : ['No Status Available'];
    const statusCounts = {};
    labels.forEach(status => {
      statusCounts[status] = filtered.filter(r => (r.status || "Unknown") === status).length;
    });

    const getStatusColor = (status) => {
      const statusLower = status?.toLowerCase();
      if (statusLower.includes('completed') || statusLower.includes('done') || statusLower.includes('success'))
        return 'rgba(76, 175, 80, 0.9)';
      if (statusLower.includes('progress') || statusLower.includes('ongoing'))
        return 'rgba(255, 152, 0, 0.9)';
      if (statusLower.includes('pending') || statusLower.includes('waiting') || statusLower.includes('planned'))
        return 'rgba(33, 150, 243, 0.9)';
      if (statusLower.includes('cancel') || statusLower.includes('reject') || statusLower.includes('failed'))
        return 'rgba(244, 67, 54, 0.9)';
      return 'rgba(158, 158, 158, 0.9)';
    };

    setStatusChartData({
      labels: labels,
      datasets: [
        {
          label: "Number of Usecases",
          data: labels.map(status => statusCounts[status]),
          backgroundColor: labels.map(status => getStatusColor(status)),
          borderColor: labels.map(status => getStatusColor(status).replace('0.9', '1')),
          borderWidth: 3,
          borderRadius: 12,
          borderSkipped: false,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
        },
      ],
    });
  };

  const updateDoughnutChartData = () => {
    const filtered = filterReports();

    if (filtered.length === 0) {
      setDoughnutChartData({
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(200, 200, 200, 0.7)'],
          borderColor: ['rgba(200, 200, 200, 1)'],
          borderWidth: 2,
        }]
      });
      return;
    }

    const labels = pocTypes.length > 0 ? pocTypes.slice(0, 6) : ['No Types'];
    const typeCounts = {};
    const uncategorized = []; // 👈 track uncategorized

    labels.forEach(type => {
      typeCounts[type] = filtered.filter(report => {
        const reportType = report.pocType || report.poc_type || 'Unknown';
        if (reportType === type) {
          return true;
        }
        return false;
      }).length;
    });

    // find records that don't belong to any label
    filtered.forEach(report => {
      const reportType = report.pocType || report.poc_type || 'Unknown';
      if (!labels.includes(reportType)) {
        uncategorized.push(report); // 👈 collect uncategorized
      }
    });

    // 👀 Print uncategorized records in console
    if (uncategorized.length > 0) {
      console.warn("Uncategorized Records:", uncategorized);
    }

    setDoughnutChartData({
      labels: labels,
      datasets: [{
        data: Object.values(typeCounts),
        backgroundColor: getVibrantColors(labels.length),
        borderColor: getVibrantColors(labels.length).map(color => color.replace('0.9', '1')),
        borderWidth: 3,
        hoverOffset: 20,
        cutout: '50%',
        borderRadius: 10,
        spacing: 3,
      }]
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
    const overdue = filterReports().filter(report => {
      if (!report.excepted_end_date || report.status?.toLowerCase().includes('completed')) return false;
      const endDate = new Date(report.excepted_end_date);
      return endDate < today;
    });
    setOverdueUsecases(overdue);
  };

  const filterReports = () => {
    return reports.filter(r => {
      let matchesDate = true;
      let matchesRegion = true;
      let matchesPocType = true;

      if (startDate || endDate) {
        const reportStartDate = r.start_date ? new Date(r.start_date) : null;
        const reportEndDate = r.excepted_end_date ? new Date(r.excepted_end_date) : null;

        if (startDate && endDate) {
          const filterStart = new Date(startDate);
          const filterEnd = new Date(endDate);
          matchesDate =
            reportStartDate && reportStartDate >= filterStart &&
            reportEndDate && reportEndDate <= filterEnd;
        } else if (startDate) {
          const filterStart = new Date(startDate);
          matchesDate = reportStartDate && reportStartDate >= filterStart;
        } else if (endDate) {
          const filterEnd = new Date(endDate);
          matchesDate = reportEndDate && reportEndDate <= filterEnd;
        }
      }

      if (regionFilter) {
        matchesRegion = r.region === regionFilter;
      }

      if (pocTypeFilter) {
        const reportType = r.pocType || r.poc_type;
        matchesPocType = reportType === pocTypeFilter;
      }

      return matchesDate && matchesRegion && matchesPocType;
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
        ticks: {
          stepSize: 1,
          font: { size: 12, weight: 'bold' }
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
    }
  };

  const statusChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: '🚀 USECASES BY STATUS'
      }
    }
  };

  const clientTypeChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: '🏢 USECASES BY CLIENT TYPE'
      }
    }
  };

  const clientTypePieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend to make space for larger chart
      },
      title: {
        display: false, // Hide title since we have it in the Paper component
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 6,
        usePointStyle: true,
      }
    },
    // Increase the chart radius
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#ffffff',
      }
    },
    // Adjust layout to use more space
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
  const completedPocs = filteredReports.filter(r =>
    r.status?.toLowerCase().includes('completed') || r.status?.toLowerCase().includes('done')
  ).length;
  const inProgressPocs = filteredReports.filter(r =>
    r.status?.toLowerCase().includes('progress') || r.status?.toLowerCase().includes('ongoing')
  ).length;
  const overdueCount = overdueUsecases.length;

  const renderChart = (data, options, title) => {
    switch (chartType) {
      case 'doughnut':
        return <Doughnut data={data} options={options} />;
      case 'line':
        return <Line data={data} options={options} />;
      default:
        return <Bar data={data} options={options} />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <AppBar position="static" elevation={2} sx={{
        bgcolor: 'primary.main',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Toolbar>
          {/* <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => onNavigate('dashboard')}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton> */}

          <Button
            color="inherit"
            onClick={() => onNavigate('dashboard')}
            startIcon={<DashboardIcon />}
            sx={{ mr: 2 }}
          >
            Dashboard
          </Button>

          <AnalyticsIcon sx={{ mr: 2, fontSize: 30 }} />
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
            🚀 Usecases Analytics Dashboard
          </Typography>
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

      <Box sx={{ p: isMobile ? 1 : 3 }}>
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
              value={completedPocs}
              icon={<CheckCircleIcon sx={{ fontSize: 30 }} />}
              color="#32a852"
              subtitle={`${totalPocs ? Math.round((completedPocs / totalPocs) * 100) : 0}% success rate`}
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

        {/* Rest of your existing code remains the same... */}
        {/* Enhanced Filters Section */}
        <Paper elevation={4} sx={{ p: 3, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3, alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ minWidth: 200, fontWeight: 'bold', color: 'primary.main' }}>
              🎛️ Filter Analytics
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['all', 'last30', 'last90', 'last365', 'custom'].map((range) => (
                <Chip
                  key={range}
                  label={
                    range === 'all' ? '📅 All Time' :
                      range === 'last30' ? '🔥 Last 30 Days' :
                        range === 'last90' ? '🚀 Last 90 Days' :
                          range === 'last365' ? '📊 Last 1 Year' : '⚙️ Custom Date'
                  }
                  onClick={() => handleDateRangeChange(range)}
                  color={dateRange === range ? 'primary' : 'default'}
                  variant={dateRange === range ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 'bold' }}
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: 'auto' }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={refreshData}
                size="medium"
                sx={{ fontWeight: 'bold' }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                size="medium"
                sx={{ fontWeight: 'bold' }}
              >
                Clear All
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="📅 Start Date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateRange("custom");
                }}
                InputLabelProps={{ shrink: true }}
                disabled={dateRange !== "custom"}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="📅 End Date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateRange("custom");
                }}
                InputLabelProps={{ shrink: true }}
                disabled={dateRange !== "custom"}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="🌍 Filter by Region"
                value={regionFilter}
                sx={{ minWidth: 220 }}
                onChange={(e) => setRegionFilter(e.target.value)}
              >
                <MenuItem value="">All Regions</MenuItem>
                {getRegions().map((region) => (
                  <MenuItem key={region} value={region}>
                    {region}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2, fontWeight: 'bold' }}>
              ⚠️ {error}
            </Alert>
          )}
        </Paper>

        {/* Additional Usecase Type Filter - Added after first graph */}
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'orange.800' }}>
            🎯 Additional Usecase Type Filter
          </Typography>
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
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`📊 Total Filtered: ${filteredReports.length}`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
                <Chip
                  label={`✅ Completed: ${completedPocs}`}
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

        {/* Chart Type Selector */}
        <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              📈 Chart Type:
            </Typography>
            {['bar', 'doughnut', 'line'].map((type) => (
              <Chip
                key={type}
                icon={type === 'bar' ? <BarChartIcon /> : type === 'doughnut' ? <PieChartIcon /> : <TrendingUpIcon />}
                label={type.charAt(0).toUpperCase() + type.slice(1)}
                onClick={() => setChartType(type)}
                color={chartType === type ? 'primary' : 'default'}
                variant={chartType === type ? 'filled' : 'outlined'}
                sx={{ fontWeight: 'bold' }}
              />
            ))}
          </Box>
        </Paper>

        {/* Enhanced Charts Section - Vertical Layout */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={80} sx={{ color: 'primary.main' }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* First Row: Main Chart */}
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

            {/* USECASES BY STATUS - Full Width Chart */}
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

            {/* USECASES BY CLIENT TYPE - Full Width Chart */}
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
          </Box>
        )}
      </Box>
    </Box>
  );
};



export default Report;