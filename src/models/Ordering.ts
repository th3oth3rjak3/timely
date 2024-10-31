import { getSqlColumnFromPropertyName } from "../utilities/dataTableUtilities";
import { SortDirection } from "./SortDirection";

export class Ordering {
    orderBy: string;
    sortDirection: SortDirection = SortDirection.Ascending;

    constructor(orderBy: string, sortDirection: string) {
        if (sortDirection === "desc") {
            this.sortDirection = SortDirection.Descending;
        }

        this.orderBy = getSqlColumnFromPropertyName(orderBy);
    }

    serialize() {
        return {
            orderBy: this.orderBy,
            sortDirection: this.sortDirection
        }
    }
}