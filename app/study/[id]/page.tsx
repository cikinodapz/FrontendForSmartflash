"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  RotateCcw,
  Volume2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Trophy,
  Target,
  Brain,
  Sparkles,
} from "lucide-react";

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  flashcardId: string;
  question: string;
  imageUrl: string | null;
  audioUrl: string | null;
  difficulty: number;
  options: QuizOption[];
  correctAnswer: string;
  progress: {
    repetitions: number;
    easeFactor: number;
    interval: number;
  };
}

interface Quiz {
  deckId: string;
  deckName: string;
  totalQuestions: number;
  questions: QuizQuestion[];
  statistics: {
    totalCards: number;
    learnedCards: number;
    dueForReview: number;
  };
}

const cardVariants = {
  front: { rotateY: 0, opacity: 1 },
  back: { rotateY: 180, opacity: 1 },
  hidden: { opacity: 0 },
};

const buttonVariants = {
  hover: { scale: 1.05, boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.2)" },
  tap: { scale: 0.95 },
};

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [explanation, setExplanation] = useState<string | null>(null);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/user/quiz/start/${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        if (data.message === "Quiz generated successfully") {
          setQuiz(data.quiz);
        } else {
          throw new Error("Failed to fetch quiz");
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
        toast({
          title: "Gagal memuat kuis",
          description:
            error instanceof Error ? error.message : "Terjadi kesalahan",
          variant: "destructive",
        });
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, router, toast]);

  // Trigger confetti on completion
  useEffect(() => {
    if (isComplete) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3B82F6", "#8B5CF6", "#22C55E"],
      });
    }
  }, [isComplete]);

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleAnswerSubmit = async () => {
    if (!selectedOption || !quiz) return;
    setIsLoading(true);
    try {
      const selectedOptionText = quiz.questions[currentCardIndex].options.find(
        (opt) => opt.id === selectedOption
      )?.text;
      const response = await fetch(
        `http://localhost:3000/user/quiz/answer/${quizId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            flashcardId: quiz.questions[currentCardIndex].flashcardId,
            selectedOption: selectedOptionText,
          }),
        }
      );
      if (!response.ok) throw new Error(await response.text());
      const result = await response.json();
      if (result.message === "Answer submitted successfully") {
        const { correct, correctAnswer, selectedAnswer, explanation } =
          result.result;
        setExplanation(explanation);
        toast({
          title: correct ? "Jawaban Benar!" : "Jawaban Salah",
          description: correct
            ? `Bagus! Jawaban Anda "${selectedAnswer}" benar.`
            : `Jawaban Anda "${selectedAnswer}" salah. Jawaban yang benar adalah "${correctAnswer}".`,
          variant: correct ? "default" : "destructive",
        });
        if (correct) {
          setCorrectAnswers((prev) => prev + 1);
          setStreak((prev) => prev + 1);
          if (streak + 1 >= 3) {
            toast({
              title: "🎉 Streak Luar Biasa!",
              description: `Anda sudah benar ${
                streak + 1
              } kali berturut-turut!`,
            });
          }
        } else {
          setWrongAnswers((prev) => prev + 1);
          setStreak(0);
        }
        setTimeout(() => {
          if (currentCardIndex < quiz.questions.length - 1) {
            setCurrentCardIndex((prev) => prev + 1);
            setIsFlipped(false);
            setShowExplanation(false);
            setSelectedOption(null);
            setExplanation(null);
          } else {
            setIsComplete(true);
          }
        }, 1000);
      } else {
        throw new Error("Failed to submit answer");
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast({
        title: "Gagal mengirim jawaban",
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextToSpeech = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Text-to-Speech tidak didukung",
        description: "Browser Anda tidak mendukung fitur text-to-speech",
        variant: "destructive",
      });
    }
  };

  const resetStudy = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/user/quiz/start/${quizId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      if (data.message === "Quiz generated successfully") {
        setQuiz(data.quiz);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setShowExplanation(false);
        setCorrectAnswers(0);
        setWrongAnswers(0);
        setIsComplete(false);
        setStreak(0);
        setSelectedOption(null);
        setExplanation(null);
      }
    } catch (error) {
      console.error("Error resetting quiz:", error);
      toast({
        title: "Gagal mengulang kuis",
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-purple-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-600 dark:text-gray-300 flex items-center gap-2"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
          Memuat kuis...
        </motion.div>
      </div>
    );
  }

  if (isComplete) {
    const accuracy =
      Math.round((correctAnswers / (correctAnswers + wrongAnswers)) * 100) || 0;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-purple-900">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full mx-4"
        >
          <Card className="border-2 border-blue-500/50 dark:border-purple-500/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500/20 to-purple-600/20">
              <CardTitle className="text-3xl font-bold text-blue-600 dark:text-purple-400 flex items-center justify-center">
                <Trophy className="w-10 h-10 mr-3 text-yellow-500" />
                Sesi Selesai!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-8 text-center">
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Selamat! Anda telah menyelesaikan kuis dengan luar biasa!
                Lakukan ujian minimal 3x berhasil agar lebih menguasainya!!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="border-2 border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/30">
                  <CardContent className="p-6">
                    <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-3" />
                    <p className="text-3xl font-bold text-green-600">
                      {correctAnswers}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Jawaban Benar
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30">
                  <CardContent className="p-6">
                    <XCircle className="w-10 h-10 mx-auto text-red-500 mb-3" />
                    <p className="text-3xl font-bold text-red-600">
                      {wrongAnswers}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Jawaban Salah
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30">
                  <CardContent className="p-6">
                    <Target className="w-10 h-10 mx-auto text-blue-500 mb-3" />
                    <p className="text-3xl font-bold text-blue-600">
                      {accuracy}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Akurasi
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    onClick={resetStudy}
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 rounded-xl px-6 py-3 font-semibold"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Ulangi Sesi
                  </Button>
                </motion.div>
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    className="w-full sm:w-auto border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl px-6 py-3 font-semibold"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Kembali ke Dashboard
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentCardIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-purple-900 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="border-2 border-blue-500/50 dark:border-purple-500/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500/20 to-purple-600/20">
            <div className="flex items-center justify-between">
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                  className="text-gray-700 dark:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Kembali
                </Button>
              </motion.div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-blue-600 dark:text-purple-400">
                  Kuis Interaktif
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Kartu {currentCardIndex + 1} dari {quiz.totalQuestions}
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-blue-300 dark:border-purple-300 bg-blue-100 dark:bg-purple-900/50 text-blue-600 dark:text-purple-300 font-semibold"
              >
                Streak: {streak}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            {/* Progress */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-200">
                <span>Progres Belajar</span>
                <span>
                  {Math.round(
                    ((currentCardIndex + 1) / quiz.totalQuestions) * 100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={((currentCardIndex + 1) / quiz.totalQuestions) * 100}
                className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-600"
              />
            </div>

            {/* Flashcard */}
            <motion.div
              className="relative w-full max-w-2xl mx-auto min-h-[400px]"
              animate={isFlipped ? "back" : "front"}
              variants={cardVariants}
              transition={{ duration: 0.7 }}
              style={{ transformStyle: "preserve-3d" }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Front */}
              <Card
                className="absolute inset-0 backface-hidden border-2 border-blue-300 dark:border-purple-300 bg-white dark:bg-gray-700 shadow-xl hover:shadow-2xl transition-shadow rounded-2xl"
                style={{ backfaceVisibility: "hidden" }}
              >
                <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 overflow-y-auto">
                  <Brain className="w-12 h-12 text-blue-600 dark:text-purple-400" />
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white whitespace-normal break-words">
                    {currentQuestion.question}
                  </p>
                  <Badge
                    variant={
                      currentQuestion.difficulty <= 2
                        ? "default"
                        : currentQuestion.difficulty <= 4
                        ? "secondary"
                        : "destructive"
                    }
                    className={
                      currentQuestion.difficulty <= 2
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : currentQuestion.difficulty <= 4
                        ? "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                    }
                  >
                    {currentQuestion.difficulty <= 2
                      ? "Mudah"
                      : currentQuestion.difficulty <= 5
                      ? "Menengah"
                      : "Sulit"}
                  </Badge>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Klik untuk melihat opsi jawaban
                  </p>
                </CardContent>
              </Card>

              {/* Back */}
              <Card
                className="absolute inset-0 backface-hidden border-2 border-green-300 dark:border-green-600 bg-white dark:bg-gray-700 shadow-xl hover:shadow-2xl transition-shadow rounded-2xl"
                style={{
                  transform: "rotateY(180deg)",
                  backfaceVisibility: "hidden",
                }}
              >
                <CardContent className="flex flex-col items-center justify-start h-full p-8 text-center space-y-6 overflow-y-auto">
                  <Target className="w-12 h-12 text-green-600 dark:text-green-400" />
                  <div className="space-y-3 w-full max-w-md">
                    {currentQuestion.options.map((option) => (
                      <motion.div
                        key={option.id}
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Button
                          variant={
                            selectedOption === option.id ? "default" : "outline"
                          }
                          className={`w-full border-2 font-medium text-left ${
                            selectedOption === option.id
                              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                              : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          } rounded-xl py-3 px-4 transition-all duration-200 min-h-[48px] h-auto flex items-center justify-start text-sm leading-relaxed whitespace-normal break-words`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOptionSelect(option.id);
                          }}
                        >
                          <span className="flex-1">{option.text}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTextToSpeech(
                          currentQuestion.options
                            .map((opt) => opt.text)
                            .join(", ")
                        );
                      }}
                      className="text-gray-700 dark:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-full"
                    >
                      <Volume2 className="w-5 h-5 mr-2" />
                      Dengarkan Opsi
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <AnimatePresence>
              {isFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center gap-4">
                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        onClick={handleAnswerSubmit}
                        disabled={!selectedOption || isLoading}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 rounded-xl px-6 py-3 font-semibold"
                      >
                        {isLoading ? (
                          <>
                            <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Kirim Jawaban
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {showExplanation && explanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6"
                      >
                        <Card className="border-2 border-purple-300 dark:border-purple-600 bg-white/80 dark:bg-gray-800/80 rounded-xl">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-3">
                              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-1" />
                              <div className="text-left">
                                <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">
                                  Penjelasan AI:
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                                  {explanation}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats */}
            <div className="flex justify-center gap-12 text-sm font-medium text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Benar: {correctAnswers}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span>Salah: {wrongAnswers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
