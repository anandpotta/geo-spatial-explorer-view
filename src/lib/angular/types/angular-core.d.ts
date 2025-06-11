
// Minimal Angular core type declarations for library compilation
declare module '@angular/core' {
  export interface Type<T = any> {
    new (...args: any[]): T;
  }

  export interface ComponentDecorator {
    <T extends Type<any>>(type: T): T;
  }

  export interface NgModuleDecorator {
    <T extends Type<any>>(type: T): T;
  }

  export function Component(obj: any): ComponentDecorator;
  export function NgModule(obj: any): NgModuleDecorator;
  export function Input(bindingPropertyName?: string): any;
  export function Output(bindingPropertyName?: string): any;
  export function ViewChild(selector: any, opts?: any): any;

  export class EventEmitter<T = any> {
    emit(value?: T): void;
    subscribe(observer?: any): any;
  }

  export class ElementRef<T = any> {
    nativeElement: T;
  }

  export interface OnInit {
    ngOnInit(): void;
  }

  export interface OnDestroy {
    ngOnDestroy(): void;
  }

  export interface AfterViewInit {
    ngAfterViewInit(): void;
  }

  export interface OnChanges {
    ngOnChanges(changes: any): void;
  }
}
