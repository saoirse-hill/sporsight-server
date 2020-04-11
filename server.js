const tf = require("@tensorflow/tfjs")
const posenet = require("@tensorflow-models/posenet")
const express = require('express')
const { Image, createCanvas } = require('canvas')
const fs = require('fs')
const uuid = require('uuid')
const request = require('request').defaults({ encoding: null })
const ffmpeg = require('ffmpeg')


const app = express()
const port = 3000;

/* 
//single pose image
single pose video
multi pose image
multi pose video
//image processing 
video processing 
variable strength posenet

* questions:
//- send back keypoints only?
// send back processed media only?
* send back both just in case, individual endpoints? 

todo: hypothetical endpoints
todo: file system
*/

app.get('/', async function (req, res) {
  res.send("sporsight")
})

app.get('/test', async function(req, res) {

  // load posenet
  const net = await posenet.load()
  
  // get file location
  const path = req.query.url || 'https://previews.123rf.com/images/vadymvdrobot/vadymvdrobot1602/vadymvdrobot160200994/52191954-full-length-portrait-of-a-happy-casual-man-standing-isolated-on-a-white-background.jpg'

  // generate file names and paths
  const idOriginal = uuid.v4()
  const originalPath = `./${idOriginal}.jpg`
  const idModified = uuid.v4()
  const modifiedPath = `./${idModified}.jpg`

  // fetch original
  download(path, originalPath, async () => {

    // prep image data
    const img = new Image()
    img.src = originalPath
    const canvas = createCanvas(img.width, img.height)
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // estimate
    const input = tf.browser.fromPixels(canvas);
    const pose = await net.estimateSinglePose(input)

    ctx.lineWidth = 5

    // draw joints
    pose.keypoints.map(keypoint => {
      ctx.fillRect((keypoint.position.x), keypoint.position.y, 10, 10)
    })

    // draw skeleton
    skeletonPairs.map(pair => {

      // locate points
      const x1 = (pose.keypoints.find(keypoint => keypoint.part == pair.pair[0])).position.x
      const x2 = (pose.keypoints.find(keypoint => keypoint.part == pair.pair[1])).position.x
      const y1 = (pose.keypoints.find(keypoint => keypoint.part == pair.pair[0])).position.y
      const y2 = (pose.keypoints.find(keypoint => keypoint.part == pair.pair[1])).position.y
  
      // draw line
      ctx.beginPath()
      ctx.moveTo(x1,y1)
      ctx.lineTo(x2,y2)
      ctx.stroke()
    })

    // prepare modifed image
    let dataURL = canvas.toDataURL("image/jpeg")
    let base64= dataURL.replace('data:image/jpeg;base64,', '')
    let buf = new Buffer(base64, 'base64')

    // return modified image
    fs.writeFile(modifiedPath, buf, 'binary', function (err, result) {
      if(err) console.log('error', err)
      res.sendFile(modifiedPath, { root: __dirname })
    })
  })
})

let download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

app.listen(port, () => console.log(`sporsight listening at http://localhost:${port}`))

const skeletonPairs = [
  {
    id: "lowerLeftLeg",
    pair: ["leftAnkle", "leftKnee"]
  },
  {
    id: "upperLeftLeg",
    pair: ["leftKnee", "leftHip"]
  },
  {
    id: "lowerRightLeg",
    pair: ["rightAnkle", "rightKnee"]
  },
  {
    id: "upperRightLeg",
    pair: ["rightKnee", "rightHip"]
  },
  {
    id: "hips",
    pair: ["leftHip", "rightHip"]
  },
  {
    id: "leftSide",
    pair: ["leftHip", "leftShoulder"]
  },
  {
    id: "rightSide",
    pair: ["rightHip", "rightShoulder"]
  },
  {
    id: "shoulders",
    pair: ["leftShoulder", "rightShoulder"]
  },
  {
    id: "lowerLeftArm",
    pair: ["leftWrist", "leftElbow"]
  },
  {
    id: "upperLeftArm",
    pair: ["leftElbow", "leftShoulder"]
  },
  {
    id: "lowerRightArm",
    pair: ["rightWrist", "rightElbow"]
  },
  {
    id: "upperRightArm",
    pair: ["rightElbow", "rightShoulder"]
  }
]