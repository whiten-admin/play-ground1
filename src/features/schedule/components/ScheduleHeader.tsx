'use client'

import React from 'react'
import { ScheduleHeaderProps, ViewMode } from '../types/schedule'

export default function ScheduleHeader({
  currentDate,
  viewMode,
  viewModeButtons,
  showWeekend,
  onViewModeChange,
  onShowWeekendChange,
  onMovePrevious,
  onMoveNext,
  onGoToToday
}: ScheduleHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold">
          スケジュール
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {viewModeButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => onViewModeChange(button.id)}
                className={`p-2 rounded ${
                  viewMode === button.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={button.label}
              >
                {button.icon}
              </button>
            ))}
          </div>
          
          <div className="h-6 border-l border-gray-300"></div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onMovePrevious}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={onGoToToday}
              className="px-2 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              {viewMode === 'day' ? '今日' : viewMode === 'week' ? '今週' : '今月'}
            </button>
            <button
              onClick={onMoveNext}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end mb-2">
        {(viewMode === 'week' || viewMode === 'month') && (
          <button
            onClick={() => onShowWeekendChange(!showWeekend)}
            className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            {showWeekend ? '土日を非表示' : '土日を表示'}
            <span className="text-xs">
              {showWeekend ? '▼' : '▶'}
            </span>
          </button>
        )}
      </div>
    </>
  )
} 