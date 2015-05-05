var random = require('..');
var _ = require('lodash');

function range(input, min, max) {
    return input >= min && input <= max;
}

var rEmail = /[\w.]+@\w+\.\w+/,
    rDate = /\d{4}-\d{2}-\d{2}/,
    rTime = /\d{2}:\d{2}:\d{2}/,
    rDatetime = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
    rFloat = /(\d+)\.?(\d+)?/;

describe('mock-random', function() {
    this.timeout(5000);
    it('basic', function() {
        random(1).should.eql(1);

        random(true).should.eql(true);
        random(false).should.eql(false);

        random('').should.eql('');
        random('foo').should.eql('foo');

        random([]).should.eql([]);
        random({}).should.eql({});

        random('@EMAIL').should.not.eql('@EMAIL');
    });

    it('orig array', function() {
        var arr = [{
            foo: 'foo'
        }, {
            bar: 'bar'
        }, {
            foobar: 'foobar'
        }];
        var data = random({
            arr: arr
        });
        data.arr.length.should.eql(3);
        data.arr.should.not.equal(arr);
        for (var i = 0; i < data.arr.length; i++) {
            data.arr[i].should.not.equal(arr[i]);
        }
    });

    it('array', function() {
        var data;

        data = random({
            'list|1': [{}]
        });
        data.list.length.should.eql(1);

        data = random({
            'list|10': [{}]
        });
        data.list.length.should.eql(10);

        data = random({
            'list|5-10': [{}]
        });
        data.list.length.should.above(4);
        data.list.length.should.below(11);
    });

    it('pick', function() {
        function target(name, value) {
            var tpl = {};
            tpl[name] = value;

            var data = random(tpl);
            (typeof data.opt).should.eql(typeof value[0]);
            value.indexOf(data.opt).should.above(-1);
        }

        target('opt|1', [1, 2, 4, 8]);
        target('opt|1', ['GET', 'POST', 'HEAD', 'DELETE']);
    });

    it('range with pick', function() {
        var data = random({
            'list|5-10': [1, 2]
        });
        data.list.length.should.above(4);
        data.list.length.should.below(11);
    });

    it('pick object from array', function() {
        var tpl = {
            'opt|1': [{ // 对备选元素会再次做解析
                method: 'GET'
            }, {
                method: 'POST'
            }, {
                method: 'HEAD'
            }, {
                method: 'DELETE'
            }]
        };
        var data = random(tpl);
        (typeof data.opt).should.eql(typeof tpl['opt|1'][0]);
        for (var i = 0; i < tpl['opt|1'].length; i++) {
            if (data.opt.method === tpl['opt|1'][i].method) {
                return;
            }
        }
        (0).should.be.ok;
    });

    it('distinguish range from pick', function() {
        var data = random({
            'list|1-1': [{}, {}]
        });
        data.list.length.should.eql(1);
    });

    it('pick from object', function() {
        var tpl = {
            'pick1|1': {
                get: '@URL',
                post: '@URL',
                head: '@URL',
                put: '@URL',
                'delete': '@URL'
            }
        };
        tpl['pick2|2'] = tpl['pick1|1'];
        tpl['pick3|3'] = tpl['pick1|1'];
        tpl['pick6|6'] = tpl['pick1|1'];

        var data = random(tpl);
        _.keys(data.pick1).length.should.eql(1);
        _.keys(data.pick2).length.should.eql(2);
        _.keys(data.pick3).length.should.eql(3);
        _.keys(data.pick6).length.should.eql(5);
    });

    it('float', function() {
        function target(tpl, min, max, dmin, dmax) {
            var data, parts, i;
            for (i = 0; i < 1000; i++) {
                data = random(tpl);
                rFloat.lastIndex = 0;
                parts = rFloat.exec('' + data.float); // 可能会自动转为整数，例如 10.0 > 10

                (typeof data.float).should.eql('number');
                (data.float >= min && data.float <= max, JSON.stringify(tpl)).should.be.ok;
                if (parts[2]) {
                    (parts[2].length >= dmin && parts[2].length <= dmax, JSON.stringify(tpl)).should.be.ok;
                }
            }
        }

        target({
            'float|.1-10': 10
        }, 10, 11, 1, 10);

        target({
            'float|.3-10': 123.123
        }, 123, 124, 3, 10);

        target({
            'float|20-100.1-10': 10
        }, 20, 101, 1, 10);

        target({
            'float|99.1-10': 10
        }, 99, 100, 1, 10);

    });

    it('integer', function() {
        function target(tpl, min, max) {
            var data, i;
            for (i = 0; i < 1000; i++) {
                data = random(tpl);
                (typeof data.integer).should.eql('number');
                (data.integer != 1).should.be.ok;
                (data.integer >= min && data.integer <= max).should.be.ok;
            }
        }

        target({
            'integer|2-100': 1
        }, 2, 100);

        target({
            'integer|100-2': 1
        }, 2, 100);

        target({
            'integer|2-2': 1
        }, 2, 2);
    });

    it('string', function() {
        function target(tpl, min, max) {
            var data, i;
            for (i = 0; i < 1000; i++) {
                data = random(tpl);

                (typeof data.string).should.eql('string');
                (data.string.length >= min && data.string.length <= max).should.be.ok;
            }
        }

        target({
            'string|1-10': '★号'
        }, 2, 20);

        target({
            'string|10': '★号'
        }, 20, 20);

    });

    it('boolean', function() {
        var data, count = 0, i;
        for (i = 0; i < 1000; i++) {
            data = random({
                'bool|1': false
            });

            (typeof data.bool === 'boolean').should.be.ok;
            if (data.bool) count++;
        }
        range(count, 300, 700).should.be.ok; // 可能会失败，但是仍在预期范围内，因为结果毕竟是随机的。
    });

    it('function', function() {
        var tpl = {
            prop: 'hello',
            fn: function() {
                return this.prop;
            }
        };
        var data = random(tpl);
        data.fn.should.eql('hello');
    });

    it('disorderly function', function() {
        var tpl = {
            xfn2: function() {
                return this.x * 2;
            },
            x: 1,
            xfn4: function() {
                return this.x * 4;
            }
        };
        var data = random(tpl);
        data.x.should.eql(1);
        data.xfn2.should.eql(2);
        data.xfn4.should.eql(4);
    });

    it('holder', function() {
        rEmail.test(random('@EMAIL')).should.be.ok;
        rDate.test(random('@DATE')).should.be.ok;
        rTime.test(random('@TIME')).should.be.ok;
        rDatetime.test(random('@DATETIME')).should.be.ok;
    });

    it('complex', function() {
        var tpl = {
            'list|1-5': [{
                'id|+1': 1,
                'grade|1-100': 1,
                'float|1-100.1-10': 1,
                'star|1-5': '★',
                'published|1': false,
                'email': '@EMAIL',
                'date': '@DATE(HH:mm:ss)', // 属性 date 与 time 的格式互换
                'time': '@TIME(yyyy-MM-dd)',
                'datetime': '@DATETIME'
            }]
        };

        function validator(list) {
            var i, item, parts;
            (list.length >= 1 && list.length <= 5).should.be.ok;
            for (i = 0; i < list.length; i++) {
                item = list[i];

                (typeof item.id).should.eql('number');
                if (i > 0) item.id.should.eql(list[i - 1].id + 1);

                (typeof item.grade).should.eql('number');
                range(item.grade, 1, 100).should.be.ok;

                (typeof item.float).should.eql('number');
                range(item.float, 1, 101).should.be.ok;

                rFloat.lastIndex = 0;
                parts = rFloat.exec('' + item.float); // 可能会自动转为整数，例如 10.0 > 10
                if (parts[2]) {
                    (parts[2].length >= 1 && parts[2].length <= 10).should.be.ok;
                }

                range(item.star.length, 1, 5).should.be.ok;

                (typeof item.published).should.be.eql('boolean');

                rEmail.test(item.email).should.be.ok;
                rTime.test(item.date).should.be.ok;
                rDate.test(item.time).should.be.ok;
                rDatetime.test(item.datetime).should.be.ok;
            }
        }

        function target(tpl) {
            var list = random(tpl).list;
            validator(list);
        }

        for (var i = 0; i < 1000; i++) {
            target(tpl);
        }
    });

    it('escape', function() {
        var tpl;

        tpl = '\\@EMAIL';
        random(tpl).should.eql(tpl);

        tpl = '\\\\@EMAIL'; // TODO 如果有多个转义斜杠怎么办？只有奇数个转义斜杠，才会被认为是要转义 @
        random(tpl).should.eql(tpl);
    });

    it('reference', function() {
        var tpl = {
            name: '@first @last',
            first: 'fffffirst',
            last: 'lllllast'
        };
        var data = random(tpl);
        data.name.should.eql('fffffirst lllllast');
    });

    it('key order', function() {
        var tpl = {
            fn: function() {},
            first: '',
            second: '',
            third: ''
        };
        var data = random(tpl);
        var keys = _.keys(data);
        keys[0].should.eql('first');
        keys[1].should.eql('second');
        keys[2].should.eql('third');
        keys[3].should.eql('fn');
    });

    it('negative number', function() {
        var data;

        data = random({
            'number|-10--5': 1
        });
        range(data.number, -10, -5).should.be.ok;

        data = random({
            'number|-5--10': 1
        });
        range(data.number, -10, -5).should.be.ok;
    });
});
