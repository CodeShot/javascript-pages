/* PlotView
 * use plotGraph() to plot arbitrary amount of curves on canvas
 */

"use strict";
const defaultPlotStyle = {
  axis: true,
  grid: true,
  ticks: true,

  bgColor: "#ffffff",
  fgColor: "#000000",
  borderColor: "#000000",
  axisColor: "#aaaaaa",
  gridColor: "#eeeeee",
  tickColor: "#aaaaaa"
};

class PlotView {
  constructor(height, width, unitsize, style=defaultPlotStyle, origo=undefined) {
    this.width = width;
    this.height = height;
    this.unitsize = unitsize;
    this.style = style;
    this.origo = origo;
    this.id = "plotcanvas";

    this.makeCanvas();
    this.makePlotView();
  }

  clearGraph() {
      this.makePlotView();
  }

  injectToAnchor(anchorId) {
    if (typeof this.canvas === "undefined")
     return;
    this.canvas.setAttribute("id", this.id);

    let e = document.getElementById(anchorId);
    e.appendChild(this.canvas);
  }

  plotGraph(curve, plotRange, color) {
    //if (plotRange.start * this.unitsize < this.origo.x - this.width ||
    //    plotRange.end * this.unitsize > this.width - this.origo)
    //    return;

    this.setOrigo();

    this.ctx.strokeStyle = color;
    var firstPoint = true;

    this.ctx.beginPath();
    for (let xs = plotRange.start * this.unitsize;
     xs < plotRange.end * this.unitsize; xs++) {
     var x = xs / this.unitsize;
     var value = eval(curve);

     if (value * this.unitsize < this.origo.y &&
       value * this.unitsize > this.origo.y - this.height) {
         if(firstPoint) {
           this.ctx.moveTo(xs, value * this.unitsize);
           firstPoint = false;
         }
         else { this.ctx.lineTo(xs, value * this.unitsize); }
     }
    }
    this.ctx.stroke();
    this.resetOrigo();
  }

  makeCanvas() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  makePlotView() {
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

    this.ctx.strokeStyle = this.style.axisColor;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.origo.y);
    this.ctx.lineTo(0, this.origo.y - this.height);

    this.ctx.moveTo(-this.origo.x, 0);
    this.ctx.lineTo(this.width - this.origo.x, 0);
    this.ctx.stroke();
    this.resetOrigo();
  }

  makeTicks() {
    this.ctx.strokeStyle = this.style.tickColor;
    this.makeTicksX();
    this.makeTicksY();
    console.log("ticks: " + this.ctx.strokeStyle);
  }

  makeTicksX() {
    this.setOrigo();
    this.ctx.beginPath();
    for (let x = 0; x < this.width - this.origo.x; x+=this.unitsize) {
     this.ctx.moveTo(x, 0);
     this.ctx.lineTo(x, 5);
    }
    for (let x = 0; x > -this.origo.x; x-=this.unitsize) {
     this.ctx.moveTo(x, 0);
     this.ctx.lineTo(x, 5);
    }
    this.ctx.stroke();
    this.resetOrigo();
  }

  makeTicksY() {
    this.setOrigo();
    this.ctx.beginPath();
    for (let y = 0; y < this.origo.y; y+=this.unitsize) {
     this.ctx.moveTo(0, y);
     this.ctx.lineTo(5, y);
    }
    for (let y = 0; y > this.origo.y - this.height; y-=this.unitsize) {
     this.ctx.moveTo(0, y);
     this.ctx.lineTo(5, y);
    }
    this.ctx.stroke();
    this.resetOrigo();
  }

  makeGrid() {
    this.setOrigo();

    this.ctx.strokeStyle = this.style.gridColor;
    this.ctx.beginPath();
    for (let x = 0; x < this.width - this.origo.x; x+=this.unitsize) {
     this.ctx.moveTo(x, this.origo.y);
     this.ctx.lineTo(x, this.origo.y - this.height);
    }
    for (let x = 0; x > -this.origo.x; x-=this.unitsize) {
     this.ctx.moveTo(x, this.origo.y);
     this.ctx.lineTo(x, this.origo.y - this.height);
    }

    for (let y = 0; y < this.origo.y; y+=this.unitsize) {
     this.ctx.moveTo(-this.origo.x, y);
     this.ctx.lineTo(this.width - this.origo.x, y);
    }
    for (let y = 0; y > this.origo.y - this.height; y-=this.unitsize) {
     this.ctx.moveTo(-this.origo.x, y);
     this.ctx.lineTo(this.width - this.origo.x, y);
    }
    this.ctx.stroke();

    this.resetOrigo();
  }

  setBackground() {
    this.ctx.fillStyle = this.style.bgColor;
    this.ctx.fillRect(0, 0, this.height, this.width);
  }

  setOrigo() {
    this.ctx.save();
    // Translate origo to specified point
    this.ctx.translate(this.origo.x, this.origo.y);
    // Do vertical flip
    this.ctx.scale(1, -1);
  }

  resetOrigo() {
    this.ctx.restore();
  }
}
