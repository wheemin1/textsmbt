/**
 * 벡터 DB 테스트 및 상태 확인 스크립트
 * Netlify Functions 벡터 저장소 동작 검증
 */

// 기대값 충족 여부 확인
function checkExpectation(actual, expected) {
  if (expected.includes('+')) {
    const threshold = parseFloat(expected.replace('+', ''));
    return actual >= threshold;
  } else if (expected.includes('<')) {
    const threshold = parseFloat(expected.replace('<', ''));
    return actual < threshold;
  } else {
    // 정확한 값 매치
    const target = parseFloat(expected);
    return Math.abs(actual - target) < 1.0; // ±1.0 허용범위
  }
}

// 벡터 DB 상태 확인
async function checkVectorDBStatus() {
  try {
    console.log('🔍 Checking vector DB status...');
    
    const response = await fetch('/.netlify/functions/vector-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status' })
    });
    
    const result = await response.json();
    console.log('✅ Vector DB Status:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Vector DB Status Check Failed:', error);
    return null;
  }
}

// 실제 벡터 유사도 테스트
async function testVectorSimilarity() {
  console.log('🎯 Testing vector similarity calculations...');
  
  const testCases = [
    // 시간 클러스터 (높은 유사도 예상)
    { word1: '시간', word2: '시계', expected: '85+' },
    { word1: '시간', word2: '분', expected: '70+' },
    { word1: '시간', word2: '초', expected: '65+' },
    
    // 교육 클러스터 (높은 유사도 예상)
    { word1: '학교', word2: '교육', expected: '80+' },
    { word1: '학교', word2: '학생', expected: '75+' },
    { word1: '교육', word2: '공부', expected: '70+' },
    
    // 결과 클러스터 (중간 유사도 예상)
    { word1: '결과', word2: '성과', expected: '70+' },
    { word1: '결과', word2: '완료', expected: '65+' },
    
    // 클러스터 간 (낮은 유사도 예상)
    { word1: '시간', word2: '학교', expected: '<30' },
    { word1: '학교', word2: '음식', expected: '<25' },
    { word1: '결과', word2: '건강', expected: '<20' }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const response = await fetch('/.netlify/functions/vector-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'similarity',
          word1: testCase.word1,
          word2: testCase.word2
        })
      });
      
      const result = await response.json();
      const similarity = result.similarityPercent || 0;
      
      const testResult = {
        ...testCase,
        actualScore: similarity.toFixed(2),
        success: response.ok,
        meetsExpectation: checkExpectation(similarity, testCase.expected)
      };
      
      results.push(testResult);
      console.log(`${testResult.meetsExpectation ? '✅' : '❌'} ${testCase.word1}↔${testCase.word2}: ${similarity.toFixed(2)}% (expected: ${testCase.expected})`);
      
    } catch (error) {
      console.error(`❌ Failed to test ${testCase.word1}↔${testCase.word2}:`, error);
      results.push({
        ...testCase,
        actualScore: 'ERROR',
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// 기대값 충족 여부 확인
function checkExpectation(actual, expected) {
  if (expected.includes('+')) {
    const threshold = parseFloat(expected.replace('+', ''));
    return actual >= threshold;
  } else if (expected.includes('<')) {
    const threshold = parseFloat(expected.replace('<', ''));
    return actual < threshold;
  }
  return false;
}

// 통계 생성 테스트
async function testStatisticsGeneration() {
  console.log('📊 Testing statistics generation...');
  
  try {
    const response = await fetch('/.netlify/functions/similarity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word1: '학교',
        word2: '교육',
        gameId: 'test-game-stats'
      })
    });
    
    const result = await response.json();
    console.log('✅ Statistics Generation Result:', result);
    
    if (result.stats) {
      console.log(`📈 Generated Stats:
        - Top: ${result.stats.top}
        - Top10: ${result.stats.top10}  
        - Rest: ${result.stats.rest}
        - Frequent Words: ${result.frequentWordsCount}`);
      
      return {
        success: true,
        stats: result.stats,
        wordCount: result.frequentWordsCount
      };
    } else {
      console.log('⚠️ No statistics generated');
      return { success: false };
    }
    
  } catch (error) {
    console.error('❌ Statistics generation failed:', error);
    return { success: false, error: error.message };
  }
}

// 전체 테스트 실행
async function runFullTest() {
  console.log('🚀 Starting comprehensive vector DB test...\n');
  
  // 1. 상태 확인
  const dbStatus = await checkVectorDBStatus();
  console.log('\n' + '='.repeat(50));
  
  // 2. 유사도 테스트  
  const similarityResults = await testVectorSimilarity();
  console.log('\n' + '='.repeat(50));
  
  // 3. 통계 생성 테스트
  const statsResults = await testStatisticsGeneration();
  console.log('\n' + '='.repeat(50));
  
  // 결과 요약
  console.log('\n🎯 TEST SUMMARY:');
  console.log(`Vector DB Status: ${dbStatus ? '✅ Active' : '❌ Failed'}`);
  
  if (dbStatus) {
    console.log(`Available Words: ${dbStatus.cacheSize}`);
    console.log(`Words: ${dbStatus.availableWords.join(', ')}`);
  }
  
  const passedTests = similarityResults.filter(r => r.meetsExpectation).length;
  console.log(`Similarity Tests: ${passedTests}/${similarityResults.length} passed`);
  
  console.log(`Statistics Generation: ${statsResults.success ? '✅ Working' : '❌ Failed'}`);
  
  if (statsResults.success) {
    console.log(`Words Used for Stats: ${statsResults.wordCount}`);
  }
  
  return {
    dbStatus,
    similarityResults,
    statsResults,
    overallSuccess: dbStatus && passedTests > similarityResults.length * 0.7 && statsResults.success
  };
}

// 브라우저에서 실행할 수 있도록 전역 함수로 노출
if (typeof window !== 'undefined') {
  window.testVectorDB = runFullTest;
  window.checkVectorStatus = checkVectorDBStatus;
  window.testSimilarity = testVectorSimilarity;
}

// Node.js 환경에서 직접 실행
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runFullTest, checkVectorDBStatus, testVectorSimilarity };
}

console.log('🔧 Vector DB Test Suite loaded. Run testVectorDB() to start testing.');

// ES Module exports
export {
  testVectorDB,
  checkVectorDBStatus,
  testVectorSimilarity,
  testClusterSeparation,
  testStatisticsGeneration
};

// 직접 실행 감지 (ES Module 방식)
if (import.meta.url === `file://${process.argv[1]}`) {
  testVectorDB();
}
