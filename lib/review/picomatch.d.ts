declare module "picomatch" {
  interface Picomatch {
    (patterns: string | string[]): (input: string) => boolean;
    isMatch(input: string, pattern: string | string[]): boolean;
  }
  const picomatch: Picomatch;
  export default picomatch;
}
