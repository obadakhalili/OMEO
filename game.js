import P5 from "p5"
import p5Play from "@obadakhalili/p5.play"
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
  completeSpritesPassesCount: 0,
  passesCountPerLevel: 2,
  totalLevelsCount: 3,
  playedLevelsCount: 0,
  birdInitialVelocity: -5,
}

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
    programVars.sprites.firstBird.velocity.x = programVars.birdInitialVelocity

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
    programVars.sprites.secondBird.velocity.x = programVars.birdInitialVelocity

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
      resetSpritesPosition()
      resetSpritesVelocity()
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
    // TODO: fix sprites are moving before game is ready
    if (
      programVars.blazePoze &&
      programVars.cameraCapture.elt.readyState === 4
    ) {
      programVars.blazePoze
        .estimatePoses(programVars.cameraCapture.elt, { flipHorizontal: true })
        .then(([{ keypoints, segmentation } = {}]) => {
          if (keypoints) {
            segmentation.mask.toImageData().then(({ data: segImageData }) => {
              p5.background(programVars.gameBackground)

              addPlayerSegToCanvas(segImageData, p5)

              p5.drawSprites()

              if (
                keypoints.some(
                  ({ x, y }) =>
                    programVars.sprites.firstBird.overlapPoint(x, y) ||
                    programVars.sprites.secondBird.overlapPoint(x, y),
                )
              ) {
                p5.background(0, 0, 0, 0.5 * 255)
                p5.textSize(40)
                p5.textAlign(p5.CENTER)
                p5.text("Game Over", p5.width / 2, p5.height * 0.25)
                p5.fill(255)
                p5.noLoop()
                programVars.UIs.restartGameButton.show()
              }

              if (programVars.sprites.secondBird.position.x < 0) {
                programVars.completeSpritesPassesCount++

                resetSpritesPosition()

                if (
                  programVars.completeSpritesPassesCount %
                    programVars.passesCountPerLevel ===
                  0
                ) {
                  programVars.playedLevelsCount++

                  p5.noLoop()

                  if (
                    programVars.playedLevelsCount ===
                    programVars.totalLevelsCount
                  ) {
                    // TODO: game won screen
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

  for (
    let framePixelDensity = frameGraphics.pixelDensity(), row = 0;
    row < frameGraphics.height;
    ++row
  ) {
    for (let col = 0; col < frameGraphics.width; ++col) {
      if (segImageData[(row * frameGraphics.width + col) * 4 + 3] / 255 < 0.5) {
        for (let i = 0; i < framePixelDensity; ++i) {
          for (let j = 0; j < framePixelDensity; ++j) {
            const index =
              4 *
              ((row * framePixelDensity + j) *
                frameGraphics.width *
                framePixelDensity +
                (col * framePixelDensity + i))
            frameGraphics.pixels[index + 3] = 0
          }
        }
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
  programVars.sprites.firstBird.velocity.x = programVars.birdInitialVelocity
  programVars.sprites.secondBird.velocity.x = programVars.birdInitialVelocity
}
