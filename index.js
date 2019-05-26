"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var express = require("express");
var rpio = require("rpio");
var cors = require("cors");
var path = require("path");
// import pwm from "./pwm";
var pwm_1 = require("./pwm");
var app = express();
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
var litted = false;
app.use(express.static(path.join(__dirname, "./static"), {
    extensions: ["html"]
}));
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
var pins = {
    12: null,
    32: null,
    33: null,
    35: null
};
function getPin(pin, _rpio, min, max, cycleLength) {
    if (_rpio === void 0) { _rpio = rpio; }
    if (min === void 0) { min = 0; }
    if (max === void 0) { max = 1024; }
    if (cycleLength === void 0) { cycleLength = 4; }
    if (!pins[pin]) {
        pins[pin] = new pwm_1["default"](_rpio, pin, min, max, cycleLength);
    }
    return pins[pin];
}
app.post("/api/open/:pin", function (req, res) {
    var pinNum = Number(req.params.pin);
    getPin(pinNum).init();
    var pinStatus = getPin(pinNum).getStatus();
    res.json(__assign({ message: "success" }, pinStatus));
});
app.post("/api/adjust/:pin", function (req, res) {
    var pinNum = Number(req.params.pin);
    var _a = req.body, mode = _a.mode, min = _a.min, max = _a.max, cycleLength = _a.cycleLength;
    // console.log(cycleLength);
    getPin(pinNum).changeStatus(mode, min, max, cycleLength);
    var pinStatus = getPin(pinNum).getStatus();
    res.json(__assign({ message: "success" }, pinStatus));
});
app.get("/api/status/:pin", function (req, res) {
    var pinNum = Number(req.params.pin);
    var pinStatus = getPin(pinNum).getStatus();
    res.json(__assign({ message: "success" }, pinStatus));
});
app.post("/api/close/:pin", function (req, res) {
    var pinNum = Number(req.params.pin);
    getPin(pinNum).close();
    var pinStatus = getPin(pinNum).getStatus();
    res.json(__assign({ message: "success" }, pinStatus));
});
app.listen(8890);
