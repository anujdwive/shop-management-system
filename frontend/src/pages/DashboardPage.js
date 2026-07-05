import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import {
  TrendingUp,
  Inventory,
  AttachMoney,
  People,
  Event,
  Warning,
} from '@mui/icons-material';
import { setPageTitle } from '../store/slices/uiSlice';

const DashboardPage = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle('Dashboard'));
  }, [dispatch]);

  const quickStats = [
    {
      title: 'Today\'s Sales',
      value: '₹0',
      icon: <TrendingUp />,
      color: '#4caf50',
    },
    {
      title: 'Total Products',
      value: '0',
      icon: <Inventory />,
      color: '#2196f3',
    },
    {
      title: 'Pending Payments',
      value: '0',
      icon: <AttachMoney />,
      color: '#ff9800',
    },
    {
      title: 'Employees',
      value: '0',
      icon: <People />,
      color: '#9c27b0',
    },
  ];

  const recentActivities = [
    {
      title: 'No recent activities',
      description: 'Start by adding products or making sales',
    },
  ];

  const upcomingEvents = [
    {
      title: 'No upcoming meetings',
      description: 'Schedule meetings with dealers or employees',
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Welcome to Shop Management System
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your shops today
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Quick Stats */}
        {quickStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}dd 100%)`,
                color: 'white',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Event sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Recent Activities
              </Typography>
            </Box>
            {recentActivities.map((activity, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  {activity.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activity.description}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Warning sx={{ mr: 2, color: 'warning.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Upcoming Events
              </Typography>
            </Box>
            {upcomingEvents.map((event, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  {event.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.description}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Getting Started Card */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4, backgroundColor: 'primary.main', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
              <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Get Started with Your Shop Management
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Add your first shop, create products, and start managing your inventory
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    px: 2,
                    py: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 1,
                  }}
                >
                  Create Shop
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    px: 2,
                    py: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 1,
                  }}
                >
                  Add Products
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    px: 2,
                    py: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 1,
                  }}
                >
                  Make Sales
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;