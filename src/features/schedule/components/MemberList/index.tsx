'use client';

import React from 'react';
import { useFilterContext } from '@/features/tasks/filters/FilterContext';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { getUserByProjectMemberId } from '@/utils/memberUtils';

interface MemberListProps {
  className?: string;
}

export default function MemberList({ className = '' }: MemberListProps) {
  const { projectMembers, currentProject } = useProjectContext();
  const { 
    selectedUserIds, 
    toggleUserSelection, 
    setSelectedUserIds, 
    showUnassigned,
    setShowUnassigned 
  } = useFilterContext();

  // 現在のプロジェクトのメンバーのみをフィルタリング
  const currentProjectMembers = currentProject 
    ? projectMembers.filter(member => member.projectId === currentProject.id)
    : [];

  // 全メンバーを選択する処理
  const handleSelectAll = () => {
    setSelectedUserIds(currentProjectMembers.map(member => member.id));
    setShowUnassigned(true);
  };

  // 全メンバーの選択を解除する処理
  const handleSelectNone = () => {
    setSelectedUserIds([]);
    setShowUnassigned(false);
  };

  // 未アサインの表示切り替え処理
  const handleToggleUnassigned = () => {
    setShowUnassigned(!showUnassigned);
  };

  // プロジェクトが選択されていない場合は何も表示しない
  if (!currentProject) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow p-3 ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold">メンバー</h3>
        <div className="flex space-x-2">
          <button 
            onClick={handleSelectAll}
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded"
          >
            全て
          </button>
          <button 
            onClick={handleSelectNone}
            className="text-xs bg-gray-300 hover:bg-gray-400 text-gray-700 py-1 px-2 rounded"
          >
            解除
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {currentProjectMembers.map(member => {
          const user = getUserByProjectMemberId(member.id);
          const isSelected = selectedUserIds.includes(member.id);
          
          return (
            <div 
              key={member.id} 
              className={`flex items-center justify-between py-2 px-3 rounded cursor-pointer transition ${
                isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
              }`}
              onClick={() => toggleUserSelection(member.id)}
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm">{user?.name || '不明なユーザー'}</span>
              </div>
              <div className="text-xs text-gray-500">{member.role}</div>
            </div>
          );
        })}

        {/* 未アサインの表示切り替え */}
        <div 
          className={`flex items-center justify-between py-2 px-3 rounded cursor-pointer transition ${
            showUnassigned ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
          }`}
          onClick={handleToggleUnassigned}
        >
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${showUnassigned ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm">未アサイン</span>
          </div>
        </div>
      </div>
    </div>
  );
} 