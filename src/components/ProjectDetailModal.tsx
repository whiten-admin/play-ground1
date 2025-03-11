import React, { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Project } from '@/types/project'

interface ProjectDetailModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project
  onUpdate: (updatedProject: Project) => void
}

export default function ProjectDetailModal({
  isOpen,
  onClose,
  project,
  onUpdate,
}: ProjectDetailModalProps) {
  const [viewMode, setViewMode] = useState<'form' | 'text'>('form')

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
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                        viewMode === 'form'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setViewMode('form')}
                    >
                      フォーム表示
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                        viewMode === 'text'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setViewMode('text')}
                    >
                      テキスト表示
                    </button>
                  </div>
                </div>

                {viewMode === 'form' ? (
                  <div className="space-y-6">
                    {/* 基本情報セクション */}
                    <section>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">基本情報</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">プロジェクト名</label>
                          <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            value={project.title}
                            onChange={(e) => onUpdate({ ...project, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">プロジェクトコード</label>
                          <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            value={project.code || ''}
                            onChange={(e) => onUpdate({ ...project, code: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">開始日</label>
                          <input
                            type="date"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            value={project.startDate || ''}
                            onChange={(e) => onUpdate({ ...project, startDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">終了予定日</label>
                          <input
                            type="date"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            value={project.endDate || ''}
                            onChange={(e) => onUpdate({ ...project, endDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </section>

                    {/* プロジェクト概要セクション */}
                    <section>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">プロジェクト概要</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">概要</label>
                          <textarea
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            rows={3}
                            value={project.description || ''}
                            onChange={(e) => onUpdate({ ...project, description: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">目的</label>
                          <textarea
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            rows={2}
                            value={project.purpose || ''}
                            onChange={(e) => onUpdate({ ...project, purpose: e.target.value })}
                          />
                        </div>
                      </div>
                    </section>

                    {/* 開発情報セクション */}
                    <section>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">開発情報</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">開発手法</label>
                          <select
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            value={project.methodology || ''}
                            onChange={(e) => onUpdate({ 
                              ...project, 
                              methodology: e.target.value as Project['methodology'] 
                            })}
                          >
                            <option value="">選択してください</option>
                            <option value="waterfall">ウォーターフォール</option>
                            <option value="agile">アジャイル</option>
                            <option value="hybrid">ハイブリッド</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">開発フェーズ</label>
                          <select
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            value={project.phase || ''}
                            onChange={(e) => onUpdate({ 
                              ...project, 
                              phase: e.target.value as Project['phase']
                            })}
                          >
                            <option value="">選択してください</option>
                            <option value="planning">企画</option>
                            <option value="requirements">要件定義</option>
                            <option value="design">設計</option>
                            <option value="development">開発</option>
                            <option value="testing">テスト</option>
                            <option value="deployment">リリース</option>
                            <option value="maintenance">保守運用</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">開発規模（人月）</label>
                          <input
                            type="number"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            value={project.scale || ''}
                            onChange={(e) => onUpdate({ ...project, scale: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">予算（万円）</label>
                          <input
                            type="number"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            value={project.budget || ''}
                            onChange={(e) => onUpdate({ ...project, budget: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    </section>

                    {/* ステークホルダー情報セクション */}
                    <section>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">ステークホルダー情報</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">クライアント</label>
                          <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            value={project.client || ''}
                            onChange={(e) => onUpdate({ ...project, client: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">プロジェクトマネージャー</label>
                          <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            value={project.projectManager || ''}
                            onChange={(e) => onUpdate({ ...project, projectManager: e.target.value })}
                          />
                        </div>
                      </div>
                    </section>

                    {/* リスク・課題セクション */}
                    <section>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">リスク・課題</h4>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">主要なリスクと対策</label>
                        <textarea
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          rows={3}
                          value={project.risks || ''}
                          onChange={(e) => onUpdate({ ...project, risks: e.target.value })}
                        />
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                        {generateProjectText()}
                      </pre>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <span className="font-medium">ヒント:</span> このテキスト表示はAIによる情報入力に活用できます。
                        テキスト形式のデータをコピーして保存したり、AIに情報を入力してもらう際の参考にしてください。
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
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    onClick={onClose}
                  >
                    保存
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