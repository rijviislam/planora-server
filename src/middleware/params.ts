export const param = (req: any, key: string): string =>
  req.params[key] as string;
