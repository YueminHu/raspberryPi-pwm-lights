import * as React from "react";
import InputRange from "react-input-range";
import "react-input-range/lib/css/index.css";

import { routeStyles } from "App";
import { enquireStatus, PinStatus, closePin, openPin, adjustPin } from "apis";

import * as styles from "./index.module.less";

const pinNum = 32;

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

export default class Home extends React.PureComponent<{}, State> {
  state: State = {
    pinStatus: null,
    mode: "pwm",
    brightness: 0,
    pwmBrightness: {
      min: 0,
      max: 10
    },
    pwmCycle: 4000
  };
  componentDidMount() {
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
    const { cycleLength, max, min, opened, pin, pwmRunning } = this.state.pinStatus;
    const { mode, brightness, pwmBrightness, pwmCycle } = this.state;
    return (
      <div className={`main ${styles.wrapper}`} style={{ ...routeStyles }}>
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
          <input type="number" value={pwmCycle} />
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
