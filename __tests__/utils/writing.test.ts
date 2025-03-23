import { loadWritingStrategy } from "../../src/utils/writing";
import * as path from "path";
import { WritingStrategy } from "../../src/utils/writing";

// Define paths before jest.mock calls
const CUSTOM_STRATEGY_PATH = path.join(
  __dirname,
  "../../examples/custom-writing.js",
);
const INVALID_STRATEGY_PATH = path.join(
  __dirname,
  "../../examples/invalid-strategy.js",
);

// Mock the keepachangelog strategy
jest.mock("../../src/utils/writing/keepachangelog", () => ({
  __esModule: true,
  default: {
    formatChanges: jest.fn(),
    formatVersionHeader: jest.fn(),
    formatVersionLink: jest.fn(),
    versionHeaderMatcher: jest.fn(),
    changelogHeaderMatcher: jest.fn(),
  },
}));

// Mock the custom strategy
jest.doMock(
  CUSTOM_STRATEGY_PATH,
  () => ({
    formatChanges: jest.fn(),
    formatVersionHeader: jest.fn(),
    formatVersionLink: jest.fn(),
    versionHeaderMatcher: jest.fn(),
    changelogHeaderMatcher: jest.fn(),
  }),
  { virtual: true },
);

// Mock the invalid strategy
jest.doMock(
  INVALID_STRATEGY_PATH,
  () => ({
    formatChanges: jest.fn(),
    // Missing required methods
  }),
  { virtual: true },
);

describe("Writing Strategy Loader", () => {
  const mockStrategy: WritingStrategy = {
    formatChanges: jest.fn(),
    formatVersionHeader: jest.fn(),
    formatVersionLink: jest.fn(),
    versionHeaderMatcher: jest.fn(),
    changelogHeaderMatcher: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe("loadWritingStrategy", () => {
    it("should load keepachangelog strategy", async () => {
      const strategy = await loadWritingStrategy("keepachangelog");
      expect(strategy).toBeDefined();
      expect(strategy.formatChanges).toBeDefined();
      expect(strategy.formatVersionHeader).toBeDefined();
      expect(strategy.formatVersionLink).toBeDefined();
    });

    it("should throw error for unknown strategy", async () => {
      await expect(loadWritingStrategy("unknown")).rejects.toThrow(
        "Unknown writing strategy: unknown",
      );
    });

    it("should load custom strategy from file", async () => {
      const strategy = await loadWritingStrategy(CUSTOM_STRATEGY_PATH);
      expect(strategy).toBeDefined();
      expect(strategy.formatChanges).toBeDefined();
      expect(strategy.formatVersionHeader).toBeDefined();
      expect(strategy.formatVersionLink).toBeDefined();
    });

    it("should throw error if custom strategy is missing required methods", async () => {
      await expect(loadWritingStrategy(INVALID_STRATEGY_PATH)).rejects.toThrow(
        /Writing strategy file .* does not export required methods/,
      );
    });

    it("should throw error if custom strategy file does not exist", async () => {
      await expect(
        loadWritingStrategy("./non-existent-strategy.js"),
      ).rejects.toThrow(/Failed to load writing strategy file/);
    });
  });
});
