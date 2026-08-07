/**
 * Admin dashboard bilingual strings (English / 简体中文).
 * Consumed via `useStrings(adminStrings)` — both branches have the same shape.
 */

const en = {
  pinGate: {
    title: 'Teacher sign-in',
    subtitle: 'This control room is for the teacher only.',
    roomCode: 'Room code',
    roomCodePlaceholder: 'KITE42',
    adminPin: 'Admin PIN',
    pinPlaceholder: '4–6 digits',
    errNoCode: 'Enter the room code.',
    errPinLength: 'The admin PIN is 4–6 characters.',
    openDashboard: 'Open dashboard',
    studentsNote: 'Students never see this page.',
    wrongPin: 'Wrong room code or admin PIN. Try again.',
  },
  header: {
    roomCodeCopied: 'Room code copied.',
    phase: {
      lobby: 'LOBBY',
      negotiation: 'NEGOTIATION',
      round_end: 'ROUND END',
      ended: 'ENDED',
    },
  },
  loading: {
    skeletonAria: 'Loading admin dashboard',
  },
  offline: 'Connection lost — retrying every few seconds. Controls are disabled until we’re back.',
  command: {
    aria: 'Command bar',
    roomCode: 'Room code',
    copyRoomCode: 'Copy room code',
    copied: 'Copied — paste it for students',
    projectThis: 'Project this for students',
    notStarted: 'Not started',
    round: (n: number) => `Round ${n}`,
    dealsSummary: (signed: number, pending: number) =>
      `${signed} deals signed · ${pending} offers pending`,
    projector: 'Projector',
    projectorTitle: 'Projector mode: enlarge all text',
    spectatorChip: 'Spectator view · read only',
    lock: 'Lock',
    lockTitle: 'Lock admin (returns to the PIN gate)',
    startRound1: 'Start Round 1',
    endRound: (n: number) => `End Round ${n}`,
    beginRound: (n: number) => `Begin Round ${n}`,
    endGame: 'End Game',
    startFirstHint: 'Start the game first',
    viewResults: 'View final results',
    toastStarted: 'Round 1 has begun!',
    toastRoundClosed: (n: number) =>
      `Round ${n} negotiation closed — bloc choice is open.`,
    toastRoundBegan: (n: number) => `Round ${n} has begun. Deal actions reset to 3.`,
    toastEnded: 'The summit has ended — results revealed!',
    toastRoomCode: (code: string) => `Room code: ${code}`,
    confirm: {
      cancel: 'Cancel',
      working: 'Working…',
      start: {
        title: 'Start Round 1?',
        body: 'The summit opens for every seated player.',
        effects: [
          'All players see their country dossier and missions.',
          'Deal actions open: 3 per country per round.',
          'Suggested pace: 4–6 rounds · 2–2.5 hours.',
        ],
        confirmLabel: 'Yes, start Round 1',
      },
      closeRound: {
        title: (n: number) => `Close negotiation for Round ${n}?`,
        body: 'Players stop negotiating and choose their blocs.',
        effects: [
          'Negotiation closes — no new offers.',
          'Players pick (or found) a bloc for next round.',
          'Last deal actions of the round can still be used.',
        ],
        confirmLabel: (n: number) => `Yes, close Round ${n}`,
      },
      nextRound: {
        title: (n: number) => `Begin Round ${n}?`,
        body: 'The next negotiation round starts for everyone.',
        effects: [
          "Players' bloc choices lock in.",
          'Mission statuses re-check automatically.',
          'Deal actions reset to 3 per country.',
        ],
        confirmLabel: (n: number) => `Yes, begin Round ${n}`,
      },
      endGame: {
        title: 'End the summit?',
        body: 'All scores, blocs, and missions will be revealed on every screen. This cannot be undone.',
        effects: [
          'Final mission results are graded.',
          'Every player sees the full scoreboard.',
          'No more deals or bloc changes.',
        ],
        confirmLabel: 'Yes, reveal the results',
      },
    },
  },
  pacing: {
    kicker: 'Suggested pace for 2–2.5 hours',
    title: 'Round pacing',
    roundTrack: 'Round track',
    roundState: (round: number, state: 'done' | 'current' | null) =>
      `Round ${round}${state === 'done' ? ' (done)' : state === 'current' ? ' (current)' : ''}`,
    plan: 'Plan:',
    planOption: (n: number) => `${n} rounds`,
    planAria: 'Planned number of rounds',
    suggestEnd: (round: number, time: string) =>
      `Suggestion: end Round ${round} around ${time}`,
    suggestPace: 'Suggested pace: 4–6 rounds · 2–2.5 hours.',
    history: {
      round: 'Round',
      dealsSigned: 'Deals signed',
      duration: 'Duration',
      endedAt: 'Ended at',
      inProgress: 'in progress',
    },
    duration: (ms: number) => {
      const minutes = Math.round(ms / 60000)
      if (minutes < 60) return `${minutes} min`
      const h = Math.floor(minutes / 60)
      return `${h} h ${minutes % 60} min`
    },
  },
  scores: {
    title: 'Live scores',
    subtitle: 'Students can’t see this — only their own score.',
    emptyTitle: 'No scores yet',
    emptyBody: 'Start Round 1 from the command bar when your class is ready — scores appear here live.',
    headers: {
      country: 'Country',
      bloc: 'Bloc',
      dealPts: 'Deal pts',
      missionPts: 'Mission pts',
      adjust: 'Adjust.',
      total: 'Total',
      dealActions: 'Deal actions',
      editScore: 'Edit score',
    },
    adjustAria: (country: string) => `Adjust ${country}'s score`,
  },
  adjust: {
    title: (country: string) => `Adjust ${country}'s score`,
    titleFallback: 'Adjust score',
    currentTotal: 'Current total:',
    adjustment: 'Adjustment',
    adjustmentAria: 'Adjustment points',
    reason: 'Reason',
    required: '(required)',
    reasonPlaceholder: 'e.g. great negotiation bonus / rule correction',
    reasonNote: 'Every adjustment lands in the activity log with this reason.',
    applying: 'Applying…',
    apply: (delta: number) =>
      `Apply adjustment${delta !== 0 ? ` (${delta >= 0 ? '+' : ''}${delta})` : ''}`,
    toastAdjusted: (country: string, delta: number) =>
      `${country}'s score adjusted by ${delta >= 0 ? '+' : ''}${delta}.`,
    toastGeneric: 'Score adjusted.',
  },
  missions: {
    title: 'Mission tracker',
    emptyTitle: 'Missions appear at game start',
    emptyBody: 'Start Round 1 from the command bar — every country’s mission statuses will show here.',
    legendAria: 'Status legend',
    slots: {
      public: 'Public',
      private: 'Private',
      bonus: 'Bonus',
    },
    slotMission: {
      public: 'Public mission',
      private: 'Private mission',
      bonus: 'Bonus mission',
    },
    countryHeader: 'Country',
    timing: {
      roundEnd: 'checks at round end',
      gameEnd: 'decided at game end',
    },
    overrideActive: 'Teacher override active',
    overrideActiveShort: 'Teacher override active',
    cellTitle: (country: string, slot: string) =>
      `${country} ${slot} mission — tap to review or override`,
    tapHint: 'Tap a cell to read the full mission or override the automatic check.',
    sheet: {
      title: (country: string, slot: string) => `${country} · ${slot} mission`,
      titleFallback: 'Mission',
      autoCheck: 'Automatic check:',
      notePlaceholder: 'Optional note (shown in the activity log)',
      markComplete: 'Mark complete (+10)',
      markFailed: 'Mark failed',
      footnote: 'Overrides win over the automatic check and are logged for audit.',
      toast: (country: string, slot: string, status: string) =>
        `${country}'s ${slot} mission marked ${status}.`,
    },
  },
  blocs: {
    title: 'Blocs',
    emptyTitle: 'Starting blocs',
    emptyBody: 'Countries begin in their three starting blocs. Alliance shifts appear here at each round end.',
    members: (n: number) => (n === 1 ? '1 member' : `${n} members`),
    biggest: 'Biggest bloc',
    startedIn: (bloc: string) => `Started in ${bloc}`,
    history: (rounds: number) =>
      `Bloc history (${rounds} ${rounds === 1 ? 'round' : 'rounds'})`,
    roundLine: (round: number, blocs: number, sizes: string) =>
      `Round ${round} → ${blocs} blocs · ${sizes}`,
  },
  deals: {
    title: 'Deals',
    emptyTitle: 'No deals yet',
    emptyBody: 'Once the game starts, every offer and signed treaty shows up here in real time.',
    tabPending: 'Pending',
    tabAll: 'All deals',
    noStuckTitle: 'No stuck offers',
    noStuckBody: 'Every offer has been answered. New offers appear here while they wait.',
    nudge: 'Only the players can accept or cancel — but you can remind them!',
    sentAgo: (ago: string, country: string) => `Sent ${ago} · waiting for ${country}`,
    filterCountry: 'Filter by country',
    allCountries: 'All countries',
    allTypes: 'All types',
    nothingMatches: 'Nothing matches',
    noMatchBody: 'No deals match these filters yet.',
    ago: (value: Date | string) => {
      const date = value instanceof Date ? value : new Date(value)
      const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
      if (seconds < 60) return 'just now'
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `${minutes} min ago`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours} h ago`
      return `${Math.floor(hours / 24)} d ago`
    },
  },
  seats: {
    title: 'Seats',
    claimed: (claimed: number, total: number) => `${claimed} of ${total} claimed`,
    releaseAll: 'Release all seats',
    headers: {
      country: 'Country',
      player: 'Player',
      release: 'Release seat',
    },
    open: '— open —',
    releaseAria: (country: string, player: string) => `Release ${country} (held by ${player})`,
    confirmRelease: {
      title: (country: string) => `Release ${country}?`,
      titleFallback: 'Release seat?',
      body: (player: string, country: string) =>
        `${player} loses the ${country} seat. The seat opens for another student.`,
      confirmLabel: 'Yes, release seat',
    },
    confirmReleaseAll: {
      title: 'Release all seats?',
      body: 'Every player loses their country seat. Use this to re-run the game with a new class.',
      effects: (claimed: number) => [
        `${claimed} seats will open.`,
        'Scores, deals and missions stay recorded.',
      ],
      confirmLabel: 'Yes, release all',
    },
    toastReleased: (country: string) => `${country}'s seat released.`,
    toastAlreadyOpen: (country: string) => `${country} was already open.`,
    toastAllReleased: 'All seats released — ready for a new class.',
  },
  assign: {
    title: 'Assign players',
    subtitle: 'Seat each student at a country — before the game or mid-game for late joiners.',
    seatedCount: (seated: number, total: number) => `${seated} of ${total} seated`,
    unassigned: 'Unassigned',
    selectAria: (player: string) => `Choose a country for ${player}`,
    placeholder: 'Assign a country…',
    holderSuffix: (player: string) => `now: ${player}`,
    releaseAria: (player: string) => `Remove ${player} from their seat`,
    empty: 'No students have joined yet — share the room code!',
    rosterSummary: (n: number) => `${n} countries in this summit`,
    assignButton: 'Assign',
    assignAria: (player: string) => `Assign ${player}`,
    assistantOption: '👁 Admin Assistant',
    assistantBadge: '👁 Admin Assistant',
    assistantMaxSuffix: '(max 4)',
    assistantsCount: (n: number) => `Assistants: ${n}/4`,
    toastAssigned: (player: string, country: string) => `${player} → ${country} ✓`,
    toastAssignedEvicted: (player: string, country: string, evicted: string) =>
      `${player} → ${country} ✓ (${evicted} was removed)`,
    toastAlready: (player: string, country: string) => `${player} is already seated as ${country}.`,
    toastAssignFailed: 'Could not assign that seat.',
    toastPromoted: (player: string) => `${player} is now an admin assistant 👁`,
    toastPromotedReleased: (player: string, country: string) =>
      `${player} is now an admin assistant 👁 (${country} seat released)`,
    toastDemotedAssigned: (player: string, country: string) =>
      `${player} is no longer an assistant — seated as ${country} ✓`,
    toastAssistantMax: 'This room already has 4 admin assistants — demote one first.',
    toastAssistantFailed: 'Could not update the assistant role.',
    toastReleased: (player: string) => `${player} removed from their seat ✓`,
    toastReleaseFailed: 'Could not remove the player from the seat.',
  },
  activity: {
    title: 'Activity log',
    subtitle: 'Every action is recorded — gold rows are your own overrides.',
    emptyTitle: 'Nothing yet',
    emptyBody: 'Claims, offers, signatures, round changes and score edits appear here.',
    showMore: (n: number) => `Show more (${n} older)`,
  },
  ended: {
    title: 'This summit has ended',
    body: 'The final scores were revealed. Start a new game to play again with a fresh room.',
    viewResults: 'View final results',
    newGame: 'Start a new game',
  },
  spectator: {
    forbiddenTitle: 'You are not an admin assistant',
    forbiddenBody:
      'Only students the teacher promoted to admin assistant can open this read-only dashboard.',
    backHome: 'Back to home',
  },
}

export type AdminStrings = typeof en

const zh: AdminStrings = {
  pinGate: {
    title: '老师登录',
    subtitle: '此控制室仅供老师使用。',
    roomCode: '房间代码',
    roomCodePlaceholder: 'KITE42',
    adminPin: '管理员 PIN',
    pinPlaceholder: '4–6 位数字',
    errNoCode: '请输入房间代码。',
    errPinLength: '管理员 PIN 为 4–6 位字符。',
    openDashboard: '打开控制台',
    studentsNote: '学生看不到此页面。',
    wrongPin: '房间代码或管理员 PIN 错误，请重试。',
  },
  header: {
    roomCodeCopied: '房间代码已复制。',
    phase: {
      lobby: '大厅',
      negotiation: '谈判中',
      round_end: '回合结束',
      ended: '已结束',
    },
  },
  loading: {
    skeletonAria: '正在加载管理控制台',
  },
  offline: '连接已断开——每隔几秒自动重试。恢复前控制按钮不可用。',
  command: {
    aria: '指挥栏',
    roomCode: '房间代码',
    copyRoomCode: '复制房间代码',
    copied: '已复制——发给学生',
    projectThis: '投影给学生看',
    notStarted: '尚未开始',
    round: (n) => `第 ${n} 回合`,
    dealsSummary: (signed, pending) => `已签 ${signed} 份协议 · ${pending} 份报价待定`,
    projector: '投影模式',
    projectorTitle: '投影模式：放大所有文字',
    spectatorChip: '观察模式 · 只读',
    lock: '锁定',
    lockTitle: '锁定管理台（返回 PIN 登录页）',
    startRound1: '开始第 1 回合',
    endRound: (n) => `结束第 ${n} 回合`,
    beginRound: (n) => `开始第 ${n} 回合`,
    endGame: '结束游戏',
    startFirstHint: '请先开始游戏',
    viewResults: '查看最终结果',
    toastStarted: '第 1 回合已开始！',
    toastRoundClosed: (n) => `第 ${n} 回合谈判已结束——联盟选择已开放。`,
    toastRoundBegan: (n) => `第 ${n} 回合已开始。协议行动重置为 3 次。`,
    toastEnded: '峰会已结束——结果揭晓！',
    toastRoomCode: (code) => `房间代码：${code}`,
    confirm: {
      cancel: '取消',
      working: '处理中…',
      start: {
        title: '开始第 1 回合？',
        body: '峰会将向所有已入座的学生开放。',
        effects: [
          '所有学生将看到自己的国家档案和任务。',
          '协议行动开放：每个国家每回合 3 次。',
          '建议节奏：4–6 回合 · 2–2.5 小时。',
        ],
        confirmLabel: '是的，开始第 1 回合',
      },
      closeRound: {
        title: (n) => `结束第 ${n} 回合的谈判？`,
        body: '学生停止谈判并开始选择联盟。',
        effects: [
          '谈判关闭——不能再发出新报价。',
          '学生为下一回合选择（或创建）联盟。',
          '本回合剩余的协议行动仍可使用。',
        ],
        confirmLabel: (n) => `是的，结束第 ${n} 回合`,
      },
      nextRound: {
        title: (n) => `开始第 ${n} 回合？`,
        body: '所有人进入下一轮谈判。',
        effects: [
          '学生的联盟选择将锁定。',
          '任务状态自动重新判定。',
          '协议行动重置为每个国家 3 次。',
        ],
        confirmLabel: (n) => `是的，开始第 ${n} 回合`,
      },
      endGame: {
        title: '结束本次峰会？',
        body: '所有得分、联盟和任务结果将在每个屏幕上揭晓。此操作无法撤销。',
        effects: ['最终任务结果将被评定。', '每位学生都会看到完整的排行榜。', '不能再签署协议或更换联盟。'],
        confirmLabel: '是的，揭晓结果',
      },
    },
  },
  pacing: {
    kicker: '2–2.5 小时的建议节奏',
    title: '回合节奏',
    roundTrack: '回合进度',
    roundState: (round, state) =>
      `第 ${round} 回合${state === 'done' ? '（已完成）' : state === 'current' ? '（进行中）' : ''}`,
    plan: '计划：',
    planOption: (n) => `${n} 回合`,
    planAria: '计划回合数',
    suggestEnd: (round, time) => `建议：第 ${round} 回合约在 ${time} 结束`,
    suggestPace: '建议节奏：4–6 回合 · 2–2.5 小时。',
    history: {
      round: '回合',
      dealsSigned: '已签协议',
      duration: '时长',
      endedAt: '结束时间',
      inProgress: '进行中',
    },
    duration: (ms) => {
      const minutes = Math.round(ms / 60000)
      if (minutes < 60) return `${minutes} 分钟`
      const h = Math.floor(minutes / 60)
      return `${h} 小时 ${minutes % 60} 分钟`
    },
  },
  scores: {
    title: '实时得分',
    subtitle: '学生看不到这里——只能看到自己的分数。',
    emptyTitle: '还没有得分',
    emptyBody: '班级准备好后，在指挥栏开始第 1 回合——得分会实时显示在这里。',
    headers: {
      country: '国家',
      bloc: '联盟',
      dealPts: '协议分',
      missionPts: '任务分',
      adjust: '调整',
      total: '总分',
      dealActions: '协议行动',
      editScore: '编辑得分',
    },
    adjustAria: (country) => `调整${country}的得分`,
  },
  adjust: {
    title: (country) => `调整${country}的得分`,
    titleFallback: '调整得分',
    currentTotal: '当前总分：',
    adjustment: '调整分值',
    adjustmentAria: '调整分值',
    reason: '原因',
    required: '（必填）',
    reasonPlaceholder: '例如：出色谈判奖励 / 规则修正',
    reasonNote: '每次调整都会连同此原因记入活动日志。',
    applying: '应用中…',
    apply: (delta) => `应用调整${delta !== 0 ? `（${delta >= 0 ? '+' : ''}${delta}）` : ''}`,
    toastAdjusted: (country, delta) =>
      `${country}的得分已调整 ${delta >= 0 ? '+' : ''}${delta}。`,
    toastGeneric: '得分已调整。',
  },
  missions: {
    title: '任务追踪',
    emptyTitle: '任务将在游戏开始时出现',
    emptyBody: '在指挥栏开始第 1 回合——每个国家的任务状态都会显示在这里。',
    legendAria: '状态图例',
    slots: {
      public: '公开',
      private: '秘密',
      bonus: '奖励',
    },
    slotMission: {
      public: '公开任务',
      private: '秘密任务',
      bonus: '奖励任务',
    },
    countryHeader: '国家',
    timing: {
      roundEnd: '回合结束时判定',
      gameEnd: '游戏结束时判定',
    },
    overrideActive: '老师改判生效中',
    overrideActiveShort: '老师改判生效中',
    cellTitle: (country, slot) => `${country}的${slot}任务——点按查看或改判`,
    tapHint: '点按格子可查看完整任务内容或改判自动判定结果。',
    sheet: {
      title: (country, slot) => `${country} · ${slot}任务`,
      titleFallback: '任务',
      autoCheck: '自动判定：',
      notePlaceholder: '可选备注（会显示在活动日志中）',
      markComplete: '标记完成（+10）',
      markFailed: '标记失败',
      footnote: '改判优先于自动判定，并会记入日志以备查。',
      toast: (country, slot, status) => `${country}的${slot}任务已标记为${status}。`,
    },
  },
  blocs: {
    title: '联盟',
    emptyTitle: '初始联盟',
    emptyBody: '各国从三个初始联盟开始。每回合结束时，联盟变化会显示在这里。',
    members: (n) => `${n} 个成员`,
    biggest: '最大联盟',
    startedIn: (bloc) => `起初属于${bloc}`,
    history: (rounds) => `联盟历史（${rounds} 个回合）`,
    roundLine: (round, blocs, sizes) => `第 ${round} 回合 → ${blocs} 个联盟 · ${sizes}`,
  },
  deals: {
    title: '协议',
    emptyTitle: '还没有协议',
    emptyBody: '游戏开始后，每一份报价和签署的条约都会实时显示在这里。',
    tabPending: '待定',
    tabAll: '全部协议',
    noStuckTitle: '没有卡住的报价',
    noStuckBody: '所有报价都已得到回应。新报价在等待回应时会显示在这里。',
    nudge: '只有学生才能接受或取消——但你可以提醒他们！',
    sentAgo: (ago, country) => `发送于${ago} · 等待${country}回应`,
    filterCountry: '按国家筛选',
    allCountries: '所有国家',
    allTypes: '所有类型',
    nothingMatches: '没有匹配结果',
    noMatchBody: '还没有符合这些筛选条件的协议。',
    ago: (value) => {
      const date = value instanceof Date ? value : new Date(value)
      const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
      if (seconds < 60) return '刚刚'
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `${minutes} 分钟前`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours} 小时前`
      return `${Math.floor(hours / 24)} 天前`
    },
  },
  seats: {
    title: '席位',
    claimed: (claimed, total) => `已入座 ${claimed} / ${total}`,
    releaseAll: '释放全部席位',
    headers: {
      country: '国家',
      player: '学生',
      release: '释放席位',
    },
    open: '— 空缺 —',
    releaseAria: (country, player) => `释放${country}的席位（当前为 ${player}）`,
    confirmRelease: {
      title: (country) => `释放${country}的席位？`,
      titleFallback: '释放席位？',
      body: (player, country) => `${player} 将失去${country}的席位。该席位将开放给其他学生。`,
      confirmLabel: '是的，释放席位',
    },
    confirmReleaseAll: {
      title: '释放全部席位？',
      body: '所有学生都将失去自己的国家席位。用于换一个新班级重新进行游戏。',
      effects: (claimed) => [`将开放 ${claimed} 个席位。`, '得分、协议和任务记录会保留。'],
      confirmLabel: '是的，全部释放',
    },
    toastReleased: (country) => `${country}的席位已释放。`,
    toastAlreadyOpen: (country) => `${country}的席位本来就是空缺的。`,
    toastAllReleased: '全部席位已释放——可以迎接新班级了。',
  },
  assign: {
    title: '分配席位',
    subtitle: '把每位学生分配到一个国家——游戏开始前可以分配，游戏进行中也可以为迟到的学生分配。',
    seatedCount: (seated, total) => `已入座 ${seated} / ${total}`,
    unassigned: '未分配',
    selectAria: (player) => `为 ${player} 选择国家`,
    placeholder: '分配国家…',
    holderSuffix: (player) => `当前：${player}`,
    releaseAria: (player) => `把 ${player} 移出座位`,
    empty: '还没有学生加入——把房间代码分享给他们吧！',
    rosterSummary: (n) => `本次峰会共有 ${n} 个国家`,
    assignButton: '分配',
    assignAria: (player) => `分配 ${player}`,
    assistantOption: '👁 助教（观察）',
    assistantBadge: '👁 助教（观察员）',
    assistantMaxSuffix: '（最多 4 人）',
    assistantsCount: (n) => `助教：${n}/4`,
    toastAssigned: (player, country) => `${player} → ${country} ✓`,
    toastAssignedEvicted: (player, country, evicted) =>
      `${player} → ${country} ✓（${evicted} 已被移出）`,
    toastAlready: (player, country) => `${player} 已经代表${country}。`,
    toastAssignFailed: '无法分配该席位。',
    toastPromoted: (player) => `${player} 已成为助教 👁`,
    toastPromotedReleased: (player, country) => `${player} 已成为助教 👁（已释放${country}的席位）`,
    toastDemotedAssigned: (player, country) => `${player} 已不再是助教——已入座${country} ✓`,
    toastAssistantMax: '该房间已有 4 名助教——请先取消一名。',
    toastAssistantFailed: '无法更新助教身份。',
    toastReleased: (player) => `已将 ${player} 移出座位 ✓`,
    toastReleaseFailed: '无法将该学生移出座位。',
  },
  activity: {
    title: '活动日志',
    subtitle: '每个操作都有记录——金色行是你自己的改判。',
    emptyTitle: '暂无记录',
    emptyBody: '入座、报价、签署、回合变化和得分修改都会显示在这里。',
    showMore: (n) => `显示更多（还有 ${n} 条更早的记录）`,
  },
  ended: {
    title: '本次峰会已结束',
    body: '最终得分已经揭晓。开始新游戏可在全新的房间里再玩一次。',
    viewResults: '查看最终结果',
    newGame: '开始新游戏',
  },
  spectator: {
    forbiddenTitle: '你不是助教',
    forbiddenBody: '只有被老师设置为助教的学生才能打开这个只读观察面板。',
    backHome: '返回首页',
  },
}

export const adminStrings = { en, zh }
