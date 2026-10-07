/**
 * NSC Backend API Service
 * Secure REST client connecting React with the Shahhost MySQL/PHP Backend
 * Fully compatible with Offline-First caching and Office 7 Master Gate
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class BackendApiService {
  private token: string | null = null;
  private office7GateKey: string | null = null;

  constructor() {
    this.token = localStorage.getItem('nsc_auth_token') || null;
    this.office7GateKey = localStorage.getItem('nsc_office7_key') || null;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('nsc_auth_token', token);
    } else {
      localStorage.removeItem('nsc_auth_token');
    }
  }

  public setOffice7GateKey(key: string | null) {
    this.office7GateKey = key;
    if (key) {
      localStorage.setItem('nsc_office7_key', key);
    } else {
      localStorage.removeItem('nsc_office7_key');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.office7GateKey) {
      headers['X-Office7-Gate-Key'] = this.office7GateKey;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        ...options,
        headers,
      });

      const json = await response.json().catch(() => ({
        success: false,
        error: `پاسخ نامعتبر از سرور (کد وضعیت: ${response.status})`,
      }));

      return json;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'خطا در برقراری ارتباط با سرور هاست',
      };
    }
  }

  // --- احراز هویت (Auth) ---
  public async login(username: string, password: string) {
    const res = await this.request<{ token: string; user: any }>('auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  public async getCurrentUser() {
    return this.request<{ user: any }>('auth.php');
  }

  // --- دفتر هفت (Office 7 Master Control) ---
  public async getOffice7Tenants() {
    return this.request<{ users: any[] }>('office7.php?action=tenants');
  }

  public async updateTenantByOffice7(payload: any) {
    return this.request('office7.php?action=update_tenant', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async toggleUserLock(userId: string, isLocked: boolean) {
    return this.request('office7.php?action=toggle_lock', {
      method: 'POST',
      body: JSON.stringify({ userId, isLocked }),
    });
  }

  public async changeOffice7GateKey(newKey: string) {
    return this.request('office7.php?action=change_gate_key', {
      method: 'POST',
      body: JSON.stringify({ newKey }),
    });
  }

  public async getAuditLogs(limit = 100) {
    return this.request<{ logs: any[] }>(`office7.php?action=audit_logs&limit=${limit}`);
  }

  // --- پروژه‌ها و بودجه (Projects & Budgets) ---
  public async getProjects() {
    return this.request<{ projects: any[] }>('projects.php');
  }

  public async getProjectDetails(id: string) {
    return this.request<{ project: any; budgets: any[]; actualCosts: any[]; totalRevenue: number }>(`projects.php?id=${id}`);
  }

  public async saveProject(project: any) {
    return this.request('projects.php?action=save_project', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  public async saveBudget(budget: any) {
    return this.request('projects.php?action=save_budget', {
      method: 'POST',
      body: JSON.stringify(budget),
    });
  }

  // --- عملیات مالی (Finance & Treasury) ---
  public async getTreasuryAccounts() {
    return this.request<{ accounts: any[] }>('finance.php?section=treasury_accounts');
  }

  public async getIncomes(projectId?: string) {
    const q = projectId ? `&projectId=${projectId}` : '';
    return this.request<{ incomes: any[] }>(`finance.php?section=incomes${q}`);
  }

  public async createIncome(payload: any) {
    return this.request('finance.php?action=create_income', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getPayments(projectId?: string) {
    const q = projectId ? `&projectId=${projectId}` : '';
    return this.request<{ payments: any[] }>(`finance.php?section=payments${q}`);
  }

  public async createPayment(payload: any) {
    return this.request('finance.php?action=create_payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async interProjectTransfer(payload: any) {
    return this.request('finance.php?action=inter_project_transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- تدارکات مواد (Materials) ---
  public async getMaterials(projectId?: string) {
    const q = projectId ? `?projectId=${projectId}` : '';
    return this.request<{ materials: any[] }>(`materials.php${q}`);
  }

  public async createMaterialProcurement(payload: any) {
    return this.request('materials.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- معاشات و کارکرد کارگران (Labor & Wages) ---
  public async getLaborPayroll(projectId?: string) {
    const q = projectId ? `?projectId=${projectId}` : '';
    return this.request<{ payroll: any[] }>(`payroll.php${q}`);
  }

  public async createLaborPayroll(payload: any) {
    return this.request('payroll.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- گزارشات مدیریتی و P&L (Reports) ---
  public async getDashboardMetrics() {
    return this.request<any>('reports.php?type=dashboard');
  }

  // --- مقاطعه‌کاران (Subcontractors) ---
  public async getSubcontractors(projectId?: string) {
    const q = projectId ? `?projectId=${projectId}` : '';
    return this.request<{ subcontractors: any[] }>(`subcontractors.php${q}`);
  }

  public async saveSubcontractor(payload: any) {
    return this.request('subcontractors.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- عرضه‌کنندگان (Suppliers) ---
  public async getSuppliers() {
    return this.request<{ suppliers: any[] }>('suppliers.php');
  }

  public async saveSupplier(payload: any) {
    return this.request('suppliers.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- پلاک‌ها و اپارتمان‌ها (Apartments) ---
  public async getApartmentUnits(projectId?: string) {
    const q = projectId ? `?projectId=${projectId}` : '';
    return this.request<{ units: any[] }>(`apartments.php${q}`);
  }

  public async saveApartmentUnit(payload: any) {
    return this.request('apartments.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- اسناد روزنامچه و حسابداری دوطرفه (Journal & Chart of Accounts) ---
  public async getChartOfAccounts() {
    return this.request<{ accounts: any[] }>('journal.php?action=chart_of_accounts');
  }

  public async getJournalEntries() {
    return this.request<{ entries: any[] }>('journal.php?action=entries');
  }

  public async createJournalEntry(payload: any) {
    return this.request('journal.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- ماشین‌آلات و دارایی‌ها (Assets & Equipment) ---
  public async getAssets(projectId?: string) {
    const q = projectId ? `?projectId=${projectId}` : '';
    return this.request<{ assets: any[] }>(`assets.php${q}`);
  }

  public async saveAsset(payload: any) {
    return this.request('assets.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getProjectPnl() {
    return this.request<{ pnl: any[] }>('reports.php?type=project_pnl');
  }

  public async getBudgetVsActual(projectId: string) {
    return this.request<{ comparison: any[] }>(`reports.php?type=budget_vs_actual&projectId=${projectId}`);
  }

  public async getMonthlyTimeline(year?: number) {
    const y = year || new Date().getFullYear();
    return this.request<{ year: number; months: any[] }>(`reports.php?type=monthly_timeline&year=${y}`);
  }
}

export const backendApi = new BackendApiService();
