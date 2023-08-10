@{%
	// Moo lexer documention is here:
	// https://github.com/no-context/moo

	const moo = require("moo")
	const lexer = moo.compile({
        WS: /[ \t]+/,
        comment:    /\/\/.*?$|#.*?$/,
        number:     /-?[0-9]+/,
        string:     /"(?:\\["\\]|[^\n"\\])*"/,
        exp:        '^',
        star:       '*',
        colon:      ':',
        tilda:      '~',
        pipe:       '|',
        percent:    '%',
        comma:      ',',
        lparen:     '(',
        rparen:     ')',
        lsquare:    '[',
        rsquare:    ']',
        lcurly:     '{',
        rcurly:     '}',
        NL:    { match: /\n|;+/, lineBreaks: true },
	});
    const trimTree = ( a ) => {
		if ( a == null ) {
			return null;
		} else if ( Number.isInteger( a ) ) {
			return a;
		} else if ( Array.isArray( a ) ) {
			const candidate = a
				.map( b => trimTree( b ) )
				.filter( b => b != null )
				.filter( b => (!Array.isArray(b) || b.length > 0) );
			return Array.isArray(candidate) && candidate.length == 1
				? candidate[0]
				: candidate;
		} else if ( 'number' == a.type ) {
			return parseInt( a.text );
		} else if ( [
				'NL', 'WS', 'comment',
				'comma', 'lsquare', 'rsquare', 'lparen', 'rparen', 'lcurly', 'rcurly',
				'exp', 'star', 'colon', 'tilda', 'pipe', 'percent'
			].includes( a.type ) ) {
			return null;
		} else {
			return a;
		}
	};
	const buildOp = ( d, op ) => {
		const t = trimTree(d);
		if (Array.isArray(t) && t.length == 2 ) {
			return { 'op': op, 'l': t[0], 'r': t[1] };
		}
		return [ t ];
	};
	const buildFactuple = ( d, l, r ) => {
		var t = trimTree(d);
		if ( Array.isArray(t) ) {
			t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
		} else {
		    t = [ t ];
		}
        const invalidIndexes = t.filter( (c,i) => c > i + 1 );
        if ( invalidIndexes.length > 0 ) {
            throw new Error( `Invalid factorial point [${ t }]: values: ${ invalidIndexes }` );
        }
		return t;
	};
	const buildPerm = ( d, l, r ) => {
		var t = trimTree(d);
		if ( Array.isArray(t) ) {
			t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
			const missingIndexes = t.filter( (c,i) => t.indexOf(i) < 0 );
			if ( missingIndexes.length > 0 ) {
				throw new Error( `Invalid factorial perm [${ t }]: missing values: ${ missingIndexes }` );
			}
		}
		return t;
	};
	const buildBox = ( d ) => {
		const t = trimTree(d);
		if (Array.isArray(t) && t.length == 2 ) {
			if (Array.isArray(t[1])) {
				return { 'op': 'box', 'bases': [ t[0], ...t[1] ] };
			} else {
				return { 'op': 'box', 'bases': [ t[0], t[1] ] };
			}
		} else {
			return { 'op': 'box', 'bases': [ t ] };
		}
	};
	const buildIndex = ( d, isFactIndex ) => {
		const t = trimTree(d);
		if ( Array.isArray( t ) ) {
		    const boxIndex = { 'op': 'index', 'box': t[0] };
		    const payload = Array.isArray(t[1][0]) ? t[1] : [t[1]];
		    if ( isFactIndex ) {
		        const requiredLength = boxIndex.box.bases.length - 1;
                const badFacts = payload.filter( p => p.length != requiredLength ).map( p => `{${ p }}`);
                if ( badFacts.length > 0 ) {
                    throw new Error( `Invalid factorial points for box [${ boxIndex.box.bases }]: require length ${ requiredLength }: ${ badFacts }` );
                }
		        boxIndex.facts = payload;
		    } else {
		        const requiredLength = boxIndex.box.bases.length;
                const badPerms = payload.filter( p => p.length != requiredLength ).map( p => `{${ p }}`);
                if ( badPerms.length > 0 ) {
                    throw new Error( `Invalid factorial perm for box [${ boxIndex.box.bases }]: require length ${ requiredLength }: ${ badPerms }` );
                }
		        boxIndex.perms = payload;
		    }
		    return boxIndex;
		} else {
			return { 'op': 'index', 'box': t };
		}
	};
%}

# Pass your lexer with @lexer:
@lexer lexer

main -> lines {% d => d[0] %}
lines -> line (%NL line):* {% d => {
	const t = trimTree(d);
	if (Array.isArray(t) && t.length == 2 && Array.isArray(t[1]) ) {
		return [t[0],...t[1]];
	}
	return t;
} %}
line -> content | %comment | %WS | null
content -> %WS:? expression %WS:? %comment:?
expression -> ( cycles | brackets )

cycles -> ( factindex | index | product | product2 | compose | power )
brackets -> %lparen %WS:? expression %WS:? %rparen {% trimTree %}

product -> expression %WS:? %tilda %WS:? expression {% d => buildOp( d, 'product' ) %}
product2 -> expression %WS:? %pipe %WS:? expression {% d => buildOp( d, 'product2' ) %}

power -> expression %WS:? %exp %WS:? %number {% d => buildOp( d, 'power' ) %}
compose -> expression %WS:? %star %WS:? expression {% d => buildOp( d, 'compose' ) %}

index -> box (%WS:? perm (%WS:? perm):?):? {% d => buildIndex(d, false) %}
factindex -> box (%WS:? factuple (%WS:? factuple):?):? {% d => buildIndex(d, true) %}
box -> %number (%WS:? %colon %WS:? %number):* {% buildBox %}

factuple -> %lcurly %WS:? %number (%WS:? %comma %WS:? %number):* %WS:? %rcurly {% buildFactuple %}
perm -> %lsquare %WS:? %number (%WS:? %comma %WS:? %number):* %WS:? %rsquare {% buildPerm %}

