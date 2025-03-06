'use client'

import { useState, useEffect } from 'react'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // ローカルストレージから認証状態を取得
    const authData = localStorage.getItem('authData')
    if (authData) {
      const { timestamp } = JSON.parse(authData)
      // 1時間以内の認証かチェック
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        setIsAuthenticated(true)
      } else {
        // 1時間以上経過している場合は認証状態をクリア
        localStorage.removeItem('authData')
      }
    }
  }, [])

  const login = () => {
    // 認証状態を保存（タイムスタンプ付き）
    localStorage.setItem('authData', JSON.stringify({
      timestamp: Date.now()
    }))
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('authData')
    setIsAuthenticated(false)
  }

  return { isAuthenticated, login, logout }
} 