/**
 * Player-dashboard (Play page) bilingual strings.
 * Usage: `const s = useStrings(playStrings)` — both branches have the
 * identical shape; parameterized strings are functions.
 */

export const playStrings = {
  en: {
    // ── Round status bar ────────────────────────────────────────────────
    roundLabel: (round: number) => `ROUND ${round}`,
    phaseNegotiation: 'Negotiation',
    phaseRoundEnd: 'Round end — choose your bloc',
    myScore: 'My score',
    scoreBreakdown: 'My score breakdown',
    scoreDeals: 'Deals',
    scoreMissions: 'Missions',
    scoreTotal: 'Total',
    scoreNote: 'Teacher score adjustments are added at the end of the game.',
    shoutPublicMission: 'Stand up and tell the class your public mission!',
    actionsLeft: (left: number, total: number) =>
      `Deal actions left: ${left}/${total}`,

    // ── Deal actions card ───────────────────────────────────────────────
    dealActionsTitle: (round: number) => `Deal actions · Round ${round}`,
    actionsExhausted: (max: number) =>
      `You used all ${max} actions this round. Watch the feed and plan your next moves!`,
    actionCostHint: 'Sending, accepting, and cancelling each use 1 action.',
    incomingOffers: 'Incoming offers',
    noOffersYet: 'No offers yet',
    noOffersBody: 'Walk over to a classmate and ask for a deal!',
    offersYou: (country: string, dealType: string, power: string) =>
      `${country} offers you a ${dealType} deal (${power})`,
    accept: 'Accept',
    signing: 'Signing…',
    reject: 'Reject',
    sendDealOffer: 'Send a Deal Offer',
    noActionsLeft: 'No actions left this round',
    mySentOffers: 'My sent offers',
    noSentOffers:
      'No outgoing offers right now — your pending offers will appear here.',
    waitingForAnswer: 'waiting for an answer',
    cancel: 'Cancel',
    confirmCancel: 'Sure? Tap again',

    // ── Send-offer sheet (3 steps) ──────────────────────────────────────
    sheetTitle: 'Send a Deal Offer',
    stepTitles: [
      'What do you offer?',
      'To which country?',
      'Add a note? (optional)',
    ] as [string, string, string],
    stepOf: (step: number) => `Step ${step} of 3`,
    assetLabels: {
      military: 'Military',
      resources: 'Resources',
      energy: 'Energy',
      tech: 'Science & Tech',
    },
    thisIsDealPre: 'This is a ',
    thisIsDealPost: ' deal',
    searchCountries: 'Search countries…',
    noCountriesMatch: 'No countries match your search.',
    ptsHintBlocMember: '3 points — bloc member',
    ptsHintFreeTrader: '3 points — you are a Free Trader',
    ptsHintOutsideBloc: '2 points — outside bloc',
    ptsChip: (pts: number) => `${pts} pts`,
    notePlaceholder: 'e.g. in exchange for your support in the vote',
    noteHint: "Notes are friendly words only — they don't change the score.",
    reviewTreaty: 'Review your treaty',
    sendOffer: 'Send Offer',
    sending: 'Sending…',
    back: 'Back',
    next: 'Next',

    // ── Country dossier ─────────────────────────────────────────────────
    countryDossier: 'Country dossier',
    espionageBadge: 'Espionage',
    espionageDesc:
      "You can see every country's power cards, and peek at one private mission.",
    freeTraderBadge: 'Free Trader · 3 pts everywhere',
    freeTraderDesc:
      'Your military is 3 or less: every deal earns you 3 points.',

    // ── Mission cards ───────────────────────────────────────────────────
    myMissionsEyebrow: 'My missions · 10 pts each',
    myMissionsTitle: 'My Missions',
    sayItOutLoud: 'Say it out loud in class!',
    checkedAtRoundEnd: 'Checked at the end of each round',
    missionEyebrows: {
      public: 'PUBLIC MISSION · VISIBLE TO ALL',
      private: 'PRIVATE MISSION · ONLY YOU',
      bonus: 'BONUS MISSION · ONLY YOU',
    },

    // ── Espionage panel ─────────────────────────────────────────────────
    espionageClassified: 'Espionage · Classified',
    spyDossiers: 'Spy Dossiers',
    privateMissionPeek: 'Private Mission Peek',
    peekUsed: 'Peek used — locked permanently.',
    topSecret: 'Top Secret',
    privateMissionOf: (country: string) => `${country} · Private mission`,
    onlyYouSee: 'Only you can see this.',
    peekInstructions:
      'Choose 1 country to reveal its private mission. You can only do this once.',
    chooseSpyTarget: 'Choose a country to spy on',
    confirmPeek: (country: string) =>
      `You can only do this ONCE. Reveal ${country}'s private mission?`,
    revealing: 'Revealing…',
    yesReveal: 'Yes, reveal it',
    goBack: 'Go back',
    reveal: 'Reveal',

    // ── Bloc choice card ────────────────────────────────────────────────
    blocChoiceTitle: 'Round is ending — choose your bloc!',
    blocChoiceBody:
      'Stay in your bloc, join another bloc, or found a new one. Blocs decide how many points your deals earn (3 inside, 2 outside).',
    blocOptions: 'Bloc options',
    memberCount: (n: number) => `${n} ${n === 1 ? 'member' : 'members'}`,
    blocEmpty: 'Empty',
    yourCurrentBloc: 'your current bloc',
    foundNewBloc: 'Found a new bloc',
    newBlocPlaceholder: 'e.g. Pacific Alliance',
    newBlocAria: 'New bloc name',
    charCount: (n: number) => `${n}/24 characters`,
    lockingIn: 'Locking in…',
    changeMyChoice: 'Change my choice',
    lockInBloc: 'Lock in my bloc',

    // ── Feed tabs + news ticker ─────────────────────────────────────────
    summitFeed: 'Summit Feed',
    publicMissions: 'Public Missions',
    noNewsYet: 'No news yet',
    noNewsBody: 'Signed deals will be announced here for the whole summit.',
    you: 'You',
    summitNews: 'Summit News',
    summitNewsAria: 'Summit news',

    // ── Deal ticket ─────────────────────────────────────────────────────
    dealHeader: (dealType: string) => `${dealType} Deal`,
    ptsEach: (pts: number) => `+${pts} pts each`,
    stampSigned: 'Signed',
    stampPending: 'Pending',
    stampCancelled: 'Cancelled',

    // ── Sticky bottom bar ───────────────────────────────────────────────
    chooseMyBloc: 'Choose my bloc',

    // ── Signed deals section ────────────────────────────────────────────
    mySignedDealsEyebrow: 'My signed deals',
    myDealsTitle: 'My Deals',
    noSignedDeals: 'No signed deals yet',
    noSignedDealsBody: 'Your signed treaties will appear here.',

    // ── Page-level states ───────────────────────────────────────────────
    cannotReach: 'Cannot reach the summit',
    connectionLostBody: 'Connection lost — check your internet and try again.',
    tryAgain: 'Try again',
    backToJoin: 'Back to join',
    noCountrySeat: 'No country seat',
    noCountryBody:
      'You have not claimed a country. Ask your teacher, or go back to the lobby to pick a seat.',
    goToLobby: 'Go to lobby',
    connectionLostRetrying: 'Connection lost — retrying…',

    // ── Toasts ──────────────────────────────────────────────────────────
    toastRoundBegan: (round: number) =>
      `Round ${round} has begun — 3 new deal actions!`,
    toastMissionComplete: 'Mission complete! +10 points',
    toastNewOffer: (country: string) => `New offer from ${country}!`,
    toastDealSigned: (country: string, pts: number) =>
      `Deal signed with ${country} ✓ +${pts} pts`,
    toastOfferRejected: 'Offer rejected',
    toastOfferCancelled: 'Offer cancelled',
    toastOfferSent: (country: string) => `Offer sent to ${country} ✓`,
    toastBlocChosen: (bloc: string) => `You are now in ${bloc} ✓`,
    toastPeekRevealed: (country: string) =>
      `${country}'s private mission revealed`,
    toastRoomCodeCopied: 'Room code copied ✓',
    toastError: (message: string) => `Something went wrong — ${message}`,
    partnerFallback: 'partner',

    // ── Mission progress (helpers.ts) ───────────────────────────────────
    progressOf: (done: number, total: number, unit: string) =>
      `${done} of ${total} ${unit}`,
    progressUnits: {
      deal: 'deal',
      deals: 'deals',
      powers: 'powers',
      parts: 'parts',
      'deal types': 'deal types',
      blocs: 'blocs',
    } as Record<string, string>,
    usePeekToReveal: 'Use your Espionage peek to reveal the target country',
    signDealWith: (
      flag: string,
      country: string,
      done: number,
      total: number,
    ) => `Sign any deal with ${flag} ${country} (${done} of ${total})`,
  },

  zh: {
    // ── Round status bar ────────────────────────────────────────────────
    roundLabel: (round: number) => `第 ${round} 回合`,
    phaseNegotiation: '谈判阶段',
    phaseRoundEnd: '回合结束——选择你的联盟',
    myScore: '我的得分',
    scoreBreakdown: '我的得分明细',
    scoreDeals: '协议',
    scoreMissions: '任务',
    scoreTotal: '总计',
    scoreNote: '老师的分数调整会在游戏结束时计入总分。',
    shoutPublicMission: '站起来，向全班宣布你的公开任务！',
    actionsLeft: (left: number, total: number) =>
      `剩余协议行动：${left}/${total}`,

    // ── Deal actions card ───────────────────────────────────────────────
    dealActionsTitle: (round: number) => `协议行动 · 第 ${round} 回合`,
    actionsExhausted: (max: number) =>
      `本回合的 ${max} 个行动已用完。关注峰会动态，规划你的下一步吧！`,
    actionCostHint: '发送、接受和取消报价各消耗 1 个行动。',
    incomingOffers: '收到的报价',
    noOffersYet: '暂无报价',
    noOffersBody: '走到同学身边，主动谈一份协议吧！',
    offersYou: (country: string, dealType: string, power: string) =>
      `${country}向你发出了一份${dealType}协议报价（${power}）`,
    accept: '接受',
    signing: '签署中…',
    reject: '拒绝',
    sendDealOffer: '发出协议报价',
    noActionsLeft: '本回合行动已用完',
    mySentOffers: '我发出的报价',
    noSentOffers: '当前没有待答复的报价——你发出的报价会显示在这里。',
    waitingForAnswer: '等待对方答复',
    cancel: '取消',
    confirmCancel: '确定？再点一次',

    // ── Send-offer sheet (3 steps) ──────────────────────────────────────
    sheetTitle: '发出协议报价',
    stepTitles: [
      '你提供什么？',
      '给哪个国家？',
      '要加附言吗？（可选）',
    ] as [string, string, string],
    stepOf: (step: number) => `第 ${step} 步，共 3 步`,
    assetLabels: {
      military: '军事',
      resources: '资源',
      energy: '能源',
      tech: '科技',
    },
    thisIsDealPre: '这是一份',
    thisIsDealPost: '协议',
    searchCountries: '搜索国家…',
    noCountriesMatch: '没有匹配的国家。',
    ptsHintBlocMember: '3 分——同联盟成员',
    ptsHintFreeTrader: '3 分——你是自由贸易者',
    ptsHintOutsideBloc: '2 分——联盟外国家',
    ptsChip: (pts: number) => `${pts} 分`,
    notePlaceholder: '例如：换取你在投票中的支持',
    noteHint: '附言只是友好的话——不会影响得分。',
    reviewTreaty: '检查你的条约',
    sendOffer: '发送报价',
    sending: '发送中…',
    back: '返回',
    next: '下一步',

    // ── Country dossier ─────────────────────────────────────────────────
    countryDossier: '国家档案',
    espionageBadge: '情报侦察',
    espionageDesc: '你可以查看每个国家的力量卡，并偷看一个国家的秘密任务。',
    freeTraderBadge: '自由贸易者 · 处处 3 分',
    freeTraderDesc: '你的军事评级为 3 或更低：每份协议都能为你赢得 3 分。',

    // ── Mission cards ───────────────────────────────────────────────────
    myMissionsEyebrow: '我的任务 · 每项 10 分',
    myMissionsTitle: '我的任务',
    sayItOutLoud: '在全班面前大声说出来！',
    checkedAtRoundEnd: '每回合结束时检查',
    missionEyebrows: {
      public: '公开任务 · 所有人可见',
      private: '秘密任务 · 仅你可见',
      bonus: '奖励任务 · 仅你可见',
    },

    // ── Espionage panel ─────────────────────────────────────────────────
    espionageClassified: '情报侦察 · 机密',
    spyDossiers: '间谍档案',
    privateMissionPeek: '偷看秘密任务',
    peekUsed: '已使用——永久锁定。',
    topSecret: '绝密',
    privateMissionOf: (country: string) => `${country} · 秘密任务`,
    onlyYouSee: '只有你能看到这条内容。',
    peekInstructions: '选择 1 个国家查看其秘密任务。此操作只能使用一次。',
    chooseSpyTarget: '选择一个国家进行侦察',
    confirmPeek: (country: string) =>
      `此操作只能使用一次。要查看${country}的秘密任务吗？`,
    revealing: '正在查看…',
    yesReveal: '是的，查看',
    goBack: '返回',
    reveal: '查看',

    // ── Bloc choice card ────────────────────────────────────────────────
    blocChoiceTitle: '回合即将结束——选择你的联盟！',
    blocChoiceBody:
      '留在当前联盟、加入其他联盟，或创建一个新联盟。联盟决定你的协议得分（联盟内 3 分，联盟外 2 分）。',
    blocOptions: '联盟选项',
    memberCount: (n: number) => `${n} 个成员`,
    blocEmpty: '空',
    yourCurrentBloc: '你当前的联盟',
    foundNewBloc: '创建新联盟',
    newBlocPlaceholder: '例如：太平洋联盟',
    newBlocAria: '新联盟名称',
    charCount: (n: number) => `${n}/24 个字符`,
    lockingIn: '锁定中…',
    changeMyChoice: '更改我的选择',
    lockInBloc: '锁定我的联盟',

    // ── Feed tabs + news ticker ─────────────────────────────────────────
    summitFeed: '峰会动态',
    publicMissions: '公开任务',
    noNewsYet: '暂无新闻',
    noNewsBody: '签署的协议将在这里向整个峰会公布。',
    you: '你',
    summitNews: '峰会新闻',
    summitNewsAria: '峰会新闻',

    // ── Deal ticket ─────────────────────────────────────────────────────
    dealHeader: (dealType: string) => `${dealType}协议`,
    ptsEach: (pts: number) => `双方各 +${pts} 分`,
    stampSigned: '已签署',
    stampPending: '待签署',
    stampCancelled: '已取消',

    // ── Sticky bottom bar ───────────────────────────────────────────────
    chooseMyBloc: '选择我的联盟',

    // ── Signed deals section ────────────────────────────────────────────
    mySignedDealsEyebrow: '我已签署的协议',
    myDealsTitle: '我的协议',
    noSignedDeals: '还没有已签署的协议',
    noSignedDealsBody: '你签署的条约会显示在这里。',

    // ── Page-level states ───────────────────────────────────────────────
    cannotReach: '无法连接峰会',
    connectionLostBody: '连接中断——请检查网络后重试。',
    tryAgain: '重试',
    backToJoin: '返回加入页',
    noCountrySeat: '没有国家席位',
    noCountryBody: '你还没有选择国家。请问老师，或返回大厅选择席位。',
    goToLobby: '前往大厅',
    connectionLostRetrying: '连接中断——正在重试…',

    // ── Toasts ──────────────────────────────────────────────────────────
    toastRoundBegan: (round: number) =>
      `第 ${round} 回合开始——获得 3 个新的协议行动！`,
    toastMissionComplete: '任务完成！+10 分',
    toastNewOffer: (country: string) => `收到来自${country}的新报价！`,
    toastDealSigned: (country: string, pts: number) =>
      `已与${country}签署协议 ✓ +${pts} 分`,
    toastOfferRejected: '已拒绝报价',
    toastOfferCancelled: '已取消报价',
    toastOfferSent: (country: string) => `报价已发送给${country} ✓`,
    toastBlocChosen: (bloc: string) => `你已加入${bloc} ✓`,
    toastPeekRevealed: (country: string) => `已查看${country}的秘密任务`,
    toastRoomCodeCopied: '房间代码已复制 ✓',
    toastError: (message: string) => `出错了——${message}`,
    partnerFallback: '对方',

    // ── Mission progress (helpers.ts) ───────────────────────────────────
    progressOf: (done: number, total: number, unit: string) =>
      `已完成 ${done}/${total} ${unit}`,
    progressUnits: {
      deal: '个协议',
      deals: '个协议',
      powers: '种能力',
      parts: '个部分',
      'deal types': '种协议类型',
      blocs: '个联盟',
    } as Record<string, string>,
    usePeekToReveal: '使用你的情报侦察来查看目标国家',
    signDealWith: (
      flag: string,
      country: string,
      done: number,
      total: number,
    ) => `与 ${flag} ${country} 签署任意协议（${done}/${total}）`,
  },
}

export type PlayStrings = (typeof playStrings)['en']
