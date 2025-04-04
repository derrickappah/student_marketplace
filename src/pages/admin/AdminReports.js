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
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as ResolveIcon,
  Cancel as DismissIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { supabase } from "../../services/supabase";
import { format } from 'date-fns';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionStatus, setActionStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [listingDetails, setListingDetails] = useState({});
  
  useEffect(() => {
    fetchReports();
  }, [filter]);
  
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_id(id, name, email),
          reported_user:reported_user_id(id, name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setReports(data || []);
      
      // Fetch related listings details
      const listingIds = data
        .filter(report => report.listing_id)
        .map(report => report.listing_id);
      
      if (listingIds.length > 0) {
        const { data: listingsData } = await supabase
          .from('listings')
          .select('id, title, price, user_id')
          .in('id', listingIds);
        
        if (listingsData) {
          const listingsMap = {};
          listingsData.forEach(listing => {
            listingsMap[listing.id] = listing;
          });
          setListingDetails(listingsMap);
        }
      }
      
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
    setPage(0);
  };
  
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setActionStatus('');
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedReport(null);
    setAdminNotes('');
    setActionStatus('');
  };
  
  const handleUpdateReport = async (newStatus) => {
    if (!selectedReport) return;
    
    try {
      setActionLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('reports')
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedReport.id);
      
      if (error) throw error;
      
      // Update the report in the local state
      setReports(reports.map(report => 
        report.id === selectedReport.id 
          ? { ...report, status: newStatus, admin_notes: adminNotes } 
          : report
      ));
      
      setActionStatus(`Report marked as ${newStatus}`);
      
      // Close dialog after a delay
      setTimeout(() => {
        handleCloseDialog();
        fetchReports(); // Refresh the list
      }, 1500);
      
    } catch (error) {
      console.error('Error updating report:', error);
      setError('Failed to update report. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const getStatusChip = (status) => {
    let color, label;
    
    switch (status) {
      case 'pending':
        color = 'warning';
        label = 'Pending';
        break;
      case 'reviewing':
        color = 'info';
        label = 'Reviewing';
        break;
      case 'resolved':
        color = 'success';
        label = 'Resolved';
        break;
      case 'dismissed':
        color = 'error';
        label = 'Dismissed';
        break;
      default:
        color = 'default';
        label = status;
    }
    
    return <Chip size="small" color={color} label={label} />;
  };
  
  const getReportTypeLabel = (report) => {
    if (report.reported_user_id) return 'User';
    if (report.listing_id) return 'Listing';
    if (report.message_id) return 'Message';
    return 'Unknown';
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Reports Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="filter-label">Status</InputLabel>
            <Select
              labelId="filter-label"
              value={filter}
              onChange={handleFilterChange}
              label="Status"
              size="small"
            >
              <MenuItem value="all">All Reports</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="reviewing">Reviewing</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="dismissed">Dismissed</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchReports}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Report Type</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Reported By</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={30} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Loading reports...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2">
                      No reports found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reports
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>{getReportTypeLabel(report)}</TableCell>
                      <TableCell>{report.reason}</TableCell>
                      <TableCell>
                        {report.reporter?.name || 'Unknown User'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(report.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {getStatusChip(report.status)}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          color="primary"
                          onClick={() => handleViewReport(report)}
                          size="small"
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={reports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>
      
      {/* Report Detail Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedReport && (
          <>
            <DialogTitle>
              Report Details
              {getStatusChip(selectedReport.status)}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Report Information
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body1">
                      {getReportTypeLabel(selectedReport)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Reason
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.reason}
                    </Typography>
                  </Box>
                  {selectedReport.description && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Description
                      </Typography>
                      <Typography variant="body1">
                        {selectedReport.description}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Reported By
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.reporter?.name || 'Unknown User'}
                      {selectedReport.reporter?.email && ` (${selectedReport.reporter.email})`}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Date Submitted
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(selectedReport.created_at), 'PPpp')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Reported Content
                  </Typography>
                  
                  {selectedReport.reported_user_id && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Reported User
                      </Typography>
                      <Typography variant="body1">
                        {selectedReport.reported_user?.name || 'Unknown User'}
                        {selectedReport.reported_user?.email && ` (${selectedReport.reported_user.email})`}
                      </Typography>
                    </Box>
                  )}
                  
                  {selectedReport.listing_id && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Reported Listing
                      </Typography>
                      <Typography variant="body1">
                        {listingDetails[selectedReport.listing_id]?.title || 'Unknown Listing'}
                      </Typography>
                      {listingDetails[selectedReport.listing_id]?.price && (
                        <Typography variant="body2">
                          Price: ${listingDetails[selectedReport.listing_id].price}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {selectedReport.message_id && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Reported Message
                      </Typography>
                      <Typography variant="body1">
                        Message ID: {selectedReport.message_id}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Admin Notes
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this report and any actions taken..."
                  />
                </Grid>
              </Grid>
              
              {actionStatus && (
                <Alert 
                  severity="success" 
                  sx={{ mt: 2 }}
                >
                  {actionStatus}
                </Alert>
              )}
              
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ mt: 2 }}
                >
                  {error}
                </Alert>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleCloseDialog}>
                Close
              </Button>
              <Button 
                variant="outlined"
                color="error"
                startIcon={<DismissIcon />}
                onClick={() => handleUpdateReport('dismissed')}
                disabled={actionLoading || selectedReport.status === 'dismissed'}
              >
                Dismiss
              </Button>
              <Button 
                variant="outlined"
                color="info"
                onClick={() => handleUpdateReport('reviewing')}
                disabled={actionLoading || selectedReport.status === 'reviewing'}
              >
                Mark as Reviewing
              </Button>
              <Button 
                variant="contained"
                color="success"
                startIcon={<ResolveIcon />}
                onClick={() => handleUpdateReport('resolved')}
                disabled={actionLoading || selectedReport.status === 'resolved'}
              >
                Mark as Resolved
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default AdminReports; 