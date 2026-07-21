import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admins only." }, { status: 403 });
    }

    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Valid email and password (6+ chars) required." },
        { status: 400 }
      );
    }

    const admin = createServiceClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "admin" },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "Could not create admin." },
        { status: 400 }
      );
    }

    await admin.from("profiles").upsert({
      id: data.user.id,
      email,
      role: "admin",
    });

    return NextResponse.json({ ok: true, email });
  } catch (err) {
    console.error("[admin/create-admin]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to create admin. Is SUPABASE_SERVICE_ROLE_KEY set?",
      },
      { status: 500 }
    );
  }
}
