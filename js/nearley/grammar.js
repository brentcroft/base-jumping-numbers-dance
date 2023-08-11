// Generated automatically by nearley, version undefined
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

	// Moo lexer documention is here:
	// https://github.com/no-context/moo

//	const moo = require("moo")
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
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main", "symbols": ["lines"], "postprocess": d => d[0]},
    {"name": "lines$ebnf$1", "symbols": []},
    {"name": "lines$ebnf$1$subexpression$1", "symbols": [(lexer.has("NL") ? {type: "NL"} : NL), "line"]},
    {"name": "lines$ebnf$1", "symbols": ["lines$ebnf$1$subexpression$1", "lines$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "lines", "symbols": ["line", "lines$ebnf$1"], "postprocess":  d => {
        	const t = trimTree(d);
        	if (Array.isArray(t) && t.length == 2 && Array.isArray(t[1]) ) {
        		return [t[0],...t[1]];
        	}
        	return t;
        } },
    {"name": "line", "symbols": ["content"]},
    {"name": "line", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)]},
    {"name": "line", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)]},
    {"name": "line", "symbols": []},
    {"name": "content$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "content$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "content$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "content$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "content$subexpression$1$ebnf$3", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)], "postprocess": id},
    {"name": "content$subexpression$1$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "content$subexpression$1", "symbols": ["content$subexpression$1$ebnf$1", "expression", "content$subexpression$1$ebnf$2", "content$subexpression$1$ebnf$3"]},
    {"name": "content", "symbols": ["content$subexpression$1"], "postprocess": trimTree},
    {"name": "expression$subexpression$1", "symbols": ["cycles"]},
    {"name": "expression$subexpression$1", "symbols": ["brackets"]},
    {"name": "expression", "symbols": ["expression$subexpression$1"], "postprocess": trimTree},
    {"name": "cycles$subexpression$1", "symbols": ["factindex"]},
    {"name": "cycles$subexpression$1", "symbols": ["index"]},
    {"name": "cycles$subexpression$1", "symbols": ["mg"]},
    {"name": "cycles$subexpression$1", "symbols": ["extrude"]},
    {"name": "cycles$subexpression$1", "symbols": ["compose"]},
    {"name": "cycles$subexpression$1", "symbols": ["power"]},
    {"name": "cycles", "symbols": ["cycles$subexpression$1"]},
    {"name": "brackets$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "brackets$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "brackets$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "brackets$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "brackets", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "brackets$ebnf$1", "expression", "brackets$ebnf$2", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": trimTree},
    {"name": "extrude$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "extrude$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "extrude$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "extrude$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "extrude", "symbols": ["expression", "extrude$ebnf$1", (lexer.has("tilda") ? {type: "tilda"} : tilda), "extrude$ebnf$2", "expression"], "postprocess": d => buildOp( d, 'product' )},
    {"name": "power$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "power$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "power$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "power$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "power", "symbols": ["expression", "power$ebnf$1", (lexer.has("exp") ? {type: "exp"} : exp), "power$ebnf$2", "ninteger"], "postprocess": d => buildOp( d, 'power' )},
    {"name": "compose$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "compose$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "compose$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "compose$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "compose", "symbols": ["expression", "compose$ebnf$1", (lexer.has("star") ? {type: "star"} : star), "compose$ebnf$2", "expression"], "postprocess": d => buildOp( d, 'compose' )},
    {"name": "index$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "index$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "index$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "index$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "index$ebnf$1$subexpression$1$ebnf$2$subexpression$1", "symbols": ["index$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "perm"]},
    {"name": "index$ebnf$1$subexpression$1$ebnf$2", "symbols": ["index$ebnf$1$subexpression$1$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "index$ebnf$1$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "index$ebnf$1$subexpression$1", "symbols": ["index$ebnf$1$subexpression$1$ebnf$1", "perm", "index$ebnf$1$subexpression$1$ebnf$2"]},
    {"name": "index$ebnf$1", "symbols": ["index$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "index$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "index", "symbols": ["box", "index$ebnf$1"], "postprocess": d => buildIndex(d, false)},
    {"name": "factindex$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "factindex$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "factindex$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "factindex$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "factindex$ebnf$1$subexpression$1$ebnf$2$subexpression$1", "symbols": ["factindex$ebnf$1$subexpression$1$ebnf$2$subexpression$1$ebnf$1", "factuple"]},
    {"name": "factindex$ebnf$1$subexpression$1$ebnf$2", "symbols": ["factindex$ebnf$1$subexpression$1$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "factindex$ebnf$1$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "factindex$ebnf$1$subexpression$1", "symbols": ["factindex$ebnf$1$subexpression$1$ebnf$1", "factuple", "factindex$ebnf$1$subexpression$1$ebnf$2"]},
    {"name": "factindex$ebnf$1", "symbols": ["factindex$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "factindex$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "factindex", "symbols": ["box", "factindex$ebnf$1"], "postprocess": d => buildIndex(d, true)},
    {"name": "box$ebnf$1", "symbols": []},
    {"name": "box$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "box$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "box$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "box$ebnf$1$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "box$ebnf$1$subexpression$1", "symbols": ["box$ebnf$1$subexpression$1$ebnf$1", (lexer.has("colon") ? {type: "colon"} : colon), "box$ebnf$1$subexpression$1$ebnf$2", "pinteger"]},
    {"name": "box$ebnf$1", "symbols": ["box$ebnf$1$subexpression$1", "box$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "box", "symbols": ["pinteger", "box$ebnf$1"], "postprocess": buildBox},
    {"name": "factuple$ebnf$1", "symbols": []},
    {"name": "factuple$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "factuple$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuple$ebnf$2", "symbols": []},
    {"name": "factuple$ebnf$2$subexpression$1$ebnf$1", "symbols": []},
    {"name": "factuple$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "factuple$ebnf$2$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuple$ebnf$2$subexpression$1$ebnf$2", "symbols": []},
    {"name": "factuple$ebnf$2$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "factuple$ebnf$2$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuple$ebnf$2$subexpression$1", "symbols": ["factuple$ebnf$2$subexpression$1$ebnf$1", (lexer.has("comma") ? {type: "comma"} : comma), "factuple$ebnf$2$subexpression$1$ebnf$2", "pinteger"]},
    {"name": "factuple$ebnf$2", "symbols": ["factuple$ebnf$2$subexpression$1", "factuple$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuple$ebnf$3", "symbols": []},
    {"name": "factuple$ebnf$3", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "factuple$ebnf$3"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "factuple", "symbols": [(lexer.has("lcurly") ? {type: "lcurly"} : lcurly), "factuple$ebnf$1", "pinteger", "factuple$ebnf$2", "factuple$ebnf$3", (lexer.has("rcurly") ? {type: "rcurly"} : rcurly)], "postprocess": buildFactuple},
    {"name": "perm$ebnf$1", "symbols": []},
    {"name": "perm$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "perm$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perm$ebnf$2", "symbols": []},
    {"name": "perm$ebnf$2$subexpression$1$ebnf$1", "symbols": []},
    {"name": "perm$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "perm$ebnf$2$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perm$ebnf$2$subexpression$1$ebnf$2", "symbols": []},
    {"name": "perm$ebnf$2$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "perm$ebnf$2$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perm$ebnf$2$subexpression$1", "symbols": ["perm$ebnf$2$subexpression$1$ebnf$1", (lexer.has("comma") ? {type: "comma"} : comma), "perm$ebnf$2$subexpression$1$ebnf$2", "pinteger"]},
    {"name": "perm$ebnf$2", "symbols": ["perm$ebnf$2$subexpression$1", "perm$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perm$ebnf$3", "symbols": []},
    {"name": "perm$ebnf$3", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "perm$ebnf$3"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "perm", "symbols": [(lexer.has("lsquare") ? {type: "lsquare"} : lsquare), "perm$ebnf$1", "pinteger", "perm$ebnf$2", "perm$ebnf$3", (lexer.has("rsquare") ? {type: "rsquare"} : rsquare)], "postprocess": buildPerm},
    {"name": "mg$ebnf$1", "symbols": []},
    {"name": "mg$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "mg$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "mg$ebnf$2", "symbols": []},
    {"name": "mg$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "mg$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "mg", "symbols": ["pinteger", "mg$ebnf$1", (lexer.has("percent") ? {type: "percent"} : percent), "mg$ebnf$2", "pinteger"], "postprocess": buildMultiplicativeGroup},
    {"name": "ninteger", "symbols": [(lexer.has("minus") ? {type: "minus"} : minus), "pinteger"], "postprocess": buildNegation},
    {"name": "pinteger", "symbols": ["subtraction"]},
    {"name": "subtraction$ebnf$1", "symbols": []},
    {"name": "subtraction$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "subtraction$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "subtraction$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "subtraction$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "subtraction$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "subtraction$ebnf$1$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "subtraction$ebnf$1$subexpression$1", "symbols": ["subtraction$ebnf$1$subexpression$1$ebnf$1", (lexer.has("minus") ? {type: "minus"} : minus), "subtraction$ebnf$1$subexpression$1$ebnf$2", "addition"]},
    {"name": "subtraction$ebnf$1", "symbols": ["subtraction$ebnf$1$subexpression$1", "subtraction$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "subtraction", "symbols": ["addition", "subtraction$ebnf$1"], "postprocess": buildSubtraction},
    {"name": "addition$ebnf$1", "symbols": []},
    {"name": "addition$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "addition$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "addition$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "addition$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "addition$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "addition$ebnf$1$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "addition$ebnf$1$subexpression$1", "symbols": ["addition$ebnf$1$subexpression$1$ebnf$1", (lexer.has("plus") ? {type: "plus"} : plus), "addition$ebnf$1$subexpression$1$ebnf$2", "product"]},
    {"name": "addition$ebnf$1", "symbols": ["addition$ebnf$1$subexpression$1", "addition$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "addition", "symbols": ["product", "addition$ebnf$1"], "postprocess": buildAddition},
    {"name": "product$ebnf$1", "symbols": []},
    {"name": "product$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "product$ebnf$1$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "product$ebnf$1$subexpression$1$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "product$ebnf$1$subexpression$1$ebnf$2", "symbols": []},
    {"name": "product$ebnf$1$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS), "product$ebnf$1$subexpression$1$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "product$ebnf$1$subexpression$1", "symbols": ["product$ebnf$1$subexpression$1$ebnf$1", (lexer.has("period") ? {type: "period"} : period), "product$ebnf$1$subexpression$1$ebnf$2", (lexer.has("number") ? {type: "number"} : number)]},
    {"name": "product$ebnf$1", "symbols": ["product$ebnf$1$subexpression$1", "product$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "product", "symbols": [(lexer.has("number") ? {type: "number"} : number), "product$ebnf$1"], "postprocess": buildProduct}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
