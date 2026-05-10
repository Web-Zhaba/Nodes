import { ForceGraph } from "@/entities/graph/ui/ForceGraph";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import type { GraphData } from "@/entities/graph/model/types";

interface GraphViewportProps {
  graphData: GraphData;
  onNodeClick: (id: string, kind: "node" | "core") => void;
  onOpenSidebar: () => void;
}

export function GraphViewport({
  graphData,
  onNodeClick,
  onOpenSidebar,
}: GraphViewportProps) {
  return (
    <div className="relative w-full h-full">
      <ForceGraph graphData={graphData} onNodeClick={onNodeClick} />

      {/* FAB (Floating Action Button) */}
      <div className="absolute bottom-6 right-6 z-10">
        <Button
          size="icon"
          className="w-14 h-14 rounded-[1.5rem] shadow-2xl shadow-primary/30 active:scale-95 transition-all"
          onClick={onOpenSidebar}
        >
          <Settings2 className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
