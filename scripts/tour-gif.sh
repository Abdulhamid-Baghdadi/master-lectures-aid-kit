#!/usr/bin/env bash
# Joins the labs' README animations into one tour GIF for the GitHub profile: the first seconds of each lab, in turn.
# Usage: scripts/tour-gif.sh <kit folder> <out.gif>   (run again whenever a lab's animation changes)
set -euo pipefail
kit="$1"; out="$2"; clip=1.8; w=480; h=300
inputs=(); chains=""; n=0
for g in "$kit"/*/docs/*-light.gif; do
  inputs+=(-ignore_loop 1 -t "$clip" -i "$g")
  chains+="[$n:v]fps=12,scale=$w:$h:force_original_aspect_ratio=decrease,pad=$w:$h:(ow-iw)/2:(oh-ih)/2:white,setsar=1[v$n];"
  n=$((n+1))
done
joined=""; for ((i=0; i<n; i++)); do joined+="[v$i]"; done
ffmpeg -loglevel error -y "${inputs[@]}" -filter_complex \
  "${chains}${joined}concat=n=$n:v=1:a=0,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=none" \
  -loop 0 "$out"
