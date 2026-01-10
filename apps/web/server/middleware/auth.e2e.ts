type AuthSession = Awaited<
  ReturnType<typeof import("@/lib/auth").auth.api.getSession>
>

export async function getE2ESessionFromCookie(
  cookieHeader: string,
): Promise<AuthSession | null> {
  const tokenMatch = cookieHeader.match(/better-auth\.session_token=([^;]+)/)
  if (!tokenMatch) {
    return null
  }

  const token = tokenMatch[1]!

  const { db, eq, SessionTable, UserTable } = await import("@packages/db")

  const dbSession = await db
    .select()
    .from(SessionTable)
    .where(eq(SessionTable.token, token))

  if (dbSession.length === 0) {
    return null
  }

  const session = dbSession[0]
  if (!session || session.expiresAt <= new Date()) {
    return null
  }

  const dbUser = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.id, session.userId))
  const user = dbUser[0]

  if (!user) {
    return null
  }

  return {
    user,
    session,
  }
}
