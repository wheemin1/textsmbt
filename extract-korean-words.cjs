const fs = require('fs');
const readline = require('readline');

async function extractKoreanWords() {
  const fileStream = fs.createReadStream('data/fasttext/cc.ko.300.vec');
  const rl = readline.createInterface({ input: fileStream });
  
  const koreanWords = [];
  let lineCount = 0;
  
  console.log('🔍 FastText에서 한국어 단어 추출 중...');
  
  for await (const line of rl) {
    if (lineCount === 0) { lineCount++; continue; }
    
    const word = line.split(' ')[0];
    if (/^[가-힣]+$/.test(word) && word.length >= 2 && word.length <= 10) {
      koreanWords.push(word);
    }
    
    lineCount++;
    if (lineCount % 50000 === 0) {
      console.log(`Processed ${lineCount} lines, found ${koreanWords.length} Korean words...`);
    }
    
    if (koreanWords.length >= 10000) break; // 10,000개만 추출
  }
  
  console.log(`✅ Total Korean words found: ${koreanWords.length}`);
  fs.writeFileSync('data/korean_words_large.txt', koreanWords.join('\n'));
  console.log('📝 Saved to data/korean_words_large.txt');
  
  return koreanWords.length;
}

extractKoreanWords().catch(console.error);
