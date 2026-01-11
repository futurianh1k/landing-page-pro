import { ArrowRight, BookOpen, FileText, Presentation, Code, ClipboardCheck, CheckCircle, Users, Clock, Eye, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const pipelineSteps = [
  {
    step: "1",
    title: "커리큘럼 설계",
    description: "학습 목표 & 구조 설계",
    icon: BookOpen,
    time: "~2분",
  },
  {
    step: "2",
    title: "수업안 작성",
    description: "세션별 상세 계획",
    icon: FileText,
    time: "~3분",
  },
  {
    step: "3",
    title: "슬라이드 구성",
    description: "프레젠테이션 구조화",
    icon: Presentation,
    time: "~3분",
  },
  {
    step: "4",
    title: "실습 템플릿",
    description: "실습 가이드 생성",
    icon: Code,
    time: "~2분",
  },
  {
    step: "5",
    title: "평가/퀴즈",
    description: "학습 평가 문항",
    icon: ClipboardCheck,
    time: "~2분",
  },
  {
    step: "6",
    title: "최종 검토",
    description: "품질 검토 & 완성",
    icon: CheckCircle,
    time: "~1분",
  },
];

// 생성 예시 데이터 (간단 버전)
const exampleProjects = [
  {
    id: "1",
    title: "ChatGPT 비즈니스 활용법",
    description: "업무 생산성을 높이는 ChatGPT 프롬프트 작성법과 실무 적용 사례",
    thumbnail: "🤖",
    tags: ["AI", "생산성", "프롬프트"],
    targetAudience: "직장인",
    duration: "2시간",
    category: "IT/기술",
  },
  {
    id: "2",
    title: "신입사원 온보딩 교육",
    description: "새로 입사한 직원을 위한 조직 문화, 업무 프로세스, 협업 도구 교육",
    thumbnail: "👋",
    tags: ["온보딩", "조직문화", "협업"],
    targetAudience: "신입사원",
    duration: "8시간",
    category: "비즈니스",
  },
  {
    id: "3",
    title: "스트레스 관리와 마음 건강",
    description: "직장인을 위한 스트레스 관리 기법과 마음 챙김 실천법",
    thumbnail: "🧘",
    tags: ["스트레스", "웰빙", "마음챙김"],
    targetAudience: "직장인",
    duration: "3시간",
    category: "건강/웰빙",
  },
  {
    id: "4",
    title: "UX/UI 디자인 기초",
    description: "비디자이너를 위한 사용자 경험 디자인 원칙과 실무 적용",
    thumbnail: "🎨",
    tags: ["UX", "UI", "디자인"],
    targetAudience: "기획자/PM",
    duration: "4시간",
    category: "크리에이티브",
  },
  {
    id: "5",
    title: "비즈니스 영어 이메일 작성",
    description: "글로벌 비즈니스를 위한 영어 이메일 작성 핵심 스킬",
    thumbnail: "✉️",
    tags: ["영어", "이메일", "비즈니스"],
    targetAudience: "직장인",
    duration: "2시간",
    category: "언어/소통",
  },
  {
    id: "6",
    title: "데이터 분석 기초 with Excel",
    description: "엑셀을 활용한 기본적인 데이터 분석 및 시각화 방법",
    thumbnail: "📊",
    tags: ["Excel", "데이터분석", "시각화"],
    targetAudience: "직장인",
    duration: "6시간",
    category: "IT/기술",
  },
];

const Pipeline = () => {
  return (
    <>
      <section className="py-20 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              6단계 자동 생성 파이프라인
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              브리프만 입력하면 커리큘럼, 수업안, 슬라이드, 실습 템플릿까지 자동 생성
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* Desktop: Horizontal layout */}
            <div className="hidden lg:block">
              <div className="flex items-center justify-between mb-8">
                {pipelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="flex items-center flex-1">
                      <Card className="w-full p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-primary text-primary-foreground mb-3">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold mb-1 text-sm">{step.title}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
                        <span className="text-xs text-primary font-medium">{step.time}</span>
                      </Card>
                      {index < pipelineSteps.length - 1 && (
                        <ArrowRight className="h-6 w-6 text-primary mx-2 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile: Vertical layout */}
            <div className="lg:hidden space-y-4">
              {pipelineSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <Card className="p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-primary text-primary-foreground">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{step.title}</h3>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                        <span className="text-sm text-primary font-medium">{step.time}</span>
                      </div>
                    </Card>
                    {index < pipelineSteps.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ArrowRight className="h-6 w-6 text-primary rotate-90" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground">
                ⚡ 총 예상 생성 시간: <span className="font-semibold text-primary">약 13분</span> | 각 단계에서 피드백 반영 및 재생성 가능
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 생성 예시 섹션 */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              AI 생성 예시
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              AI가 만든 교육 콘텐츠
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              다양한 분야의 실제 생성 예시를 확인하세요. 커리큘럼, 슬라이드, 퀴즈까지 모두 AI가 자동으로 생성했습니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {exampleProjects.map((example) => (
              <Card key={example.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="text-4xl mb-2">{example.thumbnail}</div>
                    <Badge variant="secondary">{example.category}</Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {example.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {example.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {example.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {example.targetAudience}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {example.duration}
                    </span>
                  </div>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                    <Link to="/examples">
                      <Eye className="h-4 w-4 mr-2" />
                      상세 보기
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline" asChild>
              <Link to="/examples">
                생성 예시 더 보기
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Pipeline;
