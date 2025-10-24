/**
 * Unit tests for SpotifyEmbed Component
 * Tests embed rendering, error handling, and user interactions
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SpotifyEmbed from "./SpotifyEmbed";

describe("SpotifyEmbed Component", () => {
  describe("Rendering", () => {
    test("renders loading state initially", () => {
      render(<SpotifyEmbed trackId="123abc" />);

      expect(screen.getByText(/Loading Spotify player/i)).toBeInTheDocument();
    });

    test("renders iframe with correct Spotify embed URL", () => {
      const { container } = render(<SpotifyEmbed trackId="123abc" />);

      const iframe = container.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toContain(
        "https://open.spotify.com/embed/track/123abc"
      );
    });

    test("renders with compact height when compact prop is true", () => {
      const { container } = render(
        <SpotifyEmbed trackId="123abc" compact={true} />
      );

      const iframe = container.querySelector("iframe");
      expect(iframe).toHaveAttribute("height", "80");
    });

    test("renders with full height when compact prop is false", () => {
      const { container } = render(
        <SpotifyEmbed trackId="123abc" compact={false} />
      );

      const iframe = container.querySelector("iframe");
      expect(iframe).toHaveAttribute("height", "152");
    });

    test("does not render when trackId is null", () => {
      const { container } = render(<SpotifyEmbed trackId={null} />);

      expect(container.firstChild).toBeNull();
    });

    test("does not render when trackId is undefined", () => {
      const { container } = render(<SpotifyEmbed trackId={undefined} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Track ID Handling", () => {
    test("extracts track ID from full Spotify URI", () => {
      const { container } = render(
        <SpotifyEmbed trackId="spotify:track:123abc" />
      );

      const iframe = container.querySelector("iframe");
      expect(iframe.src).toContain(
        "https://open.spotify.com/embed/track/123abc"
      );
      expect(iframe.src).not.toContain("spotify:track:");
    });

    test("handles track ID with colon separator", () => {
      const { container } = render(<SpotifyEmbed trackId="track:456def" />);

      const iframe = container.querySelector("iframe");
      expect(iframe.src).toContain("/456def");
    });

    test("uses track ID as-is when no special formatting", () => {
      const { container } = render(<SpotifyEmbed trackId="789ghi" />);

      const iframe = container.querySelector("iframe");
      expect(iframe.src).toContain(
        "https://open.spotify.com/embed/track/789ghi"
      );
    });
  });

  describe("Loading States", () => {
    test("shows loading spinner before iframe loads", () => {
      render(<SpotifyEmbed trackId="123abc" />);

      expect(screen.getByText(/Loading Spotify player/i)).toBeInTheDocument();
      expect(document.querySelector(".loading-spinner")).toBeInTheDocument();
    });

    test("hides loading state after iframe loads", async () => {
      const { container } = render(<SpotifyEmbed trackId="123abc" />);

      const iframe = container.querySelector("iframe");
      fireEvent.load(iframe);

      await waitFor(() => {
        expect(
          screen.queryByText(/Loading Spotify player/i)
        ).not.toBeInTheDocument();
      });
    });

    test("iframe is hidden until loaded", () => {
      const { container } = render(<SpotifyEmbed trackId="123abc" />);

      const iframe = container.querySelector("iframe");
      expect(iframe).toHaveStyle({ display: "none" });
    });

    test("iframe is visible after loading", async () => {
      const { container } = render(<SpotifyEmbed trackId="123abc" />);

      const iframe = container.querySelector("iframe");
      fireEvent.load(iframe);

      await waitFor(() => {
        expect(iframe).toHaveStyle({ display: "block" });
      });
    });
  });

  describe("Error Handling", () => {
    test("shows error message when iframe fails to load", async () => {
      const { container } = render(<SpotifyEmbed trackId="123abc" />);

      const iframe = container.querySelector("iframe");
      fireEvent.error(iframe);

      await waitFor(() => {
        expect(
          screen.getByText(/Could not load Spotify player/i, { exact: false })
        ).toBeInTheDocument();
      });
    });

    test('shows "Open in Spotify" link on error', async () => {
      const { container } = render(<SpotifyEmbed trackId="123abc" />);

      const iframe = container.querySelector("iframe");
      fireEvent.error(iframe);

      await waitFor(() => {
        const link = screen.getByText(/Open in Spotify/i);
        expect(link).toBeInTheDocument();
        expect(link.closest("a")).toHaveAttribute(
          "href",
          "https://open.spotify.com/track/123abc"
        );
        expect(link.closest("a")).toHaveAttribute("target", "_blank");
      });
    });

    test("hides iframe on error", async () => {
      const { container } = render(<SpotifyEmbed trackId="123abc" />);

      const iframe = container.querySelector("iframe");
      fireEvent.error(iframe);

      await waitFor(() => {
        expect(iframe).toHaveStyle({ display: "none" });
      });
    });
  });

  describe("Preview Note (Compact Mode)", () => {
    test("shows preview note after loading in compact mode", async () => {
      const { container } = render(
        <SpotifyEmbed trackId="123abc" compact={true} />
      );

      const iframe = container.querySelector("iframe");
      fireEvent.load(iframe);

      await waitFor(() => {
        expect(screen.getByText(/30s preview/i)).toBeInTheDocument();
        expect(
          screen.getByText(/Full songs with Spotify Premium/i)
        ).toBeInTheDocument();
      });
    });

    test("does not show preview note in non-compact mode", async () => {
      const { container } = render(
        <SpotifyEmbed trackId="123abc" compact={false} />
      );

      const iframe = container.querySelector("iframe");
      fireEvent.load(iframe);

      await waitFor(() => {
        expect(screen.queryByText(/30s preview/i)).not.toBeInTheDocument();
      });
    });

    test("does not show preview note before loading", () => {
      render(<SpotifyEmbed trackId="123abc" compact={true} />);

      expect(screen.queryByText(/30s preview/i)).not.toBeInTheDocument();
    });

    test("does not show preview note on error", async () => {
      const { container } = render(
        <SpotifyEmbed trackId="123abc" compact={true} />
      );

      const iframe = container.querySelector("iframe");
      fireEvent.error(iframe);

      await waitFor(() => {
        expect(screen.queryByText(/30s preview/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    test("iframe has proper title attribute", () => {
      const { container } = render(<SpotifyEmbed trackId="123abc" />);

      const iframe = container.querySelector("iframe");
      expect(iframe).toHaveAttribute(
        "title",
        "Spotify player for track 123abc"
      );
    });

    test("iframe has proper allow attributes", () => {
      const { container } = render(<SpotifyEmbed trackId="123abc" />);

      const iframe = container.querySelector("iframe");
      expect(iframe).toHaveAttribute("allow", "encrypted-media");
    });

    test("external links have proper rel attribute", async () => {
      const { container } = render(<SpotifyEmbed trackId="123abc" />);

      const iframe = container.querySelector("iframe");
      fireEvent.error(iframe);

      await waitFor(() => {
        const link = screen.getByText(/Open in Spotify/i).closest("a");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    });
  });

  describe("Styling", () => {
    test("iframe has border-radius style", () => {
      const { container } = render(<SpotifyEmbed trackId="123abc" />);

      const iframe = container.querySelector("iframe");
      expect(iframe).toHaveStyle({ borderRadius: "12px" });
    });

    test("iframe is 100% width", () => {
      const { container } = render(<SpotifyEmbed trackId="123abc" />);

      const iframe = container.querySelector("iframe");
      expect(iframe).toHaveAttribute("width", "100%");
    });

    test("container has correct className", () => {
      const { container } = render(<SpotifyEmbed trackId="123abc" />);

      const embedContainer = container.querySelector(
        ".spotify-embed-container"
      );
      expect(embedContainer).toBeInTheDocument();
    });
  });
});
