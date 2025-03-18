'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiBell, FiLock, FiGlobe, FiHelpCircle, FiLogOut, FiRefreshCw } from 'react-icons/fi';
import { useTaskContext } from '@/contexts/TaskContext';

const DecorativeBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {/* 背景パターン */}
    <div className="absolute inset-0 opacity-20">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          {/* ドットパターン */}
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="2" fill="currentColor" className="text-pink-300" />
          </pattern>
          {/* 花柄パターン */}
          <pattern id="flowers" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <path
              d="M25,0 C25,0 30,10 35,10 C40,10 45,0 45,0 C45,0 40,10 35,10 C30,10 25,20 25,20 C25,20 20,10 15,10 C10,10 5,0 5,0 C5,0 10,10 15,10 C20,10 25,0 25,0"
              fill="currentColor"
              className="text-pink-200"
            />
          </pattern>
          {/* 波線パターン */}
          <pattern id="waves" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M0,10 Q25,0 50,10 T100,10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-pink-100"
            />
          </pattern>
          {/* 追加の装飾パターン */}
          <pattern id="hearts" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <path
              d="M15,0 C15,0 18,5 20,5 C22,5 25,0 25,0 C25,0 22,5 20,5 C18,5 15,10 15,10 C15,10 12,5 10,5 C8,5 5,0 5,0 C5,0 8,5 10,5 C12,5 15,0 15,0"
              fill="currentColor"
              className="text-red-200"
            />
          </pattern>
          <pattern id="stars" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M20,0 L24,12 L36,12 L26,20 L30,32 L20,24 L10,32 L14,20 L4,12 L16,12 Z"
              fill="currentColor"
              className="text-yellow-200"
            />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#dots)" />
        <rect width="100" height="100" fill="url(#flowers)" />
        <rect width="100" height="100" fill="url(#waves)" />
        <rect width="100" height="100" fill="url(#hearts)" />
        <rect width="100" height="100" fill="url(#stars)" />
      </svg>
    </div>

    {/* グラデーションオーバーレイ */}
    <div className="absolute inset-0 bg-gradient-to-br from-pink-50/60 via-beige-50/60 to-pink-100/60"></div>

    {/* 装飾要素（サイドバーを避けるため位置を調整） */}
    <motion.svg
      className="absolute top-20 left-20 w-32 h-32 text-pink-300/40 hover:text-pink-300/60 cursor-pointer pointer-events-auto"
      viewBox="0 0 24 24"
      whileHover={{ scale: 1.2, rotate: 360 }}
      animate={{
        rotate: [0, 360],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear",
        hover: { duration: 0.5 }
      }}
    >
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
      />
    </motion.svg>

    <motion.svg
      className="absolute bottom-20 right-20 w-40 h-40 text-pink-300/40 hover:text-pink-300/60 cursor-pointer pointer-events-auto"
      viewBox="0 0 24 24"
      whileHover={{ scale: 1.2, rotate: -360 }}
      animate={{
        rotate: [360, 0],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: "linear",
        hover: { duration: 0.5 }
      }}
    >
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
      />
    </motion.svg>

    <motion.svg
      className="absolute top-20 right-20 w-16 h-16 text-yellow-300/30 hover:text-yellow-300/50 cursor-pointer pointer-events-auto"
      viewBox="0 0 24 24"
      whileHover={{ scale: 1.3, rotate: 180 }}
      animate={{
        rotate: [0, 180],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "linear",
        hover: { duration: 0.5 }
      }}
    >
      <path
        fill="currentColor"
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      />
    </motion.svg>

    <motion.svg
      className="absolute bottom-20 left-20 w-20 h-20 text-red-300/30 hover:text-red-300/50 cursor-pointer pointer-events-auto"
      viewBox="0 0 24 24"
      whileHover={{ scale: 1.2, y: -20 }}
      animate={{
        scale: [1, 1.1, 1],
        y: [0, -10, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        hover: { duration: 0.5 }
      }}
    >
      <path
        fill="currentColor"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </motion.svg>

    {/* 装飾的な点（サイドバーを避けるため位置を調整） */}
    <motion.div
      className="absolute top-1/4 right-1/4 w-6 h-6 bg-pink-300/40 rounded-full hover:bg-pink-300/60 cursor-pointer pointer-events-auto"
      whileHover={{ scale: 1.5 }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.4, 0.6, 0.4],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        hover: { duration: 0.3 }
      }}
    ></motion.div>
    <motion.div
      className="absolute bottom-1/4 left-1/4 w-8 h-8 bg-pink-300/40 rounded-full hover:bg-pink-300/60 cursor-pointer pointer-events-auto"
      whileHover={{ scale: 1.5 }}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.4, 0.7, 0.4],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1,
        hover: { duration: 0.3 }
      }}
    ></motion.div>
    <motion.div
      className="absolute top-1/3 right-1/3 w-4 h-4 bg-pink-300/40 rounded-full hover:bg-pink-300/60 cursor-pointer pointer-events-auto"
      whileHover={{ scale: 1.5 }}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.4, 0.5, 0.4],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2,
        hover: { duration: 0.3 }
      }}
    ></motion.div>
  </div>
);

const DecorativeFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    {/* 手書き風の装飾フレーム */}
    <svg className="absolute -top-4 -left-4 w-8 h-8 text-pink-200" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
      />
    </svg>
    <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-pink-200/50 relative hover:bg-white/40 transition-colors duration-300">
      {/* 手書き風の装飾線 */}
      <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-pink-200/50 rounded-tl-lg"></div>
      <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-pink-200/50 rounded-tr-lg"></div>
      <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-pink-200/50 rounded-bl-lg"></div>
      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-pink-200/50 rounded-br-lg"></div>
      {children}
    </div>
  </div>
);

const Ribbon = ({ text }: { text: string }) => (
  <div className="relative mb-6">
    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-pink-200 text-pink-800 px-4 py-1 rounded-full text-sm font-medium shadow-md">
      {/* リボンの装飾 */}
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-pink-200 rotate-45"></div>
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-pink-200 rotate-45"></div>
      {text}
    </div>
  </div>
);

const SettingsView = () => {
  const { resetTasks, resetTasksWithSchedule } = useTaskContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-beige-50 to-pink-100 p-6 relative">
      <DecorativeBackground />
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-pink-800 mb-4">設定</h1>
          <div className="w-24 h-1 bg-pink-200 mx-auto rounded-full"></div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* データリセット */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="col-span-1 md:col-span-2 hover:scale-105 transition-transform duration-300"
          >
            <DecorativeFrame>
              <Ribbon text="データリセット" />
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-200/80 rounded-full">
                  <FiRefreshCw className="w-6 h-6 text-blue-800" />
                </div>
                <h2 className="text-xl font-semibold text-blue-800 ml-4">データ管理</h2>
              </div>
              <p className="text-blue-600 mb-4">システムデータをリセットします</p>
              <div className="flex justify-center">
                <button 
                  onClick={resetTasksWithSchedule}
                  className="bg-blue-200/80 hover:bg-blue-300 text-blue-800 py-2 px-8 rounded-full transition-colors shadow-md"
                >
                  データをリセット
                </button>
              </div>
            </DecorativeFrame>
          </motion.div>

          {/* アカウント設定 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hover:scale-105 transition-transform duration-300"
          >
            <DecorativeFrame>
              <Ribbon text="アカウント設定" />
              <div className="flex items-center mb-4">
                <div className="p-3 bg-pink-200/80 rounded-full">
                  <FiUser className="w-6 h-6 text-pink-800" />
                </div>
                <h2 className="text-xl font-semibold text-pink-800 ml-4">プロフィール</h2>
              </div>
              <p className="text-pink-600 mb-4">プロフィール情報の管理と更新</p>
              <button className="w-full bg-pink-200/80 hover:bg-pink-300 text-pink-800 py-2 px-4 rounded-full transition-colors shadow-md">
                編集する
              </button>
            </DecorativeFrame>
          </motion.div>

          {/* 通知設定 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="hover:scale-105 transition-transform duration-300"
          >
            <DecorativeFrame>
              <Ribbon text="通知設定" />
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-200/80 rounded-full">
                  <FiBell className="w-6 h-6 text-purple-800" />
                </div>
                <h2 className="text-xl font-semibold text-purple-800 ml-4">通知</h2>
              </div>
              <p className="text-purple-600 mb-4">通知の受信設定と管理</p>
              <button className="w-full bg-purple-200/80 hover:bg-purple-300 text-purple-800 py-2 px-4 rounded-full transition-colors shadow-md">
                設定する
              </button>
            </DecorativeFrame>
          </motion.div>

          {/* セキュリティ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="hover:scale-105 transition-transform duration-300"
          >
            <DecorativeFrame>
              <Ribbon text="セキュリティ" />
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-200/80 rounded-full">
                  <FiLock className="w-6 h-6 text-green-800" />
                </div>
                <h2 className="text-xl font-semibold text-green-800 ml-4">セキュリティ</h2>
              </div>
              <p className="text-green-600 mb-4">パスワードとセキュリティ設定</p>
              <button className="w-full bg-green-200/80 hover:bg-green-300 text-green-800 py-2 px-4 rounded-full transition-colors shadow-md">
                変更する
              </button>
            </DecorativeFrame>
          </motion.div>

          {/* 言語と地域 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="hover:scale-105 transition-transform duration-300"
          >
            <DecorativeFrame>
              <Ribbon text="言語と地域" />
              <div className="flex items-center mb-4">
                <div className="p-3 bg-yellow-200/80 rounded-full">
                  <FiGlobe className="w-6 h-6 text-yellow-800" />
                </div>
                <h2 className="text-xl font-semibold text-yellow-800 ml-4">言語設定</h2>
              </div>
              <p className="text-yellow-600 mb-4">表示言語と地域設定</p>
              <button className="w-full bg-yellow-200/80 hover:bg-yellow-300 text-yellow-800 py-2 px-4 rounded-full transition-colors shadow-md">
                設定する
              </button>
            </DecorativeFrame>
          </motion.div>

          {/* ヘルプとサポート */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="hover:scale-105 transition-transform duration-300"
          >
            <DecorativeFrame>
              <Ribbon text="ヘルプとサポート" />
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-200/80 rounded-full">
                  <FiHelpCircle className="w-6 h-6 text-red-800" />
                </div>
                <h2 className="text-xl font-semibold text-red-800 ml-4">サポート</h2>
              </div>
              <p className="text-red-600 mb-4">サポートとFAQ</p>
              <button className="w-full bg-red-200/80 hover:bg-red-300 text-red-800 py-2 px-4 rounded-full transition-colors shadow-md">
                確認する
              </button>
            </DecorativeFrame>
          </motion.div>

          {/* ログアウト */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="hover:scale-105 transition-transform duration-300"
          >
            <DecorativeFrame>
              <Ribbon text="ログアウト" />
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gray-200/80 rounded-full">
                  <FiLogOut className="w-6 h-6 text-gray-800" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 ml-4">ログアウト</h2>
              </div>
              <p className="text-gray-600 mb-4">アカウントからログアウト</p>
              <button className="w-full bg-gray-200/80 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-full transition-colors shadow-md">
                ログアウト
              </button>
            </DecorativeFrame>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView; 