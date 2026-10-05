import { SwapCalls } from "@mui/icons-material";
import { Button, Paper, Typography } from "@mui/material";
import React from "react";

const StockTransfer = () => {
  return (
    <>
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
    </>
  );
};

export default StockTransfer;
