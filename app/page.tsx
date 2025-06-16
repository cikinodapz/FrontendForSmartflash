"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Users,
  Zap,
  BookOpen,
  TrendingUp,
  Globe,
  ArrowRight,
  Sparkles,
  Target,
  Heart,
  Plus,
  Star,
  Trophy,
  Rocket,
  Shield,
  Lightbulb,
  Play,
  ChevronRight,
  Award,
  Flame,
} from "lucide-react";

export default function HomePage() {
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState({
    users: 0,
    decks: 0,
    cardsStudied: 0,
    satisfaction: 0,
  });

  const demoCards = [
    {
      front: "Apa itu Pancasila?",
      back: "Dasar negara Indonesia yang terdiri dari 5 sila",
      difficulty: "medium",
      subject: "Sejarah",
    },
    {
      front: "What is Machine Learning?",
      back: "AI technique that enables computers to learn without explicit programming",
      difficulty: "hard",
      subject: "Technology",
    },
    {
      front: "Rumus Pythagoras?",
      back: "a² + b² = c²",
      difficulty: "easy",
      subject: "Matematika",
    },
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Quiz",
      description:
        "Generates challenging and realistic distractors to make your quiz more engaging!",
      color: "from-indigo-500 to-cyan-500",
      stats: "97% accuracy in generating distractors",
    },

    {
      icon: Users,
      title: "Public Deck Exploration",
      description:
        "Access public decks, take quizzes, copy, comment, and vote according to your preferences!",
      color: "from-emerald-500 to-teal-500",
      stats: "1K+ active explorers",
    },

    {
      icon: TrendingUp,
      title: "Smart Analytics",
      description:
        "In-depth analytics dashboard with AI-driven insights and performance predictions",
      color: "from-violet-500 to-pink-500",
      stats: "60+ metrics",
    },
    {
      icon: Shield,
      title: "Spaced Repetition Method",
      description:
        "Improve retention and recall with a scientifically proven spaced repetition algorithm!",
      color: "from-amber-500 to-rose-500",
      stats: "Boost retention by up to 90%",
    },
  ];

  const achievements = [
    { icon: Trophy, label: "Top EdTech 2024", value: "Winner" },
    { icon: Star, label: "User Rating", value: "4.9/5" },
    { icon: Award, label: "Innovation Award", value: "Platinum" },
    { icon: Rocket, label: "Growth Rate", value: "+350%" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipped(false);
      setTimeout(() => {
        setCardIndex((prev) => (prev + 1) % demoCards.length);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const animateStats = () => {
      setStats({
        users: Math.floor(Math.random() * 1500) + 3000,
        decks: Math.floor(Math.random() * 600) + 2000,
        cardsStudied: Math.floor(Math.random() * 12000) + 60000,
        satisfaction: 99,
      });
    };
    animateStats();
    const interval = setInterval(animateStats, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-indigo-300 via-purple-200 to-purple-400 dark:from-indigo-950 dark:via-gray-900 dark:to-purple-950"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />

        <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24 z-10">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <motion.div
              className="space-y-6 md:space-y-10"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 text-sm font-semibold rounded-full">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Driven Excellence
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-tight">
                Transform{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Learning
                </span>{" "}
                with AI
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                Experience a{" "}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  personalized, interactive, and challenging
                </span>{" "}
                learning journey with our AI-powered flashcard platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  asChild
                  size="lg"
                  className="text-base sm:text-lg px-6 sm:px-8 md:px-10 py-5 sm:py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <Link href="/login">
                    <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Start Learning Free
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="text-base sm:text-lg px-6 sm:px-8 md:px-10 py-5 sm:py-6 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 group"
                >
                  <Link href="/">
                    <Play className="w-5 h-5 mr-2" />
                    Watch Demo
                  </Link>
                </Button>
              </div>
              {/* Live Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-8 md:pt-10">
                {[
                  {
                    label: "Active Users",
                    value: stats.users.toLocaleString(),
                    icon: Users,
                  },
                  {
                    label: "Available Decks",
                    value: stats.decks.toLocaleString(),
                    icon: BookOpen,
                  },
                  {
                    label: "Cards Studied",
                    value: stats.cardsStudied.toLocaleString(),
                    icon: Target,
                  },
                  {
                    label: "Satisfaction",
                    value: `${stats.satisfaction}%`,
                    icon: Heart,
                  },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      className="p-4 sm:p-6 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-md"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 text-indigo-600 dark:text-indigo-400" />
                      <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {stat.value}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {stat.label}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
            {/* Interactive Flashcard Demo */}
            <motion.div
              className="flex justify-center lg:justify-end relative mt-12 md:mt-0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <AnimatePresence>
                <motion.div
                  key={cardIndex}
                  className="w-full max-w-xs sm:w-96 h-56 sm:h-64 cursor-pointer perspective-1000"
                  onClick={handleCardClick}
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Front of card */}
                  <motion.div
                    className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-indigo-200 dark:border-indigo-700 backface-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <CardContent className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center space-y-4">
                      <motion.div
                        className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                      >
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </motion.div>
                      <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
                        {demoCards[cardIndex].front}
                      </p>
                      <div className="flex gap-2">
                        <Badge
                          variant="outline"
                          className="border-indigo-300 dark:border-indigo-600 text-xs sm:text-sm"
                        >
                          {demoCards[cardIndex].subject}
                        </Badge>
                        <Badge
                          className={
                            demoCards[cardIndex].difficulty === "easy"
                              ? "bg-green-500 text-xs sm:text-sm"
                              : demoCards[cardIndex].difficulty === "medium"
                              ? "bg-yellow-500 text-xs sm:text-sm"
                              : "bg-red-500 text-xs sm:text-sm"
                          }
                        >
                          {demoCards[cardIndex].difficulty === "easy"
                            ? "Easy"
                            : demoCards[cardIndex].difficulty === "medium"
                            ? "Medium"
                            : "Hard"}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                        Click to reveal answer
                      </p>
                    </CardContent>
                  </motion.div>
                  {/* Back of card */}
                  <motion.div
                    className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-emerald-200 dark:border-emerald-700 backface-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <CardContent className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center space-y-4">
                      <motion.div
                        className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </motion.div>
                      <p className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
                        {demoCards[cardIndex].back}
                      </p>
                      <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs sm:text-sm">
                        ✓ Correct Answer
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400"
                      >
                        <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        View AI Explanation
                      </Button>
                    </CardContent>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
              {/* Floating Decorations */}
              <motion.div
                className="absolute -top-6 -right-6 sm:-top-8 sm:-right-8"
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                  <Flame className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
              </motion.div>
              <motion.div
                className="absolute -bottom-6 -left-6 sm:-bottom-8 sm:-left-8"
                animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3.5 }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-gray-50 dark:bg-gray-900 px-4 sm:px-6">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center space-y-4 sm:space-y-6 mb-12 sm:mb-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full">
              <Star className="w-4 h-4 mr-2" />
              Cutting-Edge Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold">
              Advanced{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Technology
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Seamlessly blending AI, machine learning, and superior UX for a
              revolutionary learning experience
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 mb-16 sm:mb-20">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 hover:opacity-10 transition-opacity`}
                  />
                  <CardContent className="p-6 sm:p-8 space-y-4 sm:space-y-6 relative z-10">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <motion.div
                        className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${feature.color} rounded-xl sm:rounded-2xl flex items-center justify-center`}
                        whileHover={{ scale: 1.1 }}
                      >
                        <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                          {feature.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className="mt-1 border-indigo-300 dark:border-indigo-600 text-xs sm:text-sm"
                        >
                          {feature.stats}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                      {feature.description}
                    </p>
                    <Button
                      variant="ghost"
                      className="p-0 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm sm:text-base"
                    >
                      Learn More
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </motion.div>
              );
            })}
          </div>
          {/* Achievements Section */}
          <motion.div
            className="text-center space-y-8 sm:space-y-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
              Achievements & Recognition
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <motion.div
                    key={index}
                    className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <Icon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-yellow-500" />
                    <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {achievement.value}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {achievement.label}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden px-4 sm:px-6">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="container mx-auto px-4 sm:px-6 text-center space-y-8 sm:space-y-12 relative z-10">
          <motion.div
            className="space-y-4 sm:space-y-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white">
              Ready to Redefine Learning?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto">
              Join the AI learning revolution and experience a personalized,
              effective, and engaging educational journey
            </p>
          </motion.div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Button
              asChild
              size="lg"
              className="text-base sm:text-lg px-8 sm:px-12 py-5 sm:py-6 bg-white text-gray-900 hover:bg-gray-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Link href="/dashboard">
                <Rocket className="w-5 h-5 mr-2 group-hover:-translate-y-1 transition-transform" />
                Start Now - Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-base sm:text-lg px-8 sm:px-12 py-5 sm:py-6 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-gray-900"
            >
              <Link href="/eksplorasi">
                <Globe className="w-5 h-5 mr-2" />
                Explore More Decks
              </Link>
            </Button>
          </div>
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="white"
                  strokeWidth="8"
                  strokeDasharray="282.6"
                  strokeDashoffset={282.6 * (1 - 0.99)}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  99%
                </p>
                <p className="text-[10px] sm:text-xs text-white/80">
                  Satisfaction
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
