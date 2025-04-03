import React, { useState, useEffect, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Project } from '@/features/projects/types/project'
import { formatProjectInfo, extractProjectInfoFromFile } from '@/services/api/utils/openai'
import { extractTextFromFile } from '@/services/api/utils/fileParser'
import { User } from '@/features/tasks/types/user'
import ProjectMemberList from './ProjectMemberList'

interface ProjectDetailModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project
  onUpdate: (updatedProject: Project) => void
  users?: User[] // ユーザーリストを受け取るようにする
}

interface CompletionItem {
  name: string;
  isComplete: boolean;
}

export default function ProjectDetailModal({
  isOpen,
  onClose,
  project,
  onUpdate,
  users = [] // デフォルト値を空配列に
}: ProjectDetailModalProps) {
  const [viewMode, setViewMode] = useState<'original' | 'summary' | 'members'>('summary')
  const [originalText, setOriginalText] = useState('')
  const [summaryText, setSummaryText] = useState('')
  const [isFormatting, setIsFormatting] = useState(false)
  const [formatError, setFormatError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // モーダルが開かれたときに初期化
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const text = generateProjectText()
      setOriginalText(text)
      setSummaryText(text) // 初期状態では要約テキストも同じ内容に設定
      setIsInitialized(true)
      setFormatError(null)
    }
  }, [isOpen, project, isInitialized])

  // プロジェクト情報が変更されたらテキストを更新
  useEffect(() => {
    if (isInitialized) {
      const text = generateProjectText()
      setOriginalText(text)
      // 要約テキストが原文と同じ場合のみ更新（編集されている場合は更新しない）
      if (summaryText === originalText) {
        setSummaryText(text)
      }
    }
  }, [project])

  // モーダルが閉じられたときに状態をリセット
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false)
    }
  }, [isOpen])

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
  const generateProjectText = () => {
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

  // 原文テキストの変更を処理
  const handleOriginalTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOriginalText(e.target.value)
  }

  // 要約テキストの変更を処理
  const handleSummaryTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      setViewMode('summary')
    } catch (error) {
      setFormatError(error instanceof Error ? error.message : '整形中にエラーが発生しました')
    } finally {
      setIsFormatting(false)
    }
  }

  // 表示モードを切り替え
  const handleViewModeChange = (mode: 'original' | 'summary' | 'members') => {
    setViewMode(mode)
  }

  // プロジェクト情報の入力度を計算
  const calculateCompletionRate = (): { rate: number; items: CompletionItem[] } => {
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

  const { rate: completionRate, items: completionItems } = calculateCompletionRate()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // ファイルからテキストを抽出
      const fileContent = await extractTextFromFile(file);
      
      // ChatGPTを使用してプロジェクト情報を抽出
      const formattedInfo = await extractProjectInfoFromFile(fileContent, file.name);
      
      // 抽出された情報を設定
      setOriginalText(fileContent);
      setSummaryText(formattedInfo);
      
      // サマリービューに切り替え
      setViewMode('summary');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '不明なエラーが発生しました。');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    プロジェクト詳細
                  </Dialog.Title>
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
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            インポート中...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            ファイルインポート
                          </>
                        )}
                      </button>
                      <div className="hidden group-hover:block absolute top-full left-0 mt-1 w-64 p-2 bg-gray-800 text-xs text-white rounded shadow-lg z-10">
                        <p className="font-medium mb-1">サポートされるファイル形式:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>テキストファイル (.txt)</li>
                          <li>PDFファイル (.pdf)</li>
                          <li>Wordファイル (.doc, .docx)</li>
                          <li>Markdownファイル (.md)</li>
                        </ul>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                        viewMode === 'summary'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => handleViewModeChange('summary')}
                    >
                      要約テキスト
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                        viewMode === 'original'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => handleViewModeChange('original')}
                    >
                      原文テキスト
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                        viewMode === 'members'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => handleViewModeChange('members')}
                    >
                      メンバー管理
                    </button>
                  </div>
                </div>

                {uploadError && (
                  <div className="mb-4 bg-red-50 p-3 rounded-lg">
                    <p className="text-xs text-red-700">
                      <span className="font-medium">エラー:</span> {uploadError}
                    </p>
                  </div>
                )}

                {viewMode === 'members' ? (
                  <div className="space-y-4">
                    <ProjectMemberList projectId={project.id} userList={users} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        {viewMode === 'original' ? 'プロジェクト情報（原文）' : 'プロジェクト情報（要約）'}
                      </h4>
                      {viewMode === 'original' && (
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
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <textarea
                        className="w-full bg-gray-50 text-sm text-gray-700 font-mono border-none focus:ring-0 focus:outline-none"
                        rows={20}
                        value={viewMode === 'original' ? originalText : summaryText}
                        onChange={viewMode === 'original' ? handleOriginalTextChange : handleSummaryTextChange}
                        placeholder={
                          viewMode === 'original'
                            ? "プロジェクト情報を入力してください。ランダムなフォーマットでも、要約取り込みボタンを押すとAIが整形します。"
                            : "要約されたプロジェクト情報が表示されます。"
                        }
                      />
                    </div>
                    {formatError && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-xs text-red-700">
                          <span className="font-medium">エラー:</span> {formatError}
                        </p>
                      </div>
                    )}
                    {viewMode === 'summary' && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="mb-3">
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
                        <div className="grid grid-cols-2 gap-2">
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
                    )}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <span className="font-medium">ヒント:</span> 
                        {viewMode === 'original'
                          ? "ランダムなフォーマットのテキストを入力し、「要約取り込み」ボタンをクリックするとAIが整形します。"
                          : "要約されたテキストを確認・編集できます。必要に応じて修正してください。"
                        }
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300"
                    onClick={onClose}
                  >
                    閉じる
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 