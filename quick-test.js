// 벡터 DB 간단 테스트
console.log('🧪 Testing Vector DB via similarity.js endpoint...');

async function testSimilarityEndpoint() {
  try {
    console.log('📏 Testing 시간 vs 시계 similarity...');
    
    const response = await fetch('http://localhost:3000/api/similarity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: '시계',
        targetWord: '시간'
      })
    });
    
    const result = await response.json();
    console.log('✅ Similarity result:', result);
    
    if (result.similarity > 80) {
      console.log('🎯 SUCCESS: 시간-시계 similarity is', result.similarity, '(> 80 expected)');
    } else {
      console.log('❌ ISSUE: 시간-시계 similarity is only', result.similarity, '(expected > 80)');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimilarityEndpoint();
