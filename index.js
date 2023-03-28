const { createCanvas, loadImage } = require('canvas');
const Tesseract = require('tesseract.js');
const cv = require('opencv4nodejs');
const jimp = require('jimp');

async function extractDetailsFromGovtID(imagePath) {
  // Read the image
  const image = await jimp.read(imagePath);

  // Preprocess the image
  const mat = cv.imread(imagePath);
  const grayMat = mat.bgrToGray();
  const thresholdedMat = grayMat.threshold(127, 255, cv.THRESH_BINARY);
  const contours = thresholdedMat.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  const contour = contours.sort((c0, c1) => c1.area - c0.area)[0];
  const rect = contour.boundingRect();
  const croppedMat = thresholdedMat.getRegion(rect);
  const croppedImage = cv.imencode('.jpg', croppedMat).toString('base64');
  const processedImage = await loadImage(Buffer.from(croppedImage, 'base64'));

  // Apply OCR
  const { data } = await Tesseract.recognize(processedImage);

  // Extract the required information
  const panCardRegEx = /([A-Z]{5}[0-9]{4}[A-Z])/g;
  const aadharCardRegEx = /\d{4}\s\d{4}\s\d{4}/g;
  const panCardDetails = data.match(panCardRegEx);
  const aadharCardDetails = data.match(aadharCardRegEx);

  // Store the extracted details in a JSON object
  const extractedDetails = {
    panCardDetails: panCardDetails ? panCardDetails[0] : null,
    aadharCardDetails: aadharCardDetails ? aadharCardDetails[0] : null,
  };

  // Return the extracted details in JSON format
  return JSON.stringify(extractedDetails);
}

// Usage
extractDetailsFromGovtID('path/to/image.jpg').then(console.log).catch(console.error);
