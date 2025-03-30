'use client'

import React, { useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import ProjectCreateModal from './ProjectCreateModal'
import { Project } from '@/features/projects/types/project'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'

export default function EmptyProjectState() {
  const { createProject } = useProjectContext()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // モーダルを開く
  const openCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  // モーダルを閉じる
  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
  }

  // プロジェクト作成処理
  const handleCreateProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    createProject(projectData)
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-lg w-full text-center">
        <div className="mb-6">
          <div className="mx-auto bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mb-4">
            <FiPlus className="text-blue-600 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold mb-2">プロジェクトがありません</h2>
          <p className="text-gray-600 mb-6">
            タスクやTODOを管理するためには、まずプロジェクトを作成してください。
            プロジェクトはタスクを整理し、効率的に作業を進めるための基盤となります。
          </p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center justify-center mx-auto"
        >
          <FiPlus className="mr-2" />
          新しいプロジェクトを作成
        </button>
      </div>

      {/* プロジェクト作成モーダル */}
      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
} 