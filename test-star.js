// 별 단어 테스트
async function testStar() {
  try {
    const response = await fetch('http://localhost:3000/api/words/similarity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word1: '별',
        word2: '우주'
      })
    });
    
    const result = await response.json();
    console.log('별 vs 우주:', result);
    
    // 더 많은 테스트
    const tests = [
      ['별', '달'],
      ['별', '태양'],
      ['별', '하늘'],
      ['별', '음식'], // 관련 없는 단어
    ];
    
    for (const [w1, w2] of tests) {
      const res = await fetch('http://localhost:3000/api/words/similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word1: w1, word2: w2 })
      });
      const data = await res.json();
      console.log(`${w1} vs ${w2}: ${data.similarity}점`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testStar();
