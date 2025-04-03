'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@/services/auth/hooks/useAuth';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { getCurrentUserProjectMemberId } from '@/features/projects/utils/projectMemberUtils';

interface FilterContextType {
  currentUserId: string;
  currentProjectId: string | null;
  selectedUserIds: string[]; // これはプロジェクトメンバーIDのリスト
  showUnassigned: boolean;
  isFilterOpen: boolean;
  setCurrentUserId: (id: string) => void;
  setSelectedUserIds: (ids: string[]) => void;
  toggleUserSelection: (memberId: string) => void;
  setShowUnassigned: (show: boolean) => void;
  setIsFilterOpen: (isOpen: boolean) => void;
  resetFilter: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { currentProject, projectMembers } = useProjectContext();
  
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const initializedRef = useRef<boolean>(false);
  
  // ログインユーザーのIDを設定
  useEffect(() => {
    if (user && user.id) {
      // 前のユーザーと違う場合はリセット
      if (currentUserId && currentUserId !== user.id) {
        setSelectedUserIds([]);
        initializedRef.current = false;
      }
      setCurrentUserId(user.id);
    } else {
      // ログアウト時は全てリセット
      setCurrentUserId("");
      setSelectedUserIds([]);
      initializedRef.current = false;
    }
  }, [user, currentUserId]);
  
  // 現在のプロジェクトが変更されたときにプロジェクトIDを更新
  useEffect(() => {
    if (currentProject) {
      // プロジェクトが変更された場合、フィルターをリセット
      if (currentProjectId !== currentProject.id) {
        setSelectedUserIds([]);
        initializedRef.current = false;
      }
      setCurrentProjectId(currentProject.id);
    } else {
      setCurrentProjectId(null);
    }
  }, [currentProject, currentProjectId]);
  
  // 初期化時には自分のプロジェクトメンバーIDを選択状態にする
  useEffect(() => {
    // ユーザーとプロジェクトが両方設定されていて、フィルターが初期化されていない場合
    if (currentUserId && currentProjectId && selectedUserIds.length === 0 && !initializedRef.current) {
      // 現在のユーザーのプロジェクトメンバーIDを取得
      const currentMemberId = getCurrentUserProjectMemberId(
        currentProjectId, 
        currentUserId,
        projectMembers
      );
      
      // プロジェクトメンバーが存在すれば選択状態に
      if (currentMemberId) {
        setSelectedUserIds([currentMemberId]);
        initializedRef.current = true;
      }
    }
  }, [currentUserId, currentProjectId, selectedUserIds, projectMembers]);
  
  // ユーザー選択の切り替え
  const toggleUserSelection = (memberId: string) => {
    if (selectedUserIds.includes(memberId)) {
      setSelectedUserIds(prev => prev.filter(id => id !== memberId));
    } else {
      setSelectedUserIds(prev => [...prev, memberId]);
    }
  };
  
  // フィルターをリセット - 自分のプロジェクトメンバーIDを選択
  const resetFilter = () => {
    if (currentUserId && currentProjectId) {
      const currentMemberId = getCurrentUserProjectMemberId(
        currentProjectId,
        currentUserId,
        projectMembers
      );
      
      if (currentMemberId) {
        setSelectedUserIds([currentMemberId]);
      } else {
        setSelectedUserIds([]);
      }
    } else {
      setSelectedUserIds([]);
    }
    setShowUnassigned(false);
  };

  return (
    <FilterContext.Provider value={{
      currentUserId,
      currentProjectId,
      selectedUserIds,
      showUnassigned,
      isFilterOpen,
      setCurrentUserId,
      setSelectedUserIds,
      toggleUserSelection,
      setShowUnassigned,
      setIsFilterOpen,
      resetFilter
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
}; 