import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bbrxgpuvbfmehqxdojkj.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicnhncHV2YmZtZWhxeGRvamtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODQ0MzIsImV4cCI6MjEwMTY2MDQzMn0.Mhg5n_Gkg-yi2L-COS-DRP5W16Q0IHZ81X0L5MjoQGE'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function test() {
  console.log('Testing Sign In...')
  let { data, error } = await supabase.auth.signInWithPassword({
    email: 'markai0420@gmail.com',
    password: 'resident'
  })

  if (error) {
    console.error('Sign In failed:', error.message)
    console.log('Trying Sign Up...')
    const signupResp = await supabase.auth.signUp({
      email: 'markai0420@gmail.com',
      password: 'resident'
    })
    if (signupResp.error) {
      console.error('Sign Up failed:', signupResp.error.message)
      return
    }
    console.log('Sign Up successful!')
    data = signupResp.data
  } else {
    console.log('Sign In successful!')
  }

  const userId = data.user.id
  console.log('User ID:', userId)

  console.log('Testing RLS for documents (should be able to read all)...')
  const { data: docs, error: docsErr } = await supabase.from('documents').select('*')
  if (docsErr) console.error('Documents read error:', docsErr.message)
  else console.log('Documents read success:', docs?.length)

  console.log('Testing RLS for document_requests (should only see own)...')
  const { data: reqs, error: reqsErr } = await supabase.from('document_requests').select('*')
  if (reqsErr) console.error('Doc requests error:', reqsErr.message)
  else {
    console.log('Doc requests read success:', reqs?.length)
    const otherReqs = reqs?.filter(r => r.user_id !== userId)
    if (otherReqs?.length > 0) console.error('SECURITY ISSUE: Can see other users requests!')
    else console.log('RLS OK: Only seeing own requests (or none).')
  }

  console.log('Done testing.')
}

test()
