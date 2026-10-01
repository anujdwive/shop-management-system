import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Notifications from "../components/Notifications";

const ProtectedRouteContent = () => {
  return (
    <Box
      component='main'
      sx={{
        flexGrow: 1,
        minWidth: 0,
        minHeight: "100vh",
        pt: "64px",
        overflowX: "hidden",
      }}>
      <Box
        sx={{
          width: "100%",
          minHeight: "calc(100vh - 64px)",
        }}>
        <Outlet />
      </Box>

      <Notifications />
    </Box>
  );
};

export default ProtectedRouteContent;
