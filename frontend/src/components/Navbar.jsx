import React, { useState, useEffect } from "react";
import { Link, NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  User, 
  Calendar, 
  Users, 
  Home, 
  Phone
} from "lucide-react";

const MotionDiv = motion.div;

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const navigate = useNavigate();

  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check Authentication
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = sessionStorage.getItem("token");
        setLoggedIn(!!token);
        if (token) {
          const rawUser = sessionStorage.getItem("user");
          if (rawUser) {
            const parsed = JSON.parse(rawUser);
            setRole(parsed?.role || null);
          } else {
            setRole(null);
          }
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('Error checking auth in Navbar:', error);
        setLoggedIn(false);
        setRole(null);
      }
    };
    checkAuth();
    
    try {
      window.addEventListener('storage', checkAuth);
      // Also check periodically for same-tab changes
      const interval = setInterval(checkAuth, 1000);
      return () => {
        window.removeEventListener('storage', checkAuth);
        clearInterval(interval);
      };
    } catch (error) {
      console.error('Error setting up Navbar auth listeners:', error);
    }
  }, []);

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      setLoggedIn(false);
      setRole(null);
      setProfileOpen(false);
      setMobileMenuOpen(false);
      navigate("/login");
    } catch (error) {
      console.error('Error during logout:', error);
      navigate("/login");
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-[#0b1a33]/90 backdrop-blur-md shadow-lg py-3" 
            : "bg-[#0b1a33] py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          
          {/* Logo */}
          <Link to="/dashboard" className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            <span className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm">Q</span>
            QuEventHub
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {role === "admin" ? (
              <>
                <NavLink to="/admin">Admin Overview</NavLink>
                <NavLink to="/admin/clubs">Manage Clubs</NavLink>
              </>
            ) : role === "club" ? (
              <>
                <NavLink to="/club">Club Dashboard</NavLink>
                <NavLink to="/events">Public Events</NavLink>
                <NavLink to="/clubs">Campus Clubs</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/dashboard">Student Dashboard</NavLink>
                {/* Events Dropdown */}
                <FlyoutLink 
                  title="Events" 
                  items={[
                    { name: "Seminars", href: "/events?type=seminars" },
                    { name: "Workshops", href: "/events?type=workshops" },
                    { name: "Fests", href: "/events?type=fest" },
                    { name: "Sports", href: "/events?type=sports" },
                  ]}
                />

                {/* Clubs Dropdown */}
                <FlyoutLink 
                  title="Clubs" 
                  items={[
                    { name: "Technical", href: "/clubs?type=technical" },
                    { name: "Cultural", href: "/clubs?type=cultural" },
                    { name: "Arts", href: "/clubs?type=arts" },
                  ]}
                />

                <NavLink to="/contact">Contact</NavLink>
              </>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {!loggedIn ? (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-blue-500/20"
              >
                Login
              </Link>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 text-white hover:text-blue-300 transition"
                >
                  <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center border-2 border-transparent hover:border-blue-400 transition">
                    <User size={18} />
                  </div>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <MotionDiv
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl py-2 overflow-hidden text-gray-800"
                    >
                      {role === "admin" ? (
                        <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition">
                          <User size={16} /> Admin Panel
                        </Link>
                      ) : role === "club" ? (
                        <Link to="/club" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition">
                          <Calendar size={16} /> Club Dashboard
                        </Link>
                      ) : (
                        <>
                          <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition">
                            <Home size={16} /> Student Dashboard
                          </Link>
                          <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition">
                            <User size={16} /> Profile
                          </Link>
                        </>
                      )}
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </MotionDiv>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <MotionDiv
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "100vh" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed inset-0 top-[60px] bg-[#0b1a33] z-40 md:hidden overflow-y-auto"
          >
            <div className="flex flex-col p-6 gap-4 text-white">
              {role === "admin" ? (
                <>
                  <MobileNavLink to="/admin" onClick={() => setMobileMenuOpen(false)} icon={<Home size={20} />}>Admin Overview</MobileNavLink>
                  <MobileNavLink to="/admin/clubs" onClick={() => setMobileMenuOpen(false)} icon={<Users size={20} />}>Manage Clubs</MobileNavLink>
                </>
              ) : role === "club" ? (
                <>
                  <MobileNavLink to="/club" onClick={() => setMobileMenuOpen(false)} icon={<Calendar size={20} />}>Club Dashboard</MobileNavLink>
                  <MobileNavLink to="/events" onClick={() => setMobileMenuOpen(false)} icon={<Calendar size={20} />}>Public Events</MobileNavLink>
                  <MobileNavLink to="/clubs" onClick={() => setMobileMenuOpen(false)} icon={<Users size={20} />}>Campus Clubs</MobileNavLink>
                </>
              ) : (
                <>
                  <MobileNavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)} icon={<Home size={20} />}>Student Dashboard</MobileNavLink>
                  <div className="border-t border-gray-700 py-2">
                    <p className="mb-2 text-sm uppercase tracking-wider text-gray-400">Explore</p>
                    <MobileNavLink to="/events" onClick={() => setMobileMenuOpen(false)} icon={<Calendar size={20} />}>All Events</MobileNavLink>
                    <MobileNavLink to="/clubs" onClick={() => setMobileMenuOpen(false)} icon={<Users size={20} />}>All Clubs</MobileNavLink>
                  </div>
                  <MobileNavLink to="/contact" onClick={() => setMobileMenuOpen(false)} icon={<Phone size={20} />}>Contact</MobileNavLink>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-gray-700">
                {!loggedIn ? (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full bg-blue-600 py-3 rounded-lg font-bold"
                  >
                    Login to Account
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <Link to={role === "admin" ? "/admin" : role === "club" ? "/club" : "/profile"} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg">
                      <User size={20} className="text-blue-400" /> {role === "admin" ? "Admin Overview" : role === "club" ? "Club Dashboard" : "My Profile"}
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full p-2 bg-red-600/10 text-red-400 rounded-lg"
                    >
                      <LogOut size={20} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </>
  );
};

/* --- Helper Components --- */

const NavLink = ({ to, children }) => (
  <RouterNavLink
    to={to}
    className={({ isActive }) => `font-medium transition-colors ${isActive ? "text-white" : "text-gray-300 hover:text-white"}`}
  >
    {children}
  </RouterNavLink>
);

const MobileNavLink = ({ to, children, onClick, icon }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className="flex items-center gap-4 text-xl font-medium p-2 hover:bg-white/5 rounded-lg transition"
  >
    {icon} {children}
  </Link>
);

const FlyoutLink = ({ title, items }) => {
  const [open, setOpen] = useState(false);

  return (
    <div 
      onMouseEnter={() => setOpen(true)} 
      onMouseLeave={() => setOpen(false)} 
      className="relative h-fit w-fit"
    >
      <button className="flex items-center gap-1 text-gray-300 hover:text-white font-medium transition-colors">
        {title}
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} 
        />
      </button>

      <AnimatePresence>
        {open && (
          <MotionDiv
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute left-1/2 -translate-x-1/2 top-8 bg-white text-black rounded-lg shadow-xl p-4 w-48 border border-gray-100"
          >
            {/* Tiny triangle pointing up */}
            <div className="absolute -top-2 left-0 right-0 h-4 bg-transparent" /> 
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />

            <div className="relative z-10 flex flex-col gap-2">
              {items.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block p-2 text-sm hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;