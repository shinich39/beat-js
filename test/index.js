import { Beat } from "../dist/beat.mjs";
import path from "node:path";
import fs from "node:fs";

;(async () => {
  const buffer = fs.readFileSync(path.join("./test/test.wav"));
  const b = new Beat(buffer);

  const channel = 0;
  const step = b.sampleRate * 0.2;
  const peaks = b.getPeaks(channel, step);
  console.log("Peaks", peaks);
  // [
  //     6450,  17431,  23049,  34151,  40030,  50550,
  //   56116,  67149,  70580,  79971,  89169, 100216,
  //   111249, 122182, 128230, 138750, 144316, 155349,
  //   158780, 168005, 177376, 188336, 199577, 210386,
  //   215930, 226956, 232436, 243677, 247014, 255807,
  //   265576, 276536, 287777, 298586, 304131, 315156,
  //   320636, 331877, 335214, 344005, 359629, 365828,
  //   377761, 387203, 392577, 403349, 410095, 415468,
  //   423549, 438391, 444495, 454618, 460237, 471062,
  //   476499, 491802, 497200, 503936, 512030, 521511
  // ]

  const beats = b.getBeats(channel);
  console.log("Beats", beats);
  
  const time = b.getTime(beats[0]);
  console.log(time);
  // 0.14625850340136054

  const tempos = b.getTempos(peaks);
  console.log("Tempos", tempos);
  // [
  //   120, 160,  96, 137, 148, 107, 144, 121, 119, 159, 118,
  //   161, 173, 128, 135, 164, 132, 103,  92, 109, 174, 156,
  //   ...
  // ]
  
  const temp = tempos[0];
  console.log(temp);
  // 120


})();