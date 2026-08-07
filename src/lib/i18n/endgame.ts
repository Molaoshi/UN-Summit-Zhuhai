/**
 * End-game reveal bilingual strings (English / 简体中文).
 * Consumed via `useStrings(endgameStrings)` — both branches have the same shape.
 */

const en = {
  waiting: {
    title: 'The summit is still negotiating',
    body: 'Waiting for the teacher to end the game — the final results will appear here automatically.',
  },
  unavailable: {
    title: 'Results unavailable',
  },
  opening: {
    /** Reveal headline, animated word-by-word. */
    titleWords: ['The', 'Summit', 'Has', 'Ended'],
    subtitle: (countries: number, rounds: number, deals: number) =>
      `${countries} countries · ${rounds} round${rounds === 1 ? '' : 's'} · ${deals} deal${deals === 1 ? '' : 's'} signed — here are the results.`,
  },
  blocs: {
    kicker: (rounds: number) => `Final blocs · Round ${rounds}`,
    title: 'Where the alliances ended',
    foundedBy: 'Founded by a delegate',
    biggest: (size: number) => `Biggest bloc — ${size} members`,
    shift: {
      startedAs: (name: string) => `Started as: ${name}`,
      gained: (flags: string) => `Gained: ${flags}`,
      lost: (flags: string) => `Lost: ${flags}`,
      founded: 'Founded during the summit',
      members: (flags: string) => `Members: ${flags}`,
    },
  },
  scoreboard: {
    kicker: 'Official results',
    title: 'Final Scoreboard',
    pts: 'pts',
    champion: 'Summit Champion',
    details: 'Details',
    you: 'You',
    rank: 'Rank',
    headers: {
      country: 'Country',
      bloc: 'Bloc',
      deals: 'Deals',
      missions: 'Missions',
      adjust: 'Adjust',
      total: 'Total',
    },
    slots: {
      public: 'Public mission',
      private: 'Private mission',
      bonus: 'Bonus mission',
    },
    teacherOverride: 'teacher override',
    completed: 'Completed +10',
    failed: 'Failed +0',
    rankAria: (place: number) => `Rank ${place}`,
    dealSummary: {
      none: 'No deals signed.',
      summary: (total: number, inBloc: number, cross: number) =>
        [
          `${total} deal${total === 1 ? '' : 's'} signed`,
          inBloc > 0 ? `${inBloc} in-bloc (+3 each)` : null,
          cross > 0 ? `${cross} cross-bloc (+2 each)` : null,
        ]
          .filter(Boolean)
          .join(' — '),
    },
    adjustments: (pts: number) => `Teacher adjustments: ${pts > 0 ? `+${pts}` : pts} pts`,
  },
  honorRoll: {
    title: 'Mission honor roll',
    slots: {
      public: 'Public missions',
      private: 'Private missions',
      bonus: 'Bonus missions',
    },
    completed: (done: number, total: number) => `completed: ${done}/${total}`,
    none: 'No country completed this one.',
  },
  closing: {
    backToTop: 'Back to top',
    replay: 'Replay reveal',
    print: 'Print results',
    newGame: 'Start a new game',
    thanks: 'Thanks for negotiating · UN Summit: Zhuhai',
  },
  toast: {
    arrived: 'The summit has ended — check your results!',
  },
}

export type EndgameStrings = typeof en

const zh: EndgameStrings = {
  waiting: {
    title: '峰会仍在谈判中',
    body: '等待老师结束游戏——最终结果会自动显示在这里。',
  },
  unavailable: {
    title: '暂时无法查看结果',
  },
  opening: {
    titleWords: ['峰会', '已', '结束'],
    subtitle: (countries, rounds, deals) =>
      `${countries} 个国家 · ${rounds} 个回合 · 已签署 ${deals} 份协议——结果如下。`,
  },
  blocs: {
    kicker: (rounds) => `最终联盟 · 第 ${rounds} 回合`,
    title: '联盟的最终格局',
    foundedBy: '由代表创建',
    biggest: (size) => `最大联盟——${size} 个成员`,
    shift: {
      startedAs: (name) => `初始联盟：${name}`,
      gained: (flags) => `新加入：${flags}`,
      lost: (flags) => `离开：${flags}`,
      founded: '在峰会期间创建',
      members: (flags) => `成员：${flags}`,
    },
  },
  scoreboard: {
    kicker: '官方结果',
    title: '最终排行榜',
    pts: '分',
    champion: '峰会冠军',
    details: '详情',
    you: '你',
    rank: '名次',
    headers: {
      country: '国家',
      bloc: '联盟',
      deals: '协议',
      missions: '任务',
      adjust: '调整',
      total: '总分',
    },
    slots: {
      public: '公开任务',
      private: '秘密任务',
      bonus: '奖励任务',
    },
    teacherOverride: '老师改判',
    completed: '已完成 +10',
    failed: '未完成 +0',
    rankAria: (place) => `第 ${place} 名`,
    dealSummary: {
      none: '没有签署任何协议。',
      summary: (total, inBloc, cross) =>
        [
          `已签署 ${total} 份协议`,
          inBloc > 0 ? `其中 ${inBloc} 份联盟内协议（各 +3）` : null,
          cross > 0 ? `${cross} 份跨联盟协议（各 +2）` : null,
        ]
          .filter(Boolean)
          .join(' — '),
    },
    adjustments: (pts) => `老师调整：${pts > 0 ? `+${pts}` : pts} 分`,
  },
  honorRoll: {
    title: '任务荣誉榜',
    slots: {
      public: '公开任务',
      private: '秘密任务',
      bonus: '奖励任务',
    },
    completed: (done, total) => `完成：${done}/${total}`,
    none: '没有国家完成这项任务。',
  },
  closing: {
    backToTop: '回到顶部',
    replay: '重新播放揭晓',
    print: '打印结果',
    newGame: '开始新游戏',
    thanks: '感谢参与谈判 · 联合国峰会：珠海',
  },
  toast: {
    arrived: '峰会已结束——快来看看你的结果！',
  },
}

export const endgameStrings = { en, zh }
