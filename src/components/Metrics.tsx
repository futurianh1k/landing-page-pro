import { Card } from "@/components/ui/card";
import { TrendingDown, Clock, Award, Zap } from "lucide-react";

const metrics = [
  {
    icon: TrendingDown,
    value: "70%↓",
    label: "리드타임 단축",
    detail: "5일 → 36시간",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Clock,
    value: "50%↓",
    label: "수작업 보정 시간",
    detail: "자동화로 효율 극대화",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Award,
    value: "90점+",
    label: "콘텐츠 일관성 지수",
    detail: "체크리스트 만족도",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Zap,
    value: "+20p",
    label: "NPS 향상",
    detail: "수강생 만족도 증가",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const Metrics = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            검증된 성과
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            실제 교육 현장에서 검증된 핵심 지표들. Autopilot으로 교육 콘텐츠 제작의 새로운 기준을 만듭니다.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card 
                key={index} 
                className="p-8 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/30 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`inline-flex p-4 rounded-full ${metric.bgColor} mb-4`}>
                  <Icon className={`h-8 w-8 ${metric.color}`} />
                </div>
                
                <div className={`text-4xl font-bold mb-2 ${metric.color}`}>
                  {metric.value}
                </div>
                
                <div className="text-lg font-semibold mb-1">
                  {metric.label}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {metric.detail}
                </p>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            📊 과정 개편 주기: 8주 → 4주로 단축
          </p>
        </div>
      </div>
    </section>
  );
};

export default Metrics;
