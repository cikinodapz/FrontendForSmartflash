"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Users,
  Download,
  MessageCircle,
  Clock,
  BookOpen,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  Play,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

interface PublicDeck {
  id: string;
  name: string;
  description: string;
  category: string;
  creatorName: string;
  flashcardCount: number;
  createdAt: string;
  updatedAt: string;
  upvoteCount: number;
  comments: {
    id: string;
    content: string;
    user: { name: string };
    createdAt: string;
  }[];
}

export default function EksplorasiPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [publicDecks, setPublicDecks] = useState<PublicDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [newComment, setNewComment] = useState<{ [deckId: string]: string }>(
    {}
  );
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [selectedDeckToCopy, setSelectedDeckToCopy] = useState<string | null>(
    null
  );
  const decksPerPage = 6;
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the exploration page",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    const fetchPublicDecks = async () => {
      try {
        const response = await fetch("http://localhost:3000/user/public", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch public decks");
        }
        const data = await response.json();
        const decksWithDetails = await Promise.all(
          data.decks.map(async (deck: PublicDeck) => {
            const [upvoteRes, commentsRes] = await Promise.all([
              fetch(`http://localhost:3000/user/decks/${deck.id}/upvotes`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
              fetch(`http://localhost:3000/user/decks/${deck.id}/comments`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
            ]);
            const upvoteData = await upvoteRes.json();
            const commentsData = await commentsRes.json();
            return {
              ...deck,
              upvoteCount: upvoteRes.ok ? upvoteData.upvoteCount : 0,
              comments: commentsRes.ok ? commentsData.comments : [],
            };
          })
        );
        setPublicDecks(decksWithDetails);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPublicDecks();
  }, [router, toast]);

  const handleUpvote = async (deckId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upvote",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/user/decks/${deckId}/upvote`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to upvote deck");
      }
      setPublicDecks((prev) =>
        prev.map((deck) =>
          deck.id === deckId ? { ...deck, upvoteCount: data.upvoteCount } : deck
        )
      );
      toast({
        title: "Success",
        description: "Deck upvoted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to upvote deck",
        variant: "destructive",
      });
    }
  };

  const handleCopyDeck = async (deckId: string) => {
    setSelectedDeckToCopy(deckId);
    setIsCopyDialogOpen(true);
  };

  const confirmCopyDeck = async () => {
    if (!selectedDeckToCopy) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to copy deck",
        variant: "destructive",
      });
      setIsCopyDialogOpen(false);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/user/decks/${selectedDeckToCopy}/copy`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to copy deck");
      }
      toast({
        title: "Success",
        description: "Deck copied to your collection",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to copy deck",
        variant: "destructive",
      });
    } finally {
      setIsCopyDialogOpen(false);
      setSelectedDeckToCopy(null);
    }
  };

  const handleAddComment = async (deckId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to comment",
        variant: "destructive",
      });
      return;
    }

    const content = newComment[deckId]?.trim();
    if (!content) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/user/decks/${deckId}/comment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add comment");
      }
      setPublicDecks((prev) =>
        prev.map((deck) =>
          deck.id === deckId
            ? { ...deck, comments: [...deck.comments, data.comment] }
            : deck
        )
      );
      setNewComment((prev) => ({ ...prev, [deckId]: "" }));
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const toggleComments = (deckId: string) => {
    setExpandedComments((prev) =>
      prev.includes(deckId)
        ? prev.filter((id) => id !== deckId)
        : [...prev, deckId]
    );
  };

  const filteredDecks = publicDecks.filter((deck) => {
    const matchesSearch =
      deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === "all" ||
      deck.category.toLowerCase() === selectedSubject.toLowerCase();

    return matchesSearch && matchesSubject;
  });

  const sortedDecks = [...filteredDecks].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === "popular") {
      return b.upvoteCount - a.upvoteCount;
    } else if (sortBy === "mostCommented") {
      return b.comments.length - a.comments.length;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedDecks.length / decksPerPage);
  const paginatedDecks = sortedDecks.slice(
    (currentPage - 1) * decksPerPage,
    currentPage * decksPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDetailedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;

    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Skeleton untuk halaman loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 p-4 sm:p-6 md:p-8 relative overflow-hidden">
        <Particles />
        <div className="w-full max-w-7xl mx-auto pt-4">
          {/* Search and Filters Skeleton */}
          <Card className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200/50 dark:border-white/20 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gray-200/50 dark:bg-white/20 rounded-full animate-pulse" />
                  <div className="h-10 bg-gray-200/50 dark:bg-white/10 rounded-lg w-full animate-pulse" />
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                  <div className="h-10 w-44 bg-gray-200/50 dark:bg-white/10 rounded-lg animate-pulse" />
                  <div className="h-10 w-44 bg-gray-200/50 dark:bg-white/10 rounded-lg animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-3 space-y-6">
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1">
                {[...Array(decksPerPage)].map((_, index) => (
                  <Card
                    key={index}
                    className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200/50 dark:border-white/20"
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-2/3 bg-gray-200/50 dark:bg-white/10 rounded animate-pulse" />
                          <div className="h-5 w-20 bg-indigo-100/50 dark:bg-indigo-900/50 rounded animate-pulse" />
                        </div>
                        <div className="h-4 w-4/5 bg-gray-200/50 dark:bg-white/10 rounded animate-pulse" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100/50 dark:bg-indigo-900/50 rounded-full animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-gray-200/50 dark:bg-white/10 rounded animate-pulse" />
                          <div className="h-3 w-16 bg-gray-200/50 dark:bg-white/10 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-gray-200/50 dark:bg-white/10 rounded-full animate-pulse" />
                          <div className="h-4 w-16 bg-gray-200/50 dark:bg-white/10 rounded animate-pulse" />
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-gray-200/50 dark:bg-white/10 rounded-full animate-pulse" />
                          <div className="h-4 w-24 bg-gray-200/50 dark:bg-white/10 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <div className="h-10 w-28 bg-indigo-100/50 dark:bg-indigo-900/50 rounded-lg animate-pulse" />
                        <div className="h-10 w-28 bg-gray-200/50 dark:bg-white/10 rounded-lg animate-pulse" />
                        <div className="h-10 w-28 bg-gray-200/50 dark:bg-white/10 rounded-lg animate-pulse" />
                        <div className="h-10 w-28 bg-gray-200/50 dark:bg-white/10 rounded-lg animate-pulse" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination Skeleton */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <div className="h-8 w-8 bg-gray-200/50 dark:bg-white/10 rounded-lg animate-pulse" />
                  {[...Array(Math.min(totalPages, 3))].map((_, index) => (
                    <div
                      key={index}
                      className={`h-8 w-8 rounded-lg animate-pulse ${
                        index === 0
                          ? "bg-indigo-100/50 dark:bg-indigo-900/50"
                          : "bg-gray-200/50 dark:bg-white/10"
                      }`}
                    />
                  ))}
                  <div className="h-8 w-8 bg-gray-200/50 dark:bg-white/10 rounded-lg animate-pulse" />
                </div>
              )}
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200/50 dark:border-white/20">
                <CardHeader>
                  <div className="h-6 w-40 bg-gray-200/50 dark:bg-white/10 rounded animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="h-8 w-16 mx-auto bg-indigo-100/50 dark:bg-indigo-900/50 rounded animate-pulse" />
                    <div className="h-4 w-24 mx-auto mt-2 bg-gray-200/50 dark:bg-white/10 rounded animate-pulse" />
                  </div>
                  <div className="text-center">
                    <div className="h-8 w-16 mx-auto bg-indigo-100/50 dark:bg-indigo-900/50 rounded animate-pulse" />
                    <div className="h-4 w-24 mx-auto mt-2 bg-gray-200/50 dark:bg-white/10 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200/50 dark:border-white/20">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-indigo-100/50 dark:bg-indigo-900/50 rounded-lg mx-auto animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-6 w-32 mx-auto bg-gray-200/50 dark:bg-white/10 rounded animate-pulse" />
                    <div className="h-4 w-48 mx-auto bg-gray-200/50 dark:bg-white/10 rounded animate-pulse" />
                  </div>
                  <div className="h-10 w-full bg-indigo-100/50 dark:bg-indigo-900/50 rounded-lg animate-pulse" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 p-4 sm:p-6 md:p-8 relative overflow-hidden">
        <Particles />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-7xl mx-auto pt-6 text-center"
        >
          <p className="text-lg text-red-500 dark:text-red-400">
            Error: {error}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <Particles />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-7xl mx-auto pt-4"
      >
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200/50 dark:border-white/20 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <motion.div
                  className="flex-1 relative w-full"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-white/50 w-5 h-5" />
                  <Input
                    placeholder="Search decks, topics, or authors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300 text-sm"
                  />
                </motion.div>
                <motion.div
                  className="flex gap-4 w-full lg:w-auto"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                  >
                    <SelectTrigger className="w-full lg:w-44 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300 text-sm">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-lg shadow-lg">
                      <SelectItem value="all" className="text-sm">
                        All Subjects
                      </SelectItem>
                      {[
                        "Mathematics",
                        "History",
                        "Science",
                        "Language",
                        "Geography",
                        "Art & Culture",
                        "Literature",
                        "General Knowledge",
                        "Technology",
                        "Music",
                        "Sports",
                        "Health & Fitness",
                        "Economics & Business",
                        "Psychology",
                        "Philosophy",
                        "Astronomy",
                        "Computer Science",
                        "Other",
                      ].map((subject) => (
                        <SelectItem
                          key={subject}
                          value={subject}
                          className="text-sm"
                        >
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full lg:w-44 py-2 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300 text-sm">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-lg shadow-lg">
                      <SelectItem value="popular" className="text-sm">
                        Most Popular
                      </SelectItem>
                      <SelectItem value="newest" className="text-sm">
                        Newest
                      </SelectItem>
                      <SelectItem value="mostCommented" className="text-sm">
                        Most Commented
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1">
              {paginatedDecks.map((deck, index) => (
                <motion.div
                  key={deck.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 * index, duration: 0.5 }}
                >
                  <Card className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl shadow-xl dark:shadow-2xl hover:shadow-2xl transition-all duration-300 border border-gray-200/50 dark:border-white/20">
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                            {deck.name}
                          </h3>
                          <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm">
                            {deck.category}
                          </Badge>
                        </div>
                        <p className="text-gray-600 dark:text-white/70 text-sm line-clamp-2">
                          {deck.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-indigo-100/50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                            {deck.creatorName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {deck.creatorName}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-white/70">
                            Updated {formatDetailedDate(deck.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-white/70">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{deck.flashcardCount} cards</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            Created {formatDetailedDate(deck.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          asChild={deck.flashcardCount > 0}
                          className={`bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg transition-all duration-300 text-sm px-4 py-2 ${
                            deck.flashcardCount === 0
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={deck.flashcardCount === 0}
                        >
                          {deck.flashcardCount === 0 ? (
                            <span className="flex items-center justify-center">
                              <Play className="w-4 h-4 mr-2" />
                              Unavailable
                            </span>
                          ) : (
                            <Link
                              href={`/study/${deck.id}`}
                              className="flex items-center justify-center"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Start Quiz
                            </Link>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleCopyDeck(deck.id)}
                          className="border border-gray-200 dark:border-white/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300 text-sm px-4 py-2"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Copy Deck
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => toggleComments(deck.id)}
                          className="border border-gray-200 dark:border-white/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300 text-sm px-4 py-2"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Discuss ({deck.comments.length})
                        </Button>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="outline"
                            onClick={() => handleUpvote(deck.id)}
                            className="border border-gray-200 dark:border-white/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300 text-sm px-4 py-2"
                          >
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            Upvote ({deck.upvoteCount})
                          </Button>
                        </motion.div>
                      </div>
                      <AnimatePresence>
                        {expandedComments.includes(deck.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                          >
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Add a comment..."
                                value={newComment[deck.id] || ""}
                                onChange={(e) =>
                                  setNewComment((prev) => ({
                                    ...prev,
                                    [deck.id]: e.target.value,
                                  }))
                                }
                                className="flex-1 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg text-sm"
                              />
                              <Button
                                onClick={() => handleAddComment(deck.id)}
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-sm px-4 py-2"
                              >
                                Post
                              </Button>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {deck.comments.length > 0 ? (
                                deck.comments.map((comment) => (
                                  <div
                                    key={comment.id}
                                    className="p-3 bg-white/30 dark:bg-gray-900/30 rounded-lg text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback className="bg-indigo-100/50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                                          {comment.user.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {comment.user.name}
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-white/70">
                                        {formatDetailedDate(comment.createdAt)}
                                      </p>
                                    </div>
                                    <p className="text-gray-800 dark:text-white/80 mt-1">
                                      {comment.content}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-600 dark:text-white/70 text-sm">
                                  No comments yet.
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            {totalPages > 1 && (
              <motion.div
                className="flex justify-center items-center gap-2 mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border border-gray-200 dark:border-white/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {[...Array(totalPages)].map((_, index) => (
                  <Button
                    key={index}
                    variant={currentPage === index + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(index + 1)}
                    className={
                      currentPage === index + 1
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg transition-all duration-300"
                        : "border border-gray-200 dark:border-white/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300"
                    }
                  >
                    {index + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="border border-gray-200 dark:border-white/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Card className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200/50 dark:border-white/20">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white text-lg font-semibold">
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-500 dark:text-indigo-400">
                    {publicDecks.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-white/70">
                    Total Public Decks
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-500 dark:text-indigo-400">
                    {new Set(publicDecks.map((deck) => deck.category)).size}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-white/70">
                    Categories
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200/50 dark:border-white/20">
              <CardContent className="p-6 text-center space-y-4">
                <motion.div
                  className="w-12 h-12 bg-indigo-100/50 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center mx-auto"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Users className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                </motion.div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    Share Your Knowledge
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-white/70">
                    Create public decks and empower thousands of learners
                  </p>
                </div>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg transition-all duration-300 text-sm py-2"
                >
                  <Link href="/create">Create Public Deck</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Copy Deck Dialog */}
      <AnimatePresence>
        {isCopyDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Copy Deck
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to copy this deck to your collection?
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCopyDialogOpen(false)}
                  className="text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmCopyDeck}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                >
                  Confirm Copy
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
