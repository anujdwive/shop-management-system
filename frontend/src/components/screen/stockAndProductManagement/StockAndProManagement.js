import { Box, Container, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";

// Tabs
import LowStock from "./tabs/lowStock/LowStock";
import Overview from "./tabs/overview/Overview";
import Products from "./tabs/products/Products";
import StockTable from "./tabs/stockTable/StockTable";
import StockTransfer from "./tabs/stockTransfer/StockTransfer";

const tabs = [
  {
    label: "Overview",
    component: <Overview />,
  },
  {
    label: "Stock",
    component: <StockTable />,
  },
  {
    label: "Products",
    component: <Products />,
  },
  {
    label: "Stock Transfer",
    component: <StockTransfer />,
  },
  {
    label: "Low Stock Alerts",
    component: <LowStock />,
  },
];

const StockAndProManagement = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
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
      }}>
      {/* PAGE HEADER */}

      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' fontWeight={700}>
          Stock Management
        </Typography>

        <Typography variant='body1' color='text.secondary'>
          Manage inventory, track stock levels, and handle transfers
        </Typography>
      </Box>

      {/* TABS */}

      <Box
      // sx={{
      //   borderBottom: 1,
      //   borderColor: "divider",
      // }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons='auto'>
          {tabs.map((tab) => (
            <Tab key={tab.label} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* TAB CONTENT */}

      <Box sx={{ mt: 3 }}>{tabs[selectedTab].component}</Box>
    </Container>
  );
};

export default StockAndProManagement;
