"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  BookOpen,
  TrendingUp,
  Clock,
  Target,
  Play,
  Edit,
  Users,
  Calendar,
  Award,
  Flame,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Layers,
  FileText,
  Settings,
  Zap,
  Sparkles,
  CheckCircle,
  BookOpenCheck,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";

// Particle effect component
const Particles = dynamic(
  () =>
    Promise.resolve(() => {
      const isClient = typeof window !== "undefined";
      const width = isClient ? window.innerWidth : 1200;
      const height = isClient ? window.innerHeight : 800;
      const particleCount = isClient && window.innerWidth < 640 ? 15 : 30;

      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(particleCount)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-500/30 dark:bg-white/30 rounded-full"
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

interface Deck {
  id: string;
  name: string;
  subject: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  progress: {
    percentage: number;
    mastered: number;
    needsReview: number;
    total: number;
  };
  totalCards: number;
  masteredCards: number;
  lastStudied: string;
  difficulty?: string;
}

interface UserStats {
  dailyStreak: {
    count: number;
    lastActivity: string;
  };
  decks: {
    total: number;
    publicDecks: number;
    privateDecks: number;
  };
  flashcards: {
    total: number;
    learned: number;
    inProgress: number;
  };
  accuracy: {
    average: number;
    totalReviews: number;
    correctReviews: number;
  };
}

interface WeeklyProgress {
  day: string;
  cardsLearned: number;
  accuracy: number;
}

interface Analytics {
  id: string;
  category: string;
  performance: number;
  weakAreas: string[];
  recommendations: string[];
  updatedAt: string;
}

interface NearestReviewDeck {
  deck: {
    id: string;
    name: string;
    description: string;
    category: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
  };
  nearestReview: {
    flashcard: {
      id: string;
      question: string;
      answer: string;
      imageUrl: string | null;
      audioUrl: string | null;
      tags: string[];
      difficulty: number;
    };
    nextReview: string;
    easeFactor: number;
    interval: number;
    repetitions: number;
  };
  progressStats: {
    totalFlashcards: number;
    totalReviews: number;
    correctReviews: number;
    performance: number;
  };
}

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [nearestReviewDeck, setNearestReviewDeck] =
    useState<NearestReviewDeck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [isNearestReviewLoading, setIsNearestReviewLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);
  const decksPerPage = 5;
  const { toast } = useToast();
  const router = useRouter();

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to view your dashboard",
            variant: "destructive",
          });
          router.push("/login");
          return;
        }

        const response = await fetch("http://localhost:3000/user/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }

        const data = await response.json();
        setUserName(data.user.name);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An error occurred while fetching profile",
          variant: "destructive",
        });
      }
    };

    fetchUserProfile();
  }, [toast, router]);

  // Fetch user statistics
  useEffect(() => {
    const fetchUserStats = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to view your dashboard",
            variant: "destructive",
          });
          router.push("/login");
          return;
        }

        const response = await fetch("http://localhost:3000/user/statistik", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch statistics");
        }

        const data = await response.json();
        setStats(data.stats);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An error occurred while fetching statistics",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [toast, router]);

  // Fetch weekly progress data
  useEffect(() => {
    const fetchWeeklyProgress = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to view your dashboard",
            variant: "destructive",
          });
          router.push("/login");
          return;
        }

        const response = await fetch(
          "http://localhost:3000/user/weekly-progress",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch weekly progress");
        }

        const data = await response.json();
        setWeeklyProgress(data.weeklyProgress);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An error occurred while fetching weekly progress",
          variant: "destructive",
        });
        if (stats) {
          const fallbackData = Array.from({ length: 7 }, (_, i) => ({
            day: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"][i],
            cardsLearned: Math.floor(stats.flashcards.learned / 7) + (i % 3),
            accuracy: stats.accuracy.average + (Math.random() * 10 - 5),
          }));
          setWeeklyProgress(fallbackData);
        }
      }
    };

    if (stats) {
      fetchWeeklyProgress();
    }
  }, [stats, toast, router]);

  // Fetch decks
  useEffect(() => {
    const fetchDecks = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to view your dashboard",
            variant: "destructive",
          });
          router.push("/login");
          return;
        }

        const response = await fetch("http://localhost:3000/user/getAllDeck", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch decks");
        }

        const data = await response.json();

        const sortedDecks = data.decks.sort((a: any, b: any) => {
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });

        const mappedDecks: Deck[] = sortedDecks.map((deck: any) => ({
          id: deck.id,
          name: deck.name,
          subject: deck.category,
          description: deck.description,
          isPublic: deck.isPublic,
          createdAt: formatDate(deck.createdAt),
          updatedAt: formatDate(deck.updatedAt),
          progress: {
            percentage:
              deck.flashcardCount > 0
                ? Math.round(
                    ((deck.progress?.mastered || 0) / deck.flashcardCount) * 100
                  )
                : 0,
            mastered: deck.progress?.mastered || 0,
            needsReview: deck.progress?.needsReview || 0,
            total: deck.flashcardCount || 0,
          },
          totalCards: deck.flashcardCount || 0,
          masteredCards: deck.progress?.mastered || 0,
          lastStudied: formatLastStudied(deck.updatedAt),
        }));

        setDecks(mappedDecks);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An error occurred while fetching decks",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDecks();
  }, [toast, router]);

  // Fetch nearest review deck
  useEffect(() => {
    const fetchNearestReviewDeck = async () => {
      setIsNearestReviewLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to view your dashboard",
            variant: "destructive",
          });
          router.push("/login");
          return;
        }

        const response = await fetch(
          "http://localhost:3000/user/decks/nearest-review",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch nearest review deck");
        }

        const data = await response.json();
        setNearestReviewDeck(data.data);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An error occurred while fetching nearest review deck",
          variant: "destructive",
        });
      } finally {
        setIsNearestReviewLoading(false);
      }
    };

    fetchNearestReviewDeck();
  }, [toast, router]);

  // Fetch user analytics
  useEffect(() => {
    const fetchUserAnalytics = async () => {
      setIsAnalyticsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to view your dashboard",
            variant: "destructive",
          });
          router.push("/login");
          return;
        }

        const response = await fetch("http://localhost:3000/user/analytics", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }

        const data = await response.json();
        setAnalytics(data.analytics);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An error occurred while fetching analytics",
          variant: "destructive",
        });
      } finally {
        setIsAnalyticsLoading(false);
      }
    };

    fetchUserAnalytics();
  }, [toast, router]);

  // Trigger auto-generate analytics
  const triggerAutoGenerateAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view your dashboard",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:3000/user/auto-generate-analytics",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate analytics");
      }

      const data = await response.json();

      const analyticsResponse = await fetch(
        "http://localhost:3000/user/analytics",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.analytics);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while generating analytics",
        variant: "destructive",
      });
    }
  };

  const formatLastStudied = (updatedAt: string): string => {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffMs = now.getTime() - updated.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatReviewDate = (date: string): string => {
    const reviewDate = new Date(date);
    const now = new Date();
    const diffMs = reviewDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      return "Due now";
    } else if (diffHours < 24) {
      return `Due in ${diffHours} hours`;
    } else {
      return `Due in ${diffDays} day${diffDays !== 1 ? "s" : ""}`;
    }
  };

  const formatDailyStreak = (count: number): string => {
    return `${count} days`;
  };

  const handleDeleteDeck = async () => {
    if (!deckToDelete) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view your dashboard",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:3000/user/hapusDeck/${deckToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete deck");
      }

      setDecks((prevDecks) =>
        prevDecks.filter((deck) => deck.id !== deckToDelete)
      );
      const totalPages = Math.ceil((decks.length - 1) / decksPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }

      toast({
        title: "Success",
        description: "Deck deleted successfully",
      });

      await triggerAutoGenerateAnalytics();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting deck",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setDeckToDelete(null);
    }
  };

  const openDeleteDialog = (deckId: string) => {
    setDeckToDelete(deckId);
    setDeleteDialogOpen(true);
  };

  const indexOfLastDeck = currentPage * decksPerPage;
  const indexOfFirstDeck = indexOfLastDeck - decksPerPage;
  const currentDecks = decks.slice(indexOfFirstDeck, indexOfLastDeck);
  const totalPages = Math.ceil(decks.length / decksPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Skeleton Component
  const Skeleton = ({ className }: { className?: string }) => (
    <div
      className={`animate-pulse bg-gray-200/50 dark:bg-gray-700/50 rounded ${className}`}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <Particles />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="container mx-auto max-w-full sm:max-w-8xl lg:max-w-7xl pt-6 sm:pt-8"
      >
        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-lg sm:rounded-2xl border border-gray-200/50 dark:border-white/20">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">
                Confirm Delete Deck
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-gray-600 dark:text-white/70">
                Are you sure you want to delete this deck? This action will
                remove all flashcards in this deck.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="border border-gray-200 dark:border-white/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300 text-sm sm:text-base px-3 sm:px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteDeck}
                disabled={isLoading}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-300 text-sm sm:text-base px-3 sm:px-4 py-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Welcome Back{userName ? `, ${userName}` : ""}!
            </h1>
            <p className="text-gray-600 dark:text-white/70 text-sm sm:text-base mt-2">
              Continue your learning journey with renewed enthusiasm!
            </p>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base px-3 sm:px-4 py-2"
          >
            <Link href="/create">
              <Plus className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              Create New Deck
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card
                  key={index}
                  className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl border border-gray-200/50 dark:border-white/20 shadow-lg"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20 sm:w-24 bg-gray-200/50 dark:bg-white/20" />
                        <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 bg-gray-200/50 dark:bg-white/20" />
                      </div>
                      <Skeleton className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gray-200/50 dark:bg-white/20" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : [
                {
                  title: "Daily Streak",
                  value: stats
                    ? formatDailyStreak(stats.dailyStreak.count)
                    : "0 days",
                  icon: Flame,
                  color:
                    "bg-orange-500/10 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
                  iconColor: "text-orange-500 dark:text-orange-400",
                },
                {
                  title: "Total Decks",
                  value: stats ? stats.decks.total.toString() : "0",
                  icon: Layers,
                  color:
                    "bg-purple-500/10 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
                  iconColor: "text-purple-500 dark:text-purple-400",
                },
                {
                  title: "Total Cards",
                  value: stats ? stats.flashcards.total.toString() : "0",
                  icon: FileText,
                  color:
                    "bg-blue-500/10 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                  iconColor: "text-blue-500 dark:text-blue-400",
                },
                {
                  title: "Average Accuracy",
                  value: stats ? `${stats.accuracy.average}%` : "0%",
                  icon: Target,
                  color:
                    "bg-green-500/10 text-green-600 dark:bg-green-900/20 dark:text-green-400",
                  iconColor: "text-green-500 dark:text-green-400",
                },
              ].map((stat, index) => (
                <Card
                  key={index}
                  className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl border border-gray-200/50 dark:border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-white/80">
                          {stat.title}
                        </p>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={`w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center ${stat.color}`}
                      >
                        <stat.icon
                          className={`w-5 sm:w-6 h-5 sm:h-6 ${stat.iconColor}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Progress Chart and Recent Decks */}
          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            <Card className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl border border-gray-200/50 dark:border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-500 dark:text-indigo-400" />
                  Weekly Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || weeklyProgress.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[200px] sm:h-[250px] md:h-[300px] space-y-4">
                    <Skeleton className="w-full h-32 sm:h-40 md:h-48 rounded-lg bg-gray-200/50 dark:bg-white/20" />
                    <div className="flex items-center justify-center w-full">
                      <Loader2 className="w-6 sm:w-8 h-6 sm:h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                      <span className="ml-3 text-sm sm:text-lg text-gray-500 dark:text-white/70">
                        Loading progress...
                      </span>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={weeklyProgress}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        strokeOpacity={0.3}
                      />
                      <XAxis
                        dataKey="day"
                        stroke="#6b7280"
                        strokeOpacity={0.7}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        strokeOpacity={0.7}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                          fontSize: "12px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cardsLearned"
                        stroke="#6366f1"
                        strokeWidth={2}
                        name="Cards Mastered"
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Accuracy (%)"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl border border-gray-200/50 dark:border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  My Decks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: decksPerPage }).map((_, index) => (
                      <div
                        key={index}
                        className="border border-gray-200/50 dark:border-white/20 rounded-lg sm:rounded-xl p-4 sm:p-5"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                          <div className="space-y-2 w-full">
                            <Skeleton className="h-5 sm:h-6 w-3/4 bg-gray-200/50 dark:bg-white/20" />
                            <Skeleton className="h-3 sm:h-4 w-1/4 bg-gray-200/50 dark:bg-white/20" />
                            <Skeleton className="h-3 sm:h-4 w-1/2 bg-gray-200/50 dark:bg-white/20" />
                            <div className="space-y-1">
                              <Skeleton className="h-2 sm:h-3 w-1/3 bg-gray-200/50 dark:bg-white/20" />
                              <Skeleton className="h-2 sm:h-3 w-1/3 bg-gray-200/50 dark:bg-white/20" />
                            </div>
                          </div>
                          <div className="flex gap-2 sm:gap-3">
                            <Skeleton className="h-8 sm:h-9 w-20 sm:w-24 rounded-full bg-gray-200/50 dark:bg-white/20" />
                            <Skeleton className="h-8 sm:h-9 w-8 sm:w-9 rounded-full bg-gray-200/50 dark:bg-white/20" />
                            <Skeleton className="h-8 sm:h-9 w-8 sm:w-9 rounded-full bg-gray-200/50 dark:bg-white/20" />
                          </div>
                        </div>
                        <Skeleton className="h-2 sm:h-3 w-full mt-3 sm:mt-4 bg-gray-200/50 dark:bg-white/20" />
                      </div>
                    ))}
                  </div>
                ) : decks.length === 0 ? (
                  <div className="text-center py-12 sm:py-16 space-y-4">
                    <p className="text-sm sm:text-lg text-gray-600 dark:text-white/70">
                      No decks available yet
                    </p>
                    <Button
                      asChild
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base px-3 sm:px-4 py-2"
                    >
                      <Link href="/create">Create Your First Deck</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {currentDecks.map((deck) => (
                      <motion.div
                        key={deck.id}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="border border-gray-200/50 dark:border-white/20 rounded-lg sm:rounded-xl p-4 sm:p-5 bg-white/50 dark:bg-gray-900/10"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                          <div className="space-y-2 sm:space-y-3 flex-1">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                              <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white">
                                {deck.name}
                              </h3>
                              <div className="flex gap-2">
                                <Badge
                                  variant="secondary"
                                  className="bg-indigo-100/80 text-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-200 font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs"
                                >
                                  {deck.subject}
                                </Badge>
                                <Badge
                                  variant={
                                    deck.isPublic ? "default" : "outline"
                                  }
                                  className={`font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs ${
                                    deck.isPublic
                                      ? "bg-green-100/80 text-green-900 dark:bg-green-900/20 dark:text-green-200"
                                      : "bg-gray-100/80 text-gray-900 dark:bg-gray-900/20 dark:text-white/80 border-gray-200 dark:border-white/20"
                                  }`}
                                >
                                  <span className="flex items-center">
                                    <Users className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1" />
                                    {deck.isPublic ? "Public" : "Private"}
                                  </span>
                                </Badge>
                              </div>
                            </div>
                            {deck.description && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-white/70 line-clamp-2">
                                {deck.description}
                              </p>
                            )}
                            <div className="text-xs text-gray-600 dark:text-white/70 space-y-1">
                              <p className="flex items-center gap-1 sm:gap-2">
                                <Calendar className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                Created: {deck.createdAt}
                              </p>
                              <p className="flex items-center gap-1 sm:gap-2">
                                <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                Updated: {deck.updatedAt}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Button
                              size="sm"
                              variant="outline"
                              asChild={deck.totalCards > 0}
                              disabled={deck.totalCards === 0}
                              className={`border-indigo-500/70 text-indigo-600 dark:border-indigo-400/70 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all duration-300 rounded-lg text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 ${
                                deck.totalCards === 0
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {deck.totalCards === 0 ? (
                                <span className="flex items-center">
                                  <Play className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-1.5" />
                                  Unavailable
                                </span>
                              ) : (
                                <Link
                                  href={`/study/${deck.id}`}
                                  className="flex items-center"
                                >
                                  <Play className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-1.5" />
                                  Start Quiz
                                </Link>
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              asChild
                              className="text-gray-500 dark:text-white/70 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20 rounded-full w-8 sm:w-9 h-8 sm:h-9 transition-all duration-300"
                            >
                              <Link href={`/edit/${deck.id}`}>
                                <Edit className="w-3 sm:w-4 h-3 sm:h-4" />
                              </Link>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openDeleteDialog(deck.id)}
                              className="text-red-500 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/20 rounded-full w-8 sm:w-9 h-8 sm:h-9 transition-all duration-300"
                            >
                              <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                          <div className="flex flex-wrap justify-between items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-white/70">
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs py-0.5 px-2 sm:px-3 border-gray-200 dark:border-white/20"
                              >
                                {deck.progress.total} Cards
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs py-0.5 px-2 sm:px-3 border-gray-200 dark:border-white/20"
                              >
                                {deck.progress.mastered} Mastered
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs py-0.5 px-2 sm:px-3 border-gray-200 dark:border-white/20"
                              >
                                {deck.progress.needsReview} Needs Review
                              </Badge>
                            </div>
                            <span className="flex items-center gap-1 sm:gap-2">
                              <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                              {deck.lastStudied}
                            </span>
                          </div>
                          <div className="relative">
                            <Progress
                              value={deck.progress.percentage || 0}
                              className="h-2 sm:h-3 bg-gray-200/30 dark:bg-white/10 rounded-full"
                            />
                            <div
                              className="absolute top-0 left-0 h-2 sm:h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                              style={{
                                width: `${deck.progress.percentage || 0}%`,
                              }}
                            />
                            <span className="absolute -top-0.5 sm:-top-1 right-0 text-xs font-medium text-gray-600 dark:text-white/70">
                              {deck.progress.percentage || 0}%
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.5 }}
                      className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6 gap-3 sm:gap-0"
                    >
                      <Button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        variant="outline"
                        className="border-indigo-500/50 text-indigo-600 dark:border-indigo-400/50 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all duration-300 rounded-lg text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2"
                      >
                        <ChevronLeft className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                        Previous
                      </Button>
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-white/70">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        className="border-indigo-500/50 text-indigo-600 dark:border-indigo-400/50 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all duration-300 rounded-lg text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2"
                      >
                        Next
                        <ChevronRight className="w-3 sm:w-4 h-3 sm:h-4 ml-1 sm:ml-2" />
                      </Button>
                    </motion.div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Recommendations & Quick Actions */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl border border-gray-200/50 dark:border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  <div className="p-1.5 sm:p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                    <Award className="w-5 sm:w-6 h-5 sm:h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  Learning Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {isAnalyticsLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className="h-14 sm:h-16 w-full rounded-lg bg-gray-200/50 dark:bg-white/20"
                    />
                  ))
                ) : analytics.length === 0 ? (
                  <div className="text-center py-4 sm:py-6">
                    <BookOpenCheck className="mx-auto h-8 sm:h-10 w-8 sm:w-10 text-gray-600 dark:text-white/70 mb-2 sm:mb-3" />
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-white/70">
                      No recommendations available yet. Study some decks to get
                      personalized insights!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4">
                    {analytics.map((analytic, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 * index, duration: 0.5 }}
                        className="p-3 sm:p-4 bg-white/50 dark:bg-gray-900/10 rounded-lg border border-gray-200/50 dark:border-white/20"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                            {analytic.category}
                          </p>
                          <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-xs font-medium text-indigo-800 dark:text-indigo-200">
                            {analytic.performance}% Performance
                          </div>
                        </div>
                        {analytic.weakAreas.length > 0 && (
                          <div className="mt-1 sm:mt-2 flex flex-wrap gap-1 sm:gap-1.5">
                            {analytic.weakAreas.map((area, i) => (
                              <span
                                key={i}
                                className="px-1.5 sm:px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/20 text-xs text-red-800 dark:text-red-200"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        )}
                        <ul className="mt-2 sm:mt-3 space-y-1 sm:space-y-2">
                          {analytic.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start">
                              <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 mt-0.5 mr-1.5 sm:mr-2 text-green-500 dark:text-green-400" />
                              <span className="text-xs sm:text-sm text-gray-600 dark:text-white/70">
                                {rec}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                )}
                <Button
                  onClick={triggerAutoGenerateAnalytics}
                  disabled={isAnalyticsLoading}
                  className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base px-3 sm:px-4 py-2"
                >
                  {isAnalyticsLoading ? (
                    <>
                      <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 mr-2 animate-spin" />
                      Processing Analysis...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                      Generate Smart Recommendations
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Nearest Review Deck Section */}
            <Card className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl border border-gray-200/50 dark:border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <Clock className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  Upcoming Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {isNearestReviewLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-14 sm:h-16 w-full rounded-lg bg-gray-200/50 dark:bg-white/20" />
                    <Skeleton className="h-8 sm:h-9 w-32 sm:w-40 rounded-full bg-gray-200/50 dark:bg-white/20" />
                  </div>
                ) : !nearestReviewDeck ? (
                  <div className="text-center py-4 sm:py-6">
                    <BookOpen className="mx-auto h-8 sm:h-10 w-8 sm:w-10 text-gray-600 dark:text-white/70 mb-2 sm:mb-3" />
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-white/70">
                      No upcoming reviews scheduled. Keep studying!
                    </p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="p-3 sm:p-4 bg-white/50 dark:bg-gray-900/10 rounded-lg border border-gray-200/50 dark:border-white/20"
                  >
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                        <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                          {nearestReviewDeck.deck.name}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="bg-indigo-100/80 text-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-200 font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs"
                        >
                          {nearestReviewDeck.deck.category}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-white/70 line-clamp-2">
                        {nearestReviewDeck.deck.description}
                      </p>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        <span className="text-xs text-gray-600 dark:text-white/70 flex items-center gap-1 sm:gap-2">
                          <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          {formatReviewDate(
                            nearestReviewDeck.nearestReview.nextReview
                          )}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-white/70 flex items-center gap-1 sm:gap-2">
                          <Target className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          {nearestReviewDeck.progressStats.performance.toFixed(
                            1
                          )}
                          % Performance
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        <Badge
                          variant="outline"
                          className="text-xs py-0.5 px-2 sm:px-3 border-gray-200 dark:border-white/20"
                        >
                          {nearestReviewDeck.progressStats.totalFlashcards}{" "}
                          Cards
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs py-0.5 px-2 sm:px-3 border-gray-200 dark:border-white/20"
                        >
                          {nearestReviewDeck.progressStats.correctReviews}{" "}
                          Correct
                        </Badge>
                      </div>
                      <div className="relative">
                        <Progress
                          value={nearestReviewDeck.progressStats.performance}
                          className="h-2 sm:h-3 bg-gray-200/30 dark:bg-white/10 rounded-full"
                        />
                        <div
                          className="absolute top-0 left-0 h-2 sm:h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                          style={{
                            width: `${nearestReviewDeck.progressStats.performance}%`,
                          }}
                        />
                        <span className="absolute -top-0.5 sm:-top-1 right-0 text-xs font-medium text-gray-600 dark:text-white/70">
                          {nearestReviewDeck.progressStats.performance.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="w-full mt-3 sm:mt-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base px-3 sm:px-4 py-2"
                    >
                      <Link href={`/study/${nearestReviewDeck.deck.id}`}>
                        <Play className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                        Review Now
                      </Link>
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
