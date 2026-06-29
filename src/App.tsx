import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Message,
  ChatSession,
  SentimentData,
  Badge,
  DrawingPath,
  CollaborationUser,
  AppNotification
} from './types';
import { Sidebar } from './components/Sidebar';
import { Whiteboard } from './components/Whiteboard';
import { MoodTracker } from './components/MoodTracker';
import { BadgeTracker } from './components/BadgeTracker';
import { NotificationsList } from './components/Notifications';
import { encryptText, decryptText } from './utils/crypto';
import {
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Send,
  Loader2,
  Award,
  Compass,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Activity,
  AlertCircle,
  Terminal,
  ExternalLink
} from 'lucide-react';

const INITIAL_BADGES: Badge[] = [
  { id: 'first_spark', name: 'First Spark', description: 'Initiated your first conversation with AuraChat.', iconName: 'Flame', unlocked: false, xpReward: 50 },
  { id: 'mood_explorer', name: 'Aura Navigator', description: 'Run a real-time semantic mood analysis.', iconName: 'Compass', unlocked: false, xpReward: 40 },
  { id: 'zen_master', name: 'Zen Harmony', description: 'Reached a state of complete calm or meditative Zen state.', iconName: 'Heart', unlocked: false, xpReward: 80 },
  { id: 'canvas_creator', name: 'Creative Alchemist', description: 'Drew a creative stroke on the collaborative AuraBoard.', iconName: 'Paintbrush', unlocked: false, xpReward: 60 },
  { id: 'e2ee_guardian', name: 'Cipher Guard', description: 'Secured your conversation with full end-to-end encryption.', iconName: 'Shield', unlocked: false, xpReward: 100 },
  { id: 'theme_shifter', name: 'Vibe Architect', description: 'Toggled through Light, Dark, and Pink visual themes.', iconName: 'Palette', unlocked: false, xpReward: 30 },
  { id: 'badge_hoarder', name: 'Ascended Being', description: 'Unlocked 4 or more accomplishment badges.', iconName: 'Sparkles', unlocked: false, xpReward: 120 },
];

export default function App() {
  // Theme & Identity
  const [theme, setTheme] = useState<'light' | 'dark' | 'pink'>('dark');
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('aura_username') || `Explorer-${Math.floor(Math.random() * 9000 + 1000)}`;
  });
  const [userColor] = useState<string>(() => {
    const colors = ['#ec4899', '#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
    return colors[Math.floor(Math.random() * colors.length)];
  });
  const [userId] = useState<string>(() => {
    const cached = localStorage.getItem('aura_userid');
    if (cached) return cached;
    const newId = Math.random().toString(36).substring(2, 11);
    localStorage.setItem('aura_userid', newId);
    return newId;
  });

  // Navigation
  const [activeTab, setActiveTab] = useState<'chat' | 'whiteboard' | 'mood' | 'badges'>('chat');

  // Chats State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // E2EE Credentials
  const [passcode, setPasscode] = useState('');
  const [isE2eeEnabled, setIsE2eeEnabled] = useState(false);

  // Collaboration State (Drawing and peers)
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [peers, setPeers] = useState<CollaborationUser[]>([]);

  // Gamification & Mood states
  const [xp, setXp] = useState<number>(() => {
    return Number(localStorage.getItem('aura_xp') || '0');
  });
  const [badges, setBadges] = useState<Badge[]>(() => {
    const cached = localStorage.getItem('aura_badges');
    return cached ? JSON.parse(cached) : INITIAL_BADGES;
  });
  const [moodHistory, setMoodHistory] = useState<SentimentData[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // WebSocket Ref
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Synchronize localStorage
  useEffect(() => {
    localStorage.setItem('aura_username', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('aura_xp', xp.toString());
  }, [xp]);

  useEffect(() => {
    localStorage.setItem('aura_badges', JSON.stringify(badges));
  }, [badges]);

  // Adjust document elements when theme shifts
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'pink-theme');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'pink') {
      root.classList.add('pink-theme');
    }

    // Reward for switching themes
    const toggledThemes = JSON.parse(localStorage.getItem('aura_toggled_themes') || '[]');
    if (!toggledThemes.includes(theme)) {
      const updated = [...toggledThemes, theme];
      localStorage.setItem('aura_toggled_themes', JSON.stringify(updated));
      if (updated.length === 3) {
        unlockBadge('theme_shifter');
      }
    }
  }, [theme]);

  // WebSocket Connection Handlers
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const connectWebSocket = () => {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        // Register client user in real-time server list
        socket.send(JSON.stringify({
          type: 'user_join',
          user: { id: userId, name: userName, color: userColor }
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'sync_board':
              setPaths(data.paths);
              break;

            case 'sync_users':
              setPeers(data.users);
              break;

            case 'peer_join':
              setPeers((prev) => {
                if (prev.some((p) => p.id === data.user.id)) return prev;
                return [...prev, data.user];
              });
              addNotification(
                'Peer Connected',
                `${data.user.name} joined the creative Aura space!`,
                'user'
              );
              break;

            case 'peer_leave':
              setPeers((prev) => prev.filter((p) => p.id !== data.userId));
              break;

            case 'peer_cursor':
              setPeers((prev) =>
                prev.map((p) =>
                  p.id === data.userId
                    ? { ...p, cursorX: data.cursorX, cursorY: data.cursorY }
                    : p
                )
              );
              break;

            case 'peer_draw_start':
              setPaths((prev) => [...prev, data.path]);
              break;

            case 'peer_draw_move':
              setPaths((prev) =>
                prev.map((p) => {
                  if (p.id !== data.pathId) return p;
                  if (data.tool === 'pen' || data.tool === 'eraser') {
                    return { ...p, points: [...p.points, data.point] };
                  } else {
                    return { ...p, points: [p.points[0], data.point] };
                  }
                })
              );
              break;

            case 'peer_draw_end':
              // Path ended, no state mutation required
              break;

            case 'board_cleared':
              setPaths([]);
              addNotification(
                'Board Reset',
                'The shared whiteboard was cleared by a peer.',
                'info'
              );
              break;

            case 'peer_badge_unlocked':
              addNotification(
                'Peer Achievement',
                `${data.userName} unlocked the "${data.badgeName}" Badge! 🏆`,
                'badge'
              );
              break;

            default:
              break;
          }
        } catch (e) {
          console.error('Error in WS payload execution:', e);
        }
      };

      socket.onclose = () => {
        // Auto reconnect helper
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [userName, userId, userColor]);

  // Load Initial Chat Sessions
  useEffect(() => {
    const cachedSessions = localStorage.getItem('aura_sessions');
    if (cachedSessions) {
      const parsed = JSON.parse(cachedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setActiveSessionId(parsed[parsed.length - 1].id);
      }
    } else {
      // Create first empty session
      const firstSession: ChatSession = {
        id: Math.random().toString(36).substring(2, 9),
        title: 'Quantum Ideation',
        messages: [
          {
            id: 'welcome',
            role: 'model',
            text: 'Welcome to AuraChat, your premium secure creative sandbox. Start brainstorming here. If E2EE is locked, your messages are secured with military-grade AES-256 before leaving your computer.',
            timestamp: new Date().toLocaleTimeString(),
          }
        ],
        createdAt: new Date().toISOString()
      };
      setSessions([firstSession]);
      setActiveSessionId(firstSession.id);
    }
  }, []);

  // Sync session changes back to storage
  const syncSessionsToStorage = (updated: ChatSession[]) => {
    setSessions(updated);
    localStorage.setItem('aura_sessions', JSON.stringify(updated));
  };

  // Scroll messages to bottom on append
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, isTyping]);

  // Unified theme visual classes
  const styles = useMemo(() => {
    if (theme === 'dark') {
      return {
        bg: 'bg-zinc-950 text-zinc-100 font-sans',
        card: 'bg-zinc-900 border-zinc-800 text-zinc-100',
        cardHeader: 'border-b border-zinc-800 bg-zinc-900/60 p-4',
        input: 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:ring-violet-500/40',
        sidebarActive: 'bg-zinc-800 border-zinc-700 text-zinc-200',
        accentBtn: 'bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700/80',
        solidBtn: 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition-all',
        navTab: (active: boolean) =>
          active
            ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30',
        userMessage: 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white border-violet-500 rounded-tr-none shadow-sm',
        modelMessage: 'bg-zinc-800/60 border-zinc-700/50 text-zinc-100 rounded-tl-none shadow-none',
        headerBg: 'bg-zinc-900/40',
        headerBorder: 'border-zinc-800',
        headerText: 'text-zinc-400 font-mono',
        tabBarBg: 'bg-zinc-900',
        tabBarBorder: 'border-zinc-800',
        footerBg: 'bg-zinc-900/40',
        footerBorder: 'border-zinc-800',
        footerText: 'text-zinc-400',
        sparkle: 'text-violet-400',
        accentGlow: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
        pingRing: 'bg-violet-500',
      };
    } else if (theme === 'pink') {
      return {
        bg: 'bg-[#0f050d] text-pink-50 font-sans',
        card: 'bg-[#1a0a16] border-pink-900/30 shadow-[0_0_15px_rgba(236,72,153,0.15)] text-pink-100',
        cardHeader: 'border-b border-pink-900/30 bg-[#1a0a16]/80 p-4',
        input: 'bg-black/40 border-pink-900/40 text-pink-50 placeholder:text-pink-900/60 focus:ring-pink-500/40',
        sidebarActive: 'bg-pink-500/10 border border-pink-500/30 text-pink-400',
        accentBtn: 'bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.2)]',
        solidBtn: 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_20px_rgba(219,39,119,0.3)] transition-all',
        navTab: (active: boolean) =>
          active
            ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
            : 'text-pink-300/40 hover:text-pink-200 hover:bg-pink-500/5',
        userMessage: 'bg-gradient-to-tr from-pink-500 to-purple-600 text-white border-pink-400 rounded-tr-none shadow-[0_0_15px_rgba(236,72,153,0.3)]',
        modelMessage: 'bg-black/30 border-pink-900/30 text-pink-100 rounded-tl-none shadow-[0_0_10px_rgba(236,72,153,0.05)]',
        headerBg: 'bg-black/20',
        headerBorder: 'border-pink-900/30',
        headerText: 'text-pink-400/60 font-mono',
        tabBarBg: 'bg-black/40',
        tabBarBorder: 'border-pink-900/20',
        footerBg: 'bg-[#1a0a16]/40',
        footerBorder: 'border-pink-900/30',
        footerText: 'text-pink-300',
        sparkle: 'text-pink-500',
        accentGlow: 'bg-pink-500/10 border-pink-500/20 text-pink-400 border border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.15)]',
        pingRing: 'bg-pink-500',
      };
    } else {
      // Light Mode
      return {
        bg: 'bg-zinc-50 text-zinc-900 font-sans',
        card: 'bg-white border-zinc-200 shadow-sm text-zinc-900',
        cardHeader: 'border-b border-zinc-200 bg-zinc-50/50 p-4',
        input: 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:ring-zinc-400',
        sidebarActive: 'bg-zinc-100 border-zinc-200 text-zinc-800',
        accentBtn: 'bg-zinc-100 text-zinc-800 border border-zinc-200 hover:bg-zinc-200',
        solidBtn: 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition-all',
        navTab: (active: boolean) =>
          active
            ? 'bg-zinc-900 text-white shadow-sm'
            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60',
        userMessage: 'bg-gradient-to-tr from-zinc-700 to-zinc-800 text-white border-zinc-600 rounded-tr-none shadow-sm',
        modelMessage: 'bg-zinc-100 border-zinc-200 text-zinc-800 rounded-tl-none shadow-none',
        headerBg: 'bg-zinc-100/50',
        headerBorder: 'border-zinc-200',
        headerText: 'text-zinc-500 font-mono',
        tabBarBg: 'bg-zinc-100',
        tabBarBorder: 'border-zinc-200',
        footerBg: 'bg-zinc-100/40',
        footerBorder: 'border-zinc-200',
        footerText: 'text-zinc-600',
        sparkle: 'text-zinc-600',
        accentGlow: 'bg-zinc-100 border-zinc-200 text-zinc-700',
        pingRing: 'bg-zinc-600',
      };
    }
  }, [theme]);

  // Helper to add floating notifications
  const addNotification = (title: string, message: string, type: AppNotification['type']) => {
    const id = Math.random().toString();
    const newNotif: AppNotification = {
      id,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications((prev) => [...prev, newNotif]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  // Gamification: unlock badges helper
  const unlockBadge = (badgeId: string) => {
    setBadges((prev) => {
      const match = prev.find((b) => b.id === badgeId);
      if (match && !match.unlocked) {
        const updated = prev.map((b) =>
          b.id === badgeId ? { ...b, unlocked: true, unlockedAt: new Date().toISOString() } : b
        );
        setXp((currentXp) => currentXp + match.xpReward);
        addNotification(
          'Badge Unlocked! 🏆',
          `Congratulations! You unlocked the "${match.name}" Badge (+${match.xpReward} XP)`,
          'badge'
        );

        // Broadcast unlock event to peer WebSocket
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'unlock_badge',
            userName,
            badgeName: match.name
          }));
        }

        // Check for Badge Hoarder badge
        const unlockedTotal = updated.filter((b) => b.unlocked).length;
        if (unlockedTotal >= 4) {
          // Trigger the nested check in the next frame
          setTimeout(() => unlockBadge('badge_hoarder'), 100);
        }

        return updated;
      }
      return prev;
    });
  };

  // Whiteboard Socket Sender
  const handleSendStroke = (type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type,
        ...payload
      }));
    }
  };

  // Submit User Message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeSessionId) return;

    const rawMessageText = inputText.trim();
    setInputText('');

    // Encrypt content if E2EE is locked
    let messageText = rawMessageText;
    let isEncrypted = false;
    let rawCiphertext = '';

    if (isE2eeEnabled && passcode) {
      isEncrypted = true;
      rawCiphertext = await encryptText(rawMessageText, passcode);
      messageText = rawCiphertext; // Send ciphertext to server log
    }

    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (!currentSession) return;

    // Create user message object
    const userMsg: Message = {
      id: Math.random().toString(),
      role: 'user',
      text: rawMessageText, // Display cleartext locally
      timestamp: new Date().toLocaleTimeString(),
      isEncrypted,
      rawCiphertext: isEncrypted ? rawCiphertext : undefined,
    };

    const updatedMessages = [...currentSession.messages, userMsg];
    const updatedSessions = sessions.map((s) =>
      s.id === activeSessionId
        ? {
            ...s,
            messages: updatedMessages,
            title: s.title === 'Quantum Ideation' ? rawMessageText.substring(0, 24) + '...' : s.title
          }
        : s
    );

    syncSessionsToStorage(updatedSessions);
    setIsTyping(true);

    // parallel operations:
    // 1. Get Chat reply from server-side Gemini
    // 2. Perform Mood Sentiment analysis
    const chatPromise = fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: updatedMessages.map((m) => ({
          role: m.role,
          text: m.isEncrypted && m.rawCiphertext ? m.rawCiphertext : m.text
        }))
      })
    });

    const sentimentPromise = fetch('/api/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: rawMessageText })
    });

    try {
      const [chatRes, sentimentRes] = await Promise.all([chatPromise, sentimentPromise]);

      const chatData = await chatRes.json();
      const sentimentData: SentimentData = await sentimentRes.json();

      setIsTyping(false);

      if (chatData.error) {
        throw new Error(chatData.message || chatData.error);
      }

      // Handle Mood result
      if (sentimentData && sentimentData.emotion) {
        setMoodHistory((prev) => [...prev, sentimentData]);
        // Update user message with sentiment data
        userMsg.sentiment = sentimentData;

        // Reward for mood analysis
        unlockBadge('mood_explorer');

        // Zen master badge
        if (sentimentData.emotion === 'Zen') {
          unlockBadge('zen_master');
        }
      }

      // Model response encryption
      let modelReply = chatData.text;
      let modelCipher = '';
      if (isE2eeEnabled && passcode) {
        modelCipher = await encryptText(modelReply, passcode);
        modelReply = modelCipher;
      }

      const modelMsg: Message = {
        id: Math.random().toString(),
        role: 'model',
        text: chatData.text, // cleartext for current view
        timestamp: new Date().toLocaleTimeString(),
        isEncrypted,
        rawCiphertext: isEncrypted ? modelCipher : undefined,
      };

      const finalSessions = sessions.map((s) =>
        s.id === activeSessionId ? { ...s, messages: [...updatedMessages, modelMsg] } : s
      );

      syncSessionsToStorage(finalSessions);

      // Unlocks: first message
      unlockBadge('first_spark');
      if (isE2eeEnabled) {
        unlockBadge('e2ee_guardian');
      }

    } catch (err: any) {
      console.error('API submission error:', err);
      setIsTyping(false);
      addNotification('Neural Gateway Error', err.message || 'Error occurred communicating with server', 'error');
    }
  };

  // Manage Sessions
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(2, 9),
      title: 'New Creative Synapse',
      messages: [
        {
          id: Math.random().toString(),
          role: 'model',
          text: 'New secure brainstorm sandbox initiated. Unlock encryption in the sidebar to secure your thoughts.',
          timestamp: new Date().toLocaleTimeString(),
        }
      ],
      createdAt: new Date().toISOString()
    };
    const updated = [...sessions, newSession];
    syncSessionsToStorage(updated);
    setActiveSessionId(newSession.id);
    addNotification('Thread Created', 'New quantum synapse started successfully.', 'success');
  };

  const handleDeleteSession = (id: string) => {
    const filtered = sessions.filter((s) => s.id !== id);
    if (filtered.length === 0) {
      const resetSession: ChatSession = {
        id: Math.random().toString(36).substring(2, 9),
        title: 'Quantum Ideation',
        messages: [
          {
            id: 'welcome',
            role: 'model',
            text: 'Welcome back. Let’s start brainstorming with server-side AI securely.',
            timestamp: new Date().toLocaleTimeString()
          }
        ],
        createdAt: new Date().toISOString()
      };
      syncSessionsToStorage([resetSession]);
      setActiveSessionId(resetSession.id);
    } else {
      syncSessionsToStorage(filtered);
      if (activeSessionId === id) {
        setActiveSessionId(filtered[filtered.length - 1].id);
      }
    }
    addNotification('Thread Erased', 'Chat session was completely deleted from memory.', 'info');
  };

  // Decryption selector
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${styles.bg}`}>
      {/* Dynamic Notifications overlay list */}
      <NotificationsList
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      />

      {/* Main Left Side Bar component */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        theme={theme}
        onSetTheme={setTheme}
        passcode={passcode}
        onSetPasscode={setPasscode}
        isE2eeEnabled={isE2eeEnabled}
        onToggleE2ee={setIsE2eeEnabled}
        userName={userName}
        onSetUserName={setUserName}
      />

      {/* Core Studio Content Area */}
      <div className="flex-1 h-full flex flex-col min-w-0">
        {/* Bento Board Navigation Tab Bar */}
        <header className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 border-b gap-4 backdrop-blur-sm shrink-0 ${styles.headerBg} ${styles.headerBorder}`}>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-1.5 font-display text-current">
              Creative Hub Dashboard <Sparkles className={`w-4 h-4 animate-pulse ${styles.sparkle}`} />
            </h2>
            <p className={`text-[10px] ${styles.headerText}`}>
              USER: {userName} | PEERS: {peers.length} | TOTAL XP: {xp}
            </p>
          </div>

          {/* Navigation Tab buttons */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${styles.tabBarBg} ${styles.tabBarBorder}`}>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${styles.navTab(
                activeTab === 'chat'
              )}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chatting
            </button>
            <button
              onClick={() => {
                setActiveTab('whiteboard');
                unlockBadge('canvas_creator');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${styles.navTab(
                activeTab === 'whiteboard'
              )}`}
            >
              <Compass className="w-3.5 h-3.5" />
              AuraBoard
            </button>
            <button
              onClick={() => setActiveTab('mood')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${styles.navTab(
                activeTab === 'mood'
              )}`}
            >
              <Activity className="w-3.5 h-3.5" />
              Aura Wave
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${styles.navTab(
                activeTab === 'badges'
              )}`}
            >
              <Award className="w-3.5 h-3.5" />
              Badges
            </button>
          </div>
        </header>

        {/* Dynamic Tab Panel */}
        <div className="flex-1 p-4 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div
                key="chat-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full h-full flex flex-col gap-4"
              >
                {/* Chat Log Canvas */}
                <div className={`flex-1 overflow-y-auto p-4 rounded-2xl border ${styles.card} flex flex-col gap-4 scrollbar-thin`}>
                  {activeSession ? (
                    activeSession.messages.map((msg) => {
                      const isModel = msg.role === 'model';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isModel ? 'items-start' : 'items-end'} max-w-[85%] ${
                            isModel ? 'self-start' : 'self-end'
                          }`}
                        >
                          {/* Aura mood indicator pill for user */}
                          {!isModel && msg.sentiment && (
                            <span
                              className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full mb-1 flex items-center gap-1 border transition-all"
                              style={{
                                color: msg.sentiment.color,
                                borderColor: `${msg.sentiment.color}50`,
                                backgroundColor: `${msg.sentiment.color}10`,
                              }}
                            >
                              <Activity className="w-2.5 h-2.5" />
                              {msg.sentiment.emotion} ({msg.sentiment.score}%)
                            </span>
                          )}

                          <div
                            className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                              isModel ? styles.modelMessage : styles.userMessage
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>

                          <div className={`flex items-center gap-1.5 mt-1.5 px-1 text-[9px] font-mono ${styles.headerText}`}>
                            <span>{msg.timestamp}</span>
                            {msg.isEncrypted && (
                               <span className="text-emerald-500 flex items-center gap-0.5 font-bold">
                                 <ShieldCheck className="w-3 h-3" /> E2EE
                               </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className={`flex-1 flex items-center justify-center font-semibold text-xs font-mono ${styles.headerText}`}>
                      Select or open a chat session to brainstorm
                    </div>
                  )}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className={`flex items-center gap-2 self-start p-3 rounded-2xl rounded-tl-none border ${styles.modelMessage}`}>
                      <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
                      <span className={`text-xs font-mono ${styles.headerText}`}>
                        AuraChat is channeling creative sparks...
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Text entry dock */}
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className={`flex-1 px-4 py-3 text-xs font-medium rounded-2xl border outline-none focus:ring-1 transition-all ${styles.input}`}
                    placeholder="Type an idea here. AuraChat will respond and update your aura wavelength..."
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className={`p-3 rounded-2xl transition-all flex items-center justify-center shrink-0 ${styles.solidBtn} disabled:opacity-50`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'whiteboard' && (
              <motion.div
                key="whiteboard-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full h-full"
              >
                <Whiteboard
                  paths={paths}
                  peers={peers}
                  userId={userId}
                  userColor={userColor}
                  userName={userName}
                  onSendStroke={handleSendStroke}
                  onTriggerBadge={unlockBadge}
                  theme={theme}
                  onBack={() => setActiveTab('chat')}
                />
              </motion.div>
            )}

            {activeTab === 'mood' && (
              <motion.div
                key="mood-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full h-full"
              >
                <MoodTracker history={moodHistory} theme={theme} onBack={() => setActiveTab('chat')} />
              </motion.div>
            )}

            {activeTab === 'badges' && (
              <motion.div
                key="badges-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full h-full"
              >
                <BadgeTracker badges={badges} xp={xp} theme={theme} onBack={() => setActiveTab('chat')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Deployment Guide Accordion */}
        <footer className={`p-4 border-t text-xs shrink-0 select-none ${styles.footerBg} ${styles.footerBorder}`}>
          <details className="group">
            <summary className={`flex items-center justify-between cursor-pointer font-bold hover:text-pink-500 ${styles.footerText}`}>
              <span className="flex items-center gap-1.5">
                <Terminal className={`w-4 h-4 ${styles.sparkle}`} />
                AWS, PostgreSQL & Redis Production Deployment Instructions (Step-by-Step)
              </span>
              <span className="text-[10px] font-mono group-open:rotate-180 transition-transform">▼</span>
            </summary>

            <div className={`mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-3 text-[11px] leading-relaxed max-h-[160px] overflow-y-auto scrollbar-thin ${styles.footerBorder} ${styles.footerText}`}>
              <div>
                <h4 className={`font-extrabold flex items-center gap-1 mb-1 ${styles.sparkle}`}>
                  <CheckCircle className="w-3.5 h-3.5" /> 1. Environment & PostgreSQL Setup
                </h4>
                <p className={`font-mono p-2 rounded-lg text-[9px] mb-2 whitespace-pre border bg-zinc-200/60 dark:bg-black/40 ${styles.footerBorder}`}>
{`# PostgreSQL Schema Seed File
CREATE TABLE chat_sessions (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE chat_messages (
  id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(64) REFERENCES chat_sessions(id),
  role VARCHAR(20),
  text TEXT,
  sentiment_json JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);`}
                </p>
                <p>Setup environment secrets inside AWS Secrets Manager: <code className="bg-zinc-200 dark:bg-zinc-900 px-1 py-0.5 rounded text-rose-500">DATABASE_URL</code>, <code className="bg-zinc-200 dark:bg-zinc-900 px-1 py-0.5 rounded text-rose-500">REDIS_URL</code>, and your <code className="bg-zinc-200 dark:bg-zinc-900 px-1 py-0.5 rounded text-rose-500">GEMINI_API_KEY</code>.</p>
              </div>

              <div>
                <h4 className={`font-extrabold flex items-center gap-1 mb-1 ${styles.sparkle}`}>
                  <CheckCircle className="w-3.5 h-3.5" /> 2. AWS CDK / Fargate Manifest
                </h4>
                <p className={`font-mono p-2 rounded-lg text-[9px] mb-2 whitespace-pre border bg-zinc-200/60 dark:bg-black/40 ${styles.footerBorder}`}>
{`# CDK Elastic Container Service Configuration
const cluster = new ecs.Cluster(this, 'AuraCluster');
const fargateService = new ecs_patterns
  .ApplicationLoadBalancedFargateService(this, 'AuraService', {
    cluster,
    taskImageOptions: {
      image: ecs.ContainerImage.fromAsset('.'),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000'
      }
    },
    publicLoadBalancer: true
  });`}
                </p>
                <p>Run <code className={`bg-zinc-200 dark:bg-zinc-900 px-1 py-0.5 rounded ${styles.sparkle}`}>cdk deploy</code> on AWS CLI to provision Application Load Balancer and VPC subnets with full ingress routes.</p>
              </div>

              <div>
                <h4 className={`font-extrabold flex items-center gap-1 mb-1 ${styles.sparkle}`}>
                  <CheckCircle className="w-3.5 h-3.5" /> 3. Redis Caching & Dockerfile
                </h4>
                <p className={`font-mono p-2 rounded-lg text-[9px] mb-2 whitespace-pre border bg-zinc-200/60 dark:bg-black/40 ${styles.footerBorder}`}>
{`# Production Dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]`}
                </p>
                <p>Integrate Redis in <code className={`bg-zinc-200 dark:bg-zinc-900 px-1 py-0.5 rounded ${styles.sparkle}`}>server.ts</code> using `ioredis` to cache heavy Gemini sentiment calls and manage WebSocket connection registries cleanly in multi-instance scale models.</p>
              </div>
            </div>
          </details>
        </footer>
      </div>
    </div>
  );
}
