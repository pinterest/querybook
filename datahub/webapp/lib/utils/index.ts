import { escape } from 'lodash';
import { PickType } from 'lib/typescript';

// from: https://stackoverflow.com/questions/286141/remove-blank-attributes-from-an-object-in-javascript
export function removeEmpty(obj: {}) {
    Object.entries(obj).forEach(([key, val]) => {
        if (val && typeof val === 'object') {
            removeEmpty(val);
        } else if (val == null) {
            delete obj[key];
        }
    });

    return obj;
}

export function generateNameFromKey(key: string, separator: string = '_') {
    if (!key) {
        return '';
    }

    return key
        .split(separator)
        .map((x) => (x[0] || '').toUpperCase() + x.slice(1))
        .join(' ');
}

export function capitalize(word: string) {
    if (word.length === 0) {
        return word;
    }
    return `${word[0].toUpperCase()}${word.slice(1)}`;
}

export function titleize(
    text: string,
    separator: string = ' ',
    joinSeparator: string = null
) {
    joinSeparator = joinSeparator ?? separator;
    return (text || '')
        .split(separator)
        .filter((s) => s)
        .map(capitalize)
        .join(joinSeparator);
}

export function getSelectionRect() {
    const windowSelection = window.getSelection();
    if (windowSelection.rangeCount === 0) {
        return null;
    }
    return windowSelection.getRangeAt(0).getBoundingClientRect();
}

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function download(dataUrl: string, fileName: string) {
    const a = document.createElement('a');
    // a.setAttribute('download', fileName);
    a.href = dataUrl;
    a.download = fileName; // TODO(datahub): Check why it's not respected
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function copy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
}

// export function timeout(milliseconds: number = 0) {
//     return (
//         target: any,
//         propertyKey: string,
//         descriptor: PropertyDescriptor
//     ) => {
//         const originalMethod = descriptor.value;

//         descriptor.value = function() {
//             originalMethod.apply(this, arguments);
//         };

//         return descriptor;
//     };
// }

function defaultAggregateReducer(args: any[], acc: any[]) {
    return [].concat(acc).concat(Array.from(args));
}

export function reduceDebounce(
    func: (...args: any[]) => any,
    wait: number,
    reducer: (args: any[], acc: any) => any = defaultAggregateReducer,
    initialValue: any = []
) {
    let timeout: number;
    let acc = initialValue;

    return function wrapped(...args) {
        acc = reducer(args, acc);
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            timeout = null;
            func.apply(this, [].concat(acc));
            acc = initialValue;
        }, wait);
    };
}

export function arrayMove<T = any>(
    arr: T[],
    fromIndex: number,
    toIndex: number
): T[] {
    const newArr = [...arr];

    const elem = newArr[fromIndex];
    newArr.splice(fromIndex, 1);
    newArr.splice(toIndex, 0, elem);

    return newArr;
}

export function enableResizable(options) {
    return {
        top: false,
        bottom: false,
        right: false,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,

        ...options,
    };
}

export function getCodeEditorTheme(theme: string) {
    switch (theme) {
        case 'dark':
            return 'monokai';
        case 'night':
            return 'material-palenight';
        case 'dawn':
            return 'duotone-light';
        case 'lush':
            return 'solarized dark';
        default:
            return 'default';
    }
}

export function getQueryEngineId(
    defaultQueryEngine: string | number,
    queryEngineIds: number[]
): number {
    if (defaultQueryEngine != null) {
        const defaultId = Number(defaultQueryEngine);
        if (queryEngineIds.includes(defaultId)) {
            return defaultId;
        }
    }
    if (queryEngineIds.length) {
        return queryEngineIds[0];
    }
    return null;
}

export function arrayGroupByField<
    T,
    K extends keyof PickType<T, string | number>
>(array: T[], byField?: K): Record<string, T> {
    if (array.length === 0) {
        return {};
    }
    return array.reduce((result, item) => {
        const identifier: string = (item[
            byField || ('id' as any)
        ] as any) as string;
        result[identifier] = item;
        return result;
    }, {});
}

export function formatPlural(count: number, unit: string) {
    return `${count} ${unit}${count > 1 ? 's' : ''}`;
}

// from https://stackoverflow.com/a/39494245
export function scrollToElement(element: HTMLElement, duration: number) {
    const scrollContainer = getScrollParent(element);
    if (scrollContainer) {
        return smoothScroll(scrollContainer, element.offsetTop, duration);
    }
}

export function smoothScroll(
    scrollContainer: HTMLElement,
    finalScrollTop: number,
    duration: number // in ms
) {
    return new Promise((resolve) => {
        const startingY = scrollContainer.scrollTop;
        const yDiff = finalScrollTop - startingY;
        let startTime: number;

        // Bootstrap our animation - it will get called right before next frame shall be rendered.
        window.requestAnimationFrame(function step(timestamp: number) {
            if (!startTime) {
                startTime = timestamp;
            }
            // Elapsed milliseconds since start of scrolling.
            const time = timestamp - startTime;
            // Get percent of completion in range [0, 1].
            const percentTimePassed =
                duration > 0 ? Math.min(time / duration, 1) : 1;

            scrollContainer.scrollTo(0, startingY + yDiff * percentTimePassed);

            // Proceed with animation as long as we wanted it to.
            if (time < duration) {
                window.requestAnimationFrame(step);
            } else {
                resolve();
            }
        });
    });
}

// From: https://gist.github.com/twxia/bb20843c495a49644be6ea3804c0d775
const REGEXP_SCROLL_PARENT = /^(visible|hidden)/;
export function getScrollParent(node: Element): HTMLElement {
    const isElement = node instanceof HTMLElement;
    const overflowY = isElement && window.getComputedStyle(node).overflowY;
    const isScrollable = !REGEXP_SCROLL_PARENT.test(overflowY || 'visible');

    if (!node) {
        return null;
    } else if (isScrollable && node.scrollHeight > node.clientHeight) {
        return node as HTMLElement;
    }

    return getScrollParent(node.parentNode as Element) || document.body;
}

export enum ByteSizes {
    bit = 0,
    byte = 1,
    kb = 2,
    mb = 3,
    gb = 4,
    tb = 5,
    pb = 6,
    eb = 7,
}
export function getHumanReadableByteSize(
    size: number,
    fromUnit: ByteSizes = ByteSizes.byte
): string {
    let currentUnit = fromUnit;
    while (size < 1 && currentUnit !== ByteSizes.bit) {
        currentUnit = ByteSizes[ByteSizes[currentUnit - 1]];
        size *= 1024;
    }
    while (size > 1024 && currentUnit !== ByteSizes.eb) {
        currentUnit = ByteSizes[ByteSizes[currentUnit + 1]];
        size /= 1024;
    }

    return `${size.toFixed(2)} ${ByteSizes[currentUnit].toUpperCase()}s`;
}

export function linkifyLog(log: string) {
    // https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}(\.[a-z]{2,6})?\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)/g;

    return escape(log).replace(
        urlRegex,
        '<a target="_blank" rel="noopener noreferrer" href="$&">$&</a>'
    );
}

export function calculateTooltipSize(tooltip: string) {
    tooltip = tooltip || '';

    if (tooltip.length < 30) {
        return '';
    }

    if (tooltip.length < 100) {
        return 'medium';
    }

    if (tooltip.length < 200) {
        return 'large';
    }

    return 'xlarge';
}

export function sanitizeUrlTitle(title: string) {
    return title
        .toLocaleLowerCase()
        .trim()
        .replace(/[\-\s_.]+/g, '-')
        .replace(/[^\-A-Za-z0-9]/g, '');
}

export function getChangedObject(orig: {}, changed: {}) {
    const ret = {};

    for (const [key, value] of Object.entries(changed)) {
        if (orig[key] !== value) {
            ret[key] = value;
        }
    }

    return ret;
}
