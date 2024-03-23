import type { TTrack, TrackPath } from "../track/track.types";

export type PlaylistElement = {
  isPlaying: boolean;
} & TTrack;

export type ReorderCb = (current: PlaylistElement[]) => PlaylistElement[];

export type TrackInput = {
  filePath: string;
  externalId: string;
};

export type TrackList = PlaylistElement[];

export type PathList = readonly TrackInput[];

export type TrackMap = Map<TrackPath, TTrack>;

export type TPlaylist = {
  addFolder(filepathArray: TrackInput[]): TrackList;
  // reorder(cb: ReorderCb): TrackList;
  getList(): TrackList;
  getNext(): TTrack;
};
