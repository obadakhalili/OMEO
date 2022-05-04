let bodyPixNet;

function setup() {
  width = 640;
  height = 480;

  createCanvas(width, height);

  cameraCapture = createCapture(VIDEO);
  cameraCapture.hide();

  gameBackground = loadImage("assets/game-background.png");

  cuteCircle = createSprite(400, 200);
  cuteCircle.addAnimation(
    "floating",
    "assets/obstacles/asterisk-circle-0.png",
    "assets/obstacles/asterisk-circle-8.png"
  );
  cuteCircle.velocity.x = -5;

  bodyPix.load().then((net) => (bodyPixNet = net));

  text("Loading...", width / 2, height / 2);
}

function draw() {
  if (bodyPixNet && cameraCapture.elt.readyState === 4) {
    bodyPixNet
      .segmentPerson(cameraCapture.elt)
      .then(({ data: seg, allPoses: [{ keypoints } = {}] }) => {
        background(gameBackground);

        addPlayerToCanvas(seg);

        if (
          keypoints?.some(({ position: { x: landmarkX, y: landmarkY } }) =>
            cuteCircle.overlapPoint(landmarkX, landmarkY)
          )
        ) {
          noLoop();
        }

        if (cuteCircle.position.x < 0) {
          cuteCircle.position.x = width;
        }
        cuteCircle.debug = mouseIsPressed;
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
            const index =
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
