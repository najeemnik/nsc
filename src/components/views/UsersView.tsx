import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { localizeText } from '../../i18n/localize';
import {
  backendApi,
  type CreateEmployeeAccountInput,
  type EmployeeAccessData,
  type EmployeePermissionAction,
  type EmployeeProjectGrant,
  type EmployeeRole,
  type UpdateEmployeeAccountInput,
} from '../../services/backendApi';
import { Mail, Phone, ShieldAlert, ShieldCheck, Users, Save, RefreshCw, Plus, Pencil, Lock, Unlock, Trash2, X } from 'lucide-react';

const ACTION_ORDER: EmployeePermissionAction[] = ['read', 'create', 'update', 'delete', 'report'];
const EMPLOYEE_ROLES: EmployeeRole[] = ['project_manager', 'accountant', 'procurement', 'viewer'];
const EMPTY_EMPLOYEE_FORM: CreateEmployeeAccountInput = {
  name: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  role: 'viewer',
};

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
  const {
    currentUser,
    language,
    createEmployeeAccount,
    updateEmployeeAccount,
    setEmployeeAccountLocked,
    deleteEmployeeAccount,
  } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  const isOwner = currentUser?.role === 'admin' && !currentUser.ownerAdminId && !currentUser.isMasterSuperAdmin;

  const [accessData, setAccessData] = useState<EmployeeAccessData | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [draftGrants, setDraftGrants] = useState<EmployeeProjectGrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMode, setAccountMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [accountForm, setAccountForm] = useState<CreateEmployeeAccountInput>(EMPTY_EMPLOYEE_FORM);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; success: boolean } | null>(null);
  const loadErrorText = tx('Employee access settings could not be loaded.', 'بارگذاری تنظیمات دسترسی کارمندان ممکن نشد.', 'د کارکوونکو د لاسرسي امستنې بار نه شوې.');
  const saveErrorText = tx('Employee permissions could not be saved.', 'ذخیرهٔ مجوزهای کارمندان ممکن نشد.', 'د کارکوونکو اجازې خوندي نه شوې.');
  const accountLoadErrorText = tx('Employee account changes were saved, but the employee list could not be refreshed. Reload this screen before continuing.', 'تغییر حساب کارمند ذخیره شد، اما فهرست تازه نشد. پیش از ادامه صفحه را دوباره بارگذاری کنید.', 'د کارکوونکي بدلونونه خوندي شول، خو لېست تازه نه شو. له دوام مخکې پاڼه بیا پورته کړئ.');

  const refreshEmployeeAccess = useCallback(async (preferredEmployeeId?: string) => {
    const result = await backendApi.getEmployeeAccess();
    if (!result.success || !result.data) {
      setError(loadErrorText);
      return null;
    }
    setAccessData(result.data);
    setSelectedEmployeeId(currentId => {
      if (preferredEmployeeId && result.data!.employees.some(employee => employee.id === preferredEmployeeId)) {
        return preferredEmployeeId;
      }
      if (result.data!.employees.some(employee => employee.id === currentId)) return currentId;
      return result.data!.employees[0]?.id || '';
    });
    return result.data;
  }, [loadErrorText]);

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
    if (!selectedEmployee || !isDirty || accountSaving || accountMode !== 'closed' || confirmDelete) return;
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

  const openCreateForm = () => {
    setConfirmDelete(false);
    setAccountForm(EMPTY_EMPLOYEE_FORM);
    setAccountMode('create');
    setError(null);
    setNotice(null);
  };

  const openEditForm = () => {
    if (!selectedEmployee) return;
    setConfirmDelete(false);
    setAccountForm({
      name: selectedEmployee.name,
      username: selectedEmployee.username,
      email: selectedEmployee.email,
      phone: selectedEmployee.phone || '',
      password: '',
      role: selectedEmployee.role,
    });
    setAccountMode('edit');
    setError(null);
    setNotice(null);
  };

  const closeAccountForm = () => {
    setAccountMode('closed');
    setAccountForm(EMPTY_EMPLOYEE_FORM);
    setError(null);
  };

  const submitAccountForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (accountSaving) return;
    setAccountSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (accountMode === 'create') {
        const result = await createEmployeeAccount({
          ...accountForm,
          name: accountForm.name.trim(),
          username: accountForm.username.trim(),
          email: accountForm.email.trim(),
          phone: accountForm.phone?.trim() || null,
        });
        if (!result.success || !result.employee) {
          setError(tx('Employee account could not be created. Check the details and try again.', 'حساب کارمند ایجاد نشد. اطلاعات را بررسی و دوباره تلاش کنید.', 'د کارکوونکي حساب جوړ نه شو. معلومات وګورئ او بیا هڅه وکړئ.'));
          return;
        }
        setAccountMode('closed');
        setAccountForm(EMPTY_EMPLOYEE_FORM);
        const refreshed = await refreshEmployeeAccess(result.employee.id);
        setNotice({
          success: true,
          text: tx('Account created locked. Assign at least one project/module read grant before unlocking.', 'حساب در حالت قفل ایجاد شد. پیش از بازکردن قفل، دست‌کم یک مجوز خواندن پروژه/ماژول بدهید.', 'حساب بند جوړ شو. تر خلاصولو مخکې لږ تر لږه د یوې پروژې/ماډل د لوستلو اجازه ورکړئ.'),
        });
        if (!refreshed) setError(accountLoadErrorText);
        return;
      }

      if (accountMode !== 'edit' || !selectedEmployee) return;
      const updates: UpdateEmployeeAccountInput = {
        name: accountForm.name.trim(),
        email: accountForm.email.trim(),
        phone: accountForm.phone?.trim() || null,
        role: accountForm.role,
      };
      if (accountForm.password !== '') updates.password = accountForm.password;
      const result = await updateEmployeeAccount(selectedEmployee.id, updates);
      if (!result.success || !result.employee) {
        setError(tx('Employee account could not be updated. Check the details and try again.', 'حساب کارمند ویرایش نشد. اطلاعات را بررسی و دوباره تلاش کنید.', 'د کارکوونکي حساب سم نه شو. معلومات وګورئ او بیا هڅه وکړئ.'));
        return;
      }
      setAccountMode('closed');
      setAccountForm(EMPTY_EMPLOYEE_FORM);
      const refreshed = await refreshEmployeeAccess(selectedEmployee.id);
      setNotice({
        success: true,
        text: tx('Employee account details were updated. Password, email, or role changes revoke existing sessions.', 'اطلاعات حساب کارمند به‌روز شد. تغییر رمز، ایمیل یا نقش نشست‌های قبلی را باطل می‌کند.', 'د کارکوونکي حساب تازه شو. د پټنوم، برېښنالیک یا رول بدلون پخوانۍ ناستې باطلوي.'),
      });
      if (!refreshed) setError(accountLoadErrorText);
    } catch {
      setError(tx('Employee account could not be saved. Please try again.', 'ذخیرهٔ حساب کارمند ممکن نشد. دوباره تلاش کنید.', 'د کارکوونکي حساب خوندي نه شو. بیا هڅه وکړئ.'));
    } finally {
      setAccountSaving(false);
    }
  };

  const toggleSelectedEmployeeLock = async () => {
    if (!selectedEmployee || accountSaving) return;
    setAccountSaving(true);
    setError(null);
    setNotice(null);
    const nextLocked = !selectedEmployee.isLocked;
    try {
      const result = await setEmployeeAccountLocked(selectedEmployee.id, nextLocked);
      if (!result.success || result.isLocked === undefined) {
        setError(nextLocked
          ? tx('The employee account could not be locked.', 'قفل‌کردن حساب کارمند ممکن نشد.', 'د کارکوونکي حساب بند نه شو.')
          : tx('Unlocking requires at least one project/module read grant.', 'برای بازکردن قفل، دست‌کم یک مجوز خواندن پروژه/ماژول لازم است.', 'د خلاصولو لپاره لږ تر لږه د یوې پروژې/ماډل د لوستلو اجازه اړینه ده.'));
        return;
      }
      setAccessData(current => current ? {
        ...current,
        employees: current.employees.map(employee => employee.id === selectedEmployee.id
          ? { ...employee, isLocked: result.isLocked! }
          : employee),
      } : current);
      setNotice({
        success: true,
        text: result.isLocked
          ? tx('Employee account locked; active sessions were revoked.', 'حساب کارمند قفل شد و نشست‌های فعال باطل گردید.', 'د کارکوونکي حساب بند او فعالې ناستې باطلې شوې.')
          : tx('Employee account unlocked. Sign-in still depends on the server employee-access feature flag.', 'قفل حساب باز شد. ورود همچنان به پرچم فعال‌سازی کارمندان در سرور وابسته است.', 'د حساب قلف خلاص شو. ننوتل لا هم د سرور د کارکوونکو د لاسرسي پر ځانګړي سویچ پورې تړلي دي.'),
      });
    } catch {
      setError(tx('Employee account status could not be changed.', 'تغییر وضعیت حساب کارمند ممکن نشد.', 'د کارکوونکي د حساب حالت بدل نه شو.'));
    } finally {
      setAccountSaving(false);
    }
  };

  const removeSelectedEmployee = async () => {
    if (!selectedEmployee || accountSaving) return;
    setAccountSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await deleteEmployeeAccount(selectedEmployee.id);
      if (!result.success) {
        setError(tx('Employee account could not be deleted. No account data was removed.', 'حذف حساب کارمند ممکن نشد؛ اطلاعاتی حذف نگردید.', 'د کارکوونکي حساب ړنګ نه شو؛ هېڅ معلومات حذف نه شول.'));
        return;
      }
      setConfirmDelete(false);
      setAccountMode('closed');
      setDraftGrants([]);
      const refreshed = await refreshEmployeeAccess();
      setNotice({
        success: true,
        text: tx('Employee account deleted. Historical attribution was reassigned to the owner.', 'حساب کارمند حذف شد و انتساب‌های تاریخی به مالک منتقل گردید.', 'د کارکوونکي حساب ړنګ شو او پخواني انتسابونه مالک ته ولېږدول شول.'),
      });
      if (!refreshed) setError(accountLoadErrorText);
    } catch {
      setError(tx('Employee account could not be deleted. Please try again.', 'حذف حساب کارمند ممکن نشد. دوباره تلاش کنید.', 'د کارکوونکي حساب ړنګ نه شو. بیا هڅه وکړئ.'));
    } finally {
      setAccountSaving(false);
    }
  };

  const accountNotice = tx(
    'Employee sign-in remains disabled until PHP/MySQL integration testing, security review, and staging approval are complete. New accounts start locked; unlocking requires a project/module read grant and does not override the server employee-access feature flag.',
    'ورود کارمندان تا تکمیل آزمون یکپارچهٔ PHP/MySQL، بازبینی امنیتی و تأیید محیط آزمایشی غیرفعال می‌ماند. حساب تازه قفل است؛ بازکردن قفل به مجوز خواندن نیاز دارد و پرچم دسترسی کارمندان در سرور را فعال نمی‌کند.',
    'د کارکوونکو ننوتل د PHP/MySQL ازموینې، امنیتي بیاکتنې او د ازمایښتي چاپېریال تر تایید پورې بند پاتې کېږي. نوی حساب بند وي؛ خلاصول یې د لوستلو اجازې ته اړتیا لري او د سرور د کارکوونکو د لاسرسي سویچ نه فعالوي.',
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
          <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-black text-ink">{tx('Employee accounts', 'حساب‌های کارمندان', 'د کارکوونکو حسابونه')}</h2>
              <p className="mt-1 text-xs text-ink-muted">{tx('Create locked accounts, maintain profile details, and control account status.', 'حساب‌های قفل‌شده ایجاد کنید، اطلاعات را ویرایش و وضعیت حساب را مدیریت کنید.', 'بند حسابونه جوړ، معلومات سم او د حساب حالت اداره کړئ.')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openCreateForm}
                disabled={loading || accountSaving || saving || accountMode !== 'closed' || confirmDelete}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />{tx('New employee', 'کارمند جدید', 'نوی کارکوونکی')}
              </button>
              {selectedEmployee && <>
                <button
                  type="button"
                  onClick={openEditForm}
                  disabled={loading || accountSaving || saving || accountMode !== 'closed' || confirmDelete}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-3 py-2 text-xs font-bold text-ink hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil className="h-4 w-4" />{tx('Edit', 'ویرایش', 'سمون')}
                </button>
                <button
                  type="button"
                  onClick={() => void toggleSelectedEmployeeLock()}
                  disabled={loading || accountSaving || saving || accountMode !== 'closed' || confirmDelete}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-3 py-2 text-xs font-bold text-ink hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedEmployee.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {selectedEmployee.isLocked ? tx('Unlock', 'بازکردن قفل', 'خلاصول') : tx('Lock', 'قفل‌کردن', 'بندول')}
                </button>
                <button
                  type="button"
                  onClick={() => { setConfirmDelete(true); setError(null); setNotice(null); }}
                  disabled={loading || accountSaving || saving || accountMode !== 'closed' || confirmDelete}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-4 w-4" />{tx('Delete', 'حذف', 'ړنګول')}
                </button>
              </>}
            </div>
          </div>

          {accountMode !== 'closed' && (
            <form onSubmit={event => void submitAccountForm(event)} className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-4 dark:border-blue-900 dark:bg-blue-950/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-ink">{accountMode === 'create' ? tx('Create employee account', 'ایجاد حساب کارمند', 'د کارکوونکي حساب جوړول') : tx('Edit employee account', 'ویرایش حساب کارمند', 'د کارکوونکي حساب سمول')}</h3>
                  <p className="mt-1 text-xs text-ink-muted">{accountMode === 'create' ? tx('The new account is created locked and is not given any project grants automatically.', 'حساب تازه قفل ایجاد می‌شود و هیچ مجوز پروژه‌ای به‌صورت خودکار نمی‌گیرد.', 'نوی حساب بند جوړېږي او په اتومات ډول د پروژې اجازه نه ورکول کېږي.') : tx('Username cannot be changed here. Leave the password blank to keep the current password.', 'نام کاربری از اینجا تغییر نمی‌کند. برای حفظ رمز فعلی، رمز را خالی بگذارید.', 'دلته کارن‌نوم نه بدلېږي. د اوسني پټنوم د ساتلو لپاره د پټنوم ځای تش پرېږدئ.')}</p>
                </div>
                <button type="button" onClick={closeAccountForm} disabled={accountSaving} aria-label={tx('Cancel editing', 'لغو ویرایش', 'سمون لغوه کړئ')} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface disabled:opacity-50">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-1 text-xs font-bold text-ink-muted">
                  <span>{tx('Full name', 'نام کامل', 'بشپړ نوم')}</span>
                  <input required maxLength={150} value={accountForm.name} onChange={event => setAccountForm(current => ({ ...current, name: event.target.value }))} autoComplete="name" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal text-ink" />
                </label>
                {accountMode === 'create' ? (
                  <label className="space-y-1 text-xs font-bold text-ink-muted">
                    <span>{tx('Username', 'نام کاربری', 'کارن‌نوم')}</span>
                    <input required minLength={3} maxLength={80} pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,79}" value={accountForm.username} onChange={event => setAccountForm(current => ({ ...current, username: event.target.value }))} autoComplete="username" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal text-ink" />
                  </label>
                ) : (
                  <div className="space-y-1 text-xs font-bold text-ink-muted">
                    <span className="block">{tx('Username', 'نام کاربری', 'کارن‌نوم')}</span>
                    <div className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm font-normal text-ink">@{accountForm.username}</div>
                  </div>
                )}
                <label className="space-y-1 text-xs font-bold text-ink-muted">
                  <span>{tx('Email', 'ایمیل', 'برېښنالیک')}</span>
                  <input required type="email" maxLength={150} value={accountForm.email} onChange={event => setAccountForm(current => ({ ...current, email: event.target.value }))} autoComplete="email" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal text-ink" />
                </label>
                <label className="space-y-1 text-xs font-bold text-ink-muted">
                  <span>{tx('Phone (optional)', 'تلفن (اختیاری)', 'ټیلیفون (اختیاري)')}</span>
                  <input type="tel" maxLength={40} value={accountForm.phone || ''} onChange={event => setAccountForm(current => ({ ...current, phone: event.target.value }))} autoComplete="tel" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal text-ink" />
                </label>
                <label className="space-y-1 text-xs font-bold text-ink-muted">
                  <span>{accountMode === 'create' ? tx('Password (12 characters minimum)', 'رمز (حداقل ۱۲ نویسه)', 'پټنوم (لږ تر لږه ۱۲ توري)') : tx('New password (optional)', 'رمز جدید (اختیاری)', 'نوی پټنوم (اختیاري)')}</span>
                  <input required={accountMode === 'create'} minLength={12} maxLength={256} type="password" value={accountForm.password} onChange={event => setAccountForm(current => ({ ...current, password: event.target.value }))} autoComplete="new-password" className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal text-ink" />
                </label>
                <label className="space-y-1 text-xs font-bold text-ink-muted">
                  <span>{tx('Role', 'نقش', 'رول')}</span>
                  <select value={accountForm.role} onChange={event => setAccountForm(current => ({ ...current, role: event.target.value as EmployeeRole }))} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal text-ink">
                    {EMPLOYEE_ROLES.map(role => <option key={role} value={role}>{employeeRoleLabel(role)}</option>)}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={closeAccountForm} disabled={accountSaving} className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-ink hover:bg-surface disabled:opacity-50">{tx('Cancel', 'لغو', 'لغوه')}</button>
                <button type="submit" disabled={accountSaving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                  {accountSaving && <RefreshCw className="h-4 w-4 animate-spin" />}{accountMode === 'create' ? tx('Create locked account', 'ایجاد حساب قفل‌شده', 'بند حساب جوړ کړئ') : tx('Save changes', 'ذخیرهٔ تغییرات', 'بدلونونه خوندي کړئ')}
                </button>
              </div>
            </form>
          )}

          {confirmDelete && selectedEmployee && (
            <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
              <p className="font-bold">{tx(`Permanently delete ${selectedEmployee.name}?`, `حساب ${selectedEmployee.name} برای همیشه حذف شود؟`, `د ${selectedEmployee.name} حساب د تل لپاره ړنګ شي؟`)}</p>
              <p className="mt-1">{tx('Active sessions and grants will be removed; historical attribution will be reassigned to the owner.', 'نشست‌ها و مجوزها حذف و انتساب‌های تاریخی به مالک منتقل می‌شوند.', 'فعالې ناستې او اجازې به لرې او پخواني انتسابونه به مالک ته ولېږدول شي.')}</p>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)} disabled={accountSaving} className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink hover:bg-surface disabled:opacity-50">{tx('Cancel', 'لغو', 'لغوه')}</button>
                <button type="button" onClick={() => void removeSelectedEmployee()} disabled={accountSaving} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">
                  {accountSaving && <RefreshCw className="h-4 w-4 animate-spin" />}{tx('Delete employee account', 'حذف حساب کارمند', 'د کارکوونکي حساب ړنګ کړئ')}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <label htmlFor="employee-access-select" className="mb-1.5 block text-xs font-bold text-ink-muted">
                {tx('Existing employee account', 'حساب کارمند موجود', 'د کارکوونکي موجود حساب')}
              </label>
              <select
                id="employee-access-select"
                value={selectedEmployeeId}
                onChange={event => setSelectedEmployeeId(event.target.value)}
                disabled={loading || saving || accountSaving || accountMode !== 'closed' || confirmDelete || !accessData?.employees.length}
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
              disabled={!selectedEmployee || !isDirty || saving || loading || accountSaving || accountMode !== 'closed' || confirmDelete}
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
              {tx('There are no employee accounts under this owner yet. Use New employee to create the first locked account.', 'برای این مالک هنوز حساب کارمندی ثبت نشده است. برای ایجاد نخستین حساب قفل‌شده از «کارمند جدید» استفاده کنید.', 'د دې مالک لپاره لا د کارکوونکو حساب نشته. د لومړي بند حساب د جوړولو لپاره «نوی کارکوونکی» وکاروئ.')}
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
                                  const disabled = (action !== 'read' && action !== 'report' && readOnly)
                                    || accountMode !== 'closed' || accountSaving || confirmDelete;
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
