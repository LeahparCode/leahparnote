import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  LayoutDashboard, ClipboardList, History, LogOut, Search, Users,
  MessageSquare, Gauge as GaugeIcon, Plus, Download, AlertCircle,
  UserPlus, Shield, Lightbulb, Loader2, Trash2, Moon, Sun,
  Mic, Paperclip, X, Headphones, Edit3, Save, Printer, BellRing, Code2,
  ArrowRight, ArrowUpRight, Check, AudioLines, Quote, Trophy
} from 'lucide-react';

// =========================================================================
// ⚠️ COLOQUE O SEU LINK DO GOOGLE APPS SCRIPT AQUI DENTRO DAS ASPAS:
// Exemplo: "https://script.google.com/macros/s/AKfycb.../exec"
// =========================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbwkLmDty91rgYrZt3Q_OD0PejZhoNjTU-JvAx6n2Kr1KdzV87B6ubKAkWkRW6O3Qyhy/exec";

// --- ZONA DE LEITURA (verde / âmbar / vermelho), via tokens do tema ---
const zoneToken = (v) => (v >= 80 ? 'good' : v >= 60 ? 'warn' : 'bad');
const zoneColor = (v) => `rgb(var(--${zoneToken(v)}))`;
const zoneTint = (v, a) => `rgb(var(--${zoneToken(v)}) / ${a})`;
const zoneLabel = (v) => (v >= 80 ? 'Dentro da meta' : v >= 60 ? 'Em atenção' : 'Abaixo da meta');

const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

// Separa o título para pôr a última palavra em itálico serifado
const splitTitle = (label = '') => {
  const words = label.split(' ');
  return [words.slice(0, -1).join(' '), words[words.length - 1]];
};

// --- COMPONENTES AUXILIARES ---

// Número que conta até o valor
const CountUp = ({ value, decimals = 0, suffix = '' }) => {
  const target = Number(value) || 0;
  const [n, setN] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    let raf;
    const from = fromRef.current;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 900);
      fromRef.current = from + (target - from) * (1 - Math.pow(1 - p, 3));
      setN(fromRef.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <>{n.toFixed(decimals)}{suffix}</>;
};

// Marca: três barras de áudio + ponto de sinal
const LogoMark = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <rect width="64" height="64" rx="16" fill="rgb(var(--rail-ink))" />
    <g fill="rgb(var(--rail))">
      <rect x="14" y="26" width="5" height="12" rx="2.5" />
      <rect x="23" y="18" width="5" height="28" rx="2.5" />
      <rect x="32" y="23" width="5" height="18" rx="2.5" />
    </g>
    <circle cx="46" cy="32" r="5" fill="rgb(var(--signal))" />
  </svg>
);

const Wordmark = ({ className = '' }) => (
  <span className={`font-display text-[28px] leading-none tracking-tight ${className}`}>
    Leahpar<em className="text-brand">note</em>
  </span>
);

// Equalizador decorativo
const EqBars = ({ count = 24, className = '', barClass = 'bg-brand' }) => (
  <div className={`flex items-end gap-[3px] ${className}`} aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <span
        key={i}
        className={`eq-bar w-[3px] rounded-full ${barClass}`}
        style={{
          height: `${30 + ((i * 37) % 70)}%`,
          animationDelay: `${(i * 97) % 1200}ms`,
          animationDuration: `${900 + ((i * 53) % 700)}ms`,
        }}
      />
    ))}
  </div>
);

// Indicador de status (usado em tabelas e listas)
const LedDot = ({ v, pulse = false }) => (
  <span
    className={`led led-on ${pulse ? 'animate-led-pulse' : ''}`}
    style={{ background: zoneColor(v), color: zoneColor(v) }}
  />
);

// Interruptor de tema
const ThemeSwitch = ({ isDark, onToggle, tone = 'paper' }) => (
  <button
    type="button"
    onClick={onToggle}
    role="switch"
    aria-checked={isDark}
    aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    title={isDark ? 'Modo claro' : 'Modo escuro'}
    className={`relative inline-flex items-center w-[60px] h-8 rounded-full border transition-colors shrink-0 ${
      tone === 'rail' ? 'border-railInk/15 bg-railInk/5 hover:bg-railInk/10' : 'border-line bg-surface hover:border-ink/25'
    }`}
  >
    <Sun className={`absolute left-2 w-3.5 h-3.5 transition-opacity ${isDark ? 'opacity-40' : 'opacity-0'} ${tone === 'rail' ? 'text-railInk' : 'text-sub'}`} />
    <Moon className={`absolute right-2 w-3.5 h-3.5 transition-opacity ${isDark ? 'opacity-0' : 'opacity-40'} ${tone === 'rail' ? 'text-railInk' : 'text-sub'}`} />
    <span
      className="absolute top-[3px] left-[3px] w-6 h-6 rounded-full bg-brand flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,.25)] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
      style={{ transform: `translateX(${isDark ? 28 : 0}px)` }}
    >
      {isDark ? <Moon className="w-3 h-3 text-white" /> : <Sun className="w-3 h-3 text-white" />}
    </span>
  </button>
);

// Mostrador com marcações — elemento de assinatura para exibir notas
const Gauge = ({ value = 0, size = 180, label }) => {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(v));
    return () => cancelAnimationFrame(id);
  }, [v]);

  const ticks = 45;
  const cx = size / 2;
  const rOuter = size / 2 - 4;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {Array.from({ length: ticks }).map((_, i) => {
            const t = i / (ticks - 1);
            const a = ((-135 + t * 270) * Math.PI) / 180;
            const major = i % 11 === 0;
            const r1 = rOuter - (major ? 18 : 12);
            const lit = t * 100 <= shown && shown > 0;
            return (
              <line
                key={i}
                x1={cx + r1 * Math.sin(a)} y1={cx - r1 * Math.cos(a)}
                x2={cx + rOuter * Math.sin(a)} y2={cx - rOuter * Math.cos(a)}
                stroke={lit ? zoneColor(v) : 'rgb(var(--line))'}
                strokeWidth={major ? 3 : 2}
                strokeLinecap="round"
                style={{ transition: 'stroke .3s ease', transitionDelay: `${i * 14}ms` }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-medium tabular-nums text-[2.6rem] leading-none tracking-tight text-ink">
            <CountUp value={v} />
            <span className="text-lg text-sub">%</span>
          </span>
          <span className="mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ color: zoneColor(v), background: zoneTint(v, 0.1) }}>
            {zoneLabel(v)}
          </span>
        </div>
      </div>
      {label && <span className="font-display italic text-lg text-sub -mt-3">{label}</span>}
    </div>
  );
};

// Barra fina de pontuação
const ScoreBar = ({ value, className = '' }) => (
  <div className={`h-1.5 rounded-full bg-line/70 overflow-hidden ${className}`}>
    <div className="h-full rounded-full animate-grow-x" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: zoneColor(value) }} />
  </div>
);

// Cartão de indicador (KPI)
const MeterCard = ({ index, title, value, icon: Icon, subtitle, variant, delayClass = "" }) => {
  const ink = variant === 'ink';
  return (
    <div className={`panel spot p-6 flex flex-col justify-between min-h-[168px] animate-rise ${delayClass} ${ink ? 'panel-ink' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-baseline gap-2">
          <span className={`font-mono text-[11px] ${ink ? 'opacity-50' : 'text-brand'}`}>{index}</span>
          <span className={`text-sm font-medium ${ink ? 'opacity-80' : 'text-sub'}`}>{title}</span>
        </div>
        <Icon className={`w-[18px] h-[18px] ${ink ? 'opacity-60' : 'text-sub'}`} strokeWidth={1.75} />
      </div>
      <div>
        <div className="text-[2.75rem] leading-none tracking-tight tabular-nums font-mono font-medium mt-6 truncate">{value}</div>
        {subtitle && <div className={`mt-2 text-sm ${ink ? 'opacity-70' : 'text-sub'}`}>{subtitle}</div>}
      </div>
    </div>
  );
};

// Gráfico de colunas com linha de meta
const ConsoleBarChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.value), 100);
  const goal = 80;
  return (
    <div className="relative mt-8">
      <div className="absolute inset-x-0 top-0 h-56 pointer-events-none">
        {[0, 25, 50, 75, 100].map(g => (
          <div key={g} className="absolute inset-x-0 border-t border-line/70" style={{ bottom: `${(g / maxVal) * 100}%` }}>
            <span className="absolute -top-2 -left-0 font-mono text-[10px] text-sub/70 bg-surface pr-1">{g}</span>
          </div>
        ))}
        <div className="absolute inset-x-0 border-t border-dashed border-brand z-10" style={{ bottom: `${(goal / maxVal) * 100}%` }}>
          <span className="absolute -top-[9px] right-0 font-mono text-[10px] text-brand bg-surface pl-1.5">meta {goal}</span>
        </div>
      </div>
      <div className="relative flex items-end justify-between h-56 gap-3 pl-7">
        {data.map((item, idx) => {
          const heightPercent = `${(item.value / maxVal) * 100}%`;
          const empty = item.value <= 0;
          return (
            <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center group">
              <div className="w-full max-w-[44px] h-full flex flex-col justify-end items-center">
                {empty ? (
                  <div className="w-full h-1 rounded-full bg-line" />
                ) : (
                  <div
                    className="w-full rounded-[6px] animate-grow-y relative overflow-hidden transition-[filter] group-hover:brightness-110"
                    style={{ height: heightPercent, background: zoneColor(item.value), animationDelay: `${idx * 70}ms` }}
                  >
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
                    <span className="absolute top-2 inset-x-0 text-center font-mono text-[10px] sm:text-[11px] tabular-nums text-white/90">
                      {item.value.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between gap-3 pl-7 mt-3">
        {data.map((item, idx) => (
          <span key={idx} className="flex-1 text-center text-xs text-sub truncate">{item.label}</span>
        ))}
      </div>
    </div>
  );
};

// Slider de critério
const CriterionFader = ({ label, hint, value, onChange }) => {
  const v = Number(value);
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-end justify-between gap-4 mb-1">
        <div>
          <span className="text-[15px] font-semibold text-ink">{label}</span>
          {hint && <p className="text-xs text-sub mt-0.5">{hint}</p>}
        </div>
        <span className="font-mono text-2xl tabular-nums leading-none" style={{ color: zoneColor(v) }}>
          {v}<span className="text-sm text-sub">%</span>
        </span>
      </div>
      <input
        type="range" min="0" max="100" value={value} onChange={onChange}
        className="fader" aria-label={label}
        style={{ '--val': `${v}%`, '--fill': zoneColor(v) }}
      />
    </div>
  );
};

// Notificação (toast)
const ConsoleToast = ({ toast }) => {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className="fixed top-5 inset-x-0 z-[60] flex justify-center px-4 pointer-events-none">
      <div key={toast.message} className="animate-rise pointer-events-auto relative overflow-hidden rounded-full bg-ink text-paper pl-2 pr-5 py-2 flex items-center gap-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,.45)]">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center ${isError ? 'bg-bad' : 'bg-good'}`}>
          {isError ? <AlertCircle className="w-4 h-4 text-white" /> : <Check className="w-4 h-4 text-white" strokeWidth={3} />}
        </span>
        <span className="text-sm font-medium">{toast.message}</span>
        <span className={`toast-bar absolute left-0 bottom-0 h-[2px] w-full ${isError ? 'bg-bad' : 'bg-brand'}`} />
      </div>
    </div>
  );
};

// Crédito de rodapé com mini logo e link para o portfólio
const BrandCredit = ({ tone = 'paper' }) => (
  <p className={`text-xs flex items-center justify-center gap-1.5 flex-wrap ${tone === 'rail' ? 'text-railInk/50' : 'text-sub'}`}>
    Desenvolvido por
    <a
      href="https://leahparcode.onrender.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 font-semibold transition-colors ${tone === 'rail' ? 'text-railInk hover:text-brand' : 'text-ink hover:text-brand'}`}
    >
      <span className="w-4 h-4 rounded-[5px] bg-brand flex items-center justify-center shrink-0">
        <Code2 className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
      </span>
      Leahpar Code
    </a>
    <span className="font-mono">© 2026</span>
  </p>
);

// Sobreposição de carregamento
const BusyOverlay = ({ title, hint, className = 'rounded-[14px]' }) => (
  <div className={`absolute inset-0 bg-surface/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-fade ${className}`}>
    <EqBars count={9} className="h-8 mb-4" />
    <p className="text-ink font-medium text-sm">{title}</p>
    {hint && <p className="text-xs text-sub mt-1">{hint}</p>}
  </div>
);

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

  // Luz que acompanha o cursor nos cartões com .spot
  useEffect(() => {
    const onMove = (e) => {
      const el = e.target.closest?.('.spot');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // --- TELAS ---
  const renderLogin = () => (
    <div className="min-h-screen flex bg-paper font-sans">
      <ConsoleToast toast={toast} />

      {/* Lado editorial */}
      <aside className="hidden lg:flex w-[52%] bg-rail text-railInk relative overflow-hidden flex-col justify-between p-12 xl:p-16">
        <div className="absolute -right-40 -top-40 w-[520px] h-[520px] rounded-full bg-brand/20 blur-[120px]" />
        <div className="relative flex items-center gap-3 animate-rise">
          <LogoMark className="w-10 h-10" />
          <Wordmark className="text-railInk" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 mb-8 animate-rise d1">
            <span className="w-2 h-2 rounded-full bg-brand animate-led-pulse" />
            <span className="font-mono text-xs text-railInk/60">monitoria de qualidade · em escuta</span>
          </div>
          <h1 className="font-display text-[clamp(3.2rem,5.4vw,5.6rem)] leading-[0.95] tracking-[-0.02em] animate-rise d2">
            Cada chamada<br />conta uma <em className="text-brand">história.</em>
          </h1>
          <p className="mt-6 max-w-md text-railInk/60 text-[15px] leading-relaxed animate-rise d3">
            Avalie atendimentos, anexe gravações e transforme feedback em evolução real da equipa — num só lugar.
          </p>
          <EqBars count={56} className="h-24 mt-12 animate-rise d4" barClass="bg-railInk/25 [&:nth-child(7n+3)]:bg-brand" />
        </div>

        <div className="relative -mx-12 xl:-mx-16 border-t border-railInk/10 pt-5 overflow-hidden">
          <div className="marquee flex w-max gap-10 font-mono text-xs text-railInk/40 whitespace-nowrap">
            {[0, 1].map(k => (
              <div key={k} className="flex gap-10">
                {['Comunicação', 'Resolução', 'Empatia', 'Laudos em PDF', 'Gravações anexadas', 'Ranking da equipa', 'Planos de desenvolvimento'].map(t => (
                  <span key={t} className="flex items-center gap-10">{t}<span className="text-brand">✦</span></span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Formulário */}
      <main className="flex-1 flex flex-col app-bg relative">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2.5 lg:invisible">
            <LogoMark className="w-8 h-8" />
            <Wordmark className="text-2xl" />
          </div>
          <ThemeSwitch isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[380px]">
            <span className="idx animate-rise">01 — Acesso</span>
            <h2 className="font-display text-5xl leading-none tracking-tight mt-3 animate-rise d1">
              Bem-vindo <em>de volta</em>
            </h2>
            <p className="text-sub mt-3 text-[15px] animate-rise d2">Entre com as credenciais registadas na planilha da equipa.</p>

            <form className="space-y-5 mt-10 animate-rise d3" onSubmit={handleLogin}>
              <div>
                <label className="field-label" htmlFor="login-email">E-mail</label>
                <input id="login-email" name="email" type="email" required autoComplete="email" placeholder="nome@empresa.com" className="field" />
              </div>

              <div>
                <label className="field-label" htmlFor="login-password">Palavra-passe</label>
                <input id="login-password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" className="field" />
              </div>

              <button type="submit" disabled={isLoading} className="btn btn-primary w-full h-12 mt-2">
                {isLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> A ligar à nuvem…</>
                  : <>Entrar no sistema <ArrowRight className="arrow w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-2 text-xs text-sub animate-rise d4">
              <Shield className="w-3.5 h-3.5" />
              Ligação cifrada · sessão guardada neste dispositivo
            </div>
          </div>
        </div>

        <div className="p-6">
          <BrandCredit />
        </div>
      </main>
    </div>
  );

  const DashboardAdmin = () => {
    const ranking = Object.entries(kpis.agentScores || {})
      .map(([name, data]) => ({ name, score: data.total / data.count, count: data.count }))
      .sort((a, b) => b.score - a.score).slice(0, 5);

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <MeterCard index="01" variant="ink" title="Média geral da operação" value={<CountUp value={kpis.avgScore} decimals={1} suffix="%" />} icon={GaugeIcon} subtitle={zoneLabel(kpis.avgScore)} delayClass="d1" />
          <MeterCard index="02" title="Monitorias realizadas" value={<CountUp value={kpis.totalEvals} />} icon={ClipboardList} subtitle="no período selecionado" delayClass="d2" />
          <MeterCard
            index="03" title="Destaque do período" icon={Trophy} delayClass="d3"
            value={<span className="font-display font-normal text-[2.6rem] tracking-tight">{kpis.bestAgent.name}</span>}
            subtitle={<>média de <span className="font-mono text-ink">{kpis.bestAgent.score.toFixed(1)}%</span></>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 panel p-6 lg:p-7 animate-rise d4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="idx">04</span>
                <h3 className="font-display text-[28px] leading-tight mt-1">
                  {selectedMonth === 'all' ? <>Evolução <em>mensal</em></> : <>Média por <em>operador</em></>}
                </h3>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs text-sub mt-2">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-good" />≥ 80</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-warn" />60–79</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-bad" />&lt; 60</span>
              </div>
            </div>
            <ConsoleBarChart data={chartData} />
          </div>

          <div className="panel p-6 lg:p-7 flex flex-col animate-rise d5">
            <span className="idx">05</span>
            <h3 className="font-display text-[28px] leading-tight mt-1 mb-5">Ranking <em>da equipa</em></h3>
            <ol className="flex-1 -mx-2">
              {ranking.map((agent, idx) => (
                <li key={agent.name} className="group flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-surfaceMuted/70 transition-colors">
                  <span className={`font-display italic text-3xl w-6 text-center leading-none ${idx === 0 ? 'text-brand' : 'text-sub/60'}`}>{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-ink truncate">{agent.name}</span>
                      <span className="font-mono text-sm tabular-nums" style={{ color: zoneColor(agent.score) }}>{agent.score.toFixed(1)}</span>
                    </div>
                    <ScoreBar value={agent.score} className="mt-2" />
                  </div>
                </li>
              ))}
              {ranking.length === 0 && (
                <li className="text-sm text-sub text-center py-10 flex flex-col items-center gap-3">
                  <EqBars count={7} className="h-6 opacity-40" barClass="bg-sub" />
                  Ainda não há avaliações neste período.
                </li>
              )}
            </ol>
          </div>
        </div>
      </div>
    );
  };

  const DashboardOperator = () => (
    <div className="space-y-5">
      <div className="panel panel-ink p-8 lg:p-10 relative overflow-hidden animate-rise">
        <EqBars count={40} className="absolute right-8 bottom-0 h-28 opacity-30 hidden sm:flex" barClass="bg-current" />
        <div className="relative z-10 max-w-xl">
          <span className="font-mono text-xs opacity-60">painel do operador</span>
          <h2 className="font-display text-5xl lg:text-6xl leading-none tracking-tight mt-3">
            Olá, <em>{user.name.split(' ')[0]}</em>.
          </h2>
          <p className="opacity-70 mt-4 text-[15px]">Aqui está o resumo da sua performance no período selecionado.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MeterCard index="01" title="A sua média de qualidade" value={<CountUp value={kpis.avgScore} decimals={1} suffix="%" />} icon={GaugeIcon} subtitle={kpis.totalEvals > 0 ? zoneLabel(kpis.avgScore) : 'sem avaliações ainda'} delayClass="d1" />
        <MeterCard index="02" title="Avaliações recebidas" value={<CountUp value={kpis.totalEvals} />} icon={ClipboardList} subtitle="no período selecionado" delayClass="d2" />
      </div>

      {kpis.recommendation && (
        <div className="panel p-6 lg:p-8 animate-rise d3 grid md:grid-cols-[auto,1fr] gap-6">
          <div className="w-12 h-12 rounded-full bg-warn/15 text-warn flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <span className="idx">03 — Próximo passo</span>
            <h3 className="font-display text-3xl leading-tight mt-1">Onde pode <em>evoluir</em></h3>
            <p className="text-sub text-[15px] mt-2 max-w-2xl">{kpis.recommendation}</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[['Comunicação', kpis.avgComm], ['Resolução', kpis.avgRes], ['Empatia', kpis.avgEmp]].map(([label, val]) => (
                <div key={label}>
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="text-sub">{label}</span>
                    <span className="font-mono tabular-nums" style={{ color: zoneColor(val) }}>{val.toFixed(0)}%</span>
                  </div>
                  <ScoreBar value={val} className="mt-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!kpis.recommendation && kpis.totalEvals > 0 && (
        <div className="panel p-6 lg:p-8 flex items-center gap-5 animate-rise d3">
          <div className="w-12 h-12 rounded-full bg-good/15 text-good flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-3xl leading-tight">Excelente <em>trabalho</em>!</h3>
            <p className="text-sub text-[15px] mt-1">A sua nota está acima da meta. Continue a manter a alta qualidade nos seus atendimentos.</p>
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


    const criteriaList = [
      { id: 'comm', label: 'Comunicação', hint: 'Clareza, tom de voz e linguagem adequada' },
      { id: 'res', label: 'Resolução', hint: 'O problema ficou resolvido no primeiro contacto?' },
      { id: 'emp', label: 'Empatia', hint: 'Escuta ativa e acolhimento do cliente' },
    ];

    return (
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-5 items-start">
        <div className="space-y-5">
          <section className="panel p-6 lg:p-7 animate-rise d1">
            <span className="idx">01</span>
            <h3 className="font-display text-[28px] leading-tight mt-1 mb-5">Quem e <em>quando</em></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="field-label">Operador</label>
                <select value={formData.agent} onChange={e => setFormData({...formData, agent: e.target.value})} className="field">
                  {operatorsList.map(op => <option key={op.id} value={op.name}>{op.name}</option>)}
                  {operatorsList.length === 0 && <option value="">Nenhum operador cadastrado</option>}
                </select>
              </div>
              <div>
                <label className="field-label">Data do atendimento</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required className="field font-mono" />
              </div>
            </div>
          </section>

          <section className="panel p-6 lg:p-7 animate-rise d2">
            <span className="idx">02</span>
            <h3 className="font-display text-[28px] leading-tight mt-1 mb-5">Critérios <em>de avaliação</em></h3>
            <div className="divide-y divide-line">
              {criteriaList.map((crit) => (
                <CriterionFader key={crit.id} label={crit.label} hint={crit.hint} value={formData[crit.id]} onChange={e => setFormData({...formData, [crit.id]: e.target.value})} />
              ))}
            </div>
          </section>

          <section className="panel p-6 lg:p-7 animate-rise d3">
            <span className="idx">03</span>
            <h3 className="font-display text-[28px] leading-tight mt-1 mb-5">Evidência <em>e feedback</em></h3>

            {audioFileName ? (
              <div className="flex items-center gap-4 rounded-xl border border-line bg-surfaceMuted/60 p-4">
                <div className="w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
                  <AudioLines className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{audioFileName}</p>
                  <p className="text-xs text-sub mt-0.5">Pronto para enviar ao Drive</p>
                </div>
                <EqBars count={10} className="h-6 hidden sm:flex" />
                <button type="button" onClick={() => { setAudioData(null); setAudioFileName(""); }} className="btn btn-icon is-danger" title="Remover ficheiro">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="group relative flex items-center gap-4 rounded-xl border border-dashed border-line hover:border-brand hover:bg-brand/[0.04] p-5 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="sr-only"
                />
                <div className="w-11 h-11 rounded-full border border-line bg-surface flex items-center justify-center shrink-0 group-hover:border-brand group-hover:text-brand transition-colors">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">Anexar gravação da ligação</p>
                  <p className="text-xs text-sub mt-0.5">MP3, WAV ou M4A · até 5 MB</p>
                </div>
                <span className="btn btn-ghost btn-sm pointer-events-none">Escolher</span>
              </label>
            )}

            <div className="mt-5">
              <label className="field-label">Feedback para o operador</label>
              <textarea rows={4} value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} placeholder="Pontos fortes, oportunidades e combinados para a próxima chamada…" className="field resize-none" />
            </div>
          </section>
        </div>

        {/* Resumo ao vivo */}
        <aside className="panel p-6 lg:sticky lg:top-32 animate-rise d4 relative">
          {isLoading && <BusyOverlay title="A gravar no Google Drive…" hint="Pode demorar alguns segundos." />}
          <div className="flex items-center justify-between">
            <span className="idx">04 — Resultado</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-sub"><span className="w-1.5 h-1.5 rounded-full bg-brand animate-led-pulse" />ao vivo</span>
          </div>
          <div className="py-6 flex justify-center">
            <Gauge value={average} label="nota final" />
          </div>
          <dl className="space-y-2.5 text-sm border-t border-line pt-5">
            {criteriaList.map(c => (
              <div key={c.id} className="flex justify-between">
                <dt className="text-sub">{c.label}</dt>
                <dd className="font-mono tabular-nums">{formData[c.id]}%</dd>
              </div>
            ))}
            <div className="flex justify-between">
              <dt className="text-sub">Operador</dt>
              <dd className="font-medium truncate max-w-[60%] text-right">{formData.agent || '—'}</dd>
            </div>
          </dl>
          <button type="submit" disabled={isLoading} className="btn btn-primary w-full h-12 mt-6">
            Registar e guardar <ArrowRight className="arrow w-4 h-4" />
          </button>
        </aside>
      </form>
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
              .header { text-align: center; border-bottom: 2px solid #17140F; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { margin: 0; color: #17140F; font-family: Georgia, 'Times New Roman', serif; font-weight: normal; font-size: 34px; letter-spacing: -0.5px; }
              .header p { margin: 5px 0 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
              .section { margin-bottom: 30px; }
              .section-title { font-size: 15px; font-weight: bold; color: #E0420A; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
              .info-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
              .info-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; display: block; font-weight: bold; letter-spacing: 0.5px; }
              .info-value { font-size: 16px; font-weight: 600; color: #0f172a; }
              .score-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center; }
              .score-box { padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; }
              .score-box.final { background: #17140F; color: white; border-color: #17140F; }
              .score-box.final .info-label { color: #F3EFE6; }
              .score-box.final .info-value { color: white; font-size: 24px; }
              .feedback-box { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap; font-size: 14px; color: #1e293b; min-height: 100px; }
              .signatures { margin-top: 80px; display: flex; justify-content: space-between; }
              .sig-line { width: 45%; border-top: 1px solid #94a3b8; text-align: center; padding-top: 10px; font-size: 13px; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
              .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
              
              /* Regras Específicas para quando a janela de Impressão abrir */
              @media print {
                body { padding: 0; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .score-box.final { background-color: #17140F !important; color: white !important; border-color: #17140F !important; }
                .score-box.final .info-label { color: #F3EFE6 !important; }
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


    const criteriaEdit = [{ id: 'comm', label: 'Comunicação' }, { id: 'res', label: 'Resolução' }, { id: 'emp', label: 'Empatia' }];

    return (
      <div className="relative">
        <div className="panel overflow-hidden animate-rise flex flex-col">
          <div className="p-6 lg:px-7 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="idx">{displayData.length} {displayData.length === 1 ? 'registo' : 'registos'}</span>
              <h2 className="font-display text-[28px] leading-tight mt-1">
                {user.role === 'Admin' ? <>Todas as <em>monitorias</em></> : <>O seu <em>histórico</em></>}
              </h2>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
              <input type="text" placeholder="Procurar operador ou feedback…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="field pl-10 rounded-full w-full md:w-80" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-y border-line bg-surfaceMuted/50">
                  {user.role === 'Admin' && <th className="px-7 py-3 plate-label font-normal">Operador</th>}
                  <th className={`py-3 plate-label font-normal ${user.role === 'Admin' ? 'px-4' : 'px-7'}`}>Data</th>
                  <th className="px-4 py-3 plate-label font-normal">Nota</th>
                  <th className="px-4 py-3 plate-label font-normal text-center">Gravação</th>
                  <th className="px-7 py-3 plate-label font-normal text-right"><span className="sr-only">Ação</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {displayData.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => { setSelectedEval(ev); setIsEditing(false); }}
                    className="group cursor-pointer transition-colors hover:bg-surfaceMuted/60"
                  >
                    {user.role === 'Admin' && (
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-surfaceMuted border border-line text-[11px] font-semibold flex items-center justify-center text-ink shrink-0">{initials(ev.agent)}</span>
                          <span className="font-medium text-ink text-sm">{ev.agent}</span>
                        </div>
                      </td>
                    )}
                    <td className={`py-4 font-mono text-[13px] text-sub ${user.role === 'Admin' ? 'px-4' : 'px-7'}`}>{new Date(ev.date).toLocaleDateString('pt-PT')}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <LedDot v={ev.total} />
                        <span className="font-mono text-sm tabular-nums w-10" style={{ color: zoneColor(ev.total) }}>{ev.total}%</span>
                        <ScoreBar value={ev.total} className="w-20 hidden sm:block" />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {ev.audioUrl && ev.audioUrl.startsWith('http') ? (
                         <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand bg-brand/10 px-2.5 py-1 rounded-full" title="Possui áudio gravado">
                           <Headphones className="w-3.5 h-3.5" /> Áudio
                         </span>
                      ) : (
                        <span className="text-xs text-sub/60">—</span>
                      )}
                    </td>
                    <td className="px-7 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-sub group-hover:text-ink transition-colors">
                        Abrir <ArrowUpRight className="arrow w-4 h-4 group-hover:text-brand" />
                      </span>
                    </td>
                  </tr>
                ))}
                {displayData.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-sub">
                      <div className="flex flex-col items-center gap-3">
                        <EqBars count={7} className="h-6 opacity-40" barClass="bg-sub" />
                        <span className="font-display italic text-2xl text-ink/70">Silêncio por aqui.</span>
                        <span className="text-sm">Nenhuma avaliação encontrada.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL / CARD (VISUALIZAR OU EDITAR) */}
        {selectedEval && (
          <div className="fixed inset-0 bg-[#0b0a08]/55 backdrop-blur-[6px] z-50 flex items-end sm:items-center justify-center sm:p-6 animate-fade" onClick={() => setSelectedEval(null)}>
            <div className="panel w-full max-w-2xl overflow-hidden animate-sheet flex flex-col relative rounded-b-none sm:rounded-b-[14px] max-h-[92vh] shadow-[0_40px_80px_-20px_rgba(0,0,0,.5)]" onClick={e => e.stopPropagation()}>

              {isLoading && <BusyOverlay title="A processar alterações no Google Drive…" className="" />}

              <div className="px-6 sm:px-7 pt-6 pb-5 border-b border-line flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <span className="idx">{isEditing ? 'Modo de correção' : 'Avaliação'} · <span className="text-sub">{new Date(selectedEval.date).toLocaleDateString('pt-PT')}</span></span>
                  <h2 className="font-display text-4xl leading-none tracking-tight mt-2 truncate">
                    {isEditing ? <>Corrigir <em>avaliação</em></> : selectedEval.agent}
                  </h2>
                  {isEditing && <p className="text-sm text-sub mt-1.5">Operador: <span className="text-ink font-medium">{selectedEval.agent}</span></p>}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!isEditing && (
                    <>
                      <button onClick={handlePrintReport} className="btn btn-icon" title="Exportar laudo em PDF">
                        <Printer className="w-4 h-4" />
                      </button>
                      {user.role === 'Admin' && (
                        <>
                          <button onClick={startEdit} className="btn btn-icon" title="Corrigir notas, texto ou áudio">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={deleteEval} className="btn btn-icon is-danger" title="Apagar avaliação permanentemente">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <span className="w-px h-6 bg-line mx-1" />
                    </>
                  )}
                  <button onClick={() => setSelectedEval(null)} className="btn btn-icon" title="Fechar">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={submitEdit} className="p-6 sm:p-7 overflow-y-auto space-y-6">
                  <div>
                    <label className="field-label">Data da avaliação</label>
                    <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} required className="field font-mono" />
                  </div>

                  <div className="rounded-xl border border-line p-5">
                    <div className="divide-y divide-line">
                      {criteriaEdit.map((crit) => (
                        <CriterionFader key={crit.id} label={crit.label} value={editForm[crit.id]} onChange={e => setEditForm({...editForm, [crit.id]: e.target.value})} />
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-line flex justify-between items-center">
                      <span className="font-display italic text-xl text-sub">nova nota final</span>
                      <span className="font-mono text-3xl tabular-nums" style={{ color: zoneColor(editAverage) }}>{editAverage}<span className="text-base text-sub">%</span></span>
                    </div>
                  </div>

                  <div>
                    <label className="field-label">Gravação do atendimento</label>
                    {selectedEval.audioUrl && !removeAudio && !editAudioFileName ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surfaceMuted/60 p-3 pl-4">
                        <span className="text-sm font-medium text-ink flex items-center gap-2">
                          <Headphones className="w-4 h-4 text-brand" /> Áudio original mantido
                        </span>
                        <button type="button" onClick={() => setRemoveAudio(true)} className="btn btn-danger btn-sm">
                          Remover
                        </button>
                      </div>
                    ) : editAudioFileName ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surfaceMuted/60 p-3 pl-4">
                        <span className="text-sm font-medium text-ink truncate flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-brand shrink-0" /> {editAudioFileName}
                        </span>
                        <button type="button" onClick={() => { setEditAudioData(null); setEditAudioFileName(""); }} className="btn btn-icon is-danger">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="group flex items-center gap-3 rounded-xl border border-dashed border-line hover:border-brand hover:bg-brand/[0.04] p-4 cursor-pointer transition-colors">
                        <input type="file" accept="audio/*" onChange={handleEditAudioUpload} className="sr-only" />
                        <Plus className="w-4 h-4 text-sub group-hover:text-brand" />
                        <span className="text-sm font-medium text-ink">Anexar {removeAudio ? 'um novo' : 'um'} ficheiro de áudio</span>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="field-label">Corrigir feedback</label>
                    <textarea rows={4} value={editForm.comments} onChange={e => setEditForm({...editForm, comments: e.target.value})} className="field resize-none" />
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-ghost">
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-ink">
                      <Save className="w-4 h-4" /> Guardar correção
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 sm:p-7 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-6 sm:gap-8 items-center mb-7">
                    <Gauge value={selectedEval.total} size={168} label="nota final" />

                    <div className="space-y-4">
                      {[['Comunicação', selectedEval.criteria.communication], ['Resolução', selectedEval.criteria.resolution], ['Empatia', selectedEval.criteria.empathy]].map(([label, val]) => (
                        <div key={label}>
                          <div className="flex justify-between items-baseline text-sm">
                            <span className="text-sub">{label}</span>
                            <span className="font-mono tabular-nums" style={{ color: zoneColor(val) }}>{val}%</span>
                          </div>
                          <ScoreBar value={val} className="mt-2" />
                        </div>
                      ))}
                      <p className="text-xs text-sub pt-1">Avaliado por <span className="text-ink font-medium">{selectedEval.evaluator}</span></p>
                    </div>
                  </div>

                  <div className="relative rounded-xl bg-surfaceMuted/60 border border-line p-5 pl-14 mb-7">
                    <Quote className="absolute left-5 top-5 w-5 h-5 text-brand" />
                    <h4 className="plate-label mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" /> Recomendações e observações (PDI)
                    </h4>
                    <p className="text-ink leading-relaxed text-[15px] whitespace-pre-wrap">
                      {selectedEval.comments || "Nenhuma observação registada."}
                    </p>
                  </div>

                  <div>
                    <h4 className="plate-label mb-3 flex items-center gap-1.5">
                      <Headphones className="w-3 h-3" /> Gravação do atendimento
                    </h4>

                    {selectedEval.audioUrl && extractDriveId(selectedEval.audioUrl) ? (
                      <div className="flex flex-col gap-3">
                        <div className="w-full rounded-xl overflow-hidden border border-line bg-surfaceMuted">
                          <iframe src={`https://drive.google.com/file/d/${extractDriveId(selectedEval.audioUrl)}/preview`} width="100%" height="140" className="border-none" allow="autoplay" title="Gravação do atendimento"></iframe>
                        </div>
                        <div className="flex justify-end">
                          <a href={selectedEval.audioUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                            <Download className="w-4 h-4" /> Descarregar áudio
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-line p-6 flex items-center justify-center">
                        <p className="text-sm text-sub flex items-center gap-2"><Mic className="w-4 h-4 opacity-50" /> Sem gravação anexada.</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-[340px,1fr] gap-5 items-start">
        <div className="panel p-6 lg:p-7 lg:sticky lg:top-32 relative animate-rise d1">
          {isLoading && <BusyOverlay title="A sincronizar com a planilha…" />}
          <span className="idx flex items-center gap-1.5"><UserPlus className="w-3 h-3" /> 01 — Novo acesso</span>
          <h3 className="font-display text-[28px] leading-tight mt-1 mb-6">Adicionar <em>pessoa</em></h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div><label className="field-label">Nome completo</label><input required type="text" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="field" /></div>
            <div><label className="field-label">E-mail</label><input required type="email" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="field" /></div>
            <div><label className="field-label">Palavra-passe provisória</label><input required type="text" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="field font-mono" /></div>
            <div>
              <label className="field-label">Cargo</label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-full border border-line bg-surfaceMuted/60">
                {[['Operador', 'Operador'], ['Admin', 'Administrador']].map(([val, label]) => (
                  <button
                    key={val} type="button"
                    onClick={() => setNewUser({...newUser, role: val})}
                    className={`h-9 rounded-full text-sm font-medium transition-all ${newUser.role === val ? 'bg-ink text-paper shadow-sm' : 'text-sub hover:text-ink'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="btn btn-primary w-full mt-2">
              Criar conta <ArrowRight className="arrow w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="panel overflow-hidden animate-rise d2">
          <div className="p-6 lg:px-7">
            <span className="idx">02 — {users.length} {users.length === 1 ? 'pessoa' : 'pessoas'}</span>
            <h3 className="font-display text-[28px] leading-tight mt-1">Equipa <em>registada</em></h3>
          </div>
          <ul className="divide-y divide-line border-t border-line">
            {users.map(u => (
              <li key={u.id} className="group flex items-center gap-4 px-6 lg:px-7 py-4 hover:bg-surfaceMuted/60 transition-colors">
                <span className={`w-10 h-10 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 ${u.role === 'Admin' ? 'bg-ink text-paper' : 'bg-surfaceMuted border border-line text-ink'}`}>
                  {initials(u.name)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink text-sm truncate flex items-center gap-2">
                    {u.name}
                    {u.id === user.id && <span className="font-mono text-[10px] text-brand">você</span>}
                  </p>
                  <p className="text-sm text-sub truncate">{u.email}</p>
                </div>
                <span className={`hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full font-medium items-center gap-1 ${u.role === 'Admin' ? 'text-brand bg-brand/10' : 'text-sub bg-surfaceMuted'}`}>
                  {u.role === 'Admin' && <Shield className="w-3 h-3"/>} {u.role}
                </span>
                <button
                  onClick={() => handleDeleteUser(u.id, u.name)}
                  disabled={isLoading || u.id === user.id}
                  className="btn btn-icon is-danger"
                  title={u.id === user.id ? "Não pode excluir a si mesmo" : "Excluir utilizador"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
            {users.length === 0 && (
               <li className="py-12 text-center text-sub text-sm">Nenhum utilizador encontrado.</li>
            )}
          </ul>
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

  const activeIndex = Math.max(0, menuItems.findIndex(i => i.id === currentView));
  const [titleHead, titleTail] = splitTitle(menuItems[activeIndex]?.label || currentView);
  const todayLabel = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

  const goTo = (id) => {
    setCurrentView(id);
    if (id === 'history') markEvalsAsSeen();
  };

  return (
    <div className="min-h-screen app-bg flex flex-col md:flex-row text-ink font-sans">
      <ConsoleToast toast={toast} />

      {/* Trilho lateral escuro — a "mesa de som" da monitoria */}
      <aside className="w-[264px] bg-rail text-railInk flex-col hidden md:flex sticky top-0 h-screen z-20 shrink-0">
        <div className="px-6 pt-7 pb-6">
          <button onClick={() => goTo('dashboard')} className="flex items-center gap-3 text-left">
            <LogoMark className="w-9 h-9" />
            <Wordmark className="text-railInk" />
          </button>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-railInk/10 px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-led-pulse" />
            <span className="font-mono text-[11px] text-railInk/60">em escuta · {kpis.totalEvals} monitorias</span>
          </div>
        </div>

        <div className="px-4">
          <p className="px-3 mb-2 font-mono text-[10px] text-railInk/35">navegação</p>
          <nav className="relative flex flex-col gap-1">
            {/* Indicador que desliza até à guia ativa */}
            <span
              aria-hidden="true"
              className="absolute left-0 right-0 top-0 h-12 rounded-xl bg-railInk/[0.07] border border-railInk/10 transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
              style={{ transform: `translateY(${activeIndex * 52}px)` }}
            >
              <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-brand" />
            </span>
            {menuItems.map((item, i) => {
              const active = currentView === item.id;
              const showBadge = item.id === 'history' && newEvalsCount > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => goTo(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative h-12 flex items-center gap-3 px-3 rounded-xl text-sm text-left whitespace-nowrap transition-colors ${active ? 'text-railInk' : 'text-railInk/55 hover:text-railInk'}`}
                >
                  <span className={`font-mono text-[11px] w-5 transition-colors ${active ? 'text-brand' : 'text-railInk/30'}`}>{String(i + 1).padStart(2, '0')}</span>
                  <item.icon className="w-4 h-4" strokeWidth={1.75} />
                  <span className={active ? 'font-medium' : ''}>{item.label}</span>
                  {showBadge && (
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-white text-[11px] font-semibold flex items-center justify-center">{newEvalsCount}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 space-y-3">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-railInk/50">{isDarkMode ? 'Modo escuro' : 'Modo claro'}</span>
            <ThemeSwitch isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} tone="rail" />
          </div>

          <div className="rounded-2xl border border-railInk/10 bg-railInk/[0.04] p-3 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold shrink-0 ring-2 ring-rail ring-offset-0">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="font-mono text-[11px] text-railInk/50">{user.role === 'Admin' ? 'administrador' : 'operador'}</p>
            </div>
            <button onClick={handleLogout} className="w-9 h-9 rounded-full flex items-center justify-center text-railInk/50 hover:text-white hover:bg-bad transition-colors shrink-0" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen min-w-0 relative">

        {/* AVISO DE NOVA AVALIAÇÃO */}
        {newEvalsCount > 0 && currentView !== 'history' && (
          <div className="fixed top-32 right-4 sm:right-6 z-40 animate-rise cursor-pointer" onClick={() => goTo('history')}>
            <div className="panel spot flex items-center gap-3 pl-3 pr-2 py-2.5 shadow-[0_20px_40px_-16px_rgba(0,0,0,.3)] hover:border-brand transition-colors">
              <span className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-semibold text-sm text-ink">Nova avaliação</h4>
                <p className="text-xs text-sub">Tem {newEvalsCount} {newEvalsCount === 1 ? 'nova avaliação' : 'novas avaliações'} para ler.</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); markEvalsAsSeen(); }} className="btn btn-icon ml-1" title="Dispensar">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <header className="sticky top-0 z-20 bg-paper/80 backdrop-blur-xl border-b border-line">
          <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-10 py-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] text-sub first-letter:uppercase">
                  <span className="text-brand">{String(activeIndex + 1).padStart(2, '0')}</span> / {todayLabel}
                </p>
                <h1 className="font-display text-[2.6rem] sm:text-5xl leading-[0.95] tracking-tight mt-1.5">
                  {titleHead} <em>{titleTail}</em>
                </h1>
              </div>
              <div className="md:hidden flex items-center gap-2 pt-1">
                <ThemeSwitch isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
                <button onClick={handleLogout} className="btn btn-icon border-line" title="Sair"><LogOut className="w-4 h-4" /></button>
              </div>
            </div>
            <label className="flex items-center gap-2 rounded-full border border-line bg-surface pl-4 pr-1 py-1 self-start sm:self-auto hover:border-ink/25 transition-colors">
              <span className="text-xs text-sub">Período</span>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="field h-9 rounded-full border-0 bg-surfaceMuted/70 text-sm font-medium focus:shadow-none w-auto">
                <option value="all">Visão geral</option>
                <option value="2026-05">Maio 2026</option>
                <option value="2026-04">Abril 2026</option>
                <option value="2026-03">Março 2026</option>
                <option value="2026-02">Fevereiro 2026</option>
                <option value="2026-01">Janeiro 2026</option>
              </select>
            </label>
          </div>
        </header>

        <div className="flex-1 max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-10 py-8">
          <div key={currentView} className="h-full">
            {currentView === 'dashboard' && (user.role === 'Admin' ? <DashboardAdmin /> : <DashboardOperator />)}
            {currentView === 'new' && user.role === 'Admin' && <NewEvaluationView />}
            {currentView === 'history' && <HistoryView />}
            {currentView === 'users' && user.role === 'Admin' && <UserManagementView />}
          </div>
        </div>

        <footer className="mt-auto py-6 border-t border-line w-full pb-28 md:pb-6">
          <BrandCredit />
        </footer>
      </main>

      {/* Dock móvel com indicador deslizante */}
      <nav className="md:hidden fixed bottom-3 inset-x-3 z-30 rounded-2xl bg-rail text-railInk p-1.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,.45)]">
        <div className="relative flex">
          <span
            aria-hidden="true"
            className="absolute top-0 bottom-0 rounded-xl bg-brand transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{ width: `${100 / menuItems.length}%`, transform: `translateX(${activeIndex * 100}%)` }}
          />
          {menuItems.map(item => {
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${active ? 'text-white' : 'text-railInk/55'}`}
              >
                <item.icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                <span className="text-[10px] font-medium leading-none truncate max-w-full px-1">{item.label}</span>
                {item.id === 'history' && newEvalsCount > 0 && !active && (
                  <span className="absolute top-1.5 right-1/4 w-2 h-2 rounded-full bg-brand ring-2 ring-rail" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
