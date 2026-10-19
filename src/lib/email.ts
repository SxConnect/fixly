import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_FROM = process.env.EMAIL_FROM || 'Fixly <noreply@fixly.com.br>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function sendDownloadEmail(
  to: string,
  buyerName: string,
  productTitle: string,
  downloadUrl: string
) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Seu ebook "${productTitle}" está pronto!`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a; margin-bottom: 20px;">Obrigado pela compra, ${buyerName}!</h1>
        <p>Seu ebook <strong>"${productTitle}"</strong> está pronto para download.</p>
        <p style="margin: 30px 0;">
          <a href="${downloadUrl}"
             style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Baixar meu ebook
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Este link permite até 30 downloads e expira em 30 dias.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">
          Você tem 7 dias para solicitar reembolso conforme o Código de Defesa do Consumidor.
        </p>
      </div>
    `,
  })
}

export async function sendWelcomeEmail(to: string, name: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: 'Bem-vindo ao Fixly!',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a; margin-bottom: 20px;">Bem-vindo ao Fixly, ${name}!</h1>
        <p>Você está a poucos passos de criar seu primeiro ebook.</p>
        <p style="margin: 30px 0;">
          <a href="${APP_URL}/products/new"
             style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Criar meu primeiro ebook
          </a>
        </p>
      </div>
    `,
  })
}
