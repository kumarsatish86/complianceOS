// Type augmentation for NextAuth

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      platformRole?: string
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    platformRole?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    platformRole?: string
  }
}
