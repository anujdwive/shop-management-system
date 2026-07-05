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
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocationOn,
  Business,
} from '@mui/icons-material';
import { useShops, useCreateShop, useUpdateShop, useDeleteShop } from '../hooks/useShops';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/uiSlice';

const ShopsPage = () => {
  const dispatch = useDispatch();
  const { data: shops, isLoading, error } = useShops();
  const createShopMutation = useCreateShop();
  const updateShopMutation = useUpdateShop();
  const deleteShopMutation = useDeleteShop();

  const [open, setOpen] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    businessType: 'retail',
    owner: '',
  });

  const handleOpen = () => {
    setEditingShop(null);
    setFormData({ name: '', location: '', businessType: 'retail', owner: '' });
    setOpen(true);
  };

  const handleEdit = (shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      location: shop.location,
      businessType: shop.businessType,
      owner: shop.owner,
    });
    setOpen(true);
  };

  const handleDelete = async (shopId) => {
    if (window.confirm('Are you sure you want to delete this shop?')) {
      try {
        await deleteShopMutation.mutateAsync(shopId);
        dispatch(addNotification({
          message: 'Shop deleted successfully',
          type: 'success',
        }));
      } catch (error) {
        dispatch(addNotification({
          message: 'Failed to delete shop',
          type: 'error',
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingShop) {
        await updateShopMutation.mutateAsync({
          id: editingShop._id,
          data: formData,
        });
        dispatch(addNotification({
          message: 'Shop updated successfully',
          type: 'success',
        }));
      } else {
        await createShopMutation.mutateAsync(formData);
        dispatch(addNotification({
          message: 'Shop created successfully',
          type: 'success',
        }));
      }
      setOpen(false);
    } catch (error) {
      dispatch(addNotification({
        message: `Failed to ${editingShop ? 'update' : 'create'} shop`,
        type: 'error',
      }));
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Shop Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your business locations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
          size="large"
        >
          Add Shop
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load shops
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Shop Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Business Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shops?.length > 0 ? (
              shops.map((shop) => (
                <TableRow key={shop._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Business color="primary" />
                      <Typography fontWeight="medium">{shop.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      {shop.location}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {shop.businessType}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={shop.status}
                      color={shop.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleEdit(shop)}
                      color="primary"
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(shop._id)}
                      color="error"
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                    No shops found. Create your first shop to get started!
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingShop ? 'Edit Shop' : 'Create New Shop'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Shop Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Business Type</InputLabel>
              <Select
                value={formData.businessType}
                label="Business Type"
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              >
                <MenuItem value="retail">Retail</MenuItem>
                <MenuItem value="wholesale">Wholesale</MenuItem>
                <MenuItem value="service">Service</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingShop ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default ShopsPage;