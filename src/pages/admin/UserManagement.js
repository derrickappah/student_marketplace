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
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  InputAdornment,
  Tooltip,
  useTheme,
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Mail as MailIcon,
  Close as CloseIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { supabase } from "../../services/supabase";
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { logAdminAction } from '../../services/adminService';

const UserManagement = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUserData, setEditUserData] = useState({
    name: '',
    role: '',
    status: ''
  });
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [selected, setSelected] = useState([]);
  const [bulkActionAnchor, setBulkActionAnchor] = useState(null);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let result = [...users];
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        user => 
          user.name?.toLowerCase().includes(query) || 
          user.email?.toLowerCase().includes(query) ||
          user.university?.toLowerCase().includes(query)
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }
    
    setFilteredUsers(result);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setEditUserData({
      name: user.name || '',
      role: user.role || 'user',
      status: user.status || 'active'
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUserEdit = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editUserData.name,
          role: editUserData.role,
          status: editUserData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...editUserData, updated_at: new Date().toISOString() } 
          : user
      ));
      
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleOpenDeleteDialog = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // Note: This should be handled carefully in a real app
      // Typically you would want to archive users rather than delete them
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', userToDelete.id);
        
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userToDelete.id 
          ? { ...user, status: 'deleted', updated_at: new Date().toISOString() } 
          : user
      ));
      
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getRoleChip = (role) => {
    switch (role) {
      case 'admin':
        return (
          <Chip 
            icon={<AdminIcon />} 
            label="Admin" 
            size="small" 
            color="primary" 
            sx={{ fontWeight: 'medium' }} 
          />
        );
      case 'moderator':
        return (
          <Chip 
            icon={<AdminIcon />} 
            label="Moderator" 
            size="small" 
            color="info" 
            sx={{ fontWeight: 'medium' }} 
          />
        );
      default:
        return (
          <Chip 
            icon={<PersonIcon />} 
            label="User" 
            size="small" 
            color="default" 
            sx={{ fontWeight: 'medium' }} 
          />
        );
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'active':
        return (
          <Chip 
            icon={<CheckCircleIcon />} 
            label="Active" 
            size="small" 
            color="success" 
            sx={{ fontWeight: 'medium' }} 
          />
        );
      case 'suspended':
        return (
          <Chip 
            icon={<BlockIcon />} 
            label="Suspended" 
            size="small" 
            color="warning" 
            sx={{ fontWeight: 'medium' }} 
          />
        );
      case 'deleted':
        return (
          <Chip 
            icon={<DeleteIcon />} 
            label="Deleted" 
            size="small" 
            color="error" 
            sx={{ fontWeight: 'medium' }} 
          />
        );
      default:
        return (
          <Chip 
            label="Unknown" 
            size="small" 
            color="default" 
            sx={{ fontWeight: 'medium' }} 
          />
        );
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(filteredUsers.map(user => user.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectUser = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const handleBulkActionClick = (event) => {
    setBulkActionAnchor(event.currentTarget);
  };

  const handleBulkActionClose = () => {
    setBulkActionAnchor(null);
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selected.length === 0) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .in('id', selected);
      
      if (error) throw error;
      
      // Log the bulk action
      await logAdminAction(
        'bulk_action', 
        `Bulk updated ${selected.length} users' status to ${newStatus}`, 
        selected.join(','), 
        'user'
      );
      
      // Update the users in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          selected.includes(user.id) ? { ...user, status: newStatus } : user
        )
      );
      
      setSnackbarMessage(`${selected.length} users updated to ${newStatus}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Clear selection after bulk action
      setSelected([]);
    } catch (error) {
      console.error('Error in bulk status update:', error);
      setSnackbarMessage('Failed to update users');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selected.length} users? This action cannot be undone.`)) {
      try {
        for (const userId of selected) {
          await supabase
            .from('users')
            .delete()
            .eq('id', userId);
        }
        
        // Update local state
        setUsers(users.filter(user => !selected.includes(user.id)));
        
        setSnackbarMessage(`${selected.length} users deleted successfully`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setSelected([]);
      } catch (error) {
        console.error('Error deleting users:', error);
        setSnackbarMessage('Failed to delete users');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
    
    handleBulkActionClose();
  };

  const handleOpenBulkEmail = () => {
    setBulkEmailOpen(true);
    handleBulkActionClose();
  };

  const handleCloseBulkEmail = () => {
    setBulkEmailOpen(false);
  };

  const handleSendBulkEmail = async () => {
    try {
      // In a real application, you would call your email service here
      // This is just a placeholder
      console.log('Sending email to', selected);
      console.log('Subject:', emailSubject);
      console.log('Content:', emailContent);
      
      // For demo purposes, pretend it's successful
      setSnackbarMessage(`Email sent to ${selected.length} users`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Reset form
      setEmailSubject('');
      setEmailContent('');
      setBulkEmailOpen(false);
    } catch (error) {
      console.error('Error sending email:', error);
      setSnackbarMessage('Failed to send emails');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleExportSelected = () => {
    // Get the selected users' data
    const selectedUsers = users.filter(user => selected.includes(user.id));
    
    // Convert to CSV format
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At'];
    const csvData = [
      headers.join(','),
      ...selectedUsers.map(user => [
        user.id,
        user.name,
        user.email,
        user.role,
        user.status,
        user.created_at
      ].join(','))
    ].join('\n');
    
    // Create a blob and download
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'selected_users.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    handleBulkActionClose();
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Log the action
      await logAdminAction(
        'update', 
        `Changed user role to ${newRole}`, 
        userId, 
        'user'
      );
      
      // Update the user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      setSnackbarMessage(`User role updated to ${newRole}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating user role:', error);
      setSnackbarMessage(`Error updating user role: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusChange = async (userId, newStatus) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Log the action
      await logAdminAction(
        'update', 
        `Changed user status to ${newStatus}`, 
        userId, 
        'user'
      );
      
      // Update the user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
      
      setSnackbarMessage(`User status updated to ${newStatus}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating user status:', error);
      setSnackbarMessage(`Error updating user status: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleExportUsers = () => {
    if (selected.length === 0 && filteredUsers.length === 0) return;
    
    // Determine if we're exporting selected users or all filtered users
    const usersToExport = selected.length > 0 
      ? users.filter(user => selected.includes(user.id))
      : filteredUsers;
    
    // Create CSV
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...usersToExport.map(user => [
        user.id,
        `"${user.name?.replace(/"/g, '""') || ''}"`,
        user.email,
        user.role || 'user',
        user.status || 'active',
        user.created_at ? format(new Date(user.created_at), 'yyyy-MM-dd HH:mm:ss') : ''
      ].join(','))
    ].join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Log the export action
    logAdminAction(
      'export', 
      `Exported ${usersToExport.length} users to CSV`, 
      selected.length > 0 ? selected.join(',') : 'all_filtered', 
      'user'
    );

    // Close menu
    handleExportMenuClose();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={() => navigate('/admin')}
            sx={{ mr: 2 }}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              User Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              View and manage user accounts
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchUsers}
        >
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', md: 'center' },
        }}
      >
        <TextField
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="role-filter-label">Role</InputLabel>
          <Select
            labelId="role-filter-label"
            id="role-filter"
            value={roleFilter}
            label="Role"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="moderator">Moderator</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
            <MenuItem value="deleted">Deleted</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Users Table */}
      <Paper
        sx={{
          width: '100%',
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="users table">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < filteredUsers.length}
                    checked={filteredUsers.length > 0 && selected.length === filteredUsers.length}
                    onChange={handleSelectAll}
                    inputProps={{
                      'aria-label': 'select all users',
                    }}
                  />
                </TableCell>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>University</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => {
                    const isItemSelected = isSelected(user.id);
                    
                    return (
                      <TableRow 
                        key={user.id} 
                        hover
                        onClick={(event) => handleSelectUser(event, user.id)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => handleSelectUser(event, user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              src={user.avatar_url}
                              alt={user.name}
                              sx={{ mr: 2, width: 40, height: 40 }}
                            >
                              {user.name?.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight="medium">
                              {user.name || 'Unknown'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.university}</TableCell>
                        <TableCell>{getRoleChip(user.role)}</TableCell>
                        <TableCell>{getStatusChip(user.status || 'active')}</TableCell>
                        <TableCell>
                          {user.created_at
                            ? format(new Date(user.created_at), 'MMM d, yyyy')
                            : 'Unknown'}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              onClick={(event) => { event.stopPropagation(); handleOpenEditDialog(user); }}
                              aria-label="edit"
                              sx={{ mr: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {user.status !== 'deleted' && (
                            <Tooltip title="Delete User">
                              <IconButton
                                size="small"
                                onClick={(event) => { event.stopPropagation(); handleOpenDeleteDialog(user); }}
                                aria-label="delete"
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {selected.length > 0 && (
        <Paper 
          sx={{ 
            position: 'sticky', 
            top: theme.spacing(2),
            zIndex: 2,
            mb: 2,
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderLeft: `4px solid ${theme.palette.primary.main}`,
            boxShadow: theme.shadows[3]
          }}
        >
          <Typography variant="subtitle1">
            {selected.length} user{selected.length > 1 ? 's' : ''} selected
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              size="small" 
              onClick={handleBulkActionClick}
              startIcon={<MoreVertIcon />}
            >
              Bulk Actions
            </Button>
            
            <Menu
              anchorEl={bulkActionAnchor}
              open={Boolean(bulkActionAnchor)}
              onClose={handleBulkActionClose}
            >
              <MenuItem onClick={() => handleBulkStatusChange('active')}>
                <ListItemIcon>
                  <CheckIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                </ListItemIcon>
                <ListItemText>Activate Users</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleBulkStatusChange('suspended')}>
                <ListItemIcon>
                  <BlockIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                </ListItemIcon>
                <ListItemText>Suspend Users</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleOpenBulkEmail}>
                <ListItemIcon>
                  <MailIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                </ListItemIcon>
                <ListItemText>Email Users</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleExportSelected}>
                <ListItemIcon>
                  <DownloadIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                </ListItemIcon>
                <ListItemText>Export Selected</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleBulkDelete}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                </ListItemIcon>
                <ListItemText>Delete Users</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Paper>
      )}

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              margin="normal"
              label="Name"
              type="text"
              fullWidth
              value={editUserData.name}
              onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
              variant="outlined"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="edit-role-label">Role</InputLabel>
              <Select
                labelId="edit-role-label"
                value={editUserData.role}
                label="Role"
                onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="moderator">Moderator</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="edit-status-label">Status</InputLabel>
              <Select
                labelId="edit-status-label"
                value={editUserData.status}
                label="Status"
                onChange={(e) => setEditUserData({ ...editUserData, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="deleted">Deleted</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseEditDialog} variant="outlined">Cancel</Button>
          <Button onClick={handleSaveUserEdit} variant="contained" color="primary">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete User Account
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the account for {userToDelete?.name}? This action will mark the account as deleted and cannot be easily reversed.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDeleteDialog} variant="outlined">Cancel</Button>
          <Button onClick={handleDeleteUser} variant="contained" color="error">
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Email Dialog */}
      <Dialog open={bulkEmailOpen} onClose={handleCloseBulkEmail} maxWidth="md" fullWidth>
        <DialogTitle>Send Email to {selected.length} Users</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Message"
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              fullWidth
              multiline
              rows={8}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkEmail} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSendBulkEmail} 
            variant="contained" 
            color="primary"
            disabled={!emailSubject || !emailContent}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserManagement; 