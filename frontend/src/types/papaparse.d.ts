declare module 'papaparse' {
  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
  }

  export interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
    fields: string[];
    typed: boolean;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface ParseConfig<T> {
    complete?: (results: ParseResult<T>) => void | Promise<void>;
    header?: boolean;
    skipEmptyLines?: boolean | 'greedy';
    delimiter?: string;
  }

  export function parse<T = any>(input: string | File, config?: ParseConfig<T>): ParseResult<T> | void;

  const Papa: {
    parse: typeof parse;
  };

  export default Papa;
}
