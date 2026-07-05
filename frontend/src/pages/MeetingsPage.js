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
} from '@mui/material';
import {
  Event,
  Add,
  Notifications,
  Schedule,
  AccessTime,
} from '@mui/icons-material';

const MeetingsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openMeeting, setOpenMeeting] = useState(false);
  const [openReminder, setOpenReminder] = useState(false);

  // Mock data - replace with actual API calls
  const meetings = [];
  const reminders = [];

  return (
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Meetings & Reminders
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Schedule meetings and set reminders for important tasks
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Event color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Upcoming Meetings
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {meetings.filter(m => m.status === 'scheduled').length}
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
                  <Schedule color="success" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Today's Meetings
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {meetings.filter(m => {
                        const today = new Date().toDateString();
                        return new Date(m.date).toDateString() === today;
                      }).length}
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
                  <Notifications color="warning" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Pending Reminders
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {reminders.filter(r => r.status === 'pending').length}
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
                  <AccessTime color="error" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Overdue Reminders
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {reminders.filter(r => r.status === 'overdue').length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Meetings" />
            <Tab label="Reminders" />
            <Tab label="Calendar" />
          </Tabs>
        </Paper>

        {tabValue === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpenMeeting(true)}>
              Schedule Meeting
            </Button>
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpenReminder(true)}>
              Set Reminder
            </Button>
          </Box>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {tabValue === 0 && (
                  <>
                    <TableCell>Meeting Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </>
                )}
                {tabValue === 1 && (
                  <>
                    <TableCell>Reminder</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {tabValue === 0 && meetings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                      No meetings scheduled. Create your first meeting!
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {tabValue === 1 && reminders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                      No reminders set. Create your first reminder!
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Schedule Meeting Dialog */}
        <Dialog open={openMeeting} onClose={() => setOpenMeeting(false)} maxWidth="md" fullWidth>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Meeting Title" sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Meeting Type</InputLabel>
                  <Select label="Meeting Type">
                    <MenuItem value="dealer">Dealer Meeting</MenuItem>
                    <MenuItem value="customer">Customer Meeting</MenuItem>
                    <MenuItem value="employee">Employee Meeting</MenuItem>
                    <MenuItem value="vendor">Vendor Meeting</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  label="Meeting Date"
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: '100%', mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Agenda"
                  multiline
                  rows={4}
                  placeholder="Enter meeting agenda items..."
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Location" sx={{ mb: 2 }} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenMeeting(false)}>Cancel</Button>
            <Button variant="contained">Schedule Meeting</Button>
          </DialogActions>
        </Dialog>

        {/* Set Reminder Dialog */}
        <Dialog open={openReminder} onClose={() => setOpenReminder(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Set Reminder</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Reminder Title" sx={{ mb: 2 }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Reminder Type</InputLabel>
              <Select label="Reminder Type">
                <MenuItem value="payment">Payment Collection</MenuItem>
                <MenuItem value="order">Order Placement</MenuItem>
                <MenuItem value="delivery">Delivery Reminder</MenuItem>
                <MenuItem value="meeting">Meeting Reminder</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              type="date"
              label="Due Date"
              InputLabelProps={{ shrink: true }}
              sx={{ width: '100%', mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select label="Priority">
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenReminder(false)}>Cancel</Button>
            <Button variant="contained">Set Reminder</Button>
          </DialogActions>
        </Dialog>
      </Container>
  );
};

export default MeetingsPage;
