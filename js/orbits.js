
var basePlanes = {};

function getBasePlane( key ) {
    return basePlanes[key];
}

function putBasePlane( key, basePlane ) {
    basePlane.key = key;
    basePlanes[key] = basePlane;

    //console.log( basePlane );
}


function truncate( value, places = 100 ){
    return Math.round( places * value ) / places;
}

function formattedWeight( weight ) {
    return ( weight[0] == 0 )
            ? 0
            : ( weight[0] == weight[1] || weight[2] == 0 )
                ? 1
                : ( weight[0] / weight[2] ) + " / " + ( weight[1] / weight[2] );
}



class Orbit {

    constructor( parent, index, coords ) {
        this.parent = parent;
        this.index = index;
        this.midi = {
            "instrument": 0,
            "channel": 0,
            "percussion": 0,
            "repeats": 0
        };
        this.coords = coords;

        this.rank = this.coords[0].coord.length;
        this.order = this.coords.length;
        this.centre = new Array( this.rank ).fill( 0 );

        this.sum = new Array( this.rank ).fill( 0 );
        this.coords.forEach( ( item, index ) => {
            for ( var i = 0; i < this.rank; i++ ) {
                this.sum[i] += item.coord[i];
            }
        } );

        this.sum.forEach( ( s, index ) => {
            this.centre[index] = s / this.order;
        } );

        // passing lambdas gcd and lcm
        this.gcd = this.sum.reduce( gcd );
        this.lcm = this.sum.reduce( lcm );
    }

    torsion() {
        return ( this.indexRadiance - this.indexPerimeter );
    }

    tension() {
        return ( this.euclideanRadiance - this.euclideanPerimeter );
    }

    isSelfConjugate() {
        return this.index == this.conjugate.index;
    }

    isFirstConjugate() {
        return this.index < this.conjugate.index;
    }

    getCoordArray() {
        return this
            .coords
            .map( c => c.coord );
    }

    getLineRef() {
        return this.parent.centrePoints[this.centreRef].lineRef;
    }

    getMembers() {
        return this.coords.join( C_SEP )
    }

    getIdSum() {
        return this.coords.reduce( (a, coord ) => a + coord.indexes[this.parent.id].id, 0 );
    }

    getDiSum() {
        return this.coords.reduce( (a, coord ) => a + coord.di.indexes[this.parent.id], 0 );
    }
}