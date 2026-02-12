import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import path from 'path';

// Get the current module's file path
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
  '../../force-app/main/default/staticresources/appGridResource.js'
);

// Destination for the required meta.xml file
const metaFile = path.resolve(
  __dirname,
  '../../force-app/main/default/staticresources/appGridResource.resource-meta.xml'
);

// Content for the meta.xml file
const metaContent = `<?xml version="1.0" encoding="UTF-8"?>
<StaticResource xmlns="http://soap.sforce.com/2006/04/metadata">
    <cacheControl>Public</cacheControl>
    <contentType>application/javascript</contentType>
    <description>React application bundle for the AppGrid Aura component.</description>
</StaticResource>`;

async function copyAuraBundle() {
  try {
    // 1. Verify the build artifact exists
    const sourceFileExists = await fs.pathExists(sourceFile);
    if (!sourceFileExists) {
      console.error(
        `❌ BUILD FAILED: The source file was not found at ${sourceFile}`
      );
      console.error('Please check the Vite build output for errors.');
      process.exit(1);
    }
    console.log(`✅ Build artifact found at: ${sourceFile}`);

    // 2. Copy the JavaScript bundle
    await fs.copy(sourceFile, destFile, { overwrite: true });
    console.log(`✅ Copied Aura bundle to: ${destFile}`);

    // 3. Create the meta.xml file
    await fs.writeFile(metaFile, metaContent);
    console.log(`✅ Created meta.xml at: ${metaFile}`);

    console.log('🎉 Aura bundle copy process completed successfully.');
  } catch (error) {
    console.error('❌ Error copying Aura bundle:', error);
    process.exit(1);
  }
}

copyAuraBundle();
