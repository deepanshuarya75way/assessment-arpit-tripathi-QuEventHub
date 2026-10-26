import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  BookOpen, 
  Calendar, 
  Hash, 
  BadgeCheck,
  Save,
  X
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    q_id: "",
    course: "",
    year: "",
    section: ""
  });
  
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch user profile (Logic unchanged)
  useEffect(() => {
    const fetchProfile = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await api.get("/user/me");
        const userData = res.data.user || res.data.data || res.data;
        
        if (!userData) throw new Error("No user data received");

        setUser(userData);
        setFormData({
          name: userData.name || "",
          q_id: userData.q_id || "",
          course: userData.course || "",
          year: userData.year || "",
          section: userData.section || ""
        });
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          navigate("/login");
        } else {
          setError(err.response?.data?.message || "Failed to load profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await api.put("/user/profile", formData);
      setUser(res.data.data);
      setMessage("Profile updated successfully!");
      
      const updatedUser = {
        id: res.data.data._id,
        name: res.data.data.name,
        q_id: res.data.data.q_id,
        email: res.data.data.email
      };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // Helper to get initials for Avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-red-500 font-semibold text-lg">Failed to load profile data.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          
          {/* Blue Gradient Section containing Info */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                {/* Avatar */}
                <div className="h-24 w-24 rounded-full bg-white p-1 shadow-lg flex-shrink-0">
                  <div className="h-full w-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold">
                    {getInitials(formData.name)}
                  </div>
                </div>
                
                {/* Name & Email (Now inside blue section) */}
                <div className="text-center sm:text-left text-white mb-2">
                  <h1 className="text-3xl font-bold tracking-tight">{formData.name || "Student"}</h1>
                  <p className="text-blue-100 text-sm mt-1 flex items-center justify-center sm:justify-start gap-2">
                    <Mail size={14} /> {user.email}
                  </p>
                </div>
            </div>
          </div>

          <div className="px-8 py-8">
            {/* Notifications */}
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded shadow-sm">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}
            {message && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 text-green-700 rounded shadow-sm">
                <p className="font-bold">Success</p>
                <p>{message}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Left Column: Personal & Account Info */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                            Contact Details
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Email Address</label>
                                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-2.5 opacity-70 cursor-not-allowed">
                                    <Mail size={16} className="text-gray-400 mr-3" />
                                    <span className="text-gray-600 text-sm truncate">{user.email}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Phone Number</label>
                                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-2.5 opacity-70 cursor-not-allowed">
                                    <Phone size={16} className="text-gray-400 mr-3" />
                                    <span className="text-gray-600 text-sm">{user.phone || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-4 italic">
                            * Contact details cannot be changed.
                        </p>
                    </div>
                </div>

                {/* Right Column: Editable Academic Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                           <User className="mr-2 text-blue-600" size={20} /> 
                           Academic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Q-ID</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <BadgeCheck className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="q_id"
                                        value={formData.q_id}
                                        onChange={handleChange}
                                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="12345678"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <BookOpen className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="course"
                                        value={formData.course}
                                        onChange={handleChange}
                                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="B.Tech"
                                    />
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="year"
                                        value={formData.year}
                                        onChange={handleChange}
                                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="2nd Year"
                                    />
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="section"
                                        value={formData.section}
                                        onChange={handleChange}
                                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="A"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex gap-4 border-t pt-6">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-sm transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin mr-2" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} className="mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="flex-none bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-6 rounded-lg transition-all flex items-center"
                            >
                                <X size={20} className="mr-2" />
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}