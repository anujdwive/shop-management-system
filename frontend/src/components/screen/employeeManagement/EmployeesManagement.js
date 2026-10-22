import { Box, Container, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";

// Tabs
import Attendance from "./tabs/attendance/Attendance";
import Employees from "./tabs/employees/Employees";
import Performance from "./tabs/performance/Performance";
import Sales from "./tabs/sales/Sales";

const tabs = [
  {
    label: "Employees ",
    component: <Employees />,
  },
  {
    label: "Attendance",
    component: <Attendance />,
  },
  {
    label: "Performance",
    component: <Performance />,
  },
  {
    label: "Sales",
    component: <Sales />,
  },
];

const EmployeesManagement = () => {
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
          Employee Management
        </Typography>

        <Typography variant='body1' color='text.secondary'>
          Manage staff, track attendance, and monitor performance
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

export default EmployeesManagement;
