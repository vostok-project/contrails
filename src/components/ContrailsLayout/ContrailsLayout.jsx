// @flow
import * as React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

import cn from "./ContrailsLayout.less";

type ContrailsLayoutProps = {
    children: React.Node,
    header?: React.Node,
};

type ContrailsLayoutState = {};

export default class ContrailsLayout extends React.Component<ContrailsLayoutProps, ContrailsLayoutState> {
    props: ContrailsLayoutProps;
    state: ContrailsLayoutState;

    render(): React.Element<*> {
        const { children, header } = this.props;
        return (
            <div className={cn("container")}>
                <div className={cn("header")}>
                    <Link to="/" className={cn("logo")}>
                        <span className={cn("logo-icon")} />
                        <span className={cn("logo-text")}>Contrails</span>
                    </Link>
                    {header && <div className={cn("header-content")}>{header}</div>}
                </div>
                <div className={cn("content")}>
                    <Helmet defaultTitle="Contrails | SKB Kontur" titleTemplate="%s | Contrails | SKB Kontur" />
                    {children}
                </div>
            </div>
        );
    }
}
