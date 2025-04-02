'use client'

import React, { useEffect, useState, useRef } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Task } from '@/features/tasks/types/task'
import { BUSINESS_HOURS } from '@/utils/constants/constants'
import { useFilterContext } from '@/features/tasks/filters/FilterContext'
import { scheduleTodos } from '../utils/scheduleTodoUtils'
import { TodoWithMeta, WeekViewProps } from '../types/schedule'

interface WeeklyScheduleDndProps {
  weekDays: Date[]
  timeSlots: number[]
  tasks: Task[]
  onTaskSelect: (taskId: string, todoId?: string) => void
  onTodoUpdate?: (todoId: string, taskId: string, newDate: Date, isPlannedDate?: boolean) => void
  selectedTodoId?: string | null
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
  onTaskSelect,
  selectedTodoId,
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
  const [todos, setTodos] = useState<Map<string, TodoWithMeta[]>>(new Map())
  
  // フィルタリングコンテキストを使用
  const { selectedUserIds, showUnassigned } = useFilterContext()

  // tasksが変更されたときにtodosを再計算
  useEffect(() => {
    const initialTodos = scheduleTodos(tasks, selectedUserIds, showUnassigned)
    setTodos(initialTodos)
  }, [tasks, selectedUserIds, showUnassigned]) // フィルター条件が変更されたときも再計算

  // selectedTodoIdが変更されたときにコンソールログに出力
  useEffect(() => {
    if (selectedTodoId) {
      console.log('WeeklyScheduleDnd - 選択されたTODO:', selectedTodoId)
    }
  }, [selectedTodoId])

  // マウント状態の管理
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
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
            {weekDays.map((_, dayIndex) => (
              <div
                key={dayIndex}
                className="h-12 border-t border-l relative"
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

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
            // 時間枠に一致するTODOを表示
            const todosForHour = todosForDay.filter(
              ({ todo }) => Math.floor(todo.startTime || 0) === hour
            )

            return (
              <div
                key={`${format(day, 'yyyy-MM-dd')}-${hour}`}
                className={`h-12 border-t border-l relative ${
                  hour === BUSINESS_HOURS.BREAK_START ? 'bg-gray-200' : ''
                }`}
                onClick={(e) => onCalendarClick(e, day, hour)}
              >
                {hour === BUSINESS_HOURS.BREAK_START && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 font-medium z-10">
                    休憩
                  </div>
                )}
                {todosForHour.map(({ todo, taskId, taskTitle, priority, isNextTodo }) => {
                  // 選択されているかどうかをチェック
                  const isSelected = selectedTodoId === todo.id;
                  
                  // デバッグ用：選択状態を出力
                  if (isSelected) {
                    console.log('選択されたTODOを表示:', todo.id, todo.text);
                  }

                  return (
                    <div
                      key={`${todo.id}-${taskId}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('TODO選択:', todo.id, taskId);
                        onTaskSelect(taskId, todo.id)
                      }}
                      style={{
                        height: `${todo.estimatedHours * 48}px`,
                        width: 'calc(100% - 2px)',
                        position: 'absolute',
                        top: 0,
                        left: 1,
                        // 選択されている場合は前面に表示
                        zIndex: isSelected ? 10 : 1,
                        // 選択されている場合は境界線を追加
                        border: isSelected ? '2px solid #3b82f6' : undefined,
                        // 選択されている場合は影を強調
                        boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.5)' : undefined,
                        // 選択されている場合は背景色を強調
                        backgroundColor: isSelected ? 
                          (todo.completed ? '#e5e7eb' : 
                           (format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && isNextTodo) ? '#fef3c7' : 
                           priority === 2 ? '#fee2e2' : 
                           priority === 1 ? '#ffedd5' : '#dbeafe') : undefined
                      }}
                      className={`${
                        todo.completed ? 'bg-gray-100' : 
                        (format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && 
                         isNextTodo) ? 'bg-amber-100' :
                        priority === 2 ? 'bg-red-100' : 
                        priority === 1 ? 'bg-orange-100' : 'bg-blue-100'
                      } rounded p-1 cursor-pointer hover:shadow-md transition-shadow overflow-hidden
                        ${isSelected ? 'ring-4 ring-blue-500 shadow-md' : ''}`}
                    >
                      <div className={`text-xs font-medium truncate ${isSelected ? 'text-blue-700 font-bold' : ''}`}>
                        {todo.text}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{taskTitle}</div>
                      <div className="text-xs text-gray-500">{Math.round((todo.originalEstimatedHours || todo.estimatedHours) * 10) / 10}h</div>
                      {priority === 2 && !todo.completed && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" title="高優先度" />
                      )}
                    </div>
                  )
                })}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  見積もり工数（時間）
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={newTodoEstimatedHours}
                  onChange={(e) => onNewTodoEstimatedHoursChange(Number(e.target.value))}
                  className="w-full p-2 border rounded-md"
                  placeholder="見積もり工数を入力"
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