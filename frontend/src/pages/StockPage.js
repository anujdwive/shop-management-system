import React, { useState } from "react";
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
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Inventory,
  TrendingUp,
  TrendingDown,
  SwapCalls,
  Warning,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useProducts } from "../hooks/useProducts";
import { useStock } from "../hooks/useStock";
import StatCard from "../UI/statCard/StatCard";

const StockPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openProduct, setOpenProduct] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);

  // Mock data - replace with actual hooks when ready
  const products = [];
  const stockData = [];

  const columns = [
    { field: "productName", headerName: "Product", width: 200 },
    { field: "sku", headerName: "SKU", width: 150 },
    { field: "quantity", headerName: "Stock", width: 120, type: "number" },
    { field: "category", headerName: "Category", width: 150 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.quantity < 10 ? "Low Stock" : "In Stock"}
          color={params.value.quantity < 10 ? "error" : "success"}
          size='small'
        />
      ),
    },
  ];

  const quickStats = [
    {
      title: "Today's Sales",
      value: "₹0",
      icon: <Inventory />,

      color: "#2e7d32",
    },
    {
      title: "In Stock",
      value: "0",
      icon: <TrendingUp />,
      color: "#1565c0",
    },
    {
      title: "Low Stock",
      value: "0",
      icon: <TrendingDown />,
      color: "#e65100",
    },
    {
      title: "Transfers Today",
      value: "0",
      icon: <SwapCalls />,
      color: "#7b1fa2",
    },
  ];

  return (
    <Container maxWidth='xl'>
      <Box sx={{ mb: 4 }}>
        <Typography variant='h4' fontWeight='bold'>
          Stock Management
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Manage inventory, track stock levels, and handle transfers
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label='Overview' />
          <Tab label='Products' />
          <Tab label='Stock Transfer' />
          <Tab label='Low Stock Alerts' />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
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
      )}

      {tabValue === 1 && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button variant='contained' startIcon={<Add />}>
            Add Product
          </Button>
        </Box>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <SwapCalls sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
          <Typography variant='h6' gutterBottom>
            Stock Transfer
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            Transfer stock between your shops
          </Typography>
          <Button variant='contained' startIcon={<SwapCalls />}>
            Create Transfer
          </Button>
        </Paper>
      )}

      {tabValue === 3 && (
        <Box>
          <Alert severity='warning' sx={{ mb: 3 }}>
            <Warning sx={{ mr: 1 }} />
            {stockData.filter((s) => s.quantity < 10).length} items need
            restocking
          </Alert>
          <Typography variant='h6' gutterBottom>
            Low Stock Items
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            No low stock items found
          </Typography>
        </Box>
      )}

      <Box sx={{ height: 400, mt: 3 }}>
        <DataGrid
          rows={stockData}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
        />
      </Box>
    </Container>
  );
};

export default StockPage;
