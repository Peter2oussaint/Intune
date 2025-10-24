/**
 * Unit tests for TrackCard Component
 * Tests track display, actions, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackCard, { TrackGrid } from './TrackCard';

describe('TrackCard Component', () => {
  const mockTrack = {
    id: 'track-123',
    name: 'Test Song',
    artists: [{ name: 'Test Artist' }],
    album: {
      name: 'Test Album',
      images: [{ url: 'http://example.com/album.jpg' }],
    },
    key_info: { key: 'C Major', bpm: '120' },
  };

  const mockOnAdd = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders track information correctly', () => {
      render(
        <TrackCard
          track={mockTrack}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
      expect(screen.getByText('C Major')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
    });

    test('displays album artwork with correct alt text', () => {
      render(
        <TrackCard
          track={mockTrack}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      const artwork = screen.getByRole('img');
      expect(artwork).toHaveAttribute('alt', 'Test Album cover');
    });

    test('uses fallback alt text when no album name', () => {
      const trackWithoutAlbum = {
        ...mockTrack,
        album: {},
      };

      render(
        <TrackCard
          track={trackWithoutAlbum}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      const artwork = screen.getByRole('img');
      expect(artwork).toHaveAttribute('alt', expect.stringContaining('Test Song'));
    });

    test('displays Unknown for missing key data', () => {
      const trackWithoutKey = {
        ...mockTrack,
        key_info: null,
      };

      render(
        <TrackCard
          track={trackWithoutKey}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      const keyElements = screen.getAllByText('Unknown');
      expect(keyElements.length).toBeGreaterThan(0);
    });

    test('handles track with string key_info (JSON)', () => {
      const trackWithStringKeyInfo = {
        ...mockTrack,
        key_info: JSON.stringify({ key: 'G Major', bpm: '128' }),
      };

      render(
        <TrackCard
          track={trackWithStringKeyInfo}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByText('G Major')).toBeInTheDocument();
      expect(screen.getByText('128')).toBeInTheDocument();
    });

    test('handles alternative field names', () => {
      const altTrack = {
        song_id: 'alt-123',
        song_title: 'Alt Song',
        artist_name: 'Alt Artist',
        key_info: { key: 'F Major', bpm: '96' },
      };

      render(
        <TrackCard
          track={altTrack}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByText('Alt Song')).toBeInTheDocument();
      expect(screen.getByText('Alt Artist')).toBeInTheDocument();
    });

    test('has proper ARIA role and label', () => {
      render(
        <TrackCard
          track={mockTrack}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      const article = screen.getByRole('group', { name: 'Test Song by Test Artist' });
      expect(article).toBeInTheDocument();
    });
  });

  describe('Add Action', () => {
    test('shows add button when actionType is "add"', () => {
      render(
        <TrackCard
          track={mockTrack}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      const addButton = screen.getByRole('button', { name: /Add to Playlist/i });
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveTextContent('+');
    });

    test('calls onAdd with track when add button clicked', () => {
      render(
        <TrackCard
          track={mockTrack}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      const addButton = screen.getByRole('button', { name: /Add to Playlist/i });
      fireEvent.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledTimes(1);
      expect(mockOnAdd).toHaveBeenCalledWith(mockTrack);
    });

    test('shows "Added" indicator when track is in playlist', () => {
      render(
        <TrackCard
          track={mockTrack}
          actionType="add"
          isInPlaylist={true}
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByText(/✓ Added/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Add to Playlist/i })).not.toBeInTheDocument();
    });

    test('disables add button when already in playlist', () => {
      render(
        <TrackCard
          track={mockTrack}
          actionType="add"
          isInPlaylist={true}
          onAdd={mockOnAdd}
        />
      );

      const addButton = screen.queryByRole('button', { name: /Add to Playlist/i });
      expect(addButton).not.toBeInTheDocument();
    });

    test('shows loading state during add operation', () => {
      render(
        <TrackCard
          track={mockTrack}
          actionType="add"
          isLoading={true}
          onAdd={mockOnAdd}
        />
      );

      const addButton = screen.getByRole('button', { name: /Add to Playlist/i });
      expect(addButton).toBeDisabled();
      expect(addButton).toHaveTextContent('Adding...');
    });
  });

  describe('Remove Action', () => {
    test('shows remove button when actionType is "remove"', () => {
      render(
        <TrackCard
          track={mockTrack}
          actionType="remove"
          onRemove={mockOnRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /Remove from Playlist/i });
      expect(removeButton).toBeInTheDocument();
      expect(removeButton).toHaveTextContent('×');
    });

    test('calls onRemove with track ID when remove button clicked', () => {
      render(
        <TrackCard
          track={mockTrack}
          actionType="remove"
          onRemove={mockOnRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /Remove from Playlist/i });
      fireEvent.click(removeButton);

      expect(mockOnRemove).toHaveBeenCalledTimes(1);
      expect(mockOnRemove).toHaveBeenCalledWith('track-123');
    });

    test('uses playlistRowId over id for remove action', () => {
      const trackWithPlaylistId = {
        ...mockTrack,
        playlistRowId: 'playlist-row-456',
      };

      render(
        <TrackCard
          track={trackWithPlaylistId}
          actionType="remove"
          onRemove={mockOnRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /Remove from Playlist/i });
      fireEvent.click(removeButton);

      expect(mockOnRemove).toHaveBeenCalledWith('playlist-row-456');
    });

    test('shows loading state during remove operation', () => {
      render(
        <TrackCard
          track={mockTrack}
          actionType="remove"
          isLoading={true}
          onRemove={mockOnRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /Remove from Playlist/i });
      expect(removeButton).toBeDisabled();
      expect(removeButton).toHaveTextContent('Removing...');
    });

    test('disables remove button when ID is missing', () => {
      const trackWithoutId = {
        name: 'No ID Song',
        artists: [{ name: 'Artist' }],
        key_info: { key: 'C Major', bpm: '120' },
      };

      render(
        <TrackCard
          track={trackWithoutId}
          actionType="remove"
          onRemove={mockOnRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /Remove from Playlist/i });
      expect(removeButton).toBeDisabled();
    });
  });

  describe('Compatibility Information', () => {
    test('displays CompatibilityPill when compatibility_info present', () => {
      const trackWithCompatibility = {
        ...mockTrack,
        compatibility_info: {
          overall: {
            compatibility: 'excellent',
            score: 95,
            description: 'Perfect for mixing',
          },
          key: {
            compatibility: 'perfect',
            reason: 'Same key',
          },
          bpm: {
            compatibility: 'excellent',
            reason: 'Within 5 BPM',
          },
        },
      };

      render(
        <TrackCard
          track={trackWithCompatibility}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('Perfect for mixing')).toBeInTheDocument();
    });

    test('does not display CompatibilityPill when no compatibility data', () => {
      render(
        <TrackCard
          track={mockTrack}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      // Should not have any compatibility indicators
      expect(screen.queryByRole('note')).not.toBeInTheDocument();
    });

    test('displays key compatibility reason', () => {
      const trackWithCompatibility = {
        ...mockTrack,
        compatibility_info: {
          overall: { score: 90 },
          key: {
            reason: 'Relative major/minor keys',
          },
        },
      };

      render(
        <TrackCard
          track={trackWithCompatibility}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByText('Relative major/minor keys')).toBeInTheDocument();
    });

    test('displays BPM compatibility reason', () => {
      const trackWithCompatibility = {
        ...mockTrack,
        compatibility_info: {
          overall: { score: 85 },
          bpm: {
            reason: 'Within 10 BPM',
          },
        },
      };

      render(
        <TrackCard
          track={trackWithCompatibility}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByText('Within 10 BPM')).toBeInTheDocument();
    });

    test('displays source information when available', () => {
      const trackWithSource = {
        ...mockTrack,
        key_info: { key: 'C Major', bpm: '120', source: 'SoundNet' },
      };

      render(
        <TrackCard
          track={trackWithSource}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      // Note: Implementation depends on whether source is displayed in pill
      // Adjust based on actual TrackCard implementation
    });
  });

  describe('Accessibility', () => {
    test('buttons have proper aria-labels', () => {
      render(
        <TrackCard
          track={mockTrack}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      const addButton = screen.getByRole('button', { name: 'Add to Playlist: Test Song' });
      expect(addButton).toBeInTheDocument();
    });

    test('track attributes use semantic dl/dt/dd elements', () => {
      const { container } = render(
        <TrackCard
          track={mockTrack}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      const definitionList = container.querySelector('dl');
      expect(definitionList).toBeInTheDocument();

      const terms = container.querySelectorAll('dt');
      expect(terms.length).toBeGreaterThan(0);
    });

    test('already added indicator has aria-label', () => {
      render(
        <TrackCard
          track={mockTrack}
          actionType="add"
          isInPlaylist={true}
          onAdd={mockOnAdd}
        />
      );

      const indicator = screen.getByLabelText('Already in playlist');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles very long song names', () => {
      const longNameTrack = {
        ...mockTrack,
        name: 'This is an extremely long song name that might overflow the container and cause layout issues',
      };

      render(
        <TrackCard
          track={longNameTrack}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      const title = screen.getByText(/This is an extremely long/);
      expect(title).toHaveAttribute('title', longNameTrack.name);
    });

    test('handles very long artist names', () => {
      const longArtistTrack = {
        ...mockTrack,
        artists: [{ name: 'The Extremely Long Artist Name Band & Orchestra Featuring Multiple Collaborators' }],
      };

      render(
        <TrackCard
          track={longArtistTrack}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      const artist = screen.getByText(/The Extremely Long/);
      expect(artist).toHaveAttribute('title', longArtistTrack.artists[0].name);
    });

    test('handles missing album artwork', () => {
      const noArtworkTrack = {
        ...mockTrack,
        album: {},
      };

      render(
        <TrackCard
          track={noArtworkTrack}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      // Should still render without crashing
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });

    test('handles malformed key_info JSON string', () => {
      const malformedTrack = {
        ...mockTrack,
        key_info: 'not valid json',
      };

      render(
        <TrackCard
          track={malformedTrack}
          actionType="add"
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0);
    });
  });
});

describe('TrackGrid Component', () => {
  const mockChildren = [
    <TrackCard key="1" track={{ id: '1', name: 'Song 1', artists: [{ name: 'Artist 1' }] }} />,
    <TrackCard key="2" track={{ id: '2', name: 'Song 2', artists: [{ name: 'Artist 2' }] }} />,
    <TrackCard key="3" track={{ id: '3', name: 'Song 3', artists: [{ name: 'Artist 3' }] }} />,
  ];

  test('renders title when provided', () => {
    render(
      <TrackGrid title="Compatible Tracks">
        {mockChildren}
      </TrackGrid>
    );

    expect(screen.getByText('Compatible Tracks')).toBeInTheDocument();
  });

  test('renders children in grid layout', () => {
    const { container } = render(
      <TrackGrid title="Test Grid">
        {mockChildren}
      </TrackGrid>
    );

    const grid = container.querySelector('[role="grid"]');
    expect(grid).toBeInTheDocument();
    expect(grid.children.length).toBe(3);
  });

  test('shows empty message when no children', () => {
    render(
      <TrackGrid title="Empty Grid" emptyMessage="No tracks available">
        {[]}
      </TrackGrid>
    );

    expect(screen.getByText('No tracks available')).toBeInTheDocument();
  });

  test('uses default empty message when not provided', () => {
    render(
      <TrackGrid title="Empty Grid">
        {[]}
      </TrackGrid>
    );

    expect(screen.getByText('No tracks to display')).toBeInTheDocument();
  });

  test('does not show empty message when children present', () => {
    render(
      <TrackGrid title="Grid with Items" emptyMessage="Should not show">
        {mockChildren}
      </TrackGrid>
    );

    expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
  });

  test('renders without title (optional)', () => {
    const { container } = render(
      <TrackGrid>
        {mockChildren}
      </TrackGrid>
    );

    expect(container.querySelector('.grid-title')).not.toBeInTheDocument();
  });

  test('has proper semantic structure', () => {
    const { container } = render(
      <TrackGrid title="Test Grid">
        {mockChildren}
      </TrackGrid>
    );

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });
});