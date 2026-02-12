import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get the current module's file path
const __filename = fileURLToPath(import.meta.url);

// Derive the directory containing the current module
const __dirname = path.dirname(__filename);

// Define the relative paths to the output directory
const outputDir = path.resolve(
  __dirname,
  "../../force-app/main/default/staticresources/appGridStaticResource"
);

// Match files that start with 'index'
const pattern = /^index/; // Adjust the pattern if needed

// Function to recursively delete files matching the pattern
async function deleteMatchingFiles(directory) {
  try {
    const items = await fs.readdir(directory, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(directory, item.name);

      if (item.isDirectory()) {
        // Recurse into subdirectory
        await deleteMatchingFiles(itemPath);
      } else if (pattern.test(item.name)) {
        // Delete files matching the pattern
        await fs.unlink(itemPath);
        console.log(`Permanently Deleted: ${itemPath}`);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${directory}:`, error);
  }
}

// Start the deletion process
await deleteMatchingFiles(outputDir);
