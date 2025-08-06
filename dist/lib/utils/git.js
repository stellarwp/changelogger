"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBranchName = getBranchName;
exports.getCurrentSha = getCurrentSha;
exports.getRemoteUrl = getRemoteUrl;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function getBranchName() {
    try {
        const { stdout } = await execAsync("git rev-parse --abbrev-ref HEAD");
        return stdout.trim();
    }
    catch (error) {
        return null;
    }
}
async function getCurrentSha() {
    try {
        const { stdout } = await execAsync("git rev-parse HEAD");
        return stdout.trim();
    }
    catch (error) {
        return null;
    }
}
async function getRemoteUrl() {
    try {
        const { stdout } = await execAsync("git config --get remote.origin.url");
        return stdout.trim();
    }
    catch (error) {
        return null;
    }
}
