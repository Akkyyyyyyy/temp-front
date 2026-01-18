import { Camera, Calendar, Users, DollarSign, BarChart3, Clock, ArrowRight, Italic } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import weddxLogo from "@/assets/logo/logo.png";

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Manage bookings, availability, and team schedules with an intuitive calendar system."
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Track team members, assignments, and workloads across all your projects."
  },
  {
    icon: DollarSign,
    title: "Financial Tracking",
    description: "Monitor revenue, manage packages, and keep your finances organized."
  },
  {
    icon: BarChart3,
    title: "Project Timeline",
    description: "Visualize project progress with interactive Gantt charts and timelines."
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    description: "Stay synchronized with instant updates across your entire team."
  },
  {
    icon: Camera,
    title: "Moodboards",
    description: "Create and organize visual inspiration boards for each project."
  }
];

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-studio-dark via-studio-gray to-studio-dark" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-studio-gold/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-studio-gold/10 rounded-full blur-3xl" />
        </div>
        
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12 lg:py-6">
          <div className="flex items-center">
            <img src={weddxLogo} alt="weddx" className="h-12 lg:h-22 mix-blend-multiply" />
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-foreground ">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-studio-gold text-studio-dark hover:bg-studio-gold-light">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        <div className="relative z-10 px-6 py-20 lg:px-12 lg:py-32 max-w-6xl mx-auto text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Professional Studio
            <span className="block text-studio-gold">Management Made Simple</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Streamline your photography business with powerful tools for scheduling, 
            team coordination, and financial tracking — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-studio-gold text-studio-dark hover:bg-studio-gold-light px-8">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-border hover:bg-secondary px-8">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="px-6 py-20 lg:px-12 lg:py-28 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Run Your Studio
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From booking management to financial insights, we've got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-secondary/50 border-border/50 hover:border-studio-gold/30 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-studio-gold/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-studio-gold" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 lg:px-12 lg:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-studio-gray to-studio-dark rounded-2xl p-10 lg:p-16 border border-border/30">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Join studios that trust our platform to manage their bookings, 
              teams, and finances efficiently.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-studio-gold text-studio-dark hover:bg-studio-gold-light px-10">
                Get Started Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 lg:px-12 border-t border-border/30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={weddxLogo} alt="weddx" className="h-7" />
            <span className="text-sm text-muted-foreground">© 2024 Weddx AI. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policies" className="text-sm text-muted-foreground hover:text-foreground transition-colors"  target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;