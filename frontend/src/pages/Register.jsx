import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Register, 2: Verify OTP
  
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", q_id: "", 
    course: "", year: "", section: "", 
    password: "", confirmPassword: ""
  });
  
  const [otpData, setOtpData] = useState({ userId: null, emailOtp: "", phoneOtp: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Helper to save data and redirect
  const handleLoginSuccess = (data) => {
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user || {}));
    setMessage("Verification Complete! Redirecting...");
    setTimeout(() => {
        navigate("/");
    }, 1000);
  };

  const handleResend = async (type) => {
    setError("");
    setMessage("");
    try {
        await api.post("/auth/resend", { userId: otpData.userId, type });
        setMessage(`New ${type} OTP sent!`);
    } catch (err) {
        setError(err.response?.data?.message || `Failed to resend ${type} OTP.`);
    }
  };

  // Step 1: Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/register", formData);
      setOtpData(prev => ({ ...prev, userId: res.data.userId }));
      setMessage(res.data.message || "Registration successful! Please check your Email and WhatsApp.");
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || 
                  err.response?.data?.errors || 
                  err.response?.data?.error || 
                  "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP Verification
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!otpData.emailOtp && !otpData.phoneOtp) {
      setError("Please enter at least one OTP.");
      setLoading(false);
      return;
    }

    let successMessages = [];

    try {
      // 1. Verify Email OTP
      if (otpData.emailOtp) {
        try {
          const res = await api.post("/auth/verify", {
            userId: otpData.userId,
            otp: otpData.emailOtp,
            type: "email",
          });
          successMessages.push("Email Verified");
          
          if (res.data.status === "fully_verified") {
             handleLoginSuccess(res.data);
             return; 
          }
        } catch {
          // Removed unused "innerErr" variable here
          setError(prev => (prev ? prev + " | " : "") + "Email OTP Invalid");
        }
      }

      // 2. Verify Phone OTP
      if (otpData.phoneOtp) {
        try {
          const res = await api.post("/auth/verify", {
            userId: otpData.userId,
            otp: otpData.phoneOtp,
            type: "phone",
          });
          successMessages.push("Phone Verified");

          if (res.data.status === "fully_verified") {
             handleLoginSuccess(res.data);
             return;
          }
        } catch {
           // Removed unused "innerErr" variable here
          setError(prev => (prev ? prev + " | " : "") + "Phone OTP Invalid");
        }
      }

      if (successMessages.length > 0) {
        setMessage(successMessages.join(" & ") + " Successfully!");
      }

    } catch {
      setError("Verification process failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white shadow-xl rounded-xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-center text-slate-800">
                {step === 1 ? "Student Registration" : "Verify Account"}
            </h2>
            
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded mb-4 text-sm">
                    <strong>Error: </strong> {error}
                </div>
            )}
            {message && (
                <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded mb-4 text-sm">
                    <strong>Success: </strong> {message}
                </div>
            )}

            {step === 1 ? (
                <form onSubmit={handleRegister} className="flex flex-col gap-3">
                    <label className="text-xs font-semibold text-slate-600">Full Name <span className="text-red-500">*</span></label><input 
                      name="name" type="text" placeholder="Full Name" required 
                      value={formData.name} onChange={handleChange} 
                      className="p-3 border rounded focus:ring-2 focus:ring-green-500 outline-none" 
                    />
                    <label className="text-xs font-semibold text-slate-600">Email <span className="text-red-500">*</span></label><input 
                      name="email" type="email" placeholder="Email" required 
                      value={formData.email} onChange={handleChange} 
                      className="p-3 border rounded focus:ring-2 focus:ring-green-500 outline-none" 
                    />
                    <label className="text-xs font-semibold text-slate-600">Phone <span className="text-red-500">*</span></label><input 
                      name="phone" type="tel" placeholder="Phone Number" required 
                      value={formData.phone} onChange={handleChange} 
                      className="p-3 border rounded focus:ring-2 focus:ring-green-500 outline-none" 
                    />
                    <div className="flex gap-2">
                        <label className="text-xs font-semibold text-slate-600">Q-ID <span className="text-red-500">*</span></label><input 
                          name="q_id" type="text" placeholder="Q-ID" required 
                          value={formData.q_id} onChange={handleChange} 
                          className="p-3 border rounded w-1/2 focus:ring-2 focus:ring-green-500 outline-none" 
                        />
                        <label className="text-xs font-semibold text-slate-600">Section <span className="text-red-500">*</span></label><input 
                          name="section" type="text" placeholder="Section" required 
                          value={formData.section} onChange={handleChange} 
                          className="p-3 border rounded w-1/2 focus:ring-2 focus:ring-green-500 outline-none" 
                        />
                    </div>
                    <div className="flex gap-2">
                        <label className="text-xs font-semibold text-slate-600">Course <span className="text-red-500">*</span></label><input 
                          name="course" type="text" placeholder="Course" required 
                          value={formData.course} onChange={handleChange} 
                          className="p-3 border rounded w-1/2 focus:ring-2 focus:ring-green-500 outline-none" 
                        />
                        <label className="text-xs font-semibold text-slate-600">Year <span className="text-red-500">*</span></label><input 
                          name="year" type="text" placeholder="Year" required 
                          value={formData.year} onChange={handleChange} 
                          className="p-3 border rounded w-1/2 focus:ring-2 focus:ring-green-500 outline-none" 
                        />
                    </div>
                    <label className="text-xs font-semibold text-slate-600">Password <span className="text-red-500">*</span></label><input 
                      name="password" type="password" placeholder="Password" required 
                      value={formData.password} onChange={handleChange} 
                      className="p-3 border rounded focus:ring-2 focus:ring-green-500 outline-none" 
                    />
                    <label className="text-xs font-semibold text-slate-600">Confirm Password <span className="text-red-500">*</span></label><input 
                      name="confirmPassword" type="password" placeholder="Confirm Password" required 
                      value={formData.confirmPassword} onChange={handleChange} 
                      className="p-3 border rounded focus:ring-2 focus:ring-green-500 outline-none" 
                    />
                    
                    <button type="submit" disabled={loading} className="bg-green-600 text-white p-3 rounded flex justify-center items-center hover:bg-green-700 transition">
                        {loading ? <Loader2 size={20} className="animate-spin" /> : "Register & Send OTP"}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerify} className="flex flex-col gap-4">
                    <div className="bg-slate-50 p-4 rounded border">
                        <h3 className="text-lg font-semibold mb-2">Email Verification</h3>
                        <input 
                            type="text" placeholder="Enter Email OTP" 
                            value={otpData.emailOtp} 
                            onChange={(e) => setOtpData({ ...otpData, emailOtp: e.target.value })} 
                            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                        <button type="button" onClick={() => handleResend('email')} className="text-sm text-blue-500 hover:text-blue-700 mt-2">
                            Resend Email OTP
                        </button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded border">
                        <h3 className="text-lg font-semibold mb-2">Phone Verification (WhatsApp)</h3>
                        <input 
                            type="text" placeholder="Enter Phone OTP" 
                            value={otpData.phoneOtp} 
                            onChange={(e) => setOtpData({ ...otpData, phoneOtp: e.target.value })} 
                            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                        <button type="button" onClick={() => handleResend('phone')} className="text-sm text-blue-500 hover:text-blue-700 mt-2">
                            Resend Phone OTP
                        </button>
                    </div>

                    <button type="submit" disabled={loading} className="bg-blue-600 text-white p-3 rounded flex justify-center items-center mt-2 hover:bg-blue-700 transition">
                        {loading ? <Loader2 size={20} className="animate-spin" /> : "Verify & Complete Registration"}
                    </button>
                </form>
            )}
        </div>
    </div>
  );
}