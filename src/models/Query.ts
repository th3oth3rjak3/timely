import { getSqlColumnFromPropertyName } from "../utilities/dataTableUtilities";

export class QueryCondition {
    field: string;
    operator: string;
    condition: string | string[];

    constructor(field: string, operator: string, condition: string | string[]) {
        this.field = getSqlColumnFromPropertyName(field);
        this.operator = operator;
        this.condition = condition;
    }

    serialize(): any {
        return {
            field: this.field,
            operator: this.operator,
            condition: typeof (this.condition) === 'string' ? { Single: this.condition } : { Multiple: this.condition }
        }
    }
}

export class QueryExpression {
    operationType: string;
    operations: (QueryCondition | QueryExpression)[];

    constructor(operationType: string, operations: (QueryCondition | QueryExpression)[]) {
        this.operationType = operationType;
        this.operations = operations;
    }

    static or(...args: (QueryCondition | QueryExpression)[]): QueryExpression {
        return new QueryExpression("or", [...args]);
    }

    static and(...args: (QueryCondition | QueryExpression)[]): QueryExpression {
        return new QueryExpression("and", [...args]);
    }

    serialize(): any {
        return {
            operationType: this.operationType,
            operations: this.operations.map(op => {
                if ('field' in op) {
                    return { Condition: op.serialize() };
                }
                else {
                    return { Expression: op.serialize() };
                }
            })
        }
    }
}

export class Query {
    operationType: string;
    expressions: QueryExpression[];

    constructor(operationType: string, expressions: QueryExpression[]) {
        this.expressions = expressions;
        this.operationType = operationType;
    }

    static or(...args: QueryExpression[]): Query {
        return new Query("or", [...args]);
    }

    static and(...args: QueryExpression[]): Query {
        return new Query("and", [...args]);
    }

    serialize(): any {
        return {
            operationType: this.operationType,
            expressions: this.expressions.map(expr => expr.serialize())
        }
    }
}