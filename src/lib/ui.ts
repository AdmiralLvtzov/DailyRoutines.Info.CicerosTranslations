export type SiteLocale = 'root' | 'en' | 'ja' | 'ko';

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
  },
  ko: {
    lang: 'ko-KR',
    title: 'Daily Routines 정보 센터',
    description: 'Daily Routines 공식 문서, FAQ, 업데이트 내역, 개발 자료를 모아 둔 사이트입니다.',
    nav: {
      home: '홈',
      docs: '문서',
      github: 'GitHub',
      discord: 'Discord',
      theme: '라이트 테마와 다크 테마 전환'
    },
    hero: {
      eyebrow: 'Daily Routines',
      title: 'Daily Routines 공식 문서 및 정보 센터',
      description: 'FAQ, 업데이트 내역, 개발 자료를 한곳에 모아 설치 방법, 사용 가이드, 중요한 변경 사항을 빠르게 찾을 수 있습니다.',
      primary: '문서 보기',
      secondary: '업데이트 내역 보기'
    },
    stats: {
      categories: '분류',
      articles: '문서 수',
      updated: '최근 업데이트'
    },
    sections: {
      categories: '분류',
      latest: '최근 업데이트'
    },
    labels: {
      articleCount: '개 문서',
      openCategory: '분류 열기',
      latestUpdated: '최근 업데이트',
      noDescription: '설명이 아직 없습니다'
    },
    heroPanel: {
      title: '이곳에서 확인할 수 있는 내용',
      items: [
        '자주 묻는 질문과 문제 해결 가이드',
        '버전 업데이트 기록과 중요한 변경 사항',
        'IPC 및 개발 연동 자료'
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
  },
  ko: {
    1: '일반',
    2: '시스템',
    3: '기술',
    4: '전투',
    5: 'UI 최적화',
    6: 'UI 조작',
    7: '골드 소서',
    8: '알림',
    9: '보조',
    10: '스크립트'
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
  },
  ko: {
    CNPremium: '테스트 코드 (CN)',
    GlobalPremium: '테스트 코드 (글로벌)',
    NeedAuth: '온라인 인증'
  }
} as const;
