'use client';

import React from 'react';
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
    resetFilter
  } = useFilterContext();
  
  const users = getAllUsers();
  
  return (
    <div className="mb-4">
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
        <div className="p-4 bg-white rounded shadow-md mb-4 border">
          <h3 className="text-sm font-medium mb-2">表示するメンバーを選択</h3>
          <div className="space-y-2 mb-3">
            {users.map((user: User) => (
              <div key={user.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`user-${user.id}`}
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => toggleUserSelection(user.id)}
                  className="mr-2"
                  disabled={user.id === currentUserId} // 自分自身は無効化（常に選択状態）
                />
                <label htmlFor={`user-${user.id}`} className="text-sm flex items-center gap-2">
                  {user.name}
                  {user.id === currentUserId && <span className="text-xs bg-blue-100 px-1 py-0.5 rounded">自分</span>}
                </label>
              </div>
            ))}
            <div className="flex items-center mt-1 pt-1 border-t">
              <input
                type="checkbox"
                id="unassigned"
                checked={showUnassigned}
                onChange={() => setShowUnassigned(!showUnassigned)}
                className="mr-2"
              />
              <label htmlFor="unassigned" className="text-sm">未アサイン</label>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <button
              onClick={resetFilter}
              className="text-xs px-3 py-1 text-gray-600 hover:text-gray-800"
            >
              リセット
            </button>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 