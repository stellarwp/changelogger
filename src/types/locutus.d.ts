declare module "locutus" {
  export const php: {
    datetime: {
      strtotime: (time: string) => number | false;
    };
  };
}
