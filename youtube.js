
////////////////////////////////////
// SELECTORS
////////////////////////////////////
var SEL_PROGRESS_BAR = '.ytp-progress-bar';
var SEL_PROGRESS_BAR_ATT_VALUE = 'aria-valuenow';
var SEL_VIDEO_PLAY_BUTTON = '.ytp-play-button';
var SEL_BELOW_VIDEO = '#primary-inner #below';
var SEL_VIDEO_PLAYING_MODE = '.html5-video-player.playing-mode';
var SEL_TRANSCRIPT_TEXT = '.ytd-transcript-segment-renderer .segment-text';
var SEL_TRANSCRIPT_TIME = '.ytd-transcript-segment-renderer .segment-timestamp';
var SEL_TRANSCRIPT_SHOW_BUTTON = '.ytd-video-description-transcript-section-renderer button';
///////////////////////////////////////////////////

let startTimeInSecs=0, endTimeInSecs=0, transcripts = [], currentTranscript='';
waitForElement(SEL_BELOW_VIDEO).then(()=> {
        
        let elParent = document.querySelectorAll(SEL_BELOW_VIDEO)[0];
        elParent.parentElement.insertBefore(el, elParent);

        function updateTime(isPlaying) {

          const { minutes, seconds, timeInSeconds } = getCurrentVideoTimeInMinutesAndSeconds();
          
          document.querySelectorAll(`${isPlaying? '.start-time':'.end-time'} .minutes`)[0].innerText = minutes;
          document.querySelectorAll(`${isPlaying? '.start-time':'.end-time'} .seconds`)[0].innerText = seconds;
          
          startTimeInSecs = isPlaying? timeInSeconds:startTimeInSecs;
          endTimeInSecs = isPlaying? endTimeInSecs:timeInSeconds;
          
          setOnVQuoteButtonClick(startTimeInSecs, endTimeInSecs);
          tryUpdateTranscriptInTimeRange(startTimeInSecs, endTimeInSecs);
        }
        
        let intrv = setInterval(() => (updateTime(false)), 800);
        document.addEventListener('unload', () => (clearInterval(intrv)));

        document.querySelectorAll(SEL_VIDEO_PLAY_BUTTON)[0].addEventListener('click', (event) => {

            setTimeout(() => {
                let isPlaying = document.querySelectorAll(SEL_VIDEO_PLAYING_MODE).length > 0;
                updateTime(isPlaying);        
            }, 50);

            
        }); 

});


function getTranscript() {

    return new Promise((res, rej) => {

        try {
            waitForElement(SEL_TRANSCRIPT_SHOW_BUTTON).then(() => {
                document.querySelectorAll(SEL_TRANSCRIPT_SHOW_BUTTON)[0].click();
            }); //waitfor SEL_TRANSCRIPT_SHOW_BUTTON

            waitForElement(SEL_TRANSCRIPT_TIME).then(()=>{

                var timeSegments = document.querySelectorAll(SEL_TRANSCRIPT_TIME);
                var textSegments = document.querySelectorAll(SEL_TRANSCRIPT_TEXT);

                var transacripts = [];
                for(let i=0; i< textSegments.length; i++) {

                    transacripts.push({
                        time: mapTimeToSecs(timeSegments[i].innerText),
                        text: textSegments[i].innerText
                    });

                }
                res(transacripts);
            }); //waitfor SEL_TRANSCRIPT_TIME
        } catch(e){rej(e);} //try
    
    }); //promise
}
getTranscript().then((_transcripts) => (transcripts = _transcripts));

function tryUpdateTranscriptInTimeRange(start, end) {

    try {
        const valid = (t) => (start <= t && t<=end);
        currentTranscript = transcripts.filter(t => ( valid(t.time) )).map(t => (t.text)).join(' ');
        document.querySelectorAll('.video-quotes-transcript')[0].innerText = currentTranscript;
    } catch(e) {}
}


function setOnVQuoteButtonClick(startTimeInSecs, endTimeInSecs) {
    const videoId = window.location.href.match(`.*\?.*v=([^&]*)`)[1];
     const BASE_URL = 'https://vquote.github.io';
     const url = `${BASE_URL}/#/video?v=${videoId}&start=${startTimeInSecs}&end=${endTimeInSecs}&quote=${encodeURIComponent(currentTranscript)}`;
    
     document.querySelectorAll('.open-in-video-quotes')[0].onclick = () => {
        window.open(url, 'vquote-'+new Date().getTime(), '_blank');
     };
};




////////////////////////////////////
// HTML Elements
////////////////////////////////////

var el = document.createElement('div');
el.innerHTML = ` <div style='width:100%;justify-content: center; display: flex;'>
<div class="start-time" style="background-color: #3e4d3c; ${styleTimeInterval()}">
  <span class="minutes" style="${styleMinutesOrSeconds()}">00</span>
  <span class="separator">:</span>
  <span class="seconds" style="${styleMinutesOrSeconds()}">00</span>
</div>

<div class="end-time" style="background-color: #583535; ${styleTimeInterval()}">
  <span class="minutes" style="${styleMinutesOrSeconds()}">00</span>
  <span class="separator">:</span>
  <span class="seconds" style="${styleMinutesOrSeconds()}">00</span>
</div>

<button style="${styleButton()}" class="open-in-video-quotes">
    VQuotes <span style="font-size:2rem" class="material-symbols-outlined">open_in_new</span>
</button>

</div>

<div class="video-quotes-transcript" style="background-color: #583535; ${styleTextArea()}">
</div>


<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
`;

////////////////////////////////////
// Util & Helpers
////////////////////////////////////

function getCurrentVideoTimeInMinutesAndSeconds() {
    let timeInSeconds = parseInt(document.querySelectorAll(SEL_PROGRESS_BAR)[0].getAttribute(SEL_PROGRESS_BAR_ATT_VALUE) );
    let minutes = `${parseInt(timeInSeconds/60)}`;
    minutes = minutes.length <2? `0${minutes}`:minutes;          
    let seconds = `${parseInt(timeInSeconds%60)}`;
    seconds = seconds.length <2? `0${seconds}`:seconds;
    return { minutes, seconds, timeInSeconds };
}


function mapTimeToSecs(time) {
    let nums = time.split(':')
                .filter(v=> (v.match(/[0-9]+/)))
                .filter( (_, idx) => (idx < 3))
                .map(v => (parseInt(v)) )
                .reverse();
    let w = [1, 60, 60 * 60], totalSecs = 0;
    for( let i=0; i<nums.length; i++) {
        totalSecs += w[i] * nums[i];
    }
    return totalSecs;
}

function waitForElement(elSelector, currentDocument=window.document) {

    return new Promise((resolve, reject) => {

        let retryCounter = 20;
        function check() {
            
            let el = currentDocument.querySelectorAll(elSelector);
            let exists = el.length > 0;
            let retry = retryCounter > 0 && (!exists);
            if (exists) {
                resolve();
            } else if (retry) {
                setTimeout(check, 500); //10000
                retryCounter--;
            } else {
                reject();
            }
        }

        check();

    });
}

///////////////////////////////////////////////////////
// Style:
//////////////////////////////////////////////////////
function styleTimeInterval() {
    return (`
font-size: 36px;
  font-weight: bold;
  display: inline-block;
  margin: 20px;
  padding: 1.5rem;
  border-radius: 10px;
  color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 5;
  `.split('\n').join(' '))
}

function styleTextArea() {
    return (`
        font-size: 24px;
        width: 80%;
      font-weight: bold;
      display: block;
      margin: 20px;
      padding: 1.5rem;
      border-radius: 10px;
      color: #fff;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 5;
      max-height: 200px;
      overflow-y: scroll;
      `.split('\n').join(' '))
}
  
function styleMinutesOrSeconds() {
    return (`
  display: inline-block;
  width: 36px;
  text-align: center;`.split('\n').join(' '))
}
  
function styleButton() {
    return (`
  font-size: 3rem;
  font-weight: bold;
  padding: 15px 15px;
  border: none;
  border-radius: 5px;
  background-color: #4CAF50;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  margin: 20px;
  position: relative;
  z-index: 5;
  height: 100%;`.split('\n').join(' '))
}
 //////////////////////////////////////////////////////