import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Import after mocking
import {
  threadsApi,
  companiesApi,
  leadsApi,
  sourcesApi,
  statsApi,
} from "../lib/api";

describe("API Client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  function mockJsonResponse(data: any, status = 200) {
    mockFetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
    });
  }

  describe("threadsApi", () => {
    it("list should call correct endpoint with tenant in path", async () => {
      mockJsonResponse([]);

      await threadsApi.list("sesamy");

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tenants/sesamy/threads");
    });

    it("list should pass filter params as query string", async () => {
      mockJsonResponse([]);

      await threadsApi.list("authhero", {
        status: "new",
        platform: "reddit",
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("status=new");
      expect(calledUrl).toContain("platform=reddit");
    });

    it("get should fetch single thread by id", async () => {
      mockJsonResponse({ id: "thread-1", title: "Test" });

      await threadsApi.get("sesamy", "thread-1");

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tenants/sesamy/threads/thread-1");
    });

    it("update should send PUT with data", async () => {
      mockJsonResponse({ id: "thread-1", status: "reviewed" });

      await threadsApi.update("sesamy", "thread-1", { status: "reviewed" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/tenants/sesamy/threads/thread-1"),
        expect.objectContaining({
          method: "PUT",
        })
      );
    });
  });

  describe("companiesApi", () => {
    it("list should call correct endpoint", async () => {
      mockJsonResponse([]);

      await companiesApi.list("sesamy");

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tenants/sesamy/companies");
    });

    it("create should POST with body", async () => {
      mockJsonResponse({ id: "co-1", name: "Test Co" }, 200);

      await companiesApi.create("authhero", {
        tenantId: "authhero",
        name: "Test Co",
        status: "new",
      } as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/tenants/authhero/companies"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Test Co"),
        })
      );
    });
  });

  describe("leadsApi", () => {
    it("list should include tenant in path", async () => {
      mockJsonResponse([]);

      await leadsApi.list("authhero");

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tenants/authhero/leads");
    });
  });

  describe("sourcesApi", () => {
    it("list should call correct endpoint", async () => {
      mockJsonResponse([]);

      await sourcesApi.list("sesamy");

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tenants/sesamy/sources");
    });
  });

  describe("statsApi", () => {
    it("get should call correct endpoint", async () => {
      mockJsonResponse({ threads: 0, leads: 0 });

      await statsApi.get("sesamy");

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tenants/sesamy/stats");
    });
  });

  describe("error handling", () => {
    it("should throw on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      });

      await expect(threadsApi.list("sesamy")).rejects.toThrow("API error: 500");
    });
  });
});
