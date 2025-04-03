'use client'

import React, { useState } from 'react'
import { Project } from '@/features/projects/types/project'
import { User } from '@/features/tasks/types/user'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline'
import ProjectCreateModal from '@/features/projects/components/ProjectCreateModal'
import ProjectDetailModal from '@/features/projects/components/ProjectDetailModal'

interface HeaderProps {
  onLogout?: () => void
  user?: User | null
  project?: Project
}

export default function Header({ onLogout, user, project }: HeaderProps) {
  const { currentProject, projects, switchProject, createProject, updateProject } = useProjectContext()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isProjectDetailModalOpen, setIsProjectDetailModalOpen] = useState(false)
  
  // projectプロパティが渡された場合はそちらを優先、なければcurrentProjectを使用
  const displayProject = project || currentProject
  
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

  // プロジェクト情報の入力度を計算
  const calculateCompletionRate = (project: Project): number => {
    if (!project) return 0
    
    const requiredFields = [
      project.title,
      project.description,
      project.purpose,
      project.startDate,
      project.endDate,
      project.methodology,
      project.phase,
      project.scale,
      project.budget,
      project.client,
      project.projectManager,
      project.risks
    ]

    const filledFields = requiredFields.filter(field => field !== undefined && field !== '')
    return Math.round((filledFields.length / requiredFields.length) * 100)
  }

  const remainingDays = displayProject?.endDate ? calculateRemainingDays(displayProject.endDate) : null
  const completionRate = displayProject ? calculateCompletionRate(displayProject) : 0

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

  // プロジェクト詳細モーダルを開く
  const openProjectDetailModal = () => {
    setIsProjectDetailModalOpen(true)
  }

  // プロジェクト更新時の処理
  const handleProjectUpdate = (updatedProject: Project) => {
    // ProjectContextのupdateProject関数があればそれを呼び出す
    if (typeof updateProject === 'function') {
      updateProject(updatedProject)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {projects.length > 0 ? (
            <>
              <div className="relative">
                <button
                  className="flex flex-col items-start gap-0.5 hover:text-gray-600 transition-colors"
                  onClick={toggleDropdown}
                >
                  {displayProject?.code && (
                    <span className="text-xs text-gray-400 font-normal">{displayProject.code}</span>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-gray-800">{displayProject?.title || 'プロジェクト'}</span> 
                    <ChevronDownIcon className="h-4 w-4" />
                  </div>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <ul className="py-1">
                      {projects.map(project => (
                        <li key={project.id}>
                          <button
                            className={`w-full text-left px-3 py-2 text-sm ${displayProject?.id === project.id ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
                            onClick={() => handleProjectSelect(project.id)}
                          >
                            <div className="flex flex-col">
                              {project.code && (
                                <span className="text-xs text-gray-400">{project.code}</span>
                              )}
                              <span>{project.title}</span>
                            </div>
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
                <span>{formatDate(displayProject?.startDate)} - {formatDate(displayProject?.endDate)}</span>
                {remainingDays !== null && (
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    残り{remainingDays}日
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
              <button
                  onClick={openProjectDetailModal}
                  className="flex items-center gap-2 text-sm border border-gray-200 hover:bg-gray-50 rounded-md px-3 py-1.5 transition-all hover:shadow-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
                  title="クリックで詳細を表示"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center mb-0.5">
                      <span className="text-gray-700 mr-2 font-medium text-xs">情報入力度</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-blue-500">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-2 overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full ${
                            completionRate < 50 ? 'bg-red-500' : 
                            completionRate < 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                      <div className="flex items-center">
                        <span className={`text-xs font-bold ${
                          completionRate < 50 ? 'text-red-600' : 
                          completionRate < 80 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {completionRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  className="flex items-center gap-2 text-sm border border-gray-200 hover:bg-gray-50 rounded-md px-3 py-1.5 transition-all hover:shadow-sm"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center mb-0.5">
                      <span className="text-gray-700 mr-2 font-medium text-xs">炎上リスク</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-2 overflow-hidden shadow-inner">
                        <div 
                          className="h-full rounded-full bg-red-500"
                          style={{ width: `50%` }}
                        />
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs font-bold text-red-600">
                          50%
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
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

      {/* プロジェクト詳細モーダル */}
      {displayProject && (
        <ProjectDetailModal
          isOpen={isProjectDetailModalOpen}
          onClose={() => setIsProjectDetailModalOpen(false)}
          project={displayProject}
          onUpdate={handleProjectUpdate}
        />
      )}
    </header>
  )
} 