import { db } from "@/src/db";
import { eq } from "drizzle-orm";
import { user, session, account } from "@/src/db/schema";

export async function POST(request: Request) {
  try {
    console.log('[Mobile OAuth API] Handling mobile OAuth callback');
    
    const body = await request.json();
    const { code, redirectUri } = body;

    if (!code || !redirectUri) {
      console.error('[Mobile OAuth API] Missing code or redirectUri');
      return Response.json(
        { error: 'Missing authorization code or redirect URI' },
        { status: 400 }
      );
    }

    console.log('[Mobile OAuth API] Exchanging code for tokens');

    // Exchange the authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Mobile OAuth API] Token exchange failed:', errorText);
      return Response.json(
        { error: 'Failed to exchange authorization code' },
        { status: 400 }
      );
    }

    const tokens = await tokenResponse.json();
    console.log('[Mobile OAuth API] Got tokens, fetching user info');

    // Fetch user information
    const userResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
    );

    if (!userResponse.ok) {
      console.error('[Mobile OAuth API] Failed to fetch user info');
      return Response.json(
        { error: 'Failed to fetch user information' },
        { status: 400 }
      );
    }

    const googleUser = await userResponse.json();
    console.log('[Mobile OAuth API] User info:', { email: googleUser.email, name: googleUser.name });

    // Check if user exists by email
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, googleUser.email))
      .limit(1);

    let userId: string;
    let userRecord;

    if (existingUser.length > 0) {
      userRecord = existingUser[0];
      userId = userRecord.id;
      console.log('[Mobile OAuth API] Found existing user:', userId);
    } else {
      // Create new user
      const newUserId = crypto.randomUUID();
      const newUser = {
        id: newUserId,
        email: googleUser.email,
        name: googleUser.name,
        image: googleUser.picture,
        role: 'doctor', // Default role
        emailVerified: true, // OAuth emails are pre-verified
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(user).values(newUser);
      userId = newUserId;
      userRecord = newUser;
      console.log('[Mobile OAuth API] Created new user:', userId);
    }

    // Check if Google account is linked
    const existingAccount = await db
      .select()
      .from(account)
      .where(eq(account.userId, userId))
      .limit(1);

    if (existingAccount.length === 0) {
      // Link Google account
      await db.insert(account).values({
        id: crypto.randomUUID(),
        userId: userId,
        accountId: googleUser.id,
        providerId: 'google',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        accessTokenExpiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
        scope: tokens.scope,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('[Mobile OAuth API] Linked Google account');
    }

    // Create session using Better Auth
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(session).values({
      id: sessionId,
      userId: userId,
      expiresAt: expiresAt,
      token: sessionId, // Use session ID as token
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('[Mobile OAuth API] Created session:', sessionId);

    // Create response with session cookie
    const response = Response.json({
      success: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        image: userRecord.image,
        role: userRecord.role,
      },
      session: {
        id: sessionId,
        expiresAt: expiresAt.toISOString(),
      }
    });

    // Set session cookie
    response.headers.set(
      'Set-Cookie',
      `better-auth.session-token=${sessionId}; HttpOnly=false; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`
    );

    return response;

  } catch (error) {
    console.error('[Mobile OAuth API] Error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}