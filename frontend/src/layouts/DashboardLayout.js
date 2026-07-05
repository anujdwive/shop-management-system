import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Notifications from '../components/Notifications';
import { useDispatch, useSelector } from 'react-redux';
import {
  Menu as MenuIcon,
  Dashboard,
  Inventory,
  AttachMoney,
  People,
  Event,
  Assessment,
  ChevronLeft,
  AccountCircle,
  Logout,
  Shop,
} from '@mui/icons-material';
import {
  toggleMobileDrawer,
  setSelectedShop,
  setPageTitle,
} from '../store/slices/uiSlice';
import { useLogout } from '../services/useAuth';

const DRAWER_WIDTH = 280;

const DashboardLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const logout = useLogout();
  const navigate = useNavigate();

  const { sidebarOpen, mobileOpen, pageTitle, user } = useSelector((state) => ({
    sidebarOpen: state.ui.sidebarOpen,
    mobileOpen: state.ui.mobileOpen,
    pageTitle: state.ui.pageTitle,
    user: state.auth.user,
  }));

  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    dispatch(toggleMobileDrawer());
  };

  const handleSidebarToggle = () => {
    dispatch(toggleMobileDrawer());
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Shops', icon: <Shop />, path: '/dashboard/shops' },
    { text: 'Stock', icon: <Inventory />, path: '/dashboard/stock' },
    { text: 'Finance', icon: <AttachMoney />, path: '/dashboard/finance' },
    { text: 'Employees', icon: <People />, path: '/dashboard/employees' },
    { text: 'Meetings', icon: <Event />, path: '/dashboard/meetings' },
    { text: 'Reports', icon: <Assessment />, path: '/dashboard/reports' },
  ];

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold" noWrap>
          Shop Manager
        </Typography>
        {!isMobile && (
          <IconButton onClick={handleSidebarToggle}>
            <ChevronLeft />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile) {
                dispatch(toggleMobileDrawer());
              }
            }}
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : 64}px)` },
          ml: { md: `${sidebarOpen ? 0 : -DRAWER_WIDTH}px` },
          transition: 'width 0.2s, margin 0.2s',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={isMobile ? handleDrawerToggle : handleSidebarToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {pageTitle}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleMenuClose}>
                <AccountCircle sx={{ mr: 1 }} /> Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={isMobile ? mobileOpen : sidebarOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : 64}px)` },
          mt: '64px',
          transition: 'width 0.2s, margin 0.2s',
        }}
      >
        <Outlet />
        <Notifications />
      </Box>
    </Box>
  );
};

export default DashboardLayout;