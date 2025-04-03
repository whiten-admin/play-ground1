import React from 'react'

interface TaskGenerationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

export default function TaskGenerationDialog({ isOpen, onClose, onConfirm, isLoading }: TaskGenerationDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">タスクの自動生成</h3>
        <p className="text-sm text-gray-600 mb-4">
          プロジェクトの概要から自動的にタスクを生成しますか？
          <br />
          ※この処理は後からでも実行できます
        </p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md"
            disabled={isLoading}
          >
            スキップ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-400"
            disabled={isLoading}
          >
            {isLoading ? '生成中...' : '生成する'}
          </button>
        </div>
      </div>
    </div>
  )
} 