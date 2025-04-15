// file in src/components/
import { useDragLayer } from "react-dnd";

const layerStyles = {
  position: "absolute",
  pointerEvents: "none",
  zIndex: 99,
  left: 0,
  top: 0,
  width: "100%",
  height: "100%",
};

function getItemStyles(initialOffset, currentOffset) {
  if (!initialOffset || !currentOffset) return null;
  return {
    x1: initialOffset.x,
    y1: initialOffset.y,
    x2: currentOffset.x,
    y2: currentOffset.y,
  };
}

function CustomDragLayer({ dragStartPos }) {
  const {
    itemType,
    isDragging,
    initialClientOffset,
    clientOffset,
  } = useDragLayer((monitor) => ({
    itemType: monitor.getItemType(),
    isDragging: monitor.isDragging(),
    initialClientOffset: monitor.getInitialClientOffset(),
    clientOffset: monitor.getClientOffset(),
  }));

  if (!isDragging || !dragStartPos) return null;

  const coords = getItemStyles(initialClientOffset, clientOffset);
  if (!coords) return null;

  const rect = document.getElementById("mappa")?.getBoundingClientRect();
  if (!rect) return null;

  const offsetX = rect.left;
  const offsetY = rect.top;

  return (
    <svg style={layerStyles}>
      <line
        x1={dragStartPos.x+ 50}
        y1={dragStartPos.y + 90}
        x2={coords.x2 - offsetX + 50}
        y2={coords.y2 - offsetY + 90}
        stroke="black"
        strokeWidth="4"
        strokeDasharray="8,5"
      />
    </svg>
  );
}

export default CustomDragLayer;