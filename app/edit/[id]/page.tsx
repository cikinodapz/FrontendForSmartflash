"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Edit, Trash2, Copy, Move } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface DeckData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isPublic: boolean;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  imageUrl: string | null;
  audioUrl: string | null;
  aiGenerated: boolean;
  tags: string[];
  difficulty: number;
  deckId: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditDeckPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [deck, setDeck] = useState<DeckData | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [availableDecks, setAvailableDecks] = useState<DeckData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isCopyingCard, setIsCopyingCard] = useState(false);
  const [isMovingCard, setIsMovingCard] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "add" | "edit">("list");
  const [newCard, setNewCard] = useState({
    question: "",
    answer: "",
    tags: "",
    difficulty: 1,
    aiGenerated: false,
  });
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [cardToCopy, setCardToCopy] = useState<string | null>(null);
  const [cardToMove, setCardToMove] = useState<string | null>(null);
  const [targetDeckId, setTargetDeckId] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to edit a deck",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch deck
        const deckResponse = await fetch(
          `http://localhost:3000/user/getDeck/${id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!deckResponse.ok) throw new Error("Failed to fetch deck data");
        const deckData = await deckResponse.json();
        setDeck(deckData.deck);

        // Fetch flashcards
        const flashcardsResponse = await fetch(
          `http://localhost:3000/user/listCard/${id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!flashcardsResponse.ok)
          throw new Error("Failed to fetch flashcards");
        const flashcardsData = await flashcardsResponse.json();
        setFlashcards(flashcardsData.flashcards);

        // Fetch available decks for copying/moving
        const decksResponse = await fetch(
          "http://localhost:3000/user/getAllDeck",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!decksResponse.ok)
          throw new Error("Failed to fetch available decks");
        const decksData = await decksResponse.json();
        setAvailableDecks(decksData.decks.filter((d: DeckData) => d.id !== id));
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An error occurred while fetching data",
          variant: "destructive",
        });
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, toast, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deck) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in first");

      const response = await fetch(
        `http://localhost:3000/user/editDeck/${deck.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: deck.name,
            description: deck.description,
            category: deck.category,
            isPublic: deck.isPublic,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update deck");

      toast({
        title: "Success",
        description: "Deck updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while updating deck",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCard(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in first");

      const tagsArray = newCard.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const response = await fetch(`http://localhost:3000/user/addCard/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: newCard.question,
          answer: newCard.answer,
          tags: tagsArray,
          difficulty: Number(newCard.difficulty),
          aiGenerated: newCard.aiGenerated,
        }),
      });

      if (!response.ok) throw new Error("Failed to add flashcard");

      const newFlashcard = await response.json();
      setFlashcards([...flashcards, newFlashcard.flashcard]);
      setNewCard({
        question: "",
        answer: "",
        tags: "",
        difficulty: 1,
        aiGenerated: false,
      });
      setActiveTab("list");
      toast({
        title: "Success",
        description: "Flashcard added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while adding flashcard",
        variant: "destructive",
      });
    } finally {
      setIsAddingCard(false);
    }
  };

  const handleEditCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    setIsEditingCard(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in first");

      const tagsArray = editingCard.tags
        .join(",")
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const response = await fetch(
        `http://localhost:3000/user/decks/${id}/flashcards/${editingCard.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: editingCard.question,
            answer: editingCard.answer,
            tags: tagsArray,
            difficulty: Number(editingCard.difficulty),
            aiGenerated: editingCard.aiGenerated,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update flashcard");

      const updatedFlashcard = await response.json();
      setFlashcards(
        flashcards.map((card) =>
          card.id === editingCard.id ? updatedFlashcard.flashcard : card
        )
      );
      setEditingCard(null);
      setActiveTab("list");
      toast({
        title: "Success",
        description: "Flashcard updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while updating flashcard",
        variant: "destructive",
      });
    } finally {
      setIsEditingCard(false);
    }
  };

  const handleCopyCard = async () => {
    if (!cardToCopy || !targetDeckId) return;

    setIsCopyingCard(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in first");

      const response = await fetch(
        `http://localhost:3000/user/decks/${targetDeckId}/copy-flashcards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            flashcardIds: [cardToCopy],
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to copy flashcard");

      toast({
        title: "Success",
        description: "Flashcard copied successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while copying flashcard",
        variant: "destructive",
      });
    } finally {
      setIsCopyingCard(false);
      setIsCopyDialogOpen(false);
      setCardToCopy(null);
      setTargetDeckId("");
    }
  };

  const handleMoveCard = async () => {
    if (!cardToMove || !targetDeckId) return;

    setIsMovingCard(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in first");

      const response = await fetch(
        `http://localhost:3000/user/flashcards/move`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            flashcardIds: [cardToMove],
            targetDeckId,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to move flashcard");

      setFlashcards(flashcards.filter((card) => card.id !== cardToMove));
      toast({
        title: "Success",
        description: "Flashcard moved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while moving flashcard",
        variant: "destructive",
      });
    } finally {
      setIsMovingCard(false);
      setIsMoveDialogOpen(false);
      setCardToMove(null);
      setTargetDeckId("");
    }
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in first");

      const response = await fetch(
        `http://localhost:3000/user/decks/${id}/flashcards/${cardToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete flashcard");

      setFlashcards(flashcards.filter((card) => card.id !== cardToDelete));
      toast({
        title: "Success",
        description: "Flashcard deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting flashcard",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setCardToDelete(null);
    }
  };

  const openDeleteDialog = (cardId: string) => {
    setCardToDelete(cardId);
    setIsDeleteDialogOpen(true);
  };

  const openCopyDialog = (cardId: string) => {
    setCardToCopy(cardId);
    setIsCopyDialogOpen(true);
  };

  const openMoveDialog = (cardId: string) => {
    setCardToMove(cardId);
    setIsMoveDialogOpen(true);
  };

  const startEditingCard = (card: Flashcard) => {
    setEditingCard(card);
    setActiveTab("edit");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 p-4 relative overflow-hidden">
        <Particles />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center h-screen"
        >
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400" />
        </motion.div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 p-4 relative overflow-hidden">
        <Particles />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-xl text-gray-600 dark:text-gray-300 text-center pt-8"
        >
          Deck not found
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 p-4 sm:p-6 relative overflow-hidden">
      <Particles />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-5xl mx-auto pt-8"
      >
        <div className="relative bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200/50 dark:border-white/20 p-6 sm:p-8">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
              Edit Deck
            </h1>
            <p className="text-gray-600 dark:text-white/70 text-sm sm:text-base mt-2">
              Modify deck settings and manage flashcards
            </p>
          </motion.div>

          {/* Deck Settings */}
          <motion.div className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <motion.div
                  className="space-y-2"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-700 dark:text-white/80"
                  >
                    Deck Title*
                  </Label>
                  <Input
                    id="name"
                    value={deck.name}
                    onChange={(e) => setDeck({ ...deck, name: e.target.value })}
                    placeholder="e.g., Basic Mathematics"
                    required
                    className="pl-4 py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300"
                  />
                </motion.div>
                <motion.div
                  className="space-y-2"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <Label
                    htmlFor="category"
                    className="text-sm font-medium text-gray-700 dark:text-white/80"
                  >
                    Category*
                  </Label>
                  <Select
                    value={deck.category}
                    onValueChange={(value) =>
                      setDeck({ ...deck, category: value })
                    }
                    required
                  >
                    <SelectTrigger className="pl-4 py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300 text-sm sm:text-base">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                      ].map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>
              <motion.div
                className="space-y-2"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-gray-700 dark:text-white/80"
                >
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={deck.description || ""}
                  onChange={(e) =>
                    setDeck({ ...deck, description: e.target.value })
                  }
                  placeholder="Describe your deck..."
                  className="pl-4 py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300 min-h-[120px]"
                />
              </motion.div>
              <motion.div
                className="flex items-center space-x-3"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Switch
                  id="isPublic"
                  checked={deck.isPublic}
                  onCheckedChange={(checked) =>
                    setDeck({ ...deck, isPublic: checked })
                  }
                  className="data-[state=checked]:bg-indigo-500 dark:data-[state=checked]:bg-indigo-400"
                />
                <Label
                  htmlFor="isPublic"
                  className="text-sm font-medium text-gray-700 dark:text-white/80"
                >
                  Make this deck public
                </Label>
              </motion.div>
              <motion.div
                className="flex justify-end space-x-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="border border-gray-200 dark:border-white/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 text-white rounded-lg transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            className="flex space-x-2 bg-white/50 dark:bg-white/5 rounded-lg p-1 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 ${
                activeTab === "list"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm"
                  : "text-gray-600 dark:text-white/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
              }`}
            >
              Flashcard List
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 ${
                activeTab === "add"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm"
                  : "text-gray-600 dark:text-white/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
              }`}
            >
              Add Flashcard
            </button>
          </motion.div>

          {/* Flashcard Content */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="bg-white/50 dark:bg-white/5 rounded-lg p-6">
              <AnimatePresence mode="wait">
                {activeTab === "list" ? (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                      Flashcard Collection
                    </h3>
                    {flashcards.length === 0 ? (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center text-gray-500 dark:text-gray-400 py-12 text-xl font-medium"
                      >
                        No flashcards yet. Start building your deck now!
                      </motion.p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {flashcards.map((flashcard, index) => (
                          <motion.div
                            key={flashcard.id}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{
                              delay: index * 0.1,
                              duration: 0.4,
                              ease: "easeOut",
                            }}
                            className="relative bg-white/10 dark:bg-gray-900/20 backdrop-blur-xl rounded-2xl p-6 shadow-2xl hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-500 border border-indigo-500/20 overflow-hidden group"
                          >
                            {/* Neon Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="relative z-10 space-y-5">
                              {/* Question */}
                              <motion.div
                                whileHover={{ x: 2 }}
                                transition={{ duration: 0.2 }}
                              >
                                <h4 className="text-xs font-semibold text-indigo-400 dark:text-indigo-300 mb-2 uppercase tracking-wider">
                                  Question
                                </h4>
                                <p className="text-gray-800 dark:text-gray-100 text-lg font-medium leading-relaxed line-clamp-2">
                                  {flashcard.question}
                                </p>
                              </motion.div>
                              {/* Answer */}
                              <motion.div
                                whileHover={{ x: 2 }}
                                transition={{ duration: 0.2 }}
                              >
                                <h4 className="text-xs font-semibold text-indigo-400 dark:text-indigo-300 mb-2 uppercase tracking-wider">
                                  Answer
                                </h4>
                                <p className="text-gray-800 dark:text-gray-100 text-lg font-medium leading-relaxed line-clamp-2">
                                  {flashcard.answer}
                                </p>
                              </motion.div>
                              {/* Tags */}
                              <motion.div
                                className="flex flex-wrap gap-2"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                              >
                                {flashcard.tags.length > 0 ? (
                                  flashcard.tags.map((tag) => (
                                    <Badge
                                      key={tag}
                                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-3 py-1 rounded-full hover:scale-105 transition-all duration-200 shadow-md hover:shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                    >
                                      {tag}
                                    </Badge>
                                  ))
                                ) : (
                                  <Badge className="bg-gray-200/50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
                                    No tags
                                  </Badge>
                                )}
                              </motion.div>
                              {/* Difficulty Stars (Horizontal) */}
                              <motion.div
                                className="flex items-center gap-3"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 + 0.3 }}
                              >
                                <div className="flex gap-1">
                                  {[...Array(10)].map((_, i) => (
                                    <motion.svg
                                      key={i}
                                      className={`w-5 h-5 ${
                                        i < flashcard.difficulty
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300 dark:text-gray-600"
                                      } transition-colors duration-200`}
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      whileHover={{ scale: 1.2, rotate: 12 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.447a1 1 0 00-.364 1.118l1.286 3.97c.3.921-.755 1.688-1.54-1.118l-3.37-2.447a1 1 0 00-1.176 0l-3.58 2.447c-.784.57-1.838-.197-1.54-1.118l1.286-3.97a1 1 0 00-.364-1.118L2.66 7.397c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.97z" />
                                    </motion.svg>
                                  ))}
                                </div>
                              </motion.div>
                              {/* Action Buttons */}
                              <motion.div
                                className="flex gap-3 justify-start"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 + 0.4 }}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="relative"
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditingCard(flashcard)}
                                    className="text-indigo-500 dark:text-indigo-300 hover:bg-indigo-500/10 dark:hover:bg-indigo-800/20 rounded-full p-2 transition-all duration-300 shadow-sm hover:shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                                    title="Edit Flashcard"
                                  >
                                    <Edit className="w-5 h-5" />
                                  </Button>
                                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                    Edit
                                  </span>
                                </motion.div>
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="relative"
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openCopyDialog(flashcard.id)}
                                    className="text-blue-500 dark:text-blue-300 hover:bg-blue-500/10 dark:hover:bg-blue-800/20 rounded-full p-2 transition-all duration-300 shadow-sm hover:shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                                    title="Copy Flashcard"
                                  >
                                    <Copy className="w-5 h-5" />
                                  </Button>
                                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                    Copy
                                  </span>
                                </motion.div>
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="relative"
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openMoveDialog(flashcard.id)}
                                    className="text-green-500 dark:text-green-300 hover:bg-green-500/10 dark:hover:bg-green-800/20 rounded-full p-2 transition-all duration-300 shadow-sm hover:shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                    title="Move Flashcard"
                                  >
                                    <Move className="w-5 h-5" />
                                  </Button>
                                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                    Move
                                  </span>
                                </motion.div>
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="relative"
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      openDeleteDialog(flashcard.id)
                                    }
                                    className="text-red-500 dark:text-red-300 hover:bg-red-500/10 dark:hover:bg-red-800/20 rounded-full p-2 transition-all duration-300 shadow-sm hover:shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                                    title="Delete Flashcard"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </Button>
                                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                    Delete
                                  </span>
                                </motion.div>
                              </motion.div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : activeTab === "add" ? (
                  <motion.div
                    key="add"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Add New Flashcard
                    </h3>
                    <form onSubmit={handleAddCard} className="space-y-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="question"
                          className="text-sm font-medium text-gray-700 dark:text-white/80"
                        >
                          Question*
                        </Label>
                        <Input
                          id="question"
                          value={newCard.question}
                          onChange={(e) =>
                            setNewCard({ ...newCard, question: e.target.value })
                          }
                          placeholder="Enter question"
                          required
                          className="pl-4 py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="answer"
                          className="text-sm font-medium text-gray-700 dark:text-white/80"
                        >
                          Answer*
                        </Label>
                        <Textarea
                          id="answer"
                          value={newCard.answer}
                          onChange={(e) =>
                            setNewCard({ ...newCard, answer: e.target.value })
                          }
                          placeholder="Enter answer"
                          required
                          className="pl-4 py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300 min-h-[120px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="tags"
                          className="text-sm font-medium text-gray-700 dark:text-white/80"
                        >
                          Tags (comma-separated)
                        </Label>
                        <Input
                          id="tags"
                          value={newCard.tags}
                          onChange={(e) =>
                            setNewCard({ ...newCard, tags: e.target.value })
                          }
                          placeholder="e.g., math, basic"
                          className="pl-4 py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="difficulty"
                          className="text-sm font-medium text-gray-700 dark:text-white/80"
                        >
                          Difficulty (1-10)*
                        </Label>
                        <Input
                          id="difficulty"
                          type="number"
                          min="1"
                          max="10"
                          value={newCard.difficulty}
                          onChange={(e) =>
                            setNewCard({
                              ...newCard,
                              difficulty: Number(e.target.value),
                            })
                          }
                          required
                          className="pl-4 py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300"
                        />
                      </div>
                      <div className="flex justify-end space-x-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveTab("list")}
                          className="border border-gray-200 dark:border-white/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isAddingCard}
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 text-white rounded-lg transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                          {isAddingCard ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5 mr-2" />
                              Add Flashcard
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Edit Flashcard
                    </h3>
                    {editingCard && (
                      <form onSubmit={handleEditCard} className="space-y-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="edit-question"
                            className="text-sm font-medium text-gray-700 dark:text-white/80"
                          >
                            Question*
                          </Label>
                          <Input
                            id="edit-question"
                            value={editingCard.question}
                            onChange={(e) =>
                              setEditingCard({
                                ...editingCard,
                                question: e.target.value,
                              })
                            }
                            placeholder="Enter question"
                            required
                            className="pl-4 py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="edit-answer"
                            className="text-sm font-medium text-gray-700 dark:text-white/80"
                          >
                            Answer*
                          </Label>
                          <Textarea
                            id="edit-answer"
                            value={editingCard.answer}
                            onChange={(e) =>
                              setEditingCard({
                                ...editingCard,
                                answer: e.target.value,
                              })
                            }
                            placeholder="Enter answer"
                            required
                            className="pl-4 py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300 min-h-[120px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="edit-tags"
                            className="text-sm font-medium text-gray-700 dark:text-white/80"
                          >
                            Tags (comma-separated)
                          </Label>
                          <Input
                            id="edit-tags"
                            value={editingCard.tags.join(", ")}
                            onChange={(e) =>
                              setEditingCard({
                                ...editingCard,
                                tags: e.target.value
                                  .split(",")
                                  .map((tag) => tag.trim())
                                  .filter((tag) => tag),
                              })
                            }
                            placeholder="e.g., math, basic"
                            className="pl-4 py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="edit-difficulty"
                            className="text-sm font-medium text-gray-700 dark:text-white/80"
                          >
                            Difficulty (1-10)*
                          </Label>
                          <Input
                            id="edit-difficulty"
                            type="number"
                            min="1"
                            max="10"
                            value={editingCard.difficulty}
                            onChange={(e) =>
                              setEditingCard({
                                ...editingCard,
                                difficulty: Number(e.target.value),
                              })
                            }
                            required
                            className="pl-4 py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300"
                          />
                        </div>
                        <div className="flex justify-end space-x-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingCard(null);
                              setActiveTab("list");
                            }}
                            className="border border-gray-200 dark:border-white/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={isEditingCard}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 text-white rounded-lg transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                          >
                            {isEditingCard ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-5 h-5 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogContent className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/50 dark:border-white/20">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirm Deletion
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 dark:text-white/70">
                  Are you sure you want to delete this flashcard? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="border border-gray-200 dark:border-white/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setCardToDelete(null);
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-300"
                  onClick={handleDeleteCard}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Copy Confirmation Dialog */}
          <AlertDialog
            open={isCopyDialogOpen}
            onOpenChange={setIsCopyDialogOpen}
          >
            <AlertDialogContent className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/50 dark:border-white/20">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  Copy Flashcard
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 dark:text-white/70">
                  Select a deck to copy this flashcard to:
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4">
                <Select
                  value={targetDeckId}
                  onValueChange={setTargetDeckId}
                  required
                >
                  <SelectTrigger className="w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg">
                    <SelectValue placeholder="Select a deck" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {availableDecks.map((deck) => (
                      <SelectItem key={deck.id} value={deck.id}>
                        {deck.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="border border-gray-200 dark:border-white/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300"
                  onClick={() => {
                    setIsCopyDialogOpen(false);
                    setCardToCopy(null);
                    setTargetDeckId("");
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-300"
                  onClick={handleCopyCard}
                  disabled={isCopyingCard || !targetDeckId}
                >
                  {isCopyingCard ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Copying...
                    </>
                  ) : (
                    "Copy"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Move Confirmation Dialog */}
          <AlertDialog
            open={isMoveDialogOpen}
            onOpenChange={setIsMoveDialogOpen}
          >
            <AlertDialogContent className="bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/50 dark:border-white/20">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  Move Flashcard
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 dark:text-white/70">
                  Select a deck to move this flashcard to:
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4">
                <Select
                  value={targetDeckId}
                  onValueChange={setTargetDeckId}
                  required
                >
                  <SelectTrigger className="w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg">
                    <SelectValue placeholder="Select a deck" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {availableDecks.map((deck) => (
                      <SelectItem key={deck.id} value={deck.id}>
                        {deck.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="border border-gray-200 dark:border-white/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300"
                  onClick={() => {
                    setIsMoveDialogOpen(false);
                    setCardToMove(null);
                    setTargetDeckId("");
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-300"
                  onClick={handleMoveCard}
                  disabled={isMovingCard || !targetDeckId}
                >
                  {isMovingCard ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Moving...
                    </>
                  ) : (
                    "Move"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>
    </div>
  );
}
