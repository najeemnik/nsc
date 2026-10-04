import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bot, Send, Sparkles, Building, Layers, CircleDot, Home, RefreshCw, X, MessageSquare } from 'lucide-react';
import { answerProjectQuestionLocally, ProjectContextSummary } from '../services/aiAssistantService';

export const AiAssistantModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentProject, steelRecords, concreteRecords, expenses, apartments, projects, t } = useApp();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `سلام! من دستیار هوش مصنوعی پروژه شما هستم. می‌توانید درباره میزان مصرف سیخ، حجم کانکریت، وضعیت مصارف، طلبکاری‌ها یا فروش آپارتمان‌ها از من بپرسید.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const projectSteel = steelRecords.filter(s => s.projectId === currentProject?.id);
  const totalSteelTons = projectSteel.reduce((acc, s) => acc + s.tons, 0);
  const steelCostUSD = projectSteel.reduce((acc, s) => acc + s.totalAmount, 0);

  const projectConcrete = concreteRecords.filter(c => c.projectId === currentProject?.id);
  const totalConcreteM3 = projectConcrete.reduce((acc, c) => acc + c.quantityM3, 0);
  const concreteCostUSD = projectConcrete.reduce((acc, c) => acc + c.totalAmount, 0);

  const projectExpenses = expenses.filter(e => e.projectId === currentProject?.id);
  const totalExpensesUSD = projectExpenses.reduce((acc, e) => acc + (e.amountInUSD || e.amount), 0);
  const totalPaidUSD = projectExpenses.reduce((acc, e) => acc + (e.paidAmount || 0), 0);
  const totalDebtUSD = projectExpenses.reduce((acc, e) => acc + (e.remainingAmount || 0), 0);

  const projectApartments = apartments.filter(a => a.projectId === currentProject?.id);
  const apartmentsTotal = projectApartments.length;
  const apartmentsSold = projectApartments.filter(a => a.status === 'sold').length;
  const apartmentsAvailable = projectApartments.filter(a => a.status === 'available').length;
  const totalSalesValueUSD = projectApartments.filter(a => a.status === 'sold').reduce((acc, a) => acc + (a.salePrice || 0), 0);
  const salesReceivedUSD = projectApartments.filter(a => a.status === 'sold').reduce((acc, a) => acc + ((a.salePrice || 0) - (a.remainingBalance || 0)), 0);
  const salesDueUSD = projectApartments.filter(a => a.status === 'sold').reduce((acc, a) => acc + (a.remainingBalance || 0), 0);

  const summary: ProjectContextSummary = {
    projectName: currentProject?.name || 'پروژه ساختمانی',
    totalSteelTons,
    steelCostUSD,
    totalConcreteM3,
    concreteCostUSD,
    totalExpensesUSD,
    totalPaidUSD,
    totalDebtUSD,
    apartmentsTotal,
    apartmentsSold,
    apartmentsAvailable,
    totalSalesValueUSD,
    salesReceivedUSD,
    salesDueUSD,
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || question).trim();
    if (!query) return;

    const userMsg = {
      sender: 'user' as const,
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    setTimeout(() => {
      const aiReply = answerProjectQuestionLocally(query, summary, projects);
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
      setLoading(false);
    }, 350);
  };

  const quickPrompts = [
    'چقدر سیخ تا حالا خریدیم؟',
    'وضعیت کانکریت‌ریزی چطور است؟',
    'چند واحد آپارتمان فروخته شده؟',
    'طلبکاری‌ها و بدهی‌های فعلی چقدر است؟'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-700 overflow-hidden flex flex-col h-[650px] max-h-[90vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">{t.aiAssistantTitle}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                پروژه فعال: <strong className="text-amber-400">{currentProject?.name}</strong>
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-slate-800/60 border-b border-slate-800 flex gap-2 overflow-x-auto no-scrollbar text-xs">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(prompt)}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors shrink-0 text-[11px] font-medium"
            >
              💬 {prompt}
            </button>
          ))}
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed whitespace-pre-line ${
                m.sender === 'user' 
                  ? 'bg-amber-600 text-white rounded-te-xs shadow-md' 
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-ts-xs'
              }`}>
                <p>{m.text}</p>
                <span className={`block text-[9px] mt-1.5 ${m.sender === 'user' ? 'text-amber-200 text-end' : 'text-slate-400'}`}>
                  {m.time}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-3 bg-slate-800/50 rounded-2xl w-fit">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>{t.aiThinking}</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t.askAiPlaceholder}
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
          >
            <span>ارسال</span>
            <Send className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
