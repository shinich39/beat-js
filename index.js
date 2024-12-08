"use strict";

import { encode, decode } from "./libs/wav.js";
import FFT from "fft.js";

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

Beat.prototype.getBeatsWithVolume = function (channelIndex, frameSize, func) {
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

Beat.prototype.getBeats = function (channelIndex, frameSize, func) {
  return this.getBeatsWithVolume(channelIndex, frameSize, func).map(
    (item) => item.index
  );
};

Beat.prototype.getBeatsWithFFT = function (
  channelIndex,
  fftSize,
  beatThreshold,
  lowEnergySize,
  avgEnergySize
) {
  if (!fftSize) {
    fftSize = 512;
  }
  if (!beatThreshold) {
    beatThreshold = 1.2;
  }
  if (!lowEnergySize) {
    lowEnergySize = 40;
  }
  if (!avgEnergySize) {
    avgEnergySize = 8;
  }

  let energyHistory = [],
    result = [];

  const fft = new FFT(fftSize);
  const samples = this.sampleData[channelIndex];
  for (let i = 0; i < samples.length; i += fftSize) {
    const part = samples.slice(i, i + fftSize);

    if (part.length < fftSize) {
      break;
    }

    const spectrum = fft.createComplexArray();
    fft.realTransform(spectrum, part);

    let magnitudes = [];
    for (let j = 0; j < spectrum.length; j += 2) {
      magnitudes.push(
        Math.sqrt(
          // real
          spectrum[j] * spectrum[j] +
            // imaginary
            spectrum[j + 1] * spectrum[j + 1]
        )
      );
    }

    let lowFreqEnergy = 0;
    for (let j = 0; j < lowEnergySize; j++) {
      lowFreqEnergy += magnitudes[j];
    }

    // Save energy
    energyHistory.push(lowFreqEnergy);

    // Calculate average energy for dynamic threshold
    let avgEnergy = 0,
      avgEnergyCounts = 0;
    for (
      let j = Math.max(0, energyHistory.length - 1 - avgEnergySize);
      j < energyHistory.length;
      j++
    ) {
      avgEnergy += energyHistory[j];
      avgEnergyCounts++;
    }
    avgEnergy /= avgEnergyCounts;

    if (lowFreqEnergy > avgEnergy * beatThreshold) {
      result.push(i);
    }
  }
  return result;
};

Beat.prototype.getTemposWithCount = function (beats) {
  let groups = [];
  for (let i = 0; i < beats.length; i++) {
    const len = Math.min(i + 10, beats.length);
    for (let j = i + 1; j < len; j++) {
      const startIndex = beats[i];
      const endIndex = beats[j];

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
