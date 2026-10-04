/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { LoginView } from './components/LoginView';

// Views
import { DashboardView } from './components/views/DashboardView';
import { ProjectsView } from './components/views/ProjectsView';
import { ExpensesView } from './components/views/ExpensesView';
import { SteelView } from './components/views/SteelView';
import { ConcreteView } from './components/views/ConcreteView';
import { ContractorsView } from './components/views/ContractorsView';
import { SuppliersView } from './components/views/SuppliersView';
import { ApartmentsView } from './components/views/ApartmentsView';
import { PaymentsView } from './components/views/PaymentsView';
import { DocumentsView } from './components/views/DocumentsView';
import { ReportsView } from './components/views/ReportsView';
import { UsersView } from './components/views/UsersView';
import { AuditLogView } from './components/views/AuditLogView';
import { SettingsView } from './components/views/SettingsView';

// Modals
import { NewProjectModal } from './components/modals/NewProjectModal';
import { EditProjectModal } from './components/modals/EditProjectModal';
import { ProjectPartnersModal } from './components/modals/ProjectPartnersModal';
import { ProjectTransferModal } from './components/modals/ProjectTransferModal';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { AddSteelModal } from './components/modals/AddSteelModal';
import { AddConcreteModal } from './components/modals/AddConcreteModal';
import { AddContractorModal } from './components/modals/AddContractorModal';
import { AddSupplierModal } from './components/modals/AddSupplierModal';
import { AddApartmentModal } from './components/modals/AddApartmentModal';
import { AddPaymentModal } from './components/modals/AddPaymentModal';
import { AddDocumentModal } from './components/modals/AddDocumentModal';
import { GoogleDriveModal } from './components/modals/GoogleDriveModal';
import { SystemGuideModal } from './components/modals/SystemGuideModal';
import { MasterAdminModal } from './components/MasterAdminModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { CameraModal } from './components/CameraModal';
import { Project } from './types';

function MainApp() {
  const { 
    currentUser, 
    isDarkMode, 
    language, 
    isAiAssistantOpen, 
    setIsAiAssistantOpen,
    isMasterAdminOpen,
    setIsMasterAdminOpen
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('dashboard');

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

  // Pre-selected payment payee if opened from contractor/supplier card
  const [paymentRecipient, setPaymentRecipient] = useState<{ id: string; name: string } | null>(null);

  if (!currentUser) {
    return <LoginView />;
  }

  const handleOpenPaymentForPayee = (id: string, name: string) => {
    setPaymentRecipient({ id, name });
    setIsAddPaymentOpen(true);
  };

  const isRtl = language === 'fa' || language === 'ps';

  return (
    <div 
      className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col ${
        isDarkMode ? 'dark' : ''
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-1 h-screen overflow-hidden">
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
            onOpenDrive={() => setIsGoogleDriveOpen(true)}
          />

          {/* Main Tab Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
            <div className="max-w-7xl mx-auto">
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

              {activeTab === 'suppliers' && (
                <SuppliersView 
                  onOpenAddSupplier={() => setIsAddSupplierOpen(true)}
                  onOpenAddPayment={handleOpenPaymentForPayee}
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
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Modals Container */}
      <NewProjectModal 
        isOpen={isNewProjectOpen} 
        onClose={() => setIsNewProjectOpen(false)} 
      />

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

      <AddExpenseModal 
        isOpen={isAddExpenseOpen} 
        onClose={() => setIsAddExpenseOpen(false)} 
      />

      <AddSteelModal 
        isOpen={isAddSteelOpen} 
        onClose={() => setIsAddSteelOpen(false)} 
      />

      <AddConcreteModal 
        isOpen={isAddConcreteOpen} 
        onClose={() => setIsAddConcreteOpen(false)} 
      />

      <AddContractorModal 
        isOpen={isAddContractorOpen} 
        onClose={() => setIsAddContractorOpen(false)} 
      />

      <AddSupplierModal 
        isOpen={isAddSupplierOpen} 
        onClose={() => setIsAddSupplierOpen(false)} 
      />

      <AddApartmentModal 
        isOpen={isAddApartmentOpen} 
        onClose={() => setIsAddApartmentOpen(false)} 
      />

      <AddPaymentModal 
        isOpen={isAddPaymentOpen} 
        onClose={() => {
          setIsAddPaymentOpen(false);
          setPaymentRecipient(null);
        }} 
      />

      <AddDocumentModal 
        isOpen={isAddDocumentOpen} 
        onClose={() => setIsAddDocumentOpen(false)} 
      />

      <GoogleDriveModal 
        isOpen={isGoogleDriveOpen} 
        onClose={() => setIsGoogleDriveOpen(false)} 
      />

      <SystemGuideModal 
        isOpen={isSystemGuideOpen} 
        onClose={() => setIsSystemGuideOpen(false)} 
      />

      <MasterAdminModal 
        isOpen={isMasterAdminOpen} 
        onClose={() => setIsMasterAdminOpen(false)} 
      />

      <AiAssistantModal 
        isOpen={isAiAssistantOpen} 
        onClose={() => setIsAiAssistantOpen(false)} 
      />

      <CameraModal />
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
