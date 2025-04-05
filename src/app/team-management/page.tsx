'use client'

import React, { useState, useEffect } from 'react'
import { User } from '@/features/tasks/types/user'
import { ProjectMember, ProjectMemberRole } from '@/features/projects/types/projectMember'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import { FiPlus, FiX, FiUserCheck, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { getAllUsers } from '@/utils/memberUtils'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuth } from '@/services/auth/hooks/useAuth'
import Auth from '@/services/auth/components/Auth'

interface MemberWithUser extends ProjectMember {
  user: User
}

export default function TeamManagement() {
  const { currentProject, getProjectMembers, assignUserToProject, removeUserFromProject } = useProjectContext()
  const { isAuthenticated, user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('team-management')
  const [members, setMembers] = useState<MemberWithUser[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(null)
  const [selectedRole, setSelectedRole] = useState<ProjectMemberRole>('member')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [allUsers, setAllUsers] = useState<User[]>([])

  // ユーザーリストを初期化
  useEffect(() => {
    const users = getAllUsers().map(u => ({
      id: u.id,
      name: u.name,
      role: u.role
    } as User))
    setAllUsers(users)
  }, [])

  // プロジェクトが変更されたらメンバーリストを更新
  useEffect(() => {
    if (currentProject) {
      updateMemberList()
    }
  }, [currentProject, allUsers, getProjectMembers])

  // メンバーリストを更新する関数
  const updateMemberList = () => {
    if (!currentProject) return
    
    const projectMembers = getProjectMembers(currentProject.id)
    
    // メンバー情報にユーザー情報を紐付け
    const membersWithUsers = projectMembers
      .map(member => {
        const user = allUsers.find(u => u.id === member.userId)
        if (!user) return null
        return {
          ...member,
          user
        }
      })
      .filter((member): member is MemberWithUser => member !== null)
    
    setMembers(membersWithUsers)
  }

  // メンバー追加モーダルを開く
  const openAddModal = () => {
    setSelectedUserId('')
    setSelectedRole('member')
    setShowAddModal(true)
  }

  // メンバー編集モーダルを開く
  const openEditModal = (member: MemberWithUser) => {
    setSelectedMember(member)
    setSelectedRole(member.role)
    setShowEditModal(true)
  }

  // メンバーを追加
  const handleAddMember = () => {
    if (!selectedUserId || !currentProject) return
    
    assignUserToProject(currentProject.id, selectedUserId, selectedRole)
    setShowAddModal(false)
    updateMemberList()
  }

  // メンバー情報を更新
  const handleUpdateMember = () => {
    if (!selectedMember || !currentProject) return
    
    assignUserToProject(currentProject.id, selectedMember.userId, selectedRole)
    setShowEditModal(false)
    updateMemberList()
  }

  // メンバーを削除
  const handleRemoveMember = (userId: string) => {
    if (!currentProject) return
    
    if (confirm('このメンバーをプロジェクトから削除しますか？')) {
      removeUserFromProject(currentProject.id, userId)
      updateMemberList()
    }
  }

  // ロールの日本語表示
  const getRoleLabel = (role: ProjectMemberRole) => {
    switch (role) {
      case 'manager':
        return 'マネージャー'
      case 'member':
        return 'メンバー'
      default:
        return role
    }
  }

  // ロール選択欄
  const RoleSelect = ({ value, onChange }: { value: ProjectMemberRole, onChange: (value: ProjectMemberRole) => void }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ProjectMemberRole)}
      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
    >
      <option value="manager">マネージャー</option>
      <option value="member">メンバー</option>
    </select>
  )

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
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">チーム管理</h1>
            <p className="text-gray-500">プロジェクトが選択されていません。</p>
          </div>
        </div>
      )
    }

    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">チーム管理</h1>
          </div>
          
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">プロジェクトメンバー</h3>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiPlus className="mr-1" />
              メンバー追加
            </button>
          </div>
          <div className="border-t border-gray-200">
            {members.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {members.map((member) => (
                  <li key={member.id} className="px-4 py-3 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <FiUserCheck className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.user.name}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            member.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {getRoleLabel(member.role)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(member)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-5 sm:px-6 text-center text-sm text-gray-500">
                まだメンバーがいません
              </div>
            )}
          </div>

          {/* メンバー追加モーダル */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">メンバー追加</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                <div className="mb-4">
                  <label htmlFor="userId" className="block text-sm font-medium text-gray-700">ユーザー</label>
                  <select
                    id="userId"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">選択してください</option>
                    {allUsers
                      .filter(user => !members.some(m => m.userId === user.id))
                      .map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))
                    }
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">ロール</label>
                  <RoleSelect value={selectedRole} onChange={setSelectedRole} />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={!selectedUserId}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    追加
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* メンバー編集モーダル */}
          {showEditModal && selectedMember && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">メンバー編集</h3>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">ユーザー</label>
                  <div className="mt-1 py-2 px-3 bg-gray-100 rounded-md text-sm text-gray-700">
                    {selectedMember.user.name}
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">ロール</label>
                  <RoleSelect value={selectedRole} onChange={setSelectedRole} />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateMember}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    更新
                  </button>
                </div>
              </div>
            </div>
          )}
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