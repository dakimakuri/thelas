export class Plugin {
  protected resources: any = {};

  constructor(public name: string) {
  }

  addResource(type: string, ns: any) {
    this.resources[type] = ns;
  }

  getResource(type: string) {
    return this.resources[type];
  }

  createResource(type: string, name: string) {
    let resource = this.resources[type];
    if (resource) {
      return new resource(name);
    }
    return null;
  }
}
