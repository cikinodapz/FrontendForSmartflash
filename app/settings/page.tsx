"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Volume2, Accessibility, Bell, Shield, Download, Trash2, Save, Sun, Moon } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Accessibility
    textToSpeech: true,
    speechRate: [1],
    darkMode: false,
    fontSize: "medium",
    dyslexiaFont: false,
    highContrast: false,

    // Study Preferences
    autoFlip: false,
    showHints: true,
    studyReminders: true,
    reminderTime: "19:00",

    // Privacy
    publicProfile: false,
    shareProgress: true,
    allowCollaboration: true,

    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
  })

  const { toast } = useToast()

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const saveSettings = () => {
    // Simulate saving settings
    toast({
      title: "Pengaturan Tersimpan",
      description: "Semua perubahan telah disimpan successfully",
    })
  }

  const testTextToSpeech = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(
        "Ini adalah tes text-to-speech dengan kecepatan yang telah Anda atur",
      )
      utterance.lang = "id-ID"
      utterance.rate = settings.speechRate[0]
      speechSynthesis.speak(utterance)
    } else {
      toast({
        title: "Text-to-Speech tidak didukung",
        description: "Browser Anda tidak mendukung fitur text-to-speech",
        variant: "destructive",
      })
    }
  }

  const exportData = () => {
    toast({
      title: "Data Diekspor",
      description: "Data pembelajaran Anda telah diekspor ke file JSON",
    })
  }

  const clearData = () => {
    toast({
      title: "Data Dihapus",
      description: "Semua data pembelajaran telah dihapus",
      variant: "destructive",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Pengaturan</h1>
          <p className="text-muted-foreground">Sesuaikan pengalaman belajar Anda dengan preferensi personal</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Accessibility Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Accessibility className="w-5 h-5" />
                  Aksesibilitas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Text-to-Speech */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Text-to-Speech</Label>
                      <p className="text-sm text-muted-foreground">Aktifkan pembacaan otomatis untuk kartu flashcard</p>
                    </div>
                    <Switch
                      checked={settings.textToSpeech}
                      onCheckedChange={(checked) => updateSetting("textToSpeech", checked)}
                    />
                  </div>

                  {settings.textToSpeech && (
                    <div className="space-y-3 pl-4 border-l-2 border-muted">
                      <div className="space-y-2">
                        <Label>Kecepatan Bicara</Label>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">Lambat</span>
                          <Slider
                            value={settings.speechRate}
                            onValueChange={(value) => updateSetting("speechRate", value)}
                            max={2}
                            min={0.5}
                            step={0.1}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">Cepat</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Kecepatan saat ini: {settings.speechRate[0]}x</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={testTextToSpeech}>
                        <Volume2 className="w-4 h-4 mr-2" />
                        Test Suara
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Visual Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Mode Gelap</Label>
                      <p className="text-sm text-muted-foreground">
                        Gunakan tema gelap untuk mengurangi ketegangan mata
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <Switch
                        checked={settings.darkMode}
                        onCheckedChange={(checked) => {
                          updateSetting("darkMode", checked)
                          // You can add theme switching logic here
                          if (typeof window !== "undefined") {
                            document.documentElement.classList.toggle("dark", checked)
                          }
                        }}
                      />
                      <Moon className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ukuran Font</Label>
                    <Select value={settings.fontSize} onValueChange={(value) => updateSetting("fontSize", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Kecil</SelectItem>
                        <SelectItem value="medium">Sedang</SelectItem>
                        <SelectItem value="large">Besar</SelectItem>
                        <SelectItem value="extra-large">Sangat Besar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Font Ramah Disleksia</Label>
                      <p className="text-sm text-muted-foreground">
                        Gunakan font yang mudah dibaca untuk penderita disleksia
                      </p>
                    </div>
                    <Switch
                      checked={settings.dyslexiaFont}
                      onCheckedChange={(checked) => updateSetting("dyslexiaFont", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Kontras Tinggi</Label>
                      <p className="text-sm text-muted-foreground">
                        Tingkatkan kontras untuk visibilitas yang lebih baik
                      </p>
                    </div>
                    <Switch
                      checked={settings.highContrast}
                      onCheckedChange={(checked) => updateSetting("highContrast", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Study Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Preferensi Belajar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-flip Kartu</Label>
                    <p className="text-sm text-muted-foreground">Balik kartu secara otomatis setelah beberapa detik</p>
                  </div>
                  <Switch
                    checked={settings.autoFlip}
                    onCheckedChange={(checked) => updateSetting("autoFlip", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Tampilkan Hints</Label>
                    <p className="text-sm text-muted-foreground">Tampilkan petunjuk AI saat kesulitan menjawab</p>
                  </div>
                  <Switch
                    checked={settings.showHints}
                    onCheckedChange={(checked) => updateSetting("showHints", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Pengingat Belajar</Label>
                    <p className="text-sm text-muted-foreground">Terima pengingat harian untuk belajar</p>
                  </div>
                  <Switch
                    checked={settings.studyReminders}
                    onCheckedChange={(checked) => updateSetting("studyReminders", checked)}
                  />
                </div>

                {settings.studyReminders && (
                  <div className="space-y-2 pl-4 border-l-2 border-muted">
                    <Label>Waktu Pengingat</Label>
                    <Select
                      value={settings.reminderTime}
                      onValueChange={(value) => updateSetting("reminderTime", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="08:00">08:00 - Pagi</SelectItem>
                        <SelectItem value="12:00">12:00 - Siang</SelectItem>
                        <SelectItem value="17:00">17:00 - Sore</SelectItem>
                        <SelectItem value="19:00">19:00 - Malam</SelectItem>
                        <SelectItem value="21:00">21:00 - Malam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privasi & Keamanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Profil Publik</Label>
                    <p className="text-sm text-muted-foreground">
                      Izinkan pengguna lain melihat profil dan statistik Anda
                    </p>
                  </div>
                  <Switch
                    checked={settings.publicProfile}
                    onCheckedChange={(checked) => updateSetting("publicProfile", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Bagikan Progress</Label>
                    <p className="text-sm text-muted-foreground">Bagikan pencapaian belajar dengan komunitas</p>
                  </div>
                  <Switch
                    checked={settings.shareProgress}
                    onCheckedChange={(checked) => updateSetting("shareProgress", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Izinkan Kolaborasi</Label>
                    <p className="text-sm text-muted-foreground">Terima undangan kolaborasi dari pengguna lain</p>
                  </div>
                  <Switch
                    checked={settings.allowCollaboration}
                    onCheckedChange={(checked) => updateSetting("allowCollaboration", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifikasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">Email</Label>
                    <p className="text-xs text-muted-foreground">Notifikasi via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">Push</Label>
                    <p className="text-xs text-muted-foreground">Notifikasi browser</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">Laporan Mingguan</Label>
                    <p className="text-xs text-muted-foreground">Ringkasan progress</p>
                  </div>
                  <Switch
                    checked={settings.weeklyReport}
                    onCheckedChange={(checked) => updateSetting("weeklyReport", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle>Manajemen Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={exportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Ekspor Data
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive" onClick={clearData}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Semua Data
                </Button>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={saveSettings} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Simpan Pengaturan
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
