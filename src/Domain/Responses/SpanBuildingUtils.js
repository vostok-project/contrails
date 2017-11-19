// @flow
import moment from "moment";
import _ from "lodash";

import type { SpanInfo } from "../SpanInfo";

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
}

function timestamp(relativeValue: number): string {
    return moment("2013-02-08T12:00:00.0000000Z")
        .add(relativeValue, "ms")
        .format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSZ");
}

function addOffset(absoluteValue: string, offset: number): string {
    return moment("2013-02-08T12:00:00.0000000Z")
        .add(moment(absoluteValue).diff("2013-02-08T12:00:00.0000000Z") + offset, "ms")
        .format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSZ");
}

// eslint-disable-next-line max-params
export function createSpan(
    name: string, host: string,
    from: number,
    to: number,
    isClientSpan: boolean,
    chlidren?: Array<Array<SpanInfo>>
): Array<SpanInfo> {
    const id = guid();
    return [
        {
            BeginTimestamp: timestamp(from),
            EndTimestamp: timestamp(to),
            TraceId: "831a3146-d50f-4fe1-b91e-d37b3197670d",
            SpanId: id,
            ParentSpanId: null,
            OperationName: "Name",
            Annotations: {
                OriginId: name,
                OriginHost: host,
                IsClientSpan: isClientSpan,
            },
        },
        ..._.flatten(chlidren || []).map(x => ({
            ...x,
            ParentSpanId: x.ParentSpanId == null ? id : x.ParentSpanId,
        })),
    ];
}

export function createSpanR(
    name: string, host: string,
    from: number,
    to: number,
    isClientSpan: boolean,
    chlidren?: Array<Array<SpanInfo>>
): Array<SpanInfo> {
    const id = guid();
    return [
        {
            BeginTimestamp: timestamp(from),
            EndTimestamp: timestamp(to),
            TraceId: "831a3146-d50f-4fe1-b91e-d37b3197670d",
            SpanId: id,
            ParentSpanId: null,
            OperationName: "Name",
            Annotations: {
                OriginId: name,
                OriginHost: host,
                IsClientSpan: isClientSpan,
            },
        },
        ..._.flatten(chlidren || []).map(x => ({
            ...x,
            BeginTimestamp: addOffset(x.BeginTimestamp, from),
            EndTimestamp: addOffset(x.EndTimestamp, from),
            ParentSpanId: x.ParentSpanId == null ? id : x.ParentSpanId,
        })),
    ];
}

export function createSpanR2(
    name: string, host: string,
    from: number,
    to: number,
    isClientSpan: boolean,
    chlidren?: Array<Array<SpanInfo>>
): Array<SpanInfo> {
    const id = guid();
    return [
        {
            BeginTimestamp: timestamp(from),
            EndTimestamp: timestamp(to),
            TraceId: "831a3146-d50f-4fe1-b91e-d37b3197670d",
            SpanId: id,
            ParentSpanId: null,
            OperationName: "Name",
            Annotations: {
                OriginId: name,
                OriginHost: host,
                IsClientSpan: isClientSpan,
            },
        },
        ..._.flatten(chlidren || []).map(x => ({
            ...x,
            BeginTimestamp: addOffset(x.BeginTimestamp, from),
            EndTimestamp: addOffset(x.EndTimestamp, to),
            ParentSpanId: x.ParentSpanId == null ? id : x.ParentSpanId,
        })),
    ];
}