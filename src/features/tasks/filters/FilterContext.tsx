'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@/services/auth/hooks/useAuth';

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
  
  // 初期化時のみ自分のIDを選択状態にする
  useEffect(() => {
    if (currentUserId && selectedUserIds.length === 0 && !initializedRef.current) {
      setSelectedUserIds([currentUserId]);
      initializedRef.current = true;
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