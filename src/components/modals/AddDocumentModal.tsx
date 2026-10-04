import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FileCheck2, X, Upload, Camera } from 'lucide-react';
import { DocumentCategory } from '../../types';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, addDocument, t, openCameraForCapture } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('permits');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80');
  const [notes, setNotes] = useState('');

  if (!isOpen || !currentProject) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addDocument({
      projectId: currentProject.id,
      title: title.trim(),
      category,
      fileUrl: previewUrl,
      fileType: 'image/jpeg',
      date,
      amount: parseFloat(amount) || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-900 text-white">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <FileCheck2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm">{t.uploadDocument}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">عنوان سند یا مدرک</label>
            <input
              type="text"
              required
              placeholder="مثلاً: تست لابراتوار مقاومت ۲۸ روزه کانکریت"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.category}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="permits">{t.docPermits}</option>
                <option value="drawings">{t.docDrawings}</option>
                <option value="lab_reports">{t.docLabReports}</option>
                <option value="contracts">{t.docContracts}</option>
                <option value="invoices">{t.docInvoices}</option>
                <option value="sales_contracts">{t.docSalesContracts}</option>
                <option value="legal">{t.docLegal}</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.date}</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">مبلغ مالی مرتبط ($) - اختیاری</label>
            <input
              type="number"
              step="any"
              placeholder="در صورتی که بل مالی است، مبلغ را بنویسید"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">آپلود فایل یا عکس</label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center hover:border-amber-500 transition-colors">
              <input
                type="file"
                accept="image/*,application/pdf"
                id="doc-file-input"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="doc-file-input" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="font-bold text-slate-800 dark:text-slate-200">کلیک برای انتخاب فایل عکس یا PDF</span>
                <span className="text-[11px] text-slate-400 mt-1">فرمت‌های JPG, PNG, PDF پشتیبانی می‌شود</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.notes}</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                openCameraForCapture({ title: title || 'Project Document' });
              }}
              className="flex items-center space-x-1.5 rtl:space-x-reverse text-amber-700 dark:text-amber-400 hover:text-amber-800 font-bold"
            >
              <Camera className="w-4 h-4" />
              <span>{t.takePhoto}</span>
            </button>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
              >
                {t.save}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
