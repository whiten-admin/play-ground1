import { Task } from '@/types/task';

// プロジェクトA（ECサイト構築）のシードデータ
export const seedTasks: Task[] = [
  {
    id: 'task-1',
    title: '要件定義',
    description: 'ECサイトの要件を定義し、主要な機能と非機能要件を明確化します。ステークホルダーとの合意を得ることが目標です。',
    startDate: '2025-03-03',
    endDate: '2025-03-05',
    priority: 2, // 高
    assigneeIds: ['taro', 'gonzo', 'hanako'], // すべてのTODO担当者の和集合
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-1-1',
        text: '競合サイトの調査',
        completed: false,
        startDate: '2025-03-03',
        endDate: '2025-03-04',
        dueDate: new Date(2025, 2, 3),
        estimatedHours: 4,
        assigneeIds: ['taro'] // 太郎が担当
      },
      {
        id: 'todo-1-2',
        text: '機能要件のリストアップ',
        completed: false,
        startDate: '2025-03-04',
        endDate: '2025-03-05',
        dueDate: new Date(2025, 2, 3),
        estimatedHours: 3,
        assigneeIds: ['gonzo'] // ゴンゾウが担当
      },
      {
        id: 'todo-1-3',
        text: '非機能要件の定義',
        completed: false,
        startDate: '2025-03-03',
        endDate: '2025-03-04',
        dueDate: new Date(2025, 2, 4),
        estimatedHours: 2,
        assigneeIds: ['taro', 'gonzo'] // 太郎とゴンゾウが共同で担当
      },
      {
        id: 'todo-1-4',
        text: 'ステークホルダーとの要件レビュー会議',
        completed: false,
        startDate: '2025-03-04',
        endDate: '2025-03-05',
        dueDate: new Date(2025, 2, 5),
        estimatedHours: 2,
        assigneeIds: ['taro', 'gonzo', 'hanako'] // 全員参加
      }
    ]
  },
  {
    id: 'task-2',
    title: 'データベース設計',
    description: 'ECサイトで必要なデータベーススキーマを設計します。商品、ユーザー、注文など主要なエンティティの関連を定義します。',
    startDate: '2025-03-06',
    endDate: '2025-03-10',
    priority: 2, // 高
    assigneeIds: ['jiro', 'saburo', 'taro'], // すべてのTODO担当者の和集合
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-2-1',
        text: 'エンティティの洗い出し',
        completed: false,
        startDate: '2025-03-06',
        endDate: '2025-03-07',
        dueDate: new Date(2025, 2, 7),
        estimatedHours: 3,
        assigneeIds: ['jiro'] // 次郎が担当
      },
      {
        id: 'todo-2-2',
        text: 'ER図の作成',
        completed: false,
        startDate: '2025-03-07',
        endDate: '2025-03-08',
        dueDate: new Date(2025, 2, 7),
        estimatedHours: 4,
        assigneeIds: ['saburo'] // 三郎が担当
      },
      {
        id: 'todo-2-3',
        text: 'テーブル定義書の作成',
        completed: false,
        startDate: '2025-03-07',
        endDate: '2025-03-07',
        dueDate: new Date(2025, 2, 7),
        estimatedHours: 3,
        assigneeIds: ['jiro', 'saburo'] // 次郎と三郎が共同で担当
      },
      {
        id: 'todo-2-4',
        text: 'データベース設計のレビュー',
        completed: false,
        startDate: '2025-03-10',
        endDate: '2025-03-10',
        dueDate: new Date(2025, 2, 10),
        estimatedHours: 2,
        assigneeIds: ['taro', 'jiro', 'saburo'] // マネージャーと担当者
      }
    ]
  },
  {
    id: 'task-3',
    title: 'UI/UXデザイン',
    description: 'ECサイトのユーザーインターフェースを設計します。使いやすさと視覚的な魅力を両立させることが目標です。',
    startDate: '2025-03-11',
    endDate: '2025-03-17',
    priority: 1, // 中
    assigneeIds: ['hanako', 'taro', 'gonzo'], // すべてのTODO担当者の和集合
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-3-1',
        text: 'ワイヤーフレームの作成',
        completed: false,
        startDate: '2025-03-11',
        endDate: '2025-03-12',
        dueDate: new Date(2025, 2, 12),
        estimatedHours: 4,
        assigneeIds: ['hanako'] // 花子が担当
      },
      {
        id: 'todo-3-2',
        text: 'デザインシステムの構築',
        completed: false,
        startDate: '2025-03-13',
        endDate: '2025-03-14',
        dueDate: new Date(2025, 2, 14),
        estimatedHours: 3,
        assigneeIds: ['hanako'] // 花子が担当
      },
      {
        id: 'todo-3-3',
        text: '主要画面のモックアップ作成',
        completed: false,
        startDate: '2025-03-14',
        endDate: '2025-03-14',
        dueDate: new Date(2025, 2, 14),
        estimatedHours: 4,
        assigneeIds: ['hanako'] // 花子が担当
      },
      {
        id: 'todo-3-4',
        text: 'デザインレビュー会議',
        completed: false,
        startDate: '2025-03-17',
        endDate: '2025-03-17',
        dueDate: new Date(2025, 2, 17),
        estimatedHours: 2,
        assigneeIds: ['taro', 'gonzo', 'hanako'] // マネージャーとデザイナー
      }
    ]
  },
  {
    id: 'task-4',
    title: 'フロントエンド開発：商品一覧・詳細',
    description: '商品一覧ページと商品詳細ページのフロントエンド実装を行います。React.jsを使用して開発します。',
    startDate: '2025-03-18',
    endDate: '2025-03-24',
    priority: 1, // 中
    assigneeIds: [], // 未アサイン
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-4-1',
        text: 'コンポーネント設計',
        completed: false,
        startDate: '2025-03-18',
        endDate: '2025-03-19',
        dueDate: new Date(2025, 2, 19),
        estimatedHours: 3,
        assigneeIds: [] // 未アサイン
      },
      {
        id: 'todo-4-2',
        text: '商品一覧ページの実装',
        completed: false,
        startDate: '2025-03-20',
        endDate: '2025-03-21',
        dueDate: new Date(2025, 2, 21),
        estimatedHours: 4,
        assigneeIds: [] // 未アサイン
      },
      {
        id: 'todo-4-3',
        text: '商品詳細ページの実装',
        completed: false,
        startDate: '2025-03-21',
        endDate: '2025-03-21',
        dueDate: new Date(2025, 2, 24),
        estimatedHours: 4,
        assigneeIds: [] // 未アサイン
      },
      {
        id: 'todo-4-4',
        text: 'レスポンシブデザインの実装',
        completed: false,
        startDate: '2025-03-24',
        endDate: '2025-03-24',
        dueDate: new Date(2025, 2, 24),
        estimatedHours: 3,
        assigneeIds: [] // 未アサイン
      }
    ]
  },
  {
    id: 'task-5',
    title: 'フロントエンド開発：カート・注文',
    description: 'ショッピングカートと注文処理のフロントエンド実装を行います。状態管理にはReduxを使用します。',
    startDate: '2025-03-25',
    endDate: '2025-03-31',
    priority: 1, // 中
    assigneeIds: ['jiro', 'hanako'], // すべてのTODO担当者の和集合
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-5-1',
        text: 'カート状態設計',
        completed: false,
        startDate: '2025-03-25',
        endDate: '2025-03-26',
        dueDate: new Date(2025, 2, 26),
        estimatedHours: 2,
        assigneeIds: ['jiro'] // 次郎が担当
      },
      {
        id: 'todo-5-2',
        text: 'カートページの実装',
        completed: false,
        startDate: '2025-03-27',
        endDate: '2025-03-28',
        dueDate: new Date(2025, 2, 28),
        estimatedHours: 4,
        assigneeIds: ['jiro'] // 次郎が担当
      },
      {
        id: 'todo-5-3',
        text: '注文フォームの実装',
        completed: false,
        startDate: '2025-03-28',
        endDate: '2025-03-28',
        dueDate: new Date(2025, 2, 28),
        estimatedHours: 4,
        assigneeIds: ['jiro'] // 次郎が担当
      },
      {
        id: 'todo-5-4',
        text: '注文確認・完了画面の実装',
        completed: false,
        startDate: '2025-03-31',
        endDate: '2025-03-31',
        dueDate: new Date(2025, 2, 31),
        estimatedHours: 3,
        assigneeIds: ['jiro', 'hanako'] // 次郎と花子が共同で担当（UIレビュー）
      }
    ]
  },
  {
    id: 'task-6',
    title: 'バックエンド開発：認証システム',
    description: 'ユーザー認証システムの実装を行います。OAuth2.0やJWTを使った認証基盤を構築します。',
    startDate: '2025-04-01',
    endDate: '2025-04-07',
    priority: 2, // 高
    assigneeIds: ['saburo'], // すべてのTODO担当者の和集合
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-6-1',
        text: '認証システムの設計',
        completed: false,
        startDate: '2025-04-01',
        endDate: '2025-04-02',
        dueDate: new Date(2025, 3, 2),
        estimatedHours: 3,
        assigneeIds: ['saburo'] // 三郎が担当
      },
      {
        id: 'todo-6-2',
        text: 'ユーザー登録機能の実装',
        completed: false,
        startDate: '2025-04-03',
        endDate: '2025-04-04',
        dueDate: new Date(2025, 3, 4),
        estimatedHours: 4,
        assigneeIds: ['saburo'] // 三郎が担当
      },
      {
        id: 'todo-6-3',
        text: 'ログイン/ログアウト機能の実装',
        completed: false,
        startDate: '2025-04-04',
        endDate: '2025-04-04',
        dueDate: new Date(2025, 3, 7),
        estimatedHours: 4,
        assigneeIds: ['saburo'] // 三郎が担当
      },
      {
        id: 'todo-6-4',
        text: 'パスワードリセット機能の実装',
        completed: false,
        startDate: '2025-04-07',
        endDate: '2025-04-07',
        dueDate: new Date(2025, 3, 7),
        estimatedHours: 3,
        assigneeIds: ['saburo'] // 三郎が担当
      }
    ]
  },
  {
    id: 'task-7',
    title: 'バックエンド開発：商品API',
    description: '商品情報を管理するAPIの開発を行います。商品の検索、フィルタリング、ソート機能も実装します。',
    startDate: '2025-04-08',
    endDate: '2025-04-14',
    priority: 1, // 中
    assigneeIds: ['taro', 'jiro'], // すべてのTODO担当者の和集合
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-7-1',
        text: 'API設計（Swagger/OpenAPI）',
        completed: false,
        startDate: '2025-04-08',
        endDate: '2025-04-09',
        dueDate: new Date(2025, 3, 9),
        estimatedHours: 3,
        assigneeIds: ['taro'] // 太郎が担当
      },
      {
        id: 'todo-7-2',
        text: '商品CRUD操作の実装',
        completed: false,
        startDate: '2025-04-10',
        endDate: '2025-04-11',
        dueDate: new Date(2025, 3, 11),
        estimatedHours: 4,
        assigneeIds: ['jiro'] // 次郎が担当
      },
      {
        id: 'todo-7-3',
        text: '検索・フィルタリング機能の実装',
        completed: false,
        startDate: '2025-04-11',
        endDate: '2025-04-11',
        dueDate: new Date(2025, 3, 14),
        estimatedHours: 4,
        assigneeIds: ['jiro'] // 次郎が担当
      },
      {
        id: 'todo-7-4',
        text: 'APIのユニットテスト',
        completed: false,
        startDate: '2025-04-14',
        endDate: '2025-04-14',
        dueDate: new Date(2025, 3, 14),
        estimatedHours: 3,
        assigneeIds: ['taro', 'jiro'] // 太郎と次郎が共同で担当
      }
    ]
  },
  {
    id: 'task-8',
    title: 'バックエンド開発：注文API',
    description: '注文処理と決済統合のためのAPIを開発します。在庫管理も含めた一貫性のある処理を実装します。',
    startDate: '2025-04-15',
    endDate: '2025-04-21',
    priority: 2, // 高
    assigneeIds: ['gonzo', 'saburo'], // すべてのTODO担当者の和集合
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-8-1',
        text: '注文処理フローの設計',
        completed: false,
        startDate: '2025-04-15',
        endDate: '2025-04-16',
        dueDate: new Date(2025, 3, 16),
        estimatedHours: 3,
        assigneeIds: ['gonzo'] // ゴンゾウが担当
      },
      {
        id: 'todo-8-2',
        text: '注文CRUD操作の実装',
        completed: false,
        startDate: '2025-04-17',
        endDate: '2025-04-18',
        dueDate: new Date(2025, 3, 18),
        estimatedHours: 4,
        assigneeIds: ['saburo'] // 三郎が担当
      },
      {
        id: 'todo-8-3',
        text: '決済ゲートウェイとの統合',
        completed: false,
        startDate: '2025-04-18',
        endDate: '2025-04-18',
        dueDate: new Date(2025, 3, 21),
        estimatedHours: 4,
        assigneeIds: ['gonzo', 'saburo'] // ゴンゾウと三郎が共同で担当
      },
      {
        id: 'todo-8-4',
        text: '在庫管理・トランザクション処理',
        completed: false,
        startDate: '2025-04-21',
        endDate: '2025-04-21',
        dueDate: new Date(2025, 3, 21),
        estimatedHours: 3,
        assigneeIds: ['saburo'] // 三郎が担当
      }
    ]
  },
  {
    id: 'task-9',
    title: 'テスト実施',
    description: '単体テスト、統合テスト、E2Eテストを実施し、システム全体の品質を確保します。',
    startDate: '2025-04-22',
    endDate: '2025-04-28',
    priority: 1, // 中
    assigneeIds: ['hanako', 'taro', 'jiro', 'saburo'], // すべてのTODO担当者の和集合
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-9-1',
        text: 'テスト計画の策定',
        completed: false,
        startDate: '2025-04-22',
        endDate: '2025-04-23',
        dueDate: new Date(2025, 3, 23),
        estimatedHours: 2,
        assigneeIds: ['hanako', 'taro'] // 花子と太郎が共同で担当
      },
      {
        id: 'todo-9-2',
        text: '単体テストの実施',
        completed: false,
        startDate: '2025-04-24',
        endDate: '2025-04-25',
        dueDate: new Date(2025, 3, 25),
        estimatedHours: 4,
        assigneeIds: ['hanako', 'jiro'] // 花子と次郎が共同で担当
      },
      {
        id: 'todo-9-3',
        text: '統合テストの実施',
        completed: false,
        startDate: '2025-04-25',
        endDate: '2025-04-25',
        dueDate: new Date(2025, 3, 25),
        estimatedHours: 4,
        assigneeIds: ['hanako', 'saburo'] // 花子と三郎が共同で担当
      },
      {
        id: 'todo-9-4',
        text: 'E2Eテストの実施',
        completed: false,
        startDate: '2025-04-28',
        endDate: '2025-04-28',
        dueDate: new Date(2025, 3, 28),
        estimatedHours: 3,
        assigneeIds: ['hanako'] // 花子が担当
      }
    ]
  },
  {
    id: 'task-10',
    title: 'デプロイ・本番環境構築',
    description: 'ECサイトを本番環境にデプロイし、初期設定を行います。監視体制も整えます。',
    startDate: '2025-04-29',
    endDate: '2025-05-02',
    priority: 2, // 高
    assigneeIds: [], // 未アサイン
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-10-1',
        text: 'インフラ構成の設計',
        completed: false,
        startDate: '2025-04-29',
        endDate: '2025-04-30',
        dueDate: new Date(2025, 3, 30),
        estimatedHours: 3,
        assigneeIds: [] // 未アサイン
      },
      {
        id: 'todo-10-2',
        text: 'CI/CDパイプラインの構築',
        completed: false,
        startDate: '2025-04-30',
        endDate: '2025-05-01',
        dueDate: new Date(2025, 4, 1),
        estimatedHours: 4,
        assigneeIds: [] // 未アサイン
      },
      {
        id: 'todo-10-3',
        text: '本番環境へのデプロイ',
        completed: false,
        startDate: '2025-05-01',
        endDate: '2025-05-02',
        dueDate: new Date(2025, 4, 2),
        estimatedHours: 3,
        assigneeIds: [] // 未アサイン
      },
      {
        id: 'todo-10-4',
        text: '監視・アラート設定',
        completed: false,
        startDate: '2025-05-02',
        endDate: '2025-05-03',
        dueDate: new Date(2025, 4, 3),
        estimatedHours: 2,
        assigneeIds: [] // 未アサイン
      }
    ]
  },
  // プロジェクトB（海外への販路拡大プロジェクト）用のタスク
  {
    id: 'task-b1',
    title: '市場調査',
    description: '海外市場の動向調査と分析を行います。',
    startDate: '2025-04-01',
    endDate: '2025-04-10',
    priority: 2, // 高
    assigneeIds: ['taro', 'hanako'],
    projectId: '2', // プロジェクトB
    todos: [
      {
        id: 'todo-b1-1',
        text: '現地市場の競合分析',
        completed: false,
        startDate: '2025-04-01',
        endDate: '2025-04-03',
        dueDate: new Date(2025, 3, 3),
        estimatedHours: 5,
        assigneeIds: ['taro']
      },
      {
        id: 'todo-b1-2',
        text: '現地ユーザーインタビュー実施',
        completed: false,
        startDate: '2025-04-04',
        endDate: '2025-04-07',
        dueDate: new Date(2025, 3, 7),
        estimatedHours: 8,
        assigneeIds: ['hanako']
      },
      {
        id: 'todo-b1-3',
        text: '市場調査レポート作成',
        completed: false,
        startDate: '2025-04-08',
        endDate: '2025-04-10',
        dueDate: new Date(2025, 3, 10),
        estimatedHours: 4,
        assigneeIds: ['taro', 'hanako']
      }
    ]
  },
  {
    id: 'task-b2',
    title: '進出戦略の立案',
    description: '海外市場への進出戦略を策定します。',
    startDate: '2025-04-11',
    endDate: '2025-04-20',
    priority: 2, // 高
    assigneeIds: ['gonzo', 'jiro'],
    projectId: '2', // プロジェクトB
    todos: [
      {
        id: 'todo-b2-1',
        text: '進出戦略ドキュメント作成',
        completed: false,
        startDate: '2025-04-11',
        endDate: '2025-04-15',
        dueDate: new Date(2025, 3, 15),
        estimatedHours: 10,
        assigneeIds: ['gonzo']
      },
      {
        id: 'todo-b2-2',
        text: 'リスク分析と対策立案',
        completed: false,
        startDate: '2025-04-16',
        endDate: '2025-04-20',
        dueDate: new Date(2025, 3, 20),
        estimatedHours: 8,
        assigneeIds: ['jiro']
      }
    ]
  },
  {
    id: 'task-b3',
    title: '現地法人の設立準備',
    description: '海外現地法人の設立に向けた手続きと準備を行います。',
    startDate: '2025-04-21',
    endDate: '2025-05-10',
    priority: 2, // 高
    assigneeIds: ['taro', 'gonzo'],
    projectId: '2', // プロジェクトB
    todos: [
      {
        id: 'todo-b3-1',
        text: '現地弁護士との面談',
        completed: false,
        startDate: '2025-04-21',
        endDate: '2025-04-23',
        dueDate: new Date(2025, 3, 23),
        estimatedHours: 4,
        assigneeIds: ['taro']
      },
      {
        id: 'todo-b3-2',
        text: '必要書類の準備',
        completed: false,
        startDate: '2025-04-24',
        endDate: '2025-04-30',
        dueDate: new Date(2025, 3, 30),
        estimatedHours: 12,
        assigneeIds: ['gonzo']
      },
      {
        id: 'todo-b3-3',
        text: '現地視察の計画',
        completed: false,
        startDate: '2025-05-01',
        endDate: '2025-05-05',
        dueDate: new Date(2025, 4, 5),
        estimatedHours: 6,
        assigneeIds: ['taro', 'gonzo']
      },
      {
        id: 'todo-b3-4',
        text: '現地オフィス候補選定',
        completed: false,
        startDate: '2025-05-06',
        endDate: '2025-05-10',
        dueDate: new Date(2025, 4, 10),
        estimatedHours: 8,
        assigneeIds: ['gonzo']
      }
    ]
  },
  {
    id: 'task-b4',
    title: '現地採用計画',
    description: '現地スタッフの採用計画と体制構築を行います。',
    startDate: '2025-05-11',
    endDate: '2025-05-25',
    priority: 1, // 中
    assigneeIds: ['hanako', 'saburo'],
    projectId: '2', // プロジェクトB
    todos: [
      {
        id: 'todo-b4-1',
        text: '採用計画策定',
        completed: false,
        startDate: '2025-05-11',
        endDate: '2025-05-15',
        dueDate: new Date(2025, 4, 15),
        estimatedHours: 8,
        assigneeIds: ['hanako']
      },
      {
        id: 'todo-b4-2',
        text: '求人広告の作成',
        completed: false,
        startDate: '2025-05-16',
        endDate: '2025-05-20',
        dueDate: new Date(2025, 4, 20),
        estimatedHours: 4,
        assigneeIds: ['saburo']
      },
      {
        id: 'todo-b4-3',
        text: '採用面接の準備',
        completed: false,
        startDate: '2025-05-21',
        endDate: '2025-05-25',
        dueDate: new Date(2025, 4, 25),
        estimatedHours: 6,
        assigneeIds: ['hanako', 'saburo']
      }
    ]
  },
  {
    id: 'task-b5',
    title: '現地向け製品の調整',
    description: '現地市場に合わせた製品のローカライズと調整を行います。',
    startDate: '2025-05-26',
    endDate: '2025-06-15',
    priority: 2, // 高
    assigneeIds: ['jiro', 'saburo'],
    projectId: '2', // プロジェクトB
    todos: [
      {
        id: 'todo-b5-1',
        text: '製品ローカライズ要件定義',
        completed: false,
        startDate: '2025-05-26',
        endDate: '2025-05-31',
        dueDate: new Date(2025, 4, 31),
        estimatedHours: 10,
        assigneeIds: ['jiro']
      },
      {
        id: 'todo-b5-2',
        text: '現地言語への翻訳',
        completed: false,
        startDate: '2025-06-01',
        endDate: '2025-06-07',
        dueDate: new Date(2025, 5, 7),
        estimatedHours: 15,
        assigneeIds: ['saburo']
      },
      {
        id: 'todo-b5-3',
        text: '現地法規制への対応',
        completed: false,
        startDate: '2025-06-08',
        endDate: '2025-06-15',
        dueDate: new Date(2025, 5, 15),
        estimatedHours: 12,
        assigneeIds: ['jiro', 'saburo']
      }
    ]
  },
  {
    id: 'task-b6',
    title: 'マーケティング戦略立案',
    description: '海外市場向けのマーケティング戦略を策定します。',
    startDate: '2025-06-16',
    endDate: '2025-06-30',
    priority: 1, // 中
    assigneeIds: ['hanako', 'taro'],
    projectId: '2', // プロジェクトB
    todos: [
      {
        id: 'todo-b6-1',
        text: 'マーケティングプラン策定',
        completed: false,
        startDate: '2025-06-16',
        endDate: '2025-06-20',
        dueDate: new Date(2025, 5, 20),
        estimatedHours: 8,
        assigneeIds: ['hanako']
      },
      {
        id: 'todo-b6-2',
        text: '販促資料の作成',
        completed: false,
        startDate: '2025-06-21',
        endDate: '2025-06-25',
        dueDate: new Date(2025, 5, 25),
        estimatedHours: 6,
        assigneeIds: ['hanako']
      },
      {
        id: 'todo-b6-3',
        text: '現地パートナー候補の選定',
        completed: false,
        startDate: '2025-06-26',
        endDate: '2025-06-30',
        dueDate: new Date(2025, 5, 30),
        estimatedHours: 10,
        assigneeIds: ['taro', 'hanako']
      }
    ]
  },
  
  // プロジェクトC（コーポレートサイトの保守運用）用のタスク
  {
    id: 'task-c1',
    title: 'サイト分析とパフォーマンス評価',
    description: '現在のコーポレートサイトの分析と改善点の洗い出しを行います。',
    startDate: '2025-05-15',
    endDate: '2025-05-25',
    priority: 1, // 中
    assigneeIds: ['saburo'],
    projectId: '3', // プロジェクトC
    todos: [
      {
        id: 'todo-c1-1',
        text: 'アクセス解析データの分析',
        completed: false,
        startDate: '2025-05-15',
        endDate: '2025-05-17',
        dueDate: new Date(2025, 4, 17),
        estimatedHours: 6,
        assigneeIds: ['saburo']
      },
      {
        id: 'todo-c1-2',
        text: 'パフォーマンス計測とボトルネック特定',
        completed: false,
        startDate: '2025-05-18',
        endDate: '2025-05-20',
        dueDate: new Date(2025, 4, 20),
        estimatedHours: 4,
        assigneeIds: ['saburo']
      },
      {
        id: 'todo-c1-3',
        text: 'ユーザビリティテスト実施',
        completed: false,
        startDate: '2025-05-21',
        endDate: '2025-05-23',
        dueDate: new Date(2025, 4, 23),
        estimatedHours: 8,
        assigneeIds: ['saburo']
      },
      {
        id: 'todo-c1-4',
        text: '改善提案書の作成',
        completed: false,
        startDate: '2025-05-24',
        endDate: '2025-05-25',
        dueDate: new Date(2025, 4, 25),
        estimatedHours: 3,
        assigneeIds: ['saburo']
      }
    ]
  },
  {
    id: 'task-c2',
    title: '定期コンテンツ更新',
    description: 'コーポレートサイトの定期的なコンテンツ更新を行います。',
    startDate: '2025-05-26',
    endDate: '2025-06-05',
    priority: 0, // 低
    assigneeIds: ['jiro', 'hanako'],
    projectId: '3', // プロジェクトC
    todos: [
      {
        id: 'todo-c2-1',
        text: '更新コンテンツの企画',
        completed: false,
        startDate: '2025-05-26',
        endDate: '2025-05-28',
        dueDate: new Date(2025, 4, 28),
        estimatedHours: 4,
        assigneeIds: ['hanako']
      },
      {
        id: 'todo-c2-2',
        text: 'コンテンツ作成',
        completed: false,
        startDate: '2025-05-29',
        endDate: '2025-06-02',
        dueDate: new Date(2025, 5, 2),
        estimatedHours: 8,
        assigneeIds: ['hanako']
      },
      {
        id: 'todo-c2-3',
        text: 'CMS更新作業',
        completed: false,
        startDate: '2025-06-03',
        endDate: '2025-06-05',
        dueDate: new Date(2025, 5, 5),
        estimatedHours: 3,
        assigneeIds: ['jiro']
      }
    ]
  },
  {
    id: 'task-c3',
    title: 'セキュリティ対策強化',
    description: 'コーポレートサイトのセキュリティ対策を強化します。',
    startDate: '2025-06-06',
    endDate: '2025-06-15',
    priority: 2, // 高
    assigneeIds: ['saburo', 'gonzo'],
    projectId: '3', // プロジェクトC
    todos: [
      {
        id: 'todo-c3-1',
        text: 'セキュリティ監査の実施',
        completed: false,
        startDate: '2025-06-06',
        endDate: '2025-06-08',
        dueDate: new Date(2025, 5, 8),
        estimatedHours: 6,
        assigneeIds: ['saburo']
      },
      {
        id: 'todo-c3-2',
        text: '脆弱性の修正',
        completed: false,
        startDate: '2025-06-09',
        endDate: '2025-06-12',
        dueDate: new Date(2025, 5, 12),
        estimatedHours: 10,
        assigneeIds: ['saburo']
      },
      {
        id: 'todo-c3-3',
        text: 'セキュリティレポート作成',
        completed: false,
        startDate: '2025-06-13',
        endDate: '2025-06-15',
        dueDate: new Date(2025, 5, 15),
        estimatedHours: 3,
        assigneeIds: ['gonzo']
      }
    ]
  },
  {
    id: 'task-c4',
    title: 'サーバー・インフラ保守',
    description: 'サーバーとインフラの定期的な保守作業を行います。',
    startDate: '2025-06-16',
    endDate: '2025-06-25',
    priority: 1, // 中
    assigneeIds: ['saburo'],
    projectId: '3', // プロジェクトC
    todos: [
      {
        id: 'todo-c4-1',
        text: 'サーバーパフォーマンスチェック',
        completed: false,
        startDate: '2025-06-16',
        endDate: '2025-06-18',
        dueDate: new Date(2025, 5, 18),
        estimatedHours: 4,
        assigneeIds: ['saburo']
      },
      {
        id: 'todo-c4-2',
        text: 'バックアップ検証',
        completed: false,
        startDate: '2025-06-19',
        endDate: '2025-06-20',
        dueDate: new Date(2025, 5, 20),
        estimatedHours: 2,
        assigneeIds: ['saburo']
      },
      {
        id: 'todo-c4-3',
        text: 'ミドルウェアアップデート',
        completed: false,
        startDate: '2025-06-21',
        endDate: '2025-06-23',
        dueDate: new Date(2025, 5, 23),
        estimatedHours: 6,
        assigneeIds: ['saburo']
      },
      {
        id: 'todo-c4-4',
        text: '監視システム設定の見直し',
        completed: false,
        startDate: '2025-06-24',
        endDate: '2025-06-25',
        dueDate: new Date(2025, 5, 25),
        estimatedHours: 3,
        assigneeIds: ['saburo']
      }
    ]
  },
  {
    id: 'task-c5',
    title: 'モバイル対応の強化',
    description: 'コーポレートサイトのモバイル対応を強化します。',
    startDate: '2025-06-26',
    endDate: '2025-07-10',
    priority: 1, // 中
    assigneeIds: ['jiro', 'hanako'],
    projectId: '3', // プロジェクトC
    todos: [
      {
        id: 'todo-c5-1',
        text: 'モバイルUIの検証',
        completed: false,
        startDate: '2025-06-26',
        endDate: '2025-06-30',
        dueDate: new Date(2025, 5, 30),
        estimatedHours: 5,
        assigneeIds: ['hanako']
      },
      {
        id: 'todo-c5-2',
        text: 'レスポンシブデザインの改善',
        completed: false,
        startDate: '2025-07-01',
        endDate: '2025-07-05',
        dueDate: new Date(2025, 6, 5),
        estimatedHours: 8,
        assigneeIds: ['jiro']
      },
      {
        id: 'todo-c5-3',
        text: 'モバイルパフォーマンス最適化',
        completed: false,
        startDate: '2025-07-06',
        endDate: '2025-07-10',
        dueDate: new Date(2025, 6, 10),
        estimatedHours: 6,
        assigneeIds: ['jiro']
      }
    ]
  },
  {
    id: 'task-c6',
    title: 'アクセシビリティ対応',
    description: 'コーポレートサイトのアクセシビリティを改善します。',
    startDate: '2025-07-11',
    endDate: '2025-07-25',
    priority: 0, // 低
    assigneeIds: ['hanako', 'jiro'],
    projectId: '3', // プロジェクトC
    todos: [
      {
        id: 'todo-c6-1',
        text: 'アクセシビリティ監査',
        completed: false,
        startDate: '2025-07-11',
        endDate: '2025-07-15',
        dueDate: new Date(2025, 6, 15),
        estimatedHours: 6,
        assigneeIds: ['hanako']
      },
      {
        id: 'todo-c6-2',
        text: 'WAI-ARIA対応',
        completed: false,
        startDate: '2025-07-16',
        endDate: '2025-07-20',
        dueDate: new Date(2025, 6, 20),
        estimatedHours: 8,
        assigneeIds: ['jiro']
      },
      {
        id: 'todo-c6-3',
        text: 'スクリーンリーダーテスト',
        completed: false,
        startDate: '2025-07-21',
        endDate: '2025-07-25',
        dueDate: new Date(2025, 6, 25),
        estimatedHours: 4,
        assigneeIds: ['hanako', 'jiro']
      }
    ]
  }
]; 