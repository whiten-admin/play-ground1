'use client';

import { useTaskContext } from '@/contexts/TaskContext';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useEffect, useRef, useState } from 'react';
import { IoAdd, IoBulb, IoTrash } from 'react-icons/io5';
import { Task, Todo } from '@/types/task';
import { suggestTodos } from '@/utils/openai';
import ScheduleTodosButton from './ScheduleTodosButton';
import { differenceInDays } from 'date-fns';
import TaskCreationForm from './TaskCreationForm';

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
      const scrollPosition = (todayPosition - 1) * columnWidth - 450; // タスク一覧の幅を考慮

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

    const startDate = newTask.startDate || new Date().toISOString().split('T')[0];
    const endDate = newTask.endDate || new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0];
    
    // プロジェクトIDを取得（propsのprojectIdまたはcurrentProjectから）
    const taskProjectId = projectId || (currentProject?.id || '');

    const taskToCreate: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description || '',
      todos: newTaskTodos.length > 0 ? newTaskTodos : getDefaultTodos(startDate, endDate),
      startDate: startDate,
      endDate: endDate,
      priority: newTask.priority || 0,
      projectId: taskProjectId
    };

    onTaskCreate?.(taskToCreate);
    setIsCreatingTask(false);
    setNewTask({
      title: '',
      description: '',
      todos: [],
      priority: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]
    });
    setNewTaskTodos([]);
    setNewTaskTodoText('');
    setNewTaskSuggestedTodos([]);
  };

  // デフォルトのTODOを生成
  const getDefaultTodos = (startDate: string, endDate: string): Todo[] => {
    return [
      {
        id: `todo-${Date.now()}-1`,
        text: '開始',
        completed: false,
        startDate: startDate,
        endDate: startDate,
        dueDate: new Date(startDate),
        estimatedHours: 1
      },
      {
        id: `todo-${Date.now()}-2`,
        text: '完了',
        completed: false,
        startDate: endDate,
        endDate: endDate,
        dueDate: new Date(endDate),
        estimatedHours: 1
      }
    ];
  };

  // 新規タスクにTODOを追加
  const handleAddNewTaskTodo = () => {
    if (!newTaskTodoText.trim()) return;

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD形式
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: newTaskTodoText.trim(),
      completed: false,
      startDate: formattedDate,
      endDate: formattedDate,
      dueDate: new Date(),
      estimatedHours: 1 // デフォルトの見積もり工数を1時間に設定
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
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD形式
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: suggestion.text,
      completed: false,
      startDate: formattedDate,
      endDate: formattedDate,
      dueDate: new Date(),
      estimatedHours: suggestion.estimatedHours
    };

    setNewTaskTodos([...newTaskTodos, newTodo]);
    
    // 追加したTODOを提案リストから削除
    setNewTaskSuggestedTodos(prev => prev.filter(todo => todo.text !== suggestion.text));
  };

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

  // 指定された日が今日かどうかを判定する関数
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // タスクバーコンポーネント
  const TaskBar = ({ task, calendarRange }: { task: Task; calendarRange: { totalDays: number; startDate: Date } }) => {
    const startDiff = differenceInDays(task.startDate, calendarRange.startDate);
    const duration = differenceInDays(task.endDate, task.startDate) + 1;
    const width = `${(duration / calendarRange.totalDays) * 100}%`;
    const left = `${(startDiff / calendarRange.totalDays) * 100}%`;

    // タスクの進捗状況を計算
    const completedTodos = task.todos.filter(todo => todo.completed).length;
    const progress = task.todos.length > 0 ? (completedTodos / task.todos.length) * 100 : 0;

    return (
      <div
        className="absolute h-4 top-2 bg-blue-500 rounded"
        style={{
          width,
          left,
        }}
      >
        <div className="h-full relative">
          <div className="absolute inset-0 bg-blue-200 rounded overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  // TODOバーコンポーネント
  const TodoBar = ({ todo, calendarRange }: { todo: Todo; calendarRange: { totalDays: number; startDate: Date } }) => {
    const startDiff = differenceInDays(todo.startDate, calendarRange.startDate);
    const duration = differenceInDays(todo.endDate, todo.startDate) + 1;
    const width = `${(duration / calendarRange.totalDays) * 100}%`;
    const left = `${(startDiff / calendarRange.totalDays) * 100}%`;

    return (
      <div
        className={`absolute h-4 top-2 rounded ${
          todo.completed ? 'bg-green-500' : 'bg-gray-300'
        }`}
        style={{
          width,
          left,
        }}
      />
    );
  };

  return (
    <div className="overflow-x-auto relative">
      <div className="p-2">
        <button
          onClick={() => setIsCreatingTask(true)}
          className="px-2 py-0.5 text-xs rounded flex items-center gap-1 bg-blue-500 text-white hover:bg-blue-600"
        >
          <IoAdd className="w-3 h-3" />
          タスク追加
        </button>
      </div>
      <div className="flex">
        {/* 左側：タスク一覧（固定） */}
        <div className="w-60 flex-shrink-0">
          {/* タスク一覧のヘッダー */}
          <div className="p-4 font-bold bg-white border-b sticky top-0 z-20">
            <span>タスク</span>
          </div>
          {/* タスク一覧 */}
          {tasks.map((task) => (
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
                  <label className="flex items-center gap-2 w-full">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodoStatus(task.id, todo.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
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
                  </label>
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
              {tasks.map((task) => (
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
            setIsCreatingTask(false);
          }}
          projectId={projectId || currentProject?.id}
          title="新しいタスクを作成"
        />
      )}
    </div>
  );
}
