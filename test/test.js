const { test } = require('shelljs');
const ImageParser = require('../src/ImageParser');

async function testParseImage() {
    const targetImagePath =
        '/Users/sungsupark/Desktop/test/source/이미지자동분류(수빈)/20221031225912_iPhone_11.heic';
    const result = await ImageParser.parseImage(targetImagePath);
    console.log(result);
}

testParseImage();
