# IDDLS — Algorithm Notes

## Pseudocode
```
IDDLS(start, goal, maximumLimit):
    for limit = 0 to maximumLimit:
        result = DepthLimitedSearch(start, goal, limit)
        if result is a solution:
            return result
    return failure

DepthLimitedSearch(state, goal, remainingDepth):
    if state == goal:
        return current path
    if remainingDepth == 0:
        return cutoff
    for each legal successor:
        if successor is not already on current path:
            search successor with remainingDepth - 1
            if solution found:
                return solution
    return cutoff/failure
```

## 8-puzzle state representation
A state is represented as a one-dimensional array of nine integers. `0` denotes the blank. The blank can move up, down, left, or right if that move remains within the 3×3 board.

## Notes on statistics
Node counts are accumulated across iterations because IDDLS may revisit the same states at deeper limits. Execution time uses the browser's `performance.now()`. Memory is only an approximate estimate based on generated-node count.


## Visualization extensions
The project uses the Canvas API to plot expanded nodes by depth limit, SVG to display the solution-state sequence, and D3.js to compare generated versus expanded nodes. These visualizations consume the measured output of the same IDDLS search; they do not change the search algorithm or fabricate performance values. D3.js is loaded from a CDN, so an internet connection is needed for that chart.
