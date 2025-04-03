'use client'

import React, { useState, useEffect } from 'react'
import { format, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import { DayViewProps } from '../types/schedule'
import { BUSINESS_HOURS } from '@/utils/constants/constants'
import useScheduleView from '../hooks/useScheduleView'
import TodoGroup from './TodoGroup'

export default function DayView({ 
  currentDate, 
  timeSlots, 
  todoSchedule, 
  selectedTodoId, 
  onTaskSelect, 
  onTodoUpdate,
  onCalendarClick
}: DayViewProps) {
  // 日付キーの生成
  const todayKey = format(currentDate, 'yyyy-MM-dd')
  const todayTodos = todoSchedule.get(todayKey) || []
  
  // 高さの設定
  const hourHeight = 64; // 1時間の高さ（px）
  const quarterHeight = hourHeight / 4; // 15分の高さ（px）
  
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
    handleTodoResizeEnd
  } = useScheduleView({
    quarterHeight,
    selectedTodoId,
    onTaskSelect,
    onTodoUpdate,
    todos: todoSchedule
  });

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
          {timeSlots.map(hour => {
            // 共通フックを使用して、TODOグループを取得
            const { todoGroups } = renderTodosForHour(hour, todayTodos);
            
            return (
              <div 
                key={hour} 
                className={`h-16 border-b border-gray-200 relative ${
                  hour === BUSINESS_HOURS.BREAK_START ? 'bg-gray-200' : ''
                }`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.todo-item')) {
                    e.stopPropagation();
                    return;
                  }
                  onCalendarClick(e, currentDate, hour);
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
                  <div className="flex items-center justify-center h-full text-sm text-gray-500 font-medium z-10">
                    休憩
                  </div>
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
                    onCancelEdit={() => setEditingTodo(null)}
                    onUpdateTime={handleTimeUpdate}
                    onDragEnd={handleTodoDragEnd}
                    onResizeEnd={handleTodoResizeEnd}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 