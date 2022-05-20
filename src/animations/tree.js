/*

    Lani "tree" animation

    Inspiration:
        https://openprocessing.org/sketch/1279382
        https://openprocessing.org/sketch/1520641
        https://openprocessing.org/sketch/1025683

*/
Lani.requireModule("lani-animations");

Lani.TreeBranch = class extends Lani.AnimationEntity {
    constructor(){
        super();
        this.length = 0.25;
        this.thickness = 1;
        this.children = [];
        this.parent = null;
        this.branchSpread = 25;
        this.branchLengthRatio = 1.5;

        this.angleRandomness = 35;
        this.lengthRandomness = 0.6;
    }
    randomAngleDeviation(){
        return (this.angleRandomness / 2) - (Math.random() * this.angleRandomness);
    }
    randomLengthDeviation(){
        return (this.lengthRandomness / 2) - (Math.random() * this.lengthRandomness);
    }
    generateChildren(depth=10){
        if(depth <= 0)
            return;
        this.thickness = depth;
        let leftBranch = new Lani.TreeBranch();
        let rightBranch = new Lani.TreeBranch();
        leftBranch.rotationDeg = this.rotationDeg - this.branchSpread + this.randomAngleDeviation();
        leftBranch.length = (this.length / (this.branchLengthRatio + this.randomLengthDeviation()));
        rightBranch.rotationDeg = this.rotationDeg + this.branchSpread + this.randomAngleDeviation();
        rightBranch.length = (this.length / (this.branchLengthRatio + this.randomLengthDeviation()));
        this.children.push(leftBranch);
        this.children.push(rightBranch);
        depth--;
        this.children.forEach(child => child.generateChildren(depth));
    }
    render(ctx, x1, y1, vRes){
        let point = Lani.pointOnCircle(vRes * this.length, this.rotationDeg);
        let x2 = x1 + point.x;
        let y2 = y1 + point.y;
        ctx.lineWidth = this.thickness;
        Lani.drawLine(ctx, x1, vRes - y1, x2, vRes - y2);
        this.children.forEach(child => child.render(ctx, x2, y2, vRes));
    }
}

Lani.TreeAnimation = class extends Lani.Animation {
    constructor(canvas) {
        super(canvas);
        this.root = new Lani.TreeBranch();
        this.root.generateChildren();
    }
    animate(deltaTime) {
        let width = this.canvas.offsetWidth;
        let height = this.canvas.offsetHeight;
        this.canvasSize();
        let ctx = this.ctx;
        this.clear();
        ctx.strokeStyle = "rgb(255, 255, 255)";
        this.root.render(ctx, width / 2, 0, height);
    }
}

Lani.TreeElement = class extends Lani.Element {
    constructor(){
        super();
        this.animation = null;
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-animation-basic");

        this.animation = new Lani.TreeAnimation(
            this.shadow.getElementById("screen")
        );

        Lani.animations.push(this.animation);

    }
    connectedCallback(){
        this.setup();
    }
}

Lani.regEl("lani-tree", Lani.TreeElement);