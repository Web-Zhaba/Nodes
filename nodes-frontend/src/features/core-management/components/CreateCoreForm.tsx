import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateCoreMutation } from "../hooks/useCoresQuery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IconPicker } from "@/features/nodes/components/IconPicker";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface CreateCoreFormProps {
  onSuccess?: (coreId: string) => void;
  onCancel?: () => void;
}

export function CreateCoreForm({ onSuccess, onCancel }: CreateCoreFormProps) {
  const { user } = useAuth();
  const createMutation = useCreateCoreMutation();
  
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8b5cf6");
  const [icon, setIcon] = useState("Circle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    try {
      const newCore = await createMutation.mutateAsync({ 
        userId: user.id, 
        name: name.trim(), 
        color, 
        icon 
      });

      if (newCore) {
        toast.success("Ядро успешно создано!");
        setName("");
        setColor("#8b5cf6");
        setIcon("Circle");
        onSuccess?.(newCore.id);
      }
    } catch (error) {
      toast.error("Не удалось создать ядро");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Создать новое Ядро</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onCancel} 
            className="h-9 w-9 text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <CardDescription>
          Ядро — это гравитационный центр, который будет притягивать узлы с выбранными тегами.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coreName">Название ядра</Label>
            <Input 
              id="coreName" 
              placeholder="Спорт, Здоровье, Карьера..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coreColor">Фирменный цвет</Label>
              <div className="flex gap-4 items-center">
                <Input 
                  id="coreColor" 
                  type="color" 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Иконка</Label>
              <IconPicker
                value={icon}
                onChange={setIcon}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={!name.trim() || createMutation.isPending} className="w-full">
            {createMutation.isPending ? "Создание..." : "Создать Ядро"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
