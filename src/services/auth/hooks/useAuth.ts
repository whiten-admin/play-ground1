'use client'

import { useState, useEffect } from 'react'
import { User, UserRole } from '@/types/user'
import usersData from '@/data/users.json'

// 型の定義
interface UserData {
  id: string
  password: string
  name: string
  role: UserRole
}

// JSONデータの型をUserData配列として型付け
const users: UserData[] = usersData as UserData[]

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // ローカルストレージから認証状態を取得
    const authData = localStorage.getItem('authData')
    if (authData) {
      const { timestamp, user } = JSON.parse(authData)
      // 1時間以内の認証かチェック
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        setIsAuthenticated(true)
        setUser(user)
      } else {
        // 1時間以上経過している場合は認証状態をクリア
        localStorage.removeItem('authData')
      }
    }
  }, [])

  const login = (id: string, password: string) => {
    // ユーザーIDとパスワードで認証
    const foundUser = users.find(u => u.id === id && u.password === password)
    
    if (foundUser) {
      // ユーザー情報を作成
      const newUser: User = {
        id: foundUser.id,
        name: foundUser.name,
        role: foundUser.role
      }
      
      // 認証状態を保存（タイムスタンプ付き）
      localStorage.setItem('authData', JSON.stringify({
        timestamp: Date.now(),
        user: newUser
      }))
      setIsAuthenticated(true)
      setUser(newUser)
      return true
    }
    
    return false
  }

  const logout = () => {
    localStorage.removeItem('authData')
    setIsAuthenticated(false)
    setUser(null)
  }

  return { isAuthenticated, user, login, logout }
} 