export const logger = {
  info: (event: string, payload?: any) => {
    console.log(JSON.stringify({ level: 'INFO', event, timestamp: new Date().toISOString(), payload }));
  },
  warn: (event: string, payload?: any) => {
    console.warn(JSON.stringify({ level: 'WARN', event, timestamp: new Date().toISOString(), payload }));
  },
  error: (event: string, error: any, payload?: any) => {
    console.error(JSON.stringify({ level: 'ERROR', event, timestamp: new Date().toISOString(), error: error?.message || error, payload }));
  },
  perf: (event: string, durationMs: number) => {
    console.log(JSON.stringify({ level: 'PERF', event, durationMs, timestamp: new Date().toISOString() }));
  }
};
