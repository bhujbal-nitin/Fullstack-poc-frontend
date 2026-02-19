import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Autocomplete } from '@mui/material';
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
  Divider,
  MenuItem,
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
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  Sort as SortIcon,
  DateRange as DateRangeIcon,
  CalendarToday as CalendarTodayIcon,
} from "@mui/icons-material";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
);
ChartJS.register(ChartDataLabels);

ChartJS.defaults.devicePixelRatio = window.devicePixelRatio || 2;


const EmployeeReport = ({ onNavigate, onLogout, user, embedded = false }) => {

  // Add at the beginning of the component:
  const safeUser = user || {};
  const userName = safeUser.emp_name || safeUser.email_id || 'User';
  const userId = safeUser.emp_id || '';



  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [chartType, setChartType] = useState("bar");
  const [sortBy, setSortBy] = useState("hours");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [statusFilter, setStatusFilter] = useState('active'); // Add this line

  // Add these states
  const [dateRange, setDateRange] = useState('last7Days'); // Default to last week
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [usecases, setUsecases] = useState([]);
  const [selectedUsecase, setSelectedUsecase] = useState(null);

  const [estimatedEffortsHours, setEstimatedEffortsHours] = useState(0);
  const [totalEffortsHours, setTotalEffortsHours] = useState(0);

  useEffect(() => {
    console.log('Fetching usecases...');
    axios.get(`${import.meta.env.VITE_API}/poc/employee-report/usecases`)
      .then(res => {
        console.log('Usecase API response:', res.data);
        if (res.data.success) {
          setUsecases(res.data.data);
        }
      })
      .catch(err => {
        console.error('Usecase API error:', err);
      });
  }, []);


  useEffect(() => {
    fetchEmployeeData();
  }, [statusFilter, dateRange, selectedUsecase]);

  useEffect(() => {
    if (embedded) {
      // Adjust any specific settings for embedded mode
      console.log("EmployeeReport running in embedded mode");
    }
  }, [embedded]);


  // Add this function to calculate date ranges
  const calculateDateRange = (range) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {

      case 'allTime':
        return null; // 🔥 no date filter

      case 'currentWeek': {
        const day = today.getDay(); // 0 = Sunday, 1 = Monday
        const daysSinceMonday = (day === 0 ? 6 : day - 1);

        // Current Monday
        start.setDate(today.getDate() - daysSinceMonday);

        // Current Sunday
        end.setDate(start.getDate() + 6);
        break;
      }

      case 'last7Days':
        start.setDate(today.getDate() - 7);
        end.setDate(today.getDate() - 1);
        break;

      case 'lastWeek':
        const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        // Days since last Monday
        const daysSinceMonday = (day === 0 ? 6 : day - 1);
        // Last Monday = today - daysSinceMonday - 7
        start.setDate(today.getDate() - daysSinceMonday - 7);
        // Last Sunday = last Monday + 6
        end.setDate(today.getDate() - daysSinceMonday - 1);
        break;

      case 'last2Weeks':
        start.setDate(today.getDate() - 14);
        end.setDate(today.getDate() - 1);
        break;

      case 'lastMonth':
        start.setMonth(today.getMonth() - 1);
        start.setDate(1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;

      case 'last3Months':
        start.setMonth(today.getMonth() - 3);
        end.setDate(today.getDate() - 1);
        break;

      case 'last6Months':
        start.setMonth(today.getMonth() - 6);
        end.setDate(today.getDate() - 1);
        break;

      case 'lastYear':
        // Last 365 days (rolling year)
        start.setDate(today.getDate() - 365);
        end.setDate(today.getDate() - 1);
        break;

      case 'custom':
        // Use startDate and endDate from state
        return { start: startDate, end: endDate };

      default:
        start.setDate(today.getDate() - 7);
        end.setDate(today.getDate() - 1);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  // Add this function in your EmployeeReport component
  const formatHoursToHHMM = (decimalHours) => {
    if (!decimalHours || isNaN(decimalHours)) return "00:00";

    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const fetchEmployeeData = async () => {
    const token = localStorage.getItem("authToken");
    setLoading(true);
    setError("");

    try {
      console.log('📡 Making API call to getEmployeeWorkSummary...');

      // Map frontend status to backend status
      let backendStatus = statusFilter;
      if (statusFilter === 'active') {
        backendStatus = 'Active';
      } else if (statusFilter === 'inactive') {
        backendStatus = 'Inactive';
      } else if (statusFilter === 'all') {
        backendStatus = 'all';
      }

      // Calculate date range
      let dateParams = {};

      if (dateRange === 'custom' && startDate && endDate) {
        dateParams.startDate = startDate;
        dateParams.endDate = endDate;
      }
      else if (dateRange !== 'allTime') {
        const dates = calculateDateRange(dateRange);
        if (dates) {
          dateParams.startDate = dates.start;
          dateParams.endDate = dates.end;
        }
      }
      // 🔥 for allTime → dateParams stays empty


      const response = await axios.get(`${import.meta.env.VITE_API}/poc/employee-report/getEmployeeWorkSummary`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          status: backendStatus,
          ...dateParams,
          usecaseId: selectedUsecase?.poc_prj_id || null
        }
      });

      console.log('✅ API Response:', response.data);
      console.log('📊 Response structure:', {
        success: response.data.success,
        dataExists: !!response.data.data,
        employeesCount: response.data.data?.employees?.length || 0
      });

      if (response.data.success) {
        // Format the data for frontend display
        const formattedData = response.data.data.employees.map(emp => ({
          emp_id: emp.emp_id,
          emp_name: emp.emp_name,
          email_id: emp.email_id,
          role: emp.role,
          join_date: emp.first_work_date,
          status: (emp.status || '').toLowerCase(),
          work_hours: parseFloat(emp.total_work_hours) || 0,
          work_hours_display: formatHoursToHHMM(parseFloat(emp.total_work_hours) || 0),
          total_days_worked: emp.total_days_worked,
          total_projects: emp.total_projects
        }));

        console.log('🔄 Formatted data sample:', formattedData[0]);
        console.log('🔄 Status in formatted data:', formattedData[0]?.status);

        // Set the employees data
        setEmployees(formattedData);

        // Set the effort hours from summary
        setEstimatedEffortsHours(response.data.data.summary.estimated_efforts_hours || 0);
        setTotalEffortsHours(response.data.data.summary.total_efforts_hours || 0);
      } else {
        console.error('❌ API returned success: false');
        throw new Error(response.data.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error("❌ Error fetching employee data:", error);
      console.error("Error details:", error.response?.data || error.message);
      setError("Failed to load employee data. Please check your connection and try again.");
    }

    setLoading(false);
  };

  const filteredEmployees = useMemo(() => {
    console.log('🔍 Filtering employees...');
    console.log('🔍 Total employees:', employees.length);
    console.log('🔍 statusFilter:', statusFilter);

    let filtered = employees;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.emp_name?.toLowerCase().includes(searchLower) ||
        emp.emp_id?.toLowerCase().includes(searchLower) ||
        emp.email_id?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp => {
        const empStatus = emp.status?.toLowerCase();
        return empStatus === statusFilter;
      });
    }

    // Sort
    if (sortBy === "hours") {
      filtered = [...filtered].sort((a, b) => b.work_hours - a.work_hours);
    } else if (sortBy === "name") {
      filtered = [...filtered].sort((a, b) => a.emp_name.localeCompare(b.emp_name));
    }

    console.log('🔍 Filtered employees count:', filtered.length);
    return filtered;
  }, [employees, searchTerm, statusFilter, sortBy]); // Add statusFilter to dependencies

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("hours");
    setStatusFilter("active");
    setDateRange("lastWeek"); // Reset to default
    setStartDate(""); // Clear start date
    setEndDate(""); // Clear end date

  };

  const refreshData = () => {
    fetchEmployeeData();
  };

  // Chart Data Preparation
  const prepareChartData = () => {
    const chartEmployees = filteredEmployees.slice(0, 16); // Limit to 10 for better visualization

    const labels = chartEmployees.map(emp => {
      if (isMobile) {
        return emp.emp_name.length > 10 ? emp.emp_name.substring(0, 8) + "..." : emp.emp_name;
      }
      return emp.emp_name;
    });

    const workHours = chartEmployees.map(emp => emp.work_hours);


    const baseColors = [
      'rgba(54, 162, 235, 0.9)',
      'rgba(255, 99, 132, 0.9)',
      'rgba(75, 192, 192, 0.9)',
      'rgba(255, 206, 86, 0.9)',
      'rgba(153, 102, 255, 0.9)',
      'rgba(255, 159, 64, 0.9)',
      'rgba(201, 203, 207, 0.9)',
      'rgba(0, 128, 0, 0.9)',
      'rgba(128, 0, 128, 0.9)',
      'rgba(0, 0, 255, 0.9)',
    ];

    const borderColors = baseColors.map(color => color.replace('0.9', '1'));

    return { labels, workHours, baseColors, borderColors };
  };

  const { labels, workHours, baseColors, borderColors } = prepareChartData();

  // Bar Chart Data
  const barChartData = {
    labels: labels,
    datasets: [
      {
        label: 'Work Hours',
        data: workHours,
        backgroundColor: baseColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 8,

        barThickness: 28,          // ✅ FIXED width
        maxBarThickness: 28,       // ✅ prevents auto expansion
        categoryPercentage: 0.8,
        barPercentage: 0.7,

        datalabels: { display: true }
      },


    ],
  };

  // Line Chart Data
  const lineChartData = {
    labels: labels,
    datasets: [
      {
        label: 'Work Hours',
        data: workHours,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
      },

    ],
  };





  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 12, weight: 'bold' }
        }
      },

      title: {
        display: true,
        text: '📊 Employee Work Hours Analysis',
        font: { size: 16, weight: 'bold' }
      },

      tooltip: {
        enabled: true
      },

      datalabels: {
        anchor: 'end',
        align: 'end',
        offset: 4,
        color: '#333',
        font: {
          weight: 'bold',
          size: 11
        },
        formatter: (value) => {
          // ❌ hide invalid / zero values
          if (value === null || value === undefined || isNaN(value) || value <= 0) {
            return '';
          }

          // Convert decimal hours → HH.MM
          const hours = Math.floor(value);
          const minutes = Math.round((value - hours) * 60);

          // Convert minutes to 2-digit MM
          const mm = minutes.toString().padStart(2, '0');

          return `${hours}.${mm}`;
        }

      }
    },

    scales: {
      y: {
        beginAtZero: true
      }
    }
  };




  const renderChart = () => {
    if (filteredEmployees.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
          <Typography variant="h6" color="text.secondary">
            No data available for chart
          </Typography>
        </Box>
      );
    }

    const chartStyle = {
      width: '100% !important',
      height: '100% !important',
      maxWidth: '100%',
      margin: '0 auto'
    };

    switch (chartType) {
      case 'bar':
        return <Bar data={barChartData} options={chartOptions} />;
      case 'line':
        return <Line data={lineChartData} options={chartOptions} />;
      default:
        return <Bar data={barChartData} options={chartOptions} />;
    }
  };


  const totalWorkHours = filteredEmployees.reduce((sum, emp) => sum + emp.work_hours, 0);
  const avgWorkHours = filteredEmployees.length > 0 ? (totalWorkHours / filteredEmployees.length) : 0;

  // Format for display
  const totalWorkHoursDisplay = formatHoursToHHMM(totalWorkHours);
  const avgWorkHoursDisplay = formatHoursToHHMM(avgWorkHours);

  if (embedded) {
    return (
      <Box sx={{  minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <AppBar position="static" elevation={2} sx={{
          bgcolor: 'primary.main',
          background: 'linear-gradient(135deg, #eaa166 0%, #ff7504 100%)'
        }}>
          {/* <Toolbar>
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
              👥 Employee Performance Report
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={`👋 Welcome, ${userName} ${userId ? `(${userId})` : ''}`}
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
          </Toolbar> */}
        </AppBar>

        <Box sx={{ p: isMobile ? 1 : 1 }}>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #0061ff 0%, #0061ffdd 100%)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                height: '100%',
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {filteredEmployees.length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 'medium' }}>
                        Total Employees
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
                      <PeopleIcon sx={{ fontSize: 30 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #32a852 0%, #32a852dd 100%)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                height: '100%',
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {totalWorkHoursDisplay}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 'medium' }}>
                        Total Work Hours
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
                      <ShowChartIcon sx={{ fontSize: 30 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>


            {/* Estimated Efforts Hours Card */}
            {/* <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #9c27b0 0%, #9c27b0dd 100%)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                height: '100%',
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {formatHoursToHHMM(estimatedEffortsHours || 0)}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 'medium' }}>
                        Estimated Efforts Hours
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
                      <ShowChartIcon sx={{ fontSize: 30 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid> */}

            {/* Total Efforts Hours Card */}
            {/* <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #f44336 0%, #f44336dd 100%)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                height: '100%',
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {formatHoursToHHMM(totalEffortsHours || 0)}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 'medium' }}>
                        Total Efforts Hours
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
                      <TrendingUpIcon sx={{ fontSize: 30 }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid> */}


          </Grid>



          {/* Filters Section */}
          <Paper elevation={4} sx={{
            p: 2,              // 🔥 reduce padding
            mb: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}>


            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                🔍 Filter Employees
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
                  Clear
                </Button>
              </Box>
            </Box>

            {/* Row 1: Search, Status, Sort */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search Employees"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  placeholder="Search by name, ID, or email..."
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                    startAdornment={<SortIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    <MenuItem value="hours">Work Hours (High to Low)</MenuItem>
                    <MenuItem value="name">Name (A to Z)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid container spacing={2}>

                <FormControl fullWidth>
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={dateRange}
                    label="Date Range"
                    onChange={(e) => {
                      const newRange = e.target.value;
                      setDateRange(newRange);

                      // Clear date inputs when switching away from custom range
                      if (newRange !== 'custom') {
                        setStartDate('');
                        setEndDate('');

                      }
                    }}
                  >
                    <MenuItem value="currentWeek">Current Week (Mon - Sun)</MenuItem>
                    <MenuItem value="lastWeek">Last Week (Mon-Sun)</MenuItem>
                    <MenuItem value="last7Days">Last 7 Days</MenuItem>
                    <MenuItem value="last2Weeks">Last 2 Weeks</MenuItem>
                    <MenuItem value="lastMonth">Last Month</MenuItem>
                    <MenuItem value="last3Months">Last 3 Months</MenuItem>
                    <MenuItem value="last6Months">Last 6 Months</MenuItem>
                    <MenuItem value="lastYear">Last 1 Year</MenuItem>
                    <MenuItem value="allTime">All Time</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </FormControl>

              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  sx={{ minWidth: 350 }}
                  fullWidth
                  options={usecases}
                  value={selectedUsecase}
                  onChange={(e, newValue) => setSelectedUsecase(newValue)}

                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options;

                    const searchText = inputValue.toLowerCase();

                    return options.filter(option => {
                      const label = `${option.client_name} ${option.poc_prj_id} ${option.poc_prj_name}`
                        .toLowerCase();

                      return label.includes(searchText);
                    });
                  }}

                  getOptionLabel={(option) =>
                    `${option.client_name} (${option.poc_prj_id} : ${option.poc_prj_name})`
                  }
                  isOptionEqualToValue={(option, value) =>
                    option.poc_prj_id === value.poc_prj_id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Usecase"
                      placeholder="Search usecase"
                    />
                  )}
                />


              </Grid>


            </Grid>




            {/* Row 3: Custom Date Range (only when selected) */}
            {dateRange === 'custom' && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                  📅 Custom Date Range
                </Typography>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Start Date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="End Date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={<DateRangeIcon />}
                        onClick={() => fetchEmployeeData()}
                        size="medium"
                        sx={{ fontWeight: 'bold', minWidth: 160 }}
                        disabled={!startDate || !endDate}
                      >
                        Apply Date Filter
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </>
            )}
          </Paper>

          {/* Tabs for Table/Chart View */}
          <Paper elevation={3} sx={{ mb: 3, borderRadius: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              indicatorColor="primary"
              textColor="primary"
              centered
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<FilterListIcon />} label="Data Table" />
              <Tab icon={<BarChartIcon />} label="Charts" />
            </Tabs>
          </Paper>

          {/* Chart Type Selector (Visible only in Chart tab) */}
          {activeTab === 1 && (
            <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  📈 Chart Type:
                </Typography>
                {['bar', 'line'].map((type) => (
                  <Chip
                    key={type}
                    icon={type === 'bar' ? <BarChartIcon /> :
                      type === 'line' ? <ShowChartIcon /> :
                        <PieChartIcon />}
                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                    onClick={() => setChartType(type)}
                    color={chartType === type ? 'primary' : 'default'}
                    variant={chartType === type ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 'bold' }}
                  />
                ))}
              </Box>
            </Paper>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={80} sx={{ color: 'primary.main' }} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          ) : (
            <>
              {/* Table View */}
              {activeTab === 0 && (
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Employee List ({filteredEmployees.length} employees)
                    </Typography>

                  </Box>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'primary.light' }}>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Employee ID</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Work Hours</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredEmployees.map((employee) => {
                          const isActive = employee.status?.toLowerCase() === 'active';
                          return (
                            <TableRow key={employee.emp_id} hover>
                              <TableCell>{employee.emp_id}</TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>{employee.emp_name}</TableCell>
                              <TableCell>{employee.email_id}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {employee.work_hours_display || formatHoursToHHMM(employee.work_hours)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    hrs
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={isActive ? 'Active' : 'Inactive'}
                                  size="small"
                                  color={isActive ? 'success' : 'error'}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Chart View */}
              {activeTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sx={{ width: '100vw' }}>
                    <Paper elevation={4} sx={{
                      p: 3,
                      borderRadius: 3,
                      height: '500px',
                      width: '100vw',
                      maxWidth: '100%',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      border: '2px solid',
                      borderColor: 'primary.light',
                      position: 'relative', // Add this
                      overflow: 'hidden' // Add this
                    }}>
                      <Box sx={{
                        width: '100%',
                        height: '100%'
                      }}>

                        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                          {renderChart()}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </>
          )}
        </Box>
      </Box>
    );
  }
};

export default EmployeeReport;