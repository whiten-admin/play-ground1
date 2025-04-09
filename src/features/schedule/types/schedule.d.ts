export interface DayViewProps {
  currentDate: Date;
  timeSlots: number[];
  todoSchedule: Map<string, TodoWithMeta[]>;
  selectedTodoId?: string | null;
  onTaskSelect: (taskId: string, todoId?: string) => void;
  onTodoUpdate: (todoId: string, taskId: string, newDate: Date, endDate?: Date) => void;
  onCalendarClick: (e: React.MouseEvent<HTMLDivElement>, day: Date, hour: number) => void;
} 