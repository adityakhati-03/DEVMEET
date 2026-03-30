import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

const rateLimitStore: Record<string, { count: number; timestamp: number }> = {};
const RATE_LIMIT_DURATION = 60000;
const RATE_LIMIT_COUNT = 15;

interface CodeExecutionRequest {
  code: string;
  languageId: number;
  stdin?: string;
}

// Map frontend IDs to Wandbox compiler names
const WANDBOX_LANGUAGE_MAP: { [key: number]: string } = {
  1: "nodejs-20.17.0",
  2: "cpython-3.14.0",
  3: "gcc-head-c",
  4: "gcc-head",
  5: "openjdk-jdk-22+36",
  6: "go-1.23.2",
  7: "ruby-3.4.1",
  8: "php-8.3.12",
  9: "rust-1.82.0"
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user._id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user._id;

  const now = Date.now();
  const userRequests = rateLimitStore[userId] || { count: 0, timestamp: now };
  if (now - userRequests.timestamp > RATE_LIMIT_DURATION) {
    userRequests.count = 1;
    userRequests.timestamp = now;
  } else {
    userRequests.count++;
  }
  rateLimitStore[userId] = userRequests;

  if (userRequests.count > RATE_LIMIT_COUNT) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json() as CodeExecutionRequest;
    const { code, languageId, stdin } = body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json({ error: "Invalid or empty code provided" }, { status: 400 });
    }
    if (!languageId || typeof languageId !== "number") {
      return NextResponse.json({ error: "Invalid language ID provided" }, { status: 400 });
    }

    const compiler = WANDBOX_LANGUAGE_MAP[languageId];
    if (!compiler) {
      return NextResponse.json({ error: "Unsupported language ID" }, { status: 400 });
    }

    // Call Wandbox API (100% Free, NO API Key needed)
    const resp = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler: compiler,
        code: code,
        stdin: stdin || ""
      }),
    });

    if (!resp.ok) {
      console.error(`Wandbox API error: ${resp.status}`);
      return NextResponse.json({ error: `Execution Engine error (Status ${resp.status})` }, { status: resp.status });
    }

    const result = await resp.json();

    // Wandbox returns compiler_error, program_error, program_output etc.
    if (result.status !== "0" && result.compiler_error) {
      return NextResponse.json({ error: "Compilation error", details: result.compiler_error }, { status: 400 });
    }

    // Sometimes stderr is populated even if exit code is 0
    let finalOutput = "";
    if (result.program_output) finalOutput += result.program_output;
    else if (result.program_message) finalOutput += result.program_message; // Wandbox sends stdout + stderr mixed here
    if (result.program_error) finalOutput += "\n\nError:\n" + result.program_error;

    return NextResponse.json({
      output: finalOutput.trim() || "No output",
      status: "Completed"
    });

  } catch (error: unknown) {
    console.error("Code execution error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}