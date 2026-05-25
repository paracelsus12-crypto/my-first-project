import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Terminal,
  FileText,
  CheckCircle,
  TrendingUp,
  User,
  Sparkles,
  Code,
  Trash2,
  Download,
  Search,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Info,
  Lock,
  Unlock,
  Check,
  AlertCircle,
  Calendar,
  Play,
  Flame,
  Menu,
  X,
  BookOpenCheck
} from "lucide-react";
import { UserStats } from "./types";
import { pythonLessonsData, playgroundTemplates, cheatsheetData } from "./data/lessons";
import { runPythonCode, getPyodide } from "./utils/pyodideRunner";
import { CodeEditor } from "./components/CodeEditor";

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<"dashboard" | "lesson" | "playground" | "cheatsheet">("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pyodide Loading State
  const [pyodideState, setPyodideState] = useState<"loading" | "ready" | "error">("loading");
  const [pyodideLoadAttempts, setPyodideLoadAttempts] = useState(0);

  // Gamification & Progress State
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem("pylearn_react_stats");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          xp: parsed.xp ?? 0,
          level: Math.floor((parsed.xp ?? 0) / 100) + 1,
          streak: parsed.streak ?? 1,
          completedLessons: parsed.completedLessons ?? [],
          completedModules: parsed.completedModules ?? [],
          lessonCodes: parsed.lessonCodes ?? {},
        };
      } catch {
        // fallback
      }
    }
    return {
      xp: 0,
      level: 1,
      streak: 3, // start with a nice encouraging streak
      completedLessons: [],
      completedModules: [],
      lessonCodes: {},
    };
  });

  // Active Lesson States
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  
  // Lesson Coding Workspace States
  const [lessonCode, setLessonCode] = useState("");
  const [lessonStdout, setLessonStdout] = useState<string[]>([]);
  const [lessonStderr, setLessonStderr] = useState<string[]>([]);
  const [lessonRunning, setLessonRunning] = useState(false);
  const [runSuccessBanner, setRunSuccessBanner] = useState(false);
  const [runErrorMsg, setRunErrorMsg] = useState("");
  const [activeQuizOption, setActiveQuizOption] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizAnswerCorrect, setQuizAnswerCorrect] = useState<boolean | null>(null);
  const [showQuizDetails, setShowQuizDetails] = useState(false);

  // Modules Modal/Overlay Congratulations State
  const [completedModuleReward, setCompletedModuleReward] = useState<{
    moduleTitle: string;
    xpReward: number;
  } | null>(null);

  // Playground States
  const [playgroundCode, setPlaygroundCode] = useState(
    `# Ласкаво просимо до Пісочниці Python!\n# Тут ви можете писати і тестувати будь-який код.\n\nprint("Привіт, Світ!")\n\nfor i in range(3):\n    print(f"Ітерація {i+1}")\n`
  );
  const [playgroundStdout, setPlaygroundStdout] = useState<string[]>([]);
  const [playgroundStderr, setPlaygroundStderr] = useState<string[]>([]);
  const [playgroundRunning, setPlaygroundRunning] = useState(false);

  // Cheatsheet Search State
  const [cheatSearch, setCheatSearch] = useState("");

  // Toast notifications state
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "xp" | "error" }>>([]);

  // Auto scroll references for console/terminals
  const lessonConsoleEndRef = useRef<HTMLDivElement>(null);
  const playgroundConsoleEndRef = useRef<HTMLDivElement>(null);

  // Track and synchronize local storage state changes
  useEffect(() => {
    localStorage.setItem("pylearn_react_stats", JSON.stringify(stats));
  }, [stats]);

  // Toast helper function
  const triggerToast = (message: string, type: "success" | "xp" | "error" = "success") => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically dismiss toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Add XP and handle potential level ups beautifully!
  const addXP = (amount: number) => {
    setStats((prev) => {
      const newXp = prev.xp + amount;
      const oldLevel = prev.level;
      const newLevel = Math.floor(newXp / 100) + 1;

      // Queue up XP toast
      triggerToast(`+${amount} XP отримано! 🎯`, "xp");

      if (newLevel > oldLevel) {
        // Trigger celebratory toast slightly offline
        setTimeout(() => {
          triggerToast(`🎉 Вітаємо! Ви досягли рівня ${newLevel}!`, "success");
        }, 1000);
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
      };
    });
  };

  // Try initializing Pyodide incrementally
  useEffect(() => {
    let intervalId: any;
    
    const tryInit = async () => {
      if (typeof window.loadPyodide !== "undefined") {
        clearInterval(intervalId);
        try {
          await getPyodide();
          setPyodideState("ready");
          triggerToast("Інтерпретатор Python успішно запущено в браузері! 🐍", "success");
        } catch (err) {
          console.error("Pyodide error:", err);
          setPyodideState("error");
          triggerToast("Помилка при запуску Python. Спробуйте оновити сторінку.", "error");
        }
      } else {
        setPyodideLoadAttempts(prev => {
          if (prev >= 60) { // Limit attempts to 30 seconds
            clearInterval(intervalId);
            setPyodideState("error");
            triggerToast("Інтерпретатор завантажується занадто довго. Перевірте інтернет.", "error");
          }
          return prev + 1;
        });
      }
    };

    intervalId = setInterval(tryInit, 500);
    tryInit(); // Run immediately

    return () => clearInterval(intervalId);
  }, []);

  // Set default starter code or stored progress code when lesson changes
  useEffect(() => {
    const currentModule = pythonLessonsData[activeModuleIdx];
    if (currentModule) {
      const currentLesson = currentModule.lessons[activeLessonIdx];
      if (currentLesson) {
        const key = currentLesson.id;
        const savedCode = stats.lessonCodes[key];
        setLessonCode(savedCode !== undefined ? savedCode : currentLesson.starterCode);
        
        // Reset execution logs of lesson
        setLessonStdout([]);
        setLessonStderr([]);
        setRunSuccessBanner(false);
        setRunErrorMsg("");
        
        // Reset quiz
        setActiveQuizOption(null);
        setQuizAnswered(false);
        setQuizAnswerCorrect(null);
        setShowQuizDetails(false);
      }
    }
  }, [activeModuleIdx, activeLessonIdx]);

  // Handle syncing of current typing code of active lesson securely mapping to stats
  const handleLessonCodeChange = (newVal: string) => {
    setLessonCode(newVal);
    const activeLessonId = pythonLessonsData[activeModuleIdx]?.lessons[activeLessonIdx]?.id;
    if (activeLessonId) {
      setStats((prev) => ({
        ...prev,
        lessonCodes: {
          ...prev.lessonCodes,
          [activeLessonId]: newVal,
        },
      }));
    }
  };

  // Auto scrolling for console outputs
  useEffect(() => {
    if (lessonConsoleEndRef.current) {
      lessonConsoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [lessonStdout, lessonStderr]);

  useEffect(() => {
    if (playgroundConsoleEndRef.current) {
      playgroundConsoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [playgroundStdout, playgroundStderr]);

  // Execute Active Lesson Code
  const runActiveLesson = async () => {
    if (pyodideState !== "ready") {
      triggerToast("Зачекайте, будь ласка, поки завантажиться Python...", "error");
      return;
    }

    setLessonRunning(true);
    setRunSuccessBanner(false);
    setRunErrorMsg("");
    setLessonStdout([]);
    setLessonStderr([]);

    const currentLesson = pythonLessonsData[activeModuleIdx].lessons[activeLessonIdx];

    const result = await runPythonCode(lessonCode, {
      validationType: currentLesson.validationType,
      validationCode: currentLesson.validationCode,
      expectedOutput: currentLesson.expectedOutput,
      onStdout: (str) => setLessonStdout((prev) => [...prev, str]),
      onStderr: (str) => setLessonStderr((prev) => [...prev, str]),
    });

    setLessonRunning(false);

    if (result.success) {
      setRunSuccessBanner(true);
      triggerToast("Завдання виконано успішно! Код пройшов всі тести. 🎉", "success");

      // Check if lesson was already solved
      if (!stats.completedLessons.includes(currentLesson.id)) {
        setStats((prev) => {
          const updatedLessons = [...prev.completedLessons, currentLesson.id];
          return {
            ...prev,
            completedLessons: updatedLessons,
          };
        });
        addXP(25); // +25 XP reward for solution!
        
        // Check for module final completion
        checkModuleCompletionStatus(activeModuleIdx, [
          ...stats.completedLessons,
          currentLesson.id,
        ]);
      }
    } else {
      const errMsg = result.validationError || result.error || "Невірне виведення програми. Звіртеся з умовою.";
      setRunErrorMsg(errMsg);
      triggerToast("Код не пройшов перевірку. Спробуйте ще раз!", "error");
    }
  };

  // Reset lesson code
  const resetLessonCodeCurrent = () => {
    const currentLesson = pythonLessonsData[activeModuleIdx]?.lessons[activeLessonIdx];
    if (!currentLesson) return;
    
    if (window.confirm("Ви дійсно хочете скинути код до початкового стану?")) {
      handleLessonCodeChange(currentLesson.starterCode);
      triggerToast("Код скинуто до початкового стану!", "success");
    }
  };

  // Run Playground Code
  const runPlayground = async () => {
    if (pyodideState !== "ready") {
      triggerToast("Зачекайте, поки завантажиться інтерпретатор Python...", "error");
      return;
    }

    setPlaygroundRunning(true);
    setPlaygroundStdout([]);
    setPlaygroundStderr([]);

    await runPythonCode(playgroundCode, {
      validationType: "none",
      onStdout: (str) => setPlaygroundStdout((prev) => [...prev, str]),
      onStderr: (str) => setPlaygroundStderr((prev) => [...prev, str]),
    });

    setPlaygroundRunning(false);
  };

  // Handle active quiz answers
  const handleQuizAnswerSubmit = (optionIdx: number) => {
    const currentLesson = pythonLessonsData[activeModuleIdx].lessons[activeLessonIdx];
    if (!currentLesson?.quiz) return;

    setActiveQuizOption(optionIdx);
    setQuizAnswered(true);
    
    const isCorrect = optionIdx === currentLesson.quiz.correctIdx;
    setQuizAnswerCorrect(isCorrect);
    setShowQuizDetails(true);

    if (isCorrect) {
      triggerToast("Правильно! 🎉", "success");
      const quizKey = `quiz_${currentLesson.id}`;
      if (!stats.completedLessons.includes(quizKey)) {
        setStats((prev) => ({
          ...prev,
          completedLessons: [...prev.completedLessons, quizKey],
        }));
        addXP(10); // +10 XP reward for correct quiz
      }
    } else {
      triggerToast("Не зовсім правильно. Спробуйте ще раз!", "error");
    }
  };

  // Check module aggregate completion
  const checkModuleCompletionStatus = (moduleIdx: number, currentCompleted: string[]) => {
    const module = pythonLessonsData[moduleIdx];
    const moduleLessonIds = module.lessons.map((l) => l.id);
    
    // Check if all lessons within current module are cleared
    const allCleared = moduleLessonIds.every((id) => currentCompleted.includes(id));
    
    if (allCleared && !stats.completedModules.includes(module.id)) {
      setStats((prev) => ({
        ...prev,
        completedModules: [...prev.completedModules, module.id],
      }));
      
      // Delay module summary overlay popup
      setTimeout(() => {
        setCompletedModuleReward({
          moduleTitle: module.title,
          xpReward: module.xpReward,
        });
      }, 800);
    }
  };

  // Claim completed module XP
  const claimModuleRewardAndRedirect = () => {
    if (completedModuleReward) {
      addXP(completedModuleReward.xpReward);
      setCompletedModuleReward(null);
      setActiveTab("dashboard");
    }
  };

  // Triggering Playground templates loading
  const loadPlaygroundTemplate = (templateId: string) => {
    const temp = playgroundTemplates.find((t) => t.id === templateId);
    if (!temp) return;

    if (window.confirm(`Завантажити шаблон "${temp.title}"? Поточний код у пісочниці буде замінено.`)) {
      setPlaygroundCode(temp.code);
      triggerToast("Шаблон успішно завантажено!", "success");
    }
  };

  // Run Cheatsheet items directly inside playground
  const runCheatInPlayground = (codeStr: string) => {
    setPlaygroundCode(codeStr);
    setActiveTab("playground");
    triggerToast("Приклад завантажено в пісочницю! 🚀", "success");
  };

  // Download playground code as file
  const downloadPlaygroundFile = () => {
    const blob = new Blob([playgroundCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pylearn_script.py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast("Файл збережено як pylearn_script.py!", "success");
  };

  // Get total progress percentage of entire course lessons
  const totalLessons = pythonLessonsData.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalCompletedLessons = stats.completedLessons.filter((id) => !id.startsWith("quiz_")).length;
  const coursePercent = totalLessons > 0 ? Math.round((totalCompletedLessons / totalLessons) * 100) : 0;

  // Level Progression Math
  const xpInCurrentLevel = stats.xp % 100;
  const xpNeededForNext = 100;

  // Active Role description title based on level
  const roles = ["Новачок", "Стажер Python", "Junior Розробник", "Python Майстер", "Магістр Коду"];
  const currentRole = roles[Math.min(Math.floor(stats.level / 2), roles.length - 1)];

  // Helper for nouns
  const getStreakNoun = (num: number) => {
    const abs = Math.abs(num) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return "днів";
    if (last > 1 && last < 5) return "дні";
    if (last === 1) return "день";
    return "днів";
  };

  // Sidebar link styles
  const activeLinkClass = "flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-400 bg-emerald-400/8 border border-emerald-400/20 font-medium transition-all duration-250 cursor-pointer";
  const inactiveLinkClass = "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/3 font-medium transition-all duration-250 border border-transparent cursor-pointer";

  // Filter cheatsheet items
  const filteredCheatsheet = cheatsheetData.filter((item) => {
    const query = cheatSearch.toLowerCase().trim();
    if (!query) return true;
    return (
      item.title.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.desc.toLowerCase().includes(query) ||
      item.code.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex h-screen bg-[#080c14] text-[#f8fafc] overflow-hidden antialiased">
      {/* Dynamic Background subtle grid-spots */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[0%] left-[0%] w-[500px] h-[500px] bg-blue-500/10 rounded-full filter blur-[120px]" />
        <div className="absolute bottom-[0%] right-[0%] w-[500px] h-[500px] bg-purple-500/10 rounded-full filter blur-[120px]" />
        <div className="absolute top-[50%] left-[40%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full filter blur-[120px]" />
      </div>

      {/* Floater Toast Container */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-5 py-4 rounded-xl border bg-[#0d1527]/90 backdrop-blur-md shadow-2xl transition-all duration-300 max-w-sm animate-fade-in ${
              toast.type === "success"
                ? "border-emerald-500/40 text-slate-100"
                : toast.type === "xp"
                ? "border-purple-500/40 text-slate-100"
                : "border-red-500/40 text-slate-100"
            }`}
          >
            <div className={`p-1.5 rounded-full ${
              toast.type === "success"
                ? "bg-emerald-500/10 text-emerald-400"
                : toast.type === "xp"
                ? "bg-purple-500/10 text-purple-400"
                : "bg-red-500/10 text-red-400"
            }`}>
              {toast.type === "success" ? (
                <Check className="w-4 h-4" />
              ) : toast.type === "xp" ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium pr-2 leading-relaxed">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Floating loading interpreter bar */}
      {pyodideState === "loading" && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-[#0d1527]/90 backdrop-blur-md border border-blue-500/30 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-2xl z-50 animate-pulse">
          <div className="w-4 h-4 border-2 border-transparent border-t-blue-400 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide">
            Виконується завантаження ядра Python...
          </span>
        </div>
      )}

      {/* Sidebar - Desktop Layout */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-[#060911]/90 border-r border-slate-900/60 p-6 z-10 relative">
        {/* Logo Branding */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="relative p-2 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-xl shadow-lg ring-1 ring-white/10">
            <Code className="w-6 h-6 text-emerald-300" />
            <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-xl blur-sm opacity-35 z-[-1]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-blue-400 to-blue-500 bg-clip-text text-transparent">
              PyLearn
            </h1>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block -mt-1">
              Освітній портал
            </span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-grow flex flex-col gap-2">
          <div
            onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
            className={activeTab === "dashboard" ? activeLinkClass : inactiveLinkClass}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Панель керування</span>
          </div>

          <div
            onClick={() => { setActiveTab("lesson"); setMobileMenuOpen(false); }}
            className={activeTab === "lesson" ? activeLinkClass : inactiveLinkClass}
          >
            <BookOpen className="w-5 h-5" />
            <span>Уроки</span>
          </div>

          <div
            onClick={() => { setActiveTab("playground"); setMobileMenuOpen(false); }}
            className={activeTab === "playground" ? activeLinkClass : inactiveLinkClass}
          >
            <Terminal className="w-5 h-5" />
            <span>Пісочниця</span>
          </div>

          <div
            onClick={() => { setActiveTab("cheatsheet"); setMobileMenuOpen(false); }}
            className={activeTab === "cheatsheet" ? activeLinkClass : inactiveLinkClass}
          >
            <FileText className="w-5 h-5" />
            <span>Шпаргалка</span>
          </div>
        </nav>

        {/* Sidebar Mini Profile */}
        <div className="mt-auto pt-6 border-t border-slate-900/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/20 text-sm">
            {stats.completedLessons.length > 0 ? "XP" : "🐍"}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">{stats.xp ? `Кодер [${stats.xp} XP]` : "Кодер Python"}</h4>
            <span className="text-xs text-slate-400 font-medium">{currentRole}</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-grow flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Header - Mobile Bar */}
        <header className="flex lg:hidden items-center justify-between px-6 py-4 bg-[#060911]/90 border-b border-slate-900/60 z-20">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              PyLearn
            </h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 bg-slate-900 border border-slate-850 rounded-lg text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Sidebar Nav - Mobile Overlay Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute inset-0 top-[57px] bg-[#080c14]/95 backdrop-blur-lg z-35 flex flex-col p-6 gap-3 border-b border-slate-900/80">
            <div
              onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
              className={`p-3 rounded-xl flex items-center gap-3 ${
                activeTab === "dashboard" ? "bg-emerald-400/10 text-emerald-400" : "text-slate-300"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Панель керування</span>
            </div>
            
            <div
              onClick={() => { setActiveTab("lesson"); setMobileMenuOpen(false); }}
              className={`p-3 rounded-xl flex items-center gap-3 ${
                activeTab === "lesson" ? "bg-emerald-400/10 text-emerald-400" : "text-slate-300"
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Уроки</span>
            </div>

            <div
              onClick={() => { setActiveTab("playground"); setMobileMenuOpen(false); }}
              className={`p-3 rounded-xl flex items-center gap-3 ${
                activeTab === "playground" ? "bg-emerald-400/10 text-emerald-400" : "text-slate-300"
              }`}
            >
              <Terminal className="w-5 h-5" />
              <span>Пісочниця</span>
            </div>

            <div
              onClick={() => { setActiveTab("cheatsheet"); setMobileMenuOpen(false); }}
              className={`p-3 rounded-xl flex items-center gap-3 ${
                activeTab === "cheatsheet" ? "bg-emerald-400/10 text-emerald-400" : "text-slate-300"
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Шпаргалка</span>
            </div>

            <div className="mt-auto flex items-center gap-3 pt-4 border-t border-slate-900">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">P</div>
              <div>
                <h4 className="text-xs font-bold">{stats.xp ? `Учень (${stats.xp} XP)` : "Кодер Python"}</h4>
                <p className="text-[10px] text-slate-500">{currentRole}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Container based on active tab view */}
        <main className="flex-grow overflow-y-auto p-4 sm:p-8 relative">

          {/* ================= 1. VIEW: DASHBOARD ================= */}
          {activeTab === "dashboard" && (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
              
              {/* Top Banner section */}
              <div className="p-6 sm:p-8 bg-gradient-to-r from-[#0d1527]/80 to-[#121f3a]/50 backdrop-blur-md rounded-2xl border border-[#4ade80]/15 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="relative z-10 max-w-xl">
                  <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight text-slate-100 flex items-center gap-2">
                    З поверненням, <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent italic px-1">Кодер</span>! ⚡
                  </h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Навчайтеся писати справжній Python код безпосередньо у своєму вебі. Кожен урок містить теорію, практичні завдання та інтерактивні тести!
                  </p>
                </div>

                {/* Counter statistics pill list */}
                <div className="grid grid-cols-3 gap-3 w-full md:w-auto relative z-10">
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-900 flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Досвід</span>
                    <span className="text-lg font-bold text-emerald-400 mt-1">{stats.xp} XP</span>
                  </div>
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-900 flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Уроки</span>
                    <span className="text-lg font-bold text-blue-400 mt-1">{totalCompletedLessons} / {totalLessons}</span>
                  </div>
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-900 flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Серія</span>
                    <span className="text-lg font-bold text-amber-500 mt-1 uppercase flex items-center gap-1">
                      <Flame className="w-4 h-4 fill-amber-500/10 text-amber-500 animate-pulse" />
                      {stats.streak} {getStreakNoun(stats.streak)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid content partition: Syllabus on Left, levels on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Syllabus Modules details */}
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2 text-slate-105">
                    <BookOpenCheck className="w-5 h-5 text-emerald-400" />
                    Навчальна програма
                  </h3>

                  <div className="space-y-4">
                    {pythonLessonsData.map((m, mIdx) => {
                      const completedCount = m.lessons.filter((l) => stats.completedLessons.includes(l.id)).length;
                      const percent = Math.round((completedCount / m.lessons.length) * 100);
                      const isComplete = completedCount === m.lessons.length;

                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            // Find first uncompleted lesson index
                            let firstUnsolved = 0;
                            for (let i = 0; i < m.lessons.length; i++) {
                              if (!stats.completedLessons.includes(m.lessons[i].id)) {
                                firstUnsolved = i;
                                break;
                              }
                            }
                            setActiveModuleIdx(mIdx);
                            setActiveLessonIdx(firstUnsolved);
                            setActiveTab("lesson");
                          }}
                          className={`p-5 rounded-2xl bg-[#09101f]/60 backdrop-blur-sm border border-slate-900/80 hover:border-emerald-500/25 transition-all duration-300 hover:translate-x-1 cursor-pointer flex justify-between items-center group relative overflow-hidden`}
                        >
                          {/* Left Details */}
                          <div className="flex-grow pr-4">
                            <div className="flex items-center gap-2.5 mb-1.5">
                              <span className={`p-1.5 rounded-lg text-xs leading-none font-bold ${
                                isComplete ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                              }`}>
                                {isComplete ? "Пройдено" : `${percent}%`}
                              </span>
                              <h4 className="font-extrabold text-slate-100 text-base sm:text-lg group-hover:text-emerald-400 transition-colors">
                                {m.title}
                              </h4>
                            </div>
                            <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 max-w-xl">{m.summary}</p>
                          </div>

                          {/* Right Progression block */}
                          <div className="flex flex-col items-end shrink-0 gap-2">
                            <span className="text-[11px] text-slate-400 tracking-wide font-medium bg-slate-950/30 px-2.5 py-1 rounded-full border border-slate-900/40">
                              +{m.xpReward} XP бонус
                            </span>
                            <div className="flex flex-col items-end">
                              <span className="text-[11px] text-slate-500 font-bold mb-1 uppercase tracking-wider">
                                {completedCount} з {m.lessons.length} уроків
                              </span>
                              <div className="w-24 sm:w-28 h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-900">
                                <div
                                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Level metrics details column */}
                <div className="p-6 bg-[#09101f]/50 border border-slate-900 rounded-2xl text-center flex flex-col justify-between max-w-sm mx-auto h-fit w-full">
                  <h4 className="text-slate-300 font-extrabold text-base border-b border-slate-900 pb-3 mb-6">
                    Рівневий прогрес
                  </h4>

                  {/* Level Circle shape Badge */}
                  <div className="relative w-28 h-28 mx-auto flex flex-col justify-center items-center bg-[#0d1629] rounded-full border-4 border-slate-850 shadow-xl shadow-slate-950">
                    <span className="text-4xl font-extrabold text-emerald-400 tracking-wide leading-none select-none">
                      {stats.level}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1 select-none">
                      Рівень
                    </span>
                  </div>

                  <div className="mt-8">
                    <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium px-1">
                      <span>Наступний рівень</span>
                      <span className="text-emerald-400 font-bold">{xpInCurrentLevel} / {xpNeededForNext} XP</span>
                    </div>
                    {/* Horizontal Fill standard XP meters */}
                    <div className="h-2 w-full bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full transition-all duration-700"
                        style={{ width: `${(xpInCurrentLevel / xpNeededForNext) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Proactive Tip Card info */}
                  <div className="mt-8 p-4 bg-[#080d15]/60 hover:bg-[#080d15] rounded-xl border border-slate-900 text-left text-xs leading-relaxed transition-colors">
                    <strong className="text-emerald-400 block mb-1">💡 Практична порада:</strong>
                    Перейдіть в розділ <span className="text-blue-400 underline cursor-pointer" onClick={() => setActiveTab("playground")}>Пісочниця</span>, щоб вільно перевіряти або писати свої власні скрипти і алгоритми в реальному часі!
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ================= 2. VIEW: INTERACTIVE LESSONS ================= */}
          {activeTab === "lesson" && (
            <div className="max-w-7xl mx-auto h-full flex flex-col animate-fade-in relative">
              
              {/* Header Controller panel */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-slate-900">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="p-2 border border-slate-800 bg-[#090f1a] rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors"
                    title="Назад до панелі"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold tracking-wide">
                      {pythonLessonsData[activeModuleIdx]?.title} / Урок {activeLessonIdx + 1}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-100 select-all">
                      {pythonLessonsData[activeModuleIdx]?.lessons[activeLessonIdx]?.title}
                    </h3>
                  </div>
                </div>

                {/* Lesson selectors back/next steps buttons */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={activeModuleIdx === 0 && activeLessonIdx === 0}
                    onClick={() => {
                      if (activeLessonIdx > 0) {
                        setActiveLessonIdx(activeLessonIdx - 1);
                      } else {
                        const prevM = activeModuleIdx - 1;
                        setActiveModuleIdx(prevM);
                        setActiveLessonIdx(pythonLessonsData[prevM].lessons.length - 1);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-2 border border-slate-800 bg-[#090f1a] text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" /> Назад
                  </button>

                  <button
                    onClick={() => {
                      const mod = pythonLessonsData[activeModuleIdx];
                      if (activeLessonIdx < mod.lessons.length - 1) {
                        setActiveLessonIdx(activeLessonIdx + 1);
                      } else if (activeModuleIdx < pythonLessonsData.length - 1) {
                        setActiveModuleIdx(activeModuleIdx + 1);
                        setActiveLessonIdx(0);
                      } else {
                        // End of course redirect back
                        setActiveTab("dashboard");
                        triggerToast("🎉 Вітаємо з завершенням курсу!", "success");
                      }
                    }}
                    className="flex items-center gap-1 px-3.5 py-2 border border-slate-800 bg-[#090f1a] text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-900 transition-colors"
                  >
                    <span>Далі</span> <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Interactive Screen Splitter */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-270px)] sm:h-[calc(100vh-230px)] min-h-[400px]">
                
                {/* Left block Column for Theoretical description and tests */}
                <div className="lg:col-span-5 h-full overflow-y-auto space-y-6 pr-1 bg-[#09101f]/30 border border-slate-900/50 p-4 rounded-2xl select-text">
                  
                  {/* Theoretical text rendering */}
                  <div 
                    className="theory-content"
                    dangerouslySetInnerHTML={{
                      __html: pythonLessonsData[activeModuleIdx]?.lessons[activeLessonIdx]?.theory || ""
                    }}
                  />

                  {/* Interactive Quiz Frame */}
                  {pythonLessonsData[activeModuleIdx]?.lessons[activeLessonIdx]?.quiz && (
                    <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/3 animate-fade-in relative">
                      
                      {/* Check if the user solved the current practical task to unlock the quiz */}
                      {!stats.completedLessons.includes(pythonLessonsData[activeModuleIdx]?.lessons[activeLessonIdx]?.id) ? (
                        <div className="absolute inset-0 bg-[#080d16]/95 backdrop-blur-[2px] rounded-xl flex flex-col justify-center items-center text-center p-4 z-10">
                          <Lock className="w-8 h-8 text-slate-500 mb-2 animate-bounce" />
                          <h4 className="text-slate-300 font-bold text-sm">🔒 Квіз заблоковано</h4>
                          <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                            Виконайте практичне завдання в редакторі коду поруч, щоб розблокувати цей тест!
                          </p>
                        </div>
                      ) : null}

                      <div className="relative z-0">
                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 select-none">
                          Додатковий Квіз (+10 XP)
                        </span>
                        
                        <h4 className="text-slate-200 font-extrabold text-sm sm:text-base mt-2.5 mb-4 leading-relaxed">
                          {pythonLessonsData[activeModuleIdx]?.lessons[activeLessonIdx]?.quiz?.question}
                        </h4>

                        <div className="flex flex-col gap-2.5">
                          {pythonLessonsData[activeModuleIdx]?.lessons[activeLessonIdx]?.quiz?.options.map((opt, oIdx) => {
                            const isSelected = activeQuizOption === oIdx;
                            const isCorrectAnswerIdx = oIdx === pythonLessonsData[activeModuleIdx]?.lessons[activeLessonIdx]?.quiz?.correctIdx;
                            const isAlreadySolved = stats.completedLessons.includes(`quiz_${pythonLessonsData[activeModuleIdx]?.lessons[activeLessonIdx]?.id}`);

                            let btnStyle = "w-full text-left p-3 text-slate-400 hover:text-slate-100 hover:bg-white/3 border border-slate-900 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 bg-[#050912]/80";

                            if (quizAnswered) {
                              if (isCorrectAnswerIdx) {
                                btnStyle = "w-full text-left p-3 text-white bg-emerald-500/15 border-emerald-500/40 rounded-xl text-xs sm:text-sm font-extrabold shadow-sm";
                              } else if (isSelected) {
                                btnStyle = "w-full text-left p-3 text-white bg-red-500/15 border-red-500/40 rounded-xl text-xs sm:text-sm font-bold animate-pulse";
                              } else {
                                btnStyle = "w-full text-left p-3 text-slate-650 opacity-40 border-slate-900 rounded-xl text-xs sm:text-sm font-medium cursor-not-allowed";
                              }
                            } else if (isAlreadySolved && isCorrectAnswerIdx) {
                              btnStyle = "w-full text-left p-3 text-white bg-emerald-500/15 border-emerald-500/40 rounded-xl text-xs sm:text-sm font-bold shadow-sm";
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={quizAnswered || isAlreadySolved}
                                onClick={() => handleQuizAnswerSubmit(oIdx)}
                                className={btnStyle}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Quiz Explanation reveals once answered */}
                        {showQuizDetails && (
                          <div className="mt-4 p-3 bg-slate-950/40 rounded-lg border border-slate-900 text-xs text-slate-400 leading-relaxed shadow-inner animate-fade-in">
                            <strong className={`${quizAnswerCorrect ? "text-emerald-400" : "text-red-400"} block text-sm font-bold mb-1`}>
                              {quizAnswerCorrect ? "Чудово! Правильно! 🎉" : "Не зовсім вірна відповідь ❌"}
                            </strong>
                            {quizAnswerCorrect 
                              ? pythonLessonsData[activeModuleIdx]?.lessons[activeLessonIdx]?.quiz?.explanation 
                              : "Прочитайте теорію ще раз та уважно поміркуйте над кожним з варіантів відповіді."
                            }
                          </div>
                        )}
                        
                        {!quizAnswered && stats.completedLessons.includes(`quiz_${pythonLessonsData[activeModuleIdx]?.lessons[activeLessonIdx]?.id}`) && (
                          <div className="mt-4 p-3 bg-slate-950/40 rounded-lg border border-slate-900 text-xs text-slate-400 leading-relaxed shadow-inner">
                            <strong className="text-emerald-400 block text-xs font-bold mb-1">
                              Тест вже пройдено ✔
                            </strong>
                            {pythonLessonsData[activeModuleIdx]?.lessons[activeLessonIdx]?.quiz?.explanation}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

                {/* Right Column of the Split Window: Text Editor & live terminal output log */}
                <div className="lg:col-span-7 h-full flex flex-col gap-4 overflow-hidden">
                  
                  {/* IDE style Interactive Code Area Column */}
                  <div className="flex-1 flex flex-col bg-[#060911]/80 border border-slate-900/60 rounded-2xl overflow-hidden shadow-xl">
                    
                    {/* Panel headers action elements */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-950 border-b border-slate-900 z-10 shrink-0 select-none">
                      <div className="flex items-center gap-2">
                        <Code className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-300">
                          Редактор коду
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {pythonLessonsData[activeModuleIdx]?.lessons[activeLessonIdx]?.hint && (
                          <button
                            onClick={() => triggerToast(pythonLessonsData[activeModuleIdx].lessons[activeLessonIdx].hint || "", "success")}
                            className="px-3 py-1.5 border border-slate-850 bg-[#0a0f1b] hover:bg-slate-900 text-slate-400 hover:text-slate-100 rounded-lg text-xs transition-colors"
                            title="Показати підказку"
                          >
                            Підказка 💡
                          </button>
                        )}
                        <button
                          onClick={resetLessonCodeCurrent}
                          className="p-1.5 border border-slate-800 bg-[#0a0f1b]/80 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                          title="Скинути код"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          disabled={lessonRunning || pyodideState === "loading"}
                          onClick={runActiveLesson}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800/40 text-slate-950 font-extrabold rounded-lg text-xs shadow-md transition-colors disabled:cursor-not-allowed"
                        >
                          <Play className="w-3.5 h-3.5 fill-slate-950" />
                          <span>{lessonRunning ? "Виконується..." : "Запустити"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Integrated custom sync components */}
                    <div className="flex-grow overflow-hidden relative">
                      <CodeEditor 
                        value={lessonCode} 
                        onChange={handleLessonCodeChange}
                        onRun={runActiveLesson}
                      />
                    </div>
                  </div>

                  {/* Terminal interactive visual monitor console */}
                  <div className="h-[150px] sm:h-[180px] flex flex-col bg-[#04070e] border border-slate-900 rounded-2xl overflow-hidden shadow-inner">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#020408] border-b border-slate-950 shrink-0 select-none">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-slate-400" />
                        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                          Консоль виведення
                        </span>
                      </div>
                      
                      {/* State Pulse Indicators */}
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          pyodideState === "ready" 
                            ? "bg-emerald-500 animate-pulse-beacon" 
                            : pyodideState === "loading"
                            ? "bg-amber-500" 
                            : "bg-red-500"
                        }`} />
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          {pyodideState === "ready" ? "Готово" : pyodideState === "loading" ? "Вхід..." : "Помилка"}
                        </span>
                      </div>
                    </div>

                    {/* Console Logger lines block */}
                    <div className="flex-grow p-4 font-mono text-xs overflow-y-auto space-y-1 select-text">
                      {lessonStdout.length === 0 && lessonStderr.length === 0 && !runSuccessBanner && !runErrorMsg && (
                        <p className="text-slate-650 italic">Запустіть скрипт, щоб побачити результати...</p>
                      )}

                      {/* Display Outputs */}
                      {lessonStdout.map((line, idx) => (
                        <div key={idx} className="text-slate-300 leading-relaxed whitespace-pre-wrap">{line}</div>
                      ))}

                      {/* Diagnostic tests/Assertion messages alerts */}
                      {runSuccessBanner && (
                        <div className="p-3 bg-emerald-950/25 border border-emerald-500/20 text-emerald-400 rounded-xl font-sans mt-2 animate-fade-in leading-relaxed text-xs">
                          ✔ <strong>Завдання успішно виконано!</strong> Код правильно пройшов всі тести та валідації в ізольованому середовищі!
                        </div>
                      )}

                      {runErrorMsg && (
                        <div className="p-3 bg-red-950/25 border border-red-500/20 text-red-400 rounded-xl font-sans mt-2 whitespace-pre-wrap animate-fade-in leading-relaxed text-xs">
                          ❌ <strong>Помилка відповідності:</strong>
                          <div className="mt-1 font-mono text-slate-300 bg-black/30 p-1.5 rounded text-[11px]">
                            {runErrorMsg}
                          </div>
                        </div>
                      )}

                      {/* Syntax exception logs errors fallback */}
                      {lessonStderr.map((err, idx) => (
                        <div key={idx} className="text-red-400 leading-relaxed font-semibold whitespace-pre-wrap">{err}</div>
                      ))}

                      <div ref={lessonConsoleEndRef} />
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ================= 3. VIEW: PLAYGROUND ================= */}
          {activeTab === "playground" && (
            <div className="max-w-7xl mx-auto h-full flex flex-col animate-fade-in">
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-900 shrink-0">
                <div>
                  <span className="text-xs text-slate-500 font-semibold tracking-wide">Свободный режим</span>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-100 uppercase tracking-tight">
                    Пісочниця Python
                  </h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadPlaygroundFile}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 bg-[#090f1a] hover:bg-slate-900 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Скачати .py</span>
                  </button>

                  <button
                    disabled={playgroundRunning}
                    onClick={runPlayground}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-slate-950 font-extrabold rounded-lg text-xs shadow-md transition-colors"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>{playgroundRunning ? "Запуск..." : "Запустити"}</span>
                  </button>
                </div>
              </div>

              {/* Grid panel body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] sm:h-[calc(100vh-190px)] min-h-[400px]">
                
                {/* Left side column: Templates selection list */}
                <div className="lg:col-span-3 h-full flex flex-col pr-1 overflow-y-auto space-y-4 bg-[#09101f]/30 border border-slate-900/50 p-4 rounded-2xl select-none">
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-900 pb-2 mb-2">
                    Шаблони коду
                  </h4>
                  {playgroundTemplates.map((temp) => (
                    <div
                      key={temp.id}
                      onClick={() => loadPlaygroundTemplate(temp.id)}
                      className="p-3 bg-[#0d1627]/60 hover:bg-[#0d1627] border border-slate-900 hover:border-blue-500/30 rounded-xl transition-all duration-200 cursor-pointer text-left"
                    >
                      <h5 className="font-extrabold text-slate-200 text-sm mb-1">{temp.title}</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{temp.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Right side: Editor area & debug log */}
                <div className="lg:col-span-9 h-full flex flex-col gap-4 overflow-hidden">
                  
                  {/* Editor view */}
                  <div className="flex-grow flex flex-col bg-[#060911]/80 border border-slate-900/60 rounded-2xl overflow-hidden shadow-xl">
                    <CodeEditor 
                      value={playgroundCode} 
                      onChange={setPlaygroundCode}
                      onRun={runPlayground}
                    />
                  </div>

                  {/* Playgrounds logger terminal console */}
                  <div className="h-[150px] sm:h-[180px] flex flex-col bg-[#04070e] border border-slate-900 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#020408] border-b border-slate-950 shrink-0 select-none">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-slate-400" />
                        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                          Результат запуску
                        </span>
                      </div>
                      <button
                        onClick={() => { setPlaygroundStdout([]); setPlaygroundStderr([]); }}
                        className="px-2.5 py-1 bg-[#090f1a] hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-100 rounded text-[10px] uppercase font-bold transition-colors"
                      >
                        Очистити
                      </button>
                    </div>

                    <div className="flex-grow p-4 font-mono text-xs overflow-y-auto space-y-1 select-text">
                      {playgroundStdout.length === 0 && playgroundStderr.length === 0 && (
                        <p className="text-slate-650 italic">Тут відобразиться результат виконання вашого скрипту...</p>
                      )}

                      {playgroundStdout.map((line, idx) => (
                        <div key={idx} className="text-slate-300 whitespace-pre-wrap leading-relaxed">{line}</div>
                      ))}

                      {playgroundStderr.map((err, idx) => (
                        <div key={idx} className="text-red-400 whitespace-pre-wrap leading-relaxed font-semibold">{err}</div>
                      ))}

                      {playgroundStdout.length > 0 && (
                        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider py-1 border-t border-slate-900 border-dashed mt-2">
                          --- Програму завершено ---
                        </div>
                      )}

                      <div ref={playgroundConsoleEndRef} />
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ================= 4. VIEW: CHEATSHEET ================= */}
          {activeTab === "cheatsheet" && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 mb-4 border-b border-slate-900 shrink-0 select-none">
                <div>
                  <span className="text-xs text-slate-500 font-semibold tracking-wide">Быстрый справочник</span>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-100 uppercase tracking-tight">
                    Шпаргалка з Python
                  </h2>
                </div>

                {/* Quick Live Search Wrapper */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={cheatSearch}
                    onChange={(e) => setCheatSearch(e.target.value)}
                    placeholder="Пошук теми..."
                    className="w-full bg-[#0d1627]/60 border border-slate-850 hover:border-slate-800 rounded-xl px-9 py-2 text-xs sm:text-sm text-slate-100 outline-none focus:border-emerald-400/50 transition-colors placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Grid structure mapping objects */}
              {filteredCheatsheet.length === 0 ? (
                <div className="text-center py-20 bg-[#09101f]/20 border border-slate-900 rounded-2xl select-none">
                  <Info className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h4 className="text-slate-400 font-bold text-sm">Нічого не знайдено</h4>
                  <p className="text-xs text-slate-600 mt-1">Оберіть інший запит для живого розбору</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-text">
                  {filteredCheatsheet.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-[#09101f]/50 border border-slate-900/60 flex flex-col justify-between hover:border-emerald-500/15 group transition-colors"
                    >
                      <div>
                        {/* Header categories info labels */}
                        <div className="flex items-center gap-2 mb-3 select-none">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                            {item.category}
                          </span>
                          <h4 className="font-extrabold text-slate-200 text-base">{item.title}</h4>
                        </div>

                        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">{item.desc}</p>
                        
                        {/* Quick code example box */}
                        <div className="p-3 bg-[#04070e] border border-slate-950 font-mono text-xs text-slate-350 rounded-lg overflow-x-auto whitespace-pre">
                          {item.code}
                        </div>
                      </div>

                      {/* Direct launch link to sandbox */}
                      <div className="flex justify-end mt-4 select-none">
                        <button
                          onClick={() => runCheatInPlayground(item.code)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-slate-800 bg-[#050912]/80 hover:bg-slate-900 hover:text-white text-slate-400 rounded-lg text-xs font-bold transition-all"
                        >
                          Запустити 🚀
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ================= MODULE COMPLETE SUCCESS CELEBRATION CONGRATS OVERLAY BANNER ================= */}
      {completedModuleReward && (
        <div className="fixed inset-0 bg-[#080c14]/95 backdrop-blur-lg flex justify-center items-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full bg-[#0d1527] border border-emerald-400/20 p-6 sm:p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden flex flex-col items-center">
            
            {/* Ambient decorative glowing overlay */}
            <div className="absolute top-[-30%] w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />

            <div className="relative z-10">
              <div className="w-16 h-16 bg-emerald-400/10 border-2 border-emerald-400 rounded-full flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-400/10 mx-auto animate-bounce mb-6">
                <Check className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-black text-slate-100 mb-2">Модуль Завершено! 🎉</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed px-2">
                Вітаємо! Ви успішно вивчили теоретичні основи та правильно розв'язали всі практичні уроки за темою:
              </p>
              
              <div className="my-4 bg-slate-950/60 p-3 rounded-xl border border-slate-900 font-bold text-slate-250 text-sm">
                {completedModuleReward.moduleTitle}
              </div>

              <div className="inline-block px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-lg font-black rounded-2xl animate-pulse my-4 shadow-inner">
                +{completedModuleReward.xpReward} XP бонус нараховано!
              </div>

              <button
                onClick={claimModuleRewardAndRedirect}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-blue-500 hover:opacity-90 text-slate-950 font-black rounded-2xl transition-all shadow-md text-sm mt-4 uppercase tracking-wider"
              >
                Продовжити навчання
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
