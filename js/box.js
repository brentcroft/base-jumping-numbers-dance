
function canonicalPerm(perm) {
    function ios( perm ) {
        var l = 0;
        for (var i = 1; i < perm.length; i++) {
            if ( perm[ i ] < perm[ l ] ) {
                l = i;
            }
        }
        return l;
    }
    const r = ios( perm );
    return [ rotateArray( [...perm], r ), r ];
}

function getRankPermShapes( rank ) {
    const humpGroups = [];
    const basePerms = permutations( new Array( rank ).fill( 0 ).map((x,i)=>i) );

    const canonicalPerms = {};
    const canonicalAntiPerms = {};

    basePerms.forEach( (perm, i) => {
        if ( perm == -1 ) {
            return;
        }
        const aPerm = [...perm].reverse();

        const [ cPerm, ci ] = canonicalPerm(perm);
        const [ iPerm, ii ] = canonicalPerm(aPerm);

        if ( cPerm in canonicalPerms || cPerm in canonicalAntiPerms || iPerm in canonicalPerms || iPerm in canonicalAntiPerms ) {
        } else {
            canonicalPerms[cPerm] = cPerm;
            canonicalAntiPerms[iPerm] = iPerm;
        }

        const aPermIndex = basePerms.findIndex( p => arrayExactlyEquals(p,aPerm));
        basePerms[aPermIndex] = -1;
        basePerms[i] = -1;
    } );
    return Object.values(canonicalPerms);
}

function permProduct( leftBases, leftPair, rightBases, rightPair, twist ) {
    const bases = [ ...leftBases, ...rightBases ];
    // tally each side to account for any duplicates
    const tallyX = [...bases];
    const tallyY = [...bases];
    const tallyAllocate = ( b, antiPerm ) => {
        const tally = antiPerm == 1 ? tallyX : tallyY;
        const i = tally.indexOf(b);
        tally[i] = -1;
        return i;
    };
    // unpack bases in each side and re-allocate bases per tally
    const [ lcPerm, lcAntiPerm ] = leftPair
        .map( x => x.map( i => leftBases[i] ) )
        .map( (x, antiPerm) => x.map( b => tallyAllocate( b, antiPerm ) ) );
    const [ rcPerm, rcAntiPerm ] = rightPair
        .map( x => x.map( i => rightBases[i] ) )
        .map( (x, antiPerm) => x.map( b => tallyAllocate( b, antiPerm ) ) );
    const antiPerm = [...lcPerm, ...rcPerm];
    const perm = [...lcAntiPerm, ...rcAntiPerm ];
    // maybe with a twist
    if ( twist ) {
        antiPerm.reverse();
    }
    return [ perm, antiPerm ];
}

class BoxPerm {
    constructor( box, perm = [], shape = [], shapeIndex = 0, rotation = 0, parity = true ) {
        this.box = box;
        this.perm = perm;
        this.shape = shape;
        this.shapeIndex = shapeIndex;
        this.rotation = rotation;
        this.parity = parity;
        // TODO: when is perm != permInv
        this.permInv = [];
        perm.forEach( (p,i) => this.permInv[p] = i );
    }
    symbols() {
        return `${ this.shapeIndex == 0 ? '' : this.shapeIndex }${ AbstractBox.ROTATION_KEYS[ this.rotation ] }${ arrowUp( this.parity ) }`;
    }
    toString() {
        return this.symbols();
    }
    denormalizeCoord( coord ) {
        return this.permInv.map( i => coord[i] );
    }
    normalizeCoord( coord ) {
        return this.shape.map( i => coord[i] );
    }
    getBases() {
        return this.denormalizeCoord(this.box.bases);
    }
}

class BoxPermPair {
    constructor( box, bases, perm, coPerm ) {

        const bx = canonicalCoordinateMap( bases );
        const bxr = b => bx.map( x => b[ x ] );

        this.boxPerms = [
            box.identifyPerm( bxr( perm ) ),
            box.identifyPerm( bxr( coPerm ) )
        ];

        this.left = box.identifyPerm( perm );
        this.right = box.identifyPerm( coPerm );

        this.leftPlaceValues = placeValuesPermutation( bases, perm );
        this.rightPlaceValues = placeValuesPermutation( bases, coPerm );

        this.ip_coord = this.leftPlaceValues.map( ( x, i ) => x - this.rightPlaceValues[i] );

        this.indexRev = ( coord ) => this.leftPlaceValues.map( (b,i) => b * coord[i] ).reduce( ( a, c ) => a + c, 0 );
        this.indexFwd = ( coord ) => this.rightPlaceValues.map( (b,i) => b * coord[i] ).reduce( ( a, c ) => a + c, 0 );
    }

    toString() {
        const [ left, right ] = this.boxPerms;
        return `${ left.symbols() }~${ right.symbols() }=${ left.perm }/${ right.perm }=${ this.leftPlaceValues }/${ this.rightPlaceValues }`;
    }

    static directProduct( box, leftBases, leftBoxPermPair, rightBases, rightBoxPermPair, twist ) {
        const bases = [ ...leftBases, ...rightBases ];
        // tally each side against canonical bases to account for any duplicates
        const tallyX = [...bases];
        const tallyY = [...tallyX];
        const tallyAllocate = ( b, isCoPerm ) => {
            const tally = isCoPerm == 1 ? tallyX : tallyY;
            const i = tally.indexOf(b);
            tally[i] = -1;
            return i;
        };

        // unpack bases in each side and re-allocate bases per tally
        const [ lcPerm, lcAntiPerm ] = [ leftBoxPermPair.left.perm, leftBoxPermPair.right.perm ]
            .map( x => x.map( i => leftBases[i] ) )
            .map( (x, isCoPerm) => x.map( b => tallyAllocate( b, isCoPerm ) ) );

        const [ rcPerm, rcAntiPerm ] = [ rightBoxPermPair.left.perm, rightBoxPermPair.right.perm ]
            .map( x => x.map( i => rightBases[i] ) )
            .map( (x, isCoPerm) => x.map( b => tallyAllocate( b, isCoPerm ) ) );



        const perm = [...lcPerm, ...rcPerm];
        const antiPerm = [...lcAntiPerm, ...rcAntiPerm ];
        // maybe with a twist
        if ( twist ) {
            antiPerm.reverse();
        }
        return new BoxPermPair( box, bases, perm, antiPerm  );
    }
}

class AbstractBox {

    static ROTATION_KEYS = "αβγδεζηθικλμξνοπρςστυφχψω";

    constructor( bases ) {
        this.bases = [...bases].sort();
        this.rank = this.bases.length;
        this.permShapes = getRankPermShapes(this.rank);
    }

    getPermShape( shape = 0 ) {
        return this.permShapes[shape];
    }

    identifyPerm( perm ) {
        const aPerm = [...perm].reverse();
        const [ cPerm, ci ] = canonicalPerm(perm);
        const [ iPerm, ii ] = canonicalPerm(aPerm);
        var parity = true;
        const shapeIndex = this.permShapes.findIndex( sPerm => {
            const cMatch = arrayExactlyEquals( sPerm, cPerm );
            const iMatch = arrayExactlyEquals( sPerm, iPerm );
            if ( cMatch && iMatch ) {
                parity = ci < ii;
                return true;
            } else if ( cMatch ) {
                return true;
            } else if ( iMatch ) {
                parity = false;
                return true;
            } else {
                return false;
            }
        } );
        const rotation = parity
            ? cPerm.indexOf( perm[0] )
            : cPerm.indexOf( this.rank - 1 - perm[0] );

        return new BoxPerm( this, perm, this.permShapes[shapeIndex], shapeIndex, rotation, parity );
    }

    enumeratePerms() {
        return this
            .permShapes
            .flatMap( shape => shape
                .flatMap( (x,i) => [
                    rotateArray( [...shape], i ),
                    rotateArray( [...shape].reverse(), -1*i )
                ] ) );
    }
}


