import { Check, FileText, Pencil, Trash2 } from "lucide-react";
import StatusBadge from "../common/StatusBadge.jsx";
import BlockPreview from "../preview/BlockPreview.jsx";

export default function ContentCard({ block, onEdit, onDelete, onToggle }) {
  return (
    <article className={`content-card type-${block.type.toLowerCase()}`}>
      <div className="content-card-head">
        <span className="block-type">{block.type}</span>
        <strong>{String(block.order).padStart(2, "0")}</strong>
        <div className="card-actions">
          <button title="Toggle active" onClick={onToggle}><Check size={16} /></button>
          <button title="Edit block" onClick={onEdit}><Pencil size={16} /></button>
          <button title="Delete block" className="danger" onClick={onDelete}><Trash2 size={16} /></button>
        </div>
      </div>
      <BlockPreview block={block} compact />
      {block.fileName && <span className="attached-file"><FileText size={14} /> {block.fileName}</span>}
      <StatusBadge active={block.isActive} label={block.isActive ? "Active" : "Inactive"} muted={!block.isActive} />
    </article>
  );
}