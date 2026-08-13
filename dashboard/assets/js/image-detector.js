let model = null;
let isModelLoading = false;
let isDetecting = false;

const CONFIDENCE_THRESHOLD = 0.50;

const imageUpload = document.getElementById("image-upload");
const image = document.getElementById("preview-image");
const canvas = document.getElementById("detection-canvas");
const results = document.getElementById("results");
const modelStatus = document.getElementById("model-status");

if (!imageUpload || !image || !canvas || !results) {
    throw new Error("Required elements not found.");
}

const ctx = canvas.getContext("2d");

function status(text) {
    if (modelStatus) {
        modelStatus.textContent = text;
    }

    console.log("[COCO-SSD]", text);
}

function clearResults() {
    results.innerHTML = "";
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function showError(text) {
    const div = document.createElement("div");

    div.className = "result-item error";
    div.textContent = text;

    results.appendChild(div);
}

async function loadModel() {

    if (isModelLoading || model) {
        return;
    }

    isModelLoading = true;

    status("Checking COCO-SSD...");

    console.log("COCO-SSD START");

    if (typeof cocoSsd === "undefined") {

        status("COCO-SSD Library Not Found ✕");

        showError(
            "COCO-SSD library is not loaded."
        );

        isModelLoading = false;

        return;
    }

    console.log("COCO-SSD library found.");

    status("Downloading AI Model...");

    const start = performance.now();

    try {

        const loadPromise = cocoSsd.load({
            base: "lite_mobilenet_v2"
        });

        const timeoutPromise = new Promise((_, reject) => {

            setTimeout(() => {

                reject(
                    new Error(
                        "MODEL_LOAD_TIMEOUT"
                    )
                );

            }, 60000);

        });

        model = await Promise.race([
            loadPromise,
            timeoutPromise
        ]);

        const seconds =
            ((performance.now() - start) / 1000)
            .toFixed(2);

        console.log(
            `COCO-SSD READY: ${seconds}s`
        );

        status(
            `AI Model Ready ✓ (${seconds}s)`
        );

        isModelLoading = false;

        if (
            image.complete &&
            image.naturalWidth > 0
        ) {
            detectObjects();
        }

    } catch (error) {

        console.error(
            "COCO-SSD ERROR:",
            error
        );

        model = null;
        isModelLoading = false;

        if (
            error.message ===
            "MODEL_LOAD_TIMEOUT"
        ) {

            status(
                "Model Loading Timeout ✕"
            );

            showError(
                "Model took more than 60 seconds to load."
            );

        } else {

            status(
                "AI Model Failed ✕"
            );

            showError(
                "Failed to load COCO-SSD."
            );
        }
    }
}

imageUpload.addEventListener(
    "change",
    event => {

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        if (
            !file.type.startsWith("image/")
        ) {

            showError(
                "Please select an image."
            );

            return;
        }

        clearCanvas();
        clearResults();

        const url =
            URL.createObjectURL(file);

        image.onload = () => {

            URL.revokeObjectURL(url);

            image.style.display = "block";

            if (model) {
                detectObjects();
            } else {
                status(
                    "Waiting for AI Model..."
                );
            }
        };

        image.onerror = () => {

            URL.revokeObjectURL(url);

            showError(
                "Image could not be loaded."
            );
        };

        image.src = url;
    }
);

async function detectObjects() {

    if (!model) {
        return;
    }

    if (
        !image.complete ||
        image.naturalWidth === 0
    ) {
        return;
    }

    if (isDetecting) {
        return;
    }

    isDetecting = true;

    try {

        status("Detecting Objects...");

        clearCanvas();
        clearResults();

        const width =
            image.clientWidth;

        const height =
            image.clientHeight;

        if (!width || !height) {
            throw new Error(
                "Invalid image size."
            );
        }

        canvas.width = width;
        canvas.height = height;

        canvas.style.width =
            `${width}px`;

        canvas.style.height =
            `${height}px`;

        const predictions =
            await model.detect(image);

        console.log(
            "Predictions:",
            predictions
        );

        const detections =
            predictions
                .filter(
                    prediction =>
                        prediction.score >=
                        CONFIDENCE_THRESHOLD
                )
                .sort(
                    (a, b) =>
                        b.score -
                        a.score
                );

        const scaleX =
            width /
            image.naturalWidth;

        const scaleY =
            height /
            image.naturalHeight;

        detections.forEach(
            (prediction, index) => {

                const [
                    x,
                    y,
                    w,
                    h
                ] = prediction.bbox;

                const bx =
                    x * scaleX;

                const by =
                    y * scaleY;

                const bw =
                    w * scaleX;

                const bh =
                    h * scaleY;

                const confidence =
                    Math.round(
                        prediction.score *
                        100
                    );

                ctx.strokeStyle =
                    "#2563eb";

                ctx.lineWidth = 3;

                ctx.strokeRect(
                    bx,
                    by,
                    bw,
                    bh
                );

                const label =
                    `${prediction.class} ${confidence}%`;

                ctx.font =
                    "bold 15px Arial";

                const textWidth =
                    ctx.measureText(
                        label
                    ).width;

                const labelWidth =
                    textWidth + 10;

                const labelHeight = 24;

                let labelX = bx;
                let labelY =
                    by - labelHeight;

                if (labelY < 0) {
                    labelY = by;
                }

                if (
                    labelX +
                    labelWidth >
                    canvas.width
                ) {
                    labelX =
                        canvas.width -
                        labelWidth;
                }

                ctx.fillStyle =
                    "#2563eb";

                ctx.fillRect(
                    labelX,
                    labelY,
                    labelWidth,
                    labelHeight
                );

                ctx.fillStyle =
                    "#ffffff";

                ctx.fillText(
                    label,
                    labelX + 5,
                    labelY + 17
                );

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "result-item";

                item.textContent =
                    `${index + 1}. ` +
                    `${prediction.class} — ` +
                    `${confidence}%`;

                results.appendChild(item);
            }
        );

        if (!detections.length) {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "result-item";

            item.textContent =
                "No objects detected.";

            results.appendChild(item);
        }

        status(
            `AI Model Ready ✓ — ${detections.length} detected`
        );

    } catch (error) {

        console.error(
            "Detection Error:",
            error
        );

        status(
            "Detection Failed ✕"
        );

        showError(
            "Detection failed."
        );

    } finally {

        isDetecting = false;
    }
}

loadModel();