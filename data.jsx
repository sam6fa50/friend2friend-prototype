// ── Friend2Friend mock data ───────────────────────────────────────────────
// Campus / anteater theme (UC Irvine). Monochrome + green accent.

const ME = {
  name: 'Petr the Anteater',
  firstName: 'Petr',
  age: 20,
  initials: 'PA',
  bio: "Hi, I'm Petr the Anteater, and I love Zotting with anyone who wants to meet me!",
  region: 'Irvine, CA',
  radius: 75,
  shareLocation: true,
  interests: ['Skiing', 'Hiking', 'Crocheting', 'Video Games', 'Swimming'],
  socials: { instagram: true, twitter: true, tiktok: false, discord: true },
  stats: { connections: 48, points: 1450, rank: 15 },
};

// popular interests shown by default in the picker
const POPULAR_INTERESTS = [
  'Skiing', 'Hiking', 'Crocheting', 'Video Games', 'Swimming', 'Rock Climbing',
  'Photography', 'Cooking', 'Reading', 'Pickleball', 'Running', 'Cycling',
  'Painting', 'Surfing', 'Yoga', 'Coffee', 'Board Games', 'Concerts',
];

// niche interests surfaced in the "See More" search
const NICHE_INTERESTS = [
  'Origami', 'Birdwatching', 'Pottery', 'Fermented Foods', 'Tailoring',
  'Bouldering', 'Astrophotography', 'Calligraphy', 'Mycology', 'Disc Golf',
  'Beekeeping', 'Linocut Printing', 'Urban Foraging', 'Latte Art', 'Kendama',
  'Tide Pooling', 'Cold Plunging', 'Vinyl Collecting', 'Bonsai', 'Geocaching',
];

// avatar accent (kept monochrome – initials on charcoal) but allow a hue dot
const DISCOVER = [
  {
    id: 'u-sarah', initials: 'SC', name: 'Sarah Chen', age: 26, distance: '0.8 mi away',
    match: 92, bio: 'Rock climbing enthusiast looking for climbing partners! Also love photography and capturing nature.',
    interests: ['Rock Climbing', 'Photography', 'Hiking', 'Cooking'],
    shared: ['Hiking'],
  },
  {
    id: 'u-marcus', initials: 'MJ', name: 'Marcus Johnson', age: 23, distance: '1.2 mi away',
    match: 88, bio: 'CS major who codes by day and skis by winter. Always down for a co-op night or a slope run.',
    interests: ['Video Games', 'Skiing', 'Coffee', 'Board Games'],
    shared: ['Video Games', 'Skiing'],
  },
  {
    id: 'u-aisha', initials: 'AR', name: 'Aisha Rahman', age: 21, distance: '2.1 mi away',
    match: 81, bio: 'Crochet every chai-fueled evening. Looking for a craft circle near campus 🧶',
    interests: ['Crocheting', 'Reading', 'Coffee', 'Painting'],
    shared: ['Crocheting'],
  },
  {
    id: 'u-diego', initials: 'DM', name: 'Diego Morales', age: 24, distance: '3.4 mi away',
    match: 76, bio: 'Lap-swimmer at the ARC most mornings. Hiking the back bay on weekends. Say hi!',
    interests: ['Swimming', 'Hiking', 'Running', 'Surfing'],
    shared: ['Swimming', 'Hiking'],
  },
];

const CONVERSATIONS = [
  {
    id: 'c-sarah', name: 'Sarah Chen', initials: 'SC', distance: '0.8 mi',
    shared: ['Hiking'], unread: 2, time: '2m',
    messages: [
      { from: 'them', text: 'Hey! Saw we both love hiking 🥾', time: '9:02 AM' },
      { from: 'them', text: 'Want to do the Bommer Canyon loop this weekend?', time: '9:02 AM' },
      { from: 'me', text: 'Yes! I have been wanting to do that one', time: '9:14 AM' },
      { from: 'them', text: 'Perfect. Saturday 8am before it gets hot?', time: '9:15 AM' },
    ],
  },
  {
    id: 'c-marcus', name: 'Marcus Johnson', initials: 'MJ', distance: '1.2 mi',
    shared: ['Video Games', 'Skiing'], unread: 0, time: '1h',
    messages: [
      { from: 'me', text: 'gg last night, that ranked grind was brutal', time: 'Yesterday' },
      { from: 'them', text: 'haha we almost hit plat. rematch tonight?', time: 'Yesterday' },
      { from: 'me', text: 'for sure. also you said you ski Mammoth?', time: '11:40 AM' },
    ],
  },
  {
    id: 'c-aisha', name: 'Aisha Rahman', initials: 'AR', distance: '2.1 mi',
    shared: ['Crocheting'], unread: 0, time: '3h',
    messages: [
      { from: 'them', text: 'The craft circle meets Thursdays at the student center!', time: '8:30 AM' },
      { from: 'me', text: 'Amazing, I will bring my granny-square WIP', time: '8:45 AM' },
    ],
  },
];

// pending chat invites (accept / reject)
const INVITES = [
  { id: 'i-diego', name: 'Diego Morales', initials: 'DM', distance: '3.4 mi', shared: ['Swimming', 'Hiking'], note: 'wants to chat about morning swims' },
  { id: 'i-lena', name: 'Lena Park', initials: 'LP', distance: '4.0 mi', shared: ['Photography'], note: 'invited you to a group chat: Golden Hour Walks' },
];

const LEADERBOARD = [
  { rank: 1, name: 'Jamie Park', initials: 'JP', distance: '1.4 mi', connections: 132, points: 3820, interest: 'Rock Climbing', trend: 'up', active: true },
  { rank: 2, name: 'Sarah Chen', initials: 'SC', distance: '0.8 mi', connections: 118, points: 3540, interest: 'Hiking', trend: 'up', active: true },
  { rank: 3, name: 'Marcus Johnson', initials: 'MJ', distance: '1.2 mi', connections: 97, points: 2910, interest: 'Skiing', trend: 'down', active: false },
  { rank: 4, name: 'Priya Nair', initials: 'PN', distance: '2.6 mi', connections: 88, points: 2640, interest: 'Yoga', trend: 'up', active: true },
  { rank: 5, name: 'Diego Morales', initials: 'DM', distance: '3.4 mi', connections: 81, points: 2510, interest: 'Swimming', trend: 'same', active: true },
  { rank: 6, name: 'Aisha Rahman', initials: 'AR', distance: '2.1 mi', connections: 74, points: 2280, interest: 'Crocheting', trend: 'up', active: true },
  { rank: 7, name: 'Tyler Brooks', initials: 'TB', distance: '5.0 mi', connections: 69, points: 2100, interest: 'Pickleball', trend: 'down', active: true },
];

// badges – earned + locked
const BADGES = [
  { id: 'pioneer', name: 'Pioneer', sub: 'Joined in the first month', earned: true, glyph: 'flag' },
  { id: 'connector', name: 'Connector', sub: 'Made 25 connections', earned: true, glyph: 'link' },
  { id: 'explorer', name: 'Explorer', sub: 'Matched across 5 interests', earned: true, glyph: 'compass' },
  { id: 'streak', name: 'On a Streak', sub: '7 days active', earned: true, glyph: 'flame' },
  { id: 'social', name: 'Social Butterfly', sub: 'Start 10 chats', earned: false, glyph: 'chat' },
  { id: 'climber', name: 'Summit', sub: 'Reach top 10 in an interest', earned: false, glyph: 'mountain' },
];

const BLOCK_SCOPES = [
  { id: 'profile', label: 'My full profile', sub: 'Bio, photos, and interests' },
  { id: 'geo', label: 'My location', sub: 'Distance and region' },
  { id: 'messages', label: 'Messaging', sub: 'They can no longer message me' },
  { id: 'leaderboard', label: 'Leaderboard presence', sub: 'Hide me from their board' },
];

// crude profanity check for the bio moderation demo
const BANNED_WORDS = ['weirdo', 'idiot', 'stupid', 'hate', 'nsfw'];

Object.assign(window, {
  F2F_ME: ME,
  F2F_POPULAR: POPULAR_INTERESTS,
  F2F_NICHE: NICHE_INTERESTS,
  F2F_DISCOVER: DISCOVER,
  F2F_CONVERSATIONS: CONVERSATIONS,
  F2F_INVITES: INVITES,
  F2F_LEADERBOARD: LEADERBOARD,
  F2F_BADGES: BADGES,
  F2F_BLOCK_SCOPES: BLOCK_SCOPES,
  F2F_BANNED: BANNED_WORDS,
});
