import { parseType } from 'lib/utils/complex-types';

test('parseType', () => {
    expect(
        parseType(
            'struct<date:struct<year:int,month:int,day:int>,hour:int,minute:int,second:int,timeZoneId:string>'
        )
    ).toEqual({
        date: {
            year: 'int',
            month: 'int',
            day: 'int',
        },
        hour: 'int',
        minute: 'int',
        second: 'int',
        timeZoneId: 'string',
    });

    expect(
        parseType(
            'array<struct<size:struct<width:int,height:int,isAspectRatio:boolean>>>'
        )
    ).toEqual([
        {
            size: {
                width: 'int',
                height: 'int',
                isAspectRatio: 'boolean',
            },
        },
    ]);

    expect(
        parseType(
            'struct<purchasePath:string,resultToken:string,sessionId:string,site:struct<eapid:bigint,tpid:bigint>,tests:array<struct<bucketValue:string,experimentId:string,instanceId:string>>,user:struct<guid:string,tuid:string>>'
        )
    ).toEqual({
        purchasePath: 'string',
        resultToken: 'string',
        sessionId: 'string',
        site: {
            eapid: 'bigint',
            tpid: 'bigint',
        },
        tests: [
            {
                bucketValue: 'string',
                experimentId: 'string',
                instanceId: 'string',
            },
        ],
        user: {
            guid: 'string',
            tuid: 'string',
        },
    });

    expect(parseType('map<string,string>')).toEqual({
        key: 'string',
        value: 'string',
    });

    expect(
        parseType(
            'map<string,uniontype<string,int,bigint,float,double,struct<year:int,month:int,day:int>>>'
        )
    ).toEqual({
        key: 'string',
        value: [
            'string',
            'int',
            'bigint',
            'float',
            'double',
            { year: 'int', month: 'int', day: 'int' },
        ],
    });
});
