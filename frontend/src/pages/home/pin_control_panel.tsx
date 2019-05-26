import * as React from "react";
import InputRange from "react-input-range";
import "react-input-range/lib/css/index.css";

import { enquireStatus, PinStatus, closePin, openPin, adjustPin } from "apis";

// const pinNum = 32;

import * as styles from "./pin_control_panel.module.less";
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
    onClick: () => void;
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
    const mode = e.target.value as "pwm" | "lit";
    this.setState(
      {
        mode
      },
      this.adjustPin
    );
  };
  render() {
    const { mode, brightness, pwmBrightness, pwmCycle } = this.state;
    const { pinNum, onClick, expanded } = this.props;
    if (!this.state.pinStatus)
      return (
        <div className={styles.wrapper} onClick={onClick}>
          <p className={styles.title}>
            <span
              style={{
                background: "#1e1e1e"
              }}
            />
          </p>
        </div>
      );
    const { cycleLength, max, min, opened, pin, pwmRunning } = this.state.pinStatus;
    return (
      <div className={`${styles.wrapper} ${expanded ? styles.expanded : ""}`} onClick={onClick}>
        <p className={styles.title}>
          <span
            style={{
              background: opened ? pinColorMapping[pinNum] : "#1e1e1e"
            }}
          />
          <span>{opened ? "开" : "关"}</span>
          <span>模式: {mode === "pwm" ? "渐变" : "常亮"}</span>
          <span>💡亮度: {mode === "pwm" ? `${pwmBrightness.min}-${pwmBrightness.max}` : brightness}</span>
        </p>
        <div onClick={e => e.stopPropagation()}>
          <div className={"form-item-wrapper"}>
            <label htmlFor={"switch"}>🎚灯条开关</label>
            <input type="checkbox" checked={opened} onChange={this.handleToggleOnOff} name={"switch"} id="switch" />
          </div>
          <div className={"form-item-wrapper"}>
            <label htmlFor="pwm">模式</label>
            <input
              type="radio"
              id="pwm"
              name="mode"
              value="pwm"
              checked={mode === "pwm"}
              onChange={this.handleChangeMode}
              style={{
                marginRight: "1vw"
              }}
            />
            <label htmlFor="pwm">渐变</label>
          </div>
          <div
            className={`form-item-wrapper ${mode === "lit" ? "form-item-disabled" : ""}`}
            style={{
              margin: "8vw 0"
            }}
          >
            <label>亮度范围</label>
            <InputRange
              maxValue={10}
              minValue={0}
              step={1}
              value={pwmBrightness}
              onChange={(pwmBrightness: PwmBrightness) => this.setState({ pwmBrightness })}
              onChangeComplete={this.adjustPin}
              disabled={mode === "lit"}
              // formatLabel={() => ""}
            />
          </div>
          <div className={`form-item-wrapper ${mode === "lit" ? "form-item-disabled" : ""}`}>
            <label htmlFor={"pwmCycle"}>渐变时长(s)</label>
            <input
              id={"pwmCycle"}
              type="number"
              value={pwmCycle}
              onBlur={this.adjustPin}
              onChange={e =>
                this.setState({
                  pwmCycle: Number(e.target.value)
                })
              }
              disabled={mode === "lit"}
            />
          </div>
          <div className={"form-item-wrapper"}>
            <label htmlFor="lit">模式</label>
            <input
              type="radio"
              id="lit"
              name="mode"
              value="lit"
              checked={mode === "lit"}
              onChange={this.handleChangeMode}
              style={{
                marginRight: "1vw"
              }}
            />
            <label htmlFor="lit">常亮</label>
          </div>
          <div
            className={`form-item-wrapper ${mode === "pwm" ? "form-item-disabled" : ""}`}
            style={{
              margin: "8vw 0"
            }}
          >
            <label>亮度</label>
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
      </div>
    );
  }
}
