import * as React from "react";
import { RouteComponentProps } from "react-router";

import { routeStyles } from "App";
import { Link } from "react-router-dom";

interface Props extends RouteComponentProps {}

export default class Secondary extends React.PureComponent<Props, {}> {
  elem: HTMLDivElement;
  state = {};
  static getDerivedStateFromProps(props: Props) {
    // console.log(props.location);
    return null;
  }
  // componentWillUpdate(nextProps) {
  //   console.log(this.props, nextProps);
  // }
  render() {
    const { location } = this.props;
    return (
      <div className={`secondaryWrapper`} style={{ ...routeStyles, backgroundColor: "#FFF6BE" }} ref={elem => (this.elem = elem)}>
        <p className={"title"}>nested</p>
        <p>
          <Link to={`${location.pathname}/nested`}>to further nested</Link>
        </p>
      </div>
    );
  }
}
