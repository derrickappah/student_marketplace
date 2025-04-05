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
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  useTheme,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Report as ReportIcon
} from '@mui/icons-material';
import { supabase } from "../../services/supabase";
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { logAdminAction } from '../../services/adminService';
import { checkAdminReportsAccess, fixAdminReportsAccess } from '../../services/adminReportsAccess';
import ReportsPolicyDebug from '../../components/admin/ReportsPolicyDebug';
import AdminDiagnostics from '../../components/admin/AdminDiagnostics';

const ReportsManagement = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredReports, setFilteredReports] = useState([]);
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewReportOpen, setViewReportOpen] = useState(false);
  const [resolveReportOpen, setResolveReportOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolveStatus, setResolveStatus] = useState('resolved');
  
  // Admin access state
  const [accessError, setAccessError] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, statusFilter]);

  const checkAccess = async () => {
    setLoading(true);
    const { hasAccess, error } = await checkAdminReportsAccess();
    
    if (!hasAccess) {
      console.log('Admin does not have access to reports. Access can be fixed with the button.');
      setAccessError(true);
    } else {
      setAccessError(false);
      fetchReports();
    }
    setLoading(false);
  };

  const fixAccess = async () => {
    setLoading(true);
    const { success, error } = await fixAdminReportsAccess();
    
    if (success) {
      setSnackbar({
        open: true,
        message: 'Admin access for reports fixed successfully! Loading reports...',
        severity: 'success'
      });
      setAccessError(false);
      fetchReports();
    } else {
      setSnackbar({
        open: true,
        message: 'Failed to fix admin access: ' + (error?.message || 'Unknown error'),
        severity: 'error'
      });
    }
    setLoading(false);
  };

  const fetchReports = async () => {
    setLoading(true);
    console.log('Attempting to fetch reports...');
    
    try {
      // First, attempt the regular fetch
      console.log('Regular fetch attempt...');
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_id (name, email),
          reported_user:reported_user_id (name, email),
          listing:listing_id (title, images)
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error in regular fetch:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`Successfully fetched ${data.length} reports`);
        setReports(data);
        setLoading(false);
        return;
      } else {
        console.log('No reports found in regular fetch. Attempting simple fetch...');
      }
      
      // If no data returned, try a simpler fetch with fewer joins
      const { data: simpleData, error: simpleError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (simpleError) {
        console.error('Error in simple fetch:', simpleError);
        throw simpleError;
      }
      
      if (simpleData && simpleData.length > 0) {
        console.log(`Successfully fetched ${simpleData.length} reports with simple query`);
        setReports(simpleData);
      } else {
        console.log('No reports found with simple fetch either.');
        setReports([]);
      }
      
    } catch (error) {
      console.error('Error fetching reports:', error);
      
      if (error.message && error.message.includes('permission denied')) {
        console.log('Permission denied error detected. Setting accessError to true.');
        setAccessError(true);
        
        // Try to get a count of reports to verify they exist
        try {
          const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || '';
          
          if (serviceRoleKey) {
            console.log('Attempting count with service role...');
            // Create a temporary client with the service role key
            const serviceClient = supabase.auth.admin;
            const { count, error: countError } = await serviceClient
              .from('reports')
              .select('*', { count: 'exact', head: true });
              
            if (countError) {
              console.error('Error counting reports:', countError);
            } else {
              console.log(`Found ${count} reports with service role`);
            }
          }
        } catch (serviceError) {
          console.error('Error with service role check:', serviceError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    if (!reports || reports.length === 0) {
      setFilteredReports([]);
      return;
    }
    
    let filtered = [...reports];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }
    
    setFilteredReports(filtered);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenViewDialog = (report) => {
    setSelectedReport(report);
    setViewReportOpen(true);
    
    // Log the view action
    logAdminAction(
      'view',
      `Viewed report details: ${report.reason || 'No reason provided'}`,
      report.id,
      'report'
    );
  };

  const handleCloseViewDialog = () => {
    setViewReportOpen(false);
    setSelectedReport(null);
  };

  const handleOpenResolveDialog = (report) => {
    setSelectedReport(report);
    setResolveStatus('resolved');
    setResolution('');
    setResolveReportOpen(true);
  };

  const handleCloseResolveDialog = () => {
    setResolveReportOpen(false);
    setSelectedReport(null);
  };

  const handleDeleteReport = async (reportId) => {
    try {
      // Get report details before deleting for logging
      const reportToDelete = reports.find(report => report.id === reportId);
      if (!reportToDelete) return;

      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);
        
      if (error) throw error;
      
      // Log the action
      await logAdminAction(
        'delete',
        `Deleted report: ${reportToDelete.reason || 'No reason provided'}`,
        reportId,
        'report'
      );
      
      // Update local state
      setReports(reports.filter(report => report.id !== reportId));
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleResolveReport = async () => {
    if (!selectedReport) return;
    
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: resolveStatus,
          resolution: resolution,
          resolved_at: new Date().toISOString()
        })
        .eq('id', selectedReport.id);
        
      if (error) throw error;
      
      // Log the action
      await logAdminAction(
        'update',
        `Resolved report as ${resolveStatus}: ${resolution}`,
        selectedReport.id,
        'report'
      );
      
      // Update local state
      setReports(reports.map(report => 
        report.id === selectedReport.id 
          ? { 
              ...report, 
              status: resolveStatus, 
              resolution: resolution,
              resolved_at: new Date().toISOString() 
            } 
          : report
      ));
      
      handleCloseResolveDialog();
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Chip
            icon={<WarningIcon />}
            label="Pending"
            size="small"
            color="warning"
            sx={{ fontWeight: 'medium' }}
          />
        );
      case 'resolved':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Resolved"
            size="small"
            color="success"
            sx={{ fontWeight: 'medium' }}
          />
        );
      case 'dismissed':
        return (
          <Chip
            icon={<ErrorIcon />}
            label="Dismissed"
            size="small"
            color="error"
            sx={{ fontWeight: 'medium' }}
          />
        );
      default:
        return (
          <Chip
            label={status || 'Unknown'}
            size="small"
            color="default"
            sx={{ fontWeight: 'medium' }}
          />
        );
    }
  };

  const getCategoryChip = (reason) => {
    // For backwards compatibility, use reason field instead of category
    switch (reason) {
      case 'Inappropriate content':
        return (
          <Chip
            label="Inappropriate Content"
            size="small"
            color="error"
            variant="outlined"
          />
        );
      case 'Scam or fraud':
        return (
          <Chip
            label="Scam/Fraud"
            size="small"
            color="error"
            variant="outlined"
          />
        );
      case 'Harmful behavior':
        return (
          <Chip
            label="Harmful Behavior"
            size="small"
            color="secondary"
            variant="outlined"
          />
        );
      case 'Counterfeit product':
        return (
          <Chip
            label="Counterfeit"
            size="small"
            color="warning"
            variant="outlined"
          />
        );
      case 'Offensive messaging':
        return (
          <Chip
            label="Offensive"
            size="small"
            color="error"
            variant="outlined"
          />
        );
      case 'Suspicious activity':
        return (
          <Chip
            label="Suspicious"
            size="small"
            color="warning"
            variant="outlined"
          />
        );
      case 'Policy violation':
        return (
          <Chip
            label="Policy Violation"
            size="small"
            color="info"
            variant="outlined"
          />
        );
      default:
        return (
          <Chip
            label={reason || 'Other'}
            size="small"
            color="default"
            variant="outlined"
          />
        );
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({...snackbar, open: false});
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/admin')} sx={{ mr: 2 }} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Reports Management
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchReports}
            disabled={loading || accessError}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Access Error Alert */}
      {accessError && (
        <Alert 
          severity="warning" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={fixAccess}
              disabled={loading}
            >
              Fix Access
            </Button>
          }
          sx={{ mb: 3 }}
        >
          Admin does not have proper access to reports. Click "Fix Access" to resolve this issue.
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
          <CircularProgress />
        </Box>
      ) : reports.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ReportIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6">No reports found</Typography>
          <Typography variant="body2" color="text.secondary">
            {accessError 
              ? 'Fix access permissions to view reports' 
              : 'There are no user reports at this time'
            }
          </Typography>
          {!accessError && (
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              sx={{ mt: 2 }}
              onClick={fetchReports}
            >
              Refresh
            </Button>
          )}
        </Paper>
      ) : (
        <>
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Reports</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="dismissed">Dismissed</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Reports Table */}
          <Paper
            sx={{
              width: '100%',
              overflow: 'hidden',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader aria-label="reports table">
                <TableHead>
                  <TableRow>
                    <TableCell>Report ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Reporter</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Reported On</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        Loading reports...
                      </TableCell>
                    </TableRow>
                  ) : filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        No reports found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((report) => (
                        <TableRow key={report.id} hover>
                          <TableCell>#{report.id}</TableCell>
                          <TableCell>{getCategoryChip(report.reason)}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {report.reporter?.name || 'Anonymous'}
                            </Typography>
                            {report.reporter?.email && (
                              <Typography variant="caption" color="text.secondary">
                                {report.reporter.email}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {report.reported_user ? (
                              <Typography variant="body2">
                                User: {report.reported_user.name}
                              </Typography>
                            ) : report.listing ? (
                              <Typography variant="body2">
                                Listing: {report.listing.title}
                              </Typography>
                            ) : (
                              <Typography variant="body2">
                                Other Content
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {format(new Date(report.created_at), 'MMM d, yyyy')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(report.created_at), 'h:mm a')}
                            </Typography>
                          </TableCell>
                          <TableCell>{getStatusChip(report.status)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenViewDialog(report)}
                                aria-label="view"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                              {report.status === 'pending' && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenResolveDialog(report)}
                                  aria-label="resolve"
                                  color="primary"
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              )}
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteReport(report.id)}
                                aria-label="delete"
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredReports.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </>
      )}

      {/* View Report Dialog */}
      <Dialog
        open={viewReportOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedReport && (
          <>
            <DialogTitle>
              Report Details #{selectedReport.id}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Report Information
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'background.neutral' }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" component="span">
                        Status:
                      </Typography>{' '}
                      {getStatusChip(selectedReport.status)}
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" component="span">
                        Category:
                      </Typography>{' '}
                      {getCategoryChip(selectedReport.reason)}
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Description:
                      </Typography>
                      <Typography variant="body2">
                        {selectedReport.description || 'No description provided'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Reported on:
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(selectedReport.created_at), 'PPP p')}
                      </Typography>
                    </Box>
                    
                    {selectedReport.status !== 'pending' && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Resolution:
                        </Typography>
                        <Typography variant="body2">
                          {selectedReport.resolution || 'No resolution notes'}
                        </Typography>
                        {selectedReport.resolved_at && (
                          <Typography variant="caption" color="text.secondary">
                            Resolved on {format(new Date(selectedReport.resolved_at), 'PPP p')}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Reporter
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'background.neutral' }}>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Name:</strong> {selectedReport.reporter?.name || 'Anonymous'}
                    </Typography>
                    {selectedReport.reporter?.email && (
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedReport.reporter.email}
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              </Box>
              
              {selectedReport.reported_user && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Reported User
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'background.neutral' }}>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <strong>Name:</strong> {selectedReport.reported_user.name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedReport.reported_user.email}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => navigate(`/admin/users?id=${selectedReport.reported_user_id}`)}
                        sx={{ alignSelf: 'flex-start', mt: 1 }}
                      >
                        View User Profile
                      </Button>
                    </Stack>
                  </Paper>
                </Box>
              )}
              
              {selectedReport.listing && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Reported Listing
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'background.neutral' }}>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <strong>Title:</strong> {selectedReport.listing.title}
                      </Typography>
                      {selectedReport.listing.images && selectedReport.listing.images[0] && (
                        <Box sx={{ mt: 1, maxWidth: 200 }}>
                          <img 
                            src={selectedReport.listing.images[0]} 
                            alt={selectedReport.listing.title}
                            style={{ width: '100%', borderRadius: '4px' }}
                          />
                        </Box>
                      )}
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => navigate(`/admin/listings?id=${selectedReport.listing_id}`)}
                        sx={{ alignSelf: 'flex-start', mt: 1 }}
                      >
                        View Listing Details
                      </Button>
                    </Stack>
                  </Paper>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              {selectedReport.status === 'pending' && (
                <Button onClick={() => handleOpenResolveDialog(selectedReport)} color="primary">
                  Resolve Report
                </Button>
              )}
              <Button onClick={handleCloseViewDialog} variant="outlined">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Resolve Report Dialog */}
      <Dialog
        open={resolveReportOpen}
        onClose={handleCloseResolveDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Resolve Report</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="resolve-status-label">Resolution Status</InputLabel>
              <Select
                labelId="resolve-status-label"
                value={resolveStatus}
                label="Resolution Status"
                onChange={(e) => setResolveStatus(e.target.value)}
              >
                <MenuItem value="resolved">Resolved (Action Taken)</MenuItem>
                <MenuItem value="dismissed">Dismissed (No Action)</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Resolution Notes"
              multiline
              rows={4}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              fullWidth
              margin="normal"
              placeholder="Describe the actions taken or why the report was dismissed..."
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseResolveDialog} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleResolveReport} 
            variant="contained" 
            color={resolveStatus === 'resolved' ? 'success' : 'warning'}
          >
            {resolveStatus === 'resolved' ? 'Mark Resolved' : 'Dismiss Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Debug Tools - Always show for troubleshooting */}
      <ReportsPolicyDebug />
      
      {/* Advanced Diagnostics */}
      <Box sx={{ mt: 3, mb: 5 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Advanced Diagnostics</Typography>
        <AdminDiagnostics />
      </Box>
    </Container>
  );
};

export default ReportsManagement; 