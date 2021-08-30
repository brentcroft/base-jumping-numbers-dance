


/*
    calculate array of base values
    accumulating forwards.
*/
function placeValuesForward( bases ) {
        var acc = 1;
        const p = [];
        for ( var i = 0; i < bases.length; i++ ) {
            p.push( acc );
            acc = acc * bases[i];
        }
        return p;
    };
/*
    calculate array of base values
    accumulating in reverse.
*/
function placeValuesReverse( bases ) {
        var acc = 1;
        const p = [];
        for ( var i = bases.length - 1; i >= 0; i-- ) {
            p.push( acc );
            acc = acc * bases[i];
        }
        return [].concat( p ).reverse();
    };

/*
    calculate the base plane
*/
class BaseBox {
    constructor( bases ) {
        this.bases = [].concat( bases );
        this.volume = this.bases.reduce( ( a, c ) => a * c, 1 );

        this.brilliance = this.getBrilliance();

        // since each coord plus it's reflection in the centre equals the terminal
        this.sum = this.bases.map( ( x, i ) => ( x - 1 ) * this.volume / 2 );

        // even times odd has to be even
        this.indexSum = ( this.volume * ( this.volume - 1 ) / 2 );
        this.indexCentre = ( this.volume - 1 ) / 2;



        // fixed points
        this.origin = new Array( bases.length ).fill( 0 );
        this.terminal = this.bases.map( x => x - 1 );
        this.diagonal = [ this.origin, this.terminal ];

        // indexing
        this.powersForward = placeValuesForward( bases );
        this.powersReverse = placeValuesReverse( bases );

        // coord index functions
        this.indexForward = ( coord ) => this.powersForward.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, 0 );
        this.indexReverse = ( coord ) => this.powersReverse.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c, 0 );

        // plane of iniquity
        this.centre = this.bases.map( x => ( x - 1 ) / 2 );
        this.rawPlane = this.powersForward.map( ( x, i ) => x - this.powersReverse[i] );
        this.rawPlaneGcd = Math.abs( gcda( this.rawPlane ) );
        this.unitNormal = unitDisplacement( this.origin, this.rawPlane );
    }

    getPlaneEquationTx() {
        const basis = this.rawPlane.length;
        const varIds = d => [ "x", "y", "z" ].map( x => `<i>${ x }</i>` )[d];
        var plane = this
            .rawPlane
            .map( x => x );
        var planeMid = plane
            .map( ( x, i ) => `${ x < 0 ? " + " : " - " }${ Math.abs( x ) }${ varIds( i ) }` )
            .slice( 1, basis - 1 )
            .join("");

        var eqn = `${ -1 * plane[0] }${ varIds( 0 ) }`;
        eqn += `${ planeMid }`;
        eqn += " = ";
        eqn += `${ plane[ basis - 1 ] }${ varIds( basis - 1) }`;
        return eqn;
    }

    /**
     The sum of the length of each ray from each coordinate
     to its reflection in the box centre.
    */
    getBrilliance() {

        const sumTriangles = ( n ) => n * ( n + 1 ) / 2;
        const sumSquares = ( n ) => n * ( n + 1 ) * ( 2 * n + 1 ) / 6;
        const volumeFactor = ( b ) => ( this.volume / b );

        const bases = this.bases;

        const d = bases.map( b => this.volume * ( b - 1 )**2 );
        const e = bases.map( b => 4 * volumeFactor( b ) * ( b - 1 ) * sumTriangles( b - 1 ) );
        const f = bases.map( b => 4 * volumeFactor( b ) * sumSquares( b - 1 ) );

        const [ c, s, t ] = [
            d.reduce( (a,c) => a + c, 0 ),
            e.reduce( (a,c) => a + c, 0 ),
            f.reduce( (a,c) => a + c, 0 )
        ];

        return c - s + t;
    }


    getJson() {
        return {
           bases: this.bases,
           volume: this.volume,
           sum: this.sum,
           idSum: this.indexSum,
           id: this.powersForward,
           di: this.powersReverse,
           plane: this.rawPlane,
           gcd: this.rawPlaneGcd,
       };
    }

    toString() {
        return JSON.stringify( this.getJson(), null, 4 );
    }
}


class Coord {
    constructor( coord = [], id, di, box ) {
        this.coord = [ ...coord ];
        this.id = id;
        this.di = di;
        this.reflectId = ( box.volume - id - 1 );
        this.jump = ( this.di - this.id );
        this.radiant = Math.abs( this.reflectId - this.id );
        //this.radiant = Math.abs( box.indexCentre - this.id );
    }

    torsion() {
        return ( this.radiant - this.jump );
    }

    toString() {
        return canonicalize( this.coord );
    }
}

class Ray {
    constructor( coord1, coord2 ) {
        this.coord1 = coord1;
        this.coord2 = coord2;
    }
}



// param = { box: , indexForward: , indexReverse: ,idx:[], dix:[] }
function generateIndexes( param, index = 0, coord = [] ) {
    const { box = null, indexForward = null, indexReverse = null, idx = [], dix = [] } = param;
    if ( index == box.bases.length ) {
        const volume = box.volume;
        const id = indexForward( coord );
        const di = indexReverse( coord );
        const item = new Coord( coord, id, di, box );
        idx[ id ] = item;
        dix[ di ] = item;
    } else {
        for ( var i = 0; i < box.bases[index]; i++) {
            coord.push( i );
            generateIndexes( param, index + 1, coord );
            coord.pop( i );
        }
    }
}