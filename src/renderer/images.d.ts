// Ambient declarations so TypeScript accepts image imports handled by webpack's
// asset/resource loader. Must stay a script (no top-level import/export) so the
// wildcard module declarations register globally.
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.ico' {
  const src: string;
  export default src;
}
