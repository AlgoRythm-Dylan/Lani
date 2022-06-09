/*

    Lani SVG rendering module

*/
Lani.requireModule("lani-animations");
Lani.installedModules.push("lani-svg");

Lani.svg = {};

// Returns a path string for canvas-like arc
Lani.svg.arc = (centerX, centerY, radius, startAngle, endAngle) => {
    return `M${centerX - (radius / 2)},${centerY - (radius / 2)}`
}

// Relative values just have lowercase function letters
Lani.svg.relative = str => str.toLowerCase();

// And the opposite is true for absolute! (though by default everything is abs.)
Lani.svg.absolute = str => str.toUpperCase();
