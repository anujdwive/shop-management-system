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
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  People,
  PersonAdd,
  Badge,
  AccessTime,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';

const EmployeesPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openAdd, setOpenAdd] = useState(false);
  const [openAttendance, setOpenAttendance] = useState(false);

  // Mock data - replace with actual API calls
  const employees = [];
  const attendance = [];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Employee Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage staff, track attendance, and monitor performance
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <People color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Employees
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {employees.length}
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
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Present Today
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {attendance.filter(a => a.status === 'present').length}
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
                <AccessTime color="warning" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    On Leave
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {attendance.filter(a => a.status === 'on_leave').length}
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
                <Badge color="info" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Sales
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ₹0
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="All Employees" />
          <Tab label="Attendance" />
          <Tab label="Performance" />
          <Tab label="Sales" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setOpenAdd(true)}>
            Add Employee
          </Button>
        </Box>
      )}

      {tabValue === 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<Badge />} onClick={() => setOpenAttendance(true)}>
            Mark Attendance
          </Button>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {tabValue === 0 && (
                <>
                  <TableCell>Employee</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Join Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </>
              )}
              {tabValue === 1 && (
                <>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Work Hours</TableCell>
                  <TableCell>Status</TableCell>
                </>
              )}
              {tabValue === 2 && (
                <>
                  <TableCell>Employee</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Total Sales</TableCell>
                  <TableCell>Commission</TableCell>
                  <TableCell>Target Achievement</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {tabValue === 0 && employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                    No employees found. Add your first employee to get started!
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {tabValue === 1 && attendance.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                    No attendance records found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Employee Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Full Name" sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Employee ID" sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Designation</InputLabel>
                <Select label="Designation">
                  <MenuItem value="sales_executive">Sales Executive</MenuItem>
                  <MenuItem value="store_keeper">Store Keeper</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Salary" type="number" sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Salary Type</InputLabel>
                <Select label="Salary Type">
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="commission_based">Commission Based</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" sx={{ mb: 2 }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button variant="contained">Add Employee</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmployeesPage;