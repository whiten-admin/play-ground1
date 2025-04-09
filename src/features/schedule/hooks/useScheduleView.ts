import { useState, useCallback } from 'react';
import { TodoWithMeta } from '../types/schedule';
import { Todo } from '@/features/tasks/types/task';
import { filterTodosForHour, groupOverlappingTodos, calculateTodoPosition } from '../utils/todoDisplayUtils';
import { format } from 'date-fns';

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
  onTodoUpdate?: (todoId: string, taskId: string, newDate: Date, endDate?: Date) => void;
  todos?: Map<string, TodoWithMeta[]>; // 追加: TODOリスト
}

export default function useScheduleView({
  quarterHeight,
  selectedTodoId,
  onTaskSelect,
  onTodoUpdate,
  todos = new Map() // デフォルト値を空のMapに設定
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
    onTodoUpdate(todo.id, taskId, updatedStartDateTime, updatedEndDateTime);
    
    // 更新完了後、編集状態を解除
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
  
  // 編集フォームを閉じるだけで選択状態は維持する関数
  const closeEditForm = () => {
    setEditingTodo(null);
    // 選択状態は維持する（onTaskSelectは呼び出さない）
  };
  
  // TODOをクリックした時にフォームを表示するハンドラー
  const handleTodoClick = (todo: Todo, taskId: string) => {
    const startDateTime = new Date(todo.calendarStartDateTime);
    const endDateTime = new Date(todo.calendarEndDateTime);
    
    // すでに選択されていて編集中のTODOの場合は、編集フォームを閉じるだけ
    if (editingTodo?.todo.id === todo.id) {
      closeEditForm();
      return;
    }
    
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
  
  // TODOドラッグ終了時の処理（位置変更）
  const handleTodoDragEnd = (todoId: string, taskId: string, diffMinutes: number, newDate?: Date) => {
    if (!onTodoUpdate) return;
    
    // 対象TODOの現在の開始・終了時間を取得
    const todoWithMeta = findTodoWithMeta(todoId, taskId);
    
    // TODOが見つからない場合はエラーを表示して処理を中止
    if (!todoWithMeta) {
      console.warn(`対象のTodoがステート内に見つかりません: ${todoId} (タスク: ${taskId})`);
      return;
    }
    
    const { todo } = todoWithMeta;
    
    // calendarStartDateTimeとstartDateの両方を追跡（重要）
    const startDateTime = new Date(todo.calendarStartDateTime);
    const endDateTime = new Date(todo.calendarEndDateTime);
    const startDate = new Date(todo.startDate); // 追加: startDateも更新する必要あり
    
    // 新しい開始時間と終了時間を計算
    const updatedStartDateTime = new Date(startDateTime);
    updatedStartDateTime.setMinutes(updatedStartDateTime.getMinutes() + diffMinutes);
    
    const updatedEndDateTime = new Date(endDateTime);
    updatedEndDateTime.setMinutes(updatedEndDateTime.getMinutes() + diffMinutes);
    
    // 新しいstartDateも作成 (カレンダー表示用)
    const updatedStartDate = new Date(startDate);
    
    // 日付変更のロジックを強化
    if (newDate) {      
      // 変更前の日付情報をより詳細に
      const beforeYear = updatedStartDateTime.getFullYear();
      const beforeMonth = updatedStartDateTime.getMonth();
      const beforeDate = updatedStartDateTime.getDate();
      
      // 新しい日付の情報を取得
      const newYear = newDate.getFullYear();
      const newMonth = newDate.getMonth();
      const newDay = newDate.getDate();
      
      // 現在の時間情報を保持したまま日付のみを更新（setFullYearは一度に年月日を設定できる）
      updatedStartDateTime.setFullYear(newYear, newMonth, newDay);
      updatedEndDateTime.setFullYear(newYear, newMonth, newDay);
      
      // **重要: startDateも同じ日付に更新する（日付のみ）**
      updatedStartDate.setFullYear(newYear, newMonth, newDay);
      
      // 文字列比較用の日付整形（ログ確認用）
      const oldDateStr = `${beforeYear}-${beforeMonth + 1}-${beforeDate}`;
      const newDateStr = `${newYear}-${newMonth + 1}-${newDay}`;
      const actualDateStr = `${updatedStartDateTime.getFullYear()}-${updatedStartDateTime.getMonth() + 1}-${updatedStartDateTime.getDate()}`;

    } else {
      // 日付変更がない場合もstartDateの時間を同期させる
      updatedStartDate.setTime(updatedStartDateTime.getTime());
    }
    
    // 業務時間内に収まるか確認（9:00-18:00）
    const startHour = updatedStartDateTime.getHours();
    const startMinutes = updatedStartDateTime.getMinutes();
    const endHour = updatedEndDateTime.getHours();
    const endMinutes = updatedEndDateTime.getMinutes();
    
    // 時間調整のロジックを簡素化
    if (startHour < 9) {
      // 開始時間が9:00より前の場合は9:00に設定
      const diff = (9 - startHour) * 60 - startMinutes;
      updatedStartDateTime.setHours(9, 0, 0, 0);
      updatedEndDateTime.setTime(updatedEndDateTime.getTime() + diff * 60 * 1000);
    } else if (endHour > 18 || (endHour === 18 && endMinutes > 0)) {
      // 終了時間が18:00より後の場合は18:00に設定
      const diff = (endHour - 18) * 60 + endMinutes;
      updatedEndDateTime.setHours(18, 0, 0, 0);
      // 開始時間も調整（ただし9:00より前にはしない）
      const newStartTime = updatedStartDateTime.getTime() - diff * 60 * 1000;
      const minStartTime = new Date(updatedStartDateTime);
      minStartTime.setHours(9, 0, 0, 0);
      if (newStartTime >= minStartTime.getTime()) {
        updatedStartDateTime.setTime(newStartTime);
      }
    }
    
    // TODOを更新 (重要: 最初の引数として更新されたstartDateも渡す)
    try {
      // 1. 最重要: カレンダー日付とstartDateの両方を更新
      // onTodoUpdate(todoId, taskId, カレンダー開始日時, 計画日を更新するか, カレンダー終了日時)
      //
      // isPlannedDateをtrueに設定し、最も重要なのはupdatedStartDateをTODOのstartDate
      // プロパティとして更新するように明示的に伝える
      
      // 着手予定日も直接更新（calendarStartDateTime, calendarEndDateTimeとは別に）
      // 日付のみ一致させるため、時刻情報はリセット
      // todo.startDateを直接更新するため、コピーでなく新しい日付オブジェクトを作成
      const newStartDate = new Date(
        updatedStartDateTime.getFullYear(),
        updatedStartDateTime.getMonth(),
        updatedStartDateTime.getDate(),
        0, 0, 0, 0 // 時刻は00:00:00に設定
      );
      
      // このnewStartDateはTODO.startDateに直接設定される
      // 親コンポーネントでTODOエンティティの更新に使用される
      todo.startDate = newStartDate;
      
      // isPlannedDateフラグを明示的にtrueに設定して、親コンポーネントにも通知
      onTodoUpdate(todoId, taskId, updatedStartDateTime, updatedEndDateTime);
    } catch (error) {
      console.error('onTodoUpdate関数の実行中にエラーが発生しました:', error);
    }
  };
  
  // TODOリサイズ終了時の処理（長さ変更）
  const handleTodoResizeEnd = (todoId: string, taskId: string, diffMinutes: number) => {
    if (!onTodoUpdate) return;
    
    // 対象TODOの現在の終了時間を取得
    const todoWithMeta = findTodoWithMeta(todoId, taskId);
    
    // TODOが見つからない場合はエラーを表示して処理を中止
    if (!todoWithMeta) {
      console.warn(`Todo not found in local state for resizeEnd: ${todoId} in task ${taskId}`);
      return;
    }
    
    const { todo } = todoWithMeta;
    
    // 新しい終了時間を計算
    const updatedEndDateTime = new Date(todo.calendarEndDateTime);
    updatedEndDateTime.setMinutes(updatedEndDateTime.getMinutes() + diffMinutes);
    
    // 開始時間を取得
    const startDateTime = new Date(todo.calendarStartDateTime);
    
    // 業務時間内に収まるか確認（最大18:00まで）
    const endHour = updatedEndDateTime.getHours();
    const endMinutes = updatedEndDateTime.getMinutes();
    
    if (endHour > 18 || (endHour === 18 && endMinutes > 0)) {
      // 18:00を超える場合は18:00に設定
      updatedEndDateTime.setHours(18, 0, 0, 0);
    }
    
    // 最低継続時間を15分に設定
    const minDuration = 15 * 60 * 1000; // 15分をミリ秒に変換
    if (updatedEndDateTime.getTime() - startDateTime.getTime() < minDuration) {
      updatedEndDateTime.setTime(startDateTime.getTime() + minDuration);
    }
    
    // 終了時間が翌日になる場合は当日の18:00に設定
    const startDay = startDateTime.getDate();
    const endDay = updatedEndDateTime.getDate();
    if (startDay !== endDay) {
      updatedEndDateTime.setDate(startDay);
      updatedEndDateTime.setHours(18, 0, 0, 0);
    }
    
    // TODOを更新（開始時間はそのまま）
    onTodoUpdate(todoId, taskId, todo.calendarStartDateTime, updatedEndDateTime);
  };
  
  // ヘルパー関数: IDからTodoWithMetaを見つける
  const findTodoWithMeta = useCallback((todoId: string, taskId: string): TodoWithMeta | null => {
    // 全ての日付のTODOを検索
    const entries = Array.from(todos.entries());
    for (let i = 0; i < entries.length; i++) {
      const [dateKey, todosForDay] = entries[i];
      const found = todosForDay.find(
        (todoItem: TodoWithMeta) => todoItem.todo.id === todoId && todoItem.taskId === taskId
      );
      if (found) return found;
    }
    
    // 見つからない場合はnull
    return null;
  }, [todos]);
  
  return {
    editingTodo,
    setEditingTodo,
    handleTimeUpdate,
    renderTodosForHour,
    handleTodoClick,
    handleStartTimeChange,
    handleEndTimeChange,
    handleTodoDragEnd,
    handleTodoResizeEnd,
    closeEditForm
  };
} 