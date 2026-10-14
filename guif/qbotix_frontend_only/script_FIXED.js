let idmoFullscreenSource = null;
let idmoFullscreenStream = null;
let idmoFullscreenLastFrames = null;
let idmoFullscreenLastTime = null;
let idmoFullscreenFpsTimer = null;


function openIdmoCameraFullscreen(
    sourceId,
    cameraName
) {

    const overlay =
        document.getElementById(
            "idmoCameraFullscreen"
        );

    const source =
        document.getElementById(
            sourceId
        );

    const target =
        document.getElementById(
            "idmoFullscreenVideo"
        );

    const name =
        document.getElementById(
            "idmoFullscreenCameraName"
        );

    const status =
        document.getElementById(
            "idmoFullscreenCameraStatus"
        );

    const performance =
        document.getElementById(
            "idmoFullscreenPerformance"
        );


    if (!overlay || !source || !target) {
        return;
    }


    idmoFullscreenSource = source;


    overlay.classList.add(
        "active"
    );


    name.textContent =
        cameraName;


    status.textContent =
        "● LIVE";


    performance.innerHTML =
        "LATENCY: -- ms&nbsp;&nbsp; FPS: --";


    if (source.srcObject) {

        idmoFullscreenStream =
            source.srcObject;

        target.srcObject =
            source.srcObject;

        target.play().catch(
            () => {}
        );

    }


    startIdmoCameraPerformance();

}


function startIdmoCameraPerformance() {

    stopIdmoCameraPerformance();

    idmoFullscreenLastFrames = null;
    idmoFullscreenLastTime = performance.now();


    idmoFullscreenFpsTimer =
        setInterval(
            async function() {

                const source =
                    idmoFullscreenSource;

                const video =
                    document.getElementById(
                        "idmoFullscreenVideo"
                    );

                const output =
                    document.getElementById(
                        "idmoFullscreenPerformance"
                    );


                if (!source || !video || !output) {
                    return;
                }


                let fps = null;


                /*
                 * Count decoded frames where the browser
                 * exposes getVideoPlaybackQuality().
                 */

                if (
                    typeof video
                        .getVideoPlaybackQuality ===
                    "function"
                ) {

                    const quality =
                        video.getVideoPlaybackQuality();

                    const frames =
                        quality.totalVideoFrames;


                    const now =
                        performance.now();


                    if (
                        idmoFullscreenLastFrames !==
                        null
                    ) {

                        const dt =
                            (now -
                                idmoFullscreenLastTime) /
                            1000;


                        if (dt > 0) {

                            fps =
                                (
                                    frames -
                                    idmoFullscreenLastFrames
                                ) / dt;

                        }

                    }


                    idmoFullscreenLastFrames =
                        frames;

                    idmoFullscreenLastTime =
                        now;

                }


                /*
                 * If the source video exposes an
                 * estimated FPS, use it as fallback.
                 */

                if (
                    fps === null &&
                    source.readyState >= 2
                ) {

                    fps =
                        0;

                }


                /*
                 * Latency:
                 * use the stream's WebRTC receiver stats
                 * when the source is connected through WebRTC.
                 */

                let latency = "--";


                try {

                    if (
                        source.srcObject &&
                        source.srcObject
                            .getTracks
                    ) {

                        /*
                         * The actual RTCP connection is owned
                         * by the existing camera code. We don't
                         * create a second connection here.
                         *
                         * Therefore latency remains "--" when
                         * no exposed receiver statistic exists.
                         */

                    }

                }
                catch (error) {}


                output.innerHTML =
                    `LATENCY: ${latency} ms&nbsp;&nbsp; FPS: ${
                        fps !== null
                            ? fps.toFixed(1)
                            : "--"
                    }`;

            },
            1000
        );

}


function stopIdmoCameraPerformance() {

    if (
        idmoFullscreenFpsTimer
    ) {

        clearInterval(
            idmoFullscreenFpsTimer
        );

        idmoFullscreenFpsTimer =
            null;

    }

}


function closeIdmoCameraFullscreen(event) {

    if (event) {

        event.preventDefault();
        event.stopPropagation();

    }


    const overlay =
        document.getElementById(
            "idmoCameraFullscreen"
        );

    const target =
        document.getElementById(
            "idmoFullscreenVideo"
        );


    stopIdmoCameraPerformance();


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

    }


    if (target) {

        target.pause();

        target.srcObject =
            null;

    }


    idmoFullscreenSource =
        null;

    idmoFullscreenStream =
        null;

}


document.addEventListener(
    "keydown",
    function(event) {

        const overlay =
            document.getElementById(
                "idmoCameraFullscreen"
            );


        if (
            overlay &&
            overlay.classList.contains(
                "active"
            ) &&
            event.key === "Escape"
        ) {

            closeIdmoCameraFullscreen();

        }

    }
);



;



        let radoReconFullscreenSource = null;
        let radoReconFullscreenTimer = null;
        let radoReconLastFrames = null;
        let radoReconLastTime = 0;


        function openRadoReconFullscreen(
            videoId,
            cameraName
        ) {

            const source =
                document.getElementById(videoId);

            const overlay =
                document.getElementById(
                    "radoReconCameraFullscreen"
                );

            const target =
                document.getElementById(
                    "radoReconFullscreenVideo"
                );

            const name =
                document.getElementById(
                    "radoReconFullscreenName"
                );

            const status =
                document.getElementById(
                    "radoReconFullscreenStatus"
                );

            const metrics =
                document.getElementById(
                    "radoReconFullscreenMetrics"
                );


            if (!source || !overlay || !target) {
                return;
            }


            radoReconFullscreenSource =
                source;


            overlay.classList.add("active");


            if (name) {
                name.textContent =
                    cameraName;
            }


            if (status) {
                status.textContent =
                    "LIVE";
            }


            if (source.srcObject) {

                target.srcObject =
                    source.srcObject;

                target.play().catch(
                    () => {}
                );

            }


            if (metrics) {
                metrics.innerHTML =
                    "LATENCY: -- ms&nbsp;&nbsp; FPS: --";
            }


            startRadoReconMetrics();

        }


        function startRadoReconMetrics() {

            stopRadoReconMetrics();

            radoReconLastFrames = null;
            radoReconLastTime =
                performance.now();


            radoReconFullscreenTimer =
                setInterval(
                    function() {

                        const source =
                            radoReconFullscreenSource;

                        const target =
                            document.getElementById(
                                "radoReconFullscreenVideo"
                            );

                        const metrics =
                            document.getElementById(
                                "radoReconFullscreenMetrics"
                            );


                        if (!source || !target || !metrics) {
                            return;
                        }


                        let fps = "--";


                        if (
                            typeof target
                                .getVideoPlaybackQuality ===
                            "function"
                        ) {

                            const quality =
                                target.getVideoPlaybackQuality();

                            const frames =
                                quality.totalVideoFrames;

                            const now =
                                performance.now();


                            if (
                                radoReconLastFrames !==
                                null
                            ) {

                                const dt =
                                    (now -
                                        radoReconLastTime) /
                                    1000;


                                if (dt > 0) {

                                    fps = (
                                        (frames -
                                            radoReconLastFrames) /
                                        dt
                                    ).toFixed(1);

                                }

                            }


                            radoReconLastFrames =
                                frames;

                            radoReconLastTime =
                                now;

                        }


                        /*
                         * Latency is shown as -- when the
                         * existing stream does not expose a
                         * measurable WebRTC receiver statistic.
                         * No new connection is created.
                         */

                        metrics.innerHTML =
                            `LATENCY: -- ms&nbsp;&nbsp; FPS: ${fps}`;

                    },
                    1000
                );

        }


        function stopRadoReconMetrics() {

            if (
                radoReconFullscreenTimer
            ) {

                clearInterval(
                    radoReconFullscreenTimer
                );

                radoReconFullscreenTimer =
                    null;

            }

        }


        function closeRadoReconFullscreen(event) {

            if (event) {

                event.preventDefault();
                event.stopPropagation();

            }


            const overlay =
                document.getElementById(
                    "radoReconCameraFullscreen"
                );

            const target =
                document.getElementById(
                    "radoReconFullscreenVideo"
                );


            stopRadoReconMetrics();


            if (overlay) {
                overlay.classList.remove("active");
            }


            if (target) {

                target.pause();

                target.srcObject =
                    null;

            }


            radoReconFullscreenSource =
                null;

        }


        document.addEventListener(
            "keydown",
            function(event) {

                const overlay =
                    document.getElementById(
                        "radoReconCameraFullscreen"
                    );


                if (
                    overlay &&
                    overlay.classList.contains("active") &&
                    event.key === "Escape"
                ) {

                    closeRadoReconFullscreen();

                }

            }
        );

        

;


function switchRadoModeRadoOnly(mode) {

    const reconTab = document.getElementById("radoReconTab");
    const deliveryTab = document.getElementById("radoDeliveryTab");
    const reconView = document.getElementById("radoReconView");
    const autonomousView = document.getElementById("radoAutonomousView");

    const isAutonomous = (mode === "delivery");

    if (reconTab) {
        reconTab.classList.toggle("active", !isAutonomous);
    }

    if (deliveryTab) {
        deliveryTab.classList.toggle("active", isAutonomous);
    }

    if (reconView) {
        reconView.style.display = isAutonomous ? "none" : "block";
    }

    if (autonomousView) {
        autonomousView.style.display = isAutonomous ? "block" : "none";
        autonomousView.style.visibility = isAutonomous ? "visible" : "hidden";
        autonomousView.style.opacity = isAutonomous ? "1" : "0";
        autonomousView.style.pointerEvents = isAutonomous ? "auto" : "none";
    }

    if (typeof radoCommand === "function") {
        radoCommand(
            isAutonomous
                ? "AUTONOMOUS DELIVERY"
                : "RECONNAISSANCE MODE"
        );
    }
}


;



/* =========================================================
   BACKEND CONNECTION
   ========================================================= */

const BACKEND_BASE_URL = "http://127.0.0.1:5000";

function backendUrl(path) {
    return `${BACKEND_BASE_URL}${path}`;
}


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let socket = null;

let currentWorkspace = "gcs";

let fullscreenCameraIndex = 0;

let fullscreenPeer = null;

const gridPeers = {};

let streamingActive = false;
let streamStartTime = null;
let streamTimerInterval = null;


/* Panorama capture state — FRONT LEFT / ARDUCAM_1 only. */
let panoramaCaptureCount = 0;
let panoramaBusy = false;


const cameraPerformance = {};

function getCameraPerformanceState(index) {

    if (!cameraPerformance[index]) {

        cameraPerformance[index] = {
            lastFrames: null,
            lastTime: null,
            fps: null,
            latency: null,
            timer: null
        };

    }

    return cameraPerformance[index];

}


function renderCameraPerformance(index) {

    const state =
        getCameraPerformanceState(index);

    const latency =
        state.latency !== null
            ? Math.round(state.latency)
            : "--";

    const fps =
        state.fps !== null
            ? state.fps.toFixed(1)
            : "--";

    const text =
        `LATENCY: ${latency} ms&nbsp;&nbsp; FPS: ${fps}`;


    const small =
        el(`cameraPerformance${index + 1}`);

    if (small) {
        small.innerHTML = text;
    }


    const fullscreen =
        el("fullscreenCameraPerformance");

    if (
        fullscreen &&
        fullscreenCameraIndex === index
    ) {

        fullscreen.innerHTML = text;

    }

}


async function updateCameraPerformance(index, pc) {

    if (!pc) {
        return;
    }

    const state =
        getCameraPerformanceState(index);

    try {

        const stats =
            await pc.getStats();

        let frames = null;
        let roundTripTime = null;

        stats.forEach(report => {

            if (
                report.type === "inbound-rtp" &&
                (
                    report.kind === "video" ||
                    report.mediaType === "video"
                )
            ) {

                if (
                    typeof report.framesReceived ===
                    "number"
                ) {
                    frames = report.framesReceived;
                }

            }

            if (
                report.type === "candidate-pair" &&
                report.state === "succeeded" &&
                report.nominated === true &&
                typeof report.currentRoundTripTime ===
                "number"
            ) {

                roundTripTime =
                    report.currentRoundTripTime;

            }

        });


        const now = performance.now();


        if (
            frames !== null &&
            state.lastFrames !== null &&
            state.lastTime !== null
        ) {

            const elapsed =
                (now - state.lastTime) / 1000;

            if (elapsed > 0) {

                state.fps =
                    Math.max(
                        0,
                        (frames - state.lastFrames) /
                        elapsed
                    );

            }

        }


        if (frames !== null) {

            state.lastFrames = frames;
            state.lastTime = now;

        }


        if (roundTripTime !== null) {

            /*
             * currentRoundTripTime is RTT.
             * Display RTT/2 as an estimated one-way latency.
             */
            state.latency =
                roundTripTime * 500;

        }


        renderCameraPerformance(index);

    }

    catch (error) {
        // WebRTC stats can be unavailable while connecting.
    }

}


function startCameraPerformance(index, pc) {

    const state =
        getCameraPerformanceState(index);

    if (state.timer) {
        clearInterval(state.timer);
    }

    state.lastFrames = null;
    state.lastTime = null;
    state.fps = null;
    state.latency = null;

    renderCameraPerformance(index);

    state.timer =
        setInterval(
            () => {
                updateCameraPerformance(
                    index,
                    pc
                );
            },
            1000
        );

}


function stopCameraPerformance(index) {

    const state =
        getCameraPerformanceState(index);

    if (state.timer) {

        clearInterval(state.timer);
        state.timer = null;

    }

}




/* =========================================================
   STREAMING CONTROL
========================================================= */

function formatStreamTime(totalSeconds) {

    const hours =
        Math.floor(totalSeconds / 3600);

    const minutes =
        Math.floor((totalSeconds % 3600) / 60);

    const seconds =
        totalSeconds % 60;

    return [
        hours,
        minutes,
        seconds
    ]
        .map(value => String(value).padStart(2, "0"))
        .join(":");

}


function updateStreamTimer() {

    const timer =
        el("streamTimer");

    if (!timer) {
        return;
    }

    if (!streamingActive || streamStartTime === null) {

        timer.textContent =
            "00:00:00";

        return;

    }

    const elapsed =
        Math.floor(
            (Date.now() - streamStartTime) / 1000
        );

    timer.textContent =
        formatStreamTime(elapsed);

}


function startStreamTimer() {

    streamStartTime =
        Date.now();

    updateStreamTimer();

    if (streamTimerInterval) {

        clearInterval(
            streamTimerInterval
        );

    }

    streamTimerInterval =
        setInterval(
            updateStreamTimer,
            1000
        );

}


function stopStreamTimer() {

    if (streamTimerInterval) {

        clearInterval(
            streamTimerInterval
        );

        streamTimerInterval =
            null;

    }

    streamStartTime =
        null;

    updateStreamTimer();

}


function updateStreamingUI() {

    const button =
        el("streamToggle");

    const text =
        el("streamToggleText");

    const dot =
        el("streamToggleDot");

    if (!button || !text || !dot) {
        return;
    }

    if (streamingActive) {

        button.classList.add("active");

        text.textContent =
            "STOP STREAMING";

        dot.style.background =
            "var(--green)";

    }

    else {

        button.classList.remove("active");

        text.textContent =
            "START STREAMING";

        dot.style.background =
            "var(--red)";

    }

}


function stopGridCamera(slot) {

    const pc =
        gridPeers[slot];

    if (pc) {

        try {
            pc.close();
        }
        catch (error) {}

        delete gridPeers[slot];

    }

    stopCameraPerformance(slot);

    const video =
        el(`cameraVideo${slot + 1}`);

    const placeholder =
        el(`placeholder${slot + 1}`);

    const status =
        el(`cameraStatus${slot + 1}`);

    if (video) {

        video.pause();

        video.srcObject =
            null;

    }

    if (placeholder) {

        placeholder.style.display =
            "flex";

    }

    if (status) {

        status.textContent =
            "WAITING";

    }

}


async function startStreaming() {

    if (streamingActive) {
        return;
    }

    streamingActive = true;

    updateStreamingUI();
    startStreamTimer();

    addLog("Camera streaming started");

    /* ========================================================
       GCS
       ======================================================== */

    for (let i = 0; i < cameras.length; i++) {

        // IMPORTANT: i is ONLY the GUI slot.
        // The physical camera is selected by cameras[i].camera.
        if (cameras[i].camera) {

            connectGridCamera(i);

        } else {

            const status =
                el(`cameraStatus${i + 1}`);

            const placeholder =
                el(`placeholder${i + 1}`);

            if (status) {
                status.textContent =
                    "NOT CONFIGURED";
            }

            if (placeholder) {
                placeholder.style.display =
                    "flex";

                placeholder.textContent =
                    "CAMERA NOT CONFIGURED";
            }
        }
    }


    /* ========================================================
       ABEX
       ONLY THE MICROSCOPE CAMERA IS USED.
       ======================================================== */

    connectWorkspaceCamera(
        "abexDrillVideo",
        null,
        "abex",
        "abexDrillPerformance"
    );

    connectWorkspaceCamera(
        "abexTestVideo",
        null,
        "abex",
        "abexTestPerformance"
    );

    connectWorkspaceCamera(
        "abexMicroscopeVideo",
        "MICROSCOPE",
        "abex",
        "abexMicroscopePerformance"
    );


    /* ========================================================
       RADO
       SAME THREE ROVER CAMERAS AS GCS.
       ======================================================== */

    connectWorkspaceCamera(
        "radoFrontLeftCamera",
        "ARDUCAM_1",
        "rado"
    );

    connectWorkspaceCamera(
        "radoFrontRightCamera",
        "WEBCAM",
        "rado"
    );

    connectWorkspaceCamera(
        "radoRearCamera",
        "ARDUCAM_2",
        "rado"
    );

    connectWorkspaceCamera(
        "radoArmCamera",
        null,
        "rado"
    );
}

function stopStreaming() {

    if (!streamingActive) {
        return;
    }

    streamingActive = false;

    for (let i = 0; i < cameras.length; i++) {
        stopGridCamera(i);
    }

    stopWorkspaceCamera("abexDrillVideo");
    stopWorkspaceCamera("abexTestVideo");
    stopWorkspaceCamera("abexMicroscopeVideo");

    stopWorkspaceCamera("radoFrontLeftCamera");
    stopWorkspaceCamera("radoFrontRightCamera");
    stopWorkspaceCamera("radoRearCamera");
    stopWorkspaceCamera("radoArmCamera");

    stopPhysicalCameraConnections();

    for (let i = 0; i < 4; i++) {
        stopAbexPerformance(
            i === 0
                ? "abexDrillVideo"
                : i === 1
                    ? "abexTestVideo"
                    : "abexMicroscopeVideo"
        );
    }

    updateStreamingUI();
    stopStreamTimer();

    addLog(
        "Camera streaming stopped"
    );
}


function toggleStreaming() {

    console.log("[STREAM] toggleStreaming() called");

    if (streamingActive) {

        stopStreaming();
        return;

    }

    startStreaming().catch(error => {

        console.error("[STREAM] startStreaming failed:", error);

        streamingActive = false;
        updateStreamingUI();
        stopStreamTimer();

    });

}


/* =========================================================
   CAMERA CONFIGURATION
   ========================================================= */

const cameras = [

    // GCS SLOT 0 = FRONT CAM
    {
        name: "FRONT CAM",
        label: "FRONT CAM",
        camera: "ARDUCAM_1"
    },

    // GCS SLOT 1 = REAR CAM
    {
        name: "REAR CAM",
        label: "REAR CAM",
        camera: "WEBCAM"
    },

    // GCS SLOT 2 = ARM CAM
    {
        name: "ARM CAM",
        label: "ARM CAM",
        camera: null
    },

    // GCS SLOT 3 = ANTENNA CAM
    {
        name: "ANTENNA CAM",
        label: "ANTENNA CAM",
        camera: "ARDUCAM_2"
    }

];


/* =========================================================
   ELEMENT HELPER
   ========================================================= */

function el(id) {

    return document.getElementById(id);

}


/* Top clock removed — connection status only. */
/* =========================================================
   LOG
   ========================================================= */

function addLog(message) {

    const log = el("systemLog");

    if (!log) {

        console.log(message);

        return;

    }


    const row =
        document.createElement("div");


    row.textContent =
        `[${new Date().toLocaleTimeString()}] ${message}`;


    log.appendChild(row);


    while (log.children.length > 100) {

        log.removeChild(
            log.firstChild
        );

    }


    log.scrollTop =
        log.scrollHeight;

}


/* =========================================================
   DASHBOARD NAVIGATION
   ========================================================= */

function showWorkspace(name, button) {

    const dashboards = [
        "gcs",
        "abex",
        "rado",
        "idmo",
        "autonomous"
    ];


    dashboards.forEach(
        dashboard => {

            const workspace =
                el(
                    dashboard +
                    "Workspace"
                );


            if (workspace) {

                workspace.classList.remove(
                    "active"
                );

            }

        }
    );


    const selected =
        el(
            name +
            "Workspace"
        );


    if (selected) {

        selected.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(".nav-button")
        .forEach(
            nav => {

                nav.classList.remove(
                    "active"
                );

            }
        );


    if (button) {

        button.classList.add(
            "active"
        );

    }


    currentWorkspace =
        name;


    if (socket) {

        socket.emit(
            "dashboard_select",
            {
                dashboard: name
            }
        );

    }


    addLog(
        `${name.toUpperCase()} dashboard opened`
    );

    updatePanoramaDockVisibility();
    syncPanoramaDockVisibility();

}


/* =========================================================
   PANORAMA
   ========================================================= */

function updatePanoramaDockVisibility() {

    const gcsDock = el("gcsPanoramaDock");
    const abexDock = el("abexPanoramaDock");

    if (gcsDock) {
        gcsDock.classList.toggle(
            "panorama-active",
            currentWorkspace === "gcs"
        );
    }

    if (abexDock) {
        abexDock.classList.toggle(
            "panorama-active",
            currentWorkspace === "abex"
        );
    }

}


function updatePanoramaUI(status, count) {

    ["gcs", "abex"].forEach(prefix => {

        const statusEl = el(`${prefix}PanoramaStatus`);
        const countEl = el(`${prefix}PanoramaCount`);

        if (statusEl) {
            statusEl.textContent = status;
        }

        if (countEl) {
            countEl.textContent = `${count} / 3`;
        }

    });

}


async function capturePanorama(event) {

    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (panoramaBusy) {
        return;
    }

    panoramaBusy = true;
    updatePanoramaUI("CAPTURING", panoramaCaptureCount);

    try {
        const response = await fetch(
            backendUrl("/api/panorama"),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ camera: "ARDUCAM_1" })
            }
        );

        let data = {};
        try {
            data = await response.json();
        } catch (_) {
            data = {};
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.error || `Panorama server error (HTTP ${response.status})`
            );
        }

        panoramaCaptureCount = Number(data.count || 0);
        updatePanoramaUI(
            data.stitching ? "STITCHING" : "CAPTURED",
            panoramaCaptureCount
        );

        addLog(
            `PANORAMA → FRONT LEFT shot ${panoramaCaptureCount}/3`
        );

        if (data.stitching && data.panorama_url) {
            const imageUrl =
                `${backendUrl(data.panorama_url)}?t=${Date.now()}`;

            const image = el("panoramaResultImage");
            if (image) {
                image.src = imageUrl;
            }

            const overlay = el("panoramaResultOverlay");
            if (overlay) {
                overlay.classList.add("open");
            }

            const title = el("panoramaResultTitle");
            if (title) {
                title.textContent = data.fallback
                ? "PANORAMA READY — COMBINED"
                : "PANORAMA READY";
            }

            panoramaCaptureCount = 0;
            updatePanoramaUI("READY", 0);
            addLog(data.fallback
                ? "PANORAMA → 3 images combined (stitch fallback)"
                : "PANORAMA → 3 images stitched successfully");
        }

    } catch (error) {
        console.error("Panorama capture error:", error);
        if (panoramaCaptureCount < 3) {
            panoramaCaptureCount = 0;
        } else {
            panoramaCaptureCount = 3;
        }
        updatePanoramaUI("ERROR", panoramaCaptureCount);
        addLog(`PANORAMA ERROR → ${error.message}`);

    } finally {
        panoramaBusy = false;
    }
}

function closePanoramaResult(event) {

    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const overlay = el("panoramaResultOverlay");

    if (overlay) {
        overlay.classList.remove("open");
    }

}


/* =========================================================
   AUTONOMOUS DASHBOARD
   ========================================================= */

function autonomousCommand(command) {

    sendCommand(
        command,
        "autonomous"
    );

}


/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {

    document.body.classList.toggle(
        "light"
    );

}


/* =========================================================
   SOCKET
   ========================================================= */

function initialiseSocket() {

    if (
        typeof io === "undefined"
    ) {

        addLog(
            "Socket.IO client unavailable"
        );

        return;

    }


    socket = io(BACKEND_BASE_URL, {
        transports: ["websocket", "polling"]
    });


    socket.on(
        "connect",
        () => {

            setConnection(true);

            addLog(
                "GCS backend connected"
            );

            socket.emit(
                "request_telemetry"
            );

        }
    );


    socket.on(
        "disconnect",
        () => {

            setConnection(false);

            addLog(
                "GCS backend disconnected"
            );

        }
    );


    socket.on(
        "log",
        data => {

            if (
                data &&
                data.message
            ) {

                addLog(
                    data.message
                );

            }

        }
    );


    socket.on(
        "telemetry",
        data => {

            updateTelemetry(data);

        }
    );


    socket.on(
        "abex_status",
        data => {

            updateAbexSensors(data);

        }
    );


    socket.on(
        "rado_status",
        data => {

            updateRadoData(data);

        }
    );


    socket.on(
        "idmo_status",
        data => {

            updateIdmoData(data);

        }
    );

}


/* =========================================================
   CONNECTION STATUS
   ========================================================= */

function setConnection(connected) {

    const dot =
        el("connectionDot");

    const text =
        el("connectionText");

    const socketStatus =
        el("socketStatus");


    if (connected) {

        dot.classList.remove(
            "offline"
        );

        text.textContent =
            "CONNECTED";

        socketStatus.textContent =
            "CONNECTED";

    }

    else {

        dot.classList.add(
            "offline"
        );

        text.textContent =
            "OFFLINE";

        socketStatus.textContent =
            "OFFLINE";

    }

}


/* =========================================================
   DASHBOARD DATA
   ========================================================= */

async function loadDashboardData() {

    try {

        const response =
            await fetch(
                backendUrl("/api/dashboard")
            );


        if (!response.ok) {

            throw new Error(
                `Dashboard API ${response.status}`
            );

        }


        const responseData =
            await response.json();

        const data =
            responseData && responseData.data
                ? responseData.data
                : responseData;

        updateTelemetry(data);

    }

    catch (error) {

        console.warn(
            error.message
        );

    }

}


/* =========================================================
   TELEMETRY
   ========================================================= */

function updateTelemetry(data) {

    if (!data) {
        return;
    }


    const gcs =
        data.gcs || data;


    if (
        gcs.battery !== undefined
    ) {

        el("telemetryBattery")
            .textContent =
            `${gcs.battery}%`;

    }


    if (
        gcs.voltage !== undefined
    ) {

        el("voltage")
            .textContent =
            `${gcs.voltage} V`;

    }


    if (
        gcs.gps !== undefined
    ) {

        el("gps")
            .textContent =
            gcs.gps;

    }


    updateComputeConnectivity(gcs);


    if (data.abex) {

        updateAbexSensors(
            data.abex
        );

    }


    if (data.rado) {

        updateRadoData(
            data.rado
        );

    }


    if (data.idmo) {

        updateIdmoData(
            data.idmo
        );

    }

}



/* =========================================================
   COMPUTE CONNECTIVITY
   ========================================================= */

function updateComputeConnectivity(data) {

    if (!data) {
        return;
    }

    setComputeStatus(
        "jetsonStatus",
        getConnectivityValue(
            data,
            ["jetson", "jetson_status", "jetson_connected"]
        )
    );

    setComputeStatus(
        "raspberryPiStatus",
        getConnectivityValue(
            data,
            [
                "raspberry_pi",
                "raspberryPi",
                "raspberry_pi_status",
                "raspberryPiStatus",
                "raspberry_pi_connected"
            ]
        )
    );

    setComputeStatus(
        "microcontrollerStatus",
        getConnectivityValue(
            data,
            [
                "microcontroller",
                "micro_controller",
                "mcu",
                "microcontroller_status",
                "microcontroller_connected"
            ]
        )
    );

}


function getConnectivityValue(data, keys) {

    for (const key of keys) {

        if (
            data[key] !== undefined &&
            data[key] !== null
        ) {

            const value = data[key];

            if (typeof value === "boolean") {
                return value ? "ONLINE" : "OFFLINE";
            }

            if (typeof value === "object") {

                if (value.connected !== undefined) {
                    return value.connected
                        ? "ONLINE"
                        : "OFFLINE";
                }

                if (value.status !== undefined) {
                    return String(value.status).toUpperCase();
                }

            }

            return String(value).toUpperCase();

        }

    }

    return "--";

}


function setComputeStatus(id, value) {

    const element = el(id);

    if (!element) {
        return;
    }

    const text = element.querySelector("b");

    if (text) {
        text.textContent = value;
    }

    element.classList.remove(
        "online",
        "offline"
    );

    if (value === "ONLINE") {
        element.classList.add("online");
    }

    else if (value === "OFFLINE") {
        element.classList.add("offline");
    }

}


/* =========================================================
   ABEX DATA
   ========================================================= */



/* =========================================================
   ABEX CAMERA FULLSCREEN
   ========================================================= */


const abexPerformance = {};


function getAbexPerformanceState(
    videoId
) {

    if (!abexPerformance[videoId]) {

        abexPerformance[videoId] = {

            fps: null,

            latency: null,

            frameCount: 0,

            lastFrameCount: 0,

            lastTime: null,

            timer: null,

            frameRequest: null

        };

    }

    return abexPerformance[videoId];

}


function renderAbexPerformance(
    videoId
) {

    const state =
        getAbexPerformanceState(
            videoId
        );


    const latency =
        state.latency !== null
            ? Math.round(state.latency)
            : "--";


    const fps =
        state.fps !== null
            ? state.fps.toFixed(1)
            : "--";


    const value =
        `LATENCY: ${latency} ms&nbsp;&nbsp; FPS: ${fps}`;


    const smallId =

        videoId === "abexDrillVideo"
            ? "abexDrillPerformance"

        : videoId === "abexTestVideo"
            ? "abexTestPerformance"

        : "abexMicroscopePerformance";


    const small =
        el(smallId);


    if (small) {
        small.innerHTML =
            value;
    }


    const fullscreen =
        el(
            "abexFullscreenPerformance"
        );


    if (
        fullscreen &&
        abexFullscreenSource &&
        abexFullscreenSource.id ===
            videoId
    ) {

        fullscreen.innerHTML =
            value;

    }

}


function recordAbexVideoFrame(
    videoId
) {

    const state =
        getAbexPerformanceState(
            videoId
        );


    state.frameCount++;


    const video =
        el(videoId);


    if (
        video &&
        typeof video.requestVideoFrameCallback ===
            "function"
    ) {

        state.frameRequest =
            video.requestVideoFrameCallback(
                () => {

                    recordAbexVideoFrame(
                        videoId
                    );

                }
            );

    }

}


async function updateAbexLatency(
    videoId
) {

    const state =
        getAbexPerformanceState(
            videoId
        );


    const video =
        el(videoId);


    if (!video) {
        return;
    }


    /*
     * The backend can attach the WebRTC
     * peer connection to the video element
     * as:
     *
     * video.__abexPeerConnection
     *
     * If it is not present, latency is kept
     * as "--" instead of inventing a value.
     */

    const pc =
        video.__abexPeerConnection;


    if (!pc) {

        state.latency =
            null;

        renderAbexPerformance(
            videoId
        );

        return;

    }


    try {

        const stats =
            await pc.getStats();


        let rtt = null;


        stats.forEach(
            report => {

                if (
                    report.type ===
                        "candidate-pair" &&

                    report.state ===
                        "succeeded" &&

                    report.nominated ===
                        true &&

                    typeof
                        report.currentRoundTripTime ===
                        "number"
                ) {

                    rtt =
                        report.currentRoundTripTime;

                }

            }
        );


        if (rtt !== null) {

            /*
             * currentRoundTripTime is RTT.
             * Show RTT / 2 as estimated
             * one-way latency.
             */

            state.latency =
                rtt * 500;

        }

    }

    catch (error) {

        state.latency =
            null;

    }


    renderAbexPerformance(
        videoId
    );

}


function updateAbexFps(
    videoId
) {

    const state =
        getAbexPerformanceState(
            videoId
        );


    const now =
        performance.now();


    if (
        state.lastTime !== null
    ) {

        const elapsed =
            (now - state.lastTime) /
            1000;


        if (
            elapsed > 0
        ) {

            state.fps =
                (
                    state.frameCount -
                    state.lastFrameCount
                ) / elapsed;

        }

    }


    state.lastFrameCount =
        state.frameCount;


    state.lastTime =
        now;


    renderAbexPerformance(
        videoId
    );

}



function watchAbexCamera(
    videoId
) {

    const video =
        el(videoId);

    if (!video) {
        return;
    }


    const startIfReady =
        () => {

            if (
                video.srcObject ||
                video.readyState >= 2
            ) {

                startAbexPerformance(
                    videoId
                );

            }

        };


    video.addEventListener(
        "loadedmetadata",
        startIfReady
    );


    video.addEventListener(
        "playing",
        startIfReady
    );


    startIfReady();

}

function startAbexPerformance(
    videoId
) {

    const state =
        getAbexPerformanceState(
            videoId
        );


    if (state.timer) {

        clearInterval(
            state.timer
        );

    }


    state.fps =
        null;

    state.latency =
        null;

    state.frameCount =
        0;

    state.lastFrameCount =
        0;

    state.lastTime =
        null;


    renderAbexPerformance(
        videoId
    );


    const video =
        el(videoId);


    if (
        video &&
        typeof video.requestVideoFrameCallback ===
            "function"
    ) {

        state.frameRequest =
            video.requestVideoFrameCallback(
                () => {

                    recordAbexVideoFrame(
                        videoId
                    );

                }
            );

    }


    state.timer =
        setInterval(
            () => {

                updateAbexFps(
                    videoId
                );

                updateAbexLatency(
                    videoId
                );

            },
            1000
        );

}


function stopAbexPerformance(
    videoId
) {

    const state =
        getAbexPerformanceState(
            videoId
        );


    if (state.timer) {

        clearInterval(
            state.timer
        );

        state.timer =
            null;

    }


    state.fps =
        null;

    state.latency =
        null;


    renderAbexPerformance(
        videoId
    );

}


let abexFullscreenSource = null;


function openAbexFullscreen(
    videoId,
    title
) {

    const source =
        el(videoId);

    const overlay =
        el("abexFullscreenOverlay");

    const fullscreenVideo =
        el("abexFullscreenVideo");

    const fullscreenTitle =
        el("abexFullscreenTitle");


    if (
        !source ||
        !overlay ||
        !fullscreenVideo
    ) {
        return;
    }


    abexFullscreenSource =
        source;


    fullscreenTitle.textContent =
        title;


    /*
     * Use the exact same MediaStream
     * already displayed by the ABEX
     * camera, so no second connection
     * is created.
     */

    if (source.srcObject) {

        fullscreenVideo.srcObject =
            source.srcObject;

    }

    else if (source.currentSrc) {

        fullscreenVideo.src =
            source.currentSrc;

    }


    fullscreenVideo.play()
        .catch(
            () => {}
        );


    if (abexFullscreenSource) {

        renderAbexPerformance(
            abexFullscreenSource.id
        );

    }


    overlay.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}


function closeAbexFullscreen(
    event
) {

    /*
     * Only close when the overlay
     * background is tapped, or when
     * the CLOSE button calls this
     * without an event.
     */

    if (
        event &&
        event.target !== event.currentTarget
    ) {
        return;
    }


    const overlay =
        el("abexFullscreenOverlay");

    const fullscreenVideo =
        el("abexFullscreenVideo");


    if (fullscreenVideo) {

        fullscreenVideo.pause();

        fullscreenVideo.srcObject =
            null;

        fullscreenVideo.removeAttribute(
            "src"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

    }


    document.body.style.overflow =
        "";


    abexFullscreenSource =
        null;

}


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeAbexFullscreen();

        }

    }
);

function updateAbexSensors(data) {

    if (!data) {
        return;
    }


    /*
     * Main environment values
     */

    if (data.temperature !== undefined) {

        el("abexTemperature")
            .textContent =
            `${data.temperature} °C`;

    }


    if (data.humidity !== undefined) {

        el("abexHumidity")
            .textContent =
            `${data.humidity} %`;

    }


    if (data.pressure !== undefined) {

        el("abexPressure")
            .textContent =
            `${data.pressure} kPa`;

    }


    if (data.soil_moisture !== undefined) {

        el("abexSoil")
            .textContent =
            `${data.soil_moisture} %`;

    }


    if (data.nitrogen !== undefined) {

        el("abexNitrogen")
            .textContent =
            `${data.nitrogen} kg/ha`;

    }


    if (data.phosphorus !== undefined) {

        el("abexPhosphorus")
            .textContent =
            `${data.phosphorus} kg/ha`;

    }


    if (data.potassium !== undefined) {

        el("abexPotassium")
            .textContent =
            `${data.potassium} kg/ha`;

    }


    /*
     * O2 sensor
     */

    const o2 =
        data.o2 !== undefined
            ? data.o2
            : data.oxygen;


    if (o2 !== undefined) {

        el("abexO2")
            .textContent =
            `${o2} %`;

    }


    /*
     * NPK sensor summary
     */

    const npk =
        data.npk !== undefined
            ? data.npk
            : null;


    if (npk !== null) {

        if (
            typeof npk === "object"
        ) {

            const n =
                npk.n !== undefined
                    ? npk.n
                    : npk.nitrogen;

            const p =
                npk.p !== undefined
                    ? npk.p
                    : npk.phosphorus;

            const k =
                npk.k !== undefined
                    ? npk.k
                    : npk.potassium;


            el("abexNpk")
                .textContent =
                `N:${n ?? "--"} P:${p ?? "--"} K:${k ?? "--"}`;

        }

        else {

            el("abexNpk")
                .textContent =
                npk;

        }

    }

    else if (
        data.nitrogen !== undefined ||
        data.phosphorus !== undefined ||
        data.potassium !== undefined
    ) {

        el("abexNpk")
            .textContent =
            `N:${data.nitrogen ?? "--"} ` +
            `P:${data.phosphorus ?? "--"} ` +
            `K:${data.potassium ?? "--"}`;

    }


    /*
     * BME sensor summary
     */

    const bme =
        data.bme !== undefined
            ? data.bme
            : null;


    if (bme !== null) {

        if (
            typeof bme === "object"
        ) {

            const bt =
                bme.temperature ??
                bme.temp ??
                "--";

            const bh =
                bme.humidity ??
                "--";

            const bp =
                bme.pressure ??
                "--";

            el("abexBme")
                .textContent =
                `${bt}°C / ${bh}% / ${bp}kPa`;

        }

        else {

            el("abexBme")
                .textContent =
                bme;

        }

    }

    else if (
        data.bme_temperature !== undefined ||
        data.bme_humidity !== undefined ||
        data.bme_pressure !== undefined
    ) {

        el("abexBme")
            .textContent =
            `${data.bme_temperature ?? "--"}°C / ` +
            `${data.bme_humidity ?? "--"}% / ` +
            `${data.bme_pressure ?? "--"}kPa`;

    }


    /*
     * Spectrometer status
     */

    if (data.spectrometer !== undefined) {

        const spectrum =
            el("spectrometerStatus");

        if (spectrum) {

            spectrum.textContent =
                data.spectrometer;

        }

    }

}

/* =========================================================
   RADO DATA
   ========================================================= */

function updateRadoData(data) {

    if (!data) {
        return;
    }


    if (
        data.distance !== undefined
    ) {

        el("radoDistance")
            .textContent =
            `${data.distance} m`;

    }


    if (
        data.heading !== undefined
    ) {

        el("radoHeading")
            .textContent =
            `${data.heading}°`;

    }


    if (
        data.gps !== undefined
    ) {

        el("radoGps")
            .textContent =
            data.gps;

    }


    if (
        data.imu !== undefined
    ) {

        el("radoImu")
            .textContent =
            data.imu;

    }


    if (
        data.status !== undefined
    ) {

        el("radoState")
            .textContent =
            data.status;

    }

}


/* =========================================================
   IDMO DATA
   ========================================================= */

function updateIdmoData(data) {

    if (!data) {
        return;
    }


    const fields = {

        mode:
            "idmMode",

        gripper:
            "idmGripper",

        force:
            "idmForce",

        task:
            "idmTask"

    };


    Object.entries(fields)
        .forEach(
            ([key, id]) => {

                if (
                    data[key] !== undefined
                ) {

                    el(id)
                        .textContent =
                        data[key];

                }

            }
        );


    for (
        let i = 1;
        i <= 6;
        i++
    ) {

        const key =
            `joint${i}`;


        if (
            data[key] !== undefined
        ) {

            el(key)
                .textContent =
                `${data[key]}°`;

        }

    }

}


/* =========================================================
   COMMAND
   ========================================================= */

function sendCommand(
    command,
    dashboard = currentWorkspace
) {

    addLog(
        `${dashboard.toUpperCase()} → ${command}`
    );


    fetch(
        backendUrl("/api/command"),
        {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify({

                    command:
                        command,

                    dashboard:
                        dashboard

                })

        }
    )
    .then(
        response => {

            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }

            return response.json();

        }
    )
    .catch(
        error => {

            addLog(
                `Command error: ${error.message}`
            );

        }
    );

}




/* =========================================================
   ABEX
   ========================================================= */

function captureAbexTest(
    letter,
    button
) {

    document
        .querySelectorAll(".test-button")
        .forEach(
            item => {

                item.classList.remove(
                    "active"
                );

            }
        );


    if (button) {

        button.classList.add(
            "active"
        );

    }


    sendCommand(
        `ABEX CAPTURE TEST ${letter}`,
        "abex"
    );

}




/* =========================================================
   RADO
   ========================================================= */


function toggleRadoRecon() {

    const panel =
        el("radoObjectTarget");

    const button =
        el("radoReconButton");

    if (!panel) {
        return;
    }

    const hidden =
        panel.style.display === "none";

    panel.style.display =
        hidden ? "block" : "none";

    if (button) {

        button.classList.toggle(
            "active",
            hidden
        );

    }

    if (hidden) {

        radoCommand(
            "RECONNAISSANCE MODE"
        );

    }

}


function switchRadoMode(mode) {

    const reconTab =
        el("radoReconTab");

    const deliveryTab =
        el("radoDeliveryTab");


    if (reconTab) {

        reconTab.classList.toggle(
            "active",
            mode === "reconnaissance"
        );

    }


    if (deliveryTab) {

        deliveryTab.classList.toggle(
            "active",
            mode === "delivery"
        );

    }


    radoCommand(
        mode === "reconnaissance"
            ? "RECONNAISSANCE MODE"
            : "AUTONOMOUS DELIVERY"
    );

}

function radoCommand(command) {

    sendCommand(
        `RADO ${command}`,
        "rado"
    );

}


/* =========================================================
   IDMO
   ========================================================= */

function idmoCommand(command) {

    sendCommand(
        `IDMO ${command}`,
        "idmo"
    );

}


async function waitForIceGatheringComplete(pc) {

    if (pc.iceGatheringState === "complete") {
        return;
    }

    await new Promise(resolve => {

        const checkIce = () => {

            if (pc.iceGatheringState === "complete") {

                pc.removeEventListener(
                    "icegatheringstatechange",
                    checkIce
                );

                resolve();
            }
        };

        pc.addEventListener(
            "icegatheringstatechange",
            checkIce
        );

        checkIce();
    });
}


/* =========================================================
   SHARED OPENCV + WEBRTC CAMERA CONNECTIONS

   One WebRTC connection is created per physical camera.
   Multiple GUI tiles can reuse the same MediaStream.
   This prevents the same USB camera from being opened
   repeatedly by the browser/backend.
   ========================================================= */

const physicalCameraPeers = {};
const physicalCameraStreams = {};
const physicalCameraPromises = {};


async function createPhysicalCameraConnection(cameraId) {

    if (!cameraId) {
        return null;
    }

    if (physicalCameraStreams[cameraId]) {
        return physicalCameraStreams[cameraId];
    }

    if (physicalCameraPromises[cameraId]) {
        return physicalCameraPromises[cameraId];
    }

    physicalCameraPromises[cameraId] = (async () => {

        const pc = new RTCPeerConnection({
            iceServers: []
        });

        physicalCameraPeers[cameraId] = pc;

        pc.addTransceiver(
            "video",
            { direction: "recvonly" }
        );

        const streamPromise = new Promise((resolve, reject) => {

            let resolved = false;

            const finish = stream => {
                if (resolved) {
                    return;
                }

                resolved = true;
                physicalCameraStreams[cameraId] = stream;
                resolve(stream);
            };

            pc.ontrack = event => {

                let stream = null;

                if (
                    event.streams &&
                    event.streams.length > 0
                ) {
                    stream = event.streams[0];
                } else {
                    stream = new MediaStream();
                    stream.addTrack(event.track);
                }

                finish(stream);
            };

            pc.onconnectionstatechange = () => {

                console.log(
                    `[WEBRTC] ${cameraId}: ${pc.connectionState}`
                );

                if (
                    pc.connectionState === "failed" ||
                    pc.connectionState === "closed"
                ) {
                    delete physicalCameraStreams[cameraId];

                    if (!resolved) {
                        reject(
                            new Error(
                                `WebRTC connection failed for ${cameraId}`
                            )
                        );
                    }
                }
            };
        });

        const offer = await pc.createOffer();

        await pc.setLocalDescription(offer);

        await waitForIceGatheringComplete(pc);

        const response = await fetch(
            backendUrl("/offer"),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    sdp: pc.localDescription.sdp,
                    type: pc.localDescription.type,
                    camera: cameraId
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `WebRTC ${response.status}: ${await response.text()}`
            );
        }

        const answer = await response.json();

        await pc.setRemoteDescription(
            new RTCSessionDescription(answer)
        );

        const stream = await streamPromise;

        return stream;

    })();

    try {
        return await physicalCameraPromises[cameraId];
    } catch (error) {

        const pc = physicalCameraPeers[cameraId];

        if (pc) {
            try {
                pc.close();
            } catch (closeError) {}
        }

        delete physicalCameraPeers[cameraId];
        delete physicalCameraStreams[cameraId];

        throw error;

    } finally {
        delete physicalCameraPromises[cameraId];
    }
}


function attachCameraStream(video, stream) {

    if (!video || !stream) {
        return;
    }

    video.srcObject = stream;

    video.play().catch(() => {});
}


function stopPhysicalCameraConnections() {

    Object.keys(physicalCameraPeers).forEach(cameraId => {

        const pc = physicalCameraPeers[cameraId];

        if (pc) {
            try {
                pc.close();
            } catch (error) {}
        }
    });

    Object.keys(physicalCameraStreams).forEach(cameraId => {

        const stream = physicalCameraStreams[cameraId];

        if (stream && stream.getTracks) {
            stream.getTracks().forEach(track => {
                try {
                    track.stop();
                } catch (error) {}
            });
        }
    });

    Object.keys(physicalCameraPeers).forEach(
        cameraId => delete physicalCameraPeers[cameraId]
    );

    Object.keys(physicalCameraStreams).forEach(
        cameraId => delete physicalCameraStreams[cameraId]
    );

    Object.keys(physicalCameraPromises).forEach(
        cameraId => delete physicalCameraPromises[cameraId]
    );
}


async function connectWorkspaceCamera(
    videoId,
    cameraId,
    workspace,
    performanceId = null
) {

    const video = el(videoId);

    if (!video) {
        return;
    }

    if (!cameraId) {

        video.srcObject = null;

        const parent = video.parentElement;
        const placeholder = parent
            ? parent.querySelector(
                ".video-empty, .rado-recon-camera-placeholder"
            )
            : null;

        if (placeholder) {
            placeholder.style.display = "flex";
            placeholder.textContent = "CAMERA NOT CONFIGURED";
        }

        return;
    }

    const parent = video.parentElement;

    const placeholder = parent
        ? parent.querySelector(
            ".video-empty, .rado-recon-camera-placeholder"
        )
        : null;

    if (placeholder) {
        placeholder.style.display = "flex";
        placeholder.textContent = "CONNECTING";
    }

    try {

        const stream =
            await createPhysicalCameraConnection(cameraId);

        if (!stream) {
            throw new Error("No WebRTC stream received");
        }

        attachCameraStream(video, stream);

        if (placeholder) {
            placeholder.style.display = "none";
        }

        if (performanceId) {

            if (workspace === "abex") {
                video.__abexPeerConnection =
                    physicalCameraPeers[cameraId];

                startAbexPerformance(videoId);
            }
        }

        if (workspace === "rado") {

            const metrics = document.querySelector(
                `.recon-camera-metrics[data-camera="${videoId}"]`
            );

            if (metrics) {
                metrics.textContent =
                    "LATENCY: -- ms   FPS: --";
            }
        }

    } catch (error) {

        console.error(
            `[WEBRTC] ${workspace} ${videoId}:`,
            error
        );

        if (placeholder) {
            placeholder.style.display = "flex";
            placeholder.textContent = "OFFLINE";
        }

        if (performanceId) {
            const output = el(performanceId);
            if (output) {
                output.textContent =
                    "LATENCY: -- ms   FPS: --";
            }
        }
    }
}


function stopWorkspaceCamera(videoId) {

    const video = el(videoId);

    if (!video) {
        return;
    }

    if (video.__abexPeerConnection) {
        video.__abexPeerConnection = null;
    }

    if (video.srcObject) {
        video.pause();
        video.srcObject = null;
    }
}


/* =========================================================
   NORMAL GRID CAMERA
   ========================================================= */

async function connectGridCamera(slot) {

    if (!streamingActive) return;

    const camera = cameras[slot];
    const video = el(`cameraVideo${slot + 1}`);
    const placeholder = el(`placeholder${slot + 1}`);
    const status = el(`cameraStatus${slot + 1}`);

    if (!camera || !video) return;

    // GUI slot 2 / ARM CAM intentionally has no camera.
    if (!camera.camera) {
        if (status) status.textContent = "NOT CONFIGURED";
        if (placeholder) {
            placeholder.style.display = "flex";
            placeholder.textContent = "CAMERA NOT CONFIGURED";
        }
        return;
    }

    if (status) status.textContent = "CONNECTING";
    if (placeholder) {
        placeholder.style.display = "flex";
        placeholder.textContent = camera.name;
    }

    try {
        // NEVER send an OpenCV index here.
        // Send the logical camera ID only.
        const cameraId = camera.camera;

        console.log(
            `[GCS] SLOT ${slot} (${camera.name}) -> ${cameraId}`
        );

        const stream =
            await createPhysicalCameraConnection(cameraId);

        if (!stream) {
            throw new Error(`No WebRTC stream received for ${cameraId}`);
        }

        attachCameraStream(video, stream);

        if (placeholder) placeholder.style.display = "none";
        if (status) status.textContent = "LIVE";

        const pc = physicalCameraPeers[cameraId];
        gridPeers[slot] = pc;

        video._gcsPeerConnection = pc;
        video._gcsCameraIndex = slot; // GUI slot, NOT OpenCV index

        if (pc) {
            startCameraPerformance(slot, pc);
        }

    } catch (error) {
        console.error(
            `[GCS] SLOT ${slot} ${camera.camera} ERROR:`,
            error
        );

        if (status) status.textContent = "ERROR";
        if (placeholder) {
            placeholder.style.display = "flex";
            placeholder.textContent = `${camera.name} OFFLINE`;
        }
    }
}

/* =========================================================
   OPEN FULLSCREEN CAMERA
   ========================================================= */

function openFullscreenCamera(index) {

    fullscreenCameraIndex =
        index;


    const overlay =
        el("cameraFullscreen");


    /*
     * Show our fullscreen overlay.
     */

    overlay.classList.add(
        "active"
    );


    /*
     * DO NOT use browser requestFullscreen().
     *
     * This is intentional.
     *
     * We are using a fixed fullscreen overlay
     * instead of browser fullscreen mode.
     *
     * Therefore ONE ESC press is enough.
     */


    updateFullscreenCamera();


    addLog(
        `FULLSCREEN → ${cameras[index].name}`
    );

}


/* =========================================================
   CLOSE FULLSCREEN CAMERA
   ========================================================= */

function closeFullscreenCamera(event) {

    /*
     * Prevent the click from reaching
     * anything behind the overlay.
     */

    if (event) {

        event.preventDefault();

        event.stopPropagation();

    }


    const overlay =
        el("cameraFullscreen");


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

    }


    /*
     * Close fullscreen WebRTC.
     */

    stopCameraPerformance(
        fullscreenCameraIndex
    );

    if (fullscreenPeer) {

        try {

            fullscreenPeer.close();

        }
        catch (error) {}

        fullscreenPeer =
            null;

    }


    /*
     * Clear video.
     */

    const video =
        el("fullscreenVideo");


    if (video) {

        video.pause();

        video.srcObject =
            null;

    }


    addLog(
        "Returned to four-camera grid"
    );

}


/* =========================================================
   PREVIOUS CAMERA
   ========================================================= */

function fullscreenPreviousCamera(event) {

    if (event) {

        event.preventDefault();

        event.stopPropagation();

    }


    fullscreenCameraIndex--;


    if (
        fullscreenCameraIndex < 0
    ) {

        fullscreenCameraIndex =
            cameras.length - 1;

    }


    updateFullscreenCamera();

}


/* =========================================================
   NEXT CAMERA
   ========================================================= */

function fullscreenNextCamera(event) {

    if (event) {

        event.preventDefault();

        event.stopPropagation();

    }


    fullscreenCameraIndex++;


    if (
        fullscreenCameraIndex >=
        cameras.length
    ) {

        fullscreenCameraIndex =
            0;

    }


    updateFullscreenCamera();

}


/* =========================================================
   UPDATE FULLSCREEN CAMERA
   ========================================================= */

async function updateFullscreenCamera() {

    stopCameraPerformance(
        fullscreenCameraIndex
    );

    const camera =
        cameras[
            fullscreenCameraIndex
        ];


    const video =
        el("fullscreenVideo");


    const name =
        el("fullscreenCameraName");


    const status =
        el("fullscreenCameraStatus");


    const number =
        el("fullscreenCameraNumber");


    name.textContent =
        camera.name;


    number.textContent =
        `CAMERA ${
            fullscreenCameraIndex + 1
        } / ${
            cameras.length
        }`;


    status.textContent =
        "CONNECTING";


    /*
     * Close previous fullscreen
     * connection.
     */

    if (fullscreenPeer) {

        try {

            fullscreenPeer.close();

        }
        catch (error) {}

        fullscreenPeer =
            null;

    }


    video.pause();

    video.srcObject =
        null;


    /*
     * AUX has no RTSP route yet.
     */

    if (
        camera.camera === null
    ) {

        status.textContent =
            "NOT CONFIGURED";


        addLog(
            "AUX camera is not configured"
        );


        return;

    }


    try {

        const pc =
            new RTCPeerConnection();


        fullscreenPeer =
            pc;


        pc.addTransceiver(
            "video",
            {
                direction:
                    "recvonly"
            }
        );


        pc.ontrack =
            event => {

                let stream;


                if (
                    event.streams &&
                    event.streams.length
                ) {

                    stream =
                        event.streams[0];

                }

                else {

                    stream =
                        new MediaStream();

                    stream.addTrack(
                        event.track
                    );

                }


                video.srcObject =
                    stream;


                status.textContent =
                    "● LIVE";


                video.play()
                    .catch(
                        () => {}
                    );

                startCameraPerformance(
                    fullscreenCameraIndex,
                    pc
                );

            };


        pc.onconnectionstatechange =
            () => {

                if (
                    pc.connectionState ===
                    "connected"
                ) {

                    status.textContent =
                        "● LIVE";

                }


                if (
                    pc.connectionState ===
                    "failed"
                ) {

                    status.textContent =
                        "ERROR";

                }


                if (
                    pc.connectionState ===
                    "disconnected"
                ) {

                    status.textContent =
                        "DISCONNECTED";

                }

            };


        const offer =
            await pc.createOffer();


        await pc.setLocalDescription(
            offer
        );

        await waitForIceGatheringComplete(pc);


        const response =
            await fetch(
                backendUrl("/offer"),
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            sdp:
                                pc.localDescription
                                    .sdp,

                            type:
                                pc.localDescription
                                    .type,

                            camera:
                                camera.camera

                        })

                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                `WebRTC ${response.status}: ${errorText}`
            );

        }


        const answer =
            await response.json();


        await pc.setRemoteDescription(

            new RTCSessionDescription(
                answer
            )

        );


        addLog(
            `Fullscreen camera → ${camera.name}`
        );

    }

    catch (error) {

        status.textContent =
            "ERROR";


        addLog(
            `Fullscreen ${camera.name}: ${error.message}`
        );

    }

}


/* =========================================================
   ESC + KEYBOARD CAMERA CONTROLS
   ========================================================= */

/*
 * IMPORTANT:
 *
 * We are NOT using browser fullscreen.
 *
 * Therefore Escape is handled entirely
 * by this overlay.
 *
 * ONE ESC = CLOSE.
 */

document.addEventListener(
    "keydown",
    function(event) {

        const overlay =
            el("cameraFullscreen");


        /*
         * Ignore keyboard controls when
         * camera fullscreen is not open.
         */

        if (
            !overlay ||
            !overlay.classList.contains("active")
        ) {

            return;

        }


        /* ===============================================
           ESC
           =============================================== */

        if (
            event.key === "Escape" ||
            event.code === "Escape"
        ) {

            event.preventDefault();

            event.stopPropagation();

            closeFullscreenCamera();

            return;

        }


        /* ===============================================
           LEFT
           =============================================== */

        if (
            event.key === "ArrowLeft"
        ) {

            event.preventDefault();

            event.stopPropagation();

            fullscreenPreviousCamera(
                event
            );

            return;

        }


        /* ===============================================
           RIGHT
           =============================================== */

        if (
            event.key === "ArrowRight"
        ) {

            event.preventDefault();

            event.stopPropagation();

            fullscreenNextCamera(
                event
            );

            return;

        }

    },
    true
);


/* =========================================================
   SPECTROMETER
   ========================================================= */

function initialiseSpectrum() {

    const canvas =
        el("spectrumCanvas");


    if (!canvas) {
        return;
    }


    function resize() {

        canvas.width =
            canvas.clientWidth;

        canvas.height =
            canvas.clientHeight;


        draw();

    }


    function draw() {

        const ctx =
            canvas.getContext("2d");


        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        ctx.strokeStyle =
            "#292929";


        for (
            let i = 1;
            i < 5;
            i++
        ) {

            const y =
                canvas.height *
                i / 5;


            ctx.beginPath();

            ctx.moveTo(
                0,
                y
            );

            ctx.lineTo(
                canvas.width,
                y
            );

            ctx.stroke();

        }


        for (
            let i = 1;
            i < 6;
            i++
        ) {

            const x =
                canvas.width *
                i / 6;


            ctx.beginPath();

            ctx.moveTo(
                x,
                0
            );

            ctx.lineTo(
                x,
                canvas.height
            );

            ctx.stroke();

        }

    }


    window.addEventListener(
        "resize",
        resize
    );


    resize();

}


/* =========================================================
   INITIALISE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        addLog(
            "QBOTIX ROVER 2027 GCS initialized"
        );


        initialiseSocket();


        initialiseSpectrum();


        loadDashboardData();


        setInterval(
            loadDashboardData,
            2000
        );


        /*
         * Camera streaming starts only when
         * the START STREAMING toggle is pressed.
         */

        streamingActive =
            false;

        updateStreamingUI();
        updateStreamTimer();

        /*
         * Explicit WebRTC streaming button binding.
         * The HTML also contains onclick="toggleStreaming()";
         * this listener is a safe fallback and prevents the button
         * from becoming dead if the inline handler is not available.
         */
        const streamButton =
            document.getElementById("streamToggle");

        if (streamButton && !streamButton.dataset.webrtcBound) {

            streamButton.dataset.webrtcBound = "true";

            streamButton.addEventListener("click", event => {

                console.log("[STREAM] START STREAMING clicked");

                /*
                 * Do not preventDefault here because the existing
                 * inline onclick handler is also part of the GUI.
                 */
            });
        }


        watchAbexCamera(
            "abexDrillVideo"
        );

        watchAbexCamera(
            "abexTestVideo"
        );

        watchAbexCamera(
            "abexMicroscopeVideo"
        );

    }
);
/* =========================================================
   GCS TILE CAMERA CAROUSEL

   IMPORTANT:
   - Arrows change ONLY the camera inside that tile.
   - Arrows DO NOT open fullscreen.
   - Clicking the camera tile itself still opens fullscreen.
   - Each tile keeps its own selected camera.
   ========================================================= */


/* Current camera assigned to each GCS tile

   Tile 0 = Front Left
   Tile 1 = Front Right
   Tile 2 = Arm Cam
   Tile 3 = Rear Cam
*/
const gcsTileCameras = [0, 1, 2, 3];


/* Camera elements belonging to each tile */
const gcsTileElements = [
    {
        video: "cameraVideo1",
        status: "cameraStatus1",
        placeholder: "placeholder1",
        performance: "cameraPerformance1"
    },
    {
        video: "cameraVideo2",
        status: "cameraStatus2",
        placeholder: "placeholder2",
        performance: "cameraPerformance2"
    },
    {
        video: "cameraVideo3",
        status: "cameraStatus3",
        placeholder: "placeholder3",
        performance: "cameraPerformance3"
    },
    {
        video: "cameraVideo4",
        status: "cameraStatus4",
        placeholder: "placeholder4",
        performance: "cameraPerformance4"
    }
];


/* ---------------------------------------------------------
   NORMAL TILE ARROW
   --------------------------------------------------------- */

function openAdjacentCamera(tileIndex, direction, event) {

    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (
        tileIndex < 0 ||
        tileIndex >= gcsTileCameras.length
    ) {
        return;
    }

    if (
        !Array.isArray(cameras) ||
        cameras.length === 0
    ) {
        console.warn("No cameras configured.");
        return;
    }

    const totalCameras = cameras.length;

    /*
       Get the camera currently assigned
       to THIS tile.
    */
    let newCameraIndex =
        gcsTileCameras[tileIndex] + direction;


    /*
       Wrap around.
    */

    if (newCameraIndex < 0) {
        newCameraIndex =
            totalCameras - 1;
    }

    if (newCameraIndex >= totalCameras) {
        newCameraIndex = 0;
    }


    /*
       Save the new camera for THIS tile.
    */

    gcsTileCameras[tileIndex] =
        newCameraIndex;


    /*
       Change only this tile.
    */

    changeGcsTileCamera(
        tileIndex,
        newCameraIndex
    );
}


/* ---------------------------------------------------------
   CHANGE CAMERA INSIDE ONE TILE
   --------------------------------------------------------- */

async function changeGcsTileCamera(
    tileIndex,
    cameraIndex
) {

    const tile =
        gcsTileElements[tileIndex];

    if (!tile) {
        return;
    }

    const video =
        document.getElementById(tile.video);

    const status =
        document.getElementById(tile.status);

    const placeholder =
        document.getElementById(tile.placeholder);

    const performance =
        document.getElementById(tile.performance);

    if (!video) {
        return;
    }

    const camera = cameras[cameraIndex];

    if (!camera) {
        return;
    }

    /* Stop only the tile's old display/performance state.
       The physical WebRTC connection is shared globally. */

    stopCameraPerformance(tileIndex);

    if (video.srcObject) {
        video.pause();
        video.srcObject = null;
    }

    if (placeholder) {
        placeholder.textContent = camera.name;
        placeholder.style.display = "flex";
    }

    if (status) {
        status.textContent = "CONNECTING";
    }

    if (performance) {
        performance.textContent =
            "LATENCY: -- ms   FPS: --";
    }

    if (!streamingActive) {
        if (status) {
            status.textContent = "WAITING";
        }
        return;
    }

    if (!camera.camera) {

        if (status) {
            status.textContent = "NOT CONFIGURED";
        }

        if (placeholder) {
            placeholder.textContent =
                "CAMERA NOT CONFIGURED";
        }

        return;
    }

    try {

        const stream =
            await createPhysicalCameraConnection(
                camera.camera
            );

        if (!stream) {
            throw new Error("No WebRTC stream received");
        }

        attachCameraStream(video, stream);

        if (placeholder) {
            placeholder.style.display = "none";
        }

        if (status) {
            status.textContent = "LIVE";
        }

        const pc =
            physicalCameraPeers[camera.camera];

        gridPeers[tileIndex] = pc;

        video._gcsPeerConnection = pc;
        video._gcsCameraIndex = cameraIndex;

        startCameraPerformance(
            tileIndex,
            pc
        );

    } catch (error) {

        console.error(
            `GCS tile ${tileIndex} camera error:`,
            error
        );

        if (status) {
            status.textContent = "ERROR";
        }

        if (placeholder) {
            placeholder.style.display = "flex";
            placeholder.textContent = "OFFLINE";
        }

        if (performance) {
            performance.textContent =
                "LATENCY: -- ms   FPS: --";
        }
    }
}


// Keep exactly ONE Panorama tab visible: the tab for the active workspace.
function syncPanoramaDockVisibility() {
    const gcsDock = el("gcsPanoramaDock");
    const abexDock = el("abexPanoramaDock");

    if (gcsDock) {
        gcsDock.style.display = currentWorkspace === "gcs" ? "flex" : "none";
        gcsDock.classList.toggle("panorama-active", currentWorkspace === "gcs");
    }

    if (abexDock) {
        abexDock.style.display = currentWorkspace === "abex" ? "flex" : "none";
        abexDock.classList.toggle("panorama-active", currentWorkspace === "abex");
    }
}

updatePanoramaDockVisibility();
syncPanoramaDockVisibility();
