import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  BookOpen, 
  Award, 
  Flame, 
  Dumbbell, 
  Droplets, 
  Lock, 
  Tv, 
  Zap, 
  Check, 
  Send, 
  Key, 
  Clock, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Edit2, 
  Plus, 
  Minus, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  AlertTriangle, 
  Moon, 
  Trash2, 
  CheckCircle2, 
  ChevronRight, 
  Volume2, 
  VolumeX 
} from "lucide-react";
import { AppState, ChatMessage, MetricCard, PlannerSection } from "./types";

// Hinglish Quote Carousel data
const HINGLISH_QUOTES = [
  "Consistency motivation se zyada powerful hoti hai.",
  "Silent nights build strong futures.",
  "Focus boring lagta hai, lekin results powerful hote hain.",
  "Discipline loud nahi hota. Repeat hota hai.",
  "Shor machane se selection nahi hota, chupchap night study se hota hai.",
  "NEET ki fight lambi hai, har din ki consistency hi tumhara weapon hai.",
  "Maza temporary hai, selection aur doctor stethoscope permanent hai.",
  "Phone distraction avoid karo tonight, deep work session important hai."
];

const PRELOADED_PLANNER_ITEMS: PlannerSection[] = [
  { id: "1", title: "Deep Study Night Session", category: "study", targetText: "10 Hours of Focus", completed: false, notes: "Best work in midnight silence" },
  { id: "2", title: "Physics: Revise Mechanics formulae & solve 30 MCQs", category: "study", targetText: "30 MCQs", completed: false, notes: "Formulas focus" },
  { id: "3", title: "Biology: Read NCERT Human Physiology", category: "study", targetText: "NCERT reading", completed: false, notes: "Line by line focus" },
  { id: "4", title: "Chemistry: Practice Organic Reaction Mechanisms", category: "study", targetText: "Mechanisms practice", completed: false, notes: "Write on rough notebook" },
  { id: "5", title: "Dopamine Detox: Block YouTube Shorts & Reels", category: "dopamine", targetText: "Zero scroll screen time", completed: false, notes: "No quick scroll bait" },
  { id: "6", title: "Fitness: Evening outdoor run & 50 basic pushups", category: "health", targetText: "Cardio + Strength", completed: false, notes: "Improve study stamina" },
  { id: "7", title: "Water intake: Drink full 4 Litres hydration", category: "health", targetText: "4.0 Litres", completed: false, notes: "Keep mind fresh at night" },
  { id: "8", title: "YouTube Work: Draft strategy outline/concept vlog script", category: "life", targetText: "Plan / script consistent upload", completed: false, notes: "Personal brand and study logging" },
  { id: "9", title: "Personal balance: Dine with family, keep deep focus offline", category: "life", targetText: "Family time", completed: false, notes: "Recharge emotionally" }
];

export default function App() {
  // --- App State ---
  const [apiKey, setApiKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [showKeyToggle, setShowKeyToggle] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [quotaExceededOnConnect, setQuotaExceededOnConnect] = useState(false);

  // Connection Popup Modals State
  const [showConnectModal, setShowConnectModal] = useState(true);
  const [loadingState, setLoadingState] = useState<{
    isActive: boolean;
    progress: number;
    text: string;
  }>({ isActive: false, progress: 0, text: "" });

  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [connectionError, setConnectionError] = useState<{
    hasError: boolean;
    message: string;
  }>({ hasError: false, message: "" });

  // Core Metrics State
  const [metrics, setMetrics] = useState<{
    studyHours: MetricCard;
    mcqsSolved: MetricCard;
    runningKm: MetricCard;
    pushupsCount: MetricCard;
    sleepHours: MetricCard;
    waterLitres: MetricCard;
    dopamineScore: MetricCard;
    youtubeWork: MetricCard;
    consistencyStreak: MetricCard;
  }>({
    studyHours: { id: "m1", label: "Study Hours", value: 0, target: 10, unit: "hrs", category: "study", completed: false },
    mcqsSolved: { id: "m2", label: "MCQs Solved", value: 0, target: 100, unit: "mcqs", category: "study", completed: false },
    runningKm: { id: "m3", label: "Running Track", value: 0, target: 3, unit: "km", category: "health", completed: false },
    pushupsCount: { id: "m4", label: "Pushups Built", value: 0, target: 50, unit: "reps", category: "health", completed: false },
    sleepHours: { id: "m5", label: "Quiet Sleep", value: 0, target: 7, unit: "hrs", category: "health", completed: false },
    waterLitres: { id: "m6", label: "Water Intake", value: 0, target: 4, unit: "L", category: "health", completed: false },
    dopamineScore: { id: "m7", label: "Dopamine Control", value: 0, target: 5, unit: "avoided", category: "dopamine", completed: false },
    youtubeWork: { id: "m8", label: "YouTube Work", value: 0, target: 1, unit: "task", category: "life", completed: false },
    consistencyStreak: { id: "m9", label: "Consistency Streak", value: 15, target: 30, unit: "days", category: "life", completed: false }
  });

  // Planner State
  const [planner, setPlanner] = useState<PlannerSection[]>(PRELOADED_PLANNER_ITEMS);
  const [newPlannerTitle, setNewPlannerTitle] = useState("");
  const [newPlannerCategory, setNewPlannerCategory] = useState<"study" | "health" | "dopamine" | "life">("study");
  const [newPlannerTarget, setNewPlannerTarget] = useState("");
  const [newPlannerNotes, setNewPlannerNotes] = useState("");

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [tempTargetVal, setTempTargetVal] = useState<number>(0);

  // IST Live clock state
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  // Quotes state
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "intro-message",
      role: "assistant",
      content: "Aadha din guzar gaya ya bacha hai, night study me focus maximum chahiye. Maine tumhara NEET schedule set kar diya hai. Batao, aaj ka status kya chal raha hai? Distracted ho ya focus full hai?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [userMsg, setUserMsg] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Focus Timer Pomodoro State
  const [timerSeconds, setTimerSeconds] = useState(3000); // 50 mins = 3000 seconds
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");

  // Deep Work Mode State
  const [deepWorkActive, setDeepWorkActive] = useState(false);
  const [ambientAudioPulse, setAmbientAudioPulse] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Load saved state on start
  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key");
    const offlineStatus = localStorage.getItem("is_offline_mode") === "true";
    if (savedKey) {
      setApiKey(savedKey);
      setIsConnected(true);
      setShowConnectModal(false);
    } else if (offlineStatus) {
      setIsOfflineMode(true);
      setIsConnected(true);
      setShowConnectModal(false);
    }

    const savedMetrics = localStorage.getItem("discipline_metrics");
    if (savedMetrics) {
      try {
        setMetrics(JSON.parse(savedMetrics));
      } catch (e) {
        console.error("Failed to parse metrics", e);
      }
    }

    const savedPlanner = localStorage.getItem("discipline_planner");
    if (savedPlanner) {
      try {
        setPlanner(JSON.parse(savedPlanner));
      } catch (e) {
        console.error("Failed to parse planner", e);
      }
    }

    const savedChat = localStorage.getItem("discipline_chat");
    if (savedChat) {
      try {
        setChatHistory(JSON.parse(savedChat));
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
  }, []);

  // Save metrics on update
  useEffect(() => {
    localStorage.setItem("discipline_metrics", JSON.stringify(metrics));
  }, [metrics]);

  // Save planner on update
  useEffect(() => {
    localStorage.setItem("discipline_planner", JSON.stringify(planner));
  }, [planner]);

  // Save chat on update
  useEffect(() => {
    localStorage.setItem("discipline_chat", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Clock Update Effect (IST timezone)
  useEffect(() => {
    const updateClock = () => {
      const optionsDate: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        weekday: 'long', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric'
      };
      const optionsTime: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true
      };
      
      const now = new Date();
      const datePart = now.toLocaleString("en-US", optionsDate);
      const timePart = now.toLocaleString("en-US", optionsTime);
      setCurrentTimeStr(`${datePart} — ${timePart} IST`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Quote rotation timer
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % HINGLISH_QUOTES.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Focus Pomodoro Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (timerRunning && timerSeconds > 0) {
      timer = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      if (timerMode === "focus") {
        setTimerMode("break");
        setTimerSeconds(600); // 10 mins break
        triggerBeep(880, 0.4);
      } else {
        setTimerMode("focus");
        setTimerSeconds(3000); // 50 mins focus
        triggerBeep(440, 0.4);
      }
      setTimerRunning(false);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerRunning, timerSeconds, timerMode]);

  // Auto Scroll Chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isAiResponding]);

  // Audio helper
  const triggerBeep = (frequency: number, duration: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.error("Audio beep not supported", e);
    }
  };

  // Binaural tone generator
  const startAmbientGenerator = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const bufferSize = 4 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(140, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.05, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();

      oscillatorRef.current = whiteNoise as any;
      gainNodeRef.current = gain;
      setAmbientAudioPulse(true);
    } catch (e) {
      console.error("Failed starting ambient sound", e);
    }
  };

  const stopAmbientGenerator = () => {
    try {
      if (oscillatorRef.current) {
        (oscillatorRef.current as any).stop();
        oscillatorRef.current = null;
      }
      setAmbientAudioPulse(false);
    } catch (e) {
      console.log("Failed stopping ambient sound", e);
    }
  };

  const handleToggleAmbient = () => {
    if (ambientAudioPulse) {
      stopAmbientGenerator();
    } else {
      startAmbientGenerator();
    }
  };

  const toggleDeepWork = () => {
    if (!deepWorkActive) {
      setDeepWorkActive(true);
      setTimerRunning(true);
      startAmbientGenerator();
    } else {
      setDeepWorkActive(false);
      stopAmbientGenerator();
    }
  };

  const getLocalReply = (userMessageText: string): string => {
    const text = userMessageText.toLowerCase();
    
    if (text.includes("bio") || text.includes("biology") || text.includes("ncert")) {
      return "Biology ke liye NCERT is absolutely everything. Ek ek sentence, dynamic diagram aur flow chart dhyan se rough notebook par practice karo. Aaj ka target study session check hit hona chahiye.";
    }
    if (text.includes("physics") || text.includes("mechanic") || text.includes("numerical") || text.includes("formula") || text.includes("problem")) {
      return "Physics me formulas ratne se kaam nahi chalega. Har ek topic se minimum 30 numericals practice karo. Pehle simple solved numericals analyze karo aur flow state build karo.";
    }
    if (text.includes("chem") || text.includes("chemistry") || text.includes("organic") || text.includes("inorganic") || text.includes("reaction")) {
      return "Organic reaction mechanisms ko blank papers par multiple times likh kar verify kiya karo, aur inorganic memory-charts update karo continuous revision ke liye.";
    }
    if (text.includes("distract") || text.includes("phone") || text.includes("screen") || text.includes("youtube") || text.includes("shorts") || text.includes("insta") || text.includes("reel")) {
      return "Dopamine control hi selection determine karta hai! Phone ko airplane mode par dal kar dusre room me rakh do. Silent environment and core targets strict rakho.";
    }
    if (text.includes("tired") || text.includes("sleep") || text.includes("neend") || text.includes("night") || text.includes("exhausted")) {
      return "Exhausted feel ho rha to study desk chodo, screen off karo, deep cold water splash face pr dalo, and instant 10 solid pushups lagao! Direct cold start focus mode.";
    }
    if (text.includes("start") || text.includes("hello") || text.includes("hey") || text.includes("hi") || text.includes("coach") || text.includes("mentor")) {
      return "Aadha din guzar chuka hai, night session target checklist active hai! Apne current study hours and targets complete karo status share karo.";
    }
    return "Sahi chal rha hai, consistent and focused. Streak maintaining is solid right now, continuous tracking se hi targets scale honge. Focus timer active rakho.";
  };

  const handleBypassToOfflineMode = () => {
    setIsOfflineMode(true);
    setIsConnected(true);
    setShowConnectModal(false);
    localStorage.setItem("is_offline_mode", "true");
    setChatHistory((prev) => [
      ...prev,
      {
        id: `offline-entry-${Date.now()}`,
        role: "assistant",
        content: "✨ Offline Interactive Mentor Mode Active! Main discipline logs, widgets & offline Hinglish coaching fully responsive. Apne NEET targets complete karo.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    triggerBeep(392, 0.3);
  };

  // Connection Handler
  const handleConnectAPI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoadingState({
      isActive: true,
      progress: 0,
      text: "Initializing AI system..."
    });
    setConnectionError({ hasError: false, message: "" });
    setConnectionSuccess(false);

    const loadingTexts = [
      "Initializing AI system...",
      "Connecting Gemini API...",
      "Loading discipline dashboard...",
      "Preparing deep work environment..."
    ];

    let currentProgress = 0;
    const interval = setInterval(async () => {
      currentProgress += Math.floor(Math.random() * 14) + 6;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);

        try {
          const res = await fetch("/api/gemini/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey: apiKey.trim() })
          });
          const data = await res.json();

          if (res.ok && data.success) {
            setLoadingState(prev => ({ ...prev, progress: 100, text: "Verification complete." }));
            setConnectionSuccess(true);
            triggerBeep(523.25, 0.45);
          } else {
            const isExceeded = res.status === 429 || data.quotaExceeded;
            if (isExceeded) {
              setQuotaExceededOnConnect(true);
            }
            throw new Error(data.error || "Key validation failed.");
          }
        } catch (err: any) {
          setLoadingState({ isActive: false, progress: 0, text: "" });
          const errStr = String(err.message || "").toLowerCase();
          const isExceeded = errStr.includes("429") || errStr.includes("quota") || errStr.includes("resource_exhausted") || quotaExceededOnConnect;
          if (isExceeded) {
            setQuotaExceededOnConnect(true);
          }
          setConnectionError({
            hasError: true,
            message: isExceeded 
              ? "Gemini API Quota Exceeded (429). The premium key has exhausted its free-tier limits. Click the 'Bypass & Offline Mode' button below to continue studying immediately!"
              : (err.message || "Invalid or inaccessible API Key. Please test your network.")
          });
          triggerBeep(220, 0.5);
        }
      } else {
        const textIdx = Math.floor((currentProgress / 100) * loadingTexts.length);
        setLoadingState({
          isActive: true,
          progress: currentProgress,
          text: loadingTexts[Math.min(textIdx, loadingTexts.length - 1)]
        });
      }
    }, 250);
  };

  const handleEnterDashboard = () => {
    localStorage.setItem("gemini_api_key", apiKey.trim());
    setIsConnected(true);
    setShowConnectModal(false);
    setConnectionSuccess(false);
  };

  const handleDisconnectAPI = () => {
    if (confirm("Disconnect will remove your local API Key. Continue?")) {
      localStorage.removeItem("gemini_api_key");
      localStorage.removeItem("is_offline_mode");
      setApiKey("");
      setIsOfflineMode(false);
      setIsConnected(false);
      setShowConnectModal(true);
    }
  };

  // Core counter triggers
  const handleMetricChange = (key: keyof typeof metrics, change: number) => {
    setMetrics((prev) => {
      const field = prev[key];
      let newValue = Number(field.value) + change;
      if (newValue < 0) newValue = 0;
      
      const completed = newValue >= field.target;
      return {
        ...prev,
        [key]: {
          ...field,
          value: newValue,
          completed
        }
      };
    });
  };

  const startEditingTarget = (id: string, currentTarget: number) => {
    setEditingCardId(id);
    setTempTargetVal(currentTarget);
  };

  const saveTargetVal = (key: keyof typeof metrics) => {
    setMetrics((prev) => {
      const field = prev[key];
      const completed = Number(field.value) >= tempTargetVal;
      return {
        ...prev,
        [key]: {
          ...field,
          target: tempTargetVal,
          completed
        }
      };
    });
    setEditingCardId(null);
  };

  const handleDailyReset = () => {
    if (confirm("Reset current study logs, water intake, pushups & solved MCQs? Your target combinations and streak will be preserved.")) {
      setMetrics((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((k) => {
          const key = k as keyof typeof metrics;
          if (key !== "consistencyStreak") {
            updated[key].value = 0;
            updated[key].completed = false;
          }
        });
        return updated;
      });

      setPlanner((prev) => prev.map((item) => ({ ...item, completed: false })));
      
      setChatHistory((prev) => [
        ...prev,
        {
          id: `reset-msg-${Date.now()}`,
          role: "assistant",
          content: "Fresh slate ready. Saare logs reset ho chuke hain night hours study ke liye. Sequence kya rakh rhe ho physics-bio-chem ka aaj?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      triggerBeep(330, 0.4);
    }
  };

  // Planner actions
  const handleTogglePlannerItem = (id: string) => {
    setPlanner((prev) => 
      prev.map((item) => {
        if (item.id === id) {
          const nextCompleted = !item.completed;
          updateMetricByPlannerAction(item.category, nextCompleted);
          return { ...item, completed: nextCompleted };
        }
        return item;
      })
    );
  };

  const updateMetricByPlannerAction = (category: string, isCompleted: boolean) => {
    const factor = isCompleted ? 1 : -1;
    if (category === "study") {
      handleMetricChange("studyHours", factor * 2);
      handleMetricChange("mcqsSolved", factor * 20);
    } else if (category === "health") {
      handleMetricChange("runningKm", factor * 1);
      handleMetricChange("pushupsCount", factor * 15);
      handleMetricChange("waterLitres", factor * 0.5);
    } else if (category === "dopamine") {
      handleMetricChange("dopamineScore", factor * 1);
    } else if (category === "life") {
      handleMetricChange("youtubeWork", factor * 1);
    }
  };

  const handleAddPlannerItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlannerTitle.trim()) return;

    const newItem: PlannerSection = {
      id: Date.now().toString(),
      title: newPlannerTitle,
      category: newPlannerCategory,
      targetText: newPlannerTarget || "Focus Session",
      completed: false,
      notes: newPlannerNotes || "Added directly"
    };

    setPlanner((prev) => [...prev, newItem]);
    setNewPlannerTitle("");
    setNewPlannerTarget("");
    setNewPlannerNotes("");
  };

  const handleDeletePlannerItem = (id: string) => {
    setPlanner((prev) => prev.filter((item) => item.id !== id));
  };

  // Chat sender
  const handleSendChat = async (inputString?: string) => {
    const textToSend = inputString || userMsg;
    if (!textToSend.trim() || isAiResponding || !isConnected) return;

    const userMessageObj: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory((prev) => [...prev, userMessageObj]);
    setUserMsg("");
    setIsAiResponding(true);

    if (isOfflineMode) {
      setTimeout(() => {
        const replyText = getLocalReply(textToSend);
        const assistantMessageObj: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory((prev) => [...prev, assistantMessageObj]);
        setIsAiResponding(false);
        triggerBeep(440, 0.12);
      }, 700);
      return;
    }

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Gemini-Key": apiKey
        },
        body: JSON.stringify({
          history: chatHistory,
          message: textToSend
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 || data.quotaExceeded) {
          // Automatic 429 fallback!
          setTimeout(() => {
            const replyText = getLocalReply(textToSend);
            const assistantMessageObj: ChatMessage = {
              id: `ai-${Date.now()}`,
              role: "assistant",
              content: `⚠️ [Gemini Quota Exceeded (429) - Offline Fallback Active] ${replyText}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setChatHistory((prev) => [...prev, assistantMessageObj]);
            setIsOfflineMode(true);
            localStorage.setItem("is_offline_mode", "true");
            setIsAiResponding(false);
            triggerBeep(330, 0.35);
          }, 600);
          return;
        }
        throw new Error(data.error || "Failed proxy message response.");
      }
      
      const assistantMessageObj: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.text || "Hum badhiya tarike se consistent reh rhe hai, target par focus karo.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory((prev) => [...prev, assistantMessageObj]);
      triggerBeep(440, 0.12);
    } catch (err: any) {
      console.error(err);
      const replyText = getLocalReply(textToSend);
      const errorMessageObj: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ [Offline Fallback Mode] ${replyText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory((prev) => [...prev, errorMessageObj]);
      setIsOfflineMode(true);
      localStorage.setItem("is_offline_mode", "true");
    } finally {
      setIsAiResponding(false);
    }
  };

  const formatTimerTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className={`min-h-screen text-slate-100 flex flex-col font-sans transition-all duration-700 bg-[#020617] relative overflow-x-hidden ${deepWorkActive ? 'deep-work-grid pb-24' : ''}`}>
      
      {/* Glow overlays matching Bento theme background aesthetics */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-900/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-indigo-900/15 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      {/* POPUP: CONNECT GEMINI API OVERLAY */}
      {showConnectModal && (
        <div className="fixed inset-0 min-h-screen z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-[410px] bg-slate-900/90 backdrop-blur-2xl border border-slate-800 shadow-2xl rounded-[32px] p-8 flex flex-col items-center relative overflow-hidden transition-all duration-500 scale-100 animate-glow-purple">
            
            {!loadingState.isActive && !connectionSuccess && (
              <div className={`w-full ${connectionError.hasError ? "animate-shake" : ""}`}>
                <div className="w-16 h-16 bg-cyan-950 rounded-2xl border border-cyan-800 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                  <span className="text-2xl">✨</span>
                </div>
                
                <h2 className="text-2xl font-bold text-white text-center mb-1 tracking-tight">Connect Gemini API</h2>
                <p className="text-slate-400 text-center text-sm mb-6 leading-relaxed">
                  Enter your Gemini API key to activate your <br/>
                  <span className="text-slate-200 font-medium">AI Discipline Planner.</span>
                </p>

                <form onSubmit={handleConnectAPI} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest ml-1">
                      Gemini API Key
                    </label>
                    <div className="relative">
                      <input 
                        required
                        type={showKeyToggle ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Paste AIzaSy value"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-700 tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeyToggle(!showKeyToggle)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition duration-200"
                      >
                        {showKeyToggle ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {connectionError.hasError && (
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 leading-snug flex gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                      <div>
                        <span className="font-semibold block">Connection Error</span>
                        {connectionError.message}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Connect System
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-850"></div>
                    <span className="flex-shrink mx-3 text-slate-600 text-[10px] tracking-widest uppercase font-bold font-mono">or</span>
                    <div className="flex-grow border-t border-slate-850"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBypassToOfflineMode}
                    className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-mono"
                  >
                    ⚡ Use Offline Coaching Mode
                  </button>

                  <p className="text-[10px] text-slate-600 text-center italic mt-4 pt-1">
                    🛡️ Your API key stays stored locally in your browser.
                  </p>
                </form>
              </div>
            )}

            {/* loading state modal content */}
            {loadingState.isActive && !connectionSuccess && (
              <div className="text-center py-6 w-full">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent animate-spin"></div>
                  <div className="absolute inset-1.5 rounded-full bg-slate-950 flex items-center justify-center font-mono text-sm text-cyan-400 font-bold">
                    {loadingState.progress}%
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-200 tracking-wide mb-1">Activating Neural Bridge...</h3>
                <p className="text-xs text-cyan-400 font-mono min-h-[1.5rem] animate-pulse">{loadingState.text}</p>

                {/* Progress bar matching Bento layout */}
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-6">
                  <div 
                    className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4] transition-all duration-200"
                    style={{ width: `${loadingState.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Successful validation modal content */}
            {connectionSuccess && (
              <div className="text-center py-4 w-full">
                <div className="w-16 h-16 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <Check className="w-8 h-8" />
                </div>

                <h2 className="text-xl font-bold tracking-tight text-emerald-400 mb-2">Successfully Connected</h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto mb-6">
                  Gemini API has been successfully plugged into your browser local environment.
                </p>

                <button
                  type="button"
                  onClick={handleEnterDashboard}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                >
                  Enter Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRIMARY BENTO GRID WEB INTERFACE CONTAINER */}
      <div className={`flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 py-6 md:py-8 transition-all duration-700 ${showConnectModal ? "filter blur-md pointer-events-none" : "filter blur-0"}`}>
        
        {/* PREMIUM HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-slate-800/80 pb-5 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></span>
              <span className="text-[10px] text-cyan-400 uppercase font-mono tracking-widest font-semibold">NEET Discipline Agent</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-1">
              DISCIPLINE<span className="text-cyan-400 font-light font-mono">AI</span>
            </h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1 italic font-mono">
              Nishkaam Karma: Focus on the Work, Not the Result
            </p>
          </div>
          <div className="text-left md:text-right w-full md:w-auto">
            <div className="text-lg md:text-xl font-mono text-cyan-400 tracking-tighter bg-slate-900/30 px-3 py-1.5 rounded-lg border border-slate-800">
              {currentTimeStr || "Loading Live Clock..."}
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1 block">
              Night Study Session Active • <button onClick={handleDisconnectAPI} className="text-red-400/80 hover:text-red-300 underline font-mono cursor-pointer">Disconnect Key</button>
            </div>
          </div>
        </header>

        {/* PRIMARY BENTO WRAPPER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          
          {/* LEFT BENTO BLOCK: CHAT COACH & INSPIRATION QUOTE */}
          <div className="lg:col-span-4 flex flex-col gap-5 h-full">
            
            {/* AI COACH INTEGRAL BENTO BOX */}
            <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 flex flex-col relative overflow-hidden min-h-[460px]">
              
              {/* Online indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">Coach Active</span>
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></span>
              </div>

              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800">
                <div className="w-8 h-8 bg-cyan-950 rounded-lg border border-cyan-800/80 flex items-center justify-center text-xs text-cyan-400 font-bold font-mono">
                  AI
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                    AI Mentor Coach
                  </h3>
                  <p className="text-[9px] text-slate-500 font-mono">Calm Hinglish Support System</p>
                </div>
              </div>

              {/* Chat timeline message viewport */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[300px]">
                {chatHistory.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] border ${msg.role === "user" ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-cyan-950 border-cyan-800 text-cyan-400 font-bold"}`}>
                      {msg.role === "user" ? "👤" : "AI"}
                    </div>

                    <div className="flex flex-col max-w-[80%]">
                      <div className={`rounded-2xl p-3.5 text-xs ${msg.role === "user" ? "bg-slate-800/80 rounded-tr-none text-slate-200" : "bg-cyan-900/10 backdrop-blur-md border border-cyan-800/20 text-cyan-100 rounded-tl-none"}`}>
                        {msg.content}
                      </div>
                      <span className="text-[8px] text-slate-600 font-mono mt-1 text-right block">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}

                {isAiResponding && (
                  <div className="flex gap-2.5">
                    <div className="w-6 h-6 rounded-full shrink-0 bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px] text-cyan-400 font-bold">
                      AI
                    </div>
                    <div className="bg-cyan-900/10 border border-cyan-850/20 rounded-2xl rounded-tl-none p-3.5 text-xs text-cyan-400/80 flex items-center gap-2 animate-pulse">
                      <span>Coach coding response...</span>
                      <div className="flex gap-0.5">
                        <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"></span>
                        <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-200"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick interactive update prompt pills */}
              <div className="py-2 mt-2 border-t border-slate-800">
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1.5 font-bold pl-1">
                  💡 Quick update to coach:
                </p>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  <button
                    type="button"
                    onClick={() => handleSendChat("Aaj 3 chapters pure NEET study")}
                    className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 hover:text-cyan-400 hover:border-cyan-800/40 transition whitespace-nowrap cursor-pointer shrink-0"
                  >
                    3 Chapter Done
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendChat("Focus high mechanics problem solved")}
                    className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 hover:text-cyan-400 hover:border-cyan-800/40 transition whitespace-nowrap cursor-pointer shrink-0"
                  >
                    High Focus Day
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendChat("100 MCQs done perfectly")}
                    className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 hover:text-cyan-400 hover:border-cyan-800/40 transition whitespace-nowrap cursor-pointer shrink-0"
                  >
                    100 MCQs Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendChat("Dopamine block strict, no YT shorts")}
                    className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 hover:text-cyan-400 hover:border-cyan-800/40 transition whitespace-nowrap cursor-pointer shrink-0"
                  >
                    Dopamine Guard Active
                  </button>
                </div>
              </div>

              {/* Chat action message input form */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center gap-2">
                <input 
                  type="text" 
                  value={userMsg}
                  disabled={isAiResponding}
                  onChange={(e) => setUserMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder={isConnected ? "Aaj ki study updates batao..." : "Please connect first"}
                  className="flex-1 bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-600"
                />
                
                <button 
                  type="button"
                  disabled={isAiResponding || !userMsg.trim()}
                  onClick={() => handleSendChat()}
                  className="w-9 h-9 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer disabled:opacity-30"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* BENTO THEMED QUOTE BOX */}
            <div className="h-32 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 flex flex-col justify-center items-center text-center relative overflow-hidden shrink-0">
              <div className="absolute top-2 left-2 text-[10px] font-mono text-cyan-500/30">DISCIPLINE</div>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1.5 font-mono font-bold">Silent Study Inspiration</p>
              <p className="font-serif italic text-sm text-slate-200 font-medium px-2 leading-relaxed">
                "{HINGLISH_QUOTES[quoteIndex]}"
              </p>
            </div>
          </div>

          {/* RIGHT COLUMNS: HYBRID EXPANSIVE BENTO GRID */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* STUDY TIMER AND HOURS BIG stat bento box */}
            <div className="bg-gradient-to-br from-[#0b0f24] to-[#030617] border border-slate-800 rounded-3xl p-6 relative overflow-hidden group min-h-[220px]">
              {/* Background accent glowing vectors */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 h-full">
                
                <div className="flex flex-col h-full justify-between gap-3">
                  <div className="flex justify-between items-start md:block">
                    <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                      Deep Night Work Interval
                    </h3>
                    <span className="text-cyan-400 text-[10px] px-2 py-0.5 bg-cyan-950/40 border border-cyan-800/30 rounded-full inline-block font-mono">
                      IST Night Schedule
                    </span>
                  </div>
                  
                  <div>
                    <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      Current Segment: {timerMode === "focus" ? "Midnight focus interval block" : "Clean short rest zone"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                      Maintains maximum neural focus capacity. Toggle "Deep Work Mode" below for pure isolated silence.
                    </p>
                  </div>

                  {/* Operational controls */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setTimerRunning(!timerRunning)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${timerRunning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20' : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'}`}
                    >
                      {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {timerRunning ? "Pause" : "Start Focus"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTimerRunning(false);
                        setTimerSeconds(timerMode === "focus" ? 3000 : 600);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </button>

                    {/* Binaural sound generator inside bento */}
                    <button
                      type="button"
                      onClick={handleToggleAmbient}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${ambientAudioPulse ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}
                      title="Toggle relaxation white noise"
                    >
                      {ambientAudioPulse ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={toggleDeepWork}
                      className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wide bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-700/30 text-indigo-300 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Moon className="w-3.5 h-3.5" />
                      Deep Work Mode
                    </button>
                  </div>
                </div>

                {/* BIG CLOCK DISPLAY */}
                <div className="text-center shrink-0">
                  <div className="text-6xl font-extrabold text-white tracking-tighter font-mono bg-slate-950/70 py-4 px-6 rounded-2xl border border-slate-800 shadow-inner min-w-[180px]">
                    {formatTimerTime(timerSeconds)}
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                    {/* Progress tracking calculation on the 50/10m block */}
                    <div 
                      className="bg-cyan-500 h-full shadow-[0_0_10px_#06b6d4] transition-all duration-1000"
                      style={{ width: `${Math.min(100, (1 - timerSeconds / (timerMode === "focus" ? 3000 : 600)) * 100)}%` }}
                    ></div>
                  </div>
                </div>

              </div>

            </div>

            {/* NESTED GRID OF CORE METRIC bento boxes */}
            <div>
              <div className="flex items-center justify-between mb-3.5 pl-1">
                <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-widest block">
                  📈 Core Discipline Targets 
                </span>
                <button
                  type="button"
                  onClick={handleDailyReset}
                  className="px-3 py-1 text-[10px] font-mono font-bold bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Area Reset
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.keys(metrics).map((key) => {
                  const itemKey = key as keyof typeof metrics;
                  const card = metrics[itemKey];
                  
                  // Setup unique visual cues for met target limits
                  const frameStyle = card.completed 
                    ? "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)] bg-[#041113]/30" 
                    : "border-slate-800";
                  const colorAccent = card.completed ? "text-emerald-400" : "text-cyan-400";
                  
                  // Icons per cell
                  let microIcon = <Zap className="w-4 h-4" />;
                  if (itemKey === "studyHours") microIcon = <Clock className="w-4 h-4" />;
                  if (itemKey === "mcqsSolved") microIcon = <BookOpen className="w-4 h-4" />;
                  if (itemKey === "runningKm") microIcon = <Activity className="w-4 h-4" />;
                  if (itemKey === "pushupsCount") microIcon = <Dumbbell className="w-4 h-4" />;
                  if (itemKey === "sleepHours") microIcon = <Moon className="w-4 h-4" />;
                  if (itemKey === "waterLitres") microIcon = <Droplets className="w-4 h-4" />;
                  if (itemKey === "dopamineScore") microIcon = <Lock className="w-4 h-4 text-indigo-400" />;
                  if (itemKey === "youtubeWork") microIcon = <Tv className="w-4 h-4" />;
                  if (itemKey === "consistencyStreak") microIcon = <Flame className="w-4 h-4 text-orange-400" />;

                  return (
                    <div 
                      key={card.id}
                      className={`bg-slate-900/40 backdrop-blur-md border rounded-3xl p-5 flex flex-col justify-between min-h-[140px] transition duration-300 hover:translate-y-[-2px] hover:border-slate-700 relative overflow-hidden ${frameStyle}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{card.label}</span>
                        <div className={`w-7 h-7 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-center text-xs ${card.completed ? "text-emerald-400" : "text-slate-400"}`}>
                          {microIcon}
                        </div>
                      </div>

                      {/* STAT VALUE ROW */}
                      <div className="my-2.5">
                        <div className="text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-1">
                          {card.value}
                          <span className="text-[10px] text-slate-500 font-mono font-normal">/{card.target} {card.unit}</span>
                        </div>
                      </div>

                      {/* EDIT TARGET TRIGGER & INCREMENTS CONTROLLER */}
                      <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 mt-1 text-[11px]">
                        <div>
                          {editingCardId === card.id ? (
                            <div className="flex items-center gap-1">
                              <input 
                                type="number"
                                value={tempTargetVal}
                                onChange={(e) => setTempTargetVal(Math.max(0, Number(e.target.value)))}
                                className="w-9 px-1 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-center focus:outline-none focus:border-cyan-500"
                              />
                              <button
                                type="button"
                                onClick={() => saveTargetVal(itemKey)}
                                className="px-1 py-0.5 bg-cyan-600 rounded text-[9px] hover:bg-cyan-500 text-white font-bold cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditingTarget(card.id, card.target)}
                              className="text-[10px] text-slate-500 hover:text-slate-350 underline font-mono cursor-pointer"
                            >
                              Config Target
                            </button>
                          )}
                        </div>

                        {/* Interactive counters */}
                        <div className="flex items-center gap-1 shrink-0 bg-slate-950/80 border border-slate-800/80 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => handleMetricChange(itemKey, -1)}
                            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 shrink-0 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-[1.5px] h-3 bg-slate-800"></span>
                          <button
                            type="button"
                            onClick={() => handleMetricChange(itemKey, 1)}
                            className="p-1 rounded text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* INTEGRAL INTERACTIVE DAILY PLANNER CHECKLIST */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6">
              
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    Interactive Custom Planner
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Link tasks to active categories. Checking items directly logs increments onto metrics counters!
                  </p>
                </div>
                
                <span className="text-[10px] font-mono bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 py-1 px-3 rounded-full font-bold">
                  {planner.filter(item => item.completed).length} / {planner.length} Checked
                </span>
              </div>

              {/* Checklist viewer scroll pane */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {planner.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${item.completed ? 'bg-emerald-950/10 border-emerald-500/20 text-slate-500' : 'bg-slate-950/30 border-slate-800/60 hover:border-slate-700 text-slate-200'}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleTogglePlannerItem(item.id)}
                      className={`w-[19px] h-[19px] rounded flex items-center justify-center shrink-0 border transition-all mt-0.5 cursor-pointer ${item.completed ? 'bg-cyan-500 border-cyan-500 text-slate-950' : 'border-slate-700 hover:border-slate-500 bg-slate-950'}`}
                    >
                      {item.completed && <Check className="w-3 h-3 stroke-[3px]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold tracking-tight ${item.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {item.title}
                        </span>
                        
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase font-bold tracking-wider ${item.category === "study" ? 'bg-purple-950/60 text-purple-400 border border-purple-900/40' : item.category === "health" ? 'bg-sky-950/60 text-sky-400 border border-sky-900/40' : item.category === "dopamine" ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-900/40' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-mono">
                        <span>Target: {item.targetText}</span>
                        {item.notes && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-sm">{item.notes}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePlannerItem(item.id)}
                      className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition shrink-0 cursor-pointer"
                      title="Remove task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* QUICK ADD NEW ITEM COMPACT BENTO FORM */}
              <form onSubmit={handleAddPlannerItem} className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-12 text-[10px] font-mono text-slate-500 uppercase tracking-widest pl-1">
                  ⚡ Add Custom Quick Assignment
                </div>
                
                <div className="md:col-span-6">
                  <input
                    required
                    type="text"
                    value={newPlannerTitle}
                    onChange={(e) => setNewPlannerTitle(e.target.value)}
                    placeholder="Task summary (e.g. solve 40 organic structures)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 placeholder:text-slate-700 font-sans"
                  />
                </div>

                <div className="md:col-span-3">
                  <select
                    value={newPlannerCategory}
                    onChange={(e: any) => setNewPlannerCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="study">Study</option>
                    <option value="health">Fitness/Health</option>
                    <option value="dopamine">Dopamine Avoid</option>
                    <option value="life">YouTube/Vlog</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <input
                    type="text"
                    value={newPlannerTarget}
                    onChange={(e) => setNewPlannerTarget(e.target.value)}
                    placeholder="Target limit (e.g. 40 reps)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 placeholder:text-slate-700"
                  />
                </div>

                <div className="md:col-span-9">
                  <input
                    type="text"
                    value={newPlannerNotes}
                    onChange={(e) => setNewPlannerNotes(e.target.value)}
                    placeholder="Brief study notes placeholder..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 placeholder:text-slate-700"
                  />
                </div>

                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs tracking-wide transition shadow uppercase font-mono cursor-pointer"
                  >
                    Insert Block
                  </button>
                </div>
              </form>

            </div>

          </div>

        </div>

        {/* BOTTOM STANDARD STATS BOARD BAR */}
        <footer className="mt-8 flex flex-col sm:flex-row justify-between items-center bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-slate-800 gap-3">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${deepWorkActive ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-semibold">Deep Focus Switch: {deepWorkActive ? "Active" : "Standard Zone"}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${ambientAudioPulse ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-semibold">Binaural Study Ambience: {ambientAudioPulse ? "Playing Brown Noise" : "Muted"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-500 italic">
            <span>Silent nights build strong futures.</span>
          </div>
        </footer>

      </div>

      {/* DETACHED DEEPLY IMMERSIVE ULTRA SILENT DEEP WORK MODE CANVAS LAYOUT */}
      {deepWorkActive && (
        <div className="fixed inset-0 z-[100] min-h-screen bg-[#020205] flex flex-col items-center justify-center p-8 text-center transition-all duration-700">
          <div className="absolute top-8 left-8">
            <div className="flex items-center gap-2.5 text-xs text-slate-500 font-mono uppercase tracking-widest">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-red-400/80 font-bold">Ultra Study Isolation Mode Active</span>
            </div>
          </div>

          <div className="w-full max-w-lg space-y-8">
            <div className="w-28 h-28 rounded-full mx-auto bg-cyan-950/20 border border-cyan-800/30 flex items-center justify-center ring-4 ring-cyan-500/5 animate-pulse transition duration-1000">
              <Moon className="w-10 h-10 text-cyan-400" />
            </div>

            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-widest text-slate-200 font-mono">
                {formatTimerTime(timerSeconds)}
              </h1>
              <p className="text-xs text-cyan-400 font-mono tracking-widest uppercase">
                NEET Focus Segment ({timerMode === "focus" ? "Studying Night Hours" : "Break Relaxation"})
              </p>
            </div>

            <p className="text-sm text-slate-400 font-serif italic max-w-sm mx-auto leading-relaxed px-4">
              “ {HINGLISH_QUOTES[quoteIndex]} ”
            </p>

            <div className="flex items-center justify-center gap-3 pt-6 flex-wrap">
              <button
                type="button"
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-5 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition ${timerRunning ? 'bg-amber-900/30 text-amber-300 border border-amber-500/20' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'}`}
              >
                {timerRunning ? "PAUSE COUNTER" : "RESUME STUDY"}
              </button>
              
              <button
                type="button"
                onClick={handleToggleAmbient}
                className={`px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider cursor-pointer transition ${ambientAudioPulse ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30' : 'bg-slate-950 border border-slate-800 text-slate-400'}`}
              >
                {ambientAudioPulse ? "STOP BROWN AMBIENT" : "START STUDY SOUND"}
              </button>

              <button
                type="button"
                onClick={toggleDeepWork}
                className="px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-red-950/40 text-slate-300 border border-red-500/25 hover:bg-slate-900 cursor-pointer"
              >
                EXIT ZONE
              </button>
            </div>
          </div>

          <div className="absolute bottom-8 text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            💤 Silent night study is where doctors are made. Block all external distractions.
          </div>
        </div>
      )}

    </div>
  );
}
