'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  IoAdd,
  IoTrash,
  IoPencil,
  IoSave,
  IoClose,
  IoBulb,
  IoList,
  IoGrid,
  IoBarChart,
  IoCaretDown,
  IoCaretUp,
  IoFilter,
  IoCheckbox,
  IoCalculator,
} from 'react-icons/io5';
import { Task, Todo } from '@/features/tasks/types/task';
import { format, startOfDay, isBefore, isToday } from 'date-fns';
import { suggestTodos, estimateTodoHours } from '@/services/api/utils/openai';
import ProjectMemberAssignSelect from '@/components/ProjectMemberAssignSelect';
import { useFilterContext } from '@/features/tasks/filters/FilterContext';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { getProjectMemberName } from '@/utils/memberUtils';
import TaskCreationForm from './TaskCreationForm';
import { FaClock } from 'react-icons/fa';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

type ViewMode = 'list' | 'kanban' | 'gantt';

interface TaskDetailProps {
  selectedTask: Task | null;
  selectedTodoId: string | null;
  onTaskUpdate?: (updatedTask: Task) => void;
  tasks: Task[];
  onTaskSelect: (taskId: string, todoId?: string) => void;
  onTaskCreate?: (newTask: Task) => void;
  onClose?: () => void;
}

interface EditState {
  title: boolean;
  description: boolean;
  todos: { [key: string]: boolean };
}

// APIの使用回数を取得する関数をインポート
const API_USAGE_KEY = 'openai_api_usage';
const DAILY_LIMIT = 20;

function getApiUsageCount(): number {
  const storedUsage = localStorage.getItem(API_USAGE_KEY);
  if (!storedUsage) return 0;

  const usage = JSON.parse(storedUsage);
  if (usage.date !== new Date().toISOString().split('T')[0]) return 0;

  return usage.count;
}

interface ViewModeButton {
  id: ViewMode;
  icon: JSX.Element;
  label: string;
}

type SortField = 'dueDate';
type SortOrder = 'asc' | 'desc';

interface SortState {
  field: SortField;
  order: SortOrder;
}

// 期日の状態に応じたスタイルを返す関数
const getDueDateStyle = (date: Date | number) => {
  const today = startOfDay(new Date());
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isBefore(dateObj, today)) {
    return 'text-red-500'; // 期日超過
  }
  if (isToday(dateObj)) {
    return 'text-orange-500'; // 今日が期日
  }
  return 'text-blue-500'; // 期日が近い
};

// チェックボックス用のIDを生成するヘルパー関数
const generateInputId = (prefix: string, id: string) => `${prefix}-${id}`;

// 全角数字を半角数字に変換する関数を追加
const toHalfWidth = (str: string): string => {
  return str.replace(/[０-９]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
  });
};

export default function TaskDetail({
  selectedTask,
  selectedTodoId,
  onTaskUpdate,
  tasks,
  onTaskSelect,
  onTaskCreate,
  onClose,
}: TaskDetailProps) {
  const [editState, setEditState] = useState<EditState>({
    title: false,
    description: false,
    todos: {},
  });
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [newTodoText, setNewTodoText] = useState('');
  const [isSuggestingTodos, setIsSuggestingTodos] = useState(false);
  const [suggestedTodos, setSuggestedTodos] = useState<
    { text: string; estimatedHours: number }[]
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [viewModeButtons, setViewModeButtons] = useState<ViewModeButton[]>([
    { id: 'list', icon: <IoList className="w-5 h-5" />, label: 'リスト形式' },
    {
      id: 'kanban',
      icon: <IoGrid className="w-5 h-5" />,
      label: 'カンバン形式',
    },
    {
      id: 'gantt',
      icon: <IoBarChart className="w-5 h-5" />,
      label: 'ガントチャート',
    },
  ]);
  const [sortState, setSortState] = useState<SortState>({
    field: 'dueDate',
    order: 'asc',
  });
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    todos: [],
    dueDate: new Date(),
  });
  const [newTaskTodos, setNewTaskTodos] = useState<Todo[]>([]);
  const [newTaskTodoText, setNewTaskTodoText] = useState('');
  const [isGeneratingTodos, setIsGeneratingTodos] = useState(false);
  const [newTaskSuggestedTodos, setNewTaskSuggestedTodos] = useState<
    { text: string; estimatedHours: number }[]
  >([]);
  const [isEstimatingHours, setIsEstimatingHours] = useState<boolean>(false);
  const [currentEstimatingTodoId, setCurrentEstimatingTodoId] = useState<
    string | null
  >(null);
  const [estimationResult, setEstimationResult] = useState<{
    estimatedHours: number;
    reasoning: string;
  } | null>(null);
  const [expandedMemos, setExpandedMemos] = useState<{
    [key: string]: boolean;
  }>({});
  const [memoHeights, setMemoHeights] = useState<{ [key: string]: number }>({});
  const memoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // フィルタリングコンテキストを使用
  const { selectedUserIds, showUnassigned } = useFilterContext();

  // 表示するタスクをフィルタリングする
  const filteredTasks = tasks.filter((task) => {
    // 各タスクのTODOから担当者リストを作成
    const taskAssignees = new Set<string>();
    task.todos.forEach((todo) => {
      if (todo.assigneeId) {
        taskAssignees.add(todo.assigneeId);
      }
    });

    // アサインされていないタスクを表示するかどうか
    if (showUnassigned && taskAssignees.size === 0) {
      return true;
    }

    // 選択されたユーザーのタスクを表示
    if (Array.from(taskAssignees).some((id) => selectedUserIds.includes(id))) {
      return true;
    }

    return false;
  });

  const { currentProject } = useProjectContext();

  // 編集モードの切り替え
  const toggleEdit = (
    field: 'title' | 'description' | string,
    isEditingTodo: boolean = false
  ) => {
    if (!selectedTask) return;

    if (!editedTask) {
      setEditedTask(selectedTask);
    }

    setEditState((prev) => {
      if (isEditingTodo) {
        return {
          ...prev,
          todos: {
            ...prev.todos,
            [field]: !prev.todos[field],
          },
        };
      }
      return {
        ...prev,
        [field]: !prev[field as keyof EditState],
      };
    });
  };

  // 変更の保存
  const handleSave = (
    field: 'title' | 'description' | string,
    isEditingTodo: boolean = false
  ) => {
    if (editedTask && onTaskUpdate) {
      onTaskUpdate(editedTask);
    }
    toggleEdit(field, isEditingTodo);
  };

  // 変更のキャンセル
  const handleCancel = (
    field: 'title' | 'description' | string,
    isEditingTodo: boolean = false
  ) => {
    setEditedTask(selectedTask);
    toggleEdit(field, isEditingTodo);
  };

  // タイトルの更新
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedTask) {
      setEditedTask({ ...editedTask, title: e.target.value });
    }
  };

  // 概要の更新
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (editedTask) {
      setEditedTask({ ...editedTask, description: e.target.value });
    }
  };

  // TODOの追加、更新、削除時に、タスク全体のアサイン情報を更新する関数
  const updateTaskAssignees = (todos: Todo[], task: Task): string[] => {
    // 各TODOのアサイン情報を集める
    const assigneeIdsSet = new Set<string>();

    todos.forEach((todo) => {
      if (todo.assigneeId) {
        assigneeIdsSet.add(todo.assigneeId);
      }
    });

    // ユニークなアサインIDのリストを返す
    return Array.from(assigneeIdsSet);
  };

  // TODOの完了状態の更新
  const handleTodoStatusChange = (todoId: string) => {
    if (editedTask) {
      const updatedTodos = editedTask.todos.map((todo) =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      );

      const updatedTask = {
        ...editedTask,
        todos: updatedTodos,
      };

      setEditedTask(updatedTask);
      onTaskUpdate?.(updatedTask);
    }
  };

  // TODOの内容の更新
  const handleTodoTextChange = (todoId: string, newText: string) => {
    if (editedTask) {
      const updatedTodos = editedTask.todos.map((todo) =>
        todo.id === todoId ? { ...todo, text: newText } : todo
      );
      const updatedTask = {
        ...editedTask,
        todos: updatedTodos,
      };
      setEditedTask(updatedTask);
      // リアルタイムでUI更新するために、親コンポーネントに変更を通知
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }
    }
  };

  // 新しいTODOの追加
  const handleAddTodo = () => {
    if (!newTodoText || !editedTask) return;

    const today = new Date();

    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: newTodoText,
      completed: false,
      startDate: today,
      calendarStartDateTime: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        9,
        0,
        0
      ),
      calendarEndDateTime: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        10,
        0,
        0
      ),
      estimatedHours: 1,
      actualHours: 0,
      assigneeId: '',
      memo: '', // メモフィールドを空で初期化
    };

    const updatedTodos = [...editedTask.todos, newTodo];

    const updatedTask = {
      ...editedTask,
      todos: updatedTodos,
    };

    setEditedTask(updatedTask);
    onTaskUpdate?.(updatedTask);
    setNewTodoText('');
  };

  // TODOの削除
  const handleDeleteTodo = (todoId: string) => {
    if (editedTask) {
      const todoToDelete = editedTask.todos.find((todo) => todo.id === todoId);
      if (!todoToDelete) return;

      if (
        window.confirm(`「${todoToDelete.text}」を削除してもよろしいですか？`)
      ) {
        const updatedTodos = editedTask.todos.filter(
          (todo) => todo.id !== todoId
        );

        const updatedTask = {
          ...editedTask,
          todos: updatedTodos,
        };

        setEditedTask(updatedTask);
        onTaskUpdate?.(updatedTask);
      }
    }
  };

  // 進捗率を計算する関数
  const calculateProgress = (todos: Todo[]) => {
    if (todos.length === 0) return 0;
    const totalHours = todos.reduce(
      (sum, todo) => sum + todo.estimatedHours,
      0
    );
    const completedHours = todos
      .filter((todo) => todo.completed)
      .reduce((sum, todo) => sum + todo.estimatedHours, 0);
    return Math.round((completedHours / totalHours) * 100);
  };

  // TODOの見積もり工数の更新
  const handleEstimatedHoursChange = (todoId: string, hours: number) => {
    if (editedTask) {
      const updatedTodos = editedTask.todos.map((todo) =>
        todo.id === todoId ? { ...todo, estimatedHours: hours } : todo
      );
      setEditedTask({ ...editedTask, todos: updatedTodos });
    }
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(viewModeButtons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setViewModeButtons(items);
    // 左端のボタンをデフォルトとして localStorage に保存
    localStorage.setItem('defaultViewMode', items[0].id);
  };

  // コンポーネントマウント時にデフォルト表示を適用
  useEffect(() => {
    const defaultMode = localStorage.getItem('defaultViewMode') as ViewMode;
    if (defaultMode) {
      setViewMode(defaultMode);
    }
  }, []);

  // 選択されたタスクが変更されたときにeditedTaskを更新
  useEffect(() => {
    if (selectedTask) {
      setEditedTask(selectedTask);
    }
  }, [selectedTask]);

  // ソート関数
  const sortTasks = (tasksToSort: Task[]): Task[] => {
    return [...tasksToSort].sort((a, b) => {
      // 完了タスクを下部に配置
      const aProgress = calculateProgress(a.todos);
      const bProgress = calculateProgress(b.todos);
      if (aProgress === 100 && bProgress !== 100) return 1;
      if (aProgress !== 100 && bProgress === 100) return -1;

      // 通常の並び替え
      if (sortState.field === 'dueDate') {
        const aDate = Math.min(
          ...a.todos.map((todo) =>
            todo.startDate instanceof Date
              ? todo.startDate.getTime()
              : new Date(todo.startDate as any).getTime()
          )
        );
        const bDate = Math.min(
          ...b.todos.map((todo) =>
            todo.startDate instanceof Date
              ? todo.startDate.getTime()
              : new Date(todo.startDate as any).getTime()
          )
        );
        return sortState.order === 'asc' ? aDate - bDate : bDate - aDate;
      }
      return 0; // デフォルトケース
    });
  };

  const sortedTasks = sortTasks(filteredTasks);

  // 新しいタスクの作成を開始
  const handleInitiateTaskCreation = () => {
    setIsCreatingTask(true);
    if (currentProject) {
      setNewTask({
        title: '',
        description: '',
        todos: [],
        dueDate: new Date(),
      });
    }
  };

  // タスク作成の確定
  const handleCreateTask = () => {
    if (!newTask.title || !currentProject) return;

    const taskToCreate: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description || '',
      todos: newTaskTodos.length > 0 ? newTaskTodos : getDefaultTodos(),
      dueDate: newTask.dueDate || new Date(),
      completedDateTime: undefined,
      projectId: currentProject.id,
    };

    if (onTaskCreate) {
      onTaskCreate(taskToCreate);
      setIsCreatingTask(false);
      setNewTask({
        title: '',
        description: '',
        todos: [],
        dueDate: new Date(),
      });
      setNewTaskTodos([]);
      setNewTaskSuggestedTodos([]);
    }
  };

  // 新規タスクにTODOを追加
  const handleAddNewTaskTodo = () => {
    if (!newTaskTodoText) return;

    const today = new Date();

    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: newTaskTodoText,
      completed: false,
      startDate: today,
      calendarStartDateTime: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        9,
        0,
        0
      ),
      calendarEndDateTime: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        10,
        0,
        0
      ),
      estimatedHours: 1,
      actualHours: 0,
      assigneeId: '',
      memo: '', // メモフィールドを空で初期化
    };

    setNewTaskTodos([...newTaskTodos, newTodo]);
    setNewTaskTodoText('');
  };

  // 新規タスクからTODOを削除
  const handleRemoveNewTaskTodo = (todoId: string) => {
    setNewTaskTodos(newTaskTodos.filter((todo) => todo.id !== todoId));
  };

  // 新規タスク用のTODO提案を取得
  const handleSuggestNewTaskTodos = async () => {
    if (!newTask.title) return;

    try {
      setIsGeneratingTodos(true);
      const suggestions = await suggestTodos(
        newTask.title,
        newTask.description || '',
        newTaskTodos.map((todo) => todo.text)
      );
      setNewTaskSuggestedTodos(suggestions);
    } catch (error) {
      console.error('Error getting todo suggestions:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'TODOの提案中にエラーが発生しました。'
      );
    } finally {
      setIsGeneratingTodos(false);
    }
  };

  // 提案されたTODOを新規タスクに追加
  const handleAddSuggestedNewTaskTodo = (suggestion: {
    text: string;
    estimatedHours: number;
  }) => {
    const today = new Date();

    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: suggestion.text,
      completed: false,
      startDate: today,
      calendarStartDateTime: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        9,
        0,
        0
      ),
      calendarEndDateTime: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        10,
        0,
        0
      ),
      estimatedHours: suggestion.estimatedHours,
      actualHours: 0,
      assigneeId: '',
      memo: '', // メモフィールドを空で初期化
    };

    const updatedTodos = [...newTaskTodos, newTodo];

    setNewTaskTodos(updatedTodos);

    // 追加したTODOを提案リストから削除
    setNewTaskSuggestedTodos((prev) =>
      prev.filter((todo) => todo.text !== suggestion.text)
    );
  };

  // 並び替えの切り替え
  const toggleSort = (field: SortField) => {
    setSortState((prev) => ({
      field,
      order:
        prev.field === field ? (prev.order === 'asc' ? 'desc' : 'asc') : 'asc',
    }));
  };

  // デフォルトのTODOを生成
  const getDefaultTodos = (): Todo[] => {
    const today = new Date();
    const dueDateCopy = newTask.dueDate
      ? new Date(newTask.dueDate)
      : new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return [
      {
        id: `todo-${Date.now()}-1`,
        text: '開始',
        completed: false,
        startDate: today,
        calendarStartDateTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          9,
          0,
          0
        ),
        calendarEndDateTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          10,
          0,
          0
        ),
        estimatedHours: 1,
        actualHours: 0,
        assigneeId: '',
        memo: '',
      },
      {
        id: `todo-${Date.now()}-2`,
        text: '完了',
        completed: false,
        startDate: dueDateCopy,
        calendarStartDateTime: new Date(
          dueDateCopy.getFullYear(),
          dueDateCopy.getMonth(),
          dueDateCopy.getDate(),
          15,
          0,
          0
        ),
        calendarEndDateTime: new Date(
          dueDateCopy.getFullYear(),
          dueDateCopy.getMonth(),
          dueDateCopy.getDate(),
          17,
          0,
          0
        ),
        estimatedHours: 1,
        actualHours: 0,
        assigneeId: '',
        memo: '',
      },
    ];
  };

  // 工数見積もりをAIに依頼する関数
  const handleEstimateHours = async (todoId: string, todoText: string) => {
    if (!selectedTask) return;

    try {
      setIsEstimatingHours(true);
      setCurrentEstimatingTodoId(todoId);

      const result = await estimateTodoHours(
        todoText,
        selectedTask.title,
        selectedTask.description
      );

      setEstimationResult(result);
    } catch (error) {
      console.error('Error estimating hours:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '工数見積もり中にエラーが発生しました。'
      );
    } finally {
      setIsEstimatingHours(false);
    }
  };

  // AI見積もりを適用する関数
  const applyEstimatedHours = () => {
    if (!editedTask || !currentEstimatingTodoId || !estimationResult) return;

    const updatedTodos = editedTask.todos.map((todo) =>
      todo.id === currentEstimatingTodoId
        ? { ...todo, estimatedHours: estimationResult.estimatedHours }
        : todo
    );

    const updatedTask = {
      ...editedTask,
      todos: updatedTodos,
    };

    setEditedTask(updatedTask);
    onTaskUpdate?.(updatedTask);

    // 後処理
    setEstimationResult(null);
    setCurrentEstimatingTodoId(null);
  };

  // ポップアップを閉じる関数
  const closeEstimationPopup = () => {
    setEstimationResult(null);
    setCurrentEstimatingTodoId(null);
  };

  // 型安全なrenderEstimatedHoursInput関数
  const renderEstimatedHoursInput = (todo: Todo, isEditing: boolean) => {
    // selectedTaskがnullの場合は処理しない
    if (!selectedTask) return null;

    return (
      <div className="flex items-center">
        <span className="mr-2">見積もり工数:</span>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            className={`w-16 p-1 border border-gray-200 rounded focus:border-blue-500 focus:outline-none text-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              todo.completed ? 'bg-gray-100' : 'bg-white'
            }`}
            value={todo.estimatedHours}
            min="0"
            step="0.5"
            pattern="[0-9]*\.?[0-9]*"
            onChange={(e) => {
              // 入力値が空の場合は処理しない
              if (e.target.value === '') return;

              // 全角数字を半角に変換
              const halfWidthValue = toHalfWidth(e.target.value);

              // 数値以外の文字を許可しない
              if (!/^[0-9]*\.?[0-9]*$/.test(halfWidthValue)) return;

              // 数値に変換（適切にエラーハンドリング）
              const newHours = parseFloat(halfWidthValue);

              // 有効な数値の場合のみ更新
              if (!isNaN(newHours)) {
                const updatedTodo = {
                  ...todo,
                  estimatedHours: newHours,
                };
                const updatedTodos = selectedTask.todos.map((t) =>
                  t.id === todo.id ? updatedTodo : t
                );
                const updatedTask: Task = {
                  ...selectedTask,
                  todos: updatedTodos,
                };
                if (editedTask) {
                  setEditedTask(updatedTask);
                }
                onTaskUpdate?.(updatedTask);
              }
            }}
            title="TODO完了に必要な見積もり時間"
            style={{ height: '28px' }}
          />
          <div className="absolute inset-y-0 right-0 flex flex-col h-full">
            <button
              type="button"
              className="h-1/2 px-1 bg-gray-100 border-l border-b border-gray-200 hover:bg-gray-200 text-gray-700 rounded-tr flex items-center justify-center"
              onClick={(e) => {
                const currentValue = todo.estimatedHours || 0;
                const newValue = currentValue + 0.5;

                const updatedTodo = {
                  ...todo,
                  estimatedHours: newValue,
                };
                const updatedTodos = selectedTask.todos.map((t) =>
                  t.id === todo.id ? updatedTodo : t
                );
                const updatedTask: Task = {
                  ...selectedTask,
                  todos: updatedTodos,
                };
                if (editedTask) {
                  setEditedTask(updatedTask);
                }
                onTaskUpdate?.(updatedTask);
              }}
            >
              <span className="sr-only">増やす</span>
              <span
                className="block"
                style={{ fontSize: '8px', lineHeight: '1' }}
              >
                ▲
              </span>
            </button>
            <button
              type="button"
              className="h-1/2 px-1 bg-gray-100 border-l border-gray-200 hover:bg-gray-200 text-gray-700 rounded-br flex items-center justify-center"
              onClick={(e) => {
                const currentValue = todo.estimatedHours || 0;
                const newValue = Math.max(0, currentValue - 0.5);

                const updatedTodo = {
                  ...todo,
                  estimatedHours: newValue,
                };
                const updatedTodos = selectedTask.todos.map((t) =>
                  t.id === todo.id ? updatedTodo : t
                );
                const updatedTask: Task = {
                  ...selectedTask,
                  todos: updatedTodos,
                };
                if (editedTask) {
                  setEditedTask(updatedTask);
                }
                onTaskUpdate?.(updatedTask);
              }}
            >
              <span className="sr-only">減らす</span>
              <span
                className="block"
                style={{ fontSize: '8px', lineHeight: '1' }}
              >
                ▼
              </span>
            </button>
          </div>
        </div>
        <span className="ml-1 mr-2">時間</span>
        <button
          onClick={() => handleEstimateHours(todo.id, todo.text)}
          disabled={isEstimatingHours}
          className={`p-1 rounded-md text-blue-500 hover:bg-blue-50 transition-colors ${
            isEstimatingHours && currentEstimatingTodoId === todo.id
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
          title="AIに工数を見積もってもらう"
        >
          <IoCalculator className="w-4 h-4" />
          <span className="sr-only">AI工数見積</span>
        </button>
      </div>
    );
  };

  // メモの高さを更新するuseEffect
  useEffect(() => {
    const updateHeights = () => {
      const newHeights: { [key: string]: number } = {};
      Object.entries(memoRefs.current).forEach(([id, el]) => {
        if (el) {
          newHeights[id] = el.scrollHeight;
        }
      });
      setMemoHeights(newHeights);
    };

    updateHeights();
  }, [selectedTask?.todos.map((todo) => todo.memo).join(''), editState.todos]); // 編集状態の変更も監視

  // メイン部分のレンダリング関数
  const renderContent = () => {
    if (!selectedTask) {
      return (
        <div className="flex flex-col items-center justify-center h-[80vh] p-6 bg-white rounded-lg shadow">
          <div className="text-center mb-4">
            <IoList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              タスク詳細
            </h3>
            <p className="text-gray-500 mb-4">
              左側のTODOを選択すると、タスクの詳細情報が表示されます。
            </p>
          </div>
          <Link
            href="/tasks"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            タスク一覧へ
          </Link>
        </div>
      );
    }

    // 選択されたタスクがある場合は、通常のタスク詳細を表示
    return (
      <div className="bg-white rounded-lg p-6 h-full flex flex-col relative">
        {/* 閉じるボタン */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="閉じる"
          >
            <IoClose className="w-5 h-5" />
            <span className="sr-only">閉じる</span>
          </button>
        )}
        
        {/* タイトルセクション */}
        <div className="mb-4 group border-b border-gray-200 pb-4">
          <div className="flex justify-between items-start mb-3">
            {editState.title ? (
              <>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <input
                      type="text"
                      value={editedTask?.title}
                      onChange={handleTitleChange}
                      className="text-xl font-bold text-gray-800 w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                      placeholder="タスクのタイトルを入力"
                      aria-label="タスクのタイトル"
                    />
                    <button
                      onClick={() => handleSave('title')}
                      className="ml-2 p-1 text-green-600 hover:text-green-700"
                      title="保存"
                    >
                      <IoSave className="w-5 h-5" />
                      <span className="sr-only">保存</span>
                    </button>
                    <button
                      onClick={() => handleCancel('title')}
                      className="p-1 text-red-600 hover:text-red-700"
                      title="キャンセル"
                    >
                      <IoClose className="w-5 h-5" />
                      <span className="sr-only">キャンセル</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="text-sm font-medium text-gray-700">
                    進捗率: {calculateProgress(selectedTask.todos)}%
                  </div>
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${calculateProgress(selectedTask.todos)}%`,
                        background: `linear-gradient(to right, rgb(219, 234, 254), rgb(37, 99, 235))`,
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedTask.title}
                    </h2>
                    {!editState.title && (
                      <button
                        onClick={() => toggleEdit('title')}
                        className="ml-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600"
                        title="タイトルを編集"
                      >
                        <IoPencil className="w-4 h-4" />
                        <span className="sr-only">タイトルを編集</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="text-sm font-medium text-gray-700">
                    進捗率: {calculateProgress(selectedTask.todos)}%
                  </div>
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${calculateProgress(selectedTask.todos)}%`,
                        background: `linear-gradient(to right, rgb(219, 234, 254), rgb(37, 99, 235))`,
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mt-2">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-100">
              <FaClock className="text-gray-500" />
              <span className="font-medium text-gray-700">期日:</span>
              {selectedTask.todos.length > 0 ? (
                <input
                  type="date"
                  value={format(
                    new Date(
                      Math.min(
                        ...selectedTask.todos.map((todo) =>
                          todo.startDate.getTime()
                        )
                      )
                    ),
                    'yyyy-MM-dd'
                  )}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      // 最も早いTODOを特定
                      const earliestTodoIdx = selectedTask.todos
                        .map((todo, idx) => ({
                          startDate: todo.startDate.getTime(),
                          idx,
                        }))
                        .sort((a, b) => a.startDate - b.startDate)[0].idx;

                      // 該当するTODOの日付を更新
                      const updatedTodos = [...selectedTask.todos];
                      const todoToUpdate = { ...updatedTodos[earliestTodoIdx] };

                      // 時間部分は保持して日付のみ更新
                      const originalDate = new Date(todoToUpdate.startDate);
                      const updatedDate = new Date(
                        newDate.getFullYear(),
                        newDate.getMonth(),
                        newDate.getDate(),
                        originalDate.getHours(),
                        originalDate.getMinutes()
                      );

                      todoToUpdate.startDate = updatedDate;
                      updatedTodos[earliestTodoIdx] = todoToUpdate;

                      const updatedTask = {
                        ...selectedTask,
                        todos: updatedTodos,
                      };

                      if (editedTask) {
                        setEditedTask(updatedTask);
                      }
                      onTaskUpdate?.(updatedTask);
                    }
                  }}
                  className={`p-1 border border-gray-200 rounded focus:border-blue-500 focus:outline-none text-gray-700 ${getDueDateStyle(
                    Math.min(
                      ...selectedTask.todos.map((todo) =>
                        todo.startDate.getTime()
                      )
                    )
                  )}`}
                  aria-label="タスク開始日"
                />
              ) : (
                <span className="text-gray-500">未設定</span>
              )}
            </div>

            <div className="p-2 bg-gray-50 rounded-md border border-gray-100 flex items-center">
              <IoBarChart className="text-gray-500 mr-2" />
              <span className="text-gray-500 mr-2 font-medium">予定工数:</span>
              <div className="text-sm text-gray-700 font-medium">
                {selectedTask.todos.reduce(
                  (total, todo) => total + todo.estimatedHours,
                  0
                )}
                時間
              </div>
            </div>

            <div className="p-2 bg-gray-50 rounded-md border border-gray-100 flex items-center">
              <span className="text-gray-500 mr-2 font-medium">担当:</span>
              <div className="text-sm text-gray-700">
                {(() => {
                  // タスクの担当者を子TODOから計算
                  const assigneeIds = new Set<string>();
                  selectedTask.todos.forEach((todo) => {
                    if (todo.assigneeId) {
                      assigneeIds.add(todo.assigneeId);
                    }
                  });
                  const assigneeIdArray = Array.from(assigneeIds);
                  return assigneeIdArray.length > 0
                    ? assigneeIdArray
                        .map((id) => getProjectMemberName(id))
                        .join(', ')
                    : '担当者なし';
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* 説明セクション */}
        <div className="mb-4 group rounded-lg">
          {editState.description ? (
            <div className="flex gap-2">
              <div className="flex-1">
                <textarea
                  value={editedTask?.description}
                  onChange={handleDescriptionChange}
                  className="w-full h-60 p-2 text-gray-600 border rounded-md focus:border-blue-500 focus:outline-none bg-white font-mono text-sm"
                  placeholder="タスクの説明を入力してください（マークダウン記法が使えます）"
                />
                <div className="mt-1 text-xs text-gray-500 flex items-center">
                  <button
                    onClick={() =>
                      window.open(
                        'https://www.markdownguide.org/cheat-sheet/',
                        '_blank'
                      )
                    }
                    className="text-blue-500 hover:text-blue-700 mr-2"
                  >
                    マークダウン記法ヘルプ
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSave('description')}
                  className="p-1 text-green-600 hover:text-green-700"
                  title="保存"
                >
                  <IoSave className="w-5 h-5" />
                  <span className="sr-only">保存</span>
                </button>
                <button
                  onClick={() => handleCancel('description')}
                  className="p-1 text-red-600 hover:text-red-700"
                  title="キャンセル"
                >
                  <IoClose className="w-5 h-5" />
                  <span className="sr-only">キャンセル</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {selectedTask.description ? (
                <div className="flex-1 prose prose-sm max-w-none p-3 bg-white rounded-md border border-gray-100">
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                    {selectedTask.description}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="flex-1 text-gray-400 italic p-2">
                  説明はまだ入力されていません。
                </p>
              )}
              <button
                onClick={() => toggleEdit('description')}
                className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 self-start"
                title="説明を編集"
              >
                <IoPencil className="w-4 h-4" />
                <span className="sr-only">説明を編集</span>
              </button>
            </div>
          )}
        </div>

        {/* TODOリストセクション */}
        <div className="rounded-lg mt-2 flex-1">
          <div className="text-sm text-gray-700 mb-3 font-medium flex items-center">
            <IoCheckbox className="w-4 h-4 mr-1 text-blue-500" />
            TODOリスト ({selectedTask.todos.length}件)
          </div>
          <div className="space-y-2">
            {selectedTask.todos.length === 0 ? (
              <div>
                <div className="text-center py-6 text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  このタスクにはまだTODOがありません。
                  <br />
                  または下部のフォームから手動で追加してください。
                  {!suggestedTodos.length && !isSuggestingTodos && (
                    <div className="flex justify-center mt-3 mb-1">
                      <button
                        onClick={async () => {
                          try {
                            setIsSuggestingTodos(true);
                            // TODOが0件の場合の専用リクエスト
                            const suggestions = await suggestTodos(
                              selectedTask.title,
                              selectedTask.description,
                              [] // 空のTODOリストを送信
                            );
                            setSuggestedTodos(suggestions);
                          } catch (error) {
                            console.error(
                              'Error getting todo suggestions:',
                              error
                            );
                            setErrorMessage(
                              error instanceof Error
                                ? error.message
                                : 'TODOの提案中にエラーが発生しました。'
                            );
                          } finally {
                            setIsSuggestingTodos(false);
                          }
                        }}
                        disabled={isSuggestingTodos}
                        className={`p-2 rounded-md flex items-center gap-2 ${
                          isSuggestingTodos
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                        }`}
                        title="AIにTODOを自動生成してもらう"
                      >
                        <IoBulb className="w-5 h-5" />
                        <span>AI TODO自動生成</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              selectedTask.todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-center group border rounded-lg mb-2 ${
                    selectedTodoId === todo.id
                      ? 'bg-blue-50 border-blue-300 shadow-sm'
                      : todo.completed
                      ? 'bg-gray-100 border-gray-200'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="p-2 border-r border-gray-200 flex items-center justify-center">
                    <input
                      id={generateInputId('todo-status', todo.id)}
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleTodoStatusChange(todo.id)}
                      className="w-5 h-5"
                      aria-label={`${todo.text}の完了状態`}
                    />
                    <label
                      htmlFor={generateInputId('todo-status', todo.id)}
                      className="sr-only"
                    >
                      {todo.text}の完了状態
                    </label>
                  </div>
                  {editState.todos[todo.id] ? (
                    <div
                      className={`flex-1 flex items-center gap-2 p-3 ${
                        todo.completed ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          value={todo.text}
                          onChange={(e) =>
                            handleTodoTextChange(todo.id, e.target.value)
                          }
                          className={`w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none mb-2 ${
                            todo.completed
                              ? 'text-gray-500 bg-gray-100'
                              : 'text-gray-800 bg-white'
                          }`}
                          placeholder="TODOの内容を入力"
                          aria-label={`TODO: ${todo.text}`}
                        />
                        <div className="text-xs text-gray-500 mt-1 space-y-1 p-1 rounded flex flex-wrap items-center gap-x-4 gap-y-2">
                          <div className="flex items-center">
                            <span className="mr-2">着手予定日:</span>
                            <input
                              type="date"
                              value={format(todo.startDate, 'yyyy-MM-dd')}
                              onChange={(e) => {
                                const newDate = new Date(e.target.value);
                                if (!isNaN(newDate.getTime())) {
                                  const updatedTodo = {
                                    ...todo,
                                    startDate: newDate,
                                  };
                                  const updatedTodos = selectedTask.todos.map(
                                    (t) => (t.id === todo.id ? updatedTodo : t)
                                  );
                                  const updatedTask = {
                                    ...selectedTask,
                                    todos: updatedTodos,
                                  };
                                  if (editedTask) {
                                    setEditedTask(updatedTask);
                                  }
                                  onTaskUpdate?.(updatedTask);
                                }
                              }}
                              className={`p-1 border border-gray-200 rounded focus:border-blue-500 focus:outline-none text-gray-700 ${
                                todo.completed ? 'bg-gray-100' : 'bg-white'
                              }`}
                              aria-label={`${todo.text}の開始日`}
                            />
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">見積もり工数:</span>
                            <div className="flex items-center">
                              {renderEstimatedHoursInput(todo, true)}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-1">担当:</span>
                            <ProjectMemberAssignSelect
                              assigneeId={todo.assigneeId}
                              onAssigneeChange={(newAssigneeId) => {
                                // TODOの担当者を更新
                                const updatedTodo = {
                                  ...todo,
                                  assigneeId: newAssigneeId,
                                };

                                // タスクのTODOリストを更新
                                const updatedTodos = selectedTask.todos.map(
                                  (t) => (t.id === todo.id ? updatedTodo : t)
                                );

                                // 全体のタスク情報を更新
                                const updatedTask = {
                                  ...selectedTask,
                                  todos: updatedTodos,
                                };

                                if (editedTask) {
                                  setEditedTask(updatedTask);
                                }
                                onTaskUpdate?.(updatedTask);
                              }}
                              size="sm"
                            />
                          </div>
                        </div>
                        {/* メモ欄を常に表示 */}
                        <div className="mt-1 mb-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-blue-300">
                          <div className="relative">
                            <div
                              className={`prose prose-sm max-w-none ${
                                expandedMemos[todo.id]
                                  ? 'max-h-none'
                                  : 'max-h-32'
                              } overflow-hidden transition-all duration-300 ease-in-out`}
                              ref={(el) => (memoRefs.current[todo.id] = el)}
                            >
                              {editState.todos[todo.id] ? (
                                <textarea
                                  value={todo.memo || ''}
                                  onChange={(e) => {
                                    const updatedTodo = {
                                      ...todo,
                                      memo: e.target.value,
                                    };
                                    const updatedTodos = selectedTask.todos.map(
                                      (t) =>
                                        t.id === todo.id ? updatedTodo : t
                                    );
                                    const updatedTask = {
                                      ...selectedTask,
                                      todos: updatedTodos,
                                    };
                                    if (editedTask) {
                                      setEditedTask(updatedTask);
                                    }
                                    onTaskUpdate?.(updatedTask);
                                  }}
                                  className={`w-full border border-gray-200 rounded p-2 text-sm focus:border-blue-500 focus:outline-none mb-2 ${
                                    todo.completed
                                      ? 'text-gray-500 bg-gray-100'
                                      : 'text-gray-600 bg-white'
                                  }`}
                                  placeholder="メモを入力（マークダウン記法が使えます→ **太字**、*斜体*、`コード`、# 見出し、- リスト など）"
                                  rows={4}
                                  aria-label={`${todo.text}のメモ`}
                                />
                              ) : (
                                <>
                                  {todo.memo ? (
                                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                      {todo.memo}
                                    </ReactMarkdown>
                                  ) : (
                                    <p className="text-gray-400 italic">
                                      メモはまだ入力されていません。
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                            {!editState.todos[todo.id] &&
                              todo.memo &&
                              (expandedMemos[todo.id] ||
                                (memoHeights[todo.id] ?? 0) > 128) && (
                                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent flex items-end justify-center">
                                  <button
                                    onClick={() => {
                                      setExpandedMemos((prev) => ({
                                        ...prev,
                                        [todo.id]: !prev[todo.id],
                                      }));
                                    }}
                                    className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs"
                                  >
                                    {expandedMemos[todo.id]
                                      ? '折りたたむ'
                                      : 'もっと見る'}
                                    <svg
                                      className={`w-4 h-4 transition-transform duration-300 ${
                                        expandedMemos[todo.id]
                                          ? 'rotate-180'
                                          : ''
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleSave(todo.id, true)}
                          className="p-1 text-green-600 hover:text-green-700"
                          title="保存"
                        >
                          <IoSave className="w-5 h-5" />
                          <span className="sr-only">保存</span>
                        </button>
                        <button
                          onClick={() => handleCancel(todo.id, true)}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="キャンセル"
                        >
                          <IoClose className="w-5 h-5" />
                          <span className="sr-only">キャンセル</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`flex-1 flex items-center gap-2 p-3 ${
                        todo.completed ? 'bg-gray-100 rounded-r-lg' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span
                            className={`${
                              todo.completed
                                ? 'line-through text-gray-500'
                                : 'text-gray-800'
                            }`}
                          >
                            {todo.text}
                          </span>
                          <button
                            onClick={() => toggleEdit(todo.id, true)}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                            title="TODOを編集"
                          >
                            <IoPencil className="w-4 h-4" />
                            <span className="sr-only">TODOを編集</span>
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 space-y-1 p-1 rounded flex flex-wrap items-center gap-x-4 gap-y-2">
                          <div className="flex items-center">
                            <span className="mr-2">着手予定日:</span>
                            <input
                              type="date"
                              value={format(todo.startDate, 'yyyy-MM-dd')}
                              onChange={(e) => {
                                const newDate = new Date(e.target.value);
                                if (!isNaN(newDate.getTime())) {
                                  const updatedTodo = {
                                    ...todo,
                                    startDate: newDate,
                                  };
                                  const updatedTodos = selectedTask.todos.map(
                                    (t) => (t.id === todo.id ? updatedTodo : t)
                                  );
                                  const updatedTask = {
                                    ...selectedTask,
                                    todos: updatedTodos,
                                  };
                                  if (editedTask) {
                                    setEditedTask(updatedTask);
                                  }
                                  onTaskUpdate?.(updatedTask);
                                }
                              }}
                              className={`p-1 border border-gray-200 rounded focus:border-blue-500 focus:outline-none text-gray-700 ${
                                todo.completed ? 'bg-gray-100' : 'bg-white'
                              }`}
                              aria-label={`${todo.text}の開始日`}
                            />
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">見積もり工数:</span>
                            <div className="flex items-center">
                              {renderEstimatedHoursInput(todo, false)}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-1">担当:</span>
                            <ProjectMemberAssignSelect
                              assigneeId={todo.assigneeId}
                              onAssigneeChange={(newAssigneeId) => {
                                // TODOの担当者を更新
                                const updatedTodo = {
                                  ...todo,
                                  assigneeId: newAssigneeId,
                                };

                                // タスクのTODOリストを更新
                                const updatedTodos = selectedTask.todos.map(
                                  (t) => (t.id === todo.id ? updatedTodo : t)
                                );

                                // 全体のタスク情報を更新
                                const updatedTask = {
                                  ...selectedTask,
                                  todos: updatedTodos,
                                };

                                if (editedTask) {
                                  setEditedTask(updatedTask);
                                }
                                onTaskUpdate?.(updatedTask);
                              }}
                              size="sm"
                            />
                          </div>
                        </div>
                        {/* 非編集モードでもメモ欄を常に表示 */}
                        <div className="mt-1 mb-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-blue-300">
                          <div className="relative">
                            <div
                              className={`prose prose-sm max-w-none ${
                                expandedMemos[todo.id]
                                  ? 'max-h-none'
                                  : 'max-h-32'
                              } overflow-hidden transition-all duration-300 ease-in-out`}
                              ref={(el) => (memoRefs.current[todo.id] = el)}
                            >
                              {editState.todos[todo.id] ? (
                                <textarea
                                  value={todo.memo || ''}
                                  onChange={(e) => {
                                    const updatedTodo = {
                                      ...todo,
                                      memo: e.target.value,
                                    };
                                    const updatedTodos = selectedTask.todos.map(
                                      (t) =>
                                        t.id === todo.id ? updatedTodo : t
                                    );
                                    const updatedTask = {
                                      ...selectedTask,
                                      todos: updatedTodos,
                                    };
                                    if (editedTask) {
                                      setEditedTask(updatedTask);
                                    }
                                    onTaskUpdate?.(updatedTask);
                                  }}
                                  className={`w-full border border-gray-200 rounded p-2 text-sm focus:border-blue-500 focus:outline-none mb-2 ${
                                    todo.completed
                                      ? 'text-gray-500 bg-gray-100'
                                      : 'text-gray-600 bg-white'
                                  }`}
                                  placeholder="メモを入力（マークダウン記法が使えます→ **太字**、*斜体*、`コード`、# 見出し、- リスト など）"
                                  rows={4}
                                  aria-label={`${todo.text}のメモ`}
                                />
                              ) : (
                                <>
                                  {todo.memo ? (
                                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                      {todo.memo}
                                    </ReactMarkdown>
                                  ) : (
                                    <p className="text-gray-400 italic">
                                      メモはまだ入力されていません。
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                            {!editState.todos[todo.id] &&
                              todo.memo &&
                              (expandedMemos[todo.id] ||
                                (memoHeights[todo.id] ?? 0) > 128) && (
                                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent flex items-end justify-center">
                                  <button
                                    onClick={() => {
                                      setExpandedMemos((prev) => ({
                                        ...prev,
                                        [todo.id]: !prev[todo.id],
                                      }));
                                    }}
                                    className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs"
                                  >
                                    {expandedMemos[todo.id]
                                      ? '折りたたむ'
                                      : 'もっと見る'}
                                    <svg
                                      className={`w-4 h-4 transition-transform duration-300 ${
                                        expandedMemos[todo.id]
                                          ? 'rotate-180'
                                          : ''
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="p-1 text-red-500 hover:text-red-600"
                          title="TODOを削除"
                        >
                          <IoTrash className="w-4 h-4" />
                          <span className="sr-only">TODOを削除</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {suggestedTodos.length > 0 && (
              <div className="mt-4 mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <IoBulb className="w-4 h-4 text-yellow-600" />
                  AIからのTODO提案
                </h4>
                <div className="space-y-2">
                  {suggestedTodos.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-2 rounded border border-yellow-200"
                    >
                      <div className="flex-1">
                        <div className="text-sm text-gray-800">
                          {suggestion.text}
                        </div>
                        <div className="text-xs text-gray-500">
                          見積もり工数: {suggestion.estimatedHours}時間
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!editedTask) return;

                            const today = new Date();

                            const newTodo: Todo = {
                              id: `todo-${Date.now()}`,
                              text: suggestion.text,
                              completed: false,
                              startDate: today,
                              calendarStartDateTime: new Date(
                                today.getFullYear(),
                                today.getMonth(),
                                today.getDate(),
                                9,
                                0,
                                0
                              ),
                              calendarEndDateTime: new Date(
                                today.getFullYear(),
                                today.getMonth(),
                                today.getDate(),
                                10,
                                0,
                                0
                              ),
                              estimatedHours: suggestion.estimatedHours,
                              actualHours: 0,
                              assigneeId: '',
                              memo: '', // メモフィールドを空で初期化
                            };

                            const updatedTodos = [...editedTask.todos, newTodo];

                            const updatedTask = {
                              ...editedTask,
                              todos: updatedTodos,
                            };

                            setEditedTask(updatedTask);
                            onTaskUpdate?.(updatedTask);

                            // 追加したTODOを提案リストから削除
                            setSuggestedTodos((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          title="このTODOを採用"
                        >
                          採用
                        </button>
                        <button
                          onClick={() => {
                            // 提案リストから削除
                            setSuggestedTodos((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                          className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                          title="このTODOを不採用"
                        >
                          不採用
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI提案中のローディング表示 */}
            {isSuggestingTodos && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-500 mr-3"></div>
                <p className="text-yellow-700">AIがTODOを提案中...</p>
              </div>
            )}

            {/* TODO追加フォーム */}
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="flex items-center">
                <div className="flex-1 flex">
                  <input
                    type="text"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    placeholder="新しいTODOを追加"
                    className="flex-1 p-2 border border-gray-200 rounded-l-md focus:border-blue-500 focus:outline-none bg-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTodo();
                      }
                    }}
                    aria-label="新しいTODOを追加"
                  />
                  <button
                    onClick={handleAddTodo}
                    className="p-2 text-white bg-blue-500 hover:bg-blue-600 rounded-r-md"
                    title="TODOを追加"
                  >
                    <IoAdd className="w-5 h-5" />
                    <span className="sr-only">TODOを追加</span>
                  </button>
                </div>
                {selectedTask.todos.length > 0 && (
                  <button
                    onClick={async () => {
                      try {
                        setIsSuggestingTodos(true);
                        // 既存のTODOがある場合は通常の提案
                        const suggestions = await suggestTodos(
                          selectedTask.title,
                          selectedTask.description,
                          selectedTask.todos.map((todo) => todo.text)
                        );
                        setSuggestedTodos(suggestions);
                      } catch (error) {
                        console.error('Error getting todo suggestions:', error);
                        setErrorMessage(
                          error instanceof Error
                            ? error.message
                            : 'TODOの提案中にエラーが発生しました。'
                        );
                      } finally {
                        setIsSuggestingTodos(false);
                      }
                    }}
                    disabled={isSuggestingTodos}
                    className={`ml-2 p-2 rounded-md flex items-center gap-1 ${
                      isSuggestingTodos
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                    }`}
                    title="AIにTODO漏れをチェックしてもらう"
                  >
                    <IoBulb className="w-5 h-5" />
                    <span className="hidden sm:inline">
                      AI TODO漏れチェック
                    </span>
                  </button>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-red-600">{errorMessage}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // タスク一覧表示のレンダリング
  const renderTaskList = () => {
    return renderContent();
  };

  return (
    <div className="h-full">
      {renderTaskList()}

      {/* 工数見積もりポップアップ */}
      {estimationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                AI工数見積もり
              </h3>
              <button
                onClick={closeEstimationPopup}
                className="text-gray-500 hover:text-gray-700"
                title="閉じる"
              >
                <IoClose className="w-5 h-5" />
                <span className="sr-only">閉じる</span>
              </button>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-700 mb-2">見積もり工数:</div>
              <div className="text-2xl font-bold text-blue-600">
                {estimationResult.estimatedHours} 時間
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-700 mb-2">見積もり根拠:</div>
              <div className="bg-gray-50 p-3 rounded-md text-gray-800 text-sm">
                {estimationResult.reasoning}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeEstimationPopup}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                title="キャンセル"
              >
                キャンセル
              </button>
              <button
                onClick={applyEstimatedHours}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                title="この見積もりを採用"
              >
                この見積もりを採用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* タスク作成フォーム */}
      {isCreatingTask && (
        <TaskCreationForm
          onCancel={() => {
            setIsCreatingTask(false);
            setNewTaskTodos([]);
            setNewTaskTodoText('');
            setNewTaskSuggestedTodos([]);
          }}
          onTaskCreate={(task) => {
            onTaskCreate?.(task);
            setIsCreatingTask(false);
            setNewTaskTodos([]);
            setNewTaskTodoText('');
            setNewTaskSuggestedTodos([]);
          }}
          projectId={currentProject?.id}
          title="新しいタスクを作成"
        />
      )}
    </div>
  );
}
