"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, Loader2, Eye, EyeOff } from "lucide-react";

// Declare Google Sign-In types
interface GoogleAccounts {
  accounts: any;
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: any) => void;
    }) => void;
    renderButton: (
      element: HTMLElement | null,
      options: {
        theme: string;
        size: string;
        width: string;
        text: string;
      }
    ) => void;
  };
}

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

// Particle effect component
const Particles = dynamic(
  () =>
    Promise.resolve(() => {
      const isClient = typeof window !== "undefined";
      const width = isClient ? window.innerWidth : 1200;
      const height = isClient ? window.innerHeight : 800;

      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gray-500/30 dark:bg-white/30 rounded-full"
              initial={{
                x: isClient ? Math.random() * width : Math.random() * 1200,
                y: isClient ? Math.random() * height : Math.random() * 800,
              }}
              animate={{
                y: [0, isClient ? -height : -800],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
              }}
            />
          ))}
        </div>
      );
    }),
  { ssr: false }
);

interface LoginCredentials {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Initialize Google Sign-In
  useEffect(() => {
    // Prevent body scroll on mount
    document.body.style.overflow = "hidden";

    // Load Google Sign-In script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    // Initialize Google Sign-In when script loads
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInButton"),
          {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "signin_with",
          }
        );
      } else {
        console.error("Google Sign-In script failed to load");
        toast({
          title: "Error",
          description: "Failed to load Google Sign-In",
          variant: "destructive",
        });
      }
    };

    return () => {
      document.body.style.overflow = "auto";
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.email.trim() || !credentials.password.trim()) {
      toast({
        title: "Error",
        description: "Please fill in email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        toast({
          title: "Success!",
          description: "Login successful",
        });
        router.push("/dashboard");
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (response: any) => {
    if (!response.credential) {
      toast({
        title: "Error",
        description: "Google Sign-In failed",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:3000/auth/google-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        toast({
          title: "Success!",
          description: "Google Sign-In successful",
        });
        router.push("/dashboard");
      } else {
        throw new Error(data.message || "Google Sign-In failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during Google Sign-In",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 p-4 relative overflow-hidden">
      <Particles />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="relative bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200/50 dark:border-white/20 p-8">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Sign In
            </h1>
            <p className="text-gray-600 dark:text-white/70 text-sm mt-2">
              Unlock your learning journey
            </p>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-6">
            <motion.div
              className="space-y-2"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 dark:text-white/80"
              >
                Email
              </Label>
              <div className="relative group">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/50 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-300" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={credentials.email}
                  onChange={handleInputChange}
                  className="pl-12 pr-4 py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300"
                  disabled={isLoading}
                />
              </div>
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 dark:text-white/80"
              >
                Password
              </Label>
              <div className="relative group">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/50 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-300" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="pl-12 pr-12 py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/50 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div
            className="mt-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80 dark:bg-gray-900/10 text-gray-500 dark:text-white/70">
                  Or continue with
                </span>
              </div>
            </div>
            <div className="mt-6">
              <div className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-white/20 hover:shadow-md transition-shadow duration-300">
                <div id="googleSignInButton"></div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="text-center text-sm text-gray-600 dark:text-white/70 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            New to the platform?{" "}
            <a
              href="/register"
              className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium hover:underline transition-all duration-200"
            >
              Create an account
            </a>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
