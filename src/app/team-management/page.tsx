'use client'

import React, { useState, useEffect, useRef } from 'react'
import { User } from '@/features/tasks/types/user'
import { ProjectMember, ProjectMemberRole, Skill, SkillLevel } from '@/features/projects/types/projectMember'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import { FiPlus, FiX, FiUserCheck, FiEdit2, FiTrash2, FiMail, FiUsers, FiUpload, FiFile, FiCheckCircle, FiInfo } from 'react-icons/fi'
import { getAllUsers } from '@/utils/memberUtils'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuth } from '@/services/auth/hooks/useAuth'
import Auth from '@/services/auth/components/Auth'

interface MemberWithUser extends ProjectMember {
  user: User
}

// 招待済みユーザーの型定義
interface InvitedUser {
  id: string;
  email: string;
  role: ProjectMemberRole;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: Date;
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
  
  // 招待関連の状態
  const [addUserTab, setAddUserTab] = useState<'existing' | 'invite'>('existing')
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([])
  
  // スキル関連の状態
  const [showSkillModal, setShowSkillModal] = useState(false)
  const [memberSkills, setMemberSkills] = useState<Skill[]>([])
  const [skillDescription, setSkillDescription] = useState('')
  const [skillSheetFile, setSkillSheetFile] = useState<string | null>(null)
  const [showSkillDetailModal, setShowSkillDetailModal] = useState(false)
  const [newSkill, setNewSkill] = useState<Skill>({ name: '', level: 'intermediate' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // メール形式検証用の正規表現
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    setInviteEmail('')
    setInviteSuccess(false)
    setAddUserTab('existing')
    setShowAddModal(true)
  }

  // メンバー編集モーダルを開く
  const openEditModal = (member: MemberWithUser) => {
    setSelectedMember(member)
    setSelectedRole(member.role)
    setShowEditModal(true)
  }
  
  // スキル詳細モーダルを開く
  const openSkillDetailModal = (member: MemberWithUser) => {
    setSelectedMember(member)
    setMemberSkills(member.skills || [])
    setSkillDescription(member.skillDescription || '')
    setSkillSheetFile(member.skillSheetFile || null)
    setShowSkillDetailModal(true)
  }
  
  // スキル編集モーダルを開く
  const openSkillModal = (member: MemberWithUser) => {
    setSelectedMember(member)
    setMemberSkills(member.skills || [])
    setSkillDescription(member.skillDescription || '')
    setSkillSheetFile(member.skillSheetFile || null)
    setShowSkillModal(true)
  }
  
  // スキルを追加
  const addSkill = () => {
    if (!newSkill.name) return
    
    setMemberSkills([...memberSkills, { ...newSkill }])
    setNewSkill({ name: '', level: 'intermediate' })
  }
  
  // スキルを削除
  const removeSkill = (index: number) => {
    const updatedSkills = [...memberSkills]
    updatedSkills.splice(index, 1)
    setMemberSkills(updatedSkills)
  }
  
  // スキルシートファイルを選択
  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }
  
  // スキルシートファイルが選択されたときの処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 実際のファイルアップロードは行わず、ファイル名だけを保存
      setSkillSheetFile(file.name)
    }
  }
  
  // スキル情報を保存
  const saveSkillInfo = () => {
    if (!selectedMember || !currentProject) return
    
    // 通常はここでAPIを呼び出してサーバーに保存するが、今回はフロントエンドの状態のみ更新
    const updatedMembers = members.map(member => {
      if (member.id === selectedMember.id) {
        return {
          ...member,
          skills: memberSkills,
          skillDescription,
          skillSheetFile: skillSheetFile || undefined
        }
      }
      return member
    })
    
    setMembers(updatedMembers as MemberWithUser[])
    setShowSkillModal(false)
  }

  // メンバーを追加
  const handleAddMember = () => {
    if (addUserTab === 'existing') {
      if (!selectedUserId || !currentProject) return
      
      assignUserToProject(currentProject.id, selectedUserId, selectedRole)
      setShowAddModal(false)
      updateMemberList()
    } else {
      handleInviteUser()
    }
  }

  // 外部ユーザーを招待
  const handleInviteUser = () => {
    if (!inviteEmail || !emailRegex.test(inviteEmail) || !currentProject) return
    
    setIsInviting(true)
    
    // 招待メール送信のシミュレーション
    setTimeout(() => {
      // 招待レコードを作成
      const newInvite: InvitedUser = {
        id: `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: inviteEmail,
        role: selectedRole,
        status: 'pending',
        invitedAt: new Date()
      }
      
      // 招待リストに追加
      setInvitedUsers(prev => [...prev, newInvite])
      
      // 状態をリセット
      setInviteSuccess(true)
      setIsInviting(false)
      
      // 3秒後にメッセージを非表示
      setTimeout(() => {
        setShowAddModal(false)
        setInviteSuccess(false)
        setInviteEmail('')
      }, 3000)
    }, 1500) // 1.5秒間の遅延でメール送信をシミュレート
  }

  // 招待をキャンセル
  const handleCancelInvite = (inviteId: string) => {
    if (confirm('この招待をキャンセルしますか？')) {
      setInvitedUsers(prev => prev.filter(invite => invite.id !== inviteId))
    }
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

  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }

  // 招待状態の日本語表示
  const getInviteStatusLabel = (status: InvitedUser['status']) => {
    switch (status) {
      case 'pending':
        return '招待中'
      case 'accepted':
        return '承諾済み'
      case 'declined':
        return '辞退'
      default:
        return status
    }
  }
  
  // スキルレベルの日本語表示
  const getSkillLevelLabel = (level: SkillLevel) => {
    switch (level) {
      case 'beginner':
        return '初級'
      case 'intermediate':
        return '中級'
      case 'advanced':
        return '上級'
      case 'expert':
        return 'エキスパート'
      default:
        return level
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
                  <li key={member.id} className="px-4 py-3 sm:px-6 flex flex-col">
                    <div className="flex items-center justify-between">
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
                            <span className="ml-2 text-gray-500">
                              {formatDate(member.assignedAt)}から参加
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => openSkillModal(member)}
                          className="text-gray-500 hover:text-gray-700"
                          title="スキル情報を編集"
                        >
                          <FiFile className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(member)}
                          className="text-gray-500 hover:text-gray-700"
                          title="メンバー情報を編集"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.userId)}
                          className="text-red-500 hover:text-red-700"
                          title="メンバーを削除"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* スキル情報の表示 */}
                    {member.skills && member.skills.length > 0 && (
                      <div className="mt-2 ml-14">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                          <span className="font-medium">スキル: </span>
                          {member.skills.map((skill, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-0.5 bg-gray-100 rounded-full flex items-center"
                              title={`${skill.years ? `${skill.years}年の経験` : ''}`}
                            >
                              {skill.name}
                              <span className="ml-1 text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                                {getSkillLevelLabel(skill.level)}
                              </span>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => openSkillDetailModal(member)}
                            className="ml-1 text-blue-500 hover:text-blue-700 underline text-xs"
                          >
                            詳細を見る
                          </button>
                        </div>
                        {member.skillSheetFile && (
                          <div className="mt-1 text-xs text-gray-500 flex items-center">
                            <FiFile className="mr-1 h-3 w-3" />
                            スキルシート: {member.skillSheetFile}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-5 sm:px-6 text-center text-sm text-gray-500">
                まだメンバーがいません
              </div>
            )}
          </div>

          {/* 招待済みユーザー一覧 */}
          {invitedUsers.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="px-4 py-3 sm:px-6">
                <h3 className="text-md leading-6 font-medium text-gray-700">招待中ユーザー</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {invitedUsers.map((invite) => (
                  <li key={invite.id} className="px-4 py-3 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-yellow-50 rounded-full flex items-center justify-center">
                        <FiMail className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{invite.email}</div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            invite.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {getRoleLabel(invite.role)}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            {getInviteStatusLabel(invite.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleCancelInvite(invite.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
                
                {/* タブ切り替え */}
                <div className="flex border-b border-gray-200 mb-4">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium ${
                      addUserTab === 'existing'
                        ? 'text-blue-600 border-b-2 border-blue-500'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setAddUserTab('existing')}
                  >
                    <div className="flex items-center">
                      <FiUsers className="mr-2" />
                      既存ユーザー
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium ${
                      addUserTab === 'invite'
                        ? 'text-blue-600 border-b-2 border-blue-500'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setAddUserTab('invite')}
                  >
                    <div className="flex items-center">
                      <FiMail className="mr-2" />
                      外部招待
                    </div>
                  </button>
                </div>
                
                {addUserTab === 'existing' ? (
                  // 既存ユーザー追加フォーム
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
                ) : (
                  // 外部ユーザー招待フォーム
                  <div className="mb-4">
                    <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700">メールアドレス</label>
                    <div className="mt-1">
                      <input
                        type="email"
                        id="inviteEmail"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="example@example.com"
                      />
                      {inviteEmail && !emailRegex.test(inviteEmail) && (
                        <p className="mt-1 text-xs text-red-600">有効なメールアドレスを入力してください</p>
                      )}
                    </div>
                    
                    {inviteSuccess && (
                      <div className="mt-3 p-2 bg-green-50 text-green-700 text-sm rounded-md">
                        招待メールを送信しました。ユーザーの応答を待っています。
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">ロール</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as ProjectMemberRole)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="manager">マネージャー</option>
                    <option value="member">メンバー</option>
                  </select>
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
                    disabled={(addUserTab === 'existing' && !selectedUserId) || 
                             (addUserTab === 'invite' && (!inviteEmail || !emailRegex.test(inviteEmail))) || 
                             isInviting}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isInviting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        招待中...
                      </span>
                    ) : (
                      addUserTab === 'existing' ? '追加' : '招待を送信'
                    )}
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
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as ProjectMemberRole)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="manager">マネージャー</option>
                    <option value="member">メンバー</option>
                  </select>
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
          
          {/* スキル編集モーダル */}
          {showSkillModal && selectedMember && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{selectedMember.user.name}のスキル情報編集</h3>
                  <button
                    type="button"
                    onClick={() => setShowSkillModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                
                {/* スキル追加フォーム */}
                <div className="mb-6 bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">新しいスキルを追加</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-1 md:col-span-2">
                      <label htmlFor="skillName" className="block text-xs font-medium text-gray-500">スキル名</label>
                      <input
                        id="skillName"
                        type="text"
                        value={newSkill.name}
                        onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                        placeholder="例: Java, Python, UI設計..."
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="skillLevel" className="block text-xs font-medium text-gray-500">レベル</label>
                      <select
                        id="skillLevel"
                        value={newSkill.level}
                        onChange={(e) => setNewSkill({...newSkill, level: e.target.value as SkillLevel})}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="beginner">初級</option>
                        <option value="intermediate">中級</option>
                        <option value="advanced">上級</option>
                        <option value="expert">エキスパート</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center mt-3">
                    <label htmlFor="skillYears" className="block text-xs font-medium text-gray-500 mr-2">経験年数</label>
                    <input
                      id="skillYears"
                      type="number"
                      min="0"
                      step="0.5"
                      value={newSkill.years || ''}
                      onChange={(e) => setNewSkill({...newSkill, years: e.target.value ? parseFloat(e.target.value) : undefined})}
                      className="block w-24 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <span className="ml-2 text-sm text-gray-500">年</span>
                    <button
                      type="button"
                      onClick={addSkill}
                      disabled={!newSkill.name}
                      className="ml-auto px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      追加
                    </button>
                  </div>
                </div>
                
                {/* 登録済みスキル一覧 */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">スキル一覧</h4>
                  {memberSkills.length > 0 ? (
                    <ul className="space-y-2">
                      {memberSkills.map((skill, index) => (
                        <li key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                          <div>
                            <span className="font-medium text-sm">{skill.name}</span>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full mr-2">
                                {getSkillLevelLabel(skill.level)}
                              </span>
                              {skill.years && (
                                <span>経験年数: {skill.years}年</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiX className="h-5 w-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">スキルが登録されていません</p>
                  )}
                </div>
                
                {/* スキル詳細説明 */}
                <div className="mb-6">
                  <label htmlFor="skillDescription" className="block text-sm font-medium text-gray-700 mb-1">スキル詳細説明</label>
                  <textarea
                    id="skillDescription"
                    value={skillDescription}
                    onChange={(e) => setSkillDescription(e.target.value)}
                    rows={4}
                    placeholder="スキルの詳細や経験したプロジェクト、資格などを記入してください"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                
                {/* スキルシートアップロード */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">スキルシート</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleFileSelect}
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center"
                    >
                      <FiUpload className="mr-2 h-4 w-4" />
                      スキルシートをアップロード
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xlsx,.xls"
                    />
                    {skillSheetFile && (
                      <div className="ml-4 text-sm text-gray-600 flex items-center">
                        <FiFile className="mr-1 h-4 w-4" />
                        {skillSheetFile}
                        <button
                          type="button"
                          onClick={() => setSkillSheetFile(null)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    サポートされているファイル形式: PDF, Word, Excel
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSkillModal(false)}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={saveSkillInfo}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* スキル詳細モーダル */}
          {showSkillDetailModal && selectedMember && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{selectedMember.user.name}のスキル詳細</h3>
                  <button
                    type="button"
                    onClick={() => setShowSkillDetailModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                
                {/* スキル一覧 */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <FiCheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                    スキル一覧
                  </h4>
                  {memberSkills.length > 0 ? (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {memberSkills.map((skill, index) => (
                        <div key={index} className="border border-gray-200 rounded-md p-3">
                          <div className="font-medium">{skill.name}</div>
                          <div className="flex flex-wrap gap-2 mt-2 text-sm">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                              {getSkillLevelLabel(skill.level)}
                            </span>
                            {skill.years && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                経験年数: {skill.years}年
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">スキルが登録されていません</p>
                  )}
                </div>
                
                {/* スキル詳細説明 */}
                {skillDescription && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                      <FiInfo className="mr-2 h-4 w-4 text-blue-500" />
                      スキル詳細説明
                    </h4>
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                      {skillDescription}
                    </div>
                  </div>
                )}
                
                {/* スキルシート */}
                {skillSheetFile && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                      <FiFile className="mr-2 h-4 w-4 text-blue-500" />
                      スキルシート
                    </h4>
                    <div className="mt-2 flex items-center text-sm">
                      <FiFile className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{skillSheetFile}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => openSkillModal(selectedMember)}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-2"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSkillDetailModal(false)}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    閉じる
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