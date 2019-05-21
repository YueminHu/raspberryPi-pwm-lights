import * as React from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { Route, Switch, withRouter, RouteComponentProps, Link } from "react-router-dom";

import * as styles from "./style.module.less";

import Home from "./pages/home";
import Secondary from "./pages/second";

export const routeStyles: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  height: "100%",
  width: "100%",
  // backgroundColor: "rgb(247, 247, 242)",
  boxSizing: "border-box",
  overflowY: "scroll"
};

class App extends React.PureComponent<RouteComponentProps, {}> {
  state = {};
  componentDidMount() {
    const shade = document.querySelector("#loading");
    shade && shade.remove();
  }
  render() {
    const { location, history, match } = this.props;
    return (
      <div
        style={{
          // backgroundColor: "#F7F7F2",
          height: "100%"
        }}
      >
        <Home />
      </div>
    );
  }
}

export default App;
