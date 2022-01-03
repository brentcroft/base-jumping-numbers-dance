


class Particle() {

    constructor( mass, location, velocity ) {
        this.mass = mass;
        this.location = location;
        this.velocity = velocity;
    }
}

class ParticleSystem() {
    constructor() {
        this.particles = [];
    }

    advance() {

        function advanceParticle( particle ) {

        }

        this
            .particles
            .forEach( particle => advanceParticle( particle ) );
    }
}