export class Provider {
  constructor(public name: string, public schema: any, public defaultValue: any = null) {
  }

  init(data: any) {
  }

  cleanup(data: any) {
  }
}
