'use client'

import React, { useState } from 'react'
import ProjectCreateModal from './ProjectCreateModal'
import { Project } from '@/features/projects/types/project'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import { PlusIcon } from '@heroicons/react/24/outline'
import { getAllUsers } from '@/utils/memberUtils'
import { User } from '@/features/tasks/types/user'

interface EmptyProjectStateProps {
  onCreateProject: () => void;
}

export default function EmptyProjectState({ 
  onCreateProject,
}: EmptyProjectStateProps) {
  const { createProject } = useProjectContext()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // 全ユーザーデータを取得
  const allUsers = getAllUsers();
  
  // ユーザーデータをUser型に変換
  const convertedUsers: User[] = allUsers.map(user => ({
    id: user.id,
    name: user.name,
    role: user.role === 'manager' ? 'manager' : 'member'
  }));

  // モーダルを開く
  const openCreateModal = () => {
    setIsCreateModalOpen(true)
    // 親コンポーネントの関数も呼び出す
    onCreateProject();
  }

  // モーダルを閉じる
  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
  }

  // プロジェクト作成処理
  const handleCreateProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    createProject(projectData)
    closeCreateModal()
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mt-4">
      <svg
        className="w-16 h-16 text-gray-400 mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
        />
      </svg>
      
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        アサインされているプロジェクトがありません
      </h3>
      
      <p className="text-gray-500 mb-6 max-w-md">
        あなたがアサインされているプロジェクトがありません。新しいプロジェクトを作成するか、既存のプロジェクトにアサインされるのを待ちましょう。
      </p>
      
      <button
        onClick={openCreateModal}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        新しいプロジェクトを作成
      </button>

      {/* プロジェクト作成モーダル */}
      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onCreateProject={handleCreateProject}
        users={convertedUsers}
      />
    </div>
  )
} 