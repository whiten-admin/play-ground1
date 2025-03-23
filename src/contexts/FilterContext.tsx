'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface FilterContextType {
  currentUserId: string;
  selectedUserIds: string[];
  showUnassigned: boolean;
  isFilterOpen: boolean;
  setCurrentUserId: (id: string) => void;
  setSelectedUserIds: (ids: string[]) => void;
  toggleUserSelection: (userId: string) => void;
  setShowUnassigned: (show: boolean) => void;
  setIsFilterOpen: (isOpen: boolean) => void;
  resetFilter: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // ログインユーザーのIDを設定
  useEffect(() => {
    if (user && user.id) {
      // 前のユーザーと違う場合はリセット
      if (currentUserId && currentUserId !== user.id) {
        setSelectedUserIds([]);
      }
      setCurrentUserId(user.id);
    } else {
      // ログアウト時は全てリセット
      setCurrentUserId("");
      setSelectedUserIds([]);
    }
  }, [user, currentUserId]);
  
  // 初期化時に自分のIDを選択状態にする
  useEffect(() => {
    if (currentUserId && selectedUserIds.length === 0) {
      setSelectedUserIds([currentUserId]);
    }
  }, [currentUserId, selectedUserIds]);
  
  // ユーザー選択の切り替え
  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedUserIds(prev => [...prev, userId]);
    }
  };
  
  // フィルターをリセット
  const resetFilter = () => {
    setSelectedUserIds([currentUserId]);
    setShowUnassigned(false);
  };

  return (
    <FilterContext.Provider value={{
      currentUserId,
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