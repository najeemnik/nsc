import React, { useState, useId } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectTransferEvent } from '../../types';
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
  const { transferProject, formatCurrency, formatNumber, language, t } = useApp();
  const isRtl = language === 'fa' || language === 'ps';

  const [activeTab, setActiveTab] = useState<'new_transfer' | 'history'>('new_transfer');

  // Form states
  const currentOwnerName = project?.currentOwner || project?.clientOwner || 'مالک اولیه پروژه';
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
      setPreviousOwner(project.currentOwner || project.clientOwner || 'مالک اولیه پروژه');
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
      alert(isRtl ? 'لطفاً نام مالک یا مسئول جدید را وارد نمایید' : 'Please specify the New Owner / Responsible Person');
      return;
    }

    const stageValue = projectStage === 'custom' ? (customStage.trim() || 'سفارشی') : projectStage;
    const valueNum = parseFloat(transferValue) || 0;
    const paidNum = parseFloat(amountPaid) || 0;
    const remainingNum = remainingAmount !== '' ? parseFloat(remainingAmount) : Math.max(0, valueNum - paidNum);

    transferProject({
      projectId: project.id,
      previousOwner: previousOwner.trim() || 'مالک قبلی',
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

    setSuccessMessage(
      isRtl 
        ? `پروژه با موفقیت از «${previousOwner}» به «${newOwner}» واگذار و در تاریخچه ثبت شد.`
        : `Project successfully transferred from "${previousOwner}" to "${newOwner}" and logged into history.`
    );

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
        className="w-full max-w-3xl bg-surface rounded-3xl shadow-2xl border border-line overflow-hidden flex flex-col max-h-[92vh]"
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
                  {isRtl ? 'انتقال و واگذاری پروژه (Handover)' : 'Project Transfer & Handover'}
                </h2>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  {project.code}
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                {project.name} • {isRtl ? 'ثبت و حفظ تاریخچه کامل مالکین و انتقال بدون حذف اسناد' : 'Complete ownership transfer history without altering accounting records'}
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
            <span className="font-semibold">{isRtl ? 'مالک / مسئول فعلی پروژه:' : 'Current Responsible Owner:'}</span>
            <span className="font-extrabold text-sm text-indigo-700 dark:text-indigo-300 bg-surface px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
              {project.currentOwner || project.clientOwner || (isRtl ? 'مالک اولیه' : 'Initial Owner')}
            </span>
          </div>

          {project.initialOwner && project.initialOwner !== (project.currentOwner || project.clientOwner) && (
            <div className="text-[11px] text-ink-muted">
              <span>{isRtl ? 'مالک نخستین:' : 'Initial Founder:'} <strong>{project.initialOwner}</strong></span>
            </div>
          )}

          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <History className="w-3.5 h-3.5" />
            <span>{historyList.length} {isRtl ? 'سابقه انتقال ثبت‌شده' : 'Transfers on record'}</span>
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
            <span>{isRtl ? 'ثبت واگذاری جدید (New Transfer)' : 'Record New Transfer'}</span>
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
            <span>{isRtl ? 'تاریخچه زنجیره‌ای مالکین (Timeline)' : 'Ownership Timeline'}</span>
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
                  {isRtl 
                    ? 'توجه: با انتقال پروژه، تمامی هزینه‌ها، بل‌ها، اسناد و پرداخت‌های قبلی محفوظ می‌مانند. نام مالک فعلی به شخص جدید تغییر می‌یابد و این رویداد در زنجیره تاریخچه پروژه بایگانی می‌شود.'
                    : 'Notice: Transferring the project preserves all prior expenses, invoices, payments, and documents. The current owner changes to the new party and this handover is permanently appended to the project history.'}
                </p>
              </div>

              {/* Parties: Previous Owner -> New Owner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isRtl ? 'مالک / مسئول واگذارکننده (Previous Owner)' : 'Previous Owner / Handover By'} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={previousOwner}
                      onChange={e => setPreviousOwner(e.target.value)}
                      placeholder={isRtl ? 'نام مالک یا مسئول قبلی' : 'Previous owner name'}
                      className="w-full pr-9 pl-3 py-2.5 bg-surface-2 border border-line rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1.5">
                    {isRtl ? 'مالک / مسئول جدید پروژه (New Owner)' : 'New Owner / Recipient'} *
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-indigo-600 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={newOwner}
                      onChange={e => setNewOwner(e.target.value)}
                      placeholder={isRtl ? 'نام شخص، شرکت یا سرمایه‌گذار جدید' : 'New owner or entity name'}
                      className="w-full pr-9 pl-3 py-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* Transfer Date & Project Stage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isRtl ? 'تاریخ انتقال (Transfer Date)' : 'Transfer Date'} *
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
                    {isRtl ? 'مرحله کار هنگام واگذاری (Project Stage)' : 'Project Stage at Transfer'} *
                  </label>
                  <select
                    value={projectStage}
                    onChange={e => setProjectStage(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-2 border border-line rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="شروع کار و خاک‌برداری (Excavation & Foundation)">{isRtl ? 'شروع کار، خاک‌برداری و تهداب' : 'Excavation & Foundation'}</option>
                    <option value="اسکلت و سیخ‌بندی (Structure & Rebar)">{isRtl ? 'اسکلت، قالب‌بندی و سیخ‌بندی' : 'Structure, Framing & Concrete'}</option>
                    <option value="خشت‌کاری و دیوارچینی (Masonry & Brickwork)">{isRtl ? 'خشت‌کاری، دیوارهای احاطه و پارتیشن‌ها' : 'Masonry & Walls'}</option>
                    <option value="تأسیسات، برق و نلدوانی (MEP & Plumbing)">{isRtl ? 'تأسیسات برقی، میخانیکی و نلدوانی' : 'MEP, Wiring & Plumbing'}</option>
                    <option value="سفیدکاری و گچ‌کاری (Plastering & Interior)">{isRtl ? 'سفیدکاری، گچ‌کاری و سرامیک' : 'Plastering, Tiles & Interior'}</option>
                    <option value="مرحله پایانی و نما (Facade & Finishing)">{isRtl ? 'نمای ساختمان، شیشه‌ها و فینیشینگ' : 'Facade, Windows & Finishing'}</option>
                    <option value="تکمیل‌شده و کلید به دست (Completed Handover)">{isRtl ? 'پروژه تکمیل‌شده / تسلیمی کلید' : 'Turnkey / Completed'}</option>
                    <option value="custom">{isRtl ? 'سایر / مرحله سفارشی...' : 'Custom Stage...'}</option>
                  </select>

                  {projectStage === 'custom' && (
                    <input
                      type="text"
                      required
                      placeholder={isRtl ? 'شرح مرحله کار را بنویسید' : 'Specify construction stage'}
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
                    <span>{isRtl ? 'ارزش مالی انتقال و مبالغ تسویه‌شده' : 'Financial Value & Payment Settlement'}</span>
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
                      {isRtl ? 'ارزش کل انتقال (Transfer Value)' : 'Total Transfer Value'}
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
                      {isRtl ? 'مبلغ پرداخت‌شده (Amount Paid)' : 'Amount Paid'}
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
                      {isRtl ? 'باقی‌داری / ذمت (Remaining Due)' : 'Remaining Amount Due'}
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
                    {isRtl ? 'سند قرارداد واگذاری (Contract Document)' : 'Contract / Agreement Doc'}
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-indigo-600 dark:text-indigo-400 py-1.5">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span className="truncate">{contractDocumentName || (isRtl ? 'انتخاب فایل یا عکس قرارداد' : 'Select contract file')}</span>
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
                      {isRtl ? 'فایل پیوست شد' : 'File attached'}
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 transition bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isRtl ? 'رسید یا بل پرداخت (Payment Receipt)' : 'Payment Receipt'}
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-indigo-600 dark:text-indigo-400 py-1.5">
                    <Receipt className="w-4 h-4 shrink-0" />
                    <span className="truncate">{receiptDocumentName || (isRtl ? 'انتخاب رسید پرداخت' : 'Select receipt file')}</span>
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
                      {isRtl ? 'رسید پیوست شد' : 'Receipt attached'}
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isRtl ? 'یادداشت، شروط و توافقات انتقال (Notes & Terms)' : 'Transfer Notes & Terms'}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={isRtl ? 'شروط تحویل، مهلت پرداخت باقیمانده، تعهدات ساختمانی و نظارت...' : 'Handover conditions, construction guarantees, payment deadlines...'}
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
                  {isRtl ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 transition transform active:scale-95 flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{isRtl ? 'ثبت رسمی واگذاری پروژه' : 'Record Project Handover'}</span>
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
                  <span>{isRtl ? 'زنجیره تسلسل مالکین پروژه (Ownership Chain)' : 'Project Ownership Chain'}</span>
                </h4>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-surface border border-line shadow-xs flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{project.initialOwner || (historyList.length > 0 ? historyList[historyList.length - 1].previousOwner : currentOwnerName)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({isRtl ? 'مالک اول' : 'Founder'})</span>
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
                            {isRtl ? 'مالک فعلی' : 'Current'}
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
                    {isRtl ? 'تاکنون انتقالی برای این پروژه ثبت نشده است' : 'No transfers recorded for this project yet'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {isRtl 
                      ? `پروژه همچنان تحت مسئولیت «${currentOwnerName}» می‌باشد.` 
                      : `The project remains under the ownership of "${currentOwnerName}".`}
                  </p>
                  <button
                    onClick={() => setActiveTab('new_transfer')}
                    className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs transition"
                  >
                    {isRtl ? 'ثبت اولین واگذاری' : 'Record First Handover'}
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
                              {isRtl ? 'مالک فعلی' : 'Current Owner'}
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
                          <span className="text-[11px] text-slate-400 block">{isRtl ? 'مرحله کار در زمان انتقال' : 'Stage at Handover'}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                            {item.projectStage}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                          <span className="text-[11px] text-slate-400 block">{isRtl ? 'ارزش کل واگذاری' : 'Total Transfer Value'}</span>
                          <span className="font-extrabold text-ink mt-0.5 block font-mono">
                            {formatCurrency(item.transferValue, item.currency)}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                          <span className="text-[11px] text-slate-400 block">{isRtl ? 'تسویه‌شده / باقی‌داری' : 'Paid / Remaining'}</span>
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
                          <strong>{isRtl ? 'شروط و توافقات:' : 'Notes:'}</strong> {item.notes}
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
                              <span className="truncate max-w-[200px]">{item.contractDocumentName || (isRtl ? 'سند قرارداد انتقال' : 'Contract Doc')}</span>
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
                              <span className="truncate max-w-[200px]">{item.receiptDocumentName || (isRtl ? 'رسید پرداخت' : 'Payment Receipt')}</span>
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
            {isRtl ? 'بستن' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
