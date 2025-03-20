'use client'

import React from 'react'
import { Project } from '@/types/project'
import { User } from '@/types/user'

interface HeaderProps {
  onLogout?: () => void
  project?: Project
  user?: User | null
}

export default function Header({ onLogout, project, user }: HeaderProps) {
  const formatDate = (date: string | undefined) => {
    if (!date) return '未定'
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    })
  }

  const calculateRemainingDays = (endDate: string | undefined) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const today = new Date()
    // 時間部分を無視して日付のみで計算
    end.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const remainingDays = project?.endDate ? calculateRemainingDays(project.endDate) : null

  // ユーザーロールの日本語表示
  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'manager':
        return 'マネージャー'
      case 'member':
        return 'メンバー'
      default:
        return ''
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-800">{project?.title || 'プロジェクト'}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{formatDate(project?.startDate)} - {formatDate(project?.endDate)}</span>
            {remainingDays !== null && (
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                残り{remainingDays}日
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-red-600 font-semibold text-sm">
            PJ炎上リスク：50%
          </div>
          {user && (
            <div className="px-3 py-1 text-sm bg-gray-100 rounded-lg flex items-center gap-1">
              <span className="font-medium">{user.name}</span>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                {getRoleLabel(user.role)}
              </span>
            </div>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ログアウト
            </button>
          )}
        </div>
      </div>
    </header>
  )
} 