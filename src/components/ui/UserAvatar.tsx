'use client';

import React from 'react';
import { getProjectMemberName } from '@/utils/memberUtils';

interface UserAvatarProps {
  assigneeId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

// サイズに応じたクラスを返す関数
const getSizeClass = (size: string) => {
  switch (size) {
    case 'xs':
      return 'w-6 h-6 text-xs';
    case 'sm':
      return 'w-8 h-8 text-sm';
    case 'lg':
      return 'w-12 h-12 text-lg';
    case 'md':
    default:
      return 'w-10 h-10 text-base';
  }
};

// ユーザーアイコンの背景色をユーザーIDから決定する関数
const getBackgroundColor = (assigneeId: string) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
  ];
  
  // ユーザーIDの文字列をハッシュ化して色を決定
  const hash = assigneeId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  assigneeId,
  size = 'md',
  showTooltip = false,
  className = '',
}) => {
  if (!assigneeId) return null;
  
  const userName = getProjectMemberName(assigneeId);
  const initials = userName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  const sizeClass = getSizeClass(size);
  const bgColorClass = getBackgroundColor(assigneeId);
  
  return (
    <div className={`relative inline-flex ${className}`}>
      <div 
        className={`${sizeClass} ${bgColorClass} rounded-full flex items-center justify-center text-white font-medium`}
        title={showTooltip ? userName : undefined}
      >
        {initials}
      </div>
    </div>
  );
};

export default UserAvatar; 