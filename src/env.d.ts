declare module 'virtual:image-dimensions' {
  /** Public path ("/images/a.jpg") → [width, height] in pixels. */
  const sizes: Record<string, [number, number]>;
  export default sizes;
}
