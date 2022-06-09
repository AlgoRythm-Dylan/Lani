/*

    Lani SVG rendering module

*/
Lani.requireModule("lani-animations");
Lani.installedModules.push("lani-svg");

Lani.svg = {};

// Returns a path string for canvas-like arc
Lani.svg.arc = (centerX, centerY, radius, startAngle, endAngle) => {
    let arcSweep = 1;
    let startPoint = Lani.pointOnCircle(radius, startAngle);
    let endPoint = Lani.pointOnCircle(radius, endAngle);
    return `M ${centerX + startPoint.x} ${centerY + startPoint.y} ` +
           `A ${radius} ${radius} 0 0 ${arcSweep} ` +
           `${centerX + endPoint.x} ${centerY + endPoint.y}`;
}

// Relative values just have lowercase function letters
Lani.svg.relative = str => str.toLowerCase();

// And the opposite is true for absolute! (though by default everything is abs.)
Lani.svg.absolute = str => str.toUpperCase();
