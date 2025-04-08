'use client'

import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Task } from '@/features/tasks/types/task'
import { BUSINESS_HOURS } from '@/utils/constants/constants'
import { useFilterContext } from '@/features/tasks/filters/FilterContext'
import { filterTodosForDisplay } from '../utils/scheduleTodoUtils'
import { TodoWithMeta } from '../types/schedule'
import useScheduleView from '../hooks/useScheduleView'
import TodoGroup from './TodoGroup'

interface WeeklyScheduleDndProps {
  weekDays: Date[]
  timeSlots: number[]
  tasks: Task[]
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

export default function WeeklyScheduleDnd({
  weekDays,
  timeSlots,
  tasks,
  selectedTodoId,
  onTaskSelect,
  onTodoUpdate,
  onCalendarClick,
  isCreatingTodo,
  newTodoDate,
  newTodoTaskId,
  newTodoText,
  newTodoEstimatedHours,
  onNewTodoTaskIdChange,
  onNewTodoTextChange,
  onNewTodoEstimatedHoursChange,
  onCancelCreateTodo,
  onCreateTodo
}: WeeklyScheduleDndProps) {
  const [mounted, setMounted] = useState(false)
  const { selectedUserIds, showUnassigned } = useFilterContext();
  const [todos, setTodos] = useState<Map<string, TodoWithMeta[]>>(new Map())

  const quarterHeight = 15; // 15分の高さ（px）
  
  // 共通フックを使用
  const {
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
  } = useScheduleView({
    quarterHeight,
    selectedTodoId,
    onTaskSelect,
    onTodoUpdate,
    todos
  });

  // マウント時とタスクまたはフィルターの変更時にTODOを更新
  useEffect(() => {
    if (!mounted) {
      setMounted(true)
      return
    }
    
    // TODOをカレンダー表示用にフィルタリング
    const filteredTodos = filterTodosForDisplay(tasks, selectedUserIds, showUnassigned)
    setTodos(filteredTodos)
  }, [tasks, selectedUserIds, showUnassigned, mounted])

  return (
    <div className="relative">
      {timeSlots.map((hour) => (
        <div 
          key={hour} 
          className="grid" 
          style={{ gridTemplateColumns: `3rem repeat(${weekDays.length}, 1fr)` }}
        >
          <div className="h-12 text-xs text-right pr-1 pt-1 text-gray-500 w-12">
            {`${hour}:00`}
          </div>
          {weekDays.map((day, dayIndex) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const todosForDay = todos.get(dateKey) || []
            
            // 共通フックを使用して、TODOグループを取得
            const { todoGroups } = renderTodosForHour(hour, todosForDay);

            return (
              <div
                key={`${format(day, 'yyyy-MM-dd')}-${hour}`}
                className={`h-12 border-t border-l relative ${
                  hour === BUSINESS_HOURS.BREAK_START ? 'bg-gray-100 opacity-80' : ''
                } ${
                  hour >= BUSINESS_HOURS.START_HOUR && hour < BUSINESS_HOURS.END_HOUR ? 'bg-white' : 'bg-gray-50'
                } ${
                  hour === BUSINESS_HOURS.START_HOUR ? 'border-t-2 border-t-blue-200' : ''
                } ${
                  hour === BUSINESS_HOURS.END_HOUR ? 'border-b-2 border-b-blue-200' : ''
                }`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.todo-item')) {
                    e.stopPropagation();
                    return;
                  }
                  onCalendarClick(e, day, hour);
                }}
              >
                {/* 15分単位の区切り線 */}
                {[1, 2, 3].map((quarter) => (
                  <div
                    key={quarter}
                    className="absolute w-full border-t border-gray-100"
                    style={{ top: `${quarterHeight * quarter}px` }}
                  />
                ))}

                {hour === BUSINESS_HOURS.BREAK_START && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 font-medium z-20">
                    休憩
                  </div>
                )}

                {hour === BUSINESS_HOURS.START_HOUR && dayIndex === 0 && (
                  <div className="absolute -left-12 top-0 transform -translate-y-1/2 text-xs text-blue-600 font-medium"></div>
                )}

                {hour === BUSINESS_HOURS.END_HOUR && dayIndex === 0 && (
                  <div className="absolute -left-12 top-12 transform -translate-y-1/2 text-xs text-blue-600 font-medium"></div>
                )}

                {/* 共通コンポーネントを使用してTODOグループを表示 */}
                {todoGroups.length > 0 && (
                  <TodoGroup
                    todoGroups={todoGroups}
                    selectedTodoId={selectedTodoId}
                    quarterHeight={quarterHeight}
                    editingTodo={editingTodo}
                    onTodoClick={(todoWithMeta) => handleTodoClick(todoWithMeta.todo, todoWithMeta.taskId)}
                    onStartTimeChange={handleStartTimeChange}
                    onEndTimeChange={handleEndTimeChange}
                    onCancelEdit={closeEditForm}
                    onUpdateTime={handleTimeUpdate}
                    onDragEnd={handleTodoDragEnd}
                    onResizeEnd={handleTodoResizeEnd}
                  />
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* TODO作成モーダル */}
      {isCreatingTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">新しいTODOを作成</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日付
                </label>
                <div className="text-sm text-gray-600">
                  {newTodoDate ? format(newTodoDate, 'yyyy年M月d日 (E) HH:mm', { locale: ja }) : ''}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タスク
                </label>
                <select
                  value={newTodoTaskId || ''}
                  onChange={(e) => onNewTodoTaskIdChange(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">タスクを選択</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TODO名
                </label>
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => onNewTodoTextChange(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="TODOの名前を入力"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={onCancelCreateTodo}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                キャンセル
              </button>
              <button
                onClick={() => newTodoTaskId && onCreateTodo(newTodoTaskId)}
                disabled={!newTodoTaskId || !newTodoText.trim()}
                className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 