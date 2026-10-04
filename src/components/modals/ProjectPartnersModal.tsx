import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectPartner, ProjectInvestment } from '../../types';
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
    addProjectPartner, 
    updateProjectPartner, 
    deleteProjectPartner, 
    addProjectInvestment, 
    updateProjectInvestment, 
    deleteProjectInvestment,
    t,
    currentUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'partners' | 'investments'>('partners');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-surface rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-line my-auto animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base">
                  مدیریت شرکای پروژه و سهم سرمایه‌گذاری
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                  {project.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>{project.name}</span>
                <span>•</span>
                <span>سهم‌داری و دفتر روزنامچه واریزی‌ها</span>
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
                <span className="text-[11px] font-bold text-ink-muted">مجموع سرمایه واریز شده:</span>
                <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-0.5">
                {totalStats.totalAFN > 0 && (
                  <div className="font-mono text-base font-black text-ink">
                    {totalStats.totalAFN.toLocaleString()} <span className="text-xs font-sans font-bold text-emerald-700 dark:text-emerald-400">افغانی</span>
                  </div>
                )}
                {totalStats.totalUSD > 0 && (
                  <div className="font-mono text-base font-black text-ink">
                    ${totalStats.totalUSD.toLocaleString()} <span className="text-xs font-sans font-bold text-blue-700 dark:text-blue-400">دالر</span>
                  </div>
                )}
                {totalStats.totalAFN === 0 && totalStats.totalUSD === 0 && (
                  <div className="text-xs text-slate-400 font-bold">بدون ثبت واریزی</div>
                )}
              </div>
            </div>

            {/* Total Allocated Share % */}
            <div className="p-3.5 rounded-2xl bg-surface border border-line shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-ink-muted">مجموع سهام تعیین‌شده:</span>
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
                    ? 'تکمیل (۱۰۰٪)' 
                    : totalStats.totalShare < 100 
                    ? `${(100 - totalStats.totalShare).toFixed(1)}% باقیمانده` 
                    : 'فراتر از ۱۰۰٪'}
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
                <span className="text-[11px] font-bold text-ink-muted block mb-1">تعداد شرکا و تراکنش‌ها:</span>
                <div className="font-extrabold text-sm text-ink flex items-center gap-2">
                  <span>{totalStats.partnerCount} شریک</span>
                  <span>•</span>
                  <span>{totalStats.investmentCount} واریزی</span>
                </div>
              </div>
              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleOpenPartnerForm()}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن شریک</span>
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
            <span>فهرست شرکا ({currentPartners.length})</span>
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
            <span>دفتر واریزی‌ها و سرمایه ({currentInvestments.length})</span>
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
                    <h4 className="font-extrabold text-ink text-sm">هیچ شریکی برای این پروژه ثبت نشده است</h4>
                    <p className="text-ink-muted text-xs mt-1">
                      می‌توانید اشخاص و شرکا را به همراه درصد سهم و سرمایه‌گذاری اولیه در اینجا تعریف کنید.
                    </p>
                  </div>
                  {currentUser?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleOpenPartnerForm()}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>افزودن اولین شریک</span>
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
                            <h4 className="font-extrabold text-ink text-sm">{partner.name}</h4>
                            <div className="flex items-center gap-3 text-ink-muted text-[11px] mt-0.5">
                              {partner.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span className="font-mono">{partner.phone}</span>
                                </span>
                              )}
                              {partner.nationalId && (
                                <span className="text-slate-400 font-mono">
                                  تذکره: {partner.nationalId}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-black font-mono text-xs">
                            {partner.sharePercentage !== undefined ? `${partner.sharePercentage}%` : 'بدون سهم مشخص'}
                          </span>
                        </div>

                        {/* Financial Figures */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl mb-3 border border-slate-100 dark:border-slate-750 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">سرمایه تعهد شده اولیه:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {partner.initialInvestment !== undefined ? (
                                `${partner.initialInvestment.toLocaleString()} ${partner.currency}`
                              ) : (
                                'نامشخص'
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">مجموع واریزی‌ها:</span>
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
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleOpenInvestmentForm(partner.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold transition-colors flex items-center gap-1"
                        >
                          <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>+ ثبت واریزی پول</span>
                        </button>

                        {currentUser?.role === 'admin' && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenPartnerForm(partner)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title="ویرایش شریک"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPartnerToDelete(partner)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="حذف شریک"
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
                  <h4 className="font-extrabold text-ink text-xs sm:text-sm">دفتر روزنامچه واریزی‌های سرمایه</h4>
                  <p className="text-[11px] text-slate-500">تمامی مبالغ نقد، صرافی و بانکی واریز شده توسط شرکا به صورت تفکیک‌شده ثبت می‌شود.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenInvestmentForm()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ثبت واریزی جدید</span>
                </button>
              </div>

              {currentInvestments.length === 0 ? (
                <div className="p-8 text-center bg-surface-2/40 rounded-2xl border border-line space-y-2">
                  <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">هیچ واریزی سرمایه‌ای تا اکنون ثبت نشده است.</p>
                </div>
              ) : (
                <div className="border border-line rounded-2xl overflow-hidden shadow-xs bg-surface">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold border-b border-line">
                        <tr>
                          <th className="py-2.5 px-3 text-start">تاریخ</th>
                          <th className="py-2.5 px-3 text-start">نام شریک / واریزکننده</th>
                          <th className="py-2.5 px-3 text-start">مبلغ واریزی</th>
                          <th className="py-2.5 px-3 text-start">نوعیت</th>
                          <th className="py-2.5 px-3 text-start">روش پرداخت</th>
                          <th className="py-2.5 px-3 text-start">شماره رسید</th>
                          <th className="py-2.5 px-3 text-start">توضیحات</th>
                          <th className="py-2.5 px-3 text-center">عملیات</th>
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
                                {inv.type === 'initial' ? 'سرمایه اولیه' : 'سهم دوره‌ای'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {inv.paymentMethod || 'نقدی'}
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
                                  title="ویرایش"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInvestmentToDelete(inv)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title="حذف"
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

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-line flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            بستن پنل شرکا
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
                  {editingPartner ? 'ویرایش مشخصات شریک' : 'افزودن شریک جدید به پروژه'}
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
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نام و تخلص شریک (اجباری)</label>
                <input
                  type="text"
                  placeholder="مثلاً: حاجی محمد نادر"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شماره تماس (اختیاری)</label>
                  <input
                    type="text"
                    placeholder="مثال: 0799123456"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شماره تذکره / آی‌دی (اختیاری)</label>
                  <input
                    type="text"
                    placeholder="مثال: 1402-8877"
                    value={partnerNationalId}
                    onChange={(e) => setPartnerNationalId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">فیصدی سهم (%) (اختیاری)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    placeholder="مثلاً: 50"
                    value={partnerShare}
                    onChange={(e) => setPartnerShare(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-mono font-bold"
                  />
                </div>

                {!editingPartner && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">سرمایه اولیه تعهد شده (اختیاری)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="مثلاً: 100000"
                      value={partnerInitialInv}
                      onChange={(e) => setPartnerInitialInv(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسعار سرمایه‌گذاری</label>
                  <select
                    value={partnerCurrency}
                    onChange={(e) => setPartnerCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-bold bg-surface text-ink"
                  >
                    <option value="AFN">افغانی (AFN)</option>
                    <option value="USD">دالر (USD $)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ ورود / قرارداد (اختیاری)</label>
                  <input
                    type="date"
                    value={partnerDate}
                    onChange={(e) => setPartnerDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">یادداشت و شرایط خاص (اختیاری)</label>
                <textarea
                  rows={2}
                  placeholder="شرایط توافق یا یادداشت شراکت..."
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
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs"
                >
                  {editingPartner ? 'ثبت تغییرات' : 'افزودن شریک'}
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
                  {editingInvestment ? 'ویرایش واریزی سرمایه' : 'ثبت واریزی جدید توسط شریک'}
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
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">انتخاب شریک</label>
                <select
                  required
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-bold bg-surface text-ink"
                >
                  {currentPartners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sharePercentage !== undefined ? `(${p.sharePercentage}% سهم)` : ''}
                    </option>
                  ))}
                  {currentPartners.length === 0 && (
                    <option value="">سرمایه عمومی شرکت (بدون شریک اختصاصی)</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">مبلغ واریزی *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    placeholder="مثال: 50000"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسعار واریزی</label>
                  <select
                    value={invCurrency}
                    onChange={(e) => setInvCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-bold bg-surface text-ink"
                  >
                    <option value="AFN">افغانی (AFN)</option>
                    <option value="USD">دالر (USD $)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تاریخ دریافت</label>
                  <input
                    type="date"
                    required
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نوعیت پرداخت</label>
                  <select
                    value={invType}
                    onChange={(e) => setInvType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink"
                  >
                    <option value="additional">واریز سهم / مرحله جدید</option>
                    <option value="initial">سرمایه اولیه</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">روش دریافت</label>
                  <input
                    type="text"
                    placeholder="نقد، حساب بانکی، صرافی..."
                    value={invMethod}
                    onChange={(e) => setInvMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شماره رسید / سند</label>
                  <input
                    type="text"
                    placeholder="مثال: REC-9920"
                    value={invReceipt}
                    onChange={(e) => setInvReceipt(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شرح و یادداشت</label>
                <textarea
                  rows={2}
                  placeholder="توضیحات واریزی..."
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
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
                >
                  {editingInvestment ? 'ثبت تغییرات' : 'ثبت واریزی'}
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
              <h4 className="font-extrabold text-sm text-ink">حذف شریک</h4>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              آیا از حذف شریک <strong className="text-ink">"{partnerToDelete.name}"</strong> اطمینان دارید؟
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPartnerToDelete(null)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProjectPartner(partnerToDelete.id);
                  setPartnerToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
              >
                حذف دایمی
              </button>
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
              <h4 className="font-extrabold text-sm text-ink">حذف تراکنش سرمایه</h4>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              آیا از حذف واریزی <strong className="text-ink">{investmentToDelete.amount.toLocaleString()} {investmentToDelete.currency}</strong> از {investmentToDelete.partnerName} اطمینان دارید؟
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInvestmentToDelete(null)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProjectInvestment(investmentToDelete.id);
                  setInvestmentToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
              >
                حذف دایمی
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
