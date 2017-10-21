// @flow
import * as React from "react";
import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";

import TraceTreeGrid from "../src/components/TraceTreeGrid/TraceTreeGrid";
import { TraceInfoUtils } from "../src/Domain/TraceInfo";
import TraceTreeBuilder from "../src/Domain/TraceTree/TraceTreeBuilder";
import Response53ee602db8d444d9a7a674471be6b709 from "../src/Domain/Responses/53ee602db8d444d9a7a674471be6b709.json";
import Responseaae265d9c1fa4c2c9d504c798ee9854a from "../src/Domain/Responses/aae265d9c1fa4c2c9d504c798ee9854a.json";

const data1 = new TraceTreeBuilder().buildTraceTree(Response53ee602db8d444d9a7a674471be6b709[0].Spans);
const data2 = new TraceTreeBuilder().buildTraceTree(Responseaae265d9c1fa4c2c9d504c798ee9854a[0].Spans);

storiesOf("TraceTreeGrid", module)
    .add("Default", () =>
        <TraceTreeGrid
            totalTimeRange={TraceInfoUtils.getTraceTimeRange(Response53ee602db8d444d9a7a674471be6b709[0])}
            traceTree={data1}
            onChangeFocusedItem={action("onChangeFocusedItem")}
        />
    )
    .add("WithFocusedItem", () =>
        <TraceTreeGrid
            totalTimeRange={TraceInfoUtils.getTraceTimeRange(Response53ee602db8d444d9a7a674471be6b709[0])}
            focusedItem={data1.children[0]}
            traceTree={data1}
            onChangeFocusedItem={action("onChangeFocusedItem")}
        />
    )
    .add("WithFocusedItem #1", () =>
        <TraceTreeGrid
            totalTimeRange={TraceInfoUtils.getTraceTimeRange(Response53ee602db8d444d9a7a674471be6b709[0])}
            focusedItem={data1.children[0].children[1]}
            traceTree={data1}
            onChangeFocusedItem={action("onChangeFocusedItem")}
        />
    )
    .add("WithFocusedItem #2", () =>
        <TraceTreeGrid
            totalTimeRange={TraceInfoUtils.getTraceTimeRange(Responseaae265d9c1fa4c2c9d504c798ee9854a[0])}
            focusedItem={data2.children[0].children[1]}
            traceTree={data2}
            onChangeFocusedItem={action("onChangeFocusedItem")}
        />
    );
