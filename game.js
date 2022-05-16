import P5 from "p5"
import p5Play from "@obadakhalili/p5.play"
import * as tf from "@tensorflow/tfjs"
import * as bodyPix from "@tensorflow-models/body-pix"

import "./style.css"

p5Play(P5)

new P5((p5) => {
  p5.setup = setup(p5)
  p5.draw = draw(p5)
}, document.getElementById("game"))

const programVars = {}

export function setup(p5) {
  return () => {
    p5.createCanvas(640, 480).text("Loading...", p5.width / 2, p5.height / 2)

    programVars.cameraCapture = p5.createCapture(p5.VIDEO)
    programVars.cameraCapture.size(p5.width, p5.height).hide()

    programVars.gameBackground = p5.loadImage("assets/game-background.png")

    tf.ready()
      .then(bodyPix.load)
      .then((net) => (programVars.bodyPixNet = net))
  }
}

export function draw(p5) {
  return () => {
    if (
      programVars.bodyPixNet &&
      programVars.cameraCapture.elt.readyState === 4
    ) {
      programVars.bodyPixNet
        .segmentPerson(programVars.cameraCapture.elt)
        .then(({ data: seg, allPoses: [{ keypoints } = {}] }) => {
          p5.background(programVars.gameBackground)

          addPlayerSegToCanvas(seg, p5)

          p5.drawSprites()
        })
    }
  }
}

function addPlayerSegToCanvas(seg, p5) {
  const frameGraphics = p5.createGraphics(
    programVars.cameraCapture.elt.width,
    programVars.cameraCapture.elt.height,
  )

  frameGraphics.drawingContext.drawImage(programVars.cameraCapture.elt, 0, 0)

  frameGraphics.loadPixels()

  for (
    let framePixelDensity = frameGraphics.pixelDensity(), row = 0;
    row < frameGraphics.height;
    ++row
  ) {
    for (let col = 0; col < frameGraphics.width; ++col) {
      if (seg[row * frameGraphics.width + col] === 0) {
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
