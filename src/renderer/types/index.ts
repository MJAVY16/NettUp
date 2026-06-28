export interface Income {
  id: string;
  source: string;
  amount: number;
  frequency: 'monthly' | 'biweekly' | 'semi-monthly' | 'weekly' | 'yearly' | 'one-time';
  date: string;
  category: string;
  notes?: string;
}

export interface Debt {
  id: string;
  name: string;
  type: 'credit-card' | 'loan' | 'mortgage' | 'auto' | 'student' | 'personal' | 'payment-plan' | 'other';
  provider?: 'affirm' | 'klarna' | 'afterpay' | 'paypal' | 'apple' | 'zip' | 'other';
  balance: number;
  originalAmount?: number;
  creditLimit?: number;
  isClosed?: boolean; // credit card closed but balance may still be owed
  previousCreditLimit?: number; // cached limit from before the card was closed
  interestRate: number;
  minimumPayment: number;
  dueDate: number;
  totalPayments?: number;
  paymentsMade?: number;
  startDate?: string;
  lastPaymentDate?: string; // ISO date through which scheduled payments are accounted
  notes?: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly' | 'every-2-months' | 'quarterly' | 'every-4-months' | 'every-6-months' | 'yearly' | 'one-time';
  date: string;
  isEssential: boolean;
  isSubscription?: boolean;
  isPaid?: boolean;
  notes?: string;
}

export interface Budget {
  id: string;
  category: string;
  allocated: number;
  period: 'monthly' | 'yearly';
  // Note: `spent` is intentionally NOT stored. It is always derived from the
  // live expense list via calculateBudgetSpent() so it can never go stale.
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category: 'emergency' | 'vacation' | 'car' | 'home' | 'education' | 'retirement' | 'wedding' | 'other';
  icon?: string;
  color?: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export interface Milestone {
  id: string;
  type: 'debt' | 'savings';
  entityId: string;
  entityName: string;
  milestone: number; // percentage (25, 50, 75, 100)
  achievedAt: string;
  celebrated: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'debt' | 'expense' | 'income' | 'budget' | 'milestone' | 'note';
  action: 'added' | 'updated' | 'deleted' | 'paid-off' | 'completed';
  description: string;
  entityName?: string;
  amount?: number;
  details?: any;
}

export interface SyncMetadata {
  deviceId: string;
  lastSyncedAt: string;
  syncVersion: number;
  lastModifiedBy: string;
}

export interface FinancialProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  incomes: Income[];
  debts: Debt[];
  expenses: Expense[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  milestones: Milestone[];
  logs: LogEntry[];
  settings: {
    currency: string;
    theme: 'light' | 'dark' | 'spy';
    autoApplyPayments?: boolean; // auto-apply due payments on open instead of confirming
  };
  syncMetadata?: SyncMetadata;
}

export interface FinancialSummary {
  totalIncome: number;
  totalDebt: number;
  totalExpenses: number;
  netIncome: number;
  debtToIncomeRatio: number;
  monthlyDebtPayments: number;
  savingsRate: number;
  emergencyFund: number;
}

declare global {
  interface Window {
    electronAPI: {
      newProject: () => Promise<{ success: boolean }>;
      saveProject: (data: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      saveProjectAs: (data: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      openProject: () => Promise<{ success: boolean; data?: any; filePath?: string; error?: string }>;
      openProjectByPath: (filePath: string) => Promise<{ success: boolean; data?: any; filePath?: string; error?: string }>;
      getCurrentFilePath: () => Promise<string | null>;
      setUnsavedChanges: (hasChanges: boolean) => void;
      setTitleBarTheme: (theme: string) => void;
      onOpenFile: (callback: (filePath: string) => void) => void;
      onBeforeClose: (callback: () => Promise<any>) => void;
      onMenuAction: (callback: (action: string) => void) => () => void;
    };
  }
}
