const WHATSAPP_API = 'https://graph.facebook.com/v21.0'

export async function sendWhatsAppMessage(to: string, text: string) {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const token = process.env.WHATSAPP_TOKEN

  const response = await fetch(
        `${WHATSAPP_API}/${phoneNumberId}/messages`,
    {
            method: 'POST',
            headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                      messaging_product: 'whatsapp',
                      to,
                      type: 'text',
                      text: { body: text },
            }),
    }
      )

  if (!response.ok) {
        const error = await response.text()
        console.error('WhatsApp API error:', error)
        throw new Error(`WhatsApp send failed: ${response.status}`)
  }

  return response.json()
}

export async function markAsRead(messageId: string) {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const token = process.env.WHATSAPP_TOKEN

  await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
        },
        body: JSON.stringify({
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId,
        }),
  })
}
