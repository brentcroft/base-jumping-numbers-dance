@{%
	// Moo lexer documention is here:
	// https://github.com/no-context/moo

	const moo = require("moo")
	const lexer = moo.compile({
        WS: /[ \t]+/,
        comment:    /\/\/.*?$|#.*?$/,
        number:     /[0-9]+/,
        string:     /"(?:\\["\\]|[^\n"\\])*"/,
        exp:        '^',
        star:       '*',
		minus:      '-',
		plus:       '+',
        colon:      ':',
        tilda:      '~',
        pipe:       '|',
		period:     '.',
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
				'exp', 'star', 'colon', 'tilda', 'pipe', 'percent', 'period',
				'minus', 'plus'
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
	const buildMultiplicativeGroup = ( d ) => {
		const t = trimTree(d);
/*		if ( t[0] >= t[1] ) {
			throw new Error(`Invalid group member: ${ t[0] } is greater than group size ${ t[1] }`);
		}
		const notCoPrime = (t[0] % t[1]) == 0;
		if ( notCoPrime ) {
			throw new Error(`Invalid group member: ${ t[0] } is not coprime to group size ${ t[1] }`);
		}*/
		return {
			'op': 'mg',
			'coprime': t[0],
			'cofactor': t[1],
			'group': (t[0] * t[1]) - 1,
		};
	};
	const buildNegation = ( d ) => {
		var t = trimTree(d);
		return -1 * t;
	};
	const buildProduct = ( d ) => {
		var t = trimTree(d);
		if ( Array.isArray(t) ) {
			t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
		} else {
			t = [ t ];
		}
		return t.reduce( (a,c) => a * c, 1 );
	};
	const buildAddition = ( d ) => {
		var t = trimTree(d);
		if ( Array.isArray(t) ) {
			t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
		} else {
			t = [ t ];
		}
		return t.reduce( (a,c) => a + c, 0 );
	};
	const buildSubtraction = ( d ) => {
		var t = trimTree(d);
		if ( Array.isArray(t) ) {
			t = t.flatMap( c => Array.isArray( c ) ? c : [ c ] );
		} else {
			t = [ t ];
		}
		return t.slice(1).reduce( (a,c) => a - c, t[0] );
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
content -> ( %WS:? expression %WS:? %comment:? ) {% trimTree %}
expression -> ( cycles | brackets ) {% trimTree %}

cycles -> ( factindex | index | mg | extrude | compose | power )
brackets -> %lparen %WS:? expression %WS:? %rparen {% trimTree %}
extrude -> expression %WS:? %tilda %WS:? expression {% d => buildOp( d, 'product' ) %}

power -> expression %WS:? %exp %WS:? ninteger {% d => buildOp( d, 'power' ) %}
compose -> expression %WS:? %star %WS:? expression {% d => buildOp( d, 'compose' ) %}

index -> box (%WS:? perm (%WS:? perm):?):? {% d => buildIndex(d, false) %}
factindex -> box (%WS:? factuple (%WS:? factuple):?):? {% d => buildIndex(d, true) %}
box -> pinteger (%WS:? %colon %WS:? pinteger):* {% buildBox %}

factuple -> %lcurly %WS:* pinteger (%WS:* %comma %WS:* pinteger):* %WS:* %rcurly {% buildFactuple %}
perm -> %lsquare %WS:* pinteger (%WS:* %comma %WS:* pinteger):* %WS:* %rsquare {% buildPerm %}
mg -> pinteger %WS:* %percent %WS:* pinteger {% buildMultiplicativeGroup %}

ninteger -> %minus pinteger {% buildNegation %}
pinteger -> subtraction
subtraction -> addition (%WS:* %minus %WS:* addition):* {% buildSubtraction %}
addition -> product (%WS:* %plus %WS:* product):* {% buildAddition %}
product -> %number (%WS:* %period %WS:* %number):* {% buildProduct %}

