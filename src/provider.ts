export class Provider {
  constructor(name: string, public schema: any, public defaultValue: any = null) {
  }

  async init(data: any): Promise<any> {
  }

  async cleanup(data: any): Promise<any> {
  }
}
