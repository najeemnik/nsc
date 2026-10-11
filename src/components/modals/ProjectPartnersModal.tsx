import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PartnerEquityTransfer, Project, ProjectPartner, ProjectInvestment } from '../../types';
import { localizeText } from '../../i18n/localize';
import { 
  Users, 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  PieChart, 
  Calendar, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Coins, 
  Receipt,
  FileText,
  Printer,
  Scale,
  TrendingUp,
  ArrowRightLeft,
  LogOut,
  UserMinus,
  ShieldAlert,
  History as HistoryIcon
} from 'lucide-react';

interface ProjectPartnersModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectPartnersModal: React.FC<ProjectPartnersModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const { 
    projectPartners, 
    projectInvestments, 
    partnerEquityTransfers,
    transferPartnerEquity,
    addProjectPartner, 
    updateProjectPartner, 
    deleteProjectPartner, 
    addProjectInvestment, 
    updateProjectInvestment, 
    deleteProjectInvestment,
    formatNumber,
    t,
    language,
    currentUser
  } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });

  const [activeTab, setActiveTab] = useState<'partners' | 'investments' | 'distribution' | 'transfers'>('partners');
  const [distributableProfit, setDistributableProfit] = useState<string>('5000000');
  const [profitCurrency, setProfitCurrency] = useState<'AFN' | 'USD'>('AFN');

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferringPartner, setTransferringPartner] = useState<ProjectPartner | null>(null);
  const [transferType, setTransferType] = useState<'partner_to_partner' | 'new_partner' | 'company_buyout'>('partner_to_partner');
  const [targetPartnerId, setTargetPartnerId] = useState('');
  const [targetPartnerName, setTargetPartnerName] = useState('');
  const [transferPercentage, setTransferPercentage] = useState('');
  const [transferPrice, setTransferPrice] = useState('');
  const [transferCurrency, setTransferCurrency] = useState<'AFN' | 'USD' | string>('AFN');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transferDeedNumber, setTransferDeedNumber] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [printedTransferDeed, setPrintedTransferDeed] = useState<PartnerEquityTransfer | null>(null);

  const [isPartnerFormOpen, setIsPartnerFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<ProjectPartner | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerNationalId, setPartnerNationalId] = useState('');
  const [partnerShare, setPartnerShare] = useState('');
  const [partnerInitialInv, setPartnerInitialInv] = useState('');
  const [partnerCurrency, setPartnerCurrency] = useState<'AFN' | 'USD' | string>('AFN');
  const [partnerDate, setPartnerDate] = useState('');
  const [partnerNotes, setPartnerNotes] = useState('');
  const [partnerFormError, setPartnerFormError] = useState<string | null>(null);

  const [isInvestmentFormOpen, setIsInvestmentFormOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<ProjectInvestment | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invCurrency, setInvCurrency] = useState<'AFN' | 'USD' | string>('AFN');
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [invType, setInvType] = useState<'initial' | 'additional'>('additional');
  const [invMethod, setInvMethod] = useState('نقد');
  const [invReceipt, setInvReceipt] = useState('');
  const [invNotes, setInvNotes] = useState('');
  const [invFormError, setInvFormError] = useState<string | null>(null);

  const [partnerToDelete, setPartnerToDelete] = useState<ProjectPartner | null>(null);
  const [investmentToDelete, setInvestmentToDelete] = useState<ProjectInvestment | null>(null);

  const currentPartners = useMemo(() => {
    if (!project) return [];
    return projectPartners.filter(p => p.projectId === project.id);
  }, [projectPartners, project]);

  const currentInvestments = useMemo(() => {
    if (!project) return [];
    return projectInvestments.filter(i => i.projectId === project.id);
  }, [projectInvestments, project]);

  const currentTransfers = useMemo(() => {
    if (!project) return [];
    return (partnerEquityTransfers || []).filter(t => t.projectId === project.id);
  }, [partnerEquityTransfers, project]);

  const partnersSummary = useMemo(() => {
    return currentPartners.map(partner => {
      const pInvs = currentInvestments.filter(i => i.partnerId === partner.id);
      
      const totalInvAFN = pInvs
        .filter(i => i.currency === 'AFN')
        .reduce((sum, i) => sum + i.amount, 0);

      const totalInvUSD = pInvs
        .filter(i => i.currency === 'USD')
        .reduce((sum, i) => sum + i.amount, 0);

      return {
        ...partner,
        investmentsCount: pInvs.length,
        totalInvAFN,
        totalInvUSD,
      };
    });
  }, [currentPartners, currentInvestments]);

  const totalStats = useMemo(() => {
    const totalShare = currentPartners.reduce((sum, p) => sum + (p.sharePercentage || 0), 0);
    const totalAFN = currentInvestments
      .filter(i => i.currency === 'AFN')
      .reduce((sum, i) => sum + i.amount, 0);
    const totalUSD = currentInvestments
      .filter(i => i.currency === 'USD')
      .reduce((sum, i) => sum + i.amount, 0);

    return {
      totalShare: parseFloat(totalShare.toFixed(2)),
      totalAFN,
      totalUSD,
      partnerCount: currentPartners.length,
      investmentCount: currentInvestments.length,
    };
  }, [currentPartners, currentInvestments]);

  if (!isOpen || !project) return null;

  const handleOpenPartnerForm = (partner?: ProjectPartner) => {
    setPartnerFormError(null);
    if (partner) {
      setEditingPartner(partner);
      setPartnerName(partner.name || '');
      setPartnerPhone(partner.phone || '');
      setPartnerNationalId(partner.nationalId || '');
      setPartnerShare(partner.sharePercentage !== undefined ? String(partner.sharePercentage) : '');
      setPartnerInitialInv(partner.initialInvestment !== undefined ? String(partner.initialInvestment) : '');
      setPartnerCurrency(partner.currency || project.currency || 'AFN');
      setPartnerDate(partner.investmentDate || '');
      setPartnerNotes(partner.notes || '');
    } else {
      setEditingPartner(null);
      setPartnerName('');
      setPartnerPhone('');
      setPartnerNationalId('');
      setPartnerShare('');
      setPartnerInitialInv('');
      setPartnerCurrency(project.currency || 'AFN');
      setPartnerDate(new Date().toISOString().split('T')[0]);
      setPartnerNotes('');
    }
    setIsPartnerFormOpen(true);
  };

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPartnerFormError(null);
    const share = partnerShare.trim() ? parseFloat(partnerShare) : undefined;
    const initialInv = partnerInitialInv.trim() ? parseFloat(partnerInitialInv) : undefined;

    if (share !== undefined && (isNaN(share) || share < 0 || share > 100)) {
      setPartnerFormError('فیصدی سهم باید بین ۰ تا ۱۰۰ باشد.');
      return;
    }
    if (initialInv !== undefined && (isNaN(initialInv) || initialInv < 0)) {
      setPartnerFormError('مبلغ سرمایه‌گذاری نامعتبر است.');
      return;
    }

    if (editingPartner) {
      updateProjectPartner(editingPartner.id, {
        name: partnerName.trim() || 'شریک',
        phone: partnerPhone.trim() || undefined,
        nationalId: partnerNationalId.trim() || undefined,
        sharePercentage: share,
        currency: partnerCurrency,
        investmentDate: partnerDate || undefined,
        notes: partnerNotes.trim() || undefined,
      });
    } else {
      addProjectPartner({
        projectId: project.id,
        name: partnerName.trim() || 'شریک جدید',
        phone: partnerPhone.trim() || undefined,
        nationalId: partnerNationalId.trim() || undefined,
        sharePercentage: share,
        initialInvestment: initialInv,
        currency: partnerCurrency,
        investmentDate: partnerDate || undefined,
        notes: partnerNotes.trim() || undefined,
      });
    }
    setIsPartnerFormOpen(false);
  };

  const handleOpenInvestmentForm = (partnerId?: string, inv?: ProjectInvestment) => {
    setInvFormError(null);
    if (inv) {
      setEditingInvestment(inv);
      setSelectedPartnerId(inv.partnerId);
      setInvAmount(String(inv.amount));
      setInvCurrency(inv.currency);
      setInvDate(inv.date);
      setInvType(inv.type);
      setInvMethod(inv.paymentMethod || 'نقد');
      setInvReceipt(inv.receiptNumber || '');
      setInvNotes(inv.notes || '');
    } else {
      setEditingInvestment(null);
      setSelectedPartnerId(partnerId || currentPartners[0]?.id || '');
      setInvAmount('');
      setInvCurrency(project.currency || 'AFN');
      setInvDate(new Date().toISOString().split('T')[0]);
      setInvType('additional');
      setInvMethod('نقد');
      setInvReceipt('');
      setInvNotes('');
    }
    setIsInvestmentFormOpen(true);
  };

  const handleInvestmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInvFormError(null);
    const parsedAmount = parseFloat(invAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setInvFormError('مبلغ واریزی باید بزرگتر از صفر باشد.');
      return;
    }
    const partner = currentPartners.find(p => p.id === selectedPartnerId);
    const pName = partner ? partner.name : 'سرمایه عمومی';

    if (editingInvestment) {
      updateProjectInvestment(editingInvestment.id, {
        partnerId: selectedPartnerId || editingInvestment.partnerId,
        partnerName: pName,
        amount: parsedAmount,
        currency: invCurrency,
        date: invDate,
        type: invType,
        paymentMethod: invMethod,
        receiptNumber: invReceipt.trim() || undefined,
        notes: invNotes.trim() || undefined,
      });
    } else {
      addProjectInvestment({
        projectId: project.id,
        partnerId: selectedPartnerId || (currentPartners[0]?.id ?? 'general'),
        partnerName: pName,
        amount: parsedAmount,
        currency: invCurrency,
        date: invDate,
        type: invType,
        paymentMethod: invMethod,
        receiptNumber: invReceipt.trim() || undefined,
        notes: invNotes.trim() || undefined,
      });
    }
    setIsInvestmentFormOpen(false);
  };

  const handleOpenTransferModal = (partner: ProjectPartner) => {
    setTransferringPartner(partner);
    setTransferType('partner_to_partner');
    const otherPartner = currentPartners.find(p => p.id !== partner.id && p.status !== 'exited');
    setTargetPartnerId(otherPartner?.id || '');
    setTargetPartnerName(otherPartner?.name || '');
    setTransferPercentage(String(partner.sharePercentage || ''));
    setTransferPrice('');
    setTransferCurrency(partner.currency || 'AFN');
    setTransferDate(new Date().toISOString().split('T')[0]);
    setTransferDeedNumber(`DEED-${Date.now().toString().slice(-4)}`);
    setTransferNotes('');
    setTransferError(null);
    setIsTransferModalOpen(true);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringPartner || !project) return;
    setTransferError(null);

    const pct = parseFloat(transferPercentage) || 0;
    if (pct <= 0 || pct > (transferringPartner.sharePercentage || 0)) {
      setTransferError(`درصد واگذاری باید بین ۰.۱٪ تا ${transferringPartner.sharePercentage}% باشد.`);
      return;
    }

    const price = parseFloat(transferPrice) || 0;
    if (price < 0) {
      setTransferError('مبلغ معامله نمی‌تواند منفی باشد.');
      return;
    }

    let buyerName = targetPartnerName.trim();
    let buyerId: string | undefined = undefined;

    if (transferType === 'partner_to_partner') {
      const existingBuyer = currentPartners.find(p => p.id === targetPartnerId);
      if (!existingBuyer) {
        setTransferError('لطفاً شریک خریدار را از لیست انتخاب کنید.');
        return;
      }
      buyerName = existingBuyer.name;
      buyerId = existingBuyer.id;
    } else if (transferType === 'company_buyout') {
      buyerName = 'خزانه شرکت / بازخرید توسط پروژه';
    } else {
      if (!buyerName) {
        setTransferError('لطفاً نام خریدار یا سرمایه‌گذار جدید را بنویسید.');
        return;
      }
    }

    const record = transferPartnerEquity({
      projectId: project.id,
      fromPartnerId: transferringPartner.id,
      fromPartnerName: transferringPartner.name,
      toPartnerId: buyerId,
      toPartnerName: buyerName,
      transferredPercentage: pct,
      transferPrice: price,
      currency: transferCurrency,
      transferDate,
      transferType,
      deedNumber: transferDeedNumber.trim() || undefined,
      notes: transferNotes.trim() || undefined,
    });

    setPrintedTransferDeed(record);
    setIsTransferModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-surface rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-line my-auto animate-in fade-in zoom-in-95 flex flex-col max-h-[92dvh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base">
                  {tx('Project partners and investment shares', 'مدیریت شرکای پروژه و سهم سرمایه‌گذاری', 'د پروژې شریکان او د پانګونې ونډې')}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                  {project.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>{project.name}</span>
                <span>•</span>
                <span>{tx('Ownership and contribution ledger', 'سهم‌داری و دفتر روزنامچه واریزی‌ها', 'ونډه‌والۍ او د ونډو ثبت')}</span>
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

        {/* Top Summary Cards */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-line shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Total Capital */}
            <div className="p-3.5 rounded-2xl bg-surface border border-line shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-ink-muted">{tx('Total capital contributed:', 'مجموع سرمایه واریز شده:', 'ټوله ورکړل شوې پانګه:')}</span>
                <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-0.5">
                {totalStats.totalAFN > 0 && (
                  <div className="font-mono text-base font-black text-ink">
                    {totalStats.totalAFN.toLocaleString()} <span className="text-xs font-sans font-bold text-emerald-700 dark:text-emerald-400">{tx('AFN', 'افغانی', 'افغانۍ')}</span>
                  </div>
                )}
                {totalStats.totalUSD > 0 && (
                  <div className="font-mono text-base font-black text-ink">
                    ${totalStats.totalUSD.toLocaleString()} <span className="text-xs font-sans font-bold text-blue-700 dark:text-blue-400">{tx('USD', 'دالر', 'ډالر')}</span>
                  </div>
                )}
                {totalStats.totalAFN === 0 && totalStats.totalUSD === 0 && (
                  <div className="text-xs text-slate-400 font-bold">{tx('No contributions recorded', 'بدون ثبت واریزی', 'تر اوسه ونډه نه ده ثبت شوې')}</div>
                )}
              </div>
            </div>

            {/* Total Allocated Share % */}
            <div className="p-3.5 rounded-2xl bg-surface border border-line shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-ink-muted">{tx('Total allocated shares:', 'مجموع سهام تعیین‌شده:', 'ټولې ټاکل شوې ونډې:')}</span>
                <PieChart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-ink">
                  {totalStats.totalShare}%
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  totalStats.totalShare === 100 
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : totalStats.totalShare < 100 
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' 
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                }`}>
                  {totalStats.totalShare === 100
                    ? tx('Complete (100%)', 'تکمیل (۱۰۰٪)', 'بشپړ (۱۰۰٪)')
                    : totalStats.totalShare < 100
                      ? `${(100 - totalStats.totalShare).toFixed(1)}% ${tx('remaining', 'باقیمانده', 'پاتې')}`
                      : tx('Over 100%', 'فراتر از ۱۰۰٪', 'له ۱۰۰٪ څخه زیات')}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    totalStats.totalShare <= 100 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(totalStats.totalShare, 100)}%` }}
                />
              </div>
            </div>

            {/* Partners Count & Quick Action */}
            <div className="p-3.5 rounded-2xl bg-surface border border-line shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-ink-muted block mb-1">{tx('Partners and transactions:', 'تعداد شرکا و تراکنش‌ها:', 'شریکان او راکړې ورکړې:')}</span>
                <div className="font-extrabold text-sm text-ink flex items-center gap-2">
                  <span>{totalStats.partnerCount} {tx('partners', 'شریک', 'شریکان')}</span>
                  <span>•</span>
                  <span>{totalStats.investmentCount} {tx('contributions', 'واریزی', 'ونډې')}</span>
                </div>
              </div>
              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleOpenPartnerForm()}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tx('Add partner', 'افزودن شریک', 'شریک ورزیاتول')}</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-line bg-surface px-6 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('partners')}
            className={`py-3 px-4 font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'partners'
                ? 'border-amber-600 text-amber-900 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{tx('Partners', 'فهرست شرکا', 'شریکان')} ({currentPartners.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('investments')}
            className={`py-3 px-4 font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'investments'
                ? 'border-amber-600 text-amber-900 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <HistoryIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{tx('Capital contributions', 'دفتر واریزی‌ها و سرمایه', 'د پانګې ونډې')} ({currentInvestments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('distribution')}
            className={`py-3 px-4 font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'distribution'
                ? 'border-amber-600 text-amber-900 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{tx('Profit distribution and equity settlement', 'تسهیم سود و تسویه سهم‌الشرکه', 'د ګټې وېش او د ونډو تصفیه')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transfers')}
            className={`py-3 px-4 font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'transfers'
                ? 'border-amber-600 text-amber-900 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{tx('Equity transfers and exits', 'واگذاری سهم و خروج شرکا', 'د ونډو لېږد او وتل')} ({currentTransfers.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs space-y-4">
          
          {/* TAB 1: Partners List */}
          {activeTab === 'partners' && (
            <div className="space-y-4 animate-in fade-in">
              {currentPartners.length === 0 ? (
                <div className="p-8 text-center bg-surface-2/40 rounded-2xl border border-line space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-ink text-sm">{tx('No partners are registered for this project', 'هیچ شریکی برای این پروژه ثبت نشده است', 'د دې پروژې لپاره هېڅ شریک نه دی ثبت شوی')}</h4>
                    <p className="text-ink-muted text-xs mt-1">
                      {tx('Add people and partners here with their ownership percentage and initial investment.', 'می‌توانید اشخاص و شرکا را به همراه درصد سهم و سرمایه‌گذاری اولیه در اینجا تعریف کنید.', 'دلته کسان او شریکان د ونډې سلنې او لومړنۍ پانګونې سره ثبت کړئ.')}
                    </p>
                  </div>
                  {currentUser?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleOpenPartnerForm()}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{tx('Add the first partner', 'افزودن اولین شریک', 'لومړی شریک ورزیاتول')}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {partnersSummary.map((partner) => (
                    <div 
                      key={partner.id}
                      className="bg-surface/80 p-4 rounded-2xl border border-line hover:border-amber-400/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Name and Share Badge */}
                        <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                          <div>
                            <h4 className="font-extrabold text-ink text-sm flex items-center gap-2">
                              <span>{partner.name}</span>
                              {partner.status === 'exited' && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 font-black text-[10px] border border-rose-500/30">
                                  {tx('Exited / fully settled', 'خارج‌شده / تسویه کامل', 'وتلی / بشپړ تصفیه شوی')}
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-3 text-ink-muted text-[11px] mt-0.5">
                              {partner.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span className="font-mono">{partner.phone}</span>
                                </span>
                              )}
                              {partner.nationalId && (
                                <span className="text-slate-400 font-mono">
                                  {tx('ID:', 'تذکره:', 'د پېژندپاڼې شمېره:')} {partner.nationalId}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-xl border font-black font-mono text-xs ${
                            partner.status === 'exited'
                              ? 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                          }`}>
                            {partner.sharePercentage !== undefined ? `${partner.sharePercentage}%` : tx('No share specified', 'بدون سهم مشخص', 'د ونډې سلنه نه ده ټاکل شوې')}
                          </span>
                        </div>

                        {partner.status === 'exited' && (
                          <div className="p-2 mb-2 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/40 rounded-xl text-[11px] text-rose-700 dark:text-rose-300">
                            <strong>{tx('Exit note:', 'نوت خروج:', 'د وتلو یادښت:')}</strong>{' '}
                            {partner.exitReason || tx('Share transferred to {name}.', 'سهم به {name} واگذار گردیده است.', 'ونډه {name} ته لېږدول شوې ده.').replace('{name}', partner.transferredToPartnerName || tx('a new buyer', 'خریدار جدید', 'نوی پېرودونکی'))}
                            {partner.exitDate && <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{tx('Exit date:', 'تاریخ خروج:', 'د وتلو نېټه:')} {partner.exitDate}</span>}
                          </div>
                        )}

                        {/* Financial Figures */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl mb-3 border border-slate-100 dark:border-slate-750 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">{tx('Initial committed capital:', 'سرمایه تعهد شده اولیه:', 'لومړنۍ ژمنه شوې پانګه:')}</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {partner.initialInvestment !== undefined ? (
                                `${partner.initialInvestment.toLocaleString()} ${partner.currency}`
                              ) : (
                                tx('Unknown', 'نامشخص', 'ناڅرګند')
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">{tx('Total contributions:', 'مجموع واریزی‌ها:', 'ټولې ونډې:')}</span>
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {partner.totalInvAFN > 0 && `${partner.totalInvAFN.toLocaleString()} AFN `}
                              {partner.totalInvUSD > 0 && `$${partner.totalInvUSD.toLocaleString()}`}
                              {partner.totalInvAFN === 0 && partner.totalInvUSD === 0 && '۰'}
                            </span>
                          </div>
                        </div>

                        {partner.notes && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 bg-amber-50/50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
                            {partner.notes}
                          </p>
                        )}
                      </div>

                      {/* Bottom Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-[11px] gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          {partner.status !== 'exited' && (
                            <button
                              type="button"
                              onClick={() => handleOpenInvestmentForm(partner.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold transition-colors flex items-center gap-1"
                            >
                              <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>+ {tx('Contribution', 'واریزی', 'ونډه')}</span>
                            </button>
                          )}

                          {partner.status !== 'exited' && (partner.sharePercentage || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenTransferModal(partner)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold transition-colors flex items-center gap-1"
                              title={tx('Sell or transfer equity and exit the project', 'فروش یا واگذاری سهم‌الشرکه و خروج از پروژه', 'د ونډې پلورل یا لېږدول او له پروژې وتل')}
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>{tx('Transfer equity / exit', 'واگذاری سهم / خروج', 'ونډه لېږدول / وتل')}</span>
                            </button>
                          )}
                        </div>

                        {currentUser?.role === 'admin' && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenPartnerForm(partner)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title={tx('Edit partner', 'ویرایش شریک', 'شریک سمول')}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPartnerToDelete(partner)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title={tx('Delete partner', 'حذف شریک', 'شریک ړنګول')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Investments Ledger */}
          {activeTab === 'investments' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-ink text-xs sm:text-sm">{tx('Capital contribution ledger', 'دفتر روزنامچه واریزی‌های سرمایه', 'د پانګې ونډو ثبت')}</h4>
                  <p className="text-[11px] text-slate-500">{tx('Record each partner contribution separately, including cash, money exchange and bank deposits.', 'تمامی مبالغ نقد، صرافی و بانکی واریز شده توسط شرکا به صورت تفکیک‌شده ثبت می‌شود.', 'د شریکانو ټولې نغدي، صرافۍ او بانکي ونډې جلا جلا ثبت کړئ.')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenInvestmentForm()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tx('Record contribution', 'ثبت واریزی جدید', 'نوې ونډه ثبتول')}</span>
                </button>
              </div>

              {currentInvestments.length === 0 ? (
                <div className="p-8 text-center bg-surface-2/40 rounded-2xl border border-line space-y-2">
                  <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">{tx('No capital contribution has been recorded yet.', 'هیچ واریزی سرمایه‌ای تا اکنون ثبت نشده است.', 'تر اوسه د پانګې هېڅ ونډه نه ده ثبت شوې.')}</p>
                </div>
              ) : (
                <div className="border border-line rounded-2xl overflow-hidden shadow-xs bg-surface">
                  <div className="overflow-x-auto scroll-touch">
                    <table className="w-full text-start text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold border-b border-line">
                        <tr>
                          <th className="py-2.5 px-3 text-start">{t("accColDate")}</th>
                          <th className="py-2.5 px-3 text-start">{tx('Partner / contributor', 'نام شریک / واریزکننده', 'د شریک / ونډه‌ورکوونکي نوم')}</th>
                          <th className="py-2.5 px-3 text-start">{tx('Contribution amount', 'مبلغ واریزی', 'د ونډې اندازه')}</th>
                          <th className="py-2.5 px-3 text-start">{tx('Type', 'نوعیت', 'ډول')}</th>
                          <th className="py-2.5 px-3 text-start">{t("paymentMethod")}</th>
                          <th className="py-2.5 px-3 text-start">{tx('Receipt number', 'شماره رسید', 'د رسېد شمېره')}</th>
                          <th className="py-2.5 px-3 text-start">{t("auditDetails")}</th>
                          <th className="py-2.5 px-3 text-center">{t("actions")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {currentInvestments.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {inv.date}
                            </td>
                            <td className="py-2 px-3 font-bold text-ink whitespace-nowrap">
                              {inv.partnerName}
                            </td>
                            <td className="py-2 px-3 font-mono font-black text-ink whitespace-nowrap">
                              <span className="text-emerald-700 dark:text-emerald-400">{inv.amount.toLocaleString()}</span>{' '}
                              <span className="text-[10px] text-slate-500 font-sans font-bold">{inv.currency}</span>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.type === 'initial' 
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' 
                                  : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                              }`}>
                                {inv.type === 'initial' ? tx('Initial investment', 'سرمایه اولیه', 'لومړنۍ پانګونه') : tx('Additional contribution', 'سهم دوره‌ای', 'اضافي ونډه')}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {inv.paymentMethod || t("methodCash")}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">
                              {inv.receiptNumber || '-'}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={inv.notes}>
                              {inv.notes || '-'}
                            </td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenInvestmentForm(inv.partnerId, inv)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                  title={t("edit")}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInvestmentToDelete(inv)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title={t("delete")}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Profit & Loss Distribution */}
          {activeTab === 'distribution' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                <div>
                  <h4 className="font-extrabold text-ink text-xs sm:text-sm flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-600" />
                    <span>{tx('Partner equity, profit and loss distribution', 'تسهیم قانونی سود، زیان و بازگشت سرمایه شرکا', 'د شریکانو د ونډې، ګټې او زیان وېش')}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {tx('Calculated from each partner’s registered equity percentage and total cash investment.', 'بر اساس درصد سهم‌الشرکه رسمی ثبت‌شده و کل سرمایه‌گذاری نقدی هر شریک.', 'د هر شریک د ثبت شوې ونډې سلنې او ټولې نغدي پانګونې له مخې محاسبه کېږي.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shrink-0"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{tx('Print official profit-distribution minutes', 'چاپ صورت‌جلسه رسمی تقسیم سود', 'د ګټې وېش رسمي صورت‌جلسه چاپول')}</span>
                </button>
              </div>

              {/* Profit Input Simulator */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-surface-2/50 rounded-2xl border border-line">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {tx('Total net project profit available for distribution:', 'کل سود خالص قابل تقسیم پروژه:', 'د وېش وړ د پروژې ټوله خالصه ګټه:')}
                  </label>
                  <input
                    type="number"
                    value={distributableProfit}
                    onChange={(e) => setDistributableProfit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono font-bold focus:ring-2 focus:ring-amber-500/20"
                    placeholder={tx('Profit amount...', 'مبلغ سود به عدد...', 'د ګټې اندازه...')}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {tx('Profit currency:', 'واحد پولی سود:', 'د ګټې اسعار:')}
                  </label>
                  <select
                    value={profitCurrency}
                    onChange={(e) => setProfitCurrency(e.target.value as 'AFN' | 'USD')}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-bold focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="AFN">{t("currencyAFN")}</option>
                    <option value="USD">{tx('US dollar (USD)', 'دالر آمریکایی (USD)', 'امریکايي ډالر (USD)')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    {tx('Total allocated share:', 'مجموع سهم تخصیص‌یافته:', 'ټوله ټاکل شوې ونډه:')}
                  </label>
                  <div className={`px-3 py-2 rounded-xl font-mono font-black text-sm border flex items-center justify-between ${
                    totalStats.totalShare === 100 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}>
                    <span>{totalStats.totalShare}٪ {tx('of', 'از', 'له')} ۱۰۰٪</span>
                    {totalStats.totalShare === 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <span className="text-[10px] font-normal">
                        ({100 - totalStats.totalShare}٪ {tx('available', 'آزاد', 'پاتې')})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Partners Profit Table */}
              <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-surface-2/60 text-slate-500 font-bold border-b border-line">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">{tx('Partner name and details', 'نام و مشخصات شریک', 'د شریک نوم او معلومات')}</th>
                        <th className="py-2.5 px-3 text-center">{tx('Share percentage', 'فیصدی سهم', 'د ونډې سلنه')}</th>
                        <th className="py-2.5 px-3 text-left">{tx('Total contributed capital', 'مجموع سرمایه واریزی', 'ټوله ورکړل شوې پانګه')}</th>
                        <th className="py-2.5 px-3 text-left text-emerald-600">{tx('Allocated profit', 'سود تخصیصی', 'ټاکل شوې ګټه')} ({profitCurrency})</th>
                        <th className="py-2.5 px-3 text-left font-black text-ink">{tx('Total payable', 'مجموع قابل تسویه', 'ټول د ورکړې وړ')}</th>
                        <th className="py-2.5 px-3 text-center w-32">{tx('Partner signature and fingerprint', 'امضا و اثر انگشت شریک', 'د شریک لاسلیک او د ګوتې نښه')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {partnersSummary.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            {tx('No partners are registered for profit allocation.', 'هیچ شریکی برای محاسبه سهم سود ثبت نشده است.', 'د ګټې د وېش لپاره هېڅ شریک نه دی ثبت شوی.')}
                          </td>
                        </tr>
                      ) : (
                        partnersSummary.map((partner, idx) => {
                          const profitNum = parseFloat(distributableProfit) || 0;
                          const partnerProfit = ((partner.sharePercentage || 0) / 100) * profitNum;
                          const partnerCap = profitCurrency === 'USD' ? partner.totalInvUSD : partner.totalInvAFN;
                          const totalReturn = partnerCap + partnerProfit;

                          return (
                            <tr key={partner.id} className="hover:bg-surface-2/30">
                              <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-ink">
                                <div>{partner.name}</div>
                                {partner.phone && <div className="text-[10px] text-slate-400 font-mono">{partner.phone}</div>}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-black text-amber-600">
                                {partner.sharePercentage || 0}٪
                              </td>
                              <td className="py-2.5 px-3 text-left font-mono">
                                {profitCurrency === 'USD' 
                                  ? `$${formatNumber(partner.totalInvUSD, 0)}`
                                  : `${formatNumber(partner.totalInvAFN, 0)} AFN`}
                              </td>
                              <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-600">
                                +{formatNumber(partnerProfit, 0)} {profitCurrency}
                              </td>
                              <td className="py-2.5 px-3 text-left font-mono font-black text-ink">
                                {formatNumber(totalReturn, 0)} {profitCurrency}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="h-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg mx-auto w-24"></div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Equity Transfers & Partner Exits */}
          {activeTab === 'transfers' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                <div>
                  <h4 className="font-extrabold text-ink text-xs sm:text-sm flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                    <span>{tx('Equity transfer and partner exit ledger', 'دفتر ثبت نقل و انتقال سهام و خروج شرکا', 'د ونډو لېږد او د شریکانو د وتلو ثبت')}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {tx('Record legal share transfers to existing partners, new investors, or a project buyback.', 'ثبت قانونی واگذاری سهام شرکا به شرکای موجود، سرمایه‌گذاران جدید یا بازخرید توسط پروژه.', 'موجودو شریکانو، نویو پانګه‌والو یا د پروژې بېرته پېرلو ته د ونډو قانوني لېږد ثبت کړئ.')}
                  </p>
                </div>
              </div>

              {currentTransfers.length === 0 ? (
                <div className="p-8 text-center bg-surface-2/40 rounded-2xl border border-line space-y-2">
                  <ArrowRightLeft className="w-8 h-8 text-slate-400 mx-auto" />
                  <h5 className="font-bold text-ink">{tx('No equity transfers or partner exits have been recorded', 'هیچ نقل و انتقال یا خروج سهمی ثبت نشده است', 'د ونډو لېږد یا د شریکانو وتل نه دي ثبت شوي')}</h5>
                  <p className="text-[11px] text-slate-400">
                    {tx('To transfer equity, open Partners and choose “Transfer equity / exit” for the relevant partner.', 'برای واگذاری سهم، از تب «فهرست شرکا» روی دکمه «واگذاری سهم / خروج» شریک مورد نظر کلیک کنید.', 'د ونډې لېږدولو لپاره د شریکانو ټب ته ولاړ شئ او د اړوند شریک «ونډه لېږدول / وتل» وټاکئ.')}
                  </p>
                </div>
              ) : (
                <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead className="bg-surface-2/60 text-slate-500 font-bold border-b border-line">
                        <tr>
                          <th className="py-2.5 px-3">{tx('Transaction date', 'تاریخ معامله', 'د معاملې نېټه')}</th>
                          <th className="py-2.5 px-3">{tx('Selling / exiting partner', 'شریک فروشنده (خارج‌شده)', 'پلورونکی / وتونکی شریک')}</th>
                          <th className="py-2.5 px-3">{tx('Equity buyer (transferee)', 'خریدار سهم (انتقال‌گیرنده)', 'د ونډې پېرودونکی (ترلاسه کوونکی)')}</th>
                          <th className="py-2.5 px-3 text-center">{tx('Transferred share', 'سهم واگذارشده', 'لېږدول شوې ونډه')}</th>
                          <th className="py-2.5 px-3 text-left">{tx('Transaction amount', 'مبلغ معامله', 'د معاملې اندازه')}</th>
                          <th className="py-2.5 px-3 text-center">{tx('Settlement deed number', 'شماره سند صلح', 'د جوړجاړي سند شمېره')}</th>
                          <th className="py-2.5 px-3 text-center">{t("actions")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {currentTransfers.map((tr) => (
                          <tr key={tr.id} className="hover:bg-surface-2/30">
                            <td className="py-2.5 px-3 font-mono text-slate-500">{tr.transferDate}</td>
                            <td className="py-2.5 px-3 font-bold text-rose-600 dark:text-rose-400">
                              {tr.fromPartnerName}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                              {tr.toPartnerName}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-amber-600">
                              {tr.transferredPercentage}%
                            </td>
                            <td className="py-2.5 px-3 text-left font-mono font-bold text-ink">
                              {tr.currency === 'USD' ? `$${formatNumber(tr.transferPrice, 0)}` : `${formatNumber(tr.transferPrice, 0)} AFN`}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                              {tr.deedNumber || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => setPrintedTransferDeed(tr)}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[10px] inline-flex items-center gap-1"
                              >
                                <Printer className="w-3 h-3" />
                                <span>{tx('Print settlement deed', 'چاپ صلح‌نامه', 'د جوړجاړي سند چاپول')}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-line flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            {tx('Close partners panel', 'بستن پنل شرکا', 'د شریکانو کړکۍ تړل')}
          </button>
        </div>
      </div>

      {/* SUB-MODAL 1: Add/Edit Partner */}
      {isPartnerFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 animate-in fade-in">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 border border-line shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <h4 className="font-extrabold text-sm text-ink">
                  {editingPartner ? tx('Edit partner details', 'ویرایش مشخصات شریک', 'د شریک معلومات سمول') : tx('Add a partner to the project', 'افزودن شریک جدید به پروژه', 'پروژې ته نوی شریک ورزیاتول')}
                </h4>
              </div>
              <button 
                type="button"
                onClick={() => setIsPartnerFormOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {partnerFormError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{partnerFormError}</span>
              </div>
            )}

            <form onSubmit={handlePartnerSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Partner full name (required)', 'نام و تخلص شریک (اجباری)', 'د شریک بشپړ نوم (اړین)')}</label>
                <input
                  type="text"
                  placeholder={tx('e.g., Haji Mohammad Nader', 'مثلاً: حاجی محمد نادر', 'لکه: حاجي محمد نادر')}
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Phone number (optional)', 'شماره تماس (اختیاری)', 'د ټیلیفون شمېره (اختیاري)')}</label>
                  <input
                    type="text"
                    placeholder={tx('e.g., 0799123456', 'مثال: 0799123456', 'لکه: 0799123456')}
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('National ID / ID number (optional)', 'شماره تذکره / آی‌دی (اختیاری)', 'د تذکرې / پېژندپاڼې شمېره (اختیاري)')}</label>
                  <input
                    type="text"
                    placeholder={tx('e.g., 1402-8877', 'مثال: 1402-8877', 'لکه: 1402-8877')}
                    value={partnerNationalId}
                    onChange={(e) => setPartnerNationalId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Share percentage (%) (optional)', 'فیصدی سهم (%) (اختیاری)', 'د ونډې سلنه (%) (اختیاري)')}</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    placeholder={tx('e.g., 50', 'مثلاً: 50', 'لکه: ۵۰')}

                    value={partnerShare}
                    onChange={(e) => setPartnerShare(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-mono font-bold"
                  />
                </div>

                {!editingPartner && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Initial committed capital (optional)', 'سرمایه اولیه تعهد شده (اختیاری)', 'لومړنۍ ژمنه شوې پانګه (اختیاري)')}</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder={tx('e.g., 100000', 'مثلاً: 100000', 'لکه: ۱۰۰۰۰۰')}

                      value={partnerInitialInv}
                      onChange={(e) => setPartnerInitialInv(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Investment currency', 'اسعار سرمایه‌گذاری', 'د پانګونې اسعار')}</label>
                  <select
                    value={partnerCurrency}
                    onChange={(e) => setPartnerCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-bold bg-surface text-ink"
                  >
                    <option value="AFN">{t("currencyAFN")}</option>
                    <option value="USD">{tx('US dollar (USD $)', 'دالر (USD $)', 'امریکايي ډالر (USD $)')}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Joining / contract date (optional)', 'تاریخ ورود / قرارداد (اختیاری)', 'د ګډون / تړون نېټه (اختیاري)')}</label>
                  <input
                    type="date"
                    value={partnerDate}
                    onChange={(e) => setPartnerDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Notes and special terms (optional)', 'یادداشت و شرایط خاص (اختیاری)', 'یادښتونه او ځانګړي شرایط (اختیاري)')}</label>
                <textarea
                  rows={2}
                  placeholder={tx('Agreement terms or partnership notes...', 'شرایط توافق یا یادداشت شراکت...', 'د هوکړې شرایط یا د شراکت یادښتونه...')}

                  value={partnerNotes}
                  onChange={(e) => setPartnerNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsPartnerFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >{t("cancel")}</button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs"
                >
                  {editingPartner ? tx('Save changes', 'ثبت تغییرات', 'بدلونونه ثبتول') : tx('Add partner', 'افزودن شریک', 'شریک ورزیاتول')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: Add/Edit Investment */}
      {isInvestmentFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 animate-in fade-in">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 border border-line shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-sm text-ink">
                  {editingInvestment ? tx('Edit capital contribution', 'ویرایش واریزی سرمایه', 'د پانګې ونډې سمول') : tx('Record a new partner contribution', 'ثبت واریزی جدید توسط شریک', 'د شریک نوې ونډه ثبتول')}
                </h4>
              </div>
              <button 
                type="button"
                onClick={() => setIsInvestmentFormOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {invFormError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{invFormError}</span>
              </div>
            )}

            <form onSubmit={handleInvestmentSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Select partner', 'انتخاب شریک', 'شریک وټاکئ')}</label>
                <select
                  required
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-bold bg-surface text-ink"
                >
                  {currentPartners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sharePercentage !== undefined ? `(${p.sharePercentage}% ${tx('share', 'سهم', 'ونډه')})` : ''}
                    </option>
                  ))}
                  {currentPartners.length === 0 && (
                    <option value="">{tx('Company capital (no specific partner)', 'سرمایه عمومی شرکت (بدون شریک اختصاصی)', 'د شرکت پانګه (ځانګړی شریک نه لري)')}</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Contribution amount *', 'مبلغ واریزی *', 'د ونډې اندازه *')}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    placeholder={tx('e.g., 50000', 'مثال: 50000', 'لکه: ۵۰۰۰۰')}

                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Contribution currency', 'اسعار واریزی', 'د ونډې اسعار')}</label>
                  <select
                    value={invCurrency}
                    onChange={(e) => setInvCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-bold bg-surface text-ink"
                  >
                    <option value="AFN">{t("currencyAFN")}</option>
                    <option value="USD">{tx('US dollar (USD $)', 'دالر (USD $)', 'امریکايي ډالر (USD $)')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Received date', 'تاریخ دریافت', 'د ترلاسه کولو نېټه')}</label>
                  <input
                    type="date"
                    required
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Contribution type', 'نوعیت پرداخت', 'د ونډې ډول')}</label>
                  <select
                    value={invType}
                    onChange={(e) => setInvType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink"
                  >
                    <option value="additional">{tx('Additional contribution / new phase', 'واریز سهم / مرحله جدید', 'اضافي ونډه / نوې مرحله')}</option>
                    <option value="initial">{tx('Initial capital', 'سرمایه اولیه', 'لومړنۍ پانګه')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Payment method', 'روش دریافت', 'د ورکړې طریقه')}</label>
                  <input
                    type="text"
                    placeholder={tx('Cash, bank account, money exchange...', 'نقد، حساب بانکی، صرافی...', 'نغدې، بانکي حساب، صرافي...')}

                    value={invMethod}
                    onChange={(e) => setInvMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Receipt / document number', 'شماره رسید / سند', 'د رسېد / سند شمېره')}</label>
                  <input
                    type="text"
                    placeholder={tx('e.g., REC-9920', 'مثال: REC-9920', 'لکه: REC-9920')}

                    value={invReceipt}
                    onChange={(e) => setInvReceipt(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Description and notes', 'شرح و یادداشت', 'تشریح او یادښتونه')}</label>
                <textarea
                  rows={2}
                  placeholder={tx('Contribution details...', 'توضیحات واریزی...', 'د ونډې جزیات...')}

                  value={invNotes}
                  onChange={(e) => setInvNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsInvestmentFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >{t("cancel")}</button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
                >
                  {editingInvestment ? tx('Save changes', 'ثبت تغییرات', 'بدلونونه ثبتول') : tx('Record contribution', 'ثبت واریزی', 'ونډه ثبتول')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: Delete Partner Confirmation */}
      {partnerToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 animate-in fade-in">
          <div className="bg-surface rounded-3xl max-w-sm w-full p-5 space-y-3 border border-line shadow-2xl text-xs">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="font-extrabold text-sm text-ink">{tx('Delete partner', 'حذف شریک', 'شریک ړنګول')}</h4>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              {tx('Are you sure you want to delete partner "{name}"?', 'آیا از حذف شریک "{name}" اطمینان دارید؟', 'ایا ډاډه یاست چې "{name}" شریک ړنګ کړئ؟').replace('{name}', partnerToDelete.name)}
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPartnerToDelete(null)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
              >{t("cancel")}</button>
              <button
                type="button"
                onClick={() => {
                  deleteProjectPartner(partnerToDelete.id);
                  setPartnerToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
              >{t("deletePermanently")}</button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 4: Delete Investment Confirmation */}
      {investmentToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 animate-in fade-in">
          <div className="bg-surface rounded-3xl max-w-sm w-full p-5 space-y-3 border border-line shadow-2xl text-xs">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="font-extrabold text-sm text-ink">{tx('Delete capital contribution', 'حذف تراکنش سرمایه', 'د پانګې ونډه ړنګول')}</h4>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              {tx('Are you sure you want to delete the {amount} {currency} contribution from {partner}?', 'آیا از حذف واریزی {amount} {currency} از {partner} اطمینان دارید؟', 'ایا ډاډه یاست چې د {partner} د {amount} {currency} ونډه ړنګه کړئ؟')
                .replace('{amount}', investmentToDelete.amount.toLocaleString())
                .replace('{currency}', investmentToDelete.currency)
                .replace('{partner}', investmentToDelete.partnerName)}
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInvestmentToDelete(null)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
              >{t("cancel")}</button>
              <button
                type="button"
                onClick={() => {
                  deleteProjectInvestment(investmentToDelete.id);
                  setInvestmentToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
              >{t("deletePermanently")}</button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 5: Partner Equity Transfer & Exit */}
      {isTransferModalOpen && transferringPartner && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 animate-in fade-in overflow-y-auto">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 border border-line shadow-2xl text-xs my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                <div>
                  <h4 className="font-extrabold text-sm text-ink">
                    {tx('Transfer equity and partner exit', 'واگذاری سهم‌الشرکه و خروج شریک از پروژه', 'د ونډې لېږد او له پروژې د شریک وتل')}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {tx('Transferring partner:', 'شریک واگذارکننده:', 'لېږدوونکی شریک:')} <strong className="text-amber-600">{transferringPartner.name}</strong> ({tx('Current share:', 'سهم فعلی:', 'اوسنۍ ونډه:')} {transferringPartner.sharePercentage}٪)
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {transferError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-3.5">
              {/* Transfer Type */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Transfer and exit type:', 'نوعیت واگذاری و خروج:', 'د لېږد او وتلو ډول:')}</label>
                <select
                  value={transferType}
                  onChange={(e) => {
                    setTransferType(e.target.value as any);
                    if (e.target.value === 'partner_to_partner') {
                      const other = currentPartners.find(p => p.id !== transferringPartner.id && p.status !== 'exited');
                      setTargetPartnerId(other?.id || '');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-bold"
                >
                  <option value="partner_to_partner">{tx('Transfer to an existing project partner', 'واگذاری به یکی از شرکای موجود در پروژه', 'د پروژې یوه اوسني شریک ته لېږدول')}</option>
                  <option value="new_partner">{tx('Add a new partner / replacement investor', 'ورود شریک / سرمایه‌گذار جدید (جایگزین)', 'نوی شریک / بدیل پانګه‌وال ورزیاتول')}</option>
                  <option value="company_buyout">{tx('Company / project buyback', 'بازخرید سهم توسط خزانه شرکت / پروژه', 'د شرکت / پروژې له خوا د ونډې بېرته پېرل')}</option>
                </select>
              </div>

              {/* Target Buyer */}
              {transferType === 'partner_to_partner' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Buying partner (transferee):', 'شریک خریدار (انتقال‌گیرنده سهم):', 'پېرودونکی شریک (ترلاسه کوونکی):')}</label>
                  <select
                    value={targetPartnerId}
                    onChange={(e) => {
                      setTargetPartnerId(e.target.value);
                      const found = currentPartners.find(p => p.id === e.target.value);
                      if (found) setTargetPartnerName(found.name);
                    }}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-bold"
                  >
                    <option value="">{tx('-- Select buying partner --', '-- انتخاب شریک خریدار --', '-- پېرودونکی شریک وټاکئ --')}</option>
                    {currentPartners
                      .filter(p => p.id !== transferringPartner.id && p.status !== 'exited')
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({tx('Current share:', 'سهم فعلی:', 'اوسنۍ ونډه:')} {p.sharePercentage || 0}٪)
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {transferType === 'new_partner' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('New partner details (equity buyer):', 'نام و مشخصات شریک جدید (خریدار سهم):', 'د نوي شریک معلومات (د ونډې پېرودونکی):')}</label>
                  <input
                    type="text"
                    required
                    placeholder={tx('e.g., Farhad Rahimi (new investor)', 'مثلاً: انجنیر فرهاد رحیمی (سرمایه‌گذار جدید)', 'لکه: انجنیر فرهاد رحیمي (نوی پانګه‌وال)')}

                    value={targetPartnerName}
                    onChange={(e) => setTargetPartnerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-bold"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {tx('Percentage of equity transferred (%):', 'درصد سهم واگذارشده (٪):', 'د لېږدول شوې ونډې سلنه (%):')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max={transferringPartner.sharePercentage || 100}
                    required
                    value={transferPercentage}
                    onChange={(e) => setTransferPercentage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono font-bold"
                    placeholder={`${tx('Maximum', 'حداکثر', 'اعظمي')} ${transferringPartner.sharePercentage}%`}
                  />
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {tx('If the full share is transferred, the partner exits the project.', 'اگر تمام سهم واگذار شود، شریک از پروژه خارج می‌شود.', 'که ټوله ونډه ولېږدول شي، شریک له پروژې وځي.')}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Transaction / equity settlement amount:', 'مبلغ معامله / تسویه سهم:', 'د معاملې / ونډې د تصفیې اندازه:')}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    value={transferPrice}
                    onChange={(e) => setTransferPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono font-bold"
                    placeholder={tx('Agreed settlement amount...', 'مبلغ توافقی تسویه...', 'د هوکړې د تصفیې اندازه...')}

                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Currency:', 'واحد پولی:', 'اسعار:')}</label>
                  <select
                    value={transferCurrency}
                    onChange={(e) => setTransferCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-bold"
                  >
                    <option value="AFN">{t("currencyAFN")}</option>
                    <option value="USD">{tx('US dollar (USD $)', 'دالر (USD $)', 'امریکايي ډالر (USD $)')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Transfer date:', 'تاریخ واگذاری:', 'د لېږد نېټه:')}</label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Settlement deed number:', 'شماره صلح‌نامه:', 'د جوړجاړي سند شمېره:')}</label>
                  <input
                    type="text"
                    value={transferDeedNumber}
                    onChange={(e) => setTransferDeedNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono"
                    placeholder="DEED-104"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{tx('Settlement details and agreements:', 'توضیحات و توافقات تسویه حساب:', 'د تصفیې جزیات او هوکړې:')}</label>
                <textarea
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder={tx('e.g., All claims and accrued profit have been settled through this date, and the partner has no further financial claims against the project.', 'مثلاً: کلیه مطالبات و سود حاصله تا مورخه مذکور تسویه گردید و مشارالیه هیچ‌گونه ادعای مالی دیگری در پروژه ندارد.', 'لکه: ټولې غوښتنې او ترلاسه شوې ګټې تر دې نېټې تصفیه شوې دي او شریک پر پروژې نورې مالي دعوې نه لري.')}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >{t("cancel")}</button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md shadow-amber-500/20"
                >
                  {tx('Record transfer and exit', 'ثبت رسمی واگذاری و خروج', 'لېږد او وتل ثبتول')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 6: Printable Legal Equity Transfer Deed */}
      {printedTransferDeed && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 animate-in fade-in overflow-y-auto">
          <div className="bg-surface rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-line shadow-2xl text-xs my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line print:hidden">
              <h4 className="font-extrabold text-sm text-ink flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>{tx('Official settlement and equity transfer deed', 'سند رسمی صلح‌نامه و واگذاری سهم‌الشرکه', 'د جوړجاړي او د ونډې لېږد رسمي سند')}</span>
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{tx('Print official deed', 'چاپ سند رسمی', 'رسمي سند چاپول')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintedTransferDeed(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Legal Deed Printable Body */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 print:border-none print:p-0">
              <div className="text-center border-b pb-3 space-y-1">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {tx('Official agreement for settlement and final equity transfer', 'توافق‌نامه رسمی صلح و واگذاری قطعی سهم‌الشرکه', 'د جوړجاړي او د ونډې وروستي لېږد رسمي هوکړه‌لیک')}
                </h2>
                <p className="text-[11px] text-slate-500 font-bold">
                  {tx('Construction project:', 'پروژه ساختمانی:', 'ساختماني پروژه:')} {project?.name} ({project?.code}) • {tx('Deed number:', 'شماره سند:', 'د سند شمېره:')} {printedTransferDeed.deedNumber || 'DEED-OFFICIAL'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {tx('Settlement date:', 'تاریخ عقد صلح:', 'د جوړجاړي نېټه:')} {printedTransferDeed.transferDate}
                </p>
              </div>

              <div className="space-y-3 leading-relaxed text-slate-700 dark:text-slate-200 text-[11px]">
                <p>
                  {tx('Under this official deed, ', 'به موجب این سند رسمی، ', 'د دې رسمي سند له مخې، ')}
                  {tx('Mr./Ms. ', 'آقا/خانم ', 'ښاغلی/آغلې ')}<strong>{printedTransferDeed.fromPartnerName}</strong>{' '}
                  {tx('(the transferor), acting freely and with full consent, transfers all material and legal rights and equity amounting to ', '(مصالح / واگذارکننده)، با اراده و رضایت کامل، تمامی حقوق مادی، معنوی و سهم‌الشرکه خود را به میزان ', '(لېږدوونکی)، په خپله خوښه او بشپړ رضایت سره، خپلې ټولې مادي او قانوني حقونه او ونډه د ')}
                  <strong className="font-mono text-amber-700 dark:text-amber-400">{printedTransferDeed.transferredPercentage}٪</strong>{' '}
                  {tx('of the total interests and assets of the project to ', 'از کل منافع و دارایی‌های پروژه موصوف را به ', 'د پروژې له ټولو ګټو او شتمنیو څخه ترلاسه کوونکي ته لېږدوي: ')}
                  {tx('Mr./Ms./entity ', 'آقا/خانم/نهاد ', 'ښاغلي/آغلې/ادارې ته ')}<strong>{printedTransferDeed.toPartnerName}</strong>{' '}
                  {tx('(the transferee), in exchange for the final agreed purchase price of:', '(متصالح / انتقال‌گیرنده) در ازای بهای قطعی و توافق‌شده به مبلغ:', '(ترلاسه کوونکی)، د وروستۍ هوکړې شوې بیې په بدل کې:')}
                </p>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center font-mono font-black text-sm text-amber-800 dark:text-amber-300">
                  {formatNumber(printedTransferDeed.transferPrice, 0)} {printedTransferDeed.currency}
                </div>

                <p>
                  {tx('The transfer is final. The parties acknowledge that all accounts, debts and credits relating to this share have been fully settled through the date above, and the transferor waives any future claim concerning it.', 'صلح قطعی نمود و واگذار کرد. طرفین اقرار نمودند که حساب‌های مالی، بدهی‌ها و بستانکاری‌های مربوط به این میزان سهم تا تاریخ فوق‌الذکر کلاً تسویه گردیده و واگذارکننده حق هرگونه ادعای بعدی را در این خصوص از خود سلب و ساقط نمود.', 'لېږد وروستی دی. دواړه لوري مني چې د دې ونډې ټول حسابونه، پورونه او طلبونه تر پورته نېټې پورې بشپړ تصفیه شوي، او لېږدوونکی په دې اړه له هرې راتلونکې دعوې تېرېږي.')}
                </p>

                {printedTransferDeed.notes && (
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px]">
                    <strong>{tx('Additional terms and details:', 'شروط و توضیحات تکمیلی:', 'اضافي شرایط او جزیات:')}</strong> {printedTransferDeed.notes}
                  </div>
                )}
              </div>

              {/* Signatures Table */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-200 dark:border-slate-700 text-center text-[10px]">
                <div className="p-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                  <span className="font-bold block mb-1">{tx('Transferor signature and fingerprint:', 'امضا و اثر انگشت واگذارکننده:', 'د لېږدوونکي لاسلیک او د ګوتې نښه:')}</span>
                  <span className="text-slate-500">{printedTransferDeed.fromPartnerName}</span>
                  <div className="h-14 mt-2"></div>
                </div>

                <div className="p-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                  <span className="font-bold block mb-1">{tx('Transferee signature and fingerprint:', 'امضا و اثر انگشت انتقال‌گیرنده:', 'د ترلاسه کوونکي لاسلیک او د ګوتې نښه:')}</span>
                  <span className="text-slate-500">{printedTransferDeed.toPartnerName}</span>
                  <div className="h-14 mt-2"></div>
                </div>

                <div className="p-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                  <span className="font-bold block mb-1">{tx('Management approval and company seal:', 'تایید مدیریت و مهر شرکت:', 'د مدیریت تایید او د شرکت مهر:')}</span>
                  <span className="text-slate-500">{tx('Construction company management', 'مدیریت عامل شرکت ساختمانی', 'د ساختماني شرکت اجرائیه مدیریت')}</span>
                  <div className="h-14 mt-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

