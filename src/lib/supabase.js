import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Auth helpers ──────────────────────────────────────────────
export async function signUp(email, password) {
  return supabase.auth.signUp({ email, password })
}
export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}
export async function signOut() {
  return supabase.auth.signOut()
}
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── Trade helpers ─────────────────────────────────────────────
export async function fetchTrades(userId) {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function insertTrade(trade) {
  // Only pass known DB columns - strip any extra fields from form
  const { r, ...rest } = trade  // remove raw 'r' field (already mapped to r_multiple and pl)
  const { data, error } = await supabase
    .from('trades')
    .insert([rest])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTrade(id, updates) {
  const { data, error } = await supabase
    .from('trades')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTrade(id) {
  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', id)
  if (error) throw error
}


// ── Account helpers ───────────────────────────────────────────
export async function fetchAccounts(userId) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createAccount(account) {
  const { data, error } = await supabase
    .from('accounts')
    .insert([account])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateAccount(id, updates) {
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAccount(id) {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Daily notes helpers ───────────────────────────────────────
export async function fetchDailyNotes(userId) {
  const { data, error } = await supabase
    .from('daily_notes')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertDailyNote(note) {
  // Insert or update based on user_id + date unique constraint
  const { data, error } = await supabase
    .from('daily_notes')
    .upsert({ ...note, updated_at: new Date().toISOString() }, { onConflict: 'user_id,date' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDailyNote(id) {
  const { error } = await supabase
    .from('daily_notes')
    .delete()
    .eq('id', id)
  if (error) throw error
}
