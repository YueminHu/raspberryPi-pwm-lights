import * as express from "express";
import * as path from "path";

import rpio = require("rpio");
import cors from "cors";

// import pwm from "./pwm";
import PIN from "./pwm";

const app = express();

app.use(cors());
app.use(express.json());

rpio.init({
  gpiomem: false
});

app.use(
  express.static(path.join(__dirname, "./static"), {
    extensions: ["html"]
  })
);

let pinsCollection: {
  [key: number]: PIN;
} = {
  12: null,
  33: null // warn: these two pins share the same pwm settings...
};

function setPin(pin: string, _rpio: Rpio = rpio, min: number = 0, max: number = 1024, cycleDuration: number = 4): PIN {
  const pinNum = Number(pin);
  if (!pinsCollection[pinNum]) {
    pinsCollection[pinNum] = new PIN(_rpio, pinNum, min, max, cycleDuration);
  }
  return pinsCollection[pinNum];
}

// app.use("/api/*/:pin", (req, res, next) => {
//   const pin = req.params.pin || 12
//   req.pin = pin;
//   next();
// })

app.post("/api/open/:pin", (req, res) => {
  const { pin } = req.params;
  const status = setPin(pin)
    .init()
    .getStatus();
  res.json({ message: "success", ...status });
});

app.post("/api/adjust/:pin", (req, res) => {
  const { pin } = req.params;
  const { mode, min, max, cycleDuration } = req.body;
  const status = setPin(pin)
    .changeStatus(mode, min, max, cycleDuration)
    .getStatus();
  res.json({ message: "success", ...status });
});

app.get("/api/status/:pin", (req, res) => {
  const { pin } = req.params;
  const pinStatus = setPin(pin).getStatus();
  res.json({ message: "success", ...pinStatus });
});

app.post("/api/close/:pin", (req, res) => {
  const { pin } = req.params;
  const pinStatus = setPin(pin)
    .close()
    .getStatus();
  res.json({ message: "success", ...pinStatus });
});

app.listen(8890);
