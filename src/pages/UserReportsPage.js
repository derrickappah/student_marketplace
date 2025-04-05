import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Divider,
  Grid,
  useTheme,
  alpha,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  Stack,
  Avatar,
  Skeleton
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Report as ReportIcon,
  PendingActions as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  PersonOutline as PersonIcon,
  Inventory2Outlined as InventoryIcon,
  ChatOutlined as ChatIcon
} from '@mui/icons-material';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { useColorMode } from '../contexts/ThemeContext';

const UserReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const theme = useTheme();
  const { mode } = useColorMode();
  const [tabValue, setTabValue] = useState('all');
  
  // For report details dialog
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchUserReports();
  }, [user]);

  const fetchUserReports = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reported_user:reported_user_id (name),
          listing:listing_id (title)
        `)
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching user reports:', error);
      setError('Failed to load your reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Chip 
            icon={<PendingIcon />}
            size="small" 
            color="warning" 
            label="Pending"
            sx={{ 
              fontWeight: 'medium',
              '& .MuiChip-icon': { fontSize: 16 }
            }}
          />
        );
      case 'reviewing':
        return (
          <Chip 
            icon={<FilterListIcon />}
            size="small" 
            color="info" 
            label="Reviewing"
            sx={{ 
              fontWeight: 'medium',
              '& .MuiChip-icon': { fontSize: 16 }
            }}
          />
        );
      case 'resolved':
        return (
          <Chip 
            icon={<CheckCircleIcon />}
            size="small" 
            color="success" 
            label="Resolved"
            sx={{ 
              fontWeight: 'medium',
              '& .MuiChip-icon': { fontSize: 16 }
            }}
          />
        );
      case 'dismissed':
        return (
          <Chip 
            icon={<CancelIcon />}
            size="small" 
            color="error" 
            label="Dismissed"
            sx={{ 
              fontWeight: 'medium',
              '& .MuiChip-icon': { fontSize: 16 }
            }}
          />
        );
      default:
        return (
          <Chip 
            size="small" 
            color="default" 
            label={status}
            sx={{ fontWeight: 'medium' }}
          />
        );
    }
  };

  const getReportSubject = (report) => {
    if (report.reported_user_id) {
      return {
        type: 'user',
        name: report.reported_user?.name || 'Unknown User',
        icon: <PersonIcon />
      };
    } else if (report.listing_id) {
      return {
        type: 'listing',
        name: report.listing?.title || 'Unknown Listing',
        icon: <InventoryIcon />
      };
    } else if (report.message_id) {
      return {
        type: 'message',
        name: 'Message',
        icon: <ChatIcon />
      };
    } else {
      return {
        type: 'unknown',
        name: 'Unknown',
        icon: <ReportIcon />
      };
    }
  };

  const getStatusCount = (status) => {
    return reports.filter(report => report.status === status).length;
  };

  const getFilteredReports = () => {
    if (tabValue === 'all') {
      return reports;
    }
    return reports.filter(report => report.status === tabValue);
  };

  const filteredReports = getFilteredReports();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight="bold"
          gutterBottom
          sx={{
            position: 'relative',
            display: 'inline-block',
            pb: 1,
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '40%',
              height: 3,
              backgroundColor: 'primary.main',
              borderRadius: 1.5,
            }
          }}
        >
          Your Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track the status of reports you've submitted. Our team reviews all reports to keep our platform safe.
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {error}
        </Alert>
      )}

      {/* Report Summary Banner */}
      {!loading && reports.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card 
              elevation={0}
              sx={{
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, mode === 'dark' ? 0.15 : 0.1),
                boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.2)}`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 6px 16px ${alpha(theme.palette.warning.main, 0.3)}`
                }
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PendingIcon sx={{ color: 'warning.main', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">Pending</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">{getStatusCount('pending')}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card 
              elevation={0}
              sx={{
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, mode === 'dark' ? 0.15 : 0.1),
                boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.2)}`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 6px 16px ${alpha(theme.palette.info.main, 0.3)}`
                }
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FilterListIcon sx={{ color: 'info.main', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">Reviewing</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">{getStatusCount('reviewing')}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card 
              elevation={0}
              sx={{
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, mode === 'dark' ? 0.15 : 0.1),
                boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.2)}`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 6px 16px ${alpha(theme.palette.success.main, 0.3)}`
                }
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">Resolved</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">{getStatusCount('resolved')}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card 
              elevation={0}
              sx={{
                borderRadius: 2,
                bgcolor: alpha(theme.palette.error.main, mode === 'dark' ? 0.15 : 0.1),
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 6px 16px ${alpha(theme.palette.error.main, 0.3)}`
                }
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CancelIcon sx={{ color: 'error.main', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">Dismissed</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">{getStatusCount('dismissed')}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs for filtering */}
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 3,
          mb: 3,
          overflow: 'hidden',
          boxShadow: mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.2)'
            : '0 4px 20px rgba(0,0,0,0.05)',
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': {
              py: 2,
              px: 3,
              minWidth: 'auto',
              fontWeight: 600,
            },
            '& .Mui-selected': {
              color: mode === 'dark' ? 'primary.light' : 'primary.main',
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            }
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1 }}>All</Typography>
                <Chip 
                  label={reports.length} 
                  size="small" 
                  sx={{ height: 20, fontSize: '0.75rem' }} 
                />
              </Box>
            } 
            value="all" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1 }}>Pending</Typography>
                <Chip 
                  label={getStatusCount('pending')} 
                  size="small" 
                  color="warning" 
                  sx={{ height: 20, fontSize: '0.75rem' }} 
                />
              </Box>
            } 
            value="pending" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1 }}>Reviewing</Typography>
                <Chip 
                  label={getStatusCount('reviewing')} 
                  size="small" 
                  color="info" 
                  sx={{ height: 20, fontSize: '0.75rem' }} 
                />
              </Box>
            }
            value="reviewing" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1 }}>Resolved</Typography>
                <Chip 
                  label={getStatusCount('resolved')} 
                  size="small" 
                  color="success" 
                  sx={{ height: 20, fontSize: '0.75rem' }} 
                />
              </Box>
            }
            value="resolved" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1 }}>Dismissed</Typography>
                <Chip 
                  label={getStatusCount('dismissed')} 
                  size="small" 
                  color="error" 
                  sx={{ height: 20, fontSize: '0.75rem' }} 
                />
              </Box>
            }
            value="dismissed" 
          />
        </Tabs>
      </Paper>

      {/* Reports Cards Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Card 
                elevation={0}
                sx={{
                  borderRadius: 3,
                  height: '100%',
                  boxShadow: mode === 'dark'
                    ? '0 4px 20px rgba(0,0,0,0.2)'
                    : '0 4px 20px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Skeleton width="50%" height={24} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" height={20} sx={{ mb: 1.5 }} />
                  <Skeleton width="70%" height={20} sx={{ mb: 1.5 }} />
                  <Skeleton width="40%" height={20} sx={{ mb: 1.5 }} />
                  <Skeleton width="60%" height={20} />
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                  <Skeleton width={80} height={32} />
                  <Skeleton width={36} height={36} variant="circular" />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredReports.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            bgcolor: mode === 'dark' ? 'background.paper' : 'white',
            boxShadow: mode === 'dark'
              ? '0 4px 20px rgba(0,0,0,0.2)'
              : '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          <ReportIcon 
            sx={{ 
              fontSize: 64, 
              color: 'text.secondary', 
              mb: 2, 
              opacity: 0.6 
            }} 
          />
          <Typography variant="h5" gutterBottom fontWeight="medium">
            No Reports Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mb: 3 }}>
            {tabValue === 'all' 
              ? "You haven't submitted any reports yet. When you report inappropriate content, it will appear here."
              : `You don't have any ${tabValue} reports at the moment.`
            }
          </Typography>
          {tabValue !== 'all' && (
            <Button 
              variant="outlined" 
              onClick={() => setTabValue('all')}
              sx={{ borderRadius: 2 }}
            >
              View All Reports
            </Button>
          )}
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredReports
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((report) => {
                const subject = getReportSubject(report);
                const reportDate = new Date(report.created_at);
                
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={report.id}>
                    <Card 
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        height: '100%',
                        boxShadow: mode === 'dark'
                          ? '0 4px 20px rgba(0,0,0,0.2)'
                          : '0 4px 20px rgba(0,0,0,0.05)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        border: '1px solid',
                        borderColor: 'divider',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: mode === 'dark'
                            ? '0 8px 30px rgba(0,0,0,0.3)'
                            : '0 8px 30px rgba(0,0,0,0.1)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '4px',
                          background: (() => {
                            switch(report.status) {
                              case 'pending': return theme.palette.warning.main;
                              case 'reviewing': return theme.palette.info.main;
                              case 'resolved': return theme.palette.success.main;
                              case 'dismissed': return theme.palette.error.main;
                              default: return theme.palette.grey[500];
                            }
                          })(),
                        }
                      }}
                    >
                      <CardContent sx={{ pt: 3, px: 3 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              bgcolor: (() => {
                                switch(subject.type) {
                                  case 'user': return theme.palette.primary.light;
                                  case 'listing': return theme.palette.secondary.light;
                                  case 'message': return theme.palette.info.light;
                                  default: return theme.palette.grey[500];
                                }
                              })(),
                              fontSize: '0.875rem'
                            }}
                          >
                            {subject.icon}
                          </Avatar>
                          <Typography variant="subtitle2" color="text.secondary">
                            {subject.type.charAt(0).toUpperCase() + subject.type.slice(1)}
                          </Typography>
                        </Stack>
                        
                        <Box sx={{ minHeight: 60 }}>
                          <Typography 
                            variant="subtitle1" 
                            fontWeight="bold" 
                            gutterBottom
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {report.reason}
                          </Typography>
                        </Box>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            mb: 1.5,
                            minHeight: 40
                          }}
                        >
                          {subject.name}
                        </Typography>
                        
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {format(reportDate, 'MMM d, yyyy')} at {format(reportDate, 'h:mm a')}
                          </Typography>
                        </Stack>
                      </CardContent>
                      
                      <CardActions sx={{ px: 3, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                        {getStatusChip(report.status)}
                        <Tooltip title="View details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewReport(report)}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                              }
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
          
          {/* Pagination */}
          {filteredReports.length > rowsPerPage && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <TablePagination
                component="div"
                count={filteredReports.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[8, 16, 24, 32]}
              />
            </Box>
          )}
        </>
      )}

      {/* Report Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 24,
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        {selectedReport && (
          <>
            <DialogTitle
              sx={{
                bgcolor: mode === 'dark' ? 'background.paper' : '#f9fafc',
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: 2,
                px: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ReportIcon sx={{ color: 'primary.main', mr: 1.5 }} />
                <Typography variant="h6" fontWeight="bold">
                  Report Details
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ p: 3 }}>
                {/* Status banner */}
                <Box 
                  sx={{ 
                    p: 2, 
                    mb: 3, 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: (() => {
                      switch(selectedReport.status) {
                        case 'pending': return alpha(theme.palette.warning.main, mode === 'dark' ? 0.15 : 0.1);
                        case 'reviewing': return alpha(theme.palette.info.main, mode === 'dark' ? 0.15 : 0.1);
                        case 'resolved': return alpha(theme.palette.success.main, mode === 'dark' ? 0.15 : 0.1);
                        case 'dismissed': return alpha(theme.palette.error.main, mode === 'dark' ? 0.15 : 0.1);
                        default: return alpha(theme.palette.grey[500], mode === 'dark' ? 0.15 : 0.1);
                      }
                    })()
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Current Status: 
                    </Typography>
                    <Box sx={{ ml: 1.5 }}>
                      {getStatusChip(selectedReport.status)}
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Submitted {format(new Date(selectedReport.created_at), 'MMMM d, yyyy')}
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="overline" color="text.secondary" fontWeight="bold" display="block" gutterBottom>
                      Report Reason
                    </Typography>
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>
                      {selectedReport.reason}
                    </Typography>
                    
                    <Typography variant="overline" color="text.secondary" fontWeight="bold" display="block" sx={{ mt: 3 }} gutterBottom>
                      Reported Item
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {getReportSubject(selectedReport).name}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="overline" color="text.secondary" fontWeight="bold" display="block" gutterBottom>
                      Report Date
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {format(new Date(selectedReport.created_at), 'MMMM d, yyyy, h:mm a')}
                    </Typography>

                    {selectedReport.status === 'resolved' && selectedReport.resolved_at && (
                      <>
                        <Typography variant="overline" color="text.secondary" fontWeight="bold" display="block" sx={{ mt: 3 }} gutterBottom>
                          Resolution Date
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {format(new Date(selectedReport.resolved_at), 'MMMM d, yyyy, h:mm a')}
                        </Typography>
                      </>
                    )}
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="overline" color="text.secondary" fontWeight="bold" display="block" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" paragraph sx={{ mb: 2 }}>
                  {selectedReport.description || 'No additional details provided'}
                </Typography>
                
                {selectedReport.status === 'resolved' && selectedReport.resolution && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="overline" color="text.secondary" fontWeight="bold" display="block" gutterBottom>
                      Resolution Notes
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.resolution}
                    </Typography>
                  </>
                )}
              </Box>
              
              {/* Footer with close button */}
              <Box 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: mode === 'dark' ? 'background.paper' : '#f9fafc',
                }}
              >
                <Button 
                  variant="contained" 
                  onClick={handleCloseDialog}
                  sx={{ 
                    borderRadius: 2,
                    px: 3
                  }}
                >
                  Close
                </Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default UserReportsPage; 