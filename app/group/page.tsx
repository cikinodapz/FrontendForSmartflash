"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

// ===== shadcn/ui =====
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// ===== Icons =====
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Users,
  Lock,
  Globe2,
  Layers,
  Grid,
} from "lucide-react";

// ========= Types =========
interface Deck {
  id: string;
  name: string;
}

interface DeckGroup {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  decks: Deck[];
}

// ========= Particles (reused look & feel) =========
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
              animate={{ y: [0, isClient ? -height : -800], opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </div>
      );
    }),
  { ssr: false }
);

export default function DeckGroupsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // ===== State =====
  const [groups, setGroups] = useState<DeckGroup[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dialog / form state
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([]);

  // UX helpers
  const [query, setQuery] = useState("");
  const [onlyPublic, setOnlyPublic] = useState(false);

  // ===== Guard: require token =====
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage deck groups",
        variant: "destructive",
      });
      router.push("/login");
    }
  }, [router, toast]);

  // ===== Load data =====
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [groupRes, deckRes] = await Promise.all([
        fetch("http://localhost:3000/user/deck-groups", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch("http://localhost:3000/user/getAllDeck", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);

      if (!groupRes.ok) throw new Error(await groupRes.text());
      if (!deckRes.ok) throw new Error(await deckRes.text());

      const groupJson = await groupRes.json();
      const deckJson = await deckRes.json();

      setGroups(groupJson.deckGroups || []);
      setDecks(deckJson.decks || []);
    } catch (err: any) {
      toast({
        title: "Gagal memuat data",
        description: err?.message ?? "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const refreshGroups = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("http://localhost:3000/user/deck-groups", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setGroups(json.deckGroups || []);
    } catch (err: any) {
      toast({
        title: "Gagal menyegarkan",
        description: err?.message ?? "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // ===== Dialog handlers =====
  const openCreateDialog = () => {
    setEditMode(false);
    setEditingId(null);
    setName("");
    setDescription("");
    setIsPublic(false);
    setSelectedDeckIds([]);
    setOpenDialog(true);
  };

  const openEditDialog = (group: DeckGroup) => {
    setEditMode(true);
    setEditingId(group.id);
    setName(group.name);
    setDescription(group.description || "");
    setIsPublic(group.isPublic);
    setSelectedDeckIds(group.decks.map((d) => d.id));
    setOpenDialog(true);
  };

  // ===== Submit (create / edit) =====
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleSubmit = async () => {
    if (isSaving) return;
    if (!name.trim()) {
      toast({ title: "Nama wajib diisi", variant: "destructive" });
      return;
    }

    const body = { name, description, deckIds: selectedDeckIds, isPublic };
    const url = editMode
      ? `http://localhost:3000/user/edit-deck-groups/${editingId}`
      : "http://localhost:3000/user/create-deck-gruops"; // pakai endpoint API kamu
    const method = editMode ? "PUT" : "POST";

    try {
      setIsSaving(true);
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());

      // === penting: tutup Dialog dulu biar focus-trap Radix nggak ngeblok Swal ===
      setOpenDialog(false);
      await sleep(60); // kasih jeda se-tick

      await Swal.fire({
        title:
          '<span class="text-gray-900 dark:text-white text-xl sm:text-2xl font-bold">Berhasil</span>',
        html: `<p class="text-gray-700 dark:text-gray-300 text-sm sm:text-base">Deck group ${
          editMode ? "diperbarui" : "berhasil dibuat"
        }.</p>`,
        icon: "success",
        background: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
        iconColor: "#4f46e5",
        confirmButtonText: "OK",
        focusConfirm: true,
        returnFocus: false, // jangan balikin fokus ke elemen yang udah ke-unmount
        heightAuto: false,
        customClass: {
          popup:
            "bg-background shadow-xl rounded-lg sm:rounded-2xl px-6 sm:px-8 py-6 border border-border",
          title: "text-foreground font-bold",
          htmlContainer: "text-muted-foreground",
          confirmButton:
            "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg mt-4 focus:outline-none focus:ring-2 focus:ring-indigo-400",
        },
      });

      await refreshGroups();
    } catch (err: any) {
      toast({
        title: "Gagal menyimpan",
        description: err?.message ?? "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ===== Delete =====
  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title:
        '<span class="text-gray-900 dark:text-white text-xl sm:text-2xl font-bold">Hapus grup?</span>',
      html:
        '<p class="text-gray-700 dark:text-gray-300 text-sm sm:text-base">Tindakan ini tidak bisa dibatalkan.</p>',
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      background: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
      iconColor: "#ef4444",
      customClass: {
        popup:
          "bg-background shadow-xl rounded-lg sm:rounded-2xl px-6 sm:px-8 py-6 border border-border",
        confirmButton:
          "bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg mt-2",
        cancelButton:
          "bg-muted hover:bg-muted/80 text-foreground font-semibold py-2 px-4 sm:px-6 rounded-lg mt-2 ml-2",
      },
      heightAuto: false,
      returnFocus: false,
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(
        `http://localhost:3000/user/delete-deck-groups/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Grup dihapus" });
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch (err: any) {
      toast({
        title: "Gagal menghapus",
        description: err?.message ?? "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  // ===== Selections =====
  const toggleDeckSelection = (deckId: string) => {
    setSelectedDeckIds((prev) =>
      prev.includes(deckId) ? prev.filter((id) => id !== deckId) : [...prev, deckId]
    );
  };

  // ===== Derived: filtering/searching =====
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter((g) => {
      const okPublic = onlyPublic ? g.isPublic : true;
      const okQuery = !q
        ? true
        : g.name.toLowerCase().includes(q) ||
          (g.description || "").toLowerCase().includes(q);
      return okPublic && okQuery;
    });
  }, [groups, query, onlyPublic]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <Particles />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-full sm:max-w-2xl lg:max-w-5xl mx-auto pt-4 sm:pt-6"
      >
        {/* Header */}
        <div className="relative bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <Grid className="w-6 h-6" /> Deck Groups
              </h1>
              <p className="text-gray-600 dark:text-white/70 text-sm sm:text-base mt-1">
                Kelola grup untuk mengelompokkan deck kamu
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={refreshGroups}
                disabled={isRefreshing}
                className="border border-gray-200 dark:border-white/20"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                onClick={openCreateDialog}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Grup
              </Button>
            </div>
          </div>

          {/* Tools row */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="col-span-2">
              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama / deskripsi grup..."
                  className="pl-10 bg-white/60 dark:bg-white/5 border-gray-200 dark:border-white/20"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-between sm:justify-end p-2 rounded-lg bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/20">
              <div className="flex items-center gap-2">
                <Switch
                  id="onlyPublic"
                  checked={onlyPublic}
                  onCheckedChange={setOnlyPublic}
                />
                <Label htmlFor="onlyPublic" className="text-sm">
                  Tampilkan hanya publik
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/20 animate-pulse"
                />
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white/80 dark:bg-gray-900/10 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-white/20"
            >
              <p className="text-gray-700 dark:text-white/80">
                Tidak ada grup yang cocok dengan filter.
              </p>
              <div className="mt-4">
                <Button
                  onClick={openCreateDialog}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" /> Buat grup pertama
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map((group, idx) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * idx, duration: 0.3 }}
                  className="group relative rounded-xl overflow-hidden bg-white/90 dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Gradient overlay for visual interest */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-900/20 to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {group.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                          {group.description || "No description provided"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`border ${group.isPublic ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : "border-amber-500 text-amber-600 dark:text-amber-400"}`}
                      >
                        {group.isPublic ? (
                          <Globe2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Lock className="w-3 h-3 mr-1" />
                        )}
                        {group.isPublic ? "Public" : "Private"}
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Layers className="w-4 h-4" /> {group.decks.length} decks
                    </div>

                    {/* Selected decks preview - improved with hover tooltip or limited display */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {group.decks.slice(0, 4).map((d) => (
                        <Badge
                          key={d.id}
                          variant="secondary"
                          className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300"
                        >
                          {d.name}
                        </Badge>
                      ))}
                      {group.decks.length > 4 && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300"
                        >
                          +{group.decks.length - 4} more
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(group)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                      >
                        <Edit2 className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(group.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200/50 dark:border-white/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editMode ? "Edit Deck Group" : "Buat Deck Group"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="group-name">Nama Grup</Label>
                <Input
                  id="group-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mis. Ulangan Matematika"
                  className="bg-white/60 dark:bg-white/5 border-gray-200 dark:border-white/20"
                />
              </div>
              <div>
                <Label htmlFor="group-desc">Deskripsi</Label>
                <Input
                  id="group-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opsional"
                  className="bg-white/60 dark:bg-white/5 border-gray-200 dark:border-white/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="public">Publik</Label>
              </div>
            </div>

            {/* Deck selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pilih Deck</Label>
                <span className="text-xs text-gray-500">
                  {selectedDeckIds.length} dipilih
                </span>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-white/20 bg-white/50 dark:bg-white/5 p-2 max-h-56 overflow-y-auto">
                <AnimatePresence initial={false}>
                  {decks.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">
                      Belum ada deck.
                    </p>
                  ) : (
                    decks.map((deck) => {
                      const active = selectedDeckIds.includes(deck.id);
                      return (
                        <motion.button
                          key={deck.id}
                          onClick={() => toggleDeckSelection(deck.id)}
                          className={`w-full text-left text-sm px-3 py-2 rounded-md mb-1 border transition ${
                            active
                              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-800 dark:text-indigo-200"
                              : "bg-transparent border-transparent hover:bg-gray-500/10"
                          }`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                        >
                          {deck.name}
                        </motion.button>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
              {selectedDeckIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedDeckIds.map((id) => {
                    const d = decks.find((x) => x.id === id);
                    if (!d) return null;
                    return (
                      <span
                        key={id}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20"
                      >
                        {d.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <div className="flex w-full justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenDialog(false)}
                className="border-gray-200 dark:border-white/20"
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              >
                {isSaving ? "Menyimpan..." : editMode ? "Update" : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}