'use client';

import React from 'react';

interface Risk {
  id: number;
  title: string;
  impact: 'high' | 'medium' | 'low';
  probability: 'high' | 'medium' | 'low';
  status: 'active' | 'mitigated' | 'closed';
  description: string;
}

const RiskAssessment: React.FC = () => {
  // サンプルデータ
  const risks: Risk[] = [
    {
      id: 1,
      title: '技術的な課題',
      impact: 'high',
      probability: 'medium',
      status: 'active',
      description: '新技術の導入による開発遅延のリスク'
    },
    {
      id: 2,
      title: 'リソース不足',
      impact: 'medium',
      probability: 'high',
      status: 'active',
      description: '開発者の不足によるスケジュール遅延'
    },
    {
      id: 3,
      title: '要件変更',
      impact: 'high',
      probability: 'low',
      status: 'mitigated',
      description: 'クライアントからの要件変更による影響'
    },
    {
      id: 4,
      title: 'セキュリティ脆弱性',
      impact: 'high',
      probability: 'low',
      status: 'active',
      description: 'システムのセキュリティ脆弱性によるリスク'
    }
  ];

  // リスクレベルに応じた色を返す関数
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getProbabilityColor = (probability: string) => {
    switch (probability) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-red-600 bg-red-50';
      case 'mitigated':
        return 'text-yellow-600 bg-yellow-50';
      case 'closed':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // リスクレベルのラベルを日本語に変換する関数
  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '不明';
    }
  };

  const getProbabilityLabel = (probability: string) => {
    switch (probability) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '不明';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '対応中';
      case 'mitigated':
        return '軽減済';
      case 'closed':
        return '解決済';
      default:
        return '不明';
    }
  };

  return (
    <div className="overflow-auto max-h-64">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              リスク
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              影響度
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              発生確率
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              状態
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {risks.map((risk) => (
            <tr key={risk.id}>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{risk.title}</div>
                <div className="text-xs text-gray-500">{risk.description}</div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getImpactColor(risk.impact)}`}>
                  {getImpactLabel(risk.impact)}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getProbabilityColor(risk.probability)}`}>
                  {getProbabilityLabel(risk.probability)}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(risk.status)}`}>
                  {getStatusLabel(risk.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RiskAssessment; 