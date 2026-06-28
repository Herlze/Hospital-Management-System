import { Outlet } from "react-router";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from "sonner";

export const RootLayout = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0a0e1a]">
        <Outlet />
        <Toaster position="top-right" richColors />
      </div>
    </AuthProvider>
  );
};
