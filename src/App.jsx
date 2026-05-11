import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, ClipboardList, History, LogOut, Search, TrendingUp, Users, 
  Star, Calendar, MessageSquare, Award, Plus, Download, AlertCircle, 
  UserPlus, Shield, Lightbulb, AlertTriangle, Loader2, Trash2, Moon, Sun, 
  Mic, Paperclip, X, Headphones, Edit3, Save, Smile, Meh, Frown, Printer, BellRing
} from 'lucide-react';

// =========================================================================
// ⚠️ COLOQUE O SEU LINK DO GOOGLE APPS SCRIPT AQUI DENTRO DAS ASPAS:
// Exemplo: "https://script.google.com/macros/s/AKfycb.../exec"
// =========================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbwkLmDty91rgYrZt3Q_OD0PejZhoNjTU-JvAx6n2Kr1KdzV87B6ubKAkWkRW6O3Qyhy/exec";

// --- ESTILOS DE ANIMAÇÃO ---
const customAnimations = `
  @keyframes subtle-zoom { 0% { opacity: 0; transform: scale(0.96) translateY(15px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
  .animate-subtle-zoom { animation: subtle-zoom 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
  @keyframes float-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
  .animate-float { animation: float-gentle 4s ease-in-out infinite; }
  @keyframes scale-y-up { 0% { transform: scaleY(0); opacity: 0; } 100% { transform: scaleY(1); opacity: 1; } }
  .animate-grow-y { transform-origin: bottom; animation: scale-y-up 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
  .delay-100 { animation-delay: 100ms; } .delay-200 { animation-delay: 200ms; } .delay-300 { animation-delay: 300ms; } .delay-400 { animation-delay: 400ms; } .delay-500 { animation-delay: 500ms; }
`;

// --- COMPONENTES AUXILIARES ---
const StatCard = ({ title, value, icon: Icon, trend, subtitle, colorClass, delayClass = "" }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 animate-subtle-zoom ${delayClass}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 dark:bg-opacity-20 transition-transform duration-500 hover:scale-110 hover:rotate-3`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {subtitle && (
      <div className="mt-4 flex items-center text-sm">
        {trend && (
          <span className={`font-medium mr-2 flex items-center ${trend >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
            <TrendingUp className={`w-3 h-3 mr-1 ${trend < 0 && 'rotate-180'}`} />
            {Math.abs(trend)}%
          </span>
        )}
        <span className="text-slate-400 dark:text-slate-500">{subtitle}</span>
      </div>
    )}
  </div>
);

const CustomBarChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.value), 100);
  return (
    <div className="flex items-end justify-between h-48 mt-6 gap-2">
      {data.map((item, idx) => {
        const heightPercent = `${(item.value / maxVal) * 100}%`;
        return (
          <div key={idx} className={`flex flex-col items-center flex-1 group animate-grow-y delay-${(idx + 1) * 100}`}>
            <div className="relative w-full flex justify-center h-full items-end pb-2">
              <div className="w-full max-w-[40px] bg-indigo-50 dark:bg-slate-700 rounded-t-lg relative transition-all duration-300 group-hover:bg-indigo-100 dark:group-hover:bg-slate-600" style={{ height: heightPercent }}>
                <div className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${item.value >= 80 ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-500' : item.value >= 60 ? 'bg-gradient-to-t from-amber-500 to-amber-400 dark:from-amber-600 dark:to-amber-500' : 'bg-gradient-to-t from-rose-500 to-rose-400 dark:from-rose-600 dark:to-rose-500'}`} style={{ height: `${item.value}%` }} />
                <div className="opacity-0 translate-y-2 group-hover:opacity-100 group-hover:-translate-y-2 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-600 text-white text-xs py-1.5 px-2.5 rounded-lg whitespace-nowrap transition-all z-10 shadow-lg font-medium">
                  {item.value.toFixed(1)} pts
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 dark:bg-slate-600 rotate-45"></div>
                </div>
              </div>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate w-full text-center group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.label}</span>
          </div>
        );
      })}
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-subtle-zoom">
          <div className={`flex items-center px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-md ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2" /> : <Award className="w-5 h-5 mr-2" />}
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}
      <style>{customAnimations}</style>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-50 dark:from-indigo-900/20 dark:via-slate-900 dark:to-slate-900 pointer-events-none transition-colors duration-300" />
      
      <div className="absolute top-6 right-6 z-20">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-subtle-zoom">
        <div className="flex justify-center items-center text-indigo-600 dark:text-indigo-400 mb-6 animate-float">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl shadow-indigo-100/50 dark:shadow-indigo-900/20">
            <Award className="w-12 h-12" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Leahpar <span className="text-indigo-600 dark:text-indigo-400">Note</span></h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">Monitoria de Qualidade</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-subtle-zoom delay-100">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-2xl shadow-slate-200/50 dark:shadow-black/40 sm:rounded-2xl sm:px-10 border border-slate-100/60 dark:border-slate-700/60 backdrop-blur-sm transition-colors duration-300">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="group">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">E-mail</label>
              <div className="mt-1 relative">
                <input
                  name="email" type="email" required
                  placeholder="Seu e-mail de acesso"
                  className="appearance-none block w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm transition-all duration-300"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">Palavra-passe</label>
              <div className="mt-1">
                <input
                  name="password" type="password" required
                  placeholder="Sua senha"
                  className="appearance-none block w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm transition-all duration-300"
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/20 dark:shadow-indigo-900/20 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Conectando à nuvem...</> : 'Entrar no Sistema'}
              </button>
            </div>
          </form>
          <div className="mt-6 border-t border-slate-100 dark:border-slate-700 pt-4 flex justify-center items-center">
            <Shield className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mr-1.5" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Acesso Seguro e Garantido</p>
          </div>
        </div>
        
        <div className="mt-8 text-center animate-subtle-zoom delay-200">
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
            Desenvolvido por <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 font-black tracking-wide">Leahpar Code</span> &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );

  const DashboardAdmin = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Média Geral da Operação" value={`${kpis.avgScore.toFixed(1)}%`} icon={Star} colorClass="bg-indigo-500 text-indigo-600 dark:bg-indigo-400 dark:text-indigo-400" delayClass="delay-100" />
        <StatCard title="Total de Monitorias" value={kpis.totalEvals} icon={ClipboardList} colorClass="bg-purple-500 text-purple-600 dark:bg-purple-400 dark:text-purple-400" delayClass="delay-200" />
        <StatCard title="Top Performance" value={kpis.bestAgent.name} icon={Award} subtitle={`Média de ${kpis.bestAgent.score.toFixed(1)}%`} colorClass="bg-emerald-500 text-emerald-600 dark:bg-emerald-400 dark:text-emerald-400" delayClass="delay-300" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm animate-subtle-zoom delay-400 transition-colors duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selectedMonth === 'all' ? 'Evolução Global (Visão Geral)' : 'Média por Operador no Mês'}</h3>
            <TrendingUp className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
          <CustomBarChart data={chartData} />
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col animate-subtle-zoom delay-500 transition-colors duration-300">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-slate-400 dark:text-slate-500" /> Ranking da Equipe</h3>
          <div className="flex-1 space-y-3">
            {Object.entries(kpis.agentScores || {})
            .map(([name, data]) => ({ name, score: data.total / data.count }))
            .sort((a, b) => b.score - a.score).slice(0, 5)
            .map((agent, idx) => (
              <div key={agent.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all border border-transparent dark:border-slate-700/30 hover:border-slate-100 dark:hover:border-slate-600">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${idx === 0 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>{idx + 1}</div>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{agent.name}</span>
                </div>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">{agent.score.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const DashboardOperator = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 dark:from-indigo-950 dark:to-black rounded-3xl p-8 text-white shadow-xl animate-subtle-zoom relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 rotate-12 scale-150"><Star className="w-64 h-64" /></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Olá, {user.name.split(' ')[0]}!</h2>
          <p className="text-indigo-200 dark:text-indigo-300/80">Aqui está o resumo da sua performance no período selecionado.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Sua Média de Qualidade" value={`${kpis.avgScore.toFixed(1)}%`} icon={Award} colorClass={kpis.avgScore >= 80 ? "bg-emerald-500 text-emerald-600 dark:bg-emerald-400 dark:text-emerald-400" : "bg-amber-500 text-amber-600 dark:bg-amber-400 dark:text-amber-400"} delayClass="delay-100" />
        <StatCard title="Avaliações Recebidas" value={kpis.totalEvals} icon={ClipboardList} colorClass="bg-indigo-500 text-indigo-600 dark:bg-indigo-400 dark:text-indigo-400" delayClass="delay-200" />
      </div>

      {kpis.recommendation && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4 animate-subtle-zoom delay-300">
          <div className="bg-amber-100 dark:bg-amber-800/50 p-3 rounded-full text-amber-600 dark:text-amber-400"><Lightbulb className="w-8 h-8" /></div>
          <div>
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center">
              Recomendação de Melhoria <AlertTriangle className="w-4 h-4 ml-2 text-amber-600 dark:text-amber-400" />
            </h3>
            <p className="text-amber-800 dark:text-amber-200/80">{kpis.recommendation}</p>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
               <div className="bg-white/60 dark:bg-black/20 rounded-lg p-2"><div className="text-xs text-slate-500 dark:text-slate-400">Comunicação</div><div className="font-bold text-amber-700 dark:text-amber-400">{kpis.avgComm.toFixed(0)}%</div></div>
               <div className="bg-white/60 dark:bg-black/20 rounded-lg p-2"><div className="text-xs text-slate-500 dark:text-slate-400">Resolução</div><div className="font-bold text-amber-700 dark:text-amber-400">{kpis.avgRes.toFixed(0)}%</div></div>
               <div className="bg-white/60 dark:bg-black/20 rounded-lg p-2"><div className="text-xs text-slate-500 dark:text-slate-400">Empatia</div><div className="font-bold text-amber-700 dark:text-amber-400">{kpis.avgEmp.toFixed(0)}%</div></div>
            </div>
          </div>
        </div>
      )}
      
      {!kpis.recommendation && kpis.totalEvals > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 flex items-center gap-4 animate-subtle-zoom delay-300">
          <div className="bg-emerald-100 dark:bg-emerald-800/50 p-3 rounded-full text-emerald-600 dark:text-emerald-400"><Award className="w-8 h-8" /></div>
          <div>
            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-300 mb-1">Parabéns pelo excelente trabalho!</h3>
            <p className="text-emerald-800 dark:text-emerald-200/80">A sua nota está acima da meta. Continue a manter a alta qualidade nos seus atendimentos.</p>
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
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm p-6 md:p-8 animate-subtle-zoom relative transition-colors duration-300">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl">
            <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
            <p className="text-indigo-900 dark:text-indigo-200 font-medium">A gravar no Google Drive...</p>
            <p className="text-xs text-indigo-500/80 dark:text-indigo-400/80 mt-1">Pode demorar alguns segundos.</p>
          </div>
        )}
        <div className="mb-8"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Avaliação</h2></div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Operador</label>
              <select value={formData.agent} onChange={e => setFormData({...formData, agent: e.target.value})} className="w-full border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500/50 p-3 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 border transition-colors">
                {operatorsList.map(op => <option key={op.id} value={op.name}>{op.name}</option>)}
                {operatorsList.length === 0 && <option value="">Nenhum operador cadastrado</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Data</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required className="w-full border-slate-200 dark:border-slate-600 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 border focus:ring-2 focus:ring-indigo-500/50 transition-colors text-sm sm:text-base" style={{ colorScheme: isDarkMode ? 'dark' : 'light' }} />
            </div>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-6">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center mb-4"><Star className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mr-2" />Critérios</h3>
            {[{ id: 'comm', label: 'Comunicação' }, { id: 'res', label: 'Resolução' }, { id: 'emp', label: 'Empatia' }].map((crit) => (
              <div key={crit.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
                <label className="sm:w-1/3 text-sm font-medium text-slate-700 dark:text-slate-300">{crit.label}</label>
                <div className="flex-1 flex items-center gap-4">
                  <input type="range" min="0" max="100" value={formData[crit.id]} onChange={e => setFormData({...formData, [crit.id]: e.target.value})} className="flex-1 accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                  <span className="w-12 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 py-1 rounded-lg shadow-sm">{formData[crit.id]}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
            <span className="font-semibold text-indigo-900 dark:text-indigo-300">Nota Final:</span>
            <span className={`text-3xl font-black ${average >= 80 ? 'text-emerald-500 dark:text-emerald-400' : average >= 60 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'}`}>{average}%</span>
          </div>

          <div className="p-5 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/30 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              <Mic className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" />
              Evidência (Gravação da Ligação)
            </label>
            
            {audioFileName ? (
              <div className="flex items-center justify-between bg-indigo-100/50 dark:bg-indigo-900/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                <div className="flex items-center truncate">
                  <Paperclip className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300 truncate">{audioFileName}</span>
                </div>
                <button type="button" onClick={() => { setAudioData(null); setAudioFileName(""); }} className="p-1 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded text-indigo-600 dark:text-indigo-400">
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
                <div className="flex flex-col items-center justify-center py-4 text-slate-500 dark:text-slate-400 pointer-events-none">
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-full shadow-sm mb-2">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Clique para anexar ficheiro de áudio</span>
                  <span className="text-xs mt-1 opacity-70">Formatos: MP3, WAV, M4A (Máx: 5MB)</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Feedback</label>
            <textarea rows={3} value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} className="w-full border-slate-200 dark:border-slate-600 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 border focus:ring-2 focus:ring-indigo-500/50 resize-none transition-colors" />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isLoading} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center">
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
              .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { margin: 0; color: #1e293b; font-size: 26px; text-transform: uppercase; letter-spacing: 1.5px; }
              .header p { margin: 5px 0 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
              .section { margin-bottom: 30px; }
              .section-title { font-size: 15px; font-weight: bold; color: #4f46e5; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
              .info-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
              .info-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; display: block; font-weight: bold; letter-spacing: 0.5px; }
              .info-value { font-size: 16px; font-weight: 600; color: #0f172a; }
              .score-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center; }
              .score-box { padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; }
              .score-box.final { background: #4f46e5; color: white; border-color: #4f46e5; }
              .score-box.final .info-label { color: #e0e7ff; }
              .score-box.final .info-value { color: white; font-size: 24px; }
              .feedback-box { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap; font-size: 14px; color: #1e293b; min-height: 100px; }
              .signatures { margin-top: 80px; display: flex; justify-content: space-between; }
              .sig-line { width: 45%; border-top: 1px solid #94a3b8; text-align: center; padding-top: 10px; font-size: 13px; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
              .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
              
              /* Regras Específicas para quando a janela de Impressão abrir */
              @media print {
                body { padding: 0; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .score-box.final { background-color: #4f46e5 !important; color: white !important; border-color: #4f46e5 !important; }
                .score-box.final .info-label { color: #e0e7ff !important; }
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden animate-subtle-zoom transition-colors duration-300 flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user.role === 'Admin' ? 'Histórico Global' : 'Minhas Avaliações'}</h2>
            </div>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 rounded-xl text-sm w-full md:w-64 focus:ring-2 focus:ring-indigo-500/50 transition-colors" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50">
                  {user.role === 'Admin' && <th className="p-4 font-semibold">Operador</th>}
                  <th className="p-4 font-semibold">Data</th>
                  <th className="p-4 font-semibold text-center">Nota</th>
                  <th className="p-4 font-semibold text-center">Gravação</th>
                  <th className="p-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {displayData.map((ev) => (
                  <tr 
                    key={ev.id} 
                    onClick={() => { setSelectedEval(ev); setIsEditing(false); }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer"
                  >
                    {user.role === 'Admin' && <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{ev.agent}</td>}
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{new Date(ev.date).toLocaleDateString('pt-PT')}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${ev.total >= 80 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : ev.total >= 60 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'}`}>{ev.total}%</span>
                    </td>
                    <td className="p-4 text-center">
                      {ev.audioUrl && ev.audioUrl.startsWith('http') ? (
                         <div className="flex items-center justify-center text-indigo-500 dark:text-indigo-400" title="Possui áudio gravado">
                           <Headphones className="w-5 h-5" />
                         </div>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600 italic">Sem áudio</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">Ver Detalhes</button>
                    </td>
                  </tr>
                ))}
                {displayData.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-500 dark:text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 transition-all" onClick={() => setSelectedEval(null)}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-subtle-zoom flex flex-col relative" onClick={e => e.stopPropagation()}>
              
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-2" />
                  <p className="font-medium text-slate-800 dark:text-slate-200">A processar alterações no Google Drive...</p>
                </div>
              )}

              <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    {isEditing ? "Corrigir Avaliação" : "Resumo da Avaliação"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Operador: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedEval.agent}</span></p>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <div className="flex items-center border-r border-slate-200 dark:border-slate-700 pr-3 mr-1">
                      {/* BOTÃO DE GERAR LAUDO PDF */}
                      <button onClick={handlePrintReport} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-xl transition-colors" title="Exportar Laudo em PDF">
                        <Printer className="w-5 h-5" />
                      </button>
                      
                      {user.role === 'Admin' && (
                        <>
                          <button onClick={startEdit} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-xl transition-colors" title="Corrigir notas, texto ou áudio">
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button onClick={deleteEval} className="p-2 text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 rounded-xl transition-colors" title="Apagar avaliação permanentemente">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  <button onClick={() => setSelectedEval(null)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors rounded-xl">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={submitEdit} className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Data da Avaliação</label>
                    <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} required className="w-full border-slate-200 dark:border-slate-600 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 border focus:ring-2 focus:ring-indigo-500/50" style={{ colorScheme: isDarkMode ? 'dark' : 'light' }} />
                  </div>

                  <div className="bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-5">
                    {[{ id: 'comm', label: 'Comunicação' }, { id: 'res', label: 'Resolução' }, { id: 'emp', label: 'Empatia' }].map((crit) => (
                      <div key={crit.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <label className="sm:w-1/3 text-sm font-medium text-slate-700 dark:text-slate-300">{crit.label}</label>
                        <div className="flex-1 flex items-center gap-4">
                          <input type="range" min="0" max="100" value={editForm[crit.id]} onChange={e => setEditForm({...editForm, [crit.id]: e.target.value})} className="flex-1 accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                          <span className="w-12 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 py-1 rounded-lg shadow-sm">{editForm[crit.id]}</span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Nova Nota Final:</span>
                      <span className={`font-black text-2xl ${editAverage >= 80 ? 'text-emerald-500' : editAverage >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>{editAverage}%</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                      <Mic className="w-4 h-4 mr-2 text-indigo-500" /> Gravação do Atendimento
                    </label>
                    
                    {selectedEval.audioUrl && !removeAudio && !editAudioFileName ? (
                      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center">
                          <Headphones className="w-4 h-4 mr-2 text-indigo-500" /> Áudio Original Mantido
                        </span>
                        <button type="button" onClick={() => setRemoveAudio(true)} className="text-xs px-2 py-1 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded hover:bg-rose-200 transition-colors font-bold">
                          Remover Áudio
                        </button>
                      </div>
                    ) : editAudioFileName ? (
                      <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                        <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300 truncate flex items-center">
                          <Paperclip className="w-4 h-4 mr-2" /> {editAudioFileName}
                        </span>
                        <button type="button" onClick={() => { setEditAudioData(null); setEditAudioFileName(""); }} className="text-rose-500 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input type="file" accept="audio/*" onChange={handleEditAudioUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="flex flex-col items-center justify-center py-4 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                          <Plus className="w-5 h-5 mb-1" />
                          <span className="text-sm font-medium">Anexar um {removeAudio ? 'novo' : ''} ficheiro de áudio</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Corrigir Feedback</label>
                    <textarea rows={3} value={editForm.comments} onChange={e => setEditForm({...editForm, comments: e.target.value})} className="w-full border-slate-200 dark:border-slate-600 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 border focus:ring-2 focus:ring-indigo-500/50 resize-none transition-colors" />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-medium shadow-md hover:bg-indigo-700 transition-colors flex items-center">
                      <Save className="w-4 h-4 mr-2" /> Guardar Correção
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      {selectedEval.total >= 80 ? <Smile className="w-16 h-16 text-emerald-500" /> : selectedEval.total >= 60 ? <Meh className="w-16 h-16 text-amber-500" /> : <Frown className="w-16 h-16 text-rose-500" />}
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Nota Final</p>
                        <p className={`text-5xl font-black tracking-tight ${selectedEval.total >= 80 ? 'text-emerald-500' : selectedEval.total >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                          {selectedEval.total}%
                        </p>
                      </div>
                    </div>

                    <div className="text-center sm:text-right bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 w-full sm:w-auto">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Data e Avaliador</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">{new Date(selectedEval.date).toLocaleDateString('pt-PT')}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{selectedEval.evaluator}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                      <div className="text-xs text-slate-500 uppercase font-medium mb-1">Comunicação</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">{selectedEval.criteria.communication}%</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                      <div className="text-xs text-slate-500 uppercase font-medium mb-1">Resolução</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">{selectedEval.criteria.resolution}%</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                      <div className="text-xs text-slate-500 uppercase font-medium mb-1">Empatia</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">{selectedEval.criteria.empathy}%</div>
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-5 mb-6">
                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2 text-indigo-500" /> Recomendações e Observações (PDI)
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                      {selectedEval.comments || "Nenhuma observação registada."}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700/50 pt-6">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                      <Headphones className="w-5 h-5 mr-2 text-slate-500" /> Gravação do Atendimento
                    </h4>
                    
                    {selectedEval.audioUrl && extractDriveId(selectedEval.audioUrl) ? (
                      <div className="flex flex-col gap-4">
                        <div className="w-full rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                          <iframe src={`https://drive.google.com/file/d/${extractDriveId(selectedEval.audioUrl)}/preview`} width="100%" height="140" className="border-none" allow="autoplay"></iframe>
                        </div>
                        <div className="flex justify-end">
                          <a href={selectedEval.audioUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 px-4 py-2 rounded-lg flex items-center transition-colors">
                            <Download className="w-4 h-4 mr-2" /> Download do Áudio
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-6 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500 flex items-center"><Mic className="w-5 h-5 mr-2 opacity-50" /> Sem gravação anexada.</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-subtle-zoom">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm sticky top-24 relative transition-colors duration-300">
             {isLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center"><UserPlus className="w-5 h-5 mr-2 text-indigo-500 dark:text-indigo-400"/> Novo Utilizador</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div><label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label><input required type="text" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 p-2 rounded-lg" /></div>
              <div><label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">E-mail</label><input required type="email" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 p-2 rounded-lg" /></div>
              <div><label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Palavra-passe Provisória</label><input required type="text" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 p-2 rounded-lg" /></div>
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Cargo</label>
                <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 p-2 rounded-lg">
                  <option value="Operador">Operador</option>
                  <option value="Admin">Administrador</option>
                </select>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50">Criar Conta</button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm transition-colors duration-300">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Utilizadores Cadastrados (Planilha)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-slate-100 dark:border-slate-700/50 text-sm text-slate-500 dark:text-slate-400"><th className="pb-3">Nome</th><th className="pb-3">E-mail</th><th className="pb-3">Cargo</th><th className="pb-3 text-right">Ação</th></tr></thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{u.name}</td>
                      <td className="py-3 text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-lg font-bold flex items-center w-max ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                          {u.role === 'Admin' && <Shield className="w-3 h-3 mr-1"/>} {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          disabled={isLoading || u.id === user.id}
                          className={`p-2 rounded-lg transition-colors ${u.id === user.id ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}
                          title={u.id === user.id ? "Não pode excluir a si mesmo" : "Excluir utilizador"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                     <tr><td colSpan="4" className="py-4 text-center text-slate-400">Nenhum utilizador encontrado.</td></tr>
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/50 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300">
      <style>{customAnimations}</style>
      
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-subtle-zoom">
          <div className={`flex items-center px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-md ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'}`}>
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex-col hidden md:flex sticky top-0 h-screen shadow-2xl z-20 transition-colors duration-300">
        <div className="p-6">
          <div onClick={() => setCurrentView('dashboard')} className="flex items-center text-white mb-8 gap-3 cursor-pointer">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 p-2.5 rounded-xl shadow-lg"><Award className="w-6 h-6 text-white" /></div>
            <span className="text-2xl font-bold tracking-tight">Leahpar<span className="text-indigo-400 dark:text-indigo-500">Note</span></span>
          </div>
          <nav className="space-y-1.5 flex-1">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => {
                setCurrentView(item.id);
                if (item.id === 'history') markEvalsAsSeen();
              }} className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all ${currentView === item.id ? 'bg-indigo-600/15 dark:bg-indigo-500/20 text-indigo-400 dark:text-indigo-300 font-semibold pl-6' : 'hover:bg-slate-800 dark:hover:bg-slate-900 hover:text-white hover:pl-6'}`}>
                <item.icon className="w-5 h-5 mr-3" /> {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-800/50 bg-slate-900/50 dark:bg-slate-950/80">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center justify-center px-4 py-2.5 mb-3 text-sm font-medium text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all border border-slate-800 hover:border-indigo-500/30">
            {isDarkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          </button>
          
          <div className="flex items-center mb-5 mt-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 flex items-center justify-center text-white font-bold mr-3">{user.name.charAt(0)}</div>
            <div>
              <p className="text-sm font-bold text-white truncate w-32">{user.name}</p>
              <p className="text-xs text-indigo-400 font-medium">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen max-w-7xl mx-auto w-full relative">
        
        {/* POPUP DE NOVA AVALIAÇÃO DISCRETO NO TOPO */}
        {newEvalsCount > 0 && currentView !== 'history' && (
          <div className="fixed top-24 right-6 z-40 animate-subtle-zoom cursor-pointer" onClick={() => { setCurrentView('history'); markEvalsAsSeen(); }}>
            <div className="flex items-start px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md bg-indigo-50/95 dark:bg-indigo-900/95 border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 transition-transform hover:scale-105">
              <div className="bg-indigo-200/50 dark:bg-indigo-800/80 p-2 rounded-full mr-3 animate-pulse">
                <BellRing className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Nova Avaliação!</h4>
                <p className="text-xs font-medium opacity-90 mt-0.5">Você tem {newEvalsCount} nova(s) avaliação(ões).</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); markEvalsAsSeen(); }} className="ml-4 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 transition-colors duration-300">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{menuItems.find(i => i.id === currentView)?.label || currentView}</h1>
          </div>
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="md:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm transition-colors duration-300">
              <div className="px-3 py-1.5 text-slate-400 dark:text-slate-500 flex items-center"><Calendar className="w-4 h-4 mr-2" /><span className="text-sm font-medium hidden sm:block">Período:</span></div>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 dark:bg-slate-700 text-sm font-bold text-indigo-700 dark:text-indigo-400 py-1.5 px-3 rounded-lg border-transparent focus:ring-0 cursor-pointer transition-colors duration-300">
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

        <footer className="mt-auto py-6 border-t border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-center w-full z-10 pb-20 md:pb-6 transition-colors duration-300">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Desenvolvido por <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-500 font-black tracking-wide">Leahpar Code</span> &copy; 2026
          </p>
        </footer>
      </main>

      <nav className="md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 fixed bottom-0 w-full flex justify-around p-2 pb-safe z-30 shadow-lg transition-colors duration-300">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => {
            setCurrentView(item.id);
            if (item.id === 'history') markEvalsAsSeen();
          }} className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentView === item.id ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 dark:text-slate-500'}`}>
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}