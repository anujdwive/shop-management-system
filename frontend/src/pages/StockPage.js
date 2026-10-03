import {
  Add,
  Delete,
  Edit,
  Inventory,
  SwapCalls,
  TrendingDown,
  TrendingUp,
  Warning,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import StatCard from "../UI/statCard/StatCard";
import CreateProductDrawer from "./products/CreateProductDrawer";
import { useProducts } from "../hooks/useProducts";

const StockPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openProduct, setOpenProduct] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );
  const limit = Number(searchParams.get("limit")) || 10;
  const page = Number(searchParams.get("page")) || 1;

  const { data } = useProducts({
    search: searchInput,
    page,
    limit,
  });

  const products = data?.products || [];
  const pagination = data?.pagination;

  const handleProductDrawer = () => {
    setOpenProduct((prev) => !prev);
  };

  const handlePagination = (model) => {
    setSearchParams((prev) => {
      prev.set("page", model.page + 1);
      prev.set("limit", model.pageSize);

      return prev;
    });
  };

  useEffect(() => {
    let timer = setTimeout(() => {
      setSearchParams((prev) => {
        if (searchInput) {
          prev.set("search", searchInput);
        } else {
          prev.delete("search");
        }

        return prev;
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleEditProduct = (product) => {
    console.log("Edit product:", product);
  };

  const handleDeleteProduct = (product) => {
    console.log("Delete product:", product);
  };

  const columns = [
    {
      field: "name",
      headerName: "Product",
      flex: 1.3,
      minWidth: 180,
    },

    {
      field: "sku",
      headerName: "SKU",
      flex: 1,
      minWidth: 140,
    },

    {
      field: "category",
      headerName: "Category",
      flex: 1,
      minWidth: 140,
    },

    {
      field: "brand",
      headerName: "Brand",
      flex: 1,
      minWidth: 140,
    },

    {
      field: "price",
      headerName: "Selling Price",
      flex: 0.9,
      minWidth: 130,

      renderCell: (params) => `₹${params.value}`,
    },

    {
      field: "costPrice",
      headerName: "Cost Price",
      flex: 0.9,
      minWidth: 130,

      renderCell: (params) => `₹${params.value}`,
    },

    {
      field: "unit",
      headerName: "Unit",
      flex: 0.7,
      minWidth: 90,
    },

    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      minWidth: 100,

      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "active" ? "success" : "default"}
          size='small'
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            size='small'
            color='primary'
            onClick={() => handleEditProduct(params.row)}>
            <Edit fontSize='small' />
          </IconButton>

          <IconButton
            size='small'
            color='error'
            onClick={() => handleDeleteProduct(params.row)}>
            <Delete fontSize='small' />
          </IconButton>
        </Box>
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
    <>
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
        {/* PAGE HEADER */}

        <Box sx={{ width: "100%", mb: 3 }}>
          <Typography variant='h4' fontWeight={700} sx={{ mb: 0.5 }}>
            Stock Management
          </Typography>

          <Typography variant='body1' color='text.secondary'>
            Manage inventory, track stock levels, and handle transfers
          </Typography>
        </Box>

        {/* TABS */}

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "grey.100",
            overflow: "hidden",
          }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant='scrollable'
            scrollButtons='auto'>
            <Tab label='Overview' />
            <Tab label='Products' />
            <Tab label='Stock Transfer' />
            <Tab label='Low Stock Alerts' />
          </Tabs>
        </Paper>

        {/* OVERVIEW */}

        {tabValue === 0 && (
          <>
            {/* STAT CARDS */}

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

            {/* OVERVIEW CONTENT */}

            <Paper
              elevation={0}
              sx={{
                width: "100%",
                mt: 3,
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "grey.100",
              }}>
              <Typography variant='h6' fontWeight={700}>
                Inventory Overview
              </Typography>

              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                View your inventory summary and stock information here.
              </Typography>
            </Paper>
          </>
        )}

        {/* PRODUCTS */}

        {tabValue === 1 && (
          <Box sx={{ width: "100%", mt: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mb: 2,
                gap: 1,
              }}>
              <TextField
                size='small'
                placeholder='Search product'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button
                variant='contained'
                startIcon={<Add />}
                onClick={handleProductDrawer}>
                Add Product
              </Button>
            </Box>

            <Paper
              elevation={0}
              sx={{
                width: "100%",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "grey.100",
                overflow: "hidden",
              }}>
              <Box sx={{ width: "100%", height: 500 }}>
                <DataGrid
                  rows={products}
                  columns={columns}
                  getRowId={(row) => row._id}
                  pagination
                  paginationMode='server'
                  rowCount={pagination?.total || 0}
                  paginationModel={{
                    page: page - 1,
                    pageSize: limit,
                  }}
                  onPaginationModelChange={handlePagination}
                  pageSizeOptions={[10, 25, 50]}
                  disableRowSelectionOnClick
                  sx={{
                    border: 0,
                  }}
                  initialState={{
                    pinnedColumns: {
                      left: ["name", "sku"],
                      right: ["actions"],
                    },
                  }}
                />
              </Box>
            </Paper>
          </Box>
        )}

        {/* STOCK TRANSFER */}

        {tabValue === 2 && (
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              mt: 3,
              p: 4,
              textAlign: "center",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "grey.100",
            }}>
            <SwapCalls
              sx={{
                fontSize: 48,
                color: "text.secondary",
                mb: 2,
              }}
            />

            <Typography variant='h6' fontWeight={700} gutterBottom>
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

        {/* LOW STOCK */}

        {tabValue === 3 && (
          <Box sx={{ width: "100%", mt: 3 }}>
            <Alert
              severity='warning'
              sx={{
                borderRadius: 3,
                mb: 3,
              }}>
              <Warning sx={{ mr: 1 }} />0 items need restocking
            </Alert>

            <Paper
              elevation={0}
              sx={{
                width: "100%",
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "grey.100",
              }}>
              <Typography variant='h6' fontWeight={700} gutterBottom>
                Low Stock Items
              </Typography>

              <Typography variant='body2' color='text.secondary'>
                No low stock items found.
              </Typography>
            </Paper>
          </Box>
        )}
      </Container>

      {/* ============================= */}
      {/* CREATE PRODUCT DRAWER */}
      {/* ============================= */}

      <CreateProductDrawer
        open={openProduct}
        handleClose={handleProductDrawer}
      />
    </>
  );
};

export default StockPage;
