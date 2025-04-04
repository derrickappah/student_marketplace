import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Divider,
  useTheme
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import {
  Star as FeaturedIcon,
  PushPin as PriorityIcon,
  StarOutline as StarBothIcon
} from '@mui/icons-material';

const PromotionStatistics = ({ stats }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Ensure stats has valid values to prevent errors
  const safeStats = {
    total_pending: stats?.total_pending || 0,
    total_approved: stats?.total_approved || 0,
    total_rejected: stats?.total_rejected || 0,
    featured_pending: stats?.featured_pending || 0,
    featured_approved: stats?.featured_approved || 0,
    featured_rejected: stats?.featured_rejected || 0,
    priority_pending: stats?.priority_pending || 0,
    priority_approved: stats?.priority_approved || 0,
    priority_rejected: stats?.priority_rejected || 0,
    both_pending: stats?.both_pending || 0,
    both_approved: stats?.both_approved || 0,
    both_rejected: stats?.both_rejected || 0
  };

  // Format data for the pie chart
  const pieChartData = [
    { name: 'Pending', value: safeStats.total_pending, color: theme.palette.warning.main },
    { name: 'Approved', value: safeStats.total_approved, color: theme.palette.success.main },
    { name: 'Rejected', value: safeStats.total_rejected, color: theme.palette.error.main }
  ].filter(item => item.value > 0);

  // Format data for the bar chart
  const barChartData = [
    { 
      name: 'Featured',
      pending: safeStats.featured_pending,
      approved: safeStats.featured_approved,
      rejected: safeStats.featured_rejected || 0
    },
    { 
      name: 'Priority',
      pending: safeStats.priority_pending,
      approved: safeStats.priority_approved,
      rejected: safeStats.priority_rejected || 0
    },
    { 
      name: 'Both',
      pending: safeStats.both_pending,
      approved: safeStats.both_approved,
      rejected: safeStats.both_rejected || 0
    }
  ];

  // Metrics cards
  const MetricCard = ({ title, value, color, icon }) => (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderTop: `4px solid ${color}`,
        borderRadius: 2
      }}
    >
      <Box sx={{ color, mb: 1 }}>
        {icon}
      </Box>
      <Typography variant="h4" component="div" fontWeight="bold" align="center">
        {value}
      </Typography>
      <Typography variant="body2" color="textSecondary" align="center">
        {title}
      </Typography>
    </Paper>
  );

  // Check if we have any meaningful data to show
  const hasData = pieChartData.length > 0 || 
    barChartData.some(item => item.pending > 0 || item.approved > 0 || item.rejected > 0);

  if (!hasData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, minHeight: '300px' }}>
        <Typography variant="body1" color="textSecondary">
          No promotion data available. This may happen if there are no listings in the database yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <MetricCard 
            title="Pending Requests" 
            value={safeStats.total_pending}
            color={theme.palette.warning.main}
            icon={<Box component="span" sx={{ fontSize: '2rem' }}>⏳</Box>}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard 
            title="Approved Promotions" 
            value={safeStats.total_approved}
            color={theme.palette.success.main}
            icon={<Box component="span" sx={{ fontSize: '2rem' }}>✅</Box>}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard 
            title="Rejected Requests" 
            value={safeStats.total_rejected}
            color={theme.palette.error.main}
            icon={<Box component="span" sx={{ fontSize: '2rem' }}>❌</Box>}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Request Status Distribution
      </Typography>

      {/* Pie chart for status distribution */}
      <Box sx={{ height: 300, mb: 4 }}>
        {pieChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}`, 'Count']}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.primary,
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body1" color="textSecondary">
              No data available
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Promotion Type Breakdown
      </Typography>

      {/* Bar chart for promotion types */}
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={barChartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#555' : '#eee'} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: theme.palette.text.secondary }}
              tickLine={{ stroke: theme.palette.divider }}
              axisLine={{ stroke: theme.palette.divider }}
            />
            <YAxis 
              allowDecimals={false}
              tick={{ fill: theme.palette.text.secondary }}
              tickLine={{ stroke: theme.palette.divider }}
              axisLine={{ stroke: theme.palette.divider }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
              }}
            />
            <Legend />
            <Bar 
              dataKey="pending" 
              name="Pending" 
              fill={theme.palette.warning.main} 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="approved" 
              name="Approved" 
              fill={theme.palette.success.main} 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="rejected" 
              name="Rejected" 
              fill={theme.palette.error.main} 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Additional stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FeaturedIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Featured Listings</Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" paragraph>
              Featured listings appear in the Featured section on the homepage.
            </Typography>
            <Grid container>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Pending: {safeStats.featured_pending}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Approved: {safeStats.featured_approved}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Rejected: {safeStats.featured_rejected}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PriorityIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Priority Listings</Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" paragraph>
              Priority listings appear at the top of search results.
            </Typography>
            <Grid container>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Pending: {safeStats.priority_pending}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Approved: {safeStats.priority_approved}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Rejected: {safeStats.priority_rejected}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <StarBothIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Both Promotions</Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" paragraph>
              Listings with both Featured and Priority promotion types.
            </Typography>
            <Grid container>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Pending: {safeStats.both_pending}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Approved: {safeStats.both_approved}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Rejected: {safeStats.both_rejected}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PromotionStatistics; 