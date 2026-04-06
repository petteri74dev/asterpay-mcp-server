const isDebug = () => !!process.env.DEBUG;

export const log = {
  info: (msg: string) => {
    if (isDebug()) console.error(`[asterpay] ${msg}`);
  },
  warn: (msg: string) => console.error(`[asterpay:warn] ${msg}`),
  error: (msg: string) => console.error(`[asterpay:error] ${msg}`),
  mock: (msg: string) => console.error(`[asterpay:mock] ${msg}`),
};
