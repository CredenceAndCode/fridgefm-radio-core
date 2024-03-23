// import klaw from "klaw-sync";
// import fs from "fs-extra";
// import Mp3 from "./mp3";
// import { TrackInput } from "../providers/playlist/playlist.types";

// const getPaths = (fullPath: string): readonly string[] => {
//   const stats = fs.statSync(fullPath);

//   switch (true) {
//     case stats.isDirectory(): {
//       return klaw(fullPath, { nodir: true }).map(({ path }) => path);
//     }
//     case stats.isFile(): {
//       return [fullPath];
//     }
//     default:
//       return [];
//   }
// };

// export const createList = (tracks: TrackInput[]) =>
//   tracks.reduce(
//     (acc, cur) => [
//       ...acc,
//       ...getPaths(tracks.map((track) => track.filePath)).filter(
//         Mp3.isSupported
//       ),
//     ],
//     [] as TrackInput[]
//   );
