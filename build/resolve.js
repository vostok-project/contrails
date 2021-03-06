/* eslint-disable import/unambiguous */
const path = require("path");

exports.extensions = [".js", ".jsx", ".ts", ".tsx"];

exports.createAliases = function createAliases() {
    return {
        ui: path.join(__dirname, "../src/commons/ui"),
        commons: path.join(__dirname, "../src/commons"),
    };
};
