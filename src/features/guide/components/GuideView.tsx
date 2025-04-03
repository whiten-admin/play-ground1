'use client';

import React from 'react';
import Image from 'next/image';
import { FiInfo, FiCalendar, FiClock, FiPieChart, FiCheckSquare, FiUsers, FiActivity, FiTrendingUp } from 'react-icons/fi';

// 機能説明カードコンポーネント
const FeatureCard = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
    <div className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Icon className="w-6 h-6 text-blue-600" />
        <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
      </div>
      
      {/* ダミー画像エリア */}
      <div className="bg-gray-100 w-full h-40 flex items-center justify-center mb-4 rounded-md">
        <span className="text-gray-400 font-medium">No Image</span>
      </div>
      
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  </div>
);

// セクションタイトルコンポーネント
const SectionTitle = ({ title }: { title: string }) => (
  <div className="mb-6 mt-10 first:mt-4">
    <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
    <div className="w-20 h-1 bg-blue-500 rounded-full"></div>
  </div>
);

const GuideView = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">使い方ガイド</h1>
          <p className="text-gray-600">各機能の使い方と活用方法をご紹介します</p>
          <div className="w-24 h-1 bg-blue-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* PJ立ち上げ時 */}
        <SectionTitle title="PJ立ち上げ時" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            title="プロジェクト情報の読み込み自動化"
            description="外部ファイルやシステムからプロジェクト情報を自動的に読み込み、初期設定の手間を大幅に削減できます。CSV、Excel、または他のプロジェクト管理ツールからのインポートに対応しています。"
            icon={FiInfo}
          />
          <FeatureCard
            title="想定タスク・TODOの生成"
            description="プロジェクトの種類や規模に基づいて、必要なタスクやTODOを自動的に生成します。テンプレートから選択するだけで、基本的なタスク構造を簡単に作成できます。"
            icon={FiCheckSquare}
          />
          <FeatureCard
            title="工数見積もりの自動化、補助"
            description="過去のプロジェクトデータを基に、各タスクの工数を自動的に見積もります。類似タスクの実績から予測されるため、より現実的な計画が立てられます。"
            icon={FiClock}
          />
          <FeatureCard
            title="予定スケジュールの自動生成"
            description="タスクの依存関係や工数見積もりから、最適なスケジュールを自動で生成します。メンバーのスキルや稼働状況も考慮した実現可能なスケジュールを提案します。"
            icon={FiCalendar}
          />
        </div>

        {/* 日々のタスク管理 */}
        <SectionTitle title="日々のタスク管理" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            title="今日のTODOの表示"
            description="ログイン時に今日取り組むべきタスクを優先度順に表示します。期限が近いものや重要度の高いタスクが自動的に上位に表示され、効率的な作業計画が立てられます。"
            icon={FiCheckSquare}
          />
          <FeatureCard
            title="スケジュールへの反映"
            description="完了したタスクや追加されたタスクに応じて、自動的にスケジュールを更新します。進捗状況に合わせてタイムラインが調整され、常に最新の計画を確認できます。"
            icon={FiCalendar}
          />
          <FeatureCard
            title="自動スケジュール調整機能"
            description="遅延や早期完了があった場合、残りのタスクスケジュールを自動調整します。リソースの制約を考慮しながら、最適な再スケジューリングを行います。"
            icon={FiActivity}
          />
          <FeatureCard
            title="プロジェクト横断でのタスク、TODO管理"
            description="複数のプロジェクトに参加している場合でも、自分のタスクやTODOを一元管理できます。プロジェクトごとに切り替えることなく、自分の担当業務を一覧で確認できます。"
            icon={FiPieChart}
          />
        </div>

        {/* PJ状況の把握・分析 */}
        <SectionTitle title="PJ状況の把握・分析" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <FeatureCard
            title="予定工数、実績工数の見える化"
            description="タスクごとの予定工数と実績工数をグラフやチャートで視覚的に表示します。差異が大きい領域を簡単に特定でき、今後の見積もり精度向上に役立ちます。"
            icon={FiClock}
          />
          <FeatureCard
            title="メンバー負荷の見える化"
            description="チームメンバーごとの作業負荷をヒートマップで表示します。特定のメンバーへの過度な負荷集中や、リソース配分の不均衡を早期に発見できます。"
            icon={FiUsers}
          />
          <FeatureCard
            title="進捗及びリスクの見える化"
            description="プロジェクト全体の進捗状況とリスク要因を一目で把握できるダッシュボードを提供します。遅延の兆候やボトルネックを早期に発見し、対策を講じることができます。"
            icon={FiTrendingUp}
          />
          <FeatureCard
            title="プロジェクト分析レポート"
            description="プロジェクトのパフォーマンス指標を自動分析し、定期的なレポートを生成します。トレンド分析や予測により、プロジェクトの健全性を継続的に評価できます。"
            icon={FiActivity}
          />
        </div>
      </div>
    </div>
  );
};

export default GuideView; 