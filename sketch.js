let bodyPixNet;

function preload() {
  gameBackground = loadImage("assets/game-background.png");
  bodyPix.load().then((net) => (bodyPixNet = net));
}

function setup() {
  width = 640;
  height = 480;

  createCanvas(width, height);

  cameraCapture = createCapture(VIDEO);
  cameraCapture.hide();

  cuteCircle = createSprite(400, 200);
  cuteCircle.addAnimation(
    "floating",
    "assets/obstacles/asterisk-circle-0.png",
    "assets/obstacles/asterisk-circle-8.png"
  );
  cuteCircle.velocity.x = -5;

  text("Loading...", width / 2, height / 2);
}

function draw() {
  if (bodyPixNet && cameraCapture.elt.readyState === 4) {
    bodyPixNet.segmentPerson(cameraCapture.elt).then(({ data: seg }) => {
      background(gameBackground);

      addPlayerToCanvas(seg);

      if (cuteCircle.position.x < 0) {
        cuteCircle.position.x = width;
      }
      drawSprites();
    });
  }
}

function addPlayerToCanvas(seg) {
  const frameGraphics = createGraphics(
    cameraCapture.elt.width,
    cameraCapture.elt.height
  );

  frameGraphics.drawingContext.drawImage(cameraCapture.elt, 0, 0);

  frameGraphics.loadPixels();

  for (
    let framePixelDensity = frameGraphics.pixelDensity(), row = 0;
    row < frameGraphics.height;
    ++row
  ) {
    for (let col = 0; col < frameGraphics.width; ++col) {
      if (seg[row * frameGraphics.width + col] === 0) {
        for (let i = 0; i < framePixelDensity; ++i) {
          for (let j = 0; j < framePixelDensity; ++j) {
            index =
              4 *
              ((row * framePixelDensity + j) *
                frameGraphics.width *
                framePixelDensity +
                (col * framePixelDensity + i));
            frameGraphics.pixels[index + 3] = 0;
          }
        }
      }
    }
  }

  frameGraphics.updatePixels();

  image(frameGraphics, 0, 0);

  frameGraphics.remove();
}
