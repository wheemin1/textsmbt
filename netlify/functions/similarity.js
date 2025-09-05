/**
 * Netlify Function: 한국어 단어 유사도 계산
 * 
 * POST /.netlify/functions/similarity
 * Body: { word1: string, word2: string }
 * Response: { word1, word2, similarity }
 */

// 한국어 유사도 계산을 위한 개선된 알고리즘
function calculateKoreanSimilarity(word1, word2) {
  if (word1 === word2) return 100;
  
  // 1. 자모 분해를 통한 음성적 유사도
  const phonetic = calculatePhoneticSimilarity(word1, word2);
  
  // 2. 의미적 카테고리 기반 유사도
  const semantic = calculateSemanticSimilarity(word1, word2);
  
  // 3. 문자열 유사도 (편집 거리)
  const lexical = calculateLexicalSimilarity(word1, word2);
  
  // 가중 평균으로 최종 점수 계산
  const finalScore = (phonetic * 0.3) + (semantic * 0.5) + (lexical * 0.2);
  
  return Math.round(Math.min(95, Math.max(5, finalScore)));
}

// 자모 분해를 통한 음성적 유사도
function calculatePhoneticSimilarity(word1, word2) {
  const jamo1 = decomposeKorean(word1);
  const jamo2 = decomposeKorean(word2);
  
  let matches = 0;
  const maxLength = Math.max(jamo1.length, jamo2.length);
  
  for (let i = 0; i < Math.min(jamo1.length, jamo2.length); i++) {
    if (jamo1[i] === jamo2[i]) matches++;
  }
  
  return (matches / maxLength) * 100;
}

// 간단한 한글 자모 분해
function decomposeKorean(word) {
  const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  
  let result = '';
  for (let char of word) {
    const code = char.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const index = code - 0xAC00;
      const cho = Math.floor(index / (21 * 28));
      const jung = Math.floor((index % (21 * 28)) / 28);
      const jong = index % 28;
      result += CHO[cho] + JUNG[jung] + JONG[jong];
    } else {
      result += char;
    }
  }
  return result;
}

// 의미적 카테고리 기반 유사도
function calculateSemanticSimilarity(word1, word2) {
  // 미리 정의된 의미 카테고리 그룹
  const semanticGroups = {
    family: ['가족', '어머니', '아버지', '부모', '형제', '자매', '할머니', '할아버지', '엄마', '아빠', '형', '누나', '언니', '동생'],
    nature: ['자연', '나무', '꽃', '산', '바다', '강', '하늘', '별', '달', '태양', '구름', '비', '눈', '바람'],
    emotion: ['사랑', '행복', '기쁨', '슬픔', '화', '걱정', '평화', '희망', '꿈', '마음', '감정', '느낌'],
    food: ['음식', '밥', '국', '김치', '고기', '생선', '과일', '야채', '빵', '우유', '물', '차', '커피'],
    time: ['시간', '오늘', '어제', '내일', '아침', '점심', '저녁', '밤', '새벽', '년', '월', '일', '시', '분', '초'],
    place: ['집', '학교', '회사', '병원', '공원', '도서관', '카페', '식당', '극장', '마트', '은행', '우체국'],
    transport: ['자동차', '버스', '지하철', '기차', '비행기', '배', '자전거', '택시', '트럭', '오토바이'],
    study: ['공부', '학습', '교육', '책', '연필', '펜', '노트', '시험', '숙제', '과목', '수학', '과학', '영어', '국어'],
    work: ['일', '직업', '회사', '사장', '직원', '일자리', '급여', '월급', '업무', '프로젝트', '회의', '출근', '퇴근'],
    health: ['건강', '운동', '병원', '의사', '간호사', '약', '치료', '수술', '검사', '진료', '예방', '회복'],
    tech: ['컴퓨터', '인터넷', '휴대폰', '스마트폰', '소프트웨어', '프로그램', '앱', '웹사이트', '기술', '과학'],
    sports: ['운동', '축구', '야구', '농구', '테니스', '수영', '달리기', '등산', '헬스', '요가', '태권도', '경기'],
    art: ['음악', '그림', '영화', '드라마', '책', '소설', '시', '춤', '연극', '미술', '디자인', '창작'],
    weather: ['날씨', '비', '눈', '바람', '구름', '햇살', '더위', '추위', '봄', '여름', '가을', '겨울'],
    color: ['색깔', '빨간색', '파란색', '노란색', '초록색', '검은색', '흰색', '보라색', '분홍색', '주황색', '갈색']
  };
  
  // 두 단어가 같은 카테고리에 속하는지 확인
  for (const category in semanticGroups) {
    const words = semanticGroups[category];
    const word1InCategory = words.includes(word1);
    const word2InCategory = words.includes(word2);
    
    if (word1InCategory && word2InCategory) {
      // 같은 카테고리의 핵심 단어들은 높은 유사도
      return 80 + Math.random() * 15;
    }
  }
  
  // 관련성이 있는 카테고리 간 유사도
  const relatedCategories = {
    family: ['emotion'],
    nature: ['weather'],
    emotion: ['family'],
    work: ['study'],
    health: ['sports'],
    art: ['emotion']
  };
  
  for (const category in relatedCategories) {
    const words = semanticGroups[category];
    const relatedCats = relatedCategories[category];
    
    if (words.includes(word1)) {
      for (const relatedCat of relatedCats) {
        if (semanticGroups[relatedCat].includes(word2)) {
          return 45 + Math.random() * 25;
        }
      }
    }
    
    if (words.includes(word2)) {
      for (const relatedCat of relatedCats) {
        if (semanticGroups[relatedCat].includes(word1)) {
          return 45 + Math.random() * 25;
        }
      }
    }
  }
  
  return 15 + Math.random() * 30;
}

// 문자열 유사도 (편집 거리 기반)
function calculateLexicalSimilarity(word1, word2) {
  const distance = getLevenshteinDistance(word1, word2);
  const maxLength = Math.max(word1.length, word2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.max(0, similarity);
}

// 레벤슈타인 거리 계산
function getLevenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Netlify Function Handler
exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'METHOD_NOT_ALLOWED', message: 'POST 요청만 허용됩니다' })
    };
  }
  
  try {
    // 요청 본문 파싱
    const { word1, word2 } = JSON.parse(event.body || '{}');
    
    // 입력 검증
    if (!word1 || !word2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'MISSING_WORDS', 
          message: '두 단어를 모두 입력해주세요' 
        })
      };
    }
    
    if (typeof word1 !== 'string' || typeof word2 !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'INVALID_INPUT', 
          message: '단어는 문자열이어야 합니다' 
        })
      };
    }
    
    if (word1.length > 20 || word2.length > 20) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'WORD_TOO_LONG', 
          message: '단어는 20글자를 초과할 수 없습니다' 
        })
      };
    }
    
    // 유사도 계산
    const similarity = calculateKoreanSimilarity(word1.trim(), word2.trim());
    
    // 응답 반환
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        word1: word1.trim(),
        word2: word2.trim(),
        similarity,
        rank: similarity > 80 ? 'HIGH' : similarity > 50 ? 'MEDIUM' : 'LOW',
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Similarity calculation error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'SERVER_ERROR', 
        message: '유사도 계산 중 오류가 발생했습니다',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
