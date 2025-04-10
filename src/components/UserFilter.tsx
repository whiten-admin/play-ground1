'use client';

import React, { useRef, useEffect } from 'react';
import { IoFilter, IoCaretDown } from 'react-icons/io5';
import { useFilterContext } from '@/features/tasks/filters/FilterContext';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { getProjectUsers } from '@/utils/memberUtils';

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
  
  // 選択中のメンバー名のリストを取得
  const getSelectedMemberNames = (): string => {
    return selectedUserIds
      .map(id => getMemberName(id))
      .join(', ');
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
          現在の表示: {getSelectedMemberNames()}
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
            {projectMemberUsers.map((member) => (
              <div key={member.assigneeId} className="flex items-center py-1 px-1 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  id={`member-${member.assigneeId}`}
                  checked={selectedUserIds.includes(member.assigneeId)}
                  onChange={() => toggleUserSelection(member.assigneeId)}
                  className="mr-2"
                />
                <label htmlFor={`member-${member.assigneeId}`} className="text-sm flex items-center gap-2 cursor-pointer flex-1">
                  {member.name}
                  {member.isCurrentUser && <span className="text-xs bg-blue-100 px-1 py-0.5 rounded">自分</span>}
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