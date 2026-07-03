export type UserTheme = 'morty' | 'enclave' | 'warlock';

export interface User {
  username: string;
  displayName: string;
  theme: UserTheme;
}

export interface ThemeCopy {
  appName: string;
  greeting: string;
  loginTitle: string;
  loginSubtitle: string;
  nav: Record<string, string>;
  boss: { name: string; subtitle: string; defeat: string };
  tasks: { title: string; complete: string; empty: string };
  catCare: { litter: string; feeding: string; clean: string; feed: string };
  fund: { title: string; contribute: string; withdraw: string };
  bills: { title: string; add: string; predict: string };
  subscriptions: { title: string; public: string; private: string };
  mood: { title: string; good: string; meh: string; notGreat: string; vent: string };
  bored: { button: string; title: string };
  stash: { title: string; hidden: string };
  notifications: { taskComplete: string; bossHit: string };
}

export const themeCopy: Record<UserTheme, ThemeCopy> = {
  morty: {
    appName: 'MORTY EXPERIENCE',
    greeting: 'Ugh, finally, Morty. The stench of cat piss was interfering with my interdimensional cable reception.',
    loginTitle: 'INTERDIMENSIONAL LOGIN',
    loginSubtitle: '*burp* Just pick your stupid face and type the password, Morty.',
    nav: {
      dashboard: 'Command Center',
      tasks: 'Chores, Morty',
      cats: 'Cat Duty',
      fund: 'Cap Stash',
      bills: 'Debts',
      subs: 'Subscriptions',
      mood: 'Mood Scan',
      bored: 'I\'m Bored',
      stash: 'The Stash',
    },
    boss: {
      name: 'WEEKLY CHAOS ENTITY',
      subtitle: 'Complete chores to destabilize its molecular structure, Morty.',
      defeat: '*burp* We did it, Morty! One week of not living like animals!',
    },
    tasks: {
      title: 'YOUR PATHETIC DAILY TASKS',
      complete: 'Fine. Mark it done. *burp*',
      empty: 'Even the universe gave you a day off. Don\'t waste it.',
    },
    catCare: {
      litter: 'Litter Box Status',
      feeding: 'Feeding Log',
      clean: 'Clean It, Morty',
      feed: 'Feed the Furballs',
    },
    fund: { title: 'HOUSE CAP STASH', contribute: 'Deposit Caps', withdraw: 'Spend Caps' },
    bills: { title: 'DEBT COLLECTORS', add: 'Add Bill', predict: 'Predicted Next Bill' },
    subscriptions: { title: 'SUBSCRIPTION DRAIN', public: 'Household', private: 'Personal' },
    mood: {
      title: 'EMOTIONAL STATE SCAN',
      good: 'Tolerable',
      meh: 'Meh',
      notGreat: 'Not Great',
      vent: 'Vent into the void (anonymous)',
    },
    bored: { button: 'I\'M BORED, RICK', title: 'Infinite Garage Clicker' },
    stash: { title: 'THE STASH', hidden: '' },
    notifications: {
      taskComplete: 'Microverse battery charged! +1 damage to chaos entity.',
      bossHit: 'Direct hit! The chaos entity recoils!',
    },
  },
  enclave: {
    appName: 'ENCLAVE OPERATIVE',
    greeting: 'Operative, your daily objectives have been updated. The success of the American way of life depends on your diligence.',
    loginTitle: 'ENCLAVE SECURE ACCESS',
    loginSubtitle: 'Authenticate to access classified household operations.',
    nav: {
      dashboard: 'Command Center',
      tasks: 'Daily Orders',
      cats: 'Asset Care',
      fund: 'Treasury',
      bills: 'Bill Command',
      subs: 'Subscriptions',
      mood: 'Status Report',
      bored: 'Recreation',
      stash: 'Classified',
    },
    boss: {
      name: 'WEEKLY THREAT ASSESSMENT',
      subtitle: 'Neutralize through systematic task completion, Operative.',
      defeat: 'Threat neutralized. Outstanding service to the Enclave, Operative.',
    },
    tasks: {
      title: 'DAILY OPERATIONAL ORDERS',
      complete: 'Mission Complete',
      empty: 'All objectives fulfilled. Stand by for new orders.',
    },
    catCare: {
      litter: 'Sanitation Stations',
      feeding: 'Nutritional Protocol',
      clean: 'Execute Sanitation',
      feed: 'Execute Feeding',
    },
    fund: { title: 'HOUSEHOLD TREASURY', contribute: 'Deposit Funds', withdraw: 'Authorize Withdrawal' },
    bills: { title: 'BILL COMMAND CENTER', add: 'Register Bill', predict: 'Projected Expenditure' },
    subscriptions: { title: 'SUBSCRIPTION MANAGEMENT', public: 'Household', private: 'Classified Personal' },
    mood: {
      title: 'OPERATIVE STATUS REPORT',
      good: 'Operational',
      meh: 'Suboptimal',
      notGreat: 'Compromised',
      vent: 'Submit anonymous field report',
    },
    bored: { button: 'RECREATION PORTAL', title: 'Enclave Outpost Builder' },
    stash: { title: 'CLASSIFIED STORAGE', hidden: '' },
    notifications: {
      taskComplete: 'Mission accomplished. Threat level reduced.',
      bossHit: 'Tactical strike confirmed. Enemy integrity compromised.',
    },
  },
  warlock: {
    appName: 'WARLOCK PATRON',
    greeting: 'My dear vessel... the filth in this dwelling displeases me. Attend to your duties. Your power wanes, and my patience is finite.',
    loginTitle: 'BINDING RITUAL',
    loginSubtitle: 'Speak the words of passage, and I shall grant you entry to my domain.',
    nav: {
      dashboard: 'Sanctum',
      tasks: 'Duties',
      cats: 'Familiars',
      fund: 'Offering Pool',
      bills: 'Tributes Due',
      subs: 'Pacts',
      mood: 'Soul State',
      bored: 'Diversion',
      stash: '',
    },
    boss: {
      name: 'THE WEEKLY ABOMINATION',
      subtitle: 'Strike it down through devotion to your household duties, vessel.',
      defeat: 'The abomination falls. You have pleased me... for now.',
    },
    tasks: {
      title: 'YOUR SACRED DUTIES',
      complete: 'Duty fulfilled. Power flows through you.',
      empty: 'No duties remain. Do not grow complacent, vessel.',
    },
    catCare: {
      litter: 'Familiar Sanctuaries',
      feeding: 'Offering of Sustenance',
      clean: 'Purify Sanctuary',
      feed: 'Offer Sustenance',
    },
    fund: { title: 'OFFERING POOL', contribute: 'Make Offering', withdraw: 'Claim Tribute' },
    bills: { title: 'TRIBUTES DEMANDED', add: 'Record Tribute', predict: 'Foreseen Tribute' },
    subscriptions: { title: 'BINDING PACTS', public: 'Shared Pacts', private: 'Personal Pacts' },
    mood: {
      title: 'SOUL STATE READING',
      good: 'Radiant',
      meh: 'Dimming',
      notGreat: 'Shadowed',
      vent: 'Whisper your burdens into the void (anonymous)',
    },
    bored: { button: 'SEEK DIVERSION', title: "Karlak's Mirror" },
    stash: { title: '', hidden: 'This knowledge is not for your eyes, vessel.' },
    notifications: {
      taskComplete: 'The abomination writhes in pain. Well done, vessel.',
      bossHit: 'Your strike lands true. The beast weakens.',
    },
  },
};

export const userProfiles: Record<string, { emoji: string; color: string }> = {
  edward: { emoji: '🧪', color: '#39ff14' },
  dada: { emoji: '🦅', color: '#1a3a6e' },
  jamie: { emoji: '🔮', color: '#8b0000' },
};

export const moodEmojis = { good: '😊', meh: '😐', not_great: '😔' };
