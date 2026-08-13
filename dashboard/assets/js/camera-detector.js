let model = null;
let stream = null;
let running = false;


const video = document.getElementById("camera");
const canvas = document.getElementById("camera-canvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("start-camera");
const stopBtn = document.getElementById("stop-camera");

const results = document.getElementById("camera-results");

const modelStatus = document.getElementById("model-status");


async function loadModel(){

    try{

        if(modelStatus){

            modelStatus.innerHTML = "Loading AI Model...";

        }

        model = await cocoSsd.load({
            base:"lite_mobilenet_v2"
        });

        console.log("Model Loaded");

        if(modelStatus){

            modelStatus.innerHTML = "AI Model Ready ✓";

        }

    }catch(error){

        console.log(error);

        if(modelStatus){

            modelStatus.innerHTML = "AI Model Failed ✕";

        }
    }
}


loadModel();



async function startCamera(){

    if(!model){

        return;

    }


    stream = await navigator.mediaDevices.getUserMedia({

        video:{
            width:640,
            height:480
        }

    });


    video.srcObject = stream;


    video.addEventListener("loadeddata",()=>{

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        running = true;

        detect();

    });


}



function stopCamera(){

    running = false;


    if(stream){

        stream.getTracks().forEach(track=>{

            track.stop();

        });

    }


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    results.innerHTML="";

}



async function detect(){

    if(!running){

        return;

    }


    const predictions = await model.detect(video);


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    results.innerHTML="";


    predictions.forEach((prediction)=>{


        const [x,y,width,height] = prediction.bbox;


        ctx.strokeStyle="#2563eb";
        ctx.lineWidth=3;


        ctx.strokeRect(
            x,
            y,
            width,
            height
        );


        ctx.fillStyle="#2563eb";
        ctx.font="16px Arial";


        ctx.fillText(
            prediction.class+
            " "+
            Math.round(prediction.score*100)+
            "%",
            x,
            y>20 ? y-5 : 20
        );



        const item=document.createElement("div");


        item.className="camera-item";


        item.innerHTML=
        prediction.class+
        " "+
        Math.round(prediction.score*100)+
        "%";


        results.appendChild(item);


    });


    requestAnimationFrame(detect);

}



startBtn.addEventListener("click",()=>{

    startCamera();

});



stopBtn.addEventListener("click",()=>{

    stopCamera();

});