'use client'

import React, { useState, useEffect } from 'react'
import { Project } from '@/features/projects/types/project'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline'
import ProjectCreateModal from '@/features/projects/components/ProjectCreateModal'
import ProjectDetailModal from '@/features/projects/components/ProjectDetailModal'
import { getAllUsers, UserData } from '@/utils/memberUtils'

interface HeaderProps {
  onLogout?: () => void
  user?: UserData | null
  project?: Project
}

export default function Header({ onLogout, user, project }: HeaderProps) {
  const { currentProject, filteredProjects, switchProject, createProject, updateProject, getProjectMembers, getProjectUsers, resetToDefaultProjects } = useProjectContext()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isProjectDetailModalOpen, setIsProjectDetailModalOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  
  // projectプロパティが渡された場合はそちらを優先、なければcurrentProjectを使用
  const displayProject = project || currentProject
  
  // 全ユーザーデータを取得
  const allUsers = getAllUsers();
  
  // プロジェクトメンバー情報を取得
  const projectMembers = displayProject ? getProjectMembers(displayProject.id) : []
  const projectMemberUsers = displayProject 
    ? projectMembers.map(member => {
        const user = allUsers.find(u => u.id === member.userId);
        return user ? {
          id: user.id,
          name: user.name, 
          role: member.role
        } : null;
      }).filter(Boolean) as {id: string, name: string, role: string}[]
    : []

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
          {filteredProjects.length > 0 ? (
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
                      {filteredProjects.map(project => (
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
              
              {displayProject && projectMemberUsers.length > 0 && (
                <div className="flex items-center ml-4">
                  <div className="flex -space-x-2 mr-2">
                    {projectMemberUsers.slice(0, 3).map((memberUser) => (
                      <div key={memberUser.id} className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white text-xs font-medium text-gray-600">
                        {memberUser.name.charAt(0)}
                      </div>
                    ))}
                    {projectMemberUsers.length > 3 && (
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white text-xs font-medium text-gray-600">
                        +{projectMemberUsers.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {projectMemberUsers.length}人のメンバー
                  </span>
                </div>
              )}
              
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
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="px-3 py-1 text-sm bg-gray-100 rounded-lg flex items-center gap-1"
            >
              <span className="font-medium">{user?.name || 'ユーザー'}</span>
              {user && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  {getRoleLabel(user.role)}
                </span>
              )}
              <ChevronDownIcon className="h-3 w-3 ml-1" />
            </button>
            
            {/* ユーザー切り替えドロップダウン（デモ用） */}
            {isUserDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  <div className="px-3 py-2 text-xs text-gray-500 font-medium">
                    ユーザー切り替え（デモ用）
                  </div>
                  {allUsers.map(dummyUser => (
                    <button
                      key={dummyUser.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                      onClick={() => {
                        setIsUserDropdownOpen(false)
                        // ここで実際のユーザー切り替え処理を実装する
                      }}
                    >
                      <span>{dummyUser.name}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                        {getRoleLabel(dummyUser.role)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {onLogout && (
            <>
              <button
                onClick={onLogout}
                className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ログアウト
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* プロジェクト作成モーダル */}
      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={createProject}
        users={allUsers as any}
      />

      {/* プロジェクト詳細モーダル */}
      {displayProject && (
        <ProjectDetailModal
          isOpen={isProjectDetailModalOpen}
          onClose={() => setIsProjectDetailModalOpen(false)}
          project={displayProject}
          onUpdate={handleProjectUpdate}
          users={allUsers as any}
        />
      )}
    </header>
  )
} 