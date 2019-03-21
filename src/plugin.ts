export class Plugin {
  protected resources: any = {};
  protected providers: any = {};

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

  addProvider(type: string, ns: any) {
    this.providers[type] = ns;
  }

  getProvider(type: string) {
    return this.providers[type];
  }

  createProvider(type: string, name: string) {
    let provider = this.providers[type];
    if (provider) {
      return new provider(name, this);
    }
    return null;
  }
}
