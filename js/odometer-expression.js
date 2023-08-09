
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
        const maybeBrackets = (s) => s.startsWith('(') && s.endsWith(')')
            ? s
            : `(${s})`
        switch ( op ) {
            case "index":
            {
                const specifiedBases = leaf.box.bases;
                const box = Box.of( specifiedBases );
                var perms = null;
                if (Object.hasOwn( leaf, 'perms' ) ) {
                    perms = [
                        box.permBox.find( point => arrayExactlyEquals( leaf.perms[0], point.perm ) ),
                        box.permBox.find( point => arrayExactlyEquals( leaf.perms[1], point.perm ) )
                    ];
                } else {
                    const tally = [...specifiedBases];
                    const perm0 = box.odometer.bases.map( (b,i) => {
                        const v = tally.indexOf(b);
                        tally[v] = -1;
                        return v;
                    });
                    const perm1 = [...perm0].reverse();
                    perms = [
                        box.permBox.find( point => arrayExactlyEquals( perm0, point.perm ) ),
                        box.permBox.find( point => arrayExactlyEquals( perm1, point.perm ) )
                    ];
                }
                const cycles = compose( perms[0], perms[1], true, box );
                cycles.permPair = perms;
                cycles.alias = specifiedBases.join(':');
//                cycles.parity = l > r;
                return cycles;
            }

            case "compose":
            {
                const l = this.processTree( leaf.l );
                const r = this.processTree( leaf.r );
                const cycles = compose( l, r, false, r.box );
                cycles.alias = `${ maybeBrackets( l.alias ) }*${ maybeBrackets( r.alias ) }`;
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
                cycles.alias = `${ l.alias }~${ r.alias }`;
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
                cycles.alias = `${ l.alias }|${ r.alias }`;
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