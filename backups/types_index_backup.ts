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
  balance: number;
  originalAmount?: number; // For loans, mortgages, payment plans, etc.
  creditLimit?: number; // For credit cards
  interestRate: number;
  minimumPayment: number;
  dueDate: number;
  totalPayments?: number; // For payment plans - total number of payments
  paymentsMade?: number; // For payment plans - number of payments made so far
  notes?: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'monthly' | 'biweekly' | 'semi-monthly' | 'weekly' | 'yearly' | 'one-time';
  date: string;
  isEssential: boolean;
  notes?: string;
}

export interface Budget {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  period: 'monthly' | 'yearly';
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
  settings: {
    currency: string;
    theme: 'light' | 'dark';
  };
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
      onMenuAction: (callback: (action: string) => void) => () => void;
    };
  }
}