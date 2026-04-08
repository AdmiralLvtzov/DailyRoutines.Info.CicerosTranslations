export type SiteLocale = 'root' | 'en' | 'ja' | 'ko';

type SiteCopy = {
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
    title: 'Daily Routines 信息中心',
    description: 'Daily Routines 官方文档、FAQ、更新日志与开发资料中心。',
    sections: {
      categories: '内容分区',
      latest: '最近更新'
    },
    labels: {
      articleCount: '篇文章',
      openCategory: '查看分区',
      noDescription: '暂无简介'
    }
  },
  en: {
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
  },
  ko: {
    title: 'Daily Routines 정보 센터',
    description: 'Daily Routines 공식 문서, FAQ, 업데이트 내역, 개발 자료를 모아 둔 사이트입니다.',
    sections: {
      categories: '분류',
      latest: '최근 업데이트'
    },
    labels: {
      articleCount: '개 문서',
      openCategory: '분류 열기',
      noDescription: '설명이 아직 없습니다'
    }
  }
};
