/**
 * VersionHistorySheet 컴포넌트
 * 
 * 콘텐츠 버전 이력을 보여주고 복원할 수 있는 시트
 * 
 * 작성일: 2026-01-10
 * 참고: history/2026-01-10_project-coursebuilder-integration-plan.md
 */

import { useCallback, useEffect, useState } from "react";
import { callAzureFunctionDirect } from "@/lib/azureFunctions";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Loader2, RotateCcw, Sparkles, User, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

// ============================================================
// 타입 정의
// ============================================================

interface ContentVersion {
  id: string;
  lesson_id: string;
  project_id?: string;
  version_number: number;
  content_type: string;
  content_snapshot: any;
  created_by: string;
  ai_model?: string;
  notes?: string;
  created_at: string;
}

interface VersionHistorySheetProps {
  lessonId: string;
  currentVersion?: number;
  onRestore?: (content: any, contentType: string) => void;
  trigger?: React.ReactNode;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  slides: '슬라이드',
  quiz: '퀴즈',
  lab: '실습 가이드',
  reading: '읽기 자료',
  summary: '요약',
  full: '전체',
};

const CREATED_BY_CONFIG: Record<string, { label: string; icon: typeof Sparkles; color: string }> = {
  ai: { label: 'AI 생성', icon: Sparkles, color: 'text-violet-600' },
  user: { label: '사용자', icon: User, color: 'text-slate-600' },
  import: { label: '가져오기', icon: Download, color: 'text-emerald-600' },
  restore: { label: '복원', icon: RotateCcw, color: 'text-blue-600' },
};

// ============================================================
// 컴포넌트
// ============================================================

export function VersionHistorySheet({ 
  lessonId, 
  currentVersion = 1,
  onRestore,
  trigger,
}: VersionHistorySheetProps) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // ============================================================
  // 버전 이력 로드
  // ============================================================

  const fetchVersions = useCallback(async () => {
    if (!lessonId) return;

    try {
      setLoading(true);
      
      const { data, error } = await callAzureFunctionDirect<{
        success: boolean;
        data: {
          versions: ContentVersion[];
          currentVersion: number;
          totalCount: number;
        };
      }>(`/api/course/versions/${lessonId}?contentType=${filterType}`, 'GET');

      if (error) throw error;

      if (data?.success) {
        setVersions(data.data.versions);
      }
    } catch (error) {
      console.error('[VersionHistorySheet] Error fetching versions:', error);
      toast.error('버전 이력을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [lessonId, filterType]);

  useEffect(() => {
    if (open) {
      fetchVersions();
    }
  }, [open, fetchVersions]);

  // ============================================================
  // 버전 복원
  // ============================================================

  const handleRestore = async (version: ContentVersion) => {
    try {
      setRestoring(version.id);

      const { data, error } = await callAzureFunctionDirect<{
        success: boolean;
        data: {
          restoredFromVersion: number;
          newVersionNumber: number;
          newVersionId: string;
          contentType: string;
          contentSnapshot: any;
        };
        message: string;
      }>('/api/course/versions', 'PUT', {
        versionId: version.id,
        lessonId,
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message);
        
        // 콘텐츠 복원 콜백 호출
        if (onRestore && data.data.contentSnapshot) {
          onRestore(data.data.contentSnapshot, data.data.contentType);
        }
        
        // 목록 새로고침
        fetchVersions();
      }
    } catch (error) {
      console.error('[VersionHistorySheet] Error restoring version:', error);
      toast.error('버전 복원 중 오류가 발생했습니다.');
    } finally {
      setRestoring(null);
    }
  };

  // ============================================================
  // 렌더링
  // ============================================================

  const getCreatedByInfo = (createdBy: string) => {
    return CREATED_BY_CONFIG[createdBy] || CREATED_BY_CONFIG.user;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <History className="h-4 w-4 mr-2" />
            버전 히스토리
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            버전 히스토리
          </SheetTitle>
          <SheetDescription>
            콘텐츠의 이전 버전을 확인하고 복원할 수 있습니다.
          </SheetDescription>
        </SheetHeader>

        {/* 필터 */}
        <div className="mt-4 mb-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="콘텐츠 타입 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 타입</SelectItem>
              <SelectItem value="slides">슬라이드</SelectItem>
              <SelectItem value="quiz">퀴즈</SelectItem>
              <SelectItem value="lab">실습 가이드</SelectItem>
              <SelectItem value="reading">읽기 자료</SelectItem>
              <SelectItem value="summary">요약</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* 버전 목록 */}
        <ScrollArea className="h-[calc(100vh-220px)] mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>저장된 버전이 없습니다.</p>
              <p className="text-sm mt-1">콘텐츠를 생성하거나 수정하면 버전이 자동으로 저장됩니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => {
                const createdByInfo = getCreatedByInfo(version.created_by);
                const Icon = createdByInfo.icon;
                const isCurrentVersion = version.version_number === currentVersion && index === 0;
                const isRestoring = restoring === version.id;

                return (
                  <div 
                    key={version.id} 
                    className={`p-3 border rounded-lg ${isCurrentVersion ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={isCurrentVersion ? 'default' : 'outline'}>
                            v{version.version_number}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {CONTENT_TYPE_LABELS[version.content_type] || version.content_type}
                          </Badge>
                          {isCurrentVersion && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                              현재
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Icon className={`h-3.5 w-3.5 ${createdByInfo.color}`} />
                          <span>{createdByInfo.label}</span>
                          {version.ai_model && (
                            <span className="text-xs">({version.ai_model})</span>
                          )}
                        </div>
                        
                        {version.notes && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {version.notes}
                          </p>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(version.created_at), { 
                            addSuffix: true, 
                            locale: ko 
                          })}
                        </p>
                      </div>

                      {!isCurrentVersion && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(version)}
                          disabled={isRestoring}
                        >
                          {isRestoring ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4 mr-1" />
                              복원
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* 새로고침 버튼 */}
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={fetchVersions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default VersionHistorySheet;
