import { parseType, prettyPrintType } from 'lib/utils/complex-types';

test('simple type', () => {
    expect(parseType('column', 'string')).toEqual({
        key: 'column',
        type: 'string',
    });
});

test('truncated type', () => {
    expect(
        parseType(
            'column',
            'struct<date:struct<year:int,month:int,day:int>,hour:int,minute:int,second:int,'
        )
    ).toEqual({
        key: 'column',
        type: 'struct<date:struct<year:int,month:int,day:int>,hour:int,minute:int,second:int,',
    });

    // Truncated, but coincidentally matches the regex
    expect(parseType('column', 'struct<date:struct<hour:int>')).toEqual({
        key: 'column',
        type: 'struct<date:struct<hour:int>',
    });
});

test('malformed struct type', () => {
    expect(parseType('column', 'STRUCT <id:string>')).toEqual({
        key: 'column',
        type: 'STRUCT <id:string>',
    });
});

test('complex type', () => {
    expect(parseType('column', 'STRUCT<id:string>')).toEqual({
        key: 'column',
        type: 'STRUCT<id:string>',
        children: [
            {
                key: 'id',
                type: 'string',
            },
        ],
    });

    expect(
        parseType(
            'column',
            'struct<date:struct<year:int,month:int,day:int>,hour:int,minute:int,second:int,timeZoneId:string>'
        )
    ).toEqual({
        key: 'column',
        type: 'struct<date:struct<year:int,month:int,day:int>,hour:int,minute:int,second:int,timeZoneId:string>',
        children: [
            {
                key: 'date',
                type: 'struct<year:int,month:int,day:int>',
                children: [
                    { key: 'year', type: 'int' },
                    { key: 'month', type: 'int' },
                    { key: 'day', type: 'int' },
                ],
            },
            { key: 'hour', type: 'int' },
            { key: 'minute', type: 'int' },
            { key: 'second', type: 'int' },
            { key: 'timeZoneId', type: 'string' },
        ],
    });

    expect(
        parseType(
            'column',
            'array<struct<size:struct<width:int,height:int,isAspectRatio:boolean>>>'
        )
    ).toEqual({
        key: 'column',
        type: 'array<struct<size:struct<width:int,height:int,isAspectRatio:boolean>>>',
        children: [
            {
                key: '<element>',
                type: 'struct<size:struct<width:int,height:int,isAspectRatio:boolean>>',
                children: [
                    {
                        key: 'size',
                        type: 'struct<width:int,height:int,isAspectRatio:boolean>',
                        children: [
                            { key: 'width', type: 'int' },
                            { key: 'height', type: 'int' },
                            { key: 'isAspectRatio', type: 'boolean' },
                        ],
                    },
                ],
            },
        ],
    });

    expect(
        parseType(
            'column',
            'struct<purchasePath:string,resultToken:string,sessionId:string,site:struct<eapid:bigint,tpid:bigint>,tests:array<struct<bucketValue:string,experimentId:string,instanceId:string>>,user:struct<guid:string,tuid:string>>'
        )
    ).toEqual({
        key: 'column',
        type: 'struct<purchasePath:string,resultToken:string,sessionId:string,site:struct<eapid:bigint,tpid:bigint>,tests:array<struct<bucketValue:string,experimentId:string,instanceId:string>>,user:struct<guid:string,tuid:string>>',
        children: [
            { key: 'purchasePath', type: 'string' },
            { key: 'resultToken', type: 'string' },
            { key: 'sessionId', type: 'string' },
            {
                key: 'site',
                type: 'struct<eapid:bigint,tpid:bigint>',
                children: [
                    { key: 'eapid', type: 'bigint' },
                    { key: 'tpid', type: 'bigint' },
                ],
            },
            {
                key: 'tests',
                type: 'array<struct<bucketValue:string,experimentId:string,instanceId:string>>',
                children: [
                    {
                        key: '<element>',
                        type: 'struct<bucketValue:string,experimentId:string,instanceId:string>',
                        children: [
                            { key: 'bucketValue', type: 'string' },
                            { key: 'experimentId', type: 'string' },
                            { key: 'instanceId', type: 'string' },
                        ],
                    },
                ],
            },
            {
                key: 'user',
                type: 'struct<guid:string,tuid:string>',
                children: [
                    { key: 'guid', type: 'string' },
                    { key: 'tuid', type: 'string' },
                ],
            },
        ],
    });

    expect(parseType('column', 'map<string,float>')).toEqual({
        key: 'column',
        type: 'map<string,float>',
        children: [
            {
                key: '<key>',
                type: 'string',
            },
            {
                key: '<value>',
                type: 'float',
            },
        ],
    });

    expect(
        parseType(
            'column',
            'map<string,uniontype<string,int,bigint,float,double,struct<year:int,month:int,day:int>>>'
        )
    ).toEqual({
        key: 'column',
        type: 'map<string,uniontype<string,int,bigint,float,double,struct<year:int,month:int,day:int>>>',
        children: [
            {
                key: '<key>',
                type: 'string',
            },
            {
                key: '<value>',
                type: 'uniontype<string,int,bigint,float,double,struct<year:int,month:int,day:int>>',
                children: [
                    { key: '<element>', type: 'string' },
                    { key: '<element>', type: 'int' },
                    { key: '<element>', type: 'bigint' },
                    { key: '<element>', type: 'float' },
                    { key: '<element>', type: 'double' },
                    {
                        key: '<element>',
                        type: 'struct<year:int,month:int,day:int>',
                        children: [
                            { key: 'year', type: 'int' },
                            { key: 'month', type: 'int' },
                            { key: 'day', type: 'int' },
                        ],
                    },
                ],
            },
        ],
    });
});

test('prettyPrintType', () => {
    expect(prettyPrintType('map<string,string>')).toEqual(`map<
  string,
  string
>`);

    expect(
        prettyPrintType(
            'struct<ids:array<string>,data:uniontype<int,float,string>>'
        )
    ).toEqual(`struct<
  ids: array<
    string
  >,
  data: uniontype<
    int,
    float,
    string
  >
>`);

    expect(
        prettyPrintType(
            'struct<ids:array<string>,comment:string,data:map<int,int>>'
        )
    ).toEqual(`struct<
  ids: array<
    string
  >,
  comment: string,
  data: map<
    int,
    int
  >
>`);

    expect(
        prettyPrintType(
            'map<struct<ids:array<string>,comment:string,data:map<int,int>>,struct<data:array<string>,event:map<int,int>>>'
        )
    ).toEqual(`map<
  struct<
    ids: array<
      string
    >,
    comment: string,
    data: map<
      int,
      int
    >
  >,
  struct<
    data: array<
      string
    >,
    event: map<
      int,
      int
    >
  >
>`);
});
