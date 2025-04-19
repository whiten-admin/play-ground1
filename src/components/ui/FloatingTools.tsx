'use client';

import { useState } from 'react';
import { Notepad } from './Notepad';
import { TaskFromMinutes } from './TaskFromMinutes';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';

export const FloatingTools = () => {
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [isTaskFromMinutesOpen, setIsTaskFromMinutesOpen] = useState(false);
  const { filteredProjects, currentProject } = useProjectContext();
  
  // プロジェクトが存在するかどうかをチェック
  const hasProjects = filteredProjects.length > 0;

  const toggleNotepad = () => {
    setIsNotepadOpen(!isNotepadOpen);
    if (isTaskFromMinutesOpen) setIsTaskFromMinutesOpen(false);
  };

  const toggleTaskFromMinutes = () => {
    setIsTaskFromMinutesOpen(!isTaskFromMinutesOpen);
    if (isNotepadOpen) setIsNotepadOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      {isNotepadOpen && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-2 w-80">
          <div className="mb-3 p-2 bg-yellow-100 text-yellow-800 text-xs rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            この機能は開発途中です。一部の機能が制限されている場合があります。
          </div>
          <Notepad onClose={() => setIsNotepadOpen(false)} />
        </div>
      )}
      
      {isTaskFromMinutesOpen && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-2 w-[800px] max-h-[90vh] overflow-auto">
          <div className="mb-3 p-2 bg-yellow-100 text-yellow-800 text-xs rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            この機能は開発途中です。一部の機能が制限されている場合があります。
          </div>
          <TaskFromMinutes onClose={() => setIsTaskFromMinutesOpen(false)} />
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={toggleNotepad}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md w-12 h-12 flex items-center justify-center shadow-lg relative group"
          aria-label="メモ帳"
        >
          <span className="absolute bottom-full mb-2 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            メモ機能（開発中）
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        
        {/* プロジェクトが存在する場合のみ議事録からタスク生成ボタンを表示 */}
        {hasProjects && (
          <button
            onClick={toggleTaskFromMinutes}
            className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full w-12 h-12 flex items-center justify-center shadow-lg relative group"
            aria-label="議事録からタスク生成"
          >
            <span className="absolute bottom-full mb-2 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              議事録からタスク生成（開発中）
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 3l.5 1.5h1.5l-1.25 1 .5 1.5-1.25-.75-1.25.75.5-1.5L16 4.5h1.5z" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}; 