'use client';

import React from 'react';
import { useFilterContext } from '@/features/tasks/filters/FilterContext';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { getUserByProjectMemberId } from '@/utils/memberUtils';

interface MemberListProps {
  className?: string;
}

// メンバーのインターフェース定義
interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
}

interface AllProjectsUserData {
  userId: string;
  name: string;
  memberIds: string[];
  projectIds: string[];
  roles: string[];
}

export default function MemberList({ className = '' }: MemberListProps) {
  const { projectMembers, currentProject, isAllProjectsMode } = useProjectContext();
  const { 
    selectedUserIds, 
    toggleUserSelection, 
    setSelectedUserIds, 
    showUnassigned,
    setShowUnassigned 
  } = useFilterContext();

  // 表示するメンバーリストを生成
  const filteredMembers = React.useMemo(() => {
    if (isAllProjectsMode) {
      // ユーザーIDでメンバーをグループ化（一意のユーザーリスト）
      const userMap = new Map();
      
      projectMembers.forEach(member => {
        const user = getUserByProjectMemberId(member.id);
        if (user) {
          // ユーザーIDをキーとして、そのユーザーのプロジェクトメンバー情報を配列で保持
          if (!userMap.has(user.id)) {
            userMap.set(user.id, {
              userId: user.id,
              name: user.name,
              memberIds: [member.id], // 各プロジェクトでのメンバーID
              projectIds: [member.projectId], // 所属プロジェクトID
              roles: [member.role] // 各プロジェクトでの役割
            });
          } else {
            // 既存のユーザー情報に新しいプロジェクトメンバー情報を追加
            const existingUser = userMap.get(user.id);
            existingUser.memberIds.push(member.id);
            existingUser.projectIds.push(member.projectId);
            existingUser.roles.push(member.role);
          }
        }
      });
      
      // ユーザー単位の一意のリストを返す
      return Array.from(userMap.values());
    } else {
      // 個別プロジェクトモードでは、そのプロジェクトのメンバーのみ
      return currentProject 
        ? projectMembers.filter(member => member.projectId === currentProject.id)
        : [];
    }
  }, [isAllProjectsMode, projectMembers, currentProject]);

  // 全メンバーを選択する処理
  const handleSelectAll = () => {
    if (isAllProjectsMode) {
      // 全プロジェクトモードでは、全ユーザーの全プロジェクトのメンバーIDを選択
      const allMemberIds = filteredMembers.flatMap(user => user.memberIds);
      setSelectedUserIds(allMemberIds);
    } else {
      // 個別プロジェクトモードでは、そのプロジェクトのメンバーIDのみを選択
      setSelectedUserIds(filteredMembers.map(member => member.id));
    }
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

  // プロジェクトが選択されておらず、かつプロジェクト全体モードでもない場合は何も表示しない
  if (!currentProject && !isAllProjectsMode) {
    return null;
  }

  // メンバー選択処理（プロジェクト全体モードとプロジェクト個別モードで処理を分ける）
  const handleToggleMember = (member: ProjectMember | AllProjectsUserData) => {
    if (isAllProjectsMode) {
      // 全プロジェクトモードでは、そのユーザーの全プロジェクトでのメンバーIDを取得
      const userMember = member as AllProjectsUserData;
      const allMemberIds = userMember.memberIds;
      
      // 全てのプロジェクトメンバーIDのうち、1つでも選択されていれば全て選択されているとみなす
      const anySelected = allMemberIds.some(id => selectedUserIds.includes(id));
      
      if (anySelected) {
        // 1つでも選択されていれば、そのユーザーの全てのメンバーIDを選択解除
        setSelectedUserIds(selectedUserIds.filter(id => !allMemberIds.includes(id)));
      } else {
        // 1つも選択されていなければ、そのユーザーの全てのメンバーIDを選択追加
        setSelectedUserIds([...selectedUserIds, ...allMemberIds]);
      }
    } else {
      // 個別プロジェクトモードでは、そのメンバーIDだけをトグル
      const projectMember = member as ProjectMember;
      toggleUserSelection(projectMember.id);
    }
  };

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
        {filteredMembers.map((member, index) => {
          // 表示・クリック時の扱いをモードによって変更
          let isSelected;
          let displayName;
          let displayProjectId;
          let role;
          
          if (isAllProjectsMode) {
            // 全プロジェクトモード：メンバーIDの配列のいずれかが選択されているか確認
            isSelected = member.memberIds.some((id: string) => selectedUserIds.includes(id));
            displayName = member.name;
            displayProjectId = member.projectIds.length > 1 
              ? `${member.projectIds.length}プロジェクト` 
              : member.projectIds[0].substring(0, 4);
            role = member.roles.length > 1 && new Set(member.roles).size > 1 
              ? '複数役割' 
              : member.roles[0];
          } else {
            // 個別プロジェクトモード：そのメンバーIDが選択されているか確認
            isSelected = selectedUserIds.includes(member.id);
            displayName = getUserByProjectMemberId(member.id)?.name || '不明なユーザー';
            displayProjectId = null;
            role = member.role;
          }
          
          return (
            <div 
              key={isAllProjectsMode ? `user-${member.userId}` : member.id} 
              className={`flex items-center justify-between py-2 px-3 rounded cursor-pointer transition ${
                isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleToggleMember(member)}
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm">{displayName}</span>
              </div>
              <div className="text-xs text-gray-500">
                {isAllProjectsMode && displayProjectId && (
                  <span className="mr-1 text-gray-400">
                    {displayProjectId}
                  </span>
                )}
                {role}
              </div>
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