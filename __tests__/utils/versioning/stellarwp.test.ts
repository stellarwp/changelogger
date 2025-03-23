import stellarStrategy from "../../../src/utils/versioning/stellarwp";

describe("StellarWP versioning strategy", () => {
  describe("isValidVersion", () => {
    it("should accept valid 3-part versions", () => {
      expect(stellarStrategy.isValidVersion("1.2.3")).toBe(true);
      expect(stellarStrategy.isValidVersion("0.0.0")).toBe(true);
      expect(stellarStrategy.isValidVersion("10.20.30")).toBe(true);
    });

    it("should accept valid 4-part versions with hotfix", () => {
      expect(stellarStrategy.isValidVersion("1.2.3.4")).toBe(true);
      expect(stellarStrategy.isValidVersion("0.0.0.1")).toBe(true);
      expect(stellarStrategy.isValidVersion("10.20.30.40")).toBe(true);
    });

    it("should reject invalid versions", () => {
      expect(stellarStrategy.isValidVersion("1.2")).toBe(false);
      expect(stellarStrategy.isValidVersion("1.2.3.4.5")).toBe(false);
      expect(stellarStrategy.isValidVersion("1.2.3.a")).toBe(false);
      expect(stellarStrategy.isValidVersion("a.b.c")).toBe(false);
      expect(stellarStrategy.isValidVersion("1.2.3-beta")).toBe(false);
      expect(stellarStrategy.isValidVersion("")).toBe(false);
    });
  });

  describe("getNextVersion", () => {
    describe("major version increment", () => {
      it("should increment major and reset others from 3-part version", () => {
        expect(stellarStrategy.getNextVersion("1.2.3", "major")).toBe("2.0.0");
      });

      it("should increment major and reset others from 4-part version", () => {
        expect(stellarStrategy.getNextVersion("1.2.3.4", "major")).toBe("2.0.0");
      });
    });

    describe("minor version increment", () => {
      it("should increment minor and reset patch from 3-part version", () => {
        expect(stellarStrategy.getNextVersion("1.2.3", "minor")).toBe("1.3.0");
      });

      it("should increment minor and reset patch and hotfix from 4-part version", () => {
        expect(stellarStrategy.getNextVersion("1.2.3.4", "minor")).toBe("1.3.0");
      });
    });

    describe("patch version increment", () => {
      it("should increment patch from 3-part version", () => {
        expect(stellarStrategy.getNextVersion("1.2.3", "patch")).toBe("1.2.4");
      });

      it("should increment hotfix when present", () => {
        expect(stellarStrategy.getNextVersion("1.2.3.4", "patch")).toBe("1.2.3.5");
      });

      it("should increment patch and not show hotfix when hotfix is 0", () => {
        expect(stellarStrategy.getNextVersion("1.2.3.0", "patch")).toBe("1.2.4");
      });
    });
  });

  describe("compareVersions", () => {
    it("should compare major versions correctly", () => {
      expect(stellarStrategy.compareVersions("2.0.0", "1.0.0")).toBeGreaterThan(0);
      expect(stellarStrategy.compareVersions("1.0.0", "2.0.0")).toBeLessThan(0);
    });

    it("should compare minor versions correctly", () => {
      expect(stellarStrategy.compareVersions("1.2.0", "1.1.0")).toBeGreaterThan(0);
      expect(stellarStrategy.compareVersions("1.1.0", "1.2.0")).toBeLessThan(0);
    });

    it("should compare patch versions correctly", () => {
      expect(stellarStrategy.compareVersions("1.1.2", "1.1.1")).toBeGreaterThan(0);
      expect(stellarStrategy.compareVersions("1.1.1", "1.1.2")).toBeLessThan(0);
    });

    it("should compare hotfix versions correctly", () => {
      expect(stellarStrategy.compareVersions("1.1.1.2", "1.1.1.1")).toBeGreaterThan(0);
      expect(stellarStrategy.compareVersions("1.1.1.1", "1.1.1.2")).toBeLessThan(0);
    });

    it("should handle comparing 3-part and 4-part versions", () => {
      expect(stellarStrategy.compareVersions("1.1.1", "1.1.1.0")).toBe(0);
      expect(stellarStrategy.compareVersions("1.1.1", "1.1.1.1")).toBeLessThan(0);
      expect(stellarStrategy.compareVersions("1.1.2", "1.1.1.1")).toBeGreaterThan(0);
    });

    it("should consider versions equal when they are the same", () => {
      expect(stellarStrategy.compareVersions("1.2.3", "1.2.3")).toBe(0);
      expect(stellarStrategy.compareVersions("1.2.3.0", "1.2.3")).toBe(0);
      expect(stellarStrategy.compareVersions("1.2.3.4", "1.2.3.4")).toBe(0);
    });

    it("should handle versions with leading zeros", () => {
      expect(stellarStrategy.compareVersions("1.02.3", "1.2.3")).toBe(0);
      expect(stellarStrategy.compareVersions("01.2.3", "1.2.3")).toBe(0);
    });
  });

  describe("version formatting", () => {
    it("should format version without hotfix when hotfix is 0", () => {
      expect(stellarStrategy.getNextVersion("1.2.3.0", "patch")).toBe("1.2.4");
      expect(stellarStrategy.getNextVersion("1.2.3", "patch")).toBe("1.2.4");
    });

    it("should preserve hotfix number when incrementing hotfix", () => {
      expect(stellarStrategy.getNextVersion("1.2.3.1", "patch")).toBe("1.2.3.2");
    });

    it("should handle version with all zeros", () => {
      expect(stellarStrategy.getNextVersion("0.0.0", "patch")).toBe("0.0.1");
      expect(stellarStrategy.getNextVersion("0.0.0.0", "patch")).toBe("0.0.1");
    });
  });
});
