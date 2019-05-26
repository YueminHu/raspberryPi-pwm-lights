import * as express from "express";
import rpio = require("rpio");
var cors = require("cors");

import * as path from "path";
// import pwm from "./pwm";
import PWM from "./pwm";

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
// rpio.open(12, rpio.OUTPUT, rpio.LOW);

let litted = false;

app.use(
  express.static(path.join(__dirname, "./static"), {
    extensions: ["html"]
  })
);

// app.get("/api/status/12", (req, res) => res.json({ status: litted }));

// app.get("/api/toggle/12", (req, res) => {
//   if (litted) {
//     rpio.write(12, rpio.LOW);
//   } else {
//     rpio.write(12, rpio.HIGH);
//   }
//   litted = !litted;
//   res.json({ message: "success", status: litted });
// });

// function calInterval(min: number, max: number, cycleLength: number) {
//   const allSetDataCounts = ((max - min) / 5) * 2;
//   return min === max ? 16 : (cycleLength * 1000) / allSetDataCounts;
// }

// set pwm
// class Pwm32 {
//   pin: number = 32;
//   min: number = 0;
//   // _min: number = 0;
//   current: number = 0;
//   max: number = 1024;
//   // _max: number = 1024;
//   cycleLength: number = 4;
//   rpio: Rpio = rpio;
//   direction: 1 | -1 = 1;
//   pwmTimer: NodeJS.Timer;
//   interval: number;
//   pwmRunning: boolean = false;
//   opened: boolean = false;
//   constructor(_rpio: Rpio, pin: number, min: number, max: number, cycleLength: number) {
//     this.pin = pin;
//     this.current = this.min = min;
//     this.max = max;
//     this.cycleLength = cycleLength;
//     this.rpio = _rpio;
//     this.direction = 1;
//     // const allSetDataCounts = ((this.max - this.min) / 5) * 2;
//     this.interval = calInterval(this.min, this.max, this.cycleLength);
//   }
//   init() {
//     rpio.open(this.pin, rpio.PWM);
//     rpio.pwmSetClockDivider(64);
//     rpio.pwmSetRange(this.pin, 1024);
//     rpio.pwmSetData(this.pin, this.min);
//     // this.min = this._min;
//     this.opened = true;
//     const self = this;
//     this.pwmTimer = setTimeout(function inner() {
//       // 常量模式
//       if (self.min === self.max) {
//         rpio.pwmSetData(self.pin, self.max);
//       } else {
//         // 亮度由min-max渐变
//         rpio.pwmSetData(self.pin, (self.current += self.direction * 5));
//         if (self.current >= self.max) {
//           self.direction = -1;
//         }
//         if (self.current <= self.min) {
//           self.direction = 1;
//         }
//       }
//       // console.log("exec!", self.interval);
//       self.pwmTimer = setTimeout(inner, self.interval);
//     }, self.interval);
//   }
//   getStatus() {
//     let res: Partial<this> = {};
//     for (let i in this) {
//       if (typeof this[i] === "string" || typeof this[i] === "number" || typeof this[i] === "boolean") {
//         res[i] = this[i];
//       }
//     }
//     return res;
//   }
//   changeStatus(mode: "pwm" | "lit" = "pwm", min: number = 0, max: number = 1024, cycleLength: number = 4) {
//     if (mode === "pwm") {
//       this.min = min;
//       this.max = max;
//       this.pwmRunning = true;
//     } else {
//       this.min = this.max = max;
//       this.pwmRunning = false;
//     }
//     // const allSetDataCounts = ((this.max - this.min) / 5) * 2;
//     this.cycleLength = cycleLength;
//     this.interval = calInterval(this.min, this.max, this.cycleLength);
//   }
//   close() {
//     this.rpio.close(this.pin);
//     clearTimeout(this.pwmTimer);
//     this.opened = false;
//   }
// }

let pins = {
  12: null,
  32: null,
  33: null,
  35: null
};

function getPin(pin: number, _rpio: Rpio = rpio, min: number = 0, max: number = 1024, cycleLength: number = 4): PWM {
  if (!pins[pin]) {
    pins[pin] = new PWM(_rpio, pin, min, max, cycleLength);
  }
  return pins[pin];
}

app.post("/api/open/:pin", (req, res) => {
  const pinNum = Number(req.params.pin);
  getPin(pinNum).init();
  const pinStatus = getPin(pinNum).getStatus();
  res.json({ message: "success", ...pinStatus });
});

app.post("/api/adjust/:pin", (req, res) => {
  const pinNum = Number(req.params.pin);
  const { mode, min, max, cycleLength } = req.body;
  // console.log(cycleLength);
  getPin(pinNum).changeStatus(mode, min, max, cycleLength);
  const pinStatus = getPin(pinNum).getStatus();
  res.json({ message: "success", ...pinStatus });
});

app.get("/api/status/:pin", (req, res) => {
  const pinNum = Number(req.params.pin);
  const pinStatus = getPin(pinNum).getStatus();
  res.json({ message: "success", ...pinStatus });
});

app.post("/api/close/:pin", (req, res) => {
  const pinNum = Number(req.params.pin);
  getPin(pinNum).close();
  const pinStatus = getPin(pinNum).getStatus();
  res.json({ message: "success", ...pinStatus });
});

app.listen(8890);
