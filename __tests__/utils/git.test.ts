import { getBranchName, getCurrentSha, getRemoteUrl } from "../../src/utils/git";
import { exec } from "child_process";

// Mock child_process.exec
jest.mock("child_process", () => ({
  exec: jest.fn(),
}));

const mockedExec = exec as jest.MockedFunction<typeof exec>;

describe("git utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getBranchName", () => {
    it("should return current branch name", async () => {
      mockedExec.mockImplementation((cmd, callback: any) => {
        callback(null, { stdout: "main\n" });
        return {} as any;
      });

      const branch = await getBranchName();
      expect(branch).toBe("main");
    });

    it("should return null on error", async () => {
      mockedExec.mockImplementation((cmd, callback: any) => {
        callback(new Error("git error"));
        return {} as any;
      });

      const branch = await getBranchName();
      expect(branch).toBeNull();
    });
  });

  describe("getCurrentSha", () => {
    it("should return current commit SHA", async () => {
      const sha = "1234567890abcdef";
      mockedExec.mockImplementation((cmd, callback: any) => {
        callback(null, { stdout: `${sha}\n` });
        return {} as any;
      });

      const result = await getCurrentSha();
      expect(result).toBe(sha);
    });

    it("should return null on error", async () => {
      mockedExec.mockImplementation((cmd, callback: any) => {
        callback(new Error("git error"));
        return {} as any;
      });

      const result = await getCurrentSha();
      expect(result).toBeNull();
    });
  });

  describe("getRemoteUrl", () => {
    it("should return remote URL", async () => {
      const url = "git@github.com:user/repo.git";
      mockedExec.mockImplementation((cmd, callback: any) => {
        callback(null, { stdout: `${url}\n` });
        return {} as any;
      });

      const result = await getRemoteUrl();
      expect(result).toBe(url);
    });

    it("should return null on error", async () => {
      mockedExec.mockImplementation((cmd, callback: any) => {
        callback(new Error("git error"));
        return {} as any;
      });

      const result = await getRemoteUrl();
      expect(result).toBeNull();
    });
  });
});
