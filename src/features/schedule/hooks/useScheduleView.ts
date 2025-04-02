import { useState } from 'react';
import { TodoWithMeta } from '../types/schedule';
import { Todo } from '@/features/tasks/types/task';
import { filterTodosForHour, groupOverlappingTodos, calculateTodoPosition } from '../utils/todoDisplayUtils';

export interface EditingTodo {
  todo: Todo;
  taskId: string;
  startTime: string;
  endTime: string;
}

export interface UseScheduleViewProps {
  quarterHeight: number;
  selectedTodoId?: string | null;
  onTaskSelect: (taskId: string, todoId?: string) => void;
  onTodoUpdate?: (todoId: string, taskId: string, newDate: Date, isPlannedDate?: boolean, endDate?: Date) => void;
}

export default function useScheduleView({
  quarterHeight,
  selectedTodoId,
  onTaskSelect,
  onTodoUpdate
}: UseScheduleViewProps) {
  // 編集中のTODO状態
  const [editingTodo, setEditingTodo] = useState<EditingTodo | null>(null);
  
  // 時間更新を処理する関数
  const handleTimeUpdate = () => {
    if (!editingTodo || !onTodoUpdate) return;

    const { todo, taskId, startTime, endTime } = editingTodo;
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const updatedStartDateTime = new Date(todo.calendarStartDateTime);
    updatedStartDateTime.setHours(startHour, startMinute, 0, 0);

    const updatedEndDateTime = new Date(todo.calendarEndDateTime);
    updatedEndDateTime.setHours(endHour, endMinute, 0, 0);

    // 開始時間と終了時間の両方を更新するために、第5引数に終了時間を渡す
    onTodoUpdate(todo.id, taskId, updatedStartDateTime, false, updatedEndDateTime);
    setEditingTodo(null);
  };
  
  // TODOの時間帯ごとの表示を処理
  const renderTodosForHour = (hour: number, todosForDay: TodoWithMeta[]) => {
    // その時間帯に表示するTODOをフィルタリング
    const todosForHour = filterTodosForHour(hour, todosForDay);
    
    // 重なりがあるTODOをグループ化
    const todoGroups = groupOverlappingTodos(todosForHour);
    
    return {
      todoGroups
    };
  };
  
  // TODOをクリックした時にフォームを表示するハンドラー
  const handleTodoClick = (todo: Todo, taskId: string) => {
    const startDateTime = new Date(todo.calendarStartDateTime);
    const endDateTime = new Date(todo.calendarEndDateTime);
    
    onTaskSelect(taskId, todo.id);
    setEditingTodo({
      todo,
      taskId,
      startTime: `${startDateTime.getHours().toString().padStart(2, '0')}:${startDateTime.getMinutes().toString().padStart(2, '0')}`,
      endTime: `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`
    });
  };
  
  // 開始時間が変更された時のハンドラー
  const handleStartTimeChange = (newStartTime: string) => {
    if (!editingTodo) return;
    
    if (newStartTime >= editingTodo.endTime) {
      const [hour, minute] = newStartTime.split(':').map(Number);
      const newEndHour = Math.min(hour + 1, 18); // 18時を超えない
      
      setEditingTodo({
        ...editingTodo,
        startTime: newStartTime,
        endTime: `${newEndHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      });
    } else {
      setEditingTodo({
        ...editingTodo,
        startTime: newStartTime
      });
    }
  };
  
  // 終了時間が変更された時のハンドラー
  const handleEndTimeChange = (newEndTime: string) => {
    if (!editingTodo) return;
    
    if (newEndTime <= editingTodo.startTime) {
      const [hour, minute] = newEndTime.split(':').map(Number);
      const newStartHour = Math.max(9, hour - 1); // 9時より早くしない
      
      setEditingTodo({
        ...editingTodo,
        startTime: `${newStartHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        endTime: newEndTime
      });
    } else {
      setEditingTodo({
        ...editingTodo,
        endTime: newEndTime
      });
    }
  };
  
  return {
    editingTodo,
    setEditingTodo,
    handleTimeUpdate,
    renderTodosForHour,
    handleTodoClick,
    handleStartTimeChange,
    handleEndTimeChange
  };
} 