

const OPERATIONS = [
    '*'
];

const OPERATORS = {
    '*': ( operator, left, right ) => new CompositionExpression( operator, left, right ),
    '^': ( operator, left, right ) => new PowerExpression(operator, left, right ),
    '%': ( operator, left, right ) => new TwoDimensionalExpression( operator, left, right ),
    ':': ( operator, left, right ) => new DirectProductExpression( operator, left, right ),
    '|': ( operator, left, right ) => new DirectProductExpression( operator, left, right )
};


class Formula {

    constructor( boxGroup, fStr, options = {} ) {
        this.boxGroup = boxGroup;
        this.formulaExpression = null;
        this.options = Object.assign( { memoization: false }, options );
        this._variables = [];
        this._memory = {};
        this.setFormula(fStr);
        return this;
    }

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

    enableMemoization() {
        this.options.memoization = true;
    }

    disableMemoization() {
        this.options.memoization = false;
        this._memory = {};
    }

    splitFunctionParams(toSplit) {
        let pCount = 0, paramStr = '';
        const params = [];
        for (let chr of toSplit.split('')) {
            if (chr === ',' && pCount === 0) {
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

    cleanupInputString(s) {
        s = s.replace(/[\s]+/g, '');
        return s;
    }

    parse(str) {
        str = this.cleanupInputString(str);
        return this._do_parse(str);
    }

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
                            expressions.push(new IdentityExpression(tmp));
                            state = 0;
                        }
                    } else {
                        // Number finished on last round, so add as expression:
                        if (tmp === '-') {
                            // just a single '-' means: a variable could follow (e.g. like in 3*-x), we convert it to -1: (3*-1x)
                            tmp = -1;
                        }
                        expressions.push(new IdentityExpression(tmp));
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
    _evaluate( valueObj, param = {} ) {
        // resolve multiple value objects recursively:
        if (valueObj instanceof Array) {
            return valueObj.map((v) => this._evaluate( v, param ));
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
                res = expr.evaluate( valueObj, param );
                this.storeInMemory( valueObj, res );
                return res;
            }
        }

        return expr.evaluate( valueObj, param );
    }

    evaluate( valueObj, param = {} ) {
        const r = this._evaluate( { ...valueObj, ...param } );
        return r;
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

    toString() {
        return `${this.left.toString()} ${this.operator} ${this.right.toString()}`;
    }
}

class IdentityExpression extends ValueExpression {
    constructor( value ) {
        super( value );
    }
    evaluate( params = {} ) {
        return this.value;
    }
    toString() {
        return `${this.value}`;
    }
}
class CompositionExpression extends OperatorExpression {
    constructor( operator, left, right, boxGroup ) {
        super( operator, left, right, boxGroup );
    }

    evaluate( params = {} ) {
        const leftCycles = this.left.evaluate(params);
        const rightCycles = this.right.evaluate(params);
        return compose( leftCycles, rightCycles );
    }
}
class TwoDimensionalExpression extends OperatorExpression {
    constructor( operator, left, right, boxGroup ) {
        super( operator, left, right, boxGroup );
    }

    evaluate( params = {} ) {
        const l = this.left.evaluate(params);
        const r = this.right.evaluate(params);
        const b = Box.of([l,r]);
        const [ i0, i1 ] = [ l > r ? 1 : 0, l > r ? 0 : 1 ];
        return compose( b.permBox[i0], b.permBox[i1], true )
    }
}
class DirectProductExpression extends OperatorExpression {
    constructor( operator, left, right, boxGroup ) {
        super( operator, left, right, boxGroup );
    }
    evaluate( params = {} ) {
        var l = this.left.evaluate(params);
        if (Number.isInteger( l )) {
            l = Box.of( [ l ] ).permBox[0];
        }
        var r = this.right.evaluate(params);
        if (Number.isInteger( r )) {
            r = Box.of( [ r ] ).permBox[0];
        }
        return product( l, r, this.operator == ':' )
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

        if ( exp < 1 ) {
            const invStart = inverse( start );
            var locus = invStart;
            for ( var i = -1; i > exp; i-- ) {
                locus = compose( invStart, locus );
            }
        } else if ( exp == 1 ) {
            //
        } else if ( exp > 0 ) {
            for ( var i = 1; i < exp; i++ ) {
                locus = compose( start, locus );
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
                if ( result[1] instanceof Cycles ) {
                    result[1].alias = result[0].toString();
                }
                return result;
            } catch ( e ) {
                console.log( e );
                return [ f, e ];
            }
        } );
}