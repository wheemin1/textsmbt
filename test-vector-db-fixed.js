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
    
    const response = await fetch('http://localhost:8888/.netlify/functions/vector-db', {
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

// 벡터 유사도 계산 테스트  
async function testVectorSimilarity() {
  console.log('📏 Testing vector similarity calculations...');
  
  const testCases = [
    { word1: '시간', word2: '시계', expected: '85+' },  // 시간 관련 단어들
    { word1: '시간', word2: '시각', expected: '80+' },
    { word1: '시간', word2: '순간', expected: '75+' },
    { word1: '시계', word2: '벽시계', expected: '90+' },
    { word1: '학교', word2: '교육', expected: '80+' },  // 교육 관련
    { word1: '사과', word2: '바나나', expected: '70+' }, // 과일 관련
    { word1: '컴퓨터', word2: '전화', expected: '60+' }, // 전자기기
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const response = await fetch('http://localhost:8888/.netlify/functions/vector-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'similarity',
          word1: testCase.word1,
          word2: testCase.word2
        })
      });
      
      const result = await response.json();
      const similarity = result.similarity;
      const meetsExpectation = checkExpectation(similarity, testCase.expected);
      
      const testResult = {
        ...testCase,
        actualScore: similarity,
        success: response.ok,
        meetsExpectation
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

// 클러스터 분리 테스트 (시간 관련 vs 과일 유사도 <30)
async function testClusterSeparation() {
  console.log('🔬 Testing cluster separation...');
  
  const crossClusterTests = [
    { word1: '시간', word2: '사과', expected: '<30' },
    { word1: '시계', word2: '바나나', expected: '<30' },
    { word1: '순간', word2: '사과', expected: '<30' },
    { word1: '시각', word2: '바나나', expected: '<30' }
  ];
  
  const results = [];
  
  for (const testCase of crossClusterTests) {
    try {
      const response = await fetch('http://localhost:8888/.netlify/functions/vector-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'similarity',
          word1: testCase.word1,
          word2: testCase.word2
        })
      });
      
      const result = await response.json();
      const similarity = result.similarity;
      const meetsExpectation = checkExpectation(similarity, testCase.expected);
      
      const testResult = {
        ...testCase,
        actualScore: similarity,
        success: response.ok,
        meetsExpectation
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

// 통계 생성 테스트
async function testStatisticsGeneration() {
  console.log('📊 Testing statistics generation...');
  
  try {
    const response = await fetch('http://localhost:8888/.netlify/functions/vector-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'stats',
        word1: '시간'
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.stats) {
      console.log('✅ Statistics generation successful:');
      console.log(`   Top similarity: ${result.stats.topPercent.toFixed(2)}%`);
      console.log(`   Top-10 similarity: ${result.stats.top10Percent.toFixed(2)}%`);
      console.log(`   Rest similarity: ${result.stats.restPercent.toFixed(2)}%`);
      console.log(`   Total words analyzed: ${result.totalWords}`);
      
      // 통계 유효성 검증
      const validStats = result.stats.topPercent > result.stats.top10Percent && 
                         result.stats.top10Percent > result.stats.restPercent &&
                         result.totalWords >= 10;
      
      return {
        success: true,
        stats: result.stats,
        totalWords: result.totalWords,
        valid: validStats
      };
      
    } else {
      console.error('❌ Statistics generation failed:', result);
      return { success: false, error: result };
    }
    
  } catch (error) {
    console.error('❌ Statistics test error:', error);
    return { success: false, error: error.message };
  }
}

// 포괄적 벡터 DB 테스트 실행
async function testVectorDB() {
  console.log('🧪 Starting comprehensive Vector DB test suite...\n');
  
  // 1단계: 상태 확인
  const status = await checkVectorDBStatus();
  if (!status) {
    console.error('❌ Vector DB is not responding. Cannot proceed with tests.');
    return;
  }
  
  // 2단계: 유사도 계산 테스트
  console.log('\n📏 Testing vector similarity calculations...');
  const similarityResults = await testVectorSimilarity();
  
  // 3단계: 클러스터 분리 테스트  
  console.log('\n🔬 Testing cluster separation...');
  const separationResults = await testClusterSeparation();
  
  // 4단계: 통계 생성 테스트
  console.log('\n📊 Testing statistics generation...');
  const statsResults = await testStatisticsGeneration();
  
  // 결과 요약
  console.log('\n📋 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Vector DB Status: ${status ? 'OK' : 'FAILED'}`);
  
  const passedSimilarity = similarityResults.filter(r => r.meetsExpectation).length;
  console.log(`✅ Similarity Tests: ${passedSimilarity}/${similarityResults.length} passed`);
  
  const passedSeparation = separationResults.filter(r => r.meetsExpectation).length;
  console.log(`✅ Cluster Separation: ${passedSeparation}/${separationResults.length} passed`);
  
  console.log(`✅ Statistics Generation: ${statsResults.success ? 'PASSED' : 'FAILED'}`);
  
  const allTestsPassed = passedSimilarity === similarityResults.length && 
                         passedSeparation === separationResults.length && 
                         statsResults.success;
  
  console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!allTestsPassed) {
    console.log('\n🔧 Review failed tests above for debugging information.');
  }
  
  return {
    status,
    similarity: similarityResults,
    separation: separationResults,
    statistics: statsResults,
    allPassed: allTestsPassed
  };
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
