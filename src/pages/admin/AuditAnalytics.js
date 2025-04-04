import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { supabase } from "../../services/supabase";
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

const AuditAnalytics = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');
  const [activityByDate, setActivityByDate] = useState([]);
  const [actionTypeDistribution, setActionTypeDistribution] = useState([]);
  const [targetTypeDistribution, setTargetTypeDistribution] = useState([]);
  const [topAdmins, setTopAdmins] = useState([]);
  const [actionStats, setActionStats] = useState({
    totalActions: 0,
    creations: 0,
    updates: 0,
    deletions: 0,
    views: 0,
    settingsChanges: 0
  });
  
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
    '#9c27b0',
    '#795548'
  ];
  
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);
  
  const fetchAnalyticsData = async () => {
    setLoading(true);
    
    try {
      const startDate = getStartDateForRange(timeRange);
      
      // Fetch all the logs for the time period
      const { data: logs, error } = await supabase
        .from('admin_logs')
        .select(`
          *,
          admin:admin_id (name, email)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at');
        
      if (error) throw error;
      
      if (!logs || logs.length === 0) {
        setLoading(false);
        return;
      }
      
      processLogsData(logs);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getStartDateForRange = (range) => {
    const today = new Date();
    
    switch (range) {
      case '24hours':
        return subDays(today, 1);
      case '7days':
        return subDays(today, 7);
      case '30days':
        return subDays(today, 30);
      case '90days':
        return subDays(today, 90);
      default:
        return subDays(today, 7);
    }
  };
  
  const processLogsData = (logs) => {
    // 1. Activity by date
    const dateMap = new Map();
    const rangeInDays = timeRange === '24hours' ? 1 : 
                        timeRange === '7days' ? 7 : 
                        timeRange === '30days' ? 30 : 90;
    
    // Initialize dates
    for (let i = 0; i < rangeInDays; i++) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      dateMap.set(dateStr, {
        date: dateStr,
        displayDate: format(date, timeRange === '24hours' ? 'HH:00' : 'MMM dd'),
        count: 0,
        create: 0,
        update: 0,
        delete: 0,
        view: 0,
        settings: 0,
        bulk_action: 0,
        other: 0
      });
    }
    
    // 2. Action type distribution
    const actionTypes = new Map();
    
    // 3. Target type distribution
    const targetTypes = new Map();
    
    // 4. Top admins
    const admins = new Map();
    
    // 5. Action stats
    let totalActions = 0;
    let creations = 0;
    let updates = 0;
    let deletions = 0;
    let views = 0;
    let settingsChanges = 0;
    
    // Process each log
    logs.forEach(log => {
      const date = format(new Date(log.created_at), 'yyyy-MM-dd');
      const actionType = log.action_type || 'unknown';
      const targetType = log.target_type || 'unknown';
      const adminId = log.admin_id;
      const adminName = log.admin?.name || log.admin?.email || 'Unknown';
      
      // Update date map
      if (dateMap.has(date)) {
        const dateData = dateMap.get(date);
        dateData.count++;
        
        // Increment specific action type count
        if (actionType in dateData) {
          dateData[actionType]++;
        } else {
          dateData.other++;
        }
      }
      
      // Update action types
      if (actionTypes.has(actionType)) {
        actionTypes.set(actionType, actionTypes.get(actionType) + 1);
      } else {
        actionTypes.set(actionType, 1);
      }
      
      // Update target types
      if (targetType && targetType !== 'unknown') {
        if (targetTypes.has(targetType)) {
          targetTypes.set(targetType, targetTypes.get(targetType) + 1);
        } else {
          targetTypes.set(targetType, 1);
        }
      }
      
      // Update admins
      if (admins.has(adminId)) {
        const adminData = admins.get(adminId);
        adminData.count++;
      } else {
        admins.set(adminId, {
          id: adminId,
          name: adminName,
          count: 1
        });
      }
      
      // Update action stats
      totalActions++;
      switch (actionType) {
        case 'create':
          creations++;
          break;
        case 'update':
          updates++;
          break;
        case 'delete':
          deletions++;
          break;
        case 'view':
          views++;
          break;
        case 'settings':
          settingsChanges++;
          break;
      }
    });
    
    // Convert date map to array and sort by date
    const activityByDate = Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Convert action types to array and sort by count
    const actionTypeDistribution = Array.from(actionTypes.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Convert target types to array and sort by count
    const targetTypeDistribution = Array.from(targetTypes.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Convert admins to array and get top 5
    const topAdmins = Array.from(admins.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Update state
    setActivityByDate(activityByDate);
    setActionTypeDistribution(actionTypeDistribution);
    setTargetTypeDistribution(targetTypeDistribution);
    setTopAdmins(topAdmins);
    setActionStats({
      totalActions,
      creations,
      updates,
      deletions,
      views,
      settingsChanges
    });
  };
  
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (percent < 0.05) return null; // Don't show very small slices
    
    return (
      <text
        x={x}
        y={y}
        fill={isDarkMode ? 'white' : 'black'}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12px"
      >
        {name} ({(percent * 100).toFixed(0)}%)
      </text>
    );
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/audit-log')}
            sx={{ mr: 2 }}
          >
            Back to Audit Log
          </Button>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Audit Log Analytics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
              size="small"
            >
              <MenuItem value="24hours">Last 24 Hours</MenuItem>
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="90days">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchAnalyticsData}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" component="div" color="primary" fontWeight="bold">
                    {actionStats.totalActions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Actions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" component="div" color="success.main" fontWeight="bold">
                    {actionStats.creations}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Creations
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" component="div" color="info.main" fontWeight="bold">
                    {actionStats.updates}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Updates
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" component="div" color="error.main" fontWeight="bold">
                    {actionStats.deletions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Deletions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" component="div" color="text.secondary" fontWeight="bold">
                    {actionStats.views}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Views
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" component="div" color="warning.main" fontWeight="bold">
                    {actionStats.settingsChanges}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Settings
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
      
          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Activity Over Time
                </Typography>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={activityByDate}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorCreate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorUpdate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorDelete" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorView" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.grey[500]} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={theme.palette.grey[500]} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorSettings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="displayDate" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => {
                          const label = name.charAt(0).toUpperCase() + name.slice(1);
                          return [value, label];
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="create" 
                        name="Create" 
                        stroke={theme.palette.success.main} 
                        fill="url(#colorCreate)" 
                        stackId="1"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="update" 
                        name="Update" 
                        stroke={theme.palette.info.main} 
                        fill="url(#colorUpdate)" 
                        stackId="1"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="delete" 
                        name="Delete" 
                        stroke={theme.palette.error.main} 
                        fill="url(#colorDelete)" 
                        stackId="1"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="view" 
                        name="View" 
                        stroke={theme.palette.grey[500]} 
                        fill="url(#colorView)" 
                        stackId="1"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="settings" 
                        name="Settings" 
                        stroke={theme.palette.warning.main} 
                        fill="url(#colorSettings)" 
                        stackId="1"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Top Admins by Activity
                </Typography>
                <Box sx={{ height: 350, mt: 3 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topAdmins}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar 
                        dataKey="count" 
                        fill={theme.palette.primary.main} 
                        name="Actions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Action Types Distribution
                </Typography>
                <Box sx={{ height: 300, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={actionTypeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {actionTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => {
                        const label = name.charAt(0).toUpperCase() + name.slice(1);
                        return [value, label];
                      }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Target Entity Types
                </Typography>
                <Box sx={{ height: 300, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={targetTypeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {targetTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => {
                        const label = name.charAt(0).toUpperCase() + name.slice(1);
                        return [value, label];
                      }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default AuditAnalytics; 