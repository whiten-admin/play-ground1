'use client'

import React, { useState } from 'react'
import { Project } from '@/types/project'
import { User } from '@/types/user'
import { useProjectContext } from '@/contexts/ProjectContext'
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline'
import ProjectCreateModal from './ProjectCreateModal'

interface HeaderProps {
  onLogout?: () => void
  user?: User | null
}

export default function Header({ onLogout, user }: HeaderProps) {
  const { currentProject, projects, switchProject, createProject } = useProjectContext()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
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

  const remainingDays = currentProject?.endDate ? calculateRemainingDays(currentProject.endDate) : null

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

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleProjectSelect = (projectId: string) => {
    switchProject(projectId)
    setIsDropdownOpen(false)
  }
  
  const openCreateModal = () => {
    setIsCreateModalOpen(true)
    setIsDropdownOpen(false)
  }

  // プロジェクトがない場合の新規作成ボタン
  const handleCreateProjectButton = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <header className="bg-white border-b border-gray-200 py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {projects.length > 0 ? (
            <>
              <div className="relative">
                <button
                  className="flex items-center gap-1 text-lg font-bold text-gray-800 hover:text-gray-600 transition-colors"
                  onClick={toggleDropdown}
                >
                  {currentProject?.title || 'プロジェクト'} 
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <ul className="py-1">
                      {projects.map(project => (
                        <li key={project.id}>
                          <button
                            className={`w-full text-left px-3 py-2 text-sm ${currentProject?.id === project.id ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
                            onClick={() => handleProjectSelect(project.id)}
                          >
                            {project.title}
                          </button>
                        </li>
                      ))}
                      
                      <li className="border-t border-gray-100 mt-1">
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-1"
                          onClick={openCreateModal}
                        >
                          <PlusIcon className="h-4 w-4" />
                          <span>新規プロジェクト作成</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{formatDate(currentProject?.startDate)} - {formatDate(currentProject?.endDate)}</span>
                {remainingDays !== null && (
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    残り{remainingDays}日
                  </span>
                )}
              </div>
              
              <div className="text-red-600 font-semibold text-sm">
                PJ炎上リスク：50%
              </div>
            </>
          ) : (
            <div className="text-lg font-bold text-gray-800">
              プロジェクト新規作成
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
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
      
      {/* プロジェクト作成モーダル */}
      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={createProject}
      />
    </header>
  )
} 