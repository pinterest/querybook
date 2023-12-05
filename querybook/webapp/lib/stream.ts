/**
 * This is a parser for the delta stream from AI assistant streaming. The stream format is as follows:
 *
 * ```
 * some data
 * <@key1@>
 * value1
 * <@key2@>
 * value2
 * ```
 *
 * Key names are wrapped in <@ and @>. The parser will parse the stream into a JSON object:
 * ```
 * {
 *    key1: 'value1',
 *    key2: 'value2',
 *    data: 'some data'
 * }
 * ```
 *
 * "some data" and key/value pairs are all optional. E.g.
 *  - Without any key/value pairs, the stream will be parsed into: { data: 'some data' }
 *  - Without any data before the first key/value pair, the stream will be parsed into: { key1: 'value1', key2: 'value2' }
 *
 * As it is a streaming parser, it will parse the stream incrementally. E.g. if a partial stream is:
 * some data
 * <@key
 * The parser will parse the stream into: { data: 'some data' }. A partial key will not be put into the result.
 */
export class DeltaStreamParser {
    private _buffer: string;
    private _result: { [key: string]: string };
    private _currentKey: string;
    private _currentValue: string;
    private _isPartialKey: boolean;

    public constructor() {
        this.reset();
    }

    public get result() {
        // make a copy of the result to avoid modifying the original result by the caller
        return { ...this._result };
    }

    public reset() {
        this._buffer = '';
        this._result = {};
        this._currentKey = 'data';
        this._currentValue = '';
        this._isPartialKey = false;
    }

    public parse(delta: string) {
        this._buffer += delta;
        // This is to make sure we always have complete <@ and @> in the buffer
        if (
            this._buffer.length < 2 ||
            this._buffer.endsWith('<') ||
            this._buffer.endsWith('@')
        ) {
            return;
        }

        let i = 0;
        while (i < this._buffer.length - 1) {
            const nextTwoChars = this._buffer.slice(i, i + 2);
            if (nextTwoChars === '<@') {
                this._result[this._currentKey] = this._currentValue.trimStart();
                this._currentKey = '';
                this._currentValue = '';
                this._isPartialKey = true;
                i += 1; // skip the next two chars
            } else if (this._isPartialKey && nextTwoChars === '@>') {
                this._isPartialKey = false;
                i += 1; // skip the next two chars
            } else {
                if (this._isPartialKey) {
                    this._currentKey += this._buffer[i];
                } else {
                    this._currentValue += this._buffer[i];
                }
            }
            i += 1;
        }

        // handle the last char
        if (i < this._buffer.length) {
            if (this._isPartialKey) {
                this._currentKey += this._buffer[i];
            } else {
                this._currentValue += this._buffer[i];
            }
        }

        if (!this._isPartialKey) {
            this._result[this._currentKey] = this._currentValue.trimStart();
        }

        this._buffer = '';
    }

    public close() {
        // flush the buffer if the stream has ended
        if (this._buffer.length) {
            if (!this._isPartialKey) {
                this._currentValue += this._buffer;
                this._result[this._currentKey] = this._currentValue.trimStart();
                this._buffer = '';
            }
        }
    }
}

/**
 * Trim the title of a query to remove the quotes and trailing period
 *
 * e.g.
 * "some title" => some title
 * "some title." => some title
 * some title. => some title
 */
export function trimQueryTitle(title: string | null | undefined) {
    return title
        ?.replace(/^["']|["']$/g, '')
        .replace(/\.$/, '')
        .trim();
}

/**
 * Trim the SQL query to remove the wraping ```
 *
 * e.g.
 * ```\nsome query``` => some query
 * ```sql\nsome query``` => some query
 */
export function trimSQLQuery(query: string | null | undefined) {
    return query?.replace(/^```(sql)?|```$/g, '').trim();
}
