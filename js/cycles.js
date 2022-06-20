
const pointId = ( point ) => point.id;
const pointCoord = ( point ) => `(${ point.coord.join( "," ) })`;
const pointLabel = pointId;


function isCycles( value ) {
    return value instanceof CyclesArray;
}


class CyclesArray extends Array {

    static getCycles( factors ) {
        const [ coprime, cofactor ] = factors;
        const volume = factors.reduce( ( a, c ) => a * c, 1 );
        const terminal = volume - 1;
        const truncated = false;
        return getMultiplicativeGroupMember( terminal, coprime, truncated );
    }

    static magnifyPoint( c, magnification ) {
        const point = {
            id: c.id * magnification,
            di: c.di * magnification,
            coord: [ ...c.coord ]
        };
        point.toString = () => pointLabel( point );
        return point;
    }

    static offsetPoint( c, k, volume = 1 ) {
        const point = {
            id: ( c.id + ( k * volume ) ),
            di: ( c.di + ( k * volume ) ),
            coord: [ ...c.coord, k ]
        };
        point.toString = () => pointLabel( point );
        return point;
    }

    getBases() {
        return this[ this.length - 1 ][0].coord.map( i => i + 1 );
    }

    getVolume() {
        return this.reduce( ( a, c ) => a + c.length, 0 );
    }

    getRank() {
        return this.getBases().length;
    }

    cycleNotation() {
        return this.map( cycle => "(" + cycle.map( p => p.id ).join(',') + ")" ).join( '' );
    }

    toString() {
        return this.map( cycle => "(" + cycle.map( p => p.id ).join(',') + ")" ).join( '' );
    }

    stats() {
        const rank = this.getRank();
        return this.map( cycle => {
            const order = cycle.length;
            const centre = new Array( rank ).fill( 0 );
            const coordSum = new Array( rank ).fill( 0 );
            cycle.forEach( point => {
                for ( var i = 0; i < rank; i++ ) {
                    sum[i] += point.coord[i];
                }
            } );
            coordSum.forEach( ( s, i ) => {
                centre[i] = s / cycle.length;
            } );

            const indexPerimeter = cycles
                .map( (point,i) => cycle[ ( i + 1 ) % order ].id - point.id )
                .reduce( (a,c) => a + c, 0 );

            const euclideanPerimeter = cycles
                .map( (point,i) => distance2( point.coord, cycle[ ( i + 1 ) % order ].coord ) )
                .reduce( (a,c) => a + c, 0 );

            return {
                order,
                centre,
                coordSum: coordSum,
                gcd: sum.reduce( gcd ),
                lcm: sum.reduce( lcm ),
                indexPerimeter: indexPerimeter,
                euclideanPerimeter: euclideanPerimeter,
                cycles: this
            }

        } );

    }


    monomial() {
        const monomial  = {};
        this.forEach( cycle => monomial[cycle.length] = ( cycle.length in monomial )
            ? monomial[cycle.length] + 1
            : 1 );
        Object.entries( monomial ).sort( (a, b) => a < b );
        return monomial;
    }

    expand( copies = 1, harmonic = false ) {
        if ( copies < 2 ) {
            return this;
        }
        const cycles = new CyclesArray();
        if ( harmonic ) {
            const template = this.map( cycle => cycle.map( c => CyclesArray.magnifyPoint( c, copies ) ) );
            for ( var k = 0; k < copies; k++ ) {
                template.forEach( cycle => cycles.push( cycle.map( c => CyclesArray.offsetPoint( c, k ) ) ) );
            }
        } else {
            const volume = this.getVolume();
            for ( var k = 0; k < copies; k++ ) {
                this.forEach( cycle => cycles.push( cycle.map( c => CyclesArray.offsetPoint( c, k, volume ) ) ) );
            }
        }
        return cycles;
    }

    htmlMonomial() {
        return reify( "span", { 'class': 'monomial' }, Object
            .entries( this.monomial() )
            .filter( ( [ k, e ] ) => k > 1 )
            .flatMap( ( [ k, e ] ) => [
                reify( "i", {}, [ reifyText( k == 1 ? "e" : "a" )  ] ),
                reify( "sup", {}, [ reifyText( `${ e }` ) ] ),
                k == 1
                    ? null
                    : reify( "sub", { 'style': 'position: relative; left: -.5em;'}, [ reifyText( `${ k }` ) ] )
            ] ) );
    }
}