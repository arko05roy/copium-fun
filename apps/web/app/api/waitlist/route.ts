import { createServerSupabase } from "@/lib/supabase/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
  } | null;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!emailPattern.test(email) || email.length > 254) {
    return Response.json(
      { message: "Enter a valid email address." },
      { status: 400 }
    );
  }

  try {
    // The hand-maintained database type omits some Supabase relationship metadata,
    // so this isolated shape keeps the new table safely typed until regeneration.
    const waitlist = createServerSupabase().from(
      "waitlist_signups"
    ) as unknown as {
      upsert: (
        signup: { email: string },
        options: { onConflict: string; ignoreDuplicates: boolean }
      ) => Promise<{ error: { message: string } | null }>;
    };
    const { error } = await waitlist.upsert(
      { email },
      { onConflict: "email", ignoreDuplicates: true }
    );

    if (error) throw error;
  } catch (error) {
    console.error("Waitlist signup failed", error);
    return Response.json(
      { message: "We couldn’t save your spot. Please try again." },
      { status: 500 }
    );
  }

  return Response.json({
    message: "You’re on the list. Keep an eye on your inbox.",
  });
}
