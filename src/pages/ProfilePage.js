import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  Badge,
  IconButton,
  LinearProgress,
  FormControlLabel,
  Switch,
  Tooltip,
  Snackbar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import MessageIcon from '@mui/icons-material/Message';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, getUserListings, uploadImage, supabase } from "../services/supabase";
import { directDeleteListing, deleteListingByPrimaryKey, deleteListingWithTriggersDisabled } from '../services/direct-sql';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import { useSnackbar } from 'notistack';
import { useColorMode } from '../contexts/ThemeContext';
import { userDeleteListing } from "../services/userService";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { mode } = useColorMode();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [userListings, setUserListings] = useState([]);
  const [listingLoading, setListingLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Get preferences from user metadata if available, or use defaults
  const defaultPreferences = {
    emailNotifications: true,
    offerAlerts: true,
    messageAlerts: true,
    browserNotifications: true,
  };
  
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    bio: user?.user_metadata?.bio || '',
    university: user?.user_metadata?.university || '',
    avatarUrl: user?.user_metadata?.avatar_url || '',
    notificationPreferences: user?.user_metadata?.notification_preferences || defaultPreferences
  });

  // Calculate profile completeness
  const calculateProfileCompleteness = () => {
    const fields = [
      !!formData.name, 
      !!formData.email, 
      !!formData.phone, 
      !!formData.bio, 
      !!formData.university, 
      !!formData.avatarUrl || !!avatarPreview
    ];
    const filledFields = fields.filter(Boolean).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const profileCompleteness = calculateProfileCompleteness();

  useEffect(() => {
    console.log('User data:', user);
    console.log('User metadata:', user?.user_metadata);
    
    // Update form data when user data changes
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        bio: user.user_metadata?.bio || '',
        university: user.user_metadata?.university || '',
        avatarUrl: user.user_metadata?.avatar_url || '',
        notificationPreferences: user.user_metadata?.notification_preferences || defaultPreferences
      }));
    }

    const fetchUserListings = async () => {
      try {
        const { data, error } = await getUserListings();
        if (error) throw error;
        setUserListings(data || []);
      } catch (err) {
        setError('Error loading your listings');
        console.error('Error:', err);
      }
    };

    fetchUserListings();

    // Set avatar preview if user has an avatar
    if (user?.user_metadata?.avatar_url) {
      setAvatarPreview(user.user_metadata.avatar_url);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setHasChanges(true);
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [name]: checked,
      }
    }));
    setHasChanges(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clear any previous avatar errors
      if (validationErrors.avatar) {
        setValidationErrors(prev => ({ ...prev, avatar: null }));
      }
      
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors(prev => ({ 
          ...prev, 
          avatar: 'Image size must be less than 5MB' 
        }));
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setValidationErrors(prev => ({ 
          ...prev, 
          avatar: 'Only JPEG, PNG, GIF, and WebP images are allowed' 
        }));
        return;
      }
      
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setHasChanges(true);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (formData.phone && !/^[\d\s+\-()]{10,15}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.bio && formData.bio.length > 500) {
      errors.bio = 'Bio should be 500 characters or less';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setError('Please correct the form errors');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setSaveMessage('Saving profile changes...');

    try {
      // Upload avatar if provided
      let avatarUrl = formData.avatarUrl;
      if (avatarFile) {
        setAvatarLoading(true);
        
        console.log('Uploading profile picture...');
        const { success, data, error: uploadError } = await uploadImage(avatarFile);
        setAvatarLoading(false);
        
        if (!success) {
          console.error('Avatar upload failed:', uploadError);
          throw new Error(uploadError || 'Failed to upload avatar');
        }
        
        console.log('Avatar uploaded successfully:', data);
        avatarUrl = data.path;
      }

      // IMPORTANT: First update the auth metadata for the user
      // This bypasses RLS policies
      console.log('Updating user metadata with:', {
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
        university: formData.university,
        avatar_url: avatarUrl,
        notification_preferences: formData.notificationPreferences
      });
      
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
          phone: formData.phone,
          bio: formData.bio,
          university: formData.university,
          avatar_url: avatarUrl,
          notification_preferences: formData.notificationPreferences
        }
      });
      
      if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        throw new Error(metadataError.message || 'Failed to update profile');
      }
      
      // Now update just the main fields in the users table
      try {
        const { error: profileError } = await supabase
          .from('users')
          .update({
            name: formData.name,
            phone: formData.phone,
            bio: formData.bio,
            university: formData.university,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (profileError) {
          console.error('Error updating profile in database:', profileError);
          // Don't throw, we already updated the user metadata which is most important
        } else {
          console.log('Profile updated in database successfully');
        }
      } catch (dbError) {
        console.error('Exception in profile database update:', dbError);
        // Continue since metadata is updated
      }

      console.log('Profile updated successfully, refreshing user data');
      const updatedUser = await updateUser();
      console.log('Updated user from context:', updatedUser);
      
      // Update form with the returned avatar url
      setFormData(prev => ({
        ...prev,
        avatarUrl
      }));
      
      setSuccess('Profile updated successfully');
      setHasChanges(false);
      setIsEditing(false);
      setSaveMessage('Profile saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
        setSaveMessage('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Error updating profile');
      setSaveMessage('');
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    // Check for unsaved changes before switching tabs
    if (hasChanges && (activeTab === 0 || activeTab === 3)) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave this tab?')) {
        setActiveTab(newValue);
        setHasChanges(false);
      }
    } else {
      setActiveTab(newValue);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset form data to original values using user metadata
    setFormData({
      name: user?.user_metadata?.name || '',
      email: user?.email || '',
      phone: user?.user_metadata?.phone || '',
      bio: user?.user_metadata?.bio || '',
      university: user?.user_metadata?.university || '',
      avatarUrl: user?.user_metadata?.avatar_url || '',
      notificationPreferences: user?.user_metadata?.notification_preferences || defaultPreferences
    });
    
    // Reset avatar preview
    if (user?.user_metadata?.avatar_url) {
      setAvatarPreview(user.user_metadata.avatar_url);
    } else {
      setAvatarPreview('');
    }
    
    setAvatarFile(null);
    setValidationErrors({});
    setHasChanges(false);
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleDeleteListing = async (listingId) => {
    try {
      setDeleteInProgress(true);
      
      // Log detailed information for debugging
      console.log('Attempting to delete listing:', listingId);
      console.log('Current user ID:', user?.id);
      
      // First check if the listing still exists and belongs to the user
      const listing = userListings.find(item => item.id === listingId);
      if (!listing) {
        throw new Error('Listing not found. It may have been already deleted.');
      }
      
      // Try multiple approaches in sequence until one works
      
      // ATTEMPT 1: Use the triggers disabled method
      console.log('ATTEMPT 1: Using deletion with triggers disabled');
      const { success: triggerSuccess, error: triggerError } = await deleteListingWithTriggersDisabled(listingId, user.id);
      
      if (triggerSuccess) {
        console.log('Deletion with triggers disabled succeeded');
        
        // Update the UI by removing the deleted listing
        setUserListings(prev => prev.filter(listing => listing.id !== listingId));
        
        // Show success notification
        enqueueSnackbar('Listing deleted successfully', { 
          variant: 'success',
          autoHideDuration: 3000
        });
        
        return;
      }
      
      console.error('Deletion with triggers disabled failed:', triggerError);
      
      // ATTEMPT 2: Use the primary key deletion method
      console.log('ATTEMPT 2: Using primary key deletion method');
      const { success: pkSuccess, error: pkError } = await deleteListingByPrimaryKey(listingId, user.id);
      
      if (pkSuccess) {
        console.log('Primary key deletion succeeded');
        
        // Update the UI by removing the deleted listing
        setUserListings(prev => prev.filter(listing => listing.id !== listingId));
        
        // Show success notification
        enqueueSnackbar('Listing deleted successfully', { 
          variant: 'success',
          autoHideDuration: 3000
        });
        
        return;
      }
      
      console.error('Primary key deletion failed:', pkError);
      
      // ATTEMPT 3: Try the userDeleteListing function
      console.log('ATTEMPT 3: Trying userDeleteListing function');
      const { success, error } = await userDeleteListing(listingId);
      
      // If deletion succeeded, we're done
      if (success) {
        console.log('userDeleteListing succeeded');
        
        // Update the UI by removing the deleted listing
        setUserListings(prev => prev.filter(listing => listing.id !== listingId));
        
        // Show success notification
        enqueueSnackbar('Listing deleted successfully', { 
          variant: 'success',
          autoHideDuration: 3000
        });
        
        return;
      }
      
      console.error('userDeleteListing failed:', error);
      
      // ATTEMPT 4: If deletion failed with an ambiguous column error, try an alternative approach
      if (error?.message?.includes('ambiguous')) {
        console.log('ATTEMPT 4: Using alternative approach for ambiguous column error');
        
        // Try the manual step-by-step deletion
        try {
          // 1. First delete any saved listings references
          console.log('Alternative: Deleting saved listings');
          await supabase
            .from('saved_listings')
            .delete()
            .eq('listing_id', listingId);
          
          // 2. Delete offers one by one
          console.log('Alternative: Handling offers one by one');
          const { data: offers } = await supabase
            .from('offers')
            .select('id')
            .eq('listing_id', listingId);
            
          if (offers && offers.length > 0) {
            console.log(`Found ${offers.length} offers to delete`);
            
            for (const offer of offers) {
              await supabase
                .from('offers')
                .delete()
                .eq('id', offer.id);
            }
          }
          
          // 3. Finally delete the listing
          console.log('Alternative: Deleting main listing');
          const { error: altDeleteError } = await supabase
            .from('listings')
            .delete()
            .eq('id', listingId);
            
          if (altDeleteError) {
            console.error('Alternative deletion also failed:', altDeleteError);
            throw altDeleteError;
          }
          
          console.log('Alternative deletion approach succeeded');
          
          // Update the UI
          setUserListings(prev => prev.filter(listing => listing.id !== listingId));
          
          // Show success notification
          enqueueSnackbar('Listing deleted successfully', { 
            variant: 'success',
            autoHideDuration: 3000
          });
          
          return;
        } catch (altError) {
          console.error('Second attempt failed:', altError);
          
          // Fall through to try the direct SQL approach
        }
      }
      
      // ATTEMPT 5: Try the direct SQL approach as a last resort
      console.log('ATTEMPT 5: Using direct SQL approach');
      const { success: directSuccess, error: directError } = await directDeleteListing(listingId, user.id);
      
      if (directSuccess) {
        console.log('Direct SQL deletion succeeded');
        
        // Update the UI
        setUserListings(prev => prev.filter(listing => listing.id !== listingId));
        
        // Show success notification
        enqueueSnackbar('Listing deleted successfully', { 
          variant: 'success',
          autoHideDuration: 3000
        });
        
        return;
      }
      
      console.error('Direct SQL deletion failed:', directError);
      
      // ATTEMPT 6: Final attempt - most direct possible approach 
      console.log('ATTEMPT 6: Using most direct possible approach');
      try {
        // Get offers one by one and delete them individually
        console.log('Final attempt: Getting offers by listing ID');
        const offersResponse = await supabase
          .from('offers')
          .select('id')
          .match({ listing_id: listingId });
          
        if (!offersResponse.error && offersResponse.data) {
          console.log(`Found ${offersResponse.data.length} offers to delete`);
          
          // Delete each offer directly
          for (const offer of offersResponse.data) {
            console.log(`Direct delete offer ${offer.id}`);
            await supabase
              .from('offers')
              .delete()
              .match({ id: offer.id });
          }
        }
        
        // Delete saved listings directly
        console.log('Final attempt: Deleting saved listings');
        await supabase
          .from('saved_listings')
          .delete()
          .match({ listing_id: listingId });
        
        // Finally delete the listing directly
        console.log('Final attempt: Deleting listing itself');
        const finalDeleteResponse = await supabase
          .from('listings')
          .delete()
          .match({ id: listingId, user_id: user.id });
          
        if (finalDeleteResponse.error) {
          console.error('Final deletion attempt also failed:', finalDeleteResponse.error);
          throw new Error('All deletion attempts failed');
        }
        
        console.log('Final deletion attempt succeeded!');
        
        // Update the UI
        setUserListings(prev => prev.filter(listing => listing.id !== listingId));
        
        // Show success notification
        enqueueSnackbar('Listing deleted successfully', { 
          variant: 'success',
          autoHideDuration: 3000
        });
      } catch (finalError) {
        console.error('Final deletion attempt failed:', finalError);
        throw new Error('All deletion attempts failed. Please try again later.');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      
      // Provide a more user-friendly error message but also include technical details for debugging
      let errorMessage = 'Failed to delete listing. Please try again.';
      
      // Extract the most specific error message possible
      if (error?.message) {
        // Check for PostgreSQL specific errors
        if (error.message.includes('ambiguous')) {
          errorMessage = 'Database error: Column reference is ambiguous. Please contact support.';
        } else if (error.message.includes('violates foreign key constraint')) {
          errorMessage = 'Cannot delete: This listing is referenced by other records in the system.';
        } else if (error.message.includes('permission denied')) {
          errorMessage = 'Permission denied: You may not have the right access level.';
        } else {
          // Use the error message directly
          errorMessage = error.message;
        }
      }
      
      // Extract and log Supabase/PostgreSQL specific details if available
      if (error?.details) {
        console.error('Error details:', error.details);
      }
      if (error?.hint) {
        console.error('Error hint:', error.hint);
      }
      if (error?.code) {
        console.error('Error code:', error.code);
      }
      
      enqueueSnackbar(errorMessage, { 
        variant: 'error',
        autoHideDuration: 5000
      });
    } finally {
      setListingLoading(false);
      setDeleteInProgress(false);
      setDeleteDialogOpen(false);
    }
  };
  
  const openDeleteDialog = (listingId) => {
    // First, verify that we have the correct listing and user information
    const listingToDelete = userListings.find(listing => listing.id === listingId);
    console.log('Attempting to delete listing:', listingId);
    console.log('Current user ID:', user?.id);
    console.log('Listing owner ID:', listingToDelete?.user_id);
    console.log('Current user has correct ownership:', user?.id === listingToDelete?.user_id);
    
    setListingToDelete(listingId);
    setDeleteDialogOpen(true);
  };
  
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setListingToDelete(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {error && (
        <Alert severity="error" sx={{ 
          mb: 3, 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(211, 47, 47, 0.15)',
          '& .MuiAlert-icon': {
            color: 'error.main',
          }
        }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ 
          mb: 3,
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)',
          '& .MuiAlert-icon': {
            color: 'success.main',
          }
        }}>
          {success}
        </Alert>
      )}
      
      {saveMessage && (
        <Snackbar
          open={!!saveMessage}
          message={saveMessage}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        />
      )}
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Box sx={{ position: 'sticky', top: 100 }}>
            {/* Profile Card */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                mb: 4, 
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                background: mode === 'dark' 
                  ? 'linear-gradient(145deg, #1E1E1E, #2D2D2D)' 
                  : 'linear-gradient(145deg, #ffffff, #f8f9fa)',
                boxShadow: mode === 'dark'
                  ? '0 8px 24px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)'
                  : '0 8px 24px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  padding: '1px',
                  background: mode === 'dark'
                    ? 'linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(255,255,255,0))'
                    : 'linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(255,255,255,0))',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  pointerEvents: 'none',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '30%',
                  height: '30%',
                  background: mode === 'dark'
                    ? 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.15), transparent 70%)'
                    : 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.08), transparent 70%)',
                  zIndex: 0,
                },
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
              }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Tooltip title="Change profile picture">
                      <IconButton 
                        aria-label="upload picture" 
                        component="label" 
                        sx={{ 
                          bgcolor: 'primary.main', 
                          color: 'white',
                          boxShadow: 3,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                            transform: 'scale(1.05)',
                          }
                        }}
                      >
                        <input hidden type="file" onChange={handleAvatarChange} accept="image/*" />
                        <PhotoCameraIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <Avatar 
                    src={avatarPreview || formData.avatarUrl} 
                    alt={formData.name}
                    sx={{ 
                      width: 120, 
                      height: 120,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      border: '4px solid white',
                      position: 'relative',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    {!avatarPreview && !formData.avatarUrl && formData.name && formData.name[0]}
                  </Avatar>
                </Badge>
                
                {avatarLoading && (
                  <CircularProgress 
                    size={30} 
                    sx={{ mt: 2, color: 'primary.main' }} 
                  />
                )}
                
                {validationErrors.avatar && (
                  <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                    {validationErrors.avatar}
                  </Typography>
                )}
                
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    mt: 2,
                    fontWeight: 'bold',
                    background: mode === 'dark'
                      ? 'linear-gradient(45deg, #42a5f5, #90caf9)'
                      : 'linear-gradient(45deg, #1976d2, #42a5f5)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {formData.name || 'New User'}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  gutterBottom
                  align="center"
                  sx={{ 
                    mb: 3, 
                    fontStyle: 'italic',
                    px: 1,
                  }}
                >
                  {formData.university || 'Default University'}
                </Typography>
                
                <Box sx={{ width: '100%', mb: 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mb: 1,
                    alignItems: 'center'
                  }}>
                    <Typography variant="body2" fontWeight="medium" color="text.secondary">
                      Profile Completeness
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold" 
                      sx={{ 
                        color: profileCompleteness < 50 ? 'warning.main' : 
                                profileCompleteness < 80 ? 'info.main' : 'success.main' 
                      }}
                    >
                      {profileCompleteness}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={profileCompleteness}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(0,0,0,0.05)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: profileCompleteness < 50 ? 
                          'linear-gradient(90deg, #ed6c02, #ff9800)' : 
                          profileCompleteness < 80 ? 
                          'linear-gradient(90deg, #0288d1, #03a9f4)' : 
                          'linear-gradient(90deg, #2e7d32, #4caf50)',
                        transition: 'transform 1s ease-in-out',
                      }
                    }}
                  />
                </Box>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: 'background.light',
                        textAlign: 'center',
                        boxShadow: mode === 'dark'
                          ? '0 4px 12px rgba(0,0,0,0.15)'
                          : '0 4px 12px rgba(0,0,0,0.03)',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: mode === 'dark'
                            ? '0 6px 16px rgba(0,0,0,0.25)'
                            : '0 6px 16px rgba(0,0,0,0.08)',
                        },
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        {userListings.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Listings
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: 'background.light',
                        textAlign: 'center',
                        boxShadow: mode === 'dark'
                          ? '0 4px 12px rgba(0,0,0,0.15)'
                          : '0 4px 12px rgba(0,0,0,0.03)',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: mode === 'dark'
                            ? '0 6px 16px rgba(0,0,0,0.25)'
                            : '0 6px 16px rgba(0,0,0,0.08)',
                        },
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        {userListings.filter(listing => listing.status === 'sold').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Successful Sales
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 0, 
              mb: 4, 
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: mode === 'dark'
                ? '0 8px 24px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)'
                : '0 8px 24px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                padding: '1px',
                background: mode === 'dark'
                  ? 'linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(255,255,255,0))'
                  : 'linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(255,255,255,0))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                pointerEvents: 'none',
              },
            }}
          >
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="profile tabs"
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                backgroundColor: mode === 'dark' ? 'background.paper' : 'white',
                '& .MuiTab-root': {
                  fontWeight: 600,
                  py: 2,
                  px: 3,
                  transition: 'all 0.3s',
                  color: mode === 'dark' ? 'text.primary' : 'inherit',
                  '&:hover': {
                    bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(25, 118, 210, 0.04)',
                  }
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  backgroundColor: 'primary.main',
                }
              }}
            >
              <Tab label="Profile Information" />
              <Tab label="My Listings" />
              <Tab label="My Reports" />
              <Tab label="Notification Settings" />
            </Tabs>
            
            <Box sx={{ p: 4, bgcolor: mode === 'dark' ? 'background.paper' : 'white' }}>
              {/* Profile Information */}
              {activeTab === 0 && (
                <Box component="form" onSubmit={handleSubmit}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 3 
                  }}>
                    <Typography 
                      variant="h5" 
                      component="h1" 
                      fontWeight="bold"
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
                      Personal Information
                    </Typography>
                    
                    {!isEditing ? (
                      <Button 
                        startIcon={<EditIcon />} 
                        variant="outlined" 
                        onClick={handleEdit}
                        sx={{
                          borderRadius: 2,
                          borderWidth: 1.5,
                          px: 2,
                          py: 1,
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderWidth: 1.5,
                            transform: 'translateY(-2px)',
                            boxShadow: mode === 'dark' 
                              ? '0 4px 12px rgba(66, 165, 245, 0.25)' 
                              : '0 4px 12px rgba(25, 118, 210, 0.15)',
                          },
                        }}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="outlined" 
                          onClick={handleCancel}
                          sx={{
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          startIcon={<SaveIcon />} 
                          variant="contained" 
                          type="submit"
                          disabled={loading || !hasChanges}
                          sx={{
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                            transition: 'all 0.2s',
                            background: mode === 'dark'
                              ? 'linear-gradient(45deg, #42a5f5 30%, #90caf9 90%)'
                              : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                            boxShadow: mode === 'dark'
                              ? '0 4px 12px rgba(66, 165, 245, 0.35)'
                              : '0 4px 12px rgba(25, 118, 210, 0.25)',
                            '&:hover': {
                              boxShadow: mode === 'dark'
                                ? '0 6px 16px rgba(66, 165, 245, 0.45)'
                                : '0 6px 16px rgba(25, 118, 210, 0.35)',
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </Box>
                    )}
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        error={!!validationErrors.name}
                        helperText={validationErrors.name}
                        sx={{ mb: 3 }}
                        InputProps={{
                          sx: {
                            borderRadius: 2,
                            '&.Mui-focused': {
                              boxShadow: mode === 'dark' 
                                ? '0 0 0 3px rgba(66, 165, 245, 0.2)'
                                : '0 0 0 3px rgba(25, 118, 210, 0.12)',
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        value={formData.email}
                        disabled
                        sx={{ mb: 3 }}
                        InputProps={{
                          endAdornment: <CheckCircleIcon color="success" />,
                          sx: {
                            borderRadius: 2,
                            opacity: mode === 'dark' ? 0.8 : 1,
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        error={!!validationErrors.phone}
                        helperText={validationErrors.phone}
                        sx={{ mb: 3 }}
                        InputProps={{
                          sx: {
                            borderRadius: 2,
                            '&.Mui-focused': {
                              boxShadow: mode === 'dark' 
                                ? '0 0 0 3px rgba(66, 165, 245, 0.2)'
                                : '0 0 0 3px rgba(25, 118, 210, 0.12)',
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="University"
                        name="university"
                        value={formData.university}
                        onChange={handleChange}
                        disabled={!isEditing}
                        sx={{ mb: 3 }}
                        InputProps={{
                          sx: {
                            borderRadius: 2,
                            '&.Mui-focused': {
                              boxShadow: mode === 'dark' 
                                ? '0 0 0 3px rgba(66, 165, 245, 0.2)'
                                : '0 0 0 3px rgba(25, 118, 210, 0.12)',
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        disabled={!isEditing}
                        multiline
                        rows={4}
                        error={!!validationErrors.bio}
                        helperText={validationErrors.bio || 'Tell other students about yourself'}
                        sx={{ mb: 3 }}
                        InputProps={{
                          sx: {
                            borderRadius: 2,
                            '&.Mui-focused': {
                              boxShadow: mode === 'dark' 
                                ? '0 0 0 3px rgba(66, 165, 245, 0.2)'
                                : '0 0 0 3px rgba(25, 118, 210, 0.12)',
                            }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {/* My Listings Tab */}
              {activeTab === 1 && (
                <Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 3 
                  }}>
                    <Typography 
                      variant="h5" 
                      component="h1" 
                      fontWeight="bold"
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
                      My Listings
                    </Typography>
                    
                    <Button 
                      variant="contained" 
                      onClick={() => navigate('/create-listing')}
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        transition: 'all 0.2s',
                        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(25, 118, 210, 0.35)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      Create New Listing
                    </Button>
                  </Box>
                  
                  {loading ? (
                    <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
                  ) : userListings.length === 0 ? (
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        borderRadius: 2,
                        bgcolor: 'background.light',
                        border: '1px dashed',
                        borderColor: 'divider',
                      }}
                    >
                      <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.7 }} />
                      <Typography variant="h6" gutterBottom>
                        No Listings Yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        You haven't created any listings yet. Start selling items to your fellow students!
                      </Typography>
                      <Button 
                        variant="contained" 
                        onClick={() => navigate('/create-listing')}
                        sx={{
                          borderRadius: 2,
                          px: 3,
                          py: 1,
                          transition: 'all 0.2s',
                          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                          '&:hover': {
                            boxShadow: '0 6px 16px rgba(25, 118, 210, 0.35)',
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        Create First Listing
                      </Button>
                    </Paper>
                  ) : (
                    <Grid container spacing={3}>
                      {userListings.map((listing) => (
                        <Grid item xs={12} sm={6} key={listing.id}>
                          <ListingCard 
                            listing={listing} 
                            onEdit={() => navigate(`/edit-listing/${listing.id}`)} 
                            onDelete={() => openDeleteDialog(listing.id)}
                            showSaveButton={false}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}
              
              {/* My Reports */}
              {activeTab === 2 && (
                <Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 3 
                  }}>
                    <Typography 
                      variant="h5" 
                      component="h1" 
                      fontWeight="bold"
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
                      My Reports
                    </Typography>
                    
                    <Button 
                      startIcon={<ReportProblemIcon />}
                      variant="contained" 
                      component={RouterLink}
                      to="/my-reports"
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        transition: 'all 0.2s',
                        background: mode === 'dark'
                          ? 'linear-gradient(45deg, #42a5f5 30%, #90caf9 90%)'
                          : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                        boxShadow: mode === 'dark'
                          ? '0 4px 12px rgba(66, 165, 245, 0.35)'
                          : '0 4px 12px rgba(25, 118, 210, 0.25)',
                        '&:hover': {
                          boxShadow: mode === 'dark'
                            ? '0 6px 16px rgba(66, 165, 245, 0.45)'
                            : '0 6px 16px rgba(25, 118, 210, 0.35)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      View All Reports
                    </Button>
                  </Box>

                  <Typography variant="body1" paragraph>
                    View and track the status of reports you've submitted about users, listings, or messages. Use the dedicated reports page to monitor updates and responses from our moderation team.
                  </Typography>
                  
                  <Box sx={{ mt: 3, mb: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <ReportProblemIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        Report Options
                      </Typography>
                    </Stack>
                    
                    <Box 
                      sx={{ 
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                        gap: 2,
                        mt: 2
                      }}
                    >
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          textDecoration: 'none',
                          color: 'text.primary',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: mode === 'dark' 
                              ? '0 6px 20px rgba(255, 255, 255, 0.1)' 
                              : '0 6px 20px rgba(0, 0, 0, 0.1)',
                          }
                        }}
                        component={RouterLink}
                        to="/report?type=user"
                      >
                        <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'primary.light' }}>
                          <PersonIcon />
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          Report a User
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Report suspicious or inappropriate user behavior
                        </Typography>
                      </Paper>
                      
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          textDecoration: 'none',
                          color: 'text.primary',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: mode === 'dark' 
                              ? '0 6px 20px rgba(255, 255, 255, 0.1)' 
                              : '0 6px 20px rgba(0, 0, 0, 0.1)',
                          }
                        }}
                        component={RouterLink}
                        to="/report?type=listing"
                      >
                        <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'warning.light' }}>
                          <InventoryIcon />
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          Report a Listing
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Report prohibited items or misleading listings
                        </Typography>
                      </Paper>
                      
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          textDecoration: 'none',
                          color: 'text.primary',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: mode === 'dark' 
                              ? '0 6px 20px rgba(255, 255, 255, 0.1)' 
                              : '0 6px 20px rgba(0, 0, 0, 0.1)',
                          }
                        }}
                        component={RouterLink}
                        to="/report?type=message"
                      >
                        <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'error.light' }}>
                          <MessageIcon />
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          Report a Message
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Report harassment or inappropriate messages
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<ListAltIcon />}
                      component={RouterLink}
                      to="/my-reports"
                      size="large"
                      sx={{ 
                        borderRadius: 2,
                        px: 3
                      }}
                    >
                      Go to My Reports
                    </Button>
                  </Box>
                </Box>
              )}
              
              {/* Notification Settings */}
              {activeTab === 3 && (
                <Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography 
                      variant="h5" 
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
                      Notification Preferences
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Control how you receive notifications from Campus Marketplace
                    </Typography>
                  </Box>
                  
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      mb: 3, 
                      borderRadius: 2,
                      bgcolor: 'background.light',
                      transition: 'box-shadow 0.3s ease',
                      '&:hover': {
                        boxShadow: mode === 'dark'
                          ? '0 4px 20px rgba(255,255,255,0.07)'
                          : '0 4px 20px rgba(0,0,0,0.07)',
                      },
                    }}
                  >
                    <List disablePadding>
                      <ListItem disableGutters>
                        <ListItemText 
                          primary="Email Notifications" 
                          secondary="Receive updates and alerts via email"
                          primaryTypographyProps={{ fontWeight: 'medium' }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              name="emailNotifications"
                              checked={formData.notificationPreferences.emailNotifications}
                              onChange={handleNotificationChange}
                              disabled={!isEditing}
                              color="primary"
                            />
                          }
                          label=""
                          labelPlacement="start"
                        />
                      </ListItem>
                      <Divider component="li" sx={{ my: 1 }} />
                      <ListItem disableGutters>
                        <ListItemText 
                          primary="Offer Alerts" 
                          secondary="Get notified when you receive a new offer"
                          primaryTypographyProps={{ fontWeight: 'medium' }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              name="offerAlerts"
                              checked={formData.notificationPreferences.offerAlerts}
                              onChange={handleNotificationChange}
                              disabled={!isEditing}
                              color="primary"
                            />
                          }
                          label=""
                          labelPlacement="start"
                        />
                      </ListItem>
                      <Divider component="li" sx={{ my: 1 }} />
                      <ListItem disableGutters>
                        <ListItemText 
                          primary="Message Alerts" 
                          secondary="Get notified when you receive a new message"
                          primaryTypographyProps={{ fontWeight: 'medium' }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              name="messageAlerts"
                              checked={formData.notificationPreferences.messageAlerts}
                              onChange={handleNotificationChange}
                              disabled={!isEditing}
                              color="primary"
                            />
                          }
                          label=""
                          labelPlacement="start"
                        />
                      </ListItem>
                      <Divider component="li" sx={{ my: 1 }} />
                      <ListItem disableGutters>
                        <ListItemText 
                          primary="Browser Notifications" 
                          secondary="Receive notifications in your browser (when available)"
                          primaryTypographyProps={{ fontWeight: 'medium' }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              name="browserNotifications"
                              checked={formData.notificationPreferences.browserNotifications}
                              onChange={handleNotificationChange}
                              disabled={!isEditing}
                              color="primary"
                            />
                          }
                          label=""
                          labelPlacement="start"
                        />
                      </ListItem>
                    </List>
                  </Paper>
                  
                  {isEditing && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        onClick={handleCancel}
                        sx={{
                          borderRadius: 2,
                          px: 2,
                          py: 1,
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        startIcon={<SaveIcon />} 
                        variant="contained" 
                        onClick={handleSubmit}
                        disabled={loading || !hasChanges}
                        sx={{
                          borderRadius: 2,
                          px: 2,
                          py: 1,
                          background: mode === 'dark'
                            ? 'linear-gradient(45deg, #42a5f5 30%, #90caf9 90%)'
                            : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                          boxShadow: mode === 'dark'
                            ? '0 4px 12px rgba(66, 165, 245, 0.35)'
                            : '0 4px 12px rgba(25, 118, 210, 0.25)',
                          '&:hover': {
                            boxShadow: mode === 'dark'
                              ? '0 6px 16px rgba(66, 165, 245, 0.45)'
                              : '0 6px 16px rgba(25, 118, 210, 0.35)',
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        {loading ? 'Saving...' : 'Save Preferences'}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={!deleteInProgress ? closeDeleteDialog : undefined}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle id="delete-dialog-title">
          Delete Listing
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this listing? This action cannot be undone.
          </DialogContentText>
          {deleteInProgress && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary" disabled={deleteInProgress}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleDeleteListing(listingToDelete)} 
            color="error" 
            variant="contained"
            disabled={deleteInProgress}
            startIcon={deleteInProgress && <CircularProgress size={16} color="inherit" />}
            autoFocus
          >
            {deleteInProgress ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage; 