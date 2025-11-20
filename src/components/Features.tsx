import { Card } from "@/components/ui/card";
import { FileText, Wand2, Database, GitBranch, Send, TrendingUp } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "브리프 위저드",
    description: "대상, 목표, 활용범위를 입력하는 간단한 설문으로 시작. 10분이면 충분합니다.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Wand2,
    title: "6단계 자동 생성",
    description: "교육 방향 → 커리큘럼 → 주차별 교안 → 슬라이드 → 실습 템플릿 → AI 툴 추천까지 자동화",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Database,
    title: "데이터 관리",
    description: "과정 메타데이터 저장/검색, 버전 관리, 릴리즈 노트, 성과지표를 한 곳에서",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: GitBranch,
    title: "리뷰 & 승인",
    description: "협업 편집과 승인 워크플로우. 초안→리뷰→승인→배포까지 체계적으로",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Send,
    title: "멀티 포맷 배포",
    description: "PDF, 슬라이드, 프린트팩, 모바일 가이드를 한 번에 자동 내보내기",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: TrendingUp,
    title: "피드백 루프",
    description: "수강생 설문, 과제 데이터를 자동 수집하고 개선 티켓을 자동 생성",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const Features = () => {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            완전한 자동화 워크플로우
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            교육 콘텐츠 제작의 모든 단계를 하나의 플랫폼에서. 수작업 시간을 50% 줄이세요.
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="p-6 hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4`}>
                  <Icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
