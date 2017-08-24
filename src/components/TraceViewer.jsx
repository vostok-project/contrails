// @flow
import * as React from "react";
import moment from "moment";
import glamurous from "glamorous";

import type { TraceInfo } from "../Domain/TraceInfo";
import type { TraceTree, SpanNode } from "../Domain/TraceTree";
import type { SpanInfo } from "../Domain/SpanInfo";
import SpansToLinesArranger from "../Domain/SpansToLines";
import handleCustomDrawItem from "../Domain/ItemDrawer";
import { buildTraceTree } from "../Domain/TraceTree";

import {
    ContrailPanelsContainer,
    ContrailPanelsTop,
    ContrailPanelsBottom,
    ContrailPanelsBottomLeft,
    ContrailPanelsBottomRight,
} from "./ContrailPanels";
import ProfilerChartWithMinimap from "./ProfilerChartWithMinimap";
import TraceTreeGrid from "./TraceTreeGrid";
import SpanInfoView from "./SpanInfoView";

type TraceViewerProps = {
    traceInfo: TraceInfo,
};

type TraceViewerState = {
    focusedSpanNode: ?SpanNode,
    traceTree: TraceTree,
};

function min(x: number, y: number): number {
    return Math.min(x, y);
}

function max(x: number, y: number): number {
    return Math.max(x, y);
}

export default class TraceViewer extends React.Component<TraceViewerProps, TraceViewerState> {
    props: TraceViewerProps;
    state: TraceViewerState;

    constructor(props: TraceViewerProps) {
        super(props);
        this.state = {
            focusedSpanNode: null,
            traceTree: buildTraceTree(props.traceInfo.Spans),
        };
    }

    generateDataFromDiTraceResponse(response: TraceInfo): { lines: { items: SpanInfo[] }[] } {
        const arranger = new SpansToLinesArranger();
        const spans = response.Spans;
        return { lines: arranger.arrange(spans) };
    }

    getFromAndTo(traceInfo: TraceInfo): { from: number, to: number } {
        const spans = traceInfo.Spans;
        const result = {
            from: spans.map(x => x.BeginTimestamp).map(x => moment(x)).map(x => x.valueOf()).reduce(min),
            to: spans.map(x => x.EndTimestamp).map(x => moment(x)).map(x => x.valueOf()).reduce(max),
        };
        return result;
    }

    handleItemClick = (spanNode: SpanNode) => {
        this.setState({ focusedSpanNode: spanNode });
    };

    render(): React.Node {
        const { traceInfo } = this.props;
        const { traceTree, focusedSpanNode } = this.state;
        return (
            <ContrailPanelsContainer>
                <ContrailPanelsTop>
                    <ProfilerChartWithMinimap
                        onCustomDrawItem={handleCustomDrawItem}
                        {...this.getFromAndTo(traceInfo)}
                        data={this.generateDataFromDiTraceResponse(traceInfo)}
                    />
                </ContrailPanelsTop>
                <ContrailPanelsBottom>
                    <ContrailPanelsBottomLeft>
                        <TraceTreeGrid traceTree={traceTree} onItemClick={this.handleItemClick} />{" "}
                    </ContrailPanelsBottomLeft>
                    <ContrailPanelsBottomRight>
                        <SpanInfoViewContainer>
                            {focusedSpanNode && <SpanInfoView spanInfo={focusedSpanNode.source} />}
                        </SpanInfoViewContainer>
                    </ContrailPanelsBottomRight>
                </ContrailPanelsBottom>
            </ContrailPanelsContainer>
        );
    }
}

const SpanInfoViewContainer = glamurous.div({
    padding: 10,
});