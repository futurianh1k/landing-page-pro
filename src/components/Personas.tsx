import { Card } from "@/components/ui/card";
import { Users, GraduationCap, Settings, ShieldCheck } from "lucide-react";

const personas = [
  {
    icon: Users,
    title: "교육기획자",
    role: "Owner",
    description: "교육 방향과 성과를 책임집니다. 브리프를 입력하고 템플릿을 표준화하며 최종 승인을 관리합니다.",
    benefits: ["브리프 → 배포 리드타임 70% 단축", "일관된 품질 표준 유지", "버전 관리 자동화"],
  },
  {
    icon: GraduationCap,
    title: "강사",
    role: "Author / Reviewer",
    description: "주차별 수업안과 슬라이드를 보정합니다. 협업 코멘트로 빠른 피드백 루프를 돌립니다.",
    benefits: ["수작업 보정 시간 50% 절감", "실시간 협업 편집", "즉시 배포 가능"],
  },
  {
    icon: Settings,
    title: "운영자",
    role: "Operations",
    description: "릴리즈, 버전, 권한을 관리하고 배포 채널을 설정합니다. 성과 대시보드로 현황을 파악합니다.",
    benefits: ["원클릭 배포 시스템", "자동 릴리즈 노트 생성", "통합 성과 대시보드"],
  },
  {
    icon: ShieldCheck,
    title: "QA 편집자",
    role: "Quality Assurance",
    description: "품질 체크리스트를 관리하고 금칙어, 저작권, 형식 오류를 자동으로 검사합니다.",
    benefits: ["자동 품질 체크", "일관성 지수 90점 이상", "실시간 오류 감지"],
  },
];

const Personas = () => {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            모든 역할을 위한 최적화
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            교육기획자, 강사, 운영자, QA까지. 각자의 역할에 맞는 기능과 워크플로우를 제공합니다.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {personas.map((persona, index) => {
            const Icon = persona.icon;
            return (
              <Card 
                key={index} 
                className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/30 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-4">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                
                <h3 className="text-xl font-semibold mb-1">{persona.title}</h3>
                <div className="inline-block px-2 py-1 rounded text-xs font-medium bg-accent/20 text-accent mb-3">
                  {persona.role}
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {persona.description}
                </p>
                
                <div className="space-y-2">
                  {persona.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-success flex-shrink-0"></div>
                      <p className="text-xs text-muted-foreground">{benefit}</p>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Personas;
