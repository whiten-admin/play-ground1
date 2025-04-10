import { Task } from '@/features/tasks/types/task';
import { TodoWithMeta, WorkloadSummaryByPeriod } from './schedule';

export interface DayViewProps {
  currentDate: Date;
  timeSlots: number[];
  todoSchedule: Map<string, TodoWithMeta[]>;
  selectedTodoId?: string | null;
  onTaskSelect: (taskId: string, todoId?: string) => void;
  onTodoUpdate: (todoId: string, taskId: string, newDate: Date, endDate?: Date) => void;
  onCalendarClick: (e: React.MouseEvent<HTMLDivElement>, day: Date, hour: number) => void;
}

export interface ScheduleCalendarProps {
  tasks: Task[];
  onTaskSelect: (taskId: string, todoId?: string) => void;
  onTodoUpdate: (todoId: string, taskId: string, newDate: Date, endDate?: Date) => void;
  selectedTodoId?: string | null;
  onTaskUpdate: (updatedTask: Task) => void;
  onWorkloadUpdate?: (workloadData: WorkloadSummaryByPeriod, date: Date) => void;
} 