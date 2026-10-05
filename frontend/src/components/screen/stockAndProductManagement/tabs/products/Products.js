import { Add, Delete, Edit } from "@mui/icons-material";
import { Box, Button, Chip, IconButton, Paper, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import React from "react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  useDeleteProduct,
  useProducts,
} from "../../../../../hooks/useProducts";
import { useEffect } from "react";
import { addNotification } from "../../../../../store/slices/uiSlice";
import CreateProductDrawer from "../../../../../pages/products/CreateProductDrawer";

const Products = () => {
  const [openProduct, setOpenProduct] = useState(false);
  const [rowData, setRowData] = useState(null);
  const [isEditMood, setIsEditMood] = useState(false);
  const dispatch = useDispatch();
  const deleteProductMutation = useDeleteProduct();
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
    setRowData(product);
    setIsEditMood(true);
    handleProductDrawer();
  };

  const handleDeleteProduct = async (product) => {
    try {
      await deleteProductMutation.mutateAsync(product._id);
      dispatch(
        addNotification({
          message: "Product updated successfully",
          type: "success",
        }),
      );
    } catch (error) {
      console.error(error);
    }
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
  return (
    <>
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

      <CreateProductDrawer
        open={openProduct}
        handleClose={handleProductDrawer}
        rowData={rowData}
        isEditMood={isEditMood}
      />
    </>
  );
};

export default Products;
