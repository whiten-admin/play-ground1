'use client';

import { useTaskContext } from '@/contexts/TaskContext';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useEffect, useRef, useState } from 'react';
import { IoAdd, IoBulb, IoTrash, IoClose, IoCalendar } from 'react-icons/io5';
import { Task, Todo } from '@/types/task';
import { suggestTodos } from '@/utils/openai';
import ScheduleTodosButton from './ScheduleTodosButton';
import { differenceInDays, format } from 'date-fns';
import TaskCreationForm from './TaskCreationForm';
import TaskDetail from './TaskDetail';
import ScheduleDiffView from './ScheduleDiffView';

interface WBSViewProps {
  onTaskCreate?: (newTask: Task) => void;
  onTaskSelect: (taskId: string) => void;
  onTaskUpdate?: (updatedTask: Task) => void;
  projectId?: string;
}

export default function WBSView({ onTaskCreate, onTaskSelect, onTaskUpdate, projectId }: WBSViewProps) {
  const { tasks } = useTaskContext();
  const { currentProject } = useProjectContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(() => {
    // 初期状態で全てのタスクを開く
    const initialSet = new Set<string>();
    tasks.forEach(task => {
      const completionRate = (task.todos.filter(todo => todo.completed).length / task.todos.length) * 100;
      if (completionRate < 100) {
        initialSet.add(task.id);
      }
    });
    return initialSet;
  });
  const [scheduleChanges, setScheduleChanges] = useState<Array<{
    taskId: string;
    taskTitle: string;
    todoId: string;
    todoTitle: string;
    oldDate: string;
    newDate: string;
  }>>([]);

  // タスクを開始日でソートする関数
  const sortTasksByStartDate = (tasksToSort: Task[]): Task[] => {
    return [...tasksToSort].sort((a, b) => {
      // 期日でソート（期日が早い順）
      // 文字列の場合はDateオブジェクトに変換
      const aDueDate = a.dueDate instanceof Date 
        ? a.dueDate.getTime() 
        : new Date(a.dueDate as any).getTime();
      const bDueDate = b.dueDate instanceof Date 
        ? b.dueDate.getTime() 
        : new Date(b.dueDate as any).getTime();
      return aDueDate - bDueDate;
    });
  };

  // ソートされたタスクリスト
  const sortedTasks = sortTasksByStartDate(tasks);

  // タスクの開閉状態を切り替える関数
  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // タスクの完了率が変更されたときに開閉状態を更新
  useEffect(() => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      tasks.forEach(task => {
        const completionRate = (task.todos.filter(todo => todo.completed).length / task.todos.length) * 100;
        if (completionRate === 100) {
          newSet.delete(task.id);
        }
      });
      return newSet;
    });
  }, [tasks]);

  // 日付の位置を計算するユーティリティ関数
  const getDatePosition = (date: Date, startDate: Date) => {
    return Math.ceil(
      (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  // カレンダーの表示範囲を計算
  const getCalendarRange = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // 現在月の3ヶ月前の1日を開始日に
    const startDate = new Date(currentYear, currentMonth - 3, 1);
    // 現在月の3ヶ月後の月末を終了日に
    const endDate = new Date(currentYear, currentMonth + 4, 0); // 次の月の0日 = 当月の末日

    return {
      startDate,
      endDate,
      totalDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    };
  };

  const calendarRange = getCalendarRange();

  // 今日の日付の位置を計算
  const today = new Date();
  const todayPosition = getDatePosition(today, calendarRange.startDate);

  // 日付をフォーマットする関数
  const formatDate = (date: Date) => {
    return date.getDate().toString();
  };

  // 月を取得する関数
  const getMonth = (date: Date) => {
    return date.getMonth() + 1;
  };

  // 指定された日が月の1日かどうかを判定する関数
  const isFirstDayOfMonth = (date: Date) => {
    return date.getDate() === 1;
  };

  // 指定された日数分の日付配列を生成
  const getDates = () => {
    const dates = [];
    const currentDate = new Date(calendarRange.startDate);
    
    while (currentDate <= calendarRange.endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const getDaysBetween = (startDate: Date, endDate: Date) => {
    return Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  // コンポーネントがマウントされた時に、今日の日付が左端に来るようにスクロール
  useEffect(() => {
    console.log('Scroll effect triggered');
    console.log('Container ref:', containerRef.current);
    console.log('Today position:', todayPosition);
    console.log('Calendar range:', calendarRange);

    const scrollToToday = () => {
      const container = containerRef.current;
      if (!container) {
        console.log('Container not found');
        return;
      }

      console.log('Container dimensions:', {
        scrollWidth: container.scrollWidth,
        clientWidth: container.clientWidth,
        scrollLeft: container.scrollLeft
      });

      // スクロール位置を計算（タスク一覧の幅を考慮）
      const columnWidth = container.scrollWidth / calendarRange.totalDays;
      const scrollPosition = (todayPosition - 1) * columnWidth - 500; // タスク一覧の幅を考慮（w-[600px]）

      console.log('Calculated scroll position:', {
        columnWidth,
        scrollPosition,
        totalDays: calendarRange.totalDays
      });

      // スクロールを実行
      container.scrollTo({
        left: Math.max(0, scrollPosition), // 負の値にならないように調整
        behavior: 'instant'
      });

      // スクロール後の状態を確認
      setTimeout(() => {
        console.log('After scroll:', {
          scrollLeft: container.scrollLeft,
          expectedPosition: scrollPosition
        });
      }, 100);
    };

    // 少し遅延を入れて実行（DOMの更新を待つ）
    const timer = setTimeout(scrollToToday, 100);
    return () => clearTimeout(timer);
  }, []); // 依存配列を空にして、マウント時のみ実行

  // TODOのステータスを切り替える関数
  const toggleTodoStatus = (taskId: string, todoId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTodos = task.todos.map(todo => {
      if (todo.id === todoId) {
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    });

    const updatedTask = { ...task, todos: updatedTodos };
    onTaskUpdate?.(updatedTask);
  };

  // タスク詳細を表示する関数
  const handleShowTaskDetail = (taskId: string, todoId?: string) => {
    setSelectedTaskId(taskId);
    setSelectedTodoId(todoId || null);
    setIsTaskDetailModalOpen(true);
  };

  // タスク詳細モーダルを閉じる関数
  const handleCloseTaskDetail = () => {
    setIsTaskDetailModalOpen(false);
    setSelectedTaskId(null);
    setSelectedTodoId(null);
  };

  // タスクの更新ハンドラー
  const handleTaskUpdate = (updatedTask: Task) => {
    onTaskUpdate?.(updatedTask);
  };

  // 工数を更新する関数
  const updateTaskHours = (taskId: string, field: 'estimatedHours' | 'actualHours', value: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // すべてのTODOの指定されたフィールドを更新
    const updatedTodos = task.todos.map(todo => ({
      ...todo,
      [field]: field === 'estimatedHours' 
        ? (task.todos.length > 0 ? value / task.todos.length : 0) // 予定工数は均等に分配
        : (todo.completed ? value / task.todos.filter(t => t.completed).length : 0) // 実績工数は完了したTODOのみに分配
    }));

    const updatedTask = { ...task, todos: updatedTodos };
    onTaskUpdate?.(updatedTask);
  };

  // TODOの工数を更新する関数
  const updateTodoHours = (taskId: string, todoId: string, field: 'estimatedHours' | 'actualHours', value: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTodos = task.todos.map(todo => {
      if (todo.id === todoId) {
        return { ...todo, [field]: value };
      }
      return todo;
    });

    const updatedTask = { ...task, todos: updatedTodos };
    onTaskUpdate?.(updatedTask);
  };

  // 入力検証を行う関数
  const validateHourInput = (value: string): number => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return 0;
    return numValue;
  };

  // 指定された日が今日かどうかを判定する関数
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // TaskBarコンポーネント
  const TaskBar = ({ task, calendarRange }: { task: Task; calendarRange: { totalDays: number; startDate: Date } }) => {
    // タスクの開始日と終了日は含まれるTODOの最初の着手日と最後の着手日に基づいて計算
    const startDates = task.todos.map(todo => todo.startDate.getTime());
    const earliestStartDate = startDates.length > 0 ? new Date(Math.min(...startDates)) : task.dueDate;

    // 期日をタスクの終了日として使用
    const taskEndDate = task.dueDate;
    
    const startPos = getDatePosition(earliestStartDate, calendarRange.startDate);
    const endPos = getDatePosition(taskEndDate, calendarRange.startDate);
    
    // 進捗状況を計算
    const completedTodos = task.todos.filter(todo => todo.completed).length;
    const totalTodos = task.todos.length;
    const progress = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    return (
      <div
        className="absolute h-8 bg-gray-200 rounded"
        style={{
          left: `${(startPos - 1) * (100 / calendarRange.totalDays)}%`,
          width: `${((endPos - startPos) + 1) * (100 / calendarRange.totalDays)}%`,
          zIndex: 0
        }}
      >
        <div className="h-full bg-blue-500 rounded" style={{ width: `${progress}%` }} />
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center px-2">
          <span className="text-xs font-medium truncate text-gray-800">{task.title}</span>
        </div>
      </div>
    );
  };

  // TODOバーコンポーネント
  const TodoBar = ({ todo, calendarRange }: { todo: Todo; calendarRange: { totalDays: number; startDate: Date } }) => {
    const startPosition = getDatePosition(todo.calendarStartDateTime, calendarRange.startDate);
    const endPosition = getDatePosition(todo.calendarEndDateTime, calendarRange.startDate);
    const duration = endPosition - startPosition + 1;
    
    return (
      <div
        className={`absolute h-6 rounded-md transition-all ${
          todo.completed ? 'bg-green-200 border border-green-300' : 'bg-blue-200 border border-blue-300'
        }`}
        style={{
          left: `${(startPosition / calendarRange.totalDays) * 100}%`,
          width: `${(duration / calendarRange.totalDays) * 100}%`,
          top: '0.5rem'
        }}
        title={`${todo.text} (${format(todo.calendarStartDateTime, 'yyyy/MM/dd HH:mm')} - ${format(todo.calendarEndDateTime, 'yyyy/MM/dd HH:mm')})`}
      >
        <div className="px-2 whitespace-nowrap text-xs font-medium text-gray-700 overflow-visible">
          {todo.text}
        </div>
      </div>
    );
  };

  // スケジュールを最適化する関数
  const optimizeSchedule = () => {
    // タスクとTODOを複製して変更できるようにする
    const updatedTasks = JSON.parse(JSON.stringify(tasks));
    
    // スケジュール変更ログをクリア
    setScheduleChanges([]);
    
    // タスクを開始日でソート
    updatedTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    // 担当者ごとの工数を管理するマップ
    const userHoursMap = new Map();
    const MAX_DAILY_HOURS = 8; // 1日あたりの最大工数
    
    // 各タスクのTODOを最適化
    updatedTasks.forEach(task => {
      // タスクの期日から逆算して開始日を決定
      let currentDate = new Date(task.dueDate);
      currentDate.setDate(currentDate.getDate() - 7); // 仮に期日の1週間前から開始
      
      task.todos.forEach(todo => {
        const todoHours = todo.estimatedHours || 1;
        const oldStartDate = format(todo.startDate, 'yyyy-MM-dd');
        
        // 担当者ごとの工数を計算
        let assignedUsers = todo.assigneeIds && todo.assigneeIds.length > 0
          ? todo.assigneeIds
          : ['unassigned'];
        
        // この日に追加できるかチェック
        let canAddToCurrentDate = true;
        assignedUsers.forEach(userId => {
          const dateKey = `${userId}-${format(currentDate, 'yyyy-MM-dd')}`;
          const currentHours = userHoursMap.get(dateKey) || 0;
          if (currentHours + todoHours > MAX_DAILY_HOURS) {
            canAddToCurrentDate = false;
          }
        });
        
        // 追加できない場合は翌日に
        if (!canAddToCurrentDate) {
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // 新しい日付を設定
        const newStartDate = new Date(currentDate);
        
        // 日付が変わった場合のみスケジュール変更ログに追加
        if (format(todo.startDate, 'yyyy-MM-dd') !== format(newStartDate, 'yyyy-MM-dd')) {
          setScheduleChanges(prev => [
            ...prev,
            {
              taskId: task.id,
              taskTitle: task.title,
              todoId: todo.id,
              todoTitle: todo.text,
              oldDate: oldStartDate,
              newDate: format(newStartDate, 'yyyy-MM-dd')
            }
          ]);
        }
        
        // TODOの日付を更新
        todo.startDate = newStartDate;
        
        // カレンダー表示用の日時も更新
        todo.calendarStartDateTime = new Date(
          newStartDate.getFullYear(),
          newStartDate.getMonth(),
          newStartDate.getDate(),
          9, // 9:00 AM
          0
        );
        
        todo.calendarEndDateTime = new Date(
          newStartDate.getFullYear(),
          newStartDate.getMonth(),
          newStartDate.getDate(),
          9 + Math.min(8, todoHours), // 予定時間分（最大8時間）
          0
        );
        
        // 担当者の工数を更新
        assignedUsers.forEach(userId => {
          const dateKey = `${userId}-${format(newStartDate, 'yyyy-MM-dd')}`;
          const currentHours = userHoursMap.get(dateKey) || 0;
          userHoursMap.set(dateKey, currentHours + todoHours);
        });
      });
    });
    
    // タスクを更新
    const updatedTasksWithDate = updatedTasks.map(task => {
      // 各タスクの最早開始日と最遅終了日を計算
      const minStartDate = Math.min(...task.todos.map(t => new Date(t.startDate).getTime()));
      const maxEndDate = Math.max(...task.todos.map(t => {
        // 終了時間は開始時間 + 見積もり時間とする
        const endTime = new Date(t.calendarEndDateTime).getTime();
        return endTime;
      }));
      
      return {
        ...task,
        // startDateは削除（新しい型定義には存在しない）
        // 最遅終了日をタスクの期日として設定
        dueDate: new Date(maxEndDate)
      };
    });
    
    // 更新したタスクをコンテキストに反映
    if (onTaskUpdate) {
      updatedTasksWithDate.forEach(task => {
        onTaskUpdate(task);
      });
    }
    
    // 通知を表示
    setNotification({
      message: 'スケジュールが最適化されました',
      type: 'success'
    });
    
    // 3秒後に通知を消す
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // スケジュール変更を適用する関数
  const applyScheduleChanges = () => {
    // タスクとTODOを複製して変更できるようにする
    const updatedTasks = JSON.parse(JSON.stringify(tasks));
    
    // 変更を適用
    scheduleChanges.forEach(change => {
      const task = updatedTasks.find(t => t.id === change.taskId);
      if (task) {
        const todo = task.todos.find(t => t.id === change.todoId);
        if (todo) {
          // 変更された日付を新しいDate型に変換
          const newDate = new Date(change.newDate);
          
          // 日付を更新
          todo.startDate = newDate;
          
          // カレンダー表示用の日時も更新
          todo.calendarStartDateTime = new Date(
            newDate.getFullYear(),
            newDate.getMonth(),
            newDate.getDate(),
            9, // 9:00 AM
            0
          );
          
          todo.calendarEndDateTime = new Date(
            newDate.getFullYear(),
            newDate.getMonth(),
            newDate.getDate(),
            9 + Math.min(8, todo.estimatedHours || 1), // 予定時間分（最大8時間）
            0
          );
        }
      }
    });
    
    // 更新したタスクをコンテキストに反映
    if (onTaskUpdate) {
      updatedTasks.forEach(task => {
        onTaskUpdate(task);
      });
    }
    
    // スケジュール変更ログをクリア
    setScheduleChanges([]);
    
    // 通知を表示
    setNotification({
      message: 'スケジュール変更が適用されました',
      type: 'success'
    });
    
    // 3秒後に通知を消す
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  return (
    <div className="space-y-4">
      {/* 通知 */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* 差分表示 */}
      {scheduleChanges.length > 0 && (
        <ScheduleDiffView
          changes={scheduleChanges}
          onApprove={applyScheduleChanges}
          onCancel={() => setScheduleChanges([])}
          tasks={tasks}
        />
      )}
      <div className="overflow-x-auto relative">
        <div className="p-2 flex">
          <button
            onClick={() => setIsCreatingTask(true)}
            className="px-2 py-1 text-xs rounded flex items-center gap-1 bg-blue-500 text-white hover:bg-blue-600"
          >
            <IoAdd className="w-3 h-3" />
            タスク追加
          </button>
          <button
            onClick={optimizeSchedule}
            className="flex items-center gap-2 px-4 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-color ml-2 text-xs"
          >
            <IoCalendar className="w-5 h-5" />
            スケジュール最適化
          </button>
        </div>
        <div className="flex">
          {/* 左側：タスク一覧（固定） */}
          <div className="w-[500px] flex-shrink-0">
            {/* タスク一覧のヘッダー */}
            <div className="grid grid-cols-[2.5fr,0.5fr,0.5fr,0.5fr,0.5fr] text-xs gap-2 p-2 font-bold bg-white border-b sticky top-0 z-20">
              <span>タスク</span>
              <span>担当者</span>
              <span>予定工数</span>
              <span>実績工数</span>
              <span>状態</span>
            </div>
            {/* タスク一覧 */}
            {sortedTasks.map((task) => (
              <div key={task.id} className="border-b">
                {/* 親タスク */}
                <div 
                  className="h-8 font-medium bg-gray-100 grid grid-cols-[2.5fr,0.5fr,0.5fr,0.5fr,0.5fr] gap-2 items-center cursor-pointer hover:bg-gray-200"
                  onClick={() => toggleTask(task.id)}
                >
                  <div className="flex items-center gap-2 px-4 overflow-hidden">
                    <span className={`transform transition-transform flex-shrink-0 ${expandedTasks.has(task.id) ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                    <span className="truncate">{task.title}</span>
                  </div>
                  <div className="text-xs text-gray-700">
                    {task.assigneeIds?.length ? `${task.assigneeIds.length}人` : '-'}
                  </div>
                  <div className="text-xs text-gray-700 flex items-center">
                    <span>
                      {task.todos.reduce((sum, todo) => sum + (todo.estimatedHours || 0), 0)}
                    </span>
                    <span className="ml-1">h</span>
                  </div>
                  <div className="text-xs text-gray-700 flex items-center">
                    <span>
                      {task.todos.reduce((sum, todo) => sum + (todo.actualHours || 0), 0)}
                    </span>
                    <span className="ml-1">h</span>
                  </div>
                  <div className="text-xs">
                    {(() => {
                      const progress = task.todos.length > 0 
                        ? Math.round((task.todos.filter(todo => todo.completed).length / task.todos.length) * 100)
                        : 0;
                      if (progress === 0) return <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">未着手</span>;
                      if (progress === 100) return <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">完了</span>;
                      return <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">進行中</span>;
                    })()}
                  </div>
                </div>
                {/* 小タスク */}
                {expandedTasks.has(task.id) && task.todos.map((todo) => (
                  <div 
                    key={todo.id} 
                    className="h-8 text-sm bg-white hover:bg-gray-50 grid grid-cols-[2.5fr,0.5fr,0.5fr,0.5fr,0.5fr] gap-2 items-center"
                  >
                    <div className="flex items-center gap-2 px-4 overflow-hidden">
                      <label className="flex items-center gap-2 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodoStatus(task.id, todo.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 flex-shrink-0"
                        />
                        <span 
                          className="cursor-pointer truncate"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowTaskDetail(task.id, todo.id);
                          }}
                        >
                          {todo.text}
                        </span>
                      </label>
                    </div>
                    <div className="text-xs text-gray-700">
                      {todo.assigneeIds?.length ? `${todo.assigneeIds.length}人` : '-'}
                    </div>
                    <div className="text-xs text-gray-700 flex items-center">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-full p-0.5 text-center border border-gray-300 rounded"
                        value={todo.estimatedHours || 0}
                        onChange={(e) => {
                          const value = validateHourInput(e.target.value);
                          updateTodoHours(task.id, todo.id, 'estimatedHours', value);
                        }}
                      />
                      <span className="ml-1">h</span>
                    </div>
                    <div className="text-xs text-gray-700 flex items-center">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-full p-0.5 text-center border border-gray-300 rounded"
                        value={todo.actualHours || 0}
                        onChange={(e) => {
                          const value = validateHourInput(e.target.value);
                          updateTodoHours(task.id, todo.id, 'actualHours', value);
                        }}
                      />
                      <span className="ml-1">h</span>
                    </div>
                    <div className="text-xs">
                      {todo.completed 
                        ? <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">完了</span>
                        : <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">未完了</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* 右側：カレンダーとガントチャート（スクロール可能） */}
          <div className="flex-1 overflow-x-auto -mt-6" ref={containerRef}>
            <div style={{ width: `${calendarRange.totalDays * 30}px` }}>
              {/* カレンダーヘッダー */}
              <div className="border-b sticky top-0 bg-white z-20">
                <div className="grid pt-5" style={{ gridTemplateColumns: `repeat(${calendarRange.totalDays +1}, minmax(30px, 1fr))` }}>
                  {getDates().map((date, i) => (
                    <div key={i} className="border-l text-center relative">
                      {isFirstDayOfMonth(date) && (
                        <div className="absolute -top-4 left-0 right-0 text-xs text-gray-500 z-30">
                          {getMonth(date)}月
                        </div>
                      )}
                      <div className={`py-2 text-sm ${isToday(date) ? 'text-blue-600 font-bold' : ''}`}>
                        {formatDate(date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ガントチャート本体 */}
              <div className="relative">
                {/* 過去の日付のオーバーレイ */}
                <div
                  className="absolute top-0 left-0 h-full bg-gray-100/50"
                  style={{
                    width: `${(todayPosition) * (100 / calendarRange.totalDays)}%`,
                    zIndex: 1
                  }}
                />
                {/* 今日の日付の縦線 */}
                <div
                  className="absolute top-0 h-full w-px bg-red-500"
                  style={{
                    left: `${(todayPosition) * (100 / calendarRange.totalDays)}%`,
                    zIndex: 2
                  }}
                />

                {/* タスクのガントチャート */}
                {sortedTasks.map((task) => (
                  <div key={task.id}>
                    {/* 親タスク */}
                    <div className="h-8 relative bg-gray-50">
                      <TaskBar task={task} calendarRange={calendarRange} />
                    </div>
                    {/* 小タスク */}
                    {expandedTasks.has(task.id) && task.todos.map((todo) => (
                      <div key={todo.id} className="h-8 relative">
                        <TodoBar todo={todo} calendarRange={calendarRange} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* タスク作成フォーム */}
        {isCreatingTask && (
          <TaskCreationForm
            onCancel={() => setIsCreatingTask(false)}
            onTaskCreate={(task) => {
              onTaskCreate?.(task);
              // 新しく作成したタスクのアコーディオンを自動的に開く
              setExpandedTasks(prev => {
                const newSet = new Set(prev);
                newSet.add(task.id);
                return newSet;
              });
              setIsCreatingTask(false);
            }}
            projectId={projectId || currentProject?.id}
            title="新しいタスクを作成"
          />
        )}

        {/* タスク詳細モーダル */}
        {isTaskDetailModalOpen && selectedTaskId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-11/12 max-w-4xl h-[85vh] overflow-scroll">
              <div className="p-4 border-b flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold">タスク詳細</h2>
                <button 
                  onClick={handleCloseTaskDetail}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <IoClose className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <TaskDetail
                  selectedTask={sortedTasks.find(t => t.id === selectedTaskId) || null}
                  selectedTodoId={selectedTodoId}
                  onTaskUpdate={handleTaskUpdate}
                  tasks={sortedTasks}
                  onTaskSelect={handleShowTaskDetail}
                  onTaskCreate={onTaskCreate}
                />
                {/* 下部の余白確保用 */}
                <div className="h-16"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
