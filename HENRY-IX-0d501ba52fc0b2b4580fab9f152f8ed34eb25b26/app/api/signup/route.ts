import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";
import { handleUserSignup } from "@/app/workflows/signup";
import { start } from "workflow/api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: "Invalid email address transmission" },
        { status: 400 }
      );
    }

    // 1. Invisible BotID Protection challenge check
    const { isBot } = await checkBotId();
    if (isBot) {
      console.warn(`[BotID Attack Vector Blocked]: ${email} flagged as automated agent.`);
      return NextResponse.json(
        { error: "Access Denied: Automated agent detected by firewall" },
        { status: 403 }
      );
    }

    // 2. Trigger/execute durable user signup workflow
    const run = await start(handleUserSignup, [email]);
    
    // We can return the runId immediately, or wait for the return value
    const result = await run.returnValue;

    return NextResponse.json(
      { success: true, message: "Signup processed successfully", data: result },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Signup API Error]:", error);
    return NextResponse.json(
      { error: `Internal processing error: ${error.message || 'Workflow execution failed'}` },
      { status: 500 }
    );
  }
}
