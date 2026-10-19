# AI 8-Puzzle Visualizer — IDDLS

An interactive web application for the Artificial Intelligence Digital Assignment. It solves the 8-puzzle using **Iterative Deepening Depth-Limited Search (IDDLS)** and visualizes the resulting solution path.

## Student details
- **Student:** Zarin Alam
- **Registration number:** 24BDS0296
- **Course:** Artificial Intelligence
- **Assigned algorithm:** 4 — Iterative Deepening Depth-Limited Search (IDDLS)

## Features
- Enter initial and goal puzzle states (`0` represents the blank tile).
- Generate random solvable puzzles.
- Run IDDLS implemented from scratch in JavaScript.
- Increase the depth limit iteratively.
- Animate the solution path with Run/Pause, Next, Previous, Reset, and speed controls.
- Display depth-limit iterations, node counts, solution moves, execution time, path cost, and approximate memory usage.
- Responsive layout using Bootstrap 5.
- Algorithm information, complexity, completeness, and optimality notes.

## Technologies
- HTML5
- CSS3
- JavaScript (ES6)
- Bootstrap 5
- GitHub Pages (deployment target)

## How to run locally
1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. Internet access is needed to load Bootstrap from its CDN. The solver itself runs in the browser and does not need a backend.

## How to use
1. Enter each row of the initial and goal states. Use numbers `0` through `8` exactly once; `0` is the blank tile.
2. Or click **Random solvable puzzle**.
3. Select the maximum depth limit.
4. Click **Run IDDLS**.
5. Use the playback controls to inspect the solution path and read the statistics.

## Algorithm
IDDLS runs depth-limited depth-first search repeatedly with limits 0, 1, 2, ... until it finds the goal or reaches the configured maximum. The implementation tracks the current path to avoid cycles. For the 8-puzzle, the inversion parity of the initial and goal states is checked before searching.

- Time complexity: `O(b^d)`
- Space complexity: `O(bd)`
- Complete: yes, for finite branching factor if the solution is within the limit
- Optimal: yes when every move has equal cost

Here, `b` is the branching factor and `d` is the depth of the shallowest solution.

## GitHub Pages deployment
1. Create a GitHub repository named `AI-8Puzzle-Visualizer`.
2. Upload the files and folders from this project.
3. Open **Settings → Pages**.
4. Under build and deployment, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then save.
6. Wait for GitHub Pages to publish the site. Copy the URL displayed in Settings → Pages into your assignment submission and this README.

## Screenshots
<img width="959" height="533" alt="image" src="https://github.com/user-attachments/assets/486d3d6c-f03a-4d49-95dc-8059dfb0981c" />
<img width="959" height="530" alt="image" src="https://github.com/user-attachments/assets/3b64b95c-e059-4264-860c-9a82765dcfe9" />
<img width="959" height="530" alt="image" src="https://github.com/user-attachments/assets/88179c91-470c-4e9b-91ee-901555c2057e" />
<img width="959" height="533" alt="image" src="https://github.com/user-attachments/assets/536ed1aa-6569-432a-a72f-192e160c09a6" />
<img width="959" height="526" alt="image" src="https://github.com/user-attachments/assets/ac299c84-fe83-412a-8571-47e0781d12b5" />
<img width="959" height="532" alt="image" src="https://github.com/user-attachments/assets/9edb7b8c-4d18-4f8c-96fb-7d5d42f4b96e" />
<img width="959" height="531" alt="image" src="https://github.com/user-attachments/assets/30d8f58d-93f7-4a49-88df-8f14e6bcc7fc" />
<img width="959" height="524" alt="image" src="https://github.com/user-attachments/assets/e9c6dda3-98e5-403d-9925-08dc3558afaa" />
<img width="959" height="529" alt="image" src="https://github.com/user-attachments/assets/9410763a-c09c-416b-a99c-6e7c498cf0a5" />
<img width="959" height="527" alt="image" src="https://github.com/user-attachments/assets/0f06ff98-0587-497a-829c-72a226c21961" />


## References
- Russell, S. and Norvig, P., *Artificial Intelligence: A Modern Approach*.
- Bootstrap documentation: https://getbootstrap.com/docs/
- MDN JavaScript guide: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide

## Search Algorithms Implemented
The assigned algorithm is IDDLS. The assigned search algorithm, implemented from scratch in JavaScript.
It repeatedly performs depth-limited searches with increasing depth limits until the goal is found or the maximum depth is reached..

## Heuristics Used

IDDLS is an uninformed search algorithm and does not use a heuristic
function to estimate the distance to the goal state. It searches by
increasing the depth limit iteratively.

## Technologies used

### Required technologies
- **HTML5** for page structure and accessible controls.
- **CSS3** for responsive layout, themes, transitions, and puzzle styling.
- **JavaScript (ES6)** for validation, puzzle state management, playback, statistics, and a manually implemented IDDLS algorithm.
- **Bootstrap 5** as the UI framework.

### Optional visualization technologies added
- **Canvas API:** draws the number of expanded nodes at each depth limit.
- **SVG:** draws the sequence of puzzle states and move arrows.
- **D3.js:** creates a data-driven chart comparing generated and expanded nodes by iteration.

React, Vue, and Angular are alternative UI frameworks. This project intentionally uses Bootstrap with vanilla JavaScript rather than mixing multiple competing UI frameworks.
