"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Menu,
  Home,
  LayoutDashboard,
  Plus,
  Compass,
  LogIn,
  Power,
  Bell,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: string;
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="relative w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-600/30 hover:to-purple-600/30 transition-all duration-300 group"
          >
            <motion.div
              initial={{ rotate: 0, scale: 1 }}
              animate={{
                rotate: theme === "dark" ? 180 : 0,
                scale: theme === "dark" ? 1.2 : 1,
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="relative flex items-center justify-center"
            >
              <Sun className="h-5 w-5 text-yellow-500 dark:text-yellow-400 transition-all duration-500 group-hover:scale-110 dark:scale-0 dark:opacity-0" />
              <Moon className="absolute h-5 w-5 text-indigo-400 dark:text-indigo-300 transition-all duration-500 group-hover:scale-110 scale-0 opacity-0 dark:scale-100 dark:opacity-100" />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-indigo-500/50 dark:group-hover:border-purple-500/50"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md text-sm">
          Switch to {theme === "light" ? "Dark" : "Light"} Mode
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  // Check login status
  const checkLoginStatus = () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const newLoginStatus = !!token;
      setIsLoggedIn(newLoginStatus);
      return newLoginStatus;
    }
    return false;
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        checkLoginStatus();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const handleLoginSuccess = () => {
      checkLoginStatus();
    };
    window.addEventListener("loginSuccess", handleLoginSuccess);
    return () => window.removeEventListener("loginSuccess", handleLoginSuccess);
  }, []);

  useEffect(() => {
    checkLoginStatus();
  }, [pathname]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkLoginStatus();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowLogoutDialog(false);

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        if (typeof window !== "undefined") {
          localStorage.clear();
          sessionStorage.clear();
        }
        toast({
          title: "Logout Berhasil",
          description: "Anda telah berhasil keluar dari sistem.",
        });
        setIsLoggedIn(false);
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          console.warn(
            "Logout API call failed, but continuing with local logout"
          );
        }
      } catch (apiError) {
        console.warn("Logout API call failed:", apiError);
      }

      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie =
            name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
      }

      toast({
        title: "Logout Berhasil",
        description: "Anda telah berhasil keluar dari sistem.",
      });

      setIsLoggedIn(false);
      router.push("/login");
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }, 100);
    } catch (error) {
      console.error("Error during logout:", error);
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      toast({
        title: "Logout Berhasil",
        description: "Anda telah keluar dari sistem.",
      });
      setIsLoggedIn(false);
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems: NavItem[] = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/create", label: "Buat Deck", icon: Plus },
    { href: "/eksplorasi", label: "Eksplorasi", icon: Compass },
    isLoggedIn
      ? { label: "Logout", icon: Power, action: "logout" }
      : { href: "/login", label: "Login", icon: LogIn },

      //deploy aja lagi
  ];

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;

    if (item.action === "logout") {
      return (
        <TooltipProvider key="logout">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={() => setShowLogoutDialog(true)}
                  disabled={isLoggingOut}
                  className="flex items-center space-x-2 text-sm font-medium transition-all duration-300 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-purple-400 hover:bg-indigo-100/50 dark:hover:bg-purple-900/30 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span>{isLoggingOut ? "Logging out..." : item.label}</span>
                </button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md text-sm">
              Keluar dari akun
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <TooltipProvider key={item.href}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href={item.href || "#"}
                className={cn(
                  "flex items-center space-x-2 text-sm font-medium transition-all duration-300 px-4 py-2 rounded-xl relative group",
                  pathname === item.href
                    ? "text-indigo-600 dark:text-purple-400 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-purple-400 hover:bg-indigo-100/50 dark:hover:bg-purple-900/30"
                )}
              >
                <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </Link>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md text-sm">
            {item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderMobileNavItem = (item: NavItem) => {
    const Icon = item.icon;

    if (item.action === "logout") {
      return (
        <motion.div
          key="logout"
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <button
            onClick={() => {
              setIsOpen(false);
              setShowLogoutDialog(true);
            }}
            disabled={isLoggingOut}
            className="flex items-center space-x-3 text-lg font-semibold transition-all duration-300 p-3 rounded-xl text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-purple-400 hover:bg-indigo-100/50 dark:hover:bg-purple-900/30 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon className="h-6 w-6 transition-transform" />
            <span>{isLoggingOut ? "Logging out..." : item.label}</span>
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={item.href}
        whileHover={{ x: 5 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          href={item.href || "#"}
          onClick={() => setIsOpen(false)}
          className={cn(
            "flex items-center space-x-3 text-lg font-semibold transition-all duration-300 p-3 rounded-xl",
            pathname === item.href
              ? "text-indigo-600 dark:text-purple-400 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 dark:border-purple-500/20"
              : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-purple-400 hover:bg-indigo-100/50 dark:hover:bg-purple-900/30"
          )}
        >
          <Icon className="h-6 w-6 transition-transform" />
          <span>{item.label}</span>
        </Link>
      </motion.div>
    );
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500 bg-gradient-to-r from-blue-100/80 via-purple-100/80 to-pink-100/80 dark:from-gray-900/80 dark:via-indigo-900/80 dark:to-purple-900/80 backdrop-blur-xl",
        scrolled
          ? "shadow-xl border-b border-indigo-500/20 dark:border-purple-500/20"
          : "border-b border-indigo-500/10 dark:border-purple-500/10"
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-3 group">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-full blur-md group-hover:blur-lg transition-all duration-300" />
            <Image
              src="/logo5.png"
              alt="SmartFlash Logo"
              width={60}
              height={60}
              className="h-12 w-12 relative z-10 transition-transform"
            />
          </motion.div>
          <motion.span
            className="font-bold text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            SmartFlash
          </motion.span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-2">
          {navItems.map(renderNavItem)}
          {/* <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-600/30 hover:to-purple-600/30"
                  >
                    <Bell className="h-5 w-5 text-indigo-600 dark:text-purple-400" />
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white dark:border-gray-900"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md text-sm">
                Notifications
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> */}
          <ThemeToggle />
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-600/30 hover:to-purple-600/30"
            >
              <Menu className="h-6 w-6 text-indigo-600 dark:text-purple-400" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[300px] sm:w-[400px] bg-gradient-to-br from-blue-100/80 via-purple-100/80 to-pink-100/80 dark:from-gray-900/80 dark:via-indigo-900/80 dark:to-purple-900/80 backdrop-blur-xl border-l border-indigo-500/20 dark:border-purple-500/20"
          >
            <motion.div
              className="flex flex-col space-y-4 mt-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, staggerChildren: 0.1 }}
            >
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href || item.action}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {renderMobileNavItem(item)}
                </motion.div>
              ))}
              <motion.div
                className="flex items-center justify-between p-3 border-t border-indigo-500/20 dark:border-purple-500/20"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navItems.length * 0.1 }}
              >
                <span className="text-lg font-semibold text-indigo-600 dark:text-purple-400">
                  Theme
                </span>
                <ThemeToggle />
              </motion.div>
            </motion.div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Logout Confirmation Dialog */}
      {isLoggedIn && (
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-indigo-500/20 dark:border-purple-500/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-indigo-600 dark:text-purple-400">
                Apakah Anda yakin ingin keluar?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                Anda akan diarahkan ke halaman login dan harus masuk kembali
                untuk mengakses akun Anda.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isLoggingOut}
                className="text-gray-600 dark:text-gray-300 hover:bg-indigo-100/50 dark:hover:bg-purple-900/30"
              >
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              >
                {isLoggingOut ? "Logging out..." : "Keluar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </nav>
  );
}
