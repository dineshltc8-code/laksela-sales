import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  MessageSquare, 
  Compass, 
  Share2, 
  User, 
  Bot,
  AlertCircle,
  Trash2
} from "lucide-react";
import { Salesman, Department, SalesRecord, AppTotals, ChatMessage } from "../types";

interface AIAssistantProps {
  salesmen: Salesman[];
  departments: Department[];
  salesRecords: SalesRecord[];
  totals: AppTotals;
}

// Add types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function AIAssistant({ salesmen, departments, salesRecords, totals }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "ආයුබෝවන්! මම 'ලක්සෙල සිංහල AI සහකරු' (Laksela Sinhala AI Sahakaru). මට සිංහලෙන් හෝ ඉංග්‍රීසියෙන් කතා කරන්න පුළුවන්. අද විකුණුම්, සේල්ස්මන්වරුන්ගේ දක්ෂතා හෝ මාසික ඉලක්ක විශ්ලේෂණය කිරීමට මගෙන් අහන්න!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Toggle verbal responses automatically

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "si-LK"; // Sinhala (Sri Lanka) language code!

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support Speech Recognition. Please try Google Chrome or MS Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput("");
      recognitionRef.current.start();
    }
  };

  // Text-To-Speech function
  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;

    // Cancel current speaking
    window.speechSynthesis.cancel();

    // Remove asterisks/markdown from speech for cleaner vocalization
    const cleanedText = text.replace(/[*#_~`-]/g, " ").trim();

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = "si-LK"; // Sinhala locale code
    
    // Attempt to search for available Sinhala voices on OS
    const voices = window.speechSynthesis.getVoices();
    const siVoice = voices.find(v => v.lang.startsWith("si") || v.lang.startsWith("sin"));
    if (siVoice) {
      utterance.voice = siVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    setInput("");
    
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Gather active dashboard context to send to Gemini API
      const context = {
        salesmen,
        departments,
        salesRecords,
        targets: {
          overallTarget: totals.monthlyTarget,
        },
        totals
      };

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          history: messages.slice(-10).map(m => ({ role: m.role, text: m.text })),
          context,
          currentDate: "2026-09-14" // Current system time
        })
      });

      const data = await response.json();
      
      if (response.ok && data.reply) {
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, assistantMsg]);
        speakText(data.reply);
      } else {
        throw new Error(data.error || "Failed to receive AI response");
      }
    } catch (err: any) {
      console.error("AI Assistant communications failure:", err);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: "assistant",
        text: "සමාවන්න, මගේ පද්ධතිය සමඟ සන්නිවේදනය කිරීමේ දෝෂයක් පවතී. කරුණාකර Settings > Secrets හි GEMINI_API_KEY යතුර නිවැරදිදැයි පරීක්ෂා කරන්න.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Preconfigured common questions in Sinhala
  const suggestedPrompts = [
    { label: "අද විකුණුම් කොච්චරද?", prompt: "අද විකුණුම් කොච්චරද?" },
    { label: "වැඩිපුරම සේල්ස් කරපු කවුද?", prompt: "වැඩිපුරම විකුණුම් කරපු සේල්ස්මන් කවුද?" },
    { label: "මේ මාසේ ටාගට් එක කීයද?", prompt: "මේ මාසේ ටාගට් එක කොච්චරද?" },
    { label: "ඉලක්කයට සාපේක්ෂව ප්‍රගතිය?", prompt: "ටාගට් එකට සාපේක්ෂව විකුණුම් ප්‍රගතිය කොහොමද?" },
    { label: "අංශ දෙකෙහි වෙනස?", prompt: "Electronic සහ Non-Electronic අංශ දෙකෙහි විකුණුම් සංසන්දනය කර විශ්ලේෂණයක් ලබා දෙන්න." }
  ];

  const handleShareToWhatsApp = (text: string) => {
    const textFormatted = `*Laksela Sinhala AI Sahakaru Report*:\n\n${text}\n\n_Shared via Laksela Smart Sales Log_`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(textFormatted)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: "ආයුබෝවන්! මම 'ලක්සෙල සිංහල AI සහකරු' (Laksela Sinhala AI Sahakaru). මට සිංහලෙන් හෝ ඉංග්‍රීසියෙන් කතා කරන්න පුළුවන්. අද විකුණුම්, සේල්ස්මන්වරුන්ගේ දක්ෂතා හෝ මාසික ඉලක්ක විශ්ලේෂණය කිරීමට මගෙන් අහන්න!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)] max-h-[850px]">
      
      {/* Top Title Row */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors flex items-center gap-2" id="ai-title">
            <Sparkles className="text-blue-500 fill-blue-500/10" /> ලක්සෙල සිංහල AI සහකරු (Laksela Sinhala AI Sahakaru)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sinhala voice and text-enabled Gemini smart analyst. Speak or type your request for real-time sales reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear History Button */}
          <button
            onClick={handleClearHistory}
            className="py-1.5 px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border border-rose-200 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
            title="Clear Chat History (සංවාදය මකා දමන්න)"
          >
            <Trash2 size={14} />
            <span>මකා දමන්න (Clear Chat)</span>
          </button>

          {/* Audio Output Settings */}
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              if (voiceEnabled) window.speechSynthesis.cancel();
            }}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              voiceEnabled 
                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
            }`}
            title={voiceEnabled ? "Mute Verbal TTS Voice" : "Enable Verbal TTS Voice"}
          >
            {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {voiceEnabled ? "Voice: ON (LK)" : "Voice: OFF"}
          </button>
        </div>
      </div>

      {/* Main chat window layout */}
      <div className="flex-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col overflow-hidden">
        
        {/* Messages list container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const isAI = m.role === "assistant";
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 max-w-3xl ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  {/* Avatar bubble */}
                  <div className={`p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 shadow-sm ${
                    isAI 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {isAI ? <Bot size={16} /> : <User size={16} />}
                  </div>

                  {/* Text bubble */}
                  <div className="space-y-1">
                    <div className={`p-4 rounded-2xl text-xs sm:text-sm shadow-sm leading-relaxed whitespace-pre-wrap select-text ${
                      isAI 
                        ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800/40' 
                        : 'bg-blue-600 text-white font-medium'
                    }`}>
                      {m.text}

                      {/* TTS Speak Trigger Button on AI bubble */}
                      {isAI && (
                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/40">
                          <button
                            onClick={() => speakText(m.text)}
                            className="p-1 text-[10px] text-slate-400 hover:text-blue-500 rounded flex items-center gap-1 cursor-pointer transition-colors"
                            title="Replay Voice Speech"
                          >
                            <Volume2 size={12} /> සවන් දෙන්න (Read out)
                          </button>
                          
                          <button
                            onClick={() => handleShareToWhatsApp(m.text)}
                            className="p-1 text-[10px] text-slate-400 hover:text-emerald-500 rounded flex items-center gap-1 cursor-pointer transition-colors"
                            title="Share AI-Generated Report"
                          >
                            <Share2 size={12} /> WhatsApp හරහා යවන්න
                          </button>
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] text-slate-400 block ${isAI ? 'text-left' : 'text-right'}`}>
                      {m.timestamp}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Loading bubble */}
          {isLoading && (
            <div className="flex gap-3 max-w-lg mr-auto">
              <div className="p-2 rounded-full h-8 w-8 bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested / Clickable prompt guidelines */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/50 overflow-x-auto whitespace-nowrap bg-slate-50/50 dark:bg-slate-900/40 shrink-0 select-none flex gap-2">
          <Compass size={14} className="text-slate-400 shrink-0 mt-1" />
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.prompt)}
              className="py-1 px-3 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 rounded-full transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Controls Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/50 shrink-0">
          <div className="flex items-center gap-2">
            {/* Microphone trigger */}
            <button
              onClick={toggleListening}
              className={`p-3 rounded-xl transition-all shadow-sm cursor-pointer ${
                isListening 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title={isListening ? "Listening... click to STOP" : "Click to SPEAK in Sinhala"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Input field */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "මම අසාගෙන සිටිමි... කතා කරන්න" : "සිංහලෙන් හෝ ඉංග්‍රීසියෙන් ලියන්න (Ask a sales question...)"}
              className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 dark:text-slate-200"
              disabled={isLoading}
            />

            {/* Send trigger */}
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className={`p-3 rounded-xl transition-all shadow-sm cursor-pointer ${
                !input.trim() || isLoading
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
