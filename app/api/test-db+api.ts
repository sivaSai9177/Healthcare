import { db } from "@/src/db";
import { user } from "@/src/db/schema";
import { sql } from "drizzle-orm";

async function handler(request: Request) {
  const origin = request.headers.get('origin');
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };

  try {
    console.log("[TEST DB] Testing database connection...");
    
    // Test basic query
    const result = await db.select({ count: sql<number>`count(*)` }).from(user);
    console.log("[TEST DB] User count:", result);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        userCount: result[0]?.count || 0,
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      }), 
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[TEST DB] Error:', error);
    console.error('[TEST DB] Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack,
      }), 
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export { handler as GET };