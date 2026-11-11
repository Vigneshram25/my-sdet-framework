//Custom Errors say what failed, which makes reports easier to read

export class FrameworkError extends Error {
    constructor(message: string) {
        super(message);
        this.name = new.target.name;    // shows "APIError" instead of plain "Error" in reports
    }
}

export class ElementError extends FrameworkError {}
export class APIError extends FrameworkError {
    constructor(message: string, public readonly status: number) {
        super(message);                 // 'status' becomes a property: err.status
    }
}