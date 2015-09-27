// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul
// Irish and Tino Zijdel

// MIT license

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame =
            window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[x]+'CancelAnimationFrame'] ||
            window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            window.clearTimeout(id);
        };
}());

// end of third party polyfill code

(function() {
    "use strict";

    var PIXI = window.PIXI;
    var TAU = Math.PI * 2;

    var frameRate = 30;
    var frameInterval = 1000/frameRate;
    var playerAccel = 400 / (frameRate * frameRate);  // px/frame^2
    var playerMaxSpeed = 600 / frameRate;  // px/frame

    var gameState = { player: { x: 400, y: 300, rot: 0, vel: [0.0, 0.0] } };

    var renderer = PIXI.autoDetectRenderer(800, 600, {
        backgroundColor: 0x000000,
        antialias: true});
    renderer.view.style.border = "2px solid white";
    renderer.view.style.display = "block";
    renderer.view.style.marginLeft = "auto";
    renderer.view.style.marginRight = "auto";

    document.body.appendChild(renderer.view);

    // create an new instance of a pixi stage
    var stage = new PIXI.Container();
    var graphics = new PIXI.Graphics();
    stage.addChild(graphics);

    var lastFrameTime = null;
    var startTime = lastFrameTime;
    var frames = 0;

    var fpsDisplay = document.createElement("div");
    fpsDisplay.style.color = "white";
    document.body.appendChild(fpsDisplay);

    var frame = function frame(now) {
        requestAnimationFrame(frame);
        if (!lastFrameTime) { lastFrameTime = now; }
        var dt = now - lastFrameTime;
        if (dt >= frameInterval) {
            frames += 1;

            var excess = dt - frameInterval;
            if (excess > frameInterval) {
                // don't spend minutes catching up if tab has been
                // unfocused for minutes
                excess = frameInterval * 0.25;
            }
            lastFrameTime = now - excess;

            updatePlayer();
            draw();

            fpsDisplay.innerHTML = "" + frames + " frames, " + Math.round(frames / ((now-startTime)/1000)) + " fps";
        }
    };
    requestAnimationFrame(frame);

    var controls = {
        left: false,
        right: false,
        up: false
    };

    var keyHandler = function keyHandler(evt, pressed) {
        switch (evt.keyCode) {
        case 37:  // left arrow
        case 65:  // A
            controls.left = pressed;
            break;
        case 38:  // up arrow
        case 87:  // W
            controls.up = pressed;
            break;
        case 39:  // right arrow
        case 68:  // D
            controls.right = pressed;
            break;
        }
    };

    document.onkeyup = function(e) { keyHandler(e, false); };
    document.onkeydown = function(e) { keyHandler(e, true); };

    var updatePlayer = function updatePlayer() {
        var p = gameState.player;

        if (controls.left) {
            p.rot -= TAU / (2.0 * frameRate);
        }
        if (controls.right) {
            p.rot += TAU / (2.0 * frameRate);
        }
        while (p.rot > TAU) {
            p.rot -= TAU;
        }

        if (controls.up) {
            var rotatedAccel = rotatePoint([0, -playerAccel], p.rot);
            p.vel[0] += rotatedAccel[0];
            p.vel[1] += rotatedAccel[1];
        }

        if (vectorMag(p.vel) > playerMaxSpeed) {
            p.vel = normalizeVector(p.vel, playerMaxSpeed);
        }

        // apply acceleration
        p.x += p.vel[0];
        while (p.x > 800) { p.x -= 800; }
        while (p.x < 0) { p.x += 800; }
        p.y += p.vel[1];
        while (p.y > 600) { p.y -= 600; }
        while (p.y < 0) { p.y += 600; }
    };

    var shapes = { player: [[0.0, -15.0],
                            [10.0, 15.0],
                            [0.0, 10.0],
                            [-10.0, 15.0],
                            [0.0, -15.0]] };

    var draw = function draw() {
        graphics.clear();

        // player
        graphics.lineStyle(2, 0xffffff, 1.0);
        for (var i=0; i < shapes.player.length; i++) {
            var point = shapes.player[i];
            point = rotatePoint(point, gameState.player.rot);
            point = translatePoint(point, [gameState.player.x,
                                           gameState.player.y]);
            if (i === 0) {
                graphics.moveTo(point[0], point[1]);
            } else {
                graphics.lineTo(point[0], point[1]);
            }
        }

        renderer.render(stage);
    };

    var rotatePoint = function rotatePoint(orig, theta) {
        return [orig[0] * Math.cos(theta) - orig[1] * Math.sin(theta),
                orig[1] * Math.cos(theta) + orig[0] * Math.sin(theta)];
    };

    var translatePoint = function translatePoint(orig, vec) {
        return [orig[0] + vec[0], orig[1] + vec[1]];
    };

    var vectorMag = function vectorMag(vec) {
        return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
    };

    var normalizeVector = function normalizeVector(vec, mag) {
        if (!mag) { mag = 1.0; }
        var oldMag = vectorMag(vec);
        var factor = mag / oldMag;
        return [vec[0] * factor, vec[1] * factor];
    };

})();
