import { Box, Paper, Typography } from "@mui/material";
import React from "react";
import StatCard from "../../../../../UI/statCard/StatCard";
import {
  Inventory,
  SwapCalls,
  TrendingDown,
  TrendingUp,
} from "@mui/icons-material";

const Overview = () => {
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
  );
};

export default Overview;
