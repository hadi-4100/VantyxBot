import { NextResponse } from "next/server";
import config from "@config";
import fs from "fs";
import path from "path";

let memoryCache = null;
const CACHE_DIR = path.join(process.cwd(), "cache");
const CACHE_FILE = path.join(CACHE_DIR, "stats.json");

export async function GET() {
  try {
    const apiUrl = `${config.API_URL}:${config.API_PORT}/stats`;
    const response = await fetch(apiUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
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
        console.error("Failed to write stats cache file:", e);
      }
      return NextResponse.json(data);
    }

    throw new Error("API returned error status");
  } catch (error) {
    console.warn(
      "Proxy Stats: API offline or error, serving from cache.",
      error.message,
    );
    if (memoryCache) {
      return NextResponse.json({ ...memoryCache, isOffline: true });
    }

    try {
      if (fs.existsSync(CACHE_FILE)) {
        const fileData = fs.readFileSync(CACHE_FILE, "utf-8");
        const data = JSON.parse(fileData);
        memoryCache = data;
        return NextResponse.json({ ...data, isOffline: true });
      }
    } catch (e) {
      console.error("Failed to read stats cache file:", e);
    }

    return NextResponse.json({
      totalGuilds: 0,
      totalUsers: 0,
      totalCommands: 0,
      uptime: 0,
      isOffline: true,
    });
  }
}
