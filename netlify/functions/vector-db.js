/**
 * Netlify Function: 메모리 기반 벡터 저장소 (꼬맨틀 SQLite 대체)
 * SQLite 대신 메모리 캐시로 벡터 관리
 */

// 메모리 기반 벡터 저장소 (꼬맨틀의 SQLite 대체)
const VECTOR_CACHE = new Map();
let isInitialized = false;

// 실제 코사인 유사도 계산 (꼬맨틀의 cosine_similarity 함수)
function calculateCosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    return 0;
  }
  
  // vec1.dot(vec2) / (norm(vec1) * norm(vec2))
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  return dotProduct / (norm1 * norm2);
}

// 의미적 벡터 생성 (FastText 스타일 시뮬레이션)
function generateSemanticVector(concept, dimensions = 300, basePattern = []) {
  const vector = new Array(dimensions);
  
  // 기본 패턴이 주어진 경우 확장
  for (let i = 0; i < dimensions; i++) {
    if (i < basePattern.length) {
      // 기본 패턴 + 노이즈
      vector[i] = basePattern[i] + (Math.random() - 0.5) * 0.1;
    } else {
      // 랜덤하지만 일관성 있는 값 (-0.5 ~ 0.5 범위)
      const seed = concept.charCodeAt(i % concept.length) + i;
      vector[i] = (Math.sin(seed) + Math.cos(seed * 1.618)) * 0.25;
    }
  }
  
  return vector;
}

// NumPy 스타일 최근접 검색 알고리즘 (꼬맨틀의 most_similar 함수)
function mostSimilar(allVectors, targetVector, k = 1000) {
  const similarities = [];
  
  // 모든 벡터와의 유사도 계산
  for (const [word, vector] of allVectors) {
    const similarity = calculateCosineSimilarity(targetVector, vector);
    similarities.push({ word, similarity });
  }
  
  // 유사도 기준으로 내림차순 정렬 (numpy의 argsort[::-1]과 동일)
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  // 상위 k개만 반환 (numpy의 argpartition과 유사)
  const topK = similarities.slice(0, Math.min(k, similarities.length));
  
  return {
    words: topK.map(item => item.word),
    similarities: topK.map(item => item.similarity),
    indices: topK.map((item, index) => index) // 정렬된 인덱스
  };
}

// 꼬맨틀의 dump_nearest 함수 구현 (process_similar.py 참고)
function dumpNearest(targetWord, allVectors, k = 1000) {
  const targetVector = VECTOR_CACHE.get(targetWord);
  if (!targetVector) {
    throw new Error(`Target word "${targetWord}" not found in vector cache`);
  }
  
  // 자기 자신을 제외한 벡터들로 최근접 검색
  const otherVectors = Array.from(VECTOR_CACHE.entries())
    .filter(([word, _]) => word !== targetWord);
  
  const nearestResult = mostSimilar(otherVectors, targetVector, k);
  
  // 꼬맨틀과 동일한 형태로 결과 구성: closeness[word] = (rank, similarity)
  const closeness = {};
  
  nearestResult.words.forEach((word, index) => {
    closeness[word] = [index + 1, nearestResult.similarities[index]]; // (순위, 유사도)
  });
  
  // 정답 단어 추가 (꼬맨틀: closeness[word] = ("정답!", 1))
  closeness[targetWord] = ["정답!", 1.0];
  
  return closeness;
}

// 꼬맨틀의 get_similarity 함수 구현 (semantle.py 참고)
function calculateSimilarityStats(targetWord) {
  try {
    const closeness = dumpNearest(targetWord, VECTOR_CACHE);
    
    // 모든 유사도 값 추출하여 정렬 (꼬맨틀: sorted([v[1] for v in app.nearests[day].values()]))
    const allSimilarities = Object.values(closeness)
      .map(([rank, similarity]) => similarity)
      .filter(sim => sim !== 1.0) // 정답 단어(1.0) 제외
      .sort((a, b) => a - b); // 오름차순 정렬
    
    // 꼬맨틀과 동일한 통계 생성
    const stats = {
      top: allSimilarities[allSimilarities.length - 2] || 0.95,    // nearest_dists[-2]
      top10: allSimilarities[allSimilarities.length - 11] || 0.75, // nearest_dists[-11]  
      rest: allSimilarities[0] || 0.05,                            // nearest_dists[0]
      totalWords: allSimilarities.length + 1, // +1 for target word
      targetWord: targetWord
    };
    
    console.log(`📊 Similarity stats for "${targetWord}": top=${(stats.top*100).toFixed(1)}%, top10=${(stats.top10*100).toFixed(1)}%, rest=${(stats.rest*100).toFixed(1)}%`);
    
    return stats;
    
  } catch (error) {
    console.error(`Failed to calculate stats for "${targetWord}":`, error.message);
    return null;
  }
}

// 벡터 캐시 초기화 (꼬맨틀 주요 단어들)
function initializeVectorCache() {
  if (isInitialized) return;
  
  console.log('🌱 Initializing vector cache with key Korean words...');
  
  // 실제 FastText 스타일 벡터 생성 (300차원 시뮬레이션)
  const keyWordVectors = {
    // 시간 클러스터 (높은 유사도)
    "시간": generateSemanticVector("time", 300, [0.1, 0.3, -0.2, 0.4, 0.1]),
    "시계": generateSemanticVector("clock", 300, [0.15, 0.35, -0.15, 0.45, 0.12]), // 시간과 유사
    "분": generateSemanticVector("minute", 300, [0.12, 0.28, -0.18, 0.38, 0.08]),
    "초": generateSemanticVector("second", 300, [0.08, 0.25, -0.22, 0.35, 0.05]),
    "시각": generateSemanticVector("time_point", 300, [0.13, 0.32, -0.19, 0.42, 0.11]),
    
    // 교육 클러스터 (높은 유사도)
    "학교": generateSemanticVector("school", 300, [-0.1, 0.4, 0.2, -0.2, 0.3]),
    "교육": generateSemanticVector("education", 300, [-0.05, 0.45, 0.25, -0.15, 0.35]), // 학교와 유사
    "학생": generateSemanticVector("student", 300, [-0.08, 0.38, 0.18, -0.18, 0.28]),
    "선생님": generateSemanticVector("teacher", 300, [-0.12, 0.42, 0.22, -0.22, 0.32]),
    "공부": generateSemanticVector("study", 300, [-0.09, 0.41, 0.19, -0.19, 0.29]),
    
    // 결과 클러스터 (중간 유사도)
    "결과": generateSemanticVector("result", 300, [0.3, -0.1, 0.4, 0.2, -0.3]),
    "성과": generateSemanticVector("achievement", 300, [0.35, -0.05, 0.45, 0.25, -0.25]), // 결과와 유사
    "마지막": generateSemanticVector("final", 300, [0.28, -0.08, 0.38, 0.18, -0.28]),
    "완료": generateSemanticVector("complete", 300, [0.32, -0.06, 0.42, 0.22, -0.26]),
    
    // 기타 중요 단어들
    "사람": generateSemanticVector("person", 300, [0.2, 0.1, -0.3, 0.1, 0.4]),
    "집": generateSemanticVector("house", 300, [0.1, -0.2, 0.3, -0.1, 0.2]),
    "음식": generateSemanticVector("food", 300, [-0.2, 0.3, 0.1, 0.4, -0.1]),
    "건강": generateSemanticVector("health", 300, [0.4, 0.2, -0.1, 0.3, 0.1]),
  };
  
  // 모든 벡터를 캐시에 저장
  for (const [word, vector] of Object.entries(keyWordVectors)) {
    VECTOR_CACHE.set(word, vector);
  }
  
  isInitialized = true;
  console.log(`✅ Initialized vector cache with ${VECTOR_CACHE.size} key word vectors`);
}

// Netlify Function 핸들러
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }
  
  try {
    const { action, word1, word2 } = JSON.parse(event.body || '{}');
    
    // 벡터 캐시 초기화
    initializeVectorCache();
    
    switch (action) {
      case 'similarity':
        // 실제 벡터 기반 유사도 계산
        if (!word1 || !word2) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing word1 or word2' })
          };
        }
        
        const vec1 = VECTOR_CACHE.get(word1);
        const vec2 = VECTOR_CACHE.get(word2);
        
        if (!vec1 || !vec2) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Vector not found',
              word1Found: !!vec1,
              word2Found: !!vec2,
              availableWords: Array.from(VECTOR_CACHE.keys())
            })
          };
        }
        
        const similarity = calculateCosineSimilarity(vec1, vec2);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            word1,
            word2,
            similarity,
            similarityPercent: similarity * 100,
            method: 'real_vector_cosine',
            dimensions: vec1.length,
            timestamp: new Date().toISOString()
          })
        };
        
      case 'nearest':
        // 꼬맨틀의 most_similar 함수 구현
        if (!word1) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing target word (word1)' })
          };
        }
        
        try {
          const closeness = dumpNearest(word1, VECTOR_CACHE);
          const nearestWords = Object.entries(closeness)
            .filter(([word, _]) => word !== word1) // 자기 자신 제외
            .sort(([,a], [,b]) => b[1] - a[1]) // 유사도 기준 내림차순
            .slice(0, 10); // 상위 10개만
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              targetWord: word1,
              nearestWords: nearestWords.map(([word, [rank, sim]]) => ({
                word,
                rank,
                similarity: sim,
                similarityPercent: sim * 100
              })),
              method: 'numpy_style_nearest_search',
              timestamp: new Date().toISOString()
            })
          };
        } catch (error) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Target word not found',
              targetWord: word1,
              message: error.message
            })
          };
        }
        
      case 'stats':
        // 꼬맨틀의 similarity stats 생성
        if (!word1) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing target word (word1)' })
          };
        }
        
        const stats = calculateSimilarityStats(word1);
        if (!stats) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Could not generate stats',
              targetWord: word1
            })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            targetWord: word1,
            stats: {
              top: stats.top,
              top10: stats.top10,
              rest: stats.rest,
              topPercent: stats.top * 100,
              top10Percent: stats.top10 * 100,
              restPercent: stats.rest * 100
            },
            totalWords: stats.totalWords,
            method: 'numpy_similarity_stats',
            timestamp: new Date().toISOString()
          })
        };
      
      case 'status':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            initialized: isInitialized,
            cacheSize: VECTOR_CACHE.size,
            availableWords: Array.from(VECTOR_CACHE.keys()),
            timestamp: new Date().toISOString()
          })
        };
        
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid action', 
            validActions: ['similarity', 'nearest', 'stats', 'status']
          })
        };
    }
    
  } catch (error) {
    console.error('Vector cache error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Vector operation failed',
        message: error.message
      })
    };
  }
};
