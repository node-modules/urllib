declare module 'formstream' {
  export default class FormStream {
    headers(): Record<string, string>;
    file(name: string, path: string): void;
    field(name: string, value: string): void;
  }
}
