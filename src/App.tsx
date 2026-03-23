/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  User, 
  Image as ImageIcon, 
  Palette, 
  Sparkles, 
  Download, 
  Loader2,
  ChevronRight,
  Info,
  ShoppingBag,
  Mic,
  Play,
  Volume2,
  FileText,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Modality } from "@google/genai";

// Character profile to maintain consistency
const BASE_CHARACTER_DESCRIPTION = "A beautiful Indonesian woman with tan skin, almond-shaped dark brown eyes, a gentle smile, and long straight black hair. She has distinct Southeast Asian features.";

const BACKGROUND_THEMES = [
  { id: 'bali', label: 'Pantai Bali', prompt: 'on a beautiful Bali beach with sunset background', type: 'outdoor' },
  { id: 'borobudur', label: 'Candi Borobudur', prompt: 'at the majestic Borobudur temple', type: 'outdoor' },
  { id: 'jakarta', label: 'Urban Jakarta', prompt: 'in a modern Jakarta city street with skyscrapers', type: 'outdoor' },
  { id: 'village', label: 'Pedesaan', prompt: 'in a peaceful Indonesian rice field village', type: 'outdoor' },
  { id: 'cafe', label: 'Kafe Estetik', prompt: 'inside a cozy aesthetic Indonesian cafe', type: 'indoor' },
  { id: 'forest', label: 'Hutan Tropis', prompt: 'in a lush tropical Indonesian rainforest', type: 'outdoor' },
  { id: 'bromo', label: 'Gunung Bromo', prompt: 'at the stunning Mount Bromo volcanic landscape with morning mist', type: 'outdoor' },
  { id: 'market', label: 'Pasar Tradisional', prompt: 'in a vibrant and colorful traditional Indonesian market', type: 'outdoor' },
  { id: 'minang', label: 'Rumah Gadang', prompt: 'in front of a traditional Minangkabau Rumah Gadang with its unique curved roof', type: 'outdoor' },
  { id: 'living_room', label: 'Ruang Tamu', prompt: 'in a cozy and modern Indonesian living room', type: 'indoor' },
  { id: 'office', label: 'Kantor Modern', prompt: 'in a sleek and professional modern office in Jakarta', type: 'indoor' },
  { id: 'mall', label: 'Mall Mewah', prompt: 'inside a luxury shopping mall in Jakarta', type: 'indoor' },
];

const CLOTHING_COLORS = [
  { id: 'red', label: 'Merah', color: '#ef4444' },
  { id: 'white', label: 'Putih', color: '#ffffff' },
  { id: 'blue', label: 'Biru', color: '#3b82f6' },
  { id: 'green', label: 'Hijau', color: '#22c55e' },
  { id: 'yellow', label: 'Kuning', color: '#eab308' },
  { id: 'black', label: 'Hitam', color: '#000000' },
  { id: 'pink', label: 'Pink', color: '#ec4899' },
];

export default function App() {
  const [age, setAge] = useState(25);
  const [theme, setTheme] = useState(BACKGROUND_THEMES[0]);
  const [color, setColor] = useState(CLOTHING_COLORS[0]);
  const [locationType, setLocationType] = useState<'indoor' | 'outdoor'>('outdoor');
  const [productName, setProductName] = useState("");
  const [productBenefits, setProductBenefits] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [ttsScripts, setTtsScripts] = useState<string[]>([]);
  const [selectedScriptIndex, setSelectedScriptIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<number | null>(null);

  const generateScripts = async () => {
    if (!productName) {
      setError("Silakan isi nama produk terlebih dahulu.");
      return;
    }
    setIsGeneratingScript(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Buatlah 3 variasi script video TikTok affiliate yang agak panjang (durasi sekitar 40 detik per script, sekitar 80-100 kata).
        Produk: ${productName}
        Manfaat Produk: ${productBenefits}
        Detail Harga/Promo: ${productDetails}
        
        Aturan Penulisan:
        1. HOOK: Setiap script HARUS dimulai dengan hook yang sangat menarik dan BERBEDA satu sama lain (misal: pertanyaan retoris, fakta mengejutkan, atau solusi masalah).
        2. DURASI: Pastikan teks cukup panjang untuk dibaca selama kurang lebih 40 detik dengan kecepatan bicara normal.
        3. TIKTOK SAFE: Sebutkan manfaat produk dengan cara yang aman (hindari klaim berlebihan atau kata-kata yang dilarang TikTok seperti "pasti sembuh", "garansi putih 1 hari", dll).
        4. GAYA: Gunakan bahasa Indonesia yang santai, natural, dan persuasif.
        5. FORMAT: Output harus berupa JSON array of strings. Contoh: ["script 1", "script 2", "script 3"].
        6. Jangan berikan penjelasan tambahan, hanya JSON array saja.`,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const scripts = JSON.parse(response.text || "[]");
      setTtsScripts(scripts);
      setSelectedScriptIndex(0);
    } catch (err) {
      console.error(err);
      setError("Gagal membuat script otomatis.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(index);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const generateAll = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setGeneratedAudio(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // 1. Generate Images
      const getPrompt = (t: typeof theme, c: typeof color) => `A high-quality, realistic photograph of ${BASE_CHARACTER_DESCRIPTION}. 
      She is ${age} years old. 
      She is wearing a stylish ${c.label.toLowerCase()} outfit. 
      The setting is ${t.prompt}. 
      Cinematic lighting, 8k resolution, highly detailed skin texture, professional photography, portrait orientation.`;

      const variations = [
        { t: theme, c: color },
        { 
          t: BACKGROUND_THEMES[Math.floor(Math.random() * BACKGROUND_THEMES.length)], 
          c: CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)] 
        },
        { 
          t: BACKGROUND_THEMES[Math.floor(Math.random() * BACKGROUND_THEMES.length)], 
          c: CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)] 
        }
      ];

      if (variations[1].t.id === variations[0].t.id) {
        variations[1].t = BACKGROUND_THEMES[(BACKGROUND_THEMES.indexOf(variations[0].t) + 1) % BACKGROUND_THEMES.length];
      }
      if (variations[2].t.id === variations[0].t.id || variations[2].t.id === variations[1].t.id) {
        variations[2].t = BACKGROUND_THEMES[(BACKGROUND_THEMES.indexOf(variations[1].t) + 1) % BACKGROUND_THEMES.length];
      }

      const imageResults: string[] = [];

      for (const v of variations) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: getPrompt(v.t, v.c) }],
          },
          config: {
            imageConfig: {
              aspectRatio: "9:16",
            },
          },
        });

        let found = false;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageResults.push(`data:image/png;base64,${part.inlineData.data}`);
            found = true;
            break;
          }
        }
        if (!found) throw new Error("Gagal menghasilkan salah satu gambar.");
      }

      setGeneratedImages(imageResults);

      // 2. Generate TTS using the selected script
      const activeScript = ttsScripts[selectedScriptIndex];
      if (activeScript) {
        const ttsResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `Katakan dengan nada ceria dan persuasif: ${activeScript}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Puck' },
              },
            },
          },
        });

        const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          setGeneratedAudio(`data:audio/mp3;base64,${base64Audio}`);
        }
      }

    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat memproses. Pastikan koneksi internet stabil.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAllImages = () => {
    if (generatedImages.length === 0) return;
    generatedImages.forEach((img, index) => {
      const link = document.createElement('a');
      link.href = img;
      link.download = `indo-beauty-${Date.now()}-${index + 1}.png`;
      link.click();
    });
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1917] font-sans selection:bg-orange-100">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <h1 className="font-bold text-xl tracking-tight">IndoBeauty AI</h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-stone-500">
            <span>Generator Wanita Indonesia (3 Variasi)</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-orange-600 font-semibold mb-2">
                <Info size={18} />
                <h2>Kustomisasi Karakter</h2>
              </div>

              {/* Age Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User size={16} className="text-stone-400" />
                    Umur Wanita
                  </label>
                  <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded text-sm">
                    {age} Tahun
                  </span>
                </div>
                <input 
                  type="range" 
                  min="18" 
                  max="50" 
                  value={age} 
                  onChange={(e) => setAge(parseInt(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              {/* Theme Selection */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon size={16} className="text-stone-400" />
                    Tema Utama
                  </label>
                  <div className="flex bg-stone-100 p-1 rounded-lg">
                    <button 
                      onClick={() => {
                        setLocationType('indoor');
                        setTheme(BACKGROUND_THEMES.find(t => t.type === 'indoor')!);
                      }}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${locationType === 'indoor' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-400'}`}
                    >
                      INDOOR
                    </button>
                    <button 
                      onClick={() => {
                        setLocationType('outdoor');
                        setTheme(BACKGROUND_THEMES.find(t => t.type === 'outdoor')!);
                      }}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${locationType === 'outdoor' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-400'}`}
                    >
                      OUTDOOR
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {BACKGROUND_THEMES.filter(t => t.type === locationType).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t)}
                      className={`text-xs py-2 px-3 rounded-xl border transition-all text-left ${
                        theme.id === t.id 
                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium' 
                        : 'border-stone-200 hover:border-stone-300 text-stone-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Palette size={16} className="text-stone-400" />
                  Warna Pakaian Utama
                </label>
                <div className="flex flex-wrap gap-3">
                  {CLOTHING_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setColor(c)}
                      title={c.label}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        color.id === c.id ? 'border-orange-500 scale-110 shadow-md' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.color }}
                    />
                  ))}
                </div>
              </div>

              {/* Product Info Section */}
              <div className="pt-4 border-t border-stone-100 space-y-4">
                <div className="flex items-center gap-2 text-orange-600 font-semibold mb-2">
                  <ShoppingBag size={18} />
                  <h2>Affiliate Video Settings</h2>
                </div>

                {/* Product Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Nama Produk
                  </label>
                  <input 
                    type="text"
                    placeholder="Contoh: Lipstik Matte Viral"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm transition-all"
                  />
                </div>

                {/* Product Benefits */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Manfaat Produk (Acuan AI)
                  </label>
                  <textarea 
                    placeholder="Contoh: Tahan 24 jam, tidak transfer, melembabkan bibir..."
                    value={productBenefits}
                    onChange={(e) => setProductBenefits(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm transition-all resize-none"
                  />
                </div>

                {/* Product Details */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Detail Harga / Promo
                  </label>
                  <input 
                    type="text"
                    placeholder="Contoh: Diskon 50%, Beli 1 Gratis 1, Cuma 99rb"
                    value={productDetails}
                    onChange={(e) => setProductDetails(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm transition-all"
                  />
                </div>

                {/* TTS Script Selection */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <FileText size={16} className="text-stone-400" />
                      Variasi Script TTS (TikTok Safe)
                    </label>
                    <button 
                      onClick={generateScripts}
                      disabled={isGeneratingScript || !productName}
                      className="text-[10px] flex items-center gap-1 text-orange-600 hover:text-orange-700 font-bold disabled:text-stone-400 transition-colors"
                    >
                      {isGeneratingScript ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      Buat 3 Variasi Script
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {ttsScripts.length > 0 ? (
                      ttsScripts.map((script, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setSelectedScriptIndex(idx)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                            selectedScriptIndex === idx 
                            ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' 
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                              Variasi {idx + 1}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(script, idx);
                              }}
                              className="p-1.5 bg-white border border-stone-200 rounded-lg text-stone-500 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm"
                              title="Salin Script"
                            >
                              {copySuccess === idx ? <Sparkles size={12} className="text-orange-500" /> : <Download size={12} className="rotate-180" />}
                            </button>
                          </div>
                          <p className="text-xs text-stone-600 leading-relaxed pr-8 italic">
                            "{script}"
                          </p>
                          {copySuccess === idx && (
                            <span className="absolute top-1 right-10 text-[9px] font-bold text-orange-500 animate-bounce">
                              Tersalin!
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-8 border-2 border-dashed border-stone-200 rounded-xl text-center">
                        <p className="text-xs text-stone-400">
                          Isi nama produk & detail harga, lalu klik "Buat 3 Variasi Script"
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-[10px] text-stone-400">
                    * Pilih salah satu variasi di atas sebelum menekan tombol "Buat Gambar & TTS".
                  </p>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateAll}
                disabled={isGenerating}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-stone-300 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200 active:scale-[0.98]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Sedang Memproses Gambar & Suara...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Buat Gambar & TTS
                  </>
                )}
              </button>

              {error && (
                <p className="text-red-500 text-xs text-center font-medium bg-red-50 p-2 rounded-lg">
                  {error}
                </p>
              )}
            </section>

            <div className="bg-stone-100 p-4 rounded-xl border border-stone-200">
              <p className="text-[10px] text-stone-500 leading-relaxed">
                * Aplikasi akan membuat 3 gambar sekaligus: satu dengan pilihan Anda, dan dua variasi latar belakang & baju lainnya untuk memberikan pilihan lebih banyak.
              </p>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-7 flex flex-col items-center gap-6">
            <div className="w-full flex flex-col gap-8">
              {/* Audio Preview */}
              <AnimatePresence>
                {generatedAudio && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                      <Volume2 size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-stone-700">Hasil Suara (TTS)</h4>
                      <p className="text-[10px] text-stone-400 truncate max-w-[200px] sm:max-w-md">
                        {ttsScripts[selectedScriptIndex]}
                      </p>
                    </div>
                    <audio controls src={generatedAudio} className="h-8 max-w-[120px] sm:max-w-none" />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="popLayout">
                {generatedImages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    {generatedImages.map((img, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative aspect-[9/16] bg-stone-200 rounded-2xl overflow-hidden shadow-lg border-4 border-white ring-1 ring-stone-200"
                      >
                        <img 
                          src={img} 
                          alt={`Indonesian Woman AI Generated ${idx + 1}`} 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
                          Variasi {idx + 1}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="relative aspect-[9/16] w-full max-w-[450px] mx-auto bg-stone-200 rounded-[2rem] overflow-hidden shadow-2xl border-[8px] border-white ring-1 ring-stone-200">
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full w-full flex flex-col items-center justify-center p-12 text-center space-y-4"
                    >
                      <div className="w-20 h-20 bg-stone-300 rounded-full flex items-center justify-center text-stone-400">
                        <ImageIcon size={40} />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-600">Belum Ada Gambar</h3>
                        <p className="text-sm text-stone-400 mt-1">
                          Klik tombol buat untuk menghasilkan 3 variasi gambar sekaligus.
                        </p>
                      </div>
                      {isGenerating && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-orange-500" size={32} />
                            <span className="text-sm font-bold text-stone-700">Menenun 3 Gambar...</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>

              {/* Quick Download Button - Always visible below images if generated */}
              <AnimatePresence>
                {(generatedImages.length > 0 || generatedAudio) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="w-full max-w-[450px] space-y-3"
                  >
                    {generatedImages.length > 0 && (
                      <button
                        onClick={downloadAllImages}
                        className="w-full py-4 bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-600 hover:text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-orange-100 active:scale-[0.98]"
                      >
                        <Download size={22} />
                        Unduh Semua (3 Gambar)
                      </button>
                    )}
                    
                    {generatedAudio && (
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = generatedAudio;
                          link.download = `indo-beauty-tts-${Date.now()}.mp3`;
                          link.click();
                        }}
                        className="w-full py-4 bg-orange-50 border-2 border-orange-200 text-orange-700 hover:bg-orange-100 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-sm active:scale-[0.98]"
                      >
                        <Mic size={22} />
                        Unduh Suara TTS (MP3)
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-stone-200 text-center text-stone-400 text-xs">
        <p>© 2026 IndoBeauty AI Generator. Dibuat dengan teknologi Gemini AI.</p>
      </footer>
    </div>
  );
}
