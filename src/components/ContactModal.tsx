/**
 * ContactModal 컴포넌트
 * 
 * 영업팀 문의 모달 다이얼로그
 * - 이름, 이메일, 회사명, 문의 내용 입력
 * - DB 저장 (선택적)
 * 
 * 작성일: 2026-01-11
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, CheckCircle2, Building2, Mail, User, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface ContactModalProps {
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}

interface ContactFormData {
  name: string;
  email: string;
  company: string;
  companySize: string;
  inquiryType: string;
  message: string;
}

const COMPANY_SIZES = [
  { value: "1-10", label: "1-10명" },
  { value: "11-50", label: "11-50명" },
  { value: "51-200", label: "51-200명" },
  { value: "201-500", label: "201-500명" },
  { value: "500+", label: "500명 이상" },
];

const INQUIRY_TYPES = [
  { value: "demo", label: "데모 요청" },
  { value: "pricing", label: "가격 문의" },
  { value: "enterprise", label: "기업용 플랜" },
  { value: "partnership", label: "파트너십" },
  { value: "other", label: "기타" },
];

export function ContactModal({ trigger, defaultOpen = false }: ContactModalProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    company: "",
    companySize: "",
    inquiryType: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 기본 유효성 검사
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("필수 항목을 모두 입력해주세요.");
      return;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("올바른 이메일 주소를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      
      // TODO: API 호출하여 DB에 저장
      // const response = await callAzureFunction('/api/contact', 'POST', formData);
      
      // 현재는 시뮬레이션 (2초 딜레이)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("[ContactModal] 문의 제출:", formData);
      
      setSubmitted(true);
      toast.success("문의가 성공적으로 접수되었습니다!");
      
      // 3초 후 모달 닫기
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setFormData({
          name: "",
          email: "",
          company: "",
          companySize: "",
          inquiryType: "",
          message: "",
        });
      }, 3000);
      
    } catch (error) {
      console.error("[ContactModal] Error:", error);
      toast.error("문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            영업팀 문의
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {submitted ? (
          // 제출 완료 화면
          <div className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">문의가 접수되었습니다!</h3>
            <p className="text-muted-foreground">
              빠른 시일 내에 담당자가 연락드리겠습니다.
              <br />
              보통 영업일 기준 1-2일 내 회신됩니다.
            </p>
          </div>
        ) : (
          // 문의 폼
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">영업팀 문의</DialogTitle>
              <DialogDescription>
                아래 양식을 작성해주시면 담당자가 빠르게 연락드리겠습니다.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  이름 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              {/* 이메일 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  업무 이메일 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hong@company.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>

              {/* 회사명 + 규모 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    회사명
                  </Label>
                  <Input
                    id="company"
                    placeholder="(주)회사명"
                    value={formData.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companySize">회사 규모</Label>
                  <Select 
                    value={formData.companySize} 
                    onValueChange={(value) => handleChange("companySize", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 문의 유형 */}
              <div className="space-y-2">
                <Label htmlFor="inquiryType">문의 유형</Label>
                <Select 
                  value={formData.inquiryType} 
                  onValueChange={(value) => handleChange("inquiryType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="문의 유형을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {INQUIRY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 문의 내용 */}
              <div className="space-y-2">
                <Label htmlFor="message" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  문의 내용 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="문의하실 내용을 자세히 적어주세요..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  required
                />
              </div>

              {/* 제출 버튼 */}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    제출 중...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    문의하기
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                제출하시면 <a href="#" className="underline">개인정보 처리방침</a>에 동의하는 것으로 간주됩니다.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ContactModal;
