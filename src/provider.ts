export class Provider {
  constructor(name: string, public schema: any, public defaultValue: any = null) {
  }

  init(data: any) {
  }

  cleanup(data: any) {
  }
}
