'use client';

import React, { useRef, useEffect } from 'react';
import { IoCheckmarkCircle, IoCloseCircle, IoPersonOutline } from 'react-icons/io5';
import { useFilterContext } from '@/features/tasks/filters/FilterContext';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { getProjectUsers } from '@/utils/memberUtils';

export default function UserFilter() {
  const {
    currentUserId,
    selectedUserIds,
    showUnassigned,
    toggleUserSelection,
    setShowUnassigned,
    setSelectedUserIds
  } = useFilterContext();
  
  const { currentProject, getProjectMembers } = useProjectContext();
  
  // プロジェクトに所属するメンバーを取得
  const projectMembers = currentProject 
    ? getProjectMembers(currentProject.id)
    : [];
  
  // プロジェクトメンバーとユーザー情報を結合
  const projectMemberUsers = currentProject 
    ? projectMembers.map(member => {
        // プロジェクトユーザーを直接取得
        const projectUsers = getProjectUsers(currentProject.id);
        const user = projectUsers.find(user => user.id === member.userId);
        
        return {
          assigneeId: member.id,
          userId: member.userId,
          name: user ? user.name : '不明なユーザー',
          isCurrentUser: member.userId === currentUserId
        };
      })
    : [];
  
  // 自分を左端に配置するためにソート
  const sortedMemberUsers = [...projectMemberUsers].sort((a, b) => {
    if (a.isCurrentUser) return -1;
    if (b.isCurrentUser) return 1;
    return 0;
  });
  
  // 一括選択 - プロジェクトメンバーと未アサインを全て選択
  const selectAll = () => {
    const allMemberIds = projectMembers.map(member => member.id);
    setSelectedUserIds(allMemberIds);
    setShowUnassigned(true); // 未アサインも選択
  };
  
  // 一括解除 - 全て解除
  const deselectAll = () => {
    setSelectedUserIds([]);
    setShowUnassigned(false); // 未アサインも解除
  };
  
  // メンバー名を取得
  const getMemberName = (assigneeId: string): string => {
    const member = projectMemberUsers.find(m => m.assigneeId === assigneeId);
    return member ? member.name : '不明なメンバー';
  };
  
  return (
    <div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 mb-1 ml-1">メンバーフィルタ</span>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-3">
            <button
              onClick={selectAll}
              className="flex items-center gap-1 text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 border border-gray-200"
              title="全てのメンバーを選択"
            >
              <IoCheckmarkCircle className="w-3.5 h-3.5 text-green-600" />
              <span>全て</span>
            </button>
            <button
              onClick={deselectAll}
              className="flex items-center gap-1 text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 border border-gray-200"
              title="選択を全て解除"
            >
              <IoCloseCircle className="w-3.5 h-3.5 text-red-600" />
              <span>解除</span>
            </button>
          </div>
          
          {/* メンバーアイコン一覧 */}
          <div className="flex flex-wrap items-center gap-2">
            {sortedMemberUsers.map((member) => (
              <button
                key={member.assigneeId}
                onClick={() => toggleUserSelection(member.assigneeId)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  member.isCurrentUser
                    ? selectedUserIds.includes(member.assigneeId)
                      ? 'bg-orange-100 border-2 border-orange-400 text-orange-700'
                      : 'bg-orange-50 border border-gray-200 text-orange-700 opacity-80 hover:opacity-100'
                    : selectedUserIds.includes(member.assigneeId)
                      ? 'bg-blue-100 border-2 border-blue-400 text-blue-700'
                      : 'bg-blue-50 border border-gray-200 text-blue-700 opacity-60 hover:opacity-100'
                }`}
                title={`${member.name}${member.isCurrentUser ? ' (自分)' : ''}`}
              >
                {member.name.charAt(0)}
              </button>
            ))}
            
            {/* 未アサインの選択ボタン */}
            <button
              onClick={() => setShowUnassigned(!showUnassigned)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                showUnassigned
                  ? 'bg-gray-200 border-2 border-gray-400 text-gray-700'
                  : 'bg-gray-100 border border-gray-200 text-gray-600 opacity-60 hover:opacity-100'
              }`}
              title="未アサイン"
            >
              <IoPersonOutline className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 