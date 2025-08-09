"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid as GridIcon,
  CircleDot,
  Move,
  PanelTop,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** =============================
 *  Tipe data
 *  ============================= */
interface Deck {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}
interface Flashcard {
  id: string;
  question: string;
  answer: string;
  imageUrl: string | null;
  audioUrl: string | null;
  tags: string[];
  difficulty: number;
  createdAt: string;
  updatedAt: string;
}

/** =============================
 *  Konstanta Layout & UI
 *  ============================= */
const CANVAS_W = 1600;
const CANVAS_H = 1000;
const CENTER = { x: CANVAS_W / 2 + 100, y: CANVAS_H / 2 - 50 };

const CARD_W_COMPACT = 260;
const CARD_H_COMPACT = 140;
const CARD_W_EXPANDED = 360;
const CARD_H_EXPANDED = 240;

const HEADER_H = 30;

const CARD_MARGIN = 24;
const RING_START = 220;
const RING_STEP = 180;
const GRID_SIZE = 20;

const DECK_DIAM = 140;
const DECK_R = DECK_DIAM / 2;
const DECK_RING_PX = 4;

/** =============================
 *  Util
 *  ============================= */
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function snap(v: number, step = GRID_SIZE) {
  return Math.round(v / step) * step;
}
function storageKey(deckId: string) {
  return `mindmap-layout-${deckId}`;
}

function circleAnchorTowards(
  center: { x: number; y: number },
  radius: number,
  target: { x: number; y: number }
) {
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: center.x + (dx / len) * radius,
    y: center.y + (dy / len) * radius,
  };
}

function rectAnchorTowards(
  rectCenter: { x: number; y: number },
  w: number,
  h: number,
  target: { x: number; y: number },
  shrink = 12
) {
  const rx = Math.max(1, w / 2 - shrink);
  const ry = Math.max(1, h / 2 - shrink);
  const vx = target.x - rectCenter.x;
  const vy = target.y - rectCenter.y;
  if (vx === 0 && vy === 0) return { x: rectCenter.x, y: rectCenter.y };
  const t =
    1 / Math.max(Math.abs(vx) / rx || Infinity, Math.abs(vy) / ry || Infinity);
  return { x: rectCenter.x + vx * t, y: rectCenter.y + vy * t };
}

/** =============================
 *  Auto Layout Non-Overlap
 *  ============================= */
function autoLayoutNoOverlap(count: number) {
  const cw = CARD_W_COMPACT;
  const ch = CARD_H_COMPACT;
  const out: { x: number; y: number }[] = [];
  if (count <= 0) return out;

  let remaining = count;
  let ringIdx = 0;
  while (remaining > 0) {
    const r = RING_START + ringIdx * RING_STEP;
    const circumference = 2 * Math.PI * r;
    const perNodeArc = Math.max(cw + CARD_MARGIN, 1);
    const slots = Math.max(6, Math.floor(circumference / perNodeArc));

    const take = Math.min(remaining, slots);
    for (let i = 0; i < take; i++) {
      const angle = (2 * Math.PI * i) / take;
      const x = CENTER.x + r * Math.cos(angle);
      const y = CENTER.y + r * Math.sin(angle);

      out.push({
        x: clamp(x, cw / 2 + 8, CANVAS_W - cw / 2 - 8),
        y: clamp(y, ch / 2 + 8, CANVAS_H - ch / 2 - 8),
      });
    }

    remaining -= take;
    ringIdx += 1;
    if (ringIdx > 50) break;
  }
  return out;
}

/** =============================
 *  Komponen Halaman
 *  ============================= */
export default function MindmapPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);

  // editor-like states
  const [scale, setScale] = useState(0.95);
  const [snapGrid, setSnapGrid] = useState(true);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(true);

  // posisi & state per kartu
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // hover untuk highlight edge
  const [hoverId, setHoverId] = useState<string | null>(null);

  // drag state
  const dragRef = useRef<{
    id: string | null;
    offsetX: number;
    offsetY: number;
  }>({
    id: null,
    offsetX: 0,
    offsetY: 0,
  });

  // pointer guard (drag vs click)
  const pointerRef = useRef<{ downX: number; downY: number; moved: boolean }>({
    downX: 0,
    downY: 0,
    moved: false,
  });
  const MOVE_THRESH = 6;

  // refs
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Deck Picker Modal
  const [deckPickerOpen, setDeckPickerOpen] = useState(false);
  const [deckSearch, setDeckSearch] = useState("");
  const [tempSelectedDeckId, setTempSelectedDeckId] = useState<string>("");

  // helper size per card
  const getCardSize = (id: string) => {
    const exp = expanded[id];
    return {
      w: exp ? CARD_W_EXPANDED : CARD_W_COMPACT,
      h: exp ? CARD_H_EXPANDED : CARD_H_COMPACT,
    };
  };

  /** =============================
   *  Fetch Decks (on mount)
   *  ============================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Silakan masuk untuk mengakses mindmap Anda",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }
    const fetchDecks = async () => {
      setLoadingDecks(true);
      try {
        const response = await fetch("http://localhost:3000/user/getAllDeck", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Gagal mengambil daftar deck");
        const data = await response.json();
        setDecks(data.decks || []);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message ?? "Terjadi kesalahan saat mengambil deck",
          variant: "destructive",
        });
      } finally {
        setLoadingDecks(false);
      }
    };
    fetchDecks();
  }, [router, toast]);

  /** =============================
   *  Open Deck Picker once decks loaded
   *  ============================= */
  useEffect(() => {
    if (!loadingDecks) {
      setDeckPickerOpen(true);
      setTempSelectedDeckId("");
    }
  }, [loadingDecks]);

  /** =============================
   *  When deck changes -> fetch cards
   *  ============================= */
  useEffect(() => {
    if (!selectedDeckId) {
      setSelectedDeck(null);
      setFlashcards([]);
      setPositions({});
      setFlipped({});
      setExpanded({});
      return;
    }
    const deck = decks.find((d) => d.id === selectedDeckId) || null;
    setSelectedDeck(deck);
    if (!deck) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchCards = async () => {
      setLoadingCards(true);
      try {
        const response = await fetch(
          `http://localhost:3000/user/listCard/${deck.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error("Gagal mengambil flashcard");
        const data = await response.json();
        const cards: Flashcard[] = data.flashcards || [];
        setFlashcards(cards);
        setFlipped({});
        setExpanded({});
      } catch (err: any) {
        toast({
          title: "Error",
          description:
            err?.message ?? "Terjadi kesalahan saat mengambil flashcard",
          variant: "destructive",
        });
      } finally {
        setLoadingCards(false);
      }
    };
    fetchCards();
  }, [selectedDeckId, decks, toast]);

  /** =============================
   *  Load saved positions or auto-layout
   *  ============================= */
  useEffect(() => {
    if (!selectedDeck || flashcards.length === 0) {
      setPositions({});
      return;
    }

    const key = storageKey(selectedDeck.id);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<
          string,
          { x: number; y: number }
        >;
        const next: Record<string, { x: number; y: number }> = {};
        flashcards.forEach((c) => {
          if (parsed[c.id]) next[c.id] = parsed[c.id];
        });
        const missing = flashcards.filter((c) => !next[c.id]).length;
        if (missing > 0) {
          const extra = autoLayoutNoOverlap(missing);
          let idx = 0;
          flashcards.forEach((c) => {
            if (!next[c.id]) {
              next[c.id] = extra[idx] ?? {
                x: CENTER.x + 300 + idx * 10,
                y: CENTER.y + 300 + idx * 10,
              };
              idx++;
            }
          });
        }
        setPositions(next);
        return;
      } catch {
        // ignore; fallthrough
      }
    }

    const base = autoLayoutNoOverlap(flashcards.length);
    const map: Record<string, { x: number; y: number }> = {};
    flashcards.forEach((c, i) => (map[c.id] = base[i]));
    setPositions(map);
  }, [selectedDeck, flashcards]);

  /** =============================
   *  Derived: filtered cards by search
   *  ============================= */
  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return flashcards;
    return flashcards.filter(
      (c) =>
        c.question.toLowerCase().includes(q) ||
        c.answer.toLowerCase().includes(q) ||
        (c.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [flashcards, search]);

  /** =============================
   *  Actions
   *  ============================= */
  const handleAutoLayout = () => {
    if (!flashcards.length) return;
    const base = autoLayoutNoOverlap(flashcards.length);
    const map: Record<string, { x: number; y: number }> = {};
    flashcards.forEach((c, i) => (map[c.id] = base[i]));
    setPositions(map);
    toast({
      title: "Auto-layout",
      description: "Posisi disusun ulang tanpa tumpang tindih.",
    });
  };

  const handleSaveLayout = () => {
    if (!selectedDeck) return;
    localStorage.setItem(
      storageKey(selectedDeck.id),
      JSON.stringify(positions)
    );
    toast({
      title: "Tersimpan",
      description: "Layout kamu disimpan untuk deck ini.",
    });
  };

  const handleResetLayout = () => {
    if (!selectedDeck) return;
    localStorage.removeItem(storageKey(selectedDeck.id));
    handleAutoLayout();
    toast({
      title: "Di-reset",
      description: "Layout kembali ke bawaan auto-layout.",
    });
  };

  const zoomIn = () => setScale((s) => clamp(s + 0.1, 0.4, 2));
  const zoomOut = () => setScale((s) => clamp(s - 0.1, 0.4, 2));
  const zoomFit = () => {
    const wrap = wrapRef.current;
    if (!wrap) {
      setScale(0.95);
      return;
    }
    const padding = 32;
    const sw = wrap.clientWidth - padding;
    const sh = wrap.clientHeight - padding;
    const sx = sw / CANVAS_W;
    const sy = sh / CANVAS_H;
    setScale(clamp(Math.min(sx, sy), 0.4, 1.2));
  };

  const toggleFlip = (id: string) =>
    setFlipped((p) => ({ ...p, [id]: !p[id] }));
  const toggleExpand = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /** =============================
   *  Drag & Drop + guard klik
   *  ============================= */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const id = dragRef.current.id;
      if (!id) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mx = (e.clientX - rect.left) / scale;
      const my = (e.clientY - rect.top) / scale;

      if (!pointerRef.current.moved) {
        const dx = mx - pointerRef.current.downX;
        const dy = my - pointerRef.current.downY;
        if (Math.hypot(dx, dy) > MOVE_THRESH) pointerRef.current.moved = true;
      }

      const { w: cw, h: ch } = getCardSize(id);

      let nx = mx - dragRef.current.offsetX;
      let ny = my - dragRef.current.offsetY;

      if (snapGrid) {
        nx = snap(nx);
        ny = snap(ny);
      }

      nx = clamp(nx, cw / 2 + 4, CANVAS_W - cw / 2 - 4);
      ny = clamp(ny, ch / 2 + 4, CANVAS_H - ch / 2 - 4);

      setPositions((prev) => ({ ...prev, [id]: { x: nx, y: ny } }));
    };

    const onUp = () => {
      dragRef.current.id = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [scale, snapGrid, expanded]);

  const startDrag =
    (id: string) => (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const mx = (e.clientX - canvasRect.left) / scale;
      const my = (e.clientY - canvasRect.top) / scale;

      const pos = positions[id] || { x: CENTER.x, y: CENTER.y };
      dragRef.current.id = id;
      dragRef.current.offsetX = mx - pos.x;
      dragRef.current.offsetY = my - pos.y;

      pointerRef.current.downX = mx;
      pointerRef.current.downY = my;
      pointerRef.current.moved = false;
    };

  const tryFlip =
    (id: string) =>
    (e: React.MouseEvent | React.KeyboardEvent<HTMLDivElement>) => {
      if (pointerRef.current.moved || dragRef.current.id) return;
      if ("key" in e) {
        const k = e.key.toLowerCase();
        if (k !== "enter" && k !== " ") return;
        e.preventDefault();
      }
      toggleFlip(id);
    };

  // Keyboard shortcuts: + / - / F
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag && /INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoomIn();
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomOut();
      }
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        zoomFit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /** =============================
   *  Render
   *  ============================= */
  const showCards = filteredCards;

  // Filter decks (modal)
  const filteredDecks = useMemo(() => {
    const q = deckSearch.trim().toLowerCase();
    if (!q) return decks;
    return decks.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.category || "").toLowerCase().includes(q) ||
        (d.description || "").toLowerCase().includes(q)
    );
  }, [decks, deckSearch]);

  const confirmPickDeck = () => {
    if (!tempSelectedDeckId) {
      toast({
        title: "Pilih deck dulu",
        description: "Silakan pilih salah satu deck untuk ditampilkan.",
      });
      return;
    }
    setSelectedDeckId(tempSelectedDeckId);
    setDeckPickerOpen(false);
  };

  return (
    <div className="flex flex-col gap-3 px-3 md:px-6 py-3">
      {/* DECK PICKER MODAL */}
      <Dialog open={deckPickerOpen} onOpenChange={setDeckPickerOpen}>
        <DialogContent className="sm:max-w-2xl overflow-hidden p-0">
          {/* Header */}
          <div
            className="relative px-6 pt-6 pb-4 text-white"
            style={{
              background:
                "radial-gradient(120px 120px at 20% 10%, rgba(255,255,255,0.25), transparent), linear-gradient(135deg, #4f46e5 0%, #8b5cf6 55%, #06b6d4 100%)",
            }}
          >
            <DialogHeader className="text-white">
              <DialogTitle className="flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5" />
                Pilih Deck untuk Ditampilkan
              </DialogTitle>
              <DialogDescription className="text-white/90">
                Pilih deck yang ingin kamu lihat di kanvas mindmap. Bisa diganti
                kapan saja dari toolbar.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3">
              <Input
                value={deckSearch}
                onChange={(e) => setDeckSearch(e.target.value)}
                placeholder="Cari deck berdasarkan nama/kategori…"
                className="bg-white/90 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <Label className="min-w-24">Deck</Label>
              <Select
                value={tempSelectedDeckId}
                onValueChange={setTempSelectedDeckId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={loadingDecks ? "Memuat…" : "Pilih deck…"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredDecks.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Tidak ada hasil
                    </div>
                  )}
                  {filteredDecks.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[38vh] overflow-auto pr-1">
              {filteredDecks.map((d) => {
                const active = tempSelectedDeckId === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setTempSelectedDeckId(d.id)}
                    className={`rounded-xl border text-left p-4 transition-all hover:-translate-y-0.5 hover:shadow ${
                      active
                        ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/20"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="font-semibold leading-tight line-clamp-2">
                      {d.name}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {d.description || "Tanpa deskripsi"}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-full px-2 py-0.5 bg-muted">
                        {d.category || "General"}
                      </span>
                      {d.isPublic ? (
                        <span className="rounded-full px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          Publik
                        </span>
                      ) : (
                        <span className="rounded-full px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          Privat
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="px-6 pb-6">
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setDeckPickerOpen(false)}
              >
                Nanti saja
              </Button>
              <Button onClick={confirmPickDeck}>Tampilkan</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TOP BAR */}
      <div className="sticky top-0 z-30 rounded-xl border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">
          <div className="inline-flex items-center gap-2 text-muted-foreground text-xs">
            <PanelTop className="h-4 w-4" />
            <span>Mindmap</span>
          </div>

          <div className="min-w-[220px]">
            {loadingDecks ? (
              <div className="text-xs text-muted-foreground">Memuat deck…</div>
            ) : decks.length ? (
              <Select
                value={selectedDeckId}
                onValueChange={(v) => {
                  setSelectedDeckId(v);
                  setTempSelectedDeckId(v);
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Pilih Deck" />
                </SelectTrigger>
                <SelectContent>
                  {decks.map((deck) => (
                    <SelectItem key={deck.id} value={deck.id}>
                      {deck.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-xs text-muted-foreground">
                Belum ada deck
              </div>
            )}
          </div>

          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Cari card…"
              className="h-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

             {/* Tools kanan */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAutoLayout}
              disabled={!selectedDeck || !flashcards.length}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Auto
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveLayout}
              disabled={!selectedDeck || !flashcards.length}
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetLayout}
              disabled={!selectedDeck || !flashcards.length}
            >
              <CircleDot className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCollapsed((c) => !c)}
              aria-label="Toggle toolbar detail"
            >
              {collapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
          {/* >>> Dikembalikan: tombol navigasi deck/card/kuis <<< */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={() => router.push("/create")}
              size="sm"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg transition-all"
              aria-label="Buat Deck"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Buat Deck
            </Button>

            {selectedDeck && (
              <Button
                onClick={() => router.push(`/edit/${selectedDeck.id}`)}
                size="sm"
                variant="outline"
                className="border border-gray-200 dark:border-white/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 rounded-lg transition-all"
                aria-label="Tambah Card"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Tambah Card
              </Button>
            )}

            {selectedDeck && flashcards.length > 0 && (
              <Button
                size="sm"
                onClick={() => router.push(`/study/${selectedDeck.id}`)}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg transition-all"
                aria-label="Mulai Kuis"
              >
                <PanelTop className="h-4 w-4 mr-1.5" />
                Mulai Kuis
              </Button>
            )}

            {selectedDeck && flashcards.length >= 2 && (
              <Button
                size="sm"
                onClick={() => router.push(`/match/${selectedDeck.id}`)}
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white rounded-lg transition-all"
                aria-label="Mulai Match"
              >
                <CircleDot className="h-4 w-4 mr-1.5" />
                Mulai Match
              </Button>
            )}
            
          </div>
        </div>

        {!collapsed && selectedDeck && (
          <div className="flex flex-wrap items-center gap-4 px-3 pb-2">
            <div className="flex items-center gap-2 text-sm">
              <Switch
                checked={snapGrid}
                onCheckedChange={setSnapGrid}
                id="snap"
              />
              <Label htmlFor="snap" className="cursor-pointer">
                Snap-to-grid
              </Label>
              <GridIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
              <span className="font-medium text-foreground">Deck:</span>
              <span className="truncate max-w-[40ch]">{selectedDeck.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* WRAPPER */}
      <div
        ref={wrapRef}
        className="relative rounded-xl border overflow-auto min-h-[68vh]"
        style={{
          height: "78vh",
          background:
            "repeating-linear-gradient(0deg, rgba(99,102,241,.06) 0, rgba(99,102,241,.06) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(99,102,241,.06) 0, rgba(99,102,241,.06) 1px, transparent 1px, transparent 20px)",
        }}
      >
        {/* KANVAS */}
        <div
          ref={canvasRef}
          className="relative origin-top-left"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `scale(${scale})`,
            transition: "transform 120ms ease",
          }}
        >
          {/* Lines */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={CANVAS_W}
            height={CANVAS_H}
            shapeRendering="geometricPrecision"
          >
            <defs>
              <linearGradient id="edgeGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
              <filter
                id="softGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {selectedDeck &&
              showCards.map((card) => {
                const pos = positions[card.id];
                if (!pos) return null;
                const { w, h } = getCardSize(card.id);

                const deckStart = circleAnchorTowards(
                  CENTER,
                  DECK_R + DECK_RING_PX / 2,
                  pos
                );
                const cardEnd = rectAnchorTowards(pos, w, h, CENTER, 12);
                const isHover = hoverId === card.id;

                return (
                  <line
                    key={`edge-${card.id}`}
                    x1={deckStart.x}
                    y1={deckStart.y}
                    x2={cardEnd.x}
                    y2={cardEnd.y}
                    stroke="url(#edgeGradient)"
                    strokeWidth={isHover ? 3 : 2}
                    strokeLinecap="round"
                    opacity={isHover ? 1 : 0.9}
                    vectorEffect="non-scaling-stroke"
                    filter="url(#softGlow)"
                  />
                );
              })}
          </svg>

          {selectedDeck && (
            <motion.div
              className="absolute flex flex-col items-center justify-center rounded-full text-white shadow-2xl ring-4 ring-white/30"
              style={{
                left: CENTER.x,
                top: CENTER.y,
                transform: "translate(-50%, -50%)",
                width: DECK_DIAM,
                height: DECK_DIAM,
                marginLeft: -2,
                marginTop: -4,
                background:
                  "radial-gradient(ellipse at 30% 30%, rgba(99,102,241,.9), rgba(79,70,229,.95) 60%, rgba(37,99,235,.95))",
              }}
            >
              <div className="px-3 text-center text-sm font-semibold leading-tight line-clamp-2">
                {selectedDeck.name}
              </div>
            </motion.div>
          )}

          {/* FLASHCARD NODES */}
          {showCards.map((card) => {
            const pos = positions[card.id] || CENTER;
            const isFlipped = !!flipped[card.id];
            const isExpanded = !!expanded[card.id];
            const { w: cw, h: ch } = getCardSize(card.id);
            const bodyH = ch - HEADER_H;

            return (
              <motion.div
                key={card.id}
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 20 }}
                className="absolute"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: cw,
                  height: ch,
                  transform: "translate(-50%, -50%)",
                  zIndex: isExpanded ? 20 : 10,
                }}
              >
                <div
                  onMouseDown={startDrag(card.id)}
                  onMouseEnter={() => setHoverId(card.id)}
                  onMouseLeave={() => setHoverId(null)}
                  className="group relative h-full select-none rounded-xl border bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                  style={{ borderColor: "rgba(99,102,241,0.25)" }}
                >
                  {/* header/handle */}
                  <div className="flex items-center justify-between px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-grab active:cursor-grabbing">
                    <div className="flex items-center gap-1.5">
                      <Move className="h-3.5 w-3.5 opacity-70" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="rounded-full px-2 py-0.5 bg-indigo-600/10 text-indigo-600 dark:text-indigo-300">
                        {card.tags?.[0] ?? "Card"}
                      </div>
                      {/* Expand button */}
                      {/* Expand button (ikon, lebih rapi & konsisten) */}
                      <button
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] border border-gray-200 dark:border-white/20 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-300 transition"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(card.id);
                        }}
                        title={isExpanded ? "Kecilkan" : "Perbesar"}
                        aria-label={
                          isExpanded ? "Kecilkan kartu" : "Perbesar kartu"
                        }
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronUp className="h-3.5 w-3.5" />
                        )}
                        {isExpanded ? "Collapse" : "Expand"}
                      </button>
                    </div>
                  </div>

                  {/* body flip area */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={
                      isFlipped ? "Tampilkan pertanyaan" : "Tampilkan jawaban"
                    }
                    onClick={tryFlip(card.id)}
                    onKeyDown={tryFlip(card.id)}
                    onDoubleClick={() => toggleExpand(card.id)}
                    className="relative mx-2 mb-2 rounded-lg overflow-hidden"
                    style={{
                      height: bodyH,
                      perspective: "1000px",
                    }}
                  >
                    <div
                      className="relative w-full h-full"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
                        transition: "transform 420ms cubic-bezier(.2,.7,.2,1)",
                      }}
                    >
                      {/* FRONT — Question */}
                      <div
                        className="absolute inset-0 p-3 flex flex-col gap-2"
                        style={{
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                        }}
                      >
                        <div className="text-[10px] uppercase tracking-wide text-indigo-600/80 dark:text-indigo-300/90">
                          Pertanyaan
                        </div>
                        <div
                          className="text-[13px] text-gray-900 dark:text-gray-100 font-medium whitespace-pre-wrap break-words overflow-auto pr-1"
                          style={{ scrollbarGutter: "stable" }}
                        >
                          {card.question || "Tidak ada pertanyaan"}
                        </div>
                        <div className="absolute right-2 bottom-2 text-[10px] text-muted-foreground opacity-80">
                          Klik / Tap untuk lihat jawaban
                        </div>
                      </div>

                      {/* BACK — Answer */}
                      <div
                        className="absolute inset-0 p-3 flex flex-col gap-2 rounded-lg"
                        style={{
                          transform: "rotateY(180deg)",
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          background:
                            "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.08))",
                        }}
                      >
                        <div className="text-[10px] uppercase tracking-wide text-emerald-600/90 dark:text-emerald-300">
                          Jawaban
                        </div>
                        <div
                          className="text-[13px] text-gray-900 dark:text-gray-100 font-medium leading-snug whitespace-pre-wrap break-words overflow-auto pr-1"
                          style={{ scrollbarGutter: "stable" }}
                        >
                          {card.answer || "Tidak ada jawaban"}
                        </div>

                        {card.imageUrl && (
                          <div className="mt-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={card.imageUrl}
                              alt="ilustrasi"
                              className="max-h-24 w-auto rounded-md object-cover"
                            />
                          </div>
                        )}

                        <div className="absolute right-2 bottom-2 text-[10px] text-muted-foreground opacity-80">
                          Klik / Tap untuk kembali
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* glow */}
                  <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-indigo-500/20 group-hover:ring-indigo-500/40" />
                </div>
              </motion.div>
            );
          })}

          {/* LOADING OVERLAY */}
          {loadingCards && selectedDeck && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/50">
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Memuat flashcard…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING ZOOM CONTROLS (fixed) */}
      <div className="fixed bottom-3 right-3 z-50">
        <div className="rounded-xl border bg-background/90 backdrop-blur px-2 py-1.5 shadow-sm">
          <div className="flex items-center gap-1.5">
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              onClick={zoomOut}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              onClick={zoomIn}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-lg border border-gray-200 dark:border-white/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
              onClick={zoomFit}
              aria-label="Fit to screen"
            >
              <Maximize className="mr-1 h-4 w-4" />
              Fit
            </Button>
          </div>
        </div>
      </div>

      {/* FOOT TIP */}
      <div className="text-[11px] text-muted-foreground flex items-center gap-2">
        <GridIcon className="h-3.5 w-3.5" />
        Konten panjang <b>wrap & scroll</b>. Double-click atau tombol{" "}
        <b>Expand</b> buat perbesar kartu. Flip tetap: klik/tap badan kartu.
        Shortcuts: <b>+</b>, <b>-</b>, <b>F</b>.
      </div>
    </div>
  );
}
