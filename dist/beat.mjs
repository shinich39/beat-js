// libs/wav.js
var data_decoders = {
  pcm8: (buffer, offset, output, channels, samples) => {
    let input = new Uint8Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        let data = input[pos++] - 128;
        output[ch][i] = data < 0 ? data / 128 : data / 127;
      }
    }
  },
  pcm16: (buffer, offset, output, channels, samples) => {
    let input = new Int16Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        let data = input[pos++];
        output[ch][i] = data < 0 ? data / 32768 : data / 32767;
      }
    }
  },
  pcm24: (buffer, offset, output, channels, samples) => {
    let input = new Uint8Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        let x0 = input[pos++];
        let x1 = input[pos++];
        let x2 = input[pos++];
        let xx = x0 + (x1 << 8) + (x2 << 16);
        let data = xx > 8388608 ? xx - 16777216 : xx;
        output[ch][i] = data < 0 ? data / 8388608 : data / 8388607;
      }
    }
  },
  pcm32: (buffer, offset, output, channels, samples) => {
    let input = new Int32Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        let data = input[pos++];
        output[ch][i] = data < 0 ? data / 2147483648 : data / 2147483647;
      }
    }
  },
  pcm32f: (buffer, offset, output, channels, samples) => {
    let input = new Float32Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch)
        output[ch][i] = input[pos++];
    }
  },
  pcm64f: (buffer, offset, output, channels, samples) => {
    let input = new Float64Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch)
        output[ch][i] = input[pos++];
    }
  }
};
function lookup(table, bitDepth, floatingPoint) {
  let name = "pcm" + bitDepth + (floatingPoint ? "f" : "");
  let fn = table[name];
  if (!fn)
    throw new TypeError("Unsupported data format: " + name);
  return fn;
}
function decode(buffer) {
  let pos = 0, end = 0;
  if (buffer.buffer) {
    pos = buffer.byteOffset;
    end = buffer.length;
    buffer = buffer.buffer;
  } else {
    pos = 0;
    end = buffer.byteLength;
  }
  let v = new DataView(buffer);
  function u8() {
    let x = v.getUint8(pos);
    pos++;
    return x;
  }
  function u16() {
    let x = v.getUint16(pos, true);
    pos += 2;
    return x;
  }
  function u32() {
    let x = v.getUint32(pos, true);
    pos += 4;
    return x;
  }
  function string(len) {
    let str = "";
    for (let i = 0; i < len; ++i)
      str += String.fromCharCode(u8());
    return str;
  }
  if (string(4) !== "RIFF")
    throw new TypeError("Invalid WAV file");
  u32();
  if (string(4) !== "WAVE")
    throw new TypeError("Invalid WAV file");
  let fmt;
  while (pos < end) {
    let type = string(4);
    let size = u32();
    let next = pos + size;
    switch (type) {
      case "fmt ":
        let formatId = u16();
        if (formatId !== 1 && formatId !== 3 && formatId !== 65534)
          throw new TypeError(`Unsupported format in WAV file: ${formatId.toString(16)}`);
        fmt = {
          format: "lpcm",
          floatingPoint: formatId === 3,
          channels: u16(),
          sampleRate: u32(),
          byteRate: u32(),
          blockSize: u16(),
          bitDepth: u16()
        };
        break;
      case "data":
        if (!fmt)
          throw new TypeError('Missing "fmt " chunk.');
        let samples = Math.floor(size / fmt.blockSize);
        let channels = fmt.channels;
        let sampleRate = fmt.sampleRate;
        let channelData = [];
        for (let ch = 0; ch < channels; ++ch)
          channelData[ch] = new Float32Array(samples);
        lookup(data_decoders, fmt.bitDepth, fmt.floatingPoint)(buffer, pos, channelData, channels, samples);
        return {
          sampleRate,
          channelData
        };
        break;
    }
    pos = next;
  }
}

// index.js
var Beat = class {
  constructor(buffer) {
    if (typeof buffer === "string") {
      buffer = Buffer.from(buffer, "base64");
    }
    const data = decode(buffer);
    this.sampleData = data.channelData.map(
      (e) => Array.prototype.slice.call(e)
    );
    this.sampleSize = data.channelData[0].length;
    this.sampleRate = data.sampleRate;
    this.duration = data.channelData[0].length / data.sampleRate;
  }
};
Beat.prototype.getTime = function(index) {
  return index / this.sampleRate;
};
Beat.prototype.getMinVolumeWithIndex = function(channelIndex, startIndex, endIndex) {
  let volume = Number.MAX_SAFE_INTEGER, index = -1;
  for (let i = startIndex; i < endIndex; i++) {
    if (volume > this.sampleData[channelIndex][i]) {
      volume = this.sampleData[channelIndex][i];
      index = i;
    }
  }
  return {
    index,
    volume
  };
};
Beat.prototype.getMaxVolumeWithIndex = function(channelIndex, startIndex, endIndex) {
  let volume = Number.MIN_SAFE_INTEGER, index = -1;
  for (let i = startIndex; i < endIndex; i++) {
    if (volume < this.sampleData[channelIndex][i]) {
      volume = this.sampleData[channelIndex][i];
      index = i;
    }
  }
  return {
    index,
    volume
  };
};
Beat.prototype.getRMSVolumeWithIndex = function(channelIndex, startIndex, endIndex) {
  let sum = 0;
  for (let i = startIndex; i < endIndex; i++) {
    sum += Math.pow(this.sampleData[channelIndex][i], 2);
  }
  return {
    index: Math.floor((startIndex + endIndex) * 0.5),
    volume: Math.sqrt(sum / this.sampleSize)
  };
};
Beat.prototype.getMinVolume = function(channelIndex, startIndex, endIndex) {
  return Beat.prototype.getMinVolumeWithIndex(
    channelIndex,
    startIndex,
    endIndex
  ).volume;
};
Beat.prototype.getMaxVolume = function(channelIndex, startIndex, endIndex) {
  return Beat.prototype.getMaxVolumeWithIndex(
    channelIndex,
    startIndex,
    endIndex
  ).volume;
};
Beat.prototype.getRMSVolume = function(channelIndex, startIndex, endIndex) {
  return Beat.prototype.getRMSVolumeWithIndex(
    channelIndex,
    startIndex,
    endIndex
  ).volume;
};
Beat.prototype.getFrames = function(frameSize) {
  if (!frameSize) {
    frameSize = this.sampleRate;
  }
  frameSize = Math.floor(frameSize);
  let frameCount = Math.ceil(this.sampleSize / frameSize), frames = [];
  for (let j = 0; j < frameCount; j++) {
    const startIndex = j * frameSize;
    const endIndex = Math.min(this.sampleSize, j * frameSize + frameSize);
    frames.push({
      start: startIndex,
      end: endIndex
    });
  }
  return frames;
};
Beat.prototype.getBeats = function(channelIndex, frameSize, func) {
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
Beat.prototype.getTemposWithCount = function(beats) {
  let groups = [];
  for (let i = 0; i < beats.length; i++) {
    const len = Math.min(i + 10, beats.length);
    for (let j = i + 1; j < len; j++) {
      const startIndex = beats[i].index;
      const endIndex = beats[j].index;
      let tempo = this.sampleRate * 60 / (endIndex - startIndex);
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
          tempo,
          count: 1
        });
      }
    }
  }
  return groups.sort((a, b) => b.count - a.count);
};
Beat.prototype.getTempos = function(beats) {
  return this.getTemposWithCount(beats).map((item) => item.tempo);
};
export {
  Beat
};
