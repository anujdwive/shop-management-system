import { Warning } from "@mui/icons-material";
import { Alert, Box, Paper, Typography } from "@mui/material";
import React from "react";

const LowStock = () => {
  return (
    <>
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
    </>
  );
};

export default LowStock;
