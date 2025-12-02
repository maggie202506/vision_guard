
import React, { useState, useEffect } from 'react';
import { Task, DailyRecord } from '../types';
import { CheckCircle2, Circle, Eye, Sun, Activity, Droplets, PhoneOff, Sparkles, Moon, BookOpen, Monitor, Clock, Repeat, Plus, Video, X, PlayCircle, Edit3, Check, CalendarRange, PenLine, Smile } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  todayRecord: DailyRecord;
  history: DailyRecord[];
  onIncrementTask: (taskId: string) => void;
  onUpdateNote: (note: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  slogan: string;
  setSlogan: (slogan: string) => void;
}

const iconMap: Record<string, React.FC<any>> = {
  Eye, Sun, Activity, Droplets, PhoneOff, Moon, BookOpen, Monitor
};

const ENCOURAGING_EMOJIS = ['🎉', '🌟', '💪', '💯', '✨', '🏆', '🌈', '🤩', '🔥'];
const ENCOURAGING_TEXTS = ['太棒了！', '继续保持！', '做得好！', '护眼小能手！', '眼睛在感谢你！', '坚持就是胜利！'];

const Dashboard: React.FC<DashboardProps> = ({ 
  tasks, 
  todayRecord, 
  history,
  onIncrementTask, 
  onUpdateNote,
  userName,
  setUserName,
  slogan,
  setSlogan
}) => {
  // Video Modal State
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Note Edit State
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState(todayRecord.notes || '');

  // Celebration State
  const [celebration, setCelebration] = useState<{show: boolean, emoji: string, text: string} | null>(null);

  // Sync note input with prop when prop changes (e.g. initial load)
  useEffect(() => {
    setNoteInput(todayRecord.notes || '');
  }, [todayRecord.notes]);

  const handleIncrement = (taskId: string) => {
    onIncrementTask(taskId);
    
    // Trigger celebration
    const randomEmoji = ENCOURAGING_EMOJIS[Math.floor(Math.random() * ENCOURAGING_EMOJIS.length)];
    const randomText = ENCOURAGING_TEXTS[Math.floor(Math.random() * ENCOURAGING_TEXTS.length)];
    setCelebration({ show: true, emoji: randomEmoji, text: randomText });

    // Hide after timeout
    setTimeout(() => {
      setCelebration(null);
    }, 1500);
  };

  const handleSaveNote = () => {
    onUpdateNote(noteInput);
    setIsEditingNote(false);
  };

  // Helper: Calculate progress for a specific task
  const getTaskProgress = (task: Task) => {
    if (task.frequency === 'weekly') {
      // Calculate start of week (Monday)
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sunday
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - distanceToMonday);
      monday.setHours(0,0,0,0);
      const mondayStr = monday.toISOString().split('T')[0];
      
      let total = 0;
      // Sum up counts from history for this week
      history.forEach(r => {
        if (r.date >= mondayStr) {
          total += (r.progress[task.id] || 0);
        }
      });
      return total;
    } else {
      // Daily
      return todayRecord.progress[task.id] || 0;
    }
  };

  // Calculate total percentage
  let totalPercent = 0;
  if (tasks.length > 0) {
    const sumPercents = tasks.reduce((acc, task) => {
      const progress = getTaskProgress(task);
      const ratio = Math.min(progress / task.targetCount, 1);
      return acc + ratio;
    }, 0);
    totalPercent = (sumPercents / tasks.length) * 100;
  }
  
  // Format for display text
  const getProgressText = () => {
    const completedCount = tasks.filter(t => getTaskProgress(t) >= t.targetCount).length;
    return `${completedCount}/${tasks.length}`;
  };

  const handleOpenVideo = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    setActiveVideo(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Celebration Overlay */}
      {celebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center transform scale-110 animate-in zoom-in fade-in duration-300 border-4 border-emerald-200">
             <div className="text-8xl mb-4 animate-bounce">{celebration.emoji}</div>
             <div className="text-2xl font-bold text-emerald-600">{celebration.text}</div>
          </div>
        </div>
      )}

      {/* Header / Greeting */}
      <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              {isEditingProfile ? (
                 <div className="animate-in fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">你好，</span>
                      <input 
                        type="text" 
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-transparent border-b border-emerald-300 text-white text-2xl font-bold focus:outline-none focus:border-white w-40"
                        autoFocus
                      />
                       <span className="text-2xl">👋</span>
                    </div>
                    <input 
                      type="text"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      className="bg-transparent border-b border-emerald-400/50 text-emerald-100 text-sm focus:outline-none focus:border-emerald-200 w-full mb-6"
                    />
                 </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    你好，{userName}！ 👋
                  </h1>
                  <p className="text-emerald-100 mb-6 min-h-[1.25rem]">{slogan}</p>
                </>
              )}
            </div>
            
            <button 
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="p-2 rounded-full hover:bg-white/10 text-emerald-100 hover:text-white transition-colors"
              title={isEditingProfile ? "保存" : "编辑资料"}
            >
              {isEditingProfile ? <Check size={20} /> : <Edit3 size={18} />}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-4xl font-bold">{Math.round(totalPercent)}%</span>
              <span className="text-sm text-emerald-200 ml-2">计划完成度</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold">{getProgressText()}</div>
              <div className="text-xs text-emerald-200">完成项目</div>
            </div>
          </div>

          <div className="mt-4 h-2 bg-emerald-800/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-700 ease-out"
              style={{ width: `${totalPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div>
        <h2 className="text-lg font-semibold text-emerald-900 mb-4 px-1">打卡清单</h2>
        <div className="grid gap-3">
          {tasks.map(task => {
            const current = getTaskProgress(task);
            const isCompleted = current >= task.targetCount;
            const Icon = iconMap[task.icon] || Eye;
            const isWeekly = task.frequency === 'weekly';
            
            return (
              <div 
                key={task.id}
                onClick={() => handleIncrement(task.id)}
                className={`
                  group cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex items-center gap-4 relative overflow-hidden active:scale-[0.98]
                  ${isCompleted 
                    ? 'bg-emerald-100/50 border-emerald-200 hover:bg-emerald-100' 
                    : 'bg-white border-emerald-50 hover:border-emerald-200 hover:shadow-md'
                  }
                `}
              >
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center transition-colors relative flex-shrink-0
                  ${isCompleted ? 'bg-emerald-200 text-emerald-700' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'}
                `}>
                  <Icon size={24} />
                  {task.targetCount > 1 && (
                    <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white text-[10px] w-auto min-w-[1.25rem] px-1 h-5 rounded-full flex items-center justify-center border-2 border-white">
                        {current}/{task.targetCount}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 z-10">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium truncate ${isCompleted ? 'text-emerald-800 line-through decoration-emerald-500/50' : 'text-slate-800'}`}>
                      {task.title}
                    </h3>
                    {isWeekly && (
                       <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                         <CalendarRange size={10} /> 周计划
                       </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-tight mt-1 mb-2 line-clamp-2">{task.description}</p>
                  
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.duration > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${isCompleted ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        <Clock size={10} /> {task.duration}分钟
                      </span>
                    )}
                     <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${isCompleted ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        <Repeat size={10} /> {current}/{task.targetCount}次
                      </span>
                      
                      {task.videoUrl && (
                        <button 
                          onClick={(e) => handleOpenVideo(e, task.videoUrl!)}
                          className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100 z-20"
                        >
                          <PlayCircle size={10} /> 观看指导
                        </button>
                      )}
                  </div>
                </div>

                <div className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0
                  ${isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-emerald-400 text-slate-300 group-hover:text-emerald-400'}
                `}>
                  {isCompleted ? <CheckCircle2 size={18} className="text-white" /> : <Plus size={18} />}
                </div>
              </div>
            );
          })}
          
          {tasks.length === 0 && (
            <div className="text-center py-10 text-slate-400">
               还没有计划。请点击下方“计划”按钮添加。
            </div>
          )}
        </div>
      </div>

      {/* Daily Notes Section */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
           <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
             <PenLine size={20} className="text-emerald-500" />
             今日心得
           </h2>
           {!isEditingNote && (
              <button 
                 onClick={() => setIsEditingNote(true)}
                 className="text-xs text-emerald-600 font-medium px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                 {todayRecord.notes ? '编辑' : '写心得'}
              </button>
           )}
        </div>
        
        {isEditingNote ? (
           <div className="animate-in fade-in">
              <textarea 
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="记录一下今天的眼睛状态、训练感受，或者是鼓励自己的一句话..."
                className="w-full h-32 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none resize-none text-sm leading-relaxed mb-3"
              />
              <div className="flex justify-end gap-2">
                 <button 
                   onClick={() => setIsEditingNote(false)}
                   className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                 >
                   取消
                 </button>
                 <button 
                   onClick={handleSaveNote}
                   className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
                 >
                   保存记录
                 </button>
              </div>
           </div>
        ) : (
           <div 
             onClick={() => setIsEditingNote(true)} 
             className="min-h-[4rem] text-sm text-slate-600 leading-relaxed cursor-pointer hover:text-slate-800 transition-colors"
           >
              {todayRecord.notes ? (
                 <p className="whitespace-pre-wrap">{todayRecord.notes}</p>
              ) : (
                 <div className="flex flex-col items-center justify-center py-4 text-slate-400 gap-2">
                    <Smile size={24} className="text-slate-300" />
                    <p>今天感觉如何？记录一下吧~</p>
                 </div>
              )}
           </div>
        )}
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-3 border-b flex items-center justify-between bg-slate-50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Video size={18} className="text-emerald-500" />
                  训练指导
                </h3>
                <button 
                  onClick={() => setActiveVideo(null)}
                  className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="bg-black aspect-video flex items-center justify-center relative">
                 {activeVideo.startsWith('data:') ? (
                    <video src={activeVideo} controls autoPlay className="w-full h-full" />
                 ) : (
                    activeVideo.includes('http') ? (
                       <div className="text-center p-6 text-white w-full">
                          <p className="mb-4 text-slate-300 text-sm">外部视频链接</p>
                          <a 
                             href={activeVideo} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
                          >
                             <PlayCircle size={20} /> 点击前往观看
                          </a>
                          <p className="mt-4 text-xs text-slate-500 break-all">{activeVideo}</p>
                       </div>
                    ) : (
                       <div className="text-white">无效的视频链接</div>
                    )
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
