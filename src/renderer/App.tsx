/// <reference path="./global.d.ts" />
import React, { useState, useEffect, useRef } from 'react';
import { FinancialProject, Income, Debt, Expense, Budget, SavingsGoal, Milestone, LogEntry } from './types';
import Dashboard from './components/Dashboard';
import IncomeManager from './components/IncomeManager';
import DebtManager from './components/DebtManager';
import CreditCardManager from './components/CreditCardManager';
import InstallmentManager from './components/InstallmentManager';
import ExpenseManager from './components/ExpenseManager';
import BudgetManager from './components/BudgetManager';
import GoalsManager from './components/GoalsManager';
import Charts from './components/Charts';
import Analytics from './components/Analytics';
import CreditCardPayoff from './components/CreditCardPayoff';
import LogsManager from './components/LogsManager';
import ReportGenerator from './components/ReportGenerator';
import ReportPage from './components/ReportPage';
import LoadingScreen from './components/LoadingScreen';
import WelcomeScreen from './components/WelcomeScreen';
import Settings from './components/Settings';
import Clock from './components/Clock';
import FileMenu from './components/FileMenu';
import DuePaymentsModal from './components/DuePaymentsModal';
import { getDuePayments, applyDuePayment, mostRecentDueDate, DuePayment } from './utils/paymentHelpers';
import appIcon from '../../assets/icons/png/64x64.png';
import { initNumberInputSpinners } from './utils/numberInputSpinners';
import { setCurrencyConfig } from './utils/formatters';

interface RecentProject {
  name: string;
  path: string;
  lastOpened: string;
}

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [project, setProject] = useState<FinancialProject | null>(null);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [duePayments, setDuePayments] = useState<DuePayment[]>([]);

  // Initialize number input spinners
  useEffect(() => {
    initNumberInputSpinners();
  }, []);

  // Sync the native title-bar color with the saved theme at startup, before a
  // project is loaded (the loading and welcome screens already follow it).
  useEffect(() => {
    window.electronAPI.setTitleBarTheme(localStorage.getItem('theme') || 'light');
  }, []);

  // Open a project that was launched by double-clicking a .nettup file.
  useEffect(() => {
    window.electronAPI.onOpenFile?.((filePath) => {
      handleOpenRecentProject(filePath);
    });
  }, []);

  // Load recent projects from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentProjects');
    if (stored) {
      try {
        setRecentProjects(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent projects:', e);
      }
    }
  }, []);

  // Save recent project
  const addRecentProject = (path: string, name: string) => {
    const newProject: RecentProject = {
      name,
      path,
      lastOpened: new Date().toLocaleDateString()
    };

    setRecentProjects(prev => {
      const filtered = prev.filter(p => p.path !== path);
      const updated = [newProject, ...filtered].slice(0, 5);
      localStorage.setItem('recentProjects', JSON.stringify(updated));
      return updated;
    });
  };

  const handleNewProject = async () => {
    console.log('[RENDERER] New project requested');
    if (hasUnsavedChanges && project) {
      if (!confirm('You have unsaved changes. Do you want to continue?')) {
        return;
      }
    }

    const result = await window.electronAPI.newProject();
    if (result.success) {
      setProject({
        id: Date.now().toString(),
        name: 'New Financial Plan',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        incomes: [],
        debts: [],
        expenses: [],
        budgets: [],
        savingsGoals: [],
        milestones: [],
        logs: [],
        settings: {
          currency: 'USD',
          theme: 'light'
        }
      });
      setCurrentFilePath(null);
      setHasUnsavedChanges(false);
      setShowWelcome(false);
      console.log('[RENDERER] New project created');
    }
  };

  const handleOpenProject = async () => {
    console.log('[RENDERER] Open project requested');
    const result = await window.electronAPI.openProject();
    console.log('[RENDERER] Open result:', result);
    if (result.success && result.data) {
      setProject(migrateProject(result.data));
      setCurrentFilePath(result.filePath || null);
      setHasUnsavedChanges(false);
      setShowWelcome(false);

      if (result.filePath) {
        const fileName = result.filePath.split(/[\\/]/).pop() || 'Unknown';
        const projectName = fileName.replace('.json', '');
        addRecentProject(result.filePath, projectName);
      }
      console.log('[RENDERER] Project opened, filePath:', result.filePath);
    }
  };

  const handleOpenRecentProject = async (path: string) => {
    console.log('[RENDERER] Opening recent project:', path);
    const result = await window.electronAPI.openProjectByPath(path);
    console.log('[RENDERER] Open by path result:', result);
    if (result.success && result.data) {
      setProject(migrateProject(result.data));
      setCurrentFilePath(result.filePath || null);
      setHasUnsavedChanges(false);
      setShowWelcome(false);

      if (result.filePath) {
        const fileName = result.filePath.split(/[\\/]/).pop() || 'Unknown';
        const projectName = fileName.replace('.json', '');
        addRecentProject(result.filePath, projectName);
      }
      console.log('[RENDERER] Project opened by path, filePath:', result.filePath);
    } else {
      alert(`Failed to open project: ${result.error || 'Unknown error'}`);
    }
  };

  const handleSaveProject = async () => {
    if (!project) return undefined;
    console.log('[RENDERER] Save project requested');
    const updatedProject = { ...project, updatedAt: new Date().toISOString() };
    const result = await window.electronAPI.saveProject(updatedProject);
    console.log('[RENDERER] Save result:', result);
    if (result.success) {
      setCurrentFilePath(result.filePath || null);
      setHasUnsavedChanges(false);

      if (result.filePath) {
        const fileName = result.filePath.split(/[\\/]/).pop() || 'Unknown';
        const projectName = fileName.replace('.json', '');
        addRecentProject(result.filePath, projectName);
      }
      console.log('[RENDERER] Project saved, filePath:', result.filePath);
    }
    return result;
  };

  const handleSaveProjectAs = async () => {
    if (!project) return;
    console.log('[RENDERER] Save As requested');
    const updatedProject = { ...project, updatedAt: new Date().toISOString() };
    const result = await window.electronAPI.saveProjectAs(updatedProject);
    console.log('[RENDERER] Save As result:', result);
    if (result.success) {
      setCurrentFilePath(result.filePath || null);
      setHasUnsavedChanges(false);

      if (result.filePath) {
        const fileName = result.filePath.split(/[\\/]/).pop() || 'Unknown';
        const projectName = fileName.replace('.json', '');
        addRecentProject(result.filePath, projectName);
      }
      console.log('[RENDERER] Project saved as, filePath:', result.filePath);
    }
  };

  // Notify main process of unsaved changes
  useEffect(() => {
    window.electronAPI.setUnsavedChanges(hasUnsavedChanges);
  }, [hasUnsavedChanges]);

  // Debounced autosave: ~2s after the last change, save automatically. For a
  // brand-new project (no file yet) it prompts with Save As once; if that's
  // dismissed it backs off so it doesn't nag on every subsequent change.
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newFilePromptDismissedRef = useRef(false);

  // Re-enable the new-file prompt once a file path has been established.
  useEffect(() => {
    if (currentFilePath) newFilePromptDismissedRef.current = false;
  }, [currentFilePath]);

  useEffect(() => {
    if (!project || !hasUnsavedChanges) return;
    if (!currentFilePath && newFilePromptDismissedRef.current) return;

    autosaveTimerRef.current = setTimeout(async () => {
      const result = await handleSaveProject();
      // Save As cancelled for a new project — stop prompting until the user saves.
      if (result && !result.success && !result.filePath) {
        newFilePromptDismissedRef.current = true;
      }
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [hasUnsavedChanges, project, currentFilePath]);

  // Register menu handlers
  useEffect(() => {
    const cleanup = window.electronAPI.onMenuAction((action) => {
      console.log('[RENDERER] Menu action received:', action);
      switch (action) {
        case 'new':
          handleNewProject();
          break;
        case 'open':
          handleOpenProject();
          break;
        case 'save':
          handleSaveProject();
          break;
        case 'save-as':
          handleSaveProjectAs();
          break;
      }
    });

    return cleanup;
  });

  // Migrate older project files for backward compatibility
  const migrateProject = (data: any): FinancialProject => {
    const migrated = { ...data };

    // If project has paymentPlans array (from desktop v1), merge back into debts
    if (migrated.paymentPlans && migrated.paymentPlans.length > 0) {
      const convertedDebts = migrated.paymentPlans.map((p: any) => ({
        id: p.id,
        name: p.name,
        type: 'payment-plan' as const,
        balance: p.balance,
        originalAmount: p.originalAmount || 0,
        interestRate: p.interestRate,
        minimumPayment: p.minimumPayment,
        dueDate: p.dueDate,
        totalPayments: p.totalPayments || 0,
        paymentsMade: p.paymentsMade || 0,
        notes: p.notes || ''
      }));
      migrated.debts = [...(migrated.debts || []), ...convertedDebts];
    }
    delete migrated.paymentPlans;

    // Ensure new arrays exist
    if (!migrated.savingsGoals) migrated.savingsGoals = [];
    if (!migrated.milestones) migrated.milestones = [];
    if (!migrated.logs) migrated.logs = [];

    // Ensure settings has theme
    if (migrated.settings && !migrated.settings.theme) {
      migrated.settings.theme = 'light';
    }

    // Add defaults for expense fields
    if (migrated.expenses) {
      migrated.expenses = migrated.expenses.map((e: any) => ({
        ...e,
        isSubscription: e.isSubscription ?? false,
        isPaid: e.isPaid ?? false
      }));
    }

    // Drop the legacy stored `spent` field on budgets — it is now always
    // derived from expenses, so old persisted values must not linger.
    if (migrated.budgets) {
      migrated.budgets = migrated.budgets.map(({ spent, ...rest }: any) => rest);
    }

    // Baseline lastPaymentDate so due-payment detection starts from "now"
    // instead of retroactively surfacing every past cycle.
    if (migrated.debts) {
      const now = new Date();
      migrated.debts = migrated.debts.map((d: any) => ({
        ...d,
        lastPaymentDate: d.lastPaymentDate
          || (typeof d.dueDate === 'number' ? mostRecentDueDate(d.dueDate, now).toISOString() : undefined)
      }));
    }

    return migrated as FinancialProject;
  };

  // Apply project settings (currency, theme) when project changes
  useEffect(() => {
    if (project) {
      setCurrencyConfig(project.settings.currency || 'USD');
      const theme = project.settings.theme || 'light';
      document.documentElement.setAttribute('data-theme', theme);
      window.electronAPI.setTitleBarTheme(theme);
      localStorage.setItem('theme', theme);
    }
  }, [project?.settings?.currency, project?.settings?.theme]);

  const updateSettings = (settings: Partial<FinancialProject['settings']>) => {
    if (!project) return;
    updateProject({ settings: { ...project.settings, ...settings } });
  };

  const updateProject = (updates: Partial<FinancialProject>) => {
    if (!project) return;
    setProject(prev => prev ? ({ ...prev, ...updates }) : null);
    setHasUnsavedChanges(true);
  };

  // --- Income CRUD ---
  const addIncome = (income: Income) => {
    if (!project) return;
    updateProject({ incomes: [...project.incomes, income] });
    addLog('income', 'added', `Added income source: ${income.source}`, income.source, income.amount);
  };

  const updateIncome = (id: string, updates: Partial<Income>) => {
    if (!project) return;
    const oldIncome = project.incomes.find(i => i.id === id);
    updateProject({
      incomes: project.incomes.map(income =>
        income.id === id ? { ...income, ...updates } : income
      )
    });
    if (oldIncome) {
      addLog('income', 'updated', `Updated income source: ${oldIncome.source}`, oldIncome.source, updates.amount || oldIncome.amount);
    }
  };

  const deleteIncome = (id: string) => {
    if (!project) return;
    const income = project.incomes.find(i => i.id === id);
    updateProject({
      incomes: project.incomes.filter(income => income.id !== id)
    });
    if (income) {
      addLog('income', 'deleted', `Deleted income source: ${income.source}`, income.source, income.amount);
    }
  };

  // --- Debt CRUD ---
  const addDebt = (debt: Debt) => {
    if (!project) return;
    updateProject({ debts: [...project.debts, debt] });
    addLog('debt', 'added', `Added debt: ${debt.name}`, debt.name, debt.balance);
  };

  const updateDebt = (id: string, updates: Partial<Debt>) => {
    if (!project) return;
    const oldDebt = project.debts.find(d => d.id === id);
    updateProject({
      debts: project.debts.map(debt =>
        debt.id === id ? { ...debt, ...updates } : debt
      )
    });
    if (oldDebt) {
      if (oldDebt.balance > 0 && updates.balance === 0) {
        addLog('milestone', 'paid-off', `Debt paid off: ${oldDebt.name}`, oldDebt.name, oldDebt.balance);
      } else if (oldDebt.type === 'payment-plan' && oldDebt.paymentsMade !== undefined && oldDebt.totalPayments &&
                 oldDebt.paymentsMade < oldDebt.totalPayments && updates.paymentsMade === oldDebt.totalPayments) {
        addLog('milestone', 'completed', `Payment plan completed: ${oldDebt.name}`, oldDebt.name);
      } else {
        addLog('debt', 'updated', `Updated debt: ${oldDebt.name}`, oldDebt.name, updates.balance || oldDebt.balance);
      }
    }
  };

  const deleteDebt = (id: string) => {
    if (!project) return;
    const debt = project.debts.find(d => d.id === id);
    updateProject({
      debts: project.debts.filter(debt => debt.id !== id)
    });
    if (debt) {
      addLog('debt', 'deleted', `Deleted debt: ${debt.name}`, debt.name, debt.balance);
    }
  };

  // --- Expense CRUD ---
  const addExpense = (expense: Expense) => {
    if (!project) return;
    updateProject({ expenses: [...project.expenses, expense] });
    addLog('expense', 'added', `Added expense: ${expense.name}`, expense.name, expense.amount);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    if (!project) return;
    const oldExpense = project.expenses.find(e => e.id === id);
    updateProject({
      expenses: project.expenses.map(expense =>
        expense.id === id ? { ...expense, ...updates } : expense
      )
    });
    if (oldExpense) {
      addLog('expense', 'updated', `Updated expense: ${oldExpense.name}`, oldExpense.name, updates.amount || oldExpense.amount);
    }
  };

  const deleteExpense = (id: string) => {
    if (!project) return;
    const expense = project.expenses.find(e => e.id === id);
    updateProject({
      expenses: project.expenses.filter(expense => expense.id !== id)
    });
    if (expense) {
      addLog('expense', 'deleted', `Deleted expense: ${expense.name}`, expense.name, expense.amount);
    }
  };

  // --- Budget CRUD ---
  const addBudget = (budget: Budget) => {
    if (!project) return;
    updateProject({ budgets: [...project.budgets, budget] });
    addLog('budget', 'added', `Added budget for: ${budget.category}`, budget.category, budget.allocated);
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    if (!project) return;
    const oldBudget = project.budgets.find(b => b.id === id);
    updateProject({
      budgets: project.budgets.map(budget =>
        budget.id === id ? { ...budget, ...updates } : budget
      )
    });
    if (oldBudget) {
      addLog('budget', 'updated', `Updated budget for: ${oldBudget.category}`, oldBudget.category, updates.allocated || oldBudget.allocated);
    }
  };

  const deleteBudget = (id: string) => {
    if (!project) return;
    const budget = project.budgets.find(b => b.id === id);
    updateProject({
      budgets: project.budgets.filter(budget => budget.id !== id)
    });
    if (budget) {
      addLog('budget', 'deleted', `Deleted budget for: ${budget.category}`, budget.category, budget.allocated);
    }
  };

  // --- Savings Goals CRUD ---
  const addSavingsGoal = (goal: SavingsGoal) => {
    if (!project) return;
    updateProject({ savingsGoals: [...project.savingsGoals, goal] });
    addLog('milestone', 'added', `Added savings goal: ${goal.name}`, goal.name, goal.targetAmount);
  };

  const updateSavingsGoal = (id: string, updates: Partial<SavingsGoal>) => {
    if (!project) return;
    const oldGoal = project.savingsGoals.find(g => g.id === id);
    updateProject({
      savingsGoals: project.savingsGoals.map(goal =>
        goal.id === id ? { ...goal, ...updates } : goal
      )
    });
    if (oldGoal) {
      addLog('milestone', 'updated', `Updated savings goal: ${oldGoal.name}`, oldGoal.name, updates.currentAmount || oldGoal.currentAmount);
    }
  };

  const deleteSavingsGoal = (id: string) => {
    if (!project) return;
    const goal = project.savingsGoals.find(g => g.id === id);
    updateProject({
      savingsGoals: project.savingsGoals.filter(goal => goal.id !== id)
    });
    if (goal) {
      addLog('milestone', 'deleted', `Deleted savings goal: ${goal.name}`, goal.name, goal.targetAmount);
    }
  };

  // --- Milestone CRUD ---
  const addMilestone = (milestone: Milestone) => {
    if (!project) return;
    updateProject({ milestones: [...project.milestones, milestone] });
  };

  const updateMilestone = (id: string, updates: Partial<Milestone>) => {
    if (!project) return;
    updateProject({
      milestones: project.milestones.map(m =>
        m.id === id ? { ...m, ...updates } : m
      )
    });
  };

  // --- Logging ---
  const addLog = (
    type: LogEntry['type'],
    action: LogEntry['action'],
    description: string,
    entityName?: string,
    amount?: number,
    details?: any
  ) => {
    if (!project) return;
    const newLog: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      action,
      description,
      entityName,
      amount,
      details
    };
    updateProject({ logs: [...project.logs, newLog] });
  };

  // --- Due payments (auto-apply / confirm) ---
  // Applies a batch of due payments in a single update (avoids stale-state
  // races from applying them one-by-one).
  const applyDuePaymentsBatch = (list: DuePayment[]) => {
    if (!project || list.length === 0) return;
    const updatesById = new Map(list.map(d => [d.debt.id, applyDuePayment(d)]));
    const newDebts = project.debts.map(d => {
      const u = updatesById.get(d.id);
      return u ? { ...d, ...u } : d;
    });
    const newLogs: LogEntry[] = list.map(d => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type: 'debt',
      action: 'updated',
      description: `Payment applied: ${d.debt.name}`,
      entityName: d.debt.name,
      amount: d.totalAmount,
    }));
    updateProject({ debts: newDebts, logs: [...project.logs, ...newLogs] });
  };

  const handleConfirmPayment = (due: DuePayment) => {
    applyDuePaymentsBatch([due]);
    setDuePayments(prev => prev.filter(p => p.debt.id !== due.debt.id));
  };

  const handleConfirmAllPayments = () => {
    applyDuePaymentsBatch(duePayments);
    setDuePayments([]);
  };

  // When a project loads, detect payments that have come due. Auto-apply them
  // if the setting is on, otherwise surface them for confirmation.
  useEffect(() => {
    if (!project) return;
    const due = getDuePayments(project.debts, new Date());
    if (due.length === 0) return;
    if (project.settings.autoApplyPayments) {
      applyDuePaymentsBatch(due);
    } else {
      setDuePayments(due);
    }
    // Intentionally keyed to the loaded project, not every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const renderContent = () => {
    if (!project) return null;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard project={project} />;
      case 'income':
        return (
          <IncomeManager
            incomes={project.incomes}
            onAdd={addIncome}
            onUpdate={updateIncome}
            onDelete={deleteIncome}
          />
        );
      case 'debts':
        return (
          <>
            <DebtManager
              debts={project.debts.filter(d => d.type !== 'credit-card' && d.type !== 'payment-plan')}
              onAdd={addDebt}
              onUpdate={updateDebt}
              onDelete={deleteDebt}
            />
            <CreditCardManager
              cards={project.debts.filter(d => d.type === 'credit-card')}
              onAdd={addDebt}
              onUpdate={updateDebt}
              onDelete={deleteDebt}
            />
            <InstallmentManager
              plans={project.debts.filter(d => d.type === 'payment-plan')}
              onAdd={addDebt}
              onUpdate={updateDebt}
              onDelete={deleteDebt}
            />
          </>
        );
      case 'expenses':
        return (
          <ExpenseManager
            expenses={project.expenses}
            onAdd={addExpense}
            onUpdate={updateExpense}
            onDelete={deleteExpense}
          />
        );
      case 'budget':
        return (
          <BudgetManager
            budgets={project.budgets}
            expenses={project.expenses}
            onAdd={addBudget}
            onUpdate={updateBudget}
            onDelete={deleteBudget}
          />
        );
      case 'goals':
        return (
          <GoalsManager
            goals={project.savingsGoals}
            milestones={project.milestones}
            onAddGoal={addSavingsGoal}
            onUpdateGoal={updateSavingsGoal}
            onDeleteGoal={deleteSavingsGoal}
            onAddMilestone={addMilestone}
            onUpdateMilestone={updateMilestone}
          />
        );
      case 'analytics':
        return <Analytics project={project} />;
      case 'charts':
        return <Charts project={project} />;
      case 'credit-card-payoff':
        return <CreditCardPayoff debts={project.debts} />;
      case 'logs':
        return <LogsManager logs={project.logs} />;
      case 'reports':
        return <ReportGenerator project={project} />;
      case 'settings':
        return (
          <Settings
            project={project}
            onUpdateSettings={updateSettings}
          />
        );
      default:
        return <Dashboard project={project} />;
    }
  };

  const getProjectDisplayName = () => {
    if (currentFilePath) {
      const fileName = currentFilePath.split(/[\\/]/).pop() || 'Unknown';
      return fileName.replace('.json', '');
    }
    return 'Unsaved Project';
  };

  // Show loading screen first
  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  // Check if we're on the report page (for PDF generation)
  if (window.location.hash === '#report') {
    return <ReportPage />;
  }

  // Show welcome screen if no project is loaded
  if (showWelcome && !project) {
    return (
      <WelcomeScreen
        recentProjects={recentProjects}
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
        onOpenRecent={handleOpenRecentProject}
      />
    );
  }

  // Show main app
  return (
    <div className="app">
      <header className="header titlebar">
        <div className="titlebar-left">
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={appIcon} alt="NettUp" style={{ height: '1.4em', width: 'auto', borderRadius: '5px' }} /> NettUp
          </h1>
          <FileMenu
            onNew={handleNewProject}
            onOpen={handleOpenProject}
            onSave={handleSaveProject}
            onSaveAs={handleSaveProjectAs}
          />
        </div>
        <div className="titlebar-center">
          {getProjectDisplayName()}{hasUnsavedChanges && ' *'}
        </div>
        <Clock />
      </header>
      <div className="main-content">
        <aside className="sidebar">
          <ul className="sidebar-nav">
            <li>
              <button
                className={activeTab === 'dashboard' ? 'active' : ''}
                onClick={() => setActiveTab('dashboard')}
              >
                <i className="bi bi-grid"></i> Dashboard
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'income' ? 'active' : ''}
                onClick={() => setActiveTab('income')}
              >
                <i className="bi bi-plus-circle"></i> Income
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'debts' ? 'active' : ''}
                onClick={() => setActiveTab('debts')}
              >
                <i className="bi bi-dash-circle"></i> Debts
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'expenses' ? 'active' : ''}
                onClick={() => setActiveTab('expenses')}
              >
                <i className="bi bi-arrow-down-circle"></i> Expenses
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'budget' ? 'active' : ''}
                onClick={() => setActiveTab('budget')}
              >
                <i className="bi bi-list-check"></i> Budget
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'goals' ? 'active' : ''}
                onClick={() => setActiveTab('goals')}
              >
                <i className="bi bi-flag"></i> Goals
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'analytics' ? 'active' : ''}
                onClick={() => setActiveTab('analytics')}
              >
                <i className="bi bi-bar-chart"></i> Analytics
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'charts' ? 'active' : ''}
                onClick={() => setActiveTab('charts')}
              >
                <i className="bi bi-graph-up"></i> Visual Charts
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'credit-card-payoff' ? 'active' : ''}
                onClick={() => setActiveTab('credit-card-payoff')}
              >
                <i className="bi bi-credit-card-2-front"></i> Card Payoff
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'logs' ? 'active' : ''}
                onClick={() => setActiveTab('logs')}
              >
                <i className="bi bi-clock-history"></i> Logs
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'reports' ? 'active' : ''}
                onClick={() => setActiveTab('reports')}
              >
                <i className="bi bi-file-earmark-pdf"></i> Reports
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'settings' ? 'active' : ''}
                onClick={() => setActiveTab('settings')}
              >
                <i className="bi bi-gear"></i> Settings
              </button>
            </li>
          </ul>
        </aside>
        <main className="content">
          <div className="content-inner">
            {renderContent()}
          </div>
        </main>
      </div>
      {duePayments.length > 0 && (
        <DuePaymentsModal
          payments={duePayments}
          onConfirm={handleConfirmPayment}
          onConfirmAll={handleConfirmAllPayments}
          onDismiss={() => setDuePayments([])}
        />
      )}
    </div>
  );
};

export default App;
