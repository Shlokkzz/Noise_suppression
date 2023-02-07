(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _MultiStreamsMixer = _interopRequireDefault(require("./node_modules/multistreamsmixer/MultiStreamsMixer.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//////////

let connection;
let localMediaStream;
let remoteMediaStream;
let textChannelStream;
let conversation = [];
let exchange = [];

//
let mainContainer = document.getElementById('main-box');
let connectContainer = document.getElementById('connect-box');
let videoContainer = document.getElementById('video-box');
let localVideo = document.getElementById('local');
let remoteVideo = document.getElementById('remote');
let mixedVideo = document.getElementById('mixed');
let localScreenShare = document.getElementById('local-screen-share');
let remoteScreenShare = document.getElementById('remote-screen-share');
let createOfferAnswerButton = document.getElementById('create-offer-answer');
let sendMessegeButton = document.getElementById('send-button');
let sendMessegeTextArea = document.getElementById('send-messege');
let offerAnswerBox = document.getElementById('answer-offer-box');
let submitButton = document.getElementById('submit');
let endButton = document.getElementById('end-button');
var audio1;
var audio2;
let buttonOpen = 'rgb(0, 0, 0)';
let buttonClosed = 'rgb(139, 0, 0)';
let offerAnswerTextArea = document.getElementById('offer-answer-area');
var chunkLength = 1000;
let offer = {
  description: "",
  candidate: ""
};
let answer = {
  description: "",
  candidate: ""
};
;
let screenSharetoggle = false;
let ssStreamTrack = [];
var arrayToStoreChunks = [];
let screenShareCount = 0;
function onSuccess() {}
;
function onError(error) {
  console.error(error);
}
;
function str(obj) {
  return JSON.stringify(obj);
}
;
function ustr(obj) {
  return JSON.parse(obj);
}
let setupConnection = async () => {
  initialCSS();
  startWebRTC();
};
let state = 0;
// let socket = io('http://127.0.0.1:8080/'); 
// socket.on('connect', () => { console.log(socket.id) });

async function handleMeetEnd() {
  console.log('handle end called');
  await stopRecording();
  window.location.reload();
}
function startWebRTC() {
  console.log('Starting webrtc');
  connection = new RTCPeerConnection({
    iceServers: [{
      urls: 'stun:stun.l.google.com:19302'
    }, {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    }, {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject"
    }, {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }, {
      url: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    }, {
      url: 'turn:192.158.29.39:3478?transport=udp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    }, {
      url: 'turn:192.158.29.39:3478?transport=tcp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    }, {
      url: 'turn:turn.bistri.com:80',
      credential: 'homeo',
      username: 'homeo'
    }, {
      url: 'turn:turn.anyfirewall.com:443?transport=tcp',
      credential: 'webrtc',
      username: 'webrtc'
    }]
  });
  endButton.addEventListener('click', () => {
    sentOverDataStream('system', 'MEET_ENDED');
    handleMeetEnd();
  });
  textChannelStream = connection.createDataChannel('dataChannel');
  connection.ondatachannel = e => {
    const receiveChannel = e.channel;
    receiveChannel.onmessage = e => {
      console.log('Messege recived');
      if (ustr(e.data).type == 'system') {
        if (ustr(e.data).message == 'SCREEN_SHARE_OPENED') {
          toggleRemoteStreamShare();
          // handleScreenShareBox();
        } else if (ustr(e.data).message == 'SCREEN_SHARE_CLOSED') {
          toggleRemoteStreamShare();
          //handleScreenShareBox();
        } else if (ustr(e.data).message == 'MEET_ENDED') {
          handleMeetEnd();
        } else if (ustr(e.data).message == 'AUDIO_TOGGLE') {
          toggleElementDisplay(document.getElementById('overlay-remote-audio-icon'));
        }
      } else if (ustr(e.data).type == 'file-share') {
        // var data = ustr(e.data).message;
        // arrayToStoreChunks.push(data.message); // pushing chunks in array
        // if (data.last) {
        //     //console.log(arrayToStoreChunks.join(''));
        //     download(`${data.name}`,arrayToStoreChunks.join(''));
        //     arrayToStoreChunks = []; // resetting array
        // }
      } else addMessege(2, "Sender : " + ustr(e.data).message);
    };
    receiveChannel.onopen = e => {
      startMeet();
    };
    receiveChannel.onclose = e => console.log("Closed Text Channel.");
  };

  // function download(filename, text) {
  //     var element = document.createElement('a');
  //     element.setAttribute('href', 'data:jpg;charset=utf-8,' + encodeURIComponent(text));
  //     element.setAttribute('download', filename);

  //     element.style.display = 'none';
  //     document.body.appendChild(element);

  //     element.click();

  //     document.body.removeChild(element);
  // }

  connection.onicecandidate = event => {
    if (event.candidate) {
      exchange.push(str(event.candidate));
    }
  };
  document.getElementById('submit-offer-answer').addEventListener('click', function () {
    let obj = document.getElementById('offer-answer-area').value;
    let message = ustr(obj);
    if (ustr(message.description).type == 'offer' && state === 0) {
      state = 2;
      connection.setRemoteDescription(new RTCSessionDescription(ustr(message.description)), () => {
        connection.createAnswer().then(handleLocalDescription).then(addIce(message.candidate));
        setTimeout(createIceAnswer, 1000);
      });
    } else if (ustr(message.description).type == 'answer' && state === 1) {
      connection.setRemoteDescription(new RTCSessionDescription(ustr(message.description)), () => {
        addIce(message.candidate);
      });
    }
    //}
  });

  createOfferAnswerButton.addEventListener('click', () => {
    state = 1;
    connection.createOffer().then(handleLocalDescription).catch(onError);
    setTimeout(createIceOffer, 1000);
  });
  let flg = 0;
  connection.ontrack = event => {
    const stream = event.streams[0];
    if (flg == 0) {
      remoteVideo.srcObject = stream;
      flg++;
    } else {
      remoteScreenShare.srcObject = stream;
      //toggleRemoteStreamShare();
      //handleScreenShareBox();
    }
  };

  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  }).then(stream => {
    localVideo.srcObject = stream;
    document.getElementById('sample-video').srcObject = stream;
    stream.getTracks().forEach(track => connection.addTrack(track, stream));
  }, onError);
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  }).then(stream => {
    stream.getTracks().forEach(track => {
      ssStreamTrack.push(connection.addTrack(track, stream));
    });
    localScreenShare.srcObject = stream;
    //toggleLocalStreamShare();
  }, onError);
  document.getElementById('screen-share-button-2').addEventListener('click', () => {
    if (screenSharetoggle == false) {
      navigator.mediaDevices.getDisplayMedia().then(stream => {
        localScreenShare.srcObject = stream;
        console.log(localScreenShare.srcObject);
        localScreenShare.srcObject.oninactive = function () {
          toggleLocalStreamShare();
          handleScreenShareBox();
          sentOverDataStream('system', 'SCREEN_SHARE_CLOSED');
        };
        ssStreamTrack[0].replaceTrack(stream.getTracks()[0]);
        handleScreenShareBox();
        sentOverDataStream('system', 'SCREEN_SHARE_OPENED');
        toggleLocalStreamShare();
      }, onError);
    } else {}
  });
  function addIce(candidates) {
    let messege = ustr(candidates);
    messege.forEach(item => {
      let candidate = JSON.parse(item);
      connection.addIceCandidate(new RTCIceCandidate(candidate), onSuccess, onError);
    });
  }
  function createIceOffer() {
    offer.candidate = str(exchange);
    document.getElementById('offer-answer-area').value = str(offer);
    // socket.emit('message',str(offer));
  }

  function createIceAnswer() {
    answer.candidate = str(exchange);
    //socket.emit('message',str(answer));
    document.getElementById('offer-answer-area').value = str(answer);
  }
  function handleLocalDescription(description) {
    connection.setLocalDescription(description);
    if (description.type === 'offer') {
      offer.description = str(description);
    } else {
      answer.description = str(description);
    }
  }

  //var name= "";

  // document.getElementById('fileshare').onchange = function(){
  //         console.log('file share invoked');
  //         var file = this.files[0];
  //         name  = file.name;
  //         var reader = new window.FileReader();
  //         reader.readAsDataURL(file);
  //         reader.onload = onReadAsDataURL;
  // }

  //     function onReadAsDataURL(event, text) {
  //         var data = {}; // data object to transmit over data channel

  //         if (event) text = event.target.result; // on first invocation

  //         if (text.length > chunkLength) {
  //             data.message = text.slice(0, chunkLength); // getting chunk using predefined chunk length
  //         } else {
  //             data.message = text;
  //             data.last = true;
  //             data.name = name;

  //         }

  //         sentOverDataStream('file-share',data); // use JSON.stringify for chrome!

  //         var remainingDataURL = text.slice(data.message.length);
  //         if (remainingDataURL.length) setTimeout(function () {
  //             onReadAsDataURL(null, remainingDataURL); // continue transmitting
  //         }, 500)
  //     }
}

document.getElementById('video-pause-button').addEventListener('click', () => {
  console.log('Vide pause main screen clicked');
  toggleMediaOptionButtonColor(document.getElementById('video-pause-button'));
  localVideo.srcObject.getTracks()[1].enabled = !localVideo.srcObject.getTracks()[1].enabled;
});
document.getElementById('audio-pause-button').addEventListener('click', () => {
  toggleMediaOptionButtonColor(document.getElementById('audio-pause-button'));
  toggleElementDisplay(document.getElementById('overlay-sample-audio-icon'));
  localVideo.srcObject.getTracks()[0].enabled = !localVideo.srcObject.getTracks()[0].enabled;
});
document.getElementById('video-pause-button-2').addEventListener('click', () => {
  toggleMediaOptionButtonColor(document.getElementById('video-pause-button-2'));
  localVideo.srcObject.getTracks()[1].enabled = !localVideo.srcObject.getTracks()[1].enabled;
});
document.getElementById('audio-pause-button-2').addEventListener('click', () => {
  toggleMediaOptionButtonColor(document.getElementById('audio-pause-button-2'));
  toggleElementDisplay(document.getElementById('overlay-local-audio-icon'));
  localVideo.srcObject.getTracks()[0].enabled = !localVideo.srcObject.getTracks()[0].enabled;
  sentOverDataStream('system', 'AUDIO_TOGGLE');
});
function toggleElementDisplay(element) {
  if (element.style.display === 'none') element.style.display = 'flex';else element.style.display = 'none';
}
// function getVisibleStream(){
//     let count=2;
//     if(localScreenShare.srcObject.getTracks()[0].enabled) count++;
//     if(remoteScreenShare.srcObject.getTracks()[0].enabled) count++;
//     return count;
// }

// function stopLocalStreamShare(){
//     if(!localScreenShare.srcObject.getTracks()[0].enabled)
//         localScreenShare.srcObject.getTracks()[0].enabled = !localScreenShare.srcObject.getTracks()[0].enabled;
// }

// function stopRemoteStreamShare(){
//     if(!remoteScreenShare.srcObject.getTracks()[0].enabled)
//         remoteScreenShare.srcObject.getTracks()[0].enabled = !remoteScreenShare.srcObject.getTracks()[0].enabled;
// }

function toggleLocalStreamShare() {
  if (document.getElementById('screen-share-local-box').style.display === 'none') document.getElementById('screen-share-local-box').style.display = 'flex';else document.getElementById('screen-share-local-box').style.display = 'none';
  //localScreenShare.srcObject.getTracks()[0].enabled = !localScreenShare.srcObject.getTracks()[0].enabled;
  console.log('Local screen stream ', localScreenShare.srcObject.getTracks()[0].enabled);
}
function toggleRemoteStreamShare() {
  if (document.getElementById('screen-share-remote-box').style.display === 'none') document.getElementById('screen-share-remote-box').style.display = 'flex';else document.getElementById('screen-share-remote-box').style.display = 'none';
  //remoteScreenShare.srcObject.getTracks()[0].enabled = !remoteScreenShare.srcObject.getTracks()[0].enabled ;
  console.log('Remote screen stream', remoteScreenShare.srcObject.getTracks()[0].enabled);
}

// function handleScreenShareBox(){

//     let localStreamActive =  localScreenShare.srcObject.getTracks()[0].enabled;
//     let remoteStreamActive = remoteScreenShare.srcObject.getTracks()[0].enabled;
//     if(localStreamActive)
//         localScreenShare.style.display = 'flex';
//     else
//         localScreenShare.style.display = 'none';

//     if(remoteStreamActive)
//         remoteScreenShare.style.display = 'flex';
//     else
//         remoteScreenShare.style.display = 'none';
//     handleView();
// }

function videoEventListenersAdd() {
  document.querySelectorAll('.video-stream-container').forEach(item => {
    item.addEventListener('click', () => {
      console.log('clicked');
      console.log(item.srcObject);
      document.getElementById('main-stream').srcObject = item.srcObject;
      console.log(document.getElementById('main-stream').srcObject);
    });
  });
}
function handleView() {
  console.log('Handle View Called');
  let count = getVisibleStream();
  console.log(count);
  document.querySelectorAll('.video-stream-container').forEach(item => {
    item.style.width = `${100 / count}%`;
    console.log(item);
  });
  if (count > 2) {
    document.getElementById('video-box').style.height = `20vh`;
    document.querySelectorAll('.video-stream-container').forEach(item => {
      item.style.width = `20vh`;
      console.log(item);
    });
    document.getElementById('main-stream').srcObject = localVideo.srcObject;
    document.getElementById('main-stream').style.display = 'flex';
    document.getElementById('main-stream').style.height = `60vh`;
  } else {
    document.getElementById('video-box').style.height = `80vh`;
    document.getElementById('main-stream').style.display = 'none';
  }
}
function addMessege(a, messege) {
  const chats = document.getElementById('all-chats-id');
  if (conversation.length == 0) chats.style.backgroundColor = 'transparent';
  conversation.push(messege);
  if (a == 1) chats.innerHTML = chats.innerHTML + ` <p class="chats me" id = 'chatid${conversation.length}'>${messege}</p>`;else chats.innerHTML = chats.innerHTML + ` <p class="chats sender" id = 'chatid${conversation.length}'>${messege}</p>`;
  updateScroll();
}
function sentOverDataStream(type, message) {
  textChannelStream.send(str({
    type: type,
    message: message
  }));
}
function onSend() {
  addMessege(1, "Me: " + sendMessegeTextArea.value);
  sentOverDataStream('user', sendMessegeTextArea.value);
  sendMessegeTextArea.value = "";
  document.activeElement.blur();
}
function startMeet() {
  removeSetupScreen();
  addMeetScreen();
  //removeScreenShareInitially();
  //handleView();
  videoEventListenersAdd();
  //handleSuccess();
  startRecording();
}
function removeScreenShareInitially() {
  console.log('Removing stream local');
  // toggleLocalStreamShare();
  // toggleRemoteStreamShare();
  stopLocalStreamShare();
  stopRemoteStreamShare();
}
function initialCSS() {
  document.getElementById('main-box').style.display = 'none';
  //localScreenShare.style.display = 'none';
  ///document.getElementById('video-pause-button-2').style.display = 'none';
  // document.getElementById('audio-pause-button-2').style.display = 'none';
  // document.getElementById('screen-share-button-2').style.display = 'none';
  // document.getElementById('end-button').style.display = 'none';
  //mainContainer.classList.add('flexCol');
  // document.getElementById('video-box').style.display='none';
  // document.getElementById('chat-box').style.display='none';
  // remoteScreenShare.style.display = 'none';
  // localScreenShare.style.display = 'none';
  //document.getElementsByTagName("BODY")[0].style.backgroundColor ='#202020';

  document.getElementById('video-pause-button').style.backgroundColor = buttonOpen;
  document.getElementById('audio-pause-button').style.backgroundColor = buttonOpen;
  document.getElementById('overlay-sample-audio-icon').style.display = 'flex';
}
function addMeetScreen() {
  // document.getElementById('video-box').style.display='flex';
  // document.getElementById('chat-box').style.display='flex';
  document.getElementById('screen-share-remote-box').style.display = 'none';
  document.getElementById('screen-share-local-box').style.display = 'none';
  document.getElementById('video-pause-button-2').style.backgroundColor = buttonOpen;
  document.getElementById('audio-pause-button-2').style.backgroundColor = buttonOpen;
  document.getElementById('screen-share-button-2').style.backgroundColor = buttonOpen;
  document.getElementById('end-button').style.backgroundColor = buttonClosed;
  document.getElementById('main-box').style.display = 'flex';
  document.getElementById('overlay-local-audio-icon').style.display = 'flex';
  if (remoteVideo.srcObject.getTracks()[0].enabled) document.getElementById('overlay-remote-audio-icon').style.display = 'flex';else document.getElementById('overlay-remote-audio-icon').style.display = 'none';
  if (!localVideo.srcObject.getTracks()[0].enabled) {
    toggleMediaOptionButtonColor(document.getElementById('audio-pause-button-2'));
    toggleElementDisplay(document.getElementById('overlay-local-audio-icon'));
    sentOverDataStream('system', 'AUDIO_TOGGLE');
  }
  ;
}
function removeSetupScreen() {
  connectContainer.style.display = 'none';
}
function updateScroll() {
  const chats = document.getElementById('all-chats-id');
  chats.scrollTop = chats.scrollHeight - chats.clientHeight;
}

//sendMessegeButton.addEventListener('click', onSend);
//window.addEventListener('resize', handleResponsive , true);
sendMessegeTextArea.onkeypress = event => {
  console.log(event.keyCode);
  if (event.keyCode == 13) {
    event.preventDefault();
    onSend();
  }
};
setupConnection();
function isEllipsisActive(e) {
  return e.offsetWidth < e.scrollWidth;
}
function handleResponsive(event) {
  console.log(window.innerHeight + " " + window.innerWidth);
  // if(window.innerWidth<600)
  // {
  //     handleResponsiveOverflow();  
  // }
  // else 
  // {
  //     handleResponsiveUnderflow();
  // }
}

function handleResponsiveOverflow() {
  console.log(offerAnswerBox.classList);
  offerAnswerBox.classList.remove('flexRow');
  offerAnswerBox.classList.add('flexCol');
  videoContainer.classList.remove('flexRow');
  videoContainer.classList.add('flexCol');
  localVideo.style.height = "auto";
  localVideo.style.width = "90vw";
  remoteVideo.style.height = "auto";
  remoteVideo.style.width = "90vw";
}
function handleResponsiveUnderflow() {
  offerAnswerBox.classList.remove('flexCol');
  offerAnswerBox.classList.add('flexRow');
  videoContainer.classList.add('flexRow');
  videoContainer.classList.remove('flexCol');
  localVideo.style.height = "50vh";
  localVideo.style.width = "45vw";
  remoteVideo.style.height = "50vh";
  remoteVideo.style.width = "45vw";
}
function hexToRGB(h) {
  let r = 0,
    g = 0,
    b = 0;

  // 3 digits
  if (h.length == 4) {
    r = "0x" + h[1] + h[1];
    g = "0x" + h[2] + h[2];
    b = "0x" + h[3] + h[3];

    // 6 digits
  } else if (h.length == 7) {
    r = "0x" + h[1] + h[2];
    g = "0x" + h[3] + h[4];
    b = "0x" + h[5] + h[6];
  }
  return "rgb(" + +r + ", " + +g + ", " + +b + ")";
}
function toggleMediaOptionButtonColor(element) {
  console.log('Clr is :', element.style.backgroundColor);
  console.log(element.style.backgroundColor.toString());
  console.log(buttonClosed);
  if (element.style.backgroundColor === buttonClosed) element.style.backgroundColor = buttonOpen;else element.style.backgroundColor = buttonClosed;
}

////////////////////

let mediaRecorder;
let recordedBlobs;
function downloader() {
  const blob = new Blob(recordedBlobs, {
    type: 'video/webm'
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'test.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}
function startRecording() {
  console.log('started recording');
  recordedBlobs = [];
  const options = {
    mimeType: 'video/webm'
  };
  try {
    const mixer = new _MultiStreamsMixer.default([localVideo.srcObject, remoteVideo.srcObject]);
    mixer.frameInterval = 1;
    mixer.startDrawingFrames();
    mediaRecorder = new MediaRecorder(mixer.getMixedStream(), options);
    //mixedVideo.srcObject = mixer.getMixedStream();
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    return;
  }
  mediaRecorder.onstop = event => {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);
    downloader();
  };
  mediaRecorder.ondataavailable = event => {
    //console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
    }
  };
  mediaRecorder.start(100);
  console.log('MediaRecorder started', mediaRecorder);
}
function stopRecording() {
  mediaRecorder.stop();
}

},{"./node_modules/multistreamsmixer/MultiStreamsMixer.js":2}],2:[function(require,module,exports){
(function (global){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = MultiStreamsMixer;
// Last time updated: 2019-06-21 4:09:42 AM UTC

// ________________________
// MultiStreamsMixer v1.2.2

// Open-Sourced: https://github.com/muaz-khan/MultiStreamsMixer

// --------------------------------------------------
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// --------------------------------------------------

function MultiStreamsMixer(arrayOfMediaStreams, elementClass) {
  var browserFakeUserAgent = 'Fake/5.0 (FakeOS) AppleWebKit/123 (KHTML, like Gecko) Fake/12.3.4567.89 Fake/123.45';
  (function (that) {
    if (typeof RecordRTC !== 'undefined') {
      return;
    }
    if (!that) {
      return;
    }
    if (typeof window !== 'undefined') {
      return;
    }
    if (typeof global === 'undefined') {
      return;
    }
    global.navigator = {
      userAgent: browserFakeUserAgent,
      getUserMedia: function () {}
    };
    if (!global.console) {
      global.console = {};
    }
    if (typeof global.console.log === 'undefined' || typeof global.console.error === 'undefined') {
      global.console.error = global.console.log = global.console.log || function () {
        console.log(arguments);
      };
    }
    if (typeof document === 'undefined') {
      /*global document:true */
      that.document = {
        documentElement: {
          appendChild: function () {
            return '';
          }
        }
      };
      document.createElement = document.captureStream = document.mozCaptureStream = function () {
        var obj = {
          getContext: function () {
            return obj;
          },
          play: function () {},
          pause: function () {},
          drawImage: function () {},
          toDataURL: function () {
            return '';
          },
          style: {}
        };
        return obj;
      };
      that.HTMLVideoElement = function () {};
    }
    if (typeof location === 'undefined') {
      /*global location:true */
      that.location = {
        protocol: 'file:',
        href: '',
        hash: ''
      };
    }
    if (typeof screen === 'undefined') {
      /*global screen:true */
      that.screen = {
        width: 0,
        height: 0
      };
    }
    if (typeof URL === 'undefined') {
      /*global screen:true */
      that.URL = {
        createObjectURL: function () {
          return '';
        },
        revokeObjectURL: function () {
          return '';
        }
      };
    }

    /*global window:true */
    that.window = global;
  })(typeof global !== 'undefined' ? global : null);

  // requires: chrome://flags/#enable-experimental-web-platform-features

  elementClass = elementClass || 'multi-streams-mixer';
  var videos = [];
  var isStopDrawingFrames = false;
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  canvas.style.opacity = 0;
  canvas.style.position = 'absolute';
  canvas.style.zIndex = -1;
  canvas.style.top = '-1000em';
  canvas.style.left = '-1000em';
  canvas.className = elementClass;
  (document.body || document.documentElement).appendChild(canvas);
  this.disableLogs = false;
  this.frameInterval = 10;
  this.width = 360;
  this.height = 240;

  // use gain node to prevent echo
  this.useGainNode = true;
  var self = this;

  // _____________________________
  // Cross-Browser-Declarations.js

  // WebAudio API representer
  var AudioContext = window.AudioContext;
  if (typeof AudioContext === 'undefined') {
    if (typeof webkitAudioContext !== 'undefined') {
      /*global AudioContext:true */
      AudioContext = webkitAudioContext;
    }
    if (typeof mozAudioContext !== 'undefined') {
      /*global AudioContext:true */
      AudioContext = mozAudioContext;
    }
  }

  /*jshint -W079 */
  var URL = window.URL;
  if (typeof URL === 'undefined' && typeof webkitURL !== 'undefined') {
    /*global URL:true */
    URL = webkitURL;
  }
  if (typeof navigator !== 'undefined' && typeof navigator.getUserMedia === 'undefined') {
    // maybe window.navigator?
    if (typeof navigator.webkitGetUserMedia !== 'undefined') {
      navigator.getUserMedia = navigator.webkitGetUserMedia;
    }
    if (typeof navigator.mozGetUserMedia !== 'undefined') {
      navigator.getUserMedia = navigator.mozGetUserMedia;
    }
  }
  var MediaStream = window.MediaStream;
  if (typeof MediaStream === 'undefined' && typeof webkitMediaStream !== 'undefined') {
    MediaStream = webkitMediaStream;
  }

  /*global MediaStream:true */
  if (typeof MediaStream !== 'undefined') {
    // override "stop" method for all browsers
    if (typeof MediaStream.prototype.stop === 'undefined') {
      MediaStream.prototype.stop = function () {
        this.getTracks().forEach(function (track) {
          track.stop();
        });
      };
    }
  }
  var Storage = {};
  if (typeof AudioContext !== 'undefined') {
    Storage.AudioContext = AudioContext;
  } else if (typeof webkitAudioContext !== 'undefined') {
    Storage.AudioContext = webkitAudioContext;
  }
  function setSrcObject(stream, element) {
    if ('srcObject' in element) {
      element.srcObject = stream;
    } else if ('mozSrcObject' in element) {
      element.mozSrcObject = stream;
    } else {
      element.srcObject = stream;
    }
  }
  this.startDrawingFrames = function () {
    drawVideosToCanvas();
  };
  function drawVideosToCanvas() {
    if (isStopDrawingFrames) {
      return;
    }
    var videosLength = videos.length;
    var fullcanvas = false;
    var remaining = [];
    videos.forEach(function (video) {
      if (!video.stream) {
        video.stream = {};
      }
      if (video.stream.fullcanvas) {
        fullcanvas = video;
      } else {
        // todo: video.stream.active or video.stream.live to fix blank frames issues?
        remaining.push(video);
      }
    });
    if (fullcanvas) {
      canvas.width = fullcanvas.stream.width;
      canvas.height = fullcanvas.stream.height;
    } else if (remaining.length) {
      canvas.width = videosLength > 1 ? remaining[0].width * 2 : remaining[0].width;
      var height = 1;
      if (videosLength === 3 || videosLength === 4) {
        height = 2;
      }
      if (videosLength === 5 || videosLength === 6) {
        height = 3;
      }
      if (videosLength === 7 || videosLength === 8) {
        height = 4;
      }
      if (videosLength === 9 || videosLength === 10) {
        height = 5;
      }
      canvas.height = remaining[0].height * height;
    } else {
      canvas.width = self.width || 360;
      canvas.height = self.height || 240;
    }
    if (fullcanvas && fullcanvas instanceof HTMLVideoElement) {
      drawImage(fullcanvas);
    }
    remaining.forEach(function (video, idx) {
      drawImage(video, idx);
    });
    setTimeout(drawVideosToCanvas, self.frameInterval);
  }
  function drawImage(video, idx) {
    if (isStopDrawingFrames) {
      return;
    }
    var x = 0;
    var y = 0;
    var width = video.width;
    var height = video.height;
    if (idx === 1) {
      x = video.width;
    }
    if (idx === 2) {
      y = video.height;
    }
    if (idx === 3) {
      x = video.width;
      y = video.height;
    }
    if (idx === 4) {
      y = video.height * 2;
    }
    if (idx === 5) {
      x = video.width;
      y = video.height * 2;
    }
    if (idx === 6) {
      y = video.height * 3;
    }
    if (idx === 7) {
      x = video.width;
      y = video.height * 3;
    }
    if (typeof video.stream.left !== 'undefined') {
      x = video.stream.left;
    }
    if (typeof video.stream.top !== 'undefined') {
      y = video.stream.top;
    }
    if (typeof video.stream.width !== 'undefined') {
      width = video.stream.width;
    }
    if (typeof video.stream.height !== 'undefined') {
      height = video.stream.height;
    }
    context.drawImage(video, x, y, width, height);
    if (typeof video.stream.onRender === 'function') {
      video.stream.onRender(context, x, y, width, height, idx);
    }
  }
  function getMixedStream() {
    isStopDrawingFrames = false;
    var mixedVideoStream = getMixedVideoStream();
    var mixedAudioStream = getMixedAudioStream();
    if (mixedAudioStream) {
      mixedAudioStream.getTracks().filter(function (t) {
        return t.kind === 'audio';
      }).forEach(function (track) {
        mixedVideoStream.addTrack(track);
      });
    }
    var fullcanvas;
    arrayOfMediaStreams.forEach(function (stream) {
      if (stream.fullcanvas) {
        fullcanvas = true;
      }
    });

    // mixedVideoStream.prototype.appendStreams = appendStreams;
    // mixedVideoStream.prototype.resetVideoStreams = resetVideoStreams;
    // mixedVideoStream.prototype.clearRecordedData = clearRecordedData;

    return mixedVideoStream;
  }
  function getMixedVideoStream() {
    resetVideoStreams();
    var capturedStream;
    if ('captureStream' in canvas) {
      capturedStream = canvas.captureStream();
    } else if ('mozCaptureStream' in canvas) {
      capturedStream = canvas.mozCaptureStream();
    } else if (!self.disableLogs) {
      console.error('Upgrade to latest Chrome or otherwise enable this flag: chrome://flags/#enable-experimental-web-platform-features');
    }
    var videoStream = new MediaStream();
    capturedStream.getTracks().filter(function (t) {
      return t.kind === 'video';
    }).forEach(function (track) {
      videoStream.addTrack(track);
    });
    canvas.stream = videoStream;
    return videoStream;
  }
  function getMixedAudioStream() {
    // via: @pehrsons
    if (!Storage.AudioContextConstructor) {
      Storage.AudioContextConstructor = new Storage.AudioContext();
    }
    self.audioContext = Storage.AudioContextConstructor;
    self.audioSources = [];
    if (self.useGainNode === true) {
      self.gainNode = self.audioContext.createGain();
      self.gainNode.connect(self.audioContext.destination);
      self.gainNode.gain.value = 0; // don't hear self
    }

    var audioTracksLength = 0;
    arrayOfMediaStreams.forEach(function (stream) {
      if (!stream.getTracks().filter(function (t) {
        return t.kind === 'audio';
      }).length) {
        return;
      }
      audioTracksLength++;
      var audioSource = self.audioContext.createMediaStreamSource(stream);
      if (self.useGainNode === true) {
        audioSource.connect(self.gainNode);
      }
      self.audioSources.push(audioSource);
    });
    if (!audioTracksLength) {
      // because "self.audioContext" is not initialized
      // that's why we've to ignore rest of the code
      return;
    }
    self.audioDestination = self.audioContext.createMediaStreamDestination();
    self.audioSources.forEach(function (audioSource) {
      audioSource.connect(self.audioDestination);
    });
    return self.audioDestination.stream;
  }
  function getVideo(stream) {
    var video = document.createElement('video');
    setSrcObject(stream, video);
    video.className = elementClass;
    video.muted = true;
    video.volume = 0;
    video.width = stream.width || self.width || 360;
    video.height = stream.height || self.height || 240;
    video.play();
    return video;
  }
  this.appendStreams = function (streams) {
    if (!streams) {
      throw 'First parameter is required.';
    }
    if (!(streams instanceof Array)) {
      streams = [streams];
    }
    streams.forEach(function (stream) {
      var newStream = new MediaStream();
      if (stream.getTracks().filter(function (t) {
        return t.kind === 'video';
      }).length) {
        var video = getVideo(stream);
        video.stream = stream;
        videos.push(video);
        newStream.addTrack(stream.getTracks().filter(function (t) {
          return t.kind === 'video';
        })[0]);
      }
      if (stream.getTracks().filter(function (t) {
        return t.kind === 'audio';
      }).length) {
        var audioSource = self.audioContext.createMediaStreamSource(stream);
        self.audioDestination = self.audioContext.createMediaStreamDestination();
        audioSource.connect(self.audioDestination);
        newStream.addTrack(self.audioDestination.stream.getTracks().filter(function (t) {
          return t.kind === 'audio';
        })[0]);
      }
      arrayOfMediaStreams.push(newStream);
    });
  };
  this.releaseStreams = function () {
    videos = [];
    isStopDrawingFrames = true;
    if (self.gainNode) {
      self.gainNode.disconnect();
      self.gainNode = null;
    }
    if (self.audioSources.length) {
      self.audioSources.forEach(function (source) {
        source.disconnect();
      });
      self.audioSources = [];
    }
    if (self.audioDestination) {
      self.audioDestination.disconnect();
      self.audioDestination = null;
    }
    if (self.audioContext) {
      self.audioContext.close();
    }
    self.audioContext = null;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (canvas.stream) {
      canvas.stream.stop();
      canvas.stream = null;
    }
  };
  this.resetVideoStreams = function (streams) {
    if (streams && !(streams instanceof Array)) {
      streams = [streams];
    }
    resetVideoStreams(streams);
  };
  function resetVideoStreams(streams) {
    videos = [];
    streams = streams || arrayOfMediaStreams;

    // via: @adrian-ber
    streams.forEach(function (stream) {
      if (!stream.getTracks().filter(function (t) {
        return t.kind === 'video';
      }).length) {
        return;
      }
      var video = getVideo(stream);
      video.stream = stream;
      videos.push(video);
    });
  }

  // for debugging
  this.name = 'MultiStreamsMixer';
  this.toString = function () {
    return this.name;
  };
  this.getMixedStream = getMixedStream;
}
if (typeof RecordRTC === 'undefined') {
  if (typeof module !== 'undefined' /* && !!module.exports*/) {
    module.exports = MultiStreamsMixer;
  }
  if (typeof define === 'function' && define.amd) {
    define('MultiStreamsMixer', [], function () {
      return MultiStreamsMixer;
    });
  }
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
