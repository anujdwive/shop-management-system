import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";

import { AccountCircle, Logout } from "@mui/icons-material";

import { useDispatch, useSelector } from "react-redux";

import { toggleMobileDrawer, toggleSidebar } from "../store/slices/uiSlice";

import { useLogout } from "../services/useAuth";

const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 64;

const TopBar = () => {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const dispatch = useDispatch();
  const logout = useLogout();

  const [anchorEl, setAnchorEl] = useState(null);

  const { sidebarOpen, pageTitle, user } = useSelector((state) => ({
    sidebarOpen: state.ui.sidebarOpen,
    pageTitle: state.ui.pageTitle,
    user: state.auth.user,
  }));

  const currentDrawerWidth = isMobile
    ? DRAWER_WIDTH
    : sidebarOpen
      ? DRAWER_WIDTH
      : COLLAPSED_DRAWER_WIDTH;

  // ==========================================================================
  // DRAWER HANDLERS
  // ==========================================================================

  const handleDrawerToggle = () => {
    dispatch(toggleMobileDrawer());
  };

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

  return (
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
        {/* ================================================================== */}
        {/* SIDEBAR TOGGLE */}
        {/* ================================================================== */}

        {/* 
        <IconButton
          color="inherit"
          aria-label="toggle drawer"
          edge="start"
          onClick={isMobile ? handleDrawerToggle : handleSidebarToggle}
          sx={{
            mr: 2,
          }}
        >
          {isMobile ? (
            <MenuIcon />
          ) : sidebarOpen ? (
            <ChevronLeft />
          ) : (
            <MenuIcon />
          )}
        </IconButton>
        */}

        {/* ================================================================== */}
        {/* PAGE TITLE */}
        {/* ================================================================== */}

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

        {/* ================================================================== */}
        {/* USER AREA */}
        {/* ================================================================== */}

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

          {/* ================================================================= */}
          {/* USER MENU */}
          {/* ================================================================= */}

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
  );
};

export default TopBar;
