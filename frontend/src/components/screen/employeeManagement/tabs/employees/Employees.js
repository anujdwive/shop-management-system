import React from "react";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PermIdentityOutlinedIcon from "@mui/icons-material/PermIdentityOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import StatCard from "../../../../../UI/statCard/StatCard";
import { Box, Button, IconButton, Paper, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Delete, Edit } from "@mui/icons-material";

const Employees = () => {
  const quickStats = [
    {
      title: "Total Managers",
      value: "₹0",
      icon: <PeopleAltOutlinedIcon />,
      color: "#2e7d32",
    },

    {
      title: "Total Workers",
      value: "0",
      icon: <PermIdentityOutlinedIcon />,
      color: "#1565c0",
    },

    {
      title: "Active Shops",
      value: "0",
      icon: <StorefrontOutlinedIcon />,
      color: "#e65100",
    },

    {
      title: "Active Team",
      value: "0",
      icon: <HowToRegOutlinedIcon />,
      color: "#7b1fa2",
    },
  ];

  const rows = [];

  const columns = [
    {
      field: "empName",
      headerName: "EmpName",
      //   flex: 1.3,
      //   minWidth: 180,
    },
    {
      field: "role",
      headerName: "Role",
      //   flex: 1,
      //   minWidth: 130,
    },
    {
      field: "assignedShop",
      headerName: "Assigned Shop",
      //   flex: 1,
      //   minWidth: 150,
    },
    {
      field: "reportsTo",
      headerName: "Reports To",
      //   flex: 1,
      //   minWidth: 140,
    },

    {
      field: "actions",
      headerName: "Actions",
      //   flex: 1,
      //   minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            size='small'
            color='primary'
            // onClick={() => handleEditProduct(params.row)}
          >
            <Edit fontSize='small' />
          </IconButton>

          <IconButton
            size='small'
            color='error'
            // onClick={() => handleDeleteProduct(params.row)}
          >
            <Delete fontSize='small' />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
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
      <Box sx={{ width: "100%", mt: 1 }}>
        {/* SEARCH AND CREATE EMPLOYEE */}
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
            // value={searchInput}
            // onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button
            variant='contained'
            startIcon={<Add />}
            // onClick={handleStockDrawer}
          >
            Add Stock
          </Button>
        </Box>

        {/* EMPLOYEES TABLE */}
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
    </>
  );
};

export default Employees;
