import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Drawer,
  Tooltip,
} from "@mui/material";

// icons
import CloseIcon from "@mui/icons-material/CloseOutlined";

const DynamicDrawer = ({
  heading,
  buttonText,
  disableSubmit,
  submitClick,
  hasDrawerOpen,
  handleClose,
  sx,
  centerHead,
  hasDefaultActionButton = true,
  hasCustomActionButton = false,
  hasSecondaryHeader = false,
  children,
  noShadowForHeading = false,
  customWidth = "100%",
  contentHeight = "90%",
}) => {
  return (
    <Drawer
      anchor='right'
      open={hasDrawerOpen}
      onClose={handleClose}
      data-testid='dynamic-drawer'>
      {/* Drawer Header */}
      <Box
        sx={{
          boxShadow: noShadowForHeading ? "none" : "0px 2px 4px #3374B926",
          px: 2,
          py: 1.5,
        }}>
        <Box
          style={{
            display: "flex",
            alignItems: "center",
            width: customWidth,
            position: "relative",
          }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              // justifyContent: "center",
            }}>
            <Typography
              style={{ fontWeight: "600", flexShrink: 0, width: "90%" }}
              data-testid='drawer-heading'>
              {heading}
            </Typography>
            {/* secondary header */}
            {hasSecondaryHeader && <Box>{hasSecondaryHeader}</Box>}
          </Box>
          {centerHead && (
            <Box
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                justifyContent: "center",
                width: "100%",
              }}>
              {centerHead}
            </Box>
          )}
          <Tooltip title='Close' placement='left' arrow>
            <IconButton
              onClick={handleClose}
              style={{ position: "absolute", right: 0 }}>
              <CloseIcon sx={{ color: "#3374B9" }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Drawer Contents */}
      <Box
        sx={{
          px: 2,
          height: contentHeight,
          overflow: "scroll",
          minWidth: "40vw",
          ...sx,
        }}>
        <Box
          sx={{
            height: "100%",
            // overflow: "scroll",
          }}>
          {children}
        </Box>
      </Box>

      {/* Drawer Default action Buttons */}
      {hasDefaultActionButton && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            p: 2,
          }}>
          <Button
            variant='text'
            style={{ color: "#3374B9", marginRight: "8px" }}
            onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={submitClick}
            disabled={disableSubmit}
            data-testid='save'>
            {buttonText}
          </Button>
        </Box>
      )}

      {/* Drawer custom action Buttons */}
      {hasCustomActionButton && (
        <Box
          sx={{
            display: "flex",
            p: 2,
          }}>
          {hasCustomActionButton}
        </Box>
      )}
    </Drawer>
  );
};

export default DynamicDrawer;
