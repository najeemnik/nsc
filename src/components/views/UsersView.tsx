import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { localizeText } from '../../i18n/localize';
import {
  backendApi,
  type EmployeeAccessData,
  type EmployeePermissionAction,
  type EmployeeProjectGrant,
} from '../../services/backendApi';
import { Mail, Phone, ShieldAlert, ShieldCheck, Users, Save, RefreshCw } from 'lucide-react';

const ACTION_ORDER: EmployeePermissionAction[] = ['read', 'create', 'update', 'delete', 'report'];

const MODULE_LABELS: Record<string, { en: string; fa: string; ps: string }> = {
  dashboard: { en: 'Dashboard', fa: 'داشبورد', ps: 'ډشبورډ' },
  projects: { en: 'Project details', fa: 'معلومات پروژه', ps: 'د پروژې معلومات' },
  income: { en: 'Income', fa: 'عواید', ps: 'عواید' },
  materials: { en: 'Materials', fa: 'مصالح', ps: 'توکي' },
  labor: { en: 'Labor', fa: 'کارگران', ps: 'کارګران' },
  steel: { en: 'Steel', fa: 'سیخ‌گول', ps: 'سیخ‌ګول' },
  concrete: { en: 'Concrete', fa: 'کانکریت', ps: 'کانکریټ' },
  expenses: { en: 'Expenses', fa: 'مصارف', ps: 'لګښتونه' },
  contractors: { en: 'Contractors', fa: 'قراردادیان', ps: 'قراردادیان' },
  suppliers: { en: 'Suppliers', fa: 'عرضه‌کنندگان', ps: 'عرضه‌کوونکي' },
  apartments: { en: 'Apartments', fa: 'پلاک‌ها و آپارتمان‌ها', ps: 'اپارتمانونه' },
  payments: { en: 'Payments', fa: 'پرداخت‌ها', ps: 'تادیات' },
  treasury: { en: 'Treasury', fa: 'خزانه', ps: 'خزانه' },
  petty_cash: { en: 'Petty cash', fa: 'صندوق خُرد', ps: 'وړه نغدي صندوق' },
  assets: { en: 'Assets', fa: 'دارایی‌ها', ps: 'شتمنۍ' },
  transfers: { en: 'Transfers', fa: 'انتقالات', ps: 'لېږدونه' },
  partners: { en: 'Partners', fa: 'شرکا', ps: 'شریکان' },
  budget: { en: 'Budgets', fa: 'بودجه', ps: 'بودیجه' },
  accounting: { en: 'Accounting', fa: 'حسابداری', ps: 'محاسبه' },
  journal: { en: 'Journal', fa: 'روزنامچه', ps: 'ورځپاڼه' },
  documents: { en: 'Documents', fa: 'اسناد', ps: 'اسناد' },
  reports: { en: 'Reports', fa: 'گزارش‌ها', ps: 'راپورونه' },
};

const ACTION_LABELS: Record<EmployeePermissionAction, { en: string; fa: string; ps: string }> = {
  read: { en: 'Read', fa: 'خواندن', ps: 'لوستل' },
  create: { en: 'Create', fa: 'ایجاد', ps: 'جوړول' },
  update: { en: 'Edit', fa: 'ویرایش', ps: 'سمون' },
  delete: { en: 'Delete', fa: 'حذف', ps: 'ړنګول' },
  report: { en: 'Generate report', fa: 'تهیهٔ گزارش', ps: 'راپور جوړول' },
};

const ROLE_LABELS: Record<string, { en: string; fa: string; ps: string }> = {
  project_manager: { en: 'Project manager', fa: 'مدیر پروژه', ps: 'د پروژې مدیر' },
  accountant: { en: 'Accountant', fa: 'حسابدار', ps: 'محاسب' },
  procurement: { en: 'Procurement', fa: 'تدارکات', ps: 'تدارکات' },
  viewer: { en: 'Read-only', fa: 'فقط‌خواندنی', ps: 'یوازې لوستل' },
};

const PROJECT_STATUS_LABELS: Record<string, { en: string; fa: string; ps: string }> = {
  active: { en: 'Active', fa: 'فعال', ps: 'فعال' },
  planning: { en: 'Planning', fa: 'در حال برنامه‌ریزی', ps: 'د پلان جوړونې' },
  completed: { en: 'Completed', fa: 'تکمیل‌شده', ps: 'بشپړ شوې' },
  on_hold: { en: 'On hold', fa: 'متوقف', ps: 'درېدلې' },
  archived: { en: 'Archived', fa: 'آرشیف', ps: 'آرشیف' },
};

function grantsSignature(grants: EmployeeProjectGrant[]): string {
  return [...grants]
    .map(grant => `${grant.projectId}:${grant.module}:${ACTION_ORDER.filter(action => grant.actions.includes(action)).join(',')}`)
    .sort()
    .join('|');
}

export const UsersView: React.FC = () => {
  const { currentUser, language } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  const isOwner = currentUser?.role === 'admin' && !currentUser.ownerAdminId && !currentUser.isMasterSuperAdmin;

  const [accessData, setAccessData] = useState<EmployeeAccessData | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [draftGrants, setDraftGrants] = useState<EmployeeProjectGrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; success: boolean } | null>(null);
  const loadErrorText = tx('Employee access settings could not be loaded.', 'بارگذاری تنظیمات دسترسی کارمندان ممکن نشد.', 'د کارکوونکو د لاسرسي امستنې بار نه شوې.');
  const saveErrorText = tx('Employee permissions could not be saved.', 'ذخیرهٔ مجوزهای کارمندان ممکن نشد.', 'د کارکوونکو اجازې خوندي نه شوې.');

  useEffect(() => {
    if (!isOwner) return;
    let active = true;
    setLoading(true);
    setError(null);
    backendApi.getEmployeeAccess().then(result => {
      if (!active) return;
      if (!result.success || !result.data) {
        setError(loadErrorText);
        return;
      }
      setAccessData(result.data);
      setSelectedEmployeeId(result.data.employees[0]?.id || '');
    }).catch(() => {
      if (active) setError(loadErrorText);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [isOwner, loadErrorText]);

  const selectedEmployee = accessData?.employees.find(employee => employee.id === selectedEmployeeId) || null;
  const isDirty = Boolean(selectedEmployee) && grantsSignature(draftGrants) !== grantsSignature(selectedEmployee?.grants || []);

  useEffect(() => {
    setDraftGrants(selectedEmployee?.grants || []);
    setNotice(null);
  }, [selectedEmployeeId]);

  const moduleLabel = (module: string) => {
    const labels = MODULE_LABELS[module] || { en: 'Other module', fa: 'ماژول دیگر', ps: 'بل ماډل' };
    return localizeText(language, labels);
  };

  const employeeRoleLabel = (role: string) => {
    const labels = ROLE_LABELS[role] || { en: 'Employee', fa: 'کارمند', ps: 'کارکوونکی' };
    return localizeText(language, labels);
  };

  const actionLabel = (action: EmployeePermissionAction) => localizeText(language, ACTION_LABELS[action]);

  const projectStatusLabel = (status: string) => {
    const labels = PROJECT_STATUS_LABELS[status] || { en: 'Project', fa: 'پروژه', ps: 'پروژه' };
    return localizeText(language, labels);
  };

  const toggleGrantAction = (
    projectId: string,
    module: string,
    action: EmployeePermissionAction,
    checked: boolean,
  ) => {
    setDraftGrants(current => {
      const existing = current.find(grant => grant.projectId === projectId && grant.module === module);
      const actionSet = new Set(existing?.actions || []);
      if (action === 'read' && !checked) {
        return current.filter(grant => grant.projectId !== projectId || grant.module !== module);
      }
      if (checked) {
        actionSet.add('read');
        actionSet.add(action);
      } else {
        actionSet.delete(action);
      }
      const actions = ACTION_ORDER.filter(item => actionSet.has(item));
      const next = current.filter(grant => grant.projectId !== projectId || grant.module !== module);
      if (actions.length) next.push({ projectId, module, actions });
      return next;
    });
    setNotice(null);
  };

  const saveGrants = async () => {
    if (!selectedEmployee || !isDirty) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    const grants = [...draftGrants]
      .map(grant => ({
        projectId: grant.projectId,
        module: grant.module,
        actions: ACTION_ORDER.filter(action => grant.actions.includes(action)),
      }))
      .filter(grant => grant.actions.length > 0);
    try {
      const result = await backendApi.saveEmployeeProjectGrants(selectedEmployee.id, grants);
      if (!result.success || !result.data) {
        setError(saveErrorText);
        return;
      }
      setAccessData(current => current ? {
        ...current,
        employees: current.employees.map(employee => employee.id === selectedEmployee.id
          ? { ...employee, grants: result.data!.grants }
          : employee),
      } : current);
      setDraftGrants(result.data.grants);
      setNotice({
        success: true,
        text: tx('Permissions saved on the server.', 'مجوزها در سرور ذخیره شد.', 'اجازې په سرور کې خوندي شوې.'),
      });
    } catch {
      setError(saveErrorText);
    } finally {
      setSaving(false);
    }
  };

  const accountNotice = tx(
    'Employee sign-in and account creation/editing/deletion remain disabled pending PHP/MySQL integration testing and security review. This screen manages grants only for employee accounts that already exist on the server.',
    'ورود کارمندان و ایجاد، ویرایش و حذف حساب‌ها تا آزمایش یکپارچهٔ PHP/MySQL و بازبینی امنیتی غیرفعال است. این صفحه فقط مجوز حساب‌های کارمندی را تنظیم می‌کند که از قبل در سرور موجود باشند.',
    'د کارکوونکو ننوتل او د حسابونو جوړول، سمون او ړنګول تر PHP/MySQL ازموینې او امنیتي بیاکتنې پورې بند دي. دا پاڼه یوازې د هغو کارکوونکو اجازې اداره کوي چې حسابونه یې لا په سرور کې شته.',
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-ink flex items-center gap-2.5">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>{tx('Staff & User Access Management', 'مدیریت کارمندان و دسترسی', 'د کارکوونکو او لاسرسي اداره')}</span>
        </h1>
        <p className="text-xs text-ink-muted mt-1">
          {tx('Owner-managed access by project, module, and action.', 'مدیریت دسترسی توسط مالک بر اساس پروژه، ماژول و عملیات.', 'د پروژې، ماډل او کړنې له مخې د مالک له خوا د لاسرسي اداره.')}
        </p>
      </div>

      <div role="status" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <p>{accountNotice}</p>
      </div>

      {!isOwner ? (
        <div role="alert" className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-muted">
          {tx('Only the signed-in company owner can manage employee access.', 'فقط مالک شرکت می‌تواند دسترسی کارمندان را مدیریت کند.', 'یوازې د شرکت مالک د کارکوونکو لاسرسی اداره کولای شي.')}
        </div>
      ) : (
        <section className="rounded-2xl border border-line bg-surface p-4 sm:p-6 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <label htmlFor="employee-access-select" className="mb-1.5 block text-xs font-bold text-ink-muted">
                {tx('Existing employee account', 'حساب کارمند موجود', 'د کارکوونکي موجود حساب')}
              </label>
              <select
                id="employee-access-select"
                value={selectedEmployeeId}
                onChange={event => setSelectedEmployeeId(event.target.value)}
                disabled={loading || saving || !accessData?.employees.length}
                className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink"
              >
                {accessData?.employees.length
                  ? accessData.employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} · @{employee.username}{employee.isLocked ? (tx(' · Locked', ' · قفل', ' · بند')) : ''}
                    </option>
                  ))
                  : <option value="">{tx('No employee accounts found', 'حساب کارمندی پیدا نشد', 'د کارکوونکو حسابونه ونه موندل شول')}</option>}
              </select>
            </div>
            <button
              type="button"
              onClick={() => void saveGrants()}
              disabled={!selectedEmployee || !isDirty || saving || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? (tx('Saving…', 'در حال ذخیره…', 'خوندي کېږي…')) : (tx('Save access', 'ذخیرهٔ دسترسی', 'لاسرسی خوندي کړئ'))}
            </button>
          </div>

          {selectedEmployee && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-canvas/70 px-3 py-2.5 text-xs text-ink-muted">
              <span className="font-bold text-ink">{selectedEmployee.name}</span>
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />{employeeRoleLabel(selectedEmployee.role)}</span>
              {selectedEmployee.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selectedEmployee.email}</span>}
              {selectedEmployee.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selectedEmployee.phone}</span>}
              <span className={selectedEmployee.isLocked ? 'font-bold text-rose-600' : 'font-bold text-emerald-600'}>
                {selectedEmployee.isLocked
                  ? (tx('Locked', 'قفل‌شده', 'بند'))
                  : (tx('Unlocked', 'قفل‌نشده', 'پرانیستل شوی'))}
              </span>
            </div>
          )}

          {loading && <p role="status" className="text-sm text-ink-muted">{tx('Loading server access settings…', 'در حال بارگذاری دسترسی‌های سرور…', 'د سرور د لاسرسي امستنې بارېږي…')}</p>}
          {!loading && accessData && !accessData.employees.length && (
            <div className="rounded-xl border border-dashed border-line p-5 text-sm text-ink-muted">
              {tx('There are no employee accounts under this owner yet. Employee account provisioning remains disabled.', 'برای این مالک هنوز حساب کارمندی ثبت نشده است. ایجاد حساب کارمند همچنان غیرفعال است.', 'د دې مالک لپاره لا د کارکوونکو حسابونه نشته. د کارکوونکو د حسابونو جوړول لا بند دي.')}
            </div>
          )}
          {!loading && accessData && accessData.employees.length > 0 && !accessData.projects.length && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
              {tx('Save at least one project in the owner workspace before assigning access.', 'پیش از تعیین دسترسی، دست‌کم یک پروژه را در فضای کاری مالک ذخیره کنید.', 'د لاسرسي تر ټاکلو مخکې لږ تر لږه یوه پروژه په کاري‌ځای کې خوندي کړئ.')}
            </div>
          )}

          {!loading && selectedEmployee && Boolean(accessData?.projects.length) && (
            <>
              <p className="text-xs text-ink-muted">
                {tx('Saving replaces this employee’s complete grant set. Unchecked rights are revoked. Write and report actions automatically include Read.', 'ذخیره، تمام مجوزهای این کارمند را جایگزین می‌کند؛ گزینه‌های برداشته‌شده لغو می‌شوند. عملیات نوشتن و گزارش‌گیری، مجوز خواندن را نیز لازم می‌سازد.', 'خوندي کول د دې کارکوونکي ټولې اجازې بدلوي. نښه‌نه شوې اجازه لغوه کېږي. د لیکلو او راپور جوړولو کړنې د لوستلو اجازه هم غواړي.')}
              </p>
              <div className="space-y-3">
                {accessData!.projects.map((project, projectIndex) => {
                  const archived = project.status === 'archived';
                  return (
                    <details key={project.id} open={projectIndex === 0} className="group rounded-xl border border-line bg-canvas/50">
                      <summary className="cursor-pointer list-none px-4 py-3 font-bold text-ink flex flex-wrap items-center justify-between gap-2">
                        <span>{project.name || project.id}</span>
                        <span className={`text-[10px] uppercase tracking-wide ${archived ? 'text-amber-700' : 'text-ink-muted'}`}>
                          {archived ? (tx('Archived · read/report only', 'آرشیف · فقط خواندن و گزارش‌گیری', 'آرشیف · یوازې لوستل او راپور')) : (project.projectCode || projectStatusLabel(project.status))}
                        </span>
                      </summary>
                      <div className="grid grid-cols-1 gap-3 border-t border-line p-3 sm:grid-cols-2 xl:grid-cols-3">
                        {accessData!.modules.map(module => {
                          const grant = draftGrants.find(item => item.projectId === project.id && item.module === module);
                          const grantedActions = grant?.actions || [];
                          const readOnly = archived || module === 'projects' || accessData!.readOnlyModules.includes(module);
                          return (
                            <fieldset key={`${project.id}-${module}`} className="min-w-0 rounded-xl border border-line bg-surface p-3">
                              <legend className="px-1 text-xs font-bold text-ink">{moduleLabel(module)}</legend>
                              <div className="flex flex-wrap gap-x-3 gap-y-2">
                                {ACTION_ORDER.map(action => {
                                  const disabled = action !== 'read' && action !== 'report' && readOnly;
                                  return (
                                    <label key={action} className={`inline-flex items-center gap-1.5 text-[11px] ${disabled ? 'text-ink-muted/50' : 'text-ink-muted'}`}>
                                      <input
                                        type="checkbox"
                                        checked={grantedActions.includes(action)}
                                        disabled={disabled}
                                        onChange={event => toggleGrantAction(project.id, module, action, event.target.checked)}
                                        className="h-3.5 w-3.5 accent-blue-600"
                                      />
                                      {actionLabel(action)}
                                    </label>
                                  );
                                })}
                              </div>
                            </fieldset>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>
            </>
          )}

          {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}
          {notice && <div role="status" className={`rounded-xl border px-3 py-2 text-sm ${notice.success ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-rose-300 bg-rose-50 text-rose-900'}`}>{notice.text}</div>}
        </section>
      )}
    </div>
  );
};
