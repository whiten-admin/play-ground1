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
import { IoPencil, IoEye, IoLogoGoogle, IoLogoDropbox, IoCloudOutline } from 'react-icons/io5'
import { SiNotion } from 'react-icons/si'

// 情報入力項目の定義
interface CompletionItem {
  name: string;
  isComplete: boolean;
}

// タブの定義
type TabType = 'project-info' | 'external-reference';

export default function ProjectInfo() {
  const { currentProject } = useProjectContext()
  const { isAuthenticated, user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('project-info')
  const [activeContentTab, setActiveContentTab] = useState<TabType>('project-info')
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

  // タブコンテンツをレンダリング
  const renderTabContent = () => {
    if (!currentProject) {
      return (
        <div className="p-6">
          <p className="text-gray-500">プロジェクトが選択されていません。</p>
        </div>
      );
    }

    switch (activeContentTab) {
      case 'external-reference':
        return (
          <div className="p-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    この機能は現在開発中です。外部サービスと連携することで、プロジェクト関連情報をAIが参照し、より精度の高い情報提供が可能になります。
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Google Drive 連携 */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <IoLogoGoogle className="h-8 w-8 text-blue-500 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Google Drive連携</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">Google Driveと連携することで、プロジェクト関連のドキュメントをAIが自動参照し、最新の情報に基づいた精度の高い回答が得られます。</p>
                <ul className="list-disc pl-5 text-gray-600 mb-6 space-y-1 text-xs">
                  <li>プロジェクト関連のドキュメントをAIが自動参照</li>
                  <li>チーム内での情報共有の効率化</li>
                </ul>
                
                <button
                  type="button"
                  disabled
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed"
                >
                  <IoLogoGoogle className="mr-2 h-5 w-5" />
                  連携する（準備中）
                </button>
              </div>
              
              {/* Notion連携 */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <SiNotion className="h-8 w-8 text-gray-900 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Notion連携</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">Notionと連携することで、プロジェクトのナレッジベースとデータベースをAIが参照し、効率的な情報管理と分析が可能になります。</p>
                <ul className="list-disc pl-5 text-gray-600 mb-6 space-y-1 text-xs">
                  <li>プロジェクトのナレッジベースとの連携</li>
                  <li>データベース・ドキュメント情報の自動取得</li>
                </ul>
                
                <button
                  type="button"
                  disabled
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed"
                >
                  <SiNotion className="mr-2 h-5 w-5" />
                  連携する（準備中）
                </button>
              </div>
              
              {/* Dropbox連携 */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <IoLogoDropbox className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Dropbox連携</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">Dropboxと連携することで、プロジェクト関連のファイルをAIが参照し、大容量ファイルの管理と検索・分析が効率化されます。</p>
                <ul className="list-disc pl-5 text-gray-600 mb-6 space-y-1 text-xs">
                  <li>プロジェクト関連ファイルの自動インデックス化</li>
                  <li>大容量ファイルの効率的な管理と参照</li>
                </ul>
                
                <button
                  type="button"
                  disabled
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed"
                >
                  <IoLogoDropbox className="mr-2 h-5 w-5" />
                  連携する（準備中）
                </button>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">外部情報連携のメリット</h3>
              <p className="text-blue-800 mb-4 text-sm">外部サービスと連携することで、AIは以下のような高度な支援が可能になります：</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2 text-sm">情報の自動収集・分析</h4>
                  <p className="text-gray-600 text-xs">プロジェクト関連の外部ドキュメントやファイルを自動的に収集・分析し、最新の情報に基づいた提案や回答を生成します。</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2 text-sm">コンテキスト理解の向上</h4>
                  <p className="text-gray-600 text-xs">プロジェクトの背景や詳細な情報を理解することで、より文脈に即した適切な提案や回答ができるようになります。</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2 text-sm">チーム連携の効率化</h4>
                  <p className="text-gray-600 text-xs">チーム内の情報共有や知識の集約が効率化され、メンバー間のコミュニケーションがスムーズになります。</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2 text-sm">意思決定の迅速化</h4>
                  <p className="text-gray-600 text-xs">必要な情報へのアクセスが迅速になることで、プロジェクトの意思決定スピードが向上します。</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col md:flex-row gap-6 p-6">
            {/* 左側: プロジェクト情報 */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">
                  プロジェクト概要
                </h4>
                <div className='flex space-x-2'>
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
        );
    }
  };

  const renderContent = () => {
    if (!currentProject) {
      return (
        <div className="p-2">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">PJ情報</h1>
            <p className="text-gray-500">プロジェクトが選択されていません。</p>
          </div>
        </div>
      )
    }

    return (
      <div className="p-2">
        <div className="bg-white rounded-xl shadow-md p-4">          
          {/* タブナビゲーション */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setActiveContentTab('project-info')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeContentTab === 'project-info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                基本情報
              </button>
              <button
                onClick={() => setActiveContentTab('external-reference')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm inline-flex items-center ${
                  activeContentTab === 'external-reference'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IoCloudOutline className="mr-2" />
                外部情報参照
              </button>
            </nav>
          </div>
          
          {/* タブコンテンツ */}
          {renderTabContent()}
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