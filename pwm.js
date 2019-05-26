"use strict";
exports.__esModule = true;
var rpio = require("rpio");
var PWM = /** @class */ (function () {
    function PWM(_rpio, pin, min, max, cycleLength) {
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
    PWM.prototype.init = function () {
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
    PWM.prototype.getStatus = function () {
        var res = {};
        for (var i in this) {
            if (typeof this[i] === "string" || typeof this[i] === "number" || typeof this[i] === "boolean") {
                res[i] = this[i];
            }
        }
        return res;
    };
    PWM.prototype.changeStatus = function (mode, min, max, cycleLength) {
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
    PWM.prototype.close = function () {
        this.rpio.close(this.pin);
        clearTimeout(this.pwmTimer);
        this.opened = false;
    };
    return PWM;
}());
exports["default"] = PWM;
function calInterval(min, max, cycleLength) {
    var allSetDataCounts = ((max - min) / 5) * 2;
    return min === max ? 16 : (cycleLength * 1000) / allSetDataCounts;
}
