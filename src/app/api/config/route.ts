import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    const { data } = await supabase
      .from('bot_config')
      .select('*')
      .limit(1)
      .single()
    return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
    const body = await req.json()
    const { data: existing } = await supabase
      .from('bot_config')
      .select('id')
      .limit(1)
      .single()

  if (existing) {
        const { data } = await supabase
          .from('bot_config')
          .update({ ...body, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single()
        return NextResponse.json(data)
  } else {
        const { data } = await supabase
          .from('bot_config')
          .insert(body)
          .select()
          .single()
        return NextResponse.json(data)
  }
}
