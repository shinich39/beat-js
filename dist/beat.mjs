var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/fft.js/lib/fft.js
var require_fft = __commonJS({
  "node_modules/fft.js/lib/fft.js"(exports, module) {
    "use strict";
    function FFT2(size) {
      this.size = size | 0;
      if (this.size <= 1 || (this.size & this.size - 1) !== 0)
        throw new Error("FFT size must be a power of two and bigger than 1");
      this._csize = size << 1;
      var table = new Array(this.size * 2);
      for (var i = 0; i < table.length; i += 2) {
        const angle = Math.PI * i / this.size;
        table[i] = Math.cos(angle);
        table[i + 1] = -Math.sin(angle);
      }
      this.table = table;
      var power = 0;
      for (var t = 1; this.size > t; t <<= 1)
        power++;
      this._width = power % 2 === 0 ? power - 1 : power;
      this._bitrev = new Array(1 << this._width);
      for (var j = 0; j < this._bitrev.length; j++) {
        this._bitrev[j] = 0;
        for (var shift = 0; shift < this._width; shift += 2) {
          var revShift = this._width - shift - 2;
          this._bitrev[j] |= (j >>> shift & 3) << revShift;
        }
      }
      this._out = null;
      this._data = null;
      this._inv = 0;
    }
    module.exports = FFT2;
    FFT2.prototype.fromComplexArray = function fromComplexArray(complex, storage) {
      var res = storage || new Array(complex.length >>> 1);
      for (var i = 0; i < complex.length; i += 2)
        res[i >>> 1] = complex[i];
      return res;
    };
    FFT2.prototype.createComplexArray = function createComplexArray() {
      const res = new Array(this._csize);
      for (var i = 0; i < res.length; i++)
        res[i] = 0;
      return res;
    };
    FFT2.prototype.toComplexArray = function toComplexArray(input, storage) {
      var res = storage || this.createComplexArray();
      for (var i = 0; i < res.length; i += 2) {
        res[i] = input[i >>> 1];
        res[i + 1] = 0;
      }
      return res;
    };
    FFT2.prototype.completeSpectrum = function completeSpectrum(spectrum) {
      var size = this._csize;
      var half = size >>> 1;
      for (var i = 2; i < half; i += 2) {
        spectrum[size - i] = spectrum[i];
        spectrum[size - i + 1] = -spectrum[i + 1];
      }
    };
    FFT2.prototype.transform = function transform(out, data) {
      if (out === data)
        throw new Error("Input and output buffers must be different");
      this._out = out;
      this._data = data;
      this._inv = 0;
      this._transform4();
      this._out = null;
      this._data = null;
    };
    FFT2.prototype.realTransform = function realTransform(out, data) {
      if (out === data)
        throw new Error("Input and output buffers must be different");
      this._out = out;
      this._data = data;
      this._inv = 0;
      this._realTransform4();
      this._out = null;
      this._data = null;
    };
    FFT2.prototype.inverseTransform = function inverseTransform(out, data) {
      if (out === data)
        throw new Error("Input and output buffers must be different");
      this._out = out;
      this._data = data;
      this._inv = 1;
      this._transform4();
      for (var i = 0; i < out.length; i++)
        out[i] /= this.size;
      this._out = null;
      this._data = null;
    };
    FFT2.prototype._transform4 = function _transform4() {
      var out = this._out;
      var size = this._csize;
      var width = this._width;
      var step = 1 << width;
      var len = size / step << 1;
      var outOff;
      var t;
      var bitrev = this._bitrev;
      if (len === 4) {
        for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
          const off = bitrev[t];
          this._singleTransform2(outOff, off, step);
        }
      } else {
        for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
          const off = bitrev[t];
          this._singleTransform4(outOff, off, step);
        }
      }
      var inv = this._inv ? -1 : 1;
      var table = this.table;
      for (step >>= 2; step >= 2; step >>= 2) {
        len = size / step << 1;
        var quarterLen = len >>> 2;
        for (outOff = 0; outOff < size; outOff += len) {
          var limit = outOff + quarterLen;
          for (var i = outOff, k = 0; i < limit; i += 2, k += step) {
            const A = i;
            const B = A + quarterLen;
            const C = B + quarterLen;
            const D = C + quarterLen;
            const Ar = out[A];
            const Ai = out[A + 1];
            const Br = out[B];
            const Bi = out[B + 1];
            const Cr = out[C];
            const Ci = out[C + 1];
            const Dr = out[D];
            const Di = out[D + 1];
            const MAr = Ar;
            const MAi = Ai;
            const tableBr = table[k];
            const tableBi = inv * table[k + 1];
            const MBr = Br * tableBr - Bi * tableBi;
            const MBi = Br * tableBi + Bi * tableBr;
            const tableCr = table[2 * k];
            const tableCi = inv * table[2 * k + 1];
            const MCr = Cr * tableCr - Ci * tableCi;
            const MCi = Cr * tableCi + Ci * tableCr;
            const tableDr = table[3 * k];
            const tableDi = inv * table[3 * k + 1];
            const MDr = Dr * tableDr - Di * tableDi;
            const MDi = Dr * tableDi + Di * tableDr;
            const T0r = MAr + MCr;
            const T0i = MAi + MCi;
            const T1r = MAr - MCr;
            const T1i = MAi - MCi;
            const T2r = MBr + MDr;
            const T2i = MBi + MDi;
            const T3r = inv * (MBr - MDr);
            const T3i = inv * (MBi - MDi);
            const FAr = T0r + T2r;
            const FAi = T0i + T2i;
            const FCr = T0r - T2r;
            const FCi = T0i - T2i;
            const FBr = T1r + T3i;
            const FBi = T1i - T3r;
            const FDr = T1r - T3i;
            const FDi = T1i + T3r;
            out[A] = FAr;
            out[A + 1] = FAi;
            out[B] = FBr;
            out[B + 1] = FBi;
            out[C] = FCr;
            out[C + 1] = FCi;
            out[D] = FDr;
            out[D + 1] = FDi;
          }
        }
      }
    };
    FFT2.prototype._singleTransform2 = function _singleTransform2(outOff, off, step) {
      const out = this._out;
      const data = this._data;
      const evenR = data[off];
      const evenI = data[off + 1];
      const oddR = data[off + step];
      const oddI = data[off + step + 1];
      const leftR = evenR + oddR;
      const leftI = evenI + oddI;
      const rightR = evenR - oddR;
      const rightI = evenI - oddI;
      out[outOff] = leftR;
      out[outOff + 1] = leftI;
      out[outOff + 2] = rightR;
      out[outOff + 3] = rightI;
    };
    FFT2.prototype._singleTransform4 = function _singleTransform4(outOff, off, step) {
      const out = this._out;
      const data = this._data;
      const inv = this._inv ? -1 : 1;
      const step2 = step * 2;
      const step3 = step * 3;
      const Ar = data[off];
      const Ai = data[off + 1];
      const Br = data[off + step];
      const Bi = data[off + step + 1];
      const Cr = data[off + step2];
      const Ci = data[off + step2 + 1];
      const Dr = data[off + step3];
      const Di = data[off + step3 + 1];
      const T0r = Ar + Cr;
      const T0i = Ai + Ci;
      const T1r = Ar - Cr;
      const T1i = Ai - Ci;
      const T2r = Br + Dr;
      const T2i = Bi + Di;
      const T3r = inv * (Br - Dr);
      const T3i = inv * (Bi - Di);
      const FAr = T0r + T2r;
      const FAi = T0i + T2i;
      const FBr = T1r + T3i;
      const FBi = T1i - T3r;
      const FCr = T0r - T2r;
      const FCi = T0i - T2i;
      const FDr = T1r - T3i;
      const FDi = T1i + T3r;
      out[outOff] = FAr;
      out[outOff + 1] = FAi;
      out[outOff + 2] = FBr;
      out[outOff + 3] = FBi;
      out[outOff + 4] = FCr;
      out[outOff + 5] = FCi;
      out[outOff + 6] = FDr;
      out[outOff + 7] = FDi;
    };
    FFT2.prototype._realTransform4 = function _realTransform4() {
      var out = this._out;
      var size = this._csize;
      var width = this._width;
      var step = 1 << width;
      var len = size / step << 1;
      var outOff;
      var t;
      var bitrev = this._bitrev;
      if (len === 4) {
        for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
          const off = bitrev[t];
          this._singleRealTransform2(outOff, off >>> 1, step >>> 1);
        }
      } else {
        for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
          const off = bitrev[t];
          this._singleRealTransform4(outOff, off >>> 1, step >>> 1);
        }
      }
      var inv = this._inv ? -1 : 1;
      var table = this.table;
      for (step >>= 2; step >= 2; step >>= 2) {
        len = size / step << 1;
        var halfLen = len >>> 1;
        var quarterLen = halfLen >>> 1;
        var hquarterLen = quarterLen >>> 1;
        for (outOff = 0; outOff < size; outOff += len) {
          for (var i = 0, k = 0; i <= hquarterLen; i += 2, k += step) {
            var A = outOff + i;
            var B = A + quarterLen;
            var C = B + quarterLen;
            var D = C + quarterLen;
            var Ar = out[A];
            var Ai = out[A + 1];
            var Br = out[B];
            var Bi = out[B + 1];
            var Cr = out[C];
            var Ci = out[C + 1];
            var Dr = out[D];
            var Di = out[D + 1];
            var MAr = Ar;
            var MAi = Ai;
            var tableBr = table[k];
            var tableBi = inv * table[k + 1];
            var MBr = Br * tableBr - Bi * tableBi;
            var MBi = Br * tableBi + Bi * tableBr;
            var tableCr = table[2 * k];
            var tableCi = inv * table[2 * k + 1];
            var MCr = Cr * tableCr - Ci * tableCi;
            var MCi = Cr * tableCi + Ci * tableCr;
            var tableDr = table[3 * k];
            var tableDi = inv * table[3 * k + 1];
            var MDr = Dr * tableDr - Di * tableDi;
            var MDi = Dr * tableDi + Di * tableDr;
            var T0r = MAr + MCr;
            var T0i = MAi + MCi;
            var T1r = MAr - MCr;
            var T1i = MAi - MCi;
            var T2r = MBr + MDr;
            var T2i = MBi + MDi;
            var T3r = inv * (MBr - MDr);
            var T3i = inv * (MBi - MDi);
            var FAr = T0r + T2r;
            var FAi = T0i + T2i;
            var FBr = T1r + T3i;
            var FBi = T1i - T3r;
            out[A] = FAr;
            out[A + 1] = FAi;
            out[B] = FBr;
            out[B + 1] = FBi;
            if (i === 0) {
              var FCr = T0r - T2r;
              var FCi = T0i - T2i;
              out[C] = FCr;
              out[C + 1] = FCi;
              continue;
            }
            if (i === hquarterLen)
              continue;
            var ST0r = T1r;
            var ST0i = -T1i;
            var ST1r = T0r;
            var ST1i = -T0i;
            var ST2r = -inv * T3i;
            var ST2i = -inv * T3r;
            var ST3r = -inv * T2i;
            var ST3i = -inv * T2r;
            var SFAr = ST0r + ST2r;
            var SFAi = ST0i + ST2i;
            var SFBr = ST1r + ST3i;
            var SFBi = ST1i - ST3r;
            var SA = outOff + quarterLen - i;
            var SB = outOff + halfLen - i;
            out[SA] = SFAr;
            out[SA + 1] = SFAi;
            out[SB] = SFBr;
            out[SB + 1] = SFBi;
          }
        }
      }
    };
    FFT2.prototype._singleRealTransform2 = function _singleRealTransform2(outOff, off, step) {
      const out = this._out;
      const data = this._data;
      const evenR = data[off];
      const oddR = data[off + step];
      const leftR = evenR + oddR;
      const rightR = evenR - oddR;
      out[outOff] = leftR;
      out[outOff + 1] = 0;
      out[outOff + 2] = rightR;
      out[outOff + 3] = 0;
    };
    FFT2.prototype._singleRealTransform4 = function _singleRealTransform4(outOff, off, step) {
      const out = this._out;
      const data = this._data;
      const inv = this._inv ? -1 : 1;
      const step2 = step * 2;
      const step3 = step * 3;
      const Ar = data[off];
      const Br = data[off + step];
      const Cr = data[off + step2];
      const Dr = data[off + step3];
      const T0r = Ar + Cr;
      const T1r = Ar - Cr;
      const T2r = Br + Dr;
      const T3r = inv * (Br - Dr);
      const FAr = T0r + T2r;
      const FBr = T1r;
      const FBi = -T3r;
      const FCr = T0r - T2r;
      const FDr = T1r;
      const FDi = T3r;
      out[outOff] = FAr;
      out[outOff + 1] = 0;
      out[outOff + 2] = FBr;
      out[outOff + 3] = FBi;
      out[outOff + 4] = FCr;
      out[outOff + 5] = 0;
      out[outOff + 6] = FDr;
      out[outOff + 7] = FDi;
    };
  }
});

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
var import_fft = __toESM(require_fft(), 1);
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
Beat.prototype.getBeatsWithVolume = function(channelIndex, frameSize, func) {
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
Beat.prototype.getBeats = function(channelIndex, frameSize, func) {
  return this.getBeatsWithVolume(channelIndex, frameSize, func).map(
    (item) => item.index
  );
};
Beat.prototype.getBeatsWithFFT = function(channelIndex, fftSize, beatThreshold, lowEnergySize, avgEnergySize) {
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
  let energyHistory = [], result = [];
  const fft = new import_fft.default(fftSize);
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
          spectrum[j] * spectrum[j] + // imaginary
          spectrum[j + 1] * spectrum[j + 1]
        )
      );
    }
    let lowFreqEnergy = 0;
    for (let j = 0; j < lowEnergySize; j++) {
      lowFreqEnergy += magnitudes[j];
    }
    energyHistory.push(lowFreqEnergy);
    let avgEnergy = 0, avgEnergyCounts = 0;
    for (let j = Math.max(0, energyHistory.length - 1 - avgEnergySize); j < energyHistory.length; j++) {
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
Beat.prototype.getTemposWithCount = function(beats) {
  let groups = [];
  for (let i = 0; i < beats.length; i++) {
    const len = Math.min(i + 10, beats.length);
    for (let j = i + 1; j < len; j++) {
      const startIndex = beats[i];
      const endIndex = beats[j];
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
