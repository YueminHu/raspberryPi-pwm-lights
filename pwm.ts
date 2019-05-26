import rpio = require("rpio");

export default class PWM {
  pin: number;
  min: number = 0;
  // _min: number = 0;
  current: number = 0;
  max: number = 1024;
  // _max: number = 1024;
  cycleLength: number = 4;
  rpio: Rpio = rpio;
  direction: 1 | -1 = 1;
  pwmTimer: NodeJS.Timer;
  interval: number;
  pwmRunning: boolean = false;
  opened: boolean = false;
  constructor(_rpio: Rpio, pin: number, min: number, max: number, cycleLength: number) {
    this.pin = pin;
    this.current = this.min = min;
    this.max = max;
    this.cycleLength = cycleLength;
    this.rpio = _rpio;
    this.direction = 1;
    // const allSetDataCounts = ((this.max - this.min) / 5) * 2;
    this.interval = calInterval(this.min, this.max, this.cycleLength);
  }
  init() {
    rpio.open(this.pin, rpio.PWM);
    rpio.pwmSetClockDivider(64);
    rpio.pwmSetRange(this.pin, 1024);
    rpio.pwmSetData(this.pin, this.min);
    // this.min = this._min;
    this.opened = true;
    const self = this;
    this.pwmTimer = setTimeout(function inner() {
      // 常量模式
      if (self.min === self.max) {
        rpio.pwmSetData(self.pin, self.max);
      } else {
        // 亮度由min-max渐变
        rpio.pwmSetData(self.pin, (self.current += self.direction * 5));
        if (self.current >= self.max) {
          self.direction = -1;
        }
        if (self.current <= self.min) {
          self.direction = 1;
        }
      }
      // console.log("exec!", self.interval);
      self.pwmTimer = setTimeout(inner, self.interval);
    }, self.interval);
  }
  getStatus() {
    let res: Partial<this> = {};
    for (let i in this) {
      if (typeof this[i] === "string" || typeof this[i] === "number" || typeof this[i] === "boolean") {
        res[i] = this[i];
      }
    }
    return res;
  }
  changeStatus(mode: "pwm" | "lit" = "pwm", min: number = 0, max: number = 1024, cycleLength: number = 4) {
    if (mode === "pwm") {
      this.min = min;
      this.max = max;
      this.pwmRunning = true;
    } else {
      this.min = this.max = max;
      this.pwmRunning = false;
    }
    // const allSetDataCounts = ((this.max - this.min) / 5) * 2;
    this.cycleLength = cycleLength;
    this.interval = calInterval(this.min, this.max, this.cycleLength);
  }
  close() {
    this.rpio.close(this.pin);
    clearTimeout(this.pwmTimer);
    this.opened = false;
  }
}

function calInterval(min: number, max: number, cycleLength: number) {
  const allSetDataCounts = ((max - min) / 5) * 2;
  return min === max ? 16 : (cycleLength * 1000) / allSetDataCounts;
}