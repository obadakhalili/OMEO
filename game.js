import P5 from "p5"
import p5Play from "@obadakhalili/p5.play"
import { Howl } from "howler"
import * as poseDetection from "@tensorflow-models/pose-detection"
import "@tensorflow/tfjs-core"
import "@tensorflow/tfjs-backend-webgl"
import "@mediapipe/pose"

import "./style.css"

p5Play(P5)

new P5((p5) => {
  p5.setup = setup(p5)
  p5.draw = draw(p5)
}, document.getElementById("game"))

const programVars = {
  sprites: {},
  UIs: {},
  sounds: {
    backgroundMusic: new Howl({
      src: ["./assets/sounds/background-music.ogg"],
      loop: true,
      volume: 0.5,
    }),
    hitSound: new Howl({
      src: ["./assets/sounds/hit-sound.ogg"],
      volume: 0.5,
    }),
    loseSound: new Howl({
      src: ["./assets/sounds/lose-sound.ogg"],
      loop: false,
      volume: 0.5,
    }),
    winSound: new Howl({
      src: ["./assets/sounds/win-sound.ogg"],
      loop: false,
      volume: 0.5,
    }),
  },
  gameSettings: {
    totalLivesCount: 3,
    passesCountPerLevel: 2,
    totalLevelsCount: 3,
    birdInitialVelocity: -5,
  },
  gameState: {},
  isInitialFrameAfterLoading: true,
}

programVars.remainingLivesCount = programVars.totalLivesCount

export function setup(p5) {
  return () => {
    p5.createCanvas(640, 480).text("Loading...", p5.width / 2, p5.height / 2)

    programVars.cameraCapture = p5.createCapture(p5.VIDEO)
    programVars.cameraCapture.size(p5.width, p5.height).hide()

    programVars.gameBackground = p5.loadImage("./assets/backgrounds/sky.png")

    programVars.firstBirdInitialPosition = {
      x: p5.width,
      y: 150,
    }
    programVars.secondBirdInitialPosition = {
      x: p5.width + p5.width * 0.85,
      y: 250,
    }

    programVars.sprites.firstBird = p5.createSprite(
      programVars.firstBirdInitialPosition.x,
      programVars.firstBirdInitialPosition.y,
    )
    programVars.sprites.firstBird.addAnimation(
      "normal",
      "assets/sprites/bird-1/frame-1.png",
      "assets/sprites/bird-1/frame-8.png",
    )
    programVars.sprites.firstBird.scale = 0.2
    programVars.sprites.firstBird.mirrorX(-1)

    programVars.sprites.secondBird = p5.createSprite(
      programVars.secondBirdInitialPosition.x,
      programVars.secondBirdInitialPosition.y,
    )
    programVars.sprites.secondBird.addAnimation(
      "normal",
      "assets/sprites/bird-2/frame-1.png",
      "assets/sprites/bird-2/frame-17.png",
    )
    programVars.sprites.secondBird.scale = 0.1
    programVars.sprites.secondBird.mirrorX(-1)

    programVars.UIs.nextLevelButton = p5.createButton("Next Level")
    programVars.UIs.nextLevelButton.position("50%", "50%")
    programVars.UIs.nextLevelButton.addClass("button")
    programVars.UIs.nextLevelButton.hide()
    programVars.UIs.nextLevelButton.mousePressed(function () {
      programVars.sprites.firstBird.velocity.x -= 5
      programVars.sprites.secondBird.velocity.x -= 5
      this.hide()
      p5.loop()
    })

    programVars.UIs.restartGameButton = p5.createButton("Restart Game")
    programVars.UIs.restartGameButton.position("50%", "50%")
    programVars.UIs.restartGameButton.addClass("button")
    programVars.UIs.restartGameButton.hide()
    programVars.UIs.restartGameButton.mousePressed(function () {
      resetGame()
      this.hide()
      p5.loop()
    })

    poseDetection
      .createDetector(poseDetection.SupportedModels.BlazePose, {
        runtime: "mediapipe",
        solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/pose",
        enableSegmentation: true,
      })
      .then((detector) => (programVars.blazePoze = detector))
  }
}

export function draw(p5) {
  return () => {
    if (
      programVars.blazePoze &&
      programVars.cameraCapture.elt.readyState === 4
    ) {
      programVars.blazePoze
        .estimatePoses(programVars.cameraCapture.elt, { flipHorizontal: true })
        .then(([{ keypoints, segmentation } = {}]) => {
          if (programVars.isInitialFrameAfterLoading) {
            resetGame()
            programVars.isInitialFrameAfterLoading = false
          }

          if (keypoints) {
            segmentation.mask.toImageData().then(({ data: segImageData }) => {
              p5.background(programVars.gameBackground)

              addPlayerSegToCanvas(segImageData, p5)

              p5.drawSprites()

              if (programVars.gameState.remainingLivesCount > 0) {
                p5.textSize(25)
                p5.textAlign(p5.LEFT)
                p5.text(
                  "LEVELS = " + programVars.gameState.remainingLivesCount,
                  15,
                  25,
                )
                p5.fill(255)
              } else {
                p5.noLoop()
                p5.background(0, 0, 0, 0.5 * 255)
                p5.textSize(40)
                p5.textAlign(p5.CENTER)
                p5.text("Game Over", p5.width / 2, p5.height * 0.25)
                p5.fill(255)
                programVars.UIs.restartGameButton.show()
                programVars.sounds.backgroundMusic.stop()
                programVars.sounds.loseSound.play()
              }

              if (
                programVars.gameState.isPlayerSolid &&
                keypoints.some(
                  ({ x, y }) =>
                    programVars.sprites.firstBird.overlapPoint(x, y) ||
                    programVars.sprites.secondBird.overlapPoint(x, y),
                )
              ) {
                programVars.sounds.hitSound.play()
                programVars.gameState.remainingLivesCount--
                programVars.gameState.isPlayerSolid = false
                setTimeout(
                  () => (programVars.gameState.isPlayerSolid = true),
                  1500,
                )
              }

              if (programVars.sprites.secondBird.position.x < 0) {
                programVars.gameState.completeSpritesPassesCount++

                resetSpritesPosition()

                if (
                  programVars.gameState.completeSpritesPassesCount %
                    programVars.gameSettings.passesCountPerLevel ===
                  0
                ) {
                  programVars.gameState.playedLevelsCount++

                  p5.noLoop()

                  if (
                    programVars.gameState.playedLevelsCount ===
                    programVars.gameSettings.totalLevelsCount
                  ) {
                    // TODO: game won screen
                    programVars.sounds.backgroundMusic.stop()
                    programVars.sounds.winSound.play()
                    programVars.UIs.restartGameButton.show()
                  } else {
                    programVars.UIs.nextLevelButton.show()
                  }
                }
              }
            })
          } else {
            // TODO: stand by camera screen
          }
        })
    }
  }
}

function addPlayerSegToCanvas(segImageData, p5) {
  const frameGraphics = p5.createGraphics(
    programVars.cameraCapture.elt.width,
    programVars.cameraCapture.elt.height,
  )

  frameGraphics.translate(frameGraphics.width, 0)
  frameGraphics.scale(-1, 1)
  frameGraphics.drawingContext.drawImage(programVars.cameraCapture.elt, 0, 0)
  frameGraphics.translate(-frameGraphics.width, 0)
  frameGraphics.scale(1, 1)

  frameGraphics.loadPixels()

  // TODO: consider detecting collision here
  for (
    let framePixelDensity = frameGraphics.pixelDensity(), row = 0;
    row < frameGraphics.height;
    ++row
  ) {
    for (let col = 0; col < frameGraphics.width; ++col) {
      if (segImageData[(row * frameGraphics.width + col) * 4 + 3] / 255 < 0.5) {
        updateP5Pixel(
          row,
          col,
          frameGraphics.width,
          framePixelDensity,
          (baseIndex) => (frameGraphics.pixels[baseIndex + 3] = 0),
        )
      } else if (!programVars.gameState.isPlayerSolid) {
        updateP5Pixel(
          row,
          col,
          frameGraphics.width,
          framePixelDensity,
          (baseIndex) => (frameGraphics.pixels[baseIndex + 3] = 0.5 * 255),
        )
      }
    }
  }

  frameGraphics.updatePixels()

  p5.image(frameGraphics, 0, 0)

  frameGraphics.remove()
}

function resetSpritesPosition() {
  programVars.sprites.firstBird.position.x =
    programVars.firstBirdInitialPosition.x
  programVars.sprites.firstBird.position.y =
    programVars.firstBirdInitialPosition.y
  programVars.sprites.secondBird.position.x =
    programVars.secondBirdInitialPosition.x
  programVars.sprites.secondBird.position.y =
    programVars.secondBirdInitialPosition.y
}

function resetSpritesVelocity() {
  programVars.sprites.firstBird.velocity.x =
    programVars.gameSettings.birdInitialVelocity
  programVars.sprites.secondBird.velocity.x =
    programVars.gameSettings.birdInitialVelocity
}

function resetGame() {
  resetSpritesPosition()
  resetSpritesVelocity()
  programVars.gameState.remainingLivesCount =
    programVars.gameSettings.totalLivesCount
  programVars.gameState.completeSpritesPassesCount = 0
  programVars.gameState.playedLevelsCount = 0
  programVars.gameState.isPlayerSolid = true
  programVars.sounds.loseSound.stop()
  programVars.sounds.winSound.stop()
  programVars.sounds.backgroundMusic.play()
}

function updateP5Pixel(row, col, width, pixelDensity, updatePixel) {
  for (let i = 0; i < pixelDensity; ++i) {
    for (let j = 0; j < pixelDensity; ++j) {
      const index =
        4 *
        ((row * pixelDensity + j) * width * pixelDensity +
          (col * pixelDensity + i))
      updatePixel(index)
    }
  }
}
