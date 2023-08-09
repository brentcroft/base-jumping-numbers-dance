
class Operation {

    constructor( script ) {
        this.script = script;

        const parser = new nearley.Parser( nearley.Grammar.fromCompiled( grammar ) );
        parser.feed( this.script );
        this.tree = parser.results[0];
//        console.log( JSON.stringify( this.tree, null, 2 ) );
    }

    evaluate() {
        const result = this.processTree( this.tree );
        this.result = result instanceof Cycles ? [ result ] : result;
//        console.log( result );
        return this.result;
    }

    processTree( tree ) {
        if ( Array.isArray( tree ) ) {
            return tree.map( branch => this.processTree( branch ) );
        } else if ( tree instanceof Cycles ) {
            return tree;
        } else if ( Number.isInteger( tree ) ) {
            const box = Box.of( [ tree ] );
            return compose( box.permBox[0], box.permBox[0], false, box );
        } else {
            return this.processLeaf( tree );
        }
    }

    processLeaf( leaf ) {
        if ( leaf == null ) {
            return;
        }
        const op = leaf.op;
        switch ( op ) {
            case "compose":
            {
                const l = this.processTree( leaf.l );
                const r = this.processTree( leaf.r );
                const cycles = compose( l, r, false, r.box );
                return cycles;
            }
            case "twist":
            {
                const l = leaf.l;
                const r = leaf.r;
                const b = Box.of([l,r]);
                const [ i0, i1 ] = [ l > r ? 1 : 0, l > r ? 0 : 1 ];
                const cycles = compose( b.permBox[i0], b.permBox[i1], true, b );
                cycles.parity = l > r;
                return cycles;
            }

            case "product":
            {
                const twist = true;
                var l = Number.isInteger( leaf.l ) ? leaf.l : this.processTree( leaf.l );
                var r = Number.isInteger( leaf.r ) ? leaf.r : this.processTree( leaf.r );
                const bases = [];
                if (Number.isInteger( l )) {
                    bases.push( l );
                    l = Box.of( [ l ] ).permBox[0];
                } else {
                    bases.push( ...l.box.odometer.bases );
                }
                if (Number.isInteger( r )) {
                    bases.push( r );
                    r = Box.of( [ r ] ).permBox[0];
                } else {
                    bases.push( ...r.box.odometer.bases );
                }
                const cycles = product( l, r, twist, Box.of( bases ) );
                return cycles;
            }

            case "product2":
            {
                const twist = false;
                var l = Number.isInteger( leaf.l ) ? leaf.l : this.processTree( leaf.l );
                var r = Number.isInteger( leaf.r ) ? leaf.r : this.processTree( leaf.r );
                const bases = [];
                if (Number.isInteger( l )) {
                    bases.push( l );
                    l = Box.of( [ l ] ).permBox[0];
                } else {
                    bases.push( ...l.box.odometer.bases );
                }
                if (Number.isInteger( r )) {
                    bases.push( r );
                    r = Box.of( [ r ] ).permBox[0];
                } else {
                    bases.push( ...r.box.odometer.bases );
                }
                const cycles = product( l, r, twist, Box.of( bases ) );
                return cycles;
            }

            case "power":
            {
                const exp = leaf.r;
                var start = this.processTree( leaf.l );
                if (Number.isInteger( start )) {
                    start = Box.of( [ start ] ).permBox[0];
                }
                var locus = start;
                if ( exp < 1 ) {
                    var locus = inverse( start );
                    for ( var i = 0; i >= exp; i-- ) {
                        locus = compose( start, locus, false, locus.box );
                    }
                } else if ( exp > 1 ) {
                    for ( var i = 1; i < exp; i++ ) {
                        locus = compose( start, locus, false, locus.box );
                    }
                }
                return locus;
            }
        }
    }
}