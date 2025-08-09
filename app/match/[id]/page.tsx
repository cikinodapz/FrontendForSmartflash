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
  ArrowLeft,
  CheckCircle,
  XCircle,
  Sparkles,
  Link2,
  Trophy,
} from "lucide-react";

interface MatchQuestion {
  id: string;
  question: string;
  imageUrl: string | null;
  audioUrl: string | null;
}

interface MatchAnswer {
  id: string;
  answer: string;
}

interface MatchData {
  deckId: string;
  deckName: string;
  questions: MatchQuestion[];
  answers: MatchAnswer[];
}

const cardVariants = {
  hover: { scale: 1.03, boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.2)" },
  tap: { scale: 0.98 },
  selected: { backgroundColor: "#DBEAFE", borderColor: "#3B82F6" },
  disabled: { opacity: 0.5 },
};

const buttonVariants = {
  hover: { scale: 1.05, boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.2)" },
  tap: { scale: 0.95 },
};

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const deckId = params.id as string;

  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [pairs, setPairs] = useState<{ questionId: string; answerId: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [correctMatches, setCorrectMatches] = useState<number>(0);

  // Fetch match data
  useEffect(() => {
    const fetchMatch = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/user/match/start/${deckId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        if (data.message === "Match dimulai") {
          setMatchData(data.match);
        } else {
          throw new Error("Gagal memuat data match");
        }
      } catch (error) {
        console.error("Error fetching match:", error);
        toast({
          title: "Gagal memuat match",
          description: error instanceof Error ? error.message : "Terjadi kesalahan",
          variant: "destructive",
        });
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMatch();
  }, [deckId, router, toast]);

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

  const handleSelectQuestion = (qId: string) => {
    if (!pairs.some((p) => p.questionId === qId)) {
      setSelectedQuestion(qId);
    }
  };

  const handleSelectAnswer = (aId: string) => {
    if (!selectedQuestion || !matchData) return;
    if (pairs.some((p) => p.questionId === selectedQuestion || p.answerId === aId)) {
      toast({
        title: "Pasangan tidak valid",
        description: "Pertanyaan atau jawaban tersebut sudah dipasangkan",
        variant: "destructive",
      });
      return;
    }
    setPairs([...pairs, { questionId: selectedQuestion, answerId: aId }]);
    setSelectedQuestion(null);
  };

  const handleSubmit = async () => {
    if (!matchData || pairs.length === 0) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `http://localhost:3000/user/match/answer/${deckId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ matches: pairs }),
        }
      );
      if (!response.ok) throw new Error(await response.text());
      const result = await response.json();
      setCorrectMatches(result.correctMatches);
      setIsComplete(true);
      toast({
        title: "Match Selesai",
        description: `Benar ${result.correctMatches} dari ${result.totalMatches}`,
      });
    } catch (error) {
      console.error("Error submitting match:", error);
      toast({
        title: "Gagal mengirim jawaban",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetMatch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/user/match/start/${deckId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      if (data.message === "Match dimulai") {
        setMatchData(data.match);
        setPairs([]);
        setSelectedQuestion(null);
        setIsComplete(false);
        setCorrectMatches(0);
      }
    } catch (error) {
      console.error("Error resetting match:", error);
      toast({
        title: "Gagal mengulang match",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !matchData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-purple-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-600 dark:text-gray-300 flex items-center gap-2"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
          Memuat match...
        </motion.div>
      </div>
    );
  }

  if (isComplete) {
    const accuracy =
      Math.round((correctMatches / matchData.questions.length) * 100) || 0;

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
                Sesi Match Selesai!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-8 text-center">
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Selamat! Anda telah menyelesaikan sesi match dengan luar biasa!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="border-2 border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/30">
                  <CardContent className="p-6">
                    <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-3" />
                    <p className="text-3xl font-bold text-green-600">
                      {correctMatches}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Pasangan Benar
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30">
                  <CardContent className="p-6">
                    <Link2 className="w-10 h-10 mx-auto text-blue-500 mb-3" />
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
                    onClick={resetMatch}
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 rounded-xl px-6 py-3 font-semibold"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
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
                  Mode Match: {matchData.deckName}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Pasangkan {pairs.length} dari {matchData.questions.length} kartu
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-blue-300 dark:border-purple-300 bg-blue-100 dark:bg-purple-900/50 text-blue-600 dark:text-purple-300 font-semibold"
              >
                Pasangan: {pairs.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            {/* Progress */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-200">
                <span>Progres Match</span>
                <span>
                  {Math.round((pairs.length / matchData.questions.length) * 100)}%
                </span>
              </div>
              <Progress
                value={(pairs.length / matchData.questions.length) * 100}
                className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-600"
              />
            </div>

            {/* Questions and Answers */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Questions */}
              <div className="flex-1">
                <h3 className="font-medium text-lg text-gray-700 dark:text-gray-200 mb-3">
                  Pertanyaan
                </h3>
                <div className="space-y-3">
                  {matchData.questions.map((q) => (
                    <motion.div
                      key={q.id}
                      variants={cardVariants}
                      whileHover={!pairs.some((p) => p.questionId === q.id) ? "hover" : ""}
                      whileTap={!pairs.some((p) => p.questionId === q.id) ? "tap" : ""}
                      animate={selectedQuestion === q.id ? "selected" : pairs.some((p) => p.questionId === q.id) ? "disabled" : ""}
                    >
                      <Card
                        className={`p-4 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-md hover:shadow-lg transition-shadow rounded-xl cursor-pointer min-h-[60px] flex items-center justify-start text-sm leading-relaxed whitespace-normal break-words`}
                        onClick={() => handleSelectQuestion(q.id)}
                      >
                        <span className="flex-1">{q.question}</span>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
              {/* Answers */}
              <div className="flex-1">
                <h3 className="font-medium text-lg text-gray-700 dark:text-gray-200 mb-3">
                  Jawaban
                </h3>
                <div className="space-y-3">
                  {matchData.answers.map((a) => (
                    <motion.div
                      key={a.id}
                      variants={cardVariants}
                      whileHover={!pairs.some((p) => p.answerId === a.id) ? "hover" : ""}
                      whileTap={!pairs.some((p) => p.answerId === a.id) ? "tap" : ""}
                      animate={pairs.some((p) => p.answerId === a.id) ? "disabled" : ""}
                    >
                      <Card
                        className={`p-4 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-md hover:shadow-lg transition-shadow rounded-xl cursor-pointer min-h-[60px] flex items-center justify-start text-sm leading-relaxed whitespace-normal break-words`}
                        onClick={() => handleSelectAnswer(a.id)}
                      >
                        <span className="flex-1">{a.answer}</span>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || pairs.length !== matchData.questions.length}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 rounded-xl px-6 py-3 font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Kirim Pasangan
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}