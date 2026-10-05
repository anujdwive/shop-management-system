import React from "react";
import { Box, Paper } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const StockTable = () => {
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

  return (
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
  );
};

export default StockTable;
