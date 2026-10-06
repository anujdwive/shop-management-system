import React from "react";
import { Box, Button, Paper, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AdjustStockDrawer from "./adjustStockDrawer/AdjustStockDrawer";
import { Add } from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useStock } from "../../../../../hooks/useStock";

const StockTable = () => {
  const [openStock, setOpenStock] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );

  const { data } = useStock();

  console.log(data);

  const rows = [];

  const columns = [
    {
      field: "product",
      headerName: "Product",
      flex: 1.3,
      minWidth: 180,
    },
    {
      field: "sku",
      headerName: "SKU",
      flex: 1,
      minWidth: 130,
    },
    {
      field: "shop",
      headerName: "Shop",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "quantity",
      headerName: "Current Stock",
      flex: 1,
      minWidth: 140,
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
      minWidth: 120,
    },
    {
      field: "lastUpdated",
      headerName: "Last Updated",
      flex: 1,
      minWidth: 150,
    },
  ];

  const handleStockDrawer = () => {
    setOpenStock((prev) => !prev);
  };

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
            onClick={handleStockDrawer}>
            Add Stock
          </Button>
        </Box>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "grey.100",
            overflow: "hidden",
          }}>
          <Box sx={{ width: "100%", height: 500 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row._id}
              disableRowSelectionOnClick
              sx={{
                border: 0,
              }}
            />
          </Box>
        </Paper>
      </Box>

      <AdjustStockDrawer open={openStock} handleClose={handleStockDrawer} />
    </>
  );
};

export default StockTable;
