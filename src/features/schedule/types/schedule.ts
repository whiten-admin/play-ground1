import { Task, Todo } from '@/features/tasks/types/task'

// ビューモードの型定義
export type ViewMode = 'day' | 'week' | 'month'

// ビューモードボタンの型定義
export interface ViewModeButton {
  id: ViewMode
  icon: JSX.Element
  label: string
}

// 予定の種別を定義する型
export type TodoCategory = 'external' | 'internal' | 'buffer' | 'free';

// 拡張したTodo情報の型定義
export interface TodoWithMeta {
  todo: Todo;
  taskId: string;
  taskTitle?: string;
  priority?: number;
  isNextTodo?: boolean;
  isExternal?: boolean;
  category?: TodoCategory;
  projectTitle?: string;
  isAllProjectsMode?: boolean;
}

// スケジュールカレンダーのプロパティ型定義
export interface ScheduleCalendarProps {
  tasks: Task[]
  onTaskSelect: (taskId: string, todoId?: string) => void
  onTodoUpdate: (todoId: string, taskId: string, newDate: Date, endDate?: Date) => void
  selectedTodoId?: string | null
  onTaskUpdate?: (updatedTask: Task) => void
  onWorkloadUpdate?: (workloadData: WorkloadSummaryByPeriod, date: Date) => void
  onViewModeChange?: (viewMode: ViewMode) => void
}

// 日表示コンポーネントのプロパティ型定義
export interface DayViewProps {
  currentDate: Date
  timeSlots: number[]
  todoSchedule: Map<string, TodoWithMeta[]>
  selectedTodoId?: string | null
  onTaskSelect: (taskId: string, todoId?: string) => void
  onTodoUpdate: (todoId: string, taskId: string, newDate: Date, endDate?: Date) => void
  onCalendarClick: (e: React.MouseEvent<HTMLDivElement>, day: Date, hour: number) => void
}

// 週表示コンポーネントのプロパティ型定義
export interface WeekViewProps {
  weekDays: Date[]
  timeSlots: number[]
  tasks: Task[]
  todoSchedule: Map<string, TodoWithMeta[]>
  selectedTodoId?: string | null
  onTaskSelect: (taskId: string, todoId?: string) => void
  onTodoUpdate?: (todoId: string, taskId: string, newDate: Date, endDate?: Date) => void
  onCalendarClick: (e: React.MouseEvent<HTMLDivElement>, day: Date, hour: number) => void
  isCreatingTodo: boolean
  newTodoDate: Date | null
  newTodoTaskId: string | null
  newTodoText: string
  newTodoEstimatedHours: number
  onNewTodoTaskIdChange: (taskId: string) => void
  onNewTodoTextChange: (text: string) => void
  onNewTodoEstimatedHoursChange: (hours: number) => void
  onCancelCreateTodo: () => void
  onCreateTodo: (taskId: string) => void
}

// 月表示コンポーネントのプロパティ型定義
export interface MonthViewProps {
  currentDate: Date
  showWeekend: boolean
  monthCalendarDays: Date[]
  todoSchedule: Map<string, TodoWithMeta[]>
  selectedTodoId?: string | null
  onTaskSelect: (taskId: string, todoId?: string) => void
}

// ヘッダーコンポーネントのプロパティ型定義
export interface ScheduleHeaderProps {
  currentDate: Date
  viewMode: string
  viewModeButtons: ViewModeButton[]
  showWeekend: boolean
  onViewModeChange: (mode: ViewMode) => void
  onShowWeekendChange: (show: boolean) => void
  onMovePrevious: () => void
  onMoveNext: () => void
  onGoToToday: () => void
  isGoogleIntegrated: boolean
  onGoogleIntegrationChange: () => void
}

// TodoDragEventインターフェースを追加
export interface TodoDragEvent {
  todoId: string;
  taskId: string;
  diffMinutes: number;
  newDate?: Date;
}

// WeeklyScheduleDndPropsインターフェースを更新
export interface WeeklyScheduleDndProps {
  weekDays: Date[];
  timeSlots: number[];
  tasks: Task[];
  selectedTodoId?: string | null;
  onTaskSelect: (taskId: string, todoId?: string) => void;
  onTodoUpdate?: (todoId: string, taskId: string, newDate: Date, endDate?: Date) => void;
  onCalendarClick: (e: React.MouseEvent<HTMLDivElement>, day: Date, hour: number) => void;
  isCreatingTodo: boolean;
  newTodoDate: Date | null;
  newTodoTaskId: string | null;
  newTodoText: string;
  newTodoEstimatedHours: number;
  onNewTodoTaskIdChange: (taskId: string) => void;
  onNewTodoTextChange: (text: string) => void;
  onNewTodoEstimatedHoursChange: (hours: number) => void;
  onCancelCreateTodo: () => void;
  onCreateTodo: (taskId: string) => void;
}

export interface TodoGroup {
  todos: TodoWithMeta[];
}

// 工数集計用のインターフェース
export interface WorkloadSummary {
  // 外部の予定の合計工数
  externalHours: number;
  // 内部TODOの合計工数
  internalHours: number;
  // バッファの合計工数
  bufferHours: number;
  // 空き時間（1日のデフォルト稼働時間から他の合計を引いた残り）
  freeHours: number;
  // 合計工数
  totalHours: number;
}

// 日/週/月ごとの工数集計
export interface WorkloadSummaryByPeriod {
  // 日ごとの工数集計
  daily: Map<string, WorkloadSummary>;
  // 週ごとの工数集計
  weekly: Map<string, WorkloadSummary>;
  // 月ごとの工数集計
  monthly: Map<string, WorkloadSummary>;
} 