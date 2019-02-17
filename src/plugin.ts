export class Plugin {
  private resources: any = {};

  constructor(public name: string) {
  }

  addResource(name: string, ns: any) {
    this.resources[name] = ns;
  }

  getResource(name: string) {
    return this.resources[name];
  }
}
