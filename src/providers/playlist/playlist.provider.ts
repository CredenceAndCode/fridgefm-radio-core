import { injectable, createToken } from "@fridgefm/inverter";
// import { createList } from "../../utils/fs";
import { captureTime } from "../../utils/time";
import { PUBLIC_EVENTS, EVENT_BUS_TOKEN } from "../events/events.provider";
import { TRACK_FACTORY_TOKEN } from "../track/track.provider";
// import { extractLast } from "../../utils/funcs";
// import Mp3 from "../../utils/mp3";

import type { TTrack } from "../track/track.types";
import type { InfoEvent } from "../events/events.types";
import type {
  TrackMap,
  TrackList,
  PathList,
  PlaylistElement,
  TPlaylist,
  TrackInput,
} from "./playlist.types";

export const PLAYLIST_TOKEN = createToken<TPlaylist>("playlist");

export const playlistProvider = injectable({
  provide: PLAYLIST_TOKEN,
  scope: "singleton",
  useFactory: (createTrack, eventBus) => {
    let tracks: Set<TrackInput> = new Set();
    let currentIndex = -1;
    let loopRestartIndex = 0;
    let tracksMap: TrackMap = new Map();
    let list: PathList = [];

    const emitInfo = (a: InfoEvent) => {
      eventBus.emit(PUBLIC_EVENTS.INFO, { name: "playlist", ...a });
    };

    const revalidate = () => {
      const ct = captureTime();
      list = Array.from(tracks);
      tracksMap = list.reduce((acc, trackInput) => {
        return acc.set(
          trackInput.filePath,
          createTrack(trackInput.filePath, trackInput.externalId)
        );
      }, new Map() as TrackMap);

      const result = publicPlaylist.getList();

      emitInfo({
        event: "revalidate",
        message: "Playlist revalidated",
        timings: ct(),
      });
      return result;
    };

    const publicPlaylist = {
      getList: (): TrackList =>
        list.map((v, i) => {
          const tra = tracksMap.get(v.filePath) as TTrack;

          return {
            ...tra,
            isPlaying: currentIndex === i,
          };
        }),
      getNext: (): PlaylistElement => {
        if (list.length > 0 && list.length - 1 === currentIndex) {
          // the playlist drained
          const ct = captureTime();
          revalidate();
          currentIndex = loopRestartIndex;
          eventBus.emit(PUBLIC_EVENTS.RESTART, publicPlaylist.getList(), ct());
        } else {
          currentIndex += 1;
        }
        const nextPath = list[currentIndex]?.filePath as string;
        const nextTrack = tracksMap.get(nextPath);

        if (!nextTrack) {
          emitInfo({
            level: "warn",
            event: "no-next-track",
            message: `No next track found for ${nextPath}`,
          });
          // try next tracks
          return publicPlaylist.getNext();
        }
        nextTrack.playCount += 1;

        return { ...nextTrack, isPlaying: true };
      },
      addFolder: (trackInputs: TrackInput[], loopIndex: number) => {
        if (loopIndex) {
          const restartIndex = loopIndex ? loopIndex : 0;
          loopRestartIndex = restartIndex;
        }
        tracks = new Set();
        trackInputs.forEach((track) => {
          tracks.add({
            filePath: track.filePath,
            externalId: track.externalId,
          });
        });
        return revalidate();
      },
    };

    return publicPlaylist;
  },
  inject: [TRACK_FACTORY_TOKEN, EVENT_BUS_TOKEN] as const,
});
