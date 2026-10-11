/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { isRtlLanguage, localizeText } from './i18n/localize';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { MobileMenuDrawer } from './components/MobileMenuDrawer';
import type { Project } from './types';

// Load each feature only when its tab or dialog is opened. This keeps the
// authenticated shell small and avoids downloading unused business modules.
const LoginView = React.lazy(() => import('./components/LoginView').then((module) => ({ default: module.LoginView })));
const DashboardView = React.lazy(() => import('./components/views/DashboardView').then((module) => ({ default: module.DashboardView })));
const ProjectsView = React.lazy(() => import('./components/views/ProjectsView').then((module) => ({ default: module.ProjectsView })));
const ExpensesView = React.lazy(() => import('./components/views/ExpensesView').then((module) => ({ default: module.ExpensesView })));
const SteelView = React.lazy(() => import('./components/views/SteelView').then((module) => ({ default: module.SteelView })));
const ConcreteView = React.lazy(() => import('./components/views/ConcreteView').then((module) => ({ default: module.ConcreteView })));
const ContractorsView = React.lazy(() => import('./components/views/ContractorsView').then((module) => ({ default: module.ContractorsView })));
const LaborView = React.lazy(() => import('./components/views/LaborView').then((module) => ({ default: module.LaborView })));
const SuppliersView = React.lazy(() => import('./components/views/SuppliersView').then((module) => ({ default: module.SuppliersView })));
const AssetsView = React.lazy(() => import('./components/views/AssetsView').then((module) => ({ default: module.AssetsView })));
const ApartmentsView = React.lazy(() => import('./components/views/ApartmentsView').then((module) => ({ default: module.ApartmentsView })));
const PaymentsView = React.lazy(() => import('./components/views/PaymentsView').then((module) => ({ default: module.PaymentsView })));
const DocumentsView = React.lazy(() => import('./components/views/DocumentsView').then((module) => ({ default: module.DocumentsView })));
const ReportsView = React.lazy(() => import('./components/views/ReportsView').then((module) => ({ default: module.ReportsView })));
const BudgetView = React.lazy(() => import('./components/views/BudgetView').then((module) => ({ default: module.BudgetView })));
const AccountingView = React.lazy(() => import('./components/views/AccountingView').then((module) => ({ default: module.AccountingView })));
const UsersView = React.lazy(() => import('./components/views/UsersView').then((module) => ({ default: module.UsersView })));
const AuditLogView = React.lazy(() => import('./components/views/AuditLogView').then((module) => ({ default: module.AuditLogView })));
const SettingsView = React.lazy(() => import('./components/views/SettingsView').then((module) => ({ default: module.SettingsView })));

const NewProjectModal = React.lazy(() => import('./components/modals/NewProjectModal').then((module) => ({ default: module.NewProjectModal })));
const EditProjectModal = React.lazy(() => import('./components/modals/EditProjectModal').then((module) => ({ default: module.EditProjectModal })));
const ProjectPartnersModal = React.lazy(() => import('./components/modals/ProjectPartnersModal').then((module) => ({ default: module.ProjectPartnersModal })));
const ProjectTransferModal = React.lazy(() => import('./components/modals/ProjectTransferModal').then((module) => ({ default: module.ProjectTransferModal })));
const AddExpenseModal = React.lazy(() => import('./components/modals/AddExpenseModal').then((module) => ({ default: module.AddExpenseModal })));
const AddSteelModal = React.lazy(() => import('./components/modals/AddSteelModal').then((module) => ({ default: module.AddSteelModal })));
const AddConcreteModal = React.lazy(() => import('./components/modals/AddConcreteModal').then((module) => ({ default: module.AddConcreteModal })));
const AddContractorModal = React.lazy(() => import('./components/modals/AddContractorModal').then((module) => ({ default: module.AddContractorModal })));
const AddSupplierModal = React.lazy(() => import('./components/modals/AddSupplierModal').then((module) => ({ default: module.AddSupplierModal })));
const AddApartmentModal = React.lazy(() => import('./components/modals/AddApartmentModal').then((module) => ({ default: module.AddApartmentModal })));
const AddPaymentModal = React.lazy(() => import('./components/modals/AddPaymentModal').then((module) => ({ default: module.AddPaymentModal })));
const AddDocumentModal = React.lazy(() => import('./components/modals/AddDocumentModal').then((module) => ({ default: module.AddDocumentModal })));
const GoogleDriveModal = React.lazy(() => import('./components/modals/GoogleDriveModal').then((module) => ({ default: module.GoogleDriveModal })));
const SystemGuideModal = React.lazy(() => import('./components/modals/SystemGuideModal').then((module) => ({ default: module.SystemGuideModal })));
const AddIncomeModal = React.lazy(() => import('./components/modals/AddIncomeModal').then((module) => ({ default: module.AddIncomeModal })));
const AddMaterialModal = React.lazy(() => import('./components/modals/AddMaterialModal').then((module) => ({ default: module.AddMaterialModal })));
const AddLaborModal = React.lazy(() => import('./components/modals/AddLaborModal').then((module) => ({ default: module.AddLaborModal })));
const AddTransferModal = React.lazy(() => import('./components/modals/AddTransferModal').then((module) => ({ default: module.AddTransferModal })));
const AddPettyCashModal = React.lazy(() => import('./components/modals/AddPettyCashModal').then((module) => ({ default: module.AddPettyCashModal })));
const AddAssetModal = React.lazy(() => import('./components/modals/AddAssetModal').then((module) => ({ default: module.AddAssetModal })));
const MasterAdminModal = React.lazy(() => import('./components/MasterAdminModal').then((module) => ({ default: module.MasterAdminModal })));
const AiAssistantModal = React.lazy(() => import('./components/AiAssistantModal').then((module) => ({ default: module.AiAssistantModal })));
const CameraModal = React.lazy(() => import('./components/CameraModal').then((module) => ({ default: module.CameraModal })));

function AppLoadingFallback() {
  const { language } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });
  return (
    <div
      className="min-h-dscreen flex items-center justify-center bg-canvas text-ink"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-amber-400/30 border-t-amber-400" />
        <span className="text-sm font-semibold">{tx('Loading…', 'در حال بارگذاری…', 'پورته کېږي…')}</span>
      </div>
    </div>
  );
}

function MainApp() {
  const {
    currentUser,
    authLoading,
    workspaceSaving,
    workspaceError,
    exportJsonBackup,
    isDarkMode,
    language,
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    isMasterAdminOpen,
    setIsMasterAdminOpen,
    isTabAllowed,
    cameraModalOpen
  } = useApp();
  const tx = (en: string, fa: string, ps: string) => localizeText(language, { en, fa, ps });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // اطمینان از مجاز بودن تب طبق پرمیژن‌های دفتر هفت
  useEffect(() => {
    if (activeTab !== 'dashboard' && !isTabAllowed(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, isTabAllowed]);

  // 🛡 دفتر هفت fast-path: master login lands DIRECTLY inside the panel (no second key)
  const [masterDirectAccess, setMasterDirectAccess] = useState(false);
  useEffect(() => {
    if (!currentUser) {
      setMasterDirectAccess(false);
      return;
    }
    if (currentUser.isMasterSuperAdmin) {
      setMasterDirectAccess(true);
      setIsMasterAdminOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // دفتر هفت telemetry: log every section a user opens (who, where, when)
  const { trackFeature } = useApp();
  useEffect(() => {
    trackFeature(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Modal visibility states
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [partnersProject, setPartnersProject] = useState<Project | null>(null);
  const [transferProjectData, setTransferProjectData] = useState<Project | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddSteelOpen, setIsAddSteelOpen] = useState(false);
  const [isAddConcreteOpen, setIsAddConcreteOpen] = useState(false);
  const [isAddContractorOpen, setIsAddContractorOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddApartmentOpen, setIsAddApartmentOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState(false);
  const [isSystemGuideOpen, setIsSystemGuideOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isAddLaborOpen, setIsAddLaborOpen] = useState(false);
  const [isAddInterProjectTransferOpen, setIsAddInterProjectTransferOpen] = useState(false);
  const [isAddPettyCashOpen, setIsAddPettyCashOpen] = useState(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);

  // Pre-selected payment payee if opened from contractor/supplier card
  const [paymentRecipient, setPaymentRecipient] = useState<{ id: string; name: string } | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-dscreen flex items-center justify-center bg-slate-950 text-white" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-amber-400/30 border-t-amber-400" />
          <span className="text-sm font-semibold">{tx('Checking secure session…', 'در حال بررسی نشست امن…', 'خوندي ناسته کتل کېږي…')}</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Suspense fallback={<AppLoadingFallback />}>
        <LoginView />
      </Suspense>
    );
  }

  const handleOpenPaymentForPayee = (id: string, name: string) => {
    setPaymentRecipient({ id, name });
    setIsAddPaymentOpen(true);
  };

  const isRtl = isRtlLanguage(language);

  // 🛡 دفتر هفت full-screen mode: hide the ENTIRE construction app — panel is a standalone page
  if (currentUser.isMasterSuperAdmin && isMasterAdminOpen) {
    return (
      <Suspense fallback={<AppLoadingFallback />}>
        <div dir={isRtl ? 'rtl' : 'ltr'} className="h-dscreen w-full overflow-hidden bg-slate-100">
          <MasterAdminModal
            isOpen={isMasterAdminOpen}
            onClose={() => setIsMasterAdminOpen(false)}
            directAccess={masterDirectAccess}
            fullPage
          />
        </div>
      </Suspense>
    );
  }

  return (
    <div
      className="min-h-dscreen bg-canvas text-ink flex flex-col"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-1 h-dscreen overflow-hidden">
        {/* Desktop / Tablet Sidebar */}
        <div className="hidden md:flex shrink-0">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenSystemGuide={() => setIsSystemGuideOpen(true)}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Navbar */}
          <Navbar
            onOpenNewProject={() => setIsNewProjectOpen(true)}
            setActiveTab={setActiveTab}
            onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
            onOpenSystemGuide={() => setIsSystemGuideOpen(true)}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenAddPayment={() => setIsAddPaymentOpen(true)}
            onOpenAddSteel={() => setIsAddSteelOpen(true)}
            onOpenAddConcrete={() => setIsAddConcreteOpen(true)}
            onOpenAddApartment={() => setIsAddApartmentOpen(true)}
            onOpenAddContractor={() => setIsAddContractorOpen(true)}
            onOpenAddIncome={() => setIsAddIncomeOpen(true)}
            onOpenAddMaterial={() => setIsAddMaterialOpen(true)}
            onOpenAddLabor={() => setIsAddLaborOpen(true)}
            onOpenAddTransfer={() => setIsAddInterProjectTransferOpen(true)}
            onOpenAddPettyCash={() => setIsAddPettyCashOpen(true)}
            onOpenAddAsset={() => setIsAddAssetOpen(true)}
            onOpenDrive={() => setIsGoogleDriveOpen(true)}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />

          {/* Main Tab Content */}
          <main className="flex-1 overflow-y-auto scroll-touch p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
            <div className="max-w-7xl mx-auto">
              {workspaceError && (
                <div role="alert" className="mb-4 flex flex-col gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-100 sm:flex-row sm:items-center sm:justify-between">
                  <span><strong>{tx('Database save blocked:', 'ذخیره به پایگاه داده مسدود شد:', 'ډېټابېس ته خوندي کول بند شول:')}</strong>{' '}{workspaceError}{' '}{tx('Download a recovery copy before reloading.', 'پیش از بارگذاری دوباره، یک نسخهٔ بازیابی بارگیری کنید.', 'د بیا پورته کولو مخکې د بیا رغونې یوه کاپي ښکته کړئ.')}</span>
                  <button type="button" onClick={exportJsonBackup} className="shrink-0 rounded-lg bg-rose-800 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700">{tx('Download recovery JSON', 'بارگیری فایل JSON بازیابی', 'د بیا رغونې JSON ښکته کول')}</button>
                </div>
              )}
              {workspaceSaving && !workspaceError && (
                <div className="mb-3 text-xs font-medium text-slate-500" role="status" aria-live="polite">{tx('Saving changes to the server…', 'تغییرات در سرور ذخیره می‌شود…', 'بدلونونه په سرور کې خوندي کېږي…')}</div>
              )}
              <Suspense
                fallback={
                  <div
                    className="py-12 text-center text-sm font-medium text-slate-500"
                    role="status"
                    aria-live="polite"
                  >
                    {tx('Loading section…', 'بخش در حال بارگذاری است…', 'برخه پورته کېږي…')}
                  </div>
                }
              >
                {activeTab === 'dashboard' && (
                  <DashboardView
                    onOpenNewProject={() => setIsNewProjectOpen(true)}
                    onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                    onOpenAddPayment={() => setIsAddPaymentOpen(true)}
                    onOpenAddSteel={() => setIsAddSteelOpen(true)}
                    onOpenAddConcrete={() => setIsAddConcreteOpen(true)}
                    onOpenAddApartment={() => setIsAddApartmentOpen(true)}
                    onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
                    setActiveTab={setActiveTab}
                  />
                )}

                {activeTab === 'projects' && (
                  <ProjectsView
                    onOpenNewProject={() => setIsNewProjectOpen(true)}
                    onOpenEditProject={(p) => setEditingProject(p)}
                    onOpenPartners={(p) => setPartnersProject(p)}
                    onOpenTransfer={(p) => setTransferProjectData(p)}
                  />
                )}

                {activeTab === 'expenses' && (
                  <ExpensesView
                    onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                  />
                )}

                {activeTab === 'steel' && (
                  <SteelView
                    onOpenAddSteel={() => setIsAddSteelOpen(true)}
                  />
                )}

                {activeTab === 'concrete' && (
                  <ConcreteView
                    onOpenAddConcrete={() => setIsAddConcreteOpen(true)}
                  />
                )}

                {activeTab === 'contractors' && (
                  <ContractorsView
                    onOpenAddContractor={() => setIsAddContractorOpen(true)}
                    onOpenAddPayment={handleOpenPaymentForPayee}
                  />
                )}

                {activeTab === 'labor' && (
                  <LaborView
                    onOpenAddLabor={() => setIsAddLaborOpen(true)}
                  />
                )}

                {activeTab === 'suppliers' && (
                  <SuppliersView
                    onOpenAddSupplier={() => setIsAddSupplierOpen(true)}
                    onOpenAddPayment={handleOpenPaymentForPayee}
                  />
                )}

                {activeTab === 'assets' && (
                  <AssetsView
                    onOpenAddAsset={() => setIsAddAssetOpen(true)}
                  />
                )}

                {activeTab === 'apartments' && (
                  <ApartmentsView
                    onOpenAddApartment={() => setIsAddApartmentOpen(true)}
                  />
                )}

                {activeTab === 'payments' && (
                  <PaymentsView
                    onOpenAddPayment={() => {
                      setPaymentRecipient(null);
                      setIsAddPaymentOpen(true);
                    }}
                  />
                )}

                {activeTab === 'budget' && (
                  <BudgetView />
                )}

                {activeTab === 'accounting' && (
                  <AccountingView />
                )}

                {activeTab === 'documents' && (
                  <DocumentsView
                    onOpenAddDocument={() => setIsAddDocumentOpen(true)}
                    onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
                  />
                )}

                {activeTab === 'reports' && (
                  <ReportsView />
                )}

                {activeTab === 'users' && (
                  <UsersView />
                )}

                {activeTab === 'audit_logs' && (
                  <AuditLogView />
                )}

                {activeTab === 'settings' && (
                  <SettingsView
                    onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
                  />
                )}
              </Suspense>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
      </div>
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }}
      />

      {/* Modals load on demand so closed dialogs add no work to the initial bundle. */}
      <Suspense fallback={null}>
        {isNewProjectOpen && (
          <NewProjectModal
            isOpen={isNewProjectOpen}
            onClose={() => setIsNewProjectOpen(false)}
          />
        )}

        {editingProject && (
          <EditProjectModal
            isOpen={!!editingProject}
            project={editingProject}
            onClose={() => setEditingProject(null)}
          />
        )}

        {partnersProject && (
          <ProjectPartnersModal
            isOpen={!!partnersProject}
            project={partnersProject}
            onClose={() => setPartnersProject(null)}
          />
        )}

        {transferProjectData && (
          <ProjectTransferModal
            isOpen={!!transferProjectData}
            project={transferProjectData}
            onClose={() => setTransferProjectData(null)}
          />
        )}

        {isAddExpenseOpen && (
          <AddExpenseModal
            isOpen={isAddExpenseOpen}
            onClose={() => setIsAddExpenseOpen(false)}
          />
        )}

        {isAddSteelOpen && (
          <AddSteelModal
            isOpen={isAddSteelOpen}
            onClose={() => setIsAddSteelOpen(false)}
          />
        )}

        {isAddConcreteOpen && (
          <AddConcreteModal
            isOpen={isAddConcreteOpen}
            onClose={() => setIsAddConcreteOpen(false)}
          />
        )}

        {isAddContractorOpen && (
          <AddContractorModal
            isOpen={isAddContractorOpen}
            onClose={() => setIsAddContractorOpen(false)}
          />
        )}

        {isAddSupplierOpen && (
          <AddSupplierModal
            isOpen={isAddSupplierOpen}
            onClose={() => setIsAddSupplierOpen(false)}
          />
        )}

        {isAddApartmentOpen && (
          <AddApartmentModal
            isOpen={isAddApartmentOpen}
            onClose={() => setIsAddApartmentOpen(false)}
          />
        )}

        {isAddPaymentOpen && (
          <AddPaymentModal
            isOpen={isAddPaymentOpen}
            onClose={() => {
              setIsAddPaymentOpen(false);
              setPaymentRecipient(null);
            }}
          />
        )}

        {isAddDocumentOpen && (
          <AddDocumentModal
            isOpen={isAddDocumentOpen}
            onClose={() => setIsAddDocumentOpen(false)}
          />
        )}

        {isAddIncomeOpen && (
          <AddIncomeModal
            isOpen={isAddIncomeOpen}
            onClose={() => setIsAddIncomeOpen(false)}
          />
        )}

        {isAddMaterialOpen && (
          <AddMaterialModal
            isOpen={isAddMaterialOpen}
            onClose={() => setIsAddMaterialOpen(false)}
          />
        )}

        {isAddLaborOpen && (
          <AddLaborModal
            isOpen={isAddLaborOpen}
            onClose={() => setIsAddLaborOpen(false)}
          />
        )}

        {isAddInterProjectTransferOpen && (
          <AddTransferModal
            isOpen={isAddInterProjectTransferOpen}
            onClose={() => setIsAddInterProjectTransferOpen(false)}
          />
        )}

        {isAddPettyCashOpen && (
          <AddPettyCashModal
            isOpen={isAddPettyCashOpen}
            onClose={() => setIsAddPettyCashOpen(false)}
          />
        )}

        {isAddAssetOpen && (
          <AddAssetModal
            isOpen={isAddAssetOpen}
            onClose={() => setIsAddAssetOpen(false)}
          />
        )}

        {isGoogleDriveOpen && (
          <GoogleDriveModal
            isOpen={isGoogleDriveOpen}
            onClose={() => setIsGoogleDriveOpen(false)}
          />
        )}

        {isSystemGuideOpen && (
          <SystemGuideModal
            isOpen={isSystemGuideOpen}
            onClose={() => setIsSystemGuideOpen(false)}
          />
        )}

        {isMasterAdminOpen && (
          <MasterAdminModal
            isOpen={isMasterAdminOpen}
            onClose={() => setIsMasterAdminOpen(false)}
            directAccess={masterDirectAccess}
          />
        )}

        {isAiAssistantOpen && (
          <AiAssistantModal
            isOpen={isAiAssistantOpen}
            onClose={() => setIsAiAssistantOpen(false)}
          />
        )}

        {cameraModalOpen && <CameraModal />}
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
