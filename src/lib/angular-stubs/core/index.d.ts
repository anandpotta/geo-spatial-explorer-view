
// TypeScript definitions stub for @angular/core
export interface ComponentDecorator {
  (obj: Component): TypeDecorator;
  new (obj: Component): Component;
}

export interface Component {
  selector?: string;
  template?: string;
  templateUrl?: string;
  styles?: string[];
  styleUrls?: string[];
  standalone?: boolean;
  imports?: any[];
}

export interface NgModule {
  declarations?: any[];
  imports?: any[];
  exports?: any[];
  providers?: any[];
  bootstrap?: any[];
}

export interface ModuleWithProviders<T> {
  ngModule: T;
  providers?: any[];
}

export interface TypeDecorator {
  <T extends Type<any>>(type: T): T;
  (target: Object, propertyKey?: string | symbol, parameterIndex?: number): void;
}

export interface Type<T> extends Function {
  new (...args: any[]): T;
}

export declare const Component: ComponentDecorator;
export declare const NgModule: any;
export declare const Injectable: any;
export declare const Input: any;
export declare const Output: any;
export declare const EventEmitter: any;
export declare const ViewChild: any;
export declare const ElementRef: any;
export declare const OnInit: any;
export declare const OnDestroy: any;
export declare const AfterViewInit: any;
export declare const OnChanges: any;
export declare const SimpleChanges: any;
