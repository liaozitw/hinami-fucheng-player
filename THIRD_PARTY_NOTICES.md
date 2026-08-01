# Third-Party Notices

Hinami Fucheng Player uses open-source packages maintained by their respective
authors. Those packages remain subject to their own licenses; the project’s MIT
License does not replace them.

The direct dependencies installed by the current `package-lock.json` include:

| Package | Version | License |
| --- | ---: | --- |
| `@vitejs/plugin-react` | 6.0.5 | MIT |
| `cors` | 2.8.6 | MIT |
| `express` | 5.2.1 | MIT |
| `hls.js` | 1.6.16 | Apache-2.0 |
| `lucide-react` | 1.28.0 | ISC |
| `react` | 19.2.8 | MIT |
| `react-dom` | 19.2.8 | MIT |
| `three` | 0.185.1 | MIT |
| `vite` | 8.2.0 | MIT |

Direct development dependencies:

| Package | Version | License |
| --- | ---: | --- |
| `@types/cors` | 2.8.19 | MIT |
| `@types/express` | 5.0.6 | MIT |
| `@types/node` | 26.1.2 | MIT |
| `@types/react` | 19.2.18 | MIT |
| `@types/react-dom` | 19.2.4 | MIT |
| `@types/three` | 0.185.3 | MIT |
| `tsx` | 4.23.1 | MIT |
| `typescript` | 7.0.2 | Apache-2.0 |

Transitive dependencies are recorded in `package-lock.json`. Their license
texts and notices are available in the packages installed by `npm install`.
Redistributors are responsible for retaining notices required by the versions
they distribute and for reviewing the complete dependency tree.

FFmpeg and FFprobe are external system dependencies and are not distributed in
this repository. FFmpeg builds can be licensed under LGPL or GPL terms
depending on their configuration. Consult the license information supplied
with the specific FFmpeg build you install or redistribute.
