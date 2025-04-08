'use client';

import { useState } from 'react';
import { Notepad } from './Notepad';
import { MeetingSummary } from './MeetingSummary';

export const FloatingTools = () => {
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [isMeetingSummaryOpen, setIsMeetingSummaryOpen] = useState(false);

  const toggleNotepad = () => {
    setIsNotepadOpen(!isNotepadOpen);
    if (isMeetingSummaryOpen) setIsMeetingSummaryOpen(false);
  };

  const toggleMeetingSummary = () => {
    setIsMeetingSummaryOpen(!isMeetingSummaryOpen);
    if (isNotepadOpen) setIsNotepadOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      {isNotepadOpen && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-2 w-80">
          <Notepad onClose={() => setIsNotepadOpen(false)} />
        </div>
      )}
      
      {isMeetingSummaryOpen && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-2 w-80">
          <MeetingSummary onClose={() => setIsMeetingSummaryOpen(false)} />
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={toggleNotepad}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
          aria-label="メモ帳"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        
        <button
          onClick={toggleMeetingSummary}
          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
          aria-label="会議要約取り込み"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        </button>
      </div>
    </div>
  );
}; 