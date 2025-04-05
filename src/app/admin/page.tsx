'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiDollarSign, FiTag, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuth } from '@/services/auth/hooks/useAuth'
import Auth from '@/services/auth/components/Auth'

// 支払いの型定義
interface Payment {
  id: string
  date: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  description: string
}

// 割引コードの型定義
interface DiscountCode {
  id: string
  code: string
  discount: number // パーセント値 (例: 10 = 10%)
  isActive: boolean
  validUntil: string // ISO日付文字列
}

export default function AdminPage() {
  const router = useRouter()
  const { isAuthenticated, user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('admin')
  const [view, setView] = useState<'payments' | 'discounts'>('payments')
  
  // 支払い関連の状態
  const [payments, setPayments] = useState<Payment[]>([
    { id: '1', date: '2023-04-15', amount: 10000, status: 'completed', description: '基本プラン - 4月分' },
    { id: '2', date: '2023-05-15', amount: 10000, status: 'completed', description: '基本プラン - 5月分' },
    { id: '3', date: '2023-06-15', amount: 15000, status: 'completed', description: 'プレミアムプラン - 6月分' },
    { id: '4', date: '2023-07-15', amount: 15000, status: 'pending', description: 'プレミアムプラン - 7月分' }
  ])
  
  // 割引コード関連の状態
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([
    { id: '1', code: 'WELCOME10', discount: 10, isActive: true, validUntil: '2023-12-31' },
    { id: '2', code: 'SUMMER25', discount: 25, isActive: true, validUntil: '2023-08-31' },
    { id: '3', code: 'EARLYBIRD', discount: 15, isActive: false, validUntil: '2023-03-31' }
  ])
  
  // 編集用の状態
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null)
  const [newCode, setNewCode] = useState({ code: '', discount: 10, validUntil: '' })
  const [showAddCodeForm, setShowAddCodeForm] = useState(false)
  
  // 管理者かどうかチェック
  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'admin') {
      // 管理者でない場合はホームページにリダイレクト
      router.push('/')
    }
  }, [isAuthenticated, user, router])
  
  if (!isAuthenticated) {
    return <Auth onLogin={login} />
  }
  
  // 管理者でなければアクセスできないことを表示
  if (user?.role !== 'admin') {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onLogout={logout} user={user || undefined} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-4">アクセス権限がありません</h1>
              <p className="text-gray-600">このページは管理者のみがアクセスできます。</p>
            </div>
          </main>
        </div>
      </div>
    )
  }
  
  // 割引コードを追加
  const handleAddDiscountCode = () => {
    if (!newCode.code || !newCode.validUntil) return
    
    const newDiscountCode: DiscountCode = {
      id: `dc-${Date.now()}`,
      code: newCode.code,
      discount: newCode.discount,
      isActive: true,
      validUntil: newCode.validUntil
    }
    
    setDiscountCodes([...discountCodes, newDiscountCode])
    setNewCode({ code: '', discount: 10, validUntil: '' })
    setShowAddCodeForm(false)
  }
  
  // 割引コードを削除
  const handleDeleteDiscountCode = (id: string) => {
    if (confirm('この割引コードを削除してもよろしいですか？')) {
      setDiscountCodes(discountCodes.filter(code => code.id !== id))
    }
  }
  
  // 割引コードの有効・無効を切り替え
  const toggleDiscountCodeStatus = (id: string) => {
    setDiscountCodes(discountCodes.map(code => 
      code.id === id ? { ...code, isActive: !code.isActive } : code
    ))
  }
  
  // 割引コードを更新
  const handleUpdateDiscountCode = (id: string, updatedValues: Partial<DiscountCode>) => {
    setDiscountCodes(discountCodes.map(code => 
      code.id === id ? { ...code, ...updatedValues } : code
    ))
    setEditingCodeId(null)
  }
  
  // 支払いステータスの表示
  const getPaymentStatusBadge = (status: Payment['status']) => {
    switch(status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">完了</span>
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">処理中</span>
      case 'failed':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">失敗</span>
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={logout} user={user || undefined} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">管理者設定</h1>
            </div>
            
            {/* タブメニュー */}
            <div className="bg-white shadow-sm rounded-lg mb-6">
              <div className="flex border-b">
                <button
                  onClick={() => setView('payments')}
                  className={`flex items-center px-6 py-3 text-sm font-medium ${
                    view === 'payments' 
                      ? 'border-b-2 border-blue-500 text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiDollarSign className="mr-2" />
                  支払い管理
                </button>
                <button
                  onClick={() => setView('discounts')}
                  className={`flex items-center px-6 py-3 text-sm font-medium ${
                    view === 'discounts' 
                      ? 'border-b-2 border-blue-500 text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiTag className="mr-2" />
                  割引コード設定
                </button>
              </div>
            </div>
            
            {/* 支払い管理ビュー */}
            {view === 'payments' && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">支払い履歴</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          日付
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          金額
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          説明
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ステータス
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ¥{payment.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getPaymentStatusBadge(payment.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* 割引コード設定ビュー */}
            {view === 'discounts' && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">割引コード</h2>
                  <button
                    onClick={() => setShowAddCodeForm(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FiPlus className="mr-1" />
                    新規追加
                  </button>
                </div>
                
                {/* 新規割引コード追加フォーム */}
                {showAddCodeForm && (
                  <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <h3 className="text-md font-medium text-blue-900 mb-3">新規割引コード</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700">コード</label>
                        <input
                          type="text"
                          id="code"
                          value={newCode.code}
                          onChange={(e) => setNewCode({...newCode, code: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="例: SUMMER25"
                        />
                      </div>
                      <div>
                        <label htmlFor="discount" className="block text-sm font-medium text-gray-700">割引率 (%)</label>
                        <input
                          type="number"
                          id="discount"
                          min="1"
                          max="100"
                          value={newCode.discount}
                          onChange={(e) => setNewCode({...newCode, discount: parseInt(e.target.value)})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">有効期限</label>
                        <input
                          type="date"
                          id="validUntil"
                          value={newCode.validUntil}
                          onChange={(e) => setNewCode({...newCode, validUntil: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        onClick={() => setShowAddCodeForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleAddDiscountCode}
                        disabled={!newCode.code || !newCode.validUntil}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          コード
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          割引率
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          有効期限
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ステータス
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {discountCodes.map((code) => (
                        <tr key={code.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {editingCodeId === code.id ? (
                              <input
                                type="text"
                                value={code.code}
                                onChange={(e) => handleUpdateDiscountCode(code.id, { code: e.target.value })}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            ) : (
                              code.code
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {editingCodeId === code.id ? (
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={code.discount}
                                onChange={(e) => handleUpdateDiscountCode(code.id, { discount: parseInt(e.target.value) })}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            ) : (
                              `${code.discount}%`
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {editingCodeId === code.id ? (
                              <input
                                type="date"
                                value={code.validUntil}
                                onChange={(e) => handleUpdateDiscountCode(code.id, { validUntil: e.target.value })}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            ) : (
                              code.validUntil
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleDiscountCodeStatus(code.id)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                code.isActive 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              {code.isActive ? '有効' : '無効'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {editingCodeId === code.id ? (
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => setEditingCodeId(null)}
                                  className="text-gray-400 hover:text-gray-500"
                                >
                                  <FiX className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingCodeId(null)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <FiCheck className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => setEditingCodeId(code.id)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <FiEdit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDiscountCode(code.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 