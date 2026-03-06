import type { Project, Track, Clip } from './types';

/**
 * Scheduler manages the arrangement timeline. It inspects a Project's tracks,
 * clips, and sections to determine which patterns should sound at any point
 * in time, then builds a single Strudel pattern string that represents the
 * full arrangement (or a sub-range of it).
 *
 * Core idea:
 * - Each Track has clips placed at bar positions (`track.clips` maps bar
 *   index -> clip ID).
 * - A Clip has a pattern (mini-notation) and a duration in bars.
 * - The Scheduler walks bar-by-bar through the timeline, resolves which clip
 *   is active on each track for each bar, then uses Strudel combinators
 *   (`cat` for sequential chaining, `stack` for layering tracks) to produce
 *   one playable string.
 */

export class Scheduler {
  // ─── Query helpers ──────────────────────────────────────────

  /**
   * Return the clip that is active on `track` at bar `bar`, or null.
   * A clip placed at bar N with durationBars D covers bars N .. N+D-1.
   */
  static getActiveClipAtBar(
    track: Track,
    clips: Record<string, Clip>,
    bar: number,
  ): Clip | null {
    for (const [posStr, clipId] of Object.entries(track.clips)) {
      const pos = Number(posStr);
      const clip = clips[clipId];
      if (!clip) continue;
      if (bar >= pos && bar < pos + clip.durationBars) {
        return clip;
      }
    }
    return null;
  }

  /**
   * Get every clip placement on a track as sorted entries.
   */
  static getSortedPlacements(
    track: Track,
    clips: Record<string, Clip>,
  ): Array<{ bar: number; clip: Clip }> {
    const placements: Array<{ bar: number; clip: Clip }> = [];
    for (const [posStr, clipId] of Object.entries(track.clips)) {
      const clip = clips[clipId];
      if (!clip) continue;
      placements.push({ bar: Number(posStr), clip });
    }
    placements.sort((a, b) => a.bar - b.bar);
    return placements;
  }

  // ─── Full arrangement builder ───────────────────────────────

  /**
   * Build a complete Strudel pattern string for the entire project.
   *
   * Strategy per track:
   *   Walk bars 0 .. totalBars-1. For each bar determine the active clip
   *   pattern (or "silence" if nothing is placed). Consecutive bars that
   *   share the same clip are merged (the clip pattern is `.slow(N)` where
   *   N = durationBars so it stretches across those bars). Gaps get
   *   `silence.slow(G)`. The per-bar segments are chained with `cat(...)`.
   *
   * All tracks are then combined with `stack(...)`.
   *
   * Volume / mute / solo are applied by wrapping each track's pattern with
   * `.gain(vol)` and skipping muted tracks (respecting solo).
   */
  static buildArrangementPattern(project: Project): string {
    const { tracks, clips, totalBars } = project;
    if (tracks.length === 0 || totalBars === 0) return 'silence';

    const anySoloed = tracks.some((t) => t.solo);

    const trackPatterns: string[] = [];

    for (const track of tracks) {
      // Solo / mute filtering
      if (anySoloed && !track.solo) continue;
      if (track.muted) continue;

      const seqPattern = Scheduler.buildTrackSequence(track, clips, totalBars);
      if (!seqPattern) continue;

      const gainStr = track.volume < 1 ? `.gain(${track.volume.toFixed(2)})` : '';
      trackPatterns.push(`(${seqPattern})${gainStr}`);
    }

    if (trackPatterns.length === 0) return 'silence';
    if (trackPatterns.length === 1) return trackPatterns[0];
    return `stack(${trackPatterns.join(', ')})`;
  }

  /**
   * Build the sequential (time-ordered) pattern for a single track across
   * the arrangement. Produces something like:
   *   cat(pattern1.slow(4), silence.slow(2), pattern2.slow(4))
   */
  static buildTrackSequence(
    track: Track,
    clips: Record<string, Clip>,
    totalBars: number,
  ): string | null {
    const segments: Array<{ pattern: string; bars: number }> = [];
    let bar = 0;

    while (bar < totalBars) {
      const clip = Scheduler.getActiveClipAtBar(track, clips, bar);

      if (clip) {
        // Find the placement start so we know how many bars remain for this clip
        const placementStart = Scheduler.getPlacementStartForBar(track, clips, bar);
        const clipEnd = placementStart + clip.durationBars;
        const barsRemaining = Math.min(clipEnd, totalBars) - bar;

        // If we're at the placement start, use the full clip duration
        if (bar === placementStart) {
          segments.push({ pattern: clip.pattern, bars: clip.durationBars });
          bar += clip.durationBars;
        } else {
          // Mid-clip entry (shouldn't normally happen with our bar walker, but
          // handle gracefully) – use remaining bars
          segments.push({ pattern: clip.pattern, bars: barsRemaining });
          bar += barsRemaining;
        }
      } else {
        // Count consecutive silent bars
        let silentBars = 0;
        while (bar + silentBars < totalBars) {
          if (Scheduler.getActiveClipAtBar(track, clips, bar + silentBars)) break;
          silentBars++;
        }
        segments.push({ pattern: 'silence', bars: silentBars });
        bar += silentBars;
      }
    }

    if (segments.length === 0) return null;

    // If only silence, skip the track entirely
    if (segments.every((s) => s.pattern === 'silence')) return null;

    const parts = segments.map((s) => {
      const base = s.pattern === 'silence' ? 'silence' : `(${s.pattern})`;
      // .slow(N) stretches the pattern across N cycles (bars)
      return s.bars === 1 ? base : `${base}.slow(${s.bars})`;
    });

    if (parts.length === 1) return parts[0];
    return `cat(${parts.join(', ')})`;
  }

  /**
   * Given that bar `bar` is covered by some clip on `track`, find the bar
   * position where that clip's placement starts.
   */
  private static getPlacementStartForBar(
    track: Track,
    clips: Record<string, Clip>,
    bar: number,
  ): number {
    for (const [posStr, clipId] of Object.entries(track.clips)) {
      const pos = Number(posStr);
      const clip = clips[clipId];
      if (!clip) continue;
      if (bar >= pos && bar < pos + clip.durationBars) {
        return pos;
      }
    }
    return bar; // fallback
  }

  // ─── Range-based builder ────────────────────────────────────

  /**
   * Build a pattern for a specific bar range [startBar, endBar).
   * Useful for playing just one section of the arrangement.
   */
  static buildRangePattern(
    project: Project,
    startBar: number,
    endBar: number,
  ): string {
    const rangeProject: Project = {
      ...project,
      totalBars: endBar - startBar,
      tracks: project.tracks.map((track) => {
        // Re-map clip placements relative to the range start
        const newClips: Record<number, string> = {};
        for (const [posStr, clipId] of Object.entries(track.clips)) {
          const pos = Number(posStr);
          const clip = project.clips[clipId];
          if (!clip) continue;
          const clipEnd = pos + clip.durationBars;
          // Include if the clip overlaps with [startBar, endBar)
          if (clipEnd > startBar && pos < endBar) {
            newClips[pos - startBar] = clipId;
          }
        }
        return { ...track, clips: newClips };
      }),
    };
    return Scheduler.buildArrangementPattern(rangeProject);
  }

  /**
   * Build a pattern for a named section.
   */
  static buildSectionPattern(project: Project, sectionId: string): string {
    const section = project.sections.find((s) => s.id === sectionId);
    if (!section) return 'silence';
    return Scheduler.buildRangePattern(project, section.startBar, section.endBar);
  }

  // ─── Loop helper ────────────────────────────────────────────

  /**
   * Wrap a pattern string so it loops N times. This simply repeats the
   * `cat(...)` sequence. In practice the Cyclist loops automatically, so
   * this is mainly useful for finite renders or to explicitly repeat a
   * section within a larger arrangement.
   */
  static loopPattern(patternString: string, times: number): string {
    if (times <= 1) return patternString;
    const copies = Array(times).fill(patternString);
    return `cat(${copies.join(', ')})`;
  }
}
