/**
 * SupplementaryMaterialsPreview 컴포넌트
 *
 * 보충 자료 콘텐츠를 표시하며 Mermaid 다이어그램과 Chart.js 차트를 렌더링합니다.
 */

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, LinkIcon, Video, ExternalLink, BarChart3, Network } from "lucide-react";
import mermaid from "mermaid";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, RadialLinearScale } from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Chart.js 요소 등록
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, RadialLinearScale);

// Mermaid 초기화
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Noto Sans KR, sans-serif',
});

interface Reference {
  type: 'book' | 'article' | 'website' | 'video';
  title: string;
  author?: string;
  url?: string;
  description?: string;
}

interface CaseStudy {
  title: string;
  description: string;
  insights: string[];
}

interface Diagram {
  type: 'flowchart' | 'sequence' | 'class' | 'state' | 'er' | 'gantt' | 'pie' | 'journey' | 'mindmap' | 'timeline';
  title: string;
  description: string;
  mermaidCode: string;
}

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar';
  title: string;
  description: string;
  data: any;
  options: any;
}

interface LearningPath {
  description: string;
  nextTopics: string[];
}

interface SupplementaryMaterialsContent {
  title: string;
  coreConcepts: string;
  references: Reference[];
  caseStudies: CaseStudy[];
  diagrams: Diagram[];
  charts: ChartData[];
  learningPath: LearningPath;
}

interface SupplementaryMaterialsPreviewProps {
  content: any;
  lessonTitle: string;
}

export const SupplementaryMaterialsPreview = ({ content, lessonTitle }: SupplementaryMaterialsPreviewProps) => {
  const mermaidRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // 콘텐츠 파싱
  const materialData: SupplementaryMaterialsContent = typeof content === 'string'
    ? JSON.parse(content)
    : content;

  // Mermaid 다이어그램 렌더링
  useEffect(() => {
    if (materialData.diagrams && materialData.diagrams.length > 0) {
      materialData.diagrams.forEach(async (diagram, index) => {
        const element = mermaidRefs.current.get(index);
        if (element && diagram.mermaidCode) {
          try {
            element.innerHTML = '';
            const { svg } = await mermaid.render(`mermaid-${index}`, diagram.mermaidCode);
            element.innerHTML = svg;
          } catch (error) {
            console.error('Mermaid rendering error:', error);
            element.innerHTML = `<div class="text-red-500 text-sm p-4">다이어그램 렌더링 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}</div>`;
          }
        }
      });
    }
  }, [materialData.diagrams]);

  const getReferenceIcon = (type: string) => {
    switch (type) {
      case 'book': return <BookOpen className="w-5 h-5" />;
      case 'article': return <FileText className="w-5 h-5" />;
      case 'website': return <LinkIcon className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  if (!materialData) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-slate-50 rounded-lg">
        <div className="text-center p-8">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">보충 자료가 없습니다</h3>
          <p className="text-muted-foreground">
            보충 자료를 생성해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50 p-6 rounded-lg">
      {/* 제목 */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{materialData.title || lessonTitle}</h1>
        <Badge variant="secondary">보충 학습 자료</Badge>
      </div>

      {/* 핵심 개념 */}
      {materialData.coreConcepts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              핵심 개념 심화
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {materialData.coreConcepts}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mermaid 다이어그램 */}
      {materialData.diagrams && materialData.diagrams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-purple-600" />
              시각화 다이어그램
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {materialData.diagrams.map((diagram, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="mb-3">
                  <h3 className="font-bold text-lg">{diagram.title}</h3>
                  <p className="text-sm text-muted-foreground">{diagram.description}</p>
                  <Badge variant="outline" className="mt-2">{diagram.type}</Badge>
                </div>
                <div
                  ref={(el) => {
                    if (el) mermaidRefs.current.set(index, el);
                  }}
                  className="mermaid-container flex justify-center items-center p-4 bg-slate-50 rounded-lg overflow-auto"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Chart.js 차트 */}
      {materialData.charts && materialData.charts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              데이터 차트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {materialData.charts.map((chart, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="mb-3">
                  <h3 className="font-bold text-lg">{chart.title}</h3>
                  <p className="text-sm text-muted-foreground">{chart.description}</p>
                  <Badge variant="outline" className="mt-2">{chart.type}</Badge>
                </div>
                <div className="max-w-2xl mx-auto">
                  <Chart type={chart.type} data={chart.data} options={chart.options} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 참고 문헌 */}
      {materialData.references && materialData.references.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              참고 문헌 및 추천 리소스
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {materialData.references.map((ref, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="text-slate-600 mt-1">
                    {getReferenceIcon(ref.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{ref.title}</h4>
                        {ref.author && (
                          <p className="text-sm text-muted-foreground">{ref.author}</p>
                        )}
                        {ref.description && (
                          <p className="text-sm text-slate-600 mt-1">{ref.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {ref.type}
                      </Badge>
                    </div>
                    {ref.url && (
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2"
                      >
                        링크 열기 <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 사례 연구 */}
      {materialData.caseStudies && materialData.caseStudies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>실제 적용 사례</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {materialData.caseStudies.map((caseStudy, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-bold text-lg mb-2">{caseStudy.title}</h3>
                  <p className="text-slate-700 mb-3">{caseStudy.description}</p>
                  {caseStudy.insights && caseStudy.insights.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-600 mb-2">주요 통찰:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                        {caseStudy.insights.map((insight, idx) => (
                          <li key={idx}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 학습 경로 */}
      {materialData.learningPath && (
        <Card>
          <CardHeader>
            <CardTitle>추천 학습 경로</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">{materialData.learningPath.description}</p>
            {materialData.learningPath.nextTopics && materialData.learningPath.nextTopics.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">다음 학습 주제:</p>
                <div className="flex flex-wrap gap-2">
                  {materialData.learningPath.nextTopics.map((topic, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
