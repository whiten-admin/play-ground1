'use client';

import React from 'react';
import { FiCheckCircle, FiHelpCircle, FiArrowRight, FiBook, FiClock, FiUsers, FiCalendar } from 'react-icons/fi';

const GuideCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">{title}</h2>
    {children}
  </div>
);

const StepCard = ({ number, title, description, icon: Icon }: { number: number, title: string, description: string, icon: any }) => (
  <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
      <span className="text-blue-600 font-semibold">{number}</span>
    </div>
    <div className="flex-1">
      <div className="flex items-center space-x-2 mb-2">
        <Icon className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  </div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => (
  <div className="mb-4">
    <div className="flex items-start space-x-2 mb-2">
      <FiHelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
      <h3 className="font-semibold text-gray-800">{question}</h3>
    </div>
    <p className="text-gray-600 text-sm ml-7">{answer}</p>
  </div>
);

const GuideView = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">使い方ガイド</h1>
          <div className="w-16 h-1 bg-blue-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* はじめに */}
          <GuideCard title="はじめに">
            <div className="space-y-4">
              <p className="text-gray-600">
                このガイドでは、プロジェクト管理ツールの基本的な使い方を説明します。
                各機能の使い方を順番に確認していきましょう。
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-700 text-sm">
                  <FiCheckCircle className="inline-block mr-1" />
                  初めての方は、以下のステップに従って進めることをお勧めします。
                </p>
              </div>
            </div>
          </GuideCard>

          {/* 基本ステップ */}
          <GuideCard title="基本ステップ">
            <div className="space-y-4">
              <StepCard
                number={1}
                title="プロジェクト情報の設定"
                description="まずはプロジェクトの基本情報を設定します。プロジェクト名、期間、フェーズなどを入力してください。"
                icon={FiBook}
              />
              <StepCard
                number={2}
                title="タスクの作成"
                description="プロジェクトに必要なタスクを作成します。タスクには期限や担当者を設定できます。"
                icon={FiClock}
              />
              <StepCard
                number={3}
                title="チームの設定"
                description="プロジェクトメンバーを追加し、それぞれの役割を設定します。"
                icon={FiUsers}
              />
              <StepCard
                number={4}
                title="スケジュールの管理"
                description="作成したタスクをカレンダー上で管理し、進捗を確認します。"
                icon={FiCalendar}
              />
            </div>
          </GuideCard>

          {/* よくある質問 */}
          <GuideCard title="よくある質問">
            <div className="space-y-4">
              <FAQItem
                question="タスクの期限を変更するには？"
                answer="タスクをクリックして詳細画面を開き、期限欄を編集してください。カレンダーから日付を選択することもできます。"
              />
              <FAQItem
                question="プロジェクトの進捗状況はどこで確認できます？"
                answer="PJ分析画面で、プロジェクト全体の進捗状況や、タスクの完了率などを確認できます。"
              />
              <FAQItem
                question="WBSとは何ですか？"
                answer="WBS（Work Breakdown Structure）は、プロジェクトの作業を階層的に分解して管理する手法です。大きなタスクを小さな作業に分割して管理できます。"
              />
              <FAQItem
                question="データのバックアップはできますか？"
                answer="設定画面から、プロジェクトデータのエクスポートとインポートが可能です。定期的にバックアップを取ることをお勧めします。"
              />
            </div>
          </GuideCard>

          {/* ショートカットキー */}
          <GuideCard title="ショートカットキー">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold text-gray-800 mb-1">タスクの作成</div>
                <div className="text-sm text-gray-600">Ctrl + N</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold text-gray-800 mb-1">タスクの検索</div>
                <div className="text-sm text-gray-600">Ctrl + F</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold text-gray-800 mb-1">カレンダー表示</div>
                <div className="text-sm text-gray-600">Ctrl + C</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold text-gray-800 mb-1">設定画面</div>
                <div className="text-sm text-gray-600">Ctrl + S</div>
              </div>
            </div>
          </GuideCard>
        </div>
      </div>
    </div>
  );
};

export default GuideView; 