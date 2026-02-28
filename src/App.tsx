/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Download, Eye, Layout, Image as ImageIcon, Loader2, AlertCircle, Info, Upload, X, Film } from 'lucide-react';
import { generateBannerImage } from './services/geminiService';

const DEFAULT_PROMPT = "A cinematic, high-detail 3D claymation scene in the style of Wallace and Gromit. Gromit the dog is leaning out from the front of a small wooden train engine, frantically laying down brass railway tracks on a plain floor just inches before the wheels hit the ground. The composition is a wide panoramic shot (aspect ratio 4:1). Action is centered on the right side to leave space for a profile picture on the left. Warm, indoor studio lighting, soft shadows, 4k resolution. Gromit has an expressive, determined look in his eyes.";

export default function App() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [referenceFile, setReferenceFile] = useState<{ data: string, mimeType: string, previewUrl: string } | null>(null);
  const [dragConstraints, setDragConstraints] = useState<React.RefObject<HTMLDivElement> | null>(null);
  const bannerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setReferenceFile({
        data: base64String,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file)
      });
    };
    reader.readAsDataURL(file);
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!hasApiKey) {
      setError("Please select an API key first.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const url = await generateBannerImage(prompt, referenceFile ? { data: referenceFile.data, mimeType: referenceFile.mimeType } : undefined);
      setImageUrl(url);
    } catch (err: any) {
      setError(err.message || "Failed to generate image. Please try again.");
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'linkedin-banner-gromit.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPromptMD = () => {
    const content = `# LinkedIn Banner Scene Description\n\n**Prompt:**\n${prompt}\n\n---\nGenerated via BannerStudio`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scene-description.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight">BannerStudio</h1>
          </div>
          
          {!hasApiKey && (
            <button
              onClick={handleOpenKeySelector}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <Layout className="w-4 h-4" />
              Select API Key
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Left Column: Preview & Generator */}
        <div className="space-y-8">
          {/* Banner Preview Area */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Live Preview
              </h2>
              <button 
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                {showPreview ? 'Hide LinkedIn Overlay' : 'Show LinkedIn Overlay'}
              </button>
            </div>

            <div 
              ref={bannerRef}
              className="relative aspect-[4/1] w-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl group"
            >
              <AnimatePresence mode="wait">
                {imageUrl ? (
                  <motion.div
                    key="image"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative w-full h-full"
                  >
                    <img 
                      src={imageUrl} 
                      alt="Generated Banner" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* LinkedIn Overlay Simulation */}
                    {showPreview && (
                      <div className="absolute inset-0">
                        {/* Profile Picture Placeholder - Draggable */}
                        <motion.div 
                          drag
                          dragConstraints={bannerRef}
                          dragElastic={0.1}
                          dragMomentum={false}
                          initial={{ x: 0, y: 0 }}
                          className="absolute bottom-[-20%] left-[5%] w-[25%] aspect-square rounded-full border-4 border-zinc-950 bg-zinc-800 shadow-xl overflow-hidden cursor-move active:cursor-grabbing z-10"
                        >
                          <div className="w-full h-full bg-zinc-700 flex flex-col items-center justify-center pointer-events-none select-none">
                            <ImageIcon className="w-1/3 h-1/3 text-zinc-500 mb-1" />
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Drag Me</span>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    className="w-full h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 p-8 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-400">No banner generated yet</p>
                      <p className="text-sm">Click generate to create your custom Gromit banner</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isGenerating && (
                <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                  <p className="text-emerald-500 font-medium animate-pulse">Crafting your claymation scene...</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {imageUrl ? 'Regenerate Banner' : 'Generate Banner'}
              </button>
              
              {imageUrl && (
                <button
                  onClick={downloadImage}
                  className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center shadow-lg"
                  title="Download Image"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>
          </section>

          {/* Tips Section */}
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-300">
              <Info className="w-4 h-4 text-emerald-500" />
              Optimization Tips
            </h3>
            <ul className="grid sm:grid-cols-2 gap-4 text-sm text-zinc-400">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>The 4:1 aspect ratio is perfectly sized for LinkedIn's 1584x396 banner slot.</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Action is pushed to the right to prevent Gromit from being hidden by your profile picture.</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Claymation style adds a unique, handcrafted professional touch to your profile.</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Determined Gromit symbolizes agility, problem-solving, and "laying the tracks" for success.</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Right Column: Prompt Editor & Style Reference */}
        <aside className="space-y-6">
          {/* Style Reference Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Style & Tone Reference
            </label>
            <div className="relative group">
              {referenceFile ? (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 group">
                  {referenceFile.mimeType.startsWith('video') ? (
                    <video 
                      src={referenceFile.previewUrl} 
                      className="w-full h-full object-cover"
                      autoPlay 
                      muted 
                      loop 
                    />
                  ) : (
                    <img 
                      src={referenceFile.previewUrl} 
                      className="w-full h-full object-cover"
                      alt="Reference"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => setReferenceFile(null)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-zinc-950/80 backdrop-blur-md rounded text-[10px] font-mono text-zinc-400 border border-zinc-800">
                    {referenceFile.mimeType.split('/')[1].toUpperCase()} REFERENCE
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 hover:border-emerald-500/50 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="p-3 rounded-full bg-zinc-800 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors mb-2">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-zinc-500 font-medium">Upload style reference</p>
                    <p className="text-[10px] text-zinc-600 mt-1">Image or Animation (MP4/GIF)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*,video/*" 
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Scene Description
              </label>
              <button 
                onClick={downloadPromptMD}
                className="text-xs font-medium text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                Download .md
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all resize-none font-mono"
              placeholder="Describe your banner scene..."
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 text-red-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 text-xs text-zinc-500 leading-relaxed">
            <p>
              This app uses <strong>Gemini 3.1 Flash Image</strong> to generate high-fidelity 4:1 panoramic images. 
              The prompt is pre-configured to ensure Gromit is on the right side of the frame.
            </p>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-zinc-900 text-center text-zinc-600 text-sm">
        <p>© 2026 BannerStudio • Powered by Gemini AI</p>
      </footer>
    </div>
  );
}
