"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, Wand2 } from "lucide-react";

// Particle effect component
const Particles = dynamic(
  () =>
    Promise.resolve(() => {
      const isClient = typeof window !== "undefined";
      const width = isClient ? window.innerWidth : 1200;
      const height = isClient ? window.innerHeight : 800;
      // Reduce particle count for smaller screens
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

export default function CreatePage() {
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [deckSubject, setDeckSubject] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a deck",
        variant: "destructive",
      });
      router.push("/login");
    }
  }, [router, toast]);

  const saveDeck = async () => {
    if (!deckTitle.trim()) {
      toast({
        title: "Error",
        description: "Deck title cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (!deckSubject) {
      toast({
        title: "Error",
        description: "Please select a deck category",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("http://localhost:3000/user/createDeck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: deckTitle,
          description: deckDescription,
          category: deckSubject,
          isPublic: isPublic,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();

      await Swal.fire({
        title:
          '<span class="text-gray-900 dark:text-white text-xl sm:text-2xl font-bold">Success!</span>',
        html: '<p class="text-gray-700 dark:text-gray-300 text-sm sm:text-base">Your deck has been created.<br>Now, edit it to add some awesome flashcards!</p>',
        icon: "success",
        background: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
        iconColor: "#4f46e5",
        confirmButtonText: "🚀 Go to Dashboard",
        customClass: {
          popup:
            "bg-background shadow-xl rounded-lg sm:rounded-2xl px-6 sm:px-8 py-6 border border-border",
          title: "text-foreground font-bold",
          htmlContainer: "text-muted-foreground",
          confirmButton:
            "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg mt-4 focus:outline-none focus:ring-2 focus:ring-indigo-400",
        },
      });

      // Reset form after success
      setDeckTitle("");
      setDeckDescription("");
      setDeckSubject("");
      setIsPublic(false);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating deck:", error);
      toast({
        title: "Failed to create deck",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <Particles />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto pt-6 sm:pt-8"
      >
        <div className="relative bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-lg sm:rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200/50 dark:border-white/20 p-6 sm:p-8">
          <motion.div
            className="text-center mb-6 sm:mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Create New Deck
            </h1>
            <p className="text-gray-600 dark:text-white/70 text-sm sm:text-base mt-2">
              Set up your flashcard deck to start learning
            </p>
          </motion.div>

          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <motion.div
                className="space-y-2"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-gray-700 dark:text-white/80"
                >
                  Deck Title*
                </Label>
                <div className="relative group">
                  <Input
                    id="title"
                    placeholder="e.g., Basic Mathematics"
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                    required
                    className="pl-4 py-2 sm:py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300 text-sm sm:text-base"
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
                  htmlFor="subject"
                  className="text-sm font-medium text-gray-700 dark:text-white/80"
                >
                  Category*
                </Label>
                <Select
                  value={deckSubject}
                  onValueChange={setDeckSubject}
                  required
                >
                  <SelectTrigger className="pl-4 py-2 sm:py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300 text-sm sm:text-base">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-lg shadow-lg">
                    <SelectItem
                      value="Mathematics"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Mathematics
                    </SelectItem>
                    <SelectItem
                      value="History"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      History
                    </SelectItem>
                    <SelectItem
                      value="Science"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Science
                    </SelectItem>
                    <SelectItem
                      value="Language"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Language
                    </SelectItem>
                    <SelectItem
                      value="Geography"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Geography
                    </SelectItem>
                    <SelectItem
                      value="Art & Culture"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Art & Culture
                    </SelectItem>
                    <SelectItem
                      value="Literature"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Literature
                    </SelectItem>
                    <SelectItem
                      value="General Knowledge"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      General Knowledge
                    </SelectItem>
                    <SelectItem
                      value="Technology"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Technology
                    </SelectItem>
                    <SelectItem
                      value="Music"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Music
                    </SelectItem>
                    <SelectItem
                      value="Sports"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Sports
                    </SelectItem>
                    <SelectItem
                      value="Health & Fitness"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Health & Fitness
                    </SelectItem>
                    <SelectItem
                      value="Economics & Business"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Economics & Business
                    </SelectItem>
                    <SelectItem
                      value="Psychology"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Psychology
                    </SelectItem>
                    <SelectItem
                      value="Philosophy"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Philosophy
                    </SelectItem>
                    <SelectItem
                      value="Astronomy"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Astronomy
                    </SelectItem>
                    <SelectItem
                      value="Computer Science"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Computer Science
                    </SelectItem>
                    <SelectItem
                      value="Other"
                      className="hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm sm:text-base"
                    >
                      Other
                    </SelectItem>
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
                placeholder="Describe your deck..."
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
                className="pl-4 py-2 sm:py-3 w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 transition-all duration-300 min-h-[100px] sm:min-h-[120px] text-sm sm:text-base"
              />
            </motion.div>

            <motion.div
              className="flex items-center space-x-3"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                className="data-[state=checked]:bg-indigo-500 dark:data-[state=checked]:bg-indigo-400"
              />
              <Label
                htmlFor="public"
                className="text-sm font-medium text-gray-700 dark:text-white/80"
              >
                Make this deck public
              </Label>
            </motion.div>

            <motion.div
              className="flex justify-end space-x-3 sm:space-x-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeckTitle("");
                  setDeckDescription("");
                  setDeckSubject("");
                  setIsPublic(false);
                }}
                className="border border-gray-200 dark:border-white/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all duration-300 text-sm sm:text-base px-3 sm:px-4 py-2"
              >
                Reset
              </Button>
              <Button
                onClick={saveDeck}
                disabled={isSaving}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 text-white rounded-lg transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm sm:text-base px-3 sm:px-4 py-2"
              >
                {isSaving ? (
                  <>
                    <Wand2 className="w-4 sm:w-5 h-4 sm:h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                    Save Deck
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
