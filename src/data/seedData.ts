import { Project, Task, Todo } from '@/types/task';
import { parseDate, calculateCalendarDateTime } from '@/utils/dateUtils';

// サンプルプロジェクト
export const sampleProjects: Project[] = [
  {
    id: '1',
    title: 'ウェブサイトリニューアル',
    description: '会社ウェブサイトのリニューアルプロジェクト',
    projectColor: '#4caf50',
    tasks: []
  },
  {
    id: '2',
    title: '新機能開発',
    description: '新機能の設計および開発プロジェクト',
    projectColor: '#2196f3',
    tasks: []
  }
];

// サンプルタスク
export const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'ワイヤーフレーム作成',
    description: 'サイトの各ページのワイヤーフレームを作成する',
    dueDate: parseDate('2023-07-25'),
    completedDateTime: undefined,
    todos: [
      {
        id: '101',
        text: 'トップページのワイヤーフレーム',
        completed: true,
        startDate: parseDate('2023-07-15'),
        ...calculateCalendarDateTime(parseDate('2023-07-15'), 3),
        completedDateTime: parseDate('2023-07-17'),
        estimatedHours: 3,
        actualHours: 4,
        assigneeId: 'user1'
      },
      {
        id: '102',
        text: '商品ページのワイヤーフレーム',
        completed: false,
        startDate: parseDate('2023-07-18'),
        ...calculateCalendarDateTime(parseDate('2023-07-18'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: 'user1'
      }
    ],
    assigneeIds: ['user1'],
    projectId: '1'
  },
  {
    id: '2',
    title: 'デザイン制作',
    description: 'サイトのビジュアルデザインを作成する',
    dueDate: parseDate('2023-08-10'),
    completedDateTime: undefined,
    todos: [
      {
        id: '201',
        text: 'カラーパレット選定',
        completed: true,
        startDate: parseDate('2023-07-26'),
        ...calculateCalendarDateTime(parseDate('2023-07-26'), 2),
        completedDateTime: parseDate('2023-07-27'),
        estimatedHours: 2,
        actualHours: 2,
        assigneeId: 'user2'
      },
      {
        id: '202',
        text: 'ロゴデザイン',
        completed: false,
        startDate: parseDate('2023-07-28'),
        ...calculateCalendarDateTime(parseDate('2023-07-28'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: 'user2'
      }
    ],
    assigneeIds: ['user2'],
    projectId: '1'
  },
  {
    id: '3',
    title: 'バックエンド実装',
    description: 'APIとデータベース構築',
    dueDate: parseDate('2023-08-25'),
    completedDateTime: undefined,
    todos: [
      {
        id: '301',
        text: 'データベース設計',
        completed: false,
        startDate: parseDate('2023-08-01'),
        ...calculateCalendarDateTime(parseDate('2023-08-01'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: 'user3'
      },
      {
        id: '302',
        text: 'API実装',
        completed: false,
        startDate: parseDate('2023-08-05'),
        ...calculateCalendarDateTime(parseDate('2023-08-05'), 6),
        completedDateTime: undefined,
        estimatedHours: 6,
        actualHours: 0,
        assigneeId: 'user3'
      }
    ],
    assigneeIds: ['user3'],
    projectId: '2'
  }
];

// サンプルユーザーデータ
export const sampleUsers = [
  {
    id: 'user1',
    name: '山田太郎',
    avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    role: 'デザイナー'
  },
  {
    id: 'user2',
    name: '鈴木花子',
    avatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
    role: 'デザイナー'
  },
  {
    id: 'user3',
    name: '佐藤次郎',
    avatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
    role: '開発者'
  },
  {
    id: 'user4',
    name: '田中美咲',
    avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
    role: 'プロジェクトマネージャー'
  }
];

// プロジェクトA（ECサイト構築）のシードデータ
export const seedTasks: Task[] = [
  {
    id: 'task-1',
    title: '要件定義',
    description: 'ECサイトの要件を定義し、主要な機能と非機能要件を明確化します。ステークホルダーとの合意を得ることが目標です。',
    dueDate: parseDate('2025-03-05'),
    completedDateTime: undefined,
    assigneeIds: ['taro', 'gonzo', 'hanako'], // すべてのTODO担当者の和集合
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-1-1',
        text: '競合サイトの調査',
        completed: false,
        startDate: parseDate('2025-03-03'),
        ...calculateCalendarDateTime(parseDate('2025-03-03'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: 'taro' // 太郎が担当
      },
      {
        id: 'todo-1-2',
        text: '機能要件のリストアップ',
        completed: false,
        startDate: parseDate('2025-03-04'),
        ...calculateCalendarDateTime(parseDate('2025-03-04'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: 'gonzo' // ゴンゾウが担当
      },
      {
        id: 'todo-1-3',
        text: '非機能要件の定義',
        completed: false,
        startDate: parseDate('2025-03-03'),
        ...calculateCalendarDateTime(parseDate('2025-03-03'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: 'taro' // 太郎とゴンゾウが共同で担当
      },
      {
        id: 'todo-1-4',
        text: 'ステークホルダーとの要件レビュー会議',
        completed: false,
        startDate: parseDate('2025-03-04'),
        ...calculateCalendarDateTime(parseDate('2025-03-04'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: 'taro' // 全員参加
      }
    ]
  },
  {
    id: 'task-2',
    title: 'データベース設計',
    description: 'ECサイトで必要なデータベーススキーマを設計します。商品、ユーザー、注文など主要なエンティティの関連を定義します。',
    dueDate: parseDate('2025-03-10'),
    completedDateTime: undefined,
    assigneeIds: ['jiro', 'saburo', 'taro'], // すべてのTODO担当者の和集合
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-2-1',
        text: 'エンティティの洗い出し',
        completed: false,
        startDate: parseDate('2025-03-06'),
        ...calculateCalendarDateTime(parseDate('2025-03-06'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: 'jiro' // 次郎が担当
      },
      {
        id: 'todo-2-2',
        text: 'ER図の作成',
        completed: false,
        startDate: parseDate('2025-03-07'),
        ...calculateCalendarDateTime(parseDate('2025-03-07'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: 'saburo' // 三郎が担当
      },
      {
        id: 'todo-2-3',
        text: 'テーブル定義書の作成',
        completed: false,
        startDate: parseDate('2025-03-07'),
        ...calculateCalendarDateTime(parseDate('2025-03-07'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: 'jiro' // 次郎と三郎が共同で担当
      },
      {
        id: 'todo-2-4',
        text: 'データベース設計のレビュー',
        completed: false,
        startDate: parseDate('2025-03-10'),
        ...calculateCalendarDateTime(parseDate('2025-03-10'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: 'taro' // マネージャーと担当者
      }
    ]
  },
  {
    id: 'task-3',
    title: 'UI/UXデザイン',
    description: 'ECサイトのユーザーインターフェースを設計します。使いやすさと視覚的な魅力を両立させることが目標です。',
    dueDate: parseDate('2025-03-17'),
    completedDateTime: undefined,
    assigneeIds: ['hanako', 'taro', 'gonzo'], // すべてのTODO担当者の和集合
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-3-1',
        text: 'ワイヤーフレームの作成',
        completed: false,
        startDate: parseDate('2025-03-11'),
        ...calculateCalendarDateTime(parseDate('2025-03-11'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: 'hanako' // 花子が担当
      },
      {
        id: 'todo-3-2',
        text: 'デザインシステムの構築',
        completed: false,
        startDate: parseDate('2025-03-13'),
        ...calculateCalendarDateTime(parseDate('2025-03-13'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: 'hanako' // 花子が担当
      },
      {
        id: 'todo-3-3',
        text: '主要画面のモックアップ作成',
        completed: false,
        startDate: parseDate('2025-03-14'),
        ...calculateCalendarDateTime(parseDate('2025-03-14'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: 'hanako' // 花子が担当
      },
      {
        id: 'todo-3-4',
        text: 'デザインレビュー会議',
        completed: false,
        startDate: parseDate('2025-03-17'),
        ...calculateCalendarDateTime(parseDate('2025-03-17'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: 'taro' // マネージャーとデザイナー
      }
    ]
  },
  {
    id: 'task-4',
    title: 'フロントエンド開発：商品一覧・詳細',
    description: '商品一覧ページと商品詳細ページのフロントエンド実装を行います。React.jsを使用して開発します。',
    dueDate: parseDate('2025-03-24'),
    completedDateTime: undefined,
    assigneeIds: [], // 未アサイン
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-4-1',
        text: 'コンポーネント設計',
        completed: false,
        startDate: parseDate('2025-03-18'),
        ...calculateCalendarDateTime(parseDate('2025-03-18'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: '' // 未アサイン
      },
      {
        id: 'todo-4-2',
        text: '商品一覧ページの実装',
        completed: false,
        startDate: parseDate('2025-03-20'),
        ...calculateCalendarDateTime(parseDate('2025-03-20'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: '' // 未アサイン
      },
      {
        id: 'todo-4-3',
        text: '商品詳細ページの実装',
        completed: false,
        startDate: parseDate('2025-03-21'),
        ...calculateCalendarDateTime(parseDate('2025-03-21'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: '' // 未アサイン
      },
      {
        id: 'todo-4-4',
        text: 'レスポンシブデザインの実装',
        completed: false,
        startDate: parseDate('2025-03-24'),
        ...calculateCalendarDateTime(parseDate('2025-03-24'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: '' // 未アサイン
      }
    ]
  },
  {
    id: 'task-5',
    title: 'フロントエンド開発：カート・注文',
    description: 'ショッピングカートと注文処理のフロントエンド実装を行います。状態管理にはReduxを使用します。',
    dueDate: parseDate('2025-03-31'),
    completedDateTime: undefined,
    assigneeIds: ['jiro', 'hanako'], // すべてのTODO担当者の和集合
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-5-1',
        text: 'カート状態設計',
        completed: false,
        startDate: parseDate('2025-03-25'),
        ...calculateCalendarDateTime(parseDate('2025-03-25'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: 'jiro' // 次郎が担当
      },
      {
        id: 'todo-5-2',
        text: 'カートページの実装',
        completed: false,
        startDate: parseDate('2025-03-27'),
        ...calculateCalendarDateTime(parseDate('2025-03-27'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: 'jiro' // 次郎が担当
      },
      {
        id: 'todo-5-3',
        text: '注文フォームの実装',
        completed: false,
        startDate: parseDate('2025-03-28'),
        ...calculateCalendarDateTime(parseDate('2025-03-28'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: 'hanako' // 花子が担当
      },
      {
        id: 'todo-5-4',
        text: '注文処理の状態管理実装',
        completed: false,
        startDate: parseDate('2025-03-31'),
        ...calculateCalendarDateTime(parseDate('2025-03-31'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: 'jiro' // 次郎と花子が共同で担当
      }
    ]
  }
]; 