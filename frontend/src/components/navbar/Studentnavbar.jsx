import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { extendTheme, useColorScheme } from "@mui/material/styles";
import SubjectIcon from "@mui/icons-material/Subject";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";
import PreviewOutlinedIcon from "@mui/icons-material/PreviewOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import SchoolIcon from '@mui/icons-material/School';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { AppProvider } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { Divider, ListItemIcon, ListItemText, MenuItem, MenuList } from "@mui/material";

import Profile from "../../pages/profile/Profile";
import Courses from "../../pages/courses/Courses";
import SlotBooking from "../../pages/slotbooking/SlotBooking";
import Codereview from "../../pages/codereview/Codereview";

const NAVIGATION = [
  { segment: "dashboard", title: "Dashboard", icon: <DashboardIcon /> },
  { segment: "courses", title: "Courses", icon: <SubjectIcon /> },
  { segment: "slotbooking", title: "SlotBooking", icon: <AppRegistrationIcon /> },
  { segment: "codereview", title: "Codereview", icon: <PreviewOutlinedIcon /> },
];

const demoTheme = extendTheme({
  colorSchemes: { light: {}, dark: {} },
  colorSchemeSelector: "class",
  breakpoints: {
    values: { xs: 0, sm: 600, md: 600, lg: 1200, xl: 1536 },
  },
});

function useDemoRouter(initialPath) {
  const [pathname, setPathname] = React.useState(initialPath === "/" ? "/dashboard" : initialPath);
  const router = React.useMemo(() => ({
    pathname,
    searchParams: new URLSearchParams(),
    navigate: (path) => setPathname(String(path)),
  }), [pathname]);
  return router;
}

function renderPage(pathname) {
  switch (pathname) {
    case "/":
      return <Profile />;
    case "/dashboard":
      return <Profile />;
    case "/courses":
      return <Courses />;
    case "/slotbooking":
      return <SlotBooking />;
    case "/codereview":
      return <Codereview />;
    default:
      return <h1>Page Not Found</h1>;
  }
}

export const FOOTER = ({ mini }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/", { replace: true });
  };
  return (
    <MenuList
      sx={{
        position: "fixed",
        padding: 0,
        bottom: 0,
        width: mini ? "63px" : "200px",
      }}
    >
      <Divider />
      <MenuItem onClick={handleLogout} sx={{ margin: 1, padding: 1.2, borderRadius: 2 }}>
        <ListItemIcon sx={{ minWidth: mini ? "auto" : 40, justifyContent: "center" }}>
          <LogoutIcon />
        </ListItemIcon>
        {!mini && <ListItemText primary="Logout" sx={{ marginLeft: 1.8 }} />}
      </MenuItem>
    </MenuList>
  );
};

function ThemeBasedLogo() {
  const { mode } = useColorScheme();
  const color = mode === "dark" ? "#90caf9" : "#1976d2";
  return <SchoolIcon style={{ color, marginTop: 4.5, fontSize: 30 }} />;
}

export default function Studentnavbar() {
  const router = useDemoRouter("/");
  const location = useLocation();
  const navigate = useNavigate();
  const [openSnackbar, setOpenSnackbar] = React.useState(false);

  React.useEffect(() => {
    if (location.state?.loginSuccess) {
      setOpenSnackbar(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpenSnackbar(false);
  };

  return (
    <>
      <AppProvider
        navigation={NAVIGATION}
        router={router}
        theme={demoTheme}
        branding={{
          logo: <ThemeBasedLogo />,
          title: "Personalized Skill",
          homeUrl: "/dashboard",
        }}
      >
        <DashboardLayout
          sidebarExpandedWidth={200}
          slots={{ sidebarFooter: ({ mini }) => <FOOTER mini={mini} /> }}
          sx={{ padding: 0, paddingTop: 0 }}
        >
          {renderPage(router.pathname)}
        </DashboardLayout>
      </AppProvider>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={1000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleClose} severity="success" variant="filled" sx={{ width: '100%' }}>
          Logged in successfully!
        </Alert>
      </Snackbar>
    </>
  );
}
