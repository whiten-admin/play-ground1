'use client'

import React, { useState } from 'react'
import { Project } from '@/features/projects/types/project'
import { FiEdit3, FiFileText, FiUpload } from 'react-icons/fi'
import { extractTextFromPDF, extractProjectInfoFromText } from '@/services/api/utils/pdfUtils'
import { generateProjectTasks } from '@/services/api/utils/openai'
import { convertGeneratedTasksToTaskObjects } from '@/features/tasks/utils/taskUtils'
import { Task } from '@/features/tasks/types/task'
import { useTaskContext } from '@/features/tasks/contexts/TaskContext'

interface ProjectCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
}

type TabType = 'manual' | 'document'

// タスク生成確認ダイアログ
interface TaskGenerationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

function TaskGenerationDialog({ isOpen, onClose, onConfirm, isLoading }: TaskGenerationDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">タスク自動生成</h3>
        <p className="mb-4 text-gray-700">
          プロジェクトの情報から想定されるタスクを自動生成しますか？
          <br />
          プロジェクトの内容に基づいて、関連するタスクとTODOを自動的に作成します。
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md"
            disabled={isLoading}
          >
            いいえ
          </button>
          <button
            type="button"
            onClick={onConfirm}
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
            ) : 'はい、生成する'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectCreateModal({ isOpen, onClose, onCreateProject }: ProjectCreateModalProps) {
  const { addTask } = useTaskContext()
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
  const [extractedText, setExtractedText] = useState('')
  const [extractionError, setExtractionError] = useState('')
  
  // タスク生成関連の状態
  const [isTaskGenerationDialogOpen, setIsTaskGenerationDialogOpen] = useState(false)
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false)
  const [createdProjectData, setCreatedProjectData] = useState<Omit<Project, 'id' | 'createdAt' | 'updatedAt'> | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setProjectData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // プロジェクト情報を一時保存
    setCreatedProjectData(projectData)
    
    // タスク生成確認ダイアログを表示
    setIsTaskGenerationDialogOpen(true)
  }

  // プロジェクトを最終的に作成する処理
  const finalizeProjectCreation = (withTasks: boolean = false) => {
    if (!createdProjectData) return;
    
    // プロジェクトを作成
    onCreateProject(createdProjectData)
    
    // タスク生成ダイアログを閉じる
    setIsTaskGenerationDialogOpen(false)
    
    // モーダルを閉じる
    onClose()
    
    // フォームをリセット
    resetForm()
  }

  // タスク生成開始
  const handleGenerateTasks = async () => {
    if (!createdProjectData) return;
    
    try {
      setIsGeneratingTasks(true)
      
      // APIを使ってタスクを生成
      const generatedTasksData = await generateProjectTasks({
        title: createdProjectData.title,
        description: createdProjectData.description || '',
        startDate: createdProjectData.startDate,
        endDate: createdProjectData.endDate,
        phase: createdProjectData.phase
      })
      
      // プロジェクトを作成（IDを取得するため）
      onCreateProject(createdProjectData)
      
      // 少し遅延を入れてプロジェクトIDが確実に設定されるようにする
      setTimeout(() => {
        // プロジェクトIDを取得（ローカルストレージから）
        const projectId = localStorage.getItem('currentProjectId')
        
        if (projectId) {
          // 生成されたタスクをTaskオブジェクトに変換
          const tasks = convertGeneratedTasksToTaskObjects(generatedTasksData, projectId)
          
          // タスクを追加
          tasks.forEach(task => {
            addTask(task)
          })
          
          console.log(`${tasks.length}個のタスクが生成されました`)
        }
        
        // 処理完了
        setIsGeneratingTasks(false)
        setIsTaskGenerationDialogOpen(false)
        onClose()
        resetForm()
      }, 500)
    } catch (error) {
      console.error('タスク生成中にエラーが発生しました:', error)
      alert('タスクの生成中にエラーが発生しました。プロジェクトは作成されます。')
      
      // エラーが発生してもプロジェクトは作成する
      finalizeProjectCreation(false)
    }
  }

  // タスク生成をスキップ
  const skipTaskGeneration = () => {
    finalizeProjectCreation(false)
  }

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!documentText.trim() && !file && !extractedText) {
      alert('資料かテキストを入力してください')
      return
    }
    
    // 処理開始
    setIsLoading(true)
    setExtractionError('')
    
    try {
      let textToExtract = documentText
      
      // ファイルが選択されていて、まだテキスト抽出が行われていない場合
      if (file && !extractedText) {
        try {
          // PDFファイルの場合
          if (file.type === 'application/pdf') {
            const pdfText = await extractTextFromPDF(file)
            setExtractedText(pdfText)
            textToExtract = pdfText
          } 
          // テキストファイルの場合
          else if (file.type === 'text/plain') {
            const text = await file.text()
            setExtractedText(text)
            textToExtract = text
          }
          // その他のファイル形式の場合はファイル名のみ使用
          else {
            textToExtract = `プロジェクト名: ${file.name.replace(/\.[^/.]+$/, "")}\n説明: ${file.name}から生成されたプロジェクト`
          }
        } catch (error) {
          console.error('ファイルの解析中にエラーが発生しました:', error)
          const errorMessage = error instanceof Error ? error.message : '未知のエラー'
          setExtractionError(`ファイルの解析に失敗しました: ${errorMessage}\n別のファイルを試すか、テキストを直接入力してください。`)
          
          // エラーがあってもファイル名を使ってプロジェクト情報を生成
          if (file) {
            textToExtract = `プロジェクト名: ${file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}\n説明: ${file.name}から生成されたプロジェクト`
          }
          
          // 処理は続行（エラーメッセージを表示しつつ、ファイル名からプロジェクト情報を生成）
        }
      } else if (extractedText) {
        textToExtract = extractedText
      }
      
      // プロジェクト情報を抽出
      const { title, description } = extractProjectInfoFromText(textToExtract)
      
      // 現在の日付から開始日/終了日を設定（デモ用）
      const today = new Date()
      const startDate = today.toISOString().split('T')[0]
      
      // 終了日: 30日後
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 30)
      const endDateStr = endDate.toISOString().split('T')[0]
      
      const newProjectData = {
        ...projectData,
        title,
        description,
        startDate,
        endDate: endDateStr
      }
      
      // プロジェクト情報を一時保存
      setCreatedProjectData(newProjectData)
      
      // ローディング終了
      setIsLoading(false)
      
      // タスク生成確認ダイアログを表示
      setIsTaskGenerationDialogOpen(true)
    } catch (error) {
      console.error('プロジェクト情報の抽出中にエラーが発生しました:', error)
      setExtractionError('プロジェクト情報の抽出に失敗しました。手動入力を試してください。')
      setIsLoading(false)
    }
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
    setExtractedText('')
    setExtractionError('')
    setActiveTab('manual')
    setCreatedProjectData(null)
  }

  if (!isOpen) return null

  return (
    <>
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
                <p className="text-sm text-gray-500 mb-3">
                  プロジェクト計画書やテキストを入力すると、自動的にプロジェクト情報を抽出します。
                  <br />
                  <span className="text-xs text-red-500">※現在開発中のため機能しません</span>
                </p>
                
                {/* エラーメッセージ */}
                {extractionError && (
                  <div className="mb-3 p-2 bg-red-50 text-red-700 rounded-md text-sm">
                    {extractionError}
                  </div>
                )}
                
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
                          accept=".pdf,.txt"
                          onChange={handleFileChange}
                          disabled={isLoading}
                        />
                      </label>
                      {file && (
                        <p className="mt-2 text-sm text-gray-700">
                          選択されたファイル: {file.name}
                        </p>
                      )}
                      
                      {isLoading && file && (
                        <div className="mt-2 flex items-center justify-center text-sm text-gray-500">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          ファイルを解析中...
                        </div>
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
                  
                  {/* テキスト入力エリア */}
                  {!extractedText ? (
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
                        disabled={isLoading}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          抽出されたテキスト
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setExtractedText('');
                            setFile(null);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          クリア
                        </button>
                      </div>
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 max-h-48 overflow-y-auto text-sm">
                        <pre className="whitespace-pre-wrap">{extractedText.substring(0, 500)}{extractedText.length > 500 ? '...' : ''}</pre>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {extractedText.length > 500 ? `${extractedText.length}文字中 500文字を表示` : `${extractedText.length}文字`}
                      </p>
                    </div>
                  )}
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

      {/* タスク生成確認ダイアログ */}
      <TaskGenerationDialog
        isOpen={isTaskGenerationDialogOpen}
        onClose={skipTaskGeneration}
        onConfirm={handleGenerateTasks}
        isLoading={isGeneratingTasks}
      />
    </>
  )
} 