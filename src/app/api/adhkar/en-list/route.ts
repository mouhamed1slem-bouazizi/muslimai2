import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";

export interface EnglishMenuItem {
  title: string;
  url: string;
}

function parseEnglishListFile(text: string): EnglishMenuItem[] {
  const lines = text.split(/\r?\n/);
  const items: EnglishMenuItem[] = [];
  let currentTitle: string | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const tMatch = line.match(/"TITLE"\s*:\s*"([^"]+)"/);
    if (tMatch) {
      currentTitle = tMatch[1].trim();
      continue;
    }
    const uMatch = line.match(/"TEXT"\s*:\s*"([^"]+)"/);
    if (uMatch && currentTitle) {
      const url = uMatch[1].trim();
      items.push({ title: currentTitle, url });
      currentTitle = null;
    }
  }

  // Deduplicate by url while keeping order
  const seen = new Set<string>();
  const unique = items.filter((it) => {
    if (seen.has(it.url)) return false;
    seen.add(it.url);
    return true;
  });
  return unique;
}

export async function GET() {
  try {
    // Expect the English list file to be in the project root
    const filePath = join(process.cwd(), "en api list.txt");
    const fileText = await fs.readFile(filePath, "utf8");
    const items = parseEnglishListFile(fileText);
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to read English menu list", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}