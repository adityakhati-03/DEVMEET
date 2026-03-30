import { NextResponse } from "next/server";

const SUPPORTED_LANGUAGES = [
  { id: 1, name: "JavaScript" },
  { id: 2, name: "Python" },
  { id: 3, name: "C" },
  { id: 4, name: "C++" },
  { id: 5, name: "Java" },
  { id: 6, name: "Go" },
  { id: 7, name: "Ruby" },
  { id: 8, name: "PHP" },
  { id: 9, name: "Rust" },
];

export async function GET() {
  try {
    return NextResponse.json(SUPPORTED_LANGUAGES, { status: 200 });
  } catch (error: unknown) {
    console.error("Languages API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
