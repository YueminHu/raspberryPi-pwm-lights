import * as React from "react";
import InputRange from "react-input-range";
import "react-input-range/lib/css/index.css";

import { routeStyles } from "App";
import { enquireStatus, PinStatus, closePin, openPin, adjustPin } from "apis";

import * as styles from "./index.module.less";
import PinControlPanel from "./pin_control_panel";

type State = {
  expandedPin: number;
};

const pins = [12, 32, 33, 35];

export default class Home extends React.PureComponent<{}, State> {
  state: State = {
    expandedPin: null
  };
  handlePanelExpand = (pin: number) => {
    this.setState({
      expandedPin: pin === this.state.expandedPin ? null : pin
    });
  };
  render() {
    const { expandedPin } = this.state;
    return (
      <div className={`main ${styles.wrapper}`} style={{ ...routeStyles }}>
        {pins.map(pin => (
          <PinControlPanel pinNum={pin} key={pin} expanded={expandedPin === pin} onClick={() => this.handlePanelExpand(pin)} />
        ))}
      </div>
    );
  }
}
