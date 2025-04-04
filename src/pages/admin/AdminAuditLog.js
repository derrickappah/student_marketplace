import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  InputAdornment,
  useTheme,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ArrowBack as ArrowBackIcon,
  PersonOutline as UserIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Help as HelpIcon,
  BarChart as AnalyticsIcon
} from '@mui/icons-material';
import { supabase } from "../../services/supabase";
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { logAdminAction } from '../../services/adminService';

const AdminAuditLog = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('all');
  const [dateRange, setDateRange] = useState([null, null]);
  const [admins, setAdmins] = useState([]);
  const [expandedLogId, setExpandedLogId] = useState(null);
  
  useEffect(() => {
    fetchLogs();
    fetchAdmins();
  }, []);
  
  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, actionTypeFilter, adminFilter, dateRange]);
  
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select(`
          *,
          admin:admin_id (name, email)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .in('role', ['admin', 'super_admin']);
        
      if (error) throw error;
      
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };
  
  const filterLogs = () => {
    let filtered = [...logs];
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.details?.toLowerCase().includes(query) || 
        log.admin?.name?.toLowerCase().includes(query) ||
        log.admin?.email?.toLowerCase().includes(query) ||
        log.target_id?.toLowerCase().includes(query) ||
        log.action_type?.toLowerCase().includes(query)
      );
    }
    
    // Apply action type filter
    if (actionTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.action_type === actionTypeFilter);
    }
    
    // Apply admin filter
    if (adminFilter !== 'all') {
      filtered = filtered.filter(log => log.admin_id === adminFilter);
    }
    
    // Apply date range filter
    if (dateRange[0] && dateRange[1]) {
      const startDate = new Date(dateRange[0]);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateRange[1]);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate >= startDate && logDate <= endDate;
      });
    }
    
    setFilteredLogs(filtered);
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleClearFilters = () => {
    setSearchQuery('');
    setActionTypeFilter('all');
    setAdminFilter('all');
    setDateRange([null, null]);
  };
  
  const handleExportLogs = () => {
    if (filteredLogs.length === 0) return;
    
    // Create CSV content
    const headers = ['Date', 'Admin', 'Action Type', 'Details', 'Target ID', 'Target Type', 'IP Address'];
    const csvData = [
      headers.join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.admin?.name || log.admin_id,
        log.action_type,
        `"${log.details?.replace(/"/g, '""') || ''}"`, // Escape quotes for CSV
        log.target_id || '',
        log.target_type || '',
        log.ip_address || ''
      ].join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin_logs_${format(new Date(), 'yyyyMMdd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getActionChip = (actionType) => {
    let color;
    let icon;
    
    switch (actionType) {
      case 'create':
        color = 'success';
        icon = <AddIcon fontSize="small" />;
        break;
      case 'update':
        color = 'info';
        icon = <EditIcon fontSize="small" />;
        break;
      case 'delete':
        color = 'error';
        icon = <DeleteIcon fontSize="small" />;
        break;
      case 'view':
        color = 'default';
        icon = <ViewIcon fontSize="small" />;
        break;
      case 'settings':
        color = 'warning';
        icon = <SettingsIcon fontSize="small" />;
        break;
      default:
        color = 'default';
        icon = null;
    }
    
    return (
      <Chip
        icon={icon}
        label={actionType.charAt(0).toUpperCase() + actionType.slice(1)}
        size="small"
        color={color}
        variant="outlined"
      />
    );
  };
  
  const handleToggleDetails = (logId) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/admin')} sx={{ mr: 2 }} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Audit Log
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Track and monitor administrative activities
            </Typography>
          </Box>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchLogs}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportLogs}
            disabled={filteredLogs.length === 0}
            sx={{ mr: 2 }}
          >
            Export Logs
          </Button>
          <Button
            variant="contained" 
            color="secondary"
            startIcon={<AnalyticsIcon />}
            onClick={() => navigate('/admin/audit-log/analytics')}
          >
            View Analytics
          </Button>
        </Box>
      </Box>
      
      {/* Help Button */}
      <Box sx={{ position: 'absolute', top: 20, right: 24 }}>
        <Tooltip title="View Audit Log Guide">
          <IconButton
            color="primary"
            onClick={() => navigate('/admin/audit-log/guide')}
            aria-label="help"
            sx={{ 
              bgcolor: 'background.paper', 
              boxShadow: 2,
              '&:hover': { bgcolor: 'background.default' }
            }}
          >
            <HelpIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 2,
          alignItems: { xs: 'stretch', md: 'center' },
        }}>
          <TextField
            label="Search"
            variant="outlined"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            placeholder="Search details, admin, or target"
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="action-type-label">Action Type</InputLabel>
            <Select
              labelId="action-type-label"
              id="action-type-select"
              value={actionTypeFilter}
              label="Action Type"
              onChange={(e) => setActionTypeFilter(e.target.value)}
            >
              <MenuItem value="all">All Actions</MenuItem>
              <MenuItem value="create">Create</MenuItem>
              <MenuItem value="update">Update</MenuItem>
              <MenuItem value="delete">Delete</MenuItem>
              <MenuItem value="view">View</MenuItem>
              <MenuItem value="settings">Settings</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="admin-label">Admin</InputLabel>
            <Select
              labelId="admin-label"
              id="admin-select"
              value={adminFilter}
              label="Admin"
              onChange={(e) => setAdminFilter(e.target.value)}
            >
              <MenuItem value="all">All Admins</MenuItem>
              {admins.map(admin => (
                <MenuItem key={admin.id} value={admin.id}>
                  {admin.name || admin.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ 
          mt: 2,
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 2,
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between'
        }}>
          <DateRangePicker
            startText="From Date"
            endText="To Date"
            value={dateRange}
            onChange={setDateRange}
            renderInput={(startProps, endProps) => (
              <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
                <TextField {...startProps} fullWidth />
                <TextField {...endProps} fullWidth />
              </Box>
            )}
          />
          
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<FilterIcon />}
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>
      
      {/* Log Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Target</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No logs found matching the criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((log) => (
                    <React.Fragment key={log.id}>
                      <TableRow hover>
                        <TableCell>
                          {format(new Date(log.created_at), 'MMM d, yyyy')}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {format(new Date(log.created_at), 'h:mm:ss a')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <UserIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Box>
                              <Typography variant="body2">
                                {log.admin?.name || 'Unknown Admin'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {log.admin?.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {getActionChip(log.action_type)}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {log.details}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {log.target_type && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {log.target_type}
                            </Typography>
                          )}
                          {log.target_id && (
                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                              {log.target_id}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleToggleDetails(log.id)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      {expandedLogId === log.id && (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ py: 0 }}>
                            <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Detailed Information
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Admin
                                  </Typography>
                                  <Typography variant="body2">
                                    {log.admin?.name || 'Unknown'} ({log.admin?.email})
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    IP Address
                                  </Typography>
                                  <Typography variant="body2">
                                    {log.ip_address || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Target Type
                                  </Typography>
                                  <Typography variant="body2">
                                    {log.target_type || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Target ID
                                  </Typography>
                                  <Typography variant="body2">
                                    {log.target_id || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Details
                                  </Typography>
                                  <Typography variant="body2">
                                    {log.details || 'No details provided'}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
};

export default AdminAuditLog; 