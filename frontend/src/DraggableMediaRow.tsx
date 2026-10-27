import type { HTMLAttributes } from "react";
import { useCollectionDrag } from "./CollectionDnd";
import type { CollectionDrag } from "./collectionDrag";

export default function DraggableMediaRow({dragData,...props}:HTMLAttributes<HTMLTableRowElement>&{dragData:CollectionDrag}){
  const drag=useCollectionDrag(dragData);
  return <tr {...props} {...drag}/>;
}
