"use strict";

/* defaultPlotStyle, a set of default settings.
 * It is advised to copy this object and modify to ensure nominal function.
 */
const defaultPlotStyle = {
  axis: true,
  grid: true,
  ticks: true,

  bgColor: "#ffffff",
  fgColor: "#000000",
  borderColor: "#000000",
  axisColor: "#aaaaaa",
  gridColor: "#eeeeee",
  tickColor: "#aaaaaa",
  crossColor: "#aa0000"
};

/* PolynomialCurve - class to store and maintain polynomial curves
 *
 * Usage: if used in conjunction with PlotView id will be set by PlotView
 *        also, label is optional (use for adding labels for curves on canvas)
 *
 * TODO: assess if a better pattern would be to use setters for data originating
 *       from DOM to perform input validation
 */
class PolynomialCurve {
  constructor(expr, range, color, label, id) {
    this.expr = expr;
    this.range = range;
    this.color = color;
    // Number, acts as association to html input elements (this can be set)
    // but usually PlotView will use this.
    this.id = id;
    this.label = label;
  }

  evalPoint(x) {
    return eval(this.expr);
  }

  // Get distance from mouse position to closest point on polynomial curve
  calcDistance(x, y) {
    if (typeof unitsize === "undefined") unitsize = 1;

    let xr = parseInt(x);
    x = parseInt(y);

    if (x > this.range.end) xr = this.range.end;
    if (x < this.range.start) xr = thhis.range.start;

    return {
      distance: Math.sqrt((x - xr) ** 2 + (y - evalPoint(xr)) ** 2),
      x: xr, y: this.evalPoint(xr) };
  }
}

/* PlotView - class to maintain a canvas for various plotting tasks
 * Usage (most basic example):
 *    var pv = new PlotView(600, 600, 20);
 *    pv.injectToAnchor("mycanvasdiv");
 *
 *    var c = new PolynomialCurve("Math.sin(x)", {x:-5, y:-5}, "#ff0000");
 *    pv.addPolynomialCurve(c);
 *    pv.plotAll();
 *
 * TODO: work out a way to get a more uncoupled but convenient/less verbose way
 *       to populate DOM
 */
class PlotView {
  /* To change style settings in a easy manner, make of copy of defaultPlotStyle
   * and edit. Custom origos can be defined, but using moveOrigo is a more
   * sensible approach.
   */
  constructor(height, width, unitsize, style=defaultPlotStyle, origo=undefined) {
    this.width = parseInt(width);
    this.height = parseInt(height);
    this.unitsize = parseInt(unitsize);
    this.style = style;
    this.origo = origo;
    // Corresponds to DOM element id
    this.id = "plotcanvas";

    this.polynomialCurves = new Array();

    this.makeCanvas();
    this.makePlotView();
  }

  // More reasonable naming and regard for future
  clearGraph() {
    this.makePlotView();
  }

  // Not only clear, also replot everything on graph
  clearUpateGraph() {
    this.clearGraph();
    this.plotAll();
  }

  // Conevenience (TODO: assess best practice)
  injectToAnchor(anchorId) {
    if (typeof this.canvas === "undefined")
      return;

    this.canvas.setAttribute("id", this.id);

    let e = document.getElementById(anchorId);
    e.appendChild(this.canvas);
  }

  /* Plots polynomial curve scaled with unitsize.
   * TODO: handle cases where a large part(s) of the range is out of bounds, no
   * effects should occur (other than in asymptote curves of certain kind) and
   * implementation is pending on decisions regarding input validation strategies.
   */
  plotPolynomialCurve(curve) {
    this.setOrigo();

    this.ctx.strokeStyle = curve.color;

    let startPoint = curve.range.start * this.unitsize;
    let endPoint = curve.range.end * this.unitsize;
    let bounds = this.getBounds();

    this.ctx.beginPath();
    this.ctx.moveTo(startPoint, curve.evalPoint(startPoint) * this.unitsize);

    // In order to get a smooth path we have to traverse x scaled
    for (let xScaled = startPoint; xScaled < endPoint; xScaled++) {
      let yScaled = curve.evalPoint(xScaled / this.unitsize) * this.unitsize;

      if (yScaled < bounds.yMax && yScaled > bounds.yMin)
        this.ctx.lineTo(xScaled, yScaled);
    }

    this.ctx.stroke();
    this.resetOrigo();
  }

  // Conevenience, will plot all plottable content added to PlotView instance.
  plotAll() {
    this.polynomialCurves.forEach(curve => {
      this.plotPolynomialCurve(curve);
    });
  }

  // Meaningless method, here for future regard
  addPolynomialCurve(curve) {
    this.polynomialCurves.push(curve);
  }

  drawCross(point) {
    this.setOrigo();
    this.clearUpdateGraph();

    this.ctx.strokeStyle = this.style.crossColor;
    this.ctx.beginPath();
    this.ctx.moveTo(point.x - 5, point.y);
    this.ctx.lineTo(point.x + 5, point.y);
    this.ctx.moveTo(point, point.y - 5);
    this.ctx.lineTo(point.x, point.y + 5);
    this.ctx.stroke();

    this.resetOrigo();
  }

  // Event handler for mouse move event
  snapToClosestPolynomialCurve(e) {
    let x = e.offsetX;
    let y = e.offsetY;
    let closestPoint = {distance: 99999, x: 0, y:0};

    this.polynomialCurves.forEach(curve => {
      let distance = curve.calcDistance(x, y)
      if (distance < closestPoint.distance) {
        let closestX = curve.getClosestX(x);
        closestPoint = {
          distance: distance,
          x: closestX,
          y: curve.evalPoint(closestX) };
      }
    });

    this.drawCross(closestPoint);
  }

  // Create canvas element and initialize 2d context
  makeCanvas() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

 // Top level method using defaultPlotStyle (TODO: rename default..) to create
 // a graph view.
  makePlotView() {
    // Make sure a origo is set (last fallback)
    if (typeof this.origo === "undefined")
     this.origo = {x: this.width / 2, y: this.height / 2};

    this.setBackground();
    if (this.style.grid) this.makeGrid();
    if (this.style.axis) this.makeAxis();
    if (this.style.ticks) {
       this.makeTicksX();
       this.makeTicksY();
    }
  }

  makeAxis() {
    this.setOrigo();
    let bounds = this.getBounds();

    this.ctx.strokeStyle = this.style.axisColor;
    this.ctx.beginPath();
    this.ctx.moveTo(0, bounds.yMin);
    this.ctx.lineTo(0, bounds.yMax);

    this.ctx.moveTo(bounds.xMin, 0);
    this.ctx.lineTo(bounds.xMax, 0);
    this.ctx.stroke();

    this.resetOrigo();
  }

  // Both tick funtions has much room for improvement, but at the  moment they
  // work for most usecases, while they dont yet handle edgecases nor any
  // customization beside color.
  makeTicks() {
    this.ctx.strokeStyle = this.style.tickColor;
    this.makeTicksX();
    this.makeTicksY();
  }

  makeTicksX() {
    this.setOrigo();
    let bounds = this.getBounds();

    this.ctx.beginPath();
    for (let x = 0; x < bounds.xMax; x+=this.unitsize) {
     this.ctx.moveTo(x, 0);
     this.ctx.lineTo(x, 5);
    }
    for (let x = 0; x > bounds.xMin; x-=this.unitsize) {
     this.ctx.moveTo(x, 0);
     this.ctx.lineTo(x, 5);
    }
    this.ctx.stroke();
    this.resetOrigo();
  }

  makeTicksY() {
    this.setOrigo();
    let bounds = this.getBounds();

    this.ctx.beginPath();
    for (let y = 0; y < bounds.yMax; y+=this.unitsize) {
     this.ctx.moveTo(0, y);
     this.ctx.lineTo(5, y);
    }
    for (let y = 0; y > bounds.yMin; y-=this.unitsize) {
     this.ctx.moveTo(0, y);
     this.ctx.lineTo(5, y);
    }
    this.ctx.stroke();
    this.resetOrigo();
  }

  // Make origo centric grid
  makeGrid() {
    this.setOrigo();
    let bounds = this.getBounds();

    this.ctx.strokeStyle = this.style.gridColor;
    this.ctx.beginPath();

    // As origo defines grid layout this cumbersome multiloop setup is required
    for (let x = 0; x < bounds.xMax; x+=this.unitsize) {
     this.ctx.moveTo(x, bounds.yMin);
     this.ctx.lineTo(x, bounds.yMax);
    }
    for (let x = 0; x > bounds.xMin; x-=this.unitsize) {
     this.ctx.moveTo(x, bounds.yMin);
     this.ctx.lineTo(x, bounds.yMax);
    }

    for (let y = 0; y < bounds.yMax; y+=this.unitsize) {
     this.ctx.moveTo(bounds.xMin, y);
     this.ctx.lineTo(bounds.xMax, y);
    }
    for (let y = 0; y > bounds.yMin; y-=this.unitsize) {
     this.ctx.moveTo(bounds.xMin, y);
     this.ctx.lineTo(bounds.xMax, y);
    }
    this.ctx.stroke();

    this.resetOrigo();
  }

  setBackground() {
    this.ctx.fillStyle = this.style.bgColor;
    this.ctx.fillRect(0, 0, this.height, this.width);
  }

  // Return a object with canvas bounds considered origo postion
  getBounds() {
    return {
      xMin: -this.origo.x,
      xMax: this.width - this.origo.x,
      yMin: this.origo.y - this.height,
      yMax: this.origo.y
    };
  }

  // Conevenience method for setting origo to named positions
  moveOrigo(vPos, hPos) {
    if (vPos == "top") var y = 0;
    if (vPos == "center") var y = p.height / 2;
    if (vPos == "bottom") var y = p.height;

    if (hPos == "left") var x = 0;
    if (hPos == "center") var x = p.width / 2;
    if (hPos == "right") var x = p.width;

    this.origo = {x: x, y: y};
  }

  // Translate and scale to emulate a usual grahing coordinate system
  // also: canvas context specific method coupled with resetOrigo
  setOrigo() {
    this.ctx.save();
    // Translate origo to specified point
    this.ctx.translate(this.origo.x, this.origo.y);
    // Do vertical flip
    this.ctx.scale(1, -1);
  }

  // Coupled with setOrigo, only exists to make coupling to setOrigo more clear
  resetOrigo() {
    this.ctx.restore();
  }
}
