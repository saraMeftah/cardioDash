import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: missing Bearer token." });
  }

  const token = authHeader.split(" ")[2] || authHeader.split(" ")[1];

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Server configuration error: missing Supabase credentials." });
  }

  try {
    // Create client scoped to the caller's JWT token
    const client = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Validate the token by fetching user details
    const { data: { user }, error } = await client.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized: invalid or expired token." });
    }

    // Check if the user exists and has access rights in public.users
    const { data: profile, error: profileError } = await client
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: "Forbidden: user profile not found or role unassigned." });
    }

    // Role verification (ensure they are clinic staff and not a guest)
    const allowedRoles = ["admin", "doctor", "assistant"];
    if (!allowedRoles.includes(profile.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions." });
    }

    // Attach to request
    (req as any).supabaseUser = user;
    (req as any).supabaseClient = client;
    (req as any).userRole = profile.role;

    next();
    return;
  } catch (err) {
    req.log.error({ err }, "Authentication middleware unhandled error");
    return res.status(500).json({ error: "Internal authentication error." });
  }
}
