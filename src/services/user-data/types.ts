
export interface UserSession {
  userId: string;
  username?: string;
  connectionString: string;
  autoSync?: boolean;
}

export interface UserDataLocalStorage {
  savedDrawings: any[];
  savedMarkers: any[];
  savedLocations: any[];
  svgPaths: { [userId: string]: string[] };
}
