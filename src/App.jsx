import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, ClipboardList, History, LogOut, Search, TrendingUp, Users, 
  Star, Calendar, MessageSquare, Gauge as GaugeIcon, Plus, Download, AlertCircle, 
  UserPlus, Shield, Lightbulb, AlertTriangle, Loader2, Trash2, Moon, Sun, 
  Mic, Paperclip, X, Headphones, Edit3, Save, Printer, BellRing
} from 'lucide-react';

// =========================================================================
// ⚠️ COLOQUE O SEU LINK DO GOOGLE APPS SCRIPT AQUI DENTRO DAS ASPAS:
// Exemplo: "https://script.google.com/macros/s/AKfycb.../exec"
// =========================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbwkLmDty91rgYrZt3Q_OD0PejZhoNjTU-JvAx6n2Kr1KdzV87B6ubKAkWkRW6O3Qyhy/exec";

// --- ESTILOS DE ANIMAÇÃO ---
const customAnimations = `
  @keyframes rise-up { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
  .animate-subtle-zoom { animation: rise-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
  @keyframes needle-sweep { 0% { opacity: 0; transform: scaleX(0); } 100% { opacity: 1; transform: scaleX(1); } }
  .animate-grow-y { transform-origin: left; animation: needle-sweep 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
  .delay-100 { animation-delay: 80ms; } .delay-200 { animation-delay: 140ms; } .delay-300 { animation-delay: 200ms; } .delay-400 { animation-delay: 260ms; } .delay-500 { animation-delay: 320ms; }
`;

// --- ZONA DE LEITURA (verde / âmbar / vermelho, como as faixas de um VU-meter) ---
const zoneColor = (v) => (v >= 80 ? '#7BC17A' : v >= 60 ? '#E3A73E' : '#D96A56');

// --- COMPONENTES AUXILIARES ---

// LED indicador de status (usado em tabelas, listas e badges)
const LedDot = ({ v, pulse = false }) => (
  <span
    className={`led led-on ${pulse ? 'animate-led-pulse' : ''}`}
    style={{ background: zoneColor(v), color: zoneColor(v) }}
  />
);

// Medidor semicircular estilo instrumento de estúdio — elemento de assinatura do app
const polarToCartesian = (cx, cy, r, angleDeg) => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};
const arcPath = (cx, cy, r, a0, a1) => {
  const p0 = polarToCartesian(cx, cy, r, a0);
  const p1 = polarToCartesian(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`;
};

const Gauge = ({ value = 0, size = 168, thickness = 11, label }) => {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const cx = size / 2;
  const cy = size / 2 + 6;
  const r = size / 2 - thickness - 4;
  const toAngle = (pct) => 180 + pct * 1.8;
  const color = zoneColor(v);
  const needleTip = polarToCartesian(cx, cy, r - 4, toAngle(v));

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 28} viewBox={`0 0 ${size} ${size / 2 + 28}`}>
        <path d={arcPath(cx, cy, r, toAngle(0), toAngle(60))} stroke="#D96A56" strokeWidth={thickness} fill="none" strokeOpacity="0.3" />
        <path d={arcPath(cx, cy, r, toAngle(60), toAngle(80))} stroke="#E3A73E" strokeWidth={thickness} fill="none" strokeOpacity="0.3" />
        <path d={arcPath(cx, cy, r, toAngle(80), toAngle(100))} stroke="#7BC17A" strokeWidth={thickness} fill="none" strokeOpacity="0.3" />
        {Array.from({ length: 11 }).map((_, i) => {
          const a = toAngle(i * 10);
          const p1 = polarToCartesian(cx, cy, r + thickness / 2 + 3, a);
          const p2 = polarToCartesian(cx, cy, r + thickness / 2 + 8, a);
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--c-sub)" strokeWidth="1.4" />;
        })}
        <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill={color} stroke="var(--c-panel)" strokeWidth="2" />
      </svg>
      <div className="screen -mt-1 px-3 py-1">
        <span className="font-mono font-semibold tabular-nums text-lg" style={{ color }}>{Math.round(v)}%</span>
      </div>
      {label && <span className="plate-label mt-2 text-center">{label}</span>}
    </div>
  );
};

// Cartão "módulo de medição" — substitui o antigo StatCard genérico
const MeterCard = ({ title, value, icon: Icon, subtitle, trend, delayClass = "" }) => (
  <div className={`panel p-5 animate-subtle-zoom ${delayClass}`}>
    <div className="flex items-start justify-between mb-1">
      <span className="plate-label">{title}</span>
      <Icon className="w-4 h-4 text-console-sub" />
    </div>
    <div className="screen inline-block px-3 py-1.5 mt-2">
      <span className="font-mono font-bold tabular-nums text-2xl text-console-ink">{value}</span>
    </div>
    {subtitle && (
      <div className="mt-3 flex items-center text-xs plate-label normal-case tracking-normal">
        {trend != null && (
          <span className={`font-mono font-semibold mr-2 flex items-center ${trend >= 0 ? 'text-[#7BC17A]' : 'text-[#D96A56]'}`}>
            <TrendingUp className={`w-3 h-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </span>
        )}
        <span className="text-console-sub">{subtitle}</span>
      </div>
    )}
  </div>
);

// Gráfico de barras estilo "colunas de medição" sobre régua de marcações
const ConsoleBarChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.value), 100);
  return (
    <div className="flex items-end justify-between h-48 mt-6 gap-2 tick-rule border-b border-console-line pb-0">
      {data.map((item, idx) => {
        const heightPercent = `${(item.value / maxVal) * 100}%`;
        const color = zoneColor(item.value);
        return (
          <div key={idx} className="flex flex-col items-center flex-1 group h-full justify-end pb-1">
            <div className="relative w-full flex justify-center h-full items-end">
              <div className="w-full max-w-[36px] h-full relative flex items-end">
                <div
                  className={`w-full rounded-t-sm transition-all duration-500 animate-grow-y delay-${Math.min((idx + 1) * 100, 500)}`}
                  style={{ height: heightPercent, background: color, opacity: 0.85 }}
                />
                <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 screen px-2 py-1 whitespace-nowrap transition-opacity z-10">
                  <span className="font-mono text-xs font-semibold" style={{ color }}>{item.value.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <span className="plate-label mt-2 truncate w-full text-center">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// Fader de critério — substitui o range input genérico por um canal de mesa de som
const CriterionFader = ({ label, value, onChange }) => {
  const color = zoneColor(Number(value));
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
      <span className="plate-label sm:w-32 shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-4">
        <input type="range" min="0" max="100" value={value} onChange={onChange} className="fader flex-1" />
        <div className="screen w-16 text-center py-1.5 shrink-0">
          <span className="font-mono font-semibold tabular-nums" style={{ color }}>{value}%</span>
        </div>
      </div>
    </div>
  );
};

// Barra de alerta estilo painel (substitui os toasts genéricos com glassmorphism)
const ConsoleToast = ({ toast }) => {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className="fixed top-6 right-6 z-50 animate-subtle-zoom">
      <div className="panel flex items-stretch overflow-hidden pr-4 min-w-[260px]">
        <div className={`w-1.5 ${isError ? 'bg-[#D96A56]' : 'bg-[#7BC17A]'}`} />
        <div className="flex items-center gap-2 px-4 py-3">
          {isError ? <AlertCircle className="w-4 h-4 text-[#D96A56]" /> : <GaugeIcon className="w-4 h-4 text-[#7BC17A]" />}
          <span className="text-sm font-medium text-console-ink">{toast.message}</span>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('leahpar_users')) || []);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('leahpar_user')) || null);
  const [evaluations, setEvaluations] = useState(() => JSON.parse(localStorage.getItem('leahpar_evals')) || []);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newEvalsCount, setNewEvalsCount] = useState(0);

  // Tema Escuro
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // SALVAR DADOS NO LOCALSTORAGE PARA MANTER SESSÃO ABERTA
  useEffect(() => {
    if (user) localStorage.setItem('leahpar_user', JSON.stringify(user));
    else localStorage.removeItem('leahpar_user');
  }, [user]);

  useEffect(() => {
    if (users.length > 0) localStorage.setItem('leahpar_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (evaluations.length > 0) localStorage.setItem('leahpar_evals', JSON.stringify(evaluations));
  }, [evaluations]);

  // SINCRONIZAÇÃO EM BACKGROUND AO RECARREGAR A PÁGINA
  useEffect(() => {
    if (user && API_URL && API_URL !== "COLE_AQUI_O_LINK_QUE_ACABOU_DE_COPIAR") {
      const syncData = async () => {
        try {
          const resUsers = await fetch(`${API_URL}?action=getUsers`);
          const fetchedUsers = await resUsers.json();
          const normalizedUsers = fetchedUsers.map(u => ({
            id: u.id || u.ID || u.Id,
            name: u.name || u.Nome,
            email: u.email || u.Email,
            password: u.password || u.Senha,
            role: (u.role || u.Cargo) === 'Administrador' ? 'Admin' : (u.role || u.Cargo || 'Operador')
          }));
          setUsers(normalizedUsers);

          const resEvals = await fetch(`${API_URL}?action=getEvaluations`);
          const fetchedEvals = await resEvals.json();
          const formattedEvals = fetchedEvals.map(ev => ({
            id: ev.id || ev.ID,
            agent: ev.agent || ev.Operador || ev.Atendente,
            date: ev.date || ev.Data,
            criteria: {
              communication: Number(ev.communication || ev.Comunicacao || 0),
              resolution: Number(ev.resolution || ev.Resolucao || 0),
              empathy: Number(ev.empathy || ev.Empatia || 0)
            },
            total: Number(ev.total || ev.Total || 0),
            comments: ev.comments || ev.Feedback || ev.Comentarios,
            evaluator: ev.evaluator || ev.Avaliador,
            audioUrl: ev.Audio || ev.audioUrl || ev.audio || '' 
          })).sort((a, b) => new Date(b.date) - new Date(a.date));
          setEvaluations(formattedEvals);
        } catch (e) {
          console.error("Erro na sincronização em background", e);
        }
      };
      syncData();
    }
  }, []);

  // --- LÓGICA DE NOTIFICAÇÃO DE NOVAS AVALIAÇÕES ---
  useEffect(() => {
    if (user && user.role === 'Operador') {
      const operatorEvals = evaluations.filter(ev => ev.agent === user.name);
      const seenCount = parseInt(localStorage.getItem(`leahpar_seen_${user.id}`) || '0', 10);
      
      if (operatorEvals.length > seenCount) {
        setNewEvalsCount(operatorEvals.length - seenCount);
      } else if (operatorEvals.length < seenCount) {
        // Ajusta a contagem caso o Admin tenha apagado alguma avaliação
        localStorage.setItem(`leahpar_seen_${user.id}`, operatorEvals.length);
        setNewEvalsCount(0);
      } else {
        setNewEvalsCount(0);
      }
    }
  }, [evaluations, user]);

  const markEvalsAsSeen = () => {
    if (user && user.role === 'Operador') {
      const operatorEvals = evaluations.filter(ev => ev.agent === user.name);
      localStorage.setItem(`leahpar_seen_${user.id}`, operatorEvals.length);
      setNewEvalsCount(0);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsers([]);
    setEvaluations([]);
    localStorage.removeItem('leahpar_user');
    localStorage.removeItem('leahpar_users');
    localStorage.removeItem('leahpar_evals');
    setCurrentView('dashboard');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const extractDriveId = (url) => {
    if (!url) return null;
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
  };

  // --- COMUNICAÇÃO COM O GOOGLE SHEETS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!API_URL || API_URL === "COLE_AQUI_O_LINK_QUE_ACABOU_DE_COPIAR") {
      return showToast("Aviso: Configure o link do Google Apps Script na linha 13 do código!", "error");
    }

    setIsLoading(true);
    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    try {
      const resUsers = await fetch(`${API_URL}?action=getUsers`);
      const fetchedUsers = await resUsers.json();
      
      const normalizedUsers = fetchedUsers.map(u => ({
        id: u.id || u.ID || u.Id,
        name: u.name || u.Nome,
        email: u.email || u.Email,
        password: u.password || u.Senha,
        role: (u.role || u.Cargo) === 'Administrador' ? 'Admin' : (u.role || u.Cargo || 'Operador')
      }));
      setUsers(normalizedUsers);
      
      const userByEmail = normalizedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!userByEmail) {
        showToast('Utilizador inexistente! Verifique o e-mail informado.', 'error');
        setIsLoading(false);
        return;
      }

      if (String(userByEmail.password) !== String(password)) {
        showToast('Palavra-passe incorreta! Tente novamente.', 'error');
        setIsLoading(false);
        return;
      }

      const foundUser = userByEmail;
      
      const resEvals = await fetch(`${API_URL}?action=getEvaluations`);
      const fetchedEvals = await resEvals.json();
        
      const formattedEvals = fetchedEvals.map(ev => ({
        id: ev.id || ev.ID,
        agent: ev.agent || ev.Operador || ev.Atendente,
        date: ev.date || ev.Data,
        criteria: {
          communication: Number(ev.communication || ev.Comunicacao || 0),
          resolution: Number(ev.resolution || ev.Resolucao || 0),
          empathy: Number(ev.empathy || ev.Empatia || 0)
        },
        total: Number(ev.total || ev.Total || 0),
        comments: ev.comments || ev.Feedback || ev.Comentarios,
        evaluator: ev.evaluator || ev.Avaliador,
        audioUrl: ev.Audio || ev.audioUrl || ev.audio || '' 
      })).sort((a, b) => new Date(b.date) - new Date(a.date));

      setEvaluations(formattedEvals);
      setUser(foundUser);
      setCurrentView('dashboard');
      showToast(`Bem-vindo(a), ${foundUser.name}!`);
    } catch (err) {
      console.error(err);
      showToast('Erro ao ligar à base de dados. Verifique o link da API.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvaluations = useMemo(() => {
    let filtered = evaluations;
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(ev => ev.date.startsWith(selectedMonth));
    }
    if (user && user.role === 'Operador') {
      filtered = filtered.filter(ev => ev.agent === user.name);
    }
    return filtered;
  }, [evaluations, selectedMonth, user]);

  const kpis = useMemo(() => {
    const totalEvals = filteredEvaluations.length;
    const avgScore = totalEvals > 0 ? filteredEvaluations.reduce((acc, curr) => acc + curr.total, 0) / totalEvals : 0;
    
    if (user?.role === 'Operador') {
      const avgComm = totalEvals > 0 ? filteredEvaluations.reduce((acc, curr) => acc + curr.criteria.communication, 0) / totalEvals : 0;
      const avgRes = totalEvals > 0 ? filteredEvaluations.reduce((acc, curr) => acc + curr.criteria.resolution, 0) / totalEvals : 0;
      const avgEmp = totalEvals > 0 ? filteredEvaluations.reduce((acc, curr) => acc + curr.criteria.empathy, 0) / totalEvals : 0;
      
      let recommendation = null;
      if (avgScore < 80 && totalEvals > 0) {
        const lowest = Math.min(avgComm, avgRes, avgEmp);
        if (lowest === avgComm) recommendation = "A sua nota de Comunicação está abaixo da média. Tente usar um tom de voz mais acolhedor.";
        else if (lowest === avgRes) recommendation = "Foque na Resolução no Primeiro Contacto. Garanta que o cliente não tem mais dúvidas.";
        else recommendation = "Pratique mais a Escuta Ativa e Empatia. Mostre ao cliente que compreende a frustração dele.";
      }
      return { totalEvals, avgScore, avgComm, avgRes, avgEmp, recommendation };
    } 
    else {
      const agentScores = {};
      filteredEvaluations.forEach(ev => {
        if (!agentScores[ev.agent]) agentScores[ev.agent] = { total: 0, count: 0 };
        agentScores[ev.agent].total += ev.total;
        agentScores[ev.agent].count += 1;
      });
      let bestAgent = { name: 'Sem dados', score: 0 };
      Object.entries(agentScores).forEach(([name, data]) => {
        const avg = data.total / data.count;
        if (avg > bestAgent.score && data.count > 0) bestAgent = { name, score: avg };
      });
      return { totalEvals, avgScore, bestAgent, agentScores };
    }
  }, [filteredEvaluations, user]);

  const chartData = useMemo(() => {
    if (selectedMonth === 'all') {
      const monthlyData = {};
      const monthsLabel = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      filteredEvaluations.forEach(ev => {
        if(!ev.date) return;
        const monthIdx = parseInt(ev.date.split('-')[1]) - 1;
        if (!monthlyData[monthIdx]) monthlyData[monthIdx] = { sum: 0, count: 0 };
        monthlyData[monthIdx].sum += ev.total;
        monthlyData[monthIdx].count += 1;
      });
      return monthsLabel.slice(0, 6).map((label, idx) => ({
        label,
        value: monthlyData[idx] ? (monthlyData[idx].sum / monthlyData[idx].count) : 0
      }));
    } else {
      if (user?.role === 'Operador') return [];
      const agentData = {};
      filteredEvaluations.forEach(ev => {
        const firstName = ev.agent.split(' ')[0];
        if (!agentData[firstName]) agentData[firstName] = { sum: 0, count: 0 };
        agentData[firstName].sum += ev.total;
        agentData[firstName].count += 1;
      });
      return Object.entries(agentData).map(([label, data]) => ({ label, value: data.sum / data.count }));
    }
  }, [filteredEvaluations, selectedMonth, user]);

  // --- TELAS ---
  const renderLogin = () => (
    <div className="min-h-screen bg-console-bg rack-texture flex flex-col justify-center py-12 px-4 relative overflow-hidden font-sans">
      <style>{customAnimations}</style>
      <ConsoleToast toast={toast} />

      <div className="absolute top-6 right-6 z-20">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="panel p-3 text-console-sub hover:text-signal-teal transition-colors">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="mx-auto w-full max-w-sm relative z-10 animate-subtle-zoom">
        <div className="flex justify-center items-center mb-6">
          <div className="panel p-5 relative">
            <GaugeIcon className="w-10 h-10 text-signal-teal" />
            <span className="led led-on animate-led-pulse absolute top-2.5 right-2.5" style={{ background: '#7BC17A', color: '#7BC17A' }} />
          </div>
        </div>
        <h2 className="text-center text-3xl font-display font-bold text-console-ink tracking-tight">Leahpar<span className="text-signal-teal">Note</span></h2>
        <p className="mt-2 text-center plate-label">Console de Monitoria de Qualidade</p>
      </div>

      <div className="mt-8 mx-auto w-full max-w-sm relative z-10 animate-subtle-zoom delay-100">
        <div className="panel py-8 px-6 sm:px-8">
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="plate-label mb-1.5 block">E-mail</label>
              <input
                name="email" type="email" required
                placeholder="seu.email@empresa.com"
                className="screen w-full px-4 py-3 text-console-ink placeholder-console-sub/70 focus:outline-none focus:ring-2 focus:ring-signal-teal/50 text-sm transition-all font-mono"
              />
            </div>

            <div>
              <label className="plate-label mb-1.5 block">Palavra-passe</label>
              <input
                name="password" type="password" required
                placeholder="••••••••"
                className="screen w-full px-4 py-3 text-console-ink placeholder-console-sub/70 focus:outline-none focus:ring-2 focus:ring-signal-teal/50 text-sm transition-all font-mono"
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-module text-sm font-bold text-console-bg bg-signal-teal hover:bg-signal-tealDim transition-all disabled:opacity-60 disabled:cursor-not-allowed tracking-wide uppercase"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Conectando à nuvem...</> : 'Entrar no Sistema'}
              </button>
            </div>
          </form>
          <div className="mt-6 border-t border-console-line pt-4 flex justify-center items-center">
            <Shield className="w-3.5 h-3.5 text-console-sub mr-1.5" />
            <p className="plate-label">Acesso Seguro e Garantido</p>
          </div>
        </div>
        
        <div className="mt-8 text-center animate-subtle-zoom delay-200">
          <p className="plate-label">
            Desenvolvido por <span className="text-signal-teal font-semibold">Leahpar Code</span> &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );

  const DashboardAdmin = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MeterCard title="Média Geral da Operação" value={`${kpis.avgScore.toFixed(1)}%`} icon={GaugeIcon} delayClass="delay-100" />
        <MeterCard title="Total de Monitorias" value={kpis.totalEvals} icon={ClipboardList} delayClass="delay-200" />
        <MeterCard title="Top Performance" value={kpis.bestAgent.name} icon={Star} subtitle={`Média de ${kpis.bestAgent.score.toFixed(1)}%`} delayClass="delay-300" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 panel p-6 animate-subtle-zoom delay-400">
          <div className="flex justify-between items-center mb-2">
            <h3 className="plate-label text-console-ink">{selectedMonth === 'all' ? 'Evolução Global (Visão Geral)' : 'Média por Operador no Mês'}</h3>
            <TrendingUp className="w-4 h-4 text-console-sub" />
          </div>
          <ConsoleBarChart data={chartData} />
        </div>

        <div className="panel p-6 flex flex-col animate-subtle-zoom delay-500">
          <h3 className="plate-label text-console-ink mb-4 flex items-center"><Users className="w-4 h-4 mr-2 text-console-sub" /> Ranking da Equipe</h3>
          <div className="flex-1 space-y-2">
            {Object.entries(kpis.agentScores || {})
            .map(([name, data]) => ({ name, score: data.total / data.count }))
            .sort((a, b) => b.score - a.score).slice(0, 5)
            .map((agent, idx) => (
              <div key={agent.name} className="flex items-center justify-between p-2.5 rounded-module border border-transparent hover:border-console-line hover:bg-console-panel2 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-module flex items-center justify-center font-mono font-bold text-xs screen ${idx === 0 ? 'text-[#E3A73E]' : 'text-console-sub'}`}>{idx + 1}</div>
                  <span className="text-sm font-medium text-console-ink">{agent.name}</span>
                </div>
                <span className="font-mono font-bold text-sm px-2 py-0.5 rounded-module border" style={{ color: zoneColor(agent.score), borderColor: zoneColor(agent.score) + '55', background: zoneColor(agent.score) + '18' }}>{agent.score.toFixed(1)}%</span>
              </div>
            ))}
            {Object.keys(kpis.agentScores || {}).length === 0 && (
              <p className="text-sm text-console-sub text-center py-6">Sem dados suficientes ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const DashboardOperator = () => (
    <div className="space-y-5">
      <div className="panel p-8 relative overflow-hidden animate-subtle-zoom">
        <GaugeIcon className="w-40 h-40 absolute -right-6 -bottom-8 text-console-line opacity-40" strokeWidth={1} />
        <div className="relative z-10">
          <span className="plate-label">Painel do Operador</span>
          <h2 className="text-2xl font-display font-bold text-console-ink mt-1 mb-1">Olá, {user.name.split(' ')[0]}</h2>
          <p className="text-sm text-console-sub">Resumo da sua performance no período selecionado.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MeterCard title="Sua Média de Qualidade" value={`${kpis.avgScore.toFixed(1)}%`} icon={GaugeIcon} delayClass="delay-100" />
        <MeterCard title="Avaliações Recebidas" value={kpis.totalEvals} icon={ClipboardList} delayClass="delay-200" />
      </div>

      {kpis.recommendation && (
        <div className="panel p-6 flex flex-col md:flex-row items-start gap-4 animate-subtle-zoom delay-300 border-l-4" style={{ borderLeftColor: '#E3A73E' }}>
          <div className="screen p-3 shrink-0"><Lightbulb className="w-6 h-6 text-[#E3A73E]" /></div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-console-ink mb-1 flex items-center uppercase tracking-wide">
              Recomendação de Melhoria <AlertTriangle className="w-4 h-4 ml-2 text-[#E3A73E]" />
            </h3>
            <p className="text-console-sub text-sm">{kpis.recommendation}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
               <div className="screen p-2"><div className="plate-label mb-1">Comunicação</div><div className="font-mono font-bold text-[#E3A73E]">{kpis.avgComm.toFixed(0)}%</div></div>
               <div className="screen p-2"><div className="plate-label mb-1">Resolução</div><div className="font-mono font-bold text-[#E3A73E]">{kpis.avgRes.toFixed(0)}%</div></div>
               <div className="screen p-2"><div className="plate-label mb-1">Empatia</div><div className="font-mono font-bold text-[#E3A73E]">{kpis.avgEmp.toFixed(0)}%</div></div>
            </div>
          </div>
        </div>
      )}
      
      {!kpis.recommendation && kpis.totalEvals > 0 && (
        <div className="panel p-6 flex items-center gap-4 animate-subtle-zoom delay-300 border-l-4" style={{ borderLeftColor: '#7BC17A' }}>
          <div className="screen p-3 shrink-0"><GaugeIcon className="w-6 h-6 text-[#7BC17A]" /></div>
          <div>
            <h3 className="text-sm font-bold text-console-ink mb-1 uppercase tracking-wide">Parabéns pelo excelente trabalho!</h3>
            <p className="text-console-sub text-sm">A sua nota está acima da meta. Continue a manter a alta qualidade nos seus atendimentos.</p>
          </div>
        </div>
      )}
    </div>
  );

  const NewEvaluationView = () => {
    const operatorsList = users.filter(u => u.role === 'Operador');
    const [formData, setFormData] = useState({
      agent: operatorsList.length > 0 ? operatorsList[0].name : '',
      date: new Date().toISOString().split('T')[0],
      comm: 100, res: 100, emp: 100, comments: ''
    });
    
    const [audioData, setAudioData] = useState(null);
    const [audioFileName, setAudioFileName] = useState("");

    const average = Math.round((Number(formData.comm) + Number(formData.res) + Number(formData.emp)) / 3);

    const handleAudioUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (file.size > 5 * 1024 * 1024) { 
        showToast("O ficheiro é muito grande. Escolha um áudio até 5MB.", "error");
        e.target.value = null;
        return;
      }

      setAudioFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result.split(',')[1];
        setAudioData({
          base64: base64,
          name: file.name,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if(!formData.agent) return showToast('Cadastre um operador primeiro no menu Gerir Utilizadores!', 'error');
      
      setIsLoading(true);
      const newEval = {
        id: `ev-${Date.now()}`, 
        agent: formData.agent, 
        date: formData.date,
        criteria: { communication: Number(formData.comm), resolution: Number(formData.res), empathy: Number(formData.emp) },
        total: average, 
        comments: formData.comments, 
        evaluator: user.name,
        audioFile: audioData 
      };

      try {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'addEvaluation', ...newEval })
        });
        
        const resEvals = await fetch(`${API_URL}?action=getEvaluations`);
        const fetchedEvals = await resEvals.json();
        
        const formattedEvals = fetchedEvals.map(ev => ({
          id: ev.id || ev.ID,
          agent: ev.agent || ev.Operador || ev.Atendente,
          date: ev.date || ev.Data,
          criteria: {
            communication: Number(ev.communication || ev.Comunicacao || 0),
            resolution: Number(ev.resolution || ev.Resolucao || 0),
            empathy: Number(ev.empathy || ev.Empatia || 0)
          },
          total: Number(ev.total || ev.Total || 0),
          comments: ev.comments || ev.Feedback || ev.Comentarios,
          evaluator: ev.evaluator || ev.Avaliador,
          audioUrl: ev.Audio || ev.audioUrl || ev.audio || '' 
        })).sort((a, b) => new Date(b.date) - new Date(a.date));

        setEvaluations(formattedEvals);
        showToast('Avaliação gravada com sucesso!');
        setCurrentView('history');
      } catch (err) {
        showToast('Erro ao salvar avaliação. Tente novamente.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="max-w-3xl mx-auto panel p-6 md:p-8 animate-subtle-zoom relative">
        {isLoading && (
          <div className="absolute inset-0 bg-console-panel/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-panel">
            <Loader2 className="w-8 h-8 text-signal-teal animate-spin mb-3" />
            <p className="text-console-ink font-medium text-sm">A gravar no Google Drive...</p>
            <p className="plate-label mt-1">Pode demorar alguns segundos.</p>
          </div>
        )}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-console-ink">Nova Avaliação</h2>
          <span className="plate-label">Canal de Monitoria</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="plate-label mb-1.5 block">Operador</label>
              <select value={formData.agent} onChange={e => setFormData({...formData, agent: e.target.value})} className="screen w-full p-3 text-console-ink text-sm focus:outline-none focus:ring-2 focus:ring-signal-teal/50">
                {operatorsList.map(op => <option key={op.id} value={op.name}>{op.name}</option>)}
                {operatorsList.length === 0 && <option value="">Nenhum operador cadastrado</option>}
              </select>
            </div>
            <div>
              <label className="plate-label mb-1.5 block">Data</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required className="screen w-full p-3 text-console-ink text-sm focus:outline-none focus:ring-2 focus:ring-signal-teal/50" style={{ colorScheme: isDarkMode ? 'dark' : 'light' }} />
            </div>
          </div>

          <div className="bg-console-panel2 p-6 rounded-panel border border-console-line space-y-5">
            <h3 className="plate-label flex items-center mb-2"><Star className="w-3.5 h-3.5 text-signal-teal mr-2" />Critérios</h3>
            {[{ id: 'comm', label: 'Comunicação' }, { id: 'res', label: 'Resolução' }, { id: 'emp', label: 'Empatia' }].map((crit) => (
              <CriterionFader key={crit.id} label={crit.label} value={formData[crit.id]} onChange={e => setFormData({...formData, [crit.id]: e.target.value})} />
            ))}
          </div>

          <div className="flex justify-between items-center screen p-4">
            <span className="plate-label">Nota Final</span>
            <span className="text-2xl font-mono font-bold" style={{ color: zoneColor(average) }}>{average}%</span>
          </div>

          <div className="p-5 border border-dashed border-console-line rounded-panel bg-console-panel2 hover:border-signal-teal/50 transition-colors">
            <label className="plate-label mb-3 flex items-center">
              <Mic className="w-3.5 h-3.5 mr-2 text-signal-teal" />
              Evidência (Gravação da Ligação)
            </label>
            
            {audioFileName ? (
              <div className="flex items-center justify-between screen p-3">
                <div className="flex items-center truncate">
                  <Paperclip className="w-4 h-4 mr-2 text-signal-teal flex-shrink-0" />
                  <span className="text-sm font-medium text-console-ink truncate">{audioFileName}</span>
                </div>
                <button type="button" onClick={() => { setAudioData(null); setAudioFileName(""); }} className="p-1 hover:text-[#D96A56] text-console-sub rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleAudioUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center py-4 text-console-sub pointer-events-none">
                  <div className="screen p-2 mb-2">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Clique para anexar ficheiro de áudio</span>
                  <span className="plate-label mt-1 normal-case tracking-normal">Formatos: MP3, WAV, M4A (Máx: 5MB)</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="plate-label mb-1.5 block">Feedback</label>
            <textarea rows={3} value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} className="screen w-full p-3 text-console-ink text-sm focus:outline-none focus:ring-2 focus:ring-signal-teal/50 resize-none" />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isLoading} className="px-6 py-3 bg-signal-teal hover:bg-signal-tealDim text-console-bg rounded-module font-bold text-sm uppercase tracking-wide transition-all disabled:opacity-50 flex items-center">
              Registar e Guardar no Drive
            </button>
          </div>
        </form>
      </div>
    );
  };

  const HistoryView = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEval, setSelectedEval] = useState(null); 
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ date: '', comm: 100, res: 100, emp: 100, comments: '' });
    const [editAudioData, setEditAudioData] = useState(null);
    const [editAudioFileName, setEditAudioFileName] = useState("");
    const [removeAudio, setRemoveAudio] = useState(false);

    const displayData = filteredEvaluations.filter(ev => 
      ev.agent.toLowerCase().includes(searchTerm.toLowerCase()) || ev.comments.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startEdit = () => {
      setEditForm({
        date: selectedEval.date,
        comm: selectedEval.criteria.communication,
        res: selectedEval.criteria.resolution,
        emp: selectedEval.criteria.empathy,
        comments: selectedEval.comments
      });
      setIsEditing(true);
      setRemoveAudio(false);
      setEditAudioData(null);
      setEditAudioFileName("");
    };

    const handleEditAudioUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) return showToast("Escolha um áudio até 5MB.", "error");

      setEditAudioFileName(file.name);
      setRemoveAudio(false); 
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditAudioData({ base64: event.target.result.split(',')[1], name: file.name, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    };

    const submitEdit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      
      const average = Math.round((Number(editForm.comm) + Number(editForm.res) + Number(editForm.emp)) / 3);
      
      const payload = {
        action: 'editEvaluation',
        id: selectedEval.id,
        date: editForm.date,
        criteria: { communication: Number(editForm.comm), resolution: Number(editForm.res), empathy: Number(editForm.emp) },
        total: average,
        comments: editForm.comments,
        evaluator: user.name, 
        audioFile: editAudioData,
        removeAudio: removeAudio
      };

      try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        
        const resEvals = await fetch(`${API_URL}?action=getEvaluations`);
        const fetchedEvals = await resEvals.json();
        
        const formattedEvals = fetchedEvals.map(ev => ({
          id: ev.id || ev.ID,
          agent: ev.agent || ev.Operador || ev.Atendente,
          date: ev.date || ev.Data,
          criteria: { communication: Number(ev.communication || 0), resolution: Number(ev.resolution || 0), empathy: Number(ev.empathy || 0) },
          total: Number(ev.total || 0),
          comments: ev.comments || ev.Feedback || ev.Comentarios,
          evaluator: ev.evaluator || ev.Avaliador,
          audioUrl: ev.Audio || ev.audioUrl || ev.audio || '' 
        })).sort((a, b) => new Date(b.date) - new Date(a.date));

        setEvaluations(formattedEvals);
        
        const updatedEval = formattedEvals.find(e => e.id === selectedEval.id);
        setSelectedEval(updatedEval);
        setIsEditing(false);
        showToast('Avaliação corrigida com sucesso!');
      } catch (err) {
        showToast('Erro ao corrigir a avaliação.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const deleteEval = async () => {
      if(!window.confirm("Atenção: Tem a certeza que deseja APAGAR PERMANENTEMENTE esta avaliação?")) return;
      setIsLoading(true);
      try {
        await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'deleteEvaluation', id: selectedEval.id })
        });
        
        setEvaluations(evaluations.filter(ev => ev.id !== selectedEval.id));
        setSelectedEval(null);
        showToast('Avaliação eliminada com sucesso!');
      } catch (err) {
        showToast('Erro ao apagar avaliação.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    // FUNÇÃO PARA GERAR O PDF DO LAUDO PADRONIZADO
    const handlePrintReport = () => {
      const printWindow = window.open('', '', 'width=800,height=900');
      const dateStr = new Date(selectedEval.date).toLocaleDateString('pt-PT');
      
      const html = `
        <!DOCTYPE html>
        <html lang="pt">
          <head>
            <meta charset="UTF-8">
            <title>Laudo de Monitoria - ${selectedEval.agent}</title>
            <style>
              body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 2px solid #2E7A75; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { margin: 0; color: #1e293b; font-size: 26px; text-transform: uppercase; letter-spacing: 1.5px; }
              .header p { margin: 5px 0 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
              .section { margin-bottom: 30px; }
              .section-title { font-size: 15px; font-weight: bold; color: #2E7A75; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
              .info-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
              .info-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; display: block; font-weight: bold; letter-spacing: 0.5px; }
              .info-value { font-size: 16px; font-weight: 600; color: #0f172a; }
              .score-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center; }
              .score-box { padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; }
              .score-box.final { background: #2E7A75; color: white; border-color: #2E7A75; }
              .score-box.final .info-label { color: #DCEFEE; }
              .score-box.final .info-value { color: white; font-size: 24px; }
              .feedback-box { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap; font-size: 14px; color: #1e293b; min-height: 100px; }
              .signatures { margin-top: 80px; display: flex; justify-content: space-between; }
              .sig-line { width: 45%; border-top: 1px solid #94a3b8; text-align: center; padding-top: 10px; font-size: 13px; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
              .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
              
              /* Regras Específicas para quando a janela de Impressão abrir */
              @media print {
                body { padding: 0; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .score-box.final { background-color: #2E7A75 !important; color: white !important; border-color: #2E7A75 !important; }
                .score-box.final .info-label { color: #DCEFEE !important; }
                .score-box.final .info-value { color: white !important; }
                .info-box, .feedback-box { background-color: #f8fafc !important; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Leahpar Note</h1>
              <p>Laudo Oficial de Monitoria de Qualidade</p>
            </div>
            
            <div class="section">
              <div class="section-title">Dados do Atendimento</div>
              <div class="info-grid">
                <div class="info-box"><span class="info-label">Operador Avaliado</span><span class="info-value">${selectedEval.agent}</span></div>
                <div class="info-box"><span class="info-label">Avaliador Responsável</span><span class="info-value">${selectedEval.evaluator}</span></div>
                <div class="info-box"><span class="info-label">Data da Monitoria</span><span class="info-value">${dateStr}</span></div>
                <div class="info-box"><span class="info-label">ID da Avaliação</span><span class="info-value" style="font-size: 13px; font-family: monospace;">${selectedEval.id}</span></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Desempenho e Notas</div>
              <div class="score-grid">
                <div class="score-box final">
                  <span class="info-label">Nota Final</span>
                  <span class="info-value">${selectedEval.total}%</span>
                </div>
                <div class="score-box">
                  <span class="info-label">Comunicação</span>
                  <span class="info-value">${selectedEval.criteria.communication}%</span>
                </div>
                <div class="score-box">
                  <span class="info-label">Resolução</span>
                  <span class="info-value">${selectedEval.criteria.resolution}%</span>
                </div>
                <div class="score-box">
                  <span class="info-label">Empatia</span>
                  <span class="info-value">${selectedEval.criteria.empathy}%</span>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Feedback e Recomendações (PDI)</div>
              <div class="feedback-box">${selectedEval.comments || 'Nenhuma observação registada pelo avaliador.'}</div>
            </div>

            <div class="signatures">
              <div class="sig-line">Assinatura do Avaliador<br><span style="font-size: 10px; font-weight: normal; text-transform: none;">(${selectedEval.evaluator})</span></div>
              <div class="sig-line">Assinatura do Operador<br><span style="font-size: 10px; font-weight: normal; text-transform: none;">(${selectedEval.agent})</span></div>
            </div>

            <div class="footer">
              Documento gerado pelo sistema Leahpar Note &copy; ${new Date().getFullYear()}<br>
              Validação de integridade do ID: ${selectedEval.id}
            </div>

            <script>
              // Aciona a janela de impressão assim que o conteúdo HTML carregar
              window.onload = function() { 
                setTimeout(function() { 
                  window.print(); 
                  window.close(); 
                }, 500); 
              }
            </script>
          </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
    };

    const editAverage = isEditing ? Math.round((Number(editForm.comm) + Number(editForm.res) + Number(editForm.emp)) / 3) : 0;

    return (
      <div className="relative">
        <div className="panel overflow-hidden animate-subtle-zoom flex flex-col">
          <div className="p-6 border-b border-console-line flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-display font-bold text-console-ink">{user.role === 'Admin' ? 'Histórico Global' : 'Minhas Avaliações'}</h2>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-console-sub" />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="screen pl-10 pr-4 py-2 text-console-ink text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-signal-teal/50" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-console-panel2 border-b border-console-line">
                  {user.role === 'Admin' && <th className="p-4 plate-label">Operador</th>}
                  <th className="p-4 plate-label">Data</th>
                  <th className="p-4 plate-label text-center">Nota</th>
                  <th className="p-4 plate-label text-center">Gravação</th>
                  <th className="p-4 plate-label text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-console-line">
                {displayData.map((ev) => (
                  <tr 
                    key={ev.id} 
                    onClick={() => { setSelectedEval(ev); setIsEditing(false); }}
                    className="hover:bg-console-panel2 transition-colors group cursor-pointer"
                  >
                    {user.role === 'Admin' && <td className="p-4 font-medium text-console-ink text-sm">{ev.agent}</td>}
                    <td className="p-4 text-sm font-mono text-console-sub">{new Date(ev.date).toLocaleDateString('pt-PT')}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-2 font-mono font-bold text-sm" style={{ color: zoneColor(ev.total) }}>
                        <LedDot v={ev.total} /> {ev.total}%
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {ev.audioUrl && ev.audioUrl.startsWith('http') ? (
                         <div className="flex items-center justify-center text-signal-teal" title="Possui áudio gravado">
                           <Headphones className="w-4 h-4" />
                         </div>
                      ) : (
                        <span className="plate-label normal-case tracking-normal opacity-60">Sem áudio</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-signal-teal text-sm font-medium hover:underline">Ver Detalhes</button>
                    </td>
                  </tr>
                ))}
                {displayData.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-console-sub">
                      <AlertCircle className="w-7 h-7 mx-auto mb-3 opacity-50" />
                      Nenhuma avaliação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL / CARD (VISUALIZAR OU EDITAR) */}
        {selectedEval && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 transition-all" onClick={() => setSelectedEval(null)}>
            <div className="panel w-full max-w-2xl overflow-hidden animate-subtle-zoom flex flex-col relative" onClick={e => e.stopPropagation()}>
              
              {isLoading && (
                <div className="absolute inset-0 bg-console-panel/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-signal-teal animate-spin mb-2" />
                  <p className="font-medium text-console-ink text-sm">A processar alterações no Google Drive...</p>
                </div>
              )}

              <div className="p-6 border-b border-console-line flex justify-between items-center bg-console-panel2">
                <div>
                  <h2 className="text-lg font-display font-bold text-console-ink">
                    {isEditing ? "Corrigir Avaliação" : "Resumo da Avaliação"}
                  </h2>
                  <p className="plate-label mt-1 normal-case tracking-normal">Operador: <span className="font-semibold text-console-ink">{selectedEval.agent}</span></p>
                </div>
                
                <div className="flex items-center gap-1">
                  {!isEditing && (
                    <div className="flex items-center border-r border-console-line pr-2 mr-1">
                      {/* BOTÃO DE GERAR LAUDO PDF */}
                      <button onClick={handlePrintReport} className="p-2 text-signal-teal hover:bg-console-panel rounded-module transition-colors" title="Exportar Laudo em PDF">
                        <Printer className="w-4 h-4" />
                      </button>
                      
                      {user.role === 'Admin' && (
                        <>
                          <button onClick={startEdit} className="p-2 text-signal-teal hover:bg-console-panel rounded-module transition-colors" title="Corrigir notas, texto ou áudio">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={deleteEval} className="p-2 text-[#D96A56] hover:bg-console-panel rounded-module transition-colors" title="Apagar avaliação permanentemente">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  <button onClick={() => setSelectedEval(null)} className="p-2 text-console-sub hover:text-console-ink transition-colors rounded-module">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={submitEdit} className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
                  <div>
                    <label className="plate-label mb-1.5 block">Data da Avaliação</label>
                    <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} required className="screen w-full p-3 text-console-ink text-sm focus:outline-none focus:ring-2 focus:ring-signal-teal/50" style={{ colorScheme: isDarkMode ? 'dark' : 'light' }} />
                  </div>

                  <div className="bg-console-panel2 p-5 rounded-panel border border-console-line space-y-5">
                    {[{ id: 'comm', label: 'Comunicação' }, { id: 'res', label: 'Resolução' }, { id: 'emp', label: 'Empatia' }].map((crit) => (
                      <CriterionFader key={crit.id} label={crit.label} value={editForm[crit.id]} onChange={e => setEditForm({...editForm, [crit.id]: e.target.value})} />
                    ))}
                    <div className="pt-4 border-t border-console-line flex justify-between items-center">
                      <span className="plate-label">Nova Nota Final</span>
                      <span className="font-mono font-bold text-xl" style={{ color: zoneColor(editAverage) }}>{editAverage}%</span>
                    </div>
                  </div>

                  <div className="border border-console-line rounded-panel p-4 bg-console-panel2">
                    <label className="plate-label mb-3 flex items-center">
                      <Mic className="w-3.5 h-3.5 mr-2 text-signal-teal" /> Gravação do Atendimento
                    </label>
                    
                    {selectedEval.audioUrl && !removeAudio && !editAudioFileName ? (
                      <div className="flex items-center justify-between screen p-3">
                        <span className="text-sm font-medium text-console-ink flex items-center">
                          <Headphones className="w-4 h-4 mr-2 text-signal-teal" /> Áudio Original Mantido
                        </span>
                        <button type="button" onClick={() => setRemoveAudio(true)} className="text-xs px-2 py-1 text-[#D96A56] border border-[#D96A56]/40 rounded-module hover:bg-[#D96A56]/10 transition-colors font-bold">
                          Remover Áudio
                        </button>
                      </div>
                    ) : editAudioFileName ? (
                      <div className="flex items-center justify-between screen p-3">
                        <span className="text-sm font-medium text-console-ink truncate flex items-center">
                          <Paperclip className="w-4 h-4 mr-2 text-signal-teal" /> {editAudioFileName}
                        </span>
                        <button type="button" onClick={() => { setEditAudioData(null); setEditAudioFileName(""); }} className="text-[#D96A56] p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input type="file" accept="audio/*" onChange={handleEditAudioUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="flex flex-col items-center justify-center py-4 text-console-sub screen" style={{ borderStyle: 'dashed' }}>
                          <Plus className="w-4 h-4 mb-1" />
                          <span className="text-sm font-medium">Anexar um {removeAudio ? 'novo' : ''} ficheiro de áudio</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="plate-label mb-1.5 block">Corrigir Feedback</label>
                    <textarea rows={3} value={editForm.comments} onChange={e => setEditForm({...editForm, comments: e.target.value})} className="screen w-full p-3 text-console-ink text-sm focus:outline-none focus:ring-2 focus:ring-signal-teal/50 resize-none" />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 border border-console-line rounded-module font-medium text-console-ink hover:bg-console-panel2 transition-colors text-sm">
                      Cancelar
                    </button>
                    <button type="submit" className="px-5 py-2 bg-signal-teal text-console-bg rounded-module font-bold hover:bg-signal-tealDim transition-colors flex items-center text-sm uppercase tracking-wide">
                      <Save className="w-4 h-4 mr-2" /> Guardar Correção
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8">
                    <Gauge value={selectedEval.total} label="Nota Final" />

                    <div className="text-center sm:text-right screen p-3 w-full sm:w-auto">
                      <p className="plate-label mb-1">Data e Avaliador</p>
                      <p className="font-mono font-bold text-console-ink">{new Date(selectedEval.date).toLocaleDateString('pt-PT')}</p>
                      <p className="text-sm text-console-sub">{selectedEval.evaluator}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                    <div className="screen p-3">
                      <div className="plate-label mb-1">Comunicação</div>
                      <div className="font-mono font-bold text-console-ink text-lg">{selectedEval.criteria.communication}%</div>
                    </div>
                    <div className="screen p-3">
                      <div className="plate-label mb-1">Resolução</div>
                      <div className="font-mono font-bold text-console-ink text-lg">{selectedEval.criteria.resolution}%</div>
                    </div>
                    <div className="screen p-3">
                      <div className="plate-label mb-1">Empatia</div>
                      <div className="font-mono font-bold text-console-ink text-lg">{selectedEval.criteria.empathy}%</div>
                    </div>
                  </div>

                  <div className="bg-console-panel2 border border-console-line rounded-panel p-5 mb-6">
                    <h4 className="plate-label mb-2 flex items-center">
                      <MessageSquare className="w-3.5 h-3.5 mr-2 text-signal-teal" /> Recomendações e Observações (PDI)
                    </h4>
                    <p className="text-console-ink leading-relaxed text-sm whitespace-pre-wrap">
                      {selectedEval.comments || "Nenhuma observação registada."}
                    </p>
                  </div>

                  <div className="border-t border-console-line pt-6">
                    <h4 className="plate-label mb-4 flex items-center">
                      <Headphones className="w-3.5 h-3.5 mr-2 text-signal-teal" /> Gravação do Atendimento
                    </h4>
                    
                    {selectedEval.audioUrl && extractDriveId(selectedEval.audioUrl) ? (
                      <div className="flex flex-col gap-4">
                        <div className="w-full rounded-panel overflow-hidden screen">
                          <iframe src={`https://drive.google.com/file/d/${extractDriveId(selectedEval.audioUrl)}/preview`} width="100%" height="140" className="border-none" allow="autoplay"></iframe>
                        </div>
                        <div className="flex justify-end">
                          <a href={selectedEval.audioUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-signal-teal hover:text-signal-tealDim screen px-4 py-2 flex items-center transition-colors">
                            <Download className="w-4 h-4 mr-2" /> Download do Áudio
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="screen p-6 flex items-center justify-center" style={{ borderStyle: 'dashed' }}>
                        <p className="text-sm text-console-sub flex items-center"><Mic className="w-4 h-4 mr-2 opacity-50" /> Sem gravação anexada.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const UserManagementView = () => {
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Operador' });

    const handleAddUser = async (e) => {
      e.preventDefault();
      if(users.some(u => u.email === newUser.email)) return showToast('E-mail já cadastrado!', 'error');
      
      setIsLoading(true);
      const userObj = { ...newUser, id: Date.now() };
      
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'addUser', ...userObj })
        });
        
        const result = await response.json();
        
        if (result.success) {
          setUsers([...users, userObj]);
          showToast('Utilizador adicionado à base de dados!');
          setNewUser({ name: '', email: '', password: '', role: 'Operador' });
        } else {
          showToast(`Erro na base de dados: ${result.error}`, 'error');
        }
      } catch (err) {
        showToast('Erro ao criar utilizador na nuvem.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const handleDeleteUser = async (userId, userName) => {
      if (user.id === userId) return showToast('Você não pode excluir a sua própria conta!', 'error');
      if (!window.confirm(`Tem certeza que deseja excluir o utilizador ${userName}?`)) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'deleteUser', id: userId })
        });
        
        const result = await response.json();
        
        if (result.success) {
          setUsers(users.filter(u => u.id !== userId));
          showToast('Utilizador excluído com sucesso!');
        } else {
          showToast(`Erro na exclusão: ${result.error || 'Ação não encontrada.'}`, 'error');
        }
      } catch (err) {
        showToast('Erro de conexão ao excluir utilizador.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-subtle-zoom">
        <div className="lg:col-span-1">
          <div className="panel p-6 sticky top-24 relative">
             {isLoading && (
              <div className="absolute inset-0 bg-console-panel/90 backdrop-blur-sm z-10 flex items-center justify-center rounded-panel">
                <Loader2 className="w-6 h-6 text-signal-teal animate-spin" />
              </div>
            )}
            <h3 className="plate-label mb-4 flex items-center"><UserPlus className="w-3.5 h-3.5 mr-2 text-signal-teal"/> Novo Utilizador</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div><label className="plate-label mb-1 block">Nome Completo</label><input required type="text" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="screen w-full text-console-ink p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal-teal/50" /></div>
              <div><label className="plate-label mb-1 block">E-mail</label><input required type="email" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="screen w-full text-console-ink p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal-teal/50" /></div>
              <div><label className="plate-label mb-1 block">Palavra-passe Provisória</label><input required type="text" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="screen w-full text-console-ink p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal-teal/50" /></div>
              <div>
                <label className="plate-label mb-1 block">Cargo</label>
                <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="screen w-full text-console-ink p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal-teal/50">
                  <option value="Operador">Operador</option>
                  <option value="Admin">Administrador</option>
                </select>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-signal-teal hover:bg-signal-tealDim text-console-bg py-2.5 rounded-module font-bold text-sm uppercase tracking-wide transition-colors disabled:opacity-50">Criar Conta</button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="panel p-6">
            <h3 className="plate-label mb-4">Utilizadores Cadastrados (Planilha)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-console-line"><th className="pb-3 plate-label">Nome</th><th className="pb-3 plate-label">E-mail</th><th className="pb-3 plate-label">Cargo</th><th className="pb-3 plate-label text-right">Ação</th></tr></thead>
                <tbody className="divide-y divide-console-line">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-console-panel2 transition-colors">
                      <td className="py-3 font-medium text-console-ink text-sm">{u.name}</td>
                      <td className="py-3 text-sm text-console-sub">{u.email}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-module font-bold flex items-center w-max border ${u.role === 'Admin' ? 'text-signal-teal border-signal-teal/40 bg-signal-teal/10' : 'text-console-sub border-console-line'}`}>
                          {u.role === 'Admin' && <Shield className="w-3 h-3 mr-1"/>} {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          disabled={isLoading || u.id === user.id}
                          className={`p-2 rounded-module transition-colors ${u.id === user.id ? 'text-console-sub/40 cursor-not-allowed' : 'text-[#D96A56] hover:bg-console-panel2'}`}
                          title={u.id === user.id ? "Não pode excluir a si mesmo" : "Excluir utilizador"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                     <tr><td colSpan="4" className="py-4 text-center text-console-sub">Nenhum utilizador encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- LAYOUT E NAVEGAÇÃO ---
  if (!user) return renderLogin();

  const menuItems = user.role === 'Admin' ? [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'new', label: 'Nova Avaliação', icon: Plus },
    { id: 'history', label: 'Histórico Global', icon: History },
    { id: 'users', label: 'Gerir Utilizadores', icon: Users },
  ] : [
    { id: 'dashboard', label: 'O Meu Desempenho', icon: LayoutDashboard },
    { id: 'history', label: 'Minhas Avaliações', icon: History },
  ];

  return (
    <div className="min-h-screen bg-console-bg rack-texture flex flex-col md:flex-row text-console-ink font-sans selection:bg-signal-teal/25">
      <style>{customAnimations}</style>
      <ConsoleToast toast={toast} />

      <aside className="w-64 bg-console-panel2 border-r border-console-line text-console-sub flex-col hidden md:flex sticky top-0 h-screen z-20">
        <div className="p-6">
          <div onClick={() => setCurrentView('dashboard')} className="flex items-center text-console-ink mb-8 gap-3 cursor-pointer">
            <div className="screen p-2.5 relative">
              <GaugeIcon className="w-5 h-5 text-signal-teal" />
              <span className="led led-on absolute top-1 right-1" style={{ background: '#7BC17A', color: '#7BC17A' }} />
            </div>
            <span className="text-lg font-display font-bold tracking-tight text-console-ink">Leahpar<span className="text-signal-teal">Note</span></span>
          </div>
          <nav className="space-y-1 flex-1 border-l border-console-line pl-3">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => {
                setCurrentView(item.id);
                if (item.id === 'history') markEvalsAsSeen();
              }} className={`w-full flex items-center px-3 py-3 rounded-module transition-all text-sm ${currentView === item.id ? 'bg-console-panel text-signal-teal font-semibold' : 'hover:bg-console-panel hover:text-console-ink'}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-3 ${currentView === item.id ? 'bg-signal-teal' : 'bg-console-line'}`} />
                <item.icon className="w-4 h-4 mr-2.5" /> {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-console-line">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center justify-center px-4 py-2.5 mb-4 text-xs font-medium uppercase tracking-wide text-console-sub hover:text-signal-teal hover:bg-console-panel rounded-module transition-all border border-console-line">
            {isDarkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          </button>
          
          <div className="flex items-center mb-5">
            <div className="w-9 h-9 rounded-module screen flex items-center justify-center text-signal-teal font-mono font-bold mr-3">{user.name.charAt(0)}</div>
            <div>
              <p className="text-sm font-bold text-console-ink truncate w-32">{user.name}</p>
              <p className="text-xs text-signal-teal font-medium">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-console-sub hover:text-[#D96A56] hover:bg-console-panel rounded-module transition-all">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen max-w-7xl mx-auto w-full relative">
        
        {/* POPUP DE NOVA AVALIAÇÃO DISCRETO NO TOPO */}
        {newEvalsCount > 0 && currentView !== 'history' && (
          <div className="fixed top-24 right-6 z-40 animate-subtle-zoom cursor-pointer" onClick={() => { setCurrentView('history'); markEvalsAsSeen(); }}>
            <div className="panel flex items-start px-4 py-3 hover:border-signal-teal/50 transition-colors">
              <div className="screen p-2 mr-3">
                <BellRing className="w-4 h-4 text-signal-teal animate-led-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-console-ink">Nova Avaliação!</h4>
                <p className="plate-label normal-case tracking-normal mt-0.5">Você tem {newEvalsCount} nova(s) avaliação(ões).</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); markEvalsAsSeen(); }} className="ml-4 text-console-sub hover:text-console-ink transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <header className="bg-console-panel/90 backdrop-blur-md border-b border-console-line px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-display font-bold text-console-ink tracking-tight">{menuItems.find(i => i.id === currentView)?.label || currentView}</h1>
          </div>
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="md:hidden panel p-2 text-console-sub hover:text-signal-teal transition-colors">
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="flex items-center panel p-1">
              <div className="px-3 py-1.5 text-console-sub flex items-center"><Calendar className="w-3.5 h-3.5 mr-2" /><span className="plate-label hidden sm:block">Período</span></div>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="screen text-sm font-mono font-bold text-signal-teal py-1.5 px-3 cursor-pointer focus:outline-none">
                <option value="all">Visão Geral</option>
                <option value="2026-05">Maio 2026</option>
                <option value="2026-04">Abril 2026</option>
                <option value="2026-03">Março 2026</option>
                <option value="2026-02">Fevereiro 2026</option>
                <option value="2026-01">Janeiro 2026</option>
              </select>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8">
          <div key={currentView} className="h-full">
            {currentView === 'dashboard' && (user.role === 'Admin' ? <DashboardAdmin /> : <DashboardOperator />)}
            {currentView === 'new' && user.role === 'Admin' && <NewEvaluationView />}
            {currentView === 'history' && <HistoryView />}
            {currentView === 'users' && user.role === 'Admin' && <UserManagementView />}
          </div>
        </div>

        <footer className="mt-auto py-6 border-t border-console-line bg-console-panel/50 backdrop-blur-sm text-center w-full z-10 pb-20 md:pb-6">
          <p className="plate-label">
            Desenvolvido por <span className="text-signal-teal font-semibold">Leahpar Code</span> &copy; 2026
          </p>
        </footer>
      </main>

      <nav className="md:hidden bg-console-panel/95 backdrop-blur-md border-t border-console-line fixed bottom-0 w-full flex justify-around p-2 pb-safe z-30">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => {
            setCurrentView(item.id);
            if (item.id === 'history') markEvalsAsSeen();
          }} className={`flex flex-col items-center p-2 rounded-module transition-all ${currentView === item.id ? 'text-signal-teal bg-console-panel2' : 'text-console-sub'}`}>
            <item.icon className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}