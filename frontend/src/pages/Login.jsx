import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { 
  Loader2, LogIn, User, Lock, 
  Eye, EyeOff, AlertCircle 
} from "lucide-react";
import bg from "../assets/QUimage.jpg";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const demoAccounts = [
    {
      label: "Student",
      identifier: import.meta.env.VITE_DEMO_STUDENT_IDENTIFIER || "student@example.com",
      password: import.meta.env.VITE_DEMO_STUDENT_PASSWORD || "Student@123",
    },
    {
      label: "Admin",
      identifier: import.meta.env.VITE_DEMO_ADMIN_IDENTIFIER || "admin@example.com",
      password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || "Admin@123",
    },
    {
      label: "Club",
      identifier: import.meta.env.VITE_DEMO_CLUB_IDENTIFIER || "CLBTEST1",
      password: import.meta.env.VITE_DEMO_CLUB_PASSWORD || "Club@123",
    },
  ];

  const [form, setForm] = useState({
    identifier: "",  // Q-ID or Email or Phone
    password: ""
  });

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleLogin(form);
  };

  const handleLogin = async (credentials) => {
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", credentials);

      // Save JWT & User
      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("user", JSON.stringify(res.data.user));

      // Role-based Navigation 
      const role = res.data.user.role;
      const destination = role === "admin" ? "/admin" : role === "club" ? "/club" : "/dashboard";
      navigate(destination);

    } catch (err) {
      if (err.response?.status === 403) {
        setError("Account not verified. Please verify your email/phone.");
      } else {
        setError(err.response?.data?.message || "Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#eef3f8] px-4 py-4 sm:px-8 lg:px-12 lg:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_rgba(16,42,67,0.14)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-[#102a43] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${bg})` }} />
          <div className="absolute inset-0 bg-gradient-to-br from-[#102a43] via-[#102a43]/90 to-[#0b7285]/70" />
          <div className="relative">
            <Link to="/dashboard" className="inline-flex items-center gap-3 text-lg font-bold tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-lg text-slate-950">Q</span>
              QuEventHub
            </Link>
            <div className="mt-24 max-w-sm">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Your campus, connected</p>
              <h1 className="font-['Space_Grotesk'] text-5xl font-bold leading-[1.04]">Make room for what matters.</h1>
              <p className="mt-6 leading-7 text-slate-200">Find events, meet new people, and stay close to the communities that make campus feel like yours.</p>
            </div>
          </div>
          <div className="relative flex items-center gap-3 text-sm text-slate-300">
            <span className="h-2 w-2 rounded-full bg-cyan-300" /> Discover more. Do more. Belong here.
          </div>
        </div>

        <div className="flex items-center p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-5">
              <Link to="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-700 lg:hidden">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">Q</span>
                QuEventHub
              </Link>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <LogIn size={23} />
              </div>
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-slate-950">Welcome back</h2>
              <p className="mt-1 text-slate-500">Sign in to continue your campus journey.</p>
            </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            
            {/* Identifier Input */}
            <div className="relative group">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Identifier <span className="text-red-500">*</span></label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Q-ID, Email, or Phone"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={form.identifier}
                onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Password <span className="text-red-500">*</span></label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Login Button */}
            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="mt-5">
            <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              Quick login
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <p className="mb-2 text-center text-xs text-slate-400">
              Use a demo account to preview a role
            </p>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  disabled={loading}
                  onClick={() => handleLogin(account)}
                  className="rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-5 flex flex-col items-center gap-1 text-sm text-slate-500">
            {/* FIX: Changed class to className */}
            <Link to="/forgot-password" className="text-slate-500 hover:text-blue-600 hover:underline transition-colors">
              Forgot your password?
            </Link>
            
            <div className="my-2 h-px w-full bg-slate-200"></div>
            
            <p>
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                Register Now
              </Link>
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}