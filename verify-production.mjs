import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = process.cwd();
const testDir = path.join(rootDir, 'prod-verification');

console.log(`
🚀 Starting Production Build Verification in: ${testDir}
`);

// 1. Clean & Create Directory
if (fs.existsSync(testDir)) {
  console.log("🧹 Cleaning previous verification directory...");
  fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir);

// 2. Copy Files (Simulating Docker COPY)
console.log("VX Copying source files...");
const filesToCopy = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'server.ts',
  '.env',
  'index.html',
  'vite.config.ts',
];

filesToCopy.forEach(f => {
  if (fs.existsSync(path.join(rootDir, f))) {
    fs.copyFileSync(path.join(rootDir, f), path.join(testDir, f));
  }
});

// Copy src directory recursively
fs.cpSync(path.join(rootDir, 'src'), path.join(testDir, 'src'), { recursive: true });

process.chdir(testDir);

try {
  // 3. Install All Dependencies (Builder Stage)
  console.log("\nInstalling ALL dependencies (Builder Stage)...");
  execSync('npm install', { stdio: 'inherit' });

  // 4. Build Frontend
  console.log("\nBuilding frontend...");
  execSync('npm run build', { stdio: 'inherit' });

  // 5. Simulate Production Install (Runner Stage)
  console.log("\nSimulating Production Install (Removing devDeps)...");
  fs.rmSync(path.join(testDir, 'node_modules'), { recursive: true, force: true });
  
  // NOTE: This is where we verify if 'tsx' and 'vite' (if needed) are installed
  execSync('npm install --omit=dev', { stdio: 'inherit' });

  // 6. Verify Critical Files
  console.log("\nVerifying critical files...");
  if (!fs.existsSync(path.join(testDir, 'dist', 'index.html'))) {
    throw new Error("❌ Frontend build failed: dist/index.html missing!");
  }
  
  // Check for tsx binary
  const tsxPath = path.join(testDir, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
  if (!fs.existsSync(tsxPath)) {
    throw new Error(`❌ 'tsx' binary missing in production modules! Path: ${tsxPath}`);
  }
  console.log("✅ 'tsx' binary found.");

    // 7. Attempt to Start Server
    console.log("\nAttempting to start the server (Production Mode)...");
    console.log("   (Press Ctrl+C to stop if it runs successfully)");
  
    const env = { ...process.env, NODE_ENV: 'production', PORT: '3000' };
    
    // Use 'node' to run 'tsx' directly to avoid 'npm start' script syntax issues on Windows
    // Docker runs: "npm start" -> "NODE_ENV=production tsx server.ts"
      // Here we run:
      console.log("   Using TSX at:", tsxPath);
      const server = spawn(tsxPath, ['server.ts'], { 
        env, 
        stdio: 'inherit',
        cwd: testDir,
        shell: true
      });  
    server.on('error', (err) => {
      console.error("\nServer failed to start:", err);
    });
  
    server.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`\nServer exited with code ${code}`);
      }
    });
  
    // Keep alive for a bit to let user see
    // User has to kill it manually or we timeout?
    // Let's rely on user killing it.
  
  } catch (error) {
    console.error("\nVERIFICATION FAILED:", error.message);
    process.exit(1);
  }
