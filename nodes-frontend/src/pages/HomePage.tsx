import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function HomePage() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из системы");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Мои узлы</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/nodes/new">
              <Plus className="mr-2 h-4 w-4" />
              Новый узел
            </Link>
          </Button>
          <Button variant="outline" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>🧘 Утренняя медитация</CardTitle>
            <CardDescription>Категория: Здоровье</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Стабильность</span>
                <span className="font-medium">3/5</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full ${
                      i <= 3 ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <div className="pt-2">
                <Button className="w-full">Отметить сегодня</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
