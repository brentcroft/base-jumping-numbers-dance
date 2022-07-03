/**
 * JS Formula Parser
 * -------------------
 * (c) 2012-2021 Alexander Schenkel, alex@alexi.ch
 *
 * JS Formula Parser takes a string, parses its mathematical formula
 * and creates an evaluable Formula object of it.
 *
 * Example input:
 *
 * var fObj = new Formula('sin(PI*x)/(2*PI)');
 * var result = fObj.evaluate({x: 2});
 * var results = fObj.evaluate([
 *     {x: 2},
 *     {x: 4},
 *     {x: 8}
 * ]);
 *
 * LICENSE:
 * -------------
 * MIT license, see LICENSE file
 */


const OPERATIONS = [
    '*'
];

const OPERATORS = {
    '*': ( operator, left, right, boxGroup ) => new OperatorExpression( operator, left, right, boxGroup ),
    '^': ( operator, left, right, boxGroup ) => new PowerExpression(operator, left, right, boxGroup ),
    ':': ( operator, left, right, boxGroup ) => new LiteralCyclesExpression( operator, left, right, boxGroup ),
    '|': ( operator, left, right, boxGroup ) => new CyclesExtensionExpression( operator, left, right, boxGroup ),
    '~': ( operator, left, right, boxGroup ) => new CyclesExtensionExpression( operator, left, right , boxGroup)
};

/*
    Inversion rules:
        1. The inverse of a group action has the pair of permutations swapped over
*/
function invertByRules( boxAction, boxGroup ) {
    return ( boxAction instanceof PlaceValuesAction )
        ? boxGroup.findActionByPermPair( [ boxAction.pair.permPair[1], boxAction.pair.permPair[0] ] )
        : null;
}
/*
    Composition rules:
        1. Immediately adjacent and equal symbols in a composition that form an identity can be removed.
        3. Outside edge symbols in a composition that form an identity can be removed - and the inside reversed
*/
function composeBySymbols( left, right, boxGroup, rules = { "outer": 1, "rotations": 1 } ) {

    function updateSymbols( left, right, boxAction ) {
        const symbolic = `${ left.symbols[0] }${ OPERATIONS[0] }${ right.symbols[0] }`;
        if ( !boxAction.symbols.includes( symbolic ) ) {
            boxAction.symbols.push( symbolic );
        }
    }

    if ( left.pair && right.pair ) {

        const [
            leftState, leftPermPair,
            rightState, rightPermPair
        ] = [
            left.pair.stateType, left.pair.permPair,
            right.pair.stateType, right.pair.permPair
        ];

        // inner match
        if ( arrayExactlyEquals( leftPermPair[1], rightPermPair[0] ) ) {
            const boxAction = boxGroup.findActionByPermPair( [ leftPermPair[0], rightPermPair[1] ] );
            if ( boxAction ) {

                //consoleLog( `inner: ${leftState}/${rightState}; ${ boxAction }` );

                updateSymbols( left, right, boxAction );
                return boxAction;
            }
        }

        // outer match
        if ( rules["outer"] ) {
            if ( leftState == 'DD' || leftState == 'UU' ) {
                if ( arrayExactlyEquals( leftPermPair[0], rightPermPair[1] ) ) {
                    const boxAction = boxGroup.findActionByPermPair( [ rightPermPair[0], leftPermPair[1] ] );
                    if ( boxAction ) {

                        //consoleLog( `outer: ${leftState}/${rightState}; ${ boxAction }` );

                        updateSymbols( left, right, boxAction );
                        return boxAction;
                    }
                }
            }
        }

        if ( rules["rotations"] ) {

            var rotatedLeft;

            if ( leftState == 'DU' || leftState == 'UD' ) {

                rotatedLeft = [
                    [ ...leftPermPair[1] ].reverse(),
                    [ ...leftPermPair[0] ].reverse()
                ];

                if ( arrayExactlyEquals( rotatedLeft[1], rightPermPair[0] ) ) {
                    const boxAction = boxGroup.findActionByPermPair( [ rotatedLeft[0], rightPermPair[1] ] );
                    if ( boxAction ) {

                        //consoleLog( `single: ${leftState}/${rightState}; ${ boxAction }` );

                        updateSymbols( left, right, boxAction );
                        return boxAction;
                    }
                }
            }

            if ( rightState == 'DU' || rightState == 'UD' ) {

                const rotatedRight = [
                    [ ...rightPermPair[1] ].reverse(),
                    [ ...rightPermPair[0] ].reverse()
                ];

                if ( arrayExactlyEquals( leftPermPair[1], rotatedRight[0] ) ) {
                    const boxAction = boxGroup.findActionByPermPair( [ leftPermPair[0], rotatedRight[1] ] );
                    if ( boxAction ) {

                        //consoleLog( `single: ${leftState}/${rightState}; ${ boxAction }` );

                        updateSymbols( left, right, boxAction );
                        return boxAction;
                    }
                }

                if ( rotatedLeft ) {

                    if ( arrayExactlyEquals( rotatedLeft[1], rotatedRight[0] ) ) {
                        const boxAction = boxGroup.findActionByPermPair( [ rotatedLeft[0], rotatedRight[1]] );
                        if ( boxAction ) {

                            //consoleLog( `double: ${leftState}/${rightState}; ${ boxAction }` );

                            updateSymbols( left, right, boxAction );
                            return boxAction;
                        }
                    }

                }
            }

        }
    }
    return null;
}

/*
    Composition rules:
        1. Immediately adjacent and equal symbols in a composition that form an identity can be removed.
        3. Outside edge symbols in a composition that form an identity can be removed - and the inside reversed
*/
function composeByStructure( left, right, boxGroup, rules = { "outer": 1, "rotations": 1 } ) {
    return null;
}


class Formula {
    /**
     * Creates a new Formula instance
     *
     * Optional configuration can be set in the options object:
     *
     * - memoization (bool): If true, results are stored and re-used when evaluate() is called with the same parameters
     *
     * @param {String} fStr The formula string, e.g. 'sin(x)/cos(y)'
     * @param {Object} options An options object. Supported options:
     *    - memoization (bool): If true, results are stored and re-used when evaluate() is called with the same parameters
     * @param {Formula} parentFormula Internally used to build a Formula AST
     */
    constructor( boxGroup, fStr, options = {} ) {
        this.boxGroup = boxGroup;
        this.formulaExpression = null;
        this.options = Object.assign(
            {
                memoization: false
            },
            options
        );
        this._variables = [];
        this._memory = {};
        this.setFormula(fStr);
        return this;
    }

    /**
     * Re-sets the given String and parses it to a formula expression. Can be used after initialization,
     * to re-use the Formula object.
     *
     * @param {String} formulaString The formula string to set/parse
     * @return {this} The Formula object (this)
     */
    setFormula(formulaString) {
        if (formulaString) {
            this.formulaExpression = null;
            this._variables = [];
            this._memory = {};
            this.formulaStr = formulaString;
            this.formulaExpression = this.parse(formulaString);
        }
        return this;
    }

    /**
     * Enable memoization: An expression is only evaluated once for the same input.
     * Further evaluations with the same input will return the in-memory stored result.
     */
    enableMemoization() {
        this.options.memoization = true;
    }

    /**
     * Disable in-memory memoization: each call to evaluate() is executed from scratch.
     */
    disableMemoization() {
        this.options.memoization = false;
        this._memory = {};
    }

    /**
     * Splits the given string by ',', makes sure the ',' is not within
     * a sub-expression
     * e.g.: str = "x,pow(3,4)" returns 2 elements: x and pow(3,4).
     */
    splitFunctionParams(toSplit) {
        // do not split on ',' within matching brackets.
        let pCount = 0,
            paramStr = '';
        const params = [];
        for (let chr of toSplit.split('')) {
            if (chr === ',' && pCount === 0) {
                // Found function param, save 'em
                params.push(paramStr);
                paramStr = '';
            } else if (chr === '(') {
                pCount++;
                paramStr += chr;
            } else if (chr === ')') {
                pCount--;
                paramStr += chr;
                if (pCount < 0) {
                    throw new Error('ERROR: Too many closing parentheses!');
                }
            } else {
                paramStr += chr;
            }
        }
        if (pCount !== 0) {
            throw new Error('ERROR: Too many opening parentheses!');
        }
        if (paramStr.length > 0) {
            params.push(paramStr);
        }
        return params;
    }

    /**
     * Cleans the input string from unnecessary whitespace,
     * and replaces some known constants:
     */
    cleanupInputString(s) {
        s = s.replace(/[\s]+/g, '');
        return s;
    }

    parse(str) {
        // clean the input string first. spaces, math constant replacements etc.:
        str = this.cleanupInputString(str);
        // start recursive call to parse:
        return this._do_parse(str);
    }

    /**
     * @see parse(): this is the recursive parse function, without the clean string part.
     * @param {String} str
     * @returns {Expression} An expression object, representing the expression tree
     */
    _do_parse(str) {
        let lastChar = str.length - 1,
            act = 0,
            state = 0,
            expressions = [],
            char = '',
            tmp = '',
            funcName = null,
            pCount = 0;

        while (act <= lastChar) {
            switch (state) {
                case 0:
                    // None state, the beginning. Read a char and see what happens.
                    char = str.charAt(act);
                    if (char.match(/[0-9.]/)) {
                        // found the beginning of a number, change state to "within-number"
                        state = 'within-nr';
                        tmp = '';
                        act--;
                    } else if (this.isOperator(char)) {
                        // Simple operators. Note: '-' must be treated specially,
                        // it could be part of a number.
                        // it MUST be part of a number if the last found expression
                        // was an operator (or the beginning):
                        if (char === '-') {
                            if (expressions.length === 0 || this.isOperatorExpr(expressions[expressions.length - 1])) {
                                state = 'within-nr';
                                tmp = '-';
                                break;
                            }
                        }

                        // Found a simple operator, store as expression:
                        if (act === lastChar || this.isOperatorExpr(expressions[act - 1])) {
                            state = -1; // invalid to end with an operator, or have 2 operators in conjunction
                            break;
                        } else {
                            expressions.push(Expression.createOperatorExpression(char));
                            state = 0;
                        }
                    } else if (char === '-') {
                        if (expressions.length === 0 || this.isOperatorExpr(expressions[expressions.length - 1])) {
                            state = 'within-nr';
                            tmp = '-';
                            break;
                        }
                    } else if (char === '(') {
                        // left parenthesis found, seems to be the beginning of a new sub-expression:
                        state = 'within-parentheses';
                        tmp = '';
                        pCount = 0;
                    } else if (char === '[') {
                        // left named var separator char found, seems to be the beginning of a named var:
                        state = 'within-named-var';
                        tmp = '';

                    } else if (char === '"' || char === "'") {
                        // left string separator char found, seems to be the beginning of a string:
                        state = 'within-string';
                        tmp = '' + char;

                    } else if (char.match(/[a-zA-Z]/)) {
                        // multiple chars means it may be a function, else its a var which counts as own expression:
                        if (act < lastChar && str.charAt(act + 1).match(/[a-zA-Z0-9_]/)) {
                            tmp = char;
                            state = 'within-func';
                        } else {
                            // Single variable found:
                            // We need to check some special considerations:
                            // - If the last char was a number (e.g. 3x), we need to create a multiplication out of it (3*x)
                            if (
                                expressions.length > 0 &&
                                expressions[expressions.length - 1] instanceof ValueExpression
                            ) {
                                expressions.push(Expression.createOperatorExpression( OPERATIONS[0] ));
                            }
                            expressions.push(new VariableExpression(char));
                            this.registerVariable(char);
                            state = 0;
                            tmp = '';
                        }
                    }
                    break;

                case 'within-string':
                    char = str.charAt(act);
                    tmp += char;
                    if (char === tmp[0]) {
                        expressions.push(new StringExpression(tmp));
                        state = 0;
                    }
                    break;

                case 'within-nr':
                    char = str.charAt(act);
                    if (char.match(/[0-9.]/)) {
                        //Still within number, store and continue
                        tmp += char;
                        if (act === lastChar) {
                            expressions.push(new ValueExpression(tmp));
                            state = 0;
                        }
                    } else {
                        // Number finished on last round, so add as expression:
                        if (tmp === '-') {
                            // just a single '-' means: a variable could follow (e.g. like in 3*-x), we convert it to -1: (3*-1x)
                            tmp = -1;
                        }
                        expressions.push(new ValueExpression(tmp));
                        tmp = '';
                        state = 0;
                        act--;
                    }
                    break;

                case 'within-func':
                    char = str.charAt(act);
                    if (char.match(/[a-zA-Z0-9_]/)) {
                        tmp += char;
                    } else if (char === '(') {
                        funcName = tmp;
                        tmp = '';
                        pCount = 0;
                        state = 'within-func-parentheses';
                    } else {

                        expressions.push(new VariableExpression(tmp));
                        this.registerVariable(tmp);
                        tmp = '';
                        state = 0;
                        act--;

                        //throw new Error('Wrong character for function at position ' + act);
                    }

                    break;

                case 'within-named-var':
                    char = str.charAt(act);
                    if (char === ']') {
                        // end of named var, create expression:
                        expressions.push(new VariableExpression(tmp));
                        this.registerVariable(tmp);
                        tmp = '';
                        state = 0;
                    } else if (char.match(/[a-zA-Z0-9_]/)) {
                        tmp += char;
                    } else {
                        throw new Error('Character not allowed within named variable: ' + char);
                    }
                    break;

                case 'within-parentheses':
                case 'within-func-parentheses':
                    char = str.charAt(act);
                    if (char === ')') {
                        //Check if this is the matching closing parenthesis.If not, just read ahead.
                        if (pCount <= 0) {
                            // Yes, we found the closing parenthesis, create new sub-expression:
                            if (state === 'within-parentheses') {
                                expressions.push(new BracketExpression(this._do_parse(tmp)));
                            } else if (state === 'within-func-parentheses') {
                                // Function found: create expressions from the inner argument
                                // string, and create a function expression with it:
                                let args = this.splitFunctionParams(tmp).map((a) => this._do_parse(a));
                                expressions.push(new FunctionExpression(funcName, args, this));
                                funcName = null;
                            }
                            state = 0;
                        } else {
                            pCount--;
                            tmp += char;
                        }
                    } else if (char === '(') {
                        // begin of a new sub-parenthesis, increase counter:
                        pCount++;
                        tmp += char;
                    } else {
                        // all other things are just added to the sub-expression:
                        tmp += char;
                    }
                    break;
            }
            act++;
        }

        if ( state === 'within-func' ) {
            expressions.push(new VariableExpression(tmp));
            this.registerVariable(tmp);
            tmp = '';
            state = 0;
        }

        if (state !== 0) {
            throw new Error('Could not parse formula: Syntax error.');
        }

        return this.buildExpressionTree(expressions);
    }

    /**
     * @see parse(): Builds an expression tree from the given expression array.
     * Builds a tree with a single root expression in the correct order of operator precedence.
     *
     * Note that the given expression objects are modified and linked.
     *
     * @param {*} expressions
     * @return {Expression} The root Expression of the built expression tree
     */
    buildExpressionTree(expressions) {
        if (expressions.length < 1) {
            return null;
        }
        const exprCopy = [...expressions];
        let idx = 0;
        let expr = null;
        // Replace all Power expressions with a partial tree:
        while (idx < exprCopy.length) {
            expr = exprCopy[idx];
            if (expr instanceof PowerExpression) {
                if (idx === 0 || idx === exprCopy.length - 1) {
                    throw new Error('Wrong operator position!');
                }
                expr.base = exprCopy[idx - 1];
                expr.exponent = exprCopy[idx + 1];
                exprCopy[idx - 1] = expr;
                exprCopy.splice(idx, 2);
                //
                expr.boxGroup = this.boxGroup;
            } else {
                idx++;
            }
        }

        // Replace all Operator expressions with a partial tree:
        idx = 0;
        expr = null;
        while (idx < exprCopy.length) {
            expr = exprCopy[idx];
            if (expr instanceof OperatorExpression) {
                if (idx === 0 || idx === exprCopy.length - 1) {
                    throw new Error('Wrong operator position!');
                }
                expr.left = exprCopy[idx - 1];
                expr.right = exprCopy[idx + 1];
                exprCopy[idx - 1] = expr;
                exprCopy.splice(idx, 2);
                //
                expr.boxGroup = this.boxGroup;
            } else {
                idx++;
            }
        }

        if (exprCopy.length !== 1) {
            throw new Error('Could not parse formula: incorrect syntax?');
        }
        return exprCopy[0];
    }

    isOperator( char ) {
        return ( char in OPERATORS );
    }

    isOperatorExpr(expr) {
        return expr instanceof OperatorExpression || expr instanceof PowerExpression;
    }

    registerVariable(varName) {
        if (this._variables.indexOf(varName) < 0) {
            this._variables.push(varName);
        }
    }

    getVariables() {
        return this._variables;
    }

    /**
     * Evaluates a Formula by delivering values for the Formula's variables.
     * E.g. if the formula is '3*x^2 + 2*x + 4', you should call `evaulate` as follows:
     *
     * evaluate({x:2}) --> Result: 20
     *
     * @param {Object|Array} valueObj An object containing values for variables and (unknown) functions,
     *   or an array of such objects: If an array is given, all objects are evaluated and the results
     *   also returned as array.
     * @return {Number|Array} The evaluated result, or an array with results
     */
    _evaluate( valueObj, params = {} ) {
        // resolve multiple value objects recursively:
        if (valueObj instanceof Array) {
            return valueObj.map((v) => this._evaluate( v, params ));
        }
        let expr = this.getExpression();
        if (!(expr instanceof Expression)) {
            throw new Error('No expression set: Did you init the object with a Formula?');
        }

        if (this.options.memoization) {
            let res = this.resultFromMemory(valueObj);
            if (res !== null) {
                return res;
            } else {
                res = expr.evaluate( valueObj, params );
                this.storeInMemory( valueObj, res );
                return res;
            }
        }

        return expr.evaluate( valueObj, params );
    }

    evaluate( valueObj, params = {} ) {

        const boxItems = this.boxGroup ? this.boxGroup.getIndexMap() : {}
        const r = this._evaluate( { ...valueObj, ...params, ...boxItems } );

        function updateAlias( r, aliasText ) {
            if ( !r ) {
                //
            } else if ( r.alias ) {
                if ( !r.alias.includes( aliasText ) ) {
                    r.alias.push( aliasText );
                }
            } else if ( r instanceof BoxAction ){
                r.alias = [ aliasText ];
            }
        }

        function copySymbols( existingIndex, r ) {
            if ( existingIndex.symbols ) {
                r
                    .symbols
                    .filter( symbol => !existingIndex.symbols.includes( symbol ) )
                    .forEach( symbol => existingIndex.symbols.push( symbol ) );
            } else {
                existingIndex.symbols = [ ...r.symbols ];
            }
        }

        function maybeSwapForExistingAction( boxGroup, boxAction ) {
           const existingIndexes = boxGroup
                ? boxGroup.findMatchingActions( boxAction )
                : [];

            if ( existingIndexes.length == 0 ) {
                if ( boxGroup ) {
                    boxGroup.removeEqualCompositeAction( boxAction );
                    boxGroup.boxActions.push( boxAction );
                }
                return boxAction;
            } else {
                existingIndexes
                    .forEach( existingIndex => {
                        if ( `e ${ OPERATIONS[0] } ${ existingIndex }` == aliasText ) {
                            //
                        } else {
                            updateAlias( existingIndex, boxAction.label );
                        }
                        copySymbols( existingIndex, boxAction );
                    } );

                return existingIndexes[0];
            }
        }

        const aliasText = this.getExpressionString();

        if ( r instanceof CyclesArray ) {
            if ( r.getMeta("permKey")) {
                return maybeSwapForExistingAction( this.boxGroup, r.getAction() );
            } else {
                return r;
            }
        } else if ( r instanceof CompositeAction || r instanceof FlatAction || r instanceof RootAction ) {

            if ( r instanceof CompositeAction ) {
                if ( !r.label ) {
                    r.label = aliasText;
                }
                r.alias = [];
                if ( r.unindexed ) {
                    r.initialise();
                }
            }

            // promote results
            const promoteResults = false;

            const existingIndexes = this.boxGroup
                ? this.boxGroup.findMatchingActions( r )
                : [];

            if ( existingIndexes.length == 0 ) {
                if ( this.boxGroup ) {
                    this.boxGroup.removeEqualCompositeAction( r );
                    this.boxGroup.boxActions.push( r );
                }
                return r;
            } else {
                existingIndexes
                    .forEach( existingIndex => {
                        if ( `e ${ OPERATIONS[0] } ${ existingIndex }` == aliasText ) {
                            //
                        } else {
                            updateAlias( existingIndex, r.label );
                        }
                        copySymbols( existingIndex, r );
                    } );

                if ( promoteResults ) {
                    this.boxGroup.boxActions.push( r );
                    return r;
                } else {
                    return existingIndexes[0];
                }
            }
        } else {
            updateAlias( r, aliasText );
            return r;
        }
    }

    hashValues(valueObj) {
        return JSON.stringify(valueObj);
    }

    resultFromMemory(valueObj) {
        let key = this.hashValues(valueObj);
        let res = this._memory[key];
        if (res !== undefined) {
            return res;
        } else {
            return null;
        }
    }

    storeInMemory(valueObj, value) {
        this._memory[this.hashValues(valueObj)] = value;
    }

    getExpression() {
        return this.formulaExpression;
    }

    getExpressionString() {
        return this.formulaExpression ? this.formulaExpression.toString() : '';
    }

    toString() {
        return this.getExpressionString();
    }

    static calc(formula, valueObj, options = {}) {
        valueObj = valueObj || {};
        return new Formula(formula, options).evaluate(valueObj);
    }

    //this.formulaObject, paramValues
    registerAction( index, label ) {
        const boxAction = new FlatAction( index );
        if ( label ) {
            boxAction.label = label;
        }
        return boxAction;
    }
}

class Expression {
    static createOperatorExpression(operator, left, right, boxGroup) {
        if ( operator in OPERATORS ) {
            return OPERATORS[ operator ]( operator, left, right );
        }
        throw new Error(`Unknown operator: ${operator}`);
    }

    evaluate(params = {}) {
        throw new Error('Must be defined in child classes');
    }

    toString() {
        return '';
    }
}

class BracketExpression extends Expression {
    constructor(expr) {
        super();
        this.innerExpression = expr;
        if (!(this.innerExpression instanceof Expression)) {
            throw new Error('No inner expression given for bracket expression');
        }
    }
    evaluate(params = {}) {
        return this.innerExpression.evaluate(params);
    }
    toString() {
        return `(${this.innerExpression.toString()})`;
    }
}


class ListExpression extends Expression {
    constructor(expr) {
        super();
        this.innerExpression = expr;
        if (!(this.innerExpression instanceof Expression)) {
            throw new Error('No inner expression given for bracket expression');
        }
    }
    evaluate(params = {}) {
        return this.innerExpression.evaluate(params);
    }
    toString() {
        return `(${this.innerExpression.toString()})`;
    }
}


class ValueExpression extends Expression {
    constructor(value) {
        super();
        this.value = Number(value);
        if (isNaN(this.value)) {
            throw new Error('Cannot parse number: ' + value);
        }
    }
    evaluate(params = {}) {
        return this.value;
    }
    toString() {
        return String(this.value);
    }
}

class StringExpression extends Expression {
    constructor(value) {
        super();
        this.value = value.slice( 1, value.length - 1 );
    }
    evaluate(params = {}) {
        return this.value;
    }
    toString() {
        return String(this.value);
    }
}

class OperatorExpression extends Expression {
    constructor( operator, left, right, boxGroup ) {
        super();
        if ( !( operator in OPERATORS ) ) {
            throw new Error( `Operator not implemented: ${ this.left } "${operator}" ${ this.right }`);
        }
        this.operator = operator;
        this.left = left;
        this.right = right;
        this.boxGroup = boxGroup;
    }

    evaluate( params = {} ) {
        const leftCycles = this.left.evaluate(params);
        const rightCycles = this.right.evaluate(params);

        if ( !( leftCycles instanceof CyclesArray  && rightCycles instanceof CyclesArray ) ) {
            throw new Error( `Either left [${ typeof leftCycles }] or right [${ typeof rightCycles }] is not a CyclesArray` );
        }
        return rightCycles.compose( leftCycles );
    }

    toString() {
        return `${this.left.toString()} ${this.operator} ${this.right.toString()}`;
    }
}

class LiteralCyclesExpression extends OperatorExpression {

    constructor( operator, left, right, boxGroup ) {
        super( operator, left, right, boxGroup );
    }

    evaluate( params = {} ) {
        var leftCoprimes = this.left.evaluate( params );
        var rightCoprimes = this.right.evaluate( params );

        if ( Number.isInteger( leftCoprimes ) ) {
            leftCoprimes = [ leftCoprimes ];
        } else {
            if ( !leftCoprimes.leftCoprimes ) {
                throw new Error( `Invalid left argument for operator: ${this.left.toString()} ${this.operator} ${this.right.toString()}` );
            }
            leftCoprimes = [ ...leftCoprimes.leftCoprimes, ...leftCoprimes.rightCoprimes ];
        }

        if ( Number.isInteger( rightCoprimes ) ) {
            rightCoprimes = [ rightCoprimes ];
        } else {
            if ( !rightCoprimes.leftCoprimes ) {
                throw new Error( `Invalid right argument for operator: ${this.left.toString()} ${this.operator} ${this.right.toString()}` );
            }
            rightCoprimes = [ ...rightCoprimes.leftCoprimes, ...rightCoprimes.rightCoprimes ];
        }

        const bases = [ leftCoprimes.reduce( (a,c) => a * c, 1 ), rightCoprimes.reduce( (a,c) => a * c, 1 ) ];

        var leftBases = [...leftCoprimes];
        var rightBases = [...rightCoprimes];

        return CyclesArray.getCycles( bases );
    }

    toString() {
        return `${this.left.toString()}${this.operator}${this.right.toString()}`;
    }
}

class CyclesExtensionExpression extends OperatorExpression {
    constructor( operator, left, right, boxGroup ) {
        super( operator, left, right, boxGroup );
    }

    evaluate( params = {} ) {
        const cycles = this.left.evaluate(params);
        const multiplier = this.right.evaluate(params);

        if ( !(Number.isInteger( multiplier ) ) ) {
            throw new Error( `Invalid arguments for operator: ${this.left.toString()} ${this.operator} ${this.right.toString()}` );
        }

        const label = `(${ cycles.getBases().join(':') }${ this.operator }${ multiplier })`;
        const harmonic = ( this.operator == '~' );
        const expandedCycles = cycles.expand( multiplier, harmonic );

        expandedCycles.setMeta( "label", label );

        return expandedCycles;
    }

    toString() {
        return `${this.left.toString()}${this.operator}${this.right.toString()}`;
    }
}



class PowerExpression extends Expression {
    constructor(base = null, exponent = null) {
        super();
        this.base = base;
        this.exponent = exponent;
    }

    evaluate(params = {}) {
        const exp = Number( this.exponent.evaluate(params) );
        const start = this.base.evaluate(params);
        var locus = start;

        if ( exp == 0 ) {
            locus = params['e'] || params['e_0'];
            if ( ! locus ) {
                throw new Error("PowerExpression: 'e' did not return an identity. Switch on 'radiance'?");
            }
        } else if ( exp == 1 ) {
            //
        } else if ( exp > 0 ) {
            for ( var i = 1; i < exp; i++ ) {
                const alias = CompositionAction.compositeLabel( locus, start );
                const boxAction = this.boxGroup.findActionByAlias( alias );

                if ( boxAction ) {
                    locus = boxAction;
                } else {
                    locus = new CompositionAction(
                        locus.box,
                        Math.round( Math.random() * 10000 + 1),
                        locus, start,
                        true
                    );
                    this.boxGroup.registerCompositeAction( alias, locus );

                    // make immediately available by label
                    params[ locus.label ] = locus;
                }
            }
        } else if ( exp < 0 ) {

            if ( this.boxGroup.compositionRules && start instanceof PlaceValuesAction ) {
                locus = invertByRules( start, this.boxGroup );
            } else {
                locus = params['e'] || params['e_0'];
                if ( ! locus ) {
                    throw new Error("PowerExpression: 'e' did not return an identity. Switch on 'radiance'?");
                }
                locus = new CompositionAction(
                            locus.box,
                            Math.round( Math.random() * 10000 + 1),
                            locus, start,
                            true,
                            true
                        );
                this.boxGroup.registerCompositeAction( locus.label, locus );

                // make immediately available by label
                params[ locus.label ] = locus;
            }

            for ( var i = -1; i > exp; i-- ) {
                const alias = CompositionAction.compositeLabel( locus, start );
                const boxAction = this.boxGroup.findActionByAlias( alias );

                if ( boxAction ) {
                    locus = boxAction;
                } else {
                    locus = new CompositionAction(
                            locus.box,
                            Math.round( Math.random() * 10000 + 1),
                            locus, start,
                            true,
                            true
                        );
                    this.boxGroup.registerCompositeAction( alias, locus );
                    // make immediately available by label
                    params[ locus.label ] = locus;
                }
            }
        }
        return locus;
    }

    toString() {
        return `${this.base.toString()}^${this.exponent.toString()}`;
    }
}
class FunctionExpression extends Expression {
    constructor(fn, argumentExpressions, formulaObject = null) {
        super();
        this.fn = fn;
        this.argumentExpressions = argumentExpressions || [];
        this.formulaObject = formulaObject;
    }

    evaluate(params = {}) {
        params = params || {};
        const paramValues = this.argumentExpressions.map((a) => a.evaluate(params));

        // If the params object itself has a function definition with
        // the function name, call this one:
        if (params[this.fn] instanceof Function) {
            return params[this.fn].apply(this, paramValues);
        }
        // perhaps the Formula object has the function? so call it:
        else if (this.formulaObject && this.formulaObject[this.fn] instanceof Function) {
            return this.formulaObject[this.fn].apply(this.formulaObject, paramValues);
        }
        // Has the JS Math object a function as requested? Call it:
        else if (Math[this.fn] instanceof Function) {
            return Math[this.fn].apply(this, paramValues);
        }
        // No more options left: sorry!
        else {
            throw new Error('Function not found: ' + this.fn);
        }
    }

    toString() {
        return `${this.fn}(${this.argumentExpressions.map((a) => a.toString()).join(', ')})`;
    }
}

class VariableExpression extends Expression {
    constructor(varName) {
        super();
        this.varName = varName || '';
    }

    evaluate(params = {}) {
        var result = params[ this.varName ];
        if ( result !== undefined ) {
            return result;
        } else if ( "e" == this.varName && params[this.varName+"_0"] !== undefined) {
            return params[this.varName+"_0"];
        } else {
            throw new Error('Cannot evaluate ' + this.varName + ': No value given');
        }
    }
    toString() {
        return `${this.varName}`;
    }
}

Formula.Expression = Expression;
Formula.BracketExpression = BracketExpression;
Formula.PowerExpression = PowerExpression;
Formula.ValueExpression = ValueExpression;
Formula.VariableExpression = VariableExpression;
Formula.FunctionExpression = FunctionExpression;

function evaluateFormulas( lines, param = {} ) {
    return lines
        .split( /[\n\r]+/ )
        .map( line => line.trim() )
        .filter( line => line.length > 0 )
        .filter( line => line[0] != '#' )
        .map( line => new Formula( null, line ) )
        .map( f => {
            try {
                const result = [ f, f.evaluate( param ) ];
                if ( result[1] instanceof CyclesArray ) {
                    result[1].setMeta( 'label', result[0].toString());
                }
                return result;
            } catch ( e ) {
                consoleLog( e );
                return [ f, e ];
            }
        } );
}