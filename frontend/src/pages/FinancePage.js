import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  AttachMoney,
  AccountBalance,
  TrendingUp,
  Warning,
  Add,
  Visibility,
} from '@mui/icons-material';

const FinancePage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openDealer, setOpenDealer] = useState(false);
  const [openTransaction, setOpenTransaction] = useState(false);

  // Mock data - replace with actual API calls
  const dealers = [];
  const transactions = [];
  const pendingPayments = [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Finance & Credit Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track payments, manage dealer credit, and monitor financial health
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AttachMoney color="success" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ₹0
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
                <AccountBalance color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Outstanding
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ₹0
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
                <TrendingUp color="info" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Dealers
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {dealers.length}
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
                <Warning color="error" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Overdue Payments
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {pendingPayments.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Dealers" />
          <Tab label="Transactions" />
          <Tab label="Pending Payments" />
          <Tab label="Reports" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDealer(true)}>
            Add Dealer
          </Button>
        </Box>
      )}

      {tabValue === 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenTransaction(true)}>
            New Transaction
          </Button>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {tabValue === 0 && (
                <>
                  <TableCell>Dealer Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Current Balance</TableCell>
                  <TableCell>Credit Limit</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </>
              )}
              {tabValue === 1 && (
                <>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </>
              )}
              {tabValue === 2 && (
                <>
                  <TableCell>Dealer</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {tabValue === 0 && dealers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                    No dealers found. Add your first dealer to get started!
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {tabValue === 1 && transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                    No transactions found. Create your first transaction!
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {tabValue === 2 && pendingPayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                    No pending payments. Great job keeping up with payments!
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Dealer Dialog */}
      <Dialog open={openDealer} onClose={() => setOpenDealer(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Dealer</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Dealer Name" sx={{ mb: 2 }} />
          <TextField fullWidth label="Phone Number" sx={{ mb: 2 }} />
          <TextField fullWidth label="Email" sx={{ mb: 2 }} />
          <TextField fullWidth label="Credit Limit" type="number" sx={{ mb: 2 }} />
          <TextField fullWidth label="Address" multiline rows={3} sx={{ mb: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDealer(false)}>Cancel</Button>
          <Button variant="contained">Add Dealer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FinancePage;