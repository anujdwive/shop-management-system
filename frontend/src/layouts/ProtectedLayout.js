import { Box } from "@mui/material";
import SideBar from "./SideBar";
import TopBar from "./TopBar";
import ProtectedRouteContent from "./ProtectedRouteContent";

const ProtectedLayout = () => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <SideBar />

      <Box sx={{ flexGrow: 1 }}>
        <TopBar />

        <ProtectedRouteContent />
      </Box>
    </Box>
  );
};

export default ProtectedLayout;
