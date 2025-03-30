'use client'

import { useState } from 'react'
import usersData from '@/features/tasks/users/users.json'
import Logo from '@/components/Logo'
import { theme } from '@/styles/theme'

interface AuthProps {
  onLogin: (id: string, password: string) => boolean
}

export default function Auth({ onLogin }: AuthProps) {
  const [id, setId] = useState('taro')
  const [password, setPassword] = useState('aaa')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isSuccess = onLogin(id, password)
    
    if (!isSuccess) {
      setError('IDまたはパスワードが正しくありません')
    } else {
      setError('')
    }
  }

  // テーマカラーを直接変数として定義
  const primaryColor = theme?.colors?.primary || '#8BC34A'
  const primaryHoverColor = theme?.colors?.primaryHover || '#7CB342'

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex justify-center mb-6">
          <Logo className="mb-4" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">ログイン</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              ID
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}
          <button
            type="submit"
            className="w-full text-white py-2 rounded-lg transition-colors"
            style={{ backgroundColor: primaryColor }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = primaryHoverColor}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = primaryColor}
          >
            ログイン
          </button>
        </form>

        <div className="mt-6 border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">利用可能なアカウント（開発用）：</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {usersData.map((user: any) => (
              <div key={user.id} className="bg-gray-50 p-2 rounded">
                <p className="font-bold">{user.name}</p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">ID: {user.id}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    user.role === 'manager' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'manager' ? 'マネージャー' : 'メンバー'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 