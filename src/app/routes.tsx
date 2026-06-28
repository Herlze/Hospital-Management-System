import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ICUCentral from "./pages/ICUCentral";
import MedicalIoT from "./pages/MedicalIoT";
import MassCasualty from "./pages/MassCasualty";
import SmartFacility from "./pages/SmartFacility";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "dashboard",
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: "icu-central",
            element: <ICUCentral />,
          },
          {
            path: "medical-iot",
            element: <MedicalIoT />,
          },
          {
            path: "mass-casualty",
            element: <MassCasualty />,
          },
          {
            path: "smart-facility",
            element: <SmartFacility />,
          },
          {
            path: "settings",
            element: <Settings />,
          },
          {
            path: "profile",
            element: <UserProfile />,
          },
        ],
      },
    ],
  },
]);
