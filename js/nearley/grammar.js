// Generated automatically by nearley, version undefined
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

	// Moo lexer documention is here:
	// https://github.com/no-context/moo

//	const moo = require("moo")
	const lexer = moo.compile({
		WS:         { match: /[\s]+/, lineBreaks: true },
        comment:    /\/\/.*?$|#.*?$/,
        number:     /[0-9]+/,
        name:       /[a-zA-Z$][a-zA-Z0-9$_]*/,
        string:     /"(?:\\["\\]|[^\n"\\])*"/,
		between:    /[.]{2}/,
		ampersand:  '&',
        equals:     '=',
        exp:        '^',
        star:       '*',
		slash:      '/',
		minus:      '-',
		plus:       '+',
        colon:      ':',
        tilda:      '~',
        pipe:       '|',
		period:     '.',
        percent:    '%',
		at:         '@',
		between:    '..',
        comma:      ',',
        lparen:     '(',
        rparen:     ')',
        lsquare:    '[',
        rsquare:    ']',
        lcurly:     '{',
        rcurly:     '}',
        NL:         ';',
	});

	const localVars = {};
	const cycleVars = {};
    const trimTree = ( a ) => {
		if ( a == null ) {
			return null;
		} else if ( Number.isInteger( a ) ) {
			return a;
		} else if ( Array.isArray( a ) ) {
			return a.length == 0
				? null
				: a
					.map( b => trimTree( b ) )
					.filter( b => b != null )
					.filter( b => (!Array.isArray(b) || b.length > 0) );
		} else if ( 'number' == a.type ) {
			return parseInt( a.text );
		} else if ( [
				'NL', 'comment',
				'comma', 'lsquare', 'rsquare', 'lparen', 'rparen', 'lcurly', 'rcurly',
				'exp', 'star', 'colon', 'tilda', 'pipe', 'percent',
				'period', 'at', 'equals', 'slash', 'ampersand', 'between',
				'minus', 'plus'
			].includes( a.type ) ) {
			return null;
		} else {
			return a;
		}
	};
	const trimArith = (d) => {
		const t = trimTree(d);
		return Array.isArray(t)
			? t.flatMap( c => Array.isArray( c ) ? trimArith( c ) : [ c ] )
			: [ t ]
	};
	const flatten = (d) => {
		if ( !Array.isArray(d) ) {
			return d;
		}
		const candidate = d
				.map( b => flatten( b ) )
				.filter( b => b != null )
				.filter( b => (!Array.isArray(b) || b.length > 0) );
		return Array.isArray(candidate) && candidate.length == 1
				? candidate[0]
				: candidate;
	};
	const hoister = (h) => {
		return h.length == 0
			? null
			: h.length == 1 && Array.isArray(h[0])
				&& h[0].length > 0 && Array.isArray(h[0][0])
				? hoister(h[0])
				: h;
	};
	const buildOp = ( d, op ) => {
		const t = trimTree(d);
		if (Array.isArray(t) && t.length == 2 ) {
			return { 'op': op, 'l': flatten(t[0]), 'r': flatten(t[1]) };
		}
		return t[0];
	};
	const buildPerm = ( d, l, r ) => {
		var t = flatten(trimArith(d));
//		console.log( `perm-raw: ${JSON.stringify(t)}`);
		const missingIndexes = t.filter( (c,i) => t.indexOf(i) < 0 );
		if ( missingIndexes.length > 0 ) {
			throw new Error( `Invalid index [${ t }]: values: ${ missingIndexes }` );
		}
		//console.log( `perm: ${JSON.stringify(t)}`);
		return t;
	};
	const buildPerms = ( d, l, r ) => {
		var t = hoister(trimTree(d));
		//console.log( `perms-raw: ${JSON.stringify(t)}`);
		if ( Array.isArray(t) && t.length > 0 && !Array.isArray(t[0])  ) {
			t = [ t ];
		} else if ( Array.isArray(t) ) {
			t = t.map( c => Array.isArray( c ) ? c : [ c ] );
		} else {
			t = [[ t ]];
		}
		t.forEach( x => {
			const missingIndexes = x.filter( (c,i) => x.indexOf(i) < 0 );
			if ( missingIndexes.length > 0 ) {
				throw new Error( `Invalid index [${ x }]: missing indexes: ${ missingIndexes }` );
			}
		} );
		//console.log( `perms: ${JSON.stringify(t)}`);
		return { 'op': 'perms', 'perms': t };
	};
	const buildFactuple = ( d, l, r ) => {
		var t = trimArith(d);
		//console.log( `factuple-raw: ${JSON.stringify(t)}`);
		const invalidIndexes = t.filter( (c,i) => c > i + 1 );
		if ( invalidIndexes.length > 0 ) {
			throw new Error( `Invalid factorial point [${ t }]: values: ${ invalidIndexes }` );
		}
		//console.log( `factuple: ${JSON.stringify(t)}`);
		return t;
	};
	const buildFactuples = ( d, l, r ) => {
		var t = flatten(trimTree(d));
		//console.log( `factuples-raw: ${JSON.stringify(t)}`);
		if ( Array.isArray(t) && t.length > 0 && !Array.isArray(t[0])  ) {
			t = [ t ];
		} else if ( Array.isArray(t) ) {
			t = t.map( c => Array.isArray( c ) ? c : [ c ] );
		} else {
			t = [[ t ]];
		}
		//console.log( `factuples: ${JSON.stringify(t)}`);
		t.forEach( x => {
        	const invalidIndexes = x.filter( (c,i) => c > i + 1 );
			if ( invalidIndexes.length > 0 ) {
				throw new Error( `Invalid factorial point [${ x }]: values: ${ invalidIndexes }` );
			}
		} );
		//console.log( `factuples: ${JSON.stringify(t)}`);
		return { 'op': 'factuples', 'factuples': t };
	};
	const buildBox = ( d ) => {
		const t = flatten(trimTree(d));
		//console.log( `box-raw: ${JSON.stringify(t)}`);
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
	const buildAssignment = ( d ) => {
		const t = trimTree(d);
		//console.log(t);
		if (Array.isArray(t)) {
			if ( t[1].name ) {
				throw new Error( `Invalid Assignment: item named "${ t[1].name }" cannot be renamed "${ t[0].text }` );
			}
			const target = flatten(t[1]);
			target.name = t[0].text;
			return target;
		}
		return t[0];
	};
	const buildIndex = ( d, isFactIndex ) => {
		const t = trimTree(d);
		//console.log(`boxIndex-raw: ${JSON.stringify(t)}`);
		if ( Array.isArray( t ) ) {
		    const boxIndex = { 'op': 'index', 'box': t[0] };
			if (t.length > 1) {
				const selectors = t[1];
				const payload = hoister(selectors.map( selector => flatten(selector) ) )[0];

				//console.log(`boxIndex-payload: ${JSON.stringify(payload)}`);

				if ( 'factuples' == payload.op ) {
					const requiredLength = boxIndex.box.bases.length - 1;
					const badFacts = payload.factuples.filter( p => p.length != requiredLength ).map( p => `${ p }`);
					if ( badFacts.length > 0 ) {
						throw new Error( `Invalid factorial points for box [${ boxIndex.box.bases }]: require length ${ requiredLength }: ${ badFacts }` );
					}
					boxIndex.factuples = payload.factuples;
				} else {
					const requiredLength = boxIndex.box.bases.length;
					const badPerms = payload.perms.filter( p => p.length != requiredLength ).map( p => `{${ p }}`);
					if ( badPerms.length > 0 ) {
						throw new Error( `Invalid factorial perm for box [${ boxIndex.box.bases }]: require length ${ requiredLength }: ${ badPerms }` );
					}
					boxIndex.perms = payload.perms;
				}
			}
			//console.log(`boxIndex: ${JSON.stringify(boxIndex)}`);
		    return boxIndex;
		} else {
			return { 'op': 'index', 'box': t };
		}
	};
	const buildMultiplicativeGroup = ( d, raw ) => {
		const t = trimTree(d);
		const spec = `${ t[0] } ${ raw ? '@' : '%' } ${ t[1] }`;
		const mg = {
			'op': 'mg',
			'key': spec,
			'coprime': t[0],
		};
		if (raw) {
			if (t[1] < 2) {
				throw new Error( `Invalid group spec: ${ spec } right side must be 2 or greater.` );
			}
			if (t[0] < 1) {
				throw new Error( `Invalid group spec: ${ spec } left side must be 1 or greater.` );
			}
			if (t[1] <= t[0]) {
				throw new Error( `Invalid group spec: ${ spec } left side must be less than right side.` );
			}
			const gcd = (a, b) => a ? gcd( b % a, a) : b;
			const divisor = gcd( t[1], t[0] );
			if ( divisor > 1 ) {
            	throw new Error( `Invalid group spec: ${ spec } (gcd = ${ divisor }) left side and right side must be coprime.` );
        	}
			mg.cofactor = (t[1] + 1) / t[0];
			mg.group = t[1];

		} else {
			mg.cofactor = t[1];
			mg.group =  (t[0] * t[1]) - 1;
		}
		return mg;
	};

	const buildNegation = ( d ) => -1 * trimTree(d);
	const buildProduct = ( d ) => trimArith(d).reduce( (a,c) => a * c, 1 );
	const buildAddition = ( d ) => trimArith(d).reduce( (a,c) => a + c, 0 );
	const buildDivision = ( d ) => {
		const t = trimArith(d);
		return t.length > 1 ? t.slice(1).reduce( (a,c) => a / c, t[0] ): t[0];
	};
	const buildSubtraction = ( d ) => {
		const t = trimArith(d);
		return t.length > 1 ? t.slice(1).reduce( (a,c) => a - c, t[0] ) : t[0];
	};
	const buildExponentation = ( d ) => {
		var t = trimTree(d);
		return t[0] ** t[1];
	};
	const buildNamedInteger = ( d ) => {
		var t = trimTree(d);
		localVars[t[0].text] = t[1];
		return null;
	};
	const buildNamedZInteger = (d,l,r) => {
		const t = trimTree(d);
		return t in localVars ? localVars[t] : r;
	}
	const buildNamedAction = (d,l,r) => trimTree(d) in localVars ? r : d;
	const buildCycle = d => {
		const t = flatten(trimTree(d));
		//console.log( `cycle-raw: ${JSON.stringify(t)}`);
		const c = Array.isArray(t)
			? t.flatMap( x => Array.isArray(x) ? x : [ x ] )
			: [ t ];
		if ( new Set(c).size !== c.length ) {
			throw new Error( `Invalid cycle: ${ t } must not contain repeated values.` );
		}
		//console.log( `cycle: ${JSON.stringify(c)}`);
		return c;
	};
	const buildCycles = d => {
		const t = trimTree(d);
		//console.log(`cycles-raw: ${JSON.stringify(t)}`);

		const c = hoister(t).map( h => flatten(h));
		//console.log(`cycles: ${JSON.stringify(c)}`);
		return { 'op': 'cycles', 'cycles': c };
	};
	const buildLitIndex = (d) => {
		const t = trimTree(d);
		//console.log(`buildLitIndex: ${JSON.stringify(t)}`);
		const hasCycles = Array.isArray(t[0]) && t[0][0].op === 'cycles';
		const index = buildPerm( hasCycles ? t.slice(1) : t);
		if (hasCycles) {
			//console.log(`cycles: ${JSON.stringify(t[0][0])}`);
			const cycles = t[0][0].cycles;
			cycles
			    .filter(cycle => Array.isArray(cycle) && cycle.length > 1)
			    .forEach( cycle => cycle.map( c => index.indexOf( c ) ).forEach((p,i) => {
                    index[ p ] = (i < (cycle.length-1) ? cycle[i+1] : cycle[0]);
                } ) );
		}
		//console.log(`cycles-index: ${JSON.stringify(index)}`);
		return { 'op': 'index', 'index': index, 'key': '?', 'hasCycles': t[0][0].cycles, 'box': { 'op': 'box', 'bases': [index.length] } };
	};
	const buildRange = (d,l,r) => {
		const t = flatten(trimTree(d));
		//console.log(`buildRange  ${t.length}: ${t}`);
		const idx = [];
		if (t[0] < t[1]) {
			for (var i = t[0]; i <= t[1]; i++ ) {
				idx.push(i);
			}
		} else {
			for (var i = t[0]; i >= t[1]; i-- ) {
				idx.push(i);
			}
		}
		//console.log(`buildRange: ${idx}`);
		return idx;
	}
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main", "symbols": ["lines"], "postprocess": d => d[0]},
    {"name": "lines$ebnf$1", "symbols": []},
    {"name": "lines$ebnf$1$subexpression$1", "symbols": [(lexer.has("NL") ? {type: "NL"} : NL), "line"]},
    {"name": "lines$ebnf$1", "symbols": ["lines$ebnf$1$subexpression$1", "lines$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "lines", "symbols": ["line", "lines$ebnf$1"], "postprocess":  d => {
        	const t = flatten(trimTree(d));
        	if (Array.isArray(t) && t.length == 2 && Array.isArray(t[1]) ) {
        		return [t[0],...t[1]];
        	}
        	return t;
        } },
    {"name": "line$subexpression$1", "symbols": ["content"]},
    {"name": "line$subexpression$1", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)]},
    {"name": "line$subexpression$1", "symbols": ["_"]},
    {"name": "line$subexpression$1", "symbols": []},
    {"name": "line", "symbols": ["line$subexpression$1"]},
    {"name": "content$subexpression$1$subexpression$1", "symbols": ["expression"]},
    {"name": "content$subexpression$1$subexpression$1", "symbols": ["namedIntegers"]},
    {"name": "content$subexpression$1$ebnf$1", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)], "postprocess": id},
    {"name": "content$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "content$subexpression$1", "symbols": ["_", "content$subexpression$1$subexpression$1", "_", "content$subexpression$1$ebnf$1"]},
    {"name": "content", "symbols": ["content$subexpression$1"], "postprocess": trimTree},
    {"name": "namedIntegers$ebnf$1", "symbols": []},
    {"name": "namedIntegers$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "namedInteger"]},
    {"name": "namedIntegers$ebnf$1", "symbols": ["namedIntegers$ebnf$1$subexpression$1", "namedIntegers$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "namedIntegers", "symbols": [(lexer.has("ampersand") ? {type: "ampersand"} : ampersand), {"literal":"vars","pos":90}, "_", "namedInteger", "namedIntegers$ebnf$1"], "postprocess": d => null},
    {"name": "namedInteger", "symbols": [(lexer.has("name") ? {type: "name"} : name), "_", (lexer.has("equals") ? {type: "equals"} : equals), "_", "zinteger"], "postprocess": buildNamedInteger},
    {"name": "expression$subexpression$1", "symbols": ["composition"]},
    {"name": "expression", "symbols": ["expression$subexpression$1"], "postprocess": id},
    {"name": "composition$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("star") ? {type: "star"} : star), "_", "expression"]},
    {"name": "composition$ebnf$1", "symbols": ["composition$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "composition$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "composition", "symbols": ["truncation", "composition$ebnf$1"], "postprocess": d => buildOp( d, 'compose' )},
    {"name": "truncation$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("percent") ? {type: "percent"} : percent), "_", "expression"]},
    {"name": "truncation$ebnf$1", "symbols": ["truncation$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "truncation$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "truncation", "symbols": ["reduction", "truncation$ebnf$1"], "postprocess": d => buildOp( d, 'truncate' )},
    {"name": "reduction$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("slash") ? {type: "slash"} : slash), "_", "expression"]},
    {"name": "reduction$ebnf$1", "symbols": ["reduction$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "reduction$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "reduction", "symbols": ["production", "reduction$ebnf$1"], "postprocess": d => buildOp( d, 'reduce' )},
    {"name": "production$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("tilda") ? {type: "tilda"} : tilda), "_", "expression"]},
    {"name": "production$ebnf$1", "symbols": ["production$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "production$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "production", "symbols": ["exponentiation", "production$ebnf$1"], "postprocess": d => buildOp( d, 'product' )},
    {"name": "exponentiation$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("exp") ? {type: "exp"} : exp), "_", "zinteger"]},
    {"name": "exponentiation$ebnf$1", "symbols": ["exponentiation$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "exponentiation$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "exponentiation", "symbols": ["action", "exponentiation$ebnf$1"], "postprocess": d => buildOp( d, 'power' )},
    {"name": "action$subexpression$1", "symbols": ["brackets"]},
    {"name": "action$subexpression$1", "symbols": ["assignment"]},
    {"name": "action$subexpression$1", "symbols": ["litindex"]},
    {"name": "action$subexpression$1", "symbols": ["index"]},
    {"name": "action$subexpression$1", "symbols": ["mg"]},
    {"name": "action$subexpression$1", "symbols": ["mgraw"]},
    {"name": "action$subexpression$1", "symbols": [(lexer.has("name") ? {type: "name"} : name)], "postprocess": buildNamedAction},
    {"name": "action", "symbols": ["action$subexpression$1"], "postprocess": trimTree},
    {"name": "assignment", "symbols": [(lexer.has("name") ? {type: "name"} : name), "_", (lexer.has("equals") ? {type: "equals"} : equals), "_", "expression"], "postprocess": buildAssignment},
    {"name": "brackets", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "expression", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": trimTree},
    {"name": "index$subexpression$1$ebnf$1$subexpression$1", "symbols": ["_", "perms"]},
    {"name": "index$subexpression$1$ebnf$1", "symbols": ["index$subexpression$1$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "index$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "index$subexpression$1", "symbols": ["index$subexpression$1$ebnf$1"]},
    {"name": "index$subexpression$1$ebnf$2$subexpression$1", "symbols": ["_", "factuples"]},
    {"name": "index$subexpression$1$ebnf$2", "symbols": ["index$subexpression$1$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "index$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "index$subexpression$1", "symbols": ["index$subexpression$1$ebnf$2"]},
    {"name": "index$subexpression$1", "symbols": []},
    {"name": "index", "symbols": ["box", "index$subexpression$1"], "postprocess": d => buildIndex(d)},
    {"name": "box$subexpression$1$ebnf$1", "symbols": []},
    {"name": "box$subexpression$1$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("colon") ? {type: "colon"} : colon), "_", "zinteger"]},
    {"name": "box$subexpression$1$ebnf$1", "symbols": ["box$subexpression$1$ebnf$1$subexpression$1", "box$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "box$subexpression$1", "symbols": ["zinteger", "box$subexpression$1$ebnf$1"]},
    {"name": "box", "symbols": ["box$subexpression$1"], "postprocess": buildBox},
    {"name": "litindex$ebnf$1$subexpression$1", "symbols": ["cycles", "_"]},
    {"name": "litindex$ebnf$1", "symbols": ["litindex$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "litindex$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "litindex$ebnf$2", "symbols": []},
    {"name": "litindex$ebnf$2$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "range"]},
    {"name": "litindex$ebnf$2", "symbols": ["litindex$ebnf$2$subexpression$1", "litindex$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "litindex", "symbols": [(lexer.has("lsquare") ? {type: "lsquare"} : lsquare), "_", "litindex$ebnf$1", "range", "litindex$ebnf$2", "_", (lexer.has("rsquare") ? {type: "rsquare"} : rsquare)], "postprocess": buildLitIndex},
    {"name": "range$subexpression$1", "symbols": ["pinteger", "_", (lexer.has("between") ? {type: "between"} : between), "_", "pinteger"]},
    {"name": "range", "symbols": ["range$subexpression$1"], "postprocess": buildRange},
    {"name": "range", "symbols": ["pinteger"], "postprocess": id},
    {"name": "cycles$subexpression$1$ebnf$1$subexpression$1", "symbols": ["cycle", "_"]},
    {"name": "cycles$subexpression$1$ebnf$1", "symbols": ["cycles$subexpression$1$ebnf$1$subexpression$1"]},
    {"name": "cycles$subexpression$1$ebnf$1$subexpression$2", "symbols": ["cycle", "_"]},
    {"name": "cycles$subexpression$1$ebnf$1", "symbols": ["cycles$subexpression$1$ebnf$1$subexpression$2", "cycles$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "cycles$subexpression$1", "symbols": ["cycles$subexpression$1$ebnf$1"]},
    {"name": "cycles", "symbols": ["cycles$subexpression$1"], "postprocess": buildCycles},
    {"name": "cycle$ebnf$1", "symbols": []},
    {"name": "cycle$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "pinteger"]},
    {"name": "cycle$ebnf$1", "symbols": ["cycle$ebnf$1$subexpression$1", "cycle$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "cycle", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "pinteger", "cycle$ebnf$1", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": buildCycle},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "zinteger"]},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "symbols": ["factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$1", "symbols": [(lexer.has("lcurly") ? {type: "lcurly"} : lcurly), "_", "zinteger", "factuples$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "_", (lexer.has("rcurly") ? {type: "rcurly"} : rcurly), "_"], "postprocess": buildFactuple},
    {"name": "factuples$subexpression$1$ebnf$1", "symbols": ["factuples$subexpression$1$ebnf$1$subexpression$1"]},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$1", "symbols": []},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "zinteger"]},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$1", "symbols": ["factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$1$subexpression$1", "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1$ebnf$1$subexpression$2", "symbols": [(lexer.has("lcurly") ? {type: "lcurly"} : lcurly), "_", "zinteger", "factuples$subexpression$1$ebnf$1$subexpression$2$ebnf$1", "_", (lexer.has("rcurly") ? {type: "rcurly"} : rcurly), "_"], "postprocess": buildFactuple},
    {"name": "factuples$subexpression$1$ebnf$1", "symbols": ["factuples$subexpression$1$ebnf$1$subexpression$2", "factuples$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuples$subexpression$1", "symbols": ["factuples$subexpression$1$ebnf$1"]},
    {"name": "factuples", "symbols": ["factuples$subexpression$1"], "postprocess": buildFactuples},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "zinteger"]},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "symbols": ["perms$subexpression$1$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$1", "symbols": [(lexer.has("lsquare") ? {type: "lsquare"} : lsquare), "_", "zinteger", "perms$subexpression$1$ebnf$1$subexpression$1$ebnf$1", "_", (lexer.has("rsquare") ? {type: "rsquare"} : rsquare), "_"], "postprocess": buildPerm},
    {"name": "perms$subexpression$1$ebnf$1", "symbols": ["perms$subexpression$1$ebnf$1$subexpression$1"]},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$1", "symbols": []},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "zinteger"]},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$1", "symbols": ["perms$subexpression$1$ebnf$1$subexpression$2$ebnf$1$subexpression$1", "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1$ebnf$1$subexpression$2", "symbols": [(lexer.has("lsquare") ? {type: "lsquare"} : lsquare), "_", "zinteger", "perms$subexpression$1$ebnf$1$subexpression$2$ebnf$1", "_", (lexer.has("rsquare") ? {type: "rsquare"} : rsquare), "_"], "postprocess": buildPerm},
    {"name": "perms$subexpression$1$ebnf$1", "symbols": ["perms$subexpression$1$ebnf$1$subexpression$2", "perms$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perms$subexpression$1", "symbols": ["perms$subexpression$1$ebnf$1"]},
    {"name": "perms", "symbols": ["perms$subexpression$1"], "postprocess": buildPerms},
    {"name": "mg", "symbols": ["zinteger", "_", (lexer.has("percent") ? {type: "percent"} : percent), "_", "zinteger"], "postprocess": d => buildMultiplicativeGroup(d)},
    {"name": "mgraw", "symbols": ["zinteger", "_", (lexer.has("at") ? {type: "at"} : at), "_", "zinteger"], "postprocess": d => buildMultiplicativeGroup(d, true)},
    {"name": "zinteger$subexpression$1", "symbols": [(lexer.has("name") ? {type: "name"} : name)], "postprocess": buildNamedZInteger},
    {"name": "zinteger$subexpression$1", "symbols": ["zbrackets"]},
    {"name": "zinteger$subexpression$1", "symbols": ["zpower"]},
    {"name": "zinteger$subexpression$1", "symbols": ["ninteger"]},
    {"name": "zinteger$subexpression$1", "symbols": ["pinteger"]},
    {"name": "zinteger", "symbols": ["zinteger$subexpression$1"], "postprocess": d => flatten(trimTree(d))},
    {"name": "zbrackets", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "zinteger", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": trimTree},
    {"name": "zpower$subexpression$1", "symbols": ["pinteger"]},
    {"name": "zpower$subexpression$1", "symbols": ["ninteger"]},
    {"name": "zpower", "symbols": ["zpower$subexpression$1", "_", (lexer.has("exp") ? {type: "exp"} : exp), "_", "zinteger"], "postprocess": buildExponentation},
    {"name": "ninteger", "symbols": [(lexer.has("minus") ? {type: "minus"} : minus), "pinteger"], "postprocess": buildNegation},
    {"name": "pinteger$ebnf$1", "symbols": [(lexer.has("plus") ? {type: "plus"} : plus)], "postprocess": id},
    {"name": "pinteger$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "pinteger", "symbols": ["pinteger$ebnf$1", "division"], "postprocess": trimTree},
    {"name": "division$ebnf$1", "symbols": []},
    {"name": "division$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("slash") ? {type: "slash"} : slash), "_", "zinteger"]},
    {"name": "division$ebnf$1", "symbols": ["division$ebnf$1$subexpression$1", "division$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "division", "symbols": ["multiplication", "division$ebnf$1"], "postprocess": buildDivision},
    {"name": "multiplication$ebnf$1", "symbols": []},
    {"name": "multiplication$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("period") ? {type: "period"} : period), "_", "zinteger"]},
    {"name": "multiplication$ebnf$1", "symbols": ["multiplication$ebnf$1$subexpression$1", "multiplication$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "multiplication", "symbols": ["addition", "multiplication$ebnf$1"], "postprocess": buildProduct},
    {"name": "addition$ebnf$1", "symbols": []},
    {"name": "addition$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("plus") ? {type: "plus"} : plus), "_", "zinteger"]},
    {"name": "addition$ebnf$1", "symbols": ["addition$ebnf$1$subexpression$1", "addition$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "addition", "symbols": ["subtraction", "addition$ebnf$1"], "postprocess": buildAddition},
    {"name": "subtraction$ebnf$1", "symbols": []},
    {"name": "subtraction$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("minus") ? {type: "minus"} : minus), "_", "zinteger"]},
    {"name": "subtraction$ebnf$1", "symbols": ["subtraction$ebnf$1$subexpression$1", "subtraction$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "subtraction", "symbols": [(lexer.has("number") ? {type: "number"} : number), "subtraction$ebnf$1"], "postprocess": buildSubtraction},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "_$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null }}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
