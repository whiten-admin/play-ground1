import { Task } from '@/types/task';

// ECサイト構築のためのシードデータ
export const seedTasks: Task[] = [
  {
    id: 'task-1',
    title: '要件定義',
    description: 'ECサイトの要件を定義し、主要な機能と非機能要件を明確化します。ステークホルダーとの合意を得ることが目標です。',
    startDate: '2025-03-01',
    endDate: '2025-03-05',
    priority: 2, // 高
    todos: [
      {
        id: 'todo-1-1',
        text: '競合サイトの調査',
        completed: false,
        startDate: '2025-03-01',
        endDate: '2025-03-02',
        dueDate: new Date(2025, 2, 2),
        estimatedHours: 4
      },
      {
        id: 'todo-1-2',
        text: '機能要件のリストアップ',
        completed: false,
        startDate: '2025-03-02',
        endDate: '2025-03-03',
        dueDate: new Date(2025, 2, 3),
        estimatedHours: 3
      },
      {
        id: 'todo-1-3',
        text: '非機能要件の定義',
        completed: false,
        startDate: '2025-03-03',
        endDate: '2025-03-04',
        dueDate: new Date(2025, 2, 4),
        estimatedHours: 2
      },
      {
        id: 'todo-1-4',
        text: 'ステークホルダーとの要件レビュー会議',
        completed: false,
        startDate: '2025-03-04',
        endDate: '2025-03-05',
        dueDate: new Date(2025, 2, 5),
        estimatedHours: 2
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
    todos: [
      {
        id: 'todo-2-1',
        text: 'エンティティの洗い出し',
        completed: false,
        startDate: '2025-03-06',
        endDate: '2025-03-07',
        dueDate: new Date(2025, 2, 7),
        estimatedHours: 3
      },
      {
        id: 'todo-2-2',
        text: 'ER図の作成',
        completed: false,
        startDate: '2025-03-07',
        endDate: '2025-03-08',
        dueDate: new Date(2025, 2, 8),
        estimatedHours: 4
      },
      {
        id: 'todo-2-3',
        text: 'テーブル定義書の作成',
        completed: false,
        startDate: '2025-03-08',
        endDate: '2025-03-09',
        dueDate: new Date(2025, 2, 9),
        estimatedHours: 3
      },
      {
        id: 'todo-2-4',
        text: 'データベース設計のレビュー',
        completed: false,
        startDate: '2025-03-09',
        endDate: '2025-03-10',
        dueDate: new Date(2025, 2, 10),
        estimatedHours: 2
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
    todos: [
      {
        id: 'todo-3-1',
        text: 'ワイヤーフレームの作成',
        completed: false,
        startDate: '2025-03-11',
        endDate: '2025-03-12',
        dueDate: new Date(2025, 2, 12),
        estimatedHours: 4
      },
      {
        id: 'todo-3-2',
        text: 'デザインシステムの構築',
        completed: false,
        startDate: '2025-03-13',
        endDate: '2025-03-14',
        dueDate: new Date(2025, 2, 14),
        estimatedHours: 3
      },
      {
        id: 'todo-3-3',
        text: '主要画面のモックアップ作成',
        completed: false,
        startDate: '2025-03-15',
        endDate: '2025-03-16',
        dueDate: new Date(2025, 2, 16),
        estimatedHours: 4
      },
      {
        id: 'todo-3-4',
        text: 'デザインレビュー会議',
        completed: false,
        startDate: '2025-03-16',
        endDate: '2025-03-17',
        dueDate: new Date(2025, 2, 17),
        estimatedHours: 2
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
    todos: [
      {
        id: 'todo-4-1',
        text: 'コンポーネント設計',
        completed: false,
        startDate: '2025-03-18',
        endDate: '2025-03-19',
        dueDate: new Date(2025, 2, 19),
        estimatedHours: 3
      },
      {
        id: 'todo-4-2',
        text: '商品一覧ページの実装',
        completed: false,
        startDate: '2025-03-20',
        endDate: '2025-03-21',
        dueDate: new Date(2025, 2, 21),
        estimatedHours: 4
      },
      {
        id: 'todo-4-3',
        text: '商品詳細ページの実装',
        completed: false,
        startDate: '2025-03-22',
        endDate: '2025-03-23',
        dueDate: new Date(2025, 2, 23),
        estimatedHours: 4
      },
      {
        id: 'todo-4-4',
        text: 'レスポンシブデザインの実装',
        completed: false,
        startDate: '2025-03-23',
        endDate: '2025-03-24',
        dueDate: new Date(2025, 2, 24),
        estimatedHours: 3
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
    todos: [
      {
        id: 'todo-5-1',
        text: 'カート状態設計',
        completed: false,
        startDate: '2025-03-25',
        endDate: '2025-03-26',
        dueDate: new Date(2025, 2, 26),
        estimatedHours: 2
      },
      {
        id: 'todo-5-2',
        text: 'カートページの実装',
        completed: false,
        startDate: '2025-03-27',
        endDate: '2025-03-28',
        dueDate: new Date(2025, 2, 28),
        estimatedHours: 4
      },
      {
        id: 'todo-5-3',
        text: '注文フォームの実装',
        completed: false,
        startDate: '2025-03-29',
        endDate: '2025-03-30',
        dueDate: new Date(2025, 2, 30),
        estimatedHours: 4
      },
      {
        id: 'todo-5-4',
        text: '注文確認・完了画面の実装',
        completed: false,
        startDate: '2025-03-30',
        endDate: '2025-03-31',
        dueDate: new Date(2025, 2, 31),
        estimatedHours: 3
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
    todos: [
      {
        id: 'todo-6-1',
        text: '認証システムの設計',
        completed: false,
        startDate: '2025-04-01',
        endDate: '2025-04-02',
        dueDate: new Date(2025, 3, 2),
        estimatedHours: 3
      },
      {
        id: 'todo-6-2',
        text: 'ユーザー登録機能の実装',
        completed: false,
        startDate: '2025-04-03',
        endDate: '2025-04-04',
        dueDate: new Date(2025, 3, 4),
        estimatedHours: 4
      },
      {
        id: 'todo-6-3',
        text: 'ログイン/ログアウト機能の実装',
        completed: false,
        startDate: '2025-04-05',
        endDate: '2025-04-06',
        dueDate: new Date(2025, 3, 6),
        estimatedHours: 4
      },
      {
        id: 'todo-6-4',
        text: 'パスワードリセット機能の実装',
        completed: false,
        startDate: '2025-04-06',
        endDate: '2025-04-07',
        dueDate: new Date(2025, 3, 7),
        estimatedHours: 3
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
    todos: [
      {
        id: 'todo-7-1',
        text: 'API設計（Swagger/OpenAPI）',
        completed: false,
        startDate: '2025-04-08',
        endDate: '2025-04-09',
        dueDate: new Date(2025, 3, 9),
        estimatedHours: 3
      },
      {
        id: 'todo-7-2',
        text: '商品CRUD操作の実装',
        completed: false,
        startDate: '2025-04-10',
        endDate: '2025-04-11',
        dueDate: new Date(2025, 3, 11),
        estimatedHours: 4
      },
      {
        id: 'todo-7-3',
        text: '検索・フィルタリング機能の実装',
        completed: false,
        startDate: '2025-04-12',
        endDate: '2025-04-13',
        dueDate: new Date(2025, 3, 13),
        estimatedHours: 4
      },
      {
        id: 'todo-7-4',
        text: 'APIのユニットテスト',
        completed: false,
        startDate: '2025-04-13',
        endDate: '2025-04-14',
        dueDate: new Date(2025, 3, 14),
        estimatedHours: 3
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
    todos: [
      {
        id: 'todo-8-1',
        text: '注文処理フローの設計',
        completed: false,
        startDate: '2025-04-15',
        endDate: '2025-04-16',
        dueDate: new Date(2025, 3, 16),
        estimatedHours: 3
      },
      {
        id: 'todo-8-2',
        text: '注文CRUD操作の実装',
        completed: false,
        startDate: '2025-04-17',
        endDate: '2025-04-18',
        dueDate: new Date(2025, 3, 18),
        estimatedHours: 4
      },
      {
        id: 'todo-8-3',
        text: '決済ゲートウェイとの統合',
        completed: false,
        startDate: '2025-04-19',
        endDate: '2025-04-20',
        dueDate: new Date(2025, 3, 20),
        estimatedHours: 4
      },
      {
        id: 'todo-8-4',
        text: '在庫管理・トランザクション処理',
        completed: false,
        startDate: '2025-04-20',
        endDate: '2025-04-21',
        dueDate: new Date(2025, 3, 21),
        estimatedHours: 3
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
    todos: [
      {
        id: 'todo-9-1',
        text: 'テスト計画の策定',
        completed: false,
        startDate: '2025-04-22',
        endDate: '2025-04-23',
        dueDate: new Date(2025, 3, 23),
        estimatedHours: 2
      },
      {
        id: 'todo-9-2',
        text: '単体テストの実施',
        completed: false,
        startDate: '2025-04-24',
        endDate: '2025-04-25',
        dueDate: new Date(2025, 3, 25),
        estimatedHours: 4
      },
      {
        id: 'todo-9-3',
        text: '統合テストの実施',
        completed: false,
        startDate: '2025-04-26',
        endDate: '2025-04-27',
        dueDate: new Date(2025, 3, 27),
        estimatedHours: 4
      },
      {
        id: 'todo-9-4',
        text: 'E2Eテストの実施',
        completed: false,
        startDate: '2025-04-27',
        endDate: '2025-04-28',
        dueDate: new Date(2025, 3, 28),
        estimatedHours: 3
      }
    ]
  },
  {
    id: 'task-10',
    title: 'デプロイ・本番環境構築',
    description: 'ECサイトを本番環境にデプロイし、初期設定を行います。監視体制も整えます。',
    startDate: '2025-04-29',
    endDate: '2025-05-03',
    priority: 2, // 高
    todos: [
      {
        id: 'todo-10-1',
        text: 'インフラ構成の設計',
        completed: false,
        startDate: '2025-04-29',
        endDate: '2025-04-30',
        dueDate: new Date(2025, 3, 30),
        estimatedHours: 3
      },
      {
        id: 'todo-10-2',
        text: 'CI/CDパイプラインの構築',
        completed: false,
        startDate: '2025-04-30',
        endDate: '2025-05-01',
        dueDate: new Date(2025, 4, 1),
        estimatedHours: 4
      },
      {
        id: 'todo-10-3',
        text: '本番環境へのデプロイ',
        completed: false,
        startDate: '2025-05-01',
        endDate: '2025-05-02',
        dueDate: new Date(2025, 4, 2),
        estimatedHours: 4
      },
      {
        id: 'todo-10-4',
        text: '監視・アラートシステムの設定',
        completed: false,
        startDate: '2025-05-02',
        endDate: '2025-05-03',
        dueDate: new Date(2025, 4, 3),
        estimatedHours: 3
      }
    ]
  }
]; 