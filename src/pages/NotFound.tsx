import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, SearchX, TriangleAlert } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md relative z-10 shadow-xl border-muted/50 backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-studio-gold to-studio-gold rounded-2xl flex items-center justify-center shadow-lg">
            <TriangleAlert className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">Page Not Found</CardTitle>
            <CardDescription className="text-base">
              The page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            onClick={() => window.location.href = "/"}
            className="w-full h-11 text-base font-medium"
          >
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;