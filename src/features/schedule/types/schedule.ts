import { Task, Todo } from '@/features/tasks/types/task'

// ビューモードの型定義
export type ViewMode = 'day' | 'week' | 'month'

// ビューモードボタンの型定義
export interface ViewModeButton {
  id: ViewMode
  icon: JSX.Element
  label: string
}

// 拡張したTodo情報の型定義
export interface TodoWithMeta {
  todo: Todo & {
    originalEstimatedHours?: number
    startTime?: number
    dueDate?: Date
  }
  taskId: string
  taskTitle: string
  priority?: number
  isNextTodo: boolean
}

// スケジュールカレンダーのプロパティ型定義
export interface ScheduleCalendarProps {
  tasks: Task[]
  onTaskSelect: (taskId: string, todoId?: string) => void
  onTodoUpdate: (todoId: string, taskId: string, newDate: Date, isPlannedDate?: boolean, endDate?: Date) => void
  selectedTodoId?: string | null
  onTaskUpdate?: (updatedTask: Task) => void
}

// 日表示コンポーネントのプロパティ型定義
export interface DayViewProps {
  currentDate: Date
  timeSlots: number[]
  todoSchedule: Map<string, TodoWithMeta[]>
  selectedTodoId?: string | null
  onTaskSelect: (taskId: string, todoId?: string) => void
  onTodoUpdate: (todoId: string, taskId: string, newDate: Date, isPlannedDate?: boolean, endDate?: Date) => void
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
  onTodoUpdate?: (todoId: string, taskId: string, newDate: Date, isPlannedDate?: boolean, endDate?: Date) => void
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
  viewMode: ViewMode
  viewModeButtons: ViewModeButton[]
  showWeekend: boolean
  onViewModeChange: (mode: ViewMode) => void
  onShowWeekendChange: (show: boolean) => void
  onMovePrevious: () => void
  onMoveNext: () => void
  onGoToToday: () => void
} 