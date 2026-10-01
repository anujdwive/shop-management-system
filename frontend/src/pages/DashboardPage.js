import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

import {
  Box,
  Container,
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

// import your action
// import { setPageTitle } from "../../store/...";

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({ title, value, icon, color }) => {
  return (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        minWidth: 0,
        height: "100%",
        boxSizing: "border-box",

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

          {/* Content */}
          <Box
            sx={{
              flexGrow: 1,
              minWidth: 0,

              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
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

// ============================================================
// DASHBOARD PAGE
// ============================================================

const DashboardPage = () => {
  const dispatch = useDispatch();

  // ----------------------------------------------------------
  // PAGE TITLE
  // ----------------------------------------------------------

  useEffect(() => {
    // dispatch(setPageTitle("Dashboard"));
  }, [dispatch]);

  // ----------------------------------------------------------
  // QUICK STATS
  // ----------------------------------------------------------

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

  // ==========================================================
  // JSX
  // ==========================================================

  return (
    <Container
      maxWidth={false}
      sx={{
        width: "100%",
        maxWidth: "1440px",

        mx: "auto",

        px: {
          xs: 2,
          sm: 3,
          md: 4,
        },

        py: 4,

        boxSizing: "border-box",
      }}>
      {/* ==================================================== */}
      {/* WELCOME SECTION */}
      {/* ==================================================== */}

      <Box
        sx={{
          width: "100%",
          mb: 3,
        }}>
        <Typography
          variant='h4'
          fontWeight={700}
          sx={{
            mb: 0.5,
          }}>
          Welcome to Shop Management System
        </Typography>

        <Typography variant='body1' color='text.secondary'>
          Here's what's happening with your shop today.
        </Typography>
      </Box>

      {/* ==================================================== */}
      {/* BLUE GET STARTED BANNER */}
      {/* ==================================================== */}

      <Box
        sx={{
          width: "100%",
        }}>
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            boxSizing: "border-box",

            p: {
              xs: 2.5,
              sm: 3,
            },

            borderRadius: 3,

            background: "linear-gradient(135deg, #1565c0, #1976d2)",

            color: "#fff",
          }}>
          <Typography variant='h6' fontWeight={700}>
            Get Started with Your Shop
          </Typography>

          <Typography
            variant='body2'
            sx={{
              mt: 0.5,
              opacity: 0.9,
            }}>
            Manage your shop, products, sales and employees from one place.
          </Typography>

          {/* Buttons */}
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              mt: 2,

              flexWrap: "wrap",
            }}>
            <Button
              variant='contained'
              sx={{
                backgroundColor: "#fff",
                color: "#1565c0",

                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}>
              Create Shop
            </Button>

            <Button
              variant='outlined'
              sx={{
                color: "#fff",
                borderColor: "#fff",

                "&:hover": {
                  borderColor: "#fff",
                  backgroundColor: "rgba(255,255,255,0.08)",
                },
              }}>
              Add Product
            </Button>

            <Button
              variant='outlined'
              sx={{
                color: "#fff",
                borderColor: "#fff",

                "&:hover": {
                  borderColor: "#fff",
                  backgroundColor: "rgba(255,255,255,0.08)",
                },
              }}>
              Record Sale
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* ==================================================== */}
      {/* QUICK STATS */}
      {/* ==================================================== */}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },

          gap: 3,

          width: "100%",

          mt: 3,
        }}>
        {quickStats.map((stat) => (
          <Box
            key={stat.title}
            sx={{
              width: "100%",
              minWidth: 0,
            }}>
            <StatCard {...stat} />
          </Box>
        ))}
      </Box>

      {/* ==================================================== */}
      {/* RECENT ACTIVITIES + UPCOMING EVENTS */}
      {/* ==================================================== */}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
          },

          gap: 3,

          width: "100%",

          mt: 3,

          alignItems: "stretch",
        }}>
        {/* -------------------------------------------------- */}
        {/* RECENT ACTIVITIES */}
        {/* -------------------------------------------------- */}

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            height: "100%",

            boxSizing: "border-box",

            borderRadius: 3,

            border: "1px solid",
            borderColor: "grey.100",

            p: 3,
          }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",

              gap: 1,

              mb: 2,
            }}>
            <History color='primary' />

            <Typography variant='h6' fontWeight={700}>
              Recent Activities
            </Typography>
          </Box>

          {/* Empty State */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",

              minHeight: 80,
            }}>
            <Typography color='text.secondary'>
              No recent activities found.
            </Typography>
          </Box>
        </Paper>

        {/* -------------------------------------------------- */}
        {/* UPCOMING EVENTS */}
        {/* -------------------------------------------------- */}

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            height: "100%",

            boxSizing: "border-box",

            borderRadius: 3,

            border: "1px solid",
            borderColor: "grey.100",

            p: 3,
          }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",

              gap: 1,

              mb: 2,
            }}>
            <EventNote color='primary' />

            <Typography variant='h6' fontWeight={700}>
              Upcoming Events
            </Typography>
          </Box>

          {/* Empty State */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",

              minHeight: 80,
            }}>
            <Typography color='text.secondary'>No upcoming events.</Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default DashboardPage;
