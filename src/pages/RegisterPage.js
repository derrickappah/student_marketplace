import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Link,
  Grid,
  useMediaQuery,
  useTheme,
  InputAdornment,
  IconButton,
  Divider,
  Stepper,
  Step,
  StepLabel,
  alpha,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  School as SchoolIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ShoppingBag as ShoppingBagIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { signUp } from "../services/supabase";
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeStep, setActiveStep] = useState(0);
  const isDarkMode = theme.palette.mode === 'dark';
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    trigger,
  } = useForm();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const onSubmit = async (data) => {
    try {
      setError('');
      await signUp({
        email: data.email,
        password: data.password,
        name: data.name,
        university: data.university,
      });
      navigate('/login', {
        state: { message: 'Please check your email to verify your account.' },
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleNext = async () => {
    const fields = activeStep === 0 
      ? ['name', 'email', 'university'] 
      : ['password', 'confirmPassword'];
    
    const result = await trigger(fields);
    if (result) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const steps = ['Account Information', 'Security'];

  // Get colors based on theme mode
  const gradientBg = isDarkMode 
    ? 'linear-gradient(135deg, #212121 0%, #424242 100%)'
    : 'linear-gradient(135deg, #f9f9f9 0%, #e9ecef 100%)';
  
  const headerGradient = isDarkMode
    ? 'linear-gradient(90deg, #0D47A1 0%, #1565C0 100%)'
    : 'linear-gradient(90deg, #0D47A1 0%, #2196F3 100%)';
  
  const buttonGradient = isDarkMode
    ? 'linear-gradient(90deg, #1565C0 0%, #0D47A1 100%)'
    : 'linear-gradient(90deg, #2196F3 0%, #0D47A1 100%)';
  
  const buttonHoverGradient = isDarkMode
    ? 'linear-gradient(90deg, #0D47A1 0%, #1565C0 100%)'
    : 'linear-gradient(90deg, #1E88E5 0%, #0D47A1 100%)';
  
  const paperBgColor = isDarkMode ? alpha(theme.palette.background.paper, 0.8) : theme.palette.background.paper;
  const linkColor = isDarkMode ? theme.palette.primary.light : '#0D47A1';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: gradientBg,
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={isDarkMode ? 6 : 3}
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: isDarkMode 
              ? '0 10px 40px rgba(0,0,0,0.4)'
              : '0 10px 40px rgba(0,0,0,0.1)',
            bgcolor: paperBgColor,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 3,
              background: headerGradient,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ShoppingBagIcon sx={{ fontSize: 32, mr: 1.5 }} />
              <Typography variant="h5" component="h1" fontWeight="bold">
                Student Marketplace
              </Typography>
            </Box>
            <Typography variant="subtitle1" sx={{ opacity: 0.85, textAlign: 'center' }}>
              Create your account
            </Typography>
          </Box>

          {/* Form Section */}
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Stepper 
              activeStep={activeStep} 
              sx={{ 
                mb: 4,
                '& .MuiStepLabel-root .Mui-completed': {
                  color: theme.palette.primary.main
                },
                '& .MuiStepLabel-root .Mui-active': {
                  color: theme.palette.primary.main
                }
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ width: '100%' }}
            >
              {activeStep === 0 ? (
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="name"
                    label="Full Name"
                    autoComplete="name"
                    autoFocus
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      mb: 2.5,
                      '& .MuiInputBase-root': {
                        borderRadius: 2,
                      }
                    }}
                    {...register('name', {
                      required: 'Name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters',
                      },
                    })}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    autoComplete="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      mb: 2.5,
                      '& .MuiInputBase-root': {
                        borderRadius: 2,
                      }
                    }}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="university"
                    label="University"
                    error={!!errors.university}
                    helperText={errors.university?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SchoolIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      mb: 3,
                      '& .MuiInputBase-root': {
                        borderRadius: 2,
                      }
                    }}
                    {...register('university', {
                      required: 'University is required',
                    })}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={handleNext}
                    sx={{ 
                      mt: 1, 
                      mb: 2, 
                      py: 1.5,
                      fontWeight: 'bold',
                      borderRadius: 2,
                      background: buttonGradient,
                      boxShadow: isDarkMode 
                        ? '0 4px 10px rgba(21, 101, 192, 0.3)'
                        : '0 4px 10px rgba(33, 150, 243, 0.3)',
                      '&:hover': {
                        background: buttonHoverGradient,
                        boxShadow: isDarkMode 
                          ? '0 6px 15px rgba(21, 101, 192, 0.4)'
                          : '0 6px 15px rgba(33, 150, 243, 0.4)',
                      }
                    }}
                  >
                    Next
                  </Button>
                </>
              ) : (
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      mb: 2.5,
                      '& .MuiInputBase-root': {
                        borderRadius: 2,
                      }
                    }}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={handleToggleConfirmPasswordVisibility}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      mb: 3,
                      '& .MuiInputBase-root': {
                        borderRadius: 2,
                      }
                    }}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === watch('password') || 'Passwords do not match',
                    })}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Button 
                      variant="outlined" 
                      onClick={handleBack}
                      startIcon={<ArrowBackIcon />}
                      sx={{ 
                        borderRadius: 2,
                        px: 2,
                        borderColor: isDarkMode ? theme.palette.primary.light : undefined,
                        color: isDarkMode ? theme.palette.primary.light : undefined,
                      }}
                    >
                      Back
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                      disabled={isSubmitting}
                      sx={{ 
                        px: 3,
                        py: 1,
                        fontWeight: 'bold',
                        borderRadius: 2,
                        background: buttonGradient,
                        boxShadow: isDarkMode 
                          ? '0 4px 10px rgba(21, 101, 192, 0.3)'
                          : '0 4px 10px rgba(33, 150, 243, 0.3)',
                        '&:hover': {
                          background: buttonHoverGradient,
                          boxShadow: isDarkMode 
                            ? '0 6px 15px rgba(21, 101, 192, 0.4)'
                            : '0 6px 15px rgba(33, 150, 243, 0.4)',
                        }
                      }}
                    >
                      {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </Box>
                </>
              )}

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Link 
                  component={RouterLink} 
                  to="/login" 
                  variant="body1" 
                  sx={{ fontWeight: 500, color: linkColor }}
                  underline="hover"
                >
                  Already have an account? Sign In
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage; 