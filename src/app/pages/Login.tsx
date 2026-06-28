import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, UserRole } from "../context/AuthContext";
import { Heart, Eye, EyeOff, Lock, Mail, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

const roles: UserRole[] = [
  'Super Admin',
  'Hospital Administrator',
  'Doctor',
  'Nurse',
  'ICU Staff',
  'Emergency Staff',
  'Ambulance Staff',
  'Biomedical Engineer',
  'IoT Engineer',
  'Security Officer',
  'Housekeeping Staff',
  'Facility Manager',
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("Doctor");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    
    try {
      const success = await login(email, password, selectedRole);
      if (success) {
        toast.success("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } else {
        toast.error("Invalid credentials. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0ea5e9] opacity-20 rounded-full filter blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#06b6d4] opacity-20 rounded-full filter blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#10b981] opacity-20 rounded-full filter blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-[rgba(15,23,42,0.8)] border border-[rgba(148,163,184,0.2)] rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#06b6d4] flex items-center justify-center shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#10b981] rounded-full border-4 border-[#0a0e1a]"></div>
            </div>
            <h1 className="text-2xl font-bold text-white">MediCore Hospital</h1>
            <p className="text-[#94a3b8] text-sm mt-1">Smart Hospital Management System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm text-white mb-2">Role</label>
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white appearance-none focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[rgba(14,165,233,0.2)] transition-all"
                >
                  {roles.map((role) => (
                    <option key={role} value={role} className="bg-[#1e293b]">
                      {role}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94a3b8] pointer-events-none" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-white mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[rgba(14,165,233,0.2)] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-white mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.2)] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[rgba(14,165,233,0.2)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#94a3b8] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[rgba(148,163,184,0.2)] bg-[rgba(30,41,59,0.5)] text-[#0ea5e9] focus:ring-2 focus:ring-[rgba(14,165,233,0.2)]"
                />
                <span className="text-sm text-[#94a3b8]">Remember me</span>
              </label>
              <button type="button" className="text-sm text-[#0ea5e9] hover:text-[#38bdf8] transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#0ea5e9] to-[#06b6d4] text-white rounded-lg font-medium shadow-lg shadow-[rgba(14,165,233,0.3)] hover:shadow-xl hover:shadow-[rgba(14,165,233,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </motion.button>
          </form>

          {/* Quick Login Info */}
          <div className="mt-6 p-4 backdrop-blur-lg bg-[rgba(14,165,233,0.1)] rounded-lg border border-[rgba(14,165,233,0.3)]">
            <p className="text-xs text-[#94a3b8] mb-2">Quick Login: Enter any email/password</p>
            <p className="text-xs text-[#0ea5e9]">Demo: admin@medicore.com / password</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
