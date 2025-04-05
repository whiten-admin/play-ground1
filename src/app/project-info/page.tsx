'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import { formatProjectInfo, extractProjectInfoFromFile } from '@/services/api/utils/openai'
import { extractTextFromFile } from '@/services/api/utils/fileParser'
import { Project } from '@/features/projects/types/project'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuth } from '@/services/auth/hooks/useAuth'
import Auth from '@/services/auth/components/Auth'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { IoPencil, IoEye } from 'react-icons/io5'

// 情報入力項目の定義
interface CompletionItem {
  name: string;
  isComplete: boolean;
}

export default function ProjectInfo() {
  const { currentProject } = useProjectContext()
  const { isAuthenticated, user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('project-info')
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [originalText, setOriginalText] = useState('')
  const [summaryText, setSummaryText] = useState('')
  const [isFormatting, setIsFormatting] = useState(false)
  const [formatError, setFormatError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [completionRate, setCompletionRate] = useState(0)
  const [completionItems, setCompletionItems] = useState<CompletionItem[]>([])

  // プロジェクトが変更されたときに初期化
  useEffect(() => {
    if (currentProject && !isInitialized) {
      const text = generateProjectText(currentProject)
      setOriginalText(text)
      setSummaryText(text) // 初期状態では要約テキストも同じ内容に設定
      setIsInitialized(true)
      setFormatError(null)
      
      // 情報入力度を計算
      const { rate, items } = calculateCompletionRate(currentProject)
      setCompletionRate(rate)
      setCompletionItems(items)
    }
  }, [currentProject, isInitialized])

  // プロジェクト情報が変更されたらテキストを更新
  useEffect(() => {
    if (isInitialized && currentProject) {
      const text = generateProjectText(currentProject)
      setOriginalText(text)
      // 要約テキストが原文と同じ場合のみ更新（編集されている場合は更新しない）
      if (summaryText === originalText) {
        setSummaryText(text)
      }
      
      // 情報入力度を計算
      const { rate, items } = calculateCompletionRate(currentProject)
      setCompletionRate(rate)
      setCompletionItems(items)
    }
  }, [currentProject, isInitialized, originalText, summaryText])

  // プロジェクト情報の入力度を計算
  const calculateCompletionRate = (project: Project): { rate: number; items: CompletionItem[] } => {
    const items: CompletionItem[] = [
      { name: 'プロジェクト名', isComplete: !!project.title },
      { name: 'プロジェクトコード', isComplete: !!project.code },
      { name: '開始日', isComplete: !!project.startDate },
      { name: '終了日', isComplete: !!project.endDate },
      { name: '概要', isComplete: !!project.description && project.description.length > 10 },
      { name: '目的', isComplete: !!project.purpose && project.purpose.length > 10 },
      { name: '開発手法', isComplete: !!project.methodology },
      { name: '開発フェーズ', isComplete: !!project.phase },
      { name: '開発規模', isComplete: !!project.scale },
      { name: '予算', isComplete: !!project.budget },
      { name: 'クライアント', isComplete: !!project.client },
      { name: 'プロジェクトマネージャー', isComplete: !!project.projectManager },
      { name: 'リスク・課題', isComplete: !!project.risks && project.risks.length > 10 }
    ]

    const completedCount = items.filter(item => item.isComplete).length
    const rate = Math.round((completedCount / items.length) * 100)

    return { rate, items }
  }

  // フェーズのラベルを取得
  const getPhaseLabel = (phase: Project['phase']) => {
    const phaseLabels: Record<NonNullable<Project['phase']>, string> = {
      planning: '企画',
      requirements: '要件定義',
      design: '設計',
      development: '開発',
      testing: 'テスト',
      deployment: 'リリース',
      maintenance: '保守運用'
    }
    return phase ? phaseLabels[phase] : '未設定'
  }

  // 開発手法のラベルを取得
  const getMethodologyLabel = (methodology: Project['methodology']) => {
    const methodologyLabels: Record<NonNullable<Project['methodology']>, string> = {
      waterfall: 'ウォーターフォール',
      agile: 'アジャイル',
      hybrid: 'ハイブリッド'
    }
    return methodology ? methodologyLabels[methodology] : '未設定'
  }

  // テキスト表示用のプロジェクト情報を生成
  const generateProjectText = (project: Project) => {
    return `
# ${project.title || 'プロジェクト名未設定'}
${project.code ? `プロジェクトコード: ${project.code}` : ''}
期間: ${project.startDate || '未定'} 〜 ${project.endDate || '未定'}

## プロジェクト概要
${project.description || '概要情報はまだ入力されていません。'}

## 目的
${project.purpose || '目的情報はまだ入力されていません。'}

## 開発情報
- 開発手法: ${getMethodologyLabel(project.methodology)}
- 開発フェーズ: ${getPhaseLabel(project.phase)}
- 開発規模: ${project.scale ? `${project.scale}人月` : '未設定'}
- 予算: ${project.budget ? `${project.budget}万円` : '未設定'}

## ステークホルダー情報
- クライアント: ${project.client || '未設定'}
- プロジェクトマネージャー: ${project.projectManager || '未設定'}

## リスク・課題
${project.risks || 'リスク・課題情報はまだ入力されていません。'}
    `.trim()
  }

  // プロジェクト情報テキストの変更を処理
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSummaryText(e.target.value)
  }

  // ChatGPTを使用してテキストを整形
  const handleFormatText = async () => {
    if (!originalText.trim()) return

    setIsFormatting(true)
    setFormatError(null)

    try {
      const formattedText = await formatProjectInfo(originalText)
      setSummaryText(formattedText)
      setViewMode('edit')
    } catch (error) {
      setFormatError(error instanceof Error ? error.message : '整形中にエラーが発生しました')
    } finally {
      setIsFormatting(false)
    }
  }

  // ファイルアップロード処理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    setUploadError(null)
    
    try {
      // ファイルからテキストを抽出
      const fileText = await extractTextFromFile(file)
      
      // プロジェクト情報を抽出
      const projectInfo = await extractProjectInfoFromFile(fileText, file.name)
      
      setOriginalText(fileText)
      setSummaryText(projectInfo)
      setViewMode('edit')
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'ファイル処理中にエラーが発生しました')
    } finally {
      setIsUploading(false)
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // ユーザーデータを取得
  const userData = user ? {
    id: user.id,
    name: user.name,
    role: user.role,
  } : null;

  if (!isAuthenticated) {
    return <Auth onLogin={login} />;
  }

  const renderContent = () => {
    if (!currentProject) {
      return (
        <div className="p-6">
          <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">PJ情報</h1>
            <p className="text-gray-500">プロジェクトが選択されていません。</p>
          </div>
        </div>
      )
    }

    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">PJ情報</h1>
          
          {/* <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.pdf,.doc,.docx,.md"
                className="hidden"
              />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1 group"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      ファイルをアップロード中...
                    </>
                  ) : (
                    <>ファイルからインポート</>
                  )}
                </button>
              </div>
            </div>
          </div> */}

          {/* {uploadError && (
            <div className="mb-4 bg-red-50 p-3 rounded-lg">
              <p className="text-xs text-red-700">
                <span className="font-medium">エラー:</span> {uploadError}
              </p>
            </div>
          )} */}

          <div className="flex flex-col md:flex-row gap-6">
            {/* 左側: プロジェクト情報 */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">
                  プロジェクト概要
                </h4>
                <div className='flex space-x-2'>
                {/* {viewMode === 'edit' && (
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                    onClick={handleFormatText}
                    disabled={isFormatting}
                  >
                    {isFormatting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        要約取り込み中...
                      </>
                    ) : (
                      <>要約取り込み</>
                    )}
                  </button>
                )} */}
                <div className="flex space-x-2">
                    <button
                        type="button"
                        className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 ${
                        viewMode === 'edit'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => setViewMode('edit')}
                    >
                        <IoPencil className="w-3.5 h-3.5" />
                        編集モード
                    </button>
                    <button
                        type="button"
                        className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 ${
                        viewMode === 'preview'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => setViewMode('preview')}
                    >
                        <IoEye className="w-3.5 h-3.5" />
                        プレビュー
                    </button>
                    </div>
                    </div>
              </div>
              
              {viewMode === 'edit' ? (
                <div className="">
                  <textarea
                    className="w-full border border-gray-200 rounded-lg text-sm text-gray-700 font-mono p-4 focus:outline-gray-300"
                    rows={24}
                    value={summaryText}
                    onChange={handleTextChange}
                    placeholder="プロジェクト情報を入力してください（マークダウン記法が使えます）"
                  />
                </div>
              ) : (
                <div className="bg-white border border-gray-100 p-6 rounded-lg prose prose-sm max-w-none">
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                    {summaryText}
                  </ReactMarkdown>
                </div>
              )}
              
              {formatError && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-xs text-red-700">
                    <span className="font-medium">エラー:</span> {formatError}
                  </p>
                </div>
              )}
            </div>
            
            {/* 右側: 情報入力度 */}
            <div className="md:w-60 space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-4">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <h5 className="text-sm font-medium text-gray-700">情報入力度</h5>
                    <span className={`text-sm font-medium ${
                      completionRate < 50 ? 'text-red-600' : 
                      completionRate < 80 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {completionRate}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-full rounded-full ${
                        completionRate < 50 ? 'bg-red-500' : 
                        completionRate < 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} 
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {completionItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isComplete ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className={`text-xs ${item.isComplete ? 'text-gray-600' : 'text-red-600 font-medium'}`}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={logout} user={userData} project={currentProject || undefined} />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
} 