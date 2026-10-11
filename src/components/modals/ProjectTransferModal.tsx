import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { isRtlLanguage, localizeText } from '../../i18n/localize';
import { Project } from '../../types';
import { 
  ArrowRightLeft, 
  X, 
  History, 
  User, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileCheck2, 
  Layers, 
  Building2, 
  Receipt, 
  ChevronDown, 
  ShieldCheck,
  Eye,
  Plus
} from 'lucide-react';

interface ProjectTransferModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
}

export const ProjectTransferModal: React.FC<ProjectTransferModalProps> = ({
  isOpen,
  project,
  onClose,
}) => {
  const { transferProject, formatCurrency, formatNumber, language } = useApp();
  const isRtl = isRtlLanguage(language);
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });

  const [activeTab, setActiveTab] = useState<'new_transfer' | 'history'>('new_transfer');

  // Form states
  const defaultOwnerNames = ['Initial project owner', 'مالک اولیه پروژه', 'د پروژې لومړنی مالک'];
  const currentOwnerName = project?.currentOwner || project?.clientOwner || tx('Initial project owner', 'مالک اولیه پروژه', 'د پروژې لومړنی مالک');
  const [previousOwner, setPreviousOwner] = useState(currentOwnerName);
  const [newOwner, setNewOwner] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectStage, setProjectStage] = useState('اسکلت و سیخ‌بندی (Structure & Rebar)');
  const [customStage, setCustomStage] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'AFN'>(project?.currency === 'AFN' ? 'AFN' : 'USD');
  const [transferValue, setTransferValue] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [contractDocumentUrl, setContractDocumentUrl] = useState('');
  const [contractDocumentName, setContractDocumentName] = useState('');
  const [receiptDocumentUrl, setReceiptDocumentUrl] = useState('');
  const [receiptDocumentName, setReceiptDocumentName] = useState('');
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync previousOwner when project opens
  React.useEffect(() => {
    if (project) {
      setPreviousOwner(project.currentOwner || project.clientOwner || tx('Initial project owner', 'مالک اولیه پروژه', 'د پروژې لومړنی مالک'));
      setNewOwner('');
      setTransferValue('');
      setAmountPaid('');
      setRemainingAmount('');
      setContractDocumentUrl('');
      setContractDocumentName('');
      setReceiptDocumentUrl('');
      setReceiptDocumentName('');
      setNotes('');
      setSuccessMessage(null);
    }
  }, [project, isOpen]);

  React.useEffect(() => {
    if (defaultOwnerNames.includes(previousOwner)) {
      setPreviousOwner(tx('Initial project owner', 'مالک اولیه پروژه', 'د پروژې لومړنی مالک'));
    }
  }, [language, previousOwner]);

  // Auto-calculate remaining amount
  const handleValueChange = (val: string) => {
    setTransferValue(val);
    const numVal = parseFloat(val) || 0;
    const numPaid = parseFloat(amountPaid) || 0;
    setRemainingAmount(Math.max(0, numVal - numPaid).toString());
  };

  const handlePaidChange = (paid: string) => {
    setAmountPaid(paid);
    const numVal = parseFloat(transferValue) || 0;
    const numPaid = parseFloat(paid) || 0;
    setRemainingAmount(Math.max(0, numVal - numPaid).toString());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'contract' | 'receipt') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === 'contract') {
          setContractDocumentUrl(result);
          setContractDocumentName(file.name);
        } else {
          setReceiptDocumentUrl(result);
          setReceiptDocumentName(file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen || !project) return null;

  const historyList = [...(project.transferHistory || [])].sort((a, b) => 
    new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwner.trim()) {
      alert(tx('Enter the name of the new owner or responsible person.', 'نام مالک یا مسئول جدید را وارد کنید.', 'د نوي مالک یا مسؤل نوم ولیکئ.'));
      return;
    }

    const stageValue = projectStage === 'custom' ? (customStage.trim() || tx('Custom stage', 'مرحلهٔ سفارشی', 'ځانګړی پړاو')) : projectStage;
    const valueNum = parseFloat(transferValue) || 0;
    const paidNum = parseFloat(amountPaid) || 0;
    const remainingNum = remainingAmount !== '' ? parseFloat(remainingAmount) : Math.max(0, valueNum - paidNum);

    transferProject({
      projectId: project.id,
      previousOwner: previousOwner.trim() || tx('Previous owner', 'مالک قبلی', 'پخوانی مالک'),
      newOwner: newOwner.trim(),
      transferDate,
      projectStage: stageValue,
      transferValue: valueNum,
      amountPaid: paidNum,
      remainingAmount: remainingNum,
      currency,
      contractDocumentUrl: contractDocumentUrl || undefined,
      contractDocumentName: contractDocumentName || undefined,
      receiptDocumentUrl: receiptDocumentUrl || undefined,
      receiptDocumentName: receiptDocumentName || undefined,
      notes: notes.trim() || undefined,
    });

    setSuccessMessage(tx(
      `Project successfully transferred from "${previousOwner}" to "${newOwner}" and recorded in the history.`,
      `پروژه با موفقیت از «${previousOwner}» به «${newOwner}» واگذار و در تاریخچه ثبت شد.`,
      `پروژه له «${previousOwner}» څخه «${newOwner}» ته ولېږدول شوه او په تاریخچه کې ثبت شوه.`,
    ));

    setPreviousOwner(newOwner.trim());
    setNewOwner('');
    setTransferValue('');
    setAmountPaid('');
    setRemainingAmount('');
    setContractDocumentUrl('');
    setReceiptDocumentUrl('');
    setNotes('');

    // Switch to history tab after 1.5 seconds to show the timeline
    setTimeout(() => {
      setActiveTab('history');
      setSuccessMessage(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-3xl bg-surface rounded-3xl shadow-2xl border border-line overflow-hidden flex flex-col max-h-[92dvh]"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl">
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black">
                  {tx('Project transfer and handover', 'انتقال و واگذاری پروژه', 'د پروژې لېږد او سپارل')}
                </h2>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  {project.code}
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                {project.name} • {tx('Complete ownership history; accounting records remain unchanged', 'ثبت تاریخچهٔ کامل مالکیت و انتقال، بدون تغییر اسناد حسابداری', 'د مالکیت بشپړه تاریخچه؛ د حسابدارۍ اسناد نه بدلېږي')}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Owner Strip */}
        <div className="px-6 py-3 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-semibold">{tx('Current project owner / responsible person:', 'مالک / مسئول فعلی پروژه:', 'د پروژې اوسنی مالک / مسؤل:')}</span>
            <span className="font-extrabold text-sm text-indigo-700 dark:text-indigo-300 bg-surface px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
              {project.currentOwner || project.clientOwner || tx('Initial owner', 'مالک اولیه', 'لومړنی مالک')}
            </span>
          </div>

          {project.initialOwner && project.initialOwner !== (project.currentOwner || project.clientOwner) && (
            <div className="text-[11px] text-ink-muted">
              <span>{tx('Original owner:', 'مالک نخستین:', 'لومړنی مالک:')} <strong>{project.initialOwner}</strong></span>
            </div>
          )}

          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <History className="w-3.5 h-3.5" />
            <span>{formatNumber(historyList.length)} {tx('transfers on record', 'سابقهٔ انتقال ثبت‌شده', 'ثبت شوي لېږدونه')}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 border-b border-line flex gap-2">
          <button
            onClick={() => setActiveTab('new_transfer')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'new_transfer'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{tx('Record a new transfer', 'ثبت واگذاری جدید', 'نوی لېږد ثبت کړئ')}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{tx('Ownership timeline', 'تاریخچهٔ زنجیره‌ای مالکیت', 'د مالکیت بهیر')}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
              {historyList.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: NEW TRANSFER FORM */}
          {activeTab === 'new_transfer' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {tx('Transferring the project preserves all previous expenses, invoices, documents, and payments. The current owner changes to the new party, and this transfer is added to the project history.', 'توجه: با انتقال پروژه، تمام مصارف، بل‌ها، اسناد و پرداخت‌های قبلی محفوظ می‌مانند. مالک فعلی به شخص جدید تغییر می‌کند و این انتقال در تاریخچهٔ پروژه ثبت می‌شود.', 'یادونه: د پروژې د لېږد پر مهال ټول پخواني لګښتونه، بلونه، اسناد او تادیې خوندي پاتې کېږي. اوسنی مالک نوي کس ته بدلېږي او لېږد د پروژې په تاریخچه کې ثبتېږي.')}
                </p>
              </div>

              {/* Parties: Previous Owner -> New Owner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {tx('Previous owner / handover by', 'مالک / مسئول واگذارکننده', 'پخوانی مالک / سپارونکی')} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={previousOwner}
                      onChange={e => setPreviousOwner(e.target.value)}
                      placeholder={tx('Previous owner name', 'نام مالک یا مسئول قبلی', 'د پخواني مالک نوم')}
                      className="w-full pr-9 pl-3 py-2.5 bg-surface-2 border border-line rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1.5">
                    {tx('New project owner / recipient', 'مالک / مسئول جدید پروژه', 'د پروژې نوی مالک / ترلاسه کوونکی')} *
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-indigo-600 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={newOwner}
                      onChange={e => setNewOwner(e.target.value)}
                      placeholder={tx('Name of new owner, company, or investor', 'نام شخص، شرکت یا سرمایه‌گذار جدید', 'د نوي مالک، شرکت یا پانګه‌وال نوم')}
                      className="w-full pr-9 pl-3 py-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* Transfer Date & Project Stage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {tx('Transfer date', 'تاریخ انتقال', 'د لېږد نېټه')} *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={transferDate}
                      onChange={e => setTransferDate(e.target.value)}
                      className="w-full pr-9 pl-3 py-2.5 bg-surface-2 border border-line rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {tx('Project stage at transfer', 'مرحلهٔ کار هنگام واگذاری', 'د لېږد پر مهال د پروژې پړاو')} *
                  </label>
                  <select
                    value={projectStage}
                    onChange={e => setProjectStage(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-2 border border-line rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="شروع کار و خاک‌برداری (Excavation & Foundation)">{tx('Excavation and foundation', 'شروع کار، خاک‌برداری و تهداب', 'کیندنه او تهداب')}</option>
                    <option value="اسکلت و سیخ‌بندی (Structure & Rebar)">{tx('Structure, formwork, and reinforcement', 'اسکلت، قالب‌بندی و سیخ‌بندی', 'جوړښت، قالب‌بندي او سیخ تړل')}</option>
                    <option value="خشت‌کاری و دیوارچینی (Masonry & Brickwork)">{tx('Masonry and walls', 'خشت‌کاری، دیوارهای احاطه و پارتیشن‌ها', 'خښته‌کاري او دېوالونه')}</option>
                    <option value="تأسیسات، برق و نلدوانی (MEP & Plumbing)">{tx('Electrical, mechanical, and plumbing', 'تأسیسات برقی، میخانیکی و نلدوانی', 'برېښنايي، میخانیکي او نلدوانۍ چارې')}</option>
                    <option value="سفیدکاری و گچ‌کاری (Plastering & Interior)">{tx('Plastering, tiles, and interior', 'سفیدکاری، گچ‌کاری و سرامیک', 'پلستر، کاشي او داخلي چارې')}</option>
                    <option value="مرحله پایانی و نما (Facade & Finishing)">{tx('Facade, windows, and finishing', 'نمای ساختمان، شیشه‌ها و تکمیل‌کاری', 'بهرنۍ بڼه، کړکۍ او بشپړکاري')}</option>
                    <option value="تکمیل‌شده و کلید به دست (Completed Handover)">{tx('Completed / turnkey handover', 'پروژهٔ تکمیل‌شده / تسلیمی کلید', 'بشپړه شوې / د کیلي په سپارلو پروژه')}</option>
                    <option value="custom">{tx('Other / custom stage...', 'سایر / مرحلهٔ سفارشی...', 'نور / ځانګړی پړاو...')}</option>
                  </select>

                  {projectStage === 'custom' && (
                    <input
                      type="text"
                      required
                      placeholder={tx('Describe the construction stage', 'شرح مرحلهٔ کار را بنویسید', 'د ودانیز کار پړاو تشریح کړئ')}
                      value={customStage}
                      onChange={e => setCustomStage(e.target.value)}
                      className="mt-2 w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs"
                    />
                  )}
                </div>
              </div>

              {/* Financial Breakdown: Value, Paid, Remaining */}
              <div className="p-4 rounded-2xl bg-surface-2/50 border border-line/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>{tx('Transfer value and payment settlement', 'ارزش مالی انتقال و مبالغ تسویه‌شده', 'د لېږد ارزښت او د تادیاتو تصفیه')}</span>
                  </span>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${currency === 'USD' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('AFN')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${currency === 'AFN' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                    >
                      AFN (؋)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {tx('Total transfer value', 'ارزش کل انتقال', 'د لېږد ټول ارزښت')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={transferValue}
                      onChange={e => handleValueChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs font-bold font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                      {tx('Amount paid', 'مبلغ پرداخت‌شده', 'ورکړل شوې اندازه')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={amountPaid}
                      onChange={e => handlePaidChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-surface border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1">
                      {tx('Remaining amount due', 'باقی‌داری / ذمت', 'پاتې ورکړه')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={remainingAmount}
                      onChange={e => setRemainingAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-surface border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-bold font-mono text-amber-600 dark:text-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Attachments: Contract & Receipt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 transition bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {tx('Transfer contract / agreement', 'سند قرارداد واگذاری', 'د لېږد تړون / سند')}
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-indigo-600 dark:text-indigo-400 py-1.5">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span className="truncate">{contractDocumentName || tx('Select contract file or image', 'انتخاب فایل یا عکس قرارداد', 'د تړون فایل یا انځور وټاکئ')}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={e => handleFileUpload(e, 'contract')}
                      className="hidden"
                    />
                  </label>
                  {contractDocumentUrl && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {tx('File attached', 'فایل پیوست شد', 'فایل ونښلول شو')}
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 transition bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {tx('Payment receipt or invoice', 'رسید یا بل پرداخت', 'د تادیې رسید یا بل')}
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-indigo-600 dark:text-indigo-400 py-1.5">
                    <Receipt className="w-4 h-4 shrink-0" />
                    <span className="truncate">{receiptDocumentName || tx('Select a receipt file', 'انتخاب رسید پرداخت', 'د رسید فایل وټاکئ')}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={e => handleFileUpload(e, 'receipt')}
                      className="hidden"
                    />
                  </label>
                  {receiptDocumentUrl && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {tx('Receipt attached', 'رسید پیوست شد', 'رسید ونښلول شو')}
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {tx('Transfer notes and terms', 'یادداشت، شروط و توافقات انتقال', 'د لېږد یادښتونه او شرطونه')}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={tx('Handover conditions, payment deadlines, construction obligations, and supervision...', 'شرایط تحویل، مهلت پرداخت باقی‌مانده، تعهدات ساختمانی و نظارت...', 'د سپارلو شرایط، د تادیې نېټې، د ودانیز کار ژمنې او څارنه...')}
                  className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  {tx('Cancel', 'انصراف', 'لغوه کول')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 transition transform active:scale-95 flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{tx('Record project transfer', 'ثبت رسمی واگذاری پروژه', 'د پروژې لېږد ثبت کړئ')}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: COMPLETE OWNERSHIP TIMELINE & HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Ownership Chain Summary Diagram */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-800/60 dark:to-indigo-950/40 border border-line">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>{tx('Project ownership chain', 'زنجیرهٔ تسلسل مالکین پروژه', 'د پروژې د مالکیت لړۍ')}</span>
                </h4>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-surface border border-line shadow-xs flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{project.initialOwner || (historyList.length > 0 ? historyList[historyList.length - 1].previousOwner : currentOwnerName)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({tx('Founder', 'مالک نخستین', 'بنسټ اېښودونکی')})</span>
                  </div>

                  {historyList.slice().reverse().map((ev, idx) => (
                    <React.Fragment key={ev.id}>
                      <div className="text-slate-400 flex items-center">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl border shadow-xs flex items-center gap-1.5 font-bold ${
                        idx === historyList.length - 1
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-500/20'
                          : 'bg-surface border-line text-slate-800 dark:text-slate-200'
                      }`}>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{ev.newOwner}</span>
                        {idx === historyList.length - 1 && (
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold">
                            {tx('Current owner', 'مالک فعلی', 'اوسنی مالک')}
                          </span>
                        )}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Detailed Event Cards */}
              {historyList.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-line rounded-3xl text-xs text-ink-muted">
                  <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {tx('No transfers have been recorded for this project yet.', 'تاکنون انتقالی برای این پروژه ثبت نشده است.', 'تر اوسه د دې پروژې لپاره کوم لېږد نه دی ثبت شوی.')}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {tx(`The project remains under the responsibility of ${currentOwnerName}.`, `پروژه همچنان تحت مسئولیت «${currentOwnerName}» است.`, `پروژه لا هم د ${currentOwnerName} تر مسؤلیت لاندې ده.`)}
                  </p>
                  <button
                    onClick={() => setActiveTab('new_transfer')}
                    className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs transition"
                  >
                    {tx('Record first transfer', 'ثبت نخستین واگذاری', 'لومړی لېږد ثبت کړئ')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyList.map((item, index) => (
                    <div 
                      key={item.id}
                      className="p-5 rounded-3xl bg-surface/80 border border-line/80 shadow-sm space-y-3"
                    >
                      {/* Top Row: Owners and Date */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-ink">
                          <span className="text-slate-600 dark:text-slate-400">{item.previousOwner}</span>
                          <span className="text-indigo-600">➔</span>
                          <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <UserCheck className="w-4 h-4" />
                            {item.newOwner}
                          </span>
                          {index === 0 && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                              {tx('Current owner', 'مالک فعلی', 'اوسنی مالک')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{item.transferDate}</span>
                        </div>
                      </div>

                      {/* Middle Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                          <span className="text-[11px] text-slate-400 block">{tx('Stage at transfer', 'مرحلهٔ کار در زمان انتقال', 'د لېږد پر مهال د کار پړاو')}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                            {item.projectStage}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                          <span className="text-[11px] text-slate-400 block">{tx('Total transfer value', 'ارزش کل واگذاری', 'د لېږد ټول ارزښت')}</span>
                          <span className="font-extrabold text-ink mt-0.5 block font-mono">
                            {formatCurrency(item.transferValue, item.currency)}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                          <span className="text-[11px] text-slate-400 block">{tx('Paid / remaining', 'تسویه‌شده / باقی‌داری', 'ورکړل شوي / پاتې')}</span>
                          <div className="mt-0.5 font-bold font-mono flex items-center gap-1 text-[11px]">
                            <span className="text-emerald-600">{formatNumber(item.amountPaid, 0)}</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-amber-600">{formatNumber(item.remainingAmount, 0)} {item.currency}</span>
                          </div>
                        </div>
                      </div>

                      {/* Notes if any */}
                      {item.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl leading-relaxed">
                          <strong>{tx('Notes and terms:', 'شروط و توافقات:', 'یادښتونه او شرطونه:')}</strong> {item.notes}
                        </p>
                      )}

                      {/* Attached Documents */}
                      {(item.contractDocumentUrl || item.receiptDocumentUrl) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          {item.contractDocumentUrl && (
                            <a
                              href={item.contractDocumentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-xl transition font-medium"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[200px]">{item.contractDocumentName || tx('Transfer contract', 'سند قرارداد انتقال', 'د لېږد تړون')}</span>
                              <Eye className="w-3 h-3 text-indigo-400" />
                            </a>
                          )}

                          {item.receiptDocumentUrl && (
                            <a
                              href={item.receiptDocumentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl transition font-medium"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[200px]">{item.receiptDocumentName || tx('Payment receipt', 'رسید پرداخت', 'د تادیې رسید')}</span>
                              <Eye className="w-3 h-3 text-emerald-400" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-2/80 border-t border-line flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition"
          >
            {tx('Close', 'بستن', 'بندول')}
          </button>
        </div>
      </div>
    </div>
  );
};
