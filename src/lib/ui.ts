export type SiteLocale = 'root' | 'en' | 'ja';

type SiteCopy = {
  lang: string;
  title: string;
  description: string;
  sections: {
    categories: string;
    latest: string;
  };
  labels: {
    articleCount: string;
    openCategory: string;
    noDescription: string;
  };
};

export const SITE_COPY: Record<SiteLocale, SiteCopy> = {
  root: {
    lang: 'zh-CN',
    title: 'Daily Routines 信息中心',
    description: 'Daily Routines 官方文档、FAQ、更新日志与开发资料中心。',
    sections: {
      categories: '内容分区',
      latest: '最近更新'
    },
    labels: {
      articleCount: '篇文章',
      openCategory: '进入分区',
      noDescription: '暂无简介'
    }
  },
  en: {
    lang: 'en',
    title: 'Daily Routines Info Center',
    description: 'Official Daily Routines docs hub for FAQs, changelogs, and developer references.',
    sections: {
      categories: 'Sections',
      latest: 'Latest Updates'
    },
    labels: {
      articleCount: 'articles',
      openCategory: 'Open section',
      noDescription: 'No description yet'
    }
  },
  ja: {
    lang: 'ja-JP',
    title: 'Daily Routines インフォメーションセンター',
    description: 'Daily Routines の FAQ、更新履歴、開発資料をまとめた公式サイトです。',
    sections: {
      categories: 'カテゴリ',
      latest: '最近の更新'
    },
    labels: {
      articleCount: '記事',
      openCategory: 'カテゴリを開く',
      noDescription: '説明はまだありません'
    }
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
