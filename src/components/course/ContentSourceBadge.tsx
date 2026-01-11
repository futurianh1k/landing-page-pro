/**
 * ContentSourceBadge 컴포넌트
 * 
 * 콘텐츠 소스를 시각적으로 표시하는 배지
 * - ai_generated: AI가 생성한 콘텐츠
 * - manual: 사용자가 직접 작성
 * - uploaded: 파일 업로드
 * - imported: 외부에서 가져옴 (프로젝트에서 코스빌더로 등)
 * 
 * 작성일: 2026-01-10
 * 참고: history/2026-01-10_project-coursebuilder-integration-plan.md
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, Edit, Upload, Download, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// 타입 정의
// ============================================================

export type ContentSource = 'ai_generated' | 'manual' | 'uploaded' | 'imported' | null | undefined;

interface ContentSourceBadgeProps {
  source: ContentSource;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

// ============================================================
// 소스별 설정
// ============================================================

const SOURCE_CONFIG: Record<NonNullable<ContentSource>, {
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Sparkles;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  colorClass: string;
}> = {
  ai_generated: {
    label: 'AI 생성',
    shortLabel: 'AI',
    description: 'AI가 자동으로 생성한 콘텐츠입니다.',
    icon: Sparkles,
    variant: 'default',
    colorClass: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300',
  },
  manual: {
    label: '수동 작성',
    shortLabel: '수동',
    description: '사용자가 직접 작성한 콘텐츠입니다.',
    icon: Edit,
    variant: 'outline',
    colorClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
  },
  uploaded: {
    label: '업로드',
    shortLabel: '업로드',
    description: '파일로 업로드된 콘텐츠입니다.',
    icon: Upload,
    variant: 'secondary',
    colorClass: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  },
  imported: {
    label: '가져옴',
    shortLabel: '가져옴',
    description: '프로젝트에서 가져온 콘텐츠입니다.',
    icon: Download,
    variant: 'secondary',
    colorClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
};

const SIZE_CONFIG = {
  sm: {
    badge: 'text-[10px] px-1.5 py-0',
    icon: 'h-2.5 w-2.5',
    gap: 'gap-0.5',
  },
  md: {
    badge: 'text-xs px-2 py-0.5',
    icon: 'h-3 w-3',
    gap: 'gap-1',
  },
  lg: {
    badge: 'text-sm px-2.5 py-1',
    icon: 'h-4 w-4',
    gap: 'gap-1.5',
  },
};

// ============================================================
// 컴포넌트
// ============================================================

export function ContentSourceBadge({ 
  source, 
  size = 'sm', 
  showLabel = true,
  className,
}: ContentSourceBadgeProps) {
  // 소스가 없거나 알 수 없는 경우
  if (!source || !SOURCE_CONFIG[source]) {
    return (
      <Badge variant="outline" className={cn(
        "border-dashed",
        SIZE_CONFIG[size].badge,
        className
      )}>
        <HelpCircle className={cn(SIZE_CONFIG[size].icon, "text-muted-foreground")} />
        {showLabel && <span className="ml-1">미지정</span>}
      </Badge>
    );
  }

  const config = SOURCE_CONFIG[source];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline"
            className={cn(
              "border font-medium cursor-help",
              sizeConfig.badge,
              sizeConfig.gap,
              config.colorClass,
              className
            )}
          >
            <Icon className={sizeConfig.icon} />
            {showLabel && <span>{size === 'sm' ? config.shortLabel : config.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================
// 아이콘만 표시하는 컴포넌트
// ============================================================

export function ContentSourceIcon({ 
  source, 
  className,
}: { 
  source: ContentSource; 
  className?: string;
}) {
  if (!source || !SOURCE_CONFIG[source]) {
    return <HelpCircle className={cn("h-4 w-4 text-muted-foreground", className)} />;
  }

  const config = SOURCE_CONFIG[source];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Icon className={cn("h-4 w-4", className)} style={{ 
            color: source === 'ai_generated' ? '#8b5cf6' :
                   source === 'manual' ? '#64748b' :
                   source === 'uploaded' ? '#3b82f6' :
                   source === 'imported' ? '#10b981' : '#94a3b8'
          }} />
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================
// 소스 선택 드롭다운 (향후 사용)
// ============================================================

export function getSourceLabel(source: ContentSource): string {
  if (!source || !SOURCE_CONFIG[source]) {
    return '미지정';
  }
  return SOURCE_CONFIG[source].label;
}

export function getSourceColor(source: ContentSource): string {
  if (!source || !SOURCE_CONFIG[source]) {
    return '#94a3b8';
  }
  const colorMap: Record<NonNullable<ContentSource>, string> = {
    ai_generated: '#8b5cf6',
    manual: '#64748b',
    uploaded: '#3b82f6',
    imported: '#10b981',
  };
  return colorMap[source];
}

export default ContentSourceBadge;
