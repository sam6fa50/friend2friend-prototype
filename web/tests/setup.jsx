import '@testing-library/jest-dom';

// Mock the window globals that the components attach to
global.window.F2F_INK = '#09090b';
global.window.F2F_BG = '#f5f5f7';
global.window.F2F_GREEN = '#22c55e';
global.window.F2F_BOT_SAFE = 0;
global.window.F2F_TOP_SAFE = 44;

global.window.F2F_ME = {
  initials: 'YU',
  stats: { rank: 12, points: 1450, connections: 24 },
};

global.window.F2F_LEADERBOARD = [
  { rank: 1, name: 'Sarah Chen',     initials: 'SC', points: 2850, connections: 48, distance: '0.8 mi', interest: 'Rock Climbing', trend: 'up',   active: true  },
  { rank: 2, name: 'Marcus Johnson', initials: 'MJ', points: 2720, connections: 45, distance: '1.2 mi', interest: 'Hiking',        trend: 'flat', active: false },
  { rank: 3, name: 'Emma Wilson',    initials: 'EW', points: 2580, connections: 42, distance: '0.5 mi', interest: 'Reading',       trend: 'up',   active: true  },
  { rank: 4, name: 'Alex Rivera',    initials: 'AR', points: 2100, connections: 38, distance: '2.1 mi', interest: 'Music',         trend: 'down', active: true  },
];

// Mock Icon, Avatar, ScreenHeader so component renders don't crash
global.window.Icon = () => null;
global.window.Avatar = () => null;
global.window.ScreenHeader = ({ title }) => <div>{title}</div>;
