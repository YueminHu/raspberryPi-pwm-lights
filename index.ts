import * as express from "express";
import rpio = require("rpio");
var cors = require("cors");

import * as path from "path";

const app = express();

app.use(cors());
app.use(express.json());

rpio.init({
  gpiomem: false
});
/*
 * Set the initial state to low.  The state is set prior to the pin
 * being actived, so is safe for devices which require a stable setup.
 */
rpio.open(12, rpio.OUTPUT, rpio.LOW);

let litted = false;

app.use(
  express.static(path.join(__dirname, "./static"), {
    extensions: ["html"]
  })
);

app.get("/api/status/12", (req, res) => res.json({ status: litted }));

app.get("/api/toggle/12", (req, res) => {
  if (litted) {
    rpio.write(12, rpio.LOW);
  } else {
    rpio.write(12, rpio.HIGH);
  }
  litted = !litted;
  res.json({ message: "success", status: litted });
});

// set pwm
class Pwm32 {
  pin: number = 32;
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
    const allSetDataCounts = ((this.max - this.min) / 5) * 2;
    this.interval = (this.cycleLength * 1000) / allSetDataCounts;
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
      const allSetDataCounts = ((this.max - this.min) / 5) * 2;
      this.interval = (cycleLength * 1000) / allSetDataCounts;
      this.pwmRunning = true;
    } else {
      this.min = this.max = max;
      this.pwmRunning = false;
    }
  }
  close() {
    this.rpio.close(this.pin);
    clearTimeout(this.pwmTimer);
    this.opened = false;
    // this.current = this.min = this._min;
    // this.max = this._max;
  }
}

let pwm32: Pwm32;

function getPwm32(_rpio: Rpio = rpio, pin: number = 32, min: number = 0, max: number = 1024, cycleLength: number = 4): Pwm32 {
  if (!pwm32) {
    pwm32 = new Pwm32(_rpio, pin, min, max, cycleLength);
  }
  return pwm32;
}

app.post("/api/open/32", (req, res) => {
  // const { mode, brightness } = req.body;
  // if (mode === "pwm") {
  //   getPwm32().init("pwm");
  // } else {
  //   getPwm32().init("lit", brightness);
  // }
  getPwm32().init();
  const pinStatus = getPwm32().getStatus();
  res.json({ message: "success", ...pinStatus });
});

// app.get("/api/toggleMode/32", (req, res) => {
//   getPwm32().toggleMode();
//   const pinStatus = getPwm32().getStatus();
//   res.json({ message: "success", ...pinStatus });
// });

app.post("/api/adjust/32", (req, res) => {
  const { mode, min, max, cycleLength } = req.body;
  getPwm32().changeStatus(mode, min, max, cycleLength);
  const pinStatus = getPwm32().getStatus();
  res.json({ message: "success", ...pinStatus });
});

app.get("/api/status/32", (req, res) => {
  const pinStatus = getPwm32().getStatus();
  res.json({ message: "success", ...pinStatus });
});

app.post("/api/close/32", (req, res) => {
  getPwm32().close();
  const pinStatus = getPwm32().getStatus();
  res.json({ message: "success", ...pinStatus });
});

app.listen(8890);
