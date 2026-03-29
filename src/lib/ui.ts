export type SiteLocale = 'root' | 'en' | 'ja';

type SiteCopy = {
  lang: string;
  title: string;
  description: string;
  nav: {
    home: string;
    docs: string;
    github: string;
    discord: string;
    theme: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primary: string;
    secondary: string;
  };
  stats: {
    categories: string;
    articles: string;
    updated: string;
  };
  sections: {
    categories: string;
    latest: string;
  };
  labels: {
    articleCount: string;
    openCategory: string;
    latestUpdated: string;
    noDescription: string;
  };
  heroPanel: {
    title: string;
    items: string[];
  };
  footer: string;
};

export const SITE_COPY: Record<SiteLocale, SiteCopy> = {
  root: {
    lang: 'zh-CN',
    title: 'Daily Routines 信息中心',
    description: 'Daily Routines 官方文档、FAQ、更新日志与开发资料中心。',
    nav: {
      home: '首页',
      docs: '文档中心',
      github: 'GitHub',
      discord: 'Discord',
      theme: '切换亮暗主题'
    },
    hero: {
      eyebrow: 'Daily Routines',
      title: 'Daily Routines 官方文档与信息中心',
      description: '这里集中整理常见问题、版本更新与开发资料，方便快速查找安装说明、使用指引和重要变更。',
      primary: '进入文档中心',
      secondary: '查看更新日志'
    },
    stats: {
      categories: '内容分区',
      articles: '文档篇数',
      updated: '最近更新'
    },
    sections: {
      categories: '内容分区',
      latest: '最近更新'
    },
    labels: {
      articleCount: '篇文章',
      openCategory: '查看分区',
      latestUpdated: '最近更新',
      noDescription: '暂无简介'
    },
    heroPanel: {
      title: '你可以在这里找到',
      items: [
        '常见问题与排查方案',
        '版本更新记录与重要改动',
        'IPC 与开发集成资料'
      ]
    },
    footer: 'Daily Routines Team. All rights reserved.'
  },
  en: {
    lang: 'en',
    title: 'Daily Routines Info Center',
    description: 'Official Daily Routines docs hub for FAQs, changelogs, and developer references.',
    nav: {
      home: 'Home',
      docs: 'Docs',
      github: 'GitHub',
      discord: 'Discord',
      theme: 'Toggle light and dark theme'
    },
    hero: {
      eyebrow: 'Daily Routines',
      title: 'Official Daily Routines Docs and Info Center',
      description: 'A single place for FAQs, release notes, and developer references, built to help users quickly find setup steps, usage guides, and important changes.',
      primary: 'Open docs',
      secondary: 'View changelog'
    },
    stats: {
      categories: 'Sections',
      articles: 'Articles',
      updated: 'Last Updated'
    },
    sections: {
      categories: 'Sections',
      latest: 'Latest Updates'
    },
    labels: {
      articleCount: 'articles',
      openCategory: 'Open section',
      latestUpdated: 'Latest update',
      noDescription: 'No description yet'
    },
    heroPanel: {
      title: 'What you can find here',
      items: [
        'FAQs and troubleshooting guides',
        'Release notes and important changes',
        'IPC and developer integration references'
      ]
    },
    footer: 'Daily Routines Team. All rights reserved.'
  },
  ja: {
    lang: 'ja-JP',
    title: 'Daily Routines インフォメーションセンター',
    description: 'Daily Routines の FAQ、更新履歴、開発資料をまとめた公式サイトです。',
    nav: {
      home: 'ホーム',
      docs: 'ドキュメント',
      github: 'GitHub',
      discord: 'Discord',
      theme: 'ライトテーマとダークテーマを切り替える'
    },
    hero: {
      eyebrow: 'Daily Routines',
      title: 'Daily Routines 公式ドキュメントと情報センター',
      description: 'FAQ、更新履歴、開発資料をまとめて確認できる、Daily Routines の公式情報サイトです。',
      primary: 'ドキュメントを見る',
      secondary: '更新履歴を見る'
    },
    stats: {
      categories: 'カテゴリ',
      articles: '記事数',
      updated: '最終更新'
    },
    sections: {
      categories: 'カテゴリ',
      latest: '最近の更新'
    },
    labels: {
      articleCount: '記事',
      openCategory: 'カテゴリを開く',
      latestUpdated: '最終更新',
      noDescription: '説明はまだありません'
    },
    heroPanel: {
      title: 'このサイトで確認できる内容',
      items: [
        'よくある質問とトラブルシューティング',
        '更新履歴と重要な変更点',
        'IPC と開発連携の資料'
      ]
    },
    footer: 'Daily Routines Team. All rights reserved.'
  }
};

export const MODULE_CATEGORY_LABELS = {
  root: {
    1: '一般',
    2: '系统',
    3: '技能',
    4: '战斗',
    5: '界面优化',
    6: '界面操作',
    7: '金碟',
    8: '通知',
    9: '辅助',
    10: '脚本'
  },
  en: {
    1: 'General',
    2: 'System',
    3: 'Action',
    4: 'Combat',
    5: 'UI Optimization',
    6: 'UI Operation',
    7: 'Gold Saucer',
    8: 'Notification',
    9: 'Assist',
    10: 'Script'
  },
  ja: {
    1: '一般',
    2: 'システム',
    3: 'スキル',
    4: '戦闘',
    5: 'UI 最適化',
    6: 'UI 操作',
    7: 'ゴールドソーサー',
    8: '通知',
    9: 'アシスタント',
    10: 'スクリプト'
  }
} as const;

export const MODULE_PERMISSION_LABELS = {
  root: {
    CNPremium: '测试码 (国服)',
    GlobalPremium: '测试码 (国际服)',
    NeedAuth: '在线验证'
  },
  en: {
    CNPremium: 'Test Code (CN)',
    GlobalPremium: 'Test Code (Global)',
    NeedAuth: 'Online Auth'
  },
  ja: {
    CNPremium: 'テストコード (CN)',
    GlobalPremium: 'テストコード (グローバル)',
    NeedAuth: 'オンライン認証'
  }
} as const;
