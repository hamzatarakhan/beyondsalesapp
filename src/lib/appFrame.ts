export const getAppFrameCollisionBoundary = (): HTMLElement | undefined => {
  if (typeof document === "undefined") return undefined;
  return document.getElementById("root") ?? undefined;
};
