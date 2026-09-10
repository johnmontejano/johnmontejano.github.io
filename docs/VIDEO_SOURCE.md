# Documentary video source

Verified and downloaded: 2026-09-09.

## Delivered asset

`assets/video/service-documentary-v2.mp4` is an edited live-action stock video:
12.000 seconds, 1600 × 900 (16:9), H.264/yuv420p, 25 fps, 300 frames,
2,614,635 bytes (2.61 MB), with no audio stream and MP4 fast-start metadata.

The scene shows bicycles, cyclists, pedestrians, storefronts and passing traffic
on a sunny city street. The camera is stationary; people and vehicles actually
move through the frame. This is not an animated still or generated footage.

**Location: Paris, France, not San Francisco.** Use as illustrative city and
neighborhood-business atmosphere, not as evidence of John's work, customers,
team, or location. No footage from monopo is used.

## Source and license

- Title: **A calm street in Paris**, Mixkit item **4348**.
- Contributor: **dubassy**, linked by the source page as
  [Contributor Profile](https://mixkit.co/@dubassy/).
- [Original item page](https://mixkit.co/free-stock-video/a-calm-street-in-paris-4348/).
- [Official Full HD download selection](https://mixkit.co/free-stock-video/download/4348/?context=sidebar&type=1080p).
- [Downloaded original MP4](https://assets.mixkit.co/videos/4348/4348-1080.mp4).
- [Mixkit Stock Video Free License](https://mixkit.co/license/#videoFree).
- [Mixkit User Terms](https://mixkit.co/terms/).

The item page explicitly states: “Download this free stock video clip for
commercial or personal use, under the Mixkit Stock Video Free License.” Both
the page's download section and the license modal were inspected in a browser.
The official download selection supplied the MP4 URL above. No payment, paid
subscription, or API key was used.

The license states that items can be used in commercial and non-commercial
projects for free, and permits downloading, copying, modifying, distributing,
publicly performing and broadcasting. Rights are non-exclusive, worldwide,
sub-licensable and ongoing. Attribution is not required. Optional credit:
“Footage: dubassy / Mixkit — A calm street in Paris.”

The User Terms still apply, including limits on standalone stock resale,
competing stock libraries, and removal of watermarks. Third-party brands or
other components may have separate rights; this contextual street scene must
not be presented as endorsement or as John's own documentary project. The
asset remains subject to the Mixkit license, regardless of the repository's
code license.

## Edit and reproduction

Original: 1920 × 1080, 25 fps, 22.120 seconds, 70,307,077 bytes.
Source SHA-256:
`1ac50de063564485203cfd5488d682b933cf2dae9c624903c7dd8ae3b1f55a18`.

The edit uses source seconds 0.6–12.6, with a 0.6-second dissolve into source
seconds 0–0.6 at the end. Restarting then continues into source second 0.6.
This softens the loop boundary without reversing traffic or synthesizing motion.
Color saturation is reduced to 78%, with a slight contrast/brightness adjustment.
The original frame composition is preserved; no black bars, added zoom, text,
watermark, or audio are included.

With the original downloaded as `/tmp/portfolio-street-source-hd.mp4`, run from
the worktree root (the `-n` flag prevents overwriting an existing delivery):

```sh
ffmpeg -n -hide_banner -loglevel warning \
  -i /tmp/portfolio-street-source-hd.mp4 \
  -filter_complex '[0:v]scale=1600:900:flags=lanczos,fps=25,setsar=1,eq=saturation=0.78:contrast=0.98:brightness=0.005,split=2[main][head];[main]trim=start=0.6:end=12.6,setpts=PTS-STARTPTS[body];[head]trim=start=0:end=0.6,setpts=PTS-STARTPTS[start];[body][start]xfade=transition=fade:duration=0.6:offset=11.4,format=yuv420p[out]' \
  -map '[out]' -an -t 12 -c:v libx264 -preset slow -crf 24 \
  -maxrate 2300k -bufsize 4600k -g 50 -movflags +faststart \
  -map_metadata -1 assets/video/service-documentary-v2.mp4
```

Output SHA-256:
`1b6fb36203dda408bb3c3e61b14d98eac9795942197c5a7251e04d788eef7cec`.

## Verification and integration handoff

- `ffprobe` confirmed the dimensions, codec, duration, frame count and size above,
  and that there is only a video stream.
- Source contact-sheet inspection confirmed independent cyclist/pedestrian
  movement across a stationary frame.
- Full output decode and output frame inspection checked the encoded delivery.
- Main agent owns HTML/CSS integration: use this file as the band's MP4 source
  with `autoplay muted loop playsinline`, and the existing full-bleed
  `object-fit: cover` treatment. Preserve reduced-motion behavior.
- Match any poster to real footage or omit it; an unrelated generated still
  would misrepresent this asset before playback. Poster/HTML edits are outside
  this two-file assignment.
- This task changes only this document and the new MP4. No commit or deployment.

## Search limitations

Pexels search returned a Cloudflare “Just a moment…” challenge. Mixkit's
“Traffic at The Golden Gate Bridge” (11401) was rejected because its actual
free-download section specifies personal use only under the Restricted
License, despite contradictory commercial-use text in page metadata. The
selected Paris clip has an explicit Free License in its own download section.
