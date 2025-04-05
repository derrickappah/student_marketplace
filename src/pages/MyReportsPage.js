import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Stack,
  Tabs,
  Tab,
  Avatar,
  useTheme,
  Snackbar,
  Card,
  CardContent,
  Divider,
  Badge,
  IconButton,
  useMediaQuery,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  OutlinedInput,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  ReportProblem as ReportIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  Message as MessageIcon,
  AccessTime as TimeIcon,
  OpenInNew as OpenIcon,
  Check as CheckIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Search as SearchIcon,
  SortByAlpha as SortIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  DoNotDisturb as DoNotDisturbIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { format } from 'date-fns';

// Remove recharts for now to allow the page to function without charts
// We'll implement a simpler chart solution

const MyReportsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // New state for enhanced functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'created_at', direction: 'desc' });
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'compact'
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailsMenuAnchor, setDetailsMenuAnchor] = useState(null);
  
  // States for charts and dismiss dialog
  const [showCharts, setShowCharts] = useState(false);
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [reportToDismiss, setReportToDismiss] = useState(null);

  // Filter reports based on tab and search
  const filteredAndSortedReports = useMemo(() => {
    // First filter by tab
    let filtered = reports;
    
    if (tabValue === 1) {
      filtered = reports.filter(report => ['pending', 'in_progress'].includes(report.status));
    } else if (tabValue === 2) {
      filtered = reports.filter(report => ['resolved', 'dismissed'].includes(report.status));
    }
    
    // Then filter by report type if filter is applied
    if (filterType !== 'all') {
      filtered = filtered.filter(report => report.report_type === filterType);
    }
    
    // Then apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(report => 
        (report.reason && report.reason.toLowerCase().includes(search)) ||
        (report.description && report.description.toLowerCase().includes(search)) ||
        (report.details && report.details.toLowerCase().includes(search)) ||
        (report.admin_response && report.admin_response.toLowerCase().includes(search)) ||
        (report.status && report.status.toLowerCase().includes(search))
      );
    }
    
    // Finally sort
    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      if (sortConfig.field === 'created_at') {
        return sortConfig.direction === 'asc' 
          ? new Date(aValue) - new Date(bValue)
          : new Date(bValue) - new Date(aValue);
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [reports, tabValue, filterType, searchTerm, sortConfig]);

  // Function to create the reports table if it doesn't exist
  const createReportsTable = async () => {
    try {
      console.log('Attempting to create reports table using Supabase client...');
      
      // Unfortunately, we can't create tables directly with Supabase client
      // without admin privileges. Instead, we'll create some dummy reports data
      // with the correct structure.
      
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        console.error('No authenticated user found');
        return false;
      }
      
      // Initialize the reports system by using fallback dummy data
      const dummyData = getDummyReportData(userData.user.id);
      setReports(dummyData);
      
      console.log('Reports system initialized with dummy data');
      setSnackbarMessage('Reports system has been initialized with sample data');
      setShowSnackbar(true);
      return true;
    } catch (err) {
      console.error('Failed to initialize reports system:', err);
      return false;
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        console.log('Attempting to fetch reports for user:', user.id);
        
        // Try to fetch reports first
        const { data, error } = await supabase
          .from('reports')
          .select(`
            *
          `)
          .eq('reporter_id', user.id)
          .order('created_at', { ascending: false });

        // If there's an error, check if it's because the table doesn't exist
        if (error) {
          console.error('Error fetching reports data:', error);
          
          if (error.message?.includes('does not exist')) {
            console.log('Reports table does not exist. Using fallback data.');
            const dummyData = getDummyReportData(user.id);
            setReports(dummyData);
            setSnackbarMessage('Using sample reports data');
            setShowSnackbar(true);
          } else {
            // For any other error, show the error message
            setError('Failed to load reports. Please try again later.');
          }
        } else {
          // Successfully fetched data
          console.log('Reports data received:', data?.length || 0, 'reports');
          setReports(data || []);
        }
      } catch (err) {
        console.error('Error in fetchReports:', err);
        // Always fall back to dummy data on any error
        const dummyData = getDummyReportData(user.id);
        setReports(dummyData);
        setSnackbarMessage('Using sample reports data');
        setShowSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Fallback function to generate dummy report data
  const getDummyReportData = (userId) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    return [
      {
        id: 'dummy-1',
        reporter_id: userId,
        report_type: 'user',
        reported_user_id: 'user-123',
        details: 'This user sent inappropriate messages.',
        reason: 'Inappropriate content',
        description: 'The user was sending messages with offensive language.',
        status: 'pending',
        created_at: now.toISOString(),
        reported_user: {
          id: 'user-123',
          name: 'Demo User',
          avatar_url: null
        }
      },
      {
        id: 'dummy-2',
        reporter_id: userId,
        report_type: 'listing',
        reported_listing_id: 'listing-456',
        details: 'This listing contains prohibited items.',
        reason: 'Policy violation',
        description: 'The listing contains items that are not allowed on the platform.',
        status: 'in_progress',
        created_at: yesterday.toISOString(),
        admin_response: 'We are investigating this listing and will take appropriate action.',
        reported_listing: {
          id: 'listing-456',
          title: 'Sample Listing',
          image_url: null
        }
      },
      {
        id: 'dummy-3',
        reporter_id: userId,
        report_type: 'message',
        reported_message_id: 'message-789',
        details: 'This message contains harassment.',
        reason: 'Harmful behavior',
        description: 'The message contains harassing content directed at me.',
        status: 'resolved',
        created_at: lastWeek.toISOString(),
        admin_response: 'We have removed the inappropriate content. Thank you for reporting.',
        reported_message: {
          id: 'message-789',
          content: '[Content removed]'
        }
      },
      {
        id: 'dummy-4',
        reporter_id: userId,
        report_type: 'user',
        reported_user_id: 'user-234',
        details: 'User is impersonating someone else.',
        reason: 'Suspicious activity',
        description: 'This user has created a profile pretending to be someone they are not.',
        status: 'dismissed',
        created_at: twoWeeksAgo.toISOString(),
        admin_response: 'After reviewing this report, we could not find sufficient evidence of impersonation. The user has verified their identity according to our policies.',
        reported_user: {
          id: 'user-234',
          name: 'Another User',
          avatar_url: null
        }
      }
    ];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'resolved':
        return 'success';
      case 'dismissed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'user':
        return <PersonIcon />;
      case 'listing':
        return <InventoryIcon />;
      case 'message':
        return <MessageIcon />;
      default:
        return <ReportIcon />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return theme.palette.warning.main;
      case 'in_progress':
        return theme.palette.info.main;
      case 'resolved':
        return theme.palette.success.main;
      case 'dismissed':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const renderReportCard = (report) => {
    let itemLink;
    let itemTitle;

    switch (report.report_type) {
      case 'user':
        itemLink = `/user/${report.reported_user_id}`;
        itemTitle = 'Reported User';
        break;
      case 'listing':
        itemLink = `/listings/${report.reported_listing_id}`;
        itemTitle = 'Reported Listing';
        break;
      case 'message':
        itemLink = `/messages`;
        itemTitle = 'Reported Message';
        break;
      default:
        itemLink = '#';
        itemTitle = 'Unknown Item';
    }

    // For compact view
    if (viewMode === 'compact') {
      return (
        <Paper
          key={report.id}
          sx={{
            p: 2,
            mb: 1.5,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderLeft: `4px solid ${getStatusBadgeColor(report.status)}`,
            '&:hover': {
              boxShadow: 2,
              bgcolor: `${theme.palette.background.default}`
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: `${theme.palette.primary.light}20`,
                color: theme.palette.primary.main
              }}
            >
              {getReportTypeIcon(report.report_type)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {itemTitle}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(report.created_at), 'MMM d, yyyy')} • {report.reason || 'No reason provided'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              size="small"
              color={getStatusColor(report.status)}
              label={report.status.charAt(0).toUpperCase() + report.status.slice(1).replace('_', ' ')}
              sx={{ fontWeight: 500, height: 24 }}
            />
            
            <IconButton 
              size="small" 
              onClick={(e) => handleDetailsMenuOpen(e, report)}
              sx={{ ml: 1 }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      );
    }

    // For card view (default)
    return (
      <Card 
        key={report.id} 
        sx={{ 
          mb: 2, 
          borderRadius: 2,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)'
          },
          position: 'relative',
          overflow: 'visible'
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 16, 
            right: 16,
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: getStatusBadgeColor(report.status),
            border: '2px solid white',
            boxShadow: 1
          }} 
        />
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item>
              <Avatar 
                sx={{ 
                  width: 56, 
                  height: 56,
                  bgcolor: `${theme.palette.primary.light}20`,
                  color: theme.palette.primary.main,
                  boxShadow: 1
                }}
                variant={report.report_type === 'listing' ? 'rounded' : 'circular'}
              >
                {getReportTypeIcon(report.report_type)}
              </Avatar>
            </Grid>
            
            <Grid item xs>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, justifyContent: 'space-between' }}>
                  <Typography variant="h6" sx={{ mr: 1 }}>
                    {itemTitle}
                  </Typography>
                  
                  <Box>
                    <Chip 
                      size="small" 
                      color={getStatusColor(report.status)}
                      label={report.status.charAt(0).toUpperCase() + report.status.slice(1).replace('_', ' ')}
                      sx={{ fontWeight: 500, height: 24 }}
                    />
                    
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleDetailsMenuOpen(e, report)}
                      sx={{ ml: 0.5 }}
                    >
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography 
                  variant="subtitle2" 
                  color="primary"
                  sx={{ mb: 0.5 }}
                >
                  {report.reason || 'No reason provided'}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    mb: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {report.description || report.details || 'No details provided'}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <TimeIcon fontSize="inherit" />
                    {formatTimestamp(report.created_at)}
                  </Typography>
                  
                  <Button
                    component={RouterLink}
                    to={itemLink}
                    variant="outlined"
                    size="small"
                    endIcon={<OpenIcon />}
                    sx={{ borderRadius: 6, px: 2 }}
                  >
                    View Details
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
          
          {report.admin_response && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ pl: 2, py: 1, borderLeft: `3px solid ${theme.palette.primary.main}`, bgcolor: `${theme.palette.primary.light}10`, borderRadius: '0 4px 4px 0' }}>
                <Typography variant="subtitle2" color="primary.dark" gutterBottom>
                  Admin Response:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {report.admin_response}
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  // Filter functions
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    handleFilterMenuClose();
  };

  // Search function
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Sorting functions
  const handleSort = (field) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Report details menu
  const handleDetailsMenuOpen = (event, report) => {
    event.stopPropagation();
    setSelectedReport(report);
    setDetailsMenuAnchor(event.currentTarget);
  };

  const handleDetailsMenuClose = () => {
    setDetailsMenuAnchor(null);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Type", "Status", "Reason", "Details", "Date Submitted", "Admin Response"];
    
    const csvData = filteredAndSortedReports.map(report => [
      report.report_type,
      report.status,
      report.reason || "Not provided",
      report.description || report.details || "Not provided",
      format(new Date(report.created_at), 'yyyy-MM-dd HH:mm'),
      report.admin_response || "No response yet"
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `my-reports-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dismiss report functions
  const handleDismissReport = (report) => {
    setReportToDismiss(report);
    setDismissDialogOpen(true);
  };

  const handleDismissReasonChange = (event) => {
    setDismissReason(event.target.value);
  };

  const handleDismissDialogClose = () => {
    setDismissDialogOpen(false);
    setDismissReason('');
    setReportToDismiss(null);
  };

  const confirmDismissReport = async () => {
    if (!reportToDismiss) return;
    
    try {
      // In a real app, you would update the report in the database
      // For our demo with dummy data, we'll just update the local state
      const updatedReports = reports.map(report => {
        if (report.id === reportToDismiss.id) {
          return {
            ...report,
            status: 'dismissed',
            admin_response: dismissReason || 'This report has been dismissed.'
          };
        }
        return report;
      });
      
      setReports(updatedReports);
      setDismissDialogOpen(false);
      setDismissReason('');
      setReportToDismiss(null);
      setSnackbarMessage('Report has been dismissed');
      setShowSnackbar(true);
    } catch (error) {
      console.error('Error dismissing report:', error);
      setSnackbarMessage('Failed to dismiss report');
      setShowSnackbar(true);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2, 
          bgcolor: `${theme.palette.primary.light}15`,
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: `${theme.palette.primary.main}20`, 
              color: theme.palette.primary.main,
              width: 48, 
              height: 48
            }}
          >
            <ReportIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              My Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track and manage your submitted reports
            </Typography>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/report"
          startIcon={<AddIcon />}
          sx={{ 
            borderRadius: 6,
            px: 3, 
            boxShadow: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          New Report
        </Button>
      </Box>

      {/* Filtering and Search Bar */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
        <OutlinedInput
          placeholder="Search reports..."
          value={searchTerm}
          onChange={handleSearchChange}
          fullWidth={isMobile}
          sx={{ 
            flex: 1,
            borderRadius: 6,
            bgcolor: theme.palette.background.paper,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.divider
            }
          }}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          }
          endAdornment={
            searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Toggle view">
            <FormControlLabel
              control={
                <Switch
                  checked={viewMode === 'compact'}
                  onChange={() => setViewMode(prev => prev === 'card' ? 'compact' : 'card')}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                  Compact
                </Typography>
              }
              sx={{ mr: 0 }}
            />
          </Tooltip>
          
          <Tooltip title="Filter reports">
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterMenuOpen}
              sx={{ 
                borderRadius: 6,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: theme.palette.divider
              }}
            >
              {filterType === 'all' ? 'All Types' : 
                filterType === 'user' ? 'Users' : 
                filterType === 'listing' ? 'Listings' : 'Messages'}
            </Button>
          </Tooltip>
          
          <Tooltip title={`Sort by ${sortConfig.field === 'created_at' ? 'date' : 'status'}`}>
            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              endIcon={sortConfig.direction === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />}
              onClick={() => handleSort(sortConfig.field === 'created_at' ? 'status' : 'created_at')}
              sx={{ 
                borderRadius: 6,
                textTransform: 'none', 
                fontWeight: 500,
                borderColor: theme.palette.divider
              }}
            >
              {sortConfig.field === 'created_at' ? 'Date' : 'Status'}
            </Button>
          </Tooltip>
          
          <Tooltip title={showCharts ? "Hide stats" : "Show stats"}>
            <Button
              variant="outlined"
              startIcon={<BarChartIcon />}
              onClick={() => setShowCharts(!showCharts)}
              sx={{ 
                borderRadius: 6,
                textTransform: 'none', 
                fontWeight: 500,
                borderColor: theme.palette.divider
              }}
            >
              {showCharts ? "Hide Stats" : "Statistics"}
            </Button>
          </Tooltip>
          
          <Tooltip title="Refresh">
            <IconButton 
              onClick={handleRefresh}
              sx={{ 
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.secondary
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          mb: 3, 
          borderRadius: 2, 
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant={isMobile ? 'fullWidth' : 'standard'}
          indicatorColor="primary"
          textColor="primary"
          sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              fontWeight: 600,
              minHeight: 56,
              textTransform: 'none'
            }
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>All Reports</span>
                <Chip 
                  label={reports.length} 
                  size="small" 
                  sx={{ 
                    height: 20, 
                    minWidth: 20,
                    fontSize: '0.75rem' 
                  }} 
                />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Active</span>
                <Chip 
                  label={reports.filter(r => ['pending', 'in_progress'].includes(r.status)).length} 
                  size="small"
                  color="warning"
                  sx={{ 
                    height: 20, 
                    minWidth: 20,
                    fontSize: '0.75rem' 
                  }} 
                />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Closed</span>
                <Chip 
                  label={reports.filter(r => ['resolved', 'dismissed'].includes(r.status)).length} 
                  size="small"
                  color="success"
                  sx={{ 
                    height: 20, 
                    minWidth: 20,
                    fontSize: '0.75rem' 
                  }} 
                />
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={40} />
        </Box>
      ) : error ? (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: 1
          }}
        >
          {error}
        </Alert>
      ) : filteredAndSortedReports.length === 0 ? (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: 2,
            bgcolor: `${theme.palette.background.paper}`, 
            border: `1px dashed ${theme.palette.divider}`,
            boxShadow: 'none'
          }}
        >
          <Box sx={{ mb: 3, opacity: 0.7 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: `${theme.palette.primary.light}20`,
                color: theme.palette.text.secondary,
                mx: 'auto',
                mb: 2
              }}
            >
              <ReportIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No reports found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
              {searchTerm 
                ? "No reports match your search criteria. Try different keywords or clear the search."
                : tabValue === 0 
                  ? "You haven't submitted any reports yet. If you encounter any issues or concerns, please submit a report."
                  : tabValue === 1 
                    ? "You don't have any active reports at the moment. Active reports include those with pending or in-progress status."
                    : "You don't have any closed reports yet. Closed reports include those that have been resolved or dismissed."}
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            component={RouterLink}
            to="/report"
            startIcon={<ReportIcon />}
            sx={{ 
              borderRadius: 6,
              px: 3,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Submit New Report
          </Button>
        </Paper>
      ) : (
        <>
          {/* Result Stats */}
          <Box 
            sx={{ 
              mb: 2, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Showing {filteredAndSortedReports.length} {filteredAndSortedReports.length === 1 ? 'report' : 'reports'}
              {searchTerm && ` matching "${searchTerm}"`}
              {filterType !== 'all' && ` of type "${filterType}"`}
            </Typography>
            
            {filteredAndSortedReports.length > 0 && (
              <Tooltip title="Export to CSV">
                <IconButton onClick={exportToCSV} size="small">
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Box>
            <Stack spacing={0}>
              {filteredAndSortedReports.map(report => renderReportCard(report))}
            </Stack>
            
            {filteredAndSortedReports.length > 0 && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  variant="outlined" 
                  startIcon={<ReportIcon />}
                  component={RouterLink}
                  to="/report"
                  sx={{ 
                    borderRadius: 6,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  Submit Another Report
                </Button>
              </Box>
            )}
          </Box>
        </>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterMenuClose}
        PaperProps={{
          sx: { 
            mt: 1, 
            borderRadius: 2,
            boxShadow: 3,
            width: 200
          }
        }}
      >
        <MenuItem onClick={() => handleFilterTypeChange('all')}>
          <ListItemIcon>
            <FilterIcon color={filterType === 'all' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="All Types" />
          {filterType === 'all' && <CheckIcon fontSize="small" color="primary" />}
        </MenuItem>
        <MenuItem onClick={() => handleFilterTypeChange('user')}>
          <ListItemIcon>
            <PersonIcon color={filterType === 'user' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Users" />
          {filterType === 'user' && <CheckIcon fontSize="small" color="primary" />}
        </MenuItem>
        <MenuItem onClick={() => handleFilterTypeChange('listing')}>
          <ListItemIcon>
            <InventoryIcon color={filterType === 'listing' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Listings" />
          {filterType === 'listing' && <CheckIcon fontSize="small" color="primary" />}
        </MenuItem>
        <MenuItem onClick={() => handleFilterTypeChange('message')}>
          <ListItemIcon>
            <MessageIcon color={filterType === 'message' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Messages" />
          {filterType === 'message' && <CheckIcon fontSize="small" color="primary" />}
        </MenuItem>
      </Menu>

      {/* Report Details Menu */}
      <Menu
        anchorEl={detailsMenuAnchor}
        open={Boolean(detailsMenuAnchor)}
        onClose={handleDetailsMenuClose}
        PaperProps={{
          sx: { 
            mt: 1, 
            borderRadius: 2,
            boxShadow: 3,
            width: 200
          }
        }}
      >
        {selectedReport && (
          <>
            <MenuItem 
              component={RouterLink} 
              to={
                selectedReport.report_type === 'user' 
                  ? `/user/${selectedReport.reported_user_id}`
                  : selectedReport.report_type === 'listing'
                    ? `/listings/${selectedReport.reported_listing_id}`
                    : '/messages'
              }
              onClick={handleDetailsMenuClose}
            >
              <ListItemIcon>
                <OpenIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="View Details" />
            </MenuItem>
            
            {selectedReport.status !== 'dismissed' && (
              <MenuItem onClick={() => {
                handleDetailsMenuClose();
                handleDismissReport(selectedReport);
              }}>
                <ListItemIcon>
                  <DoNotDisturbIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Dismiss Report" />
              </MenuItem>
            )}
            
            <MenuItem onClick={() => {window.print(); handleDetailsMenuClose();}}>
              <ListItemIcon>
                <PrintIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Print Report" />
            </MenuItem>
          </>
        )}
      </Menu>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            bgcolor: 'success.main',
            color: 'white',
            fontWeight: 'medium',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderRadius: 2,
            py: 1.5,
            px: 2
          }
        }}
        action={
          <CheckIcon />
        }
      />

      <Dialog
        open={dismissDialogOpen}
        onClose={handleDismissDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Dismiss Report"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Please provide a reason for dismissing this report.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Reason"
            type="text"
            fullWidth
            value={dismissReason}
            onChange={handleDismissReasonChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDismissDialogClose}>Cancel</Button>
          <Button onClick={confirmDismissReport} autoFocus>
            Dismiss
          </Button>
        </DialogActions>
      </Dialog>

      {/* Simple Stats Panel */}
      {showCharts && reports.length > 0 && (
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}` 
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Reports Statistics</Typography>
            <IconButton onClick={() => setShowCharts(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Grid container spacing={3}>
            {/* Report Count by Status */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: `${theme.palette.background.default}`, 
                  borderRadius: 2 
                }}
              >
                <Typography variant="subtitle1" gutterBottom>Status Breakdown</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: a => a.spacing(2) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.warning.main 
                        }} 
                      />
                      <Typography variant="body2">Pending</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={500}>
                      {reports.filter(r => r.status === 'pending').length}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.info.main 
                        }} 
                      />
                      <Typography variant="body2">In Progress</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={500}>
                      {reports.filter(r => r.status === 'in_progress').length}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.success.main 
                        }} 
                      />
                      <Typography variant="body2">Resolved</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={500}>
                      {reports.filter(r => r.status === 'resolved').length}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: theme.palette.error.main 
                        }} 
                      />
                      <Typography variant="body2">Dismissed</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={500}>
                      {reports.filter(r => r.status === 'dismissed').length}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2">Total</Typography>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {reports.length}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            {/* Report Count by Type */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: `${theme.palette.background.default}`, 
                  borderRadius: 2 
                }}
              >
                <Typography variant="subtitle1" gutterBottom>Report Types</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: a => a.spacing(2) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon 
                        fontSize="small" 
                        sx={{ color: theme.palette.primary.main }} 
                      />
                      <Typography variant="body2">User Reports</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={500}>
                      {reports.filter(r => r.report_type === 'user').length}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InventoryIcon 
                        fontSize="small" 
                        sx={{ color: theme.palette.secondary.main }} 
                      />
                      <Typography variant="body2">Listing Reports</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={500}>
                      {reports.filter(r => r.report_type === 'listing').length}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MessageIcon 
                        fontSize="small" 
                        sx={{ color: theme.palette.info.main }} 
                      />
                      <Typography variant="body2">Message Reports</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={500}>
                      {reports.filter(r => r.report_type === 'message').length}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Response rate */}
                <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="subtitle2" gutterBottom>Response Statistics</Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
                    <Typography variant="body2">
                      Reports with Admin Response
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {reports.filter(r => r.admin_response).length}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
                    <Typography variant="body2">
                      Response Rate
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {reports.length > 0 
                        ? `${Math.round((reports.filter(r => r.admin_response).length / reports.length) * 100)}%` 
                        : '0%'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            {/* Response Time & Other Stats */}
            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: `${theme.palette.background.default}`, 
                  borderRadius: 2 
                }}
              >
                <Typography variant="subtitle1" gutterBottom>Report Summary</Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6} md={3}>
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: `${theme.palette.primary.light}10`, 
                        borderRadius: 1, 
                        textAlign: 'center' 
                      }}
                    >
                      <Typography variant="h5" fontWeight={600} color="primary.main">
                        {reports.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Reports
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: `${theme.palette.warning.light}10`, 
                        borderRadius: 1, 
                        textAlign: 'center' 
                      }}
                    >
                      <Typography variant="h5" fontWeight={600} color="warning.main">
                        {reports.filter(r => ['pending', 'in_progress'].includes(r.status)).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Reports
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: `${theme.palette.success.light}10`, 
                        borderRadius: 1, 
                        textAlign: 'center' 
                      }}
                    >
                      <Typography variant="h5" fontWeight={600} color="success.main">
                        {reports.filter(r => r.status === 'resolved').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Resolved
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: `${theme.palette.info.light}10`, 
                        borderRadius: 1, 
                        textAlign: 'center' 
                      }}
                    >
                      <Typography variant="h5" fontWeight={600} color="info.main">
                        {reports.length > 0 
                          ? `${Math.round(
                              (reports.filter(r => ['resolved', 'dismissed'].includes(r.status)).length / reports.length) * 100
                            )}%` 
                          : '0%'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completion Rate
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default MyReportsPage; 