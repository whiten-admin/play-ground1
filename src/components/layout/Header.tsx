'use client'

import React, { useState } from 'react'
import { Project } from '@/features/projects/types/project'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline'
import ProjectCreateModal from '@/features/projects/components/ProjectCreateModal'
import ProjectDetailModal from '@/features/projects/components/ProjectDetailModal'
import { getAllUsers } from '@/utils/memberUtils'
import { User, UserRole } from '@/features/tasks/types/user'
import ProjectProgressIndicator from '@/components/ProjectProgressIndicator'

interface HeaderProps {
  onLogout?: () => void
  user?: User | null
  project?: Project
}

export default function Header({ onLogout, user, project }: HeaderProps) {
  const { currentProject, filteredProjects, switchProject, createProject, updateProject, getProjectMembers, isAllProjectsMode } = useProjectContext()
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

  const remainingDays = displayProject?.endDate ? calculateRemainingDays(displayProject.endDate) : null

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

  const handleProjectSelect = (projectId: string | null) => {
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
    <header className={`${isAllProjectsMode ? 'bg-blue-50' : 'bg-white'} border-b border-gray-200 py-2 px-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {filteredProjects.length > 0 ? (
            <>
              <div className="relative">
                <button
                  className="flex flex-col items-start gap-0.5 hover:text-gray-600 transition-colors"
                  onClick={toggleDropdown}
                >
                  {isAllProjectsMode ? (
                    <span className="text-xs text-gray-400 font-normal">全プロジェクト</span>
                  ) : displayProject?.code && (
                    <span className="text-xs text-gray-400 font-normal">{displayProject.code}</span>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-gray-800">
                      {isAllProjectsMode ? 'プロジェクト全体' : (displayProject?.title || 'プロジェクト')}
                    </span> 
                    <ChevronDownIcon className="h-4 w-4" />
                  </div>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <ul className="py-1">
                      <li>
                        <button
                          className={`w-full text-left px-3 py-2 text-sm ${isAllProjectsMode ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
                          onClick={() => handleProjectSelect(null)}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">全プロジェクト</span>
                            <span>プロジェクト全体</span>
                          </div>
                        </button>
                      </li>
                      
                      <li className="border-t border-gray-100 mt-1 pt-1">
                        <div className="px-3 py-1">
                          <span className="text-xs text-gray-500">個別プロジェクト</span>
                        </div>
                      </li>
                      
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
              
              {!isAllProjectsMode && (
                <>
                  <div className="flex flex-col ml-2">
                    <span className="text-xs text-gray-500">{formatDate(displayProject?.startDate)} - {formatDate(displayProject?.endDate)}</span>
                    {remainingDays !== null && (
                      <span className="text-xs text-blue-600 font-medium">
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
                  
                  {/* プロジェクト進捗状況を表示 */}
                  {displayProject && (
                    <div className="ml-4 border-l pl-4 flex-shrink-0">
                      <ProjectProgressIndicator compact={true} />
                    </div>
                  )}
                </>
              )}
              
              {isAllProjectsMode && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    全{filteredProjects.length}プロジェクト
                  </span>
                </div>
              )}
            </>
          ) : (
            // プロジェクトが1つもない場合
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-gray-800">プロジェクト管理</h1>
              <button
                onClick={handleCreateProjectButton}
                className="ml-4 inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                新規プロジェクト
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {user && (
            <div className="relative">
              <button 
                className="flex items-center space-x-2 rounded-full p-1 hover:bg-gray-100 group"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shadow">
                  <span className="text-gray-700 text-sm font-medium">{user.name.charAt(0)}</span>
                </div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900 hidden sm:block">{user.name}</span>
                <ChevronDownIcon className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
              </button>
              
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-700">{user.name}</div>
                    <div className="text-xs text-gray-500">{getRoleLabel(user.role)}</div>
                  </div>
                  
                  {onLogout && (
                    <button
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setIsUserDropdownOpen(false)
                        onLogout()
                      }}
                    >
                      ログアウト
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* プロジェクト作成モーダル */}
      {isCreateModalOpen && (
        <ProjectCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateProject={createProject}
          users={allUsers.map(u => ({
            id: u.id,
            name: u.name,
            role: u.role as UserRole
          }))}
        />
      )}
      
      {/* プロジェクト詳細モーダル */}
      {isProjectDetailModalOpen && displayProject && (
        <ProjectDetailModal
          isOpen={isProjectDetailModalOpen}
          onClose={() => setIsProjectDetailModalOpen(false)}
          project={displayProject}
          onUpdate={handleProjectUpdate}
          users={allUsers.map(u => ({
            id: u.id,
            name: u.name,
            role: u.role as UserRole
          }))}
        />
      )}
    </header>
  )
} 