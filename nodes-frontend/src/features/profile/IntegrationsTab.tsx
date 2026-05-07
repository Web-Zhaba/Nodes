import { Button } from "@/components/ui/button";

export function IntegrationsTab() {
  return (
    <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-bold">Интеграции</h2>
        <p className="text-sm text-muted-foreground">Связь Второго мозга с внешним миром.</p>
      </div>
      
      <div className="p-4 rounded-2xl border border-border/40 bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2 shrink-0 shadow-sm">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="GCal" className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="font-bold">Google Calendar</h3>
            <p className="text-xs text-muted-foreground">Двусторонняя синхронизация Импульсов</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl w-full sm:w-auto" disabled>Подключить</Button>
      </div>
    </div>
  );
}
