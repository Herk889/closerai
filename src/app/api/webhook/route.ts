import { NextRequest, NextResponse } from 'next/server'
import { handleIncomingMessage } from '@/lib/ai-agent'
import { sendWhatsAppMessage, markAsRead } from '@/lib/whatsapp'

// Webhook verification (GET) - Meta calls this once to validate
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('Webhook verified!')
        return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Receive messages (POST)
export async function POST(req: NextRequest) {
    try {
          const body = await req.json()

      const entry = body.entry?.[0]
          const changes = entry?.changes?.[0]
          const value = changes?.value

      if (!value?.messages?.[0]) {
              return NextResponse.json({ status: 'no_message' })
      }

      const message = value.messages[0]
          const contact = value.contacts?.[0]

      // Only handle text messages for now
      if (message.type !== 'text') {
              await sendWhatsAppMessage(
                        message.from,
                        "J ai bien recu votre message ! Pour l instant je ne peux lire que les messages texte. Pouvez-vous me decrire votre besoin par ecrit ?"
                      )
              return NextResponse.json({ status: 'non_text_handled' })
      }

      // Mark as read immediately
      await markAsRead(message.id)

      // Process with AI agent
      const reply = await handleIncomingMessage(
              message.from,
              contact?.profile?.name || 'Visiteur',
              message.from,
              message.text.body
            )

      // Send reply
      await sendWhatsAppMessage(message.from, reply)

      return NextResponse.json({ status: 'ok' })
    } catch (error) {
          console.error('Webhook error:', error)
          return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
