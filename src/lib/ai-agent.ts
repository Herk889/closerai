import OpenAI from 'openai'
import { supabase } from './supabase'
import { buildSystemPrompt } from './prompts'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface Message {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export async function handleIncomingMessage(
    contactId: string,
    contactName: string,
    contactPhone: string,
    messageText: string
  ): Promise<string> {
    // 1. Get or create conversation
  let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('wa_contact_id', contactId)
      .eq('status', 'active')
      .single()

  if (!conversation) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
                    wa_contact_id: contactId,
                    contact_name: contactName,
                    contact_phone: contactPhone,
                    status: 'active',
                    messages_count: 0,
          })
          .select()
          .single()
        conversation = newConv
        await upsertDailyStats('conversations_started', 1)
  }

  if (!conversation) throw new Error('Cannot create conversation')

  // 2. Save incoming message
  await supabase.from('messages').insert({
        conversation_id: conversation.id,
        role: 'user',
        content: messageText,
  })

  // 3. Get conversation history
  const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20)

  // 4. Get bot config
  const { data: config } = await supabase
      .from('bot_config')
      .select('*')
      .limit(1)
      .single()

  if (!config) throw new Error('Bot config missing')

  // 5. Build system prompt
  const systemPrompt = buildSystemPrompt({
        businessName: config.business_name,
        productName: config.product_name,
        productDescription: config.product_description,
        productPrice: config.product_price,
        currency: config.currency,
        tone: config.tone,
        language: config.language,
        faq: (config.faq as any[]) || [],
        objections: (config.objections as any[]) || [],
        paymentLink: config.payment_link || '',
  })

  // 6. Call AI
  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
        ...(history || []).map((m: any) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
        })),
      ]

  const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 300,
        temperature: 0.8,
  })

  const reply = completion.choices[0]?.message?.content?.trim() || 'Desole, petit souci technique. Je reviens vite !'

  // 7. Save reply
  await supabase.from('messages').insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: reply,
  })

  // 8. Update conversation
  await supabase
      .from('conversations')
      .update({
              messages_count: (conversation.messages_count || 0) + 2,
              last_message_at: new Date().toISOString(),
              contact_name: contactName || conversation.contact_name,
      })
      .eq('id', conversation.id)

  await upsertDailyStats('messages_sent', 1)
    return reply
}

async function upsertDailyStats(field: string, increment: number) {
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('date', today)
      .single()

  if (existing) {
        await supabase
          .from('daily_stats')
          .update({ [field]: (existing[field] || 0) + increment })
          .eq('date', today)
  } else {
        await supabase
          .from('daily_stats')
          .insert({ date: today, [field]: increment })
  }
}
