'use client';

import React, { useRef, useEffect } from 'react';
import { IoFilter, IoCaretDown } from 'react-icons/io5';
import { User } from '@/types/user';
import { getUserNameById, getAllUsers } from '@/utils/userUtils';
import { useFilterContext } from '@/contexts/FilterContext';

export default function UserFilter() {
  const {
    currentUserId,
    selectedUserIds,
    showUnassigned,
    isFilterOpen,
    toggleUserSelection,
    setShowUnassigned,
    setIsFilterOpen,
    setSelectedUserIds
  } = useFilterContext();
  
  const users = getAllUsers();
  const modalRef = useRef<HTMLDivElement>(null);
  
  // 外側をクリックしたときに閉じる処理
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setIsFilterOpen]);
  
  // 一括選択 - ユーザーと未アサインを全て選択
  const selectAll = () => {
    const allUserIds = users.map(user => user.id);
    setSelectedUserIds(allUserIds);
    setShowUnassigned(true); // 未アサインも選択
  };
  
  // 一括解除 - 自分も含めて全て解除
  const deselectAll = () => {
    setSelectedUserIds([]);
    setShowUnassigned(false); // 未アサインも解除
  };
  
  return (
    <div className="mb-4 relative">
      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-1 text-sm bg-blue-50 px-3 py-1 rounded hover:bg-blue-100"
        >
          <IoFilter className="w-4 h-4" />
          表示するメンバーを選択
          <IoCaretDown className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className="text-xs text-gray-500">
          現在の表示: {selectedUserIds.map(id => getUserNameById(id)).join(', ')}
          {showUnassigned ? '、未アサイン' : ''}
        </div>
      </div>
      
      {isFilterOpen && (
        <div 
          ref={modalRef}
          className="absolute top-10 left-0 z-50 p-3 bg-white rounded shadow-lg border min-w-[270px] max-w-[320px] animate-fadeIn"
        >
          <h3 className="text-sm font-medium mb-2 border-b pb-2">表示するメンバーを選択</h3>
          
          <div className="flex justify-between mb-2 text-xs">
            <button 
              onClick={selectAll}
              className="text-blue-600 hover:text-blue-800"
            >
              一括選択
            </button>
            <button 
              onClick={deselectAll}
              className="text-blue-600 hover:text-blue-800"
            >
              一括解除
            </button>
          </div>
          
          <div className="space-y-1.5 max-h-[250px] overflow-y-auto py-1">
            {users.map((user: User) => (
              <div key={user.id} className="flex items-center py-1 px-1 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  id={`user-${user.id}`}
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => toggleUserSelection(user.id)}
                  className="mr-2"
                />
                <label htmlFor={`user-${user.id}`} className="text-sm flex items-center gap-2 cursor-pointer flex-1">
                  {user.name}
                  {user.id === currentUserId && <span className="text-xs bg-blue-100 px-1 py-0.5 rounded">自分</span>}
                </label>
              </div>
            ))}
            <div className="flex items-center py-1 px-1 hover:bg-gray-50 rounded mt-1 border-t pt-2">
              <input
                type="checkbox"
                id="unassigned"
                checked={showUnassigned}
                onChange={() => setShowUnassigned(!showUnassigned)}
                className="mr-2"
              />
              <label htmlFor="unassigned" className="text-sm cursor-pointer flex-1">未アサイン</label>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end mt-3 pt-2 border-t">
            <button
              onClick={() => setIsFilterOpen(false)}
              className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 