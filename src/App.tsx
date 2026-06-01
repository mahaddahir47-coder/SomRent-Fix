/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Property, 
  Unit, 
  MaintenanceTicket, 
  MaintenanceUpdate, 
  MaintenancePhoto, 
  MaintenanceCost,
  TicketStatus,
  TicketPriority,
  Language,
  translations 
} from './types';
import { 
  Wrench, 
  FileText, 
  Camera, 
  DollarSign, 
  CheckCircle2, 
  X, 
  Languages, 
  Sun, 
  Moon, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  LogOut, 
  AlertTriangle, 
  Clock, 
  Check, 
  Plus, 
  Search, 
  SlidersHorizontal,
  FolderSync,
  Building,
  Home,
  ChevronRight,
  TrendingUp,
  Hammer,
  RotateCcw,
  Briefcase,
  Layers,
  Phone,
  ArrowLeft,
  Calendar
} from 'lucide-react';

export default function App() {
  // System configurations
  const [lang, setLang] = useState<Language>('so'); // default to Somali as requested
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // elegant default
  const [user, setUser] = useState<User | null>(null);
  
  // Login input states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState<'technician' | 'supervisor'>('technician');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active View Navigation
  // Views: 'dashboard' | 'my-jobs' | 'job-details' | 'completed' | 'reports' | 'profile' | 'settings'
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Core App Data Loaded from backend
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<(MaintenanceTicket & { 
    updates: MaintenanceUpdate[]; 
    photos: MaintenancePhoto[]; 
    costs: MaintenanceCost[]; 
  }) | null>(null);
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [reportStats, setReportStats] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'reconnecting'>('connected');

  // Input states for Add Materials Cost
  const [newCostItem, setNewCostItem] = useState('');
  const [newCostQty, setNewCostQty] = useState(1);
  const [newCostUnit, setNewCostUnit] = useState(0);
  const [newCostLabor, setNewCostLabor] = useState(0);
  const [newCostAppReq, setNewCostAppReq] = useState(false);
  const [costLoggingError, setCostLoggingError] = useState('');
  const [costSuccessMsg, setCostSuccessMsg] = useState('');

  // Input states for Upload Photo
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoStep, setPhotoStep] = useState<'before' | 'after' | 'proof'>('before');
  const [photoFileRaw, setPhotoFileRaw] = useState<string>(''); // base64 string
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState('');
  const [photoError, setPhotoError] = useState('');

  // Input states for Ticket Status Update
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('');
  const [statusSuccessMsg, setStatusSuccessMsg] = useState('');

  // Input states for Completion Workflow
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionProofPhoto, setCompletionProofPhoto] = useState('');
  const [supervisorVerified, setSupervisorVerified] = useState(false);
  const [completionError, setCompletionError] = useState('');

  // Filtration state for "My Jobs"
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Active translations
  const t = useMemo(() => translations[lang], [lang]);

  // Handle CSS Themeing dynamically inside application wrapper
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Auto load active user from localStorage on refresh
  useEffect(() => {
    const cached = localStorage.getItem('somrent_auth_user');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('somrent_auth_user');
      }
    }
  }, []);

  // Fetch lists when user updates
  useEffect(() => {
    if (user) {
      fetchTickets();
      fetchStaticData();
      fetchReports();
    }
  }, [user]);

  // Auto fetch ticket details when selectedTicketId updates
  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetails(selectedTicketId);
    } else {
      setSelectedTicketDetails(null);
    }
  }, [selectedTicketId]);

  // API Call: Fetch general tickets index
  const fetchTickets = async () => {
    try {
      setDataLoading(true);
      // Supervisor can view all tickets, technician sees only assigned to them
      const url = user?.role === 'supervisor' ? '/api/tickets' : `/api/tickets?assigneeId=${user?.id}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        setSyncStatus('connected');
      } else {
        setSyncStatus('reconnecting');
      }
    } catch (e) {
      setSyncStatus('reconnecting');
    } finally {
      setDataLoading(false);
    }
  };

  // API Call: Fetch detailed ticket contents
  const fetchTicketDetails = async (id: string) => {
    try {
      setDataLoading(true);
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTicketDetails(data);
        // Pre-fill completion inputs with legacy if exists
        setCompletionNotes(data.completionNotes || '');
      }
    } catch (e) {
      console.error("Failed fetching ticket details", e);
    } finally {
      setDataLoading(false);
    }
  };

  // API Call: Fetch properties and units static lookup
  const fetchStaticData = async () => {
    try {
      const pRes = await fetch('/api/static/properties');
      const uRes = await fetch('/api/static/units');
      if (pRes.ok) setProperties(await pRes.json());
      if (uRes.ok) setUnits(await uRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  // API Call: Aggregated statistical reports
  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports/statistics');
      if (res.ok) {
        setReportStats(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Actions: Handle user login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    if (!username.trim() || !password.trim()) {
      setLoginError(t.errorLogin);
      setLoginLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          role: loginRole
        })
      });

      if (res.ok) {
        const result = await res.json();
        setUser(result.user);
        localStorage.setItem('somrent_auth_user', JSON.stringify(result.user));
        setUsername('');
        setPassword('');
      } else {
        const errData = await res.json();
        setLoginError(errData.error || t.errorLogin);
      }
    } catch (err) {
      setLoginError(t.errorLogin + " (No network)");
    } finally {
      setLoginLoading(false);
    }
  };

  // Actions: Logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('somrent_auth_user');
    setCurrentView('dashboard');
    setSelectedTicketId(null);
  };

  // Action: Trigger seed reset for evaluation ease
  const triggerDatabaseReset = async () => {
    if (confirm(t.seedReset + "?")) {
      try {
        const res = await fetch('/api/admin/reset', { method: 'POST' });
        if (res.ok) {
          alert("Database values restored to initial SomRent Fix standards.");
          fetchTickets();
          fetchReports();
          if (selectedTicketId) fetchTicketDetails(selectedTicketId);
        }
      } catch (err) {
        alert("Command execution failed.");
      }
    }
  };

  // Action: Update local ticket status
  const handleStatusUpdate = async (newStatus: TicketStatus) => {
    if (!selectedTicketId) return;
    setStatusSuccessMsg('');
    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          actorId: user?.id,
          actorName: user?.name,
          actorRole: user?.role,
          notes: statusUpdateNotes.trim() || `${t.updateStatus}: ${t[newStatus]}`
        })
      });

      if (res.ok) {
        setStatusUpdateNotes('');
        setStatusSuccessMsg(t.syncSuccess);
        fetchTicketDetails(selectedTicketId);
        fetchTickets();
        fetchReports();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Add note
  const handleAddSimpleNote = async (notesType: 'tenant' | 'internal', currentNoteValue: string) => {
    if (!selectedTicketId || !currentNoteValue.trim()) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notesType,
          content: currentNoteValue,
          actorName: user?.name
        })
      });
      if (res.ok) {
        fetchTicketDetails(selectedTicketId);
        alert(t.syncSuccess);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Log materials and labor cost
  const handleSaveCostRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setCostLoggingError('');
    setCostSuccessMsg('');

    if (!newCostItem.trim() || newCostQty <= 0 || newCostUnit < 0 || newCostLabor < 0) {
      setCostLoggingError("Taleefan xog khaldan. Please fill accurate positive numbers.");
      return;
    }

    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: newCostItem,
          quantity: newCostQty,
          unitCost: newCostUnit,
          laborCost: newCostLabor,
          approvalNeeded: newCostAppReq
        })
      });

      if (res.ok) {
        setNewCostItem('');
        setNewCostQty(1);
        setNewCostUnit(0);
        setNewCostLabor(0);
        setNewCostAppReq(false);
        setCostSuccessMsg("Kharashka waa la kaydiyey!");
        if (selectedTicketId) fetchTicketDetails(selectedTicketId);
        fetchTickets();
        fetchReports();
      } else {
        const errorMsg = await res.json();
        setCostLoggingError(errorMsg.error || "Failed to catalog costs.");
      }
    } catch (e) {
      setCostLoggingError("Network synchronization issue.");
    }
  };

  // Action: Approve budget log (Supervisor Only)
  const handleApproveCost = async (costId: string) => {
    try {
      const res = await fetch(`/api/costs/${costId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisorId: user?.id,
          supervisorName: user?.name
        })
      });
      if (res.ok) {
        if (selectedTicketId) fetchTicketDetails(selectedTicketId);
        fetchTickets();
        fetchReports();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Action: Simulated mobile photo capture or selection
  const handlePhotoUploadSimulated = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhotoError('');
    setPhotoSuccessMsg('');

    if (!photoCaption.trim()) {
      setPhotoError("Caption required for proof validation / Faahfaahin qor.");
      return;
    }

    // SVG generator for realistic presentation in-app
    const randColors = ['#0284c7', '#059669', '#ea580c', '#312e81', '#1e293b', '#b91c1c'];
    const chosenColor = randColors[Math.floor(Math.random() * randColors.length)];
    const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="100%" height="100%" fill="${chosenColor}"/>
      <text x="20" y="50" font-family="monospace" font-size="20" fill="white" font-weight="bold">${photoStep.toUpperCase()} REPORT</text>
      <text x="20" y="90" font-family="monospace" font-size="14" fill="white" fill-opacity="0.8">Staff: ${user?.name}</text>
      <text x="20" y="120" font-family="monospace" font-size="14" fill="white" fill-opacity="0.8">Property ID: ${selectedTicketDetails?.propertyId}</text>
      <text x="20" y="220" font-family="monospace" font-size="16" fill="white" font-weight="bold">${photoCaption}</text>
      <text x="20" y="260" font-family="monospace" font-size="12" fill="white" fill-opacity="0.6">Local Time: ${new Date().toLocaleTimeString()}</text>
    </svg>`;
    const finalUrl = `data:image/svg+xml;utf8,${encodeURIComponent(raw)}`;

    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: finalUrl,
          caption: photoCaption,
          step: photoStep
        })
      });

      if (res.ok) {
        setPhotoCaption('');
        setPhotoSuccessMsg("Photo uploaded successfully & linked to repair stage.");
        if (selectedTicketId) fetchTicketDetails(selectedTicketId);
      } else {
        setPhotoError("Failed to store photo file.");
      }
    } catch (err) {
      setPhotoError("Local network failed.");
    }
  };

  // Action: Completion order submission
  const handleCompletionOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompletionError('');

    if (!completionNotes.trim()) {
      setCompletionError("Please write final checklist outcome text.");
      return;
    }

    // Generate beautiful proof photo SVG
    const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="100%" height="100%" fill="#15803d"/>
      <circle cx="200" cy="120" r="45" fill="none" stroke="white" stroke-width="6"/>
      <polyline points="180,120 195,135 230,100" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="20" y="220" font-family="monospace" font-size="18" fill="white" font-weight="bold" text-anchor="middle" x="200">JOB RESOLVED &amp; VERIFIED</text>
      <text x="20" y="260" font-family="monospace" font-size="13" fill="white" fill-opacity="0.8">Caretaker sign-off recorded</text>
    </svg>`;
    const proofUrl = `data:image/svg+xml;utf8,${encodeURIComponent(raw)}`;

    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionNotes,
          finalProofPhoto: proofUrl,
          actorId: user?.id,
          actorName: user?.name
        })
      });

      if (res.ok) {
        if (selectedTicketId) fetchTicketDetails(selectedTicketId);
        fetchTickets();
        fetchReports();
        alert("Work order submitted for final closure archive!");
      } else {
        setCompletionError("Failed to register completion state.");
      }
    } catch (e) {
      setCompletionError("Sync connection issues.");
    }
  };

  // Action: Official closure (Supervisor Only)
  const handleCloseTicketOfficial = async () => {
    if (!selectedTicketId) return;
    if (!supervisorVerified) {
      alert("Must physically verify workmanship checklist tick.");
      return;
    }

    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisorId: user?.id,
          supervisorName: user?.name
        })
      });

      if (res.ok) {
        if (selectedTicketId) fetchTicketDetails(selectedTicketId);
        fetchTickets();
        fetchReports();
        alert("Ticket archived as CLOSED & CLOSED!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter computation for Job List
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Search
      const textToSearch = `${ticket.title} ${ticket.description} ${ticket.category} ${ticket.completionNotes || ''}`.toLowerCase();
      if (searchTerm && !textToSearch.includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Property
      if (filterProperty !== 'all' && ticket.propertyId !== filterProperty) {
        return false;
      }

      // Priority
      if (filterPriority !== 'all' && ticket.priority !== filterPriority) {
        return false;
      }

      // Status
      if (filterStatus !== 'all') {
        if (filterStatus === 'active' && (ticket.status === 'closed' || ticket.status === 'resolved')) {
          return false;
        }
        if (filterStatus === 'completed' && ticket.status !== 'closed' && ticket.status !== 'resolved') {
          return false;
        }
        if (filterStatus !== 'active' && filterStatus !== 'completed' && ticket.status !== filterStatus) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, filterProperty, filterPriority, filterStatus, searchTerm]);

  // Dashboard Stats calculation
  const dashboardStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const todayCount = tickets.filter(t => t.createdAt.startsWith(todayStr)).length;
    const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length;
    const overdueCount = tickets.filter(t => {
      const isPending = t.status !== 'closed' && t.status !== 'resolved';
      const isOld = new Date(t.createdAt).getTime() < (Date.now() - 24 * 60 * 60 * 1000);
      return isPending && isOld;
    }).length;
    const completedCount = tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length;
    const waitingAppCount = tickets.filter(t => t.status === 'waiting_approval').length;

    return {
      todayCount,
      urgentCount,
      overdueCount,
      completedCount,
      waitingAppCount
    };
  }, [tickets]);

  // Login view
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 text-white p-4">
        {/* Simple visual background items without clutter */}
        <div id="login_screen" className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 bg-slate-950 text-center border-b border-slate-800">
            <div className="flex justify-center mb-3">
              <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/30">
                <Wrench className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">{t.appName}</h1>
            <p className="text-xs text-slate-400 mt-1">{t.tagline}</p>

            {/* Quick Language Toggle on Login */}
            <div className="flex justify-center mt-4">
              <button 
                id="btn_lang_en_login"
                onClick={() => setLang('en')} 
                className={`px-3 py-1 text-xs font-semibold rounded-l-md transition ${lang === 'en' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                English
              </button>
              <button 
                id="btn_lang_so_login"
                onClick={() => setLang('so')} 
                className={`px-3 py-1 text-xs font-semibold rounded-r-md transition ${lang === 'so' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                Soomaali
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {t.role}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="tab_role_tech"
                  type="button"
                  onClick={() => setLoginRole('technician')}
                  className={`py-3 px-2 text-xs font-medium rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 ${
                    loginRole === 'technician' 
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400 font-bold' 
                      : 'border-slate-700 bg-slate-800/50 text-slate-400'
                  }`}
                >
                  <Hammer className="h-4 w-4" />
                  {lang === 'en' ? 'Technician' : 'Farsamo Yaqaanka'}
                </button>
                <button
                  id="tab_role_sup"
                  type="button"
                  onClick={() => setLoginRole('supervisor')}
                  className={`py-3 px-2 text-xs font-medium rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 ${
                    loginRole === 'supervisor' 
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400 font-bold' 
                      : 'border-slate-700 bg-slate-800/50 text-slate-400'
                  }`}
                >
                  <Briefcase className="h-4 w-4" />
                  {lang === 'en' ? 'Supervisor' : 'Kormeeraha'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="input_username">
                {t.username}
              </label>
              <input
                id="input_username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={loginRole === 'technician' ? 'e.g. ahmed, sahra, cabdi' : 'e.g. maxamed'}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="input_password">
                {t.password}
              </label>
              <input
                id="input_password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default test password is: <strong className="text-slate-400">123</strong></span>
            </div>

            {loginError && (
              <div id="lbl_login_error" className="bg-red-950/50 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              id="btn_submit_login"
              type="submit"
              disabled={loginLoading}
              className="w-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg text-sm transition shadow-lg flex justify-center items-center"
            >
              {loginLoading ? t.loading : t.login}
            </button>
          </form>

          <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400 font-medium">Demo Testing Accounts (Password: 123):</p>
            <div className="mt-2 text-[11px] grid grid-cols-2 gap-1.5 text-left font-mono">
              <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                <p className="text-orange-400 font-bold">Technicians:</p>
                <p className="text-slate-300">ahmed <span className="text-slate-500">(Plumb)</span></p>
                <p className="text-slate-300">sahra <span className="text-slate-500">(Elec)</span></p>
                <p className="text-slate-300">cabdi <span className="text-slate-500">(HVAC)</span></p>
              </div>
              <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                <p className="text-indigo-400 font-bold">Supervisor:</p>
                <p className="text-slate-300">maxamed <span className="text-slate-500">(Hub Area)</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loaded logged-in user flow
  return (
    <div className={`min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Mobile Bar */}
      <header className={`sticky top-0 z-50 border-b ${theme === 'dark' ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'} backdrop-blur-md px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div onClick={() => setCurrentView('dashboard')} className="cursor-pointer bg-gradient-to-tr from-orange-600 to-amber-500 text-white p-2 rounded-xl shadow-md">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-extrabold tracking-tight text-lg text-orange-500 flex items-center gap-1.5">
              SomRent Fix
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono font-medium">
                {user.role === 'supervisor' ? 'SUP' : 'TECH'}
              </span>
            </h1>
            <p className="text-[10px] opacity-70 truncate max-w-[150px]">{user.name}</p>
          </div>
        </div>

        {/* Sync Indicator and Controls */}
        <div className="flex items-center gap-2">
          {syncStatus === 'connected' ? (
            <span id="sync_pill" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-500">
              <span className="w-1.5 h-1.5 mr-1 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          ) : (
            <span id="sync_pill" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/15 text-rose-500">
              Offline Cache
            </span>
          )}

          {/* Quick Language Flip */}
          <button 
            id="header_lang_toggle"
            onClick={() => setLang(l => l === 'en' ? 'so' : 'en')}
            className={`p-2 rounded-xl border transition ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
            title="Switch Language"
          >
            <Languages className="h-4 w-4" />
          </button>

          {/* Seed Reset */}
          <button 
            id="btn_seed_reset"
            onClick={triggerDatabaseReset}
            className={`p-2 rounded-xl border transition ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
            title={t.seedReset}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto p-4 pb-24 space-y-6">
        
        {/* VIEW 1: DASHBOARD */}
        {currentView === 'dashboard' && (
          <div id="view_dashboard" className="space-y-5">
            
            {/* Greeting */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-100 shadow-sm'} flex items-start justify-between`}>
              <div>
                <span className="text-xs uppercase tracking-widest text-orange-500 font-bold font-mono">
                  {user.role === 'supervisor' ? t.supervisor : t.technician}
                </span>
                <h2 className="text-xl font-bold mt-0.5">{lang === 'en' ? 'Sacad wanaagsan' : 'Maalin wanaagsan'}, {user.name}!</h2>
                <p className="text-xs opacity-75 mt-1">{user.specialty || t.regionDispatchCode}</p>
              </div>
              <div className="bg-orange-500/10 p-2.5 rounded-full text-orange-500 font-mono text-xs font-bold">
                MOG
              </div>
            </div>

            {/* Quick Summary Bento Matrix */}
            <div className="grid grid-cols-2 gap-3">
              <div 
                id="btn_dashboard_filter_today"
                onClick={() => { setFilterStatus('all'); setCurrentView('my-jobs'); }}
                className={`p-3.5 rounded-2xl border transition cursor-pointer hover:border-orange-500 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <span className="text-2xl font-black font-mono">{dashboardStats.todayCount}</span>
                </div>
                <p className="text-xs font-semibold mt-3 opacity-80">{t.todayJobs}</p>
              </div>

              <button 
                id="btn_dashboard_filter_urgent"
                onClick={() => { setFilterPriority('urgent'); setCurrentView('my-jobs'); }}
                className={`p-3.5 text-left rounded-2xl border transition hover:border-orange-500 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                    <AlertTriangle className="h-4 w-4 animate-bounce" />
                  </span>
                  <span className="text-2xl font-black font-mono text-rose-500">{dashboardStats.urgentCount}</span>
                </div>
                <p className="text-xs font-semibold mt-3 opacity-80">{t.urgentJobs}</p>
              </button>

              <button 
                id="btn_dashboard_filter_overdue"
                onClick={() => { setFilterStatus('active'); setCurrentView('my-jobs'); }}
                className={`p-3.5 text-left rounded-2xl border transition hover:border-orange-500 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <Clock className="h-4 w-4" />
                  </span>
                  <span className="text-2xl font-black font-mono text-amber-500">{dashboardStats.overdueCount}</span>
                </div>
                <p className="text-xs font-semibold mt-3 opacity-80">{t.overdueJobs}</p>
              </button>

              <button 
                id="btn_dashboard_filter_completed"
                onClick={() => { setFilterStatus('completed'); setCurrentView('my-jobs'); }}
                className={`p-3.5 text-left rounded-2xl border transition hover:border-orange-500 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span className="text-2xl font-black font-mono text-emerald-500">{dashboardStats.completedCount}</span>
                </div>
                <p className="text-xs font-semibold mt-3 opacity-80">{t.completedJobs}</p>
              </button>
            </div>

            {/* Supervisor Extra Control Cell */}
            {user.role === 'supervisor' && (
              <div className="p-4 rounded-2xl bg-indigo-600 text-white space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm">Supervisor Control Desk</h3>
                    <p className="text-xs opacity-90 mt-0.5">Budget, approvals, and city-wide performance metrics.</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-white/20 text-xs font-mono font-bold">
                    {dashboardStats.waitingAppCount} Pending
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button 
                    id="btn_sup_view_reports"
                    onClick={() => setCurrentView('reports')} 
                    className="bg-white text-indigo-700 font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Financial Report
                  </button>
                  <button 
                    id="btn_sup_filter_pending_costs"
                    onClick={() => { setFilterStatus('waiting_approval'); setCurrentView('my-jobs'); }} 
                    className="bg-indigo-700 text-indigo-100 border border-indigo-500 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition bg-opacity-40"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Approve Costs
                  </button>
                </div>
              </div>
            )}

            {/* Quick Access List: Assigned active repair jobs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm tracking-wide uppercase opacity-80 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-orange-500" />
                  {user.role === 'supervisor' ? t.activeJobs : t.assignedToYou}
                </h3>
                <button 
                  id="btn_view_all_jobs"
                  onClick={() => { setFilterStatus('all'); setCurrentView('my-jobs'); }} 
                  className="text-xs text-orange-500 font-bold flex items-center gap-0.5"
                >
                  {lang === 'en' ? 'View All' : 'Eeg Dhammaan'}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length === 0 ? (
                <div className={`p-8 rounded-2xl text-center border ${theme === 'dark' ? 'bg-slate-900/10 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <p className="text-sm opacity-60">No pending ticket assignments matching you.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tickets
                    .filter(t => t.status !== 'closed' && t.status !== 'resolved')
                    .slice(0, 5)
                    .map(ticket => {
                      const prop = properties.find(p => p.id === ticket.propertyId);
                      const unt = units.find(u => u.id === ticket.unitId);
                      return (
                        <div 
                          id={`ticket_card_dash_${ticket.id}`}
                          key={ticket.id}
                          onClick={() => {
                            setSelectedTicketId(ticket.id);
                            setCurrentView('job-details');
                          }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition hover:border-orange-500 flex flex-col gap-2 ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:bg-slate-900/60' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                              ticket.priority === 'urgent' ? 'bg-rose-500/15 text-rose-500' :
                              ticket.priority === 'high' ? 'bg-orange-500/15 text-orange-500' :
                              ticket.priority === 'medium' ? 'bg-amber-500/15 text-amber-500' :
                              'bg-blue-500/15 text-blue-500'
                            }`}>
                              {t[ticket.priority]}
                            </span>
                            
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide font-mono ${
                              ticket.status === 'started' ? 'bg-emerald-500/15 text-emerald-500' :
                              ticket.status === 'paused' ? 'bg-indigo-500/15 text-indigo-400' :
                              ticket.status === 'waiting_for_parts' ? 'bg-amber-500/15 text-amber-400' :
                              ticket.status === 'waiting_approval' ? 'bg-rose-500/15 text-rose-400' :
                              'bg-slate-500/15 text-slate-400'
                            }`}>
                              {t[ticket.status]}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-sm tracking-tight line-clamp-1">{ticket.title}</h4>
                            <p className="text-[11px] opacity-70 line-clamp-2 mt-0.5">{ticket.description}</p>
                          </div>

                          <div className="flex items-center gap-3 pt-1 border-t border-slate-800/10 text-[11px] opacity-75 font-mono">
                            <span className="flex items-center gap-1 truncate max-w-[130px]" title="Property">
                              <Building className="h-3 w-3 shrink-0 text-orange-500" />
                              {prop ? prop.name : 'SomRent Estate'}
                            </span>
                            <span className="flex items-center gap-1 shrink-0" title="Unit Number">
                              <Home className="h-3 w-3 text-orange-500" />
                              {unt ? unt.unitNumber : ticket.unitId}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Quick Connection Hub Diagnostic */}
            <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <FolderSync className="h-4 w-4 text-orange-500 animate-spin" />
                <div>
                  <p className="font-bold">{t.syncConnection}</p>
                  <p className="text-[10px] opacity-70">Region Hub: Somalia Post &amp; Telecom Gateways</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-505/10 text-emerald-500">
                OK (Port: 3000)
              </span>
            </div>

          </div>
        )}

        {/* VIEW 2: MY JOBS (Ticket search / filtration screen) */}
        {currentView === 'my-jobs' && (
          <div id="view_my_jobs" className="space-y-4">
            
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-orange-500" />
                {t.myJobs}
              </h2>
              <span className="text-xs bg-orange-500/15 text-orange-400 font-mono font-bold px-2 py-0.5 rounded">
                {filteredTickets.length} matching
              </span>
            </div>

            {/* Practical Mobile Filtering / Search Controls */}
            <div className={`p-3.5 rounded-2xl border space-y-3 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              
              {/* Text Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="search_input_jobs"
                  type="text"
                  placeholder={t.searchJobs}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                />
                {searchTerm && (
                  <button id="btn_clear_search" onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5">
                    <X className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Advanced select dropdowns */}
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5 font-bold">Property</label>
                  <select
                    id="select_filter_property"
                    value={filterProperty}
                    onChange={(e) => setFilterProperty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-[10px] text-white focus:outline-none"
                  >
                    <option value="all">All (Dhamaan)</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name.replace("SomRent ", "")}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5 font-bold">Priority</label>
                  <select
                    id="select_filter_priority"
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-[10px] text-white focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">{t.low}</option>
                    <option value="medium">{t.medium}</option>
                    <option value="high">{t.high}</option>
                    <option value="urgent">{t.urgent}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5 font-bold">Status</label>
                  <select
                    id="select_filter_status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-[10px] text-white focus:outline-none"
                  >
                    <option value="all">Any Status</option>
                    <option value="active">Active (Pending)</option>
                    <option value="completed">Completed / Closed</option>
                    <option value="assigned">{t.assigned}</option>
                    <option value="started">{t.started}</option>
                    <option value="paused">{t.paused}</option>
                    <option value="waiting_for_parts">{t.waiting_for_parts}</option>
                    <option value="waiting_approval">{t.waiting_approval}</option>
                    <option value="resolved">{t.resolved}</option>
                    <option value="closed">{t.closed}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Render Jobs Match */}
            <div className="space-y-2.5">
              {filteredTickets.length === 0 ? (
                <div className={`p-10 rounded-2xl text-center border ${theme === 'dark' ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <SlidersHorizontal className="h-8 w-8 text-orange-500 mx-auto opacity-45" />
                  <p className="text-xs opacity-75 mt-2">Ma jiraan tikidho ku sifeysan filterkan.</p>
                  <button 
                    id="btn_reset_filters"
                    onClick={() => { setFilterProperty('all'); setFilterPriority('all'); setFilterStatus('all'); setSearchTerm(''); }}
                    className="mt-3 text-xs bg-orange-600/10 text-orange-400 border border-orange-500/20 px-3 py-1.5 rounded-lg hover:bg-orange-600/20"
                  >
                    Dib-u-daji Filterka
                  </button>
                </div>
              ) : (
                filteredTickets.map(ticket => {
                  const prop = properties.find(p => p.id === ticket.propertyId);
                  const unt = units.find(u => u.id === ticket.unitId);
                  return (
                    <div 
                      id={`ticket_card_${ticket.id}`}
                      key={ticket.id}
                      onClick={() => {
                        setSelectedTicketId(ticket.id);
                        setCurrentView('job-details');
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition hover:border-orange-500 flex flex-col gap-3 ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800/80 hover:bg-slate-900/50' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                          ticket.priority === 'urgent' ? 'bg-rose-500/15 text-rose-500' :
                          ticket.priority === 'high' ? 'bg-orange-500/15 text-orange-400' :
                          ticket.priority === 'medium' ? 'bg-amber-500/15 text-amber-500' :
                          'bg-blue-500/15 text-blue-500'
                        }`}>
                          {t[ticket.priority]}
                        </span>
                        
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide font-mono ${
                          ticket.status === 'started' ? 'bg-emerald-500/15 text-emerald-500' :
                          ticket.status === 'paused' ? 'bg-indigo-500/15 text-indigo-400' :
                          ticket.status === 'waiting_for_parts' ? 'bg-amber-500/15 text-amber-400' :
                          ticket.status === 'waiting_approval' ? 'bg-rose-500/15 text-rose-400' :
                          ticket.status === 'resolved' ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20' :
                          ticket.status === 'closed' ? 'bg-slate-500/15 text-slate-400' :
                          'bg-slate-500/15 text-slate-400'
                        }`}>
                          {t[ticket.status]}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm tracking-tight line-clamp-1">{ticket.title}</h4>
                        <p className="text-xs opacity-75 mt-1 line-clamp-2">{ticket.description}</p>
                      </div>

                      {/* Client Location Details */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] opacity-80 pt-2 border-t border-slate-800/10 font-mono">
                        <span className="flex items-center gap-1.5 truncate">
                          <Building className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                          {prop ? prop.name : 'Estate Location'}
                        </span>
                        <span className="flex items-center gap-1.5 truncate justify-end">
                          <Home className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                          {unt ? unt.unitNumber : ticket.unitId}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* VIEW 3: JOB DETAILS (Massive detailed view with updates checklist, photo attachment, cost tracker) */}
        {currentView === 'job-details' && selectedTicketDetails && (
          <div id="view_job_details" className="space-y-5">
            
            {/* Nav Back Button */}
            <div className="flex items-center justify-between">
              <button 
                id="btn_details_back_to_jobs"
                onClick={() => setCurrentView('my-jobs')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  theme === 'dark' ? 'bg-slate-900 border border-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {lang === 'en' ? 'Back' : 'Ku laqo'}
              </button>
              <span className="text-xs font-bold font-mono text-orange-500 text-right">
                ID: {selectedTicketDetails.id}
              </span>
            </div>

            {/* Main Header Card */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500-">{selectedTicketDetails.category}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  selectedTicketDetails.priority === 'urgent' ? 'bg-rose-500/15 text-rose-500' :
                  selectedTicketDetails.priority === 'high' ? 'bg-orange-500/15 text-orange-400' :
                  'bg-blue-500/15 text-blue-400'
                }`}>
                  {t[selectedTicketDetails.priority]}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold tracking-tight leading-snug">{selectedTicketDetails.title}</h3>
                <p className="text-xs opacity-80 mt-1">{selectedTicketDetails.description}</p>
              </div>

              {/* Status display element */}
              <div className="bg-slate-950 p-2 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400 font-serif">Current State:</span>
                <span className="px-2.5 py-0.5 rounded bg-orange-600 text-white font-bold font-mono">
                  {t[selectedTicketDetails.status].toUpperCase()}
                </span>
              </div>
            </div>

            {/* Property and unit information + Tenant details (Optimized layout) */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-3`}>
              <h4 className="font-bold text-xs uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
                <Building className="h-4 w-4" />
                {lang === 'en' ? 'Property & Unit Location' : 'Cinwaanka & Kireystaha'}
              </h4>

              {(() => {
                const prop = properties.find(p => p.id === selectedTicketDetails.propertyId);
                const unt = units.find(u => u.id === selectedTicketDetails.unitId);
                return (
                  <div className="text-xs space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-800/10 pb-2">
                      <div>
                        <p className="text-[10px] text-slate-400">{t.property}</p>
                        <p className="font-bold">{prop ? prop.name : 'Shabelle Residency'}</p>
                        <p className="text-[10px] opacity-75 mt-0.5">{prop?.address}, {prop?.district}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">{t.unit}</p>
                        <p className="font-bold">{unt ? unt.unitNumber : selectedTicketDetails.unitId}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/20 p-2.5 rounded-lg">
                      <div>
                        <p className="text-[10px] text-slate-400">{t.tenant}</p>
                        <p className="font-semibold">{unt ? unt.tenantName : 'Xasan Cali (Simulated)'}</p>
                      </div>
                      <div>
                        <a 
                          id="btn_call_tenant"
                          href={`tel:${unt?.tenantPhone}`} 
                          className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg flex items-center justify-center gap-1 font-bold text-xs"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>Wac</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Dynamic Status Update Action Bar (large tactile buttons as required) */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-3`}>
              <h4 className="font-bold text-xs uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
                <SlidersHorizontal className="h-4 w-4" />
                {t.updateStatus} (Tilaabooyinka Farsamada)
              </h4>

              {/* Status Action Workflow Engine */}
              <div className="grid grid-cols-2 gap-2">
                
                {selectedTicketDetails.status === 'assigned' && (
                  <button 
                    id="btn_status_accept"
                    onClick={() => handleStatusUpdate('started')} 
                    className="col-span-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black py-3 rounded-xl text-center shadow transition text-sm"
                  >
                    🚀 {t.acceptJob} &amp; {t.startJob}
                  </button>
                )}

                {selectedTicketDetails.status === 'started' && (
                  <>
                    <button 
                      id="btn_status_pause"
                      onClick={() => handleStatusUpdate('paused')} 
                      className="bg-indigo-600 hover:bg-indigo-505 text-white font-bold py-2.5 rounded-xl transition text-xs"
                    >
                      ⏸️ {t.pauseJob}
                    </button>
                    <button 
                      id="btn_status_waiting_parts"
                      onClick={() => handleStatusUpdate('waiting_for_parts')} 
                      className="bg-amber-600 hover:bg-amber-505 text-white font-bold py-2.5 rounded-xl transition text-xs"
                    >
                      🔩 Wait Parts (Sugo Qalab)
                    </button>
                  </>
                )}

                {selectedTicketDetails.status === 'paused' && (
                  <button 
                    id="btn_status_resume"
                    onClick={() => handleStatusUpdate('started')} 
                    className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition text-xs"
                  >
                    ▶️ Reshuffle/Resume work (Sii wad)
                  </button>
                )}

                {selectedTicketDetails.status === 'waiting_for_parts' && (
                  <button 
                    id="btn_status_parts_arrived"
                    onClick={() => handleStatusUpdate('started')} 
                    className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition text-xs"
                  >
                    ✅ Parts Arrived - Continue (Bilaaw)
                  </button>
                )}

                {/* Status is ready for resolved/completed workflow */}
                {(selectedTicketDetails.status === 'started' || selectedTicketDetails.status === 'waiting_approval') && (
                  <a 
                    id="btn_workflow_completion_link"
                    href="#completion_workflow_anchor" 
                    className="col-span-2 bg-teal-600 hover:bg-teal-500 text-white py-3.5 rounded-xl text-center font-black transition text-sm shadow-md block"
                  >
                    🏁 Ready for Completion (Hagaajiyey)
                  </a>
                )}

              </div>

              {/* Status input remarks textfield */}
              <div className="space-y-1.5 pt-2">
                <input
                  id="input_status_notes"
                  type="text"
                  placeholder="Details/Reason for pause or update (Sababta update-ka)..."
                  value={statusUpdateNotes}
                  onChange={(e) => setStatusUpdateNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white"
                />
              </div>

              {statusSuccessMsg && (
                <div id="status_success_info" className="p-2 rounded bg-emerald-500/10 text-emerald-500 text-xs font-semibold text-center mt-1">
                  {statusSuccessMsg}
                </div>
              )}
            </div>

            {/* Separate Notes Compartment (Tenant and Internal separately handled as requested) */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h4 className="font-bold text-xs uppercase tracking-wider text-orange-500 mb-3 flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Notes &amp; Communications
              </h4>

              <div className="space-y-4">
                {/* Tenant facing notes */}
                <div className="p-3 rounded-xl bg-orange-600/5 border border-orange-500/10 space-y-2">
                  <span className="text-[10px] font-black uppercase text-orange-400">{t.tenantNotes}</span>
                  <p className="text-xs bg-slate-950 p-2.5 rounded font-mono text-slate-300 min-h-[30px]">
                    {selectedTicketDetails.tenantNotes || "(No tenant instructions)"}
                  </p>
                  
                  <div className="flex gap-1.5">
                    <input 
                      id="input_tenant_note" 
                      type="text" 
                      placeholder="Add tenant message update..." 
                      className="bg-slate-950 border border-slate-800 p-1 rounded text-[11px] flex-1 text-white" 
                    />
                    <button 
                      id="btn_save_tenant_note"
                      onClick={() => {
                        const el = document.getElementById('input_tenant_note') as HTMLInputElement;
                        if (el) { handleAddSimpleNote('tenant', el.value); el.value = ''; }
                      }} 
                      className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] px-2 rounded"
                    >
                      {t.addNote}
                    </button>
                  </div>
                </div>

                {/* Internal / Supervisor private notes */}
                <div className="p-3 rounded-xl bg-blue-600/5 border border-blue-500/10 space-y-2">
                  <span className="text-[10px] font-black uppercase text-blue-400">{t.internalNotes}</span>
                  <p className="text-xs bg-slate-950 p-2.5 rounded font-mono text-slate-300 min-h-[30px]">
                    {selectedTicketDetails.internalNotes || "(No private supervisor notes cataloged)"}
                  </p>

                  <div className="flex gap-1.5">
                    <input 
                      id="input_internal_note" 
                      type="text" 
                      placeholder="Add private supervisor notes..." 
                      className="bg-slate-950 border border-slate-800 p-1 rounded text-[11px] flex-1 text-white" 
                    />
                    <button 
                      id="btn_save_internal_note"
                      onClick={() => {
                        const el = document.getElementById('input_internal_note') as HTMLInputElement;
                        if (el) { handleAddSimpleNote('internal', el.value); el.value = ''; }
                      }} 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-2 rounded"
                    >
                      {t.addNote}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Gallery with simulation snapper & upload capacity */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
                  <Camera className="h-4 w-4" />
                  {t.photoGallery}
                </h4>
                <span className="text-[10px] font-mono opacity-80 bg-slate-950 px-2 py-0.5 rounded font-bold">
                  {selectedTicketDetails.photos.length} Captured
                </span>
              </div>

              {/* Photo uploader widget */}
              <form onSubmit={handlePhotoUploadSimulated} className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2.5 mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Attach Maintenance Photo File</p>
                <div className="grid grid-cols-3 gap-1 grid-flow-row">
                  {(['before', 'after', 'proof'] as const).map(pStep => (
                    <button
                      id={`btn_photo_step_select_${pStep}`}
                      key={pStep}
                      type="button"
                      onClick={() => setPhotoStep(pStep)}
                      className={`py-1 px-2 text-[10px] rounded border font-semibold ${
                        photoStep === pStep 
                          ? 'border-orange-500 bg-orange-500/10 text-orange-400' 
                          : 'border-slate-800 bg-slate-900 text-slate-500'
                      }`}
                    >
                      {t[pStep]}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <input
                    id="input_photo_caption"
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="E.g. Rust cleaned, new pipe ready for weld..."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn_photo_choose_fallback"
                    onClick={() => {
                      if (!photoCaption.trim()) {
                        alert("Please type simple caption first to simulate realistic snapshot.");
                        return;
                      }
                      setPhotoCaption(photoCaption || "Simulated photo snap.");
                    }}
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs p-2 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Snap Camera SVG
                  </button>
                  
                  {/* Real file drag & drop input selection fallback */}
                  <label className="border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-400 text-xs font-bold p-2 rounded-lg text-center cursor-pointer flex items-center justify-center">
                    {t.choosePhoto}
                    <input 
                      id="file_input_photo"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setPhotoFileRaw(reader.result as string);
                            setPhotoCaption(file.name);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {photoSuccessMsg && <p className="text-[10px] text-emerald-500 font-semibold">{photoSuccessMsg}</p>}
                {photoError && <p className="text-[10px] text-rose-500 font-semibold">{photoError}</p>}
              </form>

              {/* Render Selected Ticket Photos */}
              {selectedTicketDetails.photos.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">{t.noPhotos}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {selectedTicketDetails.photos.map(p => (
                    <div id={`photo_item_${p.id}`} key={p.id} className="bg-slate-950 p-2 rounded-xl border border-slate-900 flex flex-col gap-1.5">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                        <img id={`img_display_${p.id}`} src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                        <span className="absolute top-1 right-1 bg-black/60 text-[9px] px-1.5 py-0.5 rounded text-orange-400 font-mono font-bold">
                          {p.step.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-300 line-clamp-1">{p.caption}</p>
                        <p className="text-[9px] opacity-60 font-mono mt-0.5">{new Date(p.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cost logging sub-compartment */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  Cost Ledger
                </h4>
                <span className="text-xs bg-orange-600 text-white font-mono font-bold px-2 py-0.5 rounded">
                  Sum: ${selectedTicketDetails.costs.reduce((sum, c) => sum + (c.status === 'approved' ? Number(c.finalCost) : Number(c.estimatedTotal)), 0).toFixed(2)}
                </span>
              </div>

              {/* Cost Addition Form Widget */}
              <form onSubmit={handleSaveCostRecord} className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2.5 mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase">{t.costLogging}</p>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[9px] text-slate-400 font-bold">{t.materials}</label>
                    <input
                      id="input_cost_item"
                      type="text"
                      placeholder="E.g. Brass gate coupling..."
                      value={newCostItem}
                      onChange={(e) => setNewCostItem(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-1 rounded text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold">{t.quantity}</label>
                    <input
                      id="input_cost_qty"
                      type="number"
                      min={1}
                      value={newCostQty}
                      onChange={(e) => setNewCostQty(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 p-1 rounded text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold">{t.unitCost} ($)</label>
                    <input
                      id="input_cost_unit_price"
                      type="number"
                      step="0.01"
                      min={0}
                      value={newCostUnit}
                      onChange={(e) => setNewCostUnit(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 p-1 rounded text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold">{t.laborCost} ($)</label>
                    <input
                      id="input_cost_labor_charge"
                      type="number"
                      step="0.01"
                      min={0}
                      value={newCostLabor}
                      onChange={(e) => setNewCostLabor(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 p-1 rounded text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="chk_approval_needed"
                    type="checkbox"
                    checked={newCostAppReq}
                    onChange={(e) => setNewCostAppReq(e.target.checked)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                  <label htmlFor="chk_approval_needed" className="text-[10px] font-bold text-slate-300">
                    {t.approvalNeededCheck} (Requires supervisor key confirmation)
                  </label>
                </div>

                <div>
                  <button
                    id="btn_submit_cost"
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-505 text-white py-1.5 rounded text-xs font-bold"
                  >
                    🚀 {t.saveCost}
                  </button>
                </div>

                {costLoggingError && <p className="text-[10px] text-rose-500 font-bold">{costLoggingError}</p>}
                {costSuccessMsg && <p className="text-[10px] text-emerald-500 font-bold">{costSuccessMsg}</p>}
              </form>

              {/* Cost Rows */}
              {selectedTicketDetails.costs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">No expenses logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedTicketDetails.costs.map(c => (
                    <div id={`cost_record_${c.id}`} key={c.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-900 flex flex-col gap-1 text-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-200">{c.item}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Qty: {c.quantity} @ ${c.unitCost.toFixed(2)} | Labor: ${c.laborCost.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-orange-400 font-mono">${c.status === 'approved' ? c.finalCost.toFixed(2) : c.estimatedTotal.toFixed(2)}</p>
                          
                          {c.status === 'pending' ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono block mt-1">
                              Pending Sup
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono block mt-1">
                              Approved
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Supervisor Approval Control Rendered Inline */}
                      {user.role === 'supervisor' && c.status === 'pending' && (
                        <button
                          id={`btn_approve_cost_${c.id}`}
                          onClick={() => handleApproveCost(c.id)}
                          className="w-full mt-1 bg-indigo-600 text-white py-1 rounded text-[10px] font-bold"
                        >
                          Approve Expense Log (${c.estimatedTotal.toFixed(2)})
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COMPLETION WORKFLOW SECTION */}
            <span id="completion_workflow_anchor"></span>
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
              <h4 className="font-bold text-xs uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {t.completionWorkflow}
              </h4>

              {/* Technician's Completion Checklist Form */}
              <form onSubmit={handleCompletionOrder} className="space-y-3 bg-slate-950/35 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Final Repair Comments / Notes</label>
                  <textarea
                    id="input_completion_notes"
                    rows={3}
                    placeholder={t.completionNotesPlaceholder}
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  {selectedTicketDetails.status === 'resolved' || selectedTicketDetails.status === 'closed' ? (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded text-xs flex items-center gap-1.5">
                      <Check className="h-4 w-4" />
                      <span>{t.resolved}: Completed notes and proof photos cataloged.</span>
                    </div>
                  ) : (
                    <button
                      id="btn_submit_completion_workflow"
                      type="submit"
                      className="w-full bg-teal-600 hover:bg-teal-505 text-white py-2.5 rounded-xl font-bold text-xs"
                    >
                      🚀 Resolve Work Order &amp; Upload Proof SVG
                    </button>
                  )}
                </div>

                {completionError && <p className="text-[10px] text-rose-500 font-bold">{completionError}</p>}
              </form>

              {/* Supervisor Official Archive Closure Flow */}
              {selectedTicketDetails.status === 'resolved' && (
                <div className="bg-gradient-to-tr from-indigo-950 to-slate-900 p-4 rounded-xl border border-indigo-700/30 space-y-3">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase">Supervisor Official Archival Step</p>
                  
                  <div className="flex items-start gap-2.5">
                    <input
                      id="chk_supervisor_verify"
                      type="checkbox"
                      checked={supervisorVerified}
                      onChange={(e) => setSupervisorVerified(e.target.checked)}
                      className="w-5 h-5 accent-indigo-500 mt-0.5"
                    />
                    <label htmlFor="chk_supervisor_verify" className="text-xs text-slate-300">
                      {t.managerApprovalReq} (I have inspected billing details and photos of workmanship.)
                    </label>
                  </div>

                  <button
                    id="btn_submit_close_ticket"
                    onClick={handleCloseTicketOfficial}
                    className="w-full bg-gradient-to-r from-orange-600 to-indigo-600 hover:from-orange-500 hover:to-indigo-505 text-white font-heavy py-3 rounded-xl font-black text-xs shadow-md"
                  >
                    🔒 {t.closeTicket} (ARCHIVE WORK ORDER)
                  </button>
                </div>
              )}
            </div>

            {/* Timeline Of historical updates */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h4 className="font-bold text-xs uppercase tracking-wider text-orange-500 mb-3 flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {t.timeline}
              </h4>

              <div className="space-y-3">
                {selectedTicketDetails.updates.map((up) => (
                  <div id={`timeline_item_${up.id}`} key={up.id} className="relative pl-5 border-l border-orange-500/20 last:border-0 pb-1.5">
                    <span className="absolute left-[-4.5px] top-[4px] w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    
                    <div className="text-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-orange-400 capitalize">{up.actorName}</span>
                        <span className="text-[9px] opacity-60 font-mono">{new Date(up.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold">{up.actorRole.toUpperCase()}</p>
                      <p className="text-slate-300 mt-1 pl-1 bg-slate-950/20 rounded py-1">{up.notes}</p>
                      
                      <div className="flex gap-1.5 mt-1.5 text-[9px] font-mono opacity-80">
                        <span className="bg-slate-950 px-1 py-0.2 text-slate-400 rounded">
                          Before: {t[up.statusBefore]}
                        </span>
                        <span className="bg-slate-950 px-1 py-0.2 text-emerald-400 rounded">
                          After: {t[up.statusAfter]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* VIEW 4: COMPLETED JOBS (Archived / Closed Ticket items) */}
        {currentView === 'completed' && (
          <div id="view_completed" className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              {t.completedJobs} History
            </h2>

            {/* Closed item summary */}
            <div className="space-y-3">
              {tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No resolved tickets archived in system yet.</div>
              ) : (
                tickets
                  .filter(t => t.status === 'closed' || t.status === 'resolved')
                  .map(ticket => {
                    const prop = properties.find(p => p.id === ticket.propertyId);
                    return (
                      <div 
                        id={`archive_ticket_card_${ticket.id}`} 
                        key={ticket.id}
                        onClick={() => {
                          setSelectedTicketId(ticket.id);
                          setCurrentView('job-details');
                        }}
                        className={`p-4 rounded-xl border cursor-pointer hover:border-emerald-500 transition ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold uppercase">
                            Archived {t[ticket.status]}
                          </span>
                          <span className="text-[10px] opacity-60 font-mono">Completed: {ticket.completedAt ? new Date(ticket.completedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <h4 className="font-bold text-sm mt-2">{ticket.title}</h4>
                        <p className="text-xs opacity-75 mt-0.5 line-clamp-2">{ticket.completionNotes || ticket.description}</p>
                        
                        <div className="text-[11px] opacity-75 font-mono pt-2 border-t border-slate-800/10 mt-2">
                          Property: {prop ? prop.name : 'Estate Location'}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* VIEW 5: REPORTS (Financial stats and breakdown maps - crucial for Supervisors) */}
        {currentView === 'reports' && (
          <div id="view_reports" className="space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              {t.reports} &amp; Ledger
            </h2>

            {reportStats ? (
              <div className="space-y-4">
                {/* Financial overview boxes */}
                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} space-y-3`}>
                  <p className="text-[11px] font-mono font-bold uppercase text-orange-400">{t.totalSpend}</p>
                  <p className="text-4xl font-extrabold tracking-tight font-mono text-emerald-500">${Number(reportStats.totalSpend || 0).toFixed(2)}</p>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/10 text-xs">
                    <div>
                      <p className="text-slate-400 text-[10px]">{t.materialsCost}</p>
                      <p className="font-bold font-mono">${Number(reportStats.materialsCost || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-[10px]">{t.laborCostTotal}</p>
                      <p className="font-bold font-mono">${Number(reportStats.laborCostTotal || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Priority distribution chart mockup */}
                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-orange-500 mb-3">Ticket Priority Index</h4>
                  
                  <div className="space-y-2.5">
                    {Object.entries(reportStats.priorityDistribution || {}).map(([priority, count]) => {
                      const total: number = Object.values(reportStats.priorityDistribution).reduce((a: any, b: any) => a + b, 0) as number || 1;
                      const percentage = ((count as number) / total) * 100;
                      return (
                        <div id={`priority_stat_${priority}`} key={priority} className="text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold capitalize text-slate-300">{priority}</span>
                            <span className="font-mono font-bold text-orange-400">{count as number} tickets</span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                priority === 'urgent' ? 'bg-rose-500' :
                                priority === 'high' ? 'bg-orange-500' :
                                priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                              }`} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Spend by real property bento list */}
                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-orange-500 mb-3">Spend by Mogadishu Estates</h4>
                  
                  <div className="space-y-3">
                    {reportStats.propertySpend?.map((ps: any) => (
                      <div id={`property_spend_${ps.propertyId}`} key={ps.propertyId} className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/10 last:border-0 last:pb-0">
                        <div>
                          <p className="font-bold text-slate-100">{ps.propertyName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">District: {ps.district}</p>
                        </div>
                        <span className="font-black text-emerald-400 font-mono">${Number(ps.spend).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">{t.loading}</p>
            )}

          </div>
        )}

        {/* VIEW 6: MY PROFILE */}
        {currentView === 'profile' && (
          <div id="view_profile" className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-orange-500" />
              {t.profile}
            </h2>

            <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} text-center space-y-4`}>
              <div className="mx-auto w-24 h-24 rounded-full bg-slate-850 border-2 border-orange-500/50 flex items-center justify-center p-1.5 shadow-xl">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-extrabold text-orange-500 text-3xl font-mono">
                  {user.name.charAt(0)}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold">{user.name}</h3>
                <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 font-mono">
                  {user.role}
                </span>
              </div>

              <div className="border-t border-slate-800/10 pt-4 text-left text-xs space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t.username}:</span>
                  <span className="font-bold">{user.username}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{t.phoneLabel}:</span>
                    <span className="font-bold">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Hub Security ID:</span>
                  <span className="font-bold">SOM-FIX-{user.id.toUpperCase()}</span>
                </div>
              </div>

              <button 
                id="btn_logout"
                onClick={handleLogout} 
                className="w-full bg-rose-600 hover:bg-rose-505 active:bg-rose-700 text-white py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 mt-4"
              >
                <LogOut className="h-4 w-4" />
                <span>{t.logout}</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 7: SETTINGS (Bilingual Language Switcher, Theme switch, Developer reset tool) */}
        {currentView === 'settings' && (
          <div id="view_settings" className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-orange-500" />
              {t.settings}
            </h2>

            {/* Bilingual Control Card */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
              <h4 className="font-bold text-xs uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
                <Languages className="h-4 w-4" />
                {t.languageSelect} / Luqadda Nidaamka
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn_lang_en_settings"
                  onClick={() => setLang('en')}
                  className={`py-2.5 font-bold rounded-lg border text-xs text-center transition ${
                    lang === 'en' 
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400' 
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  English Language
                </button>
                <button
                  id="btn_lang_so_settings"
                  onClick={() => setLang('so')}
                  className={`py-2.5 font-bold rounded-lg border text-xs text-center transition ${
                    lang === 'so' 
                      ? 'border-orange-500 bg-orange-505/10 text-orange-400' 
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  Af-Soomaali
                </button>
              </div>
            </div>

            {/* Interface theme Mode */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
              <h4 className="font-bold text-xs uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
                <Sun className="h-4 w-4" />
                {t.themeSelect}
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn_theme_light"
                  onClick={() => setTheme('light')}
                  className={`py-2.5 font-bold rounded-lg border text-xs text-center transition flex justify-center items-center gap-1.5 ${
                    theme === 'light' 
                      ? 'border-orange-500 bg-orange-505/10 text-orange-600' 
                      : 'border-slate-800 bg-slate-950 text-slate-500 animate-none'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  {t.lightMode}
                </button>
                <button
                  id="btn_theme_dark"
                  onClick={() => setTheme('dark')}
                  className={`py-2.5 font-bold rounded-lg border text-xs text-center transition flex justify-center items-center gap-1.5 ${
                    theme === 'dark' 
                      ? 'border-orange-500 bg-orange-505/10 text-orange-400' 
                      : 'border-slate-200 bg-slate-100 text-slate-700'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  {t.darkMode}
                </button>
              </div>
            </div>

            {/* Demonstration Seed Reset */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
              <h4 className="font-bold text-xs uppercase tracking-wider text-orange-500">MVP Prototype Reset Tool</h4>
              <p className="text-xs opacity-70">Returns database store to initial seeded conditions (3 technicians, 1 supervisor, 15 tickets, 12 photos, 8 cost rows) for clear evaluation tests.</p>
              
              <button
                id="btn_settings_reset_all"
                onClick={triggerDatabaseReset}
                className="w-full bg-slate-950 border border-slate-800 hover:border-orange-500 text-white py-2.5 rounded-xl font-bold text-xs transition active:scale-95"
              >
                🔄 {t.seedReset}
              </button>
            </div>

            {/* Future Integrations technical explanation node */}
            <div className={`p-4 rounded-2xl border border-dashed ${theme === 'dark' ? 'border-orange-500/20 bg-orange-500/5' : 'border-orange-200 bg-orange-50'} text-xs space-y-2`}>
              <p className="font-bold text-orange-500">Future Integration Specs</p>
              <p className="text-[11px] opacity-80 leading-relaxed">
                SomRent Fix implements standalone endpoints proxying to an in-memory repository structured for zero friction migrations. 
                Integrating to **SomRent Admin** or **SomRent Tenant** is facilitated via:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[10px] opacity-85 font-mono">
                <li>Common PostgreSQL schema referencing property_id and ticket_id fields.</li>
                <li>Standardised REST routing scheme supporting CORS or microservice reverse-proxy.</li>
                <li>Universal JWT token sharing for regional technicians and central caretaking desk.</li>
              </ul>
            </div>
          </div>
        )}

      </main>

      {/* Persistent Bottom Tab Sticky Bar for Mobile Hand-hold responsiveness */}
      <footer className={`fixed bottom-0 left-0 right-0 z-50 border-t ${
        theme === 'dark' ? 'bg-slate-900/95 border-slate-800 text-slate-400' : 'bg-white/95 border-slate-200 text-slate-600'
      } backdrop-blur-md px-2 py-1 flex items-center justify-around max-w-md mx-auto h-16 shadow-2xl rounded-t-xl`}>
        
        <button
          id="tab_nav_dash"
          onClick={() => { setSelectedTicketId(null); setCurrentView('dashboard'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full font-bold text-[10px] transition ${
            currentView === 'dashboard' ? 'text-orange-500 scale-105' : 'opacity-85 hover:text-slate-200'
          }`}
        >
          <Layers className="h-5 w-5 mb-0.5" />
          <span>{t.dashboard}</span>
        </button>

        <button
          id="tab_nav_jobs"
          onClick={() => { setSelectedTicketId(null); setCurrentView('my-jobs'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full font-bold text-[10px] transition ${
            currentView === 'my-jobs' || currentView === 'job-details' ? 'text-orange-500 scale-105' : 'opacity-85 hover:text-slate-200'
          }`}
        >
          <Briefcase className="h-5 w-5 mb-0.5" />
          <span>{t.myJobs}</span>
        </button>

        <button
          id="tab_nav_completed"
          onClick={() => { setSelectedTicketId(null); setCurrentView('completed'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full font-bold text-[10px] transition ${
            currentView === 'completed' ? 'text-orange-500 scale-105' : 'opacity-85 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="h-5 w-5 mb-0.5" />
          <span>{lang === 'en' ? 'History' : 'Dhamaaday'}</span>
        </button>

        <button
          id="tab_nav_profile"
          onClick={() => { setSelectedTicketId(null); setCurrentView('profile'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full font-bold text-[10px] transition ${
            currentView === 'profile' ? 'text-orange-500 scale-105' : 'opacity-85 hover:text-slate-200'
          }`}
        >
          <UserIcon className="h-5 w-5 mb-0.5" />
          <span>{t.profile}</span>
        </button>

        <button
          id="tab_nav_settings"
          onClick={() => { setSelectedTicketId(null); setCurrentView('settings'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full font-bold text-[10px] transition ${
            currentView === 'settings' ? 'text-orange-500 scale-105' : 'opacity-85 hover:text-slate-200'
          }`}
        >
          <SettingsIcon className="h-5 w-5 mb-0.5" />
          <span>{t.settings}</span>
        </button>
      </footer>

    </div>
  );
}
