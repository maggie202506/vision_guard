
import React, { useState } from 'react';
import { DailyRecord, Task } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, CalendarDays, TrendingUp, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface StatisticsProps {
  history: DailyRecord[];
  currentTasks: Task[]; 
}

const Statistics: React.FC<StatisticsProps> = ({ history, currentTasks }) => {
  const currentTotalTarget = currentTasks.reduce((acc, t) => acc + t.targetCount, 0);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  const getLast7DaysData = () => {
    const data = [];
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const record = history.find(h => h.date === dateStr);
      
      let completedSteps = 0;
      if (record && record.progress) {
         Object.entries(record.progress).forEach(([taskId, count]) => {
             completedSteps += (count as number);
         });
      }

      data.push({
        name: days[d.getDay()],
        fullDate: dateStr,
        completed: completedSteps,
        total: currentTotalTarget,
        score: currentTotalTarget > 0 ? (completedSteps / currentTotalTarget) * 100 : 0
      });
    }
    return data;
  };

  const chartData = getLast7DaysData();
  const currentStreak = calculateStreak(history);
  const totalDaysActive = history.length;

  // --- Calendar Logic ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    const days = [];
    // Padding for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDayStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const record = history.find(h => h.date === dateStr);
    if (!record) return 'none';
    
    // Check completion level
    let completedSteps = 0;
    if (record.progress) {
        Object.values(record.progress).forEach(c => completedSteps += (c as number));
    }
    
    if (completedSteps === 0) return 'none';
    if (completedSteps >= currentTotalTarget && currentTotalTarget > 0) return 'full';
    return 'partial';
  };

  // --- Export Logic ---
  const exportToText = () => {
    let content = "护眼打卡数据\n===================\n\n";
    content += `生成日期: ${new Date().toLocaleDateString()}\n`;
    content += `总活跃天数: ${totalDaysActive} 天\n`;
    content += `当前连续打卡: ${currentStreak} 天\n\n`;
    
    const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));
    
    sortedHistory.forEach(record => {
      content += `[${record.date}]\n`;
      if (record.notes) {
        content += `📝 心得: ${record.notes}\n`;
      }
      content += `✅ 完成进度:\n`;
      
      const taskEntries = Object.entries(record.progress);
      if (taskEntries.length === 0) {
        content += "   无详细记录\n";
      } else {
        taskEntries.forEach(([taskId, count]) => {
           // Try to find task name, or fallback to ID
           const taskName = currentTasks.find(t => t.id === taskId)?.title || taskId;
           content += `   - ${taskName}: ${count}次\n`;
        });
      }
      content += "\n-------------------\n";
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `护眼打卡数据_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">
      
      {/* Top Controls */}
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-slate-800">数据统计</h2>
         <div className="flex gap-2">
            <button 
              onClick={exportToText} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg shadow-sm hover:bg-emerald-700 transition-colors"
              title="导出为文本数据"
            >
              <FileText size={14} /> 导出数据
            </button>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <Trophy size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">连续打卡</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{currentStreak} <span className="text-sm font-normal text-slate-500">天</span></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <CalendarDays size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">活跃天数</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{totalDaysActive} <span className="text-sm font-normal text-slate-500">天</span></div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <CalendarDays size={20} className="text-emerald-500" />
            打卡日历
          </h3>
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
            <button onClick={prevMonth} className="p-1 hover:bg-white rounded-md transition-colors text-slate-500">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium w-20 text-center">
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-white rounded-md transition-colors text-slate-500">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 text-center mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => (
            <div key={d} className="text-xs text-slate-400 font-medium py-1">{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} />;
            
            const status = getDayStatus(date);
            const isToday = new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0];
            
            return (
              <div key={index} className="aspect-square flex flex-col items-center justify-center relative">
                 <div className={`
                    w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all
                    ${isToday ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}
                    ${status === 'full' ? 'bg-emerald-500 text-white' : 
                      status === 'partial' ? 'bg-emerald-100 text-emerald-700' : 
                      'text-slate-500 hover:bg-slate-50'}
                 `}>
                    {date.getDate()}
                 </div>
                 {status !== 'none' && (
                    <div className={`w-1 h-1 rounded-full mt-0.5 ${status === 'full' ? 'bg-emerald-500' : 'bg-emerald-300'}`}></div>
                 )}
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-slate-400">
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> 完成</div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-100"></div> 进行中</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" />
            本周趋势
          </h3>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b' }}
                dy={10}
              />
              <YAxis 
                hide 
                domain={[0, 'auto']}
              />
              <Tooltip 
                cursor={{ fill: '#f0fdf4' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-800 text-white text-xs py-1 px-3 rounded-lg shadow-xl">
                        {`完成 ${payload[0].value} 项`}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="completed" radius={[6, 6, 6, 6]} barSize={24}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={'#34d399'} 
                    fillOpacity={entry.completed === 0 ? 0.2 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

function calculateStreak(history: DailyRecord[]): number {
  if (history.length === 0) return 0;
  
  const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  let streak = 0;
  
  const recordMap = new Map();
  sorted.forEach(h => recordMap.set(h.date, h));

  let checkDate = new Date();
  
  // If today has no activity yet, don't break streak from yesterday
  const todayStr = checkDate.toISOString().split('T')[0];
  if (!recordMap.has(todayStr)) {
     checkDate.setDate(checkDate.getDate() - 1);
  } else {
     // check if today is active
     const r = recordMap.get(todayStr);
     const isActive = r && Object.values(r.progress || {}).some((v: number) => v > 0);
     if (!isActive) checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const record = recordMap.get(dateStr);

    let hasActivity = false;
    if (record) {
      if (record.progress) {
        hasActivity = Object.values(record.progress as Record<string, number>).some(val => val > 0);
      }
    }

    if (hasActivity) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export default Statistics;
