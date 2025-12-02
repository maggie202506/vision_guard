
import React, { useState, useEffect, useRef } from 'react';
import { Task, DEFAULT_TASKS } from '../types';
import { 
  Eye, Sun, Activity, Droplets, PhoneOff, 
  Moon, BookOpen, Monitor, Plus, Trash2, Video, Upload, Link as LinkIcon, Clock, Repeat, Edit2, RotateCcw, Ban, AlertCircle, X
} from 'lucide-react';

interface PlanManagerProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const CATEGORIES = [
  { id: 'outdoor', label: '户外阳光', icon: 'Sun' },
  { id: 'distant', label: '望远', icon: 'Eye' },
  { id: 'reading_stand', label: '读写台', icon: 'BookOpen' },
  { id: 'visual_func', label: '视训', icon: 'Activity' },
];

const SUB_CATEGORIES: Record<string, string[]> = {
  'distant': ['远眺', '6米电视', '自定义'],
  'reading_stand': ['视多星', '耐德视', '自定义'],
  'visual_func': ['反转拍', '晶体操', '聚散球', '移近推远', '红绿矢量图', '自定义'],
};

const iconMap: Record<string, React.FC<any>> = {
  Eye, Sun, Activity, Droplets, PhoneOff, Moon, BookOpen, Monitor
};

const PlanManager: React.FC<PlanManagerProps> = ({ tasks, setTasks }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
  
  // States for the new selector logic
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [videoError, setVideoError] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  
  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ isOpen: false, title: '', message: '', action: () => {} });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when opening/closing
  useEffect(() => {
    if (!isEditing) {
      setSelectedCategory('');
      setSelectedSub('');
      setCustomTitle('');
      setVideoError('');
      setFormError('');
    }
  }, [isEditing]);

  const handleEdit = (task: Task) => {
    setCurrentTask(task);
    setCustomTitle(task.title); 
    
    // Attempt to auto-select category based on title or logic
    const category = CATEGORIES.find(c => c.label === task.title) || CATEGORIES.find(c => c.id === 'outdoor' && task.title === '户外阳光');
    if (category) {
        setSelectedCategory(category.id);
    } else if (task.title === '视训' || task.title === '视功能训练') {
        setSelectedCategory('visual_func');
    } else {
        // Reverse lookup sub categories
        for (const [catId, subs] of Object.entries(SUB_CATEGORIES)) {
            if (subs.includes(task.title)) {
                setSelectedCategory(catId);
                setSelectedSub(task.title);
                break;
            }
        }
    }
    
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentTask({
      id: Date.now().toString(),
      title: '',
      description: '',
      icon: 'Eye',
      duration: 5,
      targetCount: 1,
      videoUrl: '',
      frequency: 'daily'
    });
    setIsEditing(true);
  };

  const requestResetDefaults = () => {
    setConfirmation({
      isOpen: true,
      title: '恢复默认计划',
      message: '确定要重置为默认计划吗？这将覆盖当前的所有计划。',
      action: () => {
        setTasks(DEFAULT_TASKS);
        setConfirmation(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const requestClearAll = () => {
    setConfirmation({
      isOpen: true,
      title: '清空计划',
      message: '确定要清空所有计划吗？此操作无法撤销。',
      action: () => {
        setTasks([]);
        setConfirmation(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const requestDelete = (id: string) => {
    setConfirmation({
      isOpen: true,
      title: '删除计划',
      message: '确定要删除这个计划吗？',
      action: () => {
        setTasks(prev => prev.filter(t => t.id !== id));
        setConfirmation(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size limit check (e.g., 2.5MB for localStorage safety)
    if (file.size > 2.5 * 1024 * 1024) {
      setVideoError('视频文件过大。本地存储限制为 2.5MB。建议使用外部链接。');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setCurrentTask(prev => ({ ...prev, videoUrl: base64 }));
      setVideoError('');
    };
    reader.onerror = () => {
      setVideoError('读取文件失败');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setFormError('');
    let titleToSave = currentTask.title;
    let iconToSave = currentTask.icon || 'Eye';

    // Construct title from selectors
    if (selectedCategory) {
      const cat = CATEGORIES.find(c => c.id === selectedCategory);
      iconToSave = cat?.icon || 'Eye';

      if (selectedCategory === 'outdoor') titleToSave = '户外阳光';
      else if (selectedCategory === 'visual_func' && !selectedSub) titleToSave = '视训';
      else if (SUB_CATEGORIES[selectedCategory]) {
        if (selectedSub === '自定义') titleToSave = customTitle;
        else if (selectedSub) titleToSave = selectedSub;
      }
    } else {
      // Fallback
       titleToSave = customTitle || currentTask.title;
    }

    // Validation
    if (!titleToSave || (selectedSub === '自定义' && !customTitle)) {
        setFormError("请选择一个项目类型或输入自定义名称！");
        return;
    }

    const taskToSave = {
      ...currentTask,
      title: titleToSave,
      icon: iconToSave,
      description: currentTask.description || titleToSave,
      frequency: currentTask.frequency || 'daily'
    } as Task;

    setTasks(prev => {
      const exists = prev.find(t => t.id === currentTask.id);
      if (exists) {
        return prev.map(t => t.id === currentTask.id ? taskToSave : t);
      }
      return [...prev, taskToSave];
    });
    setIsEditing(false);
  };

  if (isEditing) {
    const showSubOptions = SUB_CATEGORIES.hasOwnProperty(selectedCategory);
    const showCustomInput = 
      !selectedCategory || 
      (showSubOptions && selectedSub === '自定义');

    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 animate-in slide-in-from-bottom-4">
        <h2 className="text-xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
          {currentTask.id && tasks.find(t => t.id === currentTask.id) ? '编辑计划' : '新建计划'}
        </h2>
        
        {formError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2">
            <AlertCircle size={16} />
            {formError}
          </div>
        )}

        <div className="space-y-5">
          
          {/* Category Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">项目类型 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSub(''); // Reset sub
                    setFormError('');
                  }}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2
                    ${selectedCategory === cat.id 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : 'border-slate-100 text-slate-600 hover:border-emerald-200'
                    }
                  `}
                >
                  {iconMap[cat.icon] && React.createElement(iconMap[cat.icon], { size: 16 })}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub Category Selector */}
          {showSubOptions && (
            <div className="animate-in fade-in slide-in-from-top-2">
               <label className="block text-sm font-medium text-slate-700 mb-2">具体项目</label>
               <div className="flex flex-wrap gap-2">
                 {SUB_CATEGORIES[selectedCategory].map(sub => (
                   <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      setSelectedSub(sub);
                      setFormError('');
                    }}
                    className={`px-4 py-2 rounded-full text-sm border transition-all
                      ${selectedSub === sub
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                      }
                    `}
                   >
                     {sub}
                   </button>
                 ))}
               </div>
            </div>
          )}

          {/* Custom Input */}
          {showCustomInput && (
             <div className="animate-in fade-in">
              <label className="block text-sm font-medium text-slate-700 mb-1">自定义名称 {selectedCategory && <span className="text-red-500">*</span>}</label>
              <input 
                type="text" 
                value={customTitle}
                onChange={e => {
                  setCustomTitle(e.target.value);
                  setFormError('');
                }}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                placeholder="请输入项目名称"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">训练/指导说明</label>
            <textarea 
              value={currentTask.description || ''}
              onChange={e => setCurrentTask({...currentTask, description: e.target.value})}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all h-20 resize-none"
              placeholder="备注具体的训练细节..."
            />
          </div>

          {/* Frequency & Duration */}
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
               <label className="block text-sm font-medium text-slate-700 mb-2">训练频次</label>
               <div className="flex bg-slate-100 rounded-xl p-1">
                 <button 
                   type="button"
                   onClick={() => setCurrentTask({...currentTask, frequency: 'daily'})}
                   className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                     (currentTask.frequency || 'daily') === 'daily' 
                     ? 'bg-white text-emerald-700 shadow-sm' 
                     : 'text-slate-500 hover:text-slate-700'
                   }`}
                 >
                   每天
                 </button>
                 <button 
                   type="button"
                   onClick={() => setCurrentTask({...currentTask, frequency: 'weekly'})}
                   className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                     currentTask.frequency === 'weekly' 
                     ? 'bg-white text-emerald-700 shadow-sm' 
                     : 'text-slate-500 hover:text-slate-700'
                   }`}
                 >
                   每周
                 </button>
               </div>
             </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Clock size={14} /> 训练时长 (分钟)
              </label>
              <input 
                type="number" 
                min="0"
                value={currentTask.duration || 0}
                onChange={e => setCurrentTask({...currentTask, duration: parseInt(e.target.value) || 0})}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Repeat size={14} /> 目标次数
              </label>
              <input 
                type="number" 
                min="1"
                value={currentTask.targetCount || 1}
                onChange={e => setCurrentTask({...currentTask, targetCount: parseInt(e.target.value) || 1})}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Video Upload / Link */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
               <Video size={16} /> 教学视频
            </label>
            
            <div className="space-y-3">
              {/* URL Input */}
              <div className="flex gap-2">
                 <div className="relative flex-1">
                   <LinkIcon size={16} className="absolute left-3 top-3.5 text-slate-400" />
                   <input 
                     type="text"
                     value={currentTask.videoUrl || ''}
                     onChange={e => setCurrentTask({...currentTask, videoUrl: e.target.value})}
                     placeholder="输入视频链接 (URL) 或 粘贴嵌入代码"
                     className="w-full pl-9 p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm"
                   />
                 </div>
              </div>

              <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">或者</span>
                  <div className="flex-1 h-px bg-slate-100"></div>
              </div>

              {/* File Upload */}
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                >
                  <Upload size={16} /> 选择本地视频
                </button>
                <span className="text-xs text-slate-400">最大 2.5MB</span>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoFileChange}
                />
              </div>
              
              {videoError && <p className="text-xs text-red-500">{videoError}</p>}
              
              {/* Preview */}
              {currentTask.videoUrl && (
                <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>已添加视频资源</span>
                    <button 
                      type="button"
                      onClick={() => setCurrentTask({...currentTask, videoUrl: ''})}
                      className="text-red-500 hover:text-red-700"
                    >
                      移除
                    </button>
                  </div>
                  {currentTask.videoUrl.startsWith('data:') ? (
                    <video src={currentTask.videoUrl} controls className="w-full h-32 object-cover rounded bg-black" />
                  ) : (
                    <div className="w-full h-8 flex items-center bg-white px-2 rounded border border-slate-100 truncate">
                      {currentTask.videoUrl}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 mt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button 
              type="button"
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
            >
              保存计划
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Custom Confirmation Modal */}
      {confirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}></div>
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full relative z-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">{confirmation.title}</h3>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">{confirmation.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors text-sm font-medium"
              >
                取消
              </button>
              <button 
                type="button"
                onClick={confirmation.action}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium shadow-md shadow-red-200"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">我的计划</h1>
          <p className="text-slate-500">定制你的每日护眼清单</p>
        </div>
        <button 
          type="button"
          onClick={handleAddNew}
          className="bg-emerald-600 text-white p-3 rounded-full hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
          title="新建计划"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="flex gap-2">
          <button 
            type="button"
            onClick={requestResetDefaults}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium active:scale-95 cursor-pointer"
          >
             <RotateCcw size={14} /> 恢复默认
          </button>
          <button 
            type="button"
            onClick={requestClearAll}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium active:scale-95 cursor-pointer"
          >
             <Ban size={14} /> 清空计划
          </button>
      </div>

      <div className="grid gap-4">
        {tasks.map(task => {
          const Icon = iconMap[task.icon] || Eye;
          return (
            <div key={task.id} className="bg-white p-4 rounded-2xl border border-emerald-50 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Icon size={24} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800 truncate">{task.title}</h3>
                  {task.videoUrl && <Video size={14} className="text-emerald-500" />}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {task.duration}分钟
                  </span>
                  <span className="flex items-center gap-1">
                    <Repeat size={12} /> {task.targetCount}次/{(task.frequency === 'weekly' ? '周' : '天')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleEdit(task); }}
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); requestDelete(task.id); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-10 cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
        
        {tasks.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p>还没有任务，快去创建一个吧！</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanManager;
