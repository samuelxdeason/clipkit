import { IconButton } from "./UIControls";
import { Icon } from "./App";

export default function ViewerHeader({ title, titleId, eyebrow, closeLabel, onClose, className = "" }: {
  title: string; titleId?: string; eyebrow?: string; closeLabel: string; onClose: () => void; className?: string;
}) {
  return <header className={`viewer-header ${className}`}><div>{eyebrow && <span className="viewer-eyebrow">{eyebrow}</span>}<h2 id={titleId} title={title}>{title}</h2></div><IconButton label={closeLabel} onClick={onClose}><Icon name="x" /></IconButton></header>;
}
