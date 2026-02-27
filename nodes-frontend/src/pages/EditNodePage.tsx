import { useParams } from "react-router-dom";
import { EditNodeForm } from "@/features/nodes/components/EditNodeForm";

/**
 * Страница редактирования существующего узла
 */
export default function EditNodePage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        ID узла не указан
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <EditNodeForm nodeId={id} />
    </div>
  );
}
