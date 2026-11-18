import React from "react";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PermIdentityOutlinedIcon from "@mui/icons-material/PermIdentityOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import StatCard from "../../../../../UI/statCard/StatCard";
import { Box, Button, Chip, IconButton, Paper, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Delete, Edit } from "@mui/icons-material";
import { useEmployees } from "../../../../../hooks/useEmployees";

const Employees = () => {
  const { data, isLoading } = useEmployees();

  // API response: { count: 2, team: [...] }
  const team = data?.team ?? [];

  // Statistics
  const totalManagers = team.filter(
    (member) => member.role === "manager",
  ).length;

  const totalWorkers = team.filter((member) => member.role === "worker").length;

  const activeShops = new Set(
    team.flatMap((member) =>
      (member.shops ?? [])
        .filter((shop) => shop.status === "active")
        .map((shop) => shop._id),
    ),
  ).size;

  const activeTeam = team.filter((member) => member.status === "active").length;

  const quickStats = [
    {
      title: "Total Managers",
      value: totalManagers,
      icon: <PeopleAltOutlinedIcon />,
      color: "#2e7d32",
    },
    {
      title: "Total Workers",
      value: totalWorkers,
      icon: <PermIdentityOutlinedIcon />,
      color: "#1565c0",
    },
    {
      title: "Active Shops",
      value: activeShops,
      icon: <StorefrontOutlinedIcon />,
      color: "#e65100",
    },
    {
      title: "Active Team",
      value: activeTeam,
      icon: <HowToRegOutlinedIcon />,
      color: "#7b1fa2",
    },
  ];

  // Convert API team members into DataGrid rows
  const rows = team.map((member) => ({
    ...member,
    empName: member.name,
    assignedShop: member.shops?.map((shop) => shop.name).join(", ") || "N/A",
    reportsTo: member.reportsTo?.name ?? "N/A",
    status: member.status,
  }));

  const columns = [
    {
      field: "empName",
      headerName: "Employee Name",
      minWidth: 180,
      flex: 1.2,
    },
    {
      field: "email",
      headerName: "Email",
      minWidth: 210,
      flex: 1.5,
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 140,
    },
    {
      field: "role",
      headerName: "Role",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size='small'
          color={params.value === "manager" ? "primary" : "default"}
          sx={{ textTransform: "capitalize" }}
        />
      ),
    },
    {
      field: "assignedShop",
      headerName: "Assigned Shop",
      minWidth: 170,
      flex: 1,
    },
    {
      field: "reportsTo",
      headerName: "Reports To",
      minWidth: 130,
      flex: 0.8,
    },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      renderCell: (params) => {
        const isActive = params.value === "active";

        return (
          <Chip
            label={params.value}
            size='small'
            color={isActive ? "success" : "default"}
            variant='outlined'
            sx={{ textTransform: "capitalize" }}
          />
        );
      },
    },
    {
      field: "invitationStatus",
      headerName: "Invitation",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value ?? "N/A"}
          size='small'
          color={
            params.value === "accepted"
              ? "success"
              : params.value === "pending"
                ? "warning"
                : "default"
          }
          sx={{ textTransform: "capitalize" }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 110,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton
            size='small'
            color='primary'
            onClick={() => console.log("Edit member:", params.row)}>
            <Edit fontSize='small' />
          </IconButton>

          <IconButton
            size='small'
            color='error'
            onClick={() => console.log("Delete member:", params.row)}>
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
          <Box key={stat.title} sx={{ width: "100%", minWidth: 0 }}>
            <StatCard {...stat} />
          </Box>
        ))}
      </Box>

      <Box sx={{ width: "100%", mt: 2 }}>
        {/* SEARCH AND CREATE TEAM MEMBER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: 2,
            gap: 1,
          }}>
          <TextField size='small' placeholder='Search employee' />

          <Button
            variant='contained'
            startIcon={<Add />}
            // onClick={handleAddEmployee}
          >
            Add Team Member
          </Button>
        </Box>

        {/* TEAM TABLE */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "grey.200",
            overflow: "hidden",
          }}>
          <Box sx={{ width: "100%", height: 500 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row._id}
              loading={isLoading}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 25]}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              sx={{
                border: 0,
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "grey.50",
                },
                "& .MuiDataGrid-cell": {
                  display: "flex",
                  alignItems: "center",
                },
              }}
            />
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default Employees;
