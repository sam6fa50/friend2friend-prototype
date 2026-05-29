// ── Demo user seeder (ADMIN — uses the service_role key) ───────────────────
// Creates a handful of demo accounts + profiles so Discover / Leaderboard /
// Messages have other people to show. Idempotent: safe to run repeatedly.
//
//   cd web
//   node --env-file=.env.local scripts/seed-demo-users.mjs
//   (or: npm run seed)
//
// Reads VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
// The service_role key bypasses RLS — never ship it to the client.

import { createClient } from '@supabase/supabase-js'

const URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.')
  process.exit(1)
}

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PASSWORD = 'F2Fdemo!2026' // shared demo password — fine for seeded accounts
const UCI = { lat: 33.6405, lng: -117.8443 }

// people mirror the prototype's mock data; coords are scattered around UCI
const DEMO = [
  { first: 'Sarah',  last: 'Chen',     age: 26, bio: 'Rock climbing enthusiast looking for climbing partners! Also love photography and capturing nature.', interests: ['Rock Climbing','Photography','Hiking','Cooking'], points: 3540, connections: 118, dLat: 0.010,  dLng: 0.004 },
  { first: 'Marcus', last: 'Johnson',  age: 23, bio: 'CS major who codes by day and skis by winter. Always down for a co-op night or a slope run.',       interests: ['Video Games','Skiing','Coffee','Board Games'],   points: 2910, connections: 97,  dLat: -0.014, dLng: 0.009 },
  { first: 'Aisha',  last: 'Rahman',   age: 21, bio: 'Crochet every chai-fueled evening. Looking for a craft circle near campus.',                      interests: ['Crocheting','Reading','Coffee','Painting'],     points: 2280, connections: 74,  dLat: 0.020,  dLng: -0.018 },
  { first: 'Diego',  last: 'Morales',  age: 24, bio: 'Lap-swimmer at the ARC most mornings. Hiking the back bay on weekends. Say hi!',                  interests: ['Swimming','Hiking','Running','Surfing'],        points: 2510, connections: 81,  dLat: -0.030, dLng: -0.020 },
  { first: 'Jamie',  last: 'Park',     age: 25, bio: 'Send it. Bouldering gym regular and weekend trad climber.',                                       interests: ['Rock Climbing','Bouldering','Hiking'],          points: 3820, connections: 132, dLat: 0.012,  dLng: -0.010 },
  { first: 'Priya',  last: 'Nair',     age: 22, bio: 'Sunrise yoga + a good book + great coffee = perfect day.',                                        interests: ['Yoga','Reading','Cooking'],                     points: 2640, connections: 88,  dLat: 0.028,  dLng: 0.022 },
  { first: 'Tyler',  last: 'Brooks',   age: 27, bio: 'Pickleball obsessed. Also run and bike the coast most weeks.',                                    interests: ['Pickleball','Running','Cycling'],               points: 2100, connections: 69,  dLat: -0.045, dLng: 0.030 },
  { first: 'Lena',   last: 'Park',     age: 23, bio: 'Golden-hour walks and film photography. Always chasing a good concert.',                          interests: ['Photography','Concerts','Coffee'],              points: 1980, connections: 61,  dLat: 0.034,  dLng: -0.028 },
]

async function getUserByEmail(email) {
  // paginate the admin user list to find an existing account
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find(u => u.email === email)
    if (hit) return hit
    if (data.users.length < 200) break
  }
  return null
}

async function resolveInterestIds(names) {
  const { data, error } = await admin.from('interests').select('id, name').in('name', names)
  if (error) throw error
  return (data || []).map(r => r.id)
}

async function seedOne(p) {
  const email = `${p.first}.${p.last}@f2fdemo.dev`.toLowerCase()
  const name = `${p.first} ${p.last}`

  // 1) ensure the auth user exists
  let user = await getUserByEmail(email)
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email, password: PASSWORD, email_confirm: true,
      user_metadata: { first_name: p.first },
    })
    if (error) throw error
    user = data.user
  }

  // 2) upsert the profile (the signup trigger created a base row)
  const { error: pErr } = await admin.from('profiles').update({
    first_name: p.first,
    age: p.age,
    bio: p.bio,
    region: 'Irvine, CA',
    radius_mi: 50,
    share_location: true,
    points: p.points,
    connections: p.connections,
    location: `SRID=4326;POINT(${UCI.lng + p.dLng} ${UCI.lat + p.dLat})`,
    location_at: new Date().toISOString(),
  }).eq('id', user.id)
  if (pErr) console.warn(`  ! profile update for ${name}: ${pErr.message}`)

  // 3) subscribe interests (idempotent)
  const ids = await resolveInterestIds(p.interests)
  if (ids.length) {
    const rows = ids.map(interest_id => ({ user_id: user.id, interest_id }))
    const { error: iErr } = await admin.from('user_interests')
      .upsert(rows, { onConflict: 'user_id,interest_id', ignoreDuplicates: true })
    if (iErr) console.warn(`  ! interests for ${name}: ${iErr.message}`)
  }

  console.log(`  ✓ ${name}  <${email}>  (${p.interests.length} interests)`)
}

async function main() {
  console.log(`Seeding ${DEMO.length} demo users into ${URL} …`)
  for (const p of DEMO) {
    try { await seedOne(p) }
    catch (err) { console.error(`  ✗ ${p.first} ${p.last}: ${err.message}`) }
  }
  console.log(`\nDone. Demo accounts share the password: ${PASSWORD}`)
}

main().catch(err => { console.error(err); process.exit(1) })
