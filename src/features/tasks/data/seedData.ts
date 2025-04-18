import { Task } from '@/features/tasks/types/task';
import { parseDate, calculateCalendarDateTime } from '@/utils/dateUtils';

// プロジェクトメンバーIDは、ProjectMember.idと完全に一致する必要があります
// JSONから読み込んだデータと一致させるために、projectMembers.jsonの値をそのまま使用します
const PROJECT_MEMBER_IDS = {
  // プロジェクト1（ECサイト構築）のメンバー
  'taro_proj1': 'pm-1-taro',    // プロジェクト1の太郎
  'gonzo_proj1': 'pm-1-gonzo',  // プロジェクト1のゴンゾウ
  'jiro_proj1': 'pm-1-jiro',    // プロジェクト1の次郎
  'saburo_proj1': 'pm-1-saburo', // プロジェクト1の三郎
  'hanako_proj1': 'pm-1-hanako',  // プロジェクト1の花子

  // プロジェクト2（海外への販路拡大）のメンバー
  'taro_proj2': 'pm-2-taro',    // プロジェクト2の太郎
  'gonzo_proj2': 'pm-2-gonzo',  // プロジェクト2のゴンゾウ
  'jiro_proj2': 'pm-2-jiro',    // プロジェクト2の次郎

  // プロジェクト3（コーポレートサイト保守運用）のメンバー
  'taro_proj3': 'pm-3-taro',    // プロジェクト3の太郎
  'saburo_proj3': 'pm-3-saburo' // プロジェクト3の三郎
};

// シードデータ
export const seedTasks: Task[] = [
  {
    id: 'task-1',
    title: '要件定義',
    description: 'ECサイトの要件を定義し、主要な機能と非機能要件を明確化します。ステークホルダーとの合意を得ることが目標です。',
    dueDate: parseDate('2025-04-05'),
    completedDateTime: undefined,
    projectId: '1', // プロジェクトA
    status: 'not-started',
    todos: [
      {
        id: 'todo-1-1',
        text: '競合サイトの調査',
        completed: false,
        startDate: parseDate('2025-04-03'),
        ...calculateCalendarDateTime(parseDate('2025-04-03'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1 // 太郎が担当
      },
      {
        id: 'todo-1-2',
        text: '機能要件のリストアップ',
        completed: false,
        startDate: parseDate('2025-04-04'),
        ...calculateCalendarDateTime(parseDate('2025-04-04'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1 // ゴンゾウが担当
      },
      {
        id: 'todo-1-3',
        text: '非機能要件の定義',
        completed: false,
        startDate: parseDate('2025-04-03'),
        ...calculateCalendarDateTime(parseDate('2025-04-03'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1 // 太郎が担当
      },
      {
        id: 'todo-1-4',
        text: 'ステークホルダーとの要件レビュー会議',
        completed: false,
        startDate: parseDate('2025-04-04'),
        ...calculateCalendarDateTime(parseDate('2025-04-04'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1 // 太郎が担当
      }
    ]
  },
  {
    id: 'task-2',
    title: 'データベース設計',
    description: 'ECサイトで必要なデータベーススキーマを設計します。商品、ユーザー、注文など主要なエンティティの関連を定義します。',
    dueDate: parseDate('2025-04-10'),
    completedDateTime: undefined,
    projectId: '1', // プロジェクトA
    status: 'not-started',
    todos: [
      {
        id: 'todo-2-1',
        text: 'エンティティの洗い出し',
        completed: false,
        startDate: parseDate('2025-04-06'),
        ...calculateCalendarDateTime(parseDate('2025-04-06'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1 // 次郎が担当
      },
      {
        id: 'todo-2-2',
        text: 'ER図の作成',
        completed: false,
        startDate: parseDate('2025-04-07'),
        ...calculateCalendarDateTime(parseDate('2025-04-07'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1 // 三郎が担当
      },
      {
        id: 'todo-2-3',
        text: 'テーブル定義書の作成',
        completed: false,
        startDate: parseDate('2025-04-07'),
        ...calculateCalendarDateTime(parseDate('2025-04-07'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1 // 次郎が担当
      },
      {
        id: 'todo-2-4',
        text: 'データベース設計のレビュー',
        completed: false,
        startDate: parseDate('2025-04-10'),
        ...calculateCalendarDateTime(parseDate('2025-04-10'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1 // マネージャーが担当
      }
    ]
  },
  {
    id: 'task-3',
    title: 'フロントエンド設計',
    description: 'ECサイトのフロントエンド設計を行います。UI/UXデザインと画面遷移を検討します。',
    dueDate: parseDate('2025-04-15'),
    completedDateTime: undefined,
    projectId: '1', // プロジェクトA
    status: 'not-started',
    todos: [
      {
        id: 'todo-3-1',
        text: 'デザインコンセプトの検討',
        completed: false,
        startDate: parseDate('2025-04-11'),
        ...calculateCalendarDateTime(parseDate('2025-04-11'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1 // 花子が担当
      },
      {
        id: 'todo-3-2',
        text: 'ワイヤーフレーム作成',
        completed: false,
        startDate: parseDate('2025-04-12'),
        ...calculateCalendarDateTime(parseDate('2025-04-12'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1 // 花子が担当
      },
      {
        id: 'todo-3-3',
        text: 'UIコンポーネント設計',
        completed: false,
        startDate: parseDate('2025-04-13'),
        ...calculateCalendarDateTime(parseDate('2025-04-13'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1 // 花子が担当
      },
      {
        id: 'todo-3-4',
        text: 'デザインレビュー会議',
        completed: false,
        startDate: parseDate('2025-04-15'),
        ...calculateCalendarDateTime(parseDate('2025-04-15'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1 // マネージャーと担当者
      }
    ]
  },
  {
    id: 'task-4',
    title: 'フロントエンド開発：商品一覧・詳細',
    description: '商品一覧ページと商品詳細ページのフロントエンド実装を行います。React.jsを使用して開発します。',
    dueDate: parseDate('2025-04-24'),
    completedDateTime: undefined,
    projectId: '1', // プロジェクトA
    status: 'not-started',
    todos: [
      {
        id: 'todo-4-1',
        text: 'コンポーネント設計',
        completed: false,
        startDate: parseDate('2025-04-18'),
        ...calculateCalendarDateTime(parseDate('2025-04-18'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1 // 三郎に担当変更
      },
      {
        id: 'todo-4-2',
        text: '商品一覧ページの実装',
        completed: false,
        startDate: parseDate('2025-04-20'),
        ...calculateCalendarDateTime(parseDate('2025-04-20'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1 // 次郎に担当変更
      },
      {
        id: 'todo-4-3',
        text: '商品詳細ページの実装',
        completed: false,
        startDate: parseDate('2025-04-21'),
        ...calculateCalendarDateTime(parseDate('2025-04-21'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1 // 次郎に担当変更
      },
      {
        id: 'todo-4-4',
        text: 'レスポンシブデザインの実装',
        completed: false,
        startDate: parseDate('2025-04-24'),
        ...calculateCalendarDateTime(parseDate('2025-04-24'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1 // 花子に担当変更
      }
    ]
  },
  {
    id: 'task-5',
    title: 'フロントエンド開発：カート・注文',
    description: 'ショッピングカートと注文処理のフロントエンド実装を行います。状態管理にはReduxを使用します。',
    dueDate: parseDate('2025-04-30'),
    completedDateTime: undefined,
    projectId: '1', // プロジェクトA
    status: 'not-started',
    todos: [
      {
        id: 'todo-5-1',
        text: 'カート状態設計',
        completed: false,
        startDate: parseDate('2025-04-25'),
        ...calculateCalendarDateTime(parseDate('2025-04-25'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1 // 次郎が担当
      },
      {
        id: 'todo-5-2',
        text: 'カートページの実装',
        completed: false,
        startDate: parseDate('2025-04-27'),
        ...calculateCalendarDateTime(parseDate('2025-04-27'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1 // 次郎が担当
      },
      {
        id: 'todo-5-3',
        text: '注文フォームの実装',
        completed: false,
        startDate: parseDate('2025-04-28'),
        ...calculateCalendarDateTime(parseDate('2025-04-28'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1 // 花子が担当
      },
      {
        id: 'todo-5-4',
        text: '注文処理の状態管理実装',
        completed: false,
        startDate: parseDate('2025-04-30'),
        ...calculateCalendarDateTime(parseDate('2025-04-30'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1 // 次郎が担当
      }
    ]
  },
  {
    id: 'task-6',
    title: 'バックエンド開発：API設計',
    description: 'ECサイトのバックエンドAPIを設計します。RESTful原則に基づき、必要なエンドポイントを定義します。',
    dueDate: parseDate('2025-05-05'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-6-1',
        text: 'APIエンドポイント一覧作成',
        completed: false,
        startDate: parseDate('2025-05-01'),
        ...calculateCalendarDateTime(parseDate('2025-05-01'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      },
      {
        id: 'todo-6-2',
        text: 'API仕様書作成',
        completed: false,
        startDate: parseDate('2025-05-02'),
        ...calculateCalendarDateTime(parseDate('2025-05-02'), 6),
        completedDateTime: undefined,
        estimatedHours: 6,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      },
      {
        id: 'todo-6-3',
        text: 'APIセキュリティ設計',
        completed: false,
        startDate: parseDate('2025-05-03'),
        ...calculateCalendarDateTime(parseDate('2025-05-03'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-6-4',
        text: 'API設計レビュー',
        completed: false,
        startDate: parseDate('2025-05-05'),
        ...calculateCalendarDateTime(parseDate('2025-05-05'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1
      }
    ]
  },
  {
    id: 'task-7',
    title: 'バックエンド開発：ユーザー認証',
    description: 'ユーザー認証システムを実装します。登録、ログイン、パスワードリセット機能を含みます。',
    dueDate: parseDate('2025-05-10'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-7-1',
        text: '認証システム設計',
        completed: false,
        startDate: parseDate('2025-05-06'),
        ...calculateCalendarDateTime(parseDate('2025-05-06'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-7-2',
        text: 'ユーザー登録API実装',
        completed: false,
        startDate: parseDate('2025-05-07'),
        ...calculateCalendarDateTime(parseDate('2025-05-07'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-7-3',
        text: 'ログイン/ログアウトAPI実装',
        completed: false,
        startDate: parseDate('2025-05-08'),
        ...calculateCalendarDateTime(parseDate('2025-05-08'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-7-4',
        text: 'パスワードリセット機能実装',
        completed: false,
        startDate: parseDate('2025-05-09'),
        ...calculateCalendarDateTime(parseDate('2025-05-09'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-7-5',
        text: '認証システムのテスト',
        completed: false,
        startDate: parseDate('2025-05-10'),
        ...calculateCalendarDateTime(parseDate('2025-05-10'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-8',
    title: 'バックエンド開発：商品管理API',
    description: '商品情報を管理するためのAPIを実装します。CRUD操作、検索、フィルタリング機能を含みます。',
    dueDate: parseDate('2025-05-15'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-8-1',
        text: '商品CRUDの実装',
        completed: false,
        startDate: parseDate('2025-05-11'),
        ...calculateCalendarDateTime(parseDate('2025-05-11'), 6),
        completedDateTime: undefined,
        estimatedHours: 6,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-8-2',
        text: '商品検索機能の実装',
        completed: false,
        startDate: parseDate('2025-05-12'),
        ...calculateCalendarDateTime(parseDate('2025-05-12'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-8-3',
        text: '商品フィルタリング機能の実装',
        completed: false,
        startDate: parseDate('2025-05-13'),
        ...calculateCalendarDateTime(parseDate('2025-05-13'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-8-4',
        text: '商品管理APIのユニットテスト',
        completed: false,
        startDate: parseDate('2025-05-14'),
        ...calculateCalendarDateTime(parseDate('2025-05-14'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      },
      {
        id: 'todo-8-5',
        text: '商品管理APIの統合テスト',
        completed: false,
        startDate: parseDate('2025-05-15'),
        ...calculateCalendarDateTime(parseDate('2025-05-15'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-9',
    title: 'バックエンド開発：注文処理API',
    description: '注文処理のためのAPIを実装します。注文作成、支払い処理、注文履歴の取得などの機能を含みます。',
    dueDate: parseDate('2025-05-21'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-9-1',
        text: '注文作成APIの実装',
        completed: false,
        startDate: parseDate('2025-05-16'),
        ...calculateCalendarDateTime(parseDate('2025-05-16'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-9-2',
        text: '支払い処理APIの実装',
        completed: false,
        startDate: parseDate('2025-05-17'),
        ...calculateCalendarDateTime(parseDate('2025-05-17'), 6),
        completedDateTime: undefined,
        estimatedHours: 6,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-9-3',
        text: '注文履歴APIの実装',
        completed: false,
        startDate: parseDate('2025-05-18'),
        ...calculateCalendarDateTime(parseDate('2025-05-18'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-9-4',
        text: '注文状態管理の実装',
        completed: false,
        startDate: parseDate('2025-05-19'),
        ...calculateCalendarDateTime(parseDate('2025-05-19'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-9-5',
        text: '注文処理APIのテスト',
        completed: false,
        startDate: parseDate('2025-05-20'),
        ...calculateCalendarDateTime(parseDate('2025-05-20'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      },
      {
        id: 'todo-9-6',
        text: '注文・支払い統合テスト',
        completed: false,
        startDate: parseDate('2025-05-21'),
        ...calculateCalendarDateTime(parseDate('2025-05-21'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1
      }
    ]
  },
  {
    id: 'task-10',
    title: 'フロントエンド：ユーザー認証UI',
    description: 'ユーザー認証のためのUI実装を行います。登録フォーム、ログインフォーム、パスワードリセットなどの画面を作成します。',
    dueDate: parseDate('2025-05-26'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-10-1',
        text: '登録フォームの実装',
        completed: false,
        startDate: parseDate('2025-05-22'),
        ...calculateCalendarDateTime(parseDate('2025-05-22'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-10-2',
        text: 'ログインフォームの実装',
        completed: false,
        startDate: parseDate('2025-05-23'),
        ...calculateCalendarDateTime(parseDate('2025-05-23'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-10-3',
        text: 'パスワードリセットフォームの実装',
        completed: false,
        startDate: parseDate('2025-05-24'),
        ...calculateCalendarDateTime(parseDate('2025-05-24'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-10-4',
        text: 'ユーザープロフィール画面の実装',
        completed: false,
        startDate: parseDate('2025-05-25'),
        ...calculateCalendarDateTime(parseDate('2025-05-25'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-10-5',
        text: '認証UIのテストとバグ修正',
        completed: false,
        startDate: parseDate('2025-05-26'),
        ...calculateCalendarDateTime(parseDate('2025-05-26'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      }
    ]
  },
  {
    id: 'task-11',
    title: 'フロントエンド：マイページ実装',
    description: 'ユーザーのマイページ機能を実装します。注文履歴、お気に入り商品、プロフィール編集などの機能を含みます。',
    dueDate: parseDate('2025-05-31'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-11-1',
        text: 'マイページのレイアウト設計',
        completed: false,
        startDate: parseDate('2025-05-27'),
        ...calculateCalendarDateTime(parseDate('2025-05-27'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-11-2',
        text: '注文履歴表示の実装',
        completed: false,
        startDate: parseDate('2025-05-28'),
        ...calculateCalendarDateTime(parseDate('2025-05-28'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-11-3',
        text: 'お気に入り商品機能の実装',
        completed: false,
        startDate: parseDate('2025-05-29'),
        ...calculateCalendarDateTime(parseDate('2025-05-29'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-11-4',
        text: 'プロフィール編集機能の実装',
        completed: false,
        startDate: parseDate('2025-05-30'),
        ...calculateCalendarDateTime(parseDate('2025-05-30'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-11-5',
        text: 'マイページのテストとバグ修正',
        completed: false,
        startDate: parseDate('2025-05-31'),
        ...calculateCalendarDateTime(parseDate('2025-05-31'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-b1',
    title: '海外市場調査',
    description: '進出候補国の市場規模、競合状況、規制環境などを調査します。',
    dueDate: parseDate('2025-04-15'),
    completedDateTime: undefined,
    projectId: '2', // プロジェクトB
    status: 'not-started',
    todos: [
      {
        id: 'todo-b1-1',
        text: '市場規模の調査',
        completed: false,
        startDate: parseDate('2025-04-03'),
        ...calculateCalendarDateTime(parseDate('2025-04-03'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj2 // ゴンゾウが担当
      },
      {
        id: 'todo-b1-2',
        text: '競合分析',
        completed: false,
        startDate: parseDate('2025-04-05'),
        ...calculateCalendarDateTime(parseDate('2025-04-05'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj2 // 次郎が担当
      },
      {
        id: 'todo-b1-3',
        text: '規制環境の調査',
        completed: false,
        startDate: parseDate('2025-04-08'),
        ...calculateCalendarDateTime(parseDate('2025-04-08'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj2
      },
      {
        id: 'todo-b1-4',
        text: '市場調査レポート作成',
        completed: false,
        startDate: parseDate('2025-04-12'),
        ...calculateCalendarDateTime(parseDate('2025-04-12'), 6),
        completedDateTime: undefined,
        estimatedHours: 6,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj2
      },
      {
        id: 'todo-b1-5',
        text: '調査結果プレゼンテーション作成',
        completed: false,
        startDate: parseDate('2025-04-14'),
        ...calculateCalendarDateTime(parseDate('2025-04-14'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj2
      }
    ]
  },
  {
    id: 'task-b2',
    title: '海外向け商品選定',
    description: '海外市場に展開する商品のラインナップを選定します。現地ニーズと競合状況を考慮します。',
    dueDate: parseDate('2025-04-25'),
    completedDateTime: undefined,
    projectId: '2',
    status: 'not-started',
    todos: [
      {
        id: 'todo-b2-1',
        text: '商品カタログの分析',
        completed: false,
        startDate: parseDate('2025-04-16'),
        ...calculateCalendarDateTime(parseDate('2025-04-16'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj2
      },
      {
        id: 'todo-b2-2',
        text: '現地ニーズとのマッチング分析',
        completed: false,
        startDate: parseDate('2025-04-18'),
        ...calculateCalendarDateTime(parseDate('2025-04-18'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj2
      },
      {
        id: 'todo-b2-3',
        text: '輸出規制チェック',
        completed: false,
        startDate: parseDate('2025-04-20'),
        ...calculateCalendarDateTime(parseDate('2025-04-20'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj2
      },
      {
        id: 'todo-b2-4',
        text: '商品選定会議',
        completed: false,
        startDate: parseDate('2025-04-22'),
        ...calculateCalendarDateTime(parseDate('2025-04-22'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj2
      },
      {
        id: 'todo-b2-5',
        text: '商品ラインナップ決定文書作成',
        completed: false,
        startDate: parseDate('2025-04-24'),
        ...calculateCalendarDateTime(parseDate('2025-04-24'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj2
      }
    ]
  },
  {
    id: 'task-b3',
    title: 'パートナー企業選定',
    description: '現地での販売パートナー企業を選定します。候補企業のリストアップから審査、交渉までを含みます。',
    dueDate: parseDate('2025-05-10'),
    completedDateTime: undefined,
    projectId: '2',
    status: 'not-started',
    todos: [
      {
        id: 'todo-b3-1',
        text: 'パートナー候補リストアップ',
        completed: false,
        startDate: parseDate('2025-04-26'),
        ...calculateCalendarDateTime(parseDate('2025-04-26'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj2
      },
      {
        id: 'todo-b3-2',
        text: '候補企業の信用調査',
        completed: false,
        startDate: parseDate('2025-04-30'),
        ...calculateCalendarDateTime(parseDate('2025-04-30'), 6),
        completedDateTime: undefined,
        estimatedHours: 6,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj2
      },
      {
        id: 'todo-b3-3',
        text: '候補企業へのコンタクト',
        completed: false,
        startDate: parseDate('2025-05-03'),
        ...calculateCalendarDateTime(parseDate('2025-05-03'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj2
      },
      {
        id: 'todo-b3-4',
        text: '条件交渉資料作成',
        completed: false,
        startDate: parseDate('2025-05-05'),
        ...calculateCalendarDateTime(parseDate('2025-05-05'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj2
      },
      {
        id: 'todo-b3-5',
        text: 'オンライン商談の実施',
        completed: false,
        startDate: parseDate('2025-05-08'),
        ...calculateCalendarDateTime(parseDate('2025-05-08'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj2
      },
      {
        id: 'todo-b3-6',
        text: 'パートナー選定レポート作成',
        completed: false,
        startDate: parseDate('2025-05-10'),
        ...calculateCalendarDateTime(parseDate('2025-05-10'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj2
      }
    ]
  },
  {
    id: 'task-b4',
    title: '現地価格戦略の策定',
    description: '海外市場向けの価格戦略を策定します。現地の競合、為替変動、関税などを考慮した価格設定を行います。',
    dueDate: parseDate('2025-05-20'),
    completedDateTime: undefined,
    projectId: '2',
    status: 'not-started',
    todos: [
      {
        id: 'todo-b4-1',
        text: '競合製品の価格調査',
        completed: false,
        startDate: parseDate('2025-05-12'),
        ...calculateCalendarDateTime(parseDate('2025-05-12'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj2
      },
      {
        id: 'todo-b4-2',
        text: '関税・輸送コスト分析',
        completed: false,
        startDate: parseDate('2025-05-14'),
        ...calculateCalendarDateTime(parseDate('2025-05-14'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj2
      },
      {
        id: 'todo-b4-3',
        text: '為替リスク分析',
        completed: false,
        startDate: parseDate('2025-05-16'),
        ...calculateCalendarDateTime(parseDate('2025-05-16'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj2
      },
      {
        id: 'todo-b4-4',
        text: '価格シミュレーション作成',
        completed: false,
        startDate: parseDate('2025-05-18'),
        ...calculateCalendarDateTime(parseDate('2025-05-18'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj2
      },
      {
        id: 'todo-b4-5',
        text: '価格戦略文書の作成と承認',
        completed: false,
        startDate: parseDate('2025-05-20'),
        ...calculateCalendarDateTime(parseDate('2025-05-20'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj2
      }
    ]
  },
  {
    id: 'task-b5',
    title: 'マーケティング戦略の策定',
    description: '海外市場向けのマーケティング戦略を策定します。現地の文化や消費者行動を考慮したプロモーション計画を立案します。',
    dueDate: parseDate('2025-05-31'),
    completedDateTime: undefined,
    projectId: '2',
    status: 'not-started',
    todos: [
      {
        id: 'todo-b5-1',
        text: '現地消費者行動分析',
        completed: false,
        startDate: parseDate('2025-05-21'),
        ...calculateCalendarDateTime(parseDate('2025-05-21'), 6),
        completedDateTime: undefined,
        estimatedHours: 6,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj2
      },
      {
        id: 'todo-b5-2',
        text: '効果的なマーケティングチャネル調査',
        completed: false,
        startDate: parseDate('2025-05-23'),
        ...calculateCalendarDateTime(parseDate('2025-05-23'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj2
      },
      {
        id: 'todo-b5-3',
        text: 'プロモーション予算案作成',
        completed: false,
        startDate: parseDate('2025-05-25'),
        ...calculateCalendarDateTime(parseDate('2025-05-25'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj2
      },
      {
        id: 'todo-b5-4',
        text: 'プロモーションコンテンツ案の作成',
        completed: false,
        startDate: parseDate('2025-05-27'),
        ...calculateCalendarDateTime(parseDate('2025-05-27'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj2
      },
      {
        id: 'todo-b5-5',
        text: 'マーケティング戦略文書の作成',
        completed: false,
        startDate: parseDate('2025-05-29'),
        ...calculateCalendarDateTime(parseDate('2025-05-29'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj2
      },
      {
        id: 'todo-b5-6',
        text: '経営陣への戦略プレゼンテーション',
        completed: false,
        startDate: parseDate('2025-05-31'),
        ...calculateCalendarDateTime(parseDate('2025-05-31'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj2
      }
    ]
  },
  {
    id: 'task-c1',
    title: 'セキュリティ監査',
    description: 'コーポレートサイトのセキュリティ監査を実施し、脆弱性があれば対策を行います。',
    dueDate: parseDate('2025-05-20'),
    completedDateTime: undefined,
    projectId: '3', // プロジェクトC
    status: 'not-started',
    todos: [
      {
        id: 'todo-c1-1',
        text: '脆弱性診断ツールによるスキャン',
        completed: false,
        startDate: parseDate('2025-05-16'),
        ...calculateCalendarDateTime(parseDate('2025-05-16'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3 // 三郎が担当
      },
      {
        id: 'todo-c1-2',
        text: '認証機能のレビュー',
        completed: false,
        startDate: parseDate('2025-05-17'),
        ...calculateCalendarDateTime(parseDate('2025-05-17'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj3 // 太郎が担当
      },
      {
        id: 'todo-c1-3',
        text: 'セキュリティ設定の確認',
        completed: false,
        startDate: parseDate('2025-05-18'),
        ...calculateCalendarDateTime(parseDate('2025-05-18'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3
      },
      {
        id: 'todo-c1-4',
        text: 'セキュリティ脆弱性対応',
        completed: false,
        startDate: parseDate('2025-05-19'),
        ...calculateCalendarDateTime(parseDate('2025-05-19'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3
      },
      {
        id: 'todo-c1-5',
        text: 'セキュリティ監査レポート作成',
        completed: false,
        startDate: parseDate('2025-05-20'),
        ...calculateCalendarDateTime(parseDate('2025-05-20'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj3
      }
    ]
  },
  {
    id: 'task-c2',
    title: 'パフォーマンス最適化',
    description: 'コーポレートサイトのロード時間やレスポンスを改善するためのパフォーマンス最適化を実施します。',
    dueDate: parseDate('2025-05-10'),
    completedDateTime: undefined,
    projectId: '3',
    status: 'not-started',
    todos: [
      {
        id: 'todo-c2-1',
        text: '現状のパフォーマンス分析',
        completed: false,
        startDate: parseDate('2025-05-05'),
        ...calculateCalendarDateTime(parseDate('2025-05-05'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3
      },
      {
        id: 'todo-c2-2',
        text: '画像最適化',
        completed: false,
        startDate: parseDate('2025-05-06'),
        ...calculateCalendarDateTime(parseDate('2025-05-06'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3
      },
      {
        id: 'todo-c2-3',
        text: 'JavaScript・CSSの最適化',
        completed: false,
        startDate: parseDate('2025-05-07'),
        ...calculateCalendarDateTime(parseDate('2025-05-07'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3
      },
      {
        id: 'todo-c2-4',
        text: 'サーバー設定の最適化',
        completed: false,
        startDate: parseDate('2025-05-08'),
        ...calculateCalendarDateTime(parseDate('2025-05-08'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj3
      },
      {
        id: 'todo-c2-5',
        text: 'パフォーマンス改善の検証',
        completed: false,
        startDate: parseDate('2025-05-10'),
        ...calculateCalendarDateTime(parseDate('2025-05-10'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj3
      }
    ]
  },
  {
    id: 'task-c3',
    title: 'コンテンツ更新',
    description: 'コーポレートサイトのコンテンツを更新します。最新の企業情報やニュースを反映させます。',
    dueDate: parseDate('2025-04-30'),
    completedDateTime: undefined,
    projectId: '3',
    status: 'not-started',
    todos: [
      {
        id: 'todo-c3-1',
        text: '更新コンテンツの洗い出し',
        completed: false,
        startDate: parseDate('2025-04-20'),
        ...calculateCalendarDateTime(parseDate('2025-04-20'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj3
      },
      {
        id: 'todo-c3-2',
        text: '新規コンテンツの作成',
        completed: false,
        startDate: parseDate('2025-04-22'),
        ...calculateCalendarDateTime(parseDate('2025-04-22'), 6),
        completedDateTime: undefined,
        estimatedHours: 6,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3
      },
      {
        id: 'todo-c3-3',
        text: 'コンテンツのレビュー',
        completed: false,
        startDate: parseDate('2025-04-25'),
        ...calculateCalendarDateTime(parseDate('2025-04-25'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj3
      },
      {
        id: 'todo-c3-4',
        text: 'コンテンツの公開作業',
        completed: false,
        startDate: parseDate('2025-04-27'),
        ...calculateCalendarDateTime(parseDate('2025-04-27'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3
      },
      {
        id: 'todo-c3-5',
        text: '公開後のチェック',
        completed: false,
        startDate: parseDate('2025-04-30'),
        ...calculateCalendarDateTime(parseDate('2025-04-30'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3
      }
    ]
  },
  {
    id: 'task-c4',
    title: 'アクセシビリティ対応',
    description: 'コーポレートサイトのアクセシビリティを向上させる対応を行います。スクリーンリーダー対応や色のコントラスト確保などを含みます。',
    dueDate: parseDate('2025-05-25'),
    completedDateTime: undefined,
    projectId: '3',
    status: 'not-started',
    todos: [
      {
        id: 'todo-c4-1',
        text: 'アクセシビリティ監査',
        completed: false,
        startDate: parseDate('2025-05-21'),
        ...calculateCalendarDateTime(parseDate('2025-05-21'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3
      },
      {
        id: 'todo-c4-2',
        text: '画像の代替テキスト追加',
        completed: false,
        startDate: parseDate('2025-05-22'),
        ...calculateCalendarDateTime(parseDate('2025-05-22'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3
      },
      {
        id: 'todo-c4-3',
        text: 'キーボード操作対応',
        completed: false,
        startDate: parseDate('2025-05-23'),
        ...calculateCalendarDateTime(parseDate('2025-05-23'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3
      },
      {
        id: 'todo-c4-4',
        text: 'コントラスト調整',
        completed: false,
        startDate: parseDate('2025-05-24'),
        ...calculateCalendarDateTime(parseDate('2025-05-24'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj3
      },
      {
        id: 'todo-c4-5',
        text: 'アクセシビリティテスト',
        completed: false,
        startDate: parseDate('2025-05-25'),
        ...calculateCalendarDateTime(parseDate('2025-05-25'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj3
      }
    ]
  },
  {
    id: 'task-c5',
    title: 'アナリティクス改善',
    description: 'サイトのアクセス解析を改善し、ユーザー行動の把握を強化します。目標設定とレポート体制の構築を行います。',
    dueDate: parseDate('2025-05-31'),
    completedDateTime: undefined,
    projectId: '3',
    status: 'not-started',
    todos: [
      {
        id: 'todo-c5-1',
        text: '現状のアナリティクス設定確認',
        completed: false,
        startDate: parseDate('2025-05-26'),
        ...calculateCalendarDateTime(parseDate('2025-05-26'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj3
      },
      {
        id: 'todo-c5-2',
        text: '測定目標の設定',
        completed: false,
        startDate: parseDate('2025-05-27'),
        ...calculateCalendarDateTime(parseDate('2025-05-27'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj3
      },
      {
        id: 'todo-c5-3',
        text: 'イベントトラッキングの実装',
        completed: false,
        startDate: parseDate('2025-05-28'),
        ...calculateCalendarDateTime(parseDate('2025-05-28'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3
      },
      {
        id: 'todo-c5-4',
        text: 'カスタムレポートの作成',
        completed: false,
        startDate: parseDate('2025-05-29'),
        ...calculateCalendarDateTime(parseDate('2025-05-29'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3
      },
      {
        id: 'todo-c5-5',
        text: 'アナリティクスの動作確認',
        completed: false,
        startDate: parseDate('2025-05-30'),
        ...calculateCalendarDateTime(parseDate('2025-05-30'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj3
      },
      {
        id: 'todo-c5-6',
        text: '分析レポートフォーマット作成',
        completed: false,
        startDate: parseDate('2025-05-31'),
        ...calculateCalendarDateTime(parseDate('2025-05-31'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj3
      }
    ]
  },
  {
    id: 'task-12',
    title: 'フロントエンド：検索機能実装',
    description: '商品検索機能のフロントエンド実装を行います。検索条件の絞り込みやソート機能なども含みます。',
    dueDate: parseDate('2025-04-20'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-12-1',
        text: '検索UI設計',
        completed: false,
        startDate: parseDate('2025-04-16'),
        ...calculateCalendarDateTime(parseDate('2025-04-16'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-12-2',
        text: '検索フォーム実装',
        completed: false,
        startDate: parseDate('2025-04-17'),
        ...calculateCalendarDateTime(parseDate('2025-04-17'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-12-3',
        text: '検索結果表示実装',
        completed: false,
        startDate: parseDate('2025-04-18'),
        ...calculateCalendarDateTime(parseDate('2025-04-18'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-12-4',
        text: 'フィルタリング機能実装',
        completed: false,
        startDate: parseDate('2025-04-19'),
        ...calculateCalendarDateTime(parseDate('2025-04-19'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-12-5',
        text: 'ソート機能実装',
        completed: false,
        startDate: parseDate('2025-04-19'),
        ...calculateCalendarDateTime(parseDate('2025-04-19'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-12-6',
        text: '検索機能テスト',
        completed: false,
        startDate: parseDate('2025-04-20'),
        ...calculateCalendarDateTime(parseDate('2025-04-20'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-13',
    title: 'フロントエンド：レビュー機能実装',
    description: '商品レビュー機能のフロントエンド実装を行います。レビュー投稿、表示、評価システムを含みます。',
    dueDate: parseDate('2025-04-26'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-13-1',
        text: 'レビューUI設計',
        completed: false,
        startDate: parseDate('2025-04-21'),
        ...calculateCalendarDateTime(parseDate('2025-04-21'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-13-2',
        text: 'レビュー表示コンポーネント実装',
        completed: false,
        startDate: parseDate('2025-04-22'),
        ...calculateCalendarDateTime(parseDate('2025-04-22'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-13-3',
        text: 'レビュー投稿フォーム実装',
        completed: false,
        startDate: parseDate('2025-04-23'),
        ...calculateCalendarDateTime(parseDate('2025-04-23'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-13-4',
        text: '星評価システム実装',
        completed: false,
        startDate: parseDate('2025-04-24'),
        ...calculateCalendarDateTime(parseDate('2025-04-24'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-13-5',
        text: 'レビュー並び替え機能実装',
        completed: false,
        startDate: parseDate('2025-04-25'),
        ...calculateCalendarDateTime(parseDate('2025-04-25'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-13-6',
        text: 'レビュー機能統合テスト',
        completed: false,
        startDate: parseDate('2025-04-26'),
        ...calculateCalendarDateTime(parseDate('2025-04-26'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-14',
    title: 'フロントエンド：お気に入り機能実装',
    description: 'お気に入り商品機能のフロントエンド実装を行います。お気に入り追加、削除、一覧表示などを含みます。',
    dueDate: parseDate('2025-05-01'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-14-1',
        text: 'お気に入りボタンUI実装',
        completed: false,
        startDate: parseDate('2025-04-27'),
        ...calculateCalendarDateTime(parseDate('2025-04-27'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-14-2',
        text: 'お気に入り状態管理実装',
        completed: false,
        startDate: parseDate('2025-04-28'),
        ...calculateCalendarDateTime(parseDate('2025-04-28'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-14-3',
        text: 'お気に入り一覧ページ実装',
        completed: false,
        startDate: parseDate('2025-04-29'),
        ...calculateCalendarDateTime(parseDate('2025-04-29'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-14-4',
        text: 'お気に入り削除機能実装',
        completed: false,
        startDate: parseDate('2025-04-30'),
        ...calculateCalendarDateTime(parseDate('2025-04-30'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-14-5',
        text: 'お気に入り機能テスト',
        completed: false,
        startDate: parseDate('2025-05-01'),
        ...calculateCalendarDateTime(parseDate('2025-05-01'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-15',
    title: 'フロントエンド：通知機能実装',
    description: 'ユーザー通知機能のフロントエンド実装を行います。システム通知、注文状況変更通知などを含みます。',
    dueDate: parseDate('2025-05-06'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-15-1',
        text: '通知UIデザイン',
        completed: false,
        startDate: parseDate('2025-05-02'),
        ...calculateCalendarDateTime(parseDate('2025-05-02'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-15-2',
        text: '通知コンポーネント実装',
        completed: false,
        startDate: parseDate('2025-05-03'),
        ...calculateCalendarDateTime(parseDate('2025-05-03'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-15-3',
        text: '通知一覧画面実装',
        completed: false,
        startDate: parseDate('2025-05-04'),
        ...calculateCalendarDateTime(parseDate('2025-05-04'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-15-4',
        text: '通知設定画面実装',
        completed: false,
        startDate: parseDate('2025-05-05'),
        ...calculateCalendarDateTime(parseDate('2025-05-05'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-15-5',
        text: 'プッシュ通知連携実装',
        completed: false,
        startDate: parseDate('2025-05-06'),
        ...calculateCalendarDateTime(parseDate('2025-05-06'), 6),
        completedDateTime: undefined,
        estimatedHours: 6,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      }
    ]
  },
  {
    id: 'task-16',
    title: 'フロントエンド：決済画面実装',
    description: '決済処理画面のフロントエンド実装を行います。クレジットカード決済、代引き、その他の支払い方法に対応します。',
    dueDate: parseDate('2025-05-12'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-16-1',
        text: '決済フロー設計',
        completed: false,
        startDate: parseDate('2025-05-07'),
        ...calculateCalendarDateTime(parseDate('2025-05-07'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1
      },
      {
        id: 'todo-16-2',
        text: '支払い方法選択画面実装',
        completed: false,
        startDate: parseDate('2025-05-08'),
        ...calculateCalendarDateTime(parseDate('2025-05-08'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-16-3',
        text: 'クレジットカード入力フォーム実装',
        completed: false,
        startDate: parseDate('2025-05-09'),
        ...calculateCalendarDateTime(parseDate('2025-05-09'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-16-4',
        text: '決済処理進行状況UI実装',
        completed: false,
        startDate: parseDate('2025-05-10'),
        ...calculateCalendarDateTime(parseDate('2025-05-10'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-16-5',
        text: '注文確認画面実装',
        completed: false,
        startDate: parseDate('2025-05-11'),
        ...calculateCalendarDateTime(parseDate('2025-05-11'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-16-6',
        text: '決済完了画面実装',
        completed: false,
        startDate: parseDate('2025-05-12'),
        ...calculateCalendarDateTime(parseDate('2025-05-12'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      }
    ]
  },
  {
    id: 'task-17',
    title: 'バックエンド開発：商品カテゴリAPI',
    description: '商品カテゴリ管理のバックエンドAPIを実装します。カテゴリの階層構造管理、CRUD操作などを含みます。',
    dueDate: parseDate('2025-05-17'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-17-1',
        text: 'カテゴリモデル設計',
        completed: false,
        startDate: parseDate('2025-05-13'),
        ...calculateCalendarDateTime(parseDate('2025-05-13'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-17-2',
        text: 'カテゴリCRUD API実装',
        completed: false,
        startDate: parseDate('2025-05-14'),
        ...calculateCalendarDateTime(parseDate('2025-05-14'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-17-3',
        text: 'カテゴリ階層構造処理実装',
        completed: false,
        startDate: parseDate('2025-05-15'),
        ...calculateCalendarDateTime(parseDate('2025-05-15'), 6),
        completedDateTime: undefined,
        estimatedHours: 6,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-17-4',
        text: 'カテゴリ検索API実装',
        completed: false,
        startDate: parseDate('2025-05-16'),
        ...calculateCalendarDateTime(parseDate('2025-05-16'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-17-5',
        text: 'カテゴリAPIテスト',
        completed: false,
        startDate: parseDate('2025-05-17'),
        ...calculateCalendarDateTime(parseDate('2025-05-17'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-18',
    title: 'バックエンド開発：在庫管理API',
    description: '商品在庫管理のバックエンドAPIを実装します。在庫数更新、在庫アラート、予約在庫などの機能を含みます。',
    dueDate: parseDate('2025-05-23'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-18-1',
        text: '在庫管理モデル設計',
        completed: false,
        startDate: parseDate('2025-05-18'),
        ...calculateCalendarDateTime(parseDate('2025-05-18'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-18-2',
        text: '在庫数更新API実装',
        completed: false,
        startDate: parseDate('2025-05-19'),
        ...calculateCalendarDateTime(parseDate('2025-05-19'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-18-3',
        text: '在庫履歴管理実装',
        completed: false,
        startDate: parseDate('2025-05-20'),
        ...calculateCalendarDateTime(parseDate('2025-05-20'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-18-4',
        text: '在庫アラート機能実装',
        completed: false,
        startDate: parseDate('2025-05-21'),
        ...calculateCalendarDateTime(parseDate('2025-05-21'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-18-5',
        text: '予約在庫処理実装',
        completed: false,
        startDate: parseDate('2025-05-22'),
        ...calculateCalendarDateTime(parseDate('2025-05-22'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-18-6',
        text: '在庫管理APIテスト',
        completed: false,
        startDate: parseDate('2025-05-23'),
        ...calculateCalendarDateTime(parseDate('2025-05-23'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-19',
    title: 'バックエンド開発：ユーザーレビューAPI',
    description: 'ユーザーレビュー管理のバックエンドAPIを実装します。レビュー投稿、編集、モデレーションなどの機能を含みます。',
    dueDate: parseDate('2025-05-28'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-19-1',
        text: 'レビューモデル設計',
        completed: false,
        startDate: parseDate('2025-05-24'),
        ...calculateCalendarDateTime(parseDate('2025-05-24'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      },
      {
        id: 'todo-19-2',
        text: 'レビュー投稿API実装',
        completed: false,
        startDate: parseDate('2025-05-25'),
        ...calculateCalendarDateTime(parseDate('2025-05-25'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-19-3',
        text: 'レビュー検索・取得API実装',
        completed: false,
        startDate: parseDate('2025-05-26'),
        ...calculateCalendarDateTime(parseDate('2025-05-26'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-19-4',
        text: 'レビューモデレーション機能実装',
        completed: false,
        startDate: parseDate('2025-05-27'),
        ...calculateCalendarDateTime(parseDate('2025-05-27'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1
      },
      {
        id: 'todo-19-5',
        text: 'レビューAPIテスト',
        completed: false,
        startDate: parseDate('2025-05-28'),
        ...calculateCalendarDateTime(parseDate('2025-05-28'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-20',
    title: 'バックエンド開発：決済処理API',
    description: '決済処理のバックエンドAPIを実装します。クレジットカード決済、決済代行サービス連携などを含みます。',
    dueDate: parseDate('2025-04-05'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-20-1',
        text: '決済モデル設計',
        completed: false,
        startDate: parseDate('2025-04-01'),
        ...calculateCalendarDateTime(parseDate('2025-04-01'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      },
      {
        id: 'todo-20-2',
        text: '決済処理API実装',
        completed: false,
        startDate: parseDate('2025-04-02'),
        ...calculateCalendarDateTime(parseDate('2025-04-02'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-20-3',
        text: '決済代行サービス連携実装',
        completed: false,
        startDate: parseDate('2025-04-03'),
        ...calculateCalendarDateTime(parseDate('2025-04-03'), 6),
        completedDateTime: undefined,
        estimatedHours: 6,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-20-4',
        text: '決済エラー処理実装',
        completed: false,
        startDate: parseDate('2025-04-04'),
        ...calculateCalendarDateTime(parseDate('2025-04-04'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-20-5',
        text: '決済処理APIテスト',
        completed: false,
        startDate: parseDate('2025-04-05'),
        ...calculateCalendarDateTime(parseDate('2025-04-05'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-21',
    title: 'フロントエンド：商品比較機能実装',
    description: '商品比較機能のフロントエンド実装を行います。複数商品の仕様を並べて比較できる機能です。',
    dueDate: parseDate('2025-04-10'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-21-1',
        text: '比較UI設計',
        completed: false,
        startDate: parseDate('2025-04-06'),
        ...calculateCalendarDateTime(parseDate('2025-04-06'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-21-2',
        text: '比較対象選択実装',
        completed: false,
        startDate: parseDate('2025-04-07'),
        ...calculateCalendarDateTime(parseDate('2025-04-07'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-21-3',
        text: '比較表示画面実装',
        completed: false,
        startDate: parseDate('2025-04-08'),
        ...calculateCalendarDateTime(parseDate('2025-04-08'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-21-4',
        text: '比較項目選択実装',
        completed: false,
        startDate: parseDate('2025-04-09'),
        ...calculateCalendarDateTime(parseDate('2025-04-09'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-21-5',
        text: '比較機能テスト',
        completed: false,
        startDate: parseDate('2025-04-10'),
        ...calculateCalendarDateTime(parseDate('2025-04-10'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-22',
    title: 'フロントエンド：ソーシャルシェア機能実装',
    description: 'ソーシャルメディア共有機能のフロントエンド実装を行います。商品やコンテンツをSNSでシェアする機能です。',
    dueDate: parseDate('2025-04-15'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-22-1',
        text: 'シェアボタンUI設計',
        completed: false,
        startDate: parseDate('2025-04-11'),
        ...calculateCalendarDateTime(parseDate('2025-04-11'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-22-2',
        text: 'Facebook共有実装',
        completed: false,
        startDate: parseDate('2025-04-12'),
        ...calculateCalendarDateTime(parseDate('2025-04-12'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-22-3',
        text: 'Twitter共有実装',
        completed: false,
        startDate: parseDate('2025-04-13'),
        ...calculateCalendarDateTime(parseDate('2025-04-13'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-22-4',
        text: 'LINE共有実装',
        completed: false,
        startDate: parseDate('2025-04-14'),
        ...calculateCalendarDateTime(parseDate('2025-04-14'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-22-5',
        text: 'Pinterest共有実装',
        completed: false,
        startDate: parseDate('2025-04-14'),
        ...calculateCalendarDateTime(parseDate('2025-04-14'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-22-6',
        text: 'ソーシャルシェア機能テスト',
        completed: false,
        startDate: parseDate('2025-04-15'),
        ...calculateCalendarDateTime(parseDate('2025-04-15'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-23',
    title: 'フロントエンド：多言語対応',
    description: 'ECサイトの多言語対応を実装します。翻訳リソース管理、言語切替機能などを含みます。',
    dueDate: parseDate('2025-04-21'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-23-1',
        text: '多言語対応フレームワーク選定',
        completed: false,
        startDate: parseDate('2025-04-16'),
        ...calculateCalendarDateTime(parseDate('2025-04-16'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1
      },
      {
        id: 'todo-23-2',
        text: '翻訳リソース構造設計',
        completed: false,
        startDate: parseDate('2025-04-17'),
        ...calculateCalendarDateTime(parseDate('2025-04-17'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      },
      {
        id: 'todo-23-3',
        text: '日本語リソース作成',
        completed: false,
        startDate: parseDate('2025-04-18'),
        ...calculateCalendarDateTime(parseDate('2025-04-18'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-23-4',
        text: '英語リソース作成',
        completed: false,
        startDate: parseDate('2025-04-19'),
        ...calculateCalendarDateTime(parseDate('2025-04-19'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-23-5',
        text: '言語切替UI実装',
        completed: false,
        startDate: parseDate('2025-04-20'),
        ...calculateCalendarDateTime(parseDate('2025-04-20'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-23-6',
        text: '多言語対応テスト',
        completed: false,
        startDate: parseDate('2025-04-21'),
        ...calculateCalendarDateTime(parseDate('2025-04-21'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-24',
    title: 'バックエンド開発：キャッシュシステム実装',
    description: 'パフォーマンス向上のためのキャッシュシステムを実装します。頻繁にアクセスされるデータをキャッシュします。',
    dueDate: parseDate('2025-04-26'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-24-1',
        text: 'キャッシュ戦略設計',
        completed: false,
        startDate: parseDate('2025-04-22'),
        ...calculateCalendarDateTime(parseDate('2025-04-22'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1
      },
      {
        id: 'todo-24-2',
        text: 'Redisキャッシュ設定',
        completed: false,
        startDate: parseDate('2025-04-23'),
        ...calculateCalendarDateTime(parseDate('2025-04-23'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-24-3',
        text: '商品キャッシュ実装',
        completed: false,
        startDate: parseDate('2025-04-24'),
        ...calculateCalendarDateTime(parseDate('2025-04-24'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-24-4',
        text: 'キャッシュ無効化ロジック実装',
        completed: false,
        startDate: parseDate('2025-04-25'),
        ...calculateCalendarDateTime(parseDate('2025-04-25'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      },
      {
        id: 'todo-24-5',
        text: 'キャッシュシステムテスト',
        completed: false,
        startDate: parseDate('2025-04-26'),
        ...calculateCalendarDateTime(parseDate('2025-04-26'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      }
    ]
  },
  {
    id: 'task-25',
    title: 'バックエンド開発：ロギングシステム実装',
    description: 'システム全体のロギングシステムを実装します。エラー追跡、パフォーマンス監視、セキュリティ監査などに活用します。',
    dueDate: parseDate('2025-05-01'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-25-1',
        text: 'ロギング戦略設計',
        completed: false,
        startDate: parseDate('2025-04-27'),
        ...calculateCalendarDateTime(parseDate('2025-04-27'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1
      },
      {
        id: 'todo-25-2',
        text: 'ロギングフレームワーク導入',
        completed: false,
        startDate: parseDate('2025-04-28'),
        ...calculateCalendarDateTime(parseDate('2025-04-28'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      },
      {
        id: 'todo-25-3',
        text: 'エラーロギング実装',
        completed: false,
        startDate: parseDate('2025-04-29'),
        ...calculateCalendarDateTime(parseDate('2025-04-29'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-25-4',
        text: 'パフォーマンスロギング実装',
        completed: false,
        startDate: parseDate('2025-04-30'),
        ...calculateCalendarDateTime(parseDate('2025-04-30'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-25-5',
        text: 'セキュリティロギング実装',
        completed: false,
        startDate: parseDate('2025-05-01'),
        ...calculateCalendarDateTime(parseDate('2025-05-01'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-26',
    title: 'フロントエンド：アクセシビリティ対応',
    description: 'ECサイトのアクセシビリティを向上させる実装を行います。スクリーンリーダー対応、キーボード操作対応などを含みます。',
    dueDate: parseDate('2025-05-06'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-26-1',
        text: 'アクセシビリティ監査',
        completed: false,
        startDate: parseDate('2025-05-02'),
        ...calculateCalendarDateTime(parseDate('2025-05-02'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-26-2',
        text: 'スクリーンリーダー対応',
        completed: false,
        startDate: parseDate('2025-05-03'),
        ...calculateCalendarDateTime(parseDate('2025-05-03'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-26-3',
        text: 'キーボード操作対応',
        completed: false,
        startDate: parseDate('2025-05-04'),
        ...calculateCalendarDateTime(parseDate('2025-05-04'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-26-4',
        text: 'コントラスト・色覚対応',
        completed: false,
        startDate: parseDate('2025-05-05'),
        ...calculateCalendarDateTime(parseDate('2025-05-05'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-26-5',
        text: 'アクセシビリティテスト',
        completed: false,
        startDate: parseDate('2025-05-06'),
        ...calculateCalendarDateTime(parseDate('2025-05-06'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      }
    ]
  },
  {
    id: 'task-27',
    title: 'バックエンド開発：検索機能API',
    description: 'ECサイトの検索機能APIを実装します。商品検索、フィルタリング、ソート機能を含みます。',
    dueDate: parseDate('2025-05-12'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-27-1',
        text: '検索エンジン選定',
        completed: false,
        startDate: parseDate('2025-05-07'),
        ...calculateCalendarDateTime(parseDate('2025-05-07'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1
      },
      {
        id: 'todo-27-2',
        text: 'Elasticsearchセットアップ',
        completed: false,
        startDate: parseDate('2025-05-08'),
        ...calculateCalendarDateTime(parseDate('2025-05-08'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-27-3',
        text: '商品インデックス作成',
        completed: false,
        startDate: parseDate('2025-05-09'),
        ...calculateCalendarDateTime(parseDate('2025-05-09'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-27-4',
        text: '検索API実装',
        completed: false,
        startDate: parseDate('2025-05-10'),
        ...calculateCalendarDateTime(parseDate('2025-05-10'), 6),
        completedDateTime: undefined,
        estimatedHours: 6,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      },
      {
        id: 'todo-27-5',
        text: 'フィルタリング機能実装',
        completed: false,
        startDate: parseDate('2025-05-11'),
        ...calculateCalendarDateTime(parseDate('2025-05-11'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-27-6',
        text: '検索APIテスト',
        completed: false,
        startDate: parseDate('2025-05-12'),
        ...calculateCalendarDateTime(parseDate('2025-05-12'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      }
    ]
  },
  {
    id: 'task-28',
    title: 'フロントエンド：商品推薦機能実装',
    description: 'ユーザーへの商品推薦機能を実装します。閲覧履歴や購入履歴に基づく推薦システムです。',
    dueDate: parseDate('2025-05-17'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-28-1',
        text: '推薦アルゴリズム設計',
        completed: false,
        startDate: parseDate('2025-05-13'),
        ...calculateCalendarDateTime(parseDate('2025-05-13'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1
      },
      {
        id: 'todo-28-2',
        text: '閲覧履歴追跡実装',
        completed: false,
        startDate: parseDate('2025-05-14'),
        ...calculateCalendarDateTime(parseDate('2025-05-14'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-28-3',
        text: '推薦API連携',
        completed: false,
        startDate: parseDate('2025-05-15'),
        ...calculateCalendarDateTime(parseDate('2025-05-15'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-28-4',
        text: '「おすすめ商品」UI実装',
        completed: false,
        startDate: parseDate('2025-05-16'),
        ...calculateCalendarDateTime(parseDate('2025-05-16'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      },
      {
        id: 'todo-28-5',
        text: '商品推薦機能テスト',
        completed: false,
        startDate: parseDate('2025-05-17'),
        ...calculateCalendarDateTime(parseDate('2025-05-17'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      }
    ]
  },
  {
    id: 'task-29',
    title: 'バックエンド開発：メール通知システム',
    description: '注文確認、配送状況、セール情報などのメール通知システムを実装します。',
    dueDate: parseDate('2025-05-23'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-29-1',
        text: 'メール送信サービス選定',
        completed: false,
        startDate: parseDate('2025-05-18'),
        ...calculateCalendarDateTime(parseDate('2025-05-18'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1
      },
      {
        id: 'todo-29-2',
        text: 'メールテンプレート設計',
        completed: false,
        startDate: parseDate('2025-05-19'),
        ...calculateCalendarDateTime(parseDate('2025-05-19'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-29-3',
        text: '注文確認メール実装',
        completed: false,
        startDate: parseDate('2025-05-20'),
        ...calculateCalendarDateTime(parseDate('2025-05-20'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-29-4',
        text: '配送状況メール実装',
        completed: false,
        startDate: parseDate('2025-05-21'),
        ...calculateCalendarDateTime(parseDate('2025-05-21'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      },
      {
        id: 'todo-29-5',
        text: 'メールキュー管理実装',
        completed: false,
        startDate: parseDate('2025-05-22'),
        ...calculateCalendarDateTime(parseDate('2025-05-22'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-29-6',
        text: 'メール送信テスト',
        completed: false,
        startDate: parseDate('2025-05-23'),
        ...calculateCalendarDateTime(parseDate('2025-05-23'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      }
    ]
  },
  {
    id: 'task-30',
    title: 'フロントエンド：画像ギャラリー最適化',
    description: '商品画像ギャラリーの最適化を行います。画像読み込み、ズーム機能、スライダー機能の実装を含みます。',
    dueDate: parseDate('2025-05-28'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-30-1',
        text: '画像ギャラリーUI設計',
        completed: false,
        startDate: parseDate('2025-05-24'),
        ...calculateCalendarDateTime(parseDate('2025-05-24'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-30-2',
        text: '画像遅延読み込み実装',
        completed: false,
        startDate: parseDate('2025-05-25'),
        ...calculateCalendarDateTime(parseDate('2025-05-25'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-30-3',
        text: '画像ズーム機能実装',
        completed: false,
        startDate: parseDate('2025-05-26'),
        ...calculateCalendarDateTime(parseDate('2025-05-26'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-30-4',
        text: '画像スライダー実装',
        completed: false,
        startDate: parseDate('2025-05-27'),
        ...calculateCalendarDateTime(parseDate('2025-05-27'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      },
      {
        id: 'todo-30-5',
        text: '画像ギャラリーテスト',
        completed: false,
        startDate: parseDate('2025-05-28'),
        ...calculateCalendarDateTime(parseDate('2025-05-28'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      }
    ]
  },
  {
    id: 'task-31',
    title: 'バックエンド開発：SEO最適化',
    description: 'ECサイトのSEO最適化を行います。メタタグ、構造化データ、サイトマップなどの実装を含みます。',
    dueDate: parseDate('2025-06-03'),
    completedDateTime: undefined,
    projectId: '1',
    status: 'not-started',
    todos: [
      {
        id: 'todo-31-1',
        text: 'SEO戦略策定',
        completed: false,
        startDate: parseDate('2025-05-29'),
        ...calculateCalendarDateTime(parseDate('2025-05-29'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1
      },
      {
        id: 'todo-31-2',
        text: 'メタタグ自動生成実装',
        completed: false,
        startDate: parseDate('2025-05-30'),
        ...calculateCalendarDateTime(parseDate('2025-05-30'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1
      },
      {
        id: 'todo-31-3',
        text: '構造化データ実装',
        completed: false,
        startDate: parseDate('2025-05-31'),
        ...calculateCalendarDateTime(parseDate('2025-05-31'), 6),
        completedDateTime: undefined,
        estimatedHours: 6,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1
      },
      {
        id: 'todo-31-4',
        text: 'サイトマップ生成実装',
        completed: false,
        startDate: parseDate('2025-06-01'),
        ...calculateCalendarDateTime(parseDate('2025-06-01'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1
      },
      {
        id: 'todo-31-5',
        text: 'パフォーマンス最適化',
        completed: false,
        startDate: parseDate('2025-06-02'),
        ...calculateCalendarDateTime(parseDate('2025-06-02'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1
      },
      {
        id: 'todo-31-6',
        text: 'SEO評価テスト',
        completed: false,
        startDate: parseDate('2025-06-03'),
        ...calculateCalendarDateTime(parseDate('2025-06-03'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1
      }
    ]
  }
]; 