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
	const buildFactuple = ( d ) => {
		var t = trimTree(d);
		//if ( Array.isArray(t) ) {
		//	t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
		//}
		return t;
	};
	const buildPerm = ( d, l, r ) => {
		var t = trimTree(d);
		if ( Array.isArray(t) ) {
			t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
			// check every index occurs
			if ( t.filter( (c,i) => t.indexOf(i) < 0 ).length > 0 ) {
				return r;
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
			if (Array.isArray(t[1][0])) {
				return isFactIndex
					? { 'op': 'index', 'box': t[0], 'facts': t[1] }
					: { 'op': 'index', 'box': t[0], 'perms': t[1] };
			} else {
				return isFactIndex
					? { 'op': 'index', 'box': t[0], 'facts': [t[1]] }
					: { 'op': 'index', 'box': t[0], 'perms': [t[1]] };
			}
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
brackets -> %lparen %WS:? cycles %WS:? %rparen {% trimTree %}

index -> box (%WS:? perm (%WS:? perm):?):? {% d => buildIndex(d, false) %}
factindex -> box (%WS:? factuple (%WS:? factuple):?):? {% d => buildIndex(d, true) %}
box -> %number (%WS:? %colon %WS:? %number):* {% buildBox %}

factuple -> %lcurly %WS:? %number (%WS:? %comma %WS:? %number):* %WS:? %rcurly {% buildFactuple %}
perm -> %lsquare %WS:? %number (%WS:? %comma %WS:? %number):* %WS:? %rsquare {% buildPerm %}

product -> expression %WS:? %tilda %WS:? expression {% d => buildOp( d, 'product' ) %}
product2 -> expression %WS:? %pipe %WS:? expression {% d => buildOp( d, 'product2' ) %}

power -> expression %WS:? %exp %WS:? %number {% d => buildOp( d, 'power' ) %}
compose -> expression %WS:? %star %WS:? expression {% d => buildOp( d, 'compose' ) %}


