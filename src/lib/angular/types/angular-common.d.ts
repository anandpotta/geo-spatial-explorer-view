
// Minimal Angular common type declarations for library compilation
declare module '@angular/common' {
  export interface Type<T = any> {
    new (...args: any[]): T;
  }

  export class CommonModule {
    static forRoot(): any;
  }
}
