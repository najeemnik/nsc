import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  Calendar, 
  DollarSign, 
  User, 
  FileText, 
  CheckCircle2 
} from 'lucide-react';
import { Payment } from '../../types';

interface PaymentsViewProps {
  onOpenAddPayment: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ onOpenAddPayment }) => {
  const { 
    currentProject, 
    payments, 
    deletePayment, 
    formatCurrency, 
    formatNumber, 
    t, 
    language 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);

  const projectPayments = useMemo(() => {
    return payments.filter(p => p.projectId === currentProject?.id);
  }, [payments, currentProject]);

  const filteredPayments = useMemo(() => {
    return projectPayments.filter(p => {
      return (
        (p.recipientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.paymentMethod || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.referenceNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [projectPayments, searchTerm]);

  const totalPaidUSD = filteredPayments.reduce((sum, p) => sum + (p.amountUSD || 0), 0);
  const totalPaidAFN = filteredPayments.reduce((sum, p) => sum + (p.amountAFN || 0), 0);

  const handleDelete = (id: string, recipient: string) => {
    if (confirm(t('confirmDeletePayment') || `Are you sure you want to delete payment to "${recipient}"?`)) {
      deletePayment(id);
    }
  };

  const handlePrintVoucher = (p: Payment) => {
    setSelectedReceiptPayment(p);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>{t('paymentsRegister') || 'Payments & Disbursements'}</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {currentProject?.name} • {t('totalDisbursed')}: <strong>{formatCurrency(totalPaidUSD, 'USD')}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>{t('printList') || 'Print List'}</span>
          </button>

          <button
            onClick={onOpenAddPayment}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addPayment') || 'New Payment Voucher'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('paymentTransactions') || 'Disbursement Count'}</span>
          <p className="text-xl font-black text-ink mt-1">{filteredPayments.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('totalPaidUSD') || 'Total Paid (USD)'}</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalPaidUSD, 'USD')}</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <span className="text-xs text-slate-400 font-medium">{t('totalPaidAFN') || 'Total Paid (AFN)'}</span>
          <p className="text-xl font-black text-ink mt-1">{formatNumber(totalPaidAFN, 0)} AFN</p>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-surface border border-line">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchPayments') || 'Search recipient, method, reference...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-2/80 border border-line rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2/60 text-ink-muted font-bold border-b border-line">
              <tr>
                <th className="py-3.5 px-4">{t('date') || 'Date'}</th>
                <th className="py-3.5 px-4">{t('recipient') || 'Recipient / Payee'}</th>
                <th className="py-3.5 px-4">{t('paymentMethod') || 'Payment Method'}</th>
                <th className="py-3.5 px-4">{t('referenceNumber') || 'Ref / Voucher #'}</th>
                <th className="py-3.5 px-4">{t('notes') || 'Purpose / Notes'}</th>
                <th className="py-3.5 px-4 text-right">{t('amountUSD') || 'Amount (USD)'}</th>
                <th className="py-3.5 px-4 text-center">{t('receipt') || 'Voucher'}</th>
                <th className="py-3.5 px-4 text-center">{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-ink-muted whitespace-nowrap">{p.date}</td>
                  <td className="py-3.5 px-4 font-bold text-ink">{p.recipientName}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 bg-surface-2 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{p.referenceNumber || '—'}</td>
                  <td className="py-3.5 px-4 text-ink-muted max-w-xs truncate">{p.notes || '—'}</td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    <div>{formatCurrency(p.amountUSD, 'USD')}</div>
                    {p.currency !== 'USD' && (
                      <div className="text-[10px] text-slate-400 font-normal">
                        {formatNumber(p.amount, 0)} {p.currency}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handlePrintVoucher(p)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                      title={t('printVoucher') || 'Print Payment Receipt'}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleDelete(p.id, p.recipientName || p.partyName || 'Payment')}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    {t('noPaymentsFound') || 'No payment transactions recorded'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Voucher Preview */}
      {selectedReceiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:p-0 print:bg-transparent print:fixed">
          <div className="bg-white text-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl print:shadow-none print:w-full print:rounded-none">
            <div className="flex justify-between items-start border-b pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-blue-900">NIK SMART COUNT</h2>
                <p className="text-xs text-slate-500">{t('paymentReceipt') || 'Official Payment Voucher'}</p>
                <p className="text-xs font-semibold text-slate-700 mt-1">{currentProject?.name}</p>
              </div>
              <button 
                onClick={() => setSelectedReceiptPayment(null)} 
                className="p-1.5 hover:bg-slate-100 rounded-lg print:hidden"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('voucherNo') || 'Voucher No'}:</span>
                <span className="font-mono font-bold">#PAY-{selectedReceiptPayment.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('date') || 'Date'}:</span>
                <span className="font-semibold">{selectedReceiptPayment.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('payee') || 'Paid To'}:</span>
                <span className="font-bold text-sm text-slate-900">{selectedReceiptPayment.recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('method') || 'Payment Method'}:</span>
                <span className="font-medium">{selectedReceiptPayment.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-y my-2">
                <span className="font-bold text-slate-800">{t('amountPaid') || 'Amount Paid'}:</span>
                <span className="text-lg font-black text-emerald-600">
                  {formatCurrency(selectedReceiptPayment.amountUSD, 'USD')} ({formatNumber(selectedReceiptPayment.amount, 0)} {selectedReceiptPayment.currency})
                </span>
              </div>
              {selectedReceiptPayment.notes && (
                <div className="text-slate-600">
                  <span className="font-semibold">{t('purpose') || 'Purpose'}:</span> {selectedReceiptPayment.notes}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t flex justify-between text-center text-xs">
              <div>
                <div className="w-28 border-b border-slate-400 mb-1" />
                <span className="text-slate-500">{t('preparedBy') || 'Payer Signature'}</span>
              </div>
              <div>
                <div className="w-28 border-b border-slate-400 mb-1" />
                <span className="text-slate-500">{t('receiverSignature') || 'Receiver Signature'}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                {t('print') || 'Print Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
