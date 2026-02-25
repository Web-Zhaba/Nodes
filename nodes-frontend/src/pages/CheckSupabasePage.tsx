import { useState, useCallback } from "react";
import { checkSupabaseConnection } from "@/lib/check-supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

interface CheckResult {
  connected: boolean;
  user: { id: string; email: string } | null;
  tables: {
    profiles: boolean;
    nodes: boolean;
    impulses: boolean;
    connections: boolean;
  };
  error: string | null;
}

export default function CheckSupabasePage() {
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<CheckResult | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const runCheck = useCallback(async () => {
    setIsChecking(true);
    const result = await checkSupabaseConnection();
    setStatus(result);
    setIsChecking(false);
  }, []);

  // Инициализация при первом рендере
  if (!isInitialized) {
    setIsInitialized(true);
    runCheck();
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    runCheck();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            🔗 Nodes — Проверка Supabase
          </CardTitle>
          <CardDescription>
            Диагностика подключения к базе данных
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Кнопки действий */}
          <div className="flex gap-2">
            <Button onClick={runCheck} disabled={isChecking}>
              {isChecking ? "Проверка..." : "Перепроверить"}
            </Button>
            {status?.user && (
              <Button variant="outline" onClick={handleSignOut}>
                Выйти
              </Button>
            )}
          </div>

          {/* Статус подключения */}
          {status && (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Статус подключения</h3>
                <div
                  className={`p-3 rounded-lg ${status.connected ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"}`}
                >
                  {status.connected ? "✅ Подключено" : "❌ Ошибка подключения"}
                </div>
              </div>

              {/* Пользователь */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">👤 Пользователь</h3>
                {status.user ? (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-mono text-sm">{status.user.email}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {status.user.id}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Не авторизован</p>
                )}
              </div>

              {/* Таблицы */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  📊 Таблицы базы данных
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(status.tables).map(([table, exists]) => (
                    <div
                      key={table}
                      className={`p-3 rounded-lg flex items-center justify-between ${
                        exists
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      <span className="font-mono text-sm">{table}</span>
                      {exists ? <span>✅</span> : <span>❌</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ошибка */}
              {status.error && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-red-600">
                    ⚠️ Ошибка
                  </h3>
                  <pre className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300 overflow-auto">
                    {status.error}
                  </pre>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
