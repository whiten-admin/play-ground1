'use client'

import React from 'react'
import { format, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import { DayViewProps } from '../types/schedule'
import { BUSINESS_HOURS } from '@/utils/constants/constants'

export default function DayView({ currentDate, timeSlots, todoSchedule, selectedTodoId, onTaskSelect }: DayViewProps) {
  // 日付キーの生成
  const todayKey = format(currentDate, 'yyyy-MM-dd')
  const todayTodos = todoSchedule.get(todayKey) || []

  // 親コンポーネントのonTaskSelectに通知
  const handleTaskSelect = (taskId: string, todoId?: string) => {
    console.log('DayView - handleTaskSelect:', { taskId, todoId })
    onTaskSelect(taskId, todoId)
  }

  return (
    <div className="min-w-[600px]">
      {/* 日付ヘッダー */}
      <div 
        className="grid border-b" 
        style={{ 
          gridTemplateColumns: `3rem 1fr` 
        }}
      >
        <div className="h-8 w-12" />
        <div
          className={`text-center py-1 text-xs font-medium border-l ${
            isToday(currentDate) ? 'bg-amber-100' : ''
          }`}
        >
          {format(currentDate, 'M/d (E)', { locale: ja })}
        </div>
      </div>

      {/* 時間帯と予定 */}
      <div className="grid" style={{ gridTemplateColumns: `3rem 1fr` }}>
        {/* 時間帯 */}
        <div className="border-r">
          {timeSlots.map(hour => (
            <div key={hour} className="h-16 text-xs text-gray-500 flex items-start justify-end pr-1 pt-1">
              {`${hour}:00`}
            </div>
          ))}
        </div>

        {/* 予定エリア */}
        <div className="relative">
          {/* 時間帯の区切り線 */}
          {timeSlots.map(hour => (
            <div 
              key={hour} 
              className={`h-16 border-b border-gray-200 ${
                hour === BUSINESS_HOURS.BREAK_START ? 'bg-gray-200' : ''
              }`}
            >
              {hour === BUSINESS_HOURS.BREAK_START && (
                <div className="flex items-center justify-center h-full text-sm text-gray-500 font-medium">
                  休憩
                </div>
              )}
            </div>
          ))}

          {/* TODOの表示 */}
          {todayTodos.map(({ todo, taskId, taskTitle, priority, isNextTodo }) => {
            const hourHeight = 64; // 1時間の高さ（px）
            const top = (todo.startTime || BUSINESS_HOURS.START_HOUR) * hourHeight - BUSINESS_HOURS.START_HOUR * hourHeight;
            const height = todo.estimatedHours * hourHeight;
            
            // 状態に応じた色分け
            let borderColor = todo.completed ? 'border-gray-400' : 'border-blue-400';
            let bgColor = 'bg-white';
            let textColor = 'text-gray-800';
            
            if (todo.completed) {
              // 完了済みTODO：グレーアウト
              bgColor = 'bg-gray-100';
              textColor = 'text-gray-500';
            } else {
              // NEXTTODOかどうか判定（今日かつisNextTodoがtrueのTODOのみ黄色にする）
              const today = format(new Date(), 'yyyy-MM-dd');
              const isDisplayingToday = today === todayKey;
              
              if (isDisplayingToday && isNextTodo) {
                // 今日のTODO（NEXTTODO表示対象）：黄色系
                bgColor = 'bg-amber-100';
                borderColor = 'border-amber-500';
              }
              // それ以外のTODOは白（デフォルト）のまま
            }
            
            // ラベル（予定か期日かの区別）
            let timeLabel = '';
            // カレンダー設定があれば予定とみなす
            if (todo.calendarStartDateTime) {
              timeLabel = '予定: ';
            } else if (todo.dueDate && isToday(todo.dueDate)) {
              timeLabel = '期日: ';
            }

            return (
              <div
                key={todo.id}
                className={`absolute left-0 right-0 mx-1 p-1 rounded overflow-hidden border-l-4 ${borderColor} ${bgColor} ${textColor} ${selectedTodoId === todo.id ? 'ring-4 ring-blue-500 shadow-md' : ''}`}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  // 選択されている場合は前面に表示
                  zIndex: selectedTodoId === todo.id ? 10 : 1,
                  // 選択されている場合は境界線を追加
                  boxShadow: selectedTodoId === todo.id ? '0 4px 12px rgba(59, 130, 246, 0.5)' : undefined,
                  // 選択時の背景色を追加
                  backgroundColor: selectedTodoId === todo.id ? (todo.completed ? '#e5e7eb' : '#dbeafe') : undefined
                }}
                onClick={() => handleTaskSelect(taskId, todo.id)}
              >
                <div className={`font-medium truncate ${selectedTodoId === todo.id ? 'text-blue-700 font-bold' : ''}`}>
                  {todo.text}
                  {todo.id.includes('-after-break') && <span className="text-xs ml-1 text-amber-600">（休憩後）</span>}
                </div>
                <div className="text-gray-500 truncate">{taskTitle}</div>
                <div className="text-gray-500">
                  {timeLabel}{Math.round((todo.originalEstimatedHours || todo.estimatedHours) * 10) / 10}h
                  {todo.calendarStartDateTime && format(todo.calendarStartDateTime, 'yyyy-MM-dd') !== todayKey && (
                    <span className="ml-1 text-xs text-gray-400">(予定: {format(todo.calendarStartDateTime, 'M/d')})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 