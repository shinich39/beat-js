# beat-js

A library for analyze audio data using javascript.

## Demo

[Testing with visualization](https://shinich39.github.io/beat-js/)

## Usage

```js
import { Beat } from "beat-js";
import fs from "node:fs";
import path from "node:path";

const buffer = fs.readFileSync(path.join("./test/test.wav"));
const b = new Beat(buffer);

const channel = 0;
const step = b.sampleRate * 0.2;
const peaks = b.getPeaks(channel, step);
console.log(peaks);
// [
//     6450,  17431,  23049,  34151,  40030,  50550,
//    56116,  67149,  70580,  79971,  89169, 100216,
//   111249, 122182, 128230, 138750, 144316, 155349,
//   ...
// ]

const fftSize = 1024;
const treshold = 1.2;
const beats = b.getBeats(channel, fftSize, treshold);
console.log(beats);
// [
//   512,   1024,   1536,   2048,   6144,   6656,   7168,   7680,
//  8192,   8704,  11776,  12288,  12800,  13312,  13824,  14336,
// 17408,  17920,  18432,  18944,  19456,  19968,  24064,  24576,
// ...
// ]

const time = b.getTime(peaks[0]);
console.log(time);
// 0.14625850340136054

const tempos = b.getTempos(peaks);
console.log(tempos);
// [
//   120, 160,  96, 137, 148, 107, 144, 121, 119, 159, 118,
//   161, 173, 128, 135, 164, 132, 103,  92, 109, 174, 156,
//   ...
// ]

const temp = tempos[0];
console.log(temp);
// 120
```

## References

- [beats-audio-api](https://github.com/JMPerez/beats-audio-api/)
- [beat-detection-using-web-audio](http://joesul.li/van/beat-detection-using-web-audio/)
