'use client';

import { useState, useEffect } from 'react';

interface NotepadProps {
  onClose: () => void;
}

export const Notepad = ({ onClose }: NotepadProps) => {
  const [note, setNote] = useState<string>('');

  // ローカルストレージからメモを読み込む
  useEffect(() => {
    const savedNote = localStorage.getItem('userNote');
    if (savedNote) {
      setNote(savedNote);
    }
  }, []);

  // メモの変更を保存
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value;
    setNote(newNote);
    localStorage.setItem('userNote', newNote);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">メモ帳</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <textarea
        value={note}
        onChange={handleNoteChange}
        className="w-full h-40 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        placeholder="ここにメモを入力してください..."
      />
    </div>
  );
}; 