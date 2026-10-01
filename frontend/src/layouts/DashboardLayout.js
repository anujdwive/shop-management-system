import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";

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
} from "@mui/icons-material";

import Notifications from "../components/Notifications";

import { useDispatch, useSelector } from "react-redux";

import { toggleSidebar, toggleMobileDrawer } from "../store/slices/uiSlice";

import { useLogout } from "../services/useAuth";

// ============================================================================
// CONSTANTS
// ============================================================================

const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 64;

// ============================================================================
// DASHBOARD LAYOUT
// ============================================================================

const DashboardLayout = () => {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const dispatch = useDispatch();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================================================
  // REDUX STATE
  // ==========================================================================

  const { sidebarOpen, mobileOpen, pageTitle, user } = useSelector((state) => ({
    sidebarOpen: state.ui.sidebarOpen,
    mobileOpen: state.ui.mobileOpen,
    pageTitle: state.ui.pageTitle,
    user: state.auth.user,
  }));

  // ==========================================================================
  // LOCAL STATE
  // ==========================================================================

  const [anchorEl, setAnchorEl] = useState(null);

  // ==========================================================================
  // DRAWER HANDLERS
  // ==========================================================================

  // Mobile drawer
  const handleDrawerToggle = () => {
    dispatch(toggleMobileDrawer());
  };

  // Desktop sidebar
  const handleSidebarToggle = () => {
    dispatch(toggleSidebar());
  };

  // ==========================================================================
  // USER MENU
  // ==========================================================================

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

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  const handleNavigation = (path) => {
    navigate(path);

    if (isMobile) {
      dispatch(toggleMobileDrawer());
    }
  };

  // ==========================================================================
  // SIDEBAR MENU ITEMS
  // ==========================================================================

  const menuItems = [
    {
      text: "Dashboard",
      icon: <Dashboard />,
      path: "/dashboard",
    },
    {
      text: "Shops",
      icon: <Shop />,
      path: "/dashboard/shops",
    },
    {
      text: "Stock",
      icon: <Inventory />,
      path: "/dashboard/stock",
    },
    {
      text: "Finance",
      icon: <AttachMoney />,
      path: "/dashboard/finance",
    },
    {
      text: "Employees",
      icon: <People />,
      path: "/dashboard/employees",
    },
    {
      text: "Meetings",
      icon: <Event />,
      path: "/dashboard/meetings",
    },
    {
      text: "Reports",
      icon: <Assessment />,
      path: "/dashboard/reports",
    },
  ];

  // ==========================================================================
  // CURRENT DRAWER WIDTH
  // ==========================================================================

  const currentDrawerWidth = isMobile
    ? DRAWER_WIDTH
    : sidebarOpen
      ? DRAWER_WIDTH
      : COLLAPSED_DRAWER_WIDTH;

  // ==========================================================================
  // DRAWER CONTENT
  // ==========================================================================

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}>
      {/* ================================================================== */}
      {/* SIDEBAR HEADER */}
      {/* ================================================================== */}

      <Toolbar
        sx={{
          minHeight: "64px !important",
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarOpen || isMobile ? "flex-start" : "center",
          px: sidebarOpen || isMobile ? 2 : 1,
        }}>
        <Box
          onClick={isMobile ? handleDrawerToggle : handleSidebarToggle}
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            userSelect: "none",
          }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              backgroundColor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: "18px",
              flexShrink: 0,
            }}>
            S
          </Box>

          {(sidebarOpen || isMobile) && (
            <Typography
              variant='h6'
              fontWeight={700}
              noWrap
              sx={{
                ml: 1.2,
                color: "text.primary",
              }}>
              Shop Manager
            </Typography>
          )}
        </Box>
      </Toolbar>

      <Divider />

      {/* ================================================================== */}
      {/* MENU */}
      {/* ================================================================== */}

      <List
        sx={{
          px: 1,
          py: 1.5,
        }}>
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/dashboard" &&
              location.pathname.startsWith(`${item.path}/`));

          return (
            <ListItem
              key={item.text}
              disablePadding
              sx={{
                display: "block",
                mb: 0.5,
              }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  minHeight: 48,

                  px: sidebarOpen || isMobile ? 1.5 : 0,

                  justifyContent:
                    sidebarOpen || isMobile ? "initial" : "center",

                  borderRadius: 2,

                  transition: "background-color 0.2s, color 0.2s",

                  "&:hover": {
                    backgroundColor: "action.hover",
                  },

                  "&.Mui-selected": {
                    backgroundColor: "rgba(25, 118, 210, 0.10)",
                    color: "primary.main",

                    "&:hover": {
                      backgroundColor: "rgba(25, 118, 210, 0.15)",
                    },
                  },
                }}>
                {/* Icon */}
                <ListItemIcon
                  sx={{
                    minWidth: sidebarOpen || isMobile ? 40 : "auto",

                    justifyContent: "center",

                    color: isActive ? "primary.main" : "text.secondary",
                  }}>
                  {item.icon}
                </ListItemIcon>

                {/* Text */}
                {(sidebarOpen || isMobile) && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider />

      {/* ================================================================== */}
      {/* BOTTOM SIDEBAR AREA */}
      {/* ================================================================== */}

      <Box
        sx={{
          p: sidebarOpen || isMobile ? 2 : 1,
          display: "flex",
          justifyContent: "center",
        }}>
        {(sidebarOpen || isMobile) && (
          <Typography
            variant='caption'
            color='text.secondary'
            textAlign='center'>
            Shop Management System
          </Typography>
        )}
      </Box>
    </Box>
  );

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f7f9fc",
      }}>
      {/* ================================================================== */}
      {/* APP BAR */}
      {/* ================================================================== */}

      <AppBar
        position='fixed'
        elevation={0}
        sx={{
          width: {
            xs: "100%",
            md: `calc(100% - ${currentDrawerWidth}px)`,
          },

          ml: {
            xs: 0,
            md: `${currentDrawerWidth}px`,
          },

          backgroundColor: "#ffffff",

          color: "text.primary",

          borderBottom: "1px solid",

          borderColor: "grey.200",

          boxShadow: "none",

          transition: "width 0.2s ease, margin-left 0.2s ease",
        }}>
        <Toolbar
          sx={{
            minHeight: "64px !important",
            px: {
              xs: 2,
              sm: 3,
            },
          }}>
          {/* ============================================================ */}
          {/* SIDEBAR TOGGLE */}
          {/* ============================================================ */}

          {/* <IconButton
            color='inherit'
            aria-label='toggle drawer'
            edge='start'
            onClick={isMobile ? handleDrawerToggle : handleSidebarToggle}
            sx={{
              mr: 2,
            }}>
            {isMobile ? (
              <MenuIcon />
            ) : sidebarOpen ? (
              <ChevronLeft />
            ) : (
              <MenuIcon />
            )}
          </IconButton> */}

          {/* Page Title */}
          <Typography
            variant='h6'
            noWrap
            component='div'
            fontWeight='600'
            sx={{
              flexGrow: 1,
            }}>
            {pageTitle}
          </Typography>

          {/* ============================================================ */}
          {/* USER AREA */}
          {/* ============================================================ */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}>
            <IconButton
              size='large'
              aria-label='account of current user'
              aria-controls='menu-appbar'
              aria-haspopup='true'
              onClick={handleMenuOpen}
              color='inherit'>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: "primary.main",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}>
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </Avatar>
            </IconButton>

            {/* ========================================================== */}
            {/* USER MENU */}
            {/* ========================================================== */}

            <Menu
              id='menu-appbar'
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    minWidth: 180,
                    borderRadius: 2,
                    boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.10)",
                  },
                },
              }}>
              <MenuItem onClick={handleMenuClose}>
                <AccountCircle
                  sx={{
                    mr: 1.5,
                    color: "text.secondary",
                  }}
                />
                Profile
              </MenuItem>

              <MenuItem onClick={handleLogout}>
                <Logout
                  sx={{
                    mr: 1.5,
                    color: "text.secondary",
                  }}
                />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ================================================================== */}
      {/* DRAWER */}
      {/* ================================================================== */}

      <Box
        component='nav'
        sx={{
          width: {
            xs: 0,
            md: currentDrawerWidth,
          },

          flexShrink: 0,

          transition: "width 0.2s ease",
        }}>
        <Drawer
          variant={isMobile ? "temporary" : "persistent"}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",

              width: currentDrawerWidth,

              borderRight: "1px solid",

              borderColor: "grey.200",

              backgroundColor: "#ffffff",

              overflowX: "hidden",

              transition: "width 0.2s ease",

              position: {
                md: "fixed",
              },
            },
          }}>
          {drawer}
        </Drawer>
      </Box>

      {/* ================================================================== */}
      {/* MAIN CONTENT */}
      {/* ================================================================== */}

      <Box
        component='main'
        sx={{
          flexGrow: 1,

          minWidth: 0,

          minHeight: "100vh",

          pt: "64px",

          width: {
            xs: "100%",
            md: `calc(100% - ${currentDrawerWidth}px)`,
          },

          transition: "width 0.2s ease",

          overflowX: "hidden",
        }}>
        {/* ================================================================ */}
        {/* PAGE CONTENT */}
        {/* ================================================================ */}

        <Box
          sx={{
            width: "100%",
            minHeight: "calc(100vh - 64px)",
          }}>
          <Outlet />
        </Box>

        {/* ================================================================ */}
        {/* NOTIFICATIONS */}
        {/* ================================================================ */}

        <Notifications />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
