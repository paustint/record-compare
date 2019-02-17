export class CsvParseError extends Error {
  constructor(public name: string, message: string) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CsvParseError);
    }
  }
}
