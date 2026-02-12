import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import archiver from 'archiver';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source: The single JS file output by the Vite build for Aura
const sourceFile = path.resolve(
  __dirname,
  '../dist/aura/appGridAuraComponent.js'
);

// Destination: The static resource file that will be deployed to Salesforce
const destFile = path.resolve(
  __dirname,
  '../../force-app/main/default/staticresources/appGridResource.zip'
);

// Destination for the required meta.xml file
const metaFile = destFile + '-meta.xml';

const metaContent = `<?xml version="1.0" encoding="UTF-8"?>
<StaticResource xmlns="http://soap.sforce.com/2006/04/metadata">
    <cacheControl>Public</cacheControl>
    <contentType>application/zip</contentType>
    <description>React application bundle for the AppGrid Aura component.</description>
</StaticResource>`;

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(2)} ${units[i]}`;
}

async function zipAuraBundle() {
  try {
    // 1. Ensure the source file exists
    const sourceFileExists = await fs.pathExists(sourceFile);
    if (!sourceFileExists) {
      console.error(
        `❌ BUILD FAILED: The source file was not found at ${sourceFile}`
      );
      console.error('Please check the Vite build output for errors.');
      process.exit(1);
    }
    console.log(`✅ Build artifact found at: ${sourceFile}`);

    // 2. Get original file size
    const sourceStats = await fs.stat(sourceFile);
    console.log(
      `📄 Original file size: ${formatBytes(sourceStats.size)} (${sourceStats.size} bytes)`
    );

    // 3. Ensure the destination directory exists
    await fs.ensureDir(path.dirname(destFile));

    // 4. Create a file to stream archive data to
    const output = fs.createWriteStream(destFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    const archivePromise = new Promise((resolve, reject) => {
      output.on('close', async () => {
        const size = archive.pointer();
        console.log(`✅ Zipped Aura bundle to: ${destFile}`);
        console.log(`📦 Zip size: ${formatBytes(size)} (${size} bytes)`);

        // Calculate compression ratio
        const ratio = ((size / sourceStats.size) * 100).toFixed(2);
        console.log(`📉 Compression ratio: ${ratio}%`);

        resolve();
      });
      archive.on('error', (err) => reject(err));
    });

    archive.pipe(output);
    archive.file(sourceFile, { name: 'appGridAuraComponent.js' });
    await archive.finalize();
    await archivePromise;

    // 5. Ensure meta.xml directory exists and write file
    await fs.ensureDir(path.dirname(metaFile));
    await fs.writeFile(metaFile, metaContent);
    console.log(`✅ Created meta.xml at: ${metaFile}`);

    console.log('🎉 Aura bundle zip process completed successfully.');
  } catch (error) {
    console.error('❌ Error zipping Aura bundle:', error);
    process.exit(1);
  }
}

zipAuraBundle();
