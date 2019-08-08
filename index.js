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
var path = require("path");
var fallback = require("express-history-api-fallback");
var rpio = require("rpio");
var cors = require("cors");
// import pwm from "./pwm";
var pwm_1 = require("./pwm");
var app = express();
app.use(cors());
app.use(express.json());
rpio.init({
    gpiomem: false
});
var pinsCollection = {
    12: null,
    33: null // warn: these two pins share the same pwm settings...
};
function setPin(pin, _rpio, min, max, cycleDuration) {
    if (_rpio === void 0) { _rpio = rpio; }
    if (min === void 0) { min = 0; }
    if (max === void 0) { max = 1024; }
    if (cycleDuration === void 0) { cycleDuration = 4; }
    var pinNum = Number(pin);
    if (!pinsCollection[pinNum]) {
        pinsCollection[pinNum] = new pwm_1["default"](_rpio, pinNum, min, max, cycleDuration);
    }
    return pinsCollection[pinNum];
}
// app.use("/api/*/:pin", (req, res, next) => {
//   const pin = req.params.pin || 12
//   req.pin = pin;
//   next();
// })
app.post("/api/open/:pin", function (req, res) {
    var pin = req.params.pin;
    var status = setPin(pin)
        .init()
        .getStatus();
    res.json(__assign({ message: "success" }, status));
});
app.post("/api/adjust/:pin", function (req, res) {
    var pin = req.params.pin;
    var _a = req.body, mode = _a.mode, min = _a.min, max = _a.max, cycleDuration = _a.cycleDuration;
    var status = setPin(pin)
        .changeStatus(mode, min, max, cycleDuration)
        .getStatus();
    res.json(__assign({ message: "success" }, status));
});
app.get("/api/status/:pin", function (req, res) {
    var pin = req.params.pin;
    var pinStatus = setPin(pin).getStatus();
    res.json(__assign({ message: "success" }, pinStatus));
});
app.post("/api/close/:pin", function (req, res) {
    var pin = req.params.pin;
    var pinStatus = setPin(pin)
        .close()
        .getStatus();
    res.json(__assign({ message: "success" }, pinStatus));
});
var root = path.join(__dirname, "./frontend/output");
app.use(express.static(root));
app.use(fallback("index.html", { root: root }));
app.listen(8890);
