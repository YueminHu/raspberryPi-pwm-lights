import axios from "axios";

const base = axios.create({
  baseURL: ""
});

export type PinStatus = {
  current: number;
  cycleLength: number;
  direction: number;
  interval: number;
  max: number;
  message: string;
  min: number;
  opened: boolean;
  pin: number;
  pwmRunning: boolean;
  _min: number;
};

export const enquireStatus = (pin: number) => base.get<PinStatus>(`/api/status/${pin}`).then(resp => resp.data);

export const closePin = (pin: number) => base.post<PinStatus>(`/api/close/${pin}`).then(resp => resp.data);

export const openPin = pin => base.post<PinStatus>(`/api/open/${pin}`).then(resp => resp.data);

// export const togglePinMode = (pin: number) => base.get<PinStatus>(`/api/toggleMode/${pin}`).then(resp => resp.data);

export const adjustPin = (pin: number, mode: "pwm" | "lit", min: number, max: number, cycleLength?: number) =>
  base
    .post<PinStatus>(`/api/adjust/${pin}`, {
      mode,
      min,
      max,
      cycleLength
    })
    .then(resp => resp.data);
