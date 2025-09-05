#!/usr/bin/env node
// Cross-platform FastText download script for Netlify deployment

import fs from 'fs';
import path from 'path';
import https from 'https';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';

const FASTTEXT_URL = 'https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.ko.300.vec.gz';
const FASTTEXT_DIR = path.join(process.cwd(), 'data', 'fasttext');
const FASTTEXT_COMPRESSED = path.join(FASTTEXT_DIR, 'cc.ko.300.vec.gz');
const FASTTEXT_FILE = path.join(FASTTEXT_DIR, 'cc.ko.300.vec');

async function downloadFastText() {
  console.log('🚀 Starting FastText download for Korean vectors...');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(FASTTEXT_DIR)) {
    fs.mkdirSync(FASTTEXT_DIR, { recursive: true });
  }
  
  // Check if already exists
  if (fs.existsSync(FASTTEXT_FILE)) {
    console.log('✅ FastText file already exists');
    return;
  }
  
  console.log('📥 Downloading FastText Korean vectors...');
  console.log('⚠️ This may take 10-15 minutes (1.2GB download)...');
  
  try {
    // Download compressed file
    await downloadFile(FASTTEXT_URL, FASTTEXT_COMPRESSED);
    console.log('✅ Download completed');
    
    // Decompress
    console.log('📦 Decompressing...');
    await decompressFile(FASTTEXT_COMPRESSED, FASTTEXT_FILE);
    console.log('✅ Decompression completed');
    
    // Clean up compressed file
    fs.unlinkSync(FASTTEXT_COMPRESSED);
    console.log('🧹 Cleanup completed');
    
    console.log('🎉 FastText setup completed successfully!');
    
  } catch (error) {
    console.error('❌ FastText download failed:', error);
    process.exit(1);
  }
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    let downloadedBytes = 0;
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      const totalBytes = parseInt(response.headers['content-length'] || '0');
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const progress = ((downloadedBytes / totalBytes) * 100).toFixed(1);
          process.stdout.write(`\r📊 Progress: ${progress}% (${Math.round(downloadedBytes / 1024 / 1024)}MB/${Math.round(totalBytes / 1024 / 1024)}MB)`);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n✅ Download finished');
        resolve();
      });
      
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function decompressFile(source, destination) {
  const readStream = fs.createReadStream(source);
  const writeStream = fs.createWriteStream(destination);
  const gunzip = createGunzip();
  
  await pipeline(readStream, gunzip, writeStream);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadFastText().catch(console.error);
}

export { downloadFastText };
