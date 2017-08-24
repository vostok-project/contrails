// @flow
import DatabaseIcon from "../components/Icons/db.png";

import itemColors from "./Colors";

const DatabaseImage = new Image(14, 14);
DatabaseImage.src = DatabaseIcon;

function fittingString(context: CanvasRenderingContext2D, str: string, maxWidth: number): string {
    let width = context.measureText(str).width;
    const ellipsis = "…";
    const ellipsisWidth = context.measureText(ellipsis).width;
    let result = str;
    if (width <= maxWidth || width <= ellipsisWidth) {
        return result;
    }
    let len = result.length;
    while (width >= maxWidth - ellipsisWidth && len-- > 0) {
        result = result.substring(0, len);
        width = context.measureText(result).width;
    }
    return result + ellipsis;
}

export default function handleCustomDrawItem(
    context: CanvasRenderingContext2D,
    item: ProfilerItem,
    itemContext: ItemDrawContext
) {
    context.save();
    try {
        const { width, lineHeight } = itemContext;
        const { selected, hovered } = itemContext.options;
        if (hovered) {
            context.fillStyle = itemColors[0].hoverBackground;
            context.fillRect(0, 0, width, lineHeight);
        } else {
            context.fillStyle = itemColors[0].background;
            context.fillRect(0, 0, width, lineHeight);
        }
        if (selected) {
            context.lineWidth = 3;
            context.strokeStyle = itemColors[0].border;
            context.strokeRect(1.5, 1.5, width - 3, lineHeight - 3);
        } else {
            context.strokeStyle = itemColors[0].border;
            context.strokeRect(0.5, 0.5, width - 1, lineHeight - 1);
        }

        if (itemContext.width > 50) {
            context.drawImage(DatabaseImage, 0, 0, DatabaseImage.width, DatabaseImage.height, 4 + 2, 6, 14, 14);

            context.fillStyle = itemColors[0].text;
            context.font = "14px Segoe UI";
            context.fillText(fittingString(context, item.name || "undefined", width - (8 + 18)), 8 + 18, 14 + 4);

            context.fillStyle = itemColors[0].text;
            context.font = "12px Segoe UI";
            context.fillText(fittingString(context, item.name || "undefined", width - 8), 8, 14 + 4 + 22);
        }
    } finally {
        context.restore();
    }
}
