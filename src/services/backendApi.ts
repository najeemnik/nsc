/**
 * NSC backend client. Session credentials remain in HttpOnly cookies and never enter localStorage.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export type EmployeePermissionAction = 'read' | 'create' | 'update' | 'delete' | 'report';

export interface EmployeeProjectGrant {
  projectId: string;
  module: string;
  actions: EmployeePermissionAction[];
}

export type EmployeeRole = 'project_manager' | 'accountant' | 'procurement' | 'viewer';

export interface EmployeeAccountProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  role: EmployeeRole;
  isLocked: boolean;
}

export interface EmployeeAccessEmployee extends EmployeeAccountProfile {
  grants: EmployeeProjectGrant[];
}

export interface CreateEmployeeAccountInput {
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  password: string;
  role: EmployeeRole;
}

export interface UpdateEmployeeAccountInput {
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string;
  role?: EmployeeRole;
}

export interface EmployeeAccessProject {
  id: string;
  name: string;
  projectCode: string;
  status: string;
}

export interface EmployeeAccessData {
  employees: EmployeeAccessEmployee[];
  projects: EmployeeAccessProject[];
  modules: string[];
  actions: EmployeePermissionAction[];
  readOnlyModules: string[];
}

export type WorkspaceReportType = 'financial' | 'materials' | 'contractors' | 'sales' | 'monthly_pnl';

export interface GeneratedWorkspaceReport {
  reportType: WorkspaceReportType;
  projectId: string;
  year: number;
  workspaceRevision: number;
  project: {
    id: string;
    name?: string;
    code?: string;
    projectCode?: string;
    status?: string;
    [key: string]: unknown;
  };
  data: Partial<Record<
    'expenses' | 'payments' | 'steelRecords' | 'concreteRecords' | 'contractors' | 'apartments',
    any[]
  >>;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const part = document.cookie.split(';').map(v => v.trim()).find(v => v.startsWith(prefix));
  return part ? decodeURIComponent(part.slice(prefix.length)) : null;
}

class BackendApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const method = (options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const csrfToken = readCookie('nsc_csrf');
      if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        ...options,
        method,
        headers,
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await response.json().catch(() => ({
        success: false,
        error: `Invalid response from server (${response.status}).`,
      }));
      if (!response.ok && json.success !== false) {
        return { success: false, error: json.error || `Request failed (${response.status}).` };
      }
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Unable to reach the server.',
      };
    }
  }

  public async login(username: string, password: string) {
    return this.request<{ user: any; csrfToken: string }>('auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  public async getCurrentUser() {
    return this.request<{ user: any }>('auth.php');
  }

  public async logout() {
    return this.request('auth.php?action=logout', { method: 'POST', body: '{}' });
  }

  public async getWorkspace() {
    return this.request<{ workspace: Record<string, unknown> | null; revision: number; exists: boolean; defaultLanguage: string; updatedAt?: string | null }>('workspace.php');
  }

  public async saveWorkspace(workspace: Record<string, unknown>, revision: number, tenantId: string) {
    return this.request<{ revision: number }>('workspace.php', {
      method: 'PUT',
      body: JSON.stringify({ workspace, revision, tenantId }),
    });
  }

  // --- Office 7: master session required; no shared gate key is sent or stored in the browser. ---
  public async getOffice7Tenants() {
    return this.request<{ users: any[] }>('office7.php?action=tenants');
  }

  public async updateTenantByOffice7(payload: any) {
    return this.request('office7.php?action=update_tenant', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async extendTenantSubscriptionByOffice7(userId: string, durationMonths: number) {
    return this.request<{ subscriptionExpiresAt: string }>('office7.php?action=extend_subscription', {
      method: 'POST',
      body: JSON.stringify({ userId, durationMonths }),
    });
  }

  public async toggleUserLock(userId: string, isLocked: boolean) {
    return this.request<{ isLocked: boolean }>('office7.php?action=toggle_lock', {
      method: 'POST',
      body: JSON.stringify({ userId, isLocked }),
    });
  }

  public async getAuditLogs(limit = 100) {
    return this.request<{ logs: any[] }>(`office7.php?action=audit_logs&limit=${encodeURIComponent(String(limit))}`);
  }

  // --- Employee access grants: owner-only server-managed project/module/action policy. ---
  public async getEmployeeAccess() {
    return this.request<EmployeeAccessData>('permissions.php?action=employees');
  }

  public async saveEmployeeProjectGrants(userId: string, grants: EmployeeProjectGrant[]) {
    return this.request<{ userId: string; grants: EmployeeProjectGrant[] }>('permissions.php?action=save_grants', {
      method: 'POST',
      body: JSON.stringify({ userId, grants }),
    });
  }

  public async createEmployeeAccount(employee: CreateEmployeeAccountInput) {
    return this.request<{ employee: EmployeeAccountProfile }>('employees.php?action=create', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  }

  public async updateEmployeeAccount(employeeId: string, updates: UpdateEmployeeAccountInput) {
    return this.request<{ employee: EmployeeAccountProfile }>('employees.php?action=update', {
      method: 'POST',
      body: JSON.stringify({ employeeId, ...updates }),
    });
  }

  public async setEmployeeAccountLocked(employeeId: string, isLocked: boolean) {
    return this.request<{ employeeId: string; isLocked: boolean }>('employees.php?action=set_lock', {
      method: 'POST',
      body: JSON.stringify({ employeeId, isLocked }),
    });
  }

  public async deleteEmployeeAccount(employeeId: string) {
    return this.request<{ employeeId: string; deleted: boolean }>('employees.php?action=delete', {
      method: 'POST',
      body: JSON.stringify({ employeeId }),
    });
  }

  // --- Projects & budgets ---
  public async getProjects() {
    return this.request<{ projects: any[] }>('projects.php');
  }

  public async getProjectDetails(id: string) {
    return this.request<{ project: any; budgets: any[]; actualCosts: any[]; totalRevenue: number }>(`projects.php?id=${encodeURIComponent(id)}`);
  }

  public async saveProject(project: any) {
    return this.request('projects.php?action=save_project', { method: 'POST', body: JSON.stringify(project) });
  }

  public async saveBudget(budget: any) {
    return this.request('projects.php?action=save_budget', { method: 'POST', body: JSON.stringify(budget) });
  }

  // --- Finance ---
  public async getTreasuryAccounts() {
    return this.request<{ accounts: any[] }>('finance.php?section=treasury_accounts');
  }

  public async getIncomes(projectId?: string) {
    const q = projectId ? `&projectId=${encodeURIComponent(projectId)}` : '';
    return this.request<{ incomes: any[] }>(`finance.php?section=incomes${q}`);
  }

  public async createIncome(payload: any) {
    return this.request('finance.php?action=create_income', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async getPayments(projectId?: string) {
    const q = projectId ? `&projectId=${encodeURIComponent(projectId)}` : '';
    return this.request<{ payments: any[] }>(`finance.php?section=payments${q}`);
  }

  public async createPayment(payload: any) {
    return this.request('finance.php?action=create_payment', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async interProjectTransfer(payload: any) {
    return this.request('finance.php?action=inter_project_transfer', { method: 'POST', body: JSON.stringify(payload) });
  }

  // --- Materials, payroll, subcontractors, suppliers, apartments, and reports ---
  public async getMaterials(projectId?: string) {
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return this.request<{ materials: any[] }>(`materials.php${q}`);
  }

  public async createMaterialProcurement(payload: any) {
    return this.request('materials.php', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async getLaborPayroll(projectId?: string) {
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return this.request<{ payroll: any[] }>(`payroll.php${q}`);
  }

  public async createLaborPayroll(payload: any) {
    return this.request('payroll.php', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async generateReport(reportType: WorkspaceReportType, projectId: string, year: number) {
    return this.request<GeneratedWorkspaceReport>('reports.php?action=generate', {
      method: 'POST',
      body: JSON.stringify({ reportType, projectId, year }),
    });
  }

  public async getSubcontractors(projectId?: string) {
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return this.request<{ subcontractors: any[] }>(`subcontractors.php${q}`);
  }

  public async saveSubcontractor(payload: any) {
    return this.request('subcontractors.php', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async getSuppliers() {
    return this.request<{ suppliers: any[] }>('suppliers.php');
  }

  public async saveSupplier(payload: any) {
    return this.request('suppliers.php', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async getApartmentUnits(projectId?: string) {
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return this.request<{ units: any[] }>(`apartments.php${q}`);
  }

  public async saveApartmentUnit(payload: any) {
    return this.request('apartments.php', { method: 'POST', body: JSON.stringify(payload) });
  }

  public async getChartOfAccounts() {
    return this.request<{ accounts: any[] }>('journal.php?action=chart_of_accounts');
  }

  public async getJournalEntries() {
    return this.request<{ entries: any[] }>('journal.php?action=entries');
  }

  public async createJournalEntry(payload: any) {
    return this.request('journal.php', { method: 'POST', body: JSON.stringify(payload) });
  }
}

export const backendApi = new BackendApiService();
