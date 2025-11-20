import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const pipelineSteps = [
  {
    step: "1",
    title: "브리프 입력",
    description: "대상, 목표, 기간",
  },
  {
    step: "2",
    title: "교육 방향 제안",
    description: "AI 기반 방향 설정",
  },
  {
    step: "3",
    title: "커리큘럼 생성",
    description: "학습목표 & 성과물",
  },
  {
    step: "4",
    title: "주차별 교안",
    description: "상세 수업 계획",
  },
  {
    step: "5",
    title: "슬라이드 제작",
    description: "PPTX & PDF 자동 생성",
  },
  {
    step: "6",
    title: "배포 & 피드백",
    description: "멀티 포맷 배포 + 자동 개선",
  },
];

const Pipeline = () => {
  return (
    <section className="py-20 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            6단계 자동 생성 파이프라인
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI가 교육 콘텐츠 제작의 전 과정을 자동화합니다. 각 단계에서 재생성, 보정, 고정이 가능합니다.
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Desktop: Horizontal layout */}
          <div className="hidden lg:block">
            <div className="flex items-center justify-between mb-8">
              {pipelineSteps.map((step, index) => (
                <div key={index} className="flex items-center flex-1">
                  <Card className="w-full p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-primary text-primary-foreground font-bold text-lg mb-3">
                      {step.step}
                    </div>
                    <h3 className="font-semibold mb-1 text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </Card>
                  {index < pipelineSteps.length - 1 && (
                    <ArrowRight className="h-6 w-6 text-primary mx-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: Vertical layout */}
          <div className="lg:hidden space-y-4">
            {pipelineSteps.map((step, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <Card className="p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-primary text-primary-foreground font-bold text-lg">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </Card>
                {index < pipelineSteps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="h-6 w-6 text-primary rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              ⚡ 평균 생성 시간: 교안 초안 ≤ 60초 | 슬라이드 변환 ≤ 120초
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pipeline;
