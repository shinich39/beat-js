"use strict";

import { encode, decode } from "./libs/wav.js";

class Beat {
  constructor(buffer) {
    // Base64
    if (typeof buffer === "string") {
      buffer = Buffer.from(buffer, "base64");
    }

    const data = decode(buffer);

    this.sampleData = data.channelData.map((e) =>
      Array.prototype.slice.call(e)
    );
    this.sampleSize = data.channelData[0].length;
    this.sampleRate = data.sampleRate;
    this.duration = data.channelData[0].length / data.sampleRate;
  }
}

Beat.prototype.getTime = function (index) {
  return index / this.sampleRate;
};

Beat.prototype.getMinVolumeWithIndex = function (
  channelIndex,
  startIndex,
  endIndex
) {
  let volume = Number.MAX_SAFE_INTEGER,
    index = -1;
  for (let i = startIndex; i < endIndex; i++) {
    if (volume > this.sampleData[channelIndex][i]) {
      volume = this.sampleData[channelIndex][i];
      index = i;
    }
  }
  return {
    index,
    volume,
  };
};

Beat.prototype.getMaxVolumeWithIndex = function (
  channelIndex,
  startIndex,
  endIndex
) {
  let volume = Number.MIN_SAFE_INTEGER,
    index = -1;
  for (let i = startIndex; i < endIndex; i++) {
    if (volume < this.sampleData[channelIndex][i]) {
      volume = this.sampleData[channelIndex][i];
      index = i;
    }
  }
  return {
    index,
    volume,
  };
};

Beat.prototype.getRMSVolumeWithIndex = function (
  channelIndex,
  startIndex,
  endIndex
) {
  let sum = 0;
  for (let i = startIndex; i < endIndex; i++) {
    sum += Math.pow(this.sampleData[channelIndex][i], 2);
  }
  return {
    index: Math.floor((startIndex + endIndex) * 0.5),
    volume: Math.sqrt(sum / this.sampleSize),
  };
};

Beat.prototype.getMinVolume = function (channelIndex, startIndex, endIndex) {
  return Beat.prototype.getMinVolumeWithIndex(
    channelIndex,
    startIndex,
    endIndex
  ).volume;
};

Beat.prototype.getMaxVolume = function (channelIndex, startIndex, endIndex) {
  return Beat.prototype.getMaxVolumeWithIndex(
    channelIndex,
    startIndex,
    endIndex
  ).volume;
};

Beat.prototype.getRMSVolume = function (channelIndex, startIndex, endIndex) {
  return Beat.prototype.getRMSVolumeWithIndex(
    channelIndex,
    startIndex,
    endIndex
  ).volume;
};

Beat.prototype.getFrames = function (frameSize) {
  if (!frameSize) {
    frameSize = this.sampleRate;
  }

  frameSize = Math.floor(frameSize);

  let frameCount = Math.ceil(this.sampleSize / frameSize),
    frames = [];

  for (let j = 0; j < frameCount; j++) {
    const startIndex = j * frameSize;
    const endIndex = Math.min(this.sampleSize, j * frameSize + frameSize);
    frames.push({
      start: startIndex,
      end: endIndex,
    });
  }

  return frames;
};

Beat.prototype.getBeats = function (channelIndex, frameSize, func) {
  if (!func) {
    func = this.getMaxVolumeWithIndex.bind(this);
  }

  const frames = this.getFrames(frameSize);

  let result = [];
  for (let i = 0; i < frames.length; i++) {
    const { start, end } = frames[i];
    result.push(func(channelIndex, start, end));
  }

  return result;
};

Beat.prototype.getPeaks = Beat.prototype.getBeats;

Beat.prototype.getTemposWithCount = function (beats) {
  let groups = [];
  for (let i = 0; i < beats.length; i++) {
    const len = Math.min(i + 10, beats.length);
    for (let j = i + 1; j < len; j++) {
      const startIndex = beats[i].index;
      const endIndex = beats[j].index;

      let tempo = (this.sampleRate * 60) / (endIndex - startIndex);
      while (tempo < 90) {
        tempo *= 2;
      }
      while (tempo > 180) {
        tempo /= 2;
      }
      tempo = Math.round(tempo);

      const group = groups.find((item) => item.tempo === tempo);
      if (group) {
        group.count += 1;
      } else {
        groups.push({
          tempo: tempo,
          count: 1,
        });
      }
    }
  }

  return groups.sort((a, b) => b.count - a.count);
};

Beat.prototype.getTempos = function (beats) {
  return this.getTemposWithCount(beats).map((item) => item.tempo);
};

export { Beat };
