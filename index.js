var sax = require('sax');
var select = require('./lib/select');

module.exports = function (opts) {
    if (!opts) opts = {};
    if (!opts.special) opts.special = [ 'input', 'img', 'br', 'hr' ];
    
    var parser = sax.parser(false);
    var stream = select(parser, opts);
    
    function write (buf) {
        stream.emit('data', buf);
    }
    
    var buffered = '';
    var pos = 0;
    var update = function (type, tag) {
        if (type === 'text') {
            var len = parser.startTagPosition - pos - 1;
        }
        else {
            var len = parser.position - parser.startTagPosition + 1;
        }
        pos = parser.position;
        
        var src = buffered.slice(0, len);
        buffered = buffered.slice(len);
        
        stream.raw(src);
        return src;
    };
    
    stream.write = function (buf) {
        var s = buf.toString();
        buffered += s;
        parser.write(buf.toString());
    };
    
    stream.end = function (buf) {
        if (buf !== undefined) stream.write(buf);
        
        if (pos < parser.position) {
            var s = buffered.slice(0, parser.position - pos);
            stream.raw(s);
        }
        stream.emit('end');
    };
    
    parser.onopentag = function (tag) {
        stream.pre('open', tag);
        update('open', tag);
        stream.post('open', tag);
    };
    
    parser.onclosetag = function (name) {
        stream.pre('close', name);
        update('close');
        stream.post('close', name);
    };
    
    parser.ontext = function (text) {
        stream.pre('text', text);
        update('text');
        stream.post('text', text);
    };
    
    return stream;
};
