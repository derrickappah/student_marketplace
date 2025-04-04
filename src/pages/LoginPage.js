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
  InputAdornment,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ShoppingBag as ShoppingBagIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { signIn } from "../services/supabase";
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDarkMode = theme.palette.mode === 'dark';
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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
      await signIn(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Check if there's a message in location state (e.g., from registration)
  const message = location.state?.message;

  // Get colors based on theme mode
  const gradientBg = isDarkMode 
    ? 'linear-gradient(135deg, #212121 0%, #424242 100%)'
    : 'linear-gradient(135deg, #f9f9f9 0%, #e9ecef 100%)';
  
  const headerGradient = isDarkMode
    ? 'linear-gradient(90deg, #1565C0 0%, #0D47A1 100%)'
    : 'linear-gradient(90deg, #2196F3 0%, #0D47A1 100%)';
  
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
              Sign in to your account
            </Typography>
          </Box>

          {/* Form Section */}
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            {message && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {message}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ width: '100%' }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                autoComplete="email"
                autoFocus
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
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
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
                  mb: 1,
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

              <Box sx={{ mt: 1, mb: 3, textAlign: 'right' }}>
                <Link 
                  component={RouterLink} 
                  to="/forgot-password" 
                  variant="body2"
                  underline="hover"
                  sx={{ fontWeight: 500, color: theme.palette.primary.main }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{ 
                  mt: 1, 
                  mb: 3,
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
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Don't have an account?
                </Typography>
                <Link 
                  component={RouterLink} 
                  to="/register" 
                  variant="body1"
                  sx={{ fontWeight: 600, color: linkColor }}
                  underline="hover"
                >
                  Create an Account
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage; 