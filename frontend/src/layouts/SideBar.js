import React from "react";
import {
  Box,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {
  Dashboard,
  Inventory,
  AttachMoney,
  People,
  Event,
  Assessment,
  Shop,
} from "@mui/icons-material";

import { useDispatch, useSelector } from "react-redux";

import { useNavigate, useLocation } from "react-router-dom";

import { toggleSidebar, toggleMobileDrawer } from "../store/slices/uiSlice";

const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 64;

const SideBar = () => {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const location = useLocation();

  const { sidebarOpen, mobileOpen } = useSelector((state) => ({
    sidebarOpen: state.ui.sidebarOpen,
    mobileOpen: state.ui.mobileOpen,
  }));

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
  );
};

export default SideBar;
