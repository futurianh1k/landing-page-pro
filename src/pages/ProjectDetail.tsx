import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, Clock, XCircle, Loader2, RefreshCw, FileText, List, Download, Copy, Share2, BarChart3, Save, Sparkles } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { InfographicPreview } from "@/components/InfographicPreview";
import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';

type Project = Tables<"projects">;
type ProjectStage = Tables<"project_stages">;

const STAGE_NAMES = [
  "肄섑뀗痢?湲고쉷",
  "?쒕굹由ъ삤 ?묒꽦",
  "?대?吏 ?앹꽦",
  "?뚯꽦/?곸긽 ?쒖옉",
  "肄섑뀗痢?議곕┰",
  "諛고룷"
];

const ProjectDetail = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [selectedAiModel, setSelectedAiModel] = useState<string>("");
  const [aiResults, setAiResults] = useState<Tables<"project_ai_results">[]>([]);
  const [retryingWithAi, setRetryingWithAi] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchProjectDetails();
      
      const channel = supabase
        .channel(`project-${id}-changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_stages',
            filter: `project_id=eq.${id}`,
          },
          () => {
            fetchProjectDetails();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects',
            filter: `id=eq.${id}`,
          },
          () => {
            fetchProjectDetails();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_ai_results',
            filter: `project_id=eq.${id}`,
          },
          () => {
            fetchProjectDetails();
          }
        )
        .subscribe();

      let retryCount = 0;
      const maxRetries = 10;
      const pollingInterval = setInterval(() => {
        if (retryCount >= maxRetries) {
          clearInterval(pollingInterval);
          return;
        }
        
        if (stages.length === 0) {
          console.log('Retrying to fetch project details...');
          fetchProjectDetails();
          retryCount++;
        } else {
          clearInterval(pollingInterval);
        }
      }, 3000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(pollingInterval);
      };
    }
  }, [user, id, selectedAiModel]);

  const fetchProjectDetails = async () => {
    if (!user || !id) return;
    
    try {
      setLoadingProject(true);
      
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (projectError) throw projectError;
      
      if (!projectData) {
        toast({
          title: "?꾨줈?앺듃瑜?李얠쓣 ???놁뒿?덈떎",
          description: "議댁옱?섏? ?딄굅???묎렐 沅뚰븳???녿뒗 ?꾨줈?앺듃?낅땲??",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }
      
      setProject(projectData);
      setSelectedAiModel(projectData.ai_model);

      // AI 寃곌낵 媛?몄삤湲?
      const { data: aiResultsData, error: aiResultsError } = await supabase
        .from("project_ai_results")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (aiResultsError) throw aiResultsError;
      setAiResults(aiResultsData || []);

      // ?④퀎 ?뺣낫 媛?몄삤湲?(?좏깮??AI 紐⑤뜽??stages)
      const { data: stagesData, error: stagesError } = await supabase
        .from("project_stages")
        .select("*")
        .eq("project_id", id)
        .eq("ai_model", selectedAiModel || projectData.ai_model)
        .order("stage_order", { ascending: true });

      if (stagesError) throw stagesError;
      setStages(stagesData || []);
      
    } catch (error) {
      console.error("Error fetching project details:", error);
      toast({
        title: "?ㅻ쪟 諛쒖깮",
        description: "?꾨줈?앺듃 ?뺣낫瑜?遺덈윭?ㅻ뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
        variant: "destructive",
      });
    } finally {
      setLoadingProject(false);
    }
  };

  const handleStageRegenerate = async (stageId: string, stageOrder: number) => {
    if (!feedback[stageId]?.trim()) {
      toast({
        title: "?쇰뱶諛??꾩슂",
        description: "?섏젙 ?붿껌 ?ы빆???낅젰?댁＜?몄슂.",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingStage(stageId);
      
      // ?쇰뱶諛????諛??곹깭 ?낅뜲?댄듃
      const { error } = await supabase
        .from("project_stages")
        .update({
          feedback: feedback[stageId],
          status: "processing",
        })
        .eq("id", stageId);

      if (error) throw error;

      toast({
        title: "?ъ깮???붿껌",
        description: "?④퀎媛 ?ъ깮??以묒엯?덈떎.",
      });

      // Edge function ?몄텧?섏뿬 ?ъ깮??
      const { error: funcError } = await supabase.functions.invoke("process-document", {
        body: {
          projectId: id,
          stageId,
          stageOrder,
          regenerate: true,
        },
      });

      if (funcError) throw funcError;

      setFeedback({ ...feedback, [stageId]: "" });
    } catch (error) {
      console.error("Error regenerating stage:", error);
      toast({
        title: "?ㅻ쪟 諛쒖깮",
        description: "?④퀎 ?ъ깮??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
        variant: "destructive",
      });
    } finally {
      setProcessingStage(null);
    }
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground">?꾨즺</Badge>;
      case "processing":
        return <Badge className="bg-primary text-primary-foreground">泥섎━ 以?/Badge>;
      case "failed":
        return <Badge variant="destructive">?ㅽ뙣</Badge>;
      default:
        return <Badge variant="outline">?湲?以?/Badge>;
    }
  };

  const handleDownloadMarkdown = () => {
    if (!project?.generated_content) return;
    
    const content = `# ${project.title}\n\n${project.description || ''}\n\n---\n\n${project.generated_content}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "?ㅼ슫濡쒕뱶 ?꾨즺",
      description: "留덊겕?ㅼ슫 ?뚯씪???ㅼ슫濡쒕뱶?섏뿀?듬땲??",
    });
  };

  const handleDownloadText = () => {
    if (!project?.generated_content) return;
    
    const content = `${project.title}\n\n${project.description || ''}\n\n---\n\n${project.generated_content}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "?ㅼ슫濡쒕뱶 ?꾨즺",
      description: "?띿뒪???뚯씪???ㅼ슫濡쒕뱶?섏뿀?듬땲??",
    });
  };

  const handleCopyToClipboard = async () => {
    if (!project?.generated_content) return;
    
    try {
      await navigator.clipboard.writeText(project.generated_content);
      toast({
        title: "蹂듭궗 ?꾨즺",
        description: "?대┰蹂대뱶???댁슜??蹂듭궗?섏뿀?듬땲??",
      });
    } catch (error) {
      toast({
        title: "蹂듭궗 ?ㅽ뙣",
        description: "?대┰蹂대뱶 蹂듭궗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
        variant: "destructive",
      });
    }
  };

  const handleShareLink = async () => {
    const currentUrl = window.location.href;
    
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast({
        title: "留곹겕 蹂듭궗 ?꾨즺",
        description: "?꾨줈?앺듃 留곹겕媛 ?대┰蹂대뱶??蹂듭궗?섏뿀?듬땲??",
      });
    } catch (error) {
      toast({
        title: "蹂듭궗 ?ㅽ뙣",
        description: "留곹겕 蹂듭궗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = () => {
    if (!project?.generated_content) return;
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      // ?쒕ぉ
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(project.title, margin, margin);
      
      let yPos = margin + 15;
      
      // ?ㅻ챸
      if (project.description) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(project.description, maxWidth);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 7 + 10;
      }
      
      // 援щ텇??
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      
      // 肄섑뀗痢?
      doc.setFontSize(11);
      const contentLines = doc.splitTextToSize(project.generated_content, maxWidth);
      
      contentLines.forEach((line: string) => {
        if (yPos > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(line, margin, yPos);
        yPos += 6;
      });
      
      doc.save(`${project.title.replace(/\s+/g, '_')}.pdf`);
      
      toast({
        title: "PDF ?ㅼ슫濡쒕뱶 ?꾨즺",
        description: "PDF ?뚯씪???ㅼ슫濡쒕뱶?섏뿀?듬땲??",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF ?앹꽦 ?ㅽ뙣",
        description: "PDF ?앹꽦 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPPT = () => {
    if (!project?.generated_content) return;
    
    try {
      const pptx = new PptxGenJS();
      
      // ?쒕ぉ ?щ씪?대뱶
      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: 'F1F5F9' };
      
      titleSlide.addText(project.title, {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 1.5,
        fontSize: 44,
        bold: true,
        color: '1e293b',
        align: 'center',
      });
      
      if (project.description) {
        titleSlide.addText(project.description, {
          x: 1,
          y: 3.5,
          w: 8,
          h: 1,
          fontSize: 18,
          color: '64748b',
          align: 'center',
        });
      }
      
      // 肄섑뀗痢좊? ?⑤씫?쇰줈 ?섎늻湲?
      const paragraphs = project.generated_content.split('\n\n').filter(p => p.trim());
      
      // 媛??⑤씫???щ씪?대뱶濡?
      paragraphs.forEach((paragraph, index) => {
        const contentSlide = pptx.addSlide();
        contentSlide.background = { color: 'FFFFFF' };
        
        // ?щ씪?대뱶 踰덊샇
        contentSlide.addText(`${index + 1}`, {
          x: 0.5,
          y: 0.3,
          w: 0.5,
          h: 0.5,
          fontSize: 14,
          color: '94a3b8',
        });
        
        // ?댁슜
        const lines = paragraph.split('\n');
        const title = lines[0].substring(0, 60) + (lines[0].length > 60 ? '...' : '');
        const content = lines.slice(1).join('\n').substring(0, 800);
        
        contentSlide.addText(title, {
          x: 0.5,
          y: 0.8,
          w: 9,
          h: 0.8,
          fontSize: 28,
          bold: true,
          color: '1e293b',
        });
        
        contentSlide.addText(content, {
          x: 0.5,
          y: 1.8,
          w: 9,
          h: 4,
          fontSize: 16,
          color: '475569',
          valign: 'top',
        });
      });
      
      pptx.writeFile({ fileName: `${project.title.replace(/\s+/g, '_')}.pptx` });
      
      toast({
        title: "PPT ?ㅼ슫濡쒕뱶 ?꾨즺",
        description: "PowerPoint ?뚯씪???ㅼ슫濡쒕뱶?섏뿀?듬땲??",
      });
    } catch (error) {
      console.error('PPT generation error:', error);
      toast({
        title: "PPT ?앹꽦 ?ㅽ뙣",
        description: "PowerPoint ?앹꽦 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!project || !user) return;

    const templateName = prompt("?쒗뵆由??대쫫???낅젰?섏꽭??", `${project.title} ?쒗뵆由?);
    if (!templateName) return;

    try {
      setSavingTemplate(true);
      const { error } = await supabase
        .from("project_templates")
        .insert({
          user_id: user.id,
          template_name: templateName,
          description: project.description,
          education_session: project.education_session,
          education_duration: project.education_duration,
          education_course: project.education_course,
          ai_model: project.ai_model,
        });

      if (error) throw error;

      toast({
        title: "?쒗뵆由?????꾨즺",
        description: "?꾨줈?앺듃媛 ?쒗뵆由우쑝濡???λ릺?덉뒿?덈떎.",
      });
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "?ㅻ쪟 諛쒖깮",
        description: "?쒗뵆由????以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
        variant: "destructive",
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleAiModelChange = async (newModel: string) => {
    setSelectedAiModel(newModel);
    
    // ?좏깮??AI 紐⑤뜽??stages 遺덈윭?ㅺ린
    try {
      const { data: stagesData, error } = await supabase
        .from("project_stages")
        .select("*")
        .eq("project_id", id!)
        .eq("ai_model", newModel)
        .order("stage_order", { ascending: true });

      if (error) throw error;
      setStages(stagesData || []);
    } catch (error) {
      console.error("Error fetching stages for AI model:", error);
    }
  };

  const handleRetryWithAi = async (aiModel: string) => {
    if (!project || !user) return;

    try {
      setRetryingWithAi(true);
      
      // ?좏깮??AI 紐⑤뜽濡?寃곌낵媛 ?대? ?덈뒗吏 ?뺤씤
      const existingResult = aiResults.find(r => r.ai_model === aiModel);
      if (existingResult && existingResult.status === 'completed') {
        toast({
          title: "?대? ?앹꽦??寃곌낵媛 ?덉뒿?덈떎",
          description: "?대떦 AI 紐⑤뜽??寃곌낵瑜??좏깮?댁꽌 ?뺤씤?섏꽭??",
        });
        setSelectedAiModel(aiModel);
        handleAiModelChange(aiModel);
        return;
      }

      // ?꾨줈?앺듃 ?곹깭 ?낅뜲?댄듃
      await supabase
        .from("projects")
        .update({ status: "processing" })
        .eq("id", project.id);

      toast({
        title: "AI 泥섎━ ?쒖옉",
        description: `${aiModel.toUpperCase()} 紐⑤뜽濡?肄섑뀗痢좊? ?앹꽦?섍퀬 ?덉뒿?덈떎.`,
      });

      // Edge function ?몄텧
      const { error: funcError } = await supabase.functions.invoke("process-document", {
        body: {
          projectId: project.id,
          documentContent: project.document_content,
          aiModel: aiModel,
          retryWithDifferentAi: true,
        },
      });

      if (funcError) throw funcError;

      // ?좏깮??AI 紐⑤뜽濡?蹂寃?
      setSelectedAiModel(aiModel);
    } catch (error) {
      console.error("Error retrying with AI:", error);
      toast({
        title: "?ㅻ쪟 諛쒖깮",
        description: "AI ?ъ떆??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
        variant: "destructive",
      });
    } finally {
      setRetryingWithAi(false);
    }
  };

  if (loading || loadingProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">濡쒕뵫 以?..</div>
      </div>
    );
  }

  if (!user || !project) {
    return null;
  }

  const completedStages = stages.filter(s => s.status === 'completed').length;
  const progressPercentage = stages.length > 0 ? (completedStages / stages.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ?꾨줈?앺듃 紐⑸줉?쇰줈
          </Button>
          
          {project.status === 'completed' && (
            <Button 
              variant="outline" 
              onClick={handleSaveAsTemplate}
              disabled={savingTemplate}
            >
              {savingTemplate ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              ?쒗뵆由우쑝濡????
            </Button>
          )}
        </div>

        {/* ?꾨줈?앺듃 ?ㅻ뜑 */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{project.title}</h1>
              {project.description && (
                <p className="text-muted-foreground text-lg">{project.description}</p>
              )}
            </div>
            {getStatusBadge(project.status)}
          </div>

          {/* ?꾨줈?몄떛 以????濡쒕뵫 移대뱶 */}
          {project.status === 'processing' && (
            <Card className="border-primary/50 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 mb-6 overflow-hidden">
              <CardContent className="pt-8 pb-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <div className="absolute inset-0 h-10 w-10 animate-ping opacity-20 rounded-full bg-primary" />
                      </div>
                      <div>
                        <p className="text-xl font-bold mb-1">AI 肄섑뀗痢??앹꽦 以?/p>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            const processingStage = stages.find(s => s.status === 'processing');
                            if (processingStage) return processingStage.stage_name;
                            const completedCount = stages.filter(s => s.status === 'completed').length;
                            if (completedCount === 0) return '以鍮?以?..';
                            if (completedCount === stages.length) return '理쒖쥌 寃??以?..';
                            return stages[completedCount]?.stage_name || '泥섎━ 以?..';
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-primary mb-1">
                        {Math.round((stages.filter(s => s.status === 'completed').length / (stages.length || 6)) * 100)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stages.filter(s => s.status === 'completed').length} / {stages.length || 6} ?꾨즺
                      </p>
                    </div>
                  </div>
                  
                  <Progress 
                    value={(stages.filter(s => s.status === 'completed').length / (stages.length || 6)) * 100} 
                    className="h-3" 
                  />
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {['肄섑뀗痢?湲고쉷', '?쒕굹由ъ삤 ?묒꽦', '?대?吏 ?앹꽦', '?뚯꽦/?곸긽 ?쒖옉', '肄섑뀗痢?議곕┰', '諛고룷'].map((stageName, idx) => {
                      const stage = stages.find(s => s.stage_name === stageName);
                      const status = stage?.status || 'pending';
                      return (
                        <div 
                          key={idx}
                          className={`relative flex flex-col items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all duration-500 ${
                            status === 'completed' 
                              ? 'bg-green-500/10 border-2 border-green-500/30 text-green-700 dark:text-green-400' 
                              : status === 'processing'
                              ? 'bg-primary/10 border-2 border-primary text-primary scale-105 shadow-lg'
                              : 'bg-muted/50 border border-border text-muted-foreground'
                          }`}
                        >
                          <div className={`h-3 w-3 rounded-full transition-all ${
                            status === 'completed' 
                              ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                              : status === 'processing'
                              ? 'bg-primary animate-pulse shadow-lg shadow-primary/50'
                              : 'bg-muted-foreground/30'
                          }`} />
                          <span className="text-center font-medium text-xs leading-tight">{stageName}</span>
                          {status === 'processing' && (
                            <div className="absolute inset-0 rounded-xl border-2 border-primary animate-pulse" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span>?앹꽦?? {new Date(project.created_at).toLocaleDateString('ko-KR')}</span>
            <span>??/span>
            <div className="flex items-center gap-2">
              <span>AI 紐⑤뜽:</span>
              <Select value={selectedAiModel} onValueChange={handleAiModelChange}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="chatgpt">ChatGPT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {aiResults.length > 0 && (
              <>
                <span>??/span>
                <div className="flex items-center gap-2">
                  <span className="text-xs">?앹꽦??AI 寃곌낵: </span>
                  {aiResults.map((result) => (
                    <Badge 
                      key={result.id} 
                      variant={result.ai_model === selectedAiModel ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleAiModelChange(result.ai_model)}
                    >
                      {result.ai_model.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 吏꾪뻾瑜??쒖떆 - ?꾨즺???꾨줈?앺듃留?*/}
          {project.status === 'completed' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">?꾩껜 吏꾪뻾瑜?/span>
                      <Badge variant="outline" className="text-xs">
                        {completedStages} / {stages.length} ?④퀎 ?꾨즺
                      </Badge>
                    </div>
                    <span className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold mb-1">?ㅻⅨ AI 紐⑤뜽濡??ъ떆??/p>
                      <p className="text-xs text-muted-foreground">?ㅼ뼇??AI??寃곌낵瑜?鍮꾧탳?대낫?몄슂</p>
                    </div>
                    <div className="flex gap-2">
                      {['gemini', 'claude', 'chatgpt'].filter(m => m !== selectedAiModel).map((model) => (
                        <Button
                          key={model}
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryWithAi(model)}
                          disabled={retryingWithAi}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {model.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ???ㅻ퉬寃뚯씠??*/}
        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pipeline" className="gap-2">
              <List className="h-4 w-4" />
              ?뚯씠?꾨씪???④퀎
            </TabsTrigger>
            <TabsTrigger value="infographic" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              ?명룷洹몃옒??誘몃━蹂닿린
            </TabsTrigger>
            <TabsTrigger value="final" className="gap-2">
              <FileText className="h-4 w-4" />
              理쒖쥌 寃곌낵臾?
            </TabsTrigger>
          </TabsList>

          {/* ?뚯씠?꾨씪????*/}
          <TabsContent value="pipeline" className="space-y-4">
            {stages.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-semibold mb-2">?꾨줈?앺듃 ?④퀎瑜??앹꽦?섍퀬 ?덉뒿?덈떎</p>
                  <p className="text-sm text-muted-foreground">?좎떆留?湲곕떎?ㅼ＜?몄슂...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {stages.map((stage, index) => (
                  <Card 
                    key={stage.id} 
                    className={`transition-all hover:shadow-md ${
                      stage.status === 'processing' ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getStageIcon(stage.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">
                              ?④퀎 {index + 1}: {STAGE_NAMES[stage.stage_order - 1]}
                            </CardTitle>
                            {getStatusBadge(stage.status)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {stage.content && (
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase">?앹꽦??肄섑뀗痢?/span>
                            <div className="h-px flex-1 bg-border" />
                          </div>
                          <div className="bg-muted/50 p-5 rounded-lg border max-h-[400px] overflow-y-auto">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{stage.content}</p>
                          </div>
                        </div>

                        {stage.status === "completed" && (
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2">
                              <div className="h-px flex-1 bg-border" />
                              <span className="text-xs font-semibold text-muted-foreground uppercase">?섏젙 ?붿껌</span>
                              <div className="h-px flex-1 bg-border" />
                            </div>
                            <Textarea
                              placeholder="???④퀎?먯꽌 ?섏젙?섍퀬 ?띠? ?댁슜??援ъ껜?곸쑝濡??낅젰?섏꽭??.."
                              value={feedback[stage.id] || ""}
                              onChange={(e) => setFeedback({ ...feedback, [stage.id]: e.target.value })}
                              className="min-h-[120px]"
                            />
                            <Button
                              onClick={() => handleStageRegenerate(stage.id, stage.stage_order)}
                              disabled={processingStage === stage.id}
                              className="w-full"
                              size="lg"
                            >
                              {processingStage === stage.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ?ъ깮??以?..
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  ???④퀎 ?ъ깮??
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {stage.feedback && (
                          <div className="pt-2">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-px flex-1 bg-border" />
                              <span className="text-xs font-semibold text-muted-foreground uppercase">?댁쟾 ?쇰뱶諛?/span>
                              <div className="h-px flex-1 bg-border" />
                            </div>
                            <div className="bg-accent/20 p-4 rounded-lg border border-accent">
                              <p className="text-sm text-muted-foreground italic">{stage.feedback}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ?명룷洹몃옒??誘몃━蹂닿린 ??*/}
          <TabsContent value="infographic">
            <InfographicPreview
              title={project.title}
              description={project.description || undefined}
              aiModel={project.ai_model}
              stages={stages}
              createdAt={project.created_at}
              generatedContent={project.generated_content || undefined}
            />
          </TabsContent>

          {/* 理쒖쥌 寃곌낵臾???*/}
          <TabsContent value="final">
            <Card>
              {(() => {
                const currentAiResult = aiResults.find(r => r.ai_model === selectedAiModel);
                const currentContent = currentAiResult?.generated_content || project.generated_content;
                
                return currentContent ? (
                  <>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-2xl">理쒖쥌 ?앹꽦 寃곌낵臾?/CardTitle>
                            <Badge variant="secondary">{selectedAiModel.toUpperCase()}</Badge>
                          </div>
                          <CardDescription>
                            {selectedAiModel.toUpperCase()} 紐⑤뜽???앹꽦??理쒖쥌 肄섑뀗痢좎엯?덈떎
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShareLink}
                            className="gap-2"
                          >
                            <Share2 className="h-4 w-4" />
                            留곹겕 怨듭쑀
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyToClipboard}
                            className="gap-2"
                          >
                            <Copy className="h-4 w-4" />
                            蹂듭궗
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadText}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            TXT
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadMarkdown}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            MD
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadPDF}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadPPT}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            PPT
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 p-6 rounded-lg border max-h-[600px] overflow-y-auto">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <p className="whitespace-pre-wrap leading-relaxed">{currentContent}</p>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Clock className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-semibold mb-2">理쒖쥌 寃곌낵臾쇱씠 ?꾩쭅 ?앹꽦?섏? ?딆븯?듬땲??/p>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      紐⑤뱺 ?뚯씠?꾨씪???④퀎媛 ?꾨즺?섎㈃ 理쒖쥌 寃곌낵臾쇱씠 ?ш린???쒖떆?⑸땲??
                    </p>
                  </CardContent>
                );
              })()}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProjectDetail;

