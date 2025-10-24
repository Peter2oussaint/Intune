import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import IntuneApp from "./IntuneApp";
import axios from "axios";

// Mock dependencies
jest.mock("axios");
jest.mock("../utils/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

const { supabase } = require("../utils/supabaseClient");

// Mock user data
const mockUser = {
  id: "123",
  email: "test@example.com",
  user_metadata: {
    full_name: "test",
  },
};

describe("IntuneApp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: [] });

    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    });
  });

  describe("Search Interface", () => {
    test("renders search inputs and button", async () => {
      render(
        <BrowserRouter>
          <IntuneApp />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Intune/i)).toBeInTheDocument();
      });

      expect(
        screen.getByPlaceholderText(/Enter artist name/i)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Enter song name/i)
      ).toBeInTheDocument();

      expect(
        screen.getByRole("button", { name: /^Search$/i })
      ).toBeInTheDocument();
    });

    test("search button is disabled when inputs are empty", async () => {
      render(
        <BrowserRouter>
          <IntuneApp />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Intune/i)).toBeInTheDocument();
      });

      const searchButton = screen.getByRole("button", { name: /^Search$/i });
      expect(searchButton).toBeDisabled();
    });

    test("search button is enabled when both inputs have values", async () => {
      render(
        <BrowserRouter>
          <IntuneApp />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Intune/i)).toBeInTheDocument();
      });

      const artistInput = screen.getByPlaceholderText(/Enter artist name/i);
      const songInput = screen.getByPlaceholderText(/Enter song name/i);

      fireEvent.change(artistInput, { target: { value: "Artist" } });
      fireEvent.change(songInput, { target: { value: "Song" } });

      const searchButton = screen.getByRole("button", { name: /^Search$/i });
      expect(searchButton).not.toBeDisabled();
    });
  });

  describe("Search Flow", () => {
    test("shows BPM filter after successful search", async () => {
      axios.get.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({
        data: {
          main_track: {
            id: "123",
            name: "Test Song",
            artists: [{ name: "Test Artist" }],
            album: { images: [{ url: "test.jpg" }] },
            key_info: { key: "C Major", bpm: "120" },
          },
          compatible_tracks: [],
        },
      });

      render(
        <BrowserRouter>
          <IntuneApp />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Intune/i)).toBeInTheDocument();
      });

      const artistInput = screen.getByPlaceholderText(/Enter artist name/i);
      const songInput = screen.getByPlaceholderText(/Enter song name/i);

      fireEvent.change(artistInput, { target: { value: "Test" } });
      fireEvent.change(songInput, { target: { value: "Test" } });

      fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

      await waitFor(() => {
        expect(screen.getByText(/BPM/i)).toBeInTheDocument();
        expect(screen.getByText("120")).toBeInTheDocument();
      });
    });

    test("shows loading spinner during search", async () => {
      axios.get.mockResolvedValueOnce({ data: [] }).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { main_track: null, compatible_tracks: [] },
                }),
              100
            )
          )
      );

      render(
        <BrowserRouter>
          <IntuneApp />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Intune/i)).toBeInTheDocument();
      });

      const artistInput = screen.getByPlaceholderText(/Enter artist name/i);
      const songInput = screen.getByPlaceholderText(/Enter song name/i);

      fireEvent.change(artistInput, { target: { value: "Test" } });
      fireEvent.change(songInput, { target: { value: "Test" } });

      fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

      expect(
        screen.getByText("Searching for compatible music...")
      ).toBeInTheDocument();
    });
  });

  // NEW: Spotify Embed Tests
  describe("Spotify Embed Integration", () => {
    test("renders Spotify embed for main track after search", async () => {
      axios.get.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({
        data: {
          main_track: {
            id: "spotify123",
            name: "Test Song",
            artists: [{ name: "Test Artist" }],
            album: { images: [{ url: "test.jpg" }] },
            key_info: { key: "C Major", bpm: "120" },
          },
          compatible_tracks: [],
        },
      });

      render(
        <BrowserRouter>
          <IntuneApp />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Intune/i)).toBeInTheDocument();
      });

      const artistInput = screen.getByPlaceholderText(/Enter artist name/i);
      const songInput = screen.getByPlaceholderText(/Enter song name/i);

      fireEvent.change(artistInput, { target: { value: "Test" } });
      fireEvent.change(songInput, { target: { value: "Test" } });
      fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

      await waitFor(() => {
        // Verify Spotify embed loaded
        const iframe = document.querySelector("iframe");
        expect(iframe).toBeInTheDocument();
        expect(iframe.src).toContain("spotify.com/embed/track");
      });
    });

    test("compatible tracks have toggle buttons for Spotify embeds", async () => {
      axios.get.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({
        data: {
          main_track: {
            id: "main123",
            name: "Main Song",
            artists: [{ name: "Artist" }],
            album: { images: [{ url: "test.jpg" }] },
            key_info: { key: "C Major", bpm: "120" },
          },
          compatible_tracks: [
            {
              id: "compat456",
              name: "Compatible Song",
              artists: [{ name: "Other Artist" }],
              album: { images: [{ url: "test2.jpg" }] },
              key_info: { key: "C Major", bpm: "122" },
            },
          ],
        },
      });

      render(
        <BrowserRouter>
          <IntuneApp />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Intune/i)).toBeInTheDocument();
      });

      const artistInput = screen.getByPlaceholderText(/Enter artist name/i);
      const songInput = screen.getByPlaceholderText(/Enter song name/i);

      fireEvent.change(artistInput, { target: { value: "Test" } });
      fireEvent.change(songInput, { target: { value: "Test" } });
      fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

      await waitFor(() => {
        expect(screen.getByText("Compatible Song")).toBeInTheDocument();
        // Check for play/toggle buttons (▶️)
        const playButtons = screen.getAllByTitle(/Show player/i);
        expect(playButtons.length).toBeGreaterThan(0);
      });
    });

    test("clicking toggle button shows/hides embed for compatible tracks", async () => {
      axios.get.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({
        data: {
          main_track: {
            id: "main123",
            name: "Main Song",
            artists: [{ name: "Artist" }],
            album: { images: [{ url: "test.jpg" }] },
            key_info: { key: "C Major", bpm: "120" },
          },
          compatible_tracks: [
            {
              id: "compat456",
              name: "Compatible Song",
              artists: [{ name: "Other Artist" }],
              album: { images: [{ url: "test2.jpg" }] },
              key_info: { key: "C Major", bpm: "122" },
            },
          ],
        },
      });

      render(
        <BrowserRouter>
          <IntuneApp />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Intune/i)).toBeInTheDocument();
      });

      const artistInput = screen.getByPlaceholderText(/Enter artist name/i);
      const songInput = screen.getByPlaceholderText(/Enter song name/i);

      fireEvent.change(artistInput, { target: { value: "Test" } });
      fireEvent.change(songInput, { target: { value: "Test" } });
      fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

      await waitFor(() => {
        expect(screen.getByText("Compatible Song")).toBeInTheDocument();
      });

      // Get initial iframe count
      const initialIframes = document.querySelectorAll("iframe").length;

      // Click toggle to show embed
      const toggleButton = screen.getAllByTitle(/Show player/i)[0];
      fireEvent.click(toggleButton);

      await waitFor(() => {
        // Should have more iframes now
        const newIframes = document.querySelectorAll("iframe");
        expect(newIframes.length).toBeGreaterThan(initialIframes);
      });
    });
  });

  describe("Error Handling", () => {
    test("shows error message for track not found", async () => {
      axios.get.mockResolvedValueOnce({ data: [] }).mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: "Track not found" },
        },
      });

      render(
        <BrowserRouter>
          <IntuneApp />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Intune/i)).toBeInTheDocument();
      });

      const artistInput = screen.getByPlaceholderText(/Enter artist name/i);
      const songInput = screen.getByPlaceholderText(/Enter song name/i);

      fireEvent.change(artistInput, { target: { value: "Unknown" } });
      fireEvent.change(songInput, { target: { value: "Unknown" } });

      fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          /No track found for "Unknown" by "Unknown"/i
        );
      });
    });
  });
});
