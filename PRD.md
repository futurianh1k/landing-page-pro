# AI 슬라이드 생성 서비스 PRD (Product Requirements Document)

## 1. AI 슬라이드 생성 서비스의 핵심 구조

Felo.ai, Genspark.ai, Canva, Gamma 같은 AI 슬라이드 생성 서비스는 다음과 같은 다층 아키텍처로 구성되어 있습니다:

### 시스템 아키텍처 (5 단계 파이프라인)

1. 사용자 입력 → 2. LLM 컨텐츠 생성 → 3. 구조화 → 4. 디자인 적용 → 5. PPTX 생성

### 레이어별 상세 구조

| 레이어 | 역할 | 사용 기술 |
| --- | --- | --- |
| 프론트엔드 | 사용자 인터페이스, 프롬프트 입력 | React, Vue.js, Next.js |
| LLM API | 컨텐츠 생성 (제목, 본문, 구조) | GPT-4, Claude, Gemini |
| 컨텐츠 파서 | JSON 구조화, 슬라이드 분할 | Python, Node.js |
| 디자인 엔진 | 레이아웃 선택, 템플릿 매칭 | 규칙 기반 알고리즘 |
| 렌더링 엔진 | PPTX 파일 생성 | python-pptx, Apache POI |
| 이미지 생성 | AI 이미지 자동 생성 (선택) | DALL-E, Midjourney API |

## 2. 구현 방법 (단계별 가이드)

### Step 1: 컨텐츠 생성 (LLM API 활용)

LLM에게 구조화된 프롬프트를 제공하여 슬라이드 컨텐츠를 생성합니다.

```python
import openai

def generate_slide_content(topic, num_slides=5):
    """LLM을 사용하여 슬라이드 컨텐츠 생성"""
    prompt = f"""
    주제 '{topic}'로 {num_slides}개의 슬라이드를 가진 프레젠테이션을 만들어주세요.
    
    각 슬라이드는 다음 형식으로 제공해주세요:
    - 슬라이드 제목
    - 3-5 개의 핵심 포인트 (불릿 포인트 형식)
    
    출력은 JSON 형식으로 다음과 같이 구조화해주세요:
    {{
        "slide_1": {{
            "title": "슬라이드 제목",
            "layout": "title_and_content",
            "bullets": ["포인트 1", "포인트 2", "포인트 3"]
        }}
    }}
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "당신은 전문 프레젠테이션 제작자입니다."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )
    
    return response['choices'][0]['message']['content']
```

**핵심 포인트:**
- 구조화된 출력 요청: JSON 형식으로 데이터 요청
- 레이아웃 타입 지정: title_slide, title_and_content, two_column 등
- 메타데이터 포함: 각 슬라이드의 레이아웃 타입 명시

### Step 2: 데이터 구조화 (JSON 파싱)

LLM 응답을 파싱하고 표준화된 데이터 구조로 변환합니다.

```python
import json

def parse_slide_data(llm_response):
    """LLM 응답을 파싱하여 구조화된 데이터로 변환"""
    # JSON 추출 (코드 블록 제거)
    clean_response = llm_response.replace('```json', '').replace('```', '').strip()
    slide_data = json.loads(clean_response)
    
    # 표준화된 구조로 변환
    structured_slides = []
    for slide_key, slide_content in slide_data.items():
        structured_slides.append({
            'title': slide_content['title'],
            'layout': slide_content.get('layout', 'title_and_content'),
            'content': slide_content.get('bullets', []),
            'image_url': slide_content.get('image', None)
        })
    
    return structured_slides
```

### Step 3: 디자인 템플릿 매핑

슬라이드 레이아웃에 따라 적절한 템플릿을 선택합니다.

```python
# 레이아웃 타입별 인덱스 매핑
LAYOUT_MAPPING = {
    'title_slide': 0,  # 제목 슬라이드
    'title_and_content': 1,  # 제목 + 본문
    'two_column': 2,  # 2 단 레이아웃
    'content_with_image': 3,  # 텍스트 + 이미지
    'blank': 4,  # 빈 슬라이드
    'quote': 5  # 인용구
}

def select_layout(layout_type, presentation):
    """레이아웃 타입에 따라 슬라이드 레이아웃 선택"""
    layout_index = LAYOUT_MAPPING.get(layout_type, 1)
    return presentation.slide_layouts[layout_index]
```

### Step 4: PowerPoint 파일 생성 (python-pptx)

python-pptx 라이브러리를 사용하여 실제 PPTX 파일을 생성합니다.

```python
from pptx import Presentation
from pptx.util import Inches, Pt
from io import BytesIO
from urllib.request import urlopen

def create_powerpoint(slides_data, template_path='template.pptx'):
    """구조화된 데이터로부터 PowerPoint 파일 생성"""
    # 템플릿 로드 (브랜드 디자인 포함)
    prs = Presentation(template_path)
    
    for slide_data in slides_data:
        # 레이아웃 선택
        layout = select_layout(slide_data['layout'], prs)
        slide = prs.slides.add_slide(layout)
        
        # 제목 설정
        if slide.shapes.title:
            slide.shapes.title.text = slide_data['title']
        
        # 컨텐츠 추가
        if slide_data['layout'] == 'title_and_content':
            content_placeholder = slide.placeholders[1]
            text_frame = content_placeholder.text_frame
            
            # 불릿 포인트 추가
            for i, bullet in enumerate(slide_data['content']):
                if i == 0:
                    text_frame.text = bullet
                else:
                    p = text_frame.add_paragraph()
                    p.text = bullet
                    p.level = 0  # 들여쓰기 레벨
        
        # 이미지 추가 (있는 경우)
        if slide_data.get('image_url'):
            try:
                image_data = BytesIO(urlopen(slide_data['image_url']).read())
                # 이미지 placeholder 에 삽입
                pic_placeholder = slide.placeholders[2]
                pic_placeholder.insert_picture(image_data)
            except Exception as e:
                print(f"이미지 삽입 실패: {e}")
    
    # 파일 저장
    output_path = 'generated_presentation.pptx'
    prs.save(output_path)
    return output_path
```

## 3. 개발 로드맵 (12주 계획)

### Phase 1: MVP 개발 (3주)

#### Week 1: 백엔드 기본 구조

**기술 스택:**
- FastAPI (Python)
- python-pptx
- OpenAI API

**구현 항목:**
- [x] FastAPI 프로젝트 초기화
- [x] LLM API 연동 (GPT-4)
- [x] 슬라이드 컨텐츠 생성 엔드포인트
- [x] PPTX 파일 생성 로직

**예시 코드:**

```python
# main.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
import openai
from pptx import Presentation

app = FastAPI()

@app.post("/api/generate")
async def generate_presentation(topic: str, num_slides: int = 5):
    # 1. LLM으로 컨텐츠 생성
    content = await generate_slide_content(topic, num_slides)
    
    # 2. JSON 파싱
    slides_data = parse_slide_data(content)
    
    # 3. PPTX 생성
    output_path = create_powerpoint(slides_data)
    
    return FileResponse(output_path, filename="presentation.pptx")
```

#### Week 2: 비동기 작업 처리

**구현 항목:**
- [x] Celery 또는 Background Tasks로 비동기 처리
- [x] 작업 상태 추적 (Redis)
- [x] 진행률 표시 API

```python
from celery import Celery
from redis import Redis

celery_app = Celery('ppt_generator')
redis_client = Redis()

@celery_app.task
def generate_presentation_task(job_id: str, topic: str, num_slides: int):
    redis_client.set(f"job:{job_id}:status", "processing")
    redis_client.set(f"job:{job_id}:progress", "0")
    
    # 생성 로직...
    
    redis_client.set(f"job:{job_id}:status", "completed")
    redis_client.set(f"job:{job_id}:progress", "100")
    redis_client.set(f"job:{job_id}:file_path", output_path)
```

#### Week 3: 프론트엔드 기본 UI

**기술 스택:**
- React + TypeScript
- Tailwind CSS

**구현 항목:**
- [x] 입력 폼 (주제, 슬라이드 수)
- [x] 생성 버튼
- [x] 진행 상태 표시
- [x] 다운로드 링크

**예시 코드:**

```tsx
// App.tsx
import { useState } from 'react';

function App() {
  const [topic, setTopic] = useState('');
  const [numSlides, setNumSlides] = useState(5);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, num_slides: numSlides }),
    });
    const { job_id } = await response.json();
    
    // 폴링으로 상태 확인
    const pollStatus = setInterval(async () => {
      const statusRes = await fetch(`/api/status/${job_id}`);
      const statusData = await statusRes.json();
      setStatus(statusData);
      
      if (statusData.status === 'completed') {
        clearInterval(pollStatus);
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">AI 프레젠테이션 생성기</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            프레젠테이션 주제
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="예: 인공지능의 미래"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            슬라이드 수: {numSlides}
          </label>
          <input
            type="range"
            min="3"
            max="15"
            value={numSlides}
            onChange={(e) => setNumSlides(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? '생성 중...' : '프레젠테이션 생성'}
        </button>
      </div>

      {/* 진행 상태 */}
      {status && (
        <div className="mt-6 p-4 border rounded-lg">
          <div className="flex justify-between mb-2">
            <span>상태: {status.status}</span>
            <span>{status.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${status.progress}%` }}
            />
          </div>
          {status.status === 'completed' && (
            <a
              href={`/api/download/${status.job_id}`}
              className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              다운로드
            </a>
          )}
        </div>
      )}
    </div>
  );
}
```

### Day 4-5: 통합 테스트

```bash
# 백엔드 실행
cd backend
uvicorn app.main:app --reload

# 프론트엔드 실행 (새 터미널)
cd frontend
npm start
```

### Week 5: 통합 및 초기 테스트

- [x] 엔드-투-엔드 테스트
- [x] 에러 핸들링 개선
- [x] 기본 템플릿 디자인
- [x] 성능 최적화

## Phase 3: 고도화 (3주)

### Week 6-7: 고급 기능 추가

**추가 기능 목록:**

- [ ] 웹 미리보기 (PDF.js 또는 이미지 변환)
- [ ] 템플릿 선택 (3-5종)
- [ ] AI 이미지 생성 (DALL-E 통합)
- [ ] 슬라이드 개별 편집
- [ ] 브랜드 색상 커스터마이징
- [ ] 사용자 계정 시스템 (JWT)

### Week 8: UI/UX 개선

- [x] 반응형 디자인
- [x] 드래그 앤 드롭 템플릿 선택
- [x] 진행 상태 애니메이션
- [x] 접근성 개선

## Phase 4: 배포 및 운영 (2주)

### Week 9: Docker 컨테이너화

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - AWS_ACCESS_KEY=${AWS_ACCESS_KEY}
      - AWS_SECRET_KEY=${AWS_SECRET_KEY}
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=pptgen
      - POSTGRES_PASSWORD=secure_password
      - POSTGRES_DB=presentations
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Week 10: 클라우드 배포

**배포 옵션:**

1. **Railway (가장 간편):**
```bash
# Railway CLI 설치
npm i -g @railway/cli
# 프로젝트 초기화
railway init
railway up
```

2. **AWS (프로덕션 추천):**
- ECS Fargate (컨테이너 오케스트레이션)
- RDS (PostgreSQL)
- ElastiCache (Redis)
- S3 (파일 저장)
- CloudFront (CDN)

3. **Google Cloud Platform:**
- Cloud Run (서버리스 컨테이너)
- Cloud SQL
- Cloud Storage

## Phase 5: 개선 및 확장 (2주)

### Week 11-12: 모니터링 및 최적화

**추가 개선 사항:**

- [ ] 사용자 피드백 수집
- [ ] 성능 모니터링 (Sentry, DataDog)
- [ ] 비용 최적화 (LLM 캐싱)
- [ ] A/B 테스트 (템플릿 선호도)
- [ ] API 레이트 리밋
- [ ] 사용량 분석 (Google Analytics)

## 예상 비용 구조 (월간)

| 항목 | 비용 | 비고 |
| --- | --- | --- |
| OpenAI API | $50-500 | 사용량 기반 |
| AWS/클라우드 | $30-200 | 트래픽 기반 |
| 도메인/SSL | $10-20 | 연간 결제 |
| 모니터링 도구 | $0-50 | 무료 티어 활용 가능 |
| **총계** | **$90-770/월** | |

## 개발 우선순위 체크리스트

### Phase 1: 최소 기능 (꼭 필요)
- [x] 주제 입력 → PPTX 생성
- [x] 기본 레이아웃 3종
- [x] 다운로드 기능
- [x] 에러 핸들링

### Phase 2: 사용자 경험 (중요)
- [x] 진행 상태 표시
- [x] 미리보기
- [ ] 템플릿 선택
- [ ] 반응형 디자인

### Phase 3: 고급 기능 (선택)
- [ ] AI 이미지 생성
- [ ] 웹 편집기
- [ ] 협업 기능
- [ ] 사용자 계정

## 추천 학습 리소스

1. FastAPI 공식 문서: https://fastapi.tiangolo.com/
2. python-pptx 튜토리얼: https://python-pptx.readthedocs.io/
3. React + TypeScript: https://react-typescript-cheatsheet.netlify.app/
4. AWS 배포 가이드: https://aws.amazon.com/getting-started/

## 핵심 개발 팁

1. **MVP 먼저**: 완벽한 제품보다 작동하는 제품을 먼저 만드세요
2. **사용자 피드백**: 초기부터 실제 사용자에게 테스트받으세요
3. **코드 품질**: 처음부터 테스트 코드를 작성하세요
4. **문서화**: API 문서를 자동 생성하세요 (FastAPI는 자동 지원)
5. **보안**: API 키는 절대 코드에 직접 넣지 마세요

---

이 로드맵을 따라 진행하면 12주 안에 상용화 가능한 AI 프레젠테이션 생성 서비스를 만들 수 있습니다! ✅
