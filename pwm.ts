import rpio = require("rpio");

export default class PIN {
  pin: number; // 正极引脚编号
  min: number = 0; // 最低pmw(width)
  current: number = 0; // 当前pwm(呼吸灯模式时循环用)
  max: number = 1024; // 最高pwm
  cycleLength: number = 4; // 完成一个周期需要的时间
  rpio: Rpio = rpio; // rpio实例
  direction: 1 | -1 = 1; // pwm正在增加或减少
  pwmTimer: NodeJS.Timer; // timer
  interval: number; // 改变pwm的间隔
  pwmRunning: boolean = false; // 呼吸灯模式开启
  opened: boolean = false; // 常量模式开启
  constructor(_rpio: Rpio, pin: number, min: number, max: number, cycleDuration: number) {
    this.pin = pin;
    this.current = this.min = min;
    this.max = max;
    this.cycleLength = cycleDuration;
    this.rpio = _rpio;
    this.direction = 1;
    this.interval = calInterval(this.min, this.max, this.cycleLength);
  }
  init() {
    rpio.open(this.pin, rpio.PWM);
    rpio.pwmSetClockDivider(64);
    rpio.pwmSetRange(this.pin, 1024);
    rpio.pwmSetData(this.pin, this.min);
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
      self.pwmTimer = setTimeout(inner, self.interval);
    }, self.interval);
    return self;
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
    this.interval = calInterval(min, max, cycleLength);
    return this;
  }
  close() {
    this.rpio.close(this.pin);
    clearTimeout(this.pwmTimer);
    this.opened = false;
    return this;
  }
}

/**
 * 计算在pwm每次步进5的情况下, 完成一个@param cycleDuration 时需要的时间间隔
 * example:
 * min = 0, max = 100, cycleDuration = 2s
 * 总共执行的步长为(100 - 0) * 2 / 5 = 40
 * 那么每次interval的间隔即为2 * 1000 / 40 = 50ms
 * 如果min===max那简单的设置为16
 * @param min
 * @param max
 * @param cycleDuration
 */
function calInterval(min: number, max: number, cycleDuration: number) {
  const execTimeCount = ((max - min) / 5) * 2;
  return min === max ? 16 : (cycleDuration * 1000) / execTimeCount;
}
