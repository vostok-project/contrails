import _ from "lodash";
import * as React from "react";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";

import { ArrowTriangleDown, ArrowTriangleRight } from "../../Commons/ui";
import { findNodesPathTo } from "../../Domain/Utils/FindNodesPathToVisitor";
import { VirtualTable, VirtualTableType } from "../VirtualTable/VirtualTable";

import cn from "./TreeGrid.less";

export interface ColumnDefinition<TItem> {
    name: string;
    renderHeader: () => React.ReactNode;
    renderValue: (item: TItem, focused: boolean, highlighted: boolean) => React.ReactNode;
    width?: number;
    align?: "right" | "left" | "center";
    mainCell?: boolean;
    cellClassName?: string;
}

export interface TreeGridProps<TItem> {
    data: TItem[];
    filterNodes?: (item: TItem) => boolean;
    columns: Array<ColumnDefinition<TItem>>;
    focusedItem?: TItem;
    highlightStack: boolean;
    onItemClick?: (item: TItem) => void;
    expandedItems: TItem[];
    onGetItemColor?: (item: TItem) => undefined | string;
    onGetChildren: (item: TItem) => undefined | TItem[];
    onChangeExpandedItems: (items: TItem[]) => void;
    onChangeFocusedItem: (item: TItem) => void;
}

interface TreeGridState<TItem> {
    visibleRows: Array<VisibleRowInfo<TItem>>;
    columnWidths: { [name: string]: undefined | number };
}

interface VisibleRowInfo<TItem> {
    item: TItem;
    parents: TItem[];
    key: string;
}

export class TreeGrid<TItem> extends React.Component<TreeGridProps<TItem>, TreeGridState<TItem>> {
    public state: TreeGridState<TItem> = {
        visibleRows: [],
        columnWidths: {},
    };
    private readonly highlightedItems: Set<TItem> = new Set<TItem>();
    private readonly table = React.createRef<VirtualTableType<VisibleRowInfo<TItem>>>();

    public UNSAFE_componentWillMount(): void {
        const expandedItems = this.getExpandedForFocusedItemAndUpdate(this.props.focusedItem, this.props.expandedItems);
        this.updateHighlightedItems(this.props.focusedItem);
        const rows = this.buildRows(this.props.data, expandedItems);
        this.setState({
            visibleRows: rows,
        });
    }

    public UNSAFE_componentWillReceiveProps(nextProps: TreeGridProps<TItem>): void {
        const expandedItems = this.getExpandedForFocusedItem(this.props.focusedItem, this.props.expandedItems);
        const nextExpandedItems = this.getExpandedForFocusedItemAndUpdate(
            nextProps.focusedItem,
            nextProps.expandedItems
        );
        if (this.props.focusedItem !== nextProps.focusedItem) {
            this.updateHighlightedItems(nextProps.focusedItem);
        }
        if (
            expandedItems !== nextExpandedItems ||
            this.props.filterNodes !== nextProps.filterNodes ||
            this.props.data !== nextProps.data
        ) {
            const rows = this.buildRows(nextProps.data, nextExpandedItems);
            this.setState({
                visibleRows: rows,
            });
        }
    }

    public componentDidUpdate(prevProps: TreeGridProps<TItem>): void {
        if (this.props.focusedItem !== prevProps.focusedItem) {
            const item = this.state.visibleRows.find(x => x.item === this.props.focusedItem);
            if (item != undefined && this.table.current != undefined) {
                this.table.current.scrollIntoView(item);
            }
        }
    }

    public render(): JSX.Element {
        return (
            <VirtualTable
                ref={this.table}
                onKeyDown={this.handleTableKeyPress}
                tableClassName={cn("table")}
                renderHeader={this.renderHeader}
                headerHeight={16}
                rowHeight={20}
                renderRow={this.renderVisibleRow}
                data={this.state.visibleRows}
            />
        );
    }

    private buildRows(data: TItem[], expandedItems: TItem[]): Array<VisibleRowInfo<TItem>> {
        return data
            .map((x, index) => this.buildVisibleRows(index.toString(), x, [], expandedItems))
            .reduce(flatten, []);
    }

    private isNodeVisibleRecursive(node: TItem): boolean {
        const { onGetChildren, filterNodes } = this.props;
        const itemChildren = onGetChildren(node);
        if (itemChildren == undefined || itemChildren.length === 0) {
            return !filterNodes || filterNodes(node);
        }
        return !filterNodes || filterNodes(node) || itemChildren.some(x => this.isNodeVisibleRecursive(x));
    }

    private buildVisibleRows(
        key: string,
        item: TItem,
        parents: TItem[],
        expandedItems: TItem[]
    ): Array<VisibleRowInfo<TItem>> {
        const { onGetChildren, filterNodes } = this.props;
        const itemChildren = onGetChildren(item);
        const expanded = expandedItems.includes(item);
        let visibleChildren: Array<VisibleRowInfo<TItem>> = [];
        if (itemChildren == undefined || itemChildren.length === 0) {
            if (filterNodes && !filterNodes(item)) {
                return [];
            }
        } else if (expanded) {
            visibleChildren = (itemChildren || [])
                .map((x, index) => this.buildVisibleRows(`${key}_${index}`, x, [...parents, item], expandedItems))
                .reduce(flatten, []);
            if (visibleChildren.length === 0) {
                if (filterNodes && !filterNodes(item)) {
                    return [];
                }
            }
        } else if (!this.isNodeVisibleRecursive(item)) {
            return [];
        }
        return [
            {
                item: item,
                key: key,
                parents: parents,
            },
            ...visibleChildren,
        ];
    }

    private updateHighlightedItems(focusedItem: undefined | TItem): void {
        this.highlightedItems.clear();
        if (focusedItem != undefined) {
            this.highlightedItems.clear();
            const nodes = findNodeTo(focusedItem, this.props.data, this.props.onGetChildren);
            for (const node of nodes) {
                this.highlightedItems.add(node);
            }
            this.highlightedItems.add(focusedItem);
        }
    }

    private getExpandedForFocusedItemAndUpdate(focusedItem: undefined | TItem, expandedItems: TItem[]): TItem[] {
        const { onChangeExpandedItems } = this.props;
        if (focusedItem == undefined) {
            return expandedItems;
        }
        const nodes = findNodeTo(focusedItem, this.props.data, this.props.onGetChildren);
        if (nodes.every(x => expandedItems.includes(x))) {
            return expandedItems;
        }
        onChangeExpandedItems(_.union(expandedItems || [], nodes));
        return _.union(expandedItems || [], nodes);
    }

    private getExpandedForFocusedItem(focusedItem: undefined | TItem, expandedItems: TItem[]): TItem[] {
        if (focusedItem == undefined) {
            return expandedItems;
        }
        const nodes = findNodeTo(focusedItem, this.props.data, this.props.onGetChildren);
        if (nodes.every(x => expandedItems.includes(x))) {
            return expandedItems;
        }
        return _.union(expandedItems || [], nodes);
    }

    private getItemColor(item: TItem): string {
        const { onGetItemColor } = this.props;
        const defaultColor = "#000";
        if (onGetItemColor != undefined) {
            return onGetItemColor(item) || defaultColor;
        }
        return defaultColor;
    }

    private updateExpandedItems(updateAction: (items: TItem[]) => TItem[]): void {
        const { expandedItems, onChangeExpandedItems } = this.props;
        onChangeExpandedItems(updateAction(expandedItems));
    }

    private handleToggleItemExpand(item: TItem): void {
        const { focusedItem, expandedItems, onChangeExpandedItems, onChangeFocusedItem } = this.props;
        if (expandedItems.includes(item)) {
            if (focusedItem == undefined) {
                onChangeExpandedItems(_.difference(expandedItems, [item]));
            } else {
                const nodes = findNodeTo(focusedItem, this.props.data, this.props.onGetChildren);
                const index = nodes.indexOf(item);
                if (index >= 0) {
                    const nodeToHide = nodes.slice(index);
                    onChangeFocusedItem(item);
                    onChangeExpandedItems(_.difference(expandedItems, nodeToHide));
                } else {
                    onChangeExpandedItems(_.difference(expandedItems, [item]));
                }
            }
        } else {
            onChangeExpandedItems(_.union(expandedItems, [item]));
        }
    }

    private renderParentBlock(item: TItem): JSX.Element {
        return (
            <div
                className={cn("parent-line", { highlighted: this.highlightedItems.has(item) })}
                style={{ backgroundColor: this.getItemColor(item) }}>
                &nbsp;
            </div>
        );
    }

    private renderCells(item: TItem, parents: TItem[]): React.ReactNode {
        const { columns } = this.props;
        return columns.map(x => this.renderCell(x, item, parents));
    }

    private renderCell(column: ColumnDefinition<TItem>, item: TItem, parents: TItem[]): JSX.Element {
        const { onGetChildren, focusedItem } = this.props;
        const itemChildren = onGetChildren(item);
        const expanded = this.props.expandedItems.includes(item);
        const highlighted =
            this.props.highlightStack && this.highlightedItems.size > 0 ? this.highlightedItems.has(item) : true;

        if (column.mainCell) {
            return (
                <td
                    key={column.name}
                    className={cn("item-cell", "main-cell", column.cellClassName)}
                    style={{
                        width: this.state.columnWidths[column.name] ?? column.width ?? "100%",
                    }}>
                    {parents.map(x => this.renderParentBlock(x))}
                    <span>
                        <button
                            className={cn("expand-button")}
                            onClick={(e: React.SyntheticEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                this.handleToggleItemExpand(item);
                            }}>
                            {itemChildren != undefined &&
                                itemChildren.length > 0 &&
                                (expanded ? <ArrowTriangleDown /> : <ArrowTriangleRight />)}
                        </button>
                        {column.renderValue(item, focusedItem === item, highlighted)}
                    </span>
                </td>
            );
        }
        return (
            <td
                key={column.name}
                className={cn("item-cell", column.cellClassName)}
                style={{
                    width: this.state.columnWidths[column.name] ?? column.width,
                    maxWidth: this.state.columnWidths[column.name] ?? column.width,
                    textAlign: column.align,
                }}>
                {column.renderValue(item, focusedItem === item, highlighted)}
            </td>
        );
    }

    private renderHeaderCell(column: ColumnDefinition<TItem>): React.ReactNode {
        const currentColumnWidth = this.state.columnWidths[column.name] ?? column.width;
        return (
            <th
                key={column.name}
                style={{
                    position: "relative",
                    overflow: "visible",
                    width: currentColumnWidth,
                    maxWidth: currentColumnWidth,
                }}>
                {column.renderHeader()}
                {currentColumnWidth && (
                    <Draggable
                        axis="x"
                        position={{ x: 0, y: 0 }}
                        onStop={(e, dragInfo) => {
                            this.setState({
                                columnWidths: {
                                    ...this.state.columnWidths,
                                    [column.name]: currentColumnWidth + dragInfo.x,
                                },
                            });
                        }}>
                        <div
                            style={{
                                cursor: "e-resize",
                                position: "absolute",
                                width: 10,
                                right: -5,
                                top: 0,
                                bottom: 0,
                                zIndex: 5,
                            }}>
                            <div
                                style={{
                                    position: "absolute",
                                    width: 1,
                                    left: 5,
                                    top: 0,
                                    bottom: 0,
                                    backgroundColor: "#ccc",
                                }}
                            />
                        </div>
                    </Draggable>
                )}
            </th>
        );
    }

    private buildItemsFlatList(): TItem[] {
        const { data, onGetChildren } = this.props;

        const buildItemsFlatListFrom = (root: TItem): TItem[] => {
            const result = [root];
            if (this.props.expandedItems.includes(root)) {
                for (const child of onGetChildren(root) || []) {
                    result.push(...buildItemsFlatListFrom(child));
                }
            }
            return result;
        };

        return data.map(buildItemsFlatListFrom).reduce(flatten, []);
    }

    private findPreviousExpandedItem(item: TItem): undefined | TItem {
        const flatList = this.buildItemsFlatList();
        const itemIndex = flatList.indexOf(item);
        return flatList[Math.max(itemIndex - 1, 0)];
    }

    private findNextExpandedItem(item: TItem): undefined | TItem {
        const flatList = this.buildItemsFlatList();
        const itemIndex = flatList.indexOf(item);
        return flatList[Math.min(itemIndex + 1, flatList.length - 1)];
    }

    private readonly handleTableKeyPress = (e: React.KeyboardEvent<HTMLTableElement>) => {
        const { focusedItem, onChangeFocusedItem, onGetChildren } = this.props;
        if (onChangeFocusedItem == undefined) {
            return;
        }
        if (focusedItem != undefined && e.key === "ArrowUp") {
            const prevItem = this.findPreviousExpandedItem(focusedItem);
            if (prevItem != undefined) {
                onChangeFocusedItem(prevItem);
            }
            e.stopPropagation();
            e.preventDefault();
        }
        if (focusedItem != undefined && e.key === "ArrowDown") {
            const prevItem = this.findNextExpandedItem(focusedItem);
            if (prevItem != undefined) {
                onChangeFocusedItem(prevItem);
            }
            e.stopPropagation();
            e.preventDefault();
        }
        if (focusedItem != undefined && e.key === "ArrowLeft") {
            if (this.props.expandedItems.includes(focusedItem)) {
                this.updateExpandedItems(expandedItems => _.difference(expandedItems, [focusedItem]));
            }
            e.stopPropagation();
            e.preventDefault();
        }
        if (focusedItem != undefined && e.key === "ArrowRight") {
            if (!this.props.expandedItems.includes(focusedItem) && (onGetChildren(focusedItem) || []).length > 0) {
                this.updateExpandedItems(expandedItems => _.union(expandedItems, [focusedItem]));
            }
            e.stopPropagation();
            e.preventDefault();
        }
    };

    private readonly renderVisibleRow = (visibleRowInfo: VisibleRowInfo<TItem>, index: number): React.ReactNode => {
        const { key, item, parents } = visibleRowInfo;
        const { onItemClick, focusedItem } = this.props;
        const isItemFocused = focusedItem === item;
        const indexDiv2 = index % 2;

        return (
            <tr
                key={key}
                className={cn("item-row", { focused: isItemFocused, odd: indexDiv2 === 1, even: indexDiv2 === 0 })}
                onClick={() => {
                    if (onItemClick != undefined) {
                        onItemClick(item);
                    }
                }}>
                {this.renderCells(item, parents)}
            </tr>
        );
    };

    private readonly renderHeader = () => {
        const { columns } = this.props;
        return <tr className={cn("head-row")}>{columns.map(x => this.renderHeaderCell(x))}</tr>;
    };
}

function flatten<T>(memo: T[], items: T[]): T[] {
    for (const item of items) {
        memo.push(item);
    }
    return memo;
}

function findNodeTo<TItem>(item: TItem, data: TItem[], onGetChildren: (item: TItem) => undefined | TItem[]): TItem[] {
    const result = data.map(rootNode => findNodesPathTo(rootNode, item, onGetChildren)).reduce(flatten, []);
    return result.slice(1);
}
