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
rpio.open(12, rpio.OUTPUT, rpio.LOW);
var litted = false;
app.use(express.static(path.join(__dirname, "./static"), {
    extensions: ["html"]
}));
app.get("/api/status/12", function (req, res) { return res.json({ status: litted }); });
app.get("/api/toggle/12", function (req, res) {
    if (litted) {
        rpio.write(12, rpio.LOW);
    }
    else {
        rpio.write(12, rpio.HIGH);
    }
    litted = !litted;
    res.json({ message: "success", status: litted });
});
function calInterval(min, max, cycleLength) {
    var allSetDataCounts = ((max - min) / 5) * 2;
    return min === max ? 16 : (cycleLength * 1000) / allSetDataCounts;
}
// set pwm
var Pwm32 = /** @class */ (function () {
    function Pwm32(_rpio, pin, min, max, cycleLength) {
        this.pin = 32;
        this.min = 0;
        // _min: number = 0;
        this.current = 0;
        this.max = 1024;
        // _max: number = 1024;
        this.cycleLength = 4;
        this.rpio = rpio;
        this.direction = 1;
        this.pwmRunning = false;
        this.opened = false;
        this.pin = pin;
        this.current = this.min = min;
        this.max = max;
        this.cycleLength = cycleLength;
        this.rpio = _rpio;
        this.direction = 1;
        // const allSetDataCounts = ((this.max - this.min) / 5) * 2;
        this.interval = calInterval(this.min, this.max, this.cycleLength);
    }
    Pwm32.prototype.init = function () {
        rpio.open(this.pin, rpio.PWM);
        rpio.pwmSetClockDivider(64);
        rpio.pwmSetRange(this.pin, 1024);
        rpio.pwmSetData(this.pin, this.min);
        // this.min = this._min;
        this.opened = true;
        var self = this;
        this.pwmTimer = setTimeout(function inner() {
            // 常量模式
            if (self.min === self.max) {
                rpio.pwmSetData(self.pin, self.max);
            }
            else {
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
    };
    Pwm32.prototype.getStatus = function () {
        var res = {};
        for (var i in this) {
            if (typeof this[i] === "string" || typeof this[i] === "number" || typeof this[i] === "boolean") {
                res[i] = this[i];
            }
        }
        return res;
    };
    Pwm32.prototype.changeStatus = function (mode, min, max, cycleLength) {
        if (mode === void 0) { mode = "pwm"; }
        if (min === void 0) { min = 0; }
        if (max === void 0) { max = 1024; }
        if (cycleLength === void 0) { cycleLength = 4; }
        if (mode === "pwm") {
            this.min = min;
            this.max = max;
            this.pwmRunning = true;
        }
        else {
            this.min = this.max = max;
            this.pwmRunning = false;
        }
        // const allSetDataCounts = ((this.max - this.min) / 5) * 2;
        this.cycleLength = cycleLength;
        this.interval = calInterval(this.min, this.max, this.cycleLength);
    };
    Pwm32.prototype.close = function () {
        this.rpio.close(this.pin);
        clearTimeout(this.pwmTimer);
        this.opened = false;
    };
    return Pwm32;
}());
var pwm32;
function getPwm32(_rpio, pin, min, max, cycleLength) {
    if (_rpio === void 0) { _rpio = rpio; }
    if (pin === void 0) { pin = 32; }
    if (min === void 0) { min = 0; }
    if (max === void 0) { max = 1024; }
    if (cycleLength === void 0) { cycleLength = 4; }
    if (!pwm32) {
        pwm32 = new Pwm32(_rpio, pin, min, max, cycleLength);
    }
    return pwm32;
}
app.post("/api/open/32", function (req, res) {
    getPwm32().init();
    var pinStatus = getPwm32().getStatus();
    res.json(__assign({ message: "success" }, pinStatus));
});
app.post("/api/adjust/32", function (req, res) {
    var _a = req.body, mode = _a.mode, min = _a.min, max = _a.max, cycleLength = _a.cycleLength;
    // console.log(cycleLength);
    getPwm32().changeStatus(mode, min, max, cycleLength);
    var pinStatus = getPwm32().getStatus();
    res.json(__assign({ message: "success" }, pinStatus));
});
app.get("/api/status/32", function (req, res) {
    var pinStatus = getPwm32().getStatus();
    res.json(__assign({ message: "success" }, pinStatus));
});
app.post("/api/close/32", function (req, res) {
    getPwm32().close();
    var pinStatus = getPwm32().getStatus();
    res.json(__assign({ message: "success" }, pinStatus));
});
app.listen(8890);
