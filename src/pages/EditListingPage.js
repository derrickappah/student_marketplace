import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Card,
  CardMedia,
  Tooltip,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  Chip,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { supabase, getListingById, requestListingPromotion } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useDropzone } from 'react-dropzone';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ListingPromotionOptions from '../components/ListingPromotionOptions';
import { deleteListingByPrimaryKey, deleteListingWithTriggersDisabled } from '../services/direct-sql';
import TitleIcon from '@mui/icons-material/Title';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ImageIcon from '@mui/icons-material/Image';
import CampaignIcon from '@mui/icons-material/Campaign';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import { userDeleteListing } from '../services/supabase';

const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'poor'];

const EditListingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [promotionOptions, setPromotionOptions] = useState({ featured: false, priority: false });
  const [originalPromotionStatus, setOriginalPromotionStatus] = useState('none');
  const [promotionStatus, setPromotionStatus] = useState('none');
  const [promotionExpiresAt, setPromotionExpiresAt] = useState(null);
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [listing, setListing] = useState(null);

  const methods = useForm();
  const { control, handleSubmit, formState: { errors }, reset, trigger, watch } = methods;
  
  // Watch all form fields to track completion
  const formValues = watch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch listing and categories in parallel
        const [listingResponse, categoriesResponse] = await Promise.all([
          supabase
            .from('listings')
            .select(`
              *,
              category:category_id (id, name)
            `)
            .eq('id', id)
            .single(),
          supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true }),
        ]);

        if (listingResponse.error) throw listingResponse.error;
        if (categoriesResponse.error) throw categoriesResponse.error;

        const listing = listingResponse.data;
        
        // Store the listing in state
        setListing(listing);
        
        // Check if user owns the listing
        if (listing.user_id !== user?.id) {
          navigate('/');
          return;
        }

        // Set form data
        reset({
          title: listing.title,
          description: listing.description,
          price: listing.price,
          category_id: listing.category_id,
          condition: listing.condition,
        });

        // Set existing images from the listing
        const existingImagesArray = listing.images || [];
        setExistingImages(existingImagesArray);
        
        // Create preview objects for existing images
        const previewObjects = existingImagesArray.map(url => ({
          url,
          isExisting: true
        }));
        setImagePreviewUrls(previewObjects);
        
        // Set promotion options
        setPromotionOptions({
          featured: listing.is_featured || false,
          priority: listing.is_priority || false
        });
        
        // Store original promotion status for messaging
        setOriginalPromotionStatus(listing.promotion_status || 'none');
        setPromotionStatus(listing.promotion_status || 'none');
        setPromotionExpiresAt(listing.promotion_expires_at);

        setCategories(categoriesResponse.data);
      } catch (err) {
        setError('Failed to load listing');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, reset, navigate]);

  const onDrop = useCallback((acceptedFiles) => {
    // Filter out invalid files
    const validFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== acceptedFiles.length) {
      setError('Some files were skipped. Only images are allowed.');
    }
    
    // Limit to a maximum of 10 images total (existing + new)
    const totalImagesCount = imagePreviewUrls.length + validFiles.length;
    if (totalImagesCount > 10) {
      setError('You can upload a maximum of 10 images per listing.');
      const allowedNewFiles = validFiles.slice(0, 10 - imagePreviewUrls.length);
      setSelectedImages(prev => [...prev, ...allowedNewFiles]);
      
      // Create preview URLs for allowed files
      const newPreviewUrls = allowedNewFiles.map(file => ({
        file,
        url: URL.createObjectURL(file),
        isExisting: false
      }));
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    } else {
      setSelectedImages(prev => [...prev, ...validFiles]);
      
      // Create preview URLs
      const newPreviewUrls = validFiles.map(file => ({
        file,
        url: URL.createObjectURL(file),
        isExisting: false
      }));
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  }, [imagePreviewUrls.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 10
  });

  const handleRemoveImage = (index) => {
    const imageToRemove = imagePreviewUrls[index];
    
    // Remove the image preview
    setImagePreviewUrls(prev => {
      const newPreviews = [...prev];
      
      // If it's a new image, revoke the object URL to prevent memory leaks
      if (!imageToRemove.isExisting) {
        URL.revokeObjectURL(imageToRemove.url);
      } else {
        // If removing an existing image, update the existingImages array
        const existingImageUrl = imageToRemove.url;
        setExistingImages(prev => prev.filter(url => url !== existingImageUrl));
      }
      
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    
    // If it's a new image, remove it from the selectedImages array
    if (!imageToRemove.isExisting) {
      // Find the index in the selectedImages array (may be different from the preview index)
      const fileUrl = imageToRemove.url;
      const selectedIndex = selectedImages.findIndex(
        (file) => URL.createObjectURL(file) === fileUrl
      );
      
      if (selectedIndex !== -1) {
        setSelectedImages(prev => {
          const newSelectedImages = [...prev];
          newSelectedImages.splice(selectedIndex, 1);
          return newSelectedImages;
        });
      }
    }
  };

  const handlePromotionChange = (newOptions) => {
    setPromotionOptions(newOptions);
  };

  const handleRequestPromotion = () => {
    setPromotionDialogOpen(true);
  };

  const handleConfirmPromotion = async () => {
    try {
      console.log('Starting promotion request for listing:', id);
      
      // Use the new function that handles this properly
      const { success, data, error } = await requestListingPromotion(id, promotionOptions);
      
      if (!success) {
        throw new Error(error);
      }
      
      console.log('Promotion request successful:', data);
      
      // Update local state
      setPromotionStatus('pending');
      setPromotionDialogOpen(false);
      
      // Show success message
      setError('Promotion request submitted successfully. You will be notified once it\'s approved.');
    } catch (err) {
      console.error('Error requesting promotion:', err);
      setError('Failed to request promotion: ' + (err.message || 'Unknown error'));
      setPromotionDialogOpen(false);
    }
  };

  const handleCancelPromotion = () => {
    setPromotionDialogOpen(false);
  };

  const handleNext = async () => {
    // Validate current step before proceeding
    const currentStepIsValid = await validateCurrentStep();
    if (currentStepIsValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateCurrentStep = async () => {
    let result = false;
    
    switch (activeStep) {
      case 0: // Basic Info
        result = await trigger(['title', 'description']);
        break;
      case 1: // Price and Category
        result = await trigger(['price', 'category_id', 'condition']);
        break;
      case 2: // Images
        if (imagePreviewUrls.length === 0) {
          setError('Please select at least one image');
          result = false;
        } else {
          setError('');
          result = true;
        }
        break;
      case 3: // Promotion
        result = true; // Promotion is optional
        break;
      default:
        result = true;
    }
    
    return result;
  };

  // Determine if each step is completed for the stepper display
  const isStepComplete = (step) => {
    switch (step) {
      case 0:
        return !!formValues.title && !!formValues.description && !errors.title && !errors.description;
      case 1:
        return !!formValues.price && !!formValues.category_id && !!formValues.condition && 
               !errors.price && !errors.category_id && !errors.condition;
      case 2:
        return imagePreviewUrls.length > 0;
      case 3:
        return true; // Promotion is optional
      default:
        return false;
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      
      // Create new FormData
      const updates = {
        ...data,
        updated_at: new Date()
      };
      
      // Handle promotion changes
      if (originalPromotionStatus === 'approved') {
        // If already approved and changes were made, reset to pending
        if (promotionOptions.featured !== listing.is_featured || 
            promotionOptions.priority !== listing.is_priority) {
          updates.is_featured = promotionOptions.featured;
          updates.is_priority = promotionOptions.priority;
          updates.promotion_status = 'pending';
        }
      } else if (originalPromotionStatus === 'none' && 
                (promotionOptions.featured || promotionOptions.priority)) {
        // New promotion request
        updates.is_featured = promotionOptions.featured;
        updates.is_priority = promotionOptions.priority;
        updates.promotion_status = 'pending';
      } else if (originalPromotionStatus === 'rejected' && 
                (promotionOptions.featured || promotionOptions.priority)) {
        // Resubmitting after rejection
        updates.is_featured = promotionOptions.featured;
        updates.is_priority = promotionOptions.priority;
        updates.promotion_status = 'pending';
      } else {
        // Keep existing promotion settings
        updates.is_featured = promotionOptions.featured;
        updates.is_priority = promotionOptions.priority;
      }
      
      // Upload new images
      if (selectedImages.length > 0) {
        const totalImages = selectedImages.length;
        let uploadedCount = 0;
        
        const newImageUrls = await Promise.all(
          selectedImages.map(async (image) => {
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const { error: uploadError } = await supabase.storage
              .from('listings')
              .upload(fileName, image);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('listings')
              .getPublicUrl(fileName);
            
            // Update progress
            uploadedCount++;
            setUploadProgress((uploadedCount / totalImages) * 100);

            return publicUrl;
          })
        );

        updates.images = [...existingImages, ...newImageUrls];
      }
      
      // Update the listing
      const { error: updateError } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', id);
        
      if (updateError) throw updateError;
      
      setError('Listing updated successfully');
      navigate(`/listings/${id}`);
    } catch (err) {
      console.error('Error updating listing:', err);
      setError('Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteDialogOpen(false);
      setLoading(true);
      
      console.log('Attempting to delete listing:', id);
      
      // Use userDeleteListing function to delete the listing
      const { success, error } = await userDeleteListing(id);
      
      if (success) {
        console.log('Listing deleted successfully');
        navigate('/profile');
        return;
      }
      
      // If the deletion failed, show an appropriate error message
      console.error('Error deleting listing:', error);
      
      let errorMessage = 'Failed to delete listing';
      
      // Check for specific PostgreSQL errors
      if (error?.message) {
        if (error.message.includes('ambiguous')) {
          errorMessage = 'Database error: Column reference ambiguity detected. Please try again or contact support.';
        } else if (error.message.includes('violates foreign key constraint')) {
          errorMessage = 'Cannot delete listing because it is referenced by other records.';
        } else if (error.message.includes('permission denied')) {
          errorMessage = 'Permission denied. You may not have rights to delete this listing.';
        }
        
        // Log additional PostgreSQL error details if available
        if (error.details) console.error('Error details:', error.details);
        if (error.hint) console.error('Error hint:', error.hint);
        if (error.code) console.error('Error code:', error.code);
      }
      
      setError(errorMessage);
    } catch (err) {
      console.error('Error in handleDelete:', err);
      setError('An unexpected error occurred while deleting the listing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Steps for the stepper
  const steps = [
    {
      label: 'Basic Information',
      icon: <TitleIcon />,
      content: (
        <Box sx={{ pt: 2, pb: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                rules={{ required: 'Title is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Title"
                    fullWidth
                    required
                    error={!!errors.title}
                    helperText={errors.title?.message}
                    InputProps={{
                      startAdornment: <TitleIcon color="action" sx={{ mr: 1, opacity: 0.6 }} />,
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                rules={{ required: 'Description is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    required
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    InputProps={{
                      startAdornment: <DescriptionIcon color="action" sx={{ mr: 1, mt: 1, opacity: 0.6 }} />,
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      ),
    },
    {
      label: 'Price & Details',
      icon: <LocalOfferIcon />,
      content: (
        <Box sx={{ pt: 2, pb: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="price"
                control={control}
                rules={{
                  required: 'Price is required',
                  pattern: {
                    value: /^\d+(\.\d{1,2})?$/,
                    message: 'Please enter a valid price (e.g., 10.99)',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Price"
                    fullWidth
                    required
                    type="number"
                    error={!!errors.price}
                    helperText={errors.price?.message}
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '8px' }}>GHC</span>,
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                error={!!errors.category_id}
              >
                <InputLabel>Category</InputLabel>
                <Controller
                  name="category_id"
                  control={control}
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Category"
                      startAdornment={<CategoryIcon color="action" sx={{ mr: 1, opacity: 0.6 }} />}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                error={!!errors.condition}
              >
                <InputLabel>Condition</InputLabel>
                <Controller
                  name="condition"
                  control={control}
                  rules={{ required: 'Condition is required' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Condition"
                      startAdornment={<SettingsIcon color="action" sx={{ mr: 1, opacity: 0.6 }} />}
                    >
                      {CONDITIONS.map((condition) => (
                        <MenuItem key={condition} value={condition}>
                          {condition.charAt(0).toUpperCase() + condition.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      ),
    },
    {
      label: 'Images',
      icon: <ImageIcon />,
      content: (
        <Box sx={{ pt: 2, pb: 1 }}>
          {/* Image Preview Gallery */}
          {imagePreviewUrls.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">
                  {imagePreviewUrls.length} of 10 images
                </Typography>
                <Chip 
                  label={`${imagePreviewUrls.length}/10`} 
                  color="primary" 
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Grid container spacing={1}>
                {imagePreviewUrls.map((previewObj, index) => (
                  <Grid item xs={4} sm={3} key={index}>
                    <Card sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="100"
                        image={previewObj.url}
                        alt={`Image ${index + 1}`}
                        sx={{ objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(255, 0, 0, 0.7)',
                          },
                        }}
                        onClick={() => handleRemoveImage(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      {previewObj.isExisting && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            left: 4,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: 1
                          }}
                        >
                          Existing
                        </Box>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          
          {/* Add More Images */}
          {imagePreviewUrls.length < 10 && (
            <Box 
              sx={{ 
                p: 2, 
                border: '1px dashed',
                borderColor: theme.palette.primary.main,
                borderRadius: 2,
                bgcolor: 'rgba(25, 118, 210, 0.04)',
                mt: imagePreviewUrls.length > 0 ? 2 : 0,
                mb: 2
              }}
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="body1" align="center">
                  {isDragActive ? 'Drop files here' : 'Drag & drop images here, or click to select files'}
                </Typography>
                <Typography variant="caption" color="textSecondary" align="center">
                  {`Add up to ${10 - imagePreviewUrls.length} more images`}
                </Typography>
              </Box>
            </Box>
          )}
          
          {error && error.includes('image') && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      ),
    },
    {
      label: 'Promotion',
      icon: <CampaignIcon />,
      content: (
        <Box sx={{ pt: 2, pb: 1 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Enhance Your Listing
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Make your listing stand out to potential buyers with these promotion options.
            </Typography>
            
            {originalPromotionStatus === 'approved' && (
              promotionOptions.featured !== listing?.is_featured || 
              promotionOptions.priority !== listing?.is_priority
            ) && (
              <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                Changes to promotion options will require re-approval.
              </Alert>
            )}
          </Box>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'rgba(0,0,0,0.02)', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <ListingPromotionOptions 
              promotionOptions={promotionOptions}
              onChange={handlePromotionChange}
              promotionStatus={promotionStatus}
              expiresAt={promotionExpiresAt}
              onRequestPromotion={handleRequestPromotion}
              isEditing={true}
            />
          </Box>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            bgcolor: theme.palette.primary.main, 
            p: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <EditIcon />
          <Typography variant="h6" component="h1">
            Edit Listing
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          {error && !error.includes('image') && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          )}

          <FormProvider {...methods}>
            <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
              <Stepper 
                activeStep={activeStep} 
                orientation="vertical"
                sx={{ 
                  '.MuiStepConnector-line': { minHeight: 20 },
                  '.MuiStepLabel-root': { py: 1 }
                }}
              >
                {steps.map((step, index) => (
                  <Step key={step.label} completed={isStepComplete(index)}>
                    <StepLabel 
                      StepIconProps={{
                        icon: step.icon,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1">{step.label}</Typography>
                        {isStepComplete(index) && index !== activeStep && (
                          <CheckCircleIcon color="success" fontSize="small" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    </StepLabel>
                    <StepContent>
                      {step.content}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Button
                          disabled={index === 0}
                          onClick={handleBack}
                          startIcon={<ArrowBackIcon />}
                        >
                          Back
                        </Button>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {index === steps.length - 1 ? (
                            <>
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit(onSubmit)}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                              >
                                {loading ? 'Saving...' : 'Save Changes'}
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                onClick={() => setDeleteDialogOpen(true)}
                              >
                                Delete
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="contained"
                              onClick={handleNext}
                              endIcon={<ArrowForwardIcon />}
                            >
                              Next
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>

              {/* Upload Progress */}
              {loading && uploadProgress > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Uploading: {Math.round(uploadProgress)}%
                  </Typography>
                  <Box 
                    sx={{ 
                      width: '100%', 
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      borderRadius: '4px',
                      height: 8,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      sx={{
                        width: `${uploadProgress}%`,
                        background: `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                        height: '100%',
                        transition: 'width 0.3s ease-in-out'
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </FormProvider>
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Listing</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this listing? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Promotion Dialog */}
      <Dialog
        open={promotionDialogOpen}
        onClose={handleCancelPromotion}
        aria-labelledby="promotion-dialog-title"
      >
        <DialogTitle id="promotion-dialog-title">
          Request Listing Promotion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are requesting the following promotion options:
          </Typography>
          <Box sx={{ ml: 2, mt: 1 }}>
            {promotionOptions.featured && (
              <Typography variant="body2" gutterBottom>
                • Featured Listing: Your listing will appear in the featured section on the homepage
              </Typography>
            )}
            {promotionOptions.priority && (
              <Typography variant="body2" gutterBottom>
                • Priority Listing: Your listing will appear at the top of search results
              </Typography>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Promotions are subject to review and approval by our team. Once approved, your listing will be promoted for 30 days.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelPromotion}>Cancel</Button>
          <Button onClick={handleConfirmPromotion} variant="contained" color="primary">
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EditListingPage; 