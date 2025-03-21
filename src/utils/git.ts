import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function getBranchName(): Promise<string | null> {
  try {
    const { stdout } = await execAsync("git rev-parse --abbrev-ref HEAD");
    return stdout.trim();
  } catch (error) {
    return null;
  }
}

export async function getCurrentSha(): Promise<string | null> {
  try {
    const { stdout } = await execAsync("git rev-parse HEAD");
    return stdout.trim();
  } catch (error) {
    return null;
  }
}

export async function getRemoteUrl(): Promise<string | null> {
  try {
    const { stdout } = await execAsync("git config --get remote.origin.url");
    return stdout.trim();
  } catch (error) {
    return null;
  }
}
