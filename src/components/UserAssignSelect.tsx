'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/types/user';
import { getAllUsers } from '@/utils/userUtils';
import { getUserNamesByIds } from '@/utils/userUtils';
import { theme } from '@/styles/theme';

interface UserAssignSelectProps {
  assigneeIds?: string[];
  onAssigneeChange: (assigneeIds: string[]) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const UserAssignSelect: React.FC<UserAssignSelectProps> = ({ 
  assigneeIds = [], 
  onAssigneeChange, 
  size = 'md' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const users = getAllUsers();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ドロップダウンの外側をクリックした時に閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ユーザーの選択状態を切り替える
  const toggleUser = (userId: string) => {
    if (assigneeIds.includes(userId)) {
      onAssigneeChange(assigneeIds.filter(id => id !== userId));
    } else {
      onAssigneeChange([...assigneeIds, userId]);
    }
  };

  const clearSelection = () => {
    onAssigneeChange([]);
  };

  // サイズに応じたクラス
  const buttonSizeClass = size === 'sm' 
    ? 'px-2 py-1 text-xs' 
    : size === 'lg' 
      ? 'px-4 py-2 text-base' 
      : 'px-3 py-1.5 text-sm';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`flex items-center justify-between w-full ${buttonSizeClass} border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {assigneeIds.length > 0 ? (
          <span className="truncate">
            {getUserNamesByIds(assigneeIds)}
          </span>
        ) : (
          <span className="text-gray-400">担当者を選択</span>
        )}
        <span className="ml-2">
          <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {assigneeIds.length > 0 && (
              <li>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                  onClick={clearSelection}
                >
                  選択解除
                </button>
              </li>
            )}
            {users.map((user: User) => (
              <li key={user.id}>
                <button
                  type="button"
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                    assigneeIds.includes(user.id) ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                  onClick={() => toggleUser(user.id)}
                >
                  {user.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserAssignSelect; 