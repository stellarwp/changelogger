import { sortChanges } from "../../src/utils/sorting";
import { ChangeFile } from "../../src/types";

describe("sortChanges", () => {
  const createChange = (type: ChangeFile["type"], significance: ChangeFile["significance"], entry: string, timestamp?: string): ChangeFile => ({
    type,
    significance,
    entry,
    timestamp,
  });

  describe("single criterion sorting", () => {
    it("should sort by type alphabetically", () => {
      const changes: ChangeFile[] = [
        createChange("tweak", "patch", "Change 1"),
        createChange("feature", "minor", "Change 2"),
        createChange("fix", "patch", "Change 3"),
        createChange("deprecated", "minor", "Change 4"),
      ];

      sortChanges(changes, ["type"]);

      expect(changes.map(c => c.type)).toEqual(["deprecated", "feature", "fix", "tweak"]);
    });

    it("should sort by significance (major > minor > patch)", () => {
      const changes: ChangeFile[] = [
        createChange("feature", "patch", "Change 1"),
        createChange("feature", "major", "Change 2"),
        createChange("feature", "minor", "Change 3"),
      ];

      sortChanges(changes, ["significance"]);

      expect(changes.map(c => c.significance)).toEqual(["major", "minor", "patch"]);
    });

    it("should sort by content alphabetically", () => {
      const changes: ChangeFile[] = [
        createChange("feature", "minor", "Zebra feature"),
        createChange("feature", "minor", "Apple feature"),
        createChange("feature", "minor", "Mango feature"),
      ];

      sortChanges(changes, ["content"]);

      expect(changes.map(c => c.entry)).toEqual(["Apple feature", "Mango feature", "Zebra feature"]);
    });

    it("should sort by timestamp (oldest first)", () => {
      const changes: ChangeFile[] = [
        createChange("feature", "minor", "Change 1", "2024-03-22T10:00:00Z"),
        createChange("feature", "minor", "Change 2", "2024-03-20T10:00:00Z"),
        createChange("feature", "minor", "Change 3", "2024-03-21T10:00:00Z"),
      ];

      sortChanges(changes, ["timestamp"]);

      expect(changes.map(c => c.entry)).toEqual(["Change 2", "Change 3", "Change 1"]);
    });

    it("should put entries without timestamps last when sorting by timestamp", () => {
      const changes: ChangeFile[] = [
        createChange("feature", "minor", "No timestamp"),
        createChange("feature", "minor", "With timestamp", "2024-03-20T10:00:00Z"),
      ];

      sortChanges(changes, ["timestamp"]);

      expect(changes.map(c => c.entry)).toEqual(["With timestamp", "No timestamp"]);
    });
  });

  describe("multi-criterion sorting", () => {
    it("should sort by type first, then by content within each type", () => {
      const changes: ChangeFile[] = [
        createChange("fix", "patch", "Zebra fix"),
        createChange("feature", "minor", "Beta feature"),
        createChange("fix", "patch", "Alpha fix"),
        createChange("feature", "minor", "Alpha feature"),
      ];

      sortChanges(changes, ["type", "content"]);

      expect(changes.map(c => `${c.type}: ${c.entry}`)).toEqual(["feature: Alpha feature", "feature: Beta feature", "fix: Alpha fix", "fix: Zebra fix"]);
    });

    it("should sort by significance first, then by type, then by content", () => {
      const changes: ChangeFile[] = [
        createChange("fix", "patch", "Patch fix"),
        createChange("tweak", "major", "Major tweak"),
        createChange("feature", "major", "Major feature"),
        createChange("feature", "minor", "Minor feature"),
        createChange("fix", "minor", "Minor fix"),
      ];

      sortChanges(changes, ["significance", "type", "content"]);

      expect(changes.map(c => `${c.significance} ${c.type}: ${c.entry}`)).toEqual([
        "major feature: Major feature",
        "major tweak: Major tweak",
        "minor feature: Minor feature",
        "minor fix: Minor fix",
        "patch fix: Patch fix",
      ]);
    });

    it("should handle the default ordering (type, content)", () => {
      const changes: ChangeFile[] = [
        createChange("tweak", "patch", "Beta tweak"),
        createChange("feature", "major", "Alpha feature"),
        createChange("tweak", "minor", "Alpha tweak"),
        createChange("feature", "patch", "Beta feature"),
      ];

      sortChanges(changes);

      expect(changes.map(c => `${c.type}: ${c.entry}`)).toEqual(["feature: Alpha feature", "feature: Beta feature", "tweak: Alpha tweak", "tweak: Beta tweak"]);
    });

    it("should sort by timestamp within same type", () => {
      const changes: ChangeFile[] = [
        createChange("feature", "minor", "Feature 2", "2024-03-22T10:00:00Z"),
        createChange("fix", "patch", "Fix 1", "2024-03-21T10:00:00Z"),
        createChange("feature", "minor", "Feature 1", "2024-03-20T10:00:00Z"),
        createChange("fix", "patch", "Fix 2", "2024-03-23T10:00:00Z"),
      ];

      sortChanges(changes, ["type", "timestamp"]);

      expect(changes.map(c => `${c.type}: ${c.entry}`)).toEqual(["feature: Feature 1", "feature: Feature 2", "fix: Fix 1", "fix: Fix 2"]);
    });
  });

  describe("edge cases", () => {
    it("should handle empty changes array", () => {
      const changes: ChangeFile[] = [];

      const result = sortChanges(changes, ["type", "content"]);

      expect(result).toEqual([]);
    });

    it("should handle single change", () => {
      const changes: ChangeFile[] = [createChange("feature", "minor", "Single change")];

      sortChanges(changes, ["type", "content"]);

      expect(changes).toHaveLength(1);
      expect(changes[0]?.entry).toBe("Single change");
    });

    it("should handle empty ordering array (maintain original order)", () => {
      const changes: ChangeFile[] = [
        createChange("tweak", "patch", "Change 1"),
        createChange("feature", "minor", "Change 2"),
        createChange("fix", "patch", "Change 3"),
      ];

      sortChanges(changes, []);

      // With empty ordering, items should maintain relative order.
      expect(changes.map(c => c.entry)).toEqual(["Change 1", "Change 2", "Change 3"]);
    });

    it("should return the same array reference (sorts in place) instead of creating a new array", () => {
      const changes: ChangeFile[] = [createChange("tweak", "patch", "Change 1"), createChange("feature", "minor", "Change 2")];

      const result = sortChanges(changes, ["type"]);

      expect(result).toBe(changes);
    });

    it("should handle all entries with same values for a criterion", () => {
      const changes: ChangeFile[] = [
        createChange("feature", "minor", "Zebra"),
        createChange("feature", "minor", "Alpha"),
        createChange("feature", "minor", "Mango"),
      ];

      sortChanges(changes, ["type", "significance", "content"]);

      // All have same type and significance, so sorted by content.
      expect(changes.map(c => c.entry)).toEqual(["Alpha", "Mango", "Zebra"]);
    });
  });
});
