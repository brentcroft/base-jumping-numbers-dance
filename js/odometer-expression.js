
class Operation {

    constructor( scripts ) {
        this.scripts = scripts.split( ';' ).filter( s => s.trim().length > 0 );
        this.tree = [];
        this.names = {};
        this.scripts.forEach( script => {
            const parser = new nearley.Parser( nearley.Grammar.fromCompiled( grammar ) );
            parser.feed( script );
            this.tree.push( parser.results[0] );
        } );
//        console.log( JSON.stringify( this.tree, null, 2 ) );
    }

    evaluate() {
        const result = this.processTree( this.tree );
        this.result = result instanceof Cycles ? [ result ] : result;
//        console.log( result );
        return this.result.filter( r => r != null && (!Array.isArray( r ) || r.length > 0 ) );
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
            const leaf = this.processLeaf( tree );
            if ( tree.name ) {
                this.names[tree.name] = leaf;
            }
            return leaf;
        }
    }

    processLeaf( leaf ) {
        if ( leaf == null ) {
            return;
        }
        const op = leaf.op;
        const maybeBrackets = (s) => s && (
            s.length < 3 || (s.startsWith('(') && s.endsWith(')'))
           ) ? s : `(${s})`;

        if ( 'name' == leaf.type ) {
            const candidate = this.names[leaf.text];
            if (!candidate) {
                throw new Error( `No such named object: ${ leaf.text }` );
            }
            return candidate;
        }

        switch ( op ) {

            case "mg":
            {
                const mge = getMultiplicativeGroupMember( leaf.group, leaf.coprime );
                const cofactor = (leaf.group + 1) / leaf.coprime;
                const box = Box.of(
                    Number.isInteger(leaf.cofactor)
                        ? [ leaf.cofactor, leaf.coprime ]
                        : [ leaf.group + 1 ]
                );
                const source = {
                    'index': mge.index,
                    'key': `(${ leaf.coprime } @ ${ leaf.group })`,
                    'box': box
                };
                const action = cycles( source );
                return action;
            }

            case "index":
            {
                const specifiedBases = leaf.box.bases;
                const box = Box.of( specifiedBases );
                var perms = [];
                var spec = ' ';
                if (Object.hasOwn( leaf, 'perms' ) ) {
                    spec += leaf.perms.map( p => `[${p}]` ).join('');
                    const invalidPerms1 = leaf.perms.filter( perm => perm.length != specifiedBases.length );
                    if (invalidPerms1.length > 0) {
                        const error = invalidPerms1.map( p => `[${ p }]` ).join(',')
                        throw new Error( `Invalid perms: ${ error } cannot apply to box: ${ box.odometer.bases }` );
                    }
                    perms.push( ...leaf.perms.map( perm => box.permBox.find( point => arrayExactlyEquals( perm, point.perm ) ) ) );
                    const invalidPerms2 = perms.map( (p,i) => p ? -1 : i ).filter(x => x > -1);
                    if (invalidPerms2.length > 0) {
                        const error = invalidPerms2.map( i => leaf.perms[i] ).map( p => `[${ p }]` ).join(',')
                        throw new Error( `Invalid perms: ${ error } not found in box: ${ box.odometer.bases }` );
                    }
                    perms.reverse();
                } else if (Object.hasOwn( leaf, 'facts' ) ) {
                    spec += leaf.facts.map( p => `{${p}}` ).join('');
                    perms.push( ...leaf.facts.map( fact => {
                        const x = box.permBox.find( point => {
                            const p = arrayExactlyEquals( fact, point );
                            return p;
                        } );
                        return x;
                    } ) );
                    const invalidPerms2 = perms.map( (p,i) => p ? -1 : i ).filter(x => x > -1);
                    if (invalidPerms2.length > 0) {
                        const error = invalidPerms2.map( i => leaf.facts[i] ).map( p => `[${ p }]` ).join(', ')
                        throw new Error( `Invalid perm points: ${ error } not found in box: ${ box.odometer.bases }` );
                    }
                    perms.reverse();
                }
                if ( perms.length > 2 ) {
                    // ok
                } else {
                    const tally = [...specifiedBases];
                    const perm0 = box.odometer.bases.map( (b,i) => {
                        const v = tally.indexOf(b);
                        tally[v] = -1;
                        return v;
                    });

                    if ( perms.length == 1 ) {
                        perm0.reverse();
                        perms.push( box.permBox.find( point => arrayExactlyEquals( perm0, point.perm ) ) );
                    } else if ( perms.length == 0 ) {
                        const perm1 = [...perm0];
                        perm1.reverse();
                        perms = [
                            box.permBox.find( point => arrayExactlyEquals( perm0, point.perm ) ),
                            box.permBox.find( point => arrayExactlyEquals( perm1, point.perm ) ),
                        ];
                    }
                }

                const cycles = compose( perms[0], perms[1], true, box );
                cycles.permPair = perms;
                cycles.key = specifiedBases.join(':') + spec;
                if ( leaf.name ) {
                    cycles.name = leaf.name;
                }
                return cycles;
            }

            case "compose":
            {
                const l = this.processTree( leaf.l );
                const r = this.processTree( leaf.r );
                const cycles = compose( l, r, false, r.box );
                cycles.key = `${ maybeBrackets( l.ref() ) } * ${ maybeBrackets( r.ref() ) }`;
                return cycles;
            }

//            case "twist":
//            {
//                const l = leaf.l;
//                const r = leaf.r;
//                const b = Box.of([l,r]);
//                const [ i0, i1 ] = [ l > r ? 1 : 0, l > r ? 0 : 1 ];
//                const cycles = compose( b.permBox[i0], b.permBox[i1], true, b );
//                cycles.parity = l > r;
//                return cycles;
//            }

            case "product":
            {
                const twist = false;
                var l = Number.isInteger( leaf.l ) ? leaf.l : this.processTree( leaf.l );
                var r = Number.isInteger( leaf.r ) ? leaf.r : this.processTree( leaf.r );
                const key = `${ l.ref() } ~ ${ r.ref() }`;
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
                cycles.key = key;
                return cycles;
            }

            case "power":
            {
                const exp = leaf.r;
                var start = this.processTree( leaf.l );
                const key = `${ start.ref() } ^ ${ exp }`;
                if ( Number.isInteger( start ) ) {
                    start = Box.of( [ start ] ).permBox[0];
                }
                var locus = start;
                if ( exp < 1 ) {
                    var locus = inverse( start );
                    for ( var i = -1; i > exp; i-- ) {
                        locus = compose( start, locus, false, locus.box );
                    }
                } else if ( exp > 1 ) {
                    for ( var i = 1; i < exp; i++ ) {
                        locus = compose( start, locus, false, locus.box );
                    }
                }
                locus.key = key;
                return locus;
            }
        }
    }
}