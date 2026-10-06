import { Box } from "@mui/material";
import SideBar from "./SideBar";
import TopBar from "./TopBar";
import ProtectedRouteContent from "./ProtectedRouteContent";

const ProtectedLayout = () => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", maxWidth: "100vw" }}>
      <SideBar />

      {/* Added minWidth: 0 and overflow: "hidden" to prevent child contents from blowing out the viewport width */}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
        <TopBar />

        {/* Added standard padding or container settings if needed */}
        <Box sx={{ flexGrow: 1, overflow: "auto", p: 3 }}>
          <ProtectedRouteContent />
        </Box>
      </Box>
    </Box>
  );
};

export default ProtectedLayout;
