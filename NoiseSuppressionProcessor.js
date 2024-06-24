// import { AudioWorkletProcessor } from 'standardized-audio-context';
// import x from "../node_modules/@shiguredo/rnnoise-wasm/dist/rnnoise.mjs";

// err -
import { createRNNWasmModuleSync } from "./jitsi-rnnoise/index.js";
import { leastCommonMultiple } from "./math.js";
import RnnoiseProcessor from "./RnnoiseProcessor.js";

// build left

class NoiseSuppressorWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this._denoiseProcessor = null;

    this._procNodeSampleRate = 128;

    this._denoiseSampleSize = 0;

    this._circularBufferLength = 0;

    this._circularBuffer = null;

    this._inputBufferLength = 0;

    this._denoisedBufferLength = 0;

    this._denoisedBufferIndx = 0;

    this._initializeRNNoise();

    // this._rnnoise =  null;
    // this._denoiseState = null;
    // this.port.onmessage = this._onMessage.bind(this);
    // this._initializeRNNoise();
  }

  async _initializeRNNoise() {
    //   try {
    //   // this._rnnoise = await Rnnoise.load({assetsPath:`${window.location.origin}/`});
    //   this._denoiseState = this._rnnoise?.createDenoiseState();
    // } catch (error) {
    //   console.error('Error initializing RNNoise:', error);
    // }

    this._denoiseProcessor = new RnnoiseProcessor(createRNNWasmModuleSync());
    this._denoiseSampleSize = this._denoiseProcessor.getSampleLength();

    this._circularBufferLength = leastCommonMultiple(
      this._procNodeSampleRate,
      this._denoiseSampleSize
    );
    // console.log("LCM ",this._circularBufferLength);
    this._circularBuffer = new Float32Array(this._circularBufferLength);
  }

  // _onMessage(event) {
  //   console.log("Message from noise: ",event);
  //   if(event.data.type === "rnnoise_module"){
  //     this._rnnoise = event.data.rnnoise;
  //     this._initializeRNNoise();
  //   }
  // }

  process(inputs, outputs, parameters) {
    const inData = inputs[0][0];
    const outData = outputs[0][0];

    if (!inData) {
      return true;
    }

    // Buffer the incoming data
    this._circularBuffer.set(inData, this._inputBufferLength);
    this._inputBufferLength += inData.length;

    // Process the buffered data in chunks of _denoiseSampleSize
    while (this._denoisedBufferLength + this._denoiseSampleSize <= this._inputBufferLength) {
      const denoiseFrame = this._circularBuffer.subarray(
        this._denoisedBufferLength,
        this._denoisedBufferLength + this._denoiseSampleSize
      );

      let vadScore = this._denoiseProcessor.processAudioFrame(denoiseFrame, true);

      if (vadScore >= 0.85) {
        console.log("VOICE DETECTED SCORE:", vadScore);
      } else {
        // Logic to suppress audio if needed
      }

      this._denoisedBufferLength += this._denoiseSampleSize;
    }

    // Determine the length of unsent denoised data
    let unsentDenoisedDataLength;
    if (this._denoisedBufferIndx > this._denoisedBufferLength) {
      unsentDenoisedDataLength = this._circularBufferLength - this._denoisedBufferIndx;
    } else {
      unsentDenoisedDataLength = this._denoisedBufferLength - this._denoisedBufferIndx;
    }

    // If we have enough denoised data to fill the output buffer, send it
    if (unsentDenoisedDataLength >= outData.length) {
      const denoisedFrame = this._circularBuffer.subarray(
        this._denoisedBufferIndx,
        this._denoisedBufferIndx + outData.length
      );
      outData.set(denoisedFrame, 0);
      this._denoisedBufferIndx += outData.length;
    }

    // Wrap around the buffer index if needed
    if (this._denoisedBufferIndx === this._circularBufferLength) {
      this._denoisedBufferIndx = 0;
    }

    // Reset buffer indices if the entire buffer has been processed
    if (this._inputBufferLength === this._circularBufferLength) {
      this._inputBufferLength = 0;
      this._denoisedBufferLength = 0;
    }

    return true;
  }
}

registerProcessor("noise-suppressor-worklet", NoiseSuppressorWorklet);
