import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  Download,
  CalendarToday,
  Shop,
  AttachMoney,
  People,
  Inventory,
} from '@mui/icons-material';

const ReportsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState('30days');

  // Mock data for charts - replace with actual API data
  const salesData = [
    { name: 'Jan', sales: 4000, profit: 2400 },
    { name: 'Feb', sales: 3000, profit: 1398 },
    { name: 'Mar', sales: 2000, profit: 980 },
    { name: 'Apr', sales: 2780, profit: 2000 },
    { name: 'May', sales: 1890, profit: 980 },
    { name: 'Jun', sales: 2390, profit: 1800 },
  ];

  const bestSellingProducts = [
    { name: 'Product A', sales: 150, revenue: 45000 },
    { name: 'Product B', sales: 120, revenue: 36000 },
    { name: 'Product C', sales: 100, revenue: 30000 },
    { name: 'Product D', sales: 80, revenue: 24000 },
    { name: 'Product E', sales: 60, revenue: 18000 },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Reports & Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive business insights and performance metrics
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="7days">Last 7 Days</MenuItem>
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="90days">Last 90 Days</MenuItem>
            <MenuItem value="1year">Last Year</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<Download />}>
          Export Report
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp color="success" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ₹0
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    +0% vs last period
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AttachMoney color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Profit
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ₹0
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    +0% vs last period
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Inventory color="info" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Products Sold
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    0
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This period
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Shop color="warning" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Shops
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    0
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    All shops
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Sales" />
          <Tab label="Stock" />
          <Tab label="Finance" />
          <Tab label="Employees" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sales Trend Analysis
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Monthly Performance
                  </Typography>
                  {salesData.map((item) => (
                    <Box key={item.name} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{item.name}</Typography>
                        <Typography variant="body2" color="primary.main">
                          ₹{item.sales.toLocaleString()}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(item.sales / 4000) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sales Distribution
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Category-wise sales breakdown
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Electronics: 40%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={40}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Groceries: 30%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={30}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Clothing: 20%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={20}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Other: 10%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={10}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Best Selling Products
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell align="right">Units Sold</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Growth</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bestSellingProducts.map((product) => (
                    <TableRow key={product.name}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell align="right">{product.sales}</TableCell>
                      <TableCell align="right">₹{product.revenue.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main">
                          +{(Math.random() * 20).toFixed(1)}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stock Overview
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Stock reports and analytics coming soon...
            </Typography>
          </CardContent>
        </Card>
      )}

      {tabValue === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Financial Summary
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Financial reports and profit/loss analysis coming soon...
            </Typography>
          </CardContent>
        </Card>
      )}

      {tabValue === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Employee Performance
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Employee performance analytics and reports coming soon...
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default ReportsPage;