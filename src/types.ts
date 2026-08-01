export type Video = {
  id: string; name: string; path: string; extension: string; size: number;
  modifiedAt: number; folder: string; tags: string[]; native: boolean; vr: boolean; rating: 'good' | 'medium' | 'bad' | null;
};

export type Library = { directories: string[]; videos: Video[] };
