/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { Ball, Batsman, Bat, Stumps, GameState, ShotDirection, AssetsLoaded } from '../types';
import {
    PITCH_COLOR, FIELD_COLOR, STUMPS_COLOR, BALL_FALLBACK_COLOR, BAT_FALLBACK_COLOR, BATSMAN_FALLBACK_COLOR, CREASE_COLOR,
    BALL_RADIUS, BALL_SPRITE_DISPLAY_WIDTH,
    STUMPS_HEIGHT, STUMPS_WIDTH, NUM_STUMPS, STUMP_GAP,
    BAT_SPRITE_DISPLAY_WIDTH, BAT_SPRITE_DISPLAY_HEIGHT, BATSMAN_SPRITE_DISPLAY_WIDTH, BATSMAN_SPRITE_DISPLAY_HEIGHT,
    FALLBACK_BAT_WIDTH, FALLBACK_BAT_HEIGHT, FALLBACK_BATSMAN_WIDTH, FALLBACK_BATSMAN_HEIGHT,
    CANVAS_WIDTH, CANVAS_HEIGHT, BAT_VISUAL_OFFSET_X, TRAIL_LENGTH
} from '../constants';

interface GameCanvasProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    ball: Ball | null;
    batsman: Batsman | null;
    bat: Bat | null;
    stumps: Stumps | null;
    gameState: GameState;
    shotDirection: ShotDirection;
    assetsLoaded: AssetsLoaded;
    batImage: HTMLImageElement;
    batsmanImage: HTMLImageElement;
    ballImage: HTMLImageElement;
    grassImage: HTMLImageElement;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
    canvasRef, ball, batsman, bat, stumps, gameState, shotDirection,
    assetsLoaded, batImage, batsmanImage, ballImage, grassImage
}) => {
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Set initial size

        return () => window.removeEventListener('resize', handleResize);
    }, [canvasRef]);


    useEffect(() => {
        if (canvasRef.current) {
            ctxRef.current = canvasRef.current.getContext('2d');
        }
    }, [canvasRef]);

    // Drawing functions, now internal to GameCanvas
    const drawField = (ctx: CanvasRenderingContext2D, cGrassImage: HTMLImageElement) => {
        const grassPatternReady = assetsLoaded.grass && cGrassImage.complete && cGrassImage.naturalWidth > 0;
        if (grassPatternReady) {
            const pattern = ctx.createPattern(cGrassImage, 'repeat');
            if (pattern) {
                ctx.fillStyle = pattern;
            } else {
                ctx.fillStyle = FIELD_COLOR; // Fallback
            }
        } else {
            ctx.fillStyle = FIELD_COLOR;
        }
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    };

    const drawPitch = (ctx: CanvasRenderingContext2D, cStumps: Stumps | null) => {
        if (!cStumps) return;

        const pX = CANVAS_WIDTH * 0.2;
        const pW = CANVAS_WIDTH * 0.6;
        const pY = 50;
        const pH = CANVAS_HEIGHT - 100;

        // Draw the brown pitch rectangle first
        ctx.fillStyle = PITCH_COLOR;
        ctx.fillRect(pX, pY, pW, pH);

        // Then draw the white crease lines on top
        ctx.strokeStyle = CREASE_COLOR;
        ctx.lineWidth = 2;
        const popY = cStumps.y + STUMPS_HEIGHT + 5;
        ctx.beginPath(); ctx.moveTo(pX, popY); ctx.lineTo(pX + pW, popY); ctx.stroke();
        const retL = 80;
        ctx.beginPath(); ctx.moveTo(pX, popY); ctx.lineTo(pX, popY + retL); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pX + pW, popY); ctx.lineTo(pX + pW, popY + retL); ctx.stroke();
        const bowlY = CANVAS_HEIGHT - (cStumps.y + STUMPS_HEIGHT + 5);
        ctx.beginPath(); ctx.moveTo(pX, bowlY); ctx.lineTo(pX + pW, bowlY); ctx.stroke();
    };

    const drawStumps = (ctx: CanvasRenderingContext2D, cStumps: Stumps | null) => {
        if (!cStumps) return;
        ctx.fillStyle = cStumps.hit ? '#FF6347' : STUMPS_COLOR; // Tomato for hit
        for (let i = 0; i < NUM_STUMPS; i++) {
            ctx.fillRect(cStumps.x + i * (STUMPS_WIDTH + STUMP_GAP), cStumps.y, STUMPS_WIDTH, STUMPS_HEIGHT);
        }
        if (!cStumps.hit) { // Draw bails if not hit
            ctx.beginPath();
            ctx.moveTo(cStumps.x, cStumps.y);
            ctx.lineTo(cStumps.x + (NUM_STUMPS * STUMPS_WIDTH + (NUM_STUMPS - 1) * STUMP_GAP) - STUMPS_WIDTH, cStumps.y);
            ctx.strokeStyle = STUMPS_COLOR;
            ctx.lineWidth = 3; // Make bails slightly thicker
            ctx.stroke();
        }
    };

    const drawBatsman = (ctx: CanvasRenderingContext2D, cBatsman: Batsman | null, cBat: Bat | null, cShotDir: ShotDirection) => {
        if (!cBatsman || !cBat) return;
        const batsmanSpriteReady = assetsLoaded.batsman && batsmanImage.complete && batsmanImage.naturalWidth > 0;
        const batSpriteReady = assetsLoaded.bat && batImage.complete && batImage.naturalWidth > 0;

        const currentBatsmanWidth = batsmanSpriteReady ? BATSMAN_SPRITE_DISPLAY_WIDTH : FALLBACK_BATSMAN_WIDTH;
        const currentBatsmanHeight = batsmanSpriteReady ? BATSMAN_SPRITE_DISPLAY_HEIGHT : FALLBACK_BATSMAN_HEIGHT;

        if (batsmanSpriteReady) {
            ctx.drawImage(batsmanImage, cBatsman.x - currentBatsmanWidth / 2, cBatsman.y - currentBatsmanHeight / 2, currentBatsmanWidth, currentBatsmanHeight);
        } else {
            ctx.fillStyle = BATSMAN_FALLBACK_COLOR;
            ctx.fillRect(cBatsman.x - currentBatsmanWidth / 2, cBatsman.y - currentBatsmanHeight / 2, currentBatsmanWidth, currentBatsmanHeight);
        }

        ctx.save();
        ctx.translate(cBatsman.x + BAT_VISUAL_OFFSET_X, cBatsman.y);
        let angle = 0;
        if (cBat.swinging) {
            angle = cBat.swingAngle;
        } else {
            if (cShotDir === 'LEG') angle = Math.PI / 10;
            else if (cShotDir === 'OFF') angle = -Math.PI / 10;
        }
        ctx.rotate(angle);

        const batVisualOffsetY = (BATSMAN_SPRITE_DISPLAY_HEIGHT / 2) - 25; // Bat position relative to batsman sprite center
        const currentBatDisplayWidth = batSpriteReady ? BAT_SPRITE_DISPLAY_WIDTH : FALLBACK_BAT_WIDTH;
        const currentBatDisplayHeight = batSpriteReady ? BAT_SPRITE_DISPLAY_HEIGHT : FALLBACK_BAT_HEIGHT;

        if (batSpriteReady) {
            ctx.drawImage(batImage, -currentBatDisplayWidth / 2, batVisualOffsetY - currentBatDisplayHeight / 2, currentBatDisplayWidth, currentBatDisplayHeight);
        } else {
            ctx.fillStyle = BAT_FALLBACK_COLOR;
            ctx.fillRect(-currentBatDisplayWidth / 2, batVisualOffsetY - currentBatDisplayHeight / 2, currentBatDisplayWidth, currentBatDisplayHeight);
        }
        ctx.restore();
    };

    const drawBall = (ctx: CanvasRenderingContext2D, cBall: Ball | null) => {
        if (!cBall) return;
        const ballSpriteReady = assetsLoaded.ball && ballImage.complete && ballImage.naturalWidth > 0;
        
        // --- Draw Shadow (only when in the air) ---
        if (cBall.z > 0) {
            const shadowOpacity = Math.max(0, 0.4 - cBall.z / 150);
            const shadowRadius = Math.max(1, cBall.radius - cBall.z / 15);
            const shadowY = cBall.y + cBall.radius; // Shadow is on the "ground"
            if (shadowRadius > 0) {
                ctx.beginPath();
                ctx.ellipse(cBall.x, shadowY, shadowRadius * 1.5, shadowRadius * 0.7, 0, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
                ctx.fill();
            }
        }

        // --- Draw Trail ---
        if (gameState === 'BALL_IN_PLAY' && cBall.trail) {
            cBall.trail.forEach((p, index) => {
                const trailProgress = index / TRAIL_LENGTH;
                const opacity = trailProgress * 0.5; // Trail is semi-transparent
                const radius = p.radius * trailProgress;
                if (radius > 0.5) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y - p.z, radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                    ctx.fill();
                }
            });
        }
        
        // --- Draw Ball ---
        const visualRadius = BALL_RADIUS + cBall.z * 0.5;
        const visualY = cBall.y - cBall.z;
        const displaySize = Math.max(BALL_SPRITE_DISPLAY_WIDTH, visualRadius * 2);

        if (ballSpriteReady) {
            ctx.drawImage(ballImage, cBall.x - displaySize / 2, visualY - displaySize / 2, displaySize, displaySize);
        } else {
            ctx.beginPath();
            ctx.arc(cBall.x, visualY, visualRadius, 0, Math.PI * 2);
            ctx.fillStyle = BALL_FALLBACK_COLOR;
            ctx.fill();
            ctx.closePath();
        }
    };

    useEffect(() => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        if (!ctx || !canvas || !assetsLoaded.all) {
             if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawField(ctx, grassImage);
             }
            return;
        }

        const gameAreaXOffset = (canvas.width - CANVAS_WIDTH) / 2;
        const gameAreaYOffset = (canvas.height - CANVAS_HEIGHT) / 2; // Center vertically
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawField(ctx, grassImage);

        ctx.save();
        ctx.translate(gameAreaXOffset, gameAreaYOffset);

        // --- Draw elements within the virtual game area ---
        drawPitch(ctx, stumps);
        drawStumps(ctx, stumps);
        drawBatsman(ctx, batsman, bat, shotDirection);

        // Draw ball only when it's part of the core bowling/hitting action
        if (ball && (gameState === 'BOWLING' || gameState === 'HITTING')) {
            drawBall(ctx, ball);
        }
        
        ctx.restore();
        
        // --- Draw elements in screen space (like the ball in play) ---
        if (ball && (gameState === 'BALL_IN_PLAY' || gameState === 'BALL_DEAD' || gameState === 'OUT')) {
            // Translate the ball's and its trail's virtual coordinates to screen coordinates
            const screenSpaceBall = {
                ...ball,
                x: ball.x + gameAreaXOffset,
                y: ball.y + gameAreaYOffset,
                trail: ball.trail.map(p => ({
                    ...p,
                    x: p.x + gameAreaXOffset,
                    y: p.y + gameAreaYOffset,
                })),
            };
            drawBall(ctx, screenSpaceBall);
        }


    }, [ball, batsman, bat, stumps, gameState, shotDirection, assetsLoaded, batImage, batsmanImage, ballImage, grassImage, canvasRef]);

    return (
        <canvas
            ref={canvasRef}
            aria-label="Cricket game animation"
        />
    );
};

export default GameCanvas;