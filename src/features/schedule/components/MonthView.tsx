'use client'

import React from 'react'
import { format, isToday, getDay, isBefore } from 'date-fns'
import { ja } from 'date-fns/locale'
import { MonthViewProps } from '../types/schedule'

export default function MonthView({ 
  currentDate, 
  showWeekend, 
  monthCalendarDays, 
  todoSchedule, 
  selectedTodoId, 
  onTaskSelect 
}: MonthViewProps) {
  // 親コンポーネントのonTaskSelectに通知
  const handleTaskSelect = (taskId: string, todoId?: string) => {
    console.log('MonthView - handleTaskSelect:', { taskId, todoId })
    onTaskSelect(taskId, todoId)
  }

  return (
    <div className="min-w-[800px] relative">      
      {/* 曜日ヘッダー */}
      <div 
        className="grid grid-cols-7 border-b"
      >
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <div
            key={index}
            className="text-center py-1 text-xs font-medium border-l"
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダー本体 */}
      <div className="grid grid-cols-7">
        {monthCalendarDays.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTodos = todoSchedule.get(dateKey) || [];
          const isSunday = getDay(day) === 0;
          const isSaturday = getDay(day) === 6;
          
          return (
            <div 
              key={index}
              className={`min-h-[100px] border-b border-l p-1 ${
                isToday(day) ? 'bg-amber-100' : 
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 
                isSunday ? 'text-red-500' : 
                isSaturday ? 'text-blue-500' : ''
              }`}
            >
              <div className="text-right text-xs mb-1">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayTodos.slice(0, 3).map(({ todo, taskId, priority, isNextTodo }) => {
                  // 状態に応じた色分け
                  let bgColor = 'bg-white';
                  let textColor = 'text-gray-800';
                  let borderClass = 'border border-gray-200';
                  
                  // 現在の日時を取得
                  const now = new Date();
                  
                  // 期限切れかどうかを判定
                  const todoEndDateTime = new Date(todo.calendarEndDateTime);
                  const isOverdue = !todo.completed && todoEndDateTime < now;

                  if (todo.completed) {
                    // 完了済みTODO：グレー
                    bgColor = 'bg-gray-200';
                    textColor = 'text-gray-500';
                    borderClass = 'border border-gray-300';
                  } else if (isOverdue) {
                    // 期限切れTODO：薄い赤色
                    bgColor = 'bg-red-50';
                    textColor = 'text-red-700';
                    borderClass = 'border border-red-200';
                  } else if (isNextTodo) {
                    // NEXTTODO：薄い黄色
                    bgColor = 'bg-amber-50';
                    textColor = 'text-amber-800';
                    borderClass = 'border border-amber-200';
                  } else {
                    // 通常のTODO：白
                    bgColor = 'bg-white';
                    textColor = 'text-gray-800';
                    borderClass = 'border border-gray-200';
                  }
                  
                  // 選択されたTODOの場合、スタイルを強調
                  if (selectedTodoId === todo.id) {
                    borderClass = 'border-2 border-blue-600';
                  }

                  return (
                    <div
                      key={todo.id}
                      className={`text-xs p-1 ${bgColor} rounded truncate cursor-pointer flex items-center ${textColor} ${borderClass} ${selectedTodoId === todo.id ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        boxShadow: selectedTodoId === todo.id ? '0 2px 4px rgba(59, 130, 246, 0.3)' : undefined,
                        zIndex: selectedTodoId === todo.id ? 10 : 1,
                        position: 'relative'
                      }}
                      onClick={(e) => handleTaskSelect(taskId, todo.id)}
                    >
                      <span className="truncate">
                        {todo.text}
                      </span>
                    </div>
                  );
                })}
                {dayTodos.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    + {dayTodos.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
} 