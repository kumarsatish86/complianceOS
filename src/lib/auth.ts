import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 Authorization attempt:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            include: {
              platformRole: true
            }
          })

          console.log('👤 User found:', user ? 'Yes' : 'No')
          
          if (!user || !user.password) {
            console.log('❌ User not found or no password')
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('🔑 Password valid:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('❌ Invalid password')
            return null
          }

          console.log('✅ Authentication successful for:', user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            platformRole: user.platformRole?.name,
          }
        } catch (error) {
          console.error('❌ Auth error:', error instanceof Error ? error.message : 'Unknown error')
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: unknown; user: unknown }) {
      if (user) {
        console.log('🔑 JWT callback - user:', user)
        ;(token as Record<string, unknown>).platformRole = (user as Record<string, unknown>).platformRole
        console.log('🔑 JWT callback - token.platformRole:', (token as Record<string, unknown>).platformRole)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return token as any
    },
    async session({ session, token }: { session: unknown; token: unknown }) {
      if (token) {
        console.log('📋 Session callback - token:', token)
        ;(session as Record<string, unknown>).user = {
          ...((session as Record<string, unknown>).user as Record<string, unknown>),
          id: (token as Record<string, unknown>).sub,
          platformRole: (token as Record<string, unknown>).platformRole as string
        }
        console.log('📋 Session callback - session.user.platformRole:', ((session as Record<string, unknown>).user as Record<string, unknown>).platformRole)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return session as any
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      console.log('🔄 Redirect callback - url:', url, 'baseUrl:', baseUrl)
      // If the URL is relative, make it absolute
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // If the URL is on the same origin, allow it
      else if (new URL(url).origin === baseUrl) return url
      // Otherwise, redirect to dashboard
      return `${baseUrl}/dashboard`
    }
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  }
}
