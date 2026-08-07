/**
 * Bilingual strings for the landing page (src/pages/Home.tsx).
 * Usage: `const s = useStrings(homeStrings)`.
 */
const homeStrings = {
  en: {
    heroEyebrow: 'A classroom negotiation game · Zhuhai',
    heroWords: ['UN', 'Summit:', 'Zhuhai'],
    heroSubtitle:
      'You are a country. Talk, trade, and make deals with your classmates. Complete your secret missions. Win the summit.',
    heroImgAlt: 'Students negotiating around a Model-UN roundtable',
    metaChips: ['15 countries', '2–2.5 hours', 'Talk in class, click in the app'],
    howToPlay: 'How to play',
    howToPlaySub: 'Four simple steps.',
    steps: [
      {
        title: 'Pick a country',
        body: 'Join the room and choose your country. Each country has different powers.',
      },
      {
        title: 'Say your public mission',
        body: 'At the start, tell the class your public mission. Keep your other missions secret!',
      },
      {
        title: 'Walk, talk, make deals',
        body: 'Negotiate with classmates in real life. Then send and accept deals in the app — 3 deal actions each round.',
      },
      {
        title: 'Score points, win the summit',
        body: 'Deals give 2–3 points. Missions give 10 points. The teacher ends the game and reveals the winner.',
      },
    ],
    rules: [
      '3 starting blocs — but you can change your bloc every round.',
      "4 spy countries can see everyone's power cards.",
      'Military 3 or less? You earn 3 points on every deal.',
      'No timers. Your teacher controls the rounds.',
    ],
    join: {
      title: 'Join your summit',
      subtitle: 'Get the 6-letter room code from your teacher.',
      codeLabel: 'Room code',
      codeLetter: (i: number) => `Room code letter ${i}`,
      nameLabel: 'Your name',
      namePlaceholder: 'Your name (e.g. Li Wei)',
      errorFallback: 'Room not found — check the code with your teacher.',
      joining: 'Joining…',
      submit: 'Join Room →',
    },
    create: {
      title: 'Start a new summit',
      subtitle:
        'Create a room for your class. You will get a room code and a secret admin PIN. Keep the PIN for yourself.',
      nameLabel: 'Your name',
      namePlaceholder: 'Your name (e.g. Ms. Chen)',
      creating: 'Creating…',
      submit: 'Create Room',
      error: 'Could not create the room — please try again.',
      codeLabel: 'Room code — share with students',
      pinLabel: 'Secret admin PIN — teachers only',
      pinWarning: 'Save this PIN — there is no recovery.',
      openAdmin: 'Open Admin Dashboard →',
      tapToCopy: 'Tap to copy',
      tapToReveal: 'Tap to reveal',
    },
    resume: {
      welcomeCountry: (flag: string, country: string, code: string) =>
        `Welcome back! You are ${flag} ${country} in room ${code}.`,
      welcomeNoCountry: (code: string) =>
        `Welcome back! You are in room ${code} — pick your country.`,
      welcomeTeacher: (code: string) => `Welcome back! You are the teacher of room ${code}.`,
      backDashboard: 'Back to my dashboard →',
      backLobby: 'Back to the lobby →',
      backAdmin: 'Back to the admin dashboard →',
      backSpectator: 'Back to the spectator dashboard →',
      startOver: 'Not you? Start over',
      endedTitle: 'Your last game has ended',
      endedBody:
        'This summit is over. You can look back at the final results, or start a brand-new game below.',
      viewResults: 'View final results',
      newGame: 'Start a new game',
    },
  },
  zh: {
    heroEyebrow: '课堂谈判游戏 · 珠海',
    heroWords: ['联合国峰会：珠海'],
    heroSubtitle: '你就是一个国家。和同学交谈、交易、签署协议。完成你的秘密任务，赢得峰会。',
    heroImgAlt: '学生们围坐在模拟联合国圆桌旁谈判',
    metaChips: ['15个国家', '2–2.5小时', '线下讨论，线上操作'],
    howToPlay: '怎么玩',
    howToPlaySub: '简单四步。',
    steps: [
      { title: '选择国家', body: '加入房间并选择你的国家。每个国家拥有不同的能力。' },
      { title: '宣布公开任务', body: '游戏开始时，向全班宣布你的公开任务。其他任务要保密！' },
      {
        title: '走动、交谈、签协议',
        body: '在现实中和同学谈判，然后在应用里发送和接受协议——每回合有3次协议行动。',
      },
      {
        title: '得分，赢得峰会',
        body: '协议得2–3分，任务得10分。由老师结束游戏并揭晓赢家。',
      },
    ],
    rules: [
      '3个起始联盟——但每回合你都可以更换联盟。',
      '4个间谍国家可以看到所有人的能力卡。',
      '军事评级3或更低？每份协议你都得3分。',
      '没有倒计时，回合由老师控制。',
    ],
    join: {
      title: '加入你的峰会',
      subtitle: '向老师获取6位字母房间代码。',
      codeLabel: '房间代码',
      codeLetter: (i: number) => `房间代码第${i}位`,
      nameLabel: '你的名字',
      namePlaceholder: '你的名字（例如：李伟）',
      errorFallback: '找不到房间——请和老师核对代码。',
      joining: '加入中…',
      submit: '加入房间 →',
    },
    create: {
      title: '开始新的峰会',
      subtitle: '为你的班级创建一个房间。你会得到一个房间代码和一个秘密管理员PIN。请自己保管好PIN。',
      nameLabel: '你的名字',
      namePlaceholder: '你的名字（例如：陈老师）',
      creating: '创建中…',
      submit: '创建房间',
      error: '无法创建房间——请重试。',
      codeLabel: '房间代码——分享给学生',
      pinLabel: '秘密管理员PIN——仅限老师',
      pinWarning: '请保存好这个PIN——丢失后无法找回。',
      openAdmin: '打开管理面板 →',
      tapToCopy: '点击复制',
      tapToReveal: '点击显示',
    },
    resume: {
      welcomeCountry: (flag: string, country: string, code: string) =>
        `欢迎回来！你在房间 ${code} 中是 ${flag} ${country}。`,
      welcomeNoCountry: (code: string) => `欢迎回来！你在房间 ${code} 中——请选择你的国家。`,
      welcomeTeacher: (code: string) => `欢迎回来！你是房间 ${code} 的老师。`,
      backDashboard: '返回我的面板 →',
      backLobby: '返回大厅 →',
      backAdmin: '返回管理面板 →',
      backSpectator: '返回观察面板 →',
      startOver: '不是你？重新开始',
      endedTitle: '你的上一局游戏已结束',
      endedBody: '这局峰会已经落幕。你可以回顾最终结果，或者在下方开始新的一局。',
      viewResults: '查看最终结果',
      newGame: '开始新的一局',
    },
  },
}

export default homeStrings
