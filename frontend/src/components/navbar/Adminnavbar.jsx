import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { extendTheme } from "@mui/material/styles";
import CrisisAlertIcon from "@mui/icons-material/CrisisAlert";
import RotateRightIcon from '@mui/icons-material/RotateRight';
import PreviewOutlinedIcon from "@mui/icons-material/PreviewOutlined";
import PlaylistAddRoundedIcon from "@mui/icons-material/PlaylistAddRounded";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import HistoryIcon from '@mui/icons-material/History';
import { AppProvider } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { FOOTER } from "./Studentnavbar";

import Review from "../../pages/review/Review";
import Addcourses from "../../pages/addcourses/Addcourses";
import Progress from "../../pages/progress/Progress";
import Slowprogress from "../../pages/slowprogress/Slowprogress";
import History from "../../pages/History/History";

import { useColorScheme } from "@mui/material";

const NAVIGATION = [
  {
    segment: "addcourses",
    title: "Add Courses",
    icon: <PlaylistAddRoundedIcon />,
  },
  { segment: "review", title: "Review", icon: <PreviewOutlinedIcon /> },
  { segment: "progress", title: "Progress", icon: <CrisisAlertIcon /> },
  { segment: "slowprogress", title: "Slowprogress", icon: <RotateRightIcon /> },
  {
    segment: "history",
    title: "History",
    icon: <HistoryIcon />,
  },
];

const demoTheme = extendTheme({
  colorSchemes: { light: true, dark: true },
  colorSchemeSelector: "class",
  breakpoints: {
    values: { xs: 0, sm: 600, md: 600, lg: 1200, xl: 1536 },
  },
});

function useDemoRouter(initialPath) {
  const [pathname, setPathname] = React.useState(initialPath);

  const router = React.useMemo(
    () => ({
      pathname,
      searchParams: new URLSearchParams(),
      navigate: (path) => setPathname(String(path)),
    }),
    [pathname]
  );

  return router;
}

function renderPage(pathname) {
  switch (pathname) {
    case "/":
      return <Addcourses />;
    case "/addcourses":
      return <Addcourses />;
    case "/review":
      return <Review />;
    case "/progress":
      return <Progress />;
    case "/slowprogress":
      return <Slowprogress />;
    case "/history":
      return <History />;
    default:
      return <h1>Page Not Found</h1>;
  }
}

function ThemeBasedLogo() {
  const { mode } = useColorScheme();
  const color = mode === "dark" ? "#90caf9" : "#1976d2";
  return (
    <AdminPanelSettingsOutlinedIcon
      style={{ color, marginTop: 4.5, fontSize: 30 }}
    />
  );
}

export default function Adminnavbar() {
  const router = useDemoRouter("/addcourses");
  const location = useLocation();
  const navigate = useNavigate();

  const [showSnackbar, setShowSnackbar] = React.useState(false);

  React.useEffect(() => {
    if (location.state?.loginSuccess) {
      setShowSnackbar(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    setShowSnackbar(false);
  };

  return (
    <>
      <AppProvider
        navigation={NAVIGATION}
        router={router}
        theme={demoTheme}
        branding={{
          logo: <ThemeBasedLogo />,
          title: "Admin",
          homeUrl: "/addcourses",
        }}
      >
        <DashboardLayout
          sidebarExpandedWidth={200}
          slots={{ sidebarFooter: ({ mini }) => <FOOTER mini={mini} /> }}
        >
          {renderPage(router.pathname)}
        </DashboardLayout>
      </AppProvider>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={1000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Logged in as Admin successfully!
        </Alert>
      </Snackbar>
    </>
  );
}
