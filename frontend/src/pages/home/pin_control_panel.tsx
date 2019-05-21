import * as React from "react";
import InputRange from "react-input-range";
import "react-input-range/lib/css/index.css";

import { enquireStatus, PinStatus, closePin, openPin, adjustPin } from "apis";

// const pinNum = 32;

import styles from "./pin_control_panel.module.less";
import { pinColorMapping } from "./constants";

type PwmBrightness = {
  min: number;
  max: number;
};

interface State {
  pinStatus: PinStatus | null;
  mode: "pwm" | "lit";
  brightness: number;
  pwmBrightness: PwmBrightness;
  pwmCycle: number;
}

export default class PinControlPanel extends React.PureComponent<
  {
    pinNum: number;
    expanded: boolean;
  },
  State
> {
  state: State = {
    pinStatus: null,
    mode: "pwm",
    brightness: 0,
    pwmBrightness: {
      min: 0,
      max: 10
    },
    pwmCycle: 4
  };
  componentDidMount() {
    const { pinNum } = this.props;
    enquireStatus(pinNum).then(resp =>
      this.setState({
        pinStatus: resp,
        mode: resp.pwmRunning ? "pwm" : "lit",
        brightness: !resp.pwmRunning && resp.opened ? Math.floor((resp.max * 10) / 1024) : 0,
        pwmBrightness:
          resp.pwmRunning && resp.opened
            ? {
                min: Math.floor((resp.min * 10) / 1024),
                max: Math.floor((resp.max * 10) / 1024)
              }
            : { min: 0, max: 10 },
        pwmCycle: resp.cycleLength
      })
    );
  }
  handleToggleOnOff = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { pinNum } = this.props;

    if (e.target.checked) {
      openPin(pinNum).then(r => {
        this.adjustPin();
      });
    } else {
      closePin(pinNum).then(r =>
        this.setState({
          pinStatus: r
        })
      );
    }
  };
  adjustPin = () => {
    const { pinNum } = this.props;

    const { mode, brightness, pwmBrightness, pwmCycle } = this.state;
    const minBrightness = mode === "pwm" ? (pwmBrightness.min / 10) * 1024 : 0;
    const maxBrightness = mode === "pwm" ? (pwmBrightness.max / 10) * 1024 : (brightness / 10) * 1024;
    adjustPin(pinNum, mode, minBrightness, maxBrightness, pwmCycle).then(r =>
      this.setState({
        pinStatus: r
      })
    );
  };
  handleChangeMode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mode: "pwm" | "lit" = e.target.value;
    this.setState(
      {
        mode
      },
      this.adjustPin
    );
  };
  render() {
    if (!this.state.pinStatus) return "loading...";
    const { pinNum } = this.props;
    const { cycleLength, max, min, opened, pin, pwmRunning } = this.state.pinStatus;
    const { mode, brightness, pwmBrightness, pwmCycle } = this.state;
    return (
      <div className={styles.wrapper}>
        <p className={styles.title}>
          <span
            style={{
              background: opened ? pinColorMapping[pinNum] : "#1e1e1e",
              // 'box-shadow': 
            }}
          />
        </p>
        <p>
          <input type="checkbox" checked={opened} onChange={this.handleToggleOnOff} />
        </p>
        <p>
          <input type="radio" id="pwm" name="mode" value="pwm" checked={mode === "pwm"} onChange={this.handleChangeMode} />
          <label htmlFor="pwm">pwm</label>
        </p>
        <div
          style={{
            width: "80%",
            margin: "0 auto"
          }}
        >
          <InputRange
            maxValue={10}
            minValue={0}
            step={1}
            value={pwmBrightness}
            onChange={(pwmBrightness: PwmBrightness) => this.setState({ pwmBrightness })}
            onChangeComplete={this.adjustPin}
            disabled={mode === "lit"}
          />
        </div>
        <p>
          <input
            type="number"
            value={pwmCycle}
            onBlur={this.adjustPin}
            onChange={e =>
              this.setState({
                pwmCycle: Number(e.target.value)
              })
            }
          />
        </p>
        <p>
          <input type="radio" id="lit" name="mode" value="lit" checked={mode === "lit"} onChange={this.handleChangeMode} />
          <label htmlFor="lit">lit</label>
        </p>
        <div
          style={{
            width: "80%",
            margin: "0 auto"
          }}
        >
          <InputRange
            maxValue={10}
            minValue={0}
            step={1}
            value={brightness}
            onChange={(brightness: number) => this.setState({ brightness })}
            onChangeComplete={this.adjustPin}
            disabled={mode === "pwm"}
          />
        </div>
      </div>
    );
  }
}
