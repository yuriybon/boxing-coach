import { GoogleGenAI } from '@google/genai';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'fs'; // wait, need to fix imports

// Initialize the SDK
// Requires GEMINI_API_KEY to be set in the environment or in .env
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function runTest() {
  const inputFile = './tests/working-on-bag-audio.m4a';
  const trimmedFile = './tests/working-on-bag-audio-30s.m4a';

  console.log(`\n1. Extracting the first 30 seconds of ${inputFile}...`);
  try {
    // Overwrite if exists, extract first 30s
    execSync(`ffmpeg -y -i ${inputFile} -t 30 -c copy ${trimmedFile} 2>/dev/null`);
    console.log(`✅ Extraction complete. Saved to ${trimmedFile}`);
  } catch (err) {
    console.error(`❌ Failed to extract audio. Make sure ffmpeg is installed: ${err}`);
    process.exit(1);
  }

  console.log(`\n2. Uploading trimmed audio to Gemini...`);
  let uploadedFile;
  try {
    uploadedFile = await ai.files.upload({
      file: trimmedFile,
      config: { mimeType: 'audio/mp4' },
    });
    console.log(`✅ Upload complete. File URI: ${uploadedFile.uri}`);
  } catch (err) {
    console.error(`❌ Failed to upload file: ${err}`);
    process.exit(1);
  }

  // Wait for processing to complete if necessary
  console.log(`\n3. Waiting for file to be processed...`);
  while (true) {
    const fileInfo = await ai.files.get({ name: uploadedFile.name });
    if (fileInfo.state === 'ACTIVE') {
      console.log(`✅ File is ready.`);
      break;
    } else if (fileInfo.state === 'FAILED') {
      console.error(`❌ File processing failed.`);
      process.exit(1);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n4. Prompting Gemini 2.5 Flash...`);
  const prompt = `Listen to this training audio. 
1. Tell me exactly how many punches you hear hitting the heavy bag.
2. Briefly describe what the punches sound like (e.g., loud, sharp, thudding, combinations).
3. Do you hear any other sounds like breathing, footwork, or background noise?`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          fileData: {
            fileUri: uploadedFile.uri,
            mimeType: uploadedFile.mimeType,
          }
        },
        { text: prompt }
      ],
    });

    console.log(`\n🥊 === GEMINI'S RESPONSE === 🥊\n`);
    console.log(response.text);
    console.log(`\n==============================\n`);

  } catch (err) {
    console.error(`❌ Failed to generate content: ${err}`);
  } finally {
    console.log(`\n5. Cleaning up resources...`);
    try {
      await ai.files.delete({ name: uploadedFile.name });
      fs.unlinkSync(trimmedFile);
      console.log(`✅ Cleanup complete.`);
    } catch (cleanupErr) {
      console.error(`⚠️ Failed to clean up completely: ${cleanupErr}`);
    }
  }
}

runTest().catch(console.error);
