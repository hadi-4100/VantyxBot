import { NextResponse } from "next/server";
import config from "@config";
import fs from "fs";
import path from "path";

let memoryCache = null;
const CACHE_DIR = path.join(process.cwd(), "cache");
const CACHE_FILE = path.join(CACHE_DIR, "commands.json");

export async function GET() {
  try {
    const apiUrl = `${config.API_URL}:${config.API_PORT}/commands`;
    const response = await fetch(apiUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const data = await response.json();
      memoryCache = data;
      try {
        if (!fs.existsSync(CACHE_DIR)) {
          fs.mkdirSync(CACHE_DIR, { recursive: true });
        }
        fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
      } catch (e) {
        console.error("Failed to write commands cache file:", e);
      }
      return NextResponse.json(data);
    }

    throw new Error("API error");
  } catch (error) {
    if (memoryCache) return NextResponse.json(memoryCache);

    try {
      if (fs.existsSync(CACHE_FILE)) {
        const fileData = fs.readFileSync(CACHE_FILE, "utf-8");
        const data = JSON.parse(fileData);
        memoryCache = data;
        return NextResponse.json(data);
      }
    } catch (e) {
      console.error("Failed to read commands cache file:", e);
    }

    return NextResponse.json({});
  }
}
