'use client';

import { useTaskContext } from '@/contexts/TaskContext';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useEffect, useRef, useState } from 'react';
import { IoAdd, IoBulb, IoTrash } from 'react-icons/io5';
import { Task, Todo } from '@/types/task';
import { suggestTodos } from '@/utils/openai';
import ScheduleTodosButton from './ScheduleTodosButton';
import { format } from 'date-fns';
import UserAssignSelect from './UserAssignSelect';

interface GanttChartViewProps {
  onTaskCreate?: (newTask: Task) => void;
  onTaskSelect: (taskId: string) => void;
  onTaskUpdate?: (updatedTask: Task) => void;
  projectId?: string;
}

// 日付の位置を計算するユーティリティ関数
const getDatePosition = (date: Date, startDate: Date) => {
  return Math.ceil(
    (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
};

export default function GanttChartView({ onTaskCreate, onTaskSelect, onTaskUpdate, projectId }: GanttChartViewProps) {
  const { tasks } = useTaskContext();
  const { currentProject } = useProjectContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    todos: [],
    dueDate: new Date()
  });
  const [newTaskTodos, setNewTaskTodos] = useState<Todo[]>([]);
  const [newTaskTodoText, setNewTaskTodoText] = useState('');
  const [isGeneratingTodos, setIsGeneratingTodos] = useState(false);
  const [newTaskSuggestedTodos, setNewTaskSuggestedTodos] = useState<{ text: string; estimatedHours: number }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  const getDaysBetween = (startDate: Date, endDate: Date) => {
    return Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
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
      const scrollPosition = (todayPosition - 1) * columnWidth - 450; // タスク一覧の幅（w-60 = 240px）を引く

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

  // 新しいタスクを作成する関数
  const handleCreateTask = () => {
    if (!newTask.title) return;

    const dueDate = newTask.dueDate || new Date(new Date().setDate(new Date().getDate() + 7));

    const taskToCreate: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description || '',
      todos: newTaskTodos.length > 0 ? newTaskTodos : getDefaultTodos(dueDate),
      dueDate: dueDate,
      completedDateTime: undefined,
      projectId: projectId || ''
    };

    onTaskCreate?.(taskToCreate);
    setIsCreatingTask(false);
    setNewTask({
      title: '',
      description: '',
      todos: [],
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7))
    });
    setNewTaskTodos([]);
    setNewTaskSuggestedTodos([]);
  };

  // デフォルトのTODOを生成
  const getDefaultTodos = (dueDate: Date): Todo[] => {
    const today = new Date();
    const dueDateCopy = new Date(dueDate);
    
    return [
      {
        id: `todo-${Date.now()}-1`,
        text: '開始',
        completed: false,
        startDate: today,
        calendarStartDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
        calendarEndDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0),
        estimatedHours: 1,
        actualHours: 0,
        assigneeId: ''
      },
      {
        id: `todo-${Date.now()}-2`,
        text: '完了',
        completed: false,
        startDate: dueDateCopy,
        calendarStartDateTime: new Date(dueDateCopy.getFullYear(), dueDateCopy.getMonth(), dueDateCopy.getDate(), 15, 0, 0),
        calendarEndDateTime: new Date(dueDateCopy.getFullYear(), dueDateCopy.getMonth(), dueDateCopy.getDate(), 17, 0, 0),
        estimatedHours: 1,
        actualHours: 0,
        assigneeId: ''
      }
    ];
  };

  // 新規タスクにTODOを追加
  const handleAddNewTaskTodo = () => {
    if (!newTaskTodoText.trim()) return;

    const today = new Date();
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: newTaskTodoText.trim(),
      completed: false,
      startDate: today,
      calendarStartDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
      calendarEndDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0),
      estimatedHours: 1, // デフォルトの見積もり工数を1時間に設定
      actualHours: 0,
      assigneeId: ''
    };

    setNewTaskTodos([...newTaskTodos, newTodo]);
    setNewTaskTodoText('');
  };

  // 新規タスクからTODOを削除
  const handleRemoveNewTaskTodo = (todoId: string) => {
    setNewTaskTodos(newTaskTodos.filter(todo => todo.id !== todoId));
  };

  // 新規タスク用のTODO提案を取得
  const handleSuggestNewTaskTodos = async () => {
    if (!newTask.title) return;

    try {
      setIsGeneratingTodos(true);
      const suggestions = await suggestTodos(
        newTask.title,
        newTask.description || '',
        newTaskTodos.map(todo => todo.text)
      );
      setNewTaskSuggestedTodos(suggestions);
    } catch (error) {
      console.error('Error getting todo suggestions:', error);
      setErrorMessage(error instanceof Error ? error.message : 'TODOの提案中にエラーが発生しました。');
    } finally {
      setIsGeneratingTodos(false);
    }
  };

  // 提案されたTODOを新規タスクに追加
  const handleAddSuggestedNewTaskTodo = (suggestion: { text: string; estimatedHours: number }) => {
    const today = new Date();
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: suggestion.text,
      completed: false,
      startDate: today,
      calendarStartDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
      calendarEndDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9 + Math.min(8, suggestion.estimatedHours), 0, 0),
      estimatedHours: suggestion.estimatedHours,
      actualHours: 0,
      assigneeId: ''
    };

    setNewTaskTodos([...newTaskTodos, newTodo]);
    
    // 追加したTODOを提案リストから削除
    setNewTaskSuggestedTodos(prev => prev.filter(todo => todo.text !== suggestion.text));
  };

  // タスク作成フォームをレンダリングする関数
  const renderTaskCreationForm = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">新しいタスクを作成（ガントチャート）</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
              <input
                type="text"
                value={newTask.title || ''}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="w-full p-2 border rounded-md"
                placeholder="タスクのタイトルを入力"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
              <textarea
                value={newTask.description || ''}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="w-full p-2 border rounded-md h-24"
                placeholder="タスクの説明を入力"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">期日</label>
                <input
                  type="date"
                  value={newTask.dueDate instanceof Date ? newTask.dueDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewTask({...newTask, dueDate: new Date(e.target.value)})}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">TODOリスト</label>
                <button
                  onClick={handleSuggestNewTaskTodos}
                  disabled={!newTask.title || isGeneratingTodos}
                  className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                    !newTask.title || isGeneratingTodos
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  }`}
                  title="AIにTODOを提案してもらう"
                >
                  <IoBulb className="w-3 h-3" />
                  AI提案
                </button>
              </div>
              
              <div className="space-y-2 mb-2">
                {newTaskTodos.map((todo) => (
                  <div key={todo.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                    <div className="flex-1">
                      <div className="text-sm text-gray-800">{todo.text}</div>
                      <div className="text-xs text-gray-500">
                        見積もり工数: {todo.estimatedHours}時間
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveNewTaskTodo(todo.id)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <IoTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center">
                <input
                  type="text"
                  value={newTaskTodoText}
                  onChange={(e) => setNewTaskTodoText(e.target.value)}
                  placeholder="新しいTODOを追加"
                  className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNewTaskTodo();
                    }
                  }}
                />
                <button
                  onClick={handleAddNewTaskTodo}
                  disabled={!newTaskTodoText.trim()}
                  className={`p-2 rounded-r-md ${
                    !newTaskTodoText.trim()
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <IoAdd className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* AI提案のTODOリスト */}
            {isGeneratingTodos && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-500"></div>
                <p className="mt-2 text-sm text-gray-600">TODOを生成中...</p>
              </div>
            )}

            {newTaskSuggestedTodos.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <IoBulb className="w-4 h-4" />
                  AIからのTODO提案
                </h4>
                <div className="space-y-2">
                  {newTaskSuggestedTodos.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-2 rounded border border-yellow-200"
                    >
                      <div className="flex-1">
                        <div className="text-sm text-gray-800">{suggestion.text}</div>
                        <div className="text-xs text-gray-500">
                          見積もり工数: {suggestion.estimatedHours}時間
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddSuggestedNewTaskTodo(suggestion)}
                        className="ml-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        title="このTODOを採用"
                      >
                        採用
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => {
                setIsCreatingTask(false);
                setNewTaskTodos([]);
                setNewTaskTodoText('');
                setNewTaskSuggestedTodos([]);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              キャンセル
            </button>
            <button
              onClick={handleCreateTask}
              disabled={!newTask.title}
              className={`px-4 py-2 rounded-md ${
                !newTask.title
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              作成
            </button>
          </div>
        </div>
      </div>
    );
  };

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

  // 指定された日が今日かどうかを判定する関数
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
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

  // TODOのステータスを切り替える関数
  const toggleTodoStatus = (taskId: string, todoId: string) => {
    console.log('GanttChart: toggleTodoStatus called with:', { taskId, todoId });
    
    // タスクを検索
    const task = sortedTasks.find(t => t.id === taskId);
    if (!task) {
      console.log('GanttChart: Task not found:', taskId);
      return;
    }
    
    // TODOのステータスを更新
    const updatedTodos = task.todos.map(todo => {
      if (todo.id === todoId) {
        console.log('GanttChart: Toggling todo status for:', todo.text, 'from', todo.completed, 'to', !todo.completed);
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    });
    
    // タスクを更新
    const updatedTask = { ...task, todos: updatedTodos };
    console.log('GanttChart: Updated task:', updatedTask);
    onTaskUpdate?.(updatedTask);
  };

  return (
    <div className="overflow-x-auto relative">
      <div className="flex justify-between items-center mb-2">
      </div>
      <div className="flex">
        {/* 左側：タスク一覧（固定） */}
        <div className="w-60 flex-shrink-0">
          {/* タスク一覧のヘッダー */}
          <div className="p-4 font-bold bg-white border-b sticky top-0 z-20">
            <span>タスク</span>
          </div>
          {/* タスク一覧 */}
          {sortedTasks.map((task) => (
            <div key={task.id} className="border-b">
              {/* 親タスク */}
              <div 
                className="h-8 font-medium bg-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-200"
                onClick={() => toggleTask(task.id)}
              >
                <div className="flex items-center gap-2 px-4">
                  <span className={`transform transition-transform ${expandedTasks.has(task.id) ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                  <span>{task.title}</span>
                </div>
                <span className="text-xs text-gray-500 px-4">
                  {Math.round(
                    (task.todos.filter(todo => todo.completed).length / task.todos.length) * 100
                  )}%
                </span>
              </div>
              {/* 小タスク */}
              {expandedTasks.has(task.id) && task.todos.map((todo) => (
                <div 
                  key={todo.id} 
                  className="h-8 text-sm bg-white hover:bg-gray-50 flex items-center gap-2 px-4"
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={(e) => {
                      toggleTodoStatus(task.id, todo.id);
                    }}
                    readOnly
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span 
                    className="flex-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskSelect(task.id);
                    }}
                  >
                    {todo.text}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 右側：カレンダーとガントチャート（スクロール可能） */}
        <div className="flex-1 overflow-x-auto" ref={containerRef}>
          <div style={{ width: `${calendarRange.totalDays * 30}px` }}>
            {/* カレンダーヘッダー */}
            <div className="border-b sticky top-0 bg-white z-20">
              <div className="grid pt-4" style={{ gridTemplateColumns: `repeat(${calendarRange.totalDays +1}, minmax(30px, 1fr))` }}>
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
      {isCreatingTask && renderTaskCreationForm()}
    </div>
  );
}

// TaskBarコンポーネント
const TaskBar = ({ task, calendarRange }: { task: Task; calendarRange: { totalDays: number; startDate: Date } }) => {
  // タスクの開始日と終了日は含まれるTODOの最初の着手日と最後の着手日に基づいて計算
  const startDates = task.todos.map(todo => {
    // startDateがDateオブジェクトかどうかをチェック
    return todo.startDate instanceof Date 
      ? todo.startDate.getTime() 
      : new Date(todo.startDate as any).getTime();
  });
  const earliestStartDate = startDates.length > 0 
    ? new Date(Math.min(...startDates)) 
    : task.dueDate instanceof Date 
      ? task.dueDate 
      : new Date(task.dueDate as any);

  // 期日をタスクの終了日として使用
  const taskEndDate = task.dueDate instanceof Date 
    ? task.dueDate 
    : new Date(task.dueDate as any);
  
  const startPos = getDatePosition(earliestStartDate, calendarRange.startDate);
  const endPos = getDatePosition(taskEndDate, calendarRange.startDate);
  
  // 進捗状況を計算
  const completedTodos = task.todos.filter(todo => todo.completed).length;
  const totalTodos = task.todos.length;
  const progress = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  return (
    <div
      className="absolute h-8 bg-gray-200 rounded flex flex-col justify-center overflow-hidden"
      style={{
        left: `${(startPos - 1) * (100 / calendarRange.totalDays)}%`,
        width: `${((endPos - startPos) + 1) * (100 / calendarRange.totalDays)}%`,
        zIndex: 0
      }}
    >
      <div className="h-full bg-blue-500 absolute left-0 top-0" style={{ width: `${progress}%` }} />
      <div className="px-1 z-10 text-xs font-semibold truncate">{task.title}</div>
    </div>
  );
};

// TODOバーコンポーネント
const TodoBar = ({ todo, calendarRange }: { todo: Todo; calendarRange: { totalDays: number; startDate: Date } }) => {
  // calendarStartDateTimeとcalendarEndDateTimeがDateオブジェクトかどうかをチェック
  const calendarStartDateTime = todo.calendarStartDateTime instanceof Date 
    ? todo.calendarStartDateTime 
    : new Date(todo.calendarStartDateTime as any);
  
  const calendarEndDateTime = todo.calendarEndDateTime instanceof Date 
    ? todo.calendarEndDateTime 
    : new Date(todo.calendarEndDateTime as any);
  
  const startPosition = getDatePosition(calendarStartDateTime, calendarRange.startDate);
  const endPosition = getDatePosition(calendarEndDateTime, calendarRange.startDate);
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
      title={`${todo.text} (${format(calendarStartDateTime, 'yyyy/MM/dd HH:mm')} - ${format(calendarEndDateTime, 'yyyy/MM/dd HH:mm')})`}
    >
      <div className="px-2 whitespace-nowrap text-xs font-medium text-gray-700 overflow-visible">
        {todo.text}
      </div>
    </div>
  );
}; 