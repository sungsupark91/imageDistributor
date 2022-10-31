const { test } = require('shelljs');
const ImageParser = require('../src/ImageParser');

async function testParseImage() {
    const targetImagePath = '/Users/sungsupark/Desktop/download/lp_image_2.MOV';
    const result = await ImageParser.parseImage(targetImagePath);
    console.log(result);
}

testParseImage();
