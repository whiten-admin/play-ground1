'use client'

import React, { useState, useEffect } from 'react'
import { ScheduleHeaderProps } from '../types/schedule'
import { FaGoogle } from 'react-icons/fa'
import { IoSync } from 'react-icons/io5'

export default function ScheduleHeader({
  currentDate,
  viewMode,
  viewModeButtons,
  showWeekend,
  onViewModeChange,
  onShowWeekendChange,
  onMovePrevious,
  onMoveNext,
  onGoToToday,
  isGoogleIntegrated,
  onGoogleIntegrationChange
}: ScheduleHeaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [isIntegrated, setIsIntegrated] = useState(isGoogleIntegrated || false);
  
  // 親コンポーネントから変更があった場合に更新
  useEffect(() => {
    setIsIntegrated(isGoogleIntegrated);
  }, [isGoogleIntegrated]);
  
  // モーダルを表示する
  const handleShowModal = () => {
    setShowModal(true);
  };

  // モーダルを閉じる
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // 連携処理を実行
  const handleIntegrate = () => {
    // 連携ステータスを変更
    setIsIntegrated(true);
    
    // 親コンポーネントに通知
    if (onGoogleIntegrationChange) {
      onGoogleIntegrationChange();
    }
    
    // モーダルを閉じる
    setShowModal(false);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
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

          {(viewMode === 'week' || viewMode === 'month') && (
            <div className="flex items-center">
                <button
                  onClick={() => onShowWeekendChange(!showWeekend)}
                  className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  {showWeekend ? '土日を非表示' : '土日を表示'}
                  <span className="text-xs">
                    {showWeekend ? '▼' : '▶'}
                  </span>
                </button>
            </div>
          )}
        </div>
  
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
          
          {/* Googleカレンダー連携ボタン */}
          <button
            onClick={handleShowModal}
            className="flex items-center gap-1 p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
            title={isIntegrated ? "Googleカレンダーと同期" : "Googleカレンダーと連携"}
          >
            {isIntegrated ? (
              <>
                <IoSync className="text-[#4285F4]" />
                <span className="text-xs">同期</span>
              </>
            ) : (
              <>
                <FaGoogle className="text-[#4285F4]" />
                <span className="text-xs">連携</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 連携確認モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <FaGoogle className="text-[#4285F4] mr-2" />
              Googleカレンダー連携
            </h3>
            <p className="mb-4">
              {isIntegrated 
                ? "Googleカレンダーから予定を同期します。よろしいですか？" 
                : "Googleカレンダーと連携すると、Googleカレンダーの予定を取り込むことができます。連携しますか？"}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                onClick={handleIntegrate}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {isIntegrated ? "同期する" : "連携する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 