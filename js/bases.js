


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

        // fixed points
        this.origin = new Array( bases.length ).fill( 0 );
        this.terminal = this.bases.map( x => x - 1 );
        this.diagonal = [ this.origin, this.terminal ];

        // since each coord plus it's reflection in the centre equals the terminal
        this.sum = this.terminal.map( ( x, i ) => x * this.volume / 2 );
        // even times odd has to be even
        this.indexSum = ( this.volume * ( this.volume - 1 ) / 2 );

        // indexing
        this.powersForward = placeValuesForward( bases );
        this.powersReverse = placeValuesReverse( bases );

        // coord index functions
        this.indexForward = ( coord ) => this.powersForward.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c );
        this.indexReverse = ( coord ) => this.powersReverse.map( (b,i) => b * coord[i] ).reduce( (a,c) => a + c );

        // plane of iniquity
        this.centre = this.bases.map( x => ( x - 1 ) / 2 );
        this.rawPlane = this.powersForward.map( ( x, i ) => x - this.powersReverse[i] );
        this.unitNormal = unitDisplacement( this.origin, this.rawPlane );
    }

    getJson() {
        return {
            "volume": this.volume,
            "sum": canonicalize( this.sum, ', ', SQUARE_BRA ),
            "units": canonicalize( this.bases, ', ', SQUARE_BRA ),
            "centre": canonicalize( this.centre, ', ', SQUARE_BRA ),
            "forward": canonicalize( this.powersForward, ', ', SQUARE_BRA ),
            "reverse": canonicalize( this.powersReverse, ', ', SQUARE_BRA ),
            "axis": canonicalize( this.centre.map( x => truncate( x, 10000 ) ), ', ', SQUARE_BRA ),
            "normal": canonicalize( this.unitNormal.map( x => truncate( x, 10000 ) ), ', ', SQUARE_BRA )
        };
    }

    toString() {
        return JSON.stringify( this.getJson(), null, 4 );
    }
}


class Coord {
    constructor( coord = [], id, di, cid ) {
        this.coord = [ ...coord ];
        this.id = id;
        this.di = di;
        this.jump = ( this.di - this.id );
        this.radiant = Math.abs( cid - this.id );
    }

    tension() {
        return ( this.radiant - this.jump );
    }

    toString() {
        return canonicalize( this.coord );
    }
}



// param = { bases:[1], coordId: , inverseCoordId: ,idx:[], dix:[] }
function generateIndexes( param, index = 0, coord = [] ) {
    if ( index == param.bases.length ) {
        const volume = param.volume;
        const id = param.coordId( coord );
        const di = param.inverseCoordId( coord );
        const item = new Coord( coord, id, di, ( volume - 1 ) / 2 );
        param.idx[ id ] = item;
        param.dix[ di ] = item;
    } else {
        for ( var i = 0; i < param.bases[index]; i++) {
            coord.push( i );
            generateIndexes( param, index + 1, coord );
            coord.pop( i );
        }
    }
}