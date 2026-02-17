"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  LogIn,
  User,
  BarChart2,
  Terminal,
  MessageCircle,
  LayoutDashboard,
  LogOut,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import config from "@config";
import Image from "next/image";
import { api } from "@/utils/api";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // Fetch user info from API
    api
      .get("/auth/user", {}, { redirectOn401: false, showConsoleError: false })
      .then((data) => {
        if (data && data._isError) {
          setUser(null);
          setLoadingUser(false);
          return;
        }
        setUser({
          username: data.username,
          avatar: data.avatar,
          id: data.id,
        });
        setLoadingUser(false);
      })
      .catch(() => {
        setUser(null);
        setLoadingUser(false);
      });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setDropdownOpen(false);
    router.push("/");
  };

  const getAvatarUrl = () => {
    if (user?.avatar && user?.id) {
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    }
    return null;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "glass-strong shadow-elevation-lg border-primary/30"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-blue-glow rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative w-12 h-12 bg-gradient-blue-glow rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-glow group-hover:shadow-glow-lg group-hover:scale-105 transition-all">
                <Image
                  src="/logo.png"
                  alt="Vantyx Logo"
                  className="w-full h-full object-contain"
                  width={64}
                  height={64}
                  unoptimized
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-gradient">Vantyx</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink href="/" icon={null}>
              Home
            </NavLink>
            <NavLink href="/commands" icon={Terminal}>
              Commands
            </NavLink>
            <NavLink href="/stats" icon={BarChart2}>
              Stats
            </NavLink>
            <NavLink
              href={config.LINKS.SUPPORT}
              target="_blank"
              icon={MessageCircle}
              external
            >
              Support
            </NavLink>
          </div>

          {/* Auth Section */}
          <div className="hidden md:block">
            {loadingUser ? (
              <NavbarUserSkeleton />
            ) : user ? (
              <div className="pl-6 border-l border-white/10" ref={dropdownRef}>
                {/* Clickable User Section - Username + Avatar */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="relative group/avatar flex items-center gap-3 hover:bg-white/5 rounded-xl p-2 pr-3 transition-all"
                  >
                    <div className="absolute inset-0 bg-primary rounded-xl blur-md opacity-0 group-hover/avatar:opacity-50 transition-opacity"></div>

                    {/* Username */}
                    <div className="text-right hidden lg:block relative z-10">
                      <div className="text-sm font-bold text-white">
                        {user.username}
                      </div>
                    </div>

                    {/* Avatar */}
                    <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-blue border-2 border-primary/30 flex items-center justify-center group-hover/avatar:border-primary transition-colors overflow-hidden">
                      {getAvatarUrl() ? (
                        <Image
                          src={getAvatarUrl()}
                          alt={user.username}
                          className="w-full h-full object-cover"
                          width={24}
                          height={24}
                          unoptimized
                        />
                      ) : (
                        <User size={20} className="text-white" />
                      )}
                    </div>

                    {/* Dropdown Arrow */}
                    <ChevronDown
                      size={16}
                      className={`relative z-10 text-gray-400 transition-transform ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#0a0a0f]/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-elevation-xl overflow-hidden animate-scale-in">
                      <div className="p-3 border-b border-primary/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-blue border-2 border-primary/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {getAvatarUrl() ? (
                              <Image
                                src={getAvatarUrl()}
                                alt={user.username}
                                className="w-full h-full object-cover"
                                width={24}
                                height={24}
                                unoptimized
                              />
                            ) : (
                              <User size={20} className="text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">
                              {user.username}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        <Link
                          href="/servers"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all group"
                        >
                          <LayoutDashboard
                            size={18}
                            className="group-hover:text-primary transition-colors"
                          />
                          <span className="font-medium">Dashboard</span>
                        </Link>

                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all group"
                        >
                          <UserCircle
                            size={18}
                            className="group-hover:text-primary transition-colors"
                          />
                          <span className="font-medium">Profile</span>
                        </Link>

                        <div className="my-2 border-t border-white/10"></div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group"
                        >
                          <LogOut
                            size={18}
                            className="group-hover:scale-110 transition-transform"
                          />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-blue-glow text-white rounded-xl font-semibold shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
              >
                <LogIn size={18} />
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-20 left-0 right-0 glass-strong border-t border-white/10 shadow-elevation-lg transition-all duration-300 ${
          isOpen
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible -translate-y-4"
        }`}
      >
        <div className="p-4 space-y-2">
          <MobileNavLink href="/" onClick={() => setIsOpen(false)}>
            Home
          </MobileNavLink>
          <MobileNavLink href="/commands" onClick={() => setIsOpen(false)}>
            <Terminal size={18} /> Commands
          </MobileNavLink>
          <MobileNavLink href="/stats" onClick={() => setIsOpen(false)}>
            <BarChart2 size={18} /> Stats
          </MobileNavLink>
          <MobileNavLink
            href={config.LINKS.SUPPORT}
            onClick={() => setIsOpen(false)}
          >
            <MessageCircle size={18} /> Support
          </MobileNavLink>

          <div className="pt-4 border-t border-white/10">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-blue border-2 border-primary/30 flex items-center justify-center overflow-hidden">
                    {getAvatarUrl() ? (
                      <Image
                        src={getAvatarUrl()}
                        alt={user.username}
                        className="w-full h-full object-cover"
                        width={24}
                        height={24}
                        unoptimized
                      />
                    ) : (
                      <User size={20} className="text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white">{user.username}</div>
                  </div>
                </div>

                <Link
                  href="/servers"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 font-medium transition-all"
                >
                  <LayoutDashboard size={18} /> Dashboard
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 font-medium transition-all"
                >
                  <UserCircle size={18} /> Profile
                </Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium transition-all"
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-gradient-blue-glow text-white font-bold shadow-glow"
                onClick={() => setIsOpen(false)}
              >
                <LogIn size={18} />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Desktop Nav Link Component
function NavLink({ href, icon: Icon, children, external }) {
  const linkProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link
      href={href}
      {...linkProps}
      className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white font-medium rounded-lg hover:bg-white/5 transition-all group"
    >
      {Icon && (
        <Icon
          size={18}
          className="group-hover:text-primary transition-colors"
        />
      )}
      {children}
    </Link>
  );
}

// Mobile Nav Link Component
function MobileNavLink({ href, onClick, children }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 font-medium transition-all"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

function NavbarUserSkeleton() {
  return (
    <div className="pl-6 border-l border-white/10">
      <div className="flex items-center gap-3 p-2">
        {/* Username */}
        <div className="hidden lg:block h-3 w-20 rounded bg-white/10 animate-pulse" />

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />

        {/* Arrow */}
        <div className="w-3 h-3 rounded bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}
