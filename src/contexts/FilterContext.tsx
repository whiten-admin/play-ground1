'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  const [currentUserId, setCurrentUserId] = useState<string>("taro"); // 仮のユーザーID
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // 初期化時に自分のIDを選択状態にする
  useEffect(() => {
    setSelectedUserIds([currentUserId]);
  }, [currentUserId]);
  
  // ユーザー選択の切り替え
  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      // 自分自身は常に選択状態にする
      if (userId === currentUserId) return;
      
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