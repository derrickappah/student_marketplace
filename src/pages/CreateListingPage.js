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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
  IconButton,
  Card,
  CardMedia,
  Tooltip,
  useTheme,
  Divider,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { createListing, getCategories, supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useDropzone } from 'react-dropzone';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ListingPromotionOptions from '../components/ListingPromotionOptions';
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

const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'poor'];

const CreateListingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [promotionOptions, setPromotionOptions] = useState({
    featured: false,
    priority: false
  });
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const methods = useForm({
    defaultValues: {
      title: '',
      description: '',
      price: '',
      category_id: '',
      condition: '',
    },
  });

  const { control, handleSubmit, formState: { errors }, reset, trigger, watch } = methods;

  // Watch all form fields to track completion
  const formValues = watch();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      const getDebugInfo = async () => {
        try {
          const { data: session } = await supabase.auth.getSession();
          
          const { data } = await supabase
            .from('listings')
            .select('id')
            .limit(1);
            
          setDebugInfo({
            user: user,
            session: session,
            canQueryListings: data !== null,
          });
        } catch (err) {
          console.error('Debug info error:', err);
        }
      };
      
      getDebugInfo();
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error:', err);
      }
    };

    fetchCategories();
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    // Filter out invalid files
    const validFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== acceptedFiles.length) {
      setError('Some files were skipped. Only images are allowed.');
    }
    
    // Limit to a maximum of 10 images
    const totalFiles = [...selectedImages, ...validFiles];
    if (totalFiles.length > 10) {
      setError('You can upload a maximum of 10 images per listing.');
      const allowedNewFiles = validFiles.slice(0, 10 - selectedImages.length);
      setSelectedImages(prev => [...prev, ...allowedNewFiles]);
      
      // Create preview URLs for allowed files
      const newPreviewUrls = allowedNewFiles.map(file => ({
        file,
        url: URL.createObjectURL(file)
      }));
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    } else {
      setSelectedImages(prev => [...prev, ...validFiles]);
      
      // Create preview URLs
      const newPreviewUrls = validFiles.map(file => ({
        file,
        url: URL.createObjectURL(file)
      }));
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  }, [selectedImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 10
  });

  const handleRemoveImage = (index) => {
    // Remove the image preview
    setImagePreviewUrls(prev => {
      const newPreviews = [...prev];
      
      // Revoke the object URL to prevent memory leaks
      URL.revokeObjectURL(newPreviews[index].url);
      
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    
    // Remove the actual file from the selected images array
    setSelectedImages(prev => {
      const newSelectedImages = [...prev];
      newSelectedImages.splice(index, 1);
      return newSelectedImages;
    });
  };
  
  const handlePromotionChange = (newOptions) => {
    setPromotionOptions(newOptions);
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
        if (selectedImages.length === 0) {
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

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Validate price is numeric
      const numericPrice = parseFloat(data.price);
      if (isNaN(numericPrice)) {
        throw new Error('Invalid price format');
      }

      // Log the selected promotion options
      console.log('Creating listing with promotion options:', promotionOptions);

      // Call the createListing function to submit the form
      const { data: result, error: listingError } = await createListing({
        title: data.title,
        description: data.description,
        price: numericPrice,
        category_id: data.category_id,
        condition: data.condition,
        images: selectedImages,
        onProgressUpdate: (progress) => {
          setUploadProgress(progress);
        },
        promotionOptions
      });

      if (listingError) {
        throw new Error(listingError);
      }

      if (!result || !result.success) {
        throw new Error('Failed to create listing. Please try again.');
      }

      // Show success message with promotion information
      let successMessage = 'Listing created successfully!';
      if (promotionOptions.featured || promotionOptions.priority) {
        successMessage += ' Your promotion request has been submitted for approval.';
      }
      setSuccess(successMessage);
      
      // Reset form
      reset();
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setPromotionOptions({
        featured: false,
        priority: false
      });

      // Delay navigation slightly to allow user to see success message
      setTimeout(() => {
        // Navigate to the listing or user's listings page
        navigate('/listings');
      }, 1500);
    } catch (error) {
      console.error('Error creating listing:', error);
      setError(error.message || 'Failed to create listing. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
        return selectedImages.length > 0;
      case 3:
        return true; // Promotion is optional
      default:
        return false;
    }
  };

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
          <Box 
            sx={{ 
              p: 2, 
              border: '1px dashed',
              borderColor: theme.palette.primary.main,
              borderRadius: 2,
              bgcolor: 'rgba(25, 118, 210, 0.04)',
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
                (Maximum 10 images)
              </Typography>
            </Box>
          </Box>

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
                        alt={`Preview ${index}`}
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
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                          },
                        }}
                        onClick={() => handleRemoveImage(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          
          {error && (
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
              promotionStatus="none"
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
          <AddPhotoAlternateIcon />
          <Typography variant="h6" component="h1">
            Create Listing
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          {error && !error.includes('Please select at least one image') && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert 
              severity="success" 
              sx={{ mb: 3 }}
            >
              {success}
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
                        <Box>
                          {index === steps.length - 1 ? (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleSubmit(onSubmit)}
                              disabled={loading}
                              startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                            >
                              {loading ? 'Creating...' : 'Create Listing'}
                            </Button>
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
    </Container>
  );
};

export default CreateListingPage; 