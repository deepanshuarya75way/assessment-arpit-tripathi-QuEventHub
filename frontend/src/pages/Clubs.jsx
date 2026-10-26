import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import { showToast } from "../utils/toast";
import { 
  Loader2, 
  Calendar, 
  MapPin, 
  Clock, 
  Search, 
  Users, 
  ArrowRight,
  Filter,
  Check
} from "lucide-react";

const categoryFilters = ["all", "technical", "cultural", "sports", "arts", "music"];

const clubFallbackColors = {
  technical: "from-violet-600 via-fuchsia-500 to-pink-500",
  cultural: "from-rose-600 via-pink-500 to-orange-400",
  sports: "from-orange-500 via-amber-500 to-yellow-400",
  arts: "from-indigo-600 via-purple-500 to-fuchsia-400",
  music: "from-cyan-600 via-teal-500 to-emerald-400",
};

const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [filteredClubs, setFilteredClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinLoadingId, setJoinLoadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const { search } = useLocation();
  const category = new URLSearchParams(search).get("type") || "all";
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "null");

  const hasJoinedClub = (club) => {
    const userId = currentUser?.id || currentUser?._id;
    return Boolean(userId && club.members?.some((member) => {
      const memberId = typeof member === "object" ? member._id || member.id : member;
      return String(memberId) === String(userId);
    }));
  };

  // Initial Fetch
  useEffect(() => {
    fetchClubs();
  }, []);

  // Filter Logic (Category + Search)
  useEffect(() => {
    let result = clubs;

    // 1. Filter by Category
    if (category !== "all") {
      result = result.filter(
        (club) => club.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // 2. Filter by Search Term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(club => 
        club.name.toLowerCase().includes(lowerSearch) || 
        club.description?.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredClubs(result);
  }, [clubs, category, searchTerm]);

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/clubs");
      const fetchedClubs = res.data.data || res.data || [];
      setClubs(fetchedClubs);
      setFilteredClubs(fetchedClubs);
    } catch (error) {
      console.error("Error fetching clubs:", error);
      showToast("Unable to load clubs right now. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClub = async (e, clubId) => {
    e.preventDefault(); // Prevent Link navigation if inside a Link
    e.stopPropagation();

    if (!sessionStorage.getItem("token")) {
      showToast("Please login to join a club.", "info");
      navigate("/login", { state: { from: `/clubs/${clubId}` } });
      return;
    }

    try {
      setJoinLoadingId(clubId);
      const res = await api.post(`/clubs/${clubId}/join`);
      showToast(res.data.message || "Joined club successfully!", "success");
      // Optional: Refetch to update member counts if your API returns that
      fetchClubs();
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || "Could not join club.";
      if (status === 401) {
        navigate("/login", { state: { from: `/clubs/${clubId}` } });
      } else {
        showToast(message, "info");
      }
    } finally {
      setJoinLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Page Header */}
      <div className="text-center mb-12 mt-5">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Campus <span className="text-purple-600">Clubs</span> & Communities
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Find your tribe. Join a community that shares your passion, from coding to creativity.
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto mb-12 space-y-6">
        
        {/* Search Bar */}
        <div className="relative max-w-lg mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-full leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm transition-all"
                placeholder="Search clubs by name or interest..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap justify-center gap-2">
            {categoryFilters.map((cat) => (
                <button
                    key={cat}
                    onClick={() => navigate(`/clubs?type=${cat}`)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 capitalize ${
                        category === cat
                            ? "bg-purple-600 text-white shadow-md ring-2 ring-purple-600 ring-offset-2"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-600">Community directory</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Find your people</h2>
          </div>
          <span className="hidden text-sm text-slate-500 sm:block">Explore communities built around your interests</span>
        </div>
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={48} className="animate-spin text-purple-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading communities...</p>
           </div>
        ) : filteredClubs.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <Filter className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No clubs found</h3>
                <p className="text-gray-500 max-w-sm mb-6">
                    We couldn't find any clubs matching your criteria. Try selecting a different category.
                </p>
                <button 
                    onClick={() => { setSearchTerm(""); navigate("/clubs?type=all"); }}
                    className="text-purple-600 font-medium hover:underline"
                >
                    View all clubs
                </button>
           </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredClubs.map((club) => {
              const imageSrc = club.imageUrl || club.image?.path;
              const joined = hasJoinedClub(club);
              
              return (
                <div
                  key={club._id}
                  className="uniform-card group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
                >
                  {/* Image Header */}
                  <div className="uniform-card-media relative overflow-hidden bg-gray-100">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={club.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${clubFallbackColors[club.category?.toLowerCase()] || "from-purple-600 to-pink-600"}`}>
                        <Users className="text-white/30 w-16 h-16" />
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-black/50 text-white backdrop-blur-md uppercase tracking-wider">
                            {club.category || "General"}
                        </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="uniform-card-body flex-grow p-4">
                    <h2 className="mb-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-purple-700">
                      {club.name}
                    </h2>

                    <div className="mb-3 space-y-1.5">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                        <span className="truncate">{club.meeting || "Meeting TBD"}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                         <Clock className="w-4 h-4 mr-2 text-purple-500" />
                         <span>{club.time || "Time TBD"}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-2 text-pink-500" />
                        <span className="truncate">{club.venue || "Venue TBD"}</span>
                      </div>
                    </div>

                    <p className="mb-4 line-clamp-2 flex-grow text-sm text-gray-600">
                      {club.description}
                    </p>

                    {/* Action Footer */}
                    <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                      <Link
                        to={`/clubs/${club._id}`}
                        className="flex items-center justify-center w-full py-2.5 bg-gray-50 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        View Details
                      </Link>
                      
                      <button
                        onClick={(e) => handleJoinClub(e, club._id)}
                        disabled={joined || joinLoadingId === club._id}
                        className={`flex items-center justify-center w-full rounded-lg py-2.5 font-medium transition-all disabled:cursor-not-allowed ${
                          joined
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "bg-purple-600 text-white shadow-md hover:bg-purple-700 hover:shadow-lg disabled:opacity-70"
                        }`}
                      >
                        {joinLoadingId === club._id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : joined ? (
                          <>
                            <Check size={17} className="mr-1" /> Joined
                          </>
                        ) : (
                          <>
                            Join <ArrowRight size={16} className="ml-1" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clubs;