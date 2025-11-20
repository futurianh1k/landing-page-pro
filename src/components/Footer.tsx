import { Rocket } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-primary">
                <Rocket className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">Autopilot</span>
            </div>
            <p className="text-sm text-muted-foreground">
              교육 콘텐츠 자동 생성 플랫폼. 브리프부터 배포까지 36시간.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">제품</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">기능</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">가격</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">통합</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">리소스</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">문서</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">가이드</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">블로그</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">지원</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">회사</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">소개</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">채용</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">연락처</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">파트너</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Autopilot. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
