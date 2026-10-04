import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, X, Check, Trash2, AlertCircle } from 'lucide-react';
import { Project, ProjectStatus } from '../../types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, project }) => {
  const { projects, updateProject, deleteProject, t, currentUser } = useApp();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [floors, setFloors] = useState('');
  const [units, setUnits] = useState('');
  const [buildingArea, setBuildingArea] = useState('');
  const [landInfo, setLandInfo] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('in_construction');
  const [currency, setCurrency] = useState<'USD' | 'AFN'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(70);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormError(null);
    if (project) {
      setName(project.name);
      setCode(project.code);
      setAddress(project.address);
      setCity(project.city);
      setFloors(project.floors.toString());
      setUnits(project.units.toString());
      setBuildingArea(project.buildingArea.toString());
      setLandInfo(project.landInfo || '');
      setStatus(project.status);
      setCurrency((project.currency as any) || 'USD');
      setExchangeRate(project.defaultExchangeRate || 70);
      setDescription(project.description || '');
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('نام پروژه الزامی است.');
      return;
    }

    const isDuplicate = projects.some(
      p => p.id !== project.id && p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (isDuplicate) {
      setFormError(`پروژه‌ای با نام "${name.trim()}" قبلاً وجود دارد.`);
      return;
    }

    const parsedFloors = parseInt(floors);
    if (isNaN(parsedFloors) || parsedFloors <= 0) {
      setFormError('تعداد منازل نامعتبر است.');
      return;
    }

    if (isNaN(exchangeRate) || exchangeRate <= 0) {
      setFormError('نرخ اسعار نامعتبر است.');
      return;
    }

    setIsSubmitting(true);
    updateProject(project.id, {
      name: name.trim(),
      code: code.trim() || project.code,
      address: address.trim(),
      city: city.trim(),
      floors: parsedFloors,
      units: parseInt(units) || project.units,
      buildingArea: parseFloat(buildingArea) || project.buildingArea,
      landInfo: landInfo.trim(),
      status,
      currency,
      defaultExchangeRate: exchangeRate,
      description: description.trim(),
    });
    setIsSubmitting(false);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(t.confirmDeleteProject || 'آیا از حذف دایمی این پروژه اطمینان دارید؟')) {
      deleteProject(project.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-surface rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-line my-auto animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">{t.editProject || 'ویرایش مشخصات پروژه'}</h3>
              <p className="text-[11px] text-slate-400">{project.name}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          
          {/* Error Banner */}
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-bold">{formError}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                {t.projectName || 'نام پروژه'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface font-bold text-ink focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                {t.projectCode || 'کد پروژه'}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                {t.city || 'شهر'}
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                {t.status || 'مرحله کار'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20 font-bold"
              >
                <option value="planning">{t.statusPlanning || 'پلان‌گذاری'}</option>
                <option value="in_construction">{t.statusInConstruction || 'در حال اعمار'}</option>
                <option value="finishing">{t.statusFinishing || 'نازک‌کاری'}</option>
                <option value="completed">{t.statusCompleted || 'تکمیل شده'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              {t.address || 'آدرس'}
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">{t.floors || 'منازل'}</label>
              <input
                type="number"
                min="1"
                required
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">{t.units || 'واحدها'}</label>
              <input
                type="number"
                min="1"
                required
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">{t.areaM2 || 'مساحت زیربنا'}</label>
              <input
                type="number"
                step="any"
                value={buildingArea}
                onChange={(e) => setBuildingArea(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink font-mono"
              />
            </div>
          </div>

          {/* Currency and exchange rate */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-line rounded-2xl space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">واحد اسعار و نرخ صرافی:</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">اسعار پروژه</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                      currency === 'USD' ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    دالر ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('AFN')}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                      currency === 'AFN' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    افغانی
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">نرخ برابری (۱ دالر به افغانی)</label>
                <input
                  type="number"
                  step="any"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 70)}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-surface font-mono font-bold text-xs text-ink"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">{t.landInfo || 'مشخصات زمین'}</label>
            <input
              type="text"
              value={landInfo}
              onChange={(e) => setLandInfo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">{t.description || 'توضیحات'}</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-surface text-xs text-ink"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-line flex items-center justify-between">
            {currentUser?.role === 'admin' ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-bold flex items-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-900"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>{t.deleteProject || 'حذف پروژه'}</span>
              </button>
            ) : <div />}
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors text-slate-700 dark:text-slate-300"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 text-amber-400 dark:text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'در حال ثبت...' : t.save}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
