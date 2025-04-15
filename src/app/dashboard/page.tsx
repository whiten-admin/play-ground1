'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuth } from '@/services/auth/hooks/useAuth'
import Auth from '@/services/auth/components/Auth'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import { FiUsers, FiClock, FiTrendingUp, FiDollarSign, FiAlertTriangle, FiCalendar, FiCheckCircle } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Project } from '@/features/projects/types/project'
import { useTaskContext } from '@/features/tasks/contexts/TaskContext'
import { User } from '@/features/tasks/types/user'
import { Task } from '@/features/tasks/types/task'

// プロジェクトの統計情報の型定義
interface ProjectStat {
  id: string;
  title: string;
  code?: string;
  startDate?: string;
  endDate?: string;
  daysRemaining: number | null;
  taskCount: number;
  completedTaskCount: number;
  todoCount: number;
  completedTodoCount: number;
  progressRate: number;
  todoProgressRate: number;
  totalEstimatedHours: number;
  completedEstimatedHours: number;
  hoursProgressRate: number;
  riskLevel: 'high' | 'medium' | 'low';
  budget: number;
  budgetSpent: number;
  budgetRemaining: number;
  budgetProgressRate: number;
}

export default function Dashboard() {
  const { isAuthenticated, user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const { filteredProjects, isAllProjectsMode } = useProjectContext()
  const { filteredTasks } = useTaskContext()
  const [projectStats, setProjectStats] = useState<ProjectStat[]>([])

  // ユーザーデータを取得
  const userData = user ? {
    id: user.id,
    name: user.name,
    role: user.role,
    password: ''
  } : null

  // プロジェクト統計データを計算
  useEffect(() => {
    if (filteredProjects.length > 0 && filteredTasks.length > 0) {
      const stats = filteredProjects.map(project => {
        // プロジェクトに関連するタスクを抽出
        const projectTasks = filteredTasks.filter(task => task.projectId === project.id)
        
        // 完了タスク数を計算
        const completedTasks = projectTasks.filter(task => !!task.completedDateTime)
        
        // 全TODOと完了TODOの数を計算
        const allTodos = projectTasks.flatMap(task => task.todos)
        const completedTodos = allTodos.filter(todo => todo.completed)
        
        // TODOの工数合計と完了工数を計算
        const totalEstimatedHours = allTodos.reduce((sum, todo) => sum + (todo.estimatedHours || 0), 0)
        const completedEstimatedHours = completedTodos.reduce((sum, todo) => sum + (todo.estimatedHours || 0), 0)
        
        // 進捗率（完了タスク/全タスク）
        const progressRate = projectTasks.length > 0 
          ? Math.round((completedTasks.length / projectTasks.length) * 100) 
          : 0
        
        // TODO進捗率（完了TODO/全TODO）
        const todoProgressRate = allTodos.length > 0 
          ? Math.round((completedTodos.length / allTodos.length) * 100) 
          : 0
        
        // 工数進捗率
        const hoursProgressRate = totalEstimatedHours > 0 
          ? Math.round((completedEstimatedHours / totalEstimatedHours) * 100) 
          : 0
        
        // リスクレベルを計算（予算や期限から簡易的に）
        let riskLevel: 'high' | 'medium' | 'low' = 'low'
        
        // 残り日数を計算
        const daysRemaining = project.endDate 
          ? Math.floor((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null
        
        // 期限が近いのに進捗が遅い場合はリスクを上げる
        if (daysRemaining !== null && daysRemaining < 30 && progressRate < 50) {
          riskLevel = 'high'
        } else if (progressRate < 30) {
          riskLevel = 'medium'
        }
        
        // 仮の予算情報（実際はプロジェクト型から取得する）
        const budget = 1000000;
        const budgetSpent = 350000;
        
        return {
          id: project.id,
          title: project.title,
          code: project.code,
          startDate: project.startDate,
          endDate: project.endDate,
          daysRemaining,
          taskCount: projectTasks.length,
          completedTaskCount: completedTasks.length,
          todoCount: allTodos.length,
          completedTodoCount: completedTodos.length,
          progressRate,
          todoProgressRate,
          totalEstimatedHours,
          completedEstimatedHours,
          hoursProgressRate,
          riskLevel,
          // 予算情報（実データではここでプロジェクト情報から取得する）
          budget,
          budgetSpent,
          budgetRemaining: budget - budgetSpent,
          budgetProgressRate: Math.round((budgetSpent / budget) * 100)
        }
      })
      
      setProjectStats(stats)
    }
  }, [filteredProjects, filteredTasks])

  // ログイン確認
  if (!isAuthenticated) {
    return <Auth onLogin={login} />
  }

  // リスクレベルに応じた色を返す関数
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // リスクレベルの日本語表示
  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return '高'
      case 'medium': return '中'
      case 'low': return '低'
      default: return '不明'
    }
  }

  // 進捗率に応じた色を返す関数
  const getProgressColor = (progressRate: number) => {
    if (progressRate >= 75) return 'bg-green-500'
    if (progressRate >= 50) return 'bg-blue-500'
    if (progressRate >= 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // 日付フォーマット
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未設定'
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    })
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={logout} user={userData} />
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-7xl">
            {/* ダッシュボードヘッダー */}
            <div className="mb-6">
              <div className="text-red-500">※中身はこれから詰めていきます</div>
              <h1 className="text-2xl font-bold text-gray-800">プロジェクト全体ダッシュボード</h1>
              <p className="text-gray-500 mt-1">
                全{filteredProjects.length}プロジェクトの進捗状況と概要を確認できます
              </p>
            </div>

            {/* サマリーカード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* 合計プロジェクト数 */}
              <div className="bg-white rounded-lg shadow p-4 flex items-center">
                <div className="rounded-full bg-blue-100 p-3 mr-4">
                  <FiUsers className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">プロジェクト数</div>
                  <div className="text-xl font-bold">{filteredProjects.length}</div>
                </div>
              </div>

              {/* 合計タスク数と完了率 */}
              <div className="bg-white rounded-lg shadow p-4 flex items-center">
                <div className="rounded-full bg-green-100 p-3 mr-4">
                  <FiCheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">全タスク完了率</div>
                  <div className="text-xl font-bold">
                    {filteredTasks.length > 0 
                      ? Math.round(
                        (filteredTasks.filter(task => !!task.completedDateTime).length / filteredTasks.length) * 100
                      )
                      : 0}%
                  </div>
                </div>
              </div>

              {/* 合計工数 */}
              <div className="bg-white rounded-lg shadow p-4 flex items-center">
                <div className="rounded-full bg-purple-100 p-3 mr-4">
                  <FiClock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">合計予定工数</div>
                  <div className="text-xl font-bold">
                    {filteredTasks
                      .flatMap(task => task.todos)
                      .reduce((sum, todo) => sum + (todo.estimatedHours || 0), 0).toFixed(1)}h
                  </div>
                </div>
              </div>

              {/* ハイリスクプロジェクト数 */}
              <div className="bg-white rounded-lg shadow p-4 flex items-center">
                <div className="rounded-full bg-red-100 p-3 mr-4">
                  <FiAlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">高リスクプロジェクト</div>
                  <div className="text-xl font-bold">
                    {projectStats.filter(project => project.riskLevel === 'high').length}
                  </div>
                </div>
              </div>
            </div>

            {/* プロジェクト一覧テーブル */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium">プロジェクト一覧</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        プロジェクト
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        期間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        進捗
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        予算
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        リスク
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projectStats.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{project.title}</div>
                              <div className="text-sm text-gray-500">{project.code || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(project.startDate)} - {formatDate(project.endDate)}
                          </div>
                          {project.daysRemaining !== null && (
                            <div className={`text-sm ${project.daysRemaining < 7 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              残り{project.daysRemaining}日
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center mb-1">
                            <div className="text-sm font-medium text-gray-900 mr-2">{project.progressRate}%</div>
                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${getProgressColor(project.progressRate)}`} 
                                style={{ width: `${project.progressRate}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            タスク: {project.completedTaskCount}/{project.taskCount}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ¥{project.budget.toLocaleString()} 
                            <span className="text-xs text-gray-500 ml-1">
                              ({project.budgetProgressRate}%使用)
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            残¥{project.budgetRemaining.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(project.riskLevel)}`}>
                            {getRiskLabel(project.riskLevel)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* リソース配分グラフ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* プロジェクト進捗サマリー */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-medium">プロジェクト進捗サマリー</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {projectStats.map((project) => (
                      <div key={`progress-${project.id}`} className="mb-2">
                        <div className="flex justify-between mb-1">
                          <div className="text-sm font-medium">{project.title}</div>
                          <div className="text-sm font-medium">{project.progressRate}%</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(project.progressRate)}`}
                            style={{ width: `${project.progressRate}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* リソース配分 */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-medium">リソース配分</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {projectStats.map((project) => (
                      <div key={`resource-${project.id}`} className="mb-2">
                        <div className="flex justify-between mb-1">
                          <div className="text-sm font-medium">{project.title}</div>
                          <div className="text-sm font-medium">{project.totalEstimatedHours.toFixed(1)}h</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ 
                              width: `${Math.min(100, (project.totalEstimatedHours / 
                                Math.max(...projectStats.map(p => p.totalEstimatedHours) || 1)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 