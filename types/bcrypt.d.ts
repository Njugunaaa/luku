declare module "bcrypt" {
  function hash(data: string, roundsOrSalt: number | string): Promise<string>;
  function compare(data: string, encrypted: string): Promise<boolean>;
  function compareSync(data: string, encrypted: string): boolean;
  function hashSync(data: string, roundsOrSalt: number | string): string;
  function genSalt(rounds?: number): Promise<string>;
  function genSaltSync(rounds?: number): string;

  export { hash, compare, compareSync, hashSync, genSalt, genSaltSync };
}
