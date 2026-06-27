import React, { useState, useEffect } from 'react';
import { FinancialProject, Income, Debt, Expense, Budget } from './types';
import Dashboard from './components/Dashboard';
import IncomeManager from './components/IncomeManager';
import DebtManager from './components/DebtManager';
import ExpenseManager from './components/ExpenseManager';
import BudgetManager from './components/BudgetManager';
import Charts from './components/Charts';
import Analytics from './components/Analytics';
import LoadingScreen from './components/LoadingScreen';
import WelcomeScreen from './components/WelcomeScreen';

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
      // Remove if already exists
      const filtered = prev.filter(p => p.path !== path);
      // Add to beginning and limit to 5
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
      setProject(result.data);
      setCurrentFilePath(result.filePath || null);
      setHasUnsavedChanges(false);
      setShowWelcome(false);

      // Add to recent projects
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
      setProject(result.data);
      setCurrentFilePath(result.filePath || null);
      setHasUnsavedChanges(false);
      setShowWelcome(false);

      // Add to recent projects
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
    if (!project) return;
    console.log('[RENDERER] Save project requested');
    const updatedProject = { ...project, updatedAt: new Date().toISOString() };
    const result = await window.electronAPI.saveProject(updatedProject);
    console.log('[RENDERER] Save result:', result);
    if (result.success) {
      setCurrentFilePath(result.filePath || null);
      setHasUnsavedChanges(false);

      // Add to recent projects
      if (result.filePath) {
        const fileName = result.filePath.split(/[\\/]/).pop() || 'Unknown';
        const projectName = fileName.replace('.json', '');
        addRecentProject(result.filePath, projectName);
      }
      console.log('[RENDERER] Project saved, filePath:', result.filePath);
    }
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

      // Add to recent projects
      if (result.filePath) {
        const fileName = result.filePath.split(/[\\/]/).pop() || 'Unknown';
        const projectName = fileName.replace('.json', '');
        addRecentProject(result.filePath, projectName);
      }
      console.log('[RENDERER] Project saved as, filePath:', result.filePath);
    }
  };

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

  const updateProject = (updates: Partial<FinancialProject>) => {
    if (!project) return;
    setProject(prev => prev ? ({ ...prev, ...updates }) : null);
    setHasUnsavedChanges(true);
  };

  const addIncome = (income: Income) => {
    if (!project) return;
    updateProject({ incomes: [...project.incomes, income] });
  };

  const updateIncome = (id: string, updates: Partial<Income>) => {
    if (!project) return;
    updateProject({
      incomes: project.incomes.map(income =>
        income.id === id ? { ...income, ...updates } : income
      )
    });
  };

  const deleteIncome = (id: string) => {
    if (!project) return;
    updateProject({
      incomes: project.incomes.filter(income => income.id !== id)
    });
  };

  const addDebt = (debt: Debt) => {
    if (!project) return;
    updateProject({ debts: [...project.debts, debt] });
  };

  const updateDebt = (id: string, updates: Partial<Debt>) => {
    if (!project) return;
    updateProject({
      debts: project.debts.map(debt =>
        debt.id === id ? { ...debt, ...updates } : debt
      )
    });
  };

  const deleteDebt = (id: string) => {
    if (!project) return;
    updateProject({
      debts: project.debts.filter(debt => debt.id !== id)
    });
  };

  const addExpense = (expense: Expense) => {
    if (!project) return;
    updateProject({ expenses: [...project.expenses, expense] });
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    if (!project) return;
    updateProject({
      expenses: project.expenses.map(expense =>
        expense.id === id ? { ...expense, ...updates } : expense
      )
    });
  };

  const deleteExpense = (id: string) => {
    if (!project) return;
    updateProject({
      expenses: project.expenses.filter(expense => expense.id !== id)
    });
  };

  const addBudget = (budget: Budget) => {
    if (!project) return;
    updateProject({ budgets: [...project.budgets, budget] });
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    if (!project) return;
    updateProject({
      budgets: project.budgets.map(budget =>
        budget.id === id ? { ...budget, ...updates } : budget
      )
    });
  };

  const deleteBudget = (id: string) => {
    if (!project) return;
    updateProject({
      budgets: project.budgets.filter(budget => budget.id !== id)
    });
  };

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
          <DebtManager
            debts={project.debts}
            onAdd={addDebt}
            onUpdate={updateDebt}
            onDelete={deleteDebt}
          />
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
      case 'analytics':
        return <Analytics project={project} />;
      case 'charts':
        return <Charts project={project} />;
      default:
        return <Dashboard project={project} />;
    }
  };

  const getProjectDisplayName = () => {
    if (currentFilePath) {
      // Extract filename from path
      const fileName = currentFilePath.split(/[\\/]/).pop() || 'Unknown';
      return fileName.replace('.json', '');
    }
    return 'Unsaved Project';
  };

  // Show loading screen first
  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
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
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
          <h1 style={{ margin: 0 }}><i className="bi bi-currency-dollar"></i> FINANCIAL TRACKER</h1>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
            {getProjectDisplayName()}{hasUnsavedChanges && ' *'}
          </div>
        </div>
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
          </ul>
        </aside>
        <main className="content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;