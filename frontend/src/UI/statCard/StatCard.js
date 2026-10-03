import { alpha, Box, Card, CardContent, Typography } from "@mui/material";
import React from "react";

const StatCard = ({ title, value, icon, color }) => {
  return (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        minWidth: 0,
        height: "100%",
        boxSizing: "border-box",

        borderRadius: 3,
        border: "1px solid",
        borderColor: "grey.100",
        backgroundColor: "#ffffff",

        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.03)",

        transition: "transform 0.2s, box-shadow 0.2s",

        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.06)",
        },
      }}>
      <CardContent
        sx={{
          p: 2.5,
          height: "100%",
          boxSizing: "border-box",

          "&:last-child": {
            pb: 2.5,
          },
        }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2.5,
            width: "100%",
          }}>
          {/* Icon */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              width: 52,
              height: 52,

              borderRadius: "50%",

              backgroundColor: alpha(color, 0.12),
              color: color,

              flexShrink: 0,
            }}>
            {React.cloneElement(icon, {
              sx: {
                fontSize: 26,
              },
            })}
          </Box>

          {/* Content */}
          <Box
            sx={{
              flexGrow: 1,
              minWidth: 0,

              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}>
            <Typography
              variant='body2'
              fontWeight='600'
              color='text.secondary'
              sx={{
                mb: 0.2,
                lineHeight: 1.2,
              }}>
              {title}
            </Typography>

            <Typography
              variant='h4'
              fontWeight='700'
              sx={{
                color: color,
                lineHeight: 1.1,
              }}>
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
