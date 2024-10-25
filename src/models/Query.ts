import { getSqlColumnFromPropertyName } from "../utilities/dataTableUtilities";
import { Operator } from "./Operator";
import { SortDirection } from "./SortDirection";

export class QueryCondition {
    field: string;
    operator: string;
    condition: string | string[];

    constructor(field: string, operator: Operator, condition: string | string[]) {
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

export class Ordering {
    orderBy: string;
    sortDirection: SortDirection;

    constructor(orderBy: string, sortDirection: SortDirection) {
        this.orderBy = orderBy;
        this.sortDirection = sortDirection;
    }

    serialize() {
        return {
            orderBy: this.orderBy,
            sortDirection: this.sortDirection,
        }
    }
}

export class Query {
    operationType: string;
    expressions: QueryExpression[];
    page: number;
    pageSize: number;
    ordering?: Ordering;

    constructor(operationType: string, expressions: QueryExpression[], page: number, pageSize: number, ordering?: Ordering) {
        this.expressions = expressions;
        this.operationType = operationType;
        this.page = page;
        this.pageSize = pageSize;
        this.ordering = ordering;
    }

    static or(page: number, pageSize: number, ordering?: Ordering, ...args: QueryExpression[]): Query {
        return new Query("or", [...args], page, pageSize, ordering);
    }

    static and(page: number, pageSize: number, ordering?: Ordering, ...args: QueryExpression[]): Query {
        return new Query("and", [...args], page, pageSize, ordering);
    }

    serialize(): any {
        return {
            operationType: this.operationType,
            expressions: this.expressions.map(expr => expr.serialize()),
            page: this.page,
            pageSize: this.pageSize,
            ordering: this.ordering?.serialize() ?? null
        }
    }
}