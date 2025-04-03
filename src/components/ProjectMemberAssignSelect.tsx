'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { getProjectUsers, getProjectMemberName } from '@/utils/memberUtils';

interface ProjectMemberAssignSelectProps {
  assigneeId?: string;
  onAssigneeChange: (assigneeId: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const ProjectMemberAssignSelect: React.FC<ProjectMemberAssignSelectProps> = ({ 
  assigneeId = '', 
  onAssigneeChange, 
  size = 'md' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentProject, getProjectMembers } = useProjectContext();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 現在のプロジェクトのメンバーを取得
  const members = currentProject 
    ? getProjectMembers(currentProject.id)
    : [];

  // メンバー情報とユーザー情報を紐づけ
  const memberUsers = currentProject
    ? members.map(member => {
        // 各プロジェクトメンバーに対応するユーザー情報を取得
        const projectUsers = getProjectUsers(currentProject.id);
        const user = projectUsers.find(u => u.id === member.userId);
        
        return {
          assigneeId: member.id,
          userId: member.userId,
          name: user ? user.name : `ユーザーID: ${member.userId}`,
          role: member.role
        };
      })
    : [];

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

  // プロジェクトメンバーを選択
  const selectMember = (memberId: string) => {
    onAssigneeChange(memberId);
    setIsOpen(false);
  };

  // 選択を解除
  const clearSelection = () => {
    onAssigneeChange('');
    setIsOpen(false);
  };

  // 選択されているメンバーの名前を取得
  const getSelectedMemberName = () => {
    if (!assigneeId) return '';
    return getProjectMemberName(assigneeId);
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
        {assigneeId ? (
          <span className="truncate">
            {getSelectedMemberName()}
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
            {assigneeId && (
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
            {memberUsers.map((member) => (
              <li key={member.assigneeId}>
                <button
                  type="button"
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                    assigneeId === member.assigneeId ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                  onClick={() => selectMember(member.assigneeId)}
                >
                  {member.name}
                  <span className="ml-2 text-xs text-gray-500">
                    {member.role === 'manager' ? 'マネージャー' : 'メンバー'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProjectMemberAssignSelect; 