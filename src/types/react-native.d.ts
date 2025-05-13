
declare module 'react-native' {
  import * as React from 'react';

  export interface ViewProps {
    style?: any;
    children?: React.ReactNode;
  }

  export interface TextProps {
    style?: any;
    children?: React.ReactNode;
  }

  export interface ActivityIndicatorProps {
    size?: 'small' | 'large' | number;
    color?: string;
    animating?: boolean;
  }

  export class View extends React.Component<ViewProps> {}
  export class Text extends React.Component<TextProps> {}
  export class ActivityIndicator extends React.Component<ActivityIndicatorProps> {}

  export interface StyleSheetStatic {
    create<T extends { [key: string]: any }>(styles: T): T;
  }

  export const StyleSheet: StyleSheetStatic;
  
  export interface Dimensions {
    get(dimension: 'window' | 'screen'): { width: number; height: number };
  }
  
  export const Dimensions: Dimensions;
}
