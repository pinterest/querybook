import * as utils from 'lib/utils/index';

// missing getSelectionRect, download, copy, smoothScroll

test('removeEmpty', () => {
    expect(utils.removeEmpty({ notempty: 'test', empty: null })).toStrictEqual({
        notempty: 'test',
    });
});

test('generateNameFromKey', () => {
    expect(utils.generateNameFromKey('test_key')).toStrictEqual('Test Key');
});

test('titleize', () => {
    expect(utils.titleize('test title')).toStrictEqual('Test Title');
});

test('sleep', () => {
    const mockFunction = jest.fn(() => {
        /* empty function */
    });

    const testFunction = async () => {
        mockFunction();
        await utils.sleep(100);
        mockFunction();
    };
    testFunction();
    expect(mockFunction).toHaveBeenCalledTimes(1);
});

test('arrayMove', () => {
    const testArr = [1, 2, 3, 4, 5];
    expect(utils.arrayMove(testArr, 3, 0)).toStrictEqual([4, 1, 2, 3, 5]);
    // does not alter original array
    expect(testArr).toStrictEqual([1, 2, 3, 4, 5]);
});

test('enableResizable', () => {
    const enabledResizable = utils.enableResizable({ testOption: true });
    expect(utils.enableResizable(enabledResizable)).toHaveProperty(
        'top',
        false
    );
    expect(utils.enableResizable(enabledResizable)).toHaveProperty(
        'testOption',
        true
    );
});

test('getCodeEditorTheme', () => {
    expect(utils.getCodeEditorTheme('dark')).toStrictEqual('monokai');
    expect(utils.getCodeEditorTheme('')).toStrictEqual('default');
});

test('getQueryEngineId', () => {
    expect(utils.getQueryEngineId('{}', [1, 2, 3, 4, 5])).toBe(1);
    expect(utils.getQueryEngineId('2', [1, 2, 3, 4, 5])).toBe(2);
    expect(utils.getQueryEngineId(3, [1, 2, 3, 4, 5])).toBe(3);
    expect(utils.getQueryEngineId(4, [])).toBe(null);
});

test('arrayGroupByField', () => {
    const testArr = [{ id: 1 }, { id: 2 }, { id: 3 }];

    expect(utils.arrayGroupByField(testArr)).toStrictEqual({
        1: { id: 1 },
        2: { id: 2 },
        3: { id: 3 },
    });
});

test('formatPlural', () => {
    expect(utils.formatPlural(1, 'kitten')).toStrictEqual('1 kitten');
    expect(utils.formatPlural(3, 'kitten')).toStrictEqual('3 kittens');
});

test('getHumanReadableByteSize', () => {
    expect(utils.getHumanReadableByteSize(292059314)).toBe('278.53 MBs');
});

test('linkifyLog', () => {
    expect(utils.linkifyLog('https://www.datahub.com/')).toBe(
        '<a target="_blank" rel="noopener noreferrer" href="https://www.datahub.com/">https://www.datahub.com/</a>'
    );
    // testing basic string with query params
    expect(
        utils.linkifyLog(
            'Test https://www.google.com/search?source=hp&q=test&oq=test end test'
        )
    ).toBe(
        'Test <a target="_blank" rel="noopener noreferrer" href="https://www.google.com/search?source=hp&q=test&oq=test">https://www.google.com/search?source=hp&q=test&oq=test</a> end test'
    );
    expect(
        utils.linkifyLog('<a href="https://pinterest.com">Cool Website</a>')
    ).toBe(
        '&lt;a href=&quot;<a target="_blank" rel="noopener noreferrer" href="https://pinterest.com">https://pinterest.com</a>&quot;&gt;Cool Website&lt;/a&gt;'
    );

    // when not url
    expect(utils.linkifyLog('datahub&')).toBe('datahub&amp;');
});

test('calculateTooltipSize', () => {
    expect(utils.calculateTooltipSize('short tip')).toBe('');
    expect(
        utils.calculateTooltipSize(
            'somewhat long tip about something important'
        )
    ).toBe('medium');
    expect(
        utils.calculateTooltipSize(
            'really long tip about something really, really, really important. and another really long tip about something else really, really, really important.'
        )
    ).toBe('large');
    expect(
        utils.calculateTooltipSize(
            'insanely long tip that has a lot of tips. really long tip about something really, really, really important. and another really long tip about something else really, really, really important. really long tip about something really, really, really important. and another really long tip about something else really, really, really important.'
        )
    ).toBe('xlarge');
});

test('sanitizeUrlTitle', () => {
    expect(utils.sanitizeUrlTitle('----test----')).toBe('-test-');
    expect(utils.sanitizeUrlTitle('another test?!*')).toBe('another-test');
    expect(utils.sanitizeUrlTitle('smiley emoji 😀')).toBe('smiley-emoji-');
});
