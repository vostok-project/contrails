// @flow
import * as React from "react";
import { connect } from "react-redux";

import type { TraceInfo } from "../../Domain/TraceInfo";
import { TraceInfoUtils } from "../../Domain/TraceInfo";
import type { SpanInfo } from "../../Domain/SpanInfo";
import type { SpanNode } from "../../Domain/TraceTree/SpanNode";
import { reduceTree, filterNodesBy } from "../../Domain/Utils/TreeTraverseUtils";
import SpansToLinesArranger from "../../Domain/SpanLines/SpansToLinesArranger";
import type { SpanLines, SpanLineItem } from "../../Domain/SpanLines/SpansToLinesArranger";
import handleCustomDrawItem from "../../Domain/ItemDrawer";
import TraceTreeBuilder from "../../Domain/TraceTree/TraceTreeBuilder";
import LostSpanFixer from "../../Domain/TraceTree/LostSpanFixer";
import type { SpanFactory } from "../../Domain/TraceTree/LostSpanFixer";
import {
    ContrailPanelsContainer,
    ContrailPanelsTop,
    ContrailPanelsBottom,
    ContrailPanelsBottomLeft,
    ContrailPanelsBottomRight,
} from "../ContrailPanels/ContrailPanels";
import ProfilerChartWithMinimap from "../ProfilerChartWithMinimap/ProfilerChartWithMinimap";
import TraceTreeGrid from "../TraceTreeGrid/TraceTreeGrid";
import SpanInfoView from "../SpanInfoView/SpanInfoView";
import Tabs from "../Tabs/Tabs";

import cn from "./TraceViewer.less";

type TimeRange = { from: number, to: number };

type ChartData = {
    lines: SpanLines,
};

type TraceViewerProps = {
    traceInfo: TraceInfo,
    onChangeViewPort: TimeRange => void,
};

type TraceViewerState = {
    focusedSpanNode: ?SpanNode,
    traceTree: SpanNode,
    spanLines: ChartData,
    timeRange: TimeRange,
    viewPort: TimeRange,
};

function fakeSpanFactory(traceId: string): SpanFactory<SpanInfo> {
    return (spanId: string, parentSpanId: ?string, beginTimestamp: string, endTimestamp: string): SpanInfo => ({
        TraceId: traceId,
        SpanId: spanId,
        ParentSpanId: parentSpanId,
        OperationName: "FakeSpan",
        BeginTimestamp: beginTimestamp,
        EndTimestamp: endTimestamp,
        Annotations: {},
    });
}

class TraceViewer extends React.Component<TraceViewerProps, TraceViewerState> {
    props: TraceViewerProps;
    state: TraceViewerState;

    constructor(props: TraceViewerProps) {
        super(props);
        const treeBuilder = new TraceTreeBuilder();
        const lostSpanFixer = new LostSpanFixer();
        const recoveredSpan = lostSpanFixer.fix(props.traceInfo.Spans, fakeSpanFactory(props.traceInfo.TraceId));
        const traceTree = treeBuilder.buildTraceTree(recoveredSpan);
        this.state = {
            focusedSpanNode: null,
            traceTree: traceTree,
            spanNodesMap: treeBuilder.buildNodeMap(traceTree),
            spanLines: this.generateDataFromDiTraceResponse(traceTree),
            timeRange: this.getFromAndTo(props.traceInfo),
            viewPort: this.getFromAndTo(props.traceInfo),
        };
        props.onChangeViewPort(this.getFromAndTo(props.traceInfo));
    }

    generateDataFromDiTraceResponse(traceTree: SpanNode): ChartData {
        const arranger = new SpansToLinesArranger();
        return { lines: arranger.arrange(traceTree) };
    }

    getFromAndTo(traceInfo: TraceInfo): { from: number, to: number } {
        return TraceInfoUtils.getTraceTimeRange(traceInfo);
    }

    handleTreeGridChangeFocusedItems = (spanNode: SpanNode) => {
        this.setState({ focusedSpanNode: spanNode });
    };

    handleChartItemClick = (spanLineItem: SpanLineItem) => {
        this.setState({ focusedSpanNode: spanLineItem.source });
    };

    getSelectedSpanLineItem(): Array<SpanLineItem> {
        const { focusedSpanNode, spanLines } = this.state;
        if (focusedSpanNode == null) {
            return [];
        }
        for (const line of spanLines.lines) {
            for (const item of line.items) {
                if (item.source === focusedSpanNode) {
                    return [item];
                }
            }
        }
        return [];
    }

    renderFullCallStack = (): React.Node => {
        const { traceTree, focusedSpanNode, timeRange } = this.state;
        return (
            <TraceTreeGrid
                totalTimeRange={timeRange}
                focusedItem={focusedSpanNode}
                traceTree={traceTree}
                onItemClick={this.handleTreeGridChangeFocusedItems}
                onChangeFocusedItem={this.handleTreeGridChangeFocusedItems}
            />
        );
    };

    filterTreeByViewPort(root: SpanNode): SpanNode {
        const { viewPort } = this.state;
        return reduceTree(
            root,
            filterNodesBy(
                x =>
                    (viewPort.from < x.from && x.from < viewPort.to) ||
                    (viewPort.from < x.to && x.to < viewPort.to) ||
                    (x.from < viewPort.from && viewPort.to < x.to),
                (x, y) => ({ ...x, children: y })
            ),
            x => x.children
        );
    }

    renderCallStack = (): React.Node => {
        const { traceTree, focusedSpanNode } = this.state;
        return (
            <TraceTreeGrid
                totalTimeRange={null}
                focusedItem={focusedSpanNode}
                traceTree={this.filterTreeByViewPort(traceTree)}
                onItemClick={this.handleTreeGridChangeFocusedItems}
                onChangeFocusedItem={this.handleTreeGridChangeFocusedItems}
            />
        );
    };

    render(): React.Node {
        const { onChangeViewPort } = this.props;
        const { traceTree, focusedSpanNode, spanLines, timeRange } = this.state;
        return (
            <ContrailPanelsContainer>
                <ContrailPanelsTop>
                    <ProfilerChartWithMinimap
                        selectedItems={this.getSelectedSpanLineItem()}
                        onItemClick={this.handleChartItemClick}
                        onCustomDrawItem={handleCustomDrawItem}
                        from={timeRange.from}
                        to={timeRange.to}
                        data={spanLines}
                        onChangeViewPort={viewPort => {
                            this.setState({ viewPort: viewPort });
                            onChangeViewPort(viewPort);
                        }}
                    />
                </ContrailPanelsTop>
                <ContrailPanelsBottom>
                    <ContrailPanelsBottomLeft>
                        <Tabs
                            tabs={[
                                {
                                    name: "FullCallStack",
                                    caption: "Full call stack",
                                    renderContent: this.renderFullCallStack,
                                },
                                {
                                    name: "CallStack",
                                    caption: "Call stack",
                                    renderContent: this.renderCallStack,
                                },
                            ]}
                        />
                    </ContrailPanelsBottomLeft>
                    <ContrailPanelsBottomRight>
                        <div className={cn("span-info-view-container")}>
                            {focusedSpanNode != null && <SpanInfoView root={traceTree} span={focusedSpanNode} />}
                        </div>
                    </ContrailPanelsBottomRight>
                </ContrailPanelsBottom>
            </ContrailPanelsContainer>
        );
    }
}

export default connect(
    () => ({}),
    dispatch => ({
        onChangeViewPort: viewPort => dispatch({ type: "ChangeViewPort", viewPort: viewPort }),
    })
)(TraceViewer);
