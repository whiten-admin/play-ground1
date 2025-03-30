import React, { useState, useEffect } from 'react'
import { Project } from '@/features/projects/types/project'
import ProjectDetailModal from './ProjectDetailModal'

interface ProjectDetailProps {
  project: Project
  onUpdate: (updatedProject: Project) => void
}

export default function ProjectDetail({ project, onUpdate }: ProjectDetailProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  // サイドバーの状態を監視
  useEffect(() => {
    const checkSidebarState = () => {
      const collapsed = document.documentElement.getAttribute('data-sidebar-collapsed') === 'true'
      setIsSidebarCollapsed(collapsed)
    }
    
    // 初期状態をチェック
    checkSidebarState()
    
    // データ属性の変更を監視
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-sidebar-collapsed') {
          checkSidebarState()
        }
      })
    })
    
    observer.observe(document.documentElement, { attributes: true })
    
    return () => observer.disconnect()
  }, [])

  // プロジェクト情報の入力度を計算
  const calculateCompletionRate = (project: Project): number => {
    const requiredFields = [
      project.title,
      project.description,
      project.purpose,
      project.startDate,
      project.endDate,
      project.methodology,
      project.phase,
      project.scale,
      project.budget,
      project.client,
      project.projectManager,
      project.risks
    ]

    const filledFields = requiredFields.filter(field => field !== undefined && field !== '')
    return Math.round((filledFields.length / requiredFields.length) * 100)
  }

  const completionRate = calculateCompletionRate(project)

  if (!project) {
    return <div>プロジェクト情報が見つかりません。</div>
  }

  return (
    <>
      <div className={`sidebar-project-detail ${isSidebarCollapsed ? 'w-16' : 'w-auto'} bg-white rounded-lg shadow p-3 text-xs`}>
        {/* 展開時の詳細表示 */}
        <div className="sidebar-expanded-content">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-800">PJ詳細</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              詳細を見る
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">フェーズ</span>
              <span className={getPhaseColor(project.phase)}>
                {getPhaseLabel(project.phase)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">開発手法</span>
              <span className="text-gray-800">
                {getMethodologyLabel(project.methodology)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">情報入力度</span>
              <div className="flex items-center">
                <div className="w-12 h-1 bg-gray-200 rounded-full mr-1">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <span className="text-gray-900">{completionRate}%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 閉じた時のアイコン表示 */}
        <div className="sidebar-collapsed-content flex justify-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-gray-100"
            title="プロジェクト詳細を見る"
          >
            <span className="text-xl">📋</span>
          </button>
        </div>
      </div>

      <ProjectDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={project}
        onUpdate={onUpdate}
      />
    </>
  )
}

function getPhaseLabel(phase: Project['phase']) {
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

function getMethodologyLabel(methodology: Project['methodology']) {
  const methodologyLabels: Record<NonNullable<Project['methodology']>, string> = {
    waterfall: 'ウォーターフォール',
    agile: 'アジャイル',
    hybrid: 'ハイブリッド'
  }
  return methodology ? methodologyLabels[methodology] : '未設定'
}

function getPhaseColor(phase: Project['phase']) {
  const phaseColors: Record<NonNullable<Project['phase']>, string> = {
    planning: 'text-purple-600',
    requirements: 'text-blue-600',
    design: 'text-indigo-600',
    development: 'text-green-600',
    testing: 'text-yellow-600',
    deployment: 'text-orange-600',
    maintenance: 'text-gray-600'
  }
  return phase ? phaseColors[phase] : 'text-gray-400'
}

function formatDate(date: string | undefined) {
  if (!date) return '未定'
  return new Date(date).toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric'
  })
} 