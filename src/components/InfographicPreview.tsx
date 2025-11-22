import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle2, Brain, Sparkles, TrendingUp } from "lucide-react";

interface InfographicPreviewProps {
  title: string;
  description?: string;
  aiModel: string;
  stages: Array<{
    id: string;
    stage_name: string;
    status: string;
    content?: string;
    stage_order: number;
  }>;
  createdAt: string;
  generatedContent?: string;
}

const STAGE_ICONS = [
  FileText,
  FileText,
  Sparkles,
  Brain,
  CheckCircle2,
  TrendingUp
];

export const InfographicPreview = ({ 
  title, 
  description, 
  aiModel, 
  stages,
  createdAt,
  generatedContent 
}: InfographicPreviewProps) => {
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const progressPercentage = stages.length > 0 ? (completedStages / stages.length) * 100 : 0;

  // Parse generated content into sections
  const parseSections = (content?: string) => {
    if (!content) return [];
    const sections = content.split(/\n#{1,2}\s+/).filter(Boolean);
    return sections.map((section, index) => {
      const lines = section.split('\n').filter(line => line.trim());
      const sectionTitle = lines[0]?.replace(/^#+\s*/, '') || `섹션 ${index + 1}`;
      const sectionContent = lines.slice(1).join('\n');
      return { title: sectionTitle, content: sectionContent };
    });
  };

  const sections = parseSections(generatedContent);

  return (
    <div className="space-y-6">
      {/* 헤더 카드 */}
      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-success/10 border-2">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl mb-2">{title}</CardTitle>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {Math.round(progressPercentage)}%
              </div>
              <div className="text-xs text-muted-foreground">진행률</div>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-success mb-1">
                {completedStages}
              </div>
              <div className="text-xs text-muted-foreground">완료 단계</div>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-accent mb-1">
                {stages.length}
              </div>
              <div className="text-xs text-muted-foreground">총 단계</div>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-xl font-bold text-foreground mb-1 uppercase">
                {aiModel}
              </div>
              <div className="text-xs text-muted-foreground">AI 모델</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최종 결과물 요약 보고서 */}
      {generatedContent ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              최종 결과물 요약
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sections.map((section, index) => (
                <div key={index} className="border-l-4 border-primary/30 pl-6 py-2">
                  <h3 className="text-xl font-bold mb-3 text-primary">{section.title}</h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              프로세스 진행 상황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stages.map((stage, index) => {
                const Icon = STAGE_ICONS[index] || FileText;
                const isCompleted = stage.status === 'completed';
                const isProcessing = stage.status === 'processing';
                
                return (
                  <div key={stage.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-success' 
                          : isProcessing 
                          ? 'bg-primary animate-pulse' 
                          : 'bg-muted'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${
                        isCompleted || isProcessing ? 'text-white' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          {stage.stage_order}. {stage.stage_name}
                        </h3>
                        <Badge 
                          variant={
                            isCompleted ? 'default' : 
                            isProcessing ? 'secondary' : 
                            'outline'
                          }
                          className={
                            isCompleted ? 'bg-success' : 
                            isProcessing ? 'bg-primary' : 
                            ''
                          }
                        >
                          {isCompleted ? '완료' : isProcessing ? '처리 중' : '대기'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 타임라인 */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            프로젝트 타임라인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span className="text-sm font-medium">프로젝트 생성</span>
              <span className="text-sm text-muted-foreground">
                {new Date(createdAt).toLocaleString('ko-KR')}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span className="text-sm font-medium">완료 단계</span>
              <span className="text-sm font-bold text-success">
                {completedStages} / {stages.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span className="text-sm font-medium">진행률</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary via-accent to-success transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-primary">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
