/**
 * Copyright (c) 2026 Web-Zhaba. All rights reserved.
 * DataTab Component - Local Data Management (Export / Import / Clear)
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Upload, Trash2, Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalDatabase } from "@/store/useLocalDatabase";
import { useQueryClient } from "@tanstack/react-query";

export function DataTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const dataStr = useLocalDatabase.getState().exportData();
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `nodes_backup_${new Date().toISOString().split("T")[0]}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      toast.success(t("profile.data.exportSuccess", "Резервная копия успешно экспортирована"));
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("profile.data.exportError", "Ошибка экспорта данных"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const success = await useLocalDatabase.getState().importData(text);

        if (success) {
          toast.success(t("profile.data.importSuccess", "Данные успешно импортированы"));
          // Invalidate React Query queries to refresh UI
          queryClient.invalidateQueries();
          // Reset file input value
          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          toast.error(t("profile.data.importInvalid", "Неверный формат резервной копии"));
        }
      } catch (error) {
        console.error("Import error:", error);
        toast.error(t("profile.data.importError", "Ошибка при разборе файла резервной копии"));
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const handleClearDatabase = async () => {
    if (!window.confirm(t("profile.data.clearConfirm", "Вы уверены, что хотите полностью стереть всю локальную базу данных? Это действие необратимо!"))) {
      return;
    }

    setIsClearing(true);
    try {
      await useLocalDatabase.getState().clearDatabase();
      toast.success(t("profile.data.clearSuccess", "Все локальные данные стерты"));
      queryClient.clear();
      // Force reload to completely reset UI state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Clear database error:", error);
      toast.error(t("profile.data.clearError", "Ошибка при удалении локальной базы"));
      setIsClearing(false);
    }
  };

  const handleRecalculateDecay = () => {
    try {
      useLocalDatabase.getState().recalculateAllDecay();
      queryClient.invalidateQueries();
      toast.success(t("profile.data.recalcSuccess", "Физика затухания пересчитана"));
    } catch (error) {
      console.error("Recalculate decay error:", error);
      toast.error(t("profile.data.recalcError", "Ошибка при пересчете физики"));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-4 sm:p-8 shadow-xl space-y-8">
        <div>
          <h2 className="text-xl font-bold">{t("profile.data.title", "Управление данными")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("profile.data.subtitle", "Поскольку Nodes работает полностью локально, все ваши данные хранятся на этом устройстве. Создавайте резервные копии для переноса.")}
          </p>
        </div>

        {/* Export Data */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-border/40">
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold">{t("profile.data.exportLabel", "Экспорт резервной копии")}</p>
            <p className="text-xs text-muted-foreground">
              {t("profile.data.exportDesc", "Скачать файл резервной копии .json со всеми вашими узлами и импульсами.")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl w-full sm:w-auto gap-2"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {t("profile.data.exportBtn", "Скачать JSON")}
          </Button>
        </div>

        {/* Import Data */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-border/40">
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold">{t("profile.data.importLabel", "Импорт резервной копии")}</p>
            <p className="text-xs text-muted-foreground">
              {t("profile.data.importDesc", "Восстановить узлы, связи и импульсы из ранее сохраненного файла резервной копии.")}
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-xl w-full sm:w-auto gap-2"
              onClick={handleImportClick}
              disabled={isImporting}
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {t("profile.data.importBtn", "Загрузить JSON")}
            </Button>
          </div>
        </div>

        {/* Physics recalculation trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-border/40">
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold">{t("profile.data.recalcLabel", "Пересчет стабильности")}</p>
            <p className="text-xs text-muted-foreground">
              {t("profile.data.recalcDesc", "Пересчитать показатели стабильности для всех узлов с учетом пропущенных дней.")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl w-full sm:w-auto gap-2"
            onClick={handleRecalculateDecay}
          >
            <RefreshCw className="w-4 h-4" />
            {t("profile.data.recalcBtn", "Пересчитать")}
          </Button>
        </div>

        {/* Purge Database */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold text-destructive">{t("profile.data.clearLabel", "Сброс базы данных")}</p>
            <p className="text-xs text-muted-foreground">
              {t("profile.data.clearDesc", "Полностью очистить IndexedDB и сбросить приложение до исходного состояния.")}
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl w-full sm:w-auto bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground border-destructive/20 transition-all duration-300"
            onClick={handleClearDatabase}
            disabled={isClearing}
          >
            {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            {t("profile.data.clearBtn", "Стереть все данные")}
          </Button>
        </div>
      </div>
    </div>
  );
}
