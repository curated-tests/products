import NextAuth, {NextAuthOptions} from 'next-auth'
import EmailProvider, {EmailConfig} from 'next-auth/providers/email'
import {prisma} from '@skillrecordings/database'
import {createTransport} from 'nodemailer'
import {withSentry} from '@sentry/nextjs'
import {getSdk} from '../../../lib/prisma-api'
import mjml2html from 'mjml'
import chalk from 'chalk'
import {PrismaAdapter} from '../../../server/skill-next-auth-prisma-adapter'

export type MagicLinkEmailType =
  | 'login'
  | 'signup'
  | 'reset'
  | 'purchase'
  | 'upgrade'

export const sendVerificationRequest = async (params: {
  identifier: string
  url: string
  expires: Date
  provider: EmailConfig
  token: string
  type?: MagicLinkEmailType
}) => {
  const {
    identifier: email,
    url,
    provider: {server, from},
  } = params
  const transport = createTransport(server)
  const {getUserByEmail} = getSdk()
  const {host} = new URL(url)

  let subject

  switch (params.type) {
    case 'purchase':
      subject = `Thank you for Purchasing Testing Accessibility (${host})`
      break
    default:
      subject = `Log in to Testing Accessibility (${host})`
  }

  const user = await getUserByEmail(email)

  if (process.env.NODE_ENV === 'development') {
    console.log()
    console.log(chalk.gray(`*********** login link ⭐️`))
    console.log(chalk.green(url))
    console.log()
  }

  if (!user) return

  if (process.env.POSTMARK_KEY) {
    await transport.sendMail({
      to: email,
      from,
      subject,
      text: text({url, host}),
      html: html({url, host, email}),
    })
  } else {
    console.info(`login email not sent, no POSTMARK_KEY found`)
  }
}

async function getUser(userId: string) {
  return prisma.user.findUnique({
    where: {id: userId},
    select: {
      roles: true,
      id: true,
      purchases: {
        select: {
          id: true,
          merchantChargeId: true,
          productId: true,
          createdAt: true,
          totalAmount: true,
          bulkCoupon: {
            select: {
              maxUses: true,
              usedCount: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })
}

export const nextAuthOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  adapter: PrismaAdapter(prisma),
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.POSTMARK_KEY,
          pass: process.env.POSTMARK_KEY,
        },
      },
      from: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
      sendVerificationRequest,
    }),
  ],
  callbacks: {
    async session({session, token}) {
      if (token?.id) {
        const user = await getUser(token.id as string)
        if (user) {
          const {roles, purchases} = user
          session.purchases = purchases
          session.role = roles
          token.purchases = purchases
          token.role = roles
        }
      } else {
        token.purchases = []
        session.purchases = []
      }

      return session
    },
    async jwt({token, profile, account, user: authUser}) {
      if (authUser) {
        const user = await getUser(authUser.id)
        if (user) {
          const {roles, id, purchases} = user
          token.id = id
          token.purchases = purchases
          token.role = roles || 'user'
        }
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
    error: '/error',
    verifyRequest: '/check-your-email',
  },
}

export default withSentry(NextAuth(nextAuthOptions))

export const config = {
  api: {
    externalResolver: true,
  },
}

function html({url, host, email}: Record<'url' | 'host' | 'email', string>) {
  // Insert invisible space into domains and email address to prevent both the
  // email address and the domain from being turned into a hyperlink by email
  // clients like Outlook and Apple mail, as this is confusing because it seems
  // like they are supposed to click on their email address to sign in.
  const escapedEmail = `${email.replace(/\./g, '&#8203;.')}`
  const escapedHost = `${host.replace(/\./g, '&#8203;.')}`

  // Some simple styling options
  const backgroundColor = '#F9FAFB'
  const textColor = '#3E3A38'
  const mainBackgroundColor = '#ffffff'
  const buttonBackgroundColor = '#218345'
  const buttonTextColor = '#ffffff'

  const {html} = mjml2html(`
<mjml>
  <mj-head>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600" />
    <mj-attributes>
      <mj-all font-family="Inter, Helvetica, sans-serif" line-height="1.5" />
    </mj-attributes>
    <mj-raw>
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
    </mj-raw>
  </mj-head>
  <mj-body background-color="${backgroundColor}">
    <mj-section padding="10px 0 10px 0">
      <mj-column background-color="${backgroundColor}">
        <mj-image alt="Testing Accessibility by Marcy Sutton" width="180px" src="https://res.cloudinary.com/testing-accessibility/image/upload/v1655584147/logo-email_2x_e0n8tn.png" />
      </mj-column>
    </mj-section>
    <mj-section padding-top="0">
      <mj-column background-color="${mainBackgroundColor}" padding="16px 10px">
        <mj-text font-size="18px" color="${textColor}" align="center" padding-bottom="20px">
          Log in as <strong color="${textColor}">${escapedEmail}</strong> to Testing Accessibility.
        </mj-text>
        <mj-button href="${url}" background-color="${buttonBackgroundColor}" color="${buttonTextColor}" target="_blank" border-radius="6px" font-size="18px" font-weight="bold">
          Log in
        </mj-button>

        <mj-text color="${textColor}" align="center"  padding="30px 90px 10px 90px">
          The link is valid for 24 hours or until it is used once. You will stay logged in for 60 days. <a href="${process.env.NEXT_PUBLIC_URL}/login" target="_blank">Click here to request another link</a>.
        </mj-text>
        <mj-text color="${textColor}" align="center" padding="10px 90px 10px 90px">
          Once you are logged in, you can <a href="${process.env.NEXT_PUBLIC_URL}/invoices" target="_blank">access your invoice here</a>.
        </mj-text>
        <mj-text color="${textColor}" align="center" padding="10px 90px 10px 90px">
          If you need additional help, reply!
        </mj-text>
        <mj-text color="gray" align="center" padding-top="40px">
          If you did not request this email you can safely ignore it.
        </mj-text>
    </mj-section>
  </mj-body>
</mjml>
`)

  return html
}

// Email Text body (fallback for email clients that don't render HTML, e.g. feature phones)
function text({url, host}: Record<'url' | 'host', string>) {
  return `Log in to ${host}\n${url}\n\n`
}
