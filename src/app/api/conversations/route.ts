import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    const { data: conversations } = await supabase
      .from('conversations')
      .select('*, messages(role, content, created_at)')
      .order('last_message_at', { ascending: false })
      .limit(50)

  const { data: totals } = await supabase
      .from('conversations')
      .select('status')

  const totalConvos = totals?.length || 0
    const activeConvos = totals?.filter(c => c.status === 'active').length || 0
    const convertedConvos = totals?.filter(c => c.status === 'converted').length || 0

  return NextResponse.json({
        conversations,
        summary: {
                total: totalConvos,
                active: activeConvos,
                converted: convertedConvos,
                conversionRate: totalConvos > 0 ? ((convertedConvos / totalConvos) * 100).toFixed(1) : '0',
        },
  })
}
