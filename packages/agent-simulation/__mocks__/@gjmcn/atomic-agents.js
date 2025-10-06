class Simulation { constructor(init){ this.time=0; this.init=init; } step(){ this.time++; } }
class Actor { constructor(opts={}){ Object.assign(this, opts); } vis(){ return this; } addTo(){ return this; } }
module.exports = { Simulation, Actor };
