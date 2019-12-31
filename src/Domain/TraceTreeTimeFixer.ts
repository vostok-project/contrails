import { IDataExtractor } from "./IDataExtractor";
import { SpanNode } from "./TraceTree/SpanNode";

export class TraceTreeTimeFixer {
    private readonly traceTree: SpanNode;
    private readonly dataExtractor: IDataExtractor;

    public constructor(traceTree: SpanNode, dataExtractor: IDataExtractor) {
        this.traceTree = traceTree;
        this.dataExtractor = dataExtractor;
    }

    public fix(): void {
        this.traverseTree(this.traceTree);
    }

    private traverseTree(node: SpanNode, parent?: SpanNode, offset?: number): void {
        if (parent != undefined) {
            const parentHostName = this.dataExtractor.getHostName(parent.source);
            const nodeHostName = this.dataExtractor.getHostName(node.source);

            if (nodeHostName !== parentHostName) {
                offset = parent.from - node.from;
            }
        }
        
        if (offset != undefined) {
            node.from += offset;
            node.to += offset;
        }
        
        for (const child of node.children) {
            this.traverseTree(child, node, offset);
        }
    }
}
