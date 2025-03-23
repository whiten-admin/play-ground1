'use client'

import React, { useState } from 'react'
import { Project } from '@/types/project'
import { FiEdit3, FiFileText, FiUpload } from 'react-icons/fi'

interface ProjectCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
}

type TabType = 'manual' | 'document'

export default function ProjectCreateModal({ isOpen, onClose, onCreateProject }: ProjectCreateModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('manual')
  const [projectData, setProjectData] = useState<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    phase: 'planning'
  })
  const [documentText, setDocumentText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
    resetForm()
  }

  const handleDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!documentText.trim() && !file) {
      alert('資料かテキストを入力してください')
      return
    }
    
    // 実際の環境では、ここでテキスト/ファイルを解析してプロジェクト情報を抽出する処理を行います
    // このデモでは、入力されたドキュメントから簡易的に情報を抽出する形で実装します
    setIsLoading(true)
    
    // 疑似的な処理待ち時間
    setTimeout(() => {
      let title = ''
      let description = ''
      
      if (documentText) {
        // テキストから最初の行をタイトルとして抽出
        const lines = documentText.split('\n').filter(line => line.trim())
        if (lines.length > 0) {
          title = lines[0].trim()
          // 2行目以降を説明として連結
          if (lines.length > 1) {
            description = lines.slice(1).join('\n').trim()
          }
        }
      } else if (file) {
        // ファイル名からタイトルを生成
        title = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")
        description = `${file.name}から生成されたプロジェクト`
      }
      
      // データが抽出できなかった場合のデフォルト値
      if (!title) title = '新規プロジェクト'
      
      const newProjectData = {
        ...projectData,
        title,
        description
      }
      
      setIsLoading(false)
      onCreateProject(newProjectData)
      onClose()
      resetForm()
    }, 1500)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setDocumentText('')
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDocumentText(e.target.value)
    setFile(null)
  }

  const resetForm = () => {
    // フォームをリセット
    setProjectData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      phase: 'planning'
    })
    setDocumentText('')
    setFile(null)
    setActiveTab('manual')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">新規プロジェクト作成</h2>
        
        {/* タブ切り替え */}
        <div className="flex border-b mb-4">
          <button
            className={`flex items-center py-2 px-4 ${
              activeTab === 'manual'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('manual')}
          >
            <FiEdit3 className="mr-2" />
            手動入力
          </button>
          <button
            className={`flex items-center py-2 px-4 ${
              activeTab === 'document'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('document')}
          >
            <FiFileText className="mr-2" />
            資料から生成
          </button>
        </div>
        
        {activeTab === 'manual' ? (
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
        ) : (
          <form onSubmit={handleDocumentSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロジェクト資料
              </label>
              <p className="text-sm text-gray-500">
                プロジェクト計画書やテキストを入力すると、自動的にプロジェクト情報を抽出します。
              </p>
              <span className='text-xs text-red-500'>※開発中のため実際にファイルを読み込むことはできません</span>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
                  <div className="text-center">
                    <FiUpload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-1 text-sm text-gray-500">
                      ファイルをアップロード
                    </p>
                    <label className="mt-2 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100">
                      <span>ファイルを選択</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                      />
                    </label>
                    {file && (
                      <p className="mt-2 text-sm text-gray-700">
                        選択されたファイル: {file.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      または
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    テキストを入力
                  </label>
                  <textarea
                    value={documentText}
                    onChange={handleTextChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={5}
                    placeholder="プロジェクト計画書や要約テキストを入力してください"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md"
                disabled={isLoading}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    生成中...
                  </>
                ) : '生成して作成'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
} 