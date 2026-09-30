import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  alpha,
} from "@mui/material";
import {
  TrendingUp,
  Inventory,
  AttachMoney,
  People,
  History,
  EventNote,
} from "@mui/icons-material";
import { setPageTitle } from "../store/slices/uiSlice";

// =========================================================================
// REUSABLE STAT CARD COMPONENT
// =========================================================================
const StatCard = ({ title, value, icon, color }) => {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "grey.100",
        backgroundColor: "#ffffff",
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.03)",
        transition: "transform 0.2s, box-shadow 0.2s",

        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.06)",
        },
      }}>
      <CardContent
        sx={{
          p: 2.5,
          height: "100%",
          boxSizing: "border-box",

          "&:last-child": {
            pb: 2.5,
          },
        }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2.5,
            width: "100%",
          }}>
          {/* Icon */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: "50%",
              backgroundColor: alpha(color, 0.12),
              color: color,
              flexShrink: 0,
            }}>
            {React.cloneElement(icon, {
              sx: {
                fontSize: 26,
              },
            })}
          </Box>

          {/* Metric */}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0,
            }}>
            <Typography
              variant='body2'
              fontWeight='600'
              color='text.secondary'
              sx={{
                mb: 0.2,
                lineHeight: 1.2,
              }}>
              {title}
            </Typography>

            <Typography
              variant='h4'
              fontWeight='700'
              sx={{
                color: color,
                lineHeight: 1.1,
              }}>
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// =========================================================================
// MAIN DASHBOARD COMPONENT
// =========================================================================
const DashboardPage = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle("Dashboard"));
  }, [dispatch]);

  // =========================================================================
  // QUICK STATS
  // =========================================================================
  const quickStats = [
    {
      title: "Today's Sales",
      value: "₹0",
      icon: <TrendingUp />,
      color: "#2e7d32",
    },
    {
      title: "Total Products",
      value: "0",
      icon: <Inventory />,
      color: "#1565c0",
    },
    {
      title: "Pending Payments",
      value: "0",
      icon: <AttachMoney />,
      color: "#e65100",
    },
    {
      title: "Employees",
      value: "0",
      icon: <People />,
      color: "#7b1fa2",
    },
  ];

  // =========================================================================
  // RECENT ACTIVITIES
  // =========================================================================
  const recentActivities = [
    {
      title: "No recent activities",
      description:
        "Add your first shop, product, or make a sale to see activities.",
    },
  ];

  // =========================================================================
  // UPCOMING EVENTS
  // =========================================================================
  const upcomingEvents = [
    {
      title: "No upcoming meetings",
      description: "Schedule meetings with dealers or employees.",
    },
  ];

  return (
    <Container
      maxWidth='lg'
      sx={{
        py: 4,
        px: {
          xs: 2,
          sm: 3,
          md: 3,
        },
        mx: "auto",
      }}>
      {/* ================================================================= */}
      {/* WELCOME SECTION */}
      {/* ================================================================= */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant='h4'
          fontWeight='700'
          color='text.primary'
          sx={{
            mb: 1,
            fontSize: {
              xs: "1.8rem",
              sm: "2rem",
              md: "2.125rem",
            },
          }}>
          Welcome to Shop Management System
        </Typography>

        <Typography variant='body1' color='text.secondary'>
          Here's what's happening with your shops today.
        </Typography>
      </Box>

      {/* ================================================================= */}
      {/* MAIN GRID */}
      {/* ================================================================= */}
      <Grid container spacing={3}>
        {/* ================================================================= */}
        {/* BLUE ACTION BANNER */}
        {/* ================================================================= */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 2.5,
                sm: 3,
                md: 4,
              },
              backgroundColor: "#1976d2",
              color: "white",
              borderRadius: 4,
              boxShadow: "0px 8px 24px rgba(25, 118, 210, 0.15)",
            }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 3,
              }}>
              {/* Banner Content */}
              <Box
                sx={{
                  flex: "1 1 350px",
                  minWidth: 0,
                }}>
                <Typography
                  variant='h5'
                  fontWeight='700'
                  sx={{
                    mb: 1,
                    fontSize: {
                      xs: "1.25rem",
                      sm: "1.4rem",
                      md: "1.5rem",
                    },
                  }}>
                  Get Started with Your Shop Management
                </Typography>

                <Typography
                  variant='body1'
                  sx={{
                    opacity: 0.9,
                    maxWidth: 650,
                    lineHeight: 1.5,
                  }}>
                  Add your first shop, create products, and start managing your
                  inventory.
                </Typography>
              </Box>

              {/* Banner Buttons */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  flexWrap: "wrap",
                  justifyContent: {
                    xs: "flex-start",
                    md: "flex-end",
                  },
                }}>
                {["Create Shop", "Add Products", "Make Sales"].map(
                  (btnLabel) => (
                    <Button
                      key={btnLabel}
                      variant='contained'
                      disableElevation
                      sx={{
                        backgroundColor: "#ffffff",
                        color: "#1976d2",
                        fontWeight: "700",
                        textTransform: "none",
                        borderRadius: 2.5,
                        px: {
                          xs: 2,
                          sm: 2.5,
                          md: 3,
                        },
                        py: 1.2,
                        fontSize: "0.9rem",
                        whiteSpace: "nowrap",

                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                        },
                      }}>
                      {btnLabel}
                    </Button>
                  ),
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* ================================================================= */}
        {/* QUICK STATS */}
        {/* ================================================================= */}
        {quickStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
            />
          </Grid>
        ))}

        {/* ================================================================= */}
        {/* RECENT ACTIVITIES */}
        {/* ================================================================= */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 2.5,
                sm: 3,
                md: 3.5,
              },
              height: "100%",
              boxSizing: "border-box",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "grey.100",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
            }}>
            {/* Section Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 2.5,
                pb: 2,
                borderBottom: "1px solid",
                borderColor: "grey.100",
              }}>
              <History
                sx={{
                  mr: 1.5,
                  color: "text.secondary",
                }}
              />

              <Typography variant='h6' fontWeight='700'>
                Recent Activities
              </Typography>
            </Box>

            {/* Activities */}
            {recentActivities.map((activity, index) => (
              <Box key={index}>
                <Typography
                  variant='subtitle1'
                  fontWeight='600'
                  color='text.primary'
                  sx={{
                    mb: 0.5,
                  }}>
                  {activity.title}
                </Typography>

                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{
                    lineHeight: 1.5,
                  }}>
                  {activity.description}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* ================================================================= */}
        {/* UPCOMING EVENTS */}
        {/* ================================================================= */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 2.5,
                sm: 3,
                md: 3.5,
              },
              height: "100%",
              boxSizing: "border-box",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "grey.100",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
            }}>
            {/* Section Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 2.5,
                pb: 2,
                borderBottom: "1px solid",
                borderColor: "grey.100",
              }}>
              <EventNote
                sx={{
                  mr: 1.5,
                  color: "text.secondary",
                }}
              />

              <Typography variant='h6' fontWeight='700'>
                Upcoming Events
              </Typography>
            </Box>

            {/* Events */}
            {upcomingEvents.map((event, index) => (
              <Box key={index}>
                <Typography
                  variant='subtitle1'
                  fontWeight='600'
                  color='text.primary'
                  sx={{
                    mb: 0.5,
                  }}>
                  {event.title}
                </Typography>

                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{
                    lineHeight: 1.5,
                  }}>
                  {event.description}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
