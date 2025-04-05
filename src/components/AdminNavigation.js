import React from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Typography, 
  useTheme,
  useMediaQuery,
  Toolbar,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  People as UserIcon,
  List as ListingIcon,
  Report as ReportIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Assessment as AuditIcon,
  Email as EmailIcon,
  Star as FeaturedIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import { useColorMode } from '../contexts/ThemeContext';

const drawerWidth = 260;

const AdminNavigation = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const navigationItems = [
    { 
      title: 'Dashboard', 
      path: '/admin', 
      icon: <DashboardIcon /> 
    },
    { 
      title: 'User Management', 
      path: '/admin/users', 
      icon: <UserIcon /> 
    },
    { 
      title: 'Listing Management', 
      path: '/admin/listings', 
      icon: <ListingIcon /> 
    },
    { 
      title: 'Promotion Approvals', 
      path: '/admin/promotion-approvals', 
      icon: <FeaturedIcon /> 
    },
    { 
      title: 'Reports', 
      path: '/admin/reports', 
      icon: <ReportIcon /> 
    },
    { 
      title: 'Contact Messages', 
      path: '/admin/messages', 
      icon: <EmailIcon /> 
    },
    { 
      title: 'Audit Log', 
      path: '/admin/audit-log', 
      icon: <AuditIcon /> 
    },
    { 
      title: 'Settings', 
      path: '/admin/settings', 
      icon: <SettingsIcon /> 
    }
  ];
  
  const handleNavigation = (path) => {
    navigate(path);
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const drawerContent = (
    <>
      <Toolbar sx={{ 
        justifyContent: 'center', 
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        py: 1.5
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold', 
            letterSpacing: 0.5,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <SettingsIcon sx={{ mr: 1 }} />
          ADMIN PANEL
        </Typography>
      </Toolbar>
      
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          MAIN NAVIGATION
        </Typography>
      </Box>
      
      <List>
        {navigationItems.map((item) => (
          <ListItem 
            button 
            key={item.title}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.light',
                }
              },
              '&:hover': {
                bgcolor: 'action.hover',
              }
            }}
          >
            <ListItemIcon sx={{ 
              color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
              minWidth: 40
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.title} />
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <List>
        <ListItem 
          sx={{
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ListItemText primary="Theme Mode" />
          </Box>
          <DarkModeToggle />
        </ListItem>
        
        <ListItem 
          button 
          onClick={() => navigate('/')}
          sx={{
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <HomeIcon color="action" />
          </ListItemIcon>
          <ListItemText primary="Back to Site" />
        </ListItem>
        
        <ListItem 
          button 
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            color: 'error.main',
          }}
        >
          <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </>
  );
  
  if (isMobile) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Drawer
          variant="temporary"
          open={false} // This should be controlled by a state
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>
    );
  }
  
  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Fixed navigation for smaller screens as icons */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-around',
            bgcolor: 'background.paper',
            borderTop: `1px solid ${theme.palette.divider}`,
            zIndex: theme.zIndex.appBar,
            py: 1,
          }}
        >
          {navigationItems.slice(0, 5).map((item) => (
            <Tooltip key={item.title} title={item.title}>
              <IconButton
                color={location.pathname === item.path ? 'primary' : 'default'}
                onClick={() => handleNavigation(item.path)}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          ))}
          
          <Tooltip title="Theme Mode">
            <IconButton>
              <DarkModeToggle size="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default AdminNavigation;