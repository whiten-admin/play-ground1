'use client'

import React, { useState } from 'react'
import { Project } from '@/types/project'

interface ProjectCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
}

export default function ProjectCreateModal({ isOpen, onClose, onCreateProject }: ProjectCreateModalProps) {
  const [projectData, setProjectData] = useState<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    phase: 'planning'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setProjectData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateProject(projectData)
    onClose()
    // フォームをリセット
    setProjectData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      phase: 'planning'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">新規プロジェクト作成</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
              プロジェクト名<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={projectData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
              説明
            </label>
            <textarea
              id="description"
              name="description"
              value={projectData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="startDate">
                開始日
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={projectData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="endDate">
                終了日
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={projectData.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phase">
              フェーズ
            </label>
            <select
              id="phase"
              name="phase"
              value={projectData.phase}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="planning">企画</option>
              <option value="requirements">要件定義</option>
              <option value="design">設計</option>
              <option value="development">開発</option>
              <option value="testing">テスト</option>
              <option value="deployment">リリース</option>
              <option value="maintenance">保守運用</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              作成
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 