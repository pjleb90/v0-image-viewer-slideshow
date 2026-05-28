import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");
const VALID_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];

export async function GET() {
  try {
    const folders: Record<string, string[]> = {};

    // Check if images directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      return NextResponse.json({ folders: {} });
    }

    // Read all subdirectories in the images folder
    const entries = fs.readdirSync(IMAGES_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const folderPath = path.join(IMAGES_DIR, entry.name);
        const files = fs.readdirSync(folderPath);

        // Filter for valid image files
        const imageFiles = files
          .filter((file) => {
            const ext = path.extname(file).toLowerCase();
            return VALID_EXTENSIONS.includes(ext);
          })
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
          .map((file) => `/images/${entry.name}/${file}`);

        if (imageFiles.length > 0) {
          folders[entry.name] = imageFiles;
        }
      }
    }

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Error scanning image folders:", error);
    return NextResponse.json({ folders: {} }, { status: 500 });
  }
}
