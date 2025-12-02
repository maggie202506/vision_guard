
import React, { useState, useEffect } from 'react';
import { DailyRecord, Task, AppView, DEFAULT_TASKS } from './types';
import Dashboard from './components/Dashboard';
import Statistics from './components/Statistics';
import PlanManager from './components/PlanManager';
import { LayoutDashboard, BarChart2, Eye, CalendarCheck } from 'lucide-react';

// Helper to get today's date string YYYY-MM-DD
const getTodayStr = () => new Date().toISOString().split('T')[0];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [history, setHistory] = useState<DailyRecord[]>([]);
  
  // User Profile State
  const [userName, setUserName] = useState<string>('护眼达人');
  const [slogan, setSlogan] = useState<string>('今天也要坚持护眼哦。');
  
  // Load data on mount
  useEffect(() => {
    // Load History
    const savedHistory = localStorage.getItem('visionGuard_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // Migration logic: convert old `completedTaskIds` to `progress` map if needed
        const migrated = parsed.map((record: any) => {
          if (!record.progress && record.completedTaskIds) {
             const progress: Record<string, number> = {};
             record.completedTaskIds.forEach((id: string) => {
               progress[id] = 1; // Assume 1 completion for old binary data
             });
             return { ...record, progress };
          }
          return record;
        });
        setHistory(migrated);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    // Load Tasks
    const savedTasks = localStorage.getItem('visionGuard_tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Failed to parse tasks", e);
      }
    }

    // Load Profile
    const savedName = localStorage.getItem('visionGuard_userName');
    if (savedName) setUserName(savedName);
    
    const savedSlogan = localStorage.getItem('visionGuard_slogan');
    if (savedSlogan) setSlogan(savedSlogan);
  }, []);

  // Save history on change
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('visionGuard_history', JSON.stringify(history));
    }
  }, [history]);

  // Save tasks on change
  useEffect(() => {
    localStorage.setItem('visionGuard_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save profile on change
  useEffect(() => {
    localStorage.setItem('visionGuard_userName', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('visionGuard_slogan', slogan);
  }, [slogan]);

  // Get or Create today's record
  const getTodayRecord = (): DailyRecord => {
    const today = getTodayStr();
    const existing = history.find(h => h.date === today);
    if (existing) return existing;
    return { date: today, progress: {} };
  };

  const handleIncrementTask = (taskId: string) => {
    const today = getTodayStr();
    setHistory(prev => {
      const todayRecordIndex = prev.findIndex(r => r.date === today);
      let newRecord: DailyRecord;

      if (todayRecordIndex >= 0) {
        const record = prev[todayRecordIndex];
        const currentDailyCount = record.progress[taskId] || 0;
        
        const newCount = currentDailyCount + 1;
        const newProgress = { ...record.progress, [taskId]: newCount };

        newRecord = { ...record, progress: newProgress };
        const newHistory = [...prev];
        newHistory[todayRecordIndex] = newRecord;
        return newHistory;
      } else {
        newRecord = { date: today, progress: { [taskId]: 1 } };
        return [...prev, newRecord];
      }
    });
  };

  const handleUpdateNote = (note: string) => {
    const today = getTodayStr();
    setHistory(prev => {
      const todayRecordIndex = prev.findIndex(r => r.date === today);
      if (todayRecordIndex >= 0) {
        const newHistory = [...prev];
        newHistory[todayRecordIndex] = { ...newHistory[todayRecordIndex], notes: note };
        return newHistory;
      } else {
        return [...prev, { date: today, progress: {}, notes: note }];
      }
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard 
            tasks={tasks} 
            todayRecord={getTodayRecord()} 
            history={history}
            onIncrementTask={handleIncrementTask}
            onUpdateNote={handleUpdateNote}
            userName={userName}
            setUserName={setUserName}
            slogan={slogan}
            setSlogan={setSlogan}
          />
        );
      case AppView.STATS:
        return <Statistics history={history} currentTasks={tasks} />;
      case AppView.PLAN:
        return <PlanManager tasks={tasks} setTasks={setTasks} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-800 font-sans pb-24 md:pb-0 md:pl-24">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-emerald-100">
        <div className="flex items-center gap-2">
           <div className="bg-emerald-600 p-1.5 rounded-lg">
             <Eye size={20} className="text-white" />
           </div>
           <span className="font-bold text-lg text-emerald-900 tracking-tight">护眼打卡</span>
        </div>
        <button 
          onClick={() => setCurrentView(AppView.PLAN)}
          className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-full"
        >
          <CalendarCheck size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto p-4 md:py-8">
        {renderContent()}
      </main>

      {/* Navigation Bar */}
      <nav className="
        fixed bottom-0 left-0 right-0 bg-white border-t border-emerald-100 pb-safe
        md:top-0 md:left-0 md:bottom-0 md:w-20 md:border-t-0 md:border-r md:flex-col md:justify-center md:gap-8
        flex justify-around items-center py-3 md:py-0 z-50
      ">
        <NavButton 
          active={currentView === AppView.DASHBOARD} 
          onClick={() => setCurrentView(AppView.DASHBOARD)}
          icon={LayoutDashboard}
          label="今日"
        />
        <NavButton 
          active={currentView === AppView.PLAN} 
          onClick={() => setCurrentView(AppView.PLAN)}
          icon={CalendarCheck}
          label="计划"
        />
        <NavButton 
          active={currentView === AppView.STATS} 
          onClick={() => setCurrentView(AppView.STATS)}
          icon={BarChart2}
          label="统计"
        />
      </nav>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.FC<any>;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center gap-1 w-16 h-14 md:w-14 md:h-16 rounded-xl transition-all duration-300
      ${active 
        ? 'text-emerald-600 bg-emerald-50 md:bg-emerald-100 scale-105' 
        : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'
      }
    `}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;
