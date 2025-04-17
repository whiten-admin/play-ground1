'use client';

import React from 'react';
import UserAvatar from './UserAvatar';

interface UserAvatarGroupProps {
  assigneeIds: string[];
  size?: 'xs' | 'sm' | 'md' | 'lg';
  maxAvatars?: number;
  showTooltip?: boolean;
  className?: string;
}

export const UserAvatarGroup: React.FC<UserAvatarGroupProps> = ({
  assigneeIds = [],
  size = 'md',
  maxAvatars = 3,
  showTooltip = false,
  className = '',
}) => {
  if (!assigneeIds.length) return null;
  
  // 重複を除去
  const uniqueIds = Array.from(new Set(assigneeIds));
  
  // 表示するアバターとその他の数
  const visibleAvatars = uniqueIds.slice(0, maxAvatars);
  const additionalCount = Math.max(0, uniqueIds.length - maxAvatars);
  
  // 重なり具合を計算（サイズによって調整）
  const getOverlapClass = () => {
    switch (size) {
      case 'xs':
        return '-ml-2';
      case 'sm':
        return '-ml-3';
      case 'lg':
        return '-ml-5';
      case 'md':
      default:
        return '-ml-4';
    }
  };
  
  const overlapClass = getOverlapClass();
  
  return (
    <div className={`flex items-center ${className}`}>
      {visibleAvatars.map((assigneeId, index) => (
        <div
          key={assigneeId}
          className={`${index > 0 ? overlapClass : ''} ${
            index > 0 ? 'border-2 border-white rounded-full' : ''
          }`}
          style={{ zIndex: 10 - index }}
        >
          <UserAvatar
            assigneeId={assigneeId}
            size={size}
            showTooltip={showTooltip}
          />
        </div>
      ))}
      
      {additionalCount > 0 && (
        <div
          className={`${overlapClass} border-2 border-white rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium`}
          style={{
            width: size === 'xs' ? '1.5rem' : size === 'sm' ? '2rem' : size === 'lg' ? '3rem' : '2.5rem',
            height: size === 'xs' ? '1.5rem' : size === 'sm' ? '2rem' : size === 'lg' ? '3rem' : '2.5rem',
            fontSize: size === 'xs' ? '0.65rem' : size === 'sm' ? '0.75rem' : size === 'lg' ? '1rem' : '0.875rem',
            zIndex: 10 - visibleAvatars.length
          }}
          title={showTooltip ? `他${additionalCount}人` : undefined}
        >
          +{additionalCount}
        </div>
      )}
    </div>
  );
};

export default UserAvatarGroup; 