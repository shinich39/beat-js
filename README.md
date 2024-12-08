# beat-js

A library for analyze audio data using javascript.

## Usage

```js
import { Beat } from "beat-js";
import fs from "node:fs";
import path from "node:path";

const buffer = fs.readFileSync(path.join("./test/test.wav"));
const b = new Beat(buffer);

const channel = 0;
const step = b.sampleRate * 0.2;
const beats = b.getBeats(channel, step);
console.log(beats);
// [
//   { index: 6450, volume: 0.17841120064258575 },
//   { index: 17431, volume: 0.17566454410552979 },
//   { index: 23049, volume: 0.18039490282535553 },
//   ...
// ]

const time = b.getTime(beats[0].index);
console.log(time);
// 0.14625850340136054

const tempos = b.getTempos(beats);
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