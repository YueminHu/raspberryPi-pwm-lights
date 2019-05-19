import * as React from "react";

import { Link, LinkProps } from "react-router-dom";

export default class Secondary extends React.PureComponent<LinkProps & { wrapper: HTMLDivElement }> {
  render() {
    console.log(this.props);
    // const { onClick } = this.props;
    return <Link {...this.props}>{this.props.children}</Link>;
  }
}
